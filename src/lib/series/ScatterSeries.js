// src/lib/series/ScatterSeries.js
// This module defines a ScatterSeries component that renders scatter plots using SVG or canvas.
// It supports customizable markers, styles, and rendering options, making it suitable for various charting applications.
// ScatterSeries.js

import React from "react";
import PropTypes from "prop-types";
import { nest as d3Nest } from "d3-collection";
import GenericChartComponent from "../GenericChartComponent";
import { getAxisCanvas } from "../GenericComponent";
import { hexToRGBA, functor } from "../utils";

// ---- Main Component ----
class ScatterSeries extends React.PureComponent {
	drawOnCanvas = (ctx, moreProps) => {
		const { xAccessor } = moreProps;
		const points = getScatterPoints(this.props, moreProps, xAccessor);
		drawPointsOnCanvas(ctx, this.props, points);
	};

	renderSVG = (moreProps) => {
		const { className, markerProps } = this.props;
		const { xAccessor } = moreProps;
		const points = getScatterPoints(this.props, moreProps, xAccessor);

		return (
			<g className={className}>
				{points.map((point, idx) => {
					const { marker: Marker } = point;
					return <Marker key={idx} {...markerProps} point={point} />;
				})}
			</g>
		);
	};

	render() {
		return (
			<GenericChartComponent
				svgDraw={this.renderSVG}
				canvasDraw={this.drawOnCanvas}
				canvasToDraw={getAxisCanvas}
				drawOn={["pan"]}
			/>
		);
	}
}

ScatterSeries.propTypes = {
	className: PropTypes.string,
	yAccessor: PropTypes.func.isRequired,
	marker: PropTypes.func,
	markerProvider: PropTypes.func,
	markerProps: PropTypes.object,
};

ScatterSeries.defaultProps = {
	className: "calgo-stockcharts-scatter",
};

// ---- Helper Functions ----
function getScatterPoints(props, moreProps, xAccessor) {
	const { yAccessor, markerProvider, markerProps } = props;
	let { marker: Marker } = props;
	const { xScale, chartConfig: { yScale }, plotData } = moreProps;

	if (!(markerProvider || Marker))
		throw new Error("required prop, either marker or markerProvider missing");

	return plotData.map(d => {
		if (markerProvider) Marker = markerProvider(d);

		const mProps = { ...Marker.defaultProps, ...markerProps };
		const fill = functor(mProps.fill);
		const stroke = functor(mProps.stroke);

		return {
			x: xScale(xAccessor(d)),
			y: yScale(yAccessor(d)),
			fill: hexToRGBA(fill(d), mProps.opacity),
			stroke: stroke(d),
			datum: d,
			marker: Marker,
		};
	});
}

function drawPointsOnCanvas(ctx, props, points) {
	const { markerProps } = props;
	const nest = d3Nest()
		.key(d => d.fill)
		.key(d => d.stroke)
		.entries(points);

	nest.forEach(fillGroup => {
		const { key: fillKey, values: fillValues } = fillGroup;
		if (fillKey !== "none") ctx.fillStyle = fillKey;

		fillValues.forEach(strokeGroup => {
			strokeGroup.values.forEach(point => {
				const { marker } = point;
				marker.drawOnCanvas({ ...marker.defaultProps, ...markerProps, fill: fillKey }, point, ctx);
			});
		});
	});
}

export default ScatterSeries;
