export { default as Annotate } from "./Annotate";
export { default as LabelAnnotation } from "./LabelAnnotation";
export { default as SvgPathAnnotation } from "./SvgPathAnnotation";
export { default as Label } from "./Label";

const HW = 10, BW = 3, H = 20;

export const buyPath = ({ x, y }) =>
	`M${x} ${y} L${x+HW} ${y+HW} L${x+BW} ${y+HW} L${x+BW} ${y+H} L${x-BW} ${y+H} L${x-BW} ${y+HW} L${x-HW} ${y+HW} Z`;

export const sellPath = ({ x, y }) =>
	`M${x} ${y} L${x+HW} ${y-HW} L${x+BW} ${y-HW} L${x+BW} ${y-H} L${x-BW} ${y-H} L${x-BW} ${y-HW} L${x-HW} ${y-HW} Z`;
