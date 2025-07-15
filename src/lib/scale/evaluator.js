import {
	head, last, getClosestItemIndexes, isDefined, isNotDefined, getLogger,
} from "../utils";

const log = getLogger("evaluator");

function getNewEnd(fallbackEnd, xAccessor, initialXScale, start) {
	const { lastItem, lastItemX } = fallbackEnd;
	const lastItemXValue = xAccessor(lastItem);
	const [rangeStart, rangeEnd] = initialXScale.range();
	return ((rangeEnd - rangeStart) / (lastItemX - rangeStart)) * (lastItemXValue - start) + start;
}

function extentsWrapper(useWholeData, clamp, pointsPerPxThreshold, minPointsPerPxThreshold, flipXScale) {
	function filterData(
		data, inputDomain, xAccessor, initialXScale,
		{ currentPlotData, currentDomain, fallbackStart, fallbackEnd } = {}
	) {
		if (useWholeData) return { plotData: data, domain: inputDomain };

		let left = head(inputDomain), right = last(inputDomain), clampedDomain = inputDomain;
		let filteredData = getFilteredResponse(data, left, right, xAccessor);

		if (filteredData.length === 1 && isDefined(fallbackStart)) {
			left = fallbackStart;
			right = getNewEnd(fallbackEnd, xAccessor, initialXScale, left);
			clampedDomain = [left, right];
			filteredData = getFilteredResponse(data, left, right, xAccessor);
		}

		if (typeof clamp === "function") {
			clampedDomain = clamp(clampedDomain, [xAccessor(head(data)), xAccessor(last(data))]);
		} else {
			if (clamp === "left" || clamp === "both" || clamp === true)
				clampedDomain = [Math.max(left, xAccessor(head(data))), clampedDomain[1]];
			if (clamp === "right" || clamp === "both" || clamp === true)
				clampedDomain = [clampedDomain[0], Math.min(right, xAccessor(last(data)))];
		}
		if (clampedDomain !== inputDomain) {
			filteredData = getFilteredResponse(data, clampedDomain[0], clampedDomain[1], xAccessor);
		}

		const realInputDomain = clampedDomain;
		const xScale = initialXScale.copy().domain(realInputDomain);

		let width = Math.floor(xScale(xAccessor(last(filteredData))) - xScale(xAccessor(head(filteredData))));
		if (flipXScale && width < 0) width = -width;

		const chartWidth = last(xScale.range()) - head(xScale.range());
		log?.(`Trying to show ${filteredData.length} points in ${width}px, I can show up to ${showMaxThreshold(width, pointsPerPxThreshold) - 1} points in that width.`);

		let plotData, domain;
		if (canShowTheseManyPeriods(width, filteredData.length, pointsPerPxThreshold, minPointsPerPxThreshold)) {
			plotData = filteredData;
			domain = realInputDomain;
		} else if (chartWidth > showMaxThreshold(width, pointsPerPxThreshold) && isDefined(fallbackEnd)) {
			plotData = filteredData;
			const newEnd = getNewEnd(fallbackEnd, xAccessor, initialXScale, head(realInputDomain));
			domain = [head(realInputDomain), newEnd];
		} else {
			plotData = currentPlotData || filteredData.slice(filteredData.length - showMax(width, pointsPerPxThreshold));
			domain = currentDomain || [xAccessor(head(plotData)), xAccessor(last(plotData))];
		}
		return { plotData, domain };
	}
	return { filterData };
}

function canShowTheseManyPeriods(width, arrayLength, maxThreshold, minThreshold) {
	return arrayLength > showMinThreshold(width, minThreshold) && arrayLength < showMaxThreshold(width, maxThreshold);
}
const showMinThreshold = (width, threshold) => Math.max(1, Math.ceil(width * threshold));
const showMaxThreshold = (width, threshold) => Math.floor(width * threshold);
const showMax = (width, threshold) => Math.floor(showMaxThreshold(width, threshold) * 0.97);

function getFilteredResponse(data, left, right, xAccessor) {
	const newLeftIndex = getClosestItemIndexes(data, left, xAccessor).right;
	const newRightIndex = getClosestItemIndexes(data, right, xAccessor).left;
	return data.slice(newLeftIndex, newRightIndex + 1);
}

function createEvaluator({
	xScale, useWholeData, clamp, pointsPerPxThreshold, minPointsPerPxThreshold, flipXScale
}) {
	return extentsWrapper(
		useWholeData || isNotDefined(xScale.invert),
		clamp, pointsPerPxThreshold, minPointsPerPxThreshold, flipXScale
	);
}

export default createEvaluator;

