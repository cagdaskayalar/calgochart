import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

// data: [{ date, open, high, low, close }]
const OhlcChart = ({ data, width = 600, height = 400, margin = 40 }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data?.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // temizle

    // Ölçekler
    const x = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([margin, width - margin])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.low), d3.max(data, d => d.high)])
      .nice()
      .range([height - margin, margin]);

    // Eksenler
    svg.append("g")
      .attr("transform", `translate(0,${height - margin})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")).tickValues(x.domain().filter((d,i) => i%Math.ceil(data.length/10)===0)))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(y));

    // OHLC Barlar
    svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(${x(d.date)},0)`)
      .each(function (d) {
        const g = d3.select(this);
        // Dikey çizgi: high-low
        g.append("line")
          .attr("y1", y(d.low))
          .attr("y2", y(d.high))
          .attr("x1", x.bandwidth() / 2)
          .attr("x2", x.bandwidth() / 2)
          .attr("stroke", "#222")
          .attr("stroke-width", 1);

        // Sol: open
        g.append("line")
          .attr("y1", y(d.open))
          .attr("y2", y(d.open))
          .attr("x1", 0)
          .attr("x2", x.bandwidth() / 2)
          .attr("stroke", d.close > d.open ? "green" : "red")
          .attr("stroke-width", 2);

        // Sað: close
        g.append("line")
          .attr("y1", y(d.close))
          .attr("y2", y(d.close))
          .attr("x1", x.bandwidth() / 2)
          .attr("x2", x.bandwidth())
          .attr("stroke", d.close > d.open ? "green" : "red")
          .attr("stroke-width", 2);
      });

  }, [data, width, height, margin]);

  return <svg ref={ref} width={width} height={height} style={{ background: "#fff" }} />;
};

export default OhlcChart;
