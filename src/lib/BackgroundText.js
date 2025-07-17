import React from "react";
import PropTypes from "prop-types";
import PureComponent from "./utils/PureComponent";
import { hexToRGBA, isDefined } from "./utils";

class BackgroundText extends PureComponent {
	componentDidMount() {
		this.drawIfCanvas();
	}
	componentDidUpdate() {
		this.drawIfCanvas();
	}
	drawIfCanvas() {
		const { chartCanvasType, getCanvasContexts } = this.context;
		if (chartCanvasType !== "svg" && isDefined(getCanvasContexts)) {
			const contexts = getCanvasContexts();
			if (contexts) {
				BackgroundText.drawOnCanvas(
					contexts.bg,
					this.props,
					this.context,
					this.props.children
				);
			}
		}
	}
	render() {
		const { chartCanvasType } = this.context;
		if (chartCanvasType !== "svg") return null;
		const {
			x, y, fill, opacity, stroke, strokeOpacity,
			fontFamily, fontSize, textAnchor, children
		} = this.props;
		const props = { x, y, fill, opacity, stroke, strokeOpacity, fontFamily, fontSize, textAnchor };
		return (
			<text {...props}>
				{typeof children === "function"
					? children(this.context.interval)
					: children}
			</text>
		);
	}
}

// Statik canvas cizim fonksiyonu
BackgroundText.drawOnCanvas = (ctx, props, { interval }, getText) => {
	ctx.clearRect(-1, -1, ctx.canvas.width + 2, ctx.canvas.height + 2);
	ctx.save();

	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.translate(0.5, 0.5);

	const { x, y, fill, opacity, stroke, strokeOpacity, fontFamily, fontSize, textAnchor } = props;
	const text = typeof getText === "function" ? getText(interval) : getText;

	ctx.strokeStyle = hexToRGBA(stroke, strokeOpacity);
	ctx.font = `${fontSize}px ${fontFamily}`;
	ctx.fillStyle = hexToRGBA(fill, opacity);
	ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor;

	if (stroke !== "none") ctx.strokeText(text, x, y);
	ctx.fillText(text, x, y);

	ctx.restore();
};

BackgroundText.propTypes = {
	x: PropTypes.number.isRequired,
	y: PropTypes.number.isRequired,
	fontFamily: PropTypes.string,
	fontSize: PropTypes.number.isRequired,
	fill: PropTypes.string,
	stroke: PropTypes.string,
	opacity: PropTypes.number,
	strokeOpacity: PropTypes.number,
	textAnchor: PropTypes.string,
	children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
};

BackgroundText.defaultProps = {
	opacity: 0.3,
	fill: "#9E7523",
	stroke: "#9E7523",
	strokeOpacity: 1,
	fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
	fontSize: 12,
	textAnchor: "middle",
};

BackgroundText.contextTypes = {
	interval: PropTypes.string.isRequired,
	getCanvasContexts: PropTypes.func,
	chartCanvasType: PropTypes.string,
};

export default BackgroundText;
