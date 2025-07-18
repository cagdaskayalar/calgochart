// src/lib/axes/AxisTicks.js
// This module defines an AxisTicks component that renders ticks for a chart axis.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// AxisTicks.js

import React from "react";
import PropTypes from "prop-types";

import { hexToRGBA, isNotDefined, identity } from "../utils";

function tickTransformX(scale, tick) {
	return [Math.round(scale(tick)), 0];
}
function tickTransformY(scale, tick) {
	return [0, Math.round(scale(tick))];
}

export function Tick({
	transform,
	tickStroke,
	tickStrokeOpacity,
	textAnchor,
	fontSize,
	fontFamily,
	x,
	y,
	x2,
	y2,
	dy,
	children,
}) {
	return (
		<g className="tick" transform={`translate(${transform[0]}, ${transform[1]})`}>
			<line
				shapeRendering="crispEdges"
				opacity={tickStrokeOpacity}
				stroke={tickStroke}
				x2={x2}
				y2={y2}
			/>
			<text
				dy={dy}
				x={x}
				y={y}
				fill={tickStroke}
				fontSize={fontSize}
				fontFamily={fontFamily}
				textAnchor={textAnchor}
			>
				{children}
			</text>
		</g>
	);
}
Tick.propTypes = {
	transform: PropTypes.arrayOf(PropTypes.number),
	tickStroke: PropTypes.string,
	tickStrokeOpacity: PropTypes.number,
	textAnchor: PropTypes.string,
	fontSize: PropTypes.number,
	fontFamily: PropTypes.string,
	x: PropTypes.number,
	y: PropTypes.number,
	x2: PropTypes.number,
	y2: PropTypes.number,
	dy: PropTypes.string,
	children: PropTypes.node.isRequired,
};

Tick.drawOnCanvasStatic = (tick, ctx, result) => {
	const { scale, tickTransform, canvas_dy, x, y, x2, y2, format } = result;
	const origin = tickTransform(scale, tick);

	ctx.beginPath();
	ctx.moveTo(origin[0], origin[1]);
	ctx.lineTo(origin[0] + x2, origin[1] + y2);
	ctx.stroke();
	ctx.fillText(format(tick), origin[0] + x, origin[1] + y + canvas_dy);
};

export function AxisTicks(props) {
	const {
		ticks,
		scale,
		tickTransform,
		tickStroke,
		tickStrokeOpacity,
		dy,
		x,
		y,
		x2,
		y2,
		textAnchor,
		fontSize,
		fontFamily,
		format,
	} = AxisTicks.helper(props, props.scale);

	return (
		<g>
			{ticks.map((tick, idx) => (
				<Tick
					key={idx}
					transform={tickTransform(scale, tick)}
					tickStroke={tickStroke}
					tickStrokeOpacity={tickStrokeOpacity}
					dy={dy}
					x={x}
					y={y}
					x2={x2}
					y2={y2}
					textAnchor={textAnchor}
					fontSize={fontSize}
					fontFamily={fontFamily}
				>
					{format(tick)}
				</Tick>
			))}
		</g>
	);
}

AxisTicks.propTypes = {
	orient: PropTypes.oneOf(["top", "bottom", "left", "right"]).isRequired,
	innerTickSize: PropTypes.number,
	tickFormat: PropTypes.func,
	tickPadding: PropTypes.number,
	ticks: PropTypes.array,
	tickValues: PropTypes.array,
	scale: PropTypes.func.isRequired,
	tickStroke: PropTypes.string,
	tickStrokeOpacity: PropTypes.number,
	fontSize: PropTypes.number,
	fontFamily: PropTypes.string,
};

AxisTicks.defaultProps = {
	innerTickSize: 5,
	tickPadding: 6,
	ticks: [10],
	tickStroke: "#000",
	tickStrokeOpacity: 1,
	fontSize: 12,
	fontFamily: "Arial",
};

AxisTicks.helper = (props, scale) => {
	const {
		orient,
		innerTickSize,
		tickFormat,
		tickPadding,
		fontSize,
		fontFamily,
		ticks: tickArguments,
		tickValues,
		tickStroke,
		tickStrokeOpacity,
	} = props;

	const ticks =
		isNotDefined(tickValues)
			? scale.ticks
				? scale.ticks(...tickArguments)
				: scale.domain()
			: tickValues;

	const baseFormat = scale.tickFormat
		? scale.tickFormat(...tickArguments)
		: identity;

	const format = isNotDefined(tickFormat)
		? baseFormat
		: d => (baseFormat(d) ? tickFormat(d) : "");

	const sign = orient === "top" || orient === "left" ? -1 : 1;
	const tickSpacing = Math.max(innerTickSize, 0) + tickPadding;

	let tickTransform, x, y, x2, y2, dy, canvas_dy, textAnchor;

	if (orient === "bottom" || orient === "top") {
		tickTransform = tickTransformX;
		x2 = 0;
		y2 = sign * innerTickSize;
		x = 0;
		y = sign * tickSpacing;
		dy = sign < 0 ? "0em" : ".71em";
		canvas_dy = sign < 0 ? 0 : fontSize * 0.71;
		textAnchor = "middle";
	} else {
		tickTransform = tickTransformY;
		x2 = sign * innerTickSize;
		y2 = 0;
		x = sign * tickSpacing;
		y = 0;
		dy = ".32em";
		canvas_dy = fontSize * 0.32;
		textAnchor = sign < 0 ? "end" : "start";
	}
	return {
		ticks,
		scale,
		tickTransform,
		tickStroke,
		tickStrokeOpacity,
		dy,
		canvas_dy,
		x,
		y,
		x2,
		y2,
		textAnchor,
		fontSize,
		fontFamily,
		format,
	};
};

AxisTicks.drawOnCanvasStatic = (props, ctx, xScale, yScale) => {
	props = { ...AxisTicks.defaultProps, ...props };
	const { orient } = props;
	const xAxis = orient === "bottom" || orient === "top";
	const result = AxisTicks.helper(props, xAxis ? xScale : yScale);

	const { tickStroke, tickStrokeOpacity, textAnchor, fontSize, fontFamily } = result;

	ctx.strokeStyle = hexToRGBA(tickStroke, tickStrokeOpacity);
	ctx.font = `${fontSize}px ${fontFamily}`;
	ctx.fillStyle = tickStroke;
	ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;

	result.ticks.forEach(tick => {
		Tick.drawOnCanvasStatic(tick, ctx, result);
	});
};

export default AxisTicks;
