export const roundToStep = (value: number, step: number): number => {
  // decimals in step
  const decimals = (step.toString().split(".")[1] || "").length;
  return +(value - (value % step)).toFixed(decimals);
};
