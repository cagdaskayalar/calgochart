import React, { useRef, useState, useEffect, forwardRef } from "react";

function getDisplayName(Series) {
	return Series.displayName || Series.name || "Series";
}

export default function fitWidth(WrappedComponent, withRef = true, minWidth = 100) {
	const ResponsiveComponent = forwardRef((props, ref) => {
		const containerRef = useRef(null);
		const testCanvasRef = useRef(null);
		const [state, setState] = useState({ width: null, ratio: 1 });

		// Ölçü ve ratio hesapla
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

		// Ölçü ve oranlarý hesapla, resize'da güncelle
		useEffect(() => {
			function handleResize() {
				if (!containerRef.current) return;
				const parent = containerRef.current.parentNode;
				const style = window.getComputedStyle(parent);
				const w = parseFloat(style.width) -
					(parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
				setState({
					width: Math.round(Math.max(w, minWidth)),
					ratio: getRatio(),
				});
			}
			handleResize();
			window.addEventListener("resize", handleResize);
			return () => window.removeEventListener("resize", handleResize);
			// eslint-disable-next-line
		}, []);

		const refProps = withRef ? { ref: containerRef } : {};

		if (!state.width) {
			// Ýlk ölçüm için dummy canvas render
			return (
				<div {...refProps}>
					<canvas ref={testCanvasRef} style={{ display: "block" }} />
				</div>
			);
		}

		return (
			<WrappedComponent
				width={state.width}
				ratio={state.ratio}
				{...props}
				{...(withRef ? { ref } : {})}
			/>
		);
	});
	ResponsiveComponent.displayName = `fitWidth(${getDisplayName(WrappedComponent)})`;

	return ResponsiveComponent;
}
