import { dom } from "../utils/dom";
import { checkIcon } from "../utils/icons";
import { toHtmlId } from "../utils/string-utils";
import { BaseCtrl, type BaseCtrlArgs } from "./ctrl-base";
import type { ConfigFor } from "./types";

export class BooleanCtrl extends BaseCtrl<boolean> {
  type = "boolean" as const;
  input: HTMLInputElement;

  constructor(config: ConfigFor<"boolean">, ...args: BaseCtrlArgs) {
    super(config, ...args);
    this.value = config.defaultValue ?? this.getDefaultValue();

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
