export * from "./types";

import BezierEasing from "bezier-easing";
import { toCamelCase, toKebabCase, toSpaceCase } from "../utils/string-utils";
import { BooleanCtrl } from "./ctrl-boolean";
import { DualRangeCtrl } from "./ctrl-dual-range";
import { EasingCtrl } from "./ctrl-easing";
import { RadioCtrl } from "./ctrl-radio";
import { RangeCtrl } from "./ctrl-range";
import { SeedCtrl } from "./ctrl-seed";
import { FileCtrl } from "./ctrl-file";
import Alea from "../utils/alea";
import { chevronUpIcon, diceIcon } from "../utils/icons";
import type {
  ControlConstructor,
  CtrlComponent,
  ConfigItem,
  ControlsOptions,
  TypedControlConfig,
  HashItem,
  OptionsMap,
  CtrlControlType,
} from "./types";
import { getHTMLControlElement } from "./ctrl-html";
import { dom } from "../utils/dom";
import { getDrawer } from "../utils/get-drawer";

const controlMap: Record<CtrlControlType, ControlConstructor<CtrlComponent>> = {
  boolean: BooleanCtrl,
  range: RangeCtrl,
  radio: RadioCtrl,
  seed: SeedCtrl,
  easing: EasingCtrl,
  "dual-range": DualRangeCtrl,
  file: FileCtrl,
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

    // Title
    let titleButton = this.options.title
      ? dom.button("ctrls__title", {
          innerHTML: this.options.title + chevronUpIcon,
        })
      : null;

    // Randomize button
    let randomizeRow: HTMLElement | null = null;

    if (this.options.showRandomizeButton) {
      const randomizeButton = dom.button(
        "ctrls__randomize ctrls__btn ctrls__btn--lg",
        { innerHTML: `Randomize ${diceIcon}` },
      );
      randomizeButton.addEventListener("click", this.randomize);

      randomizeRow = dom.div("ctrls__control-no-label", {
        children: [randomizeButton],
      });
    }

    // Control elements
    const controlElements = this.processControls(configs);

    // Controls wrapper
    const controlsContainer = getDrawer(
      "ctrls__controls",
      [...controlElements, randomizeRow],
      titleButton,
    );

    // Main element
    this.element = dom.div(`ctrls ctrls--${this.options.theme}-theme`, {
      children: [titleButton, controlsContainer],
    });

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
        // Group title
        const groupTitle = dom.button("ctrls__group-title", {
          innerHTML: (config.label || toSpaceCase(config.name)) + chevronUpIcon,
        });

        const controlsElements = config.controls.map((itemConfig) => {
          const control = this.registerControl(
            itemConfig,
            onChangeControlHandler,
            onInputControlHandler,
            toCamelCase(config.name),
          );

          return control.element;
        });

        const groupControls = getDrawer(
          "ctrls__group-controls",
          controlsElements,
          groupTitle,
          config.isCollapsed,
        );

        // Create group element
        const groupElement = dom.div("ctrls__group", {
          children: [groupTitle, groupControls],
        });

        // Add the group element
        elements.push(groupElement);
      } else if (config.type === "html") {
        // HTML controls are just rendered on their own
        elements.push(getHTMLControlElement(config));
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
      .filter((control) => control.type !== "file")
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
