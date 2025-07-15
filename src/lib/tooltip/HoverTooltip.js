import React from "react";
import PropTypes from "prop-types";
import GenericComponent from "../GenericComponent";
import { sum } from "d3-array";
import { first, last, isNotDefined, isDefined, hexToRGBA } from "../utils";

const PADDING = 5, X = 10, Y = 10;

// ------- Tooltip Main Component -------
const HoverTooltip = ({
	yAccessor,
	tooltipSVG = tooltipSVGDefault,
	tooltipCanvas = tooltipCanvasDefault,
	backgroundShapeSVG = backgroundShapeSVGDefault,
	backgroundShapeCanvas = backgroundShapeCanvasDefault,
	bgFill = "#D4E2FD",
	bgOpacity = 0.5,
	fill = "#D4E2FD",
	stroke = "#9B9BFF",
	fontFill = "#000",
	opacity = 0.8,
	fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize = 12,
	bgwidth, bgheight,
	tooltipContent,
	origin = defaultOrigin,
	...props
}) => {
	// Helper to extract pointer and content information
	const getPointer = (moreProps, ctx) => {
		const { show, xScale, currentItem, plotData, xAccessor, displayXAccessor } = moreProps;
		if (!show || isNotDefined(currentItem)) return;

		const xValue = xAccessor(currentItem);
		if (isNotDefined(xValue)) return;

		const content = tooltipContent({ currentItem, xAccessor: displayXAccessor });
		const centerX = xScale(xValue);
		const pointWidth =
			Math.abs(xScale(xAccessor(last(plotData))) - xScale(xAccessor(first(plotData)))) /
			(plotData.length - 1);
		const bgSize = calculateTooltipSize({ fontFamily, fontSize, fontFill }, content, ctx);
		const [x, y] = origin({ yAccessor }, moreProps, bgSize, pointWidth);
		return { x, y, content, centerX, pointWidth, bgSize };
	};

	const renderSVG = (moreProps) => {
		const pointer = getPointer(moreProps);
		if (isNotDefined(pointer)) return null;
		const { height } = moreProps;
		const { x, y, content, centerX, pointWidth, bgSize } = pointer;
		const bgShape =
			isDefined(bgwidth) && isDefined(bgheight)
				? { width: bgwidth, height: bgheight }
				: bgSize;
		return (
			<g>
				<rect
					x={centerX - pointWidth / 2}
					y={0}
					width={pointWidth}
					height={height}
					fill={bgFill}
					opacity={bgOpacity}
				/>
				<g className="react-stockcharts-tooltip-content" transform={`translate(${x},${y})`}>
					{backgroundShapeSVG({ fill, stroke, opacity }, bgShape)}
					{tooltipSVG({ fontFamily, fontSize, fontFill }, content)}
				</g>
			</g>
		);
	};

	const drawOnCanvas = (ctx, moreProps) => {
		const pointer = getPointer(moreProps, ctx);
		const { height } = moreProps;
		if (isNotDefined(pointer)) return;
		drawOnCanvasImpl(ctx, { ...props, bgFill, bgOpacity, fill, stroke, opacity, fontFamily, fontSize }, pointer, height);
	};

	return (
		<GenericComponent
			svgDraw={renderSVG}
			canvasDraw={drawOnCanvas}
			drawOn={["mousemove", "pan"]}
		/>
	);
};

