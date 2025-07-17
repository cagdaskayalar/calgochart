//src/lib/GenericChartComponent.js
import PropTypes from "prop-types";
import GenericComponent from "./GenericComponent";
import { isDefined, find } from "./utils";

// Hangi event tiplerinde her zaman true d�necek kontrol:
const ALWAYS_TRUE_TYPES = ["drag", "dragend"];

class GenericChartComponent extends GenericComponent {
	constructor(props, context) {
		super(props, context);

		this.preCanvasDraw = this.preCanvasDraw.bind(this);
		this.postCanvasDraw = this.postCanvasDraw.bind(this);
		this.shouldTypeProceed = this.shouldTypeProceed.bind(this);
		this.preEvaluate = this.preEvaluate.bind(this);
	}

	// Modern React: sadece didMount ve willUnmount bırakıyoruz
	componentDidMount() {
		if (super.componentDidMount) super.componentDidMount();
	}
	componentWillUnmount() {
		if (super.componentWillUnmount) super.componentWillUnmount();
	}

	preCanvasDraw(ctx, moreProps) {
		if (super.preCanvasDraw) super.preCanvasDraw(ctx, moreProps);
		ctx.save();
		const { margin, ratio } = this.context;
		const { chartConfig } = moreProps;

		const canvasOriginX = (0.5 * ratio) + chartConfig.origin[0] + margin.left;
		const canvasOriginY = (0.5 * ratio) + chartConfig.origin[1] + margin.top;

		const { width, height } = chartConfig;
		const { clip, edgeClip } = this.props;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(ratio, ratio);

		if (edgeClip) {
			ctx.beginPath();
			ctx.rect(-1, canvasOriginY - 10, width + margin.left + margin.right + 1, height + 20);
			ctx.clip();
		}

		ctx.translate(canvasOriginX, canvasOriginY);

		if (clip) {
			ctx.beginPath();
			ctx.rect(-1, -1, width + 1, height + 1);
			ctx.clip();
		}
	}

	postCanvasDraw(ctx, moreProps) {
		if (super.postCanvasDraw) super.postCanvasDraw(ctx, moreProps);
		ctx.restore();
	}

	updateMoreProps(moreProps) {
		if (super.updateMoreProps) super.updateMoreProps(moreProps);
		const { chartConfig: chartConfigList } = moreProps;

		if (chartConfigList && Array.isArray(chartConfigList)) {
			const { chartId } = this.context;
			const chartConfig = find(chartConfigList, each => each.id === chartId);
			this.moreProps.chartConfig = chartConfig;
		}
		if (isDefined(this.moreProps.chartConfig)) {
			const { origin: [ox, oy] } = this.moreProps.chartConfig;
			if (isDefined(moreProps.mouseXY)) {
				const { mouseXY: [x, y] } = moreProps;
				this.moreProps.mouseXY = [x - ox, y - oy];
			}
			if (isDefined(moreProps.startPos)) {
				const { startPos: [x, y] } = moreProps;
				this.moreProps.startPos = [x - ox, y - oy];
			}
		}
	}

	preEvaluate(/* type, moreProps */) {
		// Opsiyonel, override etmek icin burada bos bırakıyoruz.
	}

	shouldTypeProceed(type, moreProps) {
		if (
			(type === "mousemove" || type === "click") &&
			this.props.disablePan
		) {
			return true;
		}
		if (
			ALWAYS_TRUE_TYPES.indexOf(type) === -1 &&
			isDefined(moreProps) &&
			isDefined(moreProps.currentCharts)
		) {
			return (moreProps.currentCharts.indexOf(this.context.chartId) > -1);
		}
		return true;
	}
}

// PropTypes ve DefaultProps, GenericComponent'ten miras al�r
GenericChartComponent.propTypes = GenericComponent.propTypes;
GenericChartComponent.defaultProps = GenericComponent.defaultProps;

// Modern context (legacy ile uyumlu):
GenericChartComponent.contextTypes = {
	...GenericComponent.contextTypes,
	canvasOriginX: PropTypes.number,
	canvasOriginY: PropTypes.number,
	chartId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
	chartConfig: PropTypes.object.isRequired,
	ratio: PropTypes.number.isRequired,
};

export default GenericChartComponent;
