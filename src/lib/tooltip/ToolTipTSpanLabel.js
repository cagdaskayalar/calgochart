import React from "react";
import PropTypes from "prop-types";

const ToolTipTSpanLabel = ({ children, fill, ...rest }) => (
	<tspan className="react-stockcharts-tooltip-label" fill={fill} {...rest}>
		{children}
	</tspan>
);

ToolTipTSpanLabel.propTypes = {
	children: PropTypes.node.isRequired,
	fill: PropTypes.string.isRequired,
};

ToolTipTSpanLabel.defaultProps = {
	fill: "#4682B4"
};

export default ToolTipTSpanLabel;
