// src/lib/helper/fitDimensions.js
// This module provides a higher-order component that wraps a chart component to make it responsive.
// It measures the dimensions of the parent container and applies them to the wrapped component, ensuring it fits within the available space.
// fitDimensions.js

import React, { useRef, useEffect, useState, forwardRef } from "react";
import { isDefined } from "../utils";

function getDisplayName(Series) {
	return Series.displayName || Series.name || "Series";
}

export default function fitDimensions(WrappedComponent, config = {}) {
	const {
		minWidth = 100,
		minHeight = 100,
		ratio: forcedRatio,
		width: forcedWidth,
		height: forcedHeight,
	} = config;

	const ResponsiveComponent = forwardRef((props, ref) => {
		const containerRef = useRef(null);
		const testCanvasRef = useRef(null);
		const [dimensions, setDimensions] = useState({ width: null, height: null, ratio: 1 });

		// Helper: Compute pixel ratio
		const getRatio = () => {
			if (testCanvasRef.current) {
				const ctx = testCanvasRef.current.getContext("2d");
				const dpr = window.devicePixelRatio || 1;
				const bsr =
					ctx.webkitBackingStorePixelRatio ||
					ctx.mozBackingStorePixelRatio ||
					ctx.msBackingStorePixelRatio ||
					ctx.oBackingStorePixelRatio ||
					ctx.backingStorePixelRatio || 1;
				return dpr / bsr;
			}
			return 1;
		};

		// Measure on mount & resize
		useEffect(() => {
			function handleResize() {
				if (!containerRef.current) return;
				const parent = containerRef.current.parentNode;
				const w = parent?.clientWidth || minWidth;
				const h = parent?.clientHeight || minHeight;
				setDimensions({
					width: isDefined(forcedWidth) ? forcedWidth : Math.max(w, minWidth),
					height: isDefined(forcedHeight) ? forcedHeight : Math.max(h, minHeight),
					ratio: isDefined(forcedRatio) ? forcedRatio : getRatio(),
				});
			}
			handleResize(); // Initial
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
			// eslint-disable-next-line
		}, [forcedWidth, forcedHeight, forcedRatio]);

		// �lk render: �nce test canvas g�ster, sonra �l��p WrappedComponent render
		if (!dimensions.width || !dimensions.height) {
			return (
				<div ref={containerRef}>
					<canvas ref={testCanvasRef} style={{ display: "block" }} />
				</div>
			);
		}

		return (
			<WrappedComponent
				ref={ref}
				width={dimensions.width}
				height={dimensions.height}
				ratio={dimensions.ratio}
				{...props}
			/>
		);
	});
	ResponsiveComponent.displayName = `fitDimensions(${getDisplayName(WrappedComponent)})`;

	return ResponsiveComponent;
}
