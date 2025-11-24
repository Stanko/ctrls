import { dom } from "./dom";

export const getDrawer = (
  className: string = "",
  children: (HTMLElement | null)[] = [],
  toggleButton?: HTMLButtonElement | null,
  isCollapsed = false,
) => {
  const inner = dom.div(`ctrls__drawer-inner ${className}-inner`, {
    children,
  });

  const outer = dom.div(`ctrls__drawer ${className}`, {
    children: [inner],
  });

  if (isCollapsed) {
    outer.classList.add("ctrls__drawer--collapsed");
  } else {
    outer.classList.add("ctrls__drawer--expanded");
  }

  toggleButton?.addEventListener("click", () => {
    outer.classList.add("ctrls__drawer--ready");
    outer.classList.toggle("ctrls__drawer--collapsed");
    outer.classList.toggle("ctrls__drawer--expanded");
    toggleButton?.classList.toggle("ctrls__drawer-toggle--collapsed");
  });

  return outer;
};
