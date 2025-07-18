// src/lib/EventCapture.js
// This module defines an EventCapture component that captures mouse and touch events on a chart.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// EventCapture.js

import React from "react";
import PropTypes from "prop-types";
import { select, pointer } from "d3-selection";
import { isDefined, mousePosition, touchPosition, getTouchProps, d3Window, MOUSEMOVE, MOUSEUP, MOUSEENTER, MOUSELEAVE, TOUCHMOVE, TOUCHEND, noop } from "./utils";
import { getCurrentCharts } from "./utils/ChartDataUtil";


function getTouches(node, event) {
  if (event && event.touches) {
    // Touch events oldugunda, touches listesini don
    return Array.from(event.touches).map(t => [t.clientX, t.clientY]);
  }
  if (typeof window !== 'undefined' && node) {
    // Fallback: document eventten touches al
    const touches = node.ownerDocument && node.ownerDocument.defaultView && node.ownerDocument.defaultView.event && node.ownerDocument.defaultView.event.touches;
    if (touches) {
      return Array.from(touches).map(t => [t.clientX, t.clientY]);
    }
  }
  return [];
}

class EventCapture extends React.Component {
	mouseInside = false;
	mouseInteraction = true;
	state = { panInProgress: false };

	saveNode = node => { this.node = node; };

	componentDidMount() {
		if (this.node) {
			// Sadece burada dinle, React tarafında onWheel kullanma		
			this.node.addEventListener('wheel', this.handleWheel, { passive: false });
			select(this.node)
				.on(MOUSEENTER, this.handleEnter)
				.on(MOUSELEAVE, this.handleLeave);
		}
		this.focus = this.props.focus;
	}
	componentDidUpdate() {
		this.componentDidMount();
	}
	componentWillUnmount() {
		if (this.node) {
			this.node.removeEventListener('wheel', this.handleWheel, { passive: false });
			select(this.node).on(MOUSEENTER, null).on(MOUSELEAVE, null);
			const win = d3Window(this.node);
			select(win).on(MOUSEMOVE, null);
		}
	}
	handleEnter = (e) => {  // event parametresi e olarak alınıyor
	const { onMouseEnter } = this.props;
	this.mouseInside = true;
	if (!this.state.panInProgress && !this.state.dragInProgress) {
		const win = d3Window(this.node);
		select(win).on(MOUSEMOVE, this.handleMouseMove);
	}
	onMouseEnter(e);
	};

