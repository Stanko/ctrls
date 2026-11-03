import { toKebabCase, toSpaceCase } from "../utils/string-utils";
import type {
  CtrlChangeHandler,
  CtrlControlType,
  TypedControlConfig,
} from "./types";

// Arguments every control passes through to BaseCtrl
export type BaseCtrlArgs = [
  onChange: CtrlChangeHandler,
  onInput: CtrlChangeHandler,
  group: string,
];

// Properties shared by all controls.
// Each control sets its own value and element, as defaults depend on its config.
export abstract class BaseCtrl<T> {
  abstract type: CtrlControlType;
  // Unique kebab case id, used as the hash key and for HTML ids
  id: string;
  // Key in the values object, exactly as written in the config
  name: string;
  // Name of the group the control is in, empty if none
  group: string;
  label: string;
  value!: T;
  element!: HTMLElement;
  isRandomizationDisabled: boolean;
  // Controls call onChange when the value is committed, and onInput while it is changing.
  // Ctrls calls the user's onInput on both, so controls don't need to call both.
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;

  constructor(
    config: TypedControlConfig,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
    group: string,
  ) {
    this.name = config.name;
    this.group = group;
    this.id = toKebabCase(group ? `${group}-${config.name}` : config.name);
    // It is my personal preference is to use space case for labels
    this.label = config.label || toSpaceCase(config.name);
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;
  }

  abstract parse(string: string): T;
  abstract getRandomValue(): T;
  abstract getDefaultValue(): T;
  abstract valueToString(value?: T): string;
  abstract update(value: T): void;

  // Extra values added next to the control's value, like easing and rng functions
  getDerived = (): Record<string, unknown> => ({});
}
