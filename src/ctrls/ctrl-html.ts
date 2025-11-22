import type { HTMLConfig } from "./types";

export const getHTMLControlElement = (config: HTMLConfig) => {
  const right = document.createElement("div");
  right.classList.add("ctrls__control-right");
  right.append(config.html);

  const label = document.createElement("label");
  label.textContent = config.label || config.name;
  label.classList.add("ctrls__control-label");

  const element = document.createElement("div");
  element.classList.add("ctrls__control", "ctrls__control--seed");
  element.appendChild(label);
  element.appendChild(right);

  return element;
};