	handleLeave = (e) => {
		const { onMouseLeave } = this.props;
		this.mouseInside = false;
		if (!this.state.panInProgress && !this.state.dragInProgress) {
			const win = d3Window(this.node);
			select(win).on(MOUSEMOVE, null);
		}
		onMouseLeave(e);
	};
	handleWheel = (e) => {
		if (e.cancelable) e.preventDefault();
		const { zoom, onZoom } = this.props;
		const { panInProgress } = this.state;
		const yZoom = Math.abs(e.deltaY) > Math.abs(e.deltaX) && Math.abs(e.deltaY) > 0;
		const mouseXY = mousePosition(e);
		e.preventDefault();

		if (zoom && this.focus && yZoom && !panInProgress) {
			const zoomDir = e.deltaY > 0 ? 1 : -1;
			onZoom(zoomDir, mouseXY, e);
		} else if (this.focus) {
			if (this.shouldPan()) {
				const { panStartXScale, chartsToPan } = this.state.panStart;
				this.lastNewPos = mouseXY;
				this.panHappened = true;
				this.dx += e.deltaX;
				this.dy += e.deltaY;
				const dxdy = { dx: this.dx, dy: this.dy };
				this.props.onPan(mouseXY, panStartXScale, dxdy, chartsToPan, e);
			} else {
				const { xScale, chartConfig } = this.props;
				const currentCharts = getCurrentCharts(chartConfig, mouseXY);
				this.dx = 0; this.dy = 0;
				this.setState({
					panInProgress: true,
					panStart: { panStartXScale: xScale, panOrigin: mouseXY, chartsToPan: currentCharts }
				});
			}
			this.queuePanEnd();
		}
	};
	queuePanEnd = () => {
		if (isDefined(this.panEndTimeout)) clearTimeout(this.panEndTimeout);
		this.panEndTimeout = setTimeout(this.handlePanEnd, 100);
	};
	handleMouseMove = (event) => {
	const { onMouseMove, mouseMove } = this.props;
	if (this.mouseInteraction && mouseMove && !this.state.panInProgress) {
		const newPos = pointer(event, this.node);
		onMouseMove(newPos, "mouse", event);
	}
	};
	handleClick = (e) => {
		const mouseXY = mousePosition(e);
		const { onClick, onDoubleClick } = this.props;
		if (!this.panHappened && !this.dragHappened) {
			if (this.clicked) {
				onDoubleClick(mouseXY, e);
				this.clicked = false;
			} else {
				onClick(mouseXY, e);
				this.clicked = true;
				setTimeout(() => { if (this.clicked) this.clicked = false; }, 400);
			}
		}
	};
	handleRightClick = (e) => {
		e.stopPropagation(); e.preventDefault();
		const { onContextMenu, onPanEnd } = this.props;
		const mouseXY = mousePosition(e, this.node.getBoundingClientRect());
		if (isDefined(this.state.panStart)) {
			const { panStartXScale, panOrigin, chartsToPan } = this.state.panStart;
			if (this.panHappened) onPanEnd(mouseXY, panStartXScale, panOrigin, chartsToPan, e);
			const win = d3Window(this.node);
			select(win).on(MOUSEMOVE, null).on(MOUSEUP, null);
			this.setState({ panInProgress: false, panStart: null });
		}
		onContextMenu(mouseXY, e);
	};
	handleDrag = (event) => {
	if (this.props.onDrag) {
		this.dragHappened = true;
		const mouseXY = pointer(event, this.node);
		this.props.onDrag({ startPos: this.state.dragStartPosition, mouseXY }, event);
	}
	};
	cancelDrag = () => {
		const win = d3Window(this.node);
		select(win).on(MOUSEMOVE, this.mouseInside ? this.handleMouseMove : null).on(MOUSEUP, null);
		this.setState({ dragInProgress: false });
		this.mouseInteraction = true;
	};
	handleDragEnd = (event) => {
	const mouseXY = pointer(event, this.node);
	const win = d3Window(this.node);
	select(win)
		.on("mousemove", this.mouseInside ? this.handleMouseMove : null)
		.on("mouseup", null);

	if (this.dragHappened) {
		this.props.onDragComplete({ mouseXY }, event);
	}
	this.setState({ dragInProgress: false });
	this.mouseInteraction = true;
	};
	canPan = () => {
		const { getAllPanConditions, pan: initialPanEnabled } = this.props;
		const { panEnabled, draggable: somethingSelected } = getAllPanConditions()
			.reduce((ret, a) => ({
				draggable: ret.draggable || a.draggable,
				panEnabled: ret.panEnabled && a.panEnabled
			}), { draggable: false, panEnabled: initialPanEnabled });
		return { panEnabled, somethingSelected };
	};
	handleMouseDown = (e) => {
		if (e.button !== 0) return;
		const { xScale, chartConfig, onMouseDown } = this.props;
		this.panHappened = false;
		this.dragHappened = false;
		this.focus = true;
		if (!this.state.panInProgress && this.mouseInteraction) {
			const mouseXY = mousePosition(e);
			const currentCharts = getCurrentCharts(chartConfig, mouseXY);
			const { panEnabled, somethingSelected } = this.canPan();
			const pan = panEnabled && !somethingSelected;
			if (pan) {
				this.setState({
					panInProgress: pan,
					panStart: { panStartXScale: xScale, panOrigin: mouseXY, chartsToPan: currentCharts }
				});
				const win = d3Window(this.node);
				select(win).on(MOUSEMOVE, this.handlePan).on(MOUSEUP, this.handlePanEnd);
			} else if (somethingSelected) {
				this.setState({
					panInProgress: false, dragInProgress: true, panStart: null, dragStartPosition: mouseXY
				});
				this.props.onDragStart({ startPos: mouseXY }, e);
				const win = d3Window(this.node);
				select(win).on(MOUSEMOVE, this.handleDrag).on(MOUSEUP, this.handleDragEnd);
			}
			onMouseDown(mouseXY, currentCharts, e);
		}
		e.preventDefault();
	};
	shouldPan = () => {
		const { pan: panEnabled, onPan } = this.props;
		return panEnabled && onPan && isDefined(this.state.panStart);
	};
	handlePan = (event) => {
	if (this.shouldPan()) {
		this.panHappened = true;
		const { panStartXScale, panOrigin, chartsToPan } = this.state.panStart;
		
		const mouseXY = this.mouseInteraction
		? pointer(event, this.node)
		: getTouches(this.node)[0];

		this.lastNewPos = mouseXY;
		const dx = mouseXY[0] - panOrigin[0];
		const dy = mouseXY[1] - panOrigin[1];
		this.dx = dx; 
		this.dy = dy;

		this.props.onPan(mouseXY, panStartXScale, { dx, dy }, chartsToPan, event);
	}
	};
	handlePanEnd = (event) => {
	const { pan: panEnabled, onPanEnd } = this.props;
	if (this.state.panStart !== undefined && this.state.panStart !== null) {
		const { panStartXScale, chartsToPan } = this.state.panStart;
		const win = this.node.ownerDocument.defaultView || window;

		select(win)
		.on("mousemove", this.mouseInside ? this.handleMouseMove : null)
		.on("mouseup", null)
		.on("touchmove", null)
		.on("touchend", null);

		if (this.panHappened && panEnabled && onPanEnd) {
		const { dx, dy } = this;
		delete this.dx;
		delete this.dy;
		onPanEnd(this.lastNewPos, panStartXScale, { dx, dy }, chartsToPan, event);
		}

		this.setState({ panInProgress: false, panStart: null });
	}
	};
	handleTouchMove = (e) => {
		const { onMouseMove } = this.props;
		const touchXY = touchPosition(getTouchProps(e.touches[0]), e);
		onMouseMove(touchXY, "touch", e);
	};
	handleTouchStart = (e) => {
		this.mouseInteraction = false;
		const { pan: panEnabled, chartConfig, onMouseMove, xScale, onPanEnd } = this.props;
		if (e.touches.length === 1) {
			this.panHappened = false;
			const touchXY = touchPosition(getTouchProps(e.touches[0]), e);
			onMouseMove(touchXY, "touch", e);
			if (panEnabled) {
				const currentCharts = getCurrentCharts(chartConfig, touchXY);
				this.setState({
					panInProgress: true,
					panStart: { panStartXScale: xScale, panOrigin: touchXY, chartsToPan: currentCharts }
				});
				const win = d3Window(this.node);
				select(win).on(TOUCHMOVE, this.handlePan, false).on(TOUCHEND, this.handlePanEnd, false);
			}
		} else if (e.touches.length === 2) {
			const { panInProgress, panStart } = this.state;
			if (panInProgress && panEnabled && onPanEnd) {
				const { panStartXScale, panOrigin, chartsToPan } = panStart;
				const win = d3Window(this.node);
				select(win)
					.on(MOUSEMOVE, this.mouseInside ? this.handleMouseMove : null)
					.on(MOUSEUP, null)
					.on(TOUCHMOVE, this.handlePinchZoom, false)
					.on(TOUCHEND, this.handlePinchZoomEnd, false);
				const touch1Pos = touchPosition(getTouchProps(e.touches[0]), e);
				const touch2Pos = touchPosition(getTouchProps(e.touches[1]), e);
				if (this.panHappened && panEnabled && onPanEnd) {
					onPanEnd(this.lastNewPos, panStartXScale, panOrigin, chartsToPan, e);
				}
				this.setState({
					panInProgress: false,
					pinchZoomStart: { xScale, touch1Pos, touch2Pos, range: xScale.range(), chartsToPan }
				});
			}
		}
	};
	
