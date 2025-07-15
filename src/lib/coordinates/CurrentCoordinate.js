import React, { Component } from "react";
import PropTypes from "prop-types";
import GenericChartComponent from "../GenericChartComponent";
import { isNotDefined } from "../utils";
import { getMouseCanvas } from "../GenericComponent";

class CurrentCoordinate extends Component {
	static propTypes = {
		yAccessor: PropTypes.func,
		r: PropTypes.number.isRequired,
		className: PropTypes.string,
		fill: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
	};
	static defaultProps = {
		r: 3,
		className: "react-stockcharts-current-coordinate",
		fill: "#000"
	};
	constructor(props) {
		super(props);
		this.renderSVG = this.renderSVG.bind(this);
		this.drawOnCanvas = this.drawOnCanvas.bind(this);
	}
	drawOnCanvas(ctx, moreProps) {
		const circle = helper(this.props, moreProps);
		if (!circle) return;
		ctx.fillStyle = typeof circle.fill === "function" ? circle.fill(moreProps.currentItem) : circle.fill;
		ctx.beginPath();
		ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
		ctx.fill();
	}
	renderSVG(moreProps) {
		const { className } = this.props;
		const circle = helper(this.props, moreProps);
		if (!circle) return null;
		const fillColor = typeof circle.fill === "function" ? circle.fill(moreProps.currentItem) : circle.fill;
		return <circle className={className} cx={circle.x} cy={circle.y} r={circle.r} fill={fillColor} />;
	}
	render() {
		return (
			<GenericChartComponent
				svgDraw={this.renderSVG}
				canvasDraw={this.drawOnCanvas}
				canvasToDraw={getMouseCanvas}
				drawOn={["mousemove", "pan"]}
			/>
		);
	}
}

function helper(props, moreProps) {
	const { fill, yAccessor, r } = props;
	const { show, xScale, chartConfig: { yScale }, currentItem, xAccessor } = moreProps;
	if (!show || isNotDefined(currentItem)) return null;
	const xValue = xAccessor(currentItem);
	const yValue = yAccessor(currentItem);
	if (isNotDefined(yValue)) return null;
	const x = Math.round(xScale(xValue));
	const y = Math.round(yScale(yValue));
	return { x, y, r, fill };
}

export default CurrentCoordinate;
