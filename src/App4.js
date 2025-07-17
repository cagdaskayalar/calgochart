import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import icon6 from "./lib/assets/info.svg";
import { format } from "d3-format";
import { Button } from "react-bootstrap";
import { ChartCanvas, Chart } from "./lib";
import { OHLCSeries } from "./lib/series";
import { XAxis, YAxis } from "./lib/axes";
import { CrossHairCursor, EdgeIndicator, MouseCoordinateX, MouseCoordinateY } from "./lib/coordinates";
import { rightDomainBasedZoomAnchor} from "./lib/utils/zoomBehavior"
import { discontinuousTimeScaleProvider } from "./lib/scale";
import { OHLCTooltip } from "./lib/tooltip";
import { fitWidth } from "./lib/helper";
import { last } from "./lib/utils";

function OHLCChartLoadMore(props) {
	
	const [plotFullActive, setplotFullActive] = useState(false);
	const handleplotFull = useCallback(() => setplotFullActive(p => !p), []);

	const height = 650;

	const { type: svg, data: initialData, width, ratio, gridProps } = props;

	const calculatedData = initialData.map((d, index) => {
            return {
			   ...d,
            };
          });

	const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor((d) => new Date(d.date));
	const { data, xScale, xAccessor, displayXAccessor} = xScaleProvider(calculatedData);
		
	const margin = { left: 70, right: 70, top: 20, bottom: 30 };
	const start = xAccessor(last(data));
	const end = xAccessor(data[Math.max(0, data.length-50)]);
	const xExtents = [start, end];	  

	const gridHeight = height - margin.top - margin.bottom;
	const gridWidth = width - margin.left - margin.right;
	const yGrid = { innerTickSize: -10 * gridWidth, tickStrokeDasharray: "ShortDot", tickStrokeOpacity: 0.2, tickStroke: "gainsboro", tickStrokeWidth: 1 };
	const xGrid = { innerTickSize: -10 * gridHeight, tickStrokeDasharray: "ShortDot", tickStrokeOpacity: 0.2, tickStroke: "gainsboro", tickStrokeWidth: 1 }; 
		


	return (
		<div>			
			<div id="calgo-chart_navbar_box">
				<div id="calgo-chart_navbar" className="navbar navbar-expand-lg">
					<span>
					<Button size="sm" color="dark" title="IconButton">
						<img src={icon6} alt="icon" />
					</Button>
					</span>
					<span>
					<Button
						size="sm"
						color="dark"
						title="FullData"
						style={{
						backgroundColor: plotFullActive ? '#454545' : '#151515',
						boxShadow: "none"
						}}
						onClick={handleplotFull}
					>
						Full Data
					</Button>
					</span>
				</div>
			

		<ChartCanvas 
			plotData={initialData} 
			plotFull={plotFullActive} 
			height={650} width={width} 
			ratio={ratio} 
			margin={margin} 
			type={svg} 
			zoomEvent={true}            // zoom aktif
  			zoomMultiplier={1.2}  
			seriesName="MSFT" 			
			minPointsPerPxThreshold={1/100}
			zoomAnchor={rightDomainBasedZoomAnchor}	
			data={data} 
			xScale={xScale} 
			xAccessor={xAccessor} 
			displayXAccessor={displayXAccessor} 
			xExtents={xExtents} >
			<Chart id={1} height={600} yExtents={d => [d.high, d.low]} origin={(w, h) => [0, h - 600]} padding={{ top: 50, right: 5, bottom: 50, left: 5 }} >
				<YAxis axisAt="right" zoomEnabled={true} orient="right" ticks={5} {...gridProps} {...yGrid} inverted={true} tickStroke="#FFFFFF" />
				<YAxis axisAt="left" zoomEnabled={true} orient="left" ticks={0} {...gridProps} {...yGrid} inverted={true} tickStroke="#FFFFFF" />
				<XAxis axisAt="bottom" zoomEnabled={true} orient="bottom" {...xGrid} ticks={5} tickStroke="#FFFFFF" stroke="#FFFFFF" />
				<XAxis axisAt="top" zoomEnabled={true} orient="top" {...xGrid} ticks={0} tickStroke="#FFFFFF" stroke="#FFFFFF" />
				<MouseCoordinateY at="right" orient="right" displayFormat={format(".2f")} />
				<MouseCoordinateX at="bottom" orient="bottom" displayFormat={ts => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} />
				<OHLCSeries />
				<EdgeIndicator itemType="last" orient="right" edgeAt="right" yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
				<OHLCTooltip textFill="#FFD700" labelFill="#00BFFF" origin={[5, 15]} />
			</Chart>
			<CrossHairCursor />
		</ChartCanvas>
			</div>
		</div>
		
	);
}

OHLCChartLoadMore.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};



export default fitWidth(OHLCChartLoadMore);