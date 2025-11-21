import BezierEasing from "bezier-easing";
import { toCamelCase, toKebabCase, toSpaceCase } from "../utils/string-utils";
import { BooleanCtrl } from "./ctrl-boolean";
import { DualRangeCtrl } from "./ctrl-dual-range";
import { EasingCtrl } from "./ctrl-easing";
import { RadioCtrl } from "./ctrl-radio";
import { RangeCtrl } from "./ctrl-range";
import { SeedCtrl } from "./ctrl-seed";
import Alea from "../utils/alea";
import { diceIcon } from "../utils/icons";
import type {
  CtrlItemType,
  ControlConstructor,
  CtrlComponent,
  ConfigItem,
  ControlsOptions,
  TypedControlConfig,
  HashItem,
  OptionsMap,
} from "./types";

const controlMap: Record<
  Exclude<CtrlItemType, "group">,
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

    // Main element
    this.element = document.createElement("div");
    this.element.classList.add("ctrls");
    this.element.classList.add(`ctrls--${this.options.theme}-theme`);

    // Title
    if (this.options.title) {
      const titleButton = document.createElement("button");
      titleButton.classList.add("ctrls__title");
      titleButton.innerText = this.options.title;
      titleButton.addEventListener("click", this.toggleVisibility);

      this.element.appendChild(titleButton);
    }

    // Controls wrapper
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("ctrls__controls");
    this.element.appendChild(controlsContainer);

    // Controls
    const controlElements = this.processControls(configs);
    controlsContainer.append(...controlElements);

    // Randomize button
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

    // Append the Ctrls element to the provided parent element
    if (this.options.parent) {
      this.options.parent.appendChild(this.element);
    }

    // Hash storage
    if (this.options.storage === "hash") {
      this.addHashListeners();
    }
  }

  processControls = (configs: Configs) => {
    const elements: HTMLElement[] = [];

    // Handlers shared by all controls
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

    // Processing configs and creating component instances and HTML elements
    configs.map((config) => {
      if (config.type === "group") {
        // Create group element
        const groupElement = document.createElement("div");
        groupElement.classList.add("ctrls__group");

        const groupTitle = document.createElement("button");
        groupTitle.classList.add("ctrls__group-title");
        groupTitle.innerText = config.label || toSpaceCase(config.name);
        groupTitle.addEventListener("click", () => {
          groupTitle.parentElement?.classList.toggle("ctrls__group--hidden");
        });

        // Add title
        groupElement.append(groupTitle);

        config.controls.forEach((itemConfig) => {
          const control = this.registerControl(
            itemConfig,
            onChangeControlHandler,
            onInputControlHandler,
            toCamelCase(config.name),
          );

          // Add the control elements to the group element
          groupElement.append(control?.element);
        });

        // Add the group element
        elements.push(groupElement);
      } else {
        const control = this.registerControl(
          config,
          onChangeControlHandler,
          onInputControlHandler,
        );
        // Add the control element
        elements.push(control.element);
      }
    });

    return elements;
  };

  registerControl = (
    config: TypedControlConfig,
    onChangeControlHandler: (control: CtrlComponent) => void,
    onInputControlHandler: (control: CtrlComponent) => void,
    group: string = "",
  ) => {
    // It is my personal preference is to use space case for labels
    if (!config.label) {
      config.label = toSpaceCase(config.name);
    }

    // Another personal preference of mine is to have properties named in camel case when using them in code
    config.name = toCamelCase(config.name);

    // Add group properties to the control config
    if (group) {
      config.group = group;
      config.id = toCamelCase(`${group}-${config.name}`);
    }

    // Instantiate the control component
    const ControlComponent = controlMap[config.type];

    const control = new ControlComponent(
      config,
      onChangeControlHandler,
      onInputControlHandler,
    );

    this.controlsMap[control.id] = control;
    this.controls.push(control);

    return control;
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
