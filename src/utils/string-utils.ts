export const toHtmlId = (str: string): string => {
  return `ctrls__${toKebabCase(str)}`;
};

export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
};

export const toSpaceCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
};
