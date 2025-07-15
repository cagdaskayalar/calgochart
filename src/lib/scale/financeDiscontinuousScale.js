import { set, map } from "d3-collection";
import { ascending } from "d3-array";
import { scaleLinear } from "d3-scale";
import { isDefined, isNotDefined, head, last } from "../utils";
import { levelDefinition } from "./levels";

const MAX_LEVEL = levelDefinition.length - 1;

function financeDiscontinuousScale(
	index,
	futureProvider,
	backingLinearScale = scaleLinear()
) {
	if (isNotDefined(index))
		throw new Error("Use the discontinuousTimeScaleProvider to create financeDiscontinuousScale");

	const scale = x => backingLinearScale(x);

	scale.invert = x => {
		const inverted = backingLinearScale.invert(x);
		return Math.round(inverted * 10000) / 10000;
	};

	scale.domain = x => {
		if (!arguments.length) return backingLinearScale.domain();
		backingLinearScale.domain(x);
		return scale;
	};

	scale.range = x => {
		if (!arguments.length) return backingLinearScale.range();
		backingLinearScale.range(x);
		return scale;
	};

	scale.rangeRound = x => backingLinearScale.range(x);

	scale.clamp = x => {
		if (!arguments.length) return backingLinearScale.clamp();
		backingLinearScale.clamp(x);
		return scale;
	};

	scale.interpolate = x => {
		if (!arguments.length) return backingLinearScale.interpolate();
		backingLinearScale.interpolate(x);
		return scale;
	};

	scale.ticks = (m, flexTicks) => {
		const backingTicks = backingLinearScale.ticks(m);
		const ticksMap = map();

		const [domainStart, domainEnd] = backingLinearScale.domain();
		const start = Math.max(Math.ceil(domainStart), head(index).index) + Math.abs(head(index).index);
		const end = Math.min(Math.floor(domainEnd), last(index).index) + Math.abs(head(index).index);
		const desiredTickCount = Math.ceil((end - start) / (domainEnd - domainStart) * backingTicks.length);

		for (let i = MAX_LEVEL; i >= 0; i--) {
			const ticksAtLevel = ticksMap.get(i) || [];
			const temp = ticksAtLevel.slice();

			for (let j = start; j <= end; j++) {
				if (index[j].level === i) {
					temp.push(index[j]);
				}
			}
			ticksMap.set(i, temp);
		}

		let unsortedTicks = [];
		for (let i = MAX_LEVEL; i >= 0; i--) {
			if ((ticksMap.get(i).length + unsortedTicks.length) > desiredTickCount * 1.5) break;
			unsortedTicks = unsortedTicks.concat(ticksMap.get(i).map(d => d.index));
		}

		const ticks = unsortedTicks.sort(ascending);

		if (!flexTicks && end - start > ticks.length) {
			const ticksSet = set(ticks);
			const d = Math.abs(head(index).index);

			const distance = Math.ceil(
				(backingTicks.length > 0
					? (last(backingTicks) - head(backingTicks)) / (backingTicks.length) / 4
					: 1) * 1.5);

			for (let i = 0; i < ticks.length - 1; i++) {
				for (let j = i + 1; j < ticks.length; j++) {
					if (ticks[j] - ticks[i] <= distance) {
						const rem = index[ticks[i] + d].level >= index[ticks[j] + d].level ? ticks[j] : ticks[i];
						ticksSet.remove(rem);
					}
				}
			}
			return ticksSet.values().map(d => parseInt(d, 10));
		}

		return ticks;
	};

	scale.tickFormat = () => x => {
		const d = Math.abs(head(index).index);
		const { format, date } = index[Math.floor(x + d)];
		return format(date);
	};

	scale.value = x => {
		const d = Math.abs(head(index).index);
		return isDefined(index[Math.floor(x + d)]) ? index[Math.floor(x + d)].date : undefined;
	};

	scale.nice = m => {
		backingLinearScale.nice(m);
		return scale;
	};

	scale.index = x => {
		if (!arguments.length) return index;
		index = x;
		return scale;
	};

	scale.copy = () => financeDiscontinuousScale(index, futureProvider, backingLinearScale.copy());

	return scale;
}

export default financeDiscontinuousScale;
