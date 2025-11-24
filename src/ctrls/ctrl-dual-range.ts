import DualRangeInput from "@stanko/dual-range-input";
import { dom } from "../utils/dom";
import random from "../utils/random";
import { roundToStep } from "../utils/round-to-step";
import { toHtmlId } from "../utils/string-utils";
import type { ConfigFor, Ctrl, CtrlChangeHandler, CtrlItemType } from "./types";

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
  type: CtrlItemType = "dual-range";
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
    const id = toHtmlId(this.id);

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

    const minInput = dom.input("", {
      type: "range",
      name: `${id}-min`,
      id: `${id}-min`,
      min: min,
      max: max,
      step: step,
      value: value.min,
    });

    minInput.addEventListener("input", inputHandler);
    minInput.addEventListener("change", changeHandler);

    const maxInput = dom.input("", {
      type: "range",
      name: `${id}-max`,
      id: `${id}-max`,
      min: min,
      max: max,
      step: step,
      value: value.min,
    });

    maxInput.addEventListener("input", inputHandler);
    maxInput.addEventListener("change", changeHandler);

    const inputWrapper = dom.div("dual-range-input", {
      children: [minInput, maxInput],
    });

    const right = dom.div("ctrls__control-right", {
      children: [inputWrapper],
    });

    const valueSpan = dom.span("ctrls__control-value");

    const label = dom.span("ctrls__control-label", {
      children: [this.label, valueSpan],
    });

    const element = dom.div("ctrls__control ctrls__control--dual-range", {
      children: [label, right],
    });

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
