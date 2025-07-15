import React from "react";
import OhlcChart from "./lib/OhlcChart";
import './App.css';


const data = [
  { date: new Date("1980-12-12"), open: 0.51, high: 0.61, low: 0.41, close: 0.52, volume: 117258400 },
  { date: new Date("1980-12-15"), open: 0.52, high: 0.62, low: 0.42, close: 0.53, volume: 43971200 },
  { date: new Date("1980-12-16"), open: 0.53, high: 0.63, low: 0.43, close: 0.54, volume: 26432000 },
  { date: new Date("1980-12-17"), open: 0.54, high: 0.64, low: 0.44, close: 0.55, volume: 21610400 },
  { date: new Date("1980-12-18"), open: 0.55, high: 0.65, low: 0.45, close: 0.56, volume: 18362400 },
  { date: new Date("1980-12-19"), open: 0.56, high: 0.66, low: 0.46, close: 0.57, volume: 12157600 },
  { date: new Date("1980-12-22"), open: 0.57, high: 0.67, low: 0.47, close: 0.58, volume: 9340800 },
  { date: new Date("1980-12-23"), open: 0.57, high: 0.68, low: 0.48, close: 0.59, volume: 11737600 },
  { date: new Date("1980-12-24"), open: 0.59, high: 0.69, low: 0.49, close: 0.60, volume: 12000800 },
  { date: new Date("1980-12-26"), open: 0.60, high: 0.70, low: 0.50, close: 0.61, volume: 13893600 },
  { date: new Date("1980-12-29"), open: 0.61, high: 0.71, low: 0.51, close: 0.62, volume: 23290400 },
  { date: new Date("1980-12-30"), open: 0.62, high: 0.72, low: 0.52, close: 0.63, volume: 17220000 },
];

function App() {
  return (
    <div className="App">     
      <div>
        <OhlcChart data={data} width={800} height={400} />
      </div>
    </div>
  );
}

export default App;
