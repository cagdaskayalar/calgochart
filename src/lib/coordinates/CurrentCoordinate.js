// src/lib/coordinates/CurrentCoordinate.js
// This module defines a CurrentCoordinate component that displays a circle at the current mouse position on a chart.
// It supports both SVG and Canvas rendering, showing the Y value of the current item.
// CurrentCoordinate.js

import React, { useCallback } from "react";
import PropTypes from "prop-types";
import GenericChartComponent, { getMouseCanvas } from "../GenericComponent";
import { isNotDefined } from "../utils";

/**
 * Grafik üzerinde aktif item'ın (örn. mouse üzerindeki bar) Y pozisyonunda daire/circle gösterir.
 * Hem SVG hem Canvas desteği var.
 *
 * @param {object} props
 *   - yAccessor: Fonksiyon, currentItem'dan Y değerini döndürür.
 *   - r: Çember yarıçapı (varsayılan: 3)
 *   - className: CSS class (varsayılan: "calgo-stockcharts-current-coordinate")
 *   - fill: Daire rengi (string ya da fonksiyon)
 */
function CurrentCoordinate({
	yAccessor,
	r = 3,
	className = "calgo-stockcharts-current-coordinate",
	fill = "#000",
	...rest
}) {
	// SVG olarak çizim
	const renderSVG = useCallback(
		(moreProps) => {
			const circle = helper({ fill, yAccessor, r }, moreProps);
			if (!circle) return null;
			const fillColor = typeof circle.fill === "function" ? circle.fill(moreProps.currentItem) : circle.fill;
			return (
				<circle
					className={className}
					cx={circle.x}
					cy={circle.y}
					r={circle.r}
					fill={fillColor}
				/>
			);
		},
		[className, fill, r, yAccessor]
	);

	// Canvas olarak çizim
	const drawOnCanvas = useCallback(
		(ctx, moreProps) => {
			const circle = helper({ fill, yAccessor, r }, moreProps);
			if (!circle) return;
			const fillColor = typeof circle.fill === "function" ? circle.fill(moreProps.currentItem) : circle.fill;
			ctx.fillStyle = fillColor;
			ctx.beginPath();
			ctx.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI, false);
			ctx.fill();
		},
		[fill, r, yAccessor]
	);

	return (
		<GenericChartComponent
			svgDraw={renderSVG}
			canvasDraw={drawOnCanvas}
			canvasToDraw={getMouseCanvas}
			drawOn={["mousemove", "pan"]}
			{...rest}
		/>
	);
}

// Helper: Çemberin koordinat ve stilini hazırlar
function helper(props, moreProps) {
	const { fill, yAccessor, r } = props;
	const { show, xScale, chartConfig: { yScale }, currentItem, xAccessor } = moreProps;
	if (!show || isNotDefined(currentItem)) return null;
	const xValue = xAccessor(currentItem);
	const yValue = yAccessor(currentItem);
	if (isNotDefined(yValue)) return null;
	const x = Math.round(xScale(xValue));
	const y = Math.round(yScale(yValue));
	return { x, y, r, fill };
}

CurrentCoordinate.propTypes = {
	yAccessor: PropTypes.func.isRequired,
	r: PropTypes.number,
	className: PropTypes.string,
	fill: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

export default CurrentCoordinate;
