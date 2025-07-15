// accumulatingWindow.js

/*
  Modernized from Scott Logic's d3fc slidingWindow implementation.
  The MIT License (MIT)
*/

import noop from "./noop";
import identity from "./identity";
import { functor } from "./index";

/**
 * Creates an accumulating window function for custom reduction logic.
 * @returns {Function}
 */
export default function accumulatingWindow() {
	let accumulateTill = functor(false);
	let accumulator = noop;
	let value = identity;
	let discardTillStart = false;
	let discardTillEnd = false;

	const windowFn = (data) => {
		let accumulatedWindow = discardTillStart ? undefined : [];
		const response = [];
		let accumulatorIdx = 0;
		let i = 0;
		for (; i < data.length; i++) {
			const d = data[i];
			if (accumulateTill(d, i, accumulatedWindow || [])) {
				if (accumulatedWindow && accumulatedWindow.length > 0)
					response.push(accumulator(accumulatedWindow, i, accumulatorIdx++));
				accumulatedWindow = [value(d)];
			} else {
				if (accumulatedWindow)
					accumulatedWindow.push(value(d));
			}
		}
		if (!discardTillEnd && accumulatedWindow && accumulatedWindow.length > 0)
			response.push(accumulator(accumulatedWindow, i, accumulatorIdx));
		return response;
	};

	// Configurators (fluent API)
	windowFn.accumulateTill = (x) => {
		if (!arguments.length) return accumulateTill;
		accumulateTill = functor(x);
		return windowFn;
	};
	windowFn.accumulator = (x) => {
		if (!arguments.length) return accumulator;
		accumulator = x;
		return windowFn;
	};
	windowFn.value = (x) => {
		if (!arguments.length) return value;
		value = x;
		return windowFn;
	};
	windowFn.discardTillStart = (x) => {
		if (!arguments.length) return discardTillStart;
		discardTillStart = x;
		return windowFn;
	};
	windowFn.discardTillEnd = (x) => {
		if (!arguments.length) return discardTillEnd;
		discardTillEnd = x;
		return windowFn;
	};

	return windowFn;
}