	handlePinchZoom = (event) => {
	const touchPositions = getTouches(this.node);
	if (!touchPositions || touchPositions.length < 2) return;

	const [touch1Pos, touch2Pos] = touchPositions;
	const { xScale, zoom: zoomEnabled, onPinchZoom } = this.props;
	const { chartsToPan, ...initialPinch } = this.state.pinchZoomStart || {};

	if (zoomEnabled && onPinchZoom) {
		onPinchZoom(initialPinch, { touch1Pos, touch2Pos, xScale }, event);
	}
	};

	handlePinchZoomEnd = (event) => {
	const win = d3Window(this.node);
	select(win).on(TOUCHMOVE, null).on(TOUCHEND, null);

	const { zoom: zoomEnabled, onPinchZoomEnd } = this.props;
	const { chartsToPan, ...initialPinch } = this.state.pinchZoomStart || {};

	if (zoomEnabled && onPinchZoomEnd) {
		onPinchZoomEnd(initialPinch, event);
	}

	this.setState({ pinchZoomStart: null });
	};
	setCursorClass = (cursorOverrideClass) => {
		if (cursorOverrideClass !== this.state.cursorOverrideClass) {
			this.setState({ cursorOverrideClass });
		}
	};

	render() {
		const { height, width, disableInteraction, useCrossHairStyleCursor } = this.props;
		const className = this.state.cursorOverrideClass != null
			? this.state.cursorOverrideClass
			: !useCrossHairStyleCursor ? "" : this.state.panInProgress
				? "calgo-stockcharts-grabbing-cursor"
				: "calgo-stockcharts-crosshair-cursor";

		const interactionProps = disableInteraction || {
			onWheel: this.handleWheel,
			onMouseDown: this.handleMouseDown,
			onClick: this.handleClick,
			onContextMenu: this.handleRightClick,
			onTouchStart: this.handleTouchStart,
			onTouchMove: this.handleTouchMove,
		};

		return (
			<rect
				ref={this.saveNode}
				className={className}
				width={width}
				height={height}
				style={{ opacity: 0 }}
				{...interactionProps}
			/>
		);
	}
}

