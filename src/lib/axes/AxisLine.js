import React from "react";
import PropTypes from "prop-types";
import { first, last, hexToRGBA } from "../utils";

// Fonksiyonel ve modern AxisLine component
function AxisLine({
	className,
	shapeRendering,
	orient,
	outerTickSize,
	fill,
	stroke,
	strokeWidth,
	opacity,
	range
}) {
	const sign = orient === "top" || orient === "left" ? -1 : 1;

	let d;
	if (orient === "bottom" || orient === "top") {
		d = `M${range[0]},${sign * outerTickSize}V0H${range[1]}V${sign * outerTickSize}`;
	} else {
		d = `M${sign * outerTickSize},${range[0]}H0V${range[1]}H${sign * outerTickSize}`;
	}

	return (
		<path
			className={className}
			shapeRendering={shapeRendering}
			d={d}
			fill={fill}
			opacity={opacity}
			stroke={stroke}
			strokeWidth={strokeWidth}
		/>
	);
}

AxisLine.propTypes = {
	className: PropTypes.string,
	shapeRendering: PropTypes.string,
	orient: PropTypes.string.isRequired,
	scale: PropTypes.func, // Art�k kullan�lm�yor, gerekirse kald�rabilirsin
	outerTickSize: PropTypes.number,
	fill: PropTypes.string,
	stroke: PropTypes.string,
	strokeWidth: PropTypes.number,
	opacity: PropTypes.number,
	range: PropTypes.array.isRequired,
};

AxisLine.defaultProps = {
	className: "calgo-stockcharts-axis-line",
	shapeRendering: "crispEdges",
	outerTickSize: 0,
	fill: "none",
	stroke: "#000000",
	strokeWidth: 1,
	opacity: 1,
};

// CANVAS statik fonksiyonu korunuyor
AxisLine.drawOnCanvasStatic = (props, ctx) => {
	props = { ...AxisLine.defaultProps, ...props };

	const { orient, outerTickSize, stroke, strokeWidth, opacity, range } = props;

	const sign = orient === "top" || orient === "left" ? -1 : 1;
	const xAxis = orient === "bottom" || orient === "top";

	ctx.lineWidth = strokeWidth;
	ctx.strokeStyle = hexToRGBA(stroke, opacity);

	ctx.beginPath();

	if (xAxis) {
		ctx.moveTo(first(range), sign * outerTickSize);
		ctx.lineTo(first(range), 0);
		ctx.lineTo(last(range), 0);
		ctx.lineTo(last(range), sign * outerTickSize);
	} else {
		ctx.moveTo(sign * outerTickSize, first(range));
		ctx.lineTo(0, first(range));
		ctx.lineTo(0, last(range));
		ctx.lineTo(sign * outerTickSize, last(range));
	}
	ctx.stroke();
};

export default AxisLine;
