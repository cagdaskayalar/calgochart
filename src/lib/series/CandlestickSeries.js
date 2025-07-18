// src/lib/series/CandlestickSeries.js
// This module defines a CandlestickSeries component that renders candlestick charts using SVG or canvas.
// It supports customizable styles, widths, and class names for wicks and candles, and allows for flexible rendering in React applications.
// CandlestickSeries.js

import React, { Component } from "react";
import PropTypes from "prop-types";
import { nest } from "d3-collection";
import GenericChartComponent from "../GenericChartComponent";
import { getAxisCanvas } from "../GenericComponent";
import { hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head } from "../utils";

// ---------- Main Component ----------
class CandlestickSeries extends Component {
	renderSVG = (moreProps) => {
		const { className, wickClassName, candleClassName } = this.props;
		const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;
		const candleData = getCandleData(this.props, xAccessor, xScale, yScale, plotData);

		return (
			<g className={className}>
				<g className={wickClassName} key="wicks">{getWicksSVG(candleData)}</g>
				<g className={candleClassName} key="candles">{getCandlesSVG(this.props, candleData)}</g>
			</g>
		);
	};

	drawOnCanvas = (ctx, moreProps) => {
		drawOnCanvasHelper(ctx, this.props, moreProps);
	};

	render() {
		return (
			<GenericChartComponent
				clip={this.props.clip}
				svgDraw={this.renderSVG}
				canvasDraw={this.drawOnCanvas}
				canvasToDraw={getAxisCanvas}
				drawOn={["pan"]}
			/>
		);
	}
}

CandlestickSeries.propTypes = {
	className: PropTypes.string,
	wickClassName: PropTypes.string,
	candleClassName: PropTypes.string,
	widthRatio: PropTypes.number,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	classNames: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	fill: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	stroke: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	wickStroke: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	yAccessor: PropTypes.func,
	clip: PropTypes.bool,
	opacity: PropTypes.number,
	candleStrokeWidth: PropTypes.number,
};

CandlestickSeries.defaultProps = {
	className: "calgo-stockcharts-candlestick",
	wickClassName: "calgo-stockcharts-candlestick-wick",
	candleClassName: "calgo-stockcharts-candlestick-candle",
	yAccessor: d => ({ open: d.open, high: d.high, low: d.low, close: d.close }),
	classNames: d => d.close > d.open ? "up" : "down",
	width: plotDataLengthBarWidth,
	wickStroke: "#000000",
	fill: d => d.close > d.open ? "#6BA583" : "#FF0000",
	stroke: "#000000",
	candleStrokeWidth: 0.5,
	widthRatio: 0.8,
	opacity: 0.5,
	clip: true,
};

// ---------- Helpers ----------
function getWicksSVG(candleData) {
	return candleData.map((each, idx) => {
		const d = each.wick;
		return (
			<path key={idx}
				className={each.className}
				stroke={d.stroke}
				d={`M${d.x},${d.y1} L${d.x},${d.y2} M${d.x},${d.y3} L${d.x},${d.y4}`}
			/>
		);
	});
}

function getCandlesSVG(props, candleData) {
	const { opacity, candleStrokeWidth } = props;
	return candleData.map((d, idx) => {
		if (d.width <= 1)
			return (
				<line className={d.className} key={idx}
					x1={d.x} y1={d.y} x2={d.x} y2={d.y + d.height}
					stroke={d.fill}
				/>
			);
		if (d.height === 0)
			return (
				<line key={idx}
					x1={d.x} y1={d.y} x2={d.x + d.width} y2={d.y + d.height}
					stroke={d.fill}
				/>
			);
		return (
			<rect key={idx} className={d.className}
				fillOpacity={opacity}
				x={d.x} y={d.y} width={d.width} height={d.height}
				fill={d.fill} stroke={d.stroke} strokeWidth={candleStrokeWidth}
			/>
		);
	});
}

// T�m canvas �izimi tek fonksiyonda (yukar�dan ald�)
function drawOnCanvasHelper(ctx, props, moreProps) {
	const { opacity, candleStrokeWidth } = props;
	const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;
	const candleData = getCandleData(props, xAccessor, xScale, yScale, plotData);

	// Wick
	const wickNest = nest()
		.key(d => d.wick.stroke)
		.entries(candleData);

	wickNest.forEach(outer => {
		const { key, values } = outer;
		ctx.strokeStyle = key;
		ctx.fillStyle = key;
		values.forEach(each => {
			const d = each.wick;
			ctx.fillRect(d.x - 0.5, d.y1, 1, d.y2 - d.y1);
			ctx.fillRect(d.x - 0.5, d.y3, 1, d.y4 - d.y3);
		});
	});

	// Candle
	const candleNest = nest()
		.key(d => d.stroke)
		.key(d => d.fill)
		.entries(candleData);

	candleNest.forEach(outer => {
		const { key: strokeKey, values: strokeValues } = outer;
		if (strokeKey !== "none") {
			ctx.strokeStyle = strokeKey;
			ctx.lineWidth = candleStrokeWidth;
		}
		strokeValues.forEach(inner => {
			const { key, values } = inner;
			const fillStyle = head(values).width <= 1
				? key
				: hexToRGBA(key, opacity);
			ctx.fillStyle = fillStyle;

			values.forEach(d => {
				if (d.width <= 1) {
					ctx.fillRect(d.x - 0.5, d.y, 1, d.height);
				} else if (d.height === 0) {
					ctx.fillRect(d.x, d.y - 0.5, d.width, 1);
				} else {
					ctx.fillRect(d.x, d.y, d.width, d.height);
					if (strokeKey !== "none") ctx.strokeRect(d.x, d.y, d.width, d.height);
				}
			});
		});
	});
}

// Yaln�zca clean ve h�zl� data haz�rlama
function getCandleData(props, xAccessor, xScale, yScale, plotData) {
	const wickStroke = functor(props.wickStroke);
	const className = functor(props.classNames);
	const fill = functor(props.fill);
	const stroke = functor(props.stroke);
	const widthFunctor = functor(props.width);
	const width = widthFunctor(props, { xScale, xAccessor, plotData });
	const trueOffset = 0.5 * width;
	const offset = trueOffset > 0.7 ? Math.round(trueOffset) : Math.floor(trueOffset);

	return plotData
		.filter(d => isDefined(props.yAccessor(d).close))
		.map(d => {
			const x = Math.round(xScale(xAccessor(d)));
			const ohlc = props.yAccessor(d);
			const y = Math.round(yScale(Math.max(ohlc.open, ohlc.close)));
			const height = Math.round(Math.abs(yScale(ohlc.open) - yScale(ohlc.close)));
			return {
				x: x - offset,
				y,
				wick: {
					stroke: wickStroke(ohlc),
					x,
					y1: Math.round(yScale(ohlc.high)),
					y2: y,
					y3: y + height,
					y4: Math.round(yScale(ohlc.low)),
				},
				height,
				width: offset * 2,
				className: className(ohlc),
				fill: fill(ohlc),
				stroke: stroke(ohlc),
				direction: ohlc.close - ohlc.open,
			};
		});
}

export default CandlestickSeries;
