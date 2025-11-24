import { Ctrls } from "../ctrls";
import type { ConfigItem } from "../ctrls/types";
import { dom } from "../utils/dom";

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
    name: "collapsedGroup",
    isCollapsed: true,
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
      "Option 1": "option1",
      "Option 2": "option2",
      "Option 3": "option3",
      "Option 4": "option4",
      "Option 5": "option5",
    },
  },
  {
    type: "file",
    name: "file",
  },
  {
    type: "html",
    name: "custom html",
    html: dom.button("", {
      children: ["Hello World"],
      style: "padding: 0.25rem 0.5rem;",
    }),
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
