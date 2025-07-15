import noop from "./noop";
import identity from "./identity";
import { functor } from "./index";

/**
 * mappedSlidingWindow
 * @param {Object} opts
 * @param {number|function} [opts.windowSize=10]
 * @param {function} [opts.accumulator=noop]
 * @param {function} [opts.source=identity]
 * @param {number} [opts.skipInitial=0]
 * @param {*} [opts.undefinedValue=undefined]
 */
export default function mappedSlidingWindow(opts = {}) {
	const {
		windowSize = 10,
		accumulator = noop,
		source = identity,
		skipInitial = 0,
		undefinedValue = undefined,
	} = opts;

	const getWindowSize = functor(windowSize);
	const getUndef = functor(undefinedValue);

	const fn = (data) => {
		const size = getWindowSize(data);
		const windowData = [];
		let accumulatorIdx = 0;
		const result = [];

		for (let i = 0; i < data.length; i++) {
			let mapped;
			if (i < (skipInitial + size - 1)) {
				mapped = getUndef(data[i], i);
				result.push(mapped);
				windowData.push(mapped);
				continue;
			}
			if (i >= (skipInitial + size)) {
				windowData.shift(); // FIFO
			}
			windowData.push(source(data[i], i));
			mapped = accumulator(windowData, i, accumulatorIdx++);
			result.push(mapped);
			windowData.pop();
			windowData.push(mapped);
		}
		return result;
	};

	// Parametreleri fonksiyon üzerinden deðiþtirmek için getter/setter pattern:
	fn.undefinedValue = (x) => x === undefined ? undefinedValue : (opts.undefinedValue = x, fn);
	fn.windowSize = (x) => x === undefined ? windowSize : (opts.windowSize = x, fn);
	fn.accumulator = (x) => x === undefined ? accumulator : (opts.accumulator = x, fn);
	fn.skipInitial = (x) => x === undefined ? skipInitial : (opts.skipInitial = x, fn);
	fn.source = (x) => x === undefined ? source : (opts.source = x, fn);

	return fn;
}
