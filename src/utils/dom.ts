type Attrs = {
  [key: string]: unknown;
  for?: string;
  children?: (HTMLElement | SVGSVGElement | string | undefined | null)[];
  innerHTML?: string;
};

type SVGAttrs = {
  [key: string]: unknown;
  for?: string;
  children?: (SVGElement | string)[];
  innerHTML?: string;
};

// ----- DOM ----- //

const el = <T extends keyof HTMLElementTagNameMap>(
  tag: T,
  className = "",
  attrs: Attrs = {},
): HTMLElementTagNameMap[T] => {
  const element = document.createElement(tag);
  element.className = className;

  // Add children and innerHTML and remove them from attrs
  if (attrs.children) {
    attrs.children
      // Remove falsy children
      .filter(Boolean)
      .forEach((child) => {
        element.append(child as HTMLElement | SVGSVGElement | string);
      });
    delete attrs.children;
  } else if (attrs.innerHTML) {
    element.innerHTML = attrs.innerHTML;
    delete attrs.innerHTML;
  }

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }

  return element;
};

// ----- SVG ----- //

const svgEl = <T extends keyof SVGElementTagNameMap>(
  tag: T,
  className = "",
  attrs: SVGAttrs = {},
): SVGElementTagNameMap[T] => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  // className is deprecated for SVG elements
  element.classList.add(...className.split(" ").filter(Boolean));

  // Add children and innerHTML and remove them from attrs
  if (attrs.children) {
    attrs.children.forEach((child) => {
      element.append(child);
    });
    delete attrs.children;
  } else if (attrs.innerHTML) {
    element.innerHTML = attrs.innerHTML;
    delete attrs.innerHTML;
  }

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, String(value));
  }

  return element;
};

// ----- API ----- //

export const dom = {
  div: (className = "", attrs: Attrs = {}) => el("div", className, attrs),
  span: (className = "", attrs: Attrs = {}) => el("span", className, attrs),
  input: (className = "", attrs: Attrs = {}) => el("input", className, attrs),
  label: (className = "", attrs: Attrs = {}) => el("label", className, attrs),
  button: (className = "", attrs: Attrs = {}) => el("button", className, attrs),
  img: (className = "", attrs: Attrs = {}) => el("img", className, attrs),
  figure: (className = "", attrs: Attrs = {}) => el("figure", className, attrs),
  figcaption: (className = "", attrs: Attrs = {}) =>
    el("figcaption", className, attrs),

  // SVG elements
  svg: (className = "", attrs: SVGAttrs = {}) => svgEl("svg", className, attrs),
  path: (className = "", attrs: SVGAttrs = {}) =>
    svgEl("path", className, attrs),
  line: (className = "", attrs: SVGAttrs = {}) =>
    svgEl("line", className, attrs),
  circle: (className = "", attrs: SVGAttrs = {}) =>
    svgEl("circle", className, attrs),
  rect: (className = "", attrs: SVGAttrs = {}) =>
    svgEl("rect", className, attrs),
};
