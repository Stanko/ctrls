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

type HashItem = { id: string; value: unknown };

export type CtrlType =
  | "boolean"
  | "range"
  | "radio"
  | "seed"
  | "easing"
  | "dual-range"
  | "group";

export type CtrlChangeHandler = (control: CtrlComponent) => void;

export type CtrlConfig<T = unknown> = {
  type: CtrlType;
  id?: string;
  name: string;
  group?: string;
  label?: string;
  defaultValue?: T;
  isRandomizationDisabled?: boolean;
};

export interface Ctrl<T> {
  id: string;
  group?: string;
  name: string;
  label: string;
  type: CtrlType;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  parse: (value: string) => T;
  getRandomValue: () => T;
  getDefaultValue: () => T;
  buildUI: () => unknown;
  valueToString: (value?: T) => string;
  update: (value: T) => void;
  element: HTMLElement;
}

// Control registry - focus on config -> value mapping
export interface CtrlTypeMap {
  boolean: {
    value: boolean;
  };
  range: {
    value: number;
    min: number;
    max: number;
    step?: number;
  };
  radio: {
    value: string;
    items: Record<string, string>;
    columns?: 1 | 2 | 3 | 4 | 5;
  };
  seed: {
    value: string;
  };
  easing: {
    value: Easing;
    presets?: Record<string, Easing>;
  };
  "dual-range": {
    value: DualRangeValue;
    min: number;
    max: number;
    step?: number;
  };
  group: {
    value: Record<string, unknown>; // Placeholder, real type is recursive
    controls: readonly ConfigItem[];
    isRandomizationDisabled?: boolean;
  };
}

export type TypedControlConfig = {
  // Exclude group from leaf types
  [K in CtrlType]: {
    type: K;
    id?: string;
    name: string;
    group?: string;
    label?: string;
    defaultValue?: CtrlTypeMap[K]["value"];
    isRandomizationDisabled?: boolean;
  } & Omit<CtrlTypeMap[K], "value">;
}[CtrlType];

export type GroupConfig = {
  type: "group";
  name: string;
  label?: string;
  controls: readonly TypedControlConfig[];
  isRandomizationDisabled?: boolean;
};

export type ConfigItem = TypedControlConfig | GroupConfig;

export type ConfigFor<T extends CtrlType> = Extract<
  TypedControlConfig,
  { type: T }
>;

type ExtractValues<Configs extends readonly ConfigItem[]> = {
  // Handle non-group controls
  [C in Extract<
    Configs[number],
    { type: Exclude<CtrlType, "group"> }
  > as C["name"]]: CtrlTypeMap[C["type"]]["value"];
} & {
  // Handle group controls recursively
  [C in Extract<Configs[number], { type: "group" }> as C["name"]]: OptionsMap<
    C["controls"]
  >;
};

// Add "rng" and "easing" functions types - Made recursive
type DerivedProps<Configs extends readonly ConfigItem[]> = {
  // Handle top-level easing
  [C in Extract<
    Configs[number],
    { type: "easing" }
  > as `${C["name"]}Easing`]: ReturnType<typeof BezierEasing>;
} & {
  // Handle top-level seed
  [C in Extract<Configs[number], { type: "seed" }> as `${C["name"]}Rng`]: PRNG;
} & {
  // Handle groups: recursively call DerivedProps on sub-controls
  [C in Extract<Configs[number], { type: "group" }> as C["name"]]: DerivedProps<
    C["controls"]
  >;
};

// Combined type - Updated generic constraint
type OptionsMap<Configs extends readonly ConfigItem[]> =
  ExtractValues<Configs> & DerivedProps<Configs>;

type ControlsOptions = {
  showRandomizeButton?: boolean;
  storage?: "hash" | "none";
  theme?: "system" | "light" | "dark";
  parent?: Element;
  title?: string;
};

type CtrlComponent =
  | BooleanCtrl
  | RangeCtrl
  | RadioCtrl
  | SeedCtrl
  | EasingCtrl
  | DualRangeCtrl;

type ControlConstructor<T> = new (...args: any[]) => T;

const controlMap: Record<
  Exclude<CtrlType, "group">,
  ControlConstructor<CtrlComponent>
> = {
  boolean: BooleanCtrl,
  range: RangeCtrl,
  radio: RadioCtrl,
  seed: SeedCtrl,
  easing: EasingCtrl,
  "dual-range": DualRangeCtrl,
};

export class Ctrls<Configs extends readonly ConfigItem[]> {
  options: ControlsOptions;
  controls: CtrlComponent[] = [];
  controlsMap: Record<string, CtrlComponent> = {};

  element: HTMLDivElement;

  onChange?: (
    updatedValues: Partial<ReturnType<typeof this.getValues>>,
  ) => void;

  onInput?: (updatedValues: Partial<ReturnType<typeof this.getValues>>) => void;

