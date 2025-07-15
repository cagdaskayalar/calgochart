import React, { Component } from "react";
import PropTypes from "prop-types";
import { nest as d3Nest } from "d3-collection";
import { merge } from "d3-array";
import { stack as d3Stack } from "d3-shape";
import GenericChartComponent from "../GenericChartComponent";
import { getAxisCanvas } from "../GenericComponent";
import { identity, hexToRGBA, head, functor, plotDataLengthBarWidth } from "../utils";

// ---------- Ana Component ----------
class StackedBarSeries extends Component {
	renderSVG = (moreProps) => {
		const { xAccessor } = moreProps;
		return <g>{svgHelper(this.props, moreProps, xAccessor, d3Stack)}</g>;
	};

	drawOnCanvas = (ctx, moreProps) => {
		const { xAccessor } = moreProps;
		drawOnCanvasHelper(ctx, this.props, moreProps, xAccessor, d3Stack);
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

StackedBarSeries.propTypes = {
	baseAt: PropTypes.oneOfType([PropTypes.number, PropTypes.func]).isRequired,
	direction: PropTypes.oneOf(["up", "down"]).isRequired,
	stroke: PropTypes.bool.isRequired,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.func]).isRequired,
	opacity: PropTypes.number.isRequired,
	fill: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
	className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
	clip: PropTypes.bool.isRequired,
	widthRatio: PropTypes.number,
	swapScales: PropTypes.bool,
};

StackedBarSeries.defaultProps = {
	baseAt: (xScale, yScale) => head(yScale.range()),
	direction: "up",
	className: "bar",
	stroke: true,
	fill: "#4682B4",
	opacity: 0.5,
	width: plotDataLengthBarWidth,
	widthRatio: 0.8,
	clip: true,
	swapScales: false,
};

// ---------- YARDIMCI FONKSÝYONLAR ----------

export const identityStack = () => {
	let keys = [];
	const stack = data =>
		keys.map((key, i) => {
			const arrays = data.map(d => {
				let array = [0, d[key]];
				array.data = d;
				return array;
			});
			arrays.key = key;
			arrays.index = i;
			return arrays;
		});
		stack.keys = function(x) {
			if (typeof x === "undefined") return keys;
			keys = x;
			return stack;
		};
	return stack;
};


export const rotateXY = array =>
	array.map(each => ({
		...each,
		x: each.y,
		y: each.x,
		height: each.width,
		width: each.height,
	}));

const convertToArray = item => (Array.isArray(item) ? item : [item]);

export function drawOnCanvasHelper(ctx, props, moreProps, xAccessor, stackFn, defaultPostAction = identity, postRotateAction = rotateXY) {
	const { xScale, chartConfig: { yScale }, plotData } = moreProps;
	const bars = doStuff(props, xAccessor, plotData, xScale, yScale, stackFn, postRotateAction, defaultPostAction);
	drawOnCanvas2(props, ctx, bars);
}

export function svgHelper(props, moreProps, xAccessor, stackFn, defaultPostAction = identity, postRotateAction = rotateXY) {
	const { xScale, chartConfig: { yScale }, plotData } = moreProps;
	const bars = doStuff(props, xAccessor, plotData, xScale, yScale, stackFn, postRotateAction, defaultPostAction);
	return getBarsSVG2(props, bars);
}

function doStuff(props, xAccessor, plotData, xScale, yScale, stackFn, postRotateAction, defaultPostAction) {
	const { yAccessor, swapScales } = props;
	const modifiedYAccessor = swapScales ? convertToArray(props.xAccessor) : convertToArray(yAccessor);
	const modifiedXAccessor = swapScales ? yAccessor : xAccessor;
	const modifiedXScale = swapScales ? yScale : xScale;
	const modifiedYScale = swapScales ? xScale : yScale;
	const postProcessor = swapScales ? postRotateAction : defaultPostAction;
	return getBars(props, modifiedXAccessor, modifiedYAccessor, modifiedXScale, modifiedYScale, plotData, stackFn, postProcessor);
}

export function getBarsSVG2(props, bars) {
	const { opacity } = props;
	return bars.map((d, idx) =>
		d.width <= 1
			? <line key={idx} className={d.className} stroke={d.fill} x1={d.x} y1={d.y} x2={d.x} y2={d.y + d.height} />
			: <rect key={idx} className={d.className} stroke={d.stroke} fill={d.fill} x={d.x} y={d.y} width={d.width} fillOpacity={opacity} height={d.height} />
	);
}

export function drawOnCanvas2(props, ctx, bars) {
	const { stroke } = props;
	const nest = d3Nest().key(d => d.fill).entries(bars);
	nest.forEach(outer => {
		const { key, values } = outer;
		if (head(values).width > 1) ctx.strokeStyle = key;
		const fillStyle = head(values).width <= 1 ? key : hexToRGBA(key, props.opacity);
		ctx.fillStyle = fillStyle;
		values.forEach(d => {
			if (d.width <= 1) {
				ctx.fillRect(d.x - 0.5, d.y, 1, d.height);
			} else {
				ctx.fillRect(d.x, d.y, d.width, d.height);
				if (stroke) ctx.strokeRect(d.x, d.y, d.width, d.height);
			}
		});
	});
}

export function getBars(props, xAccessor, yAccessor, xScale, yScale, plotData, stack = identityStack, after = identity) {
	const { baseAt, className, fill, stroke, spaceBetweenBar = 0 } = props;
	const getClassName = functor(className);
	const getFill = functor(fill);
	const getBase = functor(baseAt);
	const widthFunctor = functor(props.width);
	const width = widthFunctor(props, { xScale, xAccessor, plotData });
	const barWidth = Math.round(width);
	const eachBarWidth = (barWidth - spaceBetweenBar * (yAccessor.length - 1)) / yAccessor.length;
	const offset = barWidth === 1 ? 0 : 0.5 * width;

	const ds = plotData.map(each => {
		let d = { appearance: {}, x: xAccessor(each) };
		yAccessor.forEach((eachYAccessor, i) => {
			const key = `y${i}`;
			d[key] = eachYAccessor(each);
			const appearance = {
				className: getClassName(each, i),
				stroke: stroke ? getFill(each, i) : "none",
				fill: getFill(each, i),
			};
			d.appearance[key] = appearance;
		});
		return d;
	});

	const keys = yAccessor.map((_, i) => `y${i}`);
	const data = stack().keys(keys)(ds);

	const newData = data.map((each, i) =>
		each.map(d => {
			let array = [d[0], d[1]];
			array.data = { x: d.data.x, i, appearance: d.data.appearance[each.key] };
			return array;
		})
	);

	const bars = merge(newData).map(d => {
		let y = yScale(d[1]);
		let h = getBase(xScale, yScale, d.data) - yScale(d[1] - d[0]);
		if (h < 0) {
			y = y + h;
			h = -h;
		}
		return {
			...d.data.appearance,
			x: Math.round(xScale(d.data.x) - width / 2),
			y: y,
			groupOffset: Math.round(offset - (d.data.i > 0 ? (eachBarWidth + spaceBetweenBar) * d.data.i : 0)),
			groupWidth: Math.round(eachBarWidth),
			offset: Math.round(offset),
			height: h,
			width: barWidth,
		};
	}).filter(bar => !isNaN(bar.y));
	return after(bars);
}

export default StackedBarSeries;
