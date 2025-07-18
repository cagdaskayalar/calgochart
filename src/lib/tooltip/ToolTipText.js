// src/lib/tooltip/ToolTipText.js
// This module defines a ToolTipText component that serves as a wrapper for SVG <text> elements used in tooltips.
// It allows for customizable font family, size, and other SVG text properties, making it reusable across different tooltip implementations.
// ToolTipText.js

import React from "react";
import PropTypes from "prop-types";

/**
 * ToolTipText
 * Tooltiplerde ortak kullanılan bir <text> wrapper'ı.
 * @param {string} fontFamily - Yazı fontu (default: Helvetica Neue, Helvetica, Arial, sans-serif)
 * @param {number} fontSize - Yazı boyutu (default: 11)
 * @param {ReactNode} children - İçerik
 * @param {object} rest - Diğer SVG <text> props'ları
 */
const ToolTipText = ({
	fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize = 11,
	children,
	...rest
}) => (
	<text
		className="calgo-stockcharts-tooltip"
		fontFamily={fontFamily}
		fontSize={fontSize}
		{...rest}
	>
		{children}
	</text>
);

ToolTipText.propTypes = {
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number,
	children: PropTypes.node.isRequired,
};

export default ToolTipText;
