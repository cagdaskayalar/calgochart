// src/lib/GenericChartComponent.js
// This file is part of CalgoChart, a charting library for React.
// It defines a GenericChartComponent that serves as a base for creating chart components.	
// The component handles rendering logic, event handling, and context management for charts.
// This module defines a GenericChartComponent that serves as a base for creating chart components.
// It handles rendering logic, event handling, and context management for charts.
// GenericChartComponent.js

import React, { useContext } from "react";
import GenericComponent from "./GenericComponent";
import { getMouseCanvas } from "./GenericComponent";
import { ChartCanvasContext } from "./ChartCanvas";

/**
 * GenericChartComponent, GenericComponent'i sarmalayarak grafiklere özel canvas çizim davranışı kazandırır.
 * Canvas çizimi öncesinde grafiğin orijin noktasına göre konumlama ve kırpma işlemleri yapar.
 */
function GenericChartComponent(props) {
  const chartCanvasContext = useContext(ChartCanvasContext);
  const { margin, ratio } = chartCanvasContext;

  // Canvas çiziminden önce uygulanacak işlemler (context kaydet, ölçek, orijin ayarı, kenar kırpma)
  const preCanvasDraw = (ctx, moreProps) => {
    ctx.save();
    const { chartConfig } = moreProps;
    const { width, height, origin } = chartConfig;
    // Canvas orijinini hesapla (global pixel ölçülerinde)
    const canvasOriginX = 0.5 * ratio + origin[0] + margin.left;
    const canvasOriginY = 0.5 * ratio + origin[1] + margin.top;
    // Önce tam ölçekli transform ve ölçek ayarı
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    // edgeClip aktif ise grafiğin sınırları dışına taşan çizimleri kliple (ekstra pay ile)
    if (props.edgeClip) {
      ctx.beginPath();
      ctx.rect(
        -1,
        canvasOriginY - 10,
        width + margin.left + margin.right + 1,
        height + 20
      );
      ctx.clip();
    }
    // Grafiğin orijinine kaydır
    ctx.translate(canvasOriginX, canvasOriginY);
    // clip aktif ise grafik alanı dışını kliple
    if (props.clip) {
      ctx.beginPath();
      ctx.rect(-1, -1, width + 1, height + 1);
      ctx.clip();
    }
  };

  // Canvas çiziminden sonra uygulanacak işlemler (context durumunu geri yükle)
  const postCanvasDraw = (ctx, moreProps) => {
    ctx.restore();
  };

  // GenericComponent'e özel canvas çizim fonksiyonu ve diğer override prop'larını hazırla
  const overrideProps = {
    canvasDraw: (ctx, moreProps) => {
      if (props.canvasDraw) {
        // Grafik orijinine göre çizimden önce ve sonra gerekli işlemleri uygula
        preCanvasDraw(ctx, moreProps);
        props.canvasDraw(ctx, moreProps);
        postCanvasDraw(ctx, moreProps);
      }
    },
    canvasToDraw: props.canvasToDraw || getMouseCanvas,
    // Eğer drawOn belirtilmemişse, grafik bileşenleri için yaygın tetikleyici olaylar kullan
    drawOn: props.drawOn || ["pan", "mousemove", "drag", "dragend"],
  };

  // GenericComponent'i override edilmiş prop'larla render et
  return <GenericComponent {...props} {...overrideProps} />;
}

// GenericChartComponent, GenericComponent ile aynı prop tiplerini ve varsayılanları kullanır
GenericChartComponent.propTypes = GenericComponent.propTypes;
GenericChartComponent.defaultProps = GenericComponent.defaultProps;

export default GenericChartComponent;

