// src/lib/scale/index.js
// This module exports various scale providers and utilities for chart rendering, including discontinuous time scales and finance scales.
// index.js

export { default as discontinuousTimeScaleProvider, discontinuousTimeScaleProviderBuilder } from "./discontinuousTimeScaleProvider";
export { default as financeDiscontinuousScale } from "./financeDiscontinuousScale";

export function defaultScaleProvider(xScale) { return (data, xAccessor) => ({ data, xScale, xAccessor, displayXAccessor: xAccessor });}