  constructor(configs: Configs, options?: ControlsOptions) {
    this.options = {
      showRandomizeButton: true,
      storage: "hash",
      theme: "system",
      ...options,
    };

    const onChangeControlHandler = (control: CtrlComponent) => {
      const updatedValues = this.updateValuesObject({}, control);

      this.onChange?.(updatedValues);

      if (this.options.storage === "hash") {
        this.setHash();
      }
    };

    const onInputControlHandler = (control: CtrlComponent) => {
      const updatedValues = this.updateValuesObject({}, control);

      this.onInput?.(updatedValues);
    };

    configs.map((config) => {
      if (config.type === "group") {
        config.controls.forEach((groupConfig) => {
          this.registerControl(
            groupConfig,
            onChangeControlHandler,
            onInputControlHandler,
            toCamelCase(config.name),
          );
        });
      } else {
        this.registerControl(
          config,
          onChangeControlHandler,
          onInputControlHandler,
        );
      }
    });

    this.element = this.buildUI();

    if (this.options.storage === "hash") {
      this.addHashListeners();
    }

    if (this.options.parent) {
      this.options.parent.appendChild(this.element);
    }
  }

  registerControl = (
    config: TypedControlConfig,
    onChangeControlHandler: (control: CtrlComponent) => void,
    onInputControlHandler: (control: CtrlComponent) => void,
    group: string = "",
  ) => {
    // To make typescript happy
    if (config.type === "group") {
      return;
    }

    // TODO
    // Again, document as it is my personal preference
    if (!config.label) {
      config.label = toSpaceCase(config.name);
    }

    // TODO
    // Document this behaviour
    // This might counter-intuitive for some people,
    // but it is my personal preference to have properties named in camel case
    // when using them in code
    //
    // However, they are going to be converted to kebab case when used in the hash,
    // because it is nicer that URL be all lowercase
    config.name = toCamelCase(config.name);

    if (group) {
      config.group = group;
      config.id = toCamelCase(`${group}-${config.name}`);
    }

    const ControlComponent = controlMap[config.type];

    const control = new ControlComponent(
      config,
      onChangeControlHandler,
      onInputControlHandler,
    );

    this.controlsMap[control.id] = control;

    this.controls.push(control);
  };

  buildUI = () => {
    const element = document.createElement("div");
    element.classList.add("ctrls");
    element.classList.add(`ctrls--${this.options.theme}-theme`);

    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("ctrls__controls");

    let group = "";
    let groupElement: HTMLDivElement;

    this.controls.forEach((control) => {
      if (control.group) {
        if (control.group !== group) {
          group = control.group;
          groupElement = document.createElement("div");
          groupElement.classList.add("ctrls__group");

          const groupTitle = document.createElement("button");
          groupTitle.classList.add("ctrls__group-title");
          groupTitle.innerText = control.group;
          groupTitle.addEventListener("click", () => {
            groupTitle.parentElement?.classList.toggle("ctrls__group--hidden");
          });

          groupElement.append(groupTitle);
          controlsContainer.appendChild(groupElement);
        }

        groupElement.append(control.element);
      } else {
        controlsContainer.appendChild(control.element);
      }
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
      controlsContainer.appendChild(randomizeButton);
    }

    if (this.options.title) {
      const titleButton = document.createElement("button");
      titleButton.classList.add("ctrls__title");
      titleButton.innerText = this.options.title;
      titleButton.addEventListener("click", this.toggleVisibility);

      element.appendChild(titleButton);
    }

    element.appendChild(controlsContainer);

    return element;
  };

  toggleVisibility = () => {
    this.element.classList.toggle("ctrls--hidden");
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
        return `${toKebabCase(control.id)}:${control.valueToString()}`;
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
      const id = toCamelCase(kebabCaseName);
      const control = this.controlsMap[id];

      if (control) {
        const parsed = control.parse(value);

        items.push({
          id,
          value: parsed,
        });
      }
    });

    const updatedValues: Partial<ReturnType<typeof this.getValues>> = {};

    items.forEach((item) => {
      const { id, value } = item;
      const control = this.controlsMap[id];

      if (control && JSON.stringify(value) !== JSON.stringify(control.value)) {
        this.updateValuesObject(updatedValues, control);
        control.update(value as never);
      }
    });

    if (Object.keys(updatedValues).length > 0) {
      this.onChange?.(updatedValues);
      this.onInput?.(updatedValues);
    }
  };

  updateValuesObject(values: any, control: CtrlComponent) {
    let objectToUpdate = values;

    if (control.group) {
      if (!values[control.group]) {
        values[control.group] = {};
      }
      objectToUpdate = values[control.group];
    }

    objectToUpdate[control.name] = control.value;

    if (control.type === "easing") {
      objectToUpdate[control.name + "Easing"] = BezierEasing(
        ...(control as EasingCtrl).value,
      );
    } else if (control.type === "seed") {
      objectToUpdate[control.name + "Rng"] = Alea(
        ...(control as SeedCtrl).value.split("-"),
      );
    }

    return values as Partial<ReturnType<typeof this.getValues>>;
  }

  getValues(): OptionsMap<Configs> {
    const values = {} as any;

    this.controls.forEach((control) => {
      this.updateValuesObject(values, control);
    });

    return values;
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

      this.updateValuesObject(updatedValues, control);
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
