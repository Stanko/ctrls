import Alea from "../utils/alea";
import generateSeed from "../utils/generate-seed";
import { refreshIcon } from "../utils/icons";

import type { ConfigFor } from "./types";
import { BaseCtrl, type BaseCtrlArgs } from "./ctrl-base";
import { toHtmlId } from "../utils/string-utils";
import { dom } from "../utils/dom";

export class SeedCtrl extends BaseCtrl<string> {
  type = "seed" as const;
  input: HTMLInputElement;

  constructor(config: ConfigFor<"seed">, ...args: BaseCtrlArgs) {
    super(config, ...args);
    this.value = config.defaultValue ?? this.getDefaultValue();

    const { input, element } = this.buildUI();
    this.input = input;
    this.element = element;
  }

  getDerived = () => ({
    [`${this.name}Rng`]: Alea(...this.value.split("-")),
  });

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
