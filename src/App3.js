// src/App.js

import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";

import { ChartCanvas, Chart } from "./lib";
import { OHLCSeries } from "./lib/series";
import { XAxis, YAxis } from "./lib/axes";
import { CrossHairCursor, EdgeIndicator, MouseCoordinateX, MouseCoordinateY } from "./lib/coordinates";

import { discontinuousTimeScaleProvider } from "./lib/scale";
import { OHLCTooltip } from "./lib/tooltip";
import { fitWidth } from "./lib/helper";
import { last } from "./lib/utils";

class OHLCChart extends React.Component {
	render() {		

		const height = 650;
		const { type, data: initialData, width, ratio } = this.props;
		
		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);
		
		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const gridHeight = height - margin.top - margin.bottom;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		return (
			<ChartCanvas height={650} width={width} ratio={ratio} margin={margin} type={type} seriesName="MSFT" data={data} xScale={xScale} xAccessor={xAccessor} displayXAccessor={displayXAccessor} xExtents={xExtents} >
				<Chart id={1} height={600} yExtents={d => [d.high, d.low]} origin={(w, h) => [0, h - 600]} padding={{ top: 50, right: 5, bottom: 50, left: 5 }} >
					
					<YAxis axisAt="right" orient="right" ticks={5} {...yGrid} inverted={true} tickStroke="#FFFFFF" />					
					<YAxis axisAt="left" orient="left" ticks = { 0 } {...yGrid} inverted={true} tickStroke="#FFFFFF" />

					<XAxis axisAt="bottom" orient="bottom" {...xGrid} ticks = { 5 } tickStroke="#FFFFFF" stroke="#FFFFFF" />
					<XAxis axisAt="top" orient="top" {...xGrid} ticks = { 0 } tickStroke="#FFFFFF" stroke="#FFFFFF" />					

					<MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />
					<MouseCoordinateX at="bottom" orient="bottom" displayFormat={ts => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} />
					<OHLCSeries />

					<EdgeIndicator itemType="last" orient="right" edgeAt="right" yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>

					<OHLCTooltip textFill="#FFD700" labelFill="#00BFFF" origin={[5, 15]}/>
					
				</Chart>				
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

OHLCChart.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

OHLCChart.defaultProps = {
	type: "hybrid",
};
OHLCChart = fitWidth(OHLCChart);

export default OHLCChart;