// src/lib/annotation/Annotate.js
// This module defines an Annotate component that renders annotations on a chart.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// Annotate.js

import React, { Component } from "react";
import PropTypes from "prop-types";

import GenericChartComponent from "../GenericChartComponent";

class Annotate extends Component {
	constructor(props) {
		super(props);
		this.renderSVG = this.renderSVG.bind(this);
	}
	render() {
		return <GenericChartComponent
			svgDraw={this.renderSVG}
			drawOn={["pan"]}
		/>;
	}
	renderSVG(moreProps) {
		const { xAccessor } = moreProps;
		const { xScale, chartConfig: { yScale }, plotData } = moreProps;

		const { className, usingProps, with: Annotation } = this.props;
		const data = helper(this.props, plotData);

		return (
			<g className={`calgo-stockcharts-enable-interaction ${className}`}>
				{data.map((d, idx) => <Annotation key={idx}
					{...usingProps}
					xScale={xScale}
					yScale={yScale}
					xAccessor={xAccessor}
					plotData={plotData}
					datum={d} />)}
			</g>
		);
	}
}

Annotate.propTypes = {
	className: PropTypes.string,
	with: PropTypes.func,
	when: PropTypes.func,
	usingProps: PropTypes.object,
};

Annotate.defaultProps = {
	className: "calgo-stockcharts-annotate calgo-stockcharts-default-cursor",
};

function helper({ when }, plotData) {
	return plotData.filter(when);
}

export default Annotate;
