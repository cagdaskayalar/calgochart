import React, { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { extent as d3Extent, min, max } from "d3-array";
import { head, last, isDefined, isNotDefined, clearCanvas, shallowEqual, identity, noop, functor, getLogger } from "./utils";
import { mouseBasedZoomAnchor, lastVisibleItemBasedZoomAnchor, rightDomainBasedZoomAnchor } from "./utils/zoomBehavior";
import { getNewChartConfig, getChartConfigWithUpdatedYScales, getCurrentCharts, getCurrentItem } from "./utils/ChartDataUtil";
import CanvasContainer from "./CanvasContainer";
import EventCapture from "./EventCapture";
import evaluator from "./scale/evaluator";

const log = getLogger("ChartCanvas");

// Create Contexts for ChartCanvas (global) and Chart (per chart) 
export const ChartCanvasContext = React.createContext(null);
export const ChartContext = React.createContext(null);

// Constants and helper functions
const CANDIDATES_FOR_RESET = ["seriesName", "data", "xAccessor"];
function shouldResetChart(prevProps, nextProps) {
  // Returns true if any of the candidate props are not shallow-equal
  return !CANDIDATES_FOR_RESET.every(key => shallowEqual(prevProps[key], nextProps[key]));
}
function getCursorStyle() {
  // Returns a JSX <style> element containing custom cursor CSS classes
  const tooltipStyle = `
    .calgo-stockcharts-grabbing-cursor { cursor: grabbing; cursor: -moz-grabbing; cursor: -webkit-grabbing; }
    .calgo-stockcharts-crosshair-cursor { cursor: crosshair; }
    .calgo-stockcharts-tooltip-hover { cursor: pointer; }
    .calgo-stockcharts-avoid-interaction { pointer-events: none; }
    .calgo-stockcharts-enable-interaction { pointer-events: all; }
    .calgo-stockcharts-tooltip { cursor: pointer; }
    .calgo-stockcharts-default-cursor { cursor: default; }
    .calgo-stockcharts-move-cursor { cursor: move; }
    .calgo-stockcharts-pointer-cursor { cursor: pointer; }
    .calgo-stockcharts-ns-resize-cursor { cursor: ns-resize; }
    .calgo-stockcharts-ew-resize-cursor { cursor: ew-resize; }
  `;
  return <style>{tooltipStyle}</style>;
}
function getDimensions(props) {
  // Calculate inner dimensions (chart drawing area) from props.width/height and margins
  return {
    height: props.height - props.margin.top - props.margin.bottom,
    width: props.width - props.margin.left - props.margin.right
  };
}
function getXScaleDirection(flipXScale) {
  return flipXScale ? -1 : 1;
}
function calculateFullData(props) {
  const { data: fullData, plotFull, xScale, clamp, pointsPerPxThreshold, flipXScale } = props;
  const { xAccessor, displayXAccessor, minPointsPerPxThreshold } = props;
  const useWholeData = isDefined(plotFull) ? plotFull : xAccessor === identity;
  // evaluator returns a filterData function for slicing data to visible domain
  const { filterData } = evaluator({ xScale, useWholeData, clamp, pointsPerPxThreshold, minPointsPerPxThreshold, flipXScale });
  return {
    xAccessor,
    displayXAccessor: displayXAccessor || xAccessor,
    xScale: xScale.copy(),  // copy scale to avoid mutating original
    fullData,
    filterData
  };
}
function calculateState(props) {
  const { xAccessor: inputXAccessor, xExtents: xExtentsProp, data, padding, flipXScale } = props;
  // Sanity check: data must be sorted by xAccessor
  if (process.env.NODE_ENV !== "production" && isDefined(props.xScale.invert)) {
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      if (inputXAccessor(prev) > inputXAccessor(curr)) {
        throw new Error("'data' is not sorted on 'xAccessor', please provide data sorted in ascending order by xAccessor");
      }
    }
  }
  const direction = getXScaleDirection(flipXScale);
  const dimensions = getDimensions(props);
  // Determine domain from xExtents (array or function)
  const extent = typeof xExtentsProp === "function"
    ? xExtentsProp(data)
    : d3Extent(xExtentsProp.map(d => functor(d)).map(each => each(data, inputXAccessor)));
  // Calculate initial full data and filter
  const { xAccessor, displayXAccessor, xScale, fullData, filterData } = calculateFullData(props);
  // Set the scale's range based on dimensions and padding
  const updatedXScale = setXRange(xScale, dimensions, padding, direction);
  // Filter the full data to the domain defined by extent
  const { plotData, domain } = filterData(fullData, extent, inputXAccessor, updatedXScale);
  if (process.env.NODE_ENV !== "production" && plotData.length <= 1) {
    throw new Error(`Showing ${plotData.length} datapoints, consider adjusting the 'xExtents' prop of ChartCanvas`);
  }
  // Set final domain on xScale and return computed state
  return {
    xScale: updatedXScale.domain(domain),
    xAccessor,
    displayXAccessor,
    fullData,
    plotData,
    filterData
  };
}
function resetChart(props, firstCalculation = false) {
  if (process.env.NODE_ENV !== "production") {
    if (!firstCalculation) log("CHART RESET");
  }
  const state = calculateState(props);
  const { xAccessor, displayXAccessor, fullData } = state;
  const { plotData: initialPlotData, xScale } = state;
  const { postCalculator, children } = props;
  const plotData = postCalculator(initialPlotData);
  const dimensions = getDimensions(props);
  // Generate chart configurations (e.g. each <Chart> area) and update their y-scales
  const chartConfig = getChartConfigWithUpdatedYScales(
    getNewChartConfig(dimensions, children),
    { plotData, xAccessor, displayXAccessor, fullData },
    xScale.domain()
  );
  return { ...state, xScale, plotData, chartConfig };
}
function updateChart(newState, initialXScale, props, lastItemWasVisible, initialChartConfig) {
  const { fullData, xScale, xAccessor, displayXAccessor, filterData } = newState;
  const lastItem = last(fullData);
  const [start, end] = initialXScale.domain();
  if (process.env.NODE_ENV !== "production") {
    log("TRIVIAL CHANGE");
  }
  const { postCalculator, children, padding, flipXScale, maintainPointsPerPixelOnResize } = props;
  const direction = getXScaleDirection(flipXScale);
  const dimensions = getDimensions(props);
  // Set new range on copied xScale
  const updatedXScale = setXRange(xScale, dimensions, padding, direction);
  let initialPlotData;
  if (!lastItemWasVisible || end >= xAccessor(lastItem)) {
    // If not scrolled to end or resizing: keep the same domain start
    const [rangeStart, rangeEnd] = initialXScale.range();
    const [newRangeStart, newRangeEnd] = updatedXScale.range();
    const newDomainExtent = ((newRangeEnd - newRangeStart) / (rangeEnd - rangeStart)) * (end - start);
    const newStart = maintainPointsPerPixelOnResize ? end - newDomainExtent : start;
    const lastItemX = initialXScale(xAccessor(lastItem));
    const response = filterData(fullData, [newStart, end], xAccessor, updatedXScale, { fallbackStart: start, fallbackEnd: { lastItem, lastItemX } });
    initialPlotData = response.plotData;
    updatedXScale.domain(response.domain);
  } else if (lastItemWasVisible && end < xAccessor(lastItem)) {
    // If new data added while at end: pan forward to include new item
    const dx = initialXScale(xAccessor(lastItem)) - initialXScale.range()[1];
    const [newStart, newEnd] = initialXScale.range().map(x => x + dx).map(initialXScale.invert);
    const response = filterData(fullData, [newStart, newEnd], xAccessor, updatedXScale);
    initialPlotData = response.plotData;
    updatedXScale.domain(response.domain);
  }
  const plotData = postCalculator(initialPlotData);
  // Update all charts' yScales for the new plotData
  const chartConfig = getChartConfigWithUpdatedYScales(
    getNewChartConfig(dimensions, children, initialChartConfig),
    { plotData, xAccessor, displayXAccessor, fullData },
    updatedXScale.domain()
  );
  return { xScale: updatedXScale, xAccessor, chartConfig, plotData, fullData, filterData };
}
function setXRange(xScale, dimensions, padding, direction = 1) {
  // Adjust the xScale range according to chart dimensions and padding
  if (xScale.rangeRoundPoints) {
    if (isNaN(padding)) throw new Error("padding must be a number for ordinal scale");
    xScale.rangeRoundPoints([0, dimensions.width], padding);
  } else if (xScale.padding) {
    if (isNaN(padding)) throw new Error("padding must be a number for ordinal scale");
    xScale.range([0, dimensions.width]);
    xScale.padding(padding / 2);
  } else {
    const { left, right } = isNaN(padding) ? padding : { left: padding, right: padding };
    if (direction > 0) {
      xScale.range([left, dimensions.width - right]);
    } else {
      xScale.range([dimensions.width - right, left]);
    }
  }
  return xScale;
}

