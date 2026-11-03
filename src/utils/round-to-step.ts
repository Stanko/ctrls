const countDecimals = (value: number) =>
  (value.toString().split(".")[1] || "").length;

// Steps are counted from min (like native range inputs do),
// and rounding (instead of flooring) makes max reachable
export const roundToStep = (value: number, step: number, min = 0): number => {
  const decimals = Math.max(countDecimals(step), countDecimals(min));
  return +(min + Math.round((value - min) / step) * step).toFixed(decimals);
};
