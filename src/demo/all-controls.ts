import { Ctrls } from "../ctrls";
import type { ConfigItem } from "../ctrls/types";

const config = [
  {
    type: "boolean",
    name: "boolean",
  },
  {
    type: "seed",
    name: "seed",
  },
  {
    type: "easing",
    name: "easing",
  },
  {
    type: "range",
    name: "range",
    min: 0,
    max: 100,
    defaultValue: 50,
  },
  {
    type: "dual-range",
    name: "dual-range",
    min: 0,
    max: 100,
    defaultValue: { min: 25, max: 75 },
  },
  {
    type: "group",
    name: "group",
    controls: [
      {
        type: "boolean",
        name: "boolean",
      },
      {
        type: "range",
        name: "range",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
    ],
  },
  {
    type: "group",
    name: "anotherGroup",
    controls: [
      {
        type: "easing",
        name: "easing",
      },
      {
        type: "dual-range",
        name: "dual-range",
        min: 0,
        max: 100,
        defaultValue: { min: 25, max: 75 },
      },
    ],
  },
  {
    type: "radio",
    name: "radio",
    items: {
      option1: "Option 1",
      option2: "Option 2",
      option3: "Option 3",
      option4: "Option 4",
      option5: "Option 5",
    },
  },
  {
    type: "file",
    name: "file",
  },
] as const satisfies readonly ConfigItem[];

if (import.meta.env.DEV) {
  const mainElement = document.querySelector(".content") as HTMLElement;
  const wrapper = document.createElement("div");
  wrapper.className = "all-controls";

  const ctrls = new Ctrls(config, {
    title: "Ctrls",
  });

  wrapper.appendChild(ctrls.element);
  mainElement.prepend(wrapper);
}
