type Attrs = Record<string, string | number> & { for?: string };

const el = <T extends keyof HTMLElementTagNameMap>(
  tag: T,
  className = "",
  attrs: Attrs = {},
): HTMLElementTagNameMap[T] => {
  const element = document.createElement(tag);
  element.className = className;

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value.toString());
  }

  return element;
};

export const dom = {
  el,
  div: (className = "", attrs: Attrs = {}) => el("div", className, attrs),
  span: (className = "", attrs: Attrs = {}) => el("span", className, attrs),
  input: (className = "", attrs: Attrs = {}) => el("input", className, attrs),
  label: (className = "", attrs: Attrs = {}) => el("label", className, attrs),
  button: (className = "", attrs: Attrs = {}) => el("button", className, attrs),
};
