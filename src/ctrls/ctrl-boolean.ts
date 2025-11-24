import { dom } from "../utils/dom";
import { checkIcon } from "../utils/icons";
import { toHtmlId } from "../utils/string-utils";
import type {
  Ctrl,
  CtrlChangeHandler,
  CtrlConfig,
  CtrlItemType,
} from "./types";

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
    const id = toHtmlId(this.id);

    const input = dom.input("ctrls__boolean-input", {
      type: "checkbox",
      id,
      name: id,
    });
    input.checked = this.value;
    input.addEventListener("change", () => {
      this.value = input.checked;
      this.onChange(this);
    });
    input.addEventListener("input", () => {
      this.value = input.checked;
      this.onInput(this);
    });

    const checkmark = dom.span("ctrls__boolean-checkmark", {
      innerHTML: checkIcon,
    });

    const right = dom.div("ctrls__control-right", {
      children: [input, checkmark],
    });

    const label = dom.span("ctrls__control-label", {
      children: [this.label],
    });

    const element = dom.label("ctrls__control ctrls__control--boolean", {
      children: [label, right],
    });

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
