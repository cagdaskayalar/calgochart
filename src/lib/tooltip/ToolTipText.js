import React from "react";
import PropTypes from "prop-types";

const ToolTipText = ({ fontFamily, fontSize, children, ...rest }) => (
	<text
		className="react-stockcharts-tooltip"
		fontFamily={fontFamily}
		fontSize={fontSize}
		{...rest}
	>
		{children}
	</text>
);

ToolTipText.propTypes = {
	fontFamily: PropTypes.string.isRequired,
	fontSize: PropTypes.number.isRequired,
	children: PropTypes.node.isRequired,
};

ToolTipText.defaultProps = {
	fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize: 11,
};

export default ToolTipText;
