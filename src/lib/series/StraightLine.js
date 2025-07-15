import React from "react";
import PropTypes from "prop-types";
import { hexToRGBA, isDefined, isNotDefined, strokeDashTypes, getStrokeDasharray } from "../utils";
import GenericChartComponent from "../GenericChartComponent";
import { getAxisCanvas } from "../GenericComponent";

const getLineCoordinates = (type, xScale, yScale, xValue, yValue, width, height) =>
	type === "horizontal"
		? { x1: 0, y1: Math.round(yScale(yValue)), x2: width, y2: Math.round(yScale(yValue)) }
		: { x1: Math.round(xScale(xValue)), y1: 0, x2: Math.round(xScale(xValue)), y2: height };

const StraightLine = (props) => {
	const renderSVG = (moreProps) => {
		const { width, height, xScale, chartConfig: { yScale } } = moreProps;
		const { className, type, stroke, strokeWidth, opacity, strokeDasharray, yValue, xValue } = props;
		const lineCoords = getLineCoordinates(type, xScale, yScale, xValue, yValue, width, height);

		return (
			<line
				className={className}
				strokeDasharray={getStrokeDasharray(strokeDasharray)}
				stroke={stroke}
				strokeWidth={strokeWidth}
				strokeOpacity={opacity}
				{...lineCoords}
			/>
		);
	};

	const drawOnCanvas = (ctx, moreProps) => {
		const { type, stroke, strokeWidth, opacity, strokeDasharray, yValue, xValue } = props;
		const { xScale, chartConfig: { yScale, width, height } } = moreProps;
		const { x1, y1, x2, y2 } = getLineCoordinates(type, xScale, yScale, xValue, yValue, width, height);

		ctx.beginPath();
		ctx.strokeStyle = hexToRGBA(stroke, opacity);
		ctx.lineWidth = strokeWidth;
		ctx.setLineDash(getStrokeDasharray(strokeDasharray).split(","));
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
	};

	return (
		<GenericChartComponent
			svgDraw={renderSVG}
			canvasDraw={drawOnCanvas}
			canvasToDraw={getAxisCanvas}
			drawOn={["pan"]}
		/>
	);
};

StraightLine.propTypes = {
	className: PropTypes.string,
	type: PropTypes.oneOf(["vertical", "horizontal"]),
	stroke: PropTypes.string,
	strokeWidth: PropTypes.number,
	strokeDasharray: PropTypes.oneOf(strokeDashTypes),
	opacity: PropTypes.number.isRequired,
	yValue: (props, propName) => {
		if (props.type === "vertical" && isDefined(props[propName])) return new Error("Do not define `yValue` when type is `vertical`, define the `xValue` prop");
		if (props.type === "horizontal" && isNotDefined(props[propName])) return new Error("when type = `horizontal` `yValue` is required");
	},
	xValue: (props, propName) => {
		if (props.type === "horizontal" && isDefined(props[propName])) return new Error("Do not define `xValue` when type is `horizontal`, define the `yValue` prop");
		if (props.type === "vertical" && isNotDefined(props[propName])) return new Error("when type = `vertical` `xValue` is required");
	},
};

StraightLine.defaultProps = {
	className: "line ",
	type: "horizontal",
	stroke: "#000000",
	opacity: 0.5,
	strokeWidth: 1,
	strokeDasharray: "Solid",
};

export default StraightLine;
