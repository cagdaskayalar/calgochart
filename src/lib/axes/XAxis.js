// src/lib/axes/XAxis.js
// This module defines an XAxis component that renders the X axis for a chart.
// It supports zoom functionality and integrates with the chart's context for dynamic updates.
// XAxis.js

import React, { Component } from "react";
import PropTypes from "prop-types";
import Axis from "./Axis";

/**
 * XAxis bileşeni
 * --------------------------------------------------------
 * Grafik alt/üst X eksenini ve zoom özelliğini yönetir.
 * Chart'ın boyut, orijin ve zoom bilgilerini context'ten çeker;
 * Axis component'ine aktaracak şekilde helper ile işler.
 *
 * - axisAt: Ekseni nereye konumlandıracağını belirler ("top", "bottom", "middle" veya sayı olarak).
 * - orient: Eksenin yönü ("top" veya "bottom").
 * - zoomEnabled: X ekseninde zoom aktif mi?
 * - showTicks: Tick işaretlerini göster.
 * - ...: Diğer tüm axis ayarları.
 */
class XAxis extends Component {
    /**
     * Zoom eventinde yeni domain ile context üzerinden güncelleme yapılır.
     * (ChartCanvas'taki xAxisZoom fonksiyonu çağrılır.)
     * @param {Array<number>} newXDomain - Yeni X domain dizisi
     */
    axisZoomCallback = (newXDomain) => {
        this.context.xAxisZoom(newXDomain);
    };

    render() {
        const { showTicks } = this.props;
        // context'ten gelen chartConfig ve boyutlar Axis'e aktarılır
        const moreProps = helper(this.props, this.context);

        return (
            <Axis
                {...this.props}
                {...moreProps}
                x
                zoomEnabled={this.props.zoomEnabled && showTicks}
                axisZoomCallback={this.axisZoomCallback}
                zoomCursorClassName="calgo-stockcharts-ew-resize-cursor"
            />
        );
    }
}

XAxis.propTypes = {
    axisAt: PropTypes.oneOfType([
        PropTypes.oneOf(["top", "bottom", "middle"]),
        PropTypes.number
    ]).isRequired,
    orient: PropTypes.oneOf(["top", "bottom"]).isRequired,
    innerTickSize: PropTypes.number,
    outerTickSize: PropTypes.number,
    tickFormat: PropTypes.func,
    tickPadding: PropTypes.number,
    tickSize: PropTypes.number,
    ticks: PropTypes.number,
    tickValues: PropTypes.array,
    showTicks: PropTypes.bool,
    className: PropTypes.string,
    zoomEnabled: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onDoubleClick: PropTypes.func,
    xZoomHeight: PropTypes.number,
    fill: PropTypes.string,
    stroke: PropTypes.string,
    strokeWidth: PropTypes.number,
    opacity: PropTypes.number,
    domainClassName: PropTypes.string,
    tickStroke: PropTypes.string,
    tickStrokeOpacity: PropTypes.number,
    fontFamily: PropTypes.string,
    fontSize: PropTypes.number,
    fontWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    getMouseDelta: PropTypes.func,
};

XAxis.defaultProps = {
    showTicks: true,
    showTickLabel: true,
    showDomain: true,
    className: "calgo-stockcharts-x-axis",
    ticks: 10,
    outerTickSize: 0,
    fill: "none",
    stroke: "#000000",
    strokeWidth: 1,
    opacity: 1,
    domainClassName: "calgo-stockcharts-axis-domain",
    innerTickSize: 5,
    tickPadding: 6,
    tickStroke: "#000000",
    tickStrokeOpacity: 1,
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontSize: 12,
    fontWeight: 400,
    xZoomHeight: 25,
    zoomEnabled: true,
    getMouseDelta: (startXY, mouseXY) => startXY[0] - mouseXY[0],
};

// Legacy context API (ChartCanvas ve üst componentler böyle geçiyor)
XAxis.contextTypes = {
    chartConfig: PropTypes.object.isRequired,  // Chart boyutları, orijin, scale
    xAxisZoom: PropTypes.func.isRequired,      // Zoom callback fonksiyonu
};

/**
 * helper
 * --------------------------------------------------------
 * Chart'ın context'inden boyut, orijin ve zoom için gerekli props'ları çıkarır.
 * Axis'e uygun formatta döndürür.
 * @param {object} props - XAxis props
 * @param {object} context - React context (chartConfig, ...)
 * @returns {object} Axis için ek props'lar
 */
function helper(props, context) {
    // Burada context'ten chartConfig çıkarılır!
    const { axisAt, xZoomHeight = 25, orient } = props;
    // chartConfig ve context yapısı
    // ChartCanvas --> context.chartConfig
    // context.chartConfig = { width, height, ... }
    const { chartConfig: { width, height } } = context;

    let axisLocation;
    const x = 0, w = width, h = xZoomHeight;

    // Eksenin çizileceği konumu hesapla
    if (axisAt === "top") axisLocation = 0;
    else if (axisAt === "bottom") axisLocation = height;
    else if (axisAt === "middle") axisLocation = height / 2;
    else axisLocation = axisAt; // Eğer sayı verilmişse doğrudan o

    const y = (orient === "top") ? -xZoomHeight : 0;

    return {
        transform: [0, axisLocation], // SVG transform koordinatı
        range: [0, width],            // Scale'in range'i (pixel olarak)
        getScale: getXScale,          // Scale kopyalama fonksiyonu (zoom için)
        bg: { x, y, h, w },           // Zoom alanı için arka plan (brush)
    };
}

/**
 * getXScale
 * --------------------------------------------------------
 * Zoom sırasında yeni bir scale kopyası oluşturur, domain ve range ayarlar.
 * Eğer scale invert fonksiyonu varsa (ör: d3.scaleTime), range'den domain'i hesaplar.
 * @param {object} moreProps - Axis'e geçen context ve scale bilgisi
 * @returns {function} Yeni scale fonksiyonu
 */
function getXScale(moreProps) {
    const { xScale: scale, width } = moreProps;
    if (scale.invert) {
        const trueRange = [0, width];
        const trueDomain = trueRange.map(scale.invert);
        return scale.copy().domain(trueDomain).range(trueRange);
    }
    return scale;
}

export default XAxis;
