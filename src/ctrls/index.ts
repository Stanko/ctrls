import BezierEasing from "bezier-easing";
import { toCamelCase, toKebabCase, toSpaceCase } from "../utils/string-utils";
import { BooleanCtrl } from "./ctrl-boolean";
import { DualRangeCtrl, type DualRangeValue } from "./ctrl-dual-range";
import { EasingCtrl, type Easing } from "./ctrl-easing";
import { RadioCtrl } from "./ctrl-radio";
import { RangeCtrl } from "./ctrl-range";
import { SeedCtrl } from "./ctrl-seed";
import Alea from "../utils/alea";
import { diceIcon } from "../utils/icons";

export interface PRNG {
  (): number;
}

export type CtrlType =
  | "boolean"
  | "range"
  | "radio"
  | "seed"
  | "easing"
  | "dual-range";

export type CtrlChangeHandler<T> = (name: string, value: T) => void;

export type CtrlConfig<T = unknown> = {
  type: CtrlType;
  name: string;
  label?: string;
  defaultValue?: T;
  isRandomizationDisabled?: boolean;
};

export interface Ctrl<T> {
  name: string;
  label: string;
  type: CtrlType;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler<T>;
  parse: (value: string) => T;
  getRandomValue: () => T;
  getDefaultValue: () => T;
  buildUI: () => unknown;
  valueToString: (value?: T) => string;
  update: (value: T) => void;
  element: HTMLElement;
}

export type CtrlComponent =
  | BooleanCtrl
  | RangeCtrl
  | RadioCtrl
  | SeedCtrl
  | EasingCtrl
  | DualRangeCtrl;
export type ControlConstructor<T> = new (...args: any[]) => T;

const controlMap: Record<CtrlType, ControlConstructor<CtrlComponent>> = {
  boolean: BooleanCtrl,
  range: RangeCtrl,
  radio: RadioCtrl,
  seed: SeedCtrl,
  easing: EasingCtrl,
  "dual-range": DualRangeCtrl,
};

export interface CtrlTypeRegistry {
  boolean: {
    config: CtrlConfig<boolean>;
    instance: BooleanCtrl;
    value: boolean;
  };
  range: {
    config: CtrlConfig<number> & {
      min: number;
      max: number;
      step?: number;
    };
    instance: RangeCtrl;
    value: number;
  };
  radio: {
    config: CtrlConfig<string> & {
      items: Record<string, string>;
      columns?: 1 | 2 | 3 | 4 | 5;
    };
    instance: RadioCtrl;
    value: string;
  };
  seed: {
    config: CtrlConfig<string>;
    instance: SeedCtrl;
    value: string;
  };
  easing: {
    config: CtrlConfig<Easing> & {
      presets: Record<string, Easing>;
    };
    instance: EasingCtrl;
    value: Easing;
  };
  "dual-range": {
    config: CtrlConfig<DualRangeValue> & {
      min: number;
      max: number;
      step?: number;
    };
    instance: DualRangeCtrl;
    value: DualRangeValue;
  };
}

export type TypedControlConfig =
  CtrlTypeRegistry[keyof CtrlTypeRegistry]["config"];

type OptionsMap<Configs extends readonly TypedControlConfig[]> =
  // Base mapping: control name → value
  {
    [C in Configs[number] as C["name"]]: CtrlTypeRegistry[C["type"]]["value"];
  } & {
    // Extra mapping: easing → nameEasing
    [C in Extract<
      Configs[number],
      { type: "easing" }
    > as `${C["name"]}Easing`]: ReturnType<typeof BezierEasing>;
  } & {
    // Extra mapping: seed → nameRng
    [C in Extract<
      Configs[number],
      { type: "seed" }
    > as `${C["name"]}Rng`]: PRNG;
  };

type HashItem = { name: string; value: unknown };

type ControlsOptions = {
  showRandomizeButton?: boolean;
  storage?: "hash" | "none";
  theme?: "system" | "light" | "dark";
};

export class Ctrls<Configs extends readonly TypedControlConfig[]> {
  options: ControlsOptions;
  controls: CtrlTypeRegistry[keyof CtrlTypeRegistry]["instance"][];
  controlsMap: Record<
    string,
    CtrlTypeRegistry[keyof CtrlTypeRegistry]["instance"]
  > = {};
  element: HTMLDivElement;

  onChange?: (
    updatedValues: Partial<ReturnType<typeof this.getValues>>,
  ) => void;

  onInput?: (updatedValues: Partial<ReturnType<typeof this.getValues>>) => void;