/** 
 * ChartCanvas is the main container component for charts. It handles state management,
 * interactions (zoom, pan, etc.), and provides context to Chart and chart components.
 */
function ChartCanvas(props) {
  const {
    width, height, margin, ratio, type,
    pointsPerPxThreshold, minPointsPerPxThreshold, className,
    zIndex, xExtents, postCalculator, padding,
    xAccessor: propsXAccessor, displayXAccessor: propsDisplayXAccessor,
    onLoadMore, onSelect,
    mouseMoveEvent, panEvent, zoomEvent,
    zoomMultiplier, zoomAnchor,
    useCrossHairStyleCursor, defaultFocus,
    disableInteraction
  } = props;

  // Initialize chart state using resetChart for initial props
  const initialState = useMemo(() => resetChart(props, true), []); 
  const fullDataRef = useRef(initialState.fullData);
  const [plotData, setPlotData] = useState(initialState.plotData);
  const [xScale, setXScale] = useState(initialState.xScale);
  const [chartConfig, setChartConfig] = useState(initialState.chartConfig);
  const [xAccessor, setXAccessor] = useState(initialState.xAccessor);
  const [displayXAccessor, setDisplayXAccessor] = useState(initialState.displayXAccessor);
  const [filterDataFn, setFilterDataFn] = useState(initialState.filterData);

  // Refs for mutable values that do not trigger re-render
  const canvasContainerRef = useRef(null);
  const eventCaptureRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const lastSubscriptionIdRef = useRef(0);
  const mutableStateRef = useRef({});  // holds mutable state (mouse positions, etc.)
  const panInProgressRef = useRef(false);
  const prevMouseXYRef = useRef(null);
  const waitingForPanRef = useRef(false);
  const waitingForMouseMoveRef = useRef(false);
  const waitingForPinchZoomRef = useRef(false);
  const finalPinchRef = useRef(null);
  const hackyWayPanDataRef = useRef(null);
  const hackyWayPanDomainRef = useRef(null);

  // Context provider value (will update on each render with latest state & functions)
  const contextValue = useMemo(() => {
    return {
      width: getDimensions(props).width,
      height: getDimensions(props).height,
      chartCanvasType: type,
      margin: margin,
      ratio: ratio,
      plotData: plotData,
      fullData: fullDataRef.current,
      chartConfig: chartConfig,
      xScale: xScale,
      xAccessor: xAccessor,
      displayXAccessor: displayXAccessor,
      // Methods provided to context:
      getCanvasContexts: () => canvasContainerRef.current?.getCanvasContexts(),
      subscribe: (id, rest) => {
        subscriptionsRef.current = subscriptionsRef.current.concat({ id, ...rest, getPanConditions: rest.getPanConditions || functor({ draggable: false, panEnabled: true }) });
      },
      unsubscribe: id => {
        subscriptionsRef.current = subscriptionsRef.current.filter(each => each.id !== id);
      },
      generateSubscriptionId: () => {
        lastSubscriptionIdRef.current += 1;
        return lastSubscriptionIdRef.current;
      },
      xAxisZoom: newDomain => {
        // Zoom by setting a new domain on xScale (x-axis zoom)
        const { xScale: newXScale, plotData: newPlotData, chartConfig: newChartConfig } = calculateStateForDomain(newDomain);
        clearThreeCanvas(); 
        const firstItem = head(fullDataRef.current);
        const start = head(newXScale.domain());
        const end = xAccessor(firstItem);
        setXScale(newXScale);
        setPlotData(newPlotData);
        setChartConfig(newChartConfig);
        // If we have scrolled past beginning of data, trigger onLoadMore
        if (start < end) {
          onLoadMore(start, end);
        }
      },
      yAxisZoom: (chartId, newDomain) => {
        // Zoom the y-axis of a specific chart
        clearThreeCanvas();
        const newChartConfig = chartConfig.map(cfg => {
          if (cfg.id === chartId) {
            return { ...cfg, yScale: cfg.yScale.copy().domain(newDomain), yPanEnabled: true };
          }
          return cfg;
        });
        setChartConfig(newChartConfig);
      },
      amIOnTop: id => {
        // Check if the given subscription (by id) is the topmost draggable component
        const draggableComponents = subscriptionsRef.current.filter(each => each.getPanConditions().draggable);
        return draggableComponents.length > 0 && last(draggableComponents).id === id;
      },
      redraw: () => {
        // Clear all three canvases and force redraw of all canvas components
        clearThreeCanvas();
        draw({ force: true });
      },
      setCursorClass: className => {
        if (eventCaptureRef.current) {
          eventCaptureRef.current.setCursorClass(className);
        }
      },
      getMutableState: () => mutableStateRef.current
    };
  }, [type, margin, ratio, plotData, chartConfig, xScale, xAccessor, displayXAccessor, onLoadMore]);

  // Helper to recalculate chart state for a given new x-domain (used in zoom/pan)
  const calculateStateForDomain = newDomain => {
    const { xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor, xScale: initialXScale, chartConfig: initialChartConfig, plotData: initialPlotData } = { xAccessor, displayXAccessor, xScale, chartConfig, plotData };
    const { filterData } = { filterData: filterDataFn };
    const fullData = fullDataRef.current;
    const before = filterData(fullData, newDomain, currentXAccessor, initialXScale, { currentPlotData: initialPlotData, currentDomain: initialXScale.domain() });
    const plotData = postCalculator(before.plotData);
    const updatedScale = initialXScale.copy().domain(before.domain);
    const newChartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData, xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor, fullData }, updatedScale.domain());
    return { xScale: updatedScale, plotData, chartConfig: newChartConfig };
  };

  // Canvas clearing helpers
  const clearMouseCanvas = () => {
    const canvases = canvasContainerRef.current?.getCanvasContexts();
    if (canvases && canvases.mouseCoord) {
      clearCanvas([canvases.mouseCoord], ratio);
    }
  };
  const clearBothCanvas = () => {
    const canvases = canvasContainerRef.current?.getCanvasContexts();
    if (canvases && canvases.axes) {
      clearCanvas([canvases.axes, canvases.mouseCoord], ratio);
    }
  };
  const clearThreeCanvas = () => {
    const canvases = canvasContainerRef.current?.getCanvasContexts();
    if (canvases && canvases.axes) {
      clearCanvas([canvases.axes, canvases.mouseCoord, canvases.bg], ratio);
    }
  };

  // Main draw function called to draw all subscribed components (for canvas rendering)
  const draw = ({ trigger, force } = { force: false }) => {
    const eventType = trigger ? ({"mouseleave": "mousemove", "panend": "pan", "pinchzoom": "pan", "mousedown": "mousemove", "click": "mousemove", "contextmenu": "mousemove", "dblclick": "mousemove", "dragstart": "drag", "dragend": "drag", "dragcancel": "drag"}[trigger] || trigger) : trigger;
    // Iterate through all subscribers and invoke their draw callback if appropriate
    subscriptionsRef.current.forEach(sub => {
      if (isDefined(sub.draw)) {
        const proceed = sub.rest && Array.isArray(sub.rest.drawOn)
          ? sub.rest.drawOn.indexOf(eventType) > -1
          : true;
        if (proceed || sub.rest?.selected || force) {
          sub.draw({ trigger, force });
        }
      }
    });
  };

  // Event handling functions (trigger events and manage state)
  const triggerEvent = (type, props = {}, e) => {
    // For each subscriber, call its listener with event type, moreProps, global state, and original event
    subscriptionsRef.current.forEach(sub => {
      const state = { ...contextValue, fullData: fullDataRef.current, subscriptions: subscriptionsRef.current };
      sub.listener(type, props, state, e);
    });
  };

  const handleMouseEnter = e => {
    triggerEvent("mouseenter", { show: true }, e);
  };

  const handleMouseLeave = e => {
    triggerEvent("mouseleave", { show: false }, e);
    clearMouseCanvas();
    draw({ trigger: "mouseleave" });
  };

  const handleMouseMove = (mouseXY, inputType, e) => {
    if (!waitingForMouseMoveRef.current) {
      waitingForMouseMoveRef.current = true;
      const currentCharts = getCurrentCharts(chartConfig, mouseXY);
      const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
      triggerEvent("mousemove", { show: true, mouseXY, prevMouseXY: prevMouseXYRef.current, currentItem, currentCharts }, e);
      prevMouseXYRef.current = mouseXY;
      mutableStateRef.current = { mouseXY, currentItem, currentCharts };
      requestAnimationFrame(() => {
        clearMouseCanvas();
        draw({ trigger: "mousemove" });
        waitingForMouseMoveRef.current = false;
      });
    }
  };

  const handleMouseDown = (mouseXY, currentCharts, e) => {
    triggerEvent("mousedown", mutableStateRef.current, e);
  };

  const handleClick = (mouseXY, e) => {
    triggerEvent("click", mutableStateRef.current, e);
    requestAnimationFrame(() => {
      clearMouseCanvas();
      draw({ trigger: "click" });
    });
  };

  const handleDoubleClick = (mouseXY, e) => {
    triggerEvent("dblclick", {}, e);
  };

  const handleContextMenu = (mouseXY, e) => {
    const currentCharts = getCurrentCharts(chartConfig, mouseXY);
    const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
    triggerEvent("contextmenu", { mouseXY, currentItem, currentCharts }, e);
  };

  const handleDragStart = ({ startPos }, e) => {
    triggerEvent("dragstart", { startPos }, e);
  };

  const handleDrag = ({ startPos, mouseXY }, e) => {
    const currentCharts = getCurrentCharts(chartConfig, mouseXY);
    const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
    triggerEvent("drag", { startPos, mouseXY, currentItem, currentCharts }, e);
    mutableStateRef.current = { mouseXY, currentItem, currentCharts };
    requestAnimationFrame(() => {
      clearMouseCanvas();
      draw({ trigger: "drag" });
    });
  };

  const handleDragEnd = ({ mouseXY }, e) => {
    triggerEvent("dragend", { mouseXY }, e);
    requestAnimationFrame(() => {
      clearMouseCanvas();
      draw({ trigger: "dragend" });
    });
  };

  const panHelper = (mouseXY, initialXScale, dxdy, chartsToPan) => {
    const { dx, dy } = dxdy;
    const { xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor, chartConfig: initialChartConfig } = { xAccessor, displayXAccessor, chartConfig };
    const fullData = fullDataRef.current;
    const { filterData } = { filterData: filterDataFn };
    if (isNotDefined(initialXScale.invert)) {
      throw new Error("xScale does not support invert(), likely an ordinal scale – pan/zoom is not available");
    }
    const newDomain = initialXScale.range().map(x => x - dx).map(initialXScale.invert);
    const before = filterData(fullData, newDomain, currentXAccessor, initialXScale, {
      currentPlotData: hackyWayPanDataRef.current,
      currentDomain: hackyWayPanDomainRef.current
    });
    const updatedScale = initialXScale.copy().domain(before.domain);
    const plotData = postCalculator(before.plotData);
    const currentItem = getCurrentItem(updatedScale, currentXAccessor, mouseXY, plotData);
    const newChartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData, xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor, fullData }, updatedScale.domain(), dy, chartsToPan);
    const currentCharts = getCurrentCharts(newChartConfig, mouseXY);
    return { xScale: updatedScale, plotData, chartConfig: newChartConfig, mouseXY, currentCharts, currentItem };
  };

  const handlePan = (mouseXY, panStartXScale, dxdy, chartsToPan, e) => {
    if (!waitingForPanRef.current) {
      waitingForPanRef.current = true;
      // Preserve starting data and domain to avoid panning beyond bounds
      hackyWayPanDataRef.current = hackyWayPanDataRef.current || plotData;
      hackyWayPanDomainRef.current = hackyWayPanDomainRef.current || xScale.domain();
      const newState = panHelper(mouseXY, panStartXScale, dxdy, chartsToPan);
      hackyWayPanDataRef.current = newState.plotData;
      hackyWayPanDomainRef.current = newState.xScale.domain();
      panInProgressRef.current = true;
      triggerEvent("pan", newState, e);
      mutableStateRef.current = { mouseXY: newState.mouseXY, currentItem: newState.currentItem, currentCharts: newState.currentCharts };
      requestAnimationFrame(() => {
        waitingForPanRef.current = false;
        clearBothCanvas();
        draw({ trigger: "pan" });
      });
    }
  };

  const handlePanEnd = (mouseXY, panStartXScale, panOrigin, chartsToPan, e) => {
    const newState = panHelper(mouseXY, panStartXScale, { dx: 0, dy: 0 }, chartsToPan);
    hackyWayPanDataRef.current = null;
    hackyWayPanDomainRef.current = null;
    panInProgressRef.current = false;
    triggerEvent("panend", newState, e);
    requestAnimationFrame(() => {
      const firstItem = head(fullDataRef.current);
      const start = head(newState.xScale.domain());
      const end = xAccessor(firstItem);
      clearThreeCanvas();
      setXScale(newState.xScale);
      setPlotData(newState.plotData);
      setChartConfig(newState.chartConfig);
      // If we panned to past beginning, call onLoadMore to load older data
      if (start < end) {
        onLoadMore(start, end);
      }
    });
  };

  const pinchZoomHelper = (initialPinch, finalPinch) => {
    const { xScale: initialPinchXScale } = initialPinch;
    const { xScale: initialXScale, chartConfig: initialChartConfig, plotData: initialPlotData, xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor } = { xScale, chartConfig, plotData, xAccessor, displayXAccessor };
    const fullData = fullDataRef.current;
    const { filterData } = { filterData: filterDataFn };
    const { topLeft: iTL, bottomRight: iBR } = initialPinch;
    const { topLeft: fTL, bottomRight: fBR } = finalPinch;
    const e = initialPinchXScale.range()[1];
    // Calculate new domain based on pinch zoom rectangle geometry
    const xDash = Math.round(-(iBR[0] * fTL[0] - iTL[0] * fBR[0]) / (iTL[0] - iBR[0]));
    const yDash = Math.round(e + ((e - iBR[0]) * (e - fTL[0]) - (e - iTL[0]) * (e - fBR[0])) / ((e - iTL[0]) - (e - iBR[0])));
    const x = Math.round(-xDash * iTL[0] / (-xDash + fTL[0]));
    const y = Math.round(e - (yDash - e) * (e - iTL[0]) / (yDash + (e - fTL[0])));
    const newDomain = [x, y].map(initialPinchXScale.invert);
    const before = filterData(fullData, newDomain, currentXAccessor, initialPinchXScale, { currentPlotData: initialPlotData, currentDomain: initialXScale.domain() });
    const plotData = postCalculator(before.plotData);
    const updatedScale = initialXScale.copy().domain(before.domain);
    const mouseXY = finalPinch.touch1Pos;
    const newChartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData, xAccessor: currentXAccessor, displayXAccessor: currentDisplayXAccessor, fullData }, updatedScale.domain());
    const currentItem = getCurrentItem(updatedScale, currentXAccessor, mouseXY, plotData);
    return { chartConfig: newChartConfig, xScale: updatedScale, plotData, mouseXY, currentItem };
  };

  const handlePinchZoom = (initialPinch, finalPinch, e) => {
    if (!waitingForPinchZoomRef.current) {
      waitingForPinchZoomRef.current = true;
      const state = pinchZoomHelper(initialPinch, finalPinch);
      triggerEvent("pinchzoom", state, e);
      finalPinchRef.current = finalPinch;
      requestAnimationFrame(() => {
        clearBothCanvas();
        draw({ trigger: "pinchzoom" });
        waitingForPinchZoomRef.current = false;
      });
    }
  };

  const handlePinchZoomEnd = (initialPinch, e) => {
    if (finalPinchRef.current) {
      const state = pinchZoomHelper(initialPinch, finalPinchRef.current);
      const { xScale: newXScale } = state;
      triggerEvent("pinchzoom", state, e);
      finalPinchRef.current = null;
      clearThreeCanvas();
      const firstItem = head(fullDataRef.current);
      const start = head(newXScale.domain());
      const end = xAccessor(firstItem);
      setXScale(state.xScale);
      setPlotData(state.plotData);
      setChartConfig(state.chartConfig);
      // If zoomed out beyond start, attempt to load more data
      if (start < end) {
        onLoadMore(start, end);
      }
    }
  };

  const handleZoom = (zoomDirection, mouseXY, e) => {
    if (panInProgressRef.current) return;
    const item = zoomAnchor({ xScale, xAccessor, mouseXY, plotData, fullData: fullDataRef.current });
    const cx = xScale(item);
    const c = zoomDirection > 0 ? 1 * zoomMultiplier : 1 / zoomMultiplier;
    const newDomain = xScale.range().map(x => cx + (x - cx) * c).map(xScale.invert);
    const { xScale: newXScale, plotData: newPlotData, chartConfig: newChartConfig } = calculateStateForDomain(newDomain);
    const currentItem = getCurrentItem(newXScale, xAccessor, mouseXY, newPlotData);
    const currentCharts = getCurrentCharts(newChartConfig, mouseXY);
    clearThreeCanvas();
    const firstItem = head(fullDataRef.current);
    const start = head(newXScale.domain());
    const end = xAccessor(firstItem);
    mutableStateRef.current = { mouseXY, currentItem, currentCharts };
    triggerEvent("zoom", { xScale: newXScale, plotData: newPlotData, chartConfig: newChartConfig, mouseXY, currentCharts, currentItem, show: true }, e);
    setXScale(newXScale);
    setPlotData(newPlotData);
    setChartConfig(newChartConfig);
    // If zoomed out past the beginning, load more data
    if (start < end) {
      onLoadMore(start, end);
    }
  };

  const resetYDomain = chartId => {
    // Reset the Y domain of one or all charts to their original (realYDomain) 
    const newChartConfig = chartConfig.map(cfg => {
      if ((isNotDefined(chartId) || cfg.id === chartId) && !shallowEqual(cfg.yScale.domain(), cfg.realYDomain)) {
        return { ...cfg, yScale: cfg.yScale.domain(cfg.realYDomain), yPanEnabled: false };
      }
      return cfg;
    });
    // Only update if any domain actually changed
    const changed = newChartConfig.some((cfg, idx) => cfg !== chartConfig[idx]);
    if (changed) {
      clearThreeCanvas();
      setChartConfig(newChartConfig);
    }
  };

  // Effect: handle prop changes (data, width, etc.) similar to componentWillReceiveProps
  useEffect(() => {
    // Determine if chart needs to reset or just update
    const reset = shouldResetChart(props, prevPropsRef.current || {});
    const interactionEnabled = !isNaN(xScale(xAccessor(head(plotData)))) && isDefined(xScale.invert);
    let newState;
    if (!interactionEnabled || reset || !shallowEqual(prevPropsRef.current?.xExtents, props.xExtents)) {
      if (process.env.NODE_ENV !== "production") {
        if (!interactionEnabled) log("RESET CHART (switch to non-interactive chart)");
        else if (reset) log("RESET CHART (one or more core props changed)", CANDIDATES_FOR_RESET);
        else log("xExtents changed, resetting chart");
      }
      newState = resetChart(props);
      mutableStateRef.current = {};
    } else {
      // Minor change (e.g. width/height) – update chart state without full reset
      const [prevStart, prevEnd] = xScale.domain();
      const prevLastItem = last(fullDataRef.current);
      const calculated = calculateFullData(props);
      const { xAccessor: calcXAccessor } = calculated;
      const lastItemWasVisible = calcXAccessor(prevLastItem) <= prevEnd && calcXAccessor(prevLastItem) >= prevStart;
      if (process.env.NODE_ENV !== "production") {
        if (prevPropsRef.current?.data !== props.data) {
          log("data changed but seriesName did not; if you want to reset chart, change the seriesName.");
          log("Last item was visible:", lastItemWasVisible);
        } else {
          log("Trivial prop change (e.g., dimensions or type), updating without resetting");
        }
      }
      newState = updateChart(calculated, xScale, props, lastItemWasVisible, chartConfig);
    }
    const { fullData, plotData: newPlotData, xScale: newXScale, chartConfig: newChartConfig, xAccessor: newXAccessor, displayXAccessor: newDisplayXAccessor, filterData: newFilterData } = newState;
    if (!panInProgressRef.current) {
      clearThreeCanvas();
      setXScale(newXScale);
      setPlotData(newPlotData);
      setChartConfig(newChartConfig);
      setXAccessor(newXAccessor);
      setDisplayXAccessor(newDisplayXAccessor);
      setFilterDataFn(newFilterData);
    } else {
      if (process.env.NODE_ENV !== "production") {
        log("Pan is in progress - skipping state update.");
      }
    }
    fullDataRef.current = fullData;
    prevPropsRef.current = props;
  }, [props]);

  // Track previous props for comparison in useEffect
  const prevPropsRef = useRef();
  useEffect(() => { prevPropsRef.current = props; });

  // Render component
  const cursor = useCrossHairStyleCursor && !disableInteraction && isDefined(xScale.invert) ? getCursorStyle() : null;
  return (
    <ChartCanvasContext.Provider value={contextValue}>
      <div 
        style={{ position: "relative", width: width, height: height }} 
        className={className} 
        tabIndex={defaultFocus ? 0 : -1}
      >
        {/* Inject dynamic cursor style classes if applicable */}
        {cursor}
        {/* Canvas layers container */}
        <CanvasContainer 
          ref={canvasContainerRef}
          type={type || "hybrid"} 
          ratio={ratio} 
          width={width} 
          height={height} 
          zIndex={zIndex}
        />
        {/* Render Chart components (children) */}
        {props.children}
        {/* Event capture layer for handling mouse/touch events */}
        <EventCapture
          ref={eventCaptureRef}
          useCrossHairStyleCursor={useCrossHairStyleCursor}
          mouseMove={mouseMoveEvent && !disableInteraction}
          zoom={zoomEvent && !disableInteraction}
          pan={panEvent && !disableInteraction}
          panSpeedMultiplier={1}
          focus={defaultFocus}
          disableInteraction={disableInteraction}
          width={width}
          height={height}
          chartConfig={chartConfig}
          xScale={xScale}
          xAccessor={xAccessor}
          getAllPanConditions={() => subscriptionsRef.current.map(sub => sub.getPanConditions()).reduce((ret, cond) => ({
            draggable: ret.draggable || cond.draggable,
            panEnabled: ret.panEnabled && cond.panEnabled
          }), { draggable: false, panEnabled: panEvent && !disableInteraction }) }
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onZoom={handleZoom}
          onPinchZoom={handlePinchZoom}
          onPinchZoomEnd={handlePinchZoomEnd}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragComplete={handleDragEnd}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
        />
      </div>
    </ChartCanvasContext.Provider>
  );
}

