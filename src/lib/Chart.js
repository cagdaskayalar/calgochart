import React from "react";
import PropTypes from "prop-types";
import { scaleLinear } from "d3-scale";
import PureComponent from "./utils/PureComponent";
import { isNotDefined, noop, find } from "./utils";

// Modern lifecycle: componentDidMount, componentWillUnmount
class Chart extends PureComponent {
	constructor(props, context) {
		super(props, context);
		this.yScale = this.yScale.bind(this);
		this.listener = this.listener.bind(this);
	}

	componentDidMount() {
		const { id } = this.props;
		const { subscribe } = this.context;
		if (subscribe) {
			subscribe("chart_" + id, { listener: this.listener });
		}
	}

	componentWillUnmount() {
		const { id } = this.props;
		const { unsubscribe } = this.context;
		if (unsubscribe) {
			unsubscribe("chart_" + id);
		}
	}

	listener(type, moreProps, state, e) {
		const { id, onContextMenu } = this.props;
		if (type === "contextmenu") {
			const { currentCharts } = moreProps;
			if (Array.isArray(currentCharts) && currentCharts.indexOf(id) > -1) {
				if (onContextMenu) onContextMenu(moreProps, e);
			}
		}
	}

	yScale() {
		const chartConfig = find(this.context.chartConfig, each => each.id === this.props.id);
		return chartConfig.yScale.copy();
	}

	getChildContext() {
		const { id: chartId } = this.props;
		const chartConfig = find(this.context.chartConfig, each => each.id === chartId);
		return { chartId, chartConfig };
	}

	render() {
		const { origin } = find(this.context.chartConfig, each => each.id === this.props.id);
		const [x, y] = origin;
		return <g transform={`translate(${x}, ${y})`}>{this.props.children}</g>;
	}
}

// PropTypes sistemi ayný kalsýn
Chart.propTypes = {
	height: PropTypes.number,
	origin: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
	id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	yExtents: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
	yExtentsCalculator: function (props, propName, componentName) {
		if (isNotDefined(props.yExtents) && typeof props.yExtentsCalculator !== "function")
			return new Error("yExtents or yExtentsCalculator must be present on " + componentName + ". Validation failed.");
	},
	onContextMenu: PropTypes.func,
	yScale: PropTypes.func,
	flipYScale: PropTypes.bool,
	padding: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.shape({ top: PropTypes.number, bottom: PropTypes.number }),
	]),
	children: PropTypes.node,
};

Chart.defaultProps = {
	id: 0,
	origin: [0, 0],
	padding: 0,
	yScale: scaleLinear(),
	flipYScale: false,
	yPan: true,
	yPanEnabled: false,
	onContextMenu: noop,
};

// Modern context tanýmý (legacy ile uyumlu)
Chart.contextTypes = {
	chartConfig: PropTypes.array,
	subscribe: PropTypes.func,
	unsubscribe: PropTypes.func,
};

Chart.childContextTypes = {
	chartConfig: PropTypes.object,
	chartId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Chart;
