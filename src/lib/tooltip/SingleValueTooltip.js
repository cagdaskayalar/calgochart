// src/lib/tooltip/SingleValueTooltip.js
// This module defines a SingleValueTooltip component that displays a single value tooltip for chart data.
// It allows for customizable display formats, labels, and styles, and is optimized for performance using a PureComponent approach.
// SingleValueTooltip.js

import React from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import displayValuesFor from "./displayValuesFor";
import GenericChartComponent from "../GenericChartComponent";
import ToolTipText from "./ToolTipText";
import ToolTipTSpanLabel from "./ToolTipTSpanLabel";
import { isDefined, identity, noop, functor } from "../utils";

const SingleValueTooltip = ({
	xDisplayFormat,
	yDisplayFormat,
	xLabel,
	yLabel,
	labelFill,
	valueFill,
	origin,
	className,
	fontFamily,
	fontSize,
	onClick,
	displayValuesFor: displayValuesForProp,
	xAccessor,
	yAccessor,
}) => {
	const renderSVG = moreProps => {
		const { chartConfig: { width, height } } = moreProps;
		const currentItem = displayValuesForProp({ xAccessor, yAccessor }, moreProps);
		const [x, y] = functor(origin)(width, height);

		const xValue = isDefined(currentItem) && isDefined(xAccessor(currentItem))
			? xDisplayFormat(xAccessor(currentItem))
			: "n/a";
		const yValue = isDefined(currentItem) && isDefined(yAccessor(currentItem))
			? yDisplayFormat(yAccessor(currentItem))
			: "n/a";
		const label = typeof yLabel === "function" ? yLabel(currentItem) : yLabel;

		return (
			<g className={className} transform={`translate(${x},${y})`} onClick={onClick}>
				<ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize}>
					{xLabel && (
						<>
							<ToolTipTSpanLabel x={0} dy="5" fill={labelFill}>{xLabel + ": "}</ToolTipTSpanLabel>
							<tspan fill={valueFill}>{xValue + " "}</tspan>
						</>
					)}
					<ToolTipTSpanLabel fill={labelFill}>{label + ": "}</ToolTipTSpanLabel>
					<tspan fill={valueFill}>{yValue}</tspan>
				</ToolTipText>
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
};

SingleValueTooltip.propTypes = {
	xDisplayFormat: PropTypes.func,
	yDisplayFormat: PropTypes.func.isRequired,
	xLabel: PropTypes.string,
	yLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
	labelFill: PropTypes.string.isRequired,
	valueFill: PropTypes.string,
	origin: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
	className: PropTypes.string,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	onClick: PropTypes.func,
	displayValuesFor: PropTypes.func,
	xAccessor: PropTypes.func,
	yAccessor: PropTypes.func,
};

SingleValueTooltip.defaultProps = {
	origin: [0, 0],
	labelFill: "#4682B4",
	valueFill: "#000000",
	yDisplayFormat: format(".2f"),
	displayValuesFor,
	xAccessor: noop,
	yAccessor: identity,
	className: "calgo-stockcharts-tooltip",
};

export default SingleValueTooltip;
