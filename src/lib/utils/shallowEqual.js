// src/lib/utils/shallowEqual.js
// A utility function to perform a shallow comparison of two objects.
// This implementation is inspired by the is-equal-shallow library by Jon Schlinkert.
// It checks if two values are equal, handling Date objects specifically and ensuring that both objects have the same keys.
// This module is used to optimize rendering in React applications by preventing unnecessary updates.
// It is particularly useful in components that extend React.PureComponent, where shallow comparison of props, state, and context is required.
// It is a lightweight alternative to deep equality checks, focusing on performance and simplicity.
// This module is part of the CalgoChart library, which provides utilities for chart rendering and data visualization.
// It is designed to be used in conjunction with other utility functions and components within the library.
// It is a standalone utility that can be imported and used in various parts of the CalgoChart library or in user applications.
// It is not intended to be used as a standalone library, but rather as a utility within the CalgoChart ecosystem.
// It is compatible with modern JavaScript environments and can be used in both Node.js and browser contexts.
// It is licensed under the MIT License, allowing for free use, modification, and distribution.
// It is maintained as part of the CalgoChart project, which is an open-source project available on GitHub.
// This module is inspired by the is-equal-shallow library, which provides a similar shallow equality check.
// It is designed to be efficient and lightweight, focusing on performance for React applications.
// It is a utility function that can be used in various contexts where shallow equality checks are needed.
// It is a fundamental utility that underpins the performance optimizations in the CalgoChart library		
// and is essential for ensuring that components only re-render when necessary.
// shallowEqual.js

// https://github.com/jonschlinkert/is-equal-shallow/

/*
The MIT License (MIT)

Copyright (c) 2015, Jon Schlinkert.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

function isDate(date) {
	return Object.prototype.toString.call(date) === "[object Date]";
}

function isEqual(val1, val2) {
	return (isDate(val1) && isDate(val2))
		? val1.getTime() === val2.getTime()
		: val1 === val2;
}

export default function shallowEqual(a, b) {
	if (!a && !b) { return true; }
	if ((!a && b) || (a && !b)) { return false; }

	let numKeysA = 0, numKeysB = 0, key;
	for (key in b) {
		numKeysB++;
		if ((b.hasOwnProperty(key) && !a.hasOwnProperty(key)) || !isEqual(a[key], b[key])) {
			return false;
		}
	}
	for (key in a) {
		numKeysA++;
	}
	return numKeysA === numKeysB;// objects are shallow equal
}
