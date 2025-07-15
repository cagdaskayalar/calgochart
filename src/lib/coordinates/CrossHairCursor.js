import React, { Component } from "react";
import PropTypes from "prop-types";
import GenericComponent, { getMouseCanvas } from "../GenericComponent";
import { hexToRGBA, isDefined, isNotDefined, strokeDashTypes, getStrokeDasharray } from "../utils";

class CrossHairCursor extends Component {
	static propTypes = {
		className: PropTypes.string,
		strokeDasharray: PropTypes.oneOf(strokeDashTypes),
	};
	static contextTypes = {
		margin: PropTypes.object.isRequired,
		ratio: PropTypes.number.isRequired,
	};

	static defaultProps = {
		stroke: "#000000",
		opacity: 0.3,
		strokeDasharray: "ShortDash",
		snapX: true,
		customX,
	};

	constructor(props) {
		super(props);
		this.renderSVG = this.renderSVG.bind(this);
		this.drawOnCanvas = this.drawOnCanvas.bind(this);
	}
	drawOnCanvas(ctx, moreProps) {
		const lines = helper(this.props, moreProps);
		if (isDefined(lines)) {
			const { margin, ratio } = this.context;
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.scale(ratio, ratio);
			ctx.translate(0.5 * ratio + margin.left, 0.5 * ratio + margin.top);
			lines.forEach(line => {
				ctx.strokeStyle = hexToRGBA(line.stroke, line.opacity);
				ctx.setLineDash(getStrokeDasharray(line.strokeDasharray).split(",").map(Number));
				ctx.beginPath();
				ctx.moveTo(line.x1, line.y1);
				ctx.lineTo(line.x2, line.y2);
				ctx.stroke();
			});
			ctx.restore();
		}
	}
	renderSVG(moreProps) {
		const { className } = this.props;
		const lines = helper(this.props, moreProps);
		if (isNotDefined(lines)) return null;
		return (
			<g className={`react-stockcharts-crosshair ${className || ""}`}>
				{lines.map(({ strokeDasharray, ...rest }, idx) =>
					<line key={idx} strokeDasharray={getStrokeDasharray(strokeDasharray)} {...rest} />
				)}
			</g>
		);
	}
	render() {
		return (
			<GenericComponent
				svgDraw={this.renderSVG}
				clip={false}
				canvasDraw={this.drawOnCanvas}
				canvasToDraw={getMouseCanvas}
				drawOn={["mousemove", "pan", "drag"]}
			/>
		);
	}
}

// X noktas� snap mi, mouse mu? (default: snapX)
function customX(props, moreProps) {
	const { xScale, xAccessor, currentItem, mouseXY } = moreProps;
	return props.snapX
		? Math.round(xScale(xAccessor(currentItem)))
		: mouseXY[0];
}

// 2 �izgi d�nd�r (horizontal, vertical)
function helper(props, moreProps) {
	const { mouseXY, currentItem, show, height, width } = moreProps;
	const { customX, stroke, opacity, strokeDasharray } = props;
	if (!show || isNotDefined(currentItem)) return null;

	const line1 = { x1: 0, x2: width, y1: mouseXY[1], y2: mouseXY[1], stroke, strokeDasharray, opacity };
	const x = customX(props, moreProps);
	const line2 = { x1: x, x2: x, y1: 0, y2: height, stroke, strokeDasharray, opacity };
	return [line1, line2];
}

export default CrossHairCursor;
