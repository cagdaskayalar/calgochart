// src/lib/coordinates/EdgeCoordinate.js
// This module defines an EdgeCoordinate component that displays coordinates at the edges of a chart.
// It supports both SVG and Canvas rendering, allowing customization of appearance and behavior.
// EdgeCoordinate.js

import React from "react";
import PropTypes from "prop-types";
import { hexToRGBA, isDefined } from "../utils";

// Helper fonksiyon: SVG/Canvas i�in edge koordinat hesaplama
function getEdge(props) {
	const {
		coordinate: displayCoordinate, show, type, orient, edgeAt, hideLine,
		fill, opacity, fontFamily, fontSize, textFill, lineStroke, lineOpacity, arrowWidth,
		rectWidth, rectHeight, x1, y1, x2, y2
	} = props;
	if (!show) return null;

	let edgeXRect, edgeYRect, edgeXText, edgeYText;
	if (type === "horizontal") {
		edgeXRect = (orient === "right") ? edgeAt + 1 : edgeAt - rectWidth - arrowWidth - 1;
		edgeYRect = y1 - (rectHeight / 2);
		edgeXText = (orient === "right")
			? edgeAt + (rectWidth / 2) + arrowWidth
			: edgeAt - (rectWidth / 2) - arrowWidth;
		edgeYText = y1;
	} else {
		edgeXRect = x1 - (rectWidth / 2);
		edgeYRect = (orient === "bottom") ? edgeAt : edgeAt - rectHeight;
		edgeXText = x1;
		edgeYText = (orient === "bottom")
			? edgeAt + (rectHeight / 2)
			: edgeAt - (rectHeight / 2);
	}
	const textAnchor = "middle";
	const coordinateBase = isDefined(displayCoordinate) ? { edgeXRect, edgeYRect, rectHeight, rectWidth, fill, opacity, arrowWidth } : null;
	const coordinate = isDefined(displayCoordinate) ? { edgeXText, edgeYText, textAnchor, fontFamily, fontSize, textFill, displayCoordinate } : null;
	const line = hideLine ? undefined : { opacity: lineOpacity, stroke: lineStroke, x1, y1, x2, y2 };
	return { coordinateBase, coordinate, line, orient };
}

function EdgeCoordinate(props) {
	const { className } = props;
	const edge = getEdge(props);
	if (!edge) return null;

	const { coordinateBase, coordinate, line, orient } = edge;
	let lineEl, coordinateBaseEl, coordinateTextEl;

	if (isDefined(line)) {
		lineEl = (
			<line
				className="calgo-stockcharts-cross-hair"
				opacity={line.opacity}
				stroke={line.stroke}
				x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
			/>
		);
	}
	if (isDefined(coordinateBase)) {
		const { rectWidth, rectHeight, arrowWidth } = coordinateBase;
		const path =
			orient === "left"
				? `M0,0L0,${rectHeight}L${rectWidth},${rectHeight}L${rectWidth + arrowWidth},${rectHeight / 2}L${rectWidth},0L0,0`
				: `M0,${rectHeight / 2}L${arrowWidth},0L${rectWidth + arrowWidth},0L${rectWidth + arrowWidth},${rectHeight}L${arrowWidth},${rectHeight}L0,${rectHeight / 2}`;
		coordinateBaseEl =
			orient === "left" || orient === "right" ? (
				<g transform={`translate(${coordinateBase.edgeXRect},${coordinateBase.edgeYRect})`}>
					<path
						className="calgo-stockchart-text-background"
						d={path}
						fill={coordinateBase.fill}
						opacity={coordinateBase.opacity}
					/>
				</g>
			) : (
				<rect
					className="calgo-stockchart-text-background"
					x={coordinateBase.edgeXRect}
					y={coordinateBase.edgeYRect}
					height={rectHeight}
					width={rectWidth}
					fill={coordinateBase.fill}
					opacity={coordinateBase.opacity}
				/>
			);
		coordinateTextEl = (
			<text
				x={coordinate.edgeXText}
				y={coordinate.edgeYText}
				textAnchor={coordinate.textAnchor}
				fontFamily={coordinate.fontFamily}
				fontSize={coordinate.fontSize}
				dy=".32em"
				fill={coordinate.textFill}
			>
				{coordinate.displayCoordinate}
			</text>
		);
	}

	return (
		<g className={className}>
			{lineEl}
			{coordinateBaseEl}
			{coordinateTextEl}
		</g>
	);
}

