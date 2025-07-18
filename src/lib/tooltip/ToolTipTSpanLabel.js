// src/lib/tooltip/ToolTipTSpanLabel.js
// This module defines a ToolTipTSpanLabel component that renders a <tspan> element for displaying labels in tooltips.
// It allows for customizable fill color and other SVG attributes, making it reusable across different tooltip implementations.
// ToolTipTSpanLabel.js

import React from "react";
import PropTypes from "prop-types";

const ToolTipTSpanLabel = ({ children, fill="#4682B4", ...rest }) => (
	<tspan className="calgo-stockcharts-tooltip-label" fill={fill} {...rest}>
		{children}
	</tspan>
);

ToolTipTSpanLabel.propTypes = {
	children: PropTypes.node.isRequired,
	fill: PropTypes.string.isRequired,
};

export default ToolTipTSpanLabel;
