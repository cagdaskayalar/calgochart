/**
 * CrossHairCursor
 * ----------------------------------------------------
 * Grafik/Chart üzerinde mouse veya seçili veri noktası (snapX) bazlı interaktif crosshair (dik kesişen çizgiler) gösterir.
 * Hem SVG hem Canvas olarak çizebilir; zoom/pan/drag ile otomatik güncellenir.
 * 
 * Params:
 *  - className: (string) Ekstra CSS sınıfı.
 *  - stroke: (string) Crosshair çizgi rengi. Varsayılan "#000000".
 *  - opacity: (number) Crosshair çizgi opaklığı. Varsayılan 0.3.
 *  - strokeDasharray: (string) Çizgi tipini belirler (ör: "ShortDash"). Varsayılan "ShortDash".
 *  - snapX: (bool) X çizgisinin, mouse yerine en yakın veri noktasına snap olup olmayacağı. true = snap, false = mouse pozisyonu.
 *  - customX: (function) X çizgisinin pozisyonunu özel belirlemek için fonksiyon. Varsayılan `defaultCustomX`.
 *  - margin: (object) Chart'ın sol/üst boşlukları, canvas koordinatı için kullanılır.
 *  - ratio: (number) Pixel density oranı (özellikle retina ekranlar için).
 *  - ...rest: Diğer parametreler otomatik GenericComponent'e geçer.
 * 
 * Kullanım:
 *  <CrossHairCursor stroke="#ff0000" opacity={0.6} snapX={false} />
 */
import React, { useCallback } from "react";
import PropTypes from "prop-types";
import GenericComponent, { getMouseCanvas } from "../GenericComponent";
import { hexToRGBA, isDefined, isNotDefined, strokeDashTypes, getStrokeDasharray } from "../utils";

/**
 * Varsayılan X çizgisi pozisyonu fonksiyonu.
 * Eğer snapX true ise, X çizgisi en yakın veri noktasında olur. Değilse mouse X pozisyonunda olur.
 * @param {object} props CrossHairCursor props'u
 * @param {object} moreProps Chart'ın context'i (xScale, xAccessor, currentItem, mouseXY vs)
 */
function defaultCustomX(props, moreProps) {
	const { xScale, xAccessor, currentItem, mouseXY } = moreProps;
	return props.snapX
		? Math.round(xScale(xAccessor(currentItem)))
		: mouseXY[0];
}

/**
 * CrossHairCursor ana component fonksiyonu.
 * Hem SVG hem de Canvas olarak çizim yapar. Mouse hareketlerinde ve pan/drag eventlerinde aktif olur.
 */
function CrossHairCursor({
	className,
	stroke = "#000000",
	opacity = 0.3,
	strokeDasharray = "ShortDash",
	snapX = true,
	customX = defaultCustomX,
	margin = { left: 0, top: 0 },
	ratio = 1,
	...rest
}) {
	/**
	 * SVG olarak çizim fonksiyonu.
	 * Helper'dan çizgi koordinatlarını alır, <line> SVG elementleri olarak döner.
	 */
	const renderSVG = useCallback(
		(moreProps) => {
			const lines = helper({ className, stroke, opacity, strokeDasharray, snapX, customX }, moreProps);
			if (isNotDefined(lines)) return null;
			return (
				<g className={`calgo-stockcharts-crosshair ${className || ""}`}>
					{lines.map(({ strokeDasharray, ...restLine }, idx) =>
						<line key={idx} strokeDasharray={getStrokeDasharray(strokeDasharray)} {...restLine} />
					)}
				</g>
			);
		},
		[className, stroke, opacity, strokeDasharray, snapX, customX]
	);

	/**
	 * Canvas üzerinde çizim fonksiyonu.
	 * Yine helper'dan koordinatlar alınır ve doğrudan canvas'a çizilir.
	 * @param {CanvasRenderingContext2D} ctx - Canvas context'i
	 * @param {object} moreProps - Chart context'i ve mouse pozisyonu
	 */
	const drawOnCanvas = useCallback(
		(ctx, moreProps) => {
			const lines = helper({ className, stroke, opacity, strokeDasharray, snapX, customX }, moreProps);
			if (isDefined(lines)) {
				ctx.save();
				ctx.setTransform(1, 0, 0, 1, 0, 0);              // Transform reset
				ctx.scale(ratio, ratio);                         // Retina destek için
				ctx.translate(0.5 * ratio + margin.left, 0.5 * ratio + margin.top); // Chart'ın margin'ini uygula
				lines.forEach(line => {
					ctx.strokeStyle = hexToRGBA(line.stroke, line.opacity);
					ctx.setLineDash(getStrokeDasharray(line.strokeDasharray).split(",").map(Number));
					ctx.beginPath();
					ctx.moveTo(line.x1, line.y1);
					ctx.lineTo(line.x2, line.y2);
					ctx.stroke();
				});
				ctx.restore();
			}
		},
		[className, stroke, opacity, strokeDasharray, snapX, customX, margin, ratio]
	);

	return (
		<GenericComponent
			svgDraw={renderSVG}                   // SVG çizim fonksiyonu
			clip={false}                          // Crosshair chart dışına taşmasın
			canvasDraw={drawOnCanvas}             // Canvas çizim fonksiyonu
			canvasToDraw={getMouseCanvas}         // Hangi canvas'ta çizileceğini belirler (mouse hareketlerinde)
			drawOn={["mousemove", "pan", "drag"]} // Hangi eventlerde güncellensin
			{...rest}
		/>
	);
}

/**
 * Çizilecek crosshair çizgilerinin koordinatlarını hesaplar.
 * Dönüş: [yatay çizgi objesi, dikey çizgi objesi]
 */
function helper(props, moreProps) {
	const { mouseXY, currentItem, show, height, width } = moreProps;
	const { customX, stroke, opacity, strokeDasharray } = props;
	if (!show || isNotDefined(currentItem)) return null;

	const line1 = { x1: 0, x2: width, y1: mouseXY[1], y2: mouseXY[1], stroke, strokeDasharray, opacity };
	const x = customX(props, moreProps);
	const line2 = { x1: x, x2: x, y1: 0, y2: height, stroke, strokeDasharray, opacity };
	return [line1, line2];
}

CrossHairCursor.propTypes = {
	className: PropTypes.string,                       // Ekstra CSS class
	strokeDasharray: PropTypes.oneOf(strokeDashTypes), // Çizgi tipi
	stroke: PropTypes.string,                          // Renk
	opacity: PropTypes.number,                         // Opaklık
	snapX: PropTypes.bool,                             // X çizgisi snap mi
	customX: PropTypes.func,                           // Özel pozisyon fonksiyonu
	margin: PropTypes.object,                          // Chart margin
	ratio: PropTypes.number,                           // Retina/Zoom oranı
};

export default CrossHairCursor;
