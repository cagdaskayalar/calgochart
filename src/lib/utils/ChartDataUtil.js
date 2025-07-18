// src/lib/utils/ChartDataUtil.js
// This module provides utility functions for handling chart data, including calculating chart origins, dimensions, and updating chart configurations.
// It also includes functions for determining the current chart based on mouse position and updating Y scales based on data extents.
// ChartDataUtil.js

import React from "react";
import { extent } from "d3-array";
import flattenDeep from "lodash.flattendeep";
import Chart from "../Chart";
import {
	last, isObject, getClosestItem, zipper,
	isDefined, isNotDefined, functor, mapObject, find, shallowEqual
} from "./index";

// Chart origin
export const getChartOrigin = (origin, contextWidth, contextHeight) =>
	typeof origin === "function" ? origin(contextWidth, contextHeight) : origin;

// Chart dimension helper
export const getDimensions = ({ width, height }, chartProps) => {
	const chartHeight = chartProps.height || height;
	return { availableHeight: height, width, height: chartHeight };
};

const values = (func) => (d) => {
	const obj = func(d);
	return isObject(obj) ? mapObject(obj) : obj;
};

const isArraySize2AndNumber = (yExtentsProp) => (
	Array.isArray(yExtentsProp) && yExtentsProp.length === 2 &&
	typeof yExtentsProp[0] === "number" && typeof yExtentsProp[1] === "number"
);

// Chart config (React.Children.map ile)
export function getNewChartConfig(innerDimension, children, existingChartConfig = []) {
	return React.Children.map(children, (each) => {
		if (each && each.type === Chart) {
			const chartProps = { ...Chart.defaultProps, ...each.props };
			const {
				id, origin, padding, yExtents: yExtentsProp, yScale: yScaleProp,
				flipYScale, yExtentsCalculator, yPan
			} = chartProps;

			const yScale = yScaleProp.copy();
			const { width, height, availableHeight } = getDimensions(innerDimension, chartProps);
			let { yPanEnabled } = chartProps;

			const yExtents = isDefined(yExtentsProp)
				? (Array.isArray(yExtentsProp) ? yExtentsProp : [yExtentsProp]).map(functor)
				: undefined;

			const prevChartConfig = find(existingChartConfig, d => d.id === id);

			if (isArraySize2AndNumber(yExtentsProp)) {
				if (
					isDefined(prevChartConfig)
					&& prevChartConfig.yPan
					&& prevChartConfig.yPanEnabled
					&& yPan
					&& yPanEnabled
					&& shallowEqual(prevChartConfig.originalYExtentsProp, yExtentsProp)
				) {
					yScale.domain(prevChartConfig.yScale.domain());
				} else {
					const [a, b] = yExtentsProp;
					yScale.domain([a, b]);
				}
			} else if (isDefined(prevChartConfig) && prevChartConfig.yPanEnabled) {
				if (isArraySize2AndNumber(prevChartConfig.originalYExtentsProp)) {
					// do nothing
				} else {
					yScale.domain(prevChartConfig.yScale.domain());
					yPanEnabled = true;
				}
			}

			return {
				id,
				origin: functor(origin)(width, availableHeight),
				padding,
				originalYExtentsProp: yExtentsProp,
				yExtents,
				yExtentsCalculator,
				flipYScale,
				yScale,
				yPan,
				yPanEnabled,
				width,
				height
			};
		}
		return undefined;
	}).filter(isDefined);
}

// Mouse Y konumuna g�re hangi chart aktif (�r: pan/zoom/hover)
export const getCurrentCharts = (chartConfig, mouseXY) =>
	chartConfig
		.filter(eachConfig => {
			const top = eachConfig.origin[1];
			const bottom = top + eachConfig.height;
			return mouseXY[1] > top && mouseXY[1] < bottom;
		})
		.map(config => config.id);

// Y eksen range helper
function setRange(scale, height, padding, flipYScale) {
	if (scale.rangeRoundPoints || isNotDefined(scale.invert)) {
		if (isNaN(padding)) throw new Error("padding has to be a number for ordinal scale");
		if (scale.rangeRoundPoints)
			scale.rangeRoundPoints(flipYScale ? [0, height] : [height, 0], padding);
		if (scale.rangeRound)
			scale.range(flipYScale ? [0, height] : [height, 0]).padding(padding);
	} else {
		const { top, bottom } = isNaN(padding)
			? padding
			: { top: padding, bottom: padding };
		scale.range(flipYScale ? [top, height - bottom] : [height - bottom, top]);
	}
	return scale;
}

function yDomainFromYExtents(yExtents, yScale, plotData) {
	const yValues = yExtents.map(eachExtent => plotData.map(values(eachExtent)));
	const allYValues = flattenDeep(yValues);
	return yScale.invert ? extent(allYValues) : Array.from(new Set(allYValues));
}

// ChartConfig Y scale g�ncellemesi (�rn: pan/zoom, plotData de�i�ince vs)
export function getChartConfigWithUpdatedYScales(
	chartConfig,
	{ plotData, xAccessor, displayXAccessor, fullData },
	xDomain,
	dy,
	chartsToPan
) {
	const yDomains = chartConfig.map(({ yExtentsCalculator, yExtents, yScale }) => {
		const realYDomain = isDefined(yExtentsCalculator)
			? yExtentsCalculator({ plotData, xDomain, xAccessor, displayXAccessor, fullData })
			: yDomainFromYExtents(yExtents, yScale, plotData);

		const yDomainDY = isDefined(dy)
			? yScale.range().map(each => each - dy).map(yScale.invert)
			: yScale.domain();
		return {
			realYDomain,
			yDomainDY,
			prevYDomain: yScale.domain(),
		};
	});

	const combine = zipper().combine((config, { realYDomain, yDomainDY, prevYDomain }) => {
		const { id, padding, height, yScale, yPan, flipYScale, yPanEnabled = false } = config;
		const another = isDefined(chartsToPan)
			? chartsToPan.indexOf(id) > -1
			: true;
		const domain = yPan && yPanEnabled
			? another ? yDomainDY : prevYDomain
			: realYDomain;

		const newYScale = setRange(yScale.copy().domain(domain), height, padding, flipYScale);
		return {
			...config,
			yScale: newYScale,
			realYDomain
		};
	});
	return combine(chartConfig, yDomains);
}

// Mouse konumundan yak�n item'� getirir (�rn: tooltip vs)
export function getCurrentItem(xScale, xAccessor, mouseXY, plotData) {
	if (typeof xScale.invert === "function") {
		const xValue = xScale.invert(mouseXY[0]);
		return getClosestItem(plotData, xValue, xAccessor);
	}
	const d = xScale.range()
		.map((d, idx) => ({ x: Math.abs(d - mouseXY[0]), idx }))
		.reduce((a, b) => (a.x < b.x ? a : b));
	return isDefined(d) ? plotData[d.idx] : plotData[0];
}

// Mouse konumundan X de�erini bulur
export function getXValue(xScale, xAccessor, mouseXY, plotData) {
	if (typeof xScale.invert === "function") {
		const xValue = xScale.invert(mouseXY[0]);
		if (xValue > xAccessor(last(plotData)) && xScale.value) {
			return Math.round(xValue);
		}
		return xAccessor(getClosestItem(plotData, xValue, xAccessor));
	}
	const d = xScale.range()
		.map((d, idx) => ({ x: Math.abs(d - mouseXY[0]), idx }))
		.reduce((a, b) => (a.x < b.x ? a : b));
	const item = isDefined(d) ? plotData[d.idx] : plotData[0];
	return xAccessor(item);
}
