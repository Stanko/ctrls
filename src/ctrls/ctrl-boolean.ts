import { checkIcon } from "../utils/icons";
import type {
  Ctrl,
  CtrlItemType,
  CtrlChangeHandler,
  CtrlConfig,
} from "./types";
import { toHtmlId } from "../utils/string-utils";

export class BooleanCtrl implements Ctrl<boolean> {
  type: CtrlItemType = "boolean";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: boolean;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  element: HTMLElement;
  input: HTMLInputElement;

  constructor(
    config: CtrlConfig<boolean>,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.type = "boolean";
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
    return string === "true";
  };

  getRandomValue = () => {
    return Math.random() > 0.5;
  };

  getDefaultValue = () => {
    return true;
  };

  valueToString = (value: boolean = this.value) => {
    return value.toString();
  };

  buildUI = () => {
    const id = toHtmlId(this.name);
    const input = document.createElement("input");
    input.classList.add("ctrls__boolean-input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", id);
    input.setAttribute("name", id);
    input.checked = this.value;
    input.addEventListener("change", () => {
      this.value = input.checked;
      this.onChange(this);
    });
    input.addEventListener("input", () => {
      this.value = input.checked;
      this.onInput(this);
    });

    const checkmark = document.createElement("span");
    checkmark.classList.add("ctrls__boolean-checkmark");
    checkmark.innerHTML = checkIcon;

    const right = document.createElement("div");
    right.classList.add("ctrls__control-right");
    right.appendChild(input);
    right.appendChild(checkmark);

    const label = document.createElement("span");
    label.textContent = this.label;
    label.classList.add("ctrls__control-label");

    const element = document.createElement("label");
    element.classList.add("ctrls__control", "ctrls__control--boolean");
    element.appendChild(label);
    element.appendChild(right);

    return {
      element,
      input,
    };
  };

  update = (value: boolean) => {
    this.value = value;
    this.input.checked = this.value;
  };
}
