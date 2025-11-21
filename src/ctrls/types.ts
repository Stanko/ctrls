import type BezierEasing from "bezier-easing";
import type { BooleanCtrl } from "./ctrl-boolean";
import type { DualRangeValue, DualRangeCtrl } from "./ctrl-dual-range";
import type { Easing, EasingCtrl } from "./ctrl-easing";
import type { RadioCtrl } from "./ctrl-radio";
import type { RangeCtrl } from "./ctrl-range";
import type { SeedCtrl } from "./ctrl-seed";

export interface PRNG {
  (): number;
}

export type HashItem = { id: string; value: unknown };

// Active controls
export type CtrlControlType =
  | "boolean"
  | "range"
  | "radio"
  | "seed"
  | "easing"
  | "dual-range";

// Controls + UI helpers
export type CtrlItemType = CtrlControlType | "group";

export type CtrlChangeHandler = (control: CtrlComponent) => void;

export type CtrlConfig<T = unknown> = {
  type: CtrlItemType;
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
  type: CtrlItemType;
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
    controls: readonly TypedControlConfig[];
    isRandomizationDisabled?: boolean;
  };
}

export type TypedControlConfig = {
  [K in CtrlControlType]: {
    type: K;
    id?: string;
    name: string;
    group?: string;
    label?: string;
    defaultValue?: CtrlTypeMap[K]["value"];
    isRandomizationDisabled?: boolean;
  } & Omit<CtrlTypeMap[K], "value">;
}[CtrlControlType];

export type GroupConfig = {
  type: "group";
  name: string;
  label?: string;
  controls: readonly TypedControlConfig[];
  isRandomizationDisabled?: boolean;
};

export type ConfigItem = TypedControlConfig | GroupConfig;

export type ConfigFor<T extends CtrlItemType> = Extract<
  TypedControlConfig,
  { type: T }
>;
type ExtractValues<Configs extends readonly ConfigItem[]> = {
  [C in Extract<
    Configs[number],
    { type: Exclude<CtrlItemType, "group"> }
  > as C["name"]]: CtrlTypeMap[C["type"]]["value"];
} & {
  [C in Extract<Configs[number], { type: "group" }> as C["name"]]: OptionsMap<
    C["controls"]
  >;
};

// Add "rng" and "easing" functions types
type DerivedProps<Configs extends readonly ConfigItem[]> = {
  [C in Extract<
    Configs[number],
    { type: "easing" }
  > as `${C["name"]}Easing`]: ReturnType<typeof BezierEasing>;
} & {
  [C in Extract<Configs[number], { type: "seed" }> as `${C["name"]}Rng`]: PRNG;
} & {
  [C in Extract<Configs[number], { type: "group" }> as C["name"]]: DerivedProps<
    C["controls"]
  >;
};

// Combined type
export type OptionsMap<Configs extends readonly ConfigItem[]> =
  ExtractValues<Configs> & DerivedProps<Configs>;

export type ControlsOptions = {
  showRandomizeButton?: boolean;
  storage?: "hash" | "none";
  theme?: "system" | "light" | "dark";
  parent?: Element;
  title?: string;
};

export type CtrlComponent =
  | BooleanCtrl
  | RangeCtrl
  | RadioCtrl
  | SeedCtrl
  | EasingCtrl
  | DualRangeCtrl;

export type ControlConstructor<T> = new (...args: any[]) => T;
