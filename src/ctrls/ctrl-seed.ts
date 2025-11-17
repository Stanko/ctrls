import generateSeed from "../utils/generate-seed";
import { refreshIcon } from "../utils/icons";

import type { Ctrl, CtrlChangeHandler, CtrlConfig, CtrlType } from ".";
import { toHtmlId } from "../utils/string-utils";

export class SeedCtrl implements Ctrl<string> {
  type: CtrlType = "seed";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: string;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler<string>;
  onInput: CtrlChangeHandler<string>;
  element: HTMLElement;
  input: HTMLInputElement;

  constructor(
    config: CtrlConfig<string>,
    onChange: CtrlChangeHandler<string>,
    onInput: CtrlChangeHandler<string>,
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

    const id = toHtmlId(this.name);

    const input = document.createElement("input");
    input.classList.add("ctrls__seed-input");
    input.setAttribute("type", "text");
    input.setAttribute("value", value.toString());
    input.setAttribute("id", id);
    input.setAttribute("name", id);

    input.addEventListener("change", () => {
      this.value = this.parse(input.value);
      this.onChange(this.name, this.value);
    });
    input.addEventListener("input", () => {
      this.value = this.parse(input.value);
      this.onInput(this.name, this.value);
    });

    const reload = document.createElement("button");
    reload.innerHTML = refreshIcon;
    reload.classList.add("ctrls__seed-new-button", "ctrls__btn");
    reload.addEventListener("click", () => {
      this.value = this.getRandomValue();
      this.update();
      this.onChange(this.name, this.getRandomValue());
    });

    const right = document.createElement("div");
    right.classList.add("ctrls__control-right");
    right.append(input);
    right.append(reload);

    const label = document.createElement("label");
    label.textContent = this.label;
    label.setAttribute("for", id);
    label.classList.add("ctrls__control-label");

    const element = document.createElement("div");
    element.classList.add("ctrls__control", "ctrls__control--seed");
    element.appendChild(label);
    element.appendChild(right);

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
