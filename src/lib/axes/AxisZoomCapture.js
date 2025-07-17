import React, { Component } from "react";
import PropTypes from "prop-types";
import { select, pointer, pointers } from "d3-selection";
import { mean } from "d3-array";

import { first, last, isDefined, noop, mousePosition, d3Window, MOUSEMOVE, MOUSEUP, TOUCHMOVE, TOUCHEND, touchPosition, getTouchProps, sign } from "../utils";

class AxisZoomCapture extends Component {
	constructor(props) {
		super(props);
		this.state = {
			startPosition: null
		};
		this.node = null;
		this.dragHappened = false;
		this.clicked = false;
		this.mouseInteraction = true;
	}

	saveNode = (node) => {
		this.node = node;
	};

	handleRightClick = (e) => {
		e.stopPropagation();
		e.preventDefault();

		const { onContextMenu } = this.props;
		const mouseXY = mousePosition(e, this.node?.getBoundingClientRect());

		select(d3Window(this.node))
			.on(MOUSEMOVE, null)
			.on(MOUSEUP, null);

		this.setState({ startPosition: null });
		if (onContextMenu) onContextMenu(mouseXY, e);
		this.contextMenuClicked = true;
	};

	handleDragStartMouse = (e) => {
		this.mouseInteraction = true;

		const { getScale, getMoreProps } = this.props;
		const startScale = getScale(getMoreProps());
		this.dragHappened = false;

		if (startScale?.invert) {
			select(d3Window(this.node))
				.on(MOUSEMOVE, this.handleDrag, false)
				.on(MOUSEUP, this.handleDragEnd, false);

			const startXY = mousePosition(e);

			this.setState({
				startPosition: { startXY, startScale }
			});
		}
		e.preventDefault();
	};

	handleDragStartTouch = (e) => {
		this.mouseInteraction = false;

		const { getScale, getMoreProps } = this.props;
		const startScale = getScale(getMoreProps());
		this.dragHappened = false;

		if (e.touches.length === 1 && startScale?.invert) {
			select(d3Window(this.node))
				.on(TOUCHMOVE, this.handleDrag)
				.on(TOUCHEND, this.handleDragEnd);

			const startXY = touchPosition(getTouchProps(e.touches[0]), e);

			this.setState({
				startPosition: { startXY, startScale }
			});
		}
	};

	handleDrag = () => {
		const { startPosition } = this.state;
		const { getMouseDelta, inverted, axisZoomCallback } = this.props;

		this.dragHappened = true;
		if (isDefined(startPosition)) {
			const { startScale, startXY } = startPosition;

			const mouseXY = this.mouseInteraction ? pointer(this.node) : pointers(this.node)[0];

			const diff = getMouseDelta(startXY, mouseXY);
			const center = mean(startScale.range());

			const tempRange = startScale.range().map(d =>
				inverted ? d - sign(d - center) * diff : d + sign(d - center) * diff
			);

			const newDomain = tempRange.map(startScale.invert);

			if (
				sign(last(startScale.range()) - first(startScale.range())) ===
				sign(last(tempRange) - first(tempRange))
			) {
				if (axisZoomCallback) axisZoomCallback(newDomain);
			}
		}
	};

	handleDragEnd = (e) => { // event'i parametre olarak al
		if (!this.dragHappened) {
			if (this.clicked) {
				const mouseXY = this.mouseInteraction
					? pointer(e, this.node) // e parametresi ile çağır
					: pointers(e, this.node)[0];
				const { onDoubleClick } = this.props;

				if (onDoubleClick) onDoubleClick(mouseXY, e);
			} else {
				this.clicked = true;
				setTimeout(() => {
					this.clicked = false;
				}, 300);
			}
		}

		select(d3Window(this.node))
			.on(MOUSEMOVE, null)
			.on(MOUSEUP, null)
			.on(TOUCHMOVE, null)
			.on(TOUCHEND, null);

		this.setState({ startPosition: null });
	};


	render() {
		const { bg, className, zoomCursorClassName } = this.props;
		const cursor = isDefined(this.state.startPosition)
			? zoomCursorClassName
			: "calgo-stockcharts-default-cursor";

		return (
			<rect
				className={`calgo-stockcharts-enable-interaction ${cursor} ${className || ""}`}
				ref={this.saveNode}
				x={bg.x}
				y={bg.y}
				opacity={0}
				height={bg.h}
				width={bg.w}
				onContextMenu={this.handleRightClick}
				onMouseDown={this.handleDragStartMouse}
				onTouchStart={this.handleDragStartTouch}
			/>
		);
	}
}

AxisZoomCapture.propTypes = {
	innerTickSize: PropTypes.number,
	outerTickSize: PropTypes.number,
	tickFormat: PropTypes.func,
	tickPadding: PropTypes.number,
	tickSize: PropTypes.number,
	ticks: PropTypes.number,
	tickValues: PropTypes.array,
	showDomain: PropTypes.bool,
	showTicks: PropTypes.bool,
	className: PropTypes.string,
	axisZoomCallback: PropTypes.func,
	inverted: PropTypes.bool,
	bg: PropTypes.object.isRequired,
	zoomCursorClassName: PropTypes.string.isRequired,
	getMoreProps: PropTypes.func.isRequired,
	getScale: PropTypes.func.isRequired,
	getMouseDelta: PropTypes.func.isRequired,
	onDoubleClick: PropTypes.func.isRequired,
	onContextMenu: PropTypes.func.isRequired,
};

AxisZoomCapture.defaultProps = {
	onDoubleClick: noop,
	onContextMenu: noop,
	inverted: true,
};

export default AxisZoomCapture;
