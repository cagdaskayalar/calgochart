// src/lib/annotation/Label.js
// This module defines a Label component that renders text labels on a chart.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// Label.js

import React, { Component } from "react";
import PropTypes from "prop-types";
import GenericComponent from "../GenericComponent";

import { isDefined, hexToRGBA, functor } from "../utils";
import LabelAnnotation, { defaultProps, helper } from "./LabelAnnotation";

class Label extends Component {
	drawOnCanvas = (ctx, moreProps) => drawOnCanvas2(ctx, this.props, this.context, moreProps);

	renderSVG(moreProps) {
		const { chartConfig } = moreProps;
		return <LabelAnnotation yScale={getYScale(chartConfig)} {...this.props} text={getText(this.props)} />;
	}
	render() {
		return <GenericComponent
			canvasToDraw={this.props.selectCanvas}
			svgDraw={this.renderSVG.bind(this)}
			canvasDraw={this.drawOnCanvas}
			drawOn={[]}
		/>;
	}
}

function getText(props) {
	return functor(props.text)(props);
}

function getYScale(chartConfig) {
	return Array.isArray(chartConfig) ? undefined : chartConfig.yScale;
}

Label.propTypes = {
	className: PropTypes.string,
	selectCanvas: PropTypes.func,
	text: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.func
	]).isRequired,
	textAnchor: PropTypes.string,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	opacity: PropTypes.number,
	rotate: PropTypes.number,
	onClick: PropTypes.func,
	xAccessor: PropTypes.func,
	xScale: PropTypes.func,
	yScale: PropTypes.func,
	datum: PropTypes.object,
	x: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.func
	]),
	y: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.func
	])
};

Label.contextTypes = {
	canvasOriginX: PropTypes.number,
	canvasOriginY: PropTypes.number,

	margin: PropTypes.object.isRequired,
	ratio: PropTypes.number.isRequired,
};

Label.defaultProps = {
	...defaultProps,
	selectCanvas: canvases => canvases.bg,
};

function drawOnCanvas2(ctx, props, context, moreProps) {
	ctx.save();

	const { canvasOriginX, canvasOriginY, margin, ratio } = context;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(ratio, ratio);


	if (isDefined(canvasOriginX))
		ctx.translate(canvasOriginX, canvasOriginY);
	else
		ctx.translate(margin.left + (0.5 * ratio), margin.top + (0.5 * ratio));

	drawOnCanvas(ctx, props, moreProps);

	ctx.restore();

}

function drawOnCanvas(ctx, props, moreProps) {
	const { textAnchor, fontFamily, fontSize, opacity, rotate } = props;
	const { xScale, chartConfig, xAccessor } = moreProps;

	const { xPos, yPos, fill, text } = helper(props, xAccessor, xScale, getYScale(chartConfig));

	const radians = (rotate / 180) * Math.PI;
	ctx.save();
	ctx.translate(xPos, yPos);
	ctx.rotate(radians);

	ctx.font = `${ fontSize }px ${ fontFamily }`;
	ctx.fillStyle = hexToRGBA(fill, opacity);
	ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;

	ctx.beginPath();
	ctx.fillText(text, 0, 0);
	ctx.restore();
}


export default Label;