// ------- Helper/Draw Functions -------
function backgroundShapeSVGDefault({ fill, stroke, opacity }, { width, height }) {
	return (
		<rect
			width={width}
			height={height}
			fill={fill}
			opacity={opacity}
			stroke={stroke}
		/>
	);
}
function tooltipSVGDefault({ fontFamily, fontSize, fontFill }, content) {
	const tspans = [];
	const startY = Y + fontSize * 0.9;
	for (let i = 0; i < content.y.length; i++) {
		const y = content.y[i];
		const textY = startY + fontSize * (i + 1);
		tspans.push(
			<tspan key={`L-${i}`} x={X} y={textY} fill={y.stroke}>
				{y.label}
			</tspan>
		);
		tspans.push(<tspan key={i}>: </tspan>);
		tspans.push(<tspan key={`V-${i}`}>{y.value}</tspan>);
	}
	return (
		<text fontFamily={fontFamily} fontSize={fontSize} fill={fontFill}>
			<tspan x={X} y={startY}>
				{content.x}
			</tspan>
			{tspans}
		</text>
	);
}
function backgroundShapeCanvasDefault({ fill, stroke, opacity }, { width, height }, ctx) {
	ctx.fillStyle = hexToRGBA(fill, opacity);
	ctx.strokeStyle = stroke;
	ctx.beginPath();
	ctx.rect(0, 0, width, height);
	ctx.fill();
	ctx.stroke();
}
function tooltipCanvasDefault({ fontFamily, fontSize, fontFill }, content, ctx) {
	const startY = Y + fontSize * 0.9;
	ctx.font = `${fontSize}px ${fontFamily}`;
	ctx.fillStyle = fontFill;
	ctx.textAlign = "left";
	ctx.fillText(content.x, X, startY);

	for (let i = 0; i < content.y.length; i++) {
		const y = content.y[i];
		const textY = startY + fontSize * (i + 1);
		ctx.fillStyle = y.stroke || fontFill;
		ctx.fillText(y.label, X, textY);
		ctx.fillStyle = fontFill;
		ctx.fillText(": " + y.value, X + ctx.measureText(y.label).width, textY);
	}
}
function drawOnCanvasImpl(ctx, props, pointer, height) {
	const { bgFill, bgOpacity, fill, stroke, opacity, fontFamily, fontSize } = props;
	const { backgroundShapeCanvas = backgroundShapeCanvasDefault, tooltipCanvas = tooltipCanvasDefault } = props;
	const { x, y, content, centerX, pointWidth, bgSize } = pointer;
	ctx.save();
	ctx.globalAlpha = 1;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.translate(0, 0);
	ctx.fillStyle = hexToRGBA(bgFill, bgOpacity);
	ctx.beginPath();
	ctx.rect(centerX - pointWidth / 2, 0, pointWidth, height);
	ctx.fill();
	ctx.translate(x, y);
	backgroundShapeCanvas({ fill, stroke, opacity }, bgSize, ctx);
	tooltipCanvas({ fontFamily, fontSize, fontFill: props.fontFill || "#000" }, content, ctx);
	ctx.restore();
}
function calculateTooltipSize({ fontFamily, fontSize, fontFill }, content, ctx) {
	if (isNotDefined(ctx)) {
		const canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
	}
	ctx.font = `${fontSize}px ${fontFamily}`;
	ctx.fillStyle = fontFill;
	ctx.textAlign = "left";
	const measureText = (str) => ({
		width: ctx.measureText(str).width,
		height: fontSize,
	});
	const { width, height } = content.y
		.map(({ label, value }) => measureText(`${label}: ${value}`))
		.reduce((res, size) => sumSizes(res, size), measureText(String(content.x)));
	return { width: width + 2 * X, height: height + 2 * Y };
}
function sumSizes(...sizes) {
	return {
		width: Math.max(...sizes.map((size) => size.width)),
		height: sum(sizes, (d) => d.height),
	};
}
function normalizeX(x, bgSize, pointWidth, width) {
	return x < width / 2
		? x + pointWidth / 2 + PADDING
		: x - bgSize.width - pointWidth / 2 - PADDING;
}
function normalizeY(y, bgSize) {
	return y - bgSize.height <= 0
		? y + PADDING
		: y - bgSize.height - PADDING;
}
function defaultOrigin(props, moreProps, bgSize, pointWidth) {
	const { yAccessor } = props;
	const { mouseXY, xAccessor, currentItem, xScale, chartConfig, width } = moreProps;
	let y = last(mouseXY);
	const xValue = xAccessor(currentItem);
	let x = Math.round(xScale(xValue));
	if (
		isDefined(yAccessor) &&
		isDefined(chartConfig) &&
		isDefined(chartConfig.findIndex)
	) {
		const yValue = yAccessor(currentItem);
		const chartIndex = chartConfig.findIndex((x) => x.id === props.chartId);
		y = Math.round(chartConfig[chartIndex].yScale(yValue));
	}
	x = normalizeX(x, bgSize, pointWidth, width);
	y = normalizeY(y, bgSize);
	return [x, y];
}

// ------- PropTypes -------
HoverTooltip.propTypes = {
	chartId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	yAccessor: PropTypes.func,
	tooltipSVG: PropTypes.func,
	backgroundShapeSVG: PropTypes.func,
	bgwidth: PropTypes.number,
	bgheight: PropTypes.number,
	bgFill: PropTypes.string,
	bgOpacity: PropTypes.number,
	tooltipContent: PropTypes.func.isRequired,
	origin: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
};

export default HoverTooltip;