EventCapture.propTypes = {
	mouseMove: PropTypes.bool.isRequired,
	zoom: PropTypes.bool.isRequired,
	pan: PropTypes.bool.isRequired,
	panSpeedMultiplier: PropTypes.number.isRequired,
	focus: PropTypes.bool.isRequired,
	useCrossHairStyleCursor: PropTypes.bool.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	chartConfig: PropTypes.array,
	xScale: PropTypes.func.isRequired,
	xAccessor: PropTypes.func.isRequired,
	disableInteraction: PropTypes.bool.isRequired,
	getAllPanConditions: PropTypes.func.isRequired,
	onMouseMove: PropTypes.func,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
	onZoom: PropTypes.func,
	onPinchZoom: PropTypes.func,
	onPinchZoomEnd: PropTypes.func.isRequired,
	onPan: PropTypes.func,
	onPanEnd: PropTypes.func,
	onDragStart: PropTypes.func,
	onDrag: PropTypes.func,
	onDragComplete: PropTypes.func,
	onClick: PropTypes.func,
	onDoubleClick: PropTypes.func,
	onContextMenu: PropTypes.func,
	onMouseDown: PropTypes.func,
	children: PropTypes.node,
};

EventCapture.defaultProps = {
	mouseMove: false,
	zoom: false,
	pan: false,
	panSpeedMultiplier: 1,
	focus: false,
	onDragComplete: noop,
	disableInteraction: false,
};

export default EventCapture;
