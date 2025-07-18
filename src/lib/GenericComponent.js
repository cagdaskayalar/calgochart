import React, { useContext, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { isNotDefined, isDefined, noop, functor, identity } from "./utils";
import { ChartCanvasContext, ChartContext } from "./ChartCanvas";

// Belirli olayları birleştirmek için alias tanımları
const aliases = {
  mouseleave: "mousemove",
  panend: "pan",
  pinchzoom: "pan",
  mousedown: "mousemove",
  click: "mousemove",
  contextmenu: "mousemove",
  dblclick: "mousemove",
  dragstart: "drag",
  dragend: "drag",
  dragcancel: "drag",
};

/**
 * GenericComponent, grafik bileşenleri için temel bir bileşendir.
 * ChartCanvas olaylarına abone olarak hover, tıklama ve sürükleme gibi etkileşimleri yönetir.
 * Bileşen, ister SVG ister canvas üzerinde çizim yapabiliyor.
 */
function GenericComponent(props) {
  const {
    svgDraw,
    canvasDraw,
    canvasToDraw,
    drawOn,
    clip,
    edgeClip,
    interactiveCursorClass,
    selected,
    enableDragOnHover,
    disablePan,
    isHover,
    onClick,
    onClickWhenHover,
    onClickOutside,
    onPan,
    onPanEnd,
    onDragStart,
    onDrag,
    onDragComplete,
    onDoubleClick,
    onDoubleClickWhenHover,
    onContextMenu,
    onContextMenuWhenHover,
    onMouseMove,
    onMouseDown,
    onHover,
    onUnHover,
  } = props;

  // Grafik bağlamlarını al (global ChartCanvas bağlamı ve opsiyonel Chart bağlamı)
  const globalContext = useContext(ChartCanvasContext);
  const chartContext = useContext(ChartContext);
  const chartId = chartContext ? chartContext.chartId : undefined;
  // Bu bileşene ait güncel chartConfig (eğer Chart içindeyse o, değilse global)
  const currentChartConfig = chartContext ? chartContext.chartConfig : globalContext.chartConfig;

  // Bileşene özel moreProps verisini tutan ref (ChartCanvas'tan gelen verilerle güncellenir)
  const morePropsRef = useRef({});
  // ChartCanvas aboneliği için benzersiz bir ID
  const subscriberIdRef = useRef(globalContext.generateSubscriptionId());
  // Bu bileşenin imleç sınıfını ayarlayıp ayarlamadığını izleyen ref
  const iSetTheCursorClassRef = useRef(false);
  // Bu bileşenin başlattığı bir sürükleme işleminin sürüp sürmediğini izleyen ref
  const dragInProgressRef = useRef(false);
  // Herhangi bir bileşende sürükleme olup olmadığını izleyen ref (ChartCanvas genel)
  const someDragInProgressRef = useRef(false);
  // Olay değerlendirmesi yapılırken (evaluateType içinde) true olur, çakışmaları önlemek için kullanılır
  const evaluationInProgressRef = useRef(false);

  // SVG çizimlerde React yeniden render tetiklemek için kullanılan durum sayacı (canvas için kullanılmaz)
  const [, setUpdateCount] = useState(0);

  // Pan/drag koşullarını hesaplamak için gerekli prop'ları (selected, enableDragOnHover, disablePan) güncel tutan ref
  const panConditionPropsRef = useRef({
    selected,
    enableDragOnHover,
    disablePan,
  });
  useEffect(() => {
    panConditionPropsRef.current = { selected, enableDragOnHover, disablePan };
  }, [selected, enableDragOnHover, disablePan]);

  // Bileşen montajında ChartCanvas'e abone ol, demontajında abonelikten çık
  useEffect(() => {
    const subscriptionId = subscriberIdRef.current;

    // ChartCanvas'tan gelen her olay için çalışacak dinleyici
    const listener = (type, moreProps, state, e) => {
      if (isDefined(moreProps)) {
        updateMoreProps(moreProps);
      }
      evaluationInProgressRef.current = true;
      evaluateType(type, e);
      evaluationInProgressRef.current = false;
    };

    // ChartCanvas tarafından yeniden çizim gerektiğinde çağrılacak fonksiyon
    const draw = ({ trigger, force }) => {
      const eventType = aliases[trigger] || trigger;
      const shouldDraw = drawOn.indexOf(eventType) > -1;
      if (shouldDraw || selected || force) {
        const chartCanvasType = globalContext.chartCanvasType;
        if (isNotDefined(canvasDraw) || chartCanvasType === "svg") {
          // SVG modunda veya canvasDraw tanımsızsa React yeniden render tetikle
          setUpdateCount((count) => count + 1);
        } else {
          // Canvas modundaysa doğrudan canvas üzerinde çiz
          drawOnCanvas();
        }
      }
    };

    // ChartCanvas'e bu bileşeni abone et
    globalContext.subscribe(subscriptionId, {
      chartId,
      clip,
      edgeClip,
      listener,
      draw,
      // ChartCanvas'in pan/zoom davranışı için bu bileşenin koşullarını bildir
      getPanConditions: () => {
        const { selected: sel, enableDragOnHover: dragOn, disablePan: disPan } = panConditionPropsRef.current;
        const hovering = morePropsRef.current.hovering;
        const draggable = ((sel && hovering) || (dragOn && hovering));
        return { draggable, panEnabled: !disPan };
      },
    });

    // Bileşen unmount olduğunda aboneliği temizle
    return () => {
      globalContext.unsubscribe(subscriptionId);
      // Eğer bu bileşen imleç sınıfını değiştirmişse, sıfırla
      if (iSetTheCursorClassRef.current) {
        globalContext.setCursorClass(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece montaj ve demontaj için çalıştır

  // ChartCanvas'tan gelen moreProps bilgisini dahili morePropsRef içerisine güncelle
  const updateMoreProps = (moreProps) => {
    Object.assign(morePropsRef.current, moreProps);
    // Eğer birden çok chartConfig varsa, bu bileşenin chartId'sine uygun olanı seç
    const { chartConfig: chartConfigList } = moreProps;
    if (chartConfigList && Array.isArray(chartConfigList) && chartId !== undefined) {
      const chartConfig = chartConfigList.find((cfg) => cfg.id === chartId);
      if (chartConfig) {
        morePropsRef.current.chartConfig = chartConfig;
      }
    }
    // Seçilen chartConfig mevcutsa, mouseXY ve startPos gibi koordinatları grafiğin orijinine göre ayarla
    if (isDefined(morePropsRef.current.chartConfig)) {
      const { origin: [ox, oy] } = morePropsRef.current.chartConfig;
      if (isDefined(moreProps.mouseXY)) {
        const [x, y] = moreProps.mouseXY;
        morePropsRef.current.mouseXY = [x - ox, y - oy];
      }
      if (isDefined(moreProps.startPos)) {
        const [x, y] = moreProps.startPos;
        morePropsRef.current.startPos = [x - ox, y - oy];
      }
    }
  };

  // Bu bileşen için moreProps (chart verileri, ölçekler, vs dahil) elde et
  const getMoreProps = () => {
    const {
      width,
      height,
      plotData,
      xScale,
      xAccessor,
      displayXAccessor,
      fullData,
    } = globalContext;
    const baseProps = {
      width,
      height,
      plotData,
      xScale,
      xAccessor,
      displayXAccessor,
      fullData,
      chartId,
      chartConfig: currentChartConfig,
    };
    const combinedProps = { ...baseProps, ...morePropsRef.current };
    // Eğer ChartCanvas bir morePropsDecorator tanımladıysa, onu uygula
    return (globalContext.morePropsDecorator || identity)(combinedProps);
  };

  // Verilen bir olay tipinin bu bileşen tarafından işlenip işlenmeyeceğini belirle
  const shouldTypeProceed = (type, moreProps) => {
    const ALWAYS_TRUE_TYPES = ["drag", "dragend"];
    // Pan devre dışıyken mousemove ve click her zaman işlenir (ör. çizim modlarında)
    if ((type === "mousemove" || type === "click") && disablePan) {
      return true;
    }
    // Diğer olaylarda, eğer currentCharts listesi varsa, bu bileşenin chartId'si o listede mi kontrol et
    if (ALWAYS_TRUE_TYPES.indexOf(type) === -1 && isDefined(moreProps) && isDefined(moreProps.currentCharts)) {
      return moreProps.currentCharts.indexOf(chartId) > -1;
    }
    return true;
  };

  // Olayı değerlendir ve uygun geri çağrıları çalıştır
  const evaluateType = (type, e) => {
    const actualType = aliases[type] || type;
    const proceed = drawOn.indexOf(actualType) > -1;
    if (!proceed) return;
    // (İleride gerekirse preEvaluate burada çağrılabilir)
    if (!shouldTypeProceed(type, morePropsRef.current)) return;

    const moreProps = getMoreProps();
    switch (type) {
      case "zoom":
      case "mouseenter":
        // Bu olaylarda bir şey yapma
        break;

      case "mouseleave":
        morePropsRef.current.hovering = false;
        if (onUnHover) {
          onUnHover(moreProps, e);
        }
        break;

      case "contextmenu":
        if (onContextMenu) {
          onContextMenu(moreProps, e);
        }
        if (morePropsRef.current.hovering && onContextMenuWhenHover) {
          onContextMenuWhenHover(moreProps, e);
        }
        break;

      case "mousedown":
        if (onMouseDown) {
          onMouseDown(moreProps, e);
        }
        break;

      case "click":
        if (morePropsRef.current.hovering && onClickWhenHover) {
          onClickWhenHover(moreProps, e);
        } else if (!morePropsRef.current.hovering && onClickOutside) {
          onClickOutside(moreProps, e);
        }
        if (onClick) {
          onClick(moreProps, e);
        }
        break;

      case "mousemove": {
        const prevHover = morePropsRef.current.hovering;
        // isHover fonksiyonu tanımlıysa onu kullanarak, değilse false
        morePropsRef.current.hovering = isHover ? isHover(getMoreProps(), e) : false;

        const { amIOnTop, setCursorClass } = globalContext;
        if (
          morePropsRef.current.hovering &&
          !selected &&
          amIOnTop(subscriberIdRef.current) &&
          isDefined(onHover)
        ) {
          // Bileşen hover durumuna girdi (seçili değilse) => imleci pointer yap
          setCursorClass("calgo-stockcharts-pointer-cursor");
          iSetTheCursorClassRef.current = true;
        } else if (
          morePropsRef.current.hovering &&
          selected &&
          amIOnTop(subscriberIdRef.current)
        ) {
          // Bileşen seçili ve hover durumunda => özel interaktif imleç uygula
          setCursorClass(interactiveCursorClass || "calgo-stockcharts-pointer-cursor");
          iSetTheCursorClassRef.current = true;
        } else if (prevHover && !morePropsRef.current.hovering && iSetTheCursorClassRef.current) {
          // Önceden hover'dı, şimdi değil => bizim ayarladığımız imleci kaldır
          iSetTheCursorClassRef.current = false;
          globalContext.setCursorClass(null);
        }

        if (morePropsRef.current.hovering && !prevHover && onHover) {
          onHover(moreProps, e);
        }
        if (prevHover && !morePropsRef.current.hovering && onUnHover) {
          onUnHover(moreProps, e);
        }
        if (onMouseMove) {
          onMouseMove(moreProps, e);
        }
        break;
      }

      case "dblclick":
        if (onDoubleClick) {
          onDoubleClick(moreProps, e);
        }
        if (morePropsRef.current.hovering && onDoubleClickWhenHover) {
          onDoubleClickWhenHover(moreProps, e);
        }
        break;

      case "pan":
        // Pan esnasında hover durumunu sıfırla
        morePropsRef.current.hovering = false;
        if (onPan) {
          onPan(moreProps, e);
        }
        break;

      case "panend":
        if (onPanEnd) {
          onPanEnd(moreProps, e);
        }
        break;

      case "dragstart":
        // Eğer bu bileşen sürüklenebilir durumda ise ve en üstte ise drag başlasın
        if (globalContext.amIOnTop(subscriberIdRef.current) && getPanConditions().draggable) {
          dragInProgressRef.current = true;
          if (onDragStart) {
            onDragStart(moreProps, e);
          }
        }
        someDragInProgressRef.current = true;
        break;

      case "drag":
        if (dragInProgressRef.current && onDrag) {
          onDrag(moreProps, e);
        }
        break;

      case "dragend":
        if (dragInProgressRef.current) {
          if (onDragComplete) {
            onDragComplete(moreProps, e);
          }
        }
        // Sürükleme bitti
        dragInProgressRef.current = false;
        someDragInProgressRef.current = false;
        break;

      case "dragcancel":
        // Sürükleme iptal edildi, eğer bu bileşen imleci ayarlamışsa sıfırla
        if (dragInProgressRef.current || iSetTheCursorClassRef.current) {
          globalContext.setCursorClass(null);
        }
        dragInProgressRef.current = false;
        someDragInProgressRef.current = false;
        break;

      default:
        // Bilinmeyen olay tipleri göz ardı edilir
        break;
    }
  };

  // ChartCanvas tarafından pan/drag işlemleri için kullanılacak koşulları döndür
  const getPanConditions = () => {
    const hovering = morePropsRef.current.hovering;
    const { selected: sel, enableDragOnHover: dragOn, disablePan: disPan } = panConditionPropsRef.current;
    const draggable = ((sel && hovering) || (dragOn && hovering));
    return { draggable, panEnabled: !disPan };
  };

  // Canvas üzerinde çizim yap (canvasDraw tanımlıysa ve SVG modunda değilse kullanılır)
  const drawOnCanvas = () => {
    const contexts = globalContext.getCanvasContexts();
    if (!contexts) return;
    const ctx = canvasToDraw(contexts);
    const moreProps = getMoreProps();
    // Her çizim öncesi context kaydet ve sonra restore et (diğer çizimleri etkilememesi için)
    ctx.save();
    if (canvasDraw) {
      canvasDraw(ctx, moreProps);
    }
    ctx.restore();
  };

  // Eğer canvasDraw tanımlı ve ChartCanvas türü SVG değilse (yani canvas kullanılıyorsa), DOM'a hiçbir şey render etme
  if (isDefined(canvasDraw) && globalContext.chartCanvasType !== "svg") {
    return null;
  }

  // SVG çizim için, gerekliyse clipPath uygula ve çizimi döndür
  const clipSuffix = isDefined(chartId) ? `-${chartId}` : "";
  const clipPathId = `chart-area-clip${clipSuffix}`;
  const style = clip ? { clipPath: `url(#${clipPathId})` } : null;

  return <g style={style}>{svgDraw(getMoreProps())}</g>;
}

GenericComponent.propTypes = {
  svgDraw: PropTypes.func.isRequired,
  canvasDraw: PropTypes.func,
  canvasToDraw: PropTypes.func.isRequired,
  drawOn: PropTypes.array.isRequired,
  clip: PropTypes.bool.isRequired,
  edgeClip: PropTypes.bool.isRequired,
  interactiveCursorClass: PropTypes.string,
  selected: PropTypes.bool.isRequired,
  enableDragOnHover: PropTypes.bool.isRequired,
  disablePan: PropTypes.bool.isRequired,
  isHover: PropTypes.func,
  onClick: PropTypes.func,
  onClickWhenHover: PropTypes.func,
  onClickOutside: PropTypes.func,
  onPan: PropTypes.func,
  onPanEnd: PropTypes.func,
  onDragStart: PropTypes.func,
  onDrag: PropTypes.func,
  onDragComplete: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onDoubleClickWhenHover: PropTypes.func,
  onContextMenu: PropTypes.func,
  onContextMenuWhenHover: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseDown: PropTypes.func,
  onHover: PropTypes.func,
  onUnHover: PropTypes.func,
  debug: PropTypes.func,
};

GenericComponent.defaultProps = {
  svgDraw: functor(null),
  canvasToDraw: (contexts) => contexts.mouseCoord,
  drawOn: [],
  clip: true,
  edgeClip: false,
  selected: false,
  disablePan: false,
  enableDragOnHover: false,
  // interactiveCursorClass için varsayılan yok; seçili bileşenler gerektiğinde kendi sınıfını geçmeli
  onClickWhenHover: noop,
  onClickOutside: noop,
  onDragStart: noop,
  onMouseMove: noop,
  onMouseDown: noop,
  debug: noop,
};

// Canvas çizimi yapacak alt çizim katmanlarını seçmeye yönelik yardımcı fonksiyonlar
export function getAxisCanvas(contexts) {
  return contexts.axes;
}
export function getMouseCanvas(contexts) {
  return contexts.mouseCoord;
}

export default GenericComponent;
