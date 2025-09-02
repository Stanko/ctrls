import { Ctrls } from "../ctrls";
import type { TypedControlConfig } from "../ctrls";

export const config = [
  {
    type: "range",
    name: "hue",
    defaultValue: 245,
    min: 0,
    max: 360,
    step: 1,
  },
  {
    type: "range",
    name: "chroma",
    defaultValue: 0.25,
    min: 0,
    max: 0.37,
    step: 0.01,
  },
  {
    type: "range",
    name: "radius",
    defaultValue: 4,
    min: 0,
    max: 20,
    step: 1,
  },
  {
    type: "radio",
    name: "theme",
    defaultValue: "system",
    items: {
      system: "system",
      light: "light",
      dark: "dark",
    },
  },
] as const satisfies readonly TypedControlConfig[];

export const themeControls = new Ctrls(config, {
  storage: "none",
  // theme: "dark",
});

const element = document.querySelector(".theme-controls") as HTMLElement;

element.appendChild(themeControls.element);

themeControls.onInput = () => {
  const options = themeControls.getValues();

  themeControls.element.style.setProperty("--ctrls-h", options.hue.toString());
  themeControls.element.style.setProperty(
    "--ctrls-c",
    options.chroma.toString(),
  );
  themeControls.element.style.setProperty(
    "--ctrls-radius",
    options.radius + "px",
  );
  themeControls.element.style.setProperty(
    "--ctrls-range-thumb-radius",
    options.radius / 2 + "px",
  );

  themeControls.element.classList.remove(
    "ctrls--system-theme",
    "ctrls--light-theme",
    "ctrls--dark-theme",
  );
  themeControls.element.classList.add(`ctrls--${options.theme}-theme`);
};
