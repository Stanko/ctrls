export * from "./types";

import { toSpaceCase } from "../utils/string-utils";
import { BooleanCtrl } from "./ctrl-boolean";
import { DualRangeCtrl } from "./ctrl-dual-range";
import { EasingCtrl } from "./ctrl-easing";
import { RadioCtrl } from "./ctrl-radio";
import { RangeCtrl } from "./ctrl-range";
import { SeedCtrl } from "./ctrl-seed";
import { FileCtrl } from "./ctrl-file";
import { VectorCtrl } from "./ctrl-vector";
import { chevronUpIcon, diceIcon } from "../utils/icons";
import type {
  ControlConstructor,
  CtrlChangeHandler,
  CtrlComponent,
  ConfigItem,
  ControlsOptions,
  TypedControlConfig,
  OptionsMap,
  PartialValues,
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
  vector: VectorCtrl,
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

    // Handlers shared by all controls.
    // A change is also an input, so controls only need to report one of them.
    const onChangeControlHandler = (control: CtrlComponent) => {
      const updatedValues = this.updateValuesObject({}, control);

      this.onChange?.(updatedValues);
      this.onInput?.(updatedValues);

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
          if (itemConfig.type === "html") {
            return getHTMLControlElement(itemConfig);
          }

          const control = this.registerControl(
            itemConfig,
            onChangeControlHandler,
            onInputControlHandler,
            config.name,
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
    onChangeControlHandler: CtrlChangeHandler,
    onInputControlHandler: CtrlChangeHandler,
    group: string = "",
  ) => {
    // Instantiate the control component
    const ControlComponent = controlMap[config.type];

    const control = new ControlComponent(
      config,
      onChangeControlHandler,
      onInputControlHandler,
      group,
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
        // Known issue (won't fix for now): values are not URI encoded,
        // so values containing "/" or ":" break parsing,
        // and the browser escapes others, e.g. seed "my seed" is read back as "my%20seed"
        return `${control.id}:${control.valueToString()}`;
      })
      .join("/");

    return `#/${values}`;
  };

  setHash = () => {
    window.location.hash = this.getHash();
  };

  updateFromHash = () => {
    const hash = window.location.hash.slice(2); // Remove the leading '#/'
    const updatedValues: Partial<ReturnType<typeof this.getValues>> = {};

    hash.split("/").forEach((pair) => {
      const [id, value] = pair.split(":");
      const control = this.controlsMap[id];

      if (!control) {
        return;
      }

      const parsed = control.parse(value);

      if (JSON.stringify(parsed) !== JSON.stringify(control.value)) {
        control.update(parsed);
        this.updateValuesObject(updatedValues, control);
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
    Object.assign(objectToUpdate, control.getDerived());

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

      control.update(control.getRandomValue());

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

  setValues = (values: PartialValues<Configs>) => {
    type UpdatedValues = Partial<ReturnType<typeof this.getValues>>;
    const updatedValues: Record<string, unknown> = {};
    const newValues = values as Record<string, any>;

    this.controls.forEach((control) => {
      const source = control.group ? newValues[control.group] : newValues;
      const value = source?.[control.name];

      if (value === undefined) {
        return;
      }

      // Skipping unchanged values prevents loops when setValues is called from the event handlers.
      // Files can't be serialized, so they are compared by reference
      const isUnchanged =
        control.type === "file"
          ? value === control.value
          : JSON.stringify(value) === JSON.stringify(control.value);

      if (isUnchanged) {
        return;
      }

      control.update(value);

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
