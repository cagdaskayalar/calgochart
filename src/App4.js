// src/App.js

import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";

import { ChartCanvas, Chart } from "./lib";
import { OHLCSeries } from "./lib/series";
import { XAxis, YAxis } from "./lib/axes";
import { CrossHairCursor, EdgeIndicator, MouseCoordinateX, MouseCoordinateY } from "./lib/coordinates";

import { discontinuousTimeScaleProviderBuilder } from "./lib/scale";
import { OHLCTooltip } from "./lib/tooltip";
import { fitWidth } from "./lib/helper";
import { last, head } from "./lib/utils";

function getMaxUndefined(calculators) {
	return calculators.map(each => each.undefinedLength()).reduce((a, b) => Math.max(a, b));
}
const LENGTH_TO_SHOW = 60000;

class CandleStickChartPanToLoadMore extends React.Component {
	constructor(props) {
		super(props);
		const { data: inputData } = props;

		const maxWindowSize = 60000; // getMaxUndefined([inputData]);
		/* SERVER - START */
		const dataToCalculate = inputData.slice(-LENGTH_TO_SHOW - maxWindowSize);

		const calculatedData = (dataToCalculate);
		const indexCalculator = discontinuousTimeScaleProviderBuilder().indexCalculator();

		console.log(inputData.length, dataToCalculate.length, maxWindowSize)
		const { index } = indexCalculator(calculatedData);
		/* SERVER - END */

		const xScaleProvider = discontinuousTimeScaleProviderBuilder()
			.withIndex(index);
		const { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData.slice(-LENGTH_TO_SHOW));

		console.log(head(linearData), last(linearData))
		console.log(linearData.length)

		this.state = {			
			data: linearData,
			xScale,
			xAccessor, displayXAccessor
		};
		this.handleDownloadMore = this.handleDownloadMore.bind(this);
	}
	handleDownloadMore(start, end) {
		if (Math.ceil(start) === end) return;
		// console.log("rows to download", rowsToDownload, start, end)
		const { data: prevData } = this.state;
		const { data: inputData } = this.props;


		if (inputData.length === prevData.length) return;

		const rowsToDownload = end - Math.ceil(start);

		const maxWindowSize = 60000; // getMaxUndefined([inputData]);

		/* SERVER - START */
		const dataToCalculate = inputData
			.slice(-rowsToDownload - maxWindowSize - prevData.length, - prevData.length);

		const calculatedData = (dataToCalculate);
		const indexCalculator = discontinuousTimeScaleProviderBuilder()
			.initialIndex(Math.ceil(start))
			.indexCalculator();
		const { index } = indexCalculator(
			calculatedData
				.slice(-rowsToDownload)
				.concat(prevData));
		/* SERVER - END */

		const xScaleProvider = discontinuousTimeScaleProviderBuilder()
			.initialIndex(Math.ceil(start))
			.withIndex(index);

		const { data: linearData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData.slice(-rowsToDownload).concat(prevData));

		console.log(linearData.length)
		setTimeout(() => {
			// simulate a lag for ajax
			this.setState({
				data: linearData,
				xScale,
				xAccessor,
				displayXAccessor,
			});
		}, 300);
	}
	render() {
		const { type, width, ratio } = this.props;
		const { data, xScale, xAccessor, displayXAccessor } = this.state;

		return (
			<ChartCanvas ratio={ratio} width={width} height={600}
					margin={{ left: 70, right: 70, top: 20, bottom: 30 }} type={type}
					seriesName="MSFT"
					data={data}
					xScale={xScale} xAccessor={xAccessor} displayXAccessor={displayXAccessor}
					onLoadMore={this.handleDownloadMore}>
				<Chart id={1} height={400}
						yExtents={[d => [d.high, d.low]]}
						padding={{ top: 10, bottom: 20 }}>
					<XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
					<YAxis axisAt="right" orient="right" ticks={5} />

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format(".2f")} />

					<OHLCSeries />
					

					

					<EdgeIndicator itemType="last" orient="right" edgeAt="right"
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}/>

					<OHLCTooltip origin={[-40, 0]}/>
					
				</Chart>
				
			
				<CrossHairCursor />
			</ChartCanvas>
		);
	}
}

/*

*/

CandleStickChartPanToLoadMore.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChartPanToLoadMore.defaultProps = {
	type: "svg",
};

CandleStickChartPanToLoadMore = fitWidth(CandleStickChartPanToLoadMore);

export default CandleStickChartPanToLoadMore;