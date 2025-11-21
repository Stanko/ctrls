import { Ctrls } from "../ctrls";
import type { TypedControlConfig } from "../ctrls";
import { Grid } from "./grid";

export const config = [
  {
    type: "boolean",
    name: "animate",
    defaultValue: true,
    isRandomizationDisabled: true,
  },
  // {
  //   type: "group",
  //   name: "demo",
  //   controls: [
  //     {
  //       type: "radio",
  //       name: "shape",
  //       defaultValue: "6",
  //       items: {
  //         triangle: "3",
  //         hexagon: "6",
  //         circle: "32",
  //       },
  //     },
  //     {
  //       type: "dual-range",
  //       name: "size",
  //       defaultValue: {
  //         min: 0,
  //         max: 1,
  //       },
  //       min: 0,
  //       max: 1.2,
  //       step: 0.1,
  //     },
  //   ],
  // },
  // {
  //   type: "group",
  //   name: "elements",
  //   controls: [
  //     {
  //       type: "radio",
  //       name: "shape",
  //       defaultValue: "6",
  //       items: {
  //         triangle: "3",
  //         hexagon: "6",
  //         circle: "32",
  //       },
  //     },
  //     {
  //       type: "dual-range",
  //       name: "size",
  //       defaultValue: {
  //         min: 0,
  //         max: 1,
  //       },
  //       min: 0,
  //       max: 1.2,
  //       step: 0.1,
  //     },
  //     {
  //       type: "easing",
  //       name: "distribution",
  //     },
  //   ],
  // },
  {
    type: "seed",
    name: "opacitySeed",
  },
  {
    type: "range",
    name: "hue",
    defaultValue: 220,
    min: 0,
    max: 360,
    step: 1,
  },
  {
    type: "range",
    name: "speed",
    defaultValue: 2,
    min: 1,
    max: 3,
    step: 0.5,
  },
  {
    type: "radio",
    name: "shape",
    defaultValue: "6",
    items: {
      triangle: "3",
      hexagon: "6",
      circle: "32",
    },
  },
  {
    type: "dual-range",
    name: "size",
    defaultValue: {
      min: 0,
      max: 1,
    },
    min: 0,
    max: 1.2,
    step: 0.1,
  },
] as const satisfies readonly TypedControlConfig[];

export const options = new Ctrls(config, {
  // storage: "hash",
  // theme: "dark",
  title: "Ctrls",
});

const hero = document.querySelector(".hero") as HTMLElement;
const heroControls = document.querySelector(".hero__controls") as HTMLElement;

const update = () => {
  const values = options.getValues();

  options.element.style.setProperty("--ctrls-h", values.hue.toString());
  document.documentElement.style.setProperty("--h", values.hue.toString());
};

options.onChange = (updatedValues) => {
  const values = options.getValues();

  if (updatedValues.animate) {
    grid.animate();
  } else if (!values.animate) {
    grid.drawFrame();
  }

  if (updatedValues.opacitySeed) {
    grid.updateOpacity();
  }

  if (updatedValues.hue) {
    update();
  }
};

options.onInput = (updatedValues) => {
  if (updatedValues.hue) {
    update();
  }
};

update();

heroControls.appendChild(options.element);

const grid = new Grid(hero.clientWidth, hero.clientHeight);
hero.appendChild(grid.svg);
// Update the grid after it is rendered
grid.handleScroll();

// Resize observer
const resizeObserver = new ResizeObserver(() => {
  grid.resize(hero.clientWidth, hero.clientHeight);
});
resizeObserver.observe(hero);
