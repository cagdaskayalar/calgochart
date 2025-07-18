// src/lib/annotation/LabelAnnotation.js
// This module defines a LabelAnnotation component that renders text labels on a chart.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// LabelAnnotation.js

import React from "react";
import PropTypes from "prop-types";
import { functor } from "../utils";

function LabelAnnotation({
	className = "calgo-stockcharts-labelannotation",
	text = "",
	textAnchor = "middle",
	fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize = 12,
	opacity = 1,
	rotate = 0,
	x,
	y,
	fill = "#000",
	tooltip,
	onClick,
	xAccessor,
	xScale,
	yScale,
	datum,
	plotData
}) {
	const xPos = functor(x)({ xScale, xAccessor, datum, plotData });
	const yPos = functor(y)({ yScale, datum, plotData });
	const value = functor(text)(datum);
	const color = functor(fill)(datum);
	const title = functor(tooltip)(datum);

	const handleClick = e => {
		if (onClick) onClick({ xScale, yScale, datum }, e);
	};

	return (
		<g className={className}>
			{title ? <title>{title}</title> : null}
			<text
				x={xPos}
				y={yPos}
				fontFamily={fontFamily}
				fontSize={fontSize}
				fill={color}
				opacity={opacity}
				transform={`rotate(${rotate},${xPos},${yPos})`}
				onClick={handleClick}
				textAnchor={textAnchor}
			>
				{value}
			</text>
		</g>
	);
}

LabelAnnotation.propTypes = {
	className: PropTypes.string,
	text: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
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
	x: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	y: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	fill: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	plotData: PropTypes.array,
};

LabelAnnotation.defaultProps = {
	className: "calgo-stockcharts-labelannotation",
	textAnchor: "middle",
	fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize: 12,
	fill: "#000",
	opacity: 1,
	rotate: 0,
	x: ({ xScale, xAccessor, datum }) => xScale(xAccessor(datum)),
};

export default LabelAnnotation;