  constructor(controls: Configs, options?: ControlsOptions) {
    this.options = {
      showRandomizeButton: true,
      storage: "hash",
      theme: "system",
      ...options,
    };

    // Local alias for correlated key/value typing
    type Values = ReturnType<typeof this.getValues>;

    const onChangeControlHandler = (name: string, value: unknown) => {
      this.onChange?.({ [name]: value } as Partial<Values>);

      if (this.options.storage === "hash") {
        this.setHash();
      }
    };

    const onInputControlHandler = (name: string, value: unknown) => {
      this.onInput?.({ [name]: value } as Partial<Values>);
    };

    this.controls = controls.map((config) => {
      // TODO
      // Document this behaviour
      // This might counter-intuitive for some people,
      // but it is my personal preference to have properties named in camel case
      // when using them in code
      //
      // However, they are going to be converted to kebab case when used in the hash,
      // because it is nicer that URL be all lowercase
      config.name = toCamelCase(config.name);

      // TODO
      // Again, document as it is my personal preference
      if (!config.label) {
        config.label = toSpaceCase(config.name);
      }

      const ControlComponent = controlMap[config.type];

      const control = new ControlComponent(
        config,
        onChangeControlHandler,
        onInputControlHandler,
      );

      this.controlsMap[control.name] = control;

      return control;
    });

    this.element = this.buildUI();

    if (this.options.storage === "hash") {
      this.addHashListeners();
    }
  }

  buildUI = () => {
    const element = document.createElement("div");
    element.classList.add("ctrls");
    element.classList.add(`ctrls--${this.options.theme}-theme`);

    this.controls.forEach((control) => {
      element.appendChild(control.element);
    });

    if (this.options.showRandomizeButton) {
      const randomizeButton = document.createElement("button");
      randomizeButton.classList.add(
        "ctrls__randomize",
        "ctrls__btn",
        "ctrls__btn--lg",
      );
      randomizeButton.innerHTML = `Randomize ${diceIcon}`;
      randomizeButton.addEventListener("click", this.randomize);
      element.appendChild(randomizeButton);
    }

    return element;
  };

  addHashListeners = () => {
    window.addEventListener("hashchange", this.updateFromHash);

    // Update all inputs using initial values from the hash
    this.updateFromHash();
    // Update the hash to make sure all values are reflected in the URL
    // TODO this might not be mandatory, but I think it is a nicer UX
    this.setHash();
  };

  getHash = () => {
    const values = this.controls
      .map((control) => {
        return `${toKebabCase(control.name)}:${control.valueToString()}`;
      })
      .join("/");

    return `#/${values}`;
  };

  setHash = () => {
    window.location.hash = this.getHash();
  };

  updateFromHash = () => {
    const hash = window.location.hash.slice(2); // Remove the leading '#/'
    const pairs = hash.split("/");

    const items: HashItem[] = [];

    pairs.forEach((pair) => {
      const [kebabCaseName, value] = pair.split(":");
      const name = toCamelCase(kebabCaseName);
      const control = this.controlsMap[name];

      if (control) {
        const parsed = control.parse(value);

        items.push({
          name,
          value: parsed,
        });
      }
    });

    type UpdatedValues = Partial<ReturnType<typeof this.getValues>>;
    const updatedValues: Record<string, unknown> = {};

    items.forEach((item) => {
      const { name, value } = item;
      const control = this.controlsMap[name];

      if (control && JSON.stringify(value) !== JSON.stringify(control.value)) {
        updatedValues[name] = value;
        control.update(value as never);
      }
    });

    if (Object.keys(updatedValues).length > 0) {
      this.onChange?.(updatedValues as UpdatedValues);
      this.onInput?.(updatedValues as UpdatedValues);
    }
  };

  getValues(): OptionsMap<Configs> {
    const options = {} as any;

    this.controls.forEach((control) => {
      options[control.name] = control.value;

      if (control.type === "easing") {
        options[control.name + "Easing"] = BezierEasing(
          ...(control as EasingCtrl).value,
        );
      } else if (control.type === "seed") {
        options[control.name + "Rng"] = Alea((control as SeedCtrl).value);
      }
    });

    return options;
  }

  randomize = () => {
    type UpdatedValues = Partial<ReturnType<typeof this.getValues>>;
    const updatedValues: Record<string, unknown> = {};

    this.controls.forEach((control) => {
      if (control.isRandomizationDisabled) {
        return;
      }

      control.value = control.getRandomValue();
      control.update(control.value as never);
      updatedValues[control.name] = control.value;
    });

    if (Object.keys(updatedValues).length > 0) {
      this.onChange?.(updatedValues as UpdatedValues);
      this.onInput?.(updatedValues as UpdatedValues);
    }

    if (this.options.storage === "hash") {
      this.setHash();
    }
  };
}
