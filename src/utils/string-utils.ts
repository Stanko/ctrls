export const toHtmlId = (str: string): string => {
  return `ctrls__${toKebabCase(str)}`;
};

export const toKebabCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};

// Mirrors the CamelCase type (ctrls/types.ts)
export const toCamelCase = (str: string): string => {
  return str.replace(/[-_ ]+(.)/g, (_, char: string) => char.toUpperCase());
};

export const toSpaceCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
};
