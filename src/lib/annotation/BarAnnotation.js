import React from "react";
import PropTypes from "prop-types";
import { functor } from "../utils";

// --- Fonksiyonel BarAnnotation ---
const BarAnnotation = React.memo((props) => {
	const {
		className, stroke, opacity, path,
		text, textXOffset, textYOffset, textAnchor,
		fontFamily, fontSize, textFill, textOpacity, textRotate,
		xAccessor, xScale, yScale,
		textIcon, textIconFontSize, textIconFill, textIconOpacity, textIconRotate, textIconXOffset, textIconYOffset,
		datum, fill, tooltip, plotData, onClick
	} = props;

	const handleClick = e => {
		if (onClick) onClick({ xScale, yScale, datum }, e);
	};

	const xFunc = functor(props.x);
	const yFunc = functor(props.y);
	const [x, y] = [
		xFunc({ xScale, xAccessor, datum, plotData }),
		yFunc ? yFunc({ yScale, datum, plotData }) : 0
	];

	return (
		<g className={className} onClick={handleClick}>
			{tooltip ? <title>{functor(tooltip)(datum)}</title> : null}
			{text && (
				<text
					x={x} y={y}
					dx={textXOffset} dy={textYOffset}
					fontFamily={fontFamily} fontSize={fontSize}
					fill={textFill} opacity={textOpacity}
					transform={textRotate ? `rotate(${textRotate}, ${x}, ${y})` : undefined}
					textAnchor={textAnchor}
				>{text}</text>
			)}
			{textIcon && (
				<text
					x={x} y={y}
					dx={textIconXOffset} dy={textIconYOffset}
					fontSize={textIconFontSize} fill={textIconFill}
					opacity={textIconOpacity}
					transform={textIconRotate ? `rotate(${textIconRotate}, ${x}, ${y})` : undefined}
					textAnchor={textAnchor}
				>{textIcon}</text>
			)}
			{path && (
				<path d={path({ x, y })} stroke={stroke} fill={functor(fill)(datum)} opacity={opacity} />
			)}
		</g>
	);
});

BarAnnotation.propTypes = {
	className: PropTypes.string,
	path: PropTypes.func,
	onClick: PropTypes.func,
	xAccessor: PropTypes.func,
	xScale: PropTypes.func,
	yScale: PropTypes.func,
	datum: PropTypes.object,
	stroke: PropTypes.string,
	fill: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	opacity: PropTypes.number,
	text: PropTypes.string,
	textAnchor: PropTypes.string,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	textOpacity: PropTypes.number,
	textFill: PropTypes.string,
	textRotate: PropTypes.number,
	textXOffset: PropTypes.number,
	textYOffset: PropTypes.number,
	textIcon: PropTypes.string,
	textIconFontSize: PropTypes.number,
	textIconOpacity: PropTypes.number,
	textIconFill: PropTypes.string,
	textIconRotate: PropTypes.number,
	textIconXOffset: PropTypes.number,
	textIconYOffset: PropTypes.number,
	textIconAnchor: PropTypes.string,
	y: PropTypes.func,
	x: PropTypes.func,
	tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	plotData: PropTypes.array
};

BarAnnotation.defaultProps = {
	className: "calgo-stockcharts-bar-annotation",
	opacity: 1,
	fill: "#000250",
	textAnchor: "middle",
	fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize: 10,
	textFill: "#000000",
	textOpacity: 1,
	textIconFill: "#000000",
	textIconFontSize: 10,
	x: ({ xScale, xAccessor, datum }) => xScale(xAccessor(datum)),
	y: () => 0,
};

export function getArrowForTextIcon(type) {
	const arrows = {
		simpleUp: "?",
		simpleDown: "?",
		fatUp: "?",
		fatDown: "?",
		lightUp: "?",
		lightDown: "?",
		dashedUp: "?",
		dashedDown: "?",
		dashedRight: "?",
		fatRight: "?",
		right: "?"
	};
	return arrows[type];
}

export default BarAnnotation;
