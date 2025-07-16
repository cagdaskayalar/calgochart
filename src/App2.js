// src/App.js

import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "./lib";
import { BarSeries, CandlestickSeries, OHLCSeries } from "./lib/series";
import { XAxis, YAxis } from "./lib/axes";
import { CrossHairCursor, CurrentCoordinate, EdgeIndicator, MouseCoordinateX, MouseCoordinateXV2, MouseCoordinateY, PriceCoordinate } from "./lib/coordinates";

import { discontinuousTimeScaleProvider } from "./lib/scale";
import { OHLCTooltip } from "./lib/tooltip";
import { fitWidth } from "./lib/helper";
import { last } from "./lib/utils";

class OHLCChartWithElderRayIndicator extends React.Component {
	render() {		

		const height = 650;
		const { type, data: initialData, width, ratio } = this.props;
		
		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData);
		
		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const gridHeight = height - margin.top - margin.bottom -100;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		return (
			<ChartCanvas height={650}
				width={width}
				ratio={ratio}
				margin={margin}
				type={type}
				seriesName="MSFT"
				data={data}
				xScale={xScale}
				xAccessor={xAccessor}
				displayXAccessor={displayXAccessor}
				xExtents={xExtents}
			>
				<Chart id={1} height={500}
					yExtents={d => [d.high, d.low]}
					origin={(w, h) => [0, h -600]}
					padding={{ top: 10, right: 0, bottom: 20, left: 0 }}
				>
					<YAxis axisAt="right" orient="right" ticks={5} {...yGrid} inverted={true}
						tickStroke="#FFFFFF" />
					
					<YAxis axisAt="left" orient="left" ticks = "0" inverted={true}
						tickStroke="#FFFFFF" />


					<XAxis axisAt="bottom" orient="bottom"
						{...xGrid}
						tickStroke="#FFFFFF"
						stroke="#FFFFFF" />

					<XAxis axisAt="top" orient="top"
						{...xGrid}
						
						ticks = "0"
						
						showDomain= "false"
						tickStroke="#FFFFFF"
						stroke="#FFFFFF" />
					

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<MouseCoordinateXV2
						at="bottom"
						orient="bottom"
						displayFormat={format(".2f")} />




					<OHLCSeries />
					<EdgeIndicator itemType="last" orient="right" edgeAt="right"
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>

					<OHLCTooltip origin={[-0, -15]}/>

				</Chart>
				<Chart id={2} height={100}
					yExtents={d => d.volume}
					origin={(w, h) => [0, h - 100]}
				>
					<XAxis axisAt="bottom" orient="bottom"/>
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")}
						tickStroke="#FFFFFF" />
					<MouseCoordinateY
						at="left"
						orient="left"
						displayFormat={format(".4s")} />

					<BarSeries yAccessor={d => d.volume}
						fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}
						opacity={0.4}/>
				</Chart>
				
				
				
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

OHLCChartWithElderRayIndicator.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

OHLCChartWithElderRayIndicator.defaultProps = {
	type: "svg",
};
OHLCChartWithElderRayIndicator = fitWidth(OHLCChartWithElderRayIndicator);

export default OHLCChartWithElderRayIndicator;