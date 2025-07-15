// utils/zoomBehavior.js

import { getCurrentItem } from "./ChartDataUtil";
import { last } from "./index";

/**
 * Mouse tabanl� zoom anchor fonksiyonu.
 * @param {Object} params
 * @param {Function} params.xScale
 * @param {Function} params.xAccessor
 * @param {Array} params.mouseXY
 * @param {Array} params.plotData
 * @param {Array} params.fullData
 * @returns {*}
 */
export function mouseBasedZoomAnchor({
	xScale,
	xAccessor,
	mouseXY,
	plotData,
	fullData,
}) {
	const currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
	return xAccessor(currentItem);
}

/**
 * G�r�nen son item'a g�re zoom anchor.
 * @param {Object} params
 * @returns {*}
 */
export function lastVisibleItemBasedZoomAnchor({
	xScale,
	xAccessor,
	mouseXY,
	plotData,
	fullData,
}) {
	const lastItem = last(plotData);
	return xAccessor(lastItem);
}

/**
 * Domain'in sa� (end) de�erine g�re zoom anchor.
 * @param {Object} params
 * @returns {*}
 */
export function rightDomainBasedZoomAnchor({
	xScale,
	xAccessor,
	mouseXY,
	plotData,
	fullData,
}) {
	const [, end] = xScale.domain();
	return end;
}
