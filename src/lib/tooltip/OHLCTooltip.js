import React from "react";
import PropTypes from "prop-types";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import displayValuesFor from "./displayValuesFor";
import GenericChartComponent from "../GenericChartComponent";
import { isDefined, functor } from "../utils";
import ToolTipText from "./ToolTipText";
import ToolTipTSpanLabel from "./ToolTipTSpanLabel";

const displayTextsDefault = {
	d: "Date: ",
	o: " O: ",
	h: " H: ",
	l: " L: ",
	c: " C: ",
	v: " Vol: ",
	na: "n/a"
};

const OHLCTooltip = ({
	displayValuesFor: displayValuesForProp,
	xDisplayFormat,
	accessor,
	volumeFormat,
	ohlcFormat,
	percentFormat,
	displayTexts,
	children,
	origin,
	...props
}) => {
	const renderSVG = (moreProps) => {
		const { chartConfig: { width, height }, displayXAccessor } = moreProps;
		const currentItem = displayValuesForProp(props, moreProps);

		let item = { open: displayTexts.na, high: displayTexts.na, low: displayTexts.na, close: displayTexts.na, volume: displayTexts.na };
		let displayDate = displayTexts.na, percent = displayTexts.na;
		if (isDefined(currentItem) && isDefined(accessor(currentItem))) {
			const d = accessor(currentItem);
			item = {
				open: ohlcFormat(d.open),
				high: ohlcFormat(d.high),
				low: ohlcFormat(d.low),
				close: ohlcFormat(d.close),
				volume: isDefined(d.volume) ? volumeFormat(d.volume) : displayTexts.na,
			};
			displayDate = xDisplayFormat(displayXAccessor(d));
			percent = percentFormat((d.close - d.open) / d.open);
		}

		const [x, y] = functor(origin)(width, height);

		return children(
			props, moreProps,
			{ ...item, displayDate, percent, x, y }
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

OHLCTooltip.propTypes = {
	className: PropTypes.string,
	accessor: PropTypes.func,
	xDisplayFormat: PropTypes.func,
	children: PropTypes.func,
	volumeFormat: PropTypes.func,
	percentFormat: PropTypes.func,
	ohlcFormat: PropTypes.func,
	origin: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	onClick: PropTypes.func,
	displayValuesFor: PropTypes.func,
	textFill: PropTypes.string,
	labelFill: PropTypes.string,
	displayTexts: PropTypes.object,
};

OHLCTooltip.defaultProps = {
	accessor: d => ({ date: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume }),
	xDisplayFormat: timeFormat("%Y-%m-%d"),
	volumeFormat: format(".4s"),
	percentFormat: format(".2%"),
	ohlcFormat: format(".2f"),
	displayValuesFor,
	origin: [0, 0],
	children: defaultDisplay,
	displayTexts: displayTextsDefault,
};

function defaultDisplay(props, moreProps, items) {
	const { className, textFill, labelFill, onClick, fontFamily, fontSize, displayTexts } = props;
	const { displayDate, open, high, low, close, volume, x, y } = items;
	return (
		<g
			className={`react-stockcharts-tooltip-hover ${className || ""}`}
			transform={`translate(${x}, ${y})`}
			onClick={onClick}
		>
			<ToolTipText x={0} y={0} fontFamily={fontFamily} fontSize={fontSize}>
				<ToolTipTSpanLabel fill={labelFill} x={0} dy="5">{displayTexts.d}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{displayDate}</tspan>
				<ToolTipTSpanLabel fill={labelFill}>{displayTexts.o}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{open}</tspan>
				<ToolTipTSpanLabel fill={labelFill}>{displayTexts.h}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{high}</tspan>
				<ToolTipTSpanLabel fill={labelFill}>{displayTexts.l}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{low}</tspan>
				<ToolTipTSpanLabel fill={labelFill}>{displayTexts.c}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{close}</tspan>
				<ToolTipTSpanLabel fill={labelFill}>{displayTexts.v}</ToolTipTSpanLabel>
				<tspan fill={textFill}>{volume}</tspan>
			</ToolTipText>
		</g>
	);
}

export default OHLCTooltip;