ChartCanvas.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  margin: PropTypes.object,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]),
  pointsPerPxThreshold: PropTypes.number,
  minPointsPerPxThreshold: PropTypes.number,
  data: PropTypes.array.isRequired,
  xAccessor: PropTypes.func,
  xExtents: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  zoomAnchor: PropTypes.func,
  className: PropTypes.string,
  seriesName: PropTypes.string.isRequired,
  zIndex: PropTypes.number,
  children: PropTypes.node.isRequired,
  xScale: PropTypes.func.isRequired,
  postCalculator: PropTypes.func,
  flipXScale: PropTypes.bool,
  useCrossHairStyleCursor: PropTypes.bool,
  padding: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({ left: PropTypes.number, right: PropTypes.number })
  ]),
  defaultFocus: PropTypes.bool,
  zoomMultiplier: PropTypes.number,
  onLoadMore: PropTypes.func,
  displayXAccessor: function(props, propName) {
    if (isNotDefined(props[propName])) {
      console.warn("`displayXAccessor` is not defined, using `xAccessor` as fallback. If using a discontinuous scale, provide a `displayXAccessor`.");
    } else if (typeof props[propName] !== "function") {
      return new Error("displayXAccessor must be a function");
    }
    return undefined;
  },
  mouseMoveEvent: PropTypes.bool,
  panEvent: PropTypes.bool,
  clamp: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.func]),
  zoomEvent: PropTypes.bool,
  onSelect: PropTypes.func,
  maintainPointsPerPixelOnResize: PropTypes.bool,
  disableInteraction: PropTypes.bool
};

ChartCanvas.defaultProps = {
  margin: { top: 20, right: 30, bottom: 30, left: 80 },
  type: "hybrid",
  pointsPerPxThreshold: 2,
  minPointsPerPxThreshold: 1 / 100,
  className: "calgo-stockchart",
  zIndex: 1,
  xExtents: [min, max],
  postCalculator: identity,
  padding: 0,
  xAccessor: identity,
  flipXScale: false,
  useCrossHairStyleCursor: true,
  defaultFocus: true,
  onLoadMore: noop,
  onSelect: noop,
  mouseMoveEvent: true,
  panEvent: true,
  zoomEvent: true,
  zoomMultiplier: 1.1,
  clamp: false,
  zoomAnchor: mouseBasedZoomAnchor,
  maintainPointsPerPixelOnResize: true,
  disableInteraction: false
};

// The ChartCanvas component is not wrapped in React.memo because it manages its own shouldComponentUpdate logic via panInProgress.

export default ChartCanvas;
