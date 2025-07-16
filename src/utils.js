import { json } from "d3-fetch";

// JSON dosyasından OHLC verilerini oku ve dönüştür
export async function fetchOHLCData(url) {
  const rawData = await json(url);
  // Dosya paralel objeler şeklinde: Time, Open, High, Low, Close
  if (rawData.Time && rawData.Open && rawData.High && rawData.Low && rawData.Close) {
	const keys = Object.keys(rawData.Time);
	return keys.map(i => ({
	  date: new Date(rawData.Time[i]),
	  open: +rawData.Open[i],
	  high: +rawData.High[i],
	  low: +rawData.Low[i],
	  close: +rawData.Close[i]
	}));
  }
  // Eski array veya {data: array} formatı için fallback
  const arr = Array.isArray(rawData) ? rawData : rawData.data;
  if (!Array.isArray(arr)) throw new Error("Veri formatı hatalı: Array veya paralel objeler bekleniyor.");
  return arr.map(d => ({
	date: new Date(d.Time),
	open: +d.Open,
	high: +d.High,
	low: +d.Low,
	close: +d.Close
  }));
}

// YKBNK_Min1.json dosyasından OHLC verisi almak için
export function getData() {
	// Public klasöründen dosya yolu
	return fetchOHLCData("/data/YKBNK_Min1.json");
}
