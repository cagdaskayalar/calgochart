// D3 time scale tick levels and formatters for Turkish locale

export const levelDefinition = [
  // Her bir fonksiyon, tick seviyesini belirler
  d => d.startOfYear ? "year" : null,
  d => d.startOfMonth ? "month" : null,
  d => d.startOfDay ? "day" : null,
  d => d.startOfHour ? "hour" : null,
  d => d.startOfMinute ? "minute" : null,
  d => d.startOf30Seconds ? "second" : null,
];

export const defaultFormatters = {
  year: "%Y", // 2025
  month: "%b %Y", // Tem 2025
  day: "%d %b", // 17 Tem
  hour: "%H:%M", // 14:30
  minute: "%H:%M", // 14:30
  second: "%H:%M:%S", // 14:30:15
};
