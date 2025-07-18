// src/lib/series/BarSeries.js
// This module defines a BarSeries component that renders bar charts using SVG or canvas.
// It extends the functionality of StackedBarSeries to support classic bar charts.
// BarSeries.js

import React, { Component } from "react";
import PropTypes from "prop-types";
import GenericChartComponent from "../GenericChartComponent";
import { getAxisCanvas } from "../GenericComponent";
import StackedBarSeries, {
	drawOnCanvasHelper,
	drawOnCanvas2,
	getBarsSVG2,
	svgHelper,
	identityStack
} from "./StackedBarSeries";
import { functor, isDefined } from "../utils";

// ---------- BarSeries Component ----------
class BarSeries extends Component {
	renderSVG = (moreProps) => {
		const { swapScales } = this.props;
		const { xAccessor } = moreProps;
		if (swapScales) {
			return <g>{svgHelper(this.props, moreProps, xAccessor, identityStack)}</g>;
		}
		const bars = getBars(this.props, moreProps);
		return <g>{getBarsSVG2(this.props, bars)}</g>;
	};

	drawOnCanvas = (ctx, moreProps) => {
		const { swapScales } = this.props;
		const { xAccessor } = moreProps;
		if (swapScales) {
			drawOnCanvasHelper(ctx, this.props, moreProps, xAccessor, identityStack);
		} else {
			const bars = getBars(this.props, moreProps);
			drawOnCanvas2(this.props, ctx, bars);
		}
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

BarSeries.propTypes = {
	baseAt: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	stroke: PropTypes.bool,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	yAccessor: PropTypes.func.isRequired,
	opacity: PropTypes.number,
	fill: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
	clip: PropTypes.bool,
	swapScales: PropTypes.bool,
};

BarSeries.defaultProps = StackedBarSeries.defaultProps;

export default BarSeries;

// --------- Helper: Fast getBars for classic bar chart ----------
function getBars(props, moreProps) {
	const { baseAt, fill, stroke, yAccessor } = props;
	const { xScale, xAccessor, plotData, chartConfig: { yScale } } = moreProps;

	const getFill = functor(fill);
	const getBase = functor(baseAt);
	const widthFunctor = functor(props.width);
	const width = widthFunctor(props, { xScale, xAccessor, plotData });
	const offset = Math.floor(0.5 * width);

	return plotData
		.filter(d => isDefined(yAccessor(d)))
		.map(d => {
			const yValue = yAccessor(d);
			let y = yScale(yValue);
			const x = Math.round(xScale(xAccessor(d))) - offset;
			let h = getBase(xScale, yScale, d) - yScale(yValue);
			if (h < 0) {
				y = y + h;
				h = -h;
			}
			return {
				x,
				y: Math.round(y),
				height: Math.round(h),
				width: offset * 2,
				fill: getFill(d, 0),
				stroke: stroke ? getFill(d, 0) : "none",
			};
		});
}
