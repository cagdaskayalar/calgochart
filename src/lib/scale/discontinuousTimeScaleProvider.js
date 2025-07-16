import { timeFormat, timeFormatDefaultLocale } from "d3-time-format";

import financeDiscontinuousScale from "./financeDiscontinuousScale";
import { slidingWindow, zipper, identity, isNotDefined } from "../utils";
import { levelDefinition, defaultFormatters } from "./levels";

// Turkish locale for d3-time-format
const trLocale = {
  dateTime: "%A, %e %B %Y, %X",
  date: "%d.%m.%Y",
  time: "%H:%M:%S",
  periods: ["", ""],
  days: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
  shortDays: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  shortMonths: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
};

/**
 * Verilen tarih ve seviyelere göre formatlama fonksiyonunu belirler
 */
function evaluateLevel(d, date, i, formatters) {
	return levelDefinition
		.map((levelFunc, idx) => ({
			level: levelDefinition.length - idx - 1,
			format: formatters[levelFunc(d, date, i)]
		}))
		.find(({ format }) => !!format);
}

/**
 * Sliding window yapısı ile iki tarih arasındaki seviyeleri belirleyen hesaplama
 */
const discontinuousIndexCalculator = slidingWindow()
	.windowSize(2)
	.undefinedValue((d, idx, { initialIndex, formatters }) => {
		const i = initialIndex;
		const row = {
			date: d.getTime(),
			startOf30Seconds: false,
			startOfMinute: false,
			startOf5Minutes: false,
			startOf15Minutes: false,
			startOf30Minutes: false,
			startOfHour: false,
			startOfEighthOfADay: false,
			startOfQuarterDay: false,
			startOfHalfDay: false,
			startOfDay: true,
			startOfWeek: false,
			startOfMonth: false,
			startOfQuarter: false,
			startOfYear: false,
		};
		const level = evaluateLevel(row, d, i, formatters);
		return { ...row, index: i, ...level };
	});

/**
 * Sliding window hesaplayıcısı, tarihlerin yerel saatine göre seviyeleri belirler
 */
const discontinuousIndexCalculatorLocalTime = discontinuousIndexCalculator
	.accumulator(([prevDate, nowDate], i, idx, { initialIndex, formatters }) => {
		const startOf30Seconds = nowDate.getSeconds() % 30 === 0;

		const startOfMinute = nowDate.getMinutes() !== prevDate.getMinutes();
		const startOf5Minutes = startOfMinute && nowDate.getMinutes() % 5 <= prevDate.getMinutes() % 5;
		const startOf15Minutes = startOfMinute && nowDate.getMinutes() % 15 <= prevDate.getMinutes() % 15;
		const startOf30Minutes = startOfMinute && nowDate.getMinutes() % 30 <= prevDate.getMinutes() % 30;

		const startOfHour = nowDate.getHours() !== prevDate.getHours();

		const startOfEighthOfADay = startOfHour && nowDate.getHours() % 3 === 0;
		const startOfQuarterDay = startOfHour && nowDate.getHours() % 6 === 0;
		const startOfHalfDay = startOfHour && nowDate.getHours() % 12 === 0;

		const startOfDay = nowDate.getDay() !== prevDate.getDay();

		const startOfWeek = nowDate.getDay() < prevDate.getDay();

		const startOfMonth = nowDate.getMonth() !== prevDate.getMonth();

		const startOfQuarter = startOfMonth && (nowDate.getMonth() % 3 <= prevDate.getMonth() % 3);

		const startOfYear = nowDate.getFullYear() !== prevDate.getFullYear();

		const row = {
			date: nowDate.getTime(),
			startOf30Seconds,
			startOfMinute,
			startOf5Minutes,
			startOf15Minutes,
			startOf30Minutes,
			startOfHour,
			startOfEighthOfADay,
			startOfQuarterDay,
			startOfHalfDay,
			startOfDay,
			startOfWeek,
			startOfMonth,
			startOfQuarter,
			startOfYear,
		};

		const level = evaluateLevel(row, nowDate, i, formatters);

		if (!level) {
			console.warn("No level found for row:", row);
		}

		return { ...row, index: i + initialIndex, ...level };
	});

