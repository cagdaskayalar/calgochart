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
