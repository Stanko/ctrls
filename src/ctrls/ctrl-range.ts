import random from "../utils/random";
import { roundToStep } from "../utils/round-to-step";

import type { Ctrl, CtrlChangeHandler, CtrlType, CtrlTypeRegistry } from ".";

// TODO
// Add a span with the current value
export class RangeCtrl implements Ctrl<number> {
  type: CtrlType = "range";
  name: string;
  label: string;
  value: number;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler<number>;
  onInput: CtrlChangeHandler<number>;
  min: number;
  max: number;
  step: number;
  element: HTMLElement;
  input: HTMLInputElement;

  constructor(
    config: CtrlTypeRegistry["range"]["config"],
    onChange: CtrlChangeHandler<number>,
    onInput: CtrlChangeHandler<number>,
  ) {
    this.name = config.name;
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

    const { input, element } = this.buildUI();
    this.input = input;
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

    const input = document.createElement("input");
    input.classList.add("ctrls__range-input");
    input.setAttribute("type", "range");
    input.setAttribute("min", min.toString());
    input.setAttribute("max", max.toString());
    input.setAttribute("step", step.toString());
    input.setAttribute("value", value.toString());

    input.addEventListener("input", () => {
      this.value = this.parse(input.value);
      this.onInput(this.name, this.value);
    });

    input.addEventListener("change", () => {
      this.value = this.parse(input.value);
      this.onChange(this.name, this.value);
    });

    input.addEventListener("input", () => {
      const value = this.parse(input.value);
      const percentage = ((value - min) / (max - min)) * 100;
      this.element.style.setProperty(
        "--gradient-position",
        `${percentage.toFixed(2)}%`,
      );
    });

    const right = document.createElement("div");
    right.classList.add("ctrls__control-right");
    right.append(input);

    const label = document.createElement("span");
    label.textContent = this.label;
    label.classList.add("ctrls__control-label");

    const element = document.createElement("label");
    element.classList.add("ctrls__control", "ctrls__control--range");
    element.appendChild(label);
    element.appendChild(right);

    return {
      element,
      input,
    };
  };

  update = (value: number) => {
    const { min, max } = this;
    this.value = value;

    this.input.value = value.toString();
    const percentage = ((this.value - min) / (max - min)) * 100;
    this.element.style.setProperty(
      "--gradient-position",
      `${percentage.toFixed(2)}%`,
    );
  };
}