/**
 * Discontinuous index hesaplamasını sağlayan temel fonksiyon
 * @param {*} realDateAccessor Gerçek tarih erişimi (UTC veya local)
 * @param {*} inputDateAccessor Veri içindeki tarih erişimi
 * @param {*} initialIndex Başlangıç indeksi
 * @param {*} formatters Tarih formatlayıcılar
 */
function doStuff(realDateAccessor, inputDateAccessor, initialIndex, formatters) {
	return (data) => {
		const dateAccessor = realDateAccessor(inputDateAccessor);
		const calculate = discontinuousIndexCalculatorLocalTime
			.source(dateAccessor)
			.misc({ initialIndex, formatters });

		const index = calculate(data).map(each => ({
			index: each.index,
			level: each.level,
			date: new Date(each.date),
			format: timeFormat(each.format),
		}));

		return { index };
	};
}

/**
 * DiscontinuousTimeScaleProvider yapıcı fonksiyonu
 */
export function discontinuousTimeScaleProviderBuilder() {
	let initialIndex = 0;
	let realDateAccessor = identity;
	let inputDateAccessor = d => d.date;
	let indexAccessor = d => d.idx;
	let indexMutator = (d, idx) => ({ ...d, idx });
	let withIndex;

	let currentFormatters = defaultFormatters;

const discontinuousTimeScaleProvider = function (data) {
  // Always set Turkish locale before scale creation
  timeFormatDefaultLocale(trLocale);
		let index = withIndex;

		if (isNotDefined(index)) {
			const response = doStuff(
				realDateAccessor,
				inputDateAccessor,
				initialIndex,
				currentFormatters
			)(data);
			index = response.index;
		}

		const xScale = financeDiscontinuousScale(index);

		const mergedData = zipper().combine(indexMutator);
		const finalData = mergedData(data, index);

		return {
			data: finalData,
			xScale,
			xAccessor: d => d && indexAccessor(d).index,
			displayXAccessor: realDateAccessor(inputDateAccessor),
		};
	};

	discontinuousTimeScaleProvider.initialIndex = function (x) {
		if (!arguments.length) return initialIndex;
		initialIndex = x;
		return discontinuousTimeScaleProvider;
	};

	discontinuousTimeScaleProvider.inputDateAccessor = function (x) {
		if (!arguments.length) return inputDateAccessor;
		inputDateAccessor = x;
		return discontinuousTimeScaleProvider;
	};

	discontinuousTimeScaleProvider.indexAccessor = function (x) {
		if (!arguments.length) return indexAccessor;
		indexAccessor = x;
		return discontinuousTimeScaleProvider;
	};

	discontinuousTimeScaleProvider.indexMutator = function (x) {
		if (!arguments.length) return indexMutator;
		indexMutator = x;
		return discontinuousTimeScaleProvider;
	};

	discontinuousTimeScaleProvider.withIndex = function (x) {
		if (!arguments.length) return withIndex;
		withIndex = x;
		return discontinuousTimeScaleProvider;
	};

	discontinuousTimeScaleProvider.utc = function () {
		realDateAccessor = (dateAccessor) => (d) => {
			const date = dateAccessor(d);
			const offsetInMillis = date.getTimezoneOffset() * 60 * 1000;
			return new Date(date.getTime() + offsetInMillis);
		};
		return discontinuousTimeScaleProvider;
	};

discontinuousTimeScaleProvider.setLocale = function (locale, formatters = null) {
	if (locale) timeFormatDefaultLocale(locale);
	if (formatters) currentFormatters = formatters;
	return discontinuousTimeScaleProvider;
};

	discontinuousTimeScaleProvider.indexCalculator = function () {
		return doStuff(realDateAccessor, inputDateAccessor, initialIndex, currentFormatters);
	};

	return discontinuousTimeScaleProvider;
}

export default discontinuousTimeScaleProviderBuilder();
