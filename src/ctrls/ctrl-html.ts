import { dom } from "../utils/dom";
import type { HTMLConfig } from "./types";

export const getHTMLControlElement = (config: HTMLConfig) => {
  const right = dom.div("ctrls__control-right", {
    children: [config.html],
  });

  const label = dom.label("ctrls__control-label", {
    children: [config.label || config.name],
  });

  const element = dom.div("ctrls__control ctrls__control--seed", {
    children: [label, right],
  });

  return element;
};
