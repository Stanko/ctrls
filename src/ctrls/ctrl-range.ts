import random from "../utils/random";
import { roundToStep } from "../utils/round-to-step";

import type { Ctrl, CtrlChangeHandler, CtrlItemType, ConfigFor } from "./types";
import { toHtmlId } from "../utils/string-utils";
import { dom } from "../utils/dom";

export class RangeCtrl implements Ctrl<number> {
  type: CtrlItemType = "range";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: number;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  min: number;
  max: number;
  step: number;
  element: HTMLElement;
  input: HTMLInputElement;
  valueSpan: HTMLSpanElement;

  constructor(
    config: ConfigFor<"range">,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.name = config.name;
    this.id = config.id || config.name;
    this.group = config.group || "";
    this.label = config.label || config.name;
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;
    this.min = config.min;
    this.max = config.max;
    this.step = config.step || 1;
    this.value =
      config.defaultValue === undefined
        ? this.getDefaultValue()
        : config.defaultValue;

    const { input, element, valueSpan } = this.buildUI();
    this.input = input;
    this.valueSpan = valueSpan;
    this.element = element;

    this.update(this.value);
  }

  parse = (string: string) => {
    return parseFloat(string);
  };

  getRandomValue = () => {
    const { min, max, step } = this;
    const value = random(min, max);

    return roundToStep(value, step);
  };

  getDefaultValue = () => {
    return this.min;
  };

  valueToString = (value: number = this.value) => {
    return value.toString();
  };

  buildUI = () => {
    const { min, max, step, value } = this;
    const id = toHtmlId(this.id);

    const input = dom.input("ctrls__range-input", {
      type: "range",
      id,
      name: id,
      min,
      max,
      step,
      value,
    });

    input.addEventListener("input", () => {
      this.value = this.parse(input.value);
      this.update(this.value);
      this.onInput(this);
    });

    input.addEventListener("change", () => {
      this.value = this.parse(input.value);
      this.update(this.value);
      this.onChange(this);
    });

    input.addEventListener("input", () => {
      const value = this.parse(input.value);
      const percentage = ((value - min) / (max - min)) * 100;
      this.element.style.setProperty(
        "--gradient-position",
        `${percentage.toFixed(2)}%`,
      );
    });

    const right = dom.div("ctrls__control-right", {
      children: [input],
    });

    const valueSpan = dom.span("ctrls__control-value");

    const label = dom.span("ctrls__control-label", {
      children: [this.label, valueSpan],
    });

    const element = dom.label("ctrls__control ctrls__control--range", {
      children: [label, right],
    });

    return {
      element,
      input,
      valueSpan,
    };
  };

  update = (value: number) => {
    const { min, max } = this;
    this.value = value;

    this.input.value = value.toString();
    this.valueSpan.textContent = ` (${value})`;

    const percentage = ((this.value - min) / (max - min)) * 100;
    this.element.style.setProperty(
      "--gradient-position",
      `${percentage.toFixed(2)}%`,
    );
  };
}
