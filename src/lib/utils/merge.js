// src/lib/utils/merge.js
// This module provides a merge function that applies an algorithm to an array and merges the result back into the source array using a specified merge function.
// It allows for dynamic algorithm selection, merging behavior, and handling of undefined values.
// merge.js

import identity from "./identity";
import zipper from "./zipper";
import noop from "./noop";
import { isNotDefined } from "./index";

// Applies an algorithm to an array, merging the result back into
// the source array using the given merge function.
const merge = () => {
	let algorithm = identity;
	let skipUndefined = true;
	let mergeFunc = noop;

	const mergeCompute = (data) => {
		const zip = zipper().combine((datum, indicator) => {
			const result = (skipUndefined && isNotDefined(indicator))
				? datum
				: mergeFunc(datum, indicator);
			return isNotDefined(result) ? datum : result;
		});
		return zip(data, algorithm(data));
	};

	mergeCompute.algorithm = function(x) {
		if (typeof x === "undefined") return algorithm;
		algorithm = x;
		return mergeCompute;
	};
	mergeCompute.merge = function(x) {
		if (typeof x === "undefined") return mergeFunc;
		mergeFunc = x;
		return mergeCompute;
	};
	mergeCompute.skipUndefined = function(x) {
		if (typeof x === "undefined") return skipUndefined;
		skipUndefined = x;
		return mergeCompute;
	};

	return mergeCompute;
};

export default merge;
