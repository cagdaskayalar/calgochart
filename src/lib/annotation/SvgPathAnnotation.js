import React from "react";
import PropTypes from "prop-types";
import { functor } from "../utils";

function SvgPathAnnotation({
	className = "calgo-stockcharts-svgpathannotation",
	path,
	x,
	y,
	fill,
	stroke,
	opacity = 1,
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
	const color = functor(fill)(datum);
	const title = functor(tooltip)(datum);

	const handleClick = e => {
		if (onClick) onClick({ xScale, yScale, datum }, e);
	};

	return (
		<g className={className} onClick={handleClick}>
			{title ? <title>{title}</title> : null}
			<path d={path({ x: xPos, y: yPos })} stroke={stroke} fill={color} opacity={opacity} />
		</g>
	);
}

SvgPathAnnotation.propTypes = {
	className: PropTypes.string,
	path: PropTypes.func.isRequired,
	onClick: PropTypes.func,
	xAccessor: PropTypes.func,
	xScale: PropTypes.func,
	yScale: PropTypes.func,
	datum: PropTypes.object,
	stroke: PropTypes.string,
	fill: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	opacity: PropTypes.number,
	tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	x: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	y: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
	plotData: PropTypes.array,
};

SvgPathAnnotation.defaultProps = {
	className: "calgo-stockcharts-svgpathannotation",
	opacity: 1,
	x: ({ xScale, xAccessor, datum }) => xScale(xAccessor(datum)),
};

export default SvgPathAnnotation;
