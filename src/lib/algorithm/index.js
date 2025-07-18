// src/lib/algorithm/index.js
// This module exports an algorithm that processes data using a sliding window approach.
// It allows customization of the window size, accumulator function, and merge function for dynamic data processing.
// index.js

import { merge, slidingWindow, identity } from "../utils";

const algorithm = function() {

	let windowSize = 1,
		accumulator = identity,
		mergeAs = identity;

	function algorithm(data) {

		const defaultAlgorithm = slidingWindow()
			.windowSize(windowSize)
			.accumulator(accumulator);

		const calculator = merge()
			.algorithm(defaultAlgorithm)
			.merge(mergeAs);

		const newData = calculator(data);

		return newData;
	}

	algorithm.accumulator = function(x) {
		if (!arguments.length) {
			return accumulator;
		}
		accumulator = x;
		return algorithm;
	};

	algorithm.windowSize = function(x) {
		if (!arguments.length) {
			return windowSize;
		}
		windowSize = x;
		return algorithm;
	};
	algorithm.merge = function(x) {
		if (!arguments.length) {
			return mergeAs;
		}
		mergeAs = x;
		return algorithm;
	};

	return algorithm;
}
export default algorithm;