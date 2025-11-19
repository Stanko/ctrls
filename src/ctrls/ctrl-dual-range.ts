import random from "../utils/random";
import DualRangeInput from "@stanko/dual-range-input";

import type { Ctrl, CtrlChangeHandler, CtrlType, ConfigFor } from ".";
import { roundToStep } from "../utils/round-to-step";
import { toHtmlId } from "../utils/string-utils";

export type DualRangeControlOptions = {
  min: number;
  max: number;
  step?: number;
};

export type DualRangeValue = {
  min: number;
  max: number;
};

export class DualRangeCtrl implements Ctrl<DualRangeValue> {
  type: CtrlType = "dual-range";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: DualRangeValue;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  min: number;
  max: number;
  step: number;
  element: HTMLElement;
  minInput: HTMLInputElement;
  maxInput: HTMLInputElement;
  dualRange: DualRangeInput;
  valueSpan: HTMLSpanElement;

  constructor(
    config: ConfigFor<"dual-range">,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.name = config.name;
    this.id = config.id || config.name;
    this.group = config.group || "";
    this.label = config.label || config.name;
    this.min = config.min;
    this.max = config.max;
    this.step = config.step || 1;
    this.value =
      config.defaultValue === undefined
        ? this.getDefaultValue()
        : config.defaultValue;
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;

    const { minInput, maxInput, element, valueSpan } = this.buildUI();
    this.minInput = minInput;
    this.maxInput = maxInput;
    this.element = element;
    this.valueSpan = valueSpan;

    this.dualRange = new DualRangeInput(this.minInput, this.maxInput);
    this.update(this.value);
  }

  parse = (string: string) => {
    const [min, max] = string.split(",").map(parseFloat);

    return { min, max };
  };

  getRandomValue = () => {
    const { step } = this;
    const min = random(this.min, this.max - step);
    const max = random(min + step, this.max);

    return {
      min: roundToStep(min, step),
      max: roundToStep(max, step),
    };
  };

  getDefaultValue = () => {
    return {
      min: this.min,
      max: this.max,
    };
  };

  valueToString = (value: DualRangeValue = this.value) => {
    return `${value.min},${value.max}`;
  };

  buildUI = () => {
    const { min, max, step, value } = this;
    const id = toHtmlId(this.name);

    const changeHandler = () => {
      this.value = {
        min: parseFloat(minInput.value),
        max: parseFloat(maxInput.value),
      };
      this.update(this.value);
      this.onChange(this);
    };

    const inputHandler = () => {
      this.value = {
        min: parseFloat(minInput.value),
        max: parseFloat(maxInput.value),
      };
      this.update(this.value);
      this.onInput(this);
    };

    const minInput = document.createElement("input");

    minInput.setAttribute("type", "range");
    minInput.setAttribute("name", `${id}-min`);
    minInput.setAttribute("id", `${id}-min`);
    minInput.setAttribute("min", min.toString());
    minInput.setAttribute("max", max.toString());
    minInput.setAttribute("step", step.toString());
    minInput.setAttribute("value", value.min.toString());

    minInput.addEventListener("input", inputHandler);
    minInput.addEventListener("change", changeHandler);

    const maxInput = document.createElement("input");
    maxInput.setAttribute("type", "range");
    maxInput.setAttribute("name", `${id}-max`);
    maxInput.setAttribute("id", `${id}-max`);
    maxInput.setAttribute("min", min.toString());
    maxInput.setAttribute("max", max.toString());
    maxInput.setAttribute("step", step.toString());
    maxInput.setAttribute("value", value.max.toString());

    maxInput.addEventListener("input", inputHandler);
    maxInput.addEventListener("change", changeHandler);

    const inputWrapper = document.createElement("div");
    inputWrapper.classList.add("dual-range-input");
    inputWrapper.appendChild(minInput);
    inputWrapper.appendChild(maxInput);

    const right = document.createElement("div");
    right.classList.add("ctrls__control-right");
    right.appendChild(inputWrapper);

    const label = document.createElement("span");
    label.textContent = this.label;
    label.classList.add("ctrls__control-label");

    const valueSpan = document.createElement("span");
    valueSpan.classList.add("ctrls__control-value");
    label.appendChild(valueSpan);

    const element = document.createElement("div");
    element.classList.add("ctrls__control", "ctrls__control--dual-range");
    element.appendChild(label);
    element.appendChild(right);

    return {
      element,
      valueSpan,
      minInput,
      maxInput,
    };
  };

  update = (value: DualRangeValue) => {
    const { min, max } = value;
    this.value = value;

    this.minInput.setAttribute("max", max.toString());
    this.maxInput.setAttribute("min", min.toString());
    this.valueSpan.textContent = ` (${min}, ${max})`;

    this.minInput.value = value.min.toString();
    this.maxInput.value = value.max.toString();

    this.dualRange.update();
  };
}