EdgeCoordinate.propTypes = {
	className: PropTypes.string,
	type: PropTypes.oneOf(["vertical", "horizontal"]).isRequired,
	coordinate: PropTypes.any.isRequired,
	x1: PropTypes.number.isRequired,
	y1: PropTypes.number.isRequired,
	x2: PropTypes.number.isRequired,
	y2: PropTypes.number.isRequired,
	orient: PropTypes.oneOf(["bottom", "top", "left", "right"]),
	rectWidth: PropTypes.number,
	hideLine: PropTypes.bool,
	fill: PropTypes.string,
	opacity: PropTypes.number,
	fontFamily: PropTypes.string.isRequired,
	fontSize: PropTypes.number.isRequired,
};

EdgeCoordinate.defaultProps = {
	className: "calgo-stockcharts-edgecoordinate",
	orient: "left",
	hideLine: false,
	fill: "#8a8a8a",
	opacity: 1,
	fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize: 13,
	textFill: "#FFFFFF",
	lineStroke: "#000000",
	lineOpacity: 0.3,
	arrowWidth: 10,
	rectWidth: 60,
	rectHeight: 20,
};

// Canvas draw fonksiyonu da de�i�medi.
EdgeCoordinate.drawOnCanvasStatic = (ctx, props) => {
	props = { ...EdgeCoordinate.defaultProps, ...props };
	const edge = getEdge(props);
	if (!edge) return;
	if (isDefined(edge.coordinateBase)) {
		const { rectWidth, rectHeight, arrowWidth } = edge.coordinateBase;
		const x = edge.coordinateBase.edgeXRect;
		const y = edge.coordinateBase.edgeYRect;
		ctx.fillStyle = hexToRGBA(edge.coordinateBase.fill, edge.coordinateBase.opacity);
		ctx.beginPath();
		if (edge.orient === "right") {
			ctx.moveTo(x, y + rectHeight / 2);
			ctx.lineTo(x + arrowWidth, y);
			ctx.lineTo(x + rectWidth + arrowWidth, y);
			ctx.lineTo(x + rectWidth + arrowWidth, y + rectHeight);
			ctx.lineTo(x + arrowWidth, y + rectHeight);
			ctx.closePath();
		} else if (edge.orient === "left") {
			ctx.moveTo(x, y);
			ctx.lineTo(x + rectWidth, y);
			ctx.lineTo(x + rectWidth + arrowWidth, y + rectHeight / 2);
			ctx.lineTo(x + rectWidth, y + rectHeight);
			ctx.lineTo(x, y + rectHeight);
			ctx.closePath();
		} else {
			ctx.rect(x, y, rectWidth, rectHeight);
		}
		ctx.fill();
		ctx.font = `${edge.coordinate.fontSize}px ${edge.coordinate.fontFamily}`;
		ctx.fillStyle = edge.coordinate.textFill;
		ctx.textAlign = edge.coordinate.textAnchor === "middle" ? "center" : edge.coordinate.textAnchor;
		ctx.textBaseline = "middle";
		ctx.fillText(edge.coordinate.displayCoordinate, edge.coordinate.edgeXText, edge.coordinate.edgeYText);
	}
	if (isDefined(edge.line)) {
		ctx.strokeStyle = hexToRGBA(edge.line.stroke, edge.line.opacity);
		ctx.beginPath();
		ctx.moveTo(edge.line.x1, edge.line.y1);
		ctx.lineTo(edge.line.x2, edge.line.y2);
		ctx.stroke();
	}
};

export default EdgeCoordinate;
