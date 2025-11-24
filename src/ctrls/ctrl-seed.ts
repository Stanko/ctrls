import generateSeed from "../utils/generate-seed";
import { refreshIcon } from "../utils/icons";

import type {
  Ctrl,
  CtrlChangeHandler,
  CtrlConfig,
  CtrlItemType,
} from "./types";
import { toHtmlId } from "../utils/string-utils";
import { dom } from "../utils/dom";

export class SeedCtrl implements Ctrl<string> {
  type: CtrlItemType = "seed";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: string;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  element: HTMLElement;
  input: HTMLInputElement;

  constructor(
    config: CtrlConfig<string>,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.name = config.name;
    this.id = config.id || config.name;
    this.group = config.group || "";
    this.label = config.label || config.name;
    this.value =
      config.defaultValue === undefined
        ? this.getDefaultValue()
        : config.defaultValue;
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;

    const { input, element } = this.buildUI();
    this.input = input;
    this.element = element;
  }

  parse = (string: string) => {
    return string;
  };

  getRandomValue = () => {
    return generateSeed();
  };

  getDefaultValue = () => {
    return generateSeed();
  };

  valueToString = (value: string = this.value) => {
    if (value.trim() === "") {
      return this.getRandomValue();
    }
    return value;
  };

  buildUI = () => {
    const { value } = this;

    const id = toHtmlId(this.id);

    const input = dom.input("ctrls__seed-input", {
      type: "text",
      value,
      id,
      name: id,
    });

    input.addEventListener("change", () => {
      this.value = this.parse(input.value);
      this.onChange(this);
    });
    input.addEventListener("input", () => {
      this.value = this.parse(input.value);
      this.onInput(this);
    });

    const reload = dom.button("ctrls__seed-new-button ctrls__btn", {
      innerHTML: refreshIcon,
    });
    reload.addEventListener("click", () => {
      this.value = this.getRandomValue();
      this.update();
      this.onChange(this);
    });

    const right = dom.div("ctrls__control-right", {
      children: [input, reload],
    });

    const label = dom.label("ctrls__control-label", {
      for: id,
      children: [this.label],
    });

    const element = dom.div("ctrls__control ctrls__control--seed", {
      children: [label, right],
    });

    return {
      element,
      input,
    };
  };

  update = (value: string = this.value) => {
    this.value = value;

    this.input.value = value;
  };
}
