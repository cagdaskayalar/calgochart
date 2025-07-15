// barWidth.js

import { head } from "../utils";

/**
 * Bar width is based on the amount of items in the plot data and the distance between the first and last of those items.
 * @param {Object} props - Props passed to the series.
 * @param {Object} moreProps - Object holding the xScale, xAccessor, and plotData.
 * @returns {number} Bar width.
 */
export const plotDataLengthBarWidth = (props, moreProps) => {
	const { widthRatio } = props;
	const { xScale } = moreProps;

	const [l, r] = xScale.range();
	const totalWidth = Math.abs(r - l);

	if (typeof xScale.invert === "function") {
		const [dl, dr] = xScale.domain();
		const width = totalWidth / Math.abs(dl - dr);
		return width * widthRatio;
	}
	const width = totalWidth / xScale.domain().length;
	return width * widthRatio;
};

/**
 * Generates a width function that calculates the bar width based on the given time interval.
 * @param {Object} interval - A d3-time time interval.
 * @returns {Function} Width function.
 */
export const timeIntervalBarWidth = (interval) => (props, moreProps) => {
	const { widthRatio } = props;
	const { xScale, xAccessor, plotData } = moreProps;

	const first = xAccessor(head(plotData));
	return Math.abs(xScale(interval.offset(first, 1)) - xScale(first)) * widthRatio;
};
