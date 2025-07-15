// strokeDasharray.js

export const strokeDashTypes = [
	"Solid",
	"ShortDash",
	"ShortDash2",
	"ShortDot",
	"ShortDashDot",
	"ShortDashDotDot",
	"Dot",
	"Dash",
	"LongDash",
	"DashDot",
	"LongDashDot",
	"LongDashDotDot",
];

export const getStrokeDasharray = (type) => {
	switch (type) {
		case "ShortDash":         return "6,2";
		case "ShortDash2":        return "6,3";
		case "ShortDot":          return "2,2";
		case "ShortDashDot":      return "6,2,2,2";
		case "ShortDashDotDot":   return "6,2,2,2,2,2";
		case "Dot":               return "2,6";
		case "Dash":              return "8,6";
		case "LongDash":          return "16,6";
		case "DashDot":           return "8,6,2,6";
		case "LongDashDot":       return "16,6,2,6";
		case "LongDashDotDot":    return "16,6,2,6,2,6";
		case "Solid":
		default:                  return "none";
	}
};

export const getStrokeDasharrayCanvas = (type) => {
	const str = getStrokeDasharray(type);
	if (str === "none") return [];
	return str.split(",").map(Number);
};
