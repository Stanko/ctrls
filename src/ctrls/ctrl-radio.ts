import random from "../utils/random";

import type { Ctrl, CtrlChangeHandler, CtrlType, CtrlTypeRegistry } from ".";
import { toKebabCase } from "../utils/string-utils";
import { getRandomString } from "../utils/get-random-string";

type Option = {
  label: string;
  value: string;
};

export type RadioControlOptions = {
  items: Option[];
};

export class RadioCtrl implements Ctrl<string> {
  type: CtrlType = "radio";
  name: string;
  label: string;
  value: string;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler<string>;
  onInput: CtrlChangeHandler<string>;
  items: Option[];
  element: HTMLElement;
  columns: 1 | 2 | 3 | 4 | 5;
  id: string;

  constructor(
    config: CtrlTypeRegistry["radio"]["config"],
    onChange: CtrlChangeHandler<string>,
    onInput: CtrlChangeHandler<string>,
  ) {
    this.items = [];
    Object.keys(config.items).forEach((key) => {
      this.items.push({
        label: key,
        value: config.items[key],
      });
    });
    this.columns = config.columns || 3;

    this.name = config.name;
    this.label = config.label || config.name;
    this.id = `ctrls-${getRandomString()}-${toKebabCase(this.name)}`;

    const defaultValue = this.items.find(
      (item) => item.value === config.defaultValue,
    );
    this.value = defaultValue?.value || this.getDefaultValue();
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;

    this.element = this.buildUI();
  }

  parse = (string: string) => {
    const item = this.items.find((item) => item.value === string);
    return item?.value || this.getDefaultValue();
  };

  getRandomValue = () => {
    const index = random(0, this.items.length - 1, null, 0);

    return this.items[index].value;
  };

  getDefaultValue = () => {
    return this.items[0].value;
  };

  valueToString = (value: string = this.value) => {
    return value;
  };

  buildUI = () => {
    const { items, value } = this;

    const inputs = items.map((item) => {
      const input = document.createElement("input");
      input.setAttribute("type", "radio");
      input.setAttribute("name", this.id);
      input.setAttribute("value", item.value);
      input.checked = item.value === value;

      input.addEventListener("change", () => {
        this.value = this.parse(input.value);
        this.onChange(this.name, this.value);
      });
      input.addEventListener("input", () => {
        this.value = this.parse(input.value);
        this.onInput(this.name, this.value);
      });

      const label = document.createElement("span");
      label.textContent = item.label;

      const option = document.createElement("label");
      option.classList.add("ctrls__radio-label");

      option.appendChild(input);
      option.appendChild(label);

      return option;
    });

    const right = document.createElement("div");
    right.classList.add("ctrls__control-right");
    right.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    right.append(...inputs);

    const label = document.createElement("span");
    label.textContent = this.label;
    label.classList.add("ctrls__control-label");

    const element = document.createElement("div");
    element.classList.add("ctrls__control", "ctrls__control--radio");
    element.appendChild(label);
    element.appendChild(right);

    return element;
  };

  update = (value: string) => {
    const item = this.items.find((item) => item.value === value);
    this.value = item?.value || this.getDefaultValue();

    // Unselect previous option
    const prev = this.element.querySelector(
      `input:checked`,
    ) as HTMLInputElement;
    if (prev) {
      prev.checked = false;
    }

    // Select new option
    const next = this.element.querySelector(
      `[value="${this.value}"]`,
    ) as HTMLInputElement;
    next.checked = true;
  };
}
