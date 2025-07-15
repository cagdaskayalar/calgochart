// src/docs/App.jsx

import React, { useEffect, useState } from "react";
import { TypeChooser } from "react-stockcharts/lib/helper";
import { tsvParse } from "d3-dsv";
import { timeParse } from "d3-time-format";

import Chart from "react-stockcharts/lib/charts/CandleStickChartWithZoomPan";

const parseDate = timeParse("%Y-%m-%d");

function parseData(parse) {
  return (d) => {
    d.date = parse(d.date);
    d.open = +d.open;
    d.high = +d.high;
    d.low = +d.low;
    d.close = +d.close;
    d.volume = +d.volume;
    return d;
  };
}

export default function App() {
  const [dataFull, setDataFull] = useState(null);

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/data/MSFT_full.tsv");
      const text = await response.text();
      const parsed = tsvParse(text, parseData(parseDate));
      setDataFull(parsed);
    }
    loadData();
  }, []);

  if (!dataFull) return <div>Loading data...</div>;

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <TypeChooser type="hybrid" style={{ position: "absolute", top: 40, bottom: 0, left: 0, right: 0 }}>
        {(type) => <Chart data={dataFull} type={type} />}
      </TypeChooser>
    </div>
  );
}
