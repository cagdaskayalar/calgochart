// src/lib/tooltip/GroupTooltip.js
// This module defines a GroupTooltip component that displays multiple tooltips in a group format.
// It allows for flexible layouts, custom formatting, and interaction handling in React applications.
// GroupTooltip.js

import React from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import displayValuesFor from "./displayValuesFor";
import GenericChartComponent from "../GenericChartComponent";
import ToolTipText from "./ToolTipText";
import ToolTipTSpanLabel from "./ToolTipTSpanLabel";

// ---- Tekil Tooltip sat�r� (Fonksiyonel!) ----
function SingleTooltip({
	origin, yLabel, yValue, labelFill, valueFill, withShape, fontFamily, fontSize,
	layout, onClick, options, forChart
}) {
	const handleClick = e => {
		if (onClick) onClick({ chartId: forChart, ...options }, e);
	};

	if (layout === "horizontalInline") {
		return (
			<tspan onClick={handleClick} fontFamily={fontFamily} fontSize={fontSize}>
				<ToolTipTSpanLabel fill={labelFill}>{yLabel}:&nbsp;</ToolTipTSpanLabel>
				<tspan fill={valueFill}>{yValue}&nbsp;&nbsp;</tspan>
			</tspan>
		);
	}
	if (layout === "horizontalRows" || layout === "verticalRows") {
		return (
			<g transform={`translate(${origin[0]},${origin[1]})`} onClick={handleClick}>
				{withShape ? <line x1={0} y1={2} x2={0} y2={28} stroke={valueFill} strokeWidth="4px" /> : null}
				<ToolTipText x={5} y={11} fontFamily={fontFamily} fontSize={fontSize}>
					<ToolTipTSpanLabel fill={labelFill}>{yLabel}</ToolTipTSpanLabel>
					<tspan x="5" dy="15" fill={valueFill}>{yValue}</tspan>
				</ToolTipText>
			</g>
		);
	}
	// horizontal, vertical, default
	return (
		<g transform={`translate(${origin[0]},${origin[1]})`} onClick={handleClick}>
			{withShape ? <rect x="0" y="-6" width="6" height="6" fill={valueFill} /> : null}
			<ToolTipText x={withShape ? 8 : 0} y={0} fontFamily={fontFamily} fontSize={fontSize}>
				<ToolTipTSpanLabel fill={labelFill}>{yLabel}: </ToolTipTSpanLabel>
				<tspan fill={valueFill}>{yValue}</tspan>
			</ToolTipText>
		</g>
	);
}

const VALID_LAYOUTS = [
	"horizontal", "horizontalRows", "horizontalInline", "vertical", "verticalRows"
];

SingleTooltip.propTypes = {
	origin: PropTypes.array.isRequired,
	yLabel: PropTypes.string.isRequired,
	yValue: PropTypes.string.isRequired,
	labelFill: PropTypes.string.isRequired,
	valueFill: PropTypes.string.isRequired,
	withShape: PropTypes.bool,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	layout: PropTypes.oneOf(VALID_LAYOUTS).isRequired,
	onClick: PropTypes.func,
	options: PropTypes.object.isRequired,
	forChart: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};
SingleTooltip.defaultProps = {
	labelFill: "#4682B4",
	valueFill: "#000000",
	withShape: false,
};

// ---- Grup Tooltip ana component (Fonksiyonel) ----
function GroupTooltip({
	className = "calgo-stockcharts-tooltip calgo-stockcharts-group-tooltip",
	layout = "horizontal",
	position,
	displayFormat = format(".2f"),
	origin = [0, 0],
	displayValuesFor: displayValuesForProp = displayValuesFor,  // ALIAS!
	onClick,
	fontFamily,
	fontSize,
	width = 60,
	verticalSize = 13,
	options = [],
	...rest
}) {
	const renderSVG = moreProps => {
		const { chartId, chartConfig } = moreProps;
		const currentItem = displayValuesForProp(rest, moreProps);

		const dx = 20, dy = 40;
		let xyPos, textAnchor;
		const { height, width: chartWidth } = chartConfig;

		switch (position) {
			case "topRight":    xyPos = [chartWidth - dx, null]; textAnchor = "end"; break;
			case "bottomLeft":  xyPos = [null, height - dy]; break;
			case "bottomRight": xyPos = [chartWidth - dx, height - dy]; textAnchor = "end"; break;
			default:            xyPos = [null, null];
		}
		const xPos = xyPos[0] != null ? xyPos[0] : origin[0];
		const yPos = xyPos[1] != null ? xyPos[1] : origin[1];

		const singleTooltip = options.map((each, idx) => {
			const yValue = currentItem && each.yAccessor(currentItem);
			const yDisplayValue = yValue != null ? displayFormat(yValue) : "n/a";
			let compOrigin;
			if (layout === "horizontal" || layout === "horizontalRows")
				compOrigin = [width * idx, 0];
			else if (layout === "vertical")
				compOrigin = [0, verticalSize * idx];
			else if (layout === "verticalRows")
				compOrigin = [0, verticalSize * 2.3 * idx];
			else
				compOrigin = [0, 0];

			return (
				<SingleTooltip
					key={idx}
					layout={layout}
					origin={compOrigin}
					yLabel={each.yLabel}
					yValue={yDisplayValue}
					options={each}
					forChart={chartId}
					onClick={onClick}
					fontFamily={fontFamily}
					fontSize={fontSize}
					labelFill={each.labelFill || "#4682B4"}
					valueFill={each.valueFill || "#000"}
					withShape={each.withShape}
				/>
			);
		});

		return (
			<g transform={`translate(${xPos},${yPos})`} className={className} textAnchor={textAnchor}>
				{layout === "horizontalInline"
					? <ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize}>{singleTooltip}</ToolTipText>
					: singleTooltip}
			</g>
		);
	};

	return (
		<GenericChartComponent
			clip={false}
			svgDraw={renderSVG}
			drawOn={["mousemove"]}
		/>
	);
}

GroupTooltip.propTypes = {
	className: PropTypes.string,
	layout: PropTypes.oneOf(VALID_LAYOUTS).isRequired,
	position: PropTypes.oneOf(["topRight", "bottomLeft", "bottomRight"]),
	displayFormat: PropTypes.func,
	origin: PropTypes.array.isRequired,
	displayValuesFor: PropTypes.func,
	onClick: PropTypes.func,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	width: PropTypes.number,
	verticalSize: PropTypes.number,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			yLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
			yAccessor: PropTypes.func.isRequired,
			labelFill: PropTypes.string,
			valueFill: PropTypes.string,
			withShape: PropTypes.bool,
		})
	),
};
GroupTooltip.defaultProps = {
	className: "calgo-stockcharts-tooltip calgo-stockcharts-group-tooltip",
	layout: "horizontal",
	displayFormat: format(".2f"),
	displayValuesFor: displayValuesFor,
	origin: [0, 0],
	width: 60,
	verticalSize: 13,
};

export default GroupTooltip;
