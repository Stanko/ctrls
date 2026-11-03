import random from "../utils/random";
import { roundToStep } from "../utils/round-to-step";

import type { ConfigFor } from "./types";
import { BaseCtrl, type BaseCtrlArgs } from "./ctrl-base";
import { toHtmlId } from "../utils/string-utils";
import { dom } from "../utils/dom";

export class RangeCtrl extends BaseCtrl<number> {
  type = "range" as const;
  min: number;
  max: number;
  step: number;
  input: HTMLInputElement;
  valueSpan: HTMLSpanElement;

  constructor(config: ConfigFor<"range">, ...args: BaseCtrlArgs) {
    super(config, ...args);
    this.min = config.min;
    this.max = config.max;
    this.step = config.step || 1;
    this.value = config.defaultValue ?? this.getDefaultValue();

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

    return roundToStep(value, step, min);
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

    const right = dom.div("ctrls__control-right", {
      children: [input],
    });

    const valueSpan = dom.span("ctrls__control-value");

    const label = dom.span("ctrls__control-label", {
      children: [this.label, " ", valueSpan],
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
    this.valueSpan.textContent = `(${value})`;

    const percentage = ((this.value - min) / (max - min)) * 100;
    this.element.style.setProperty(
      "--gradient-position",
      `${percentage.toFixed(2)}%`,
    );
  };
}
