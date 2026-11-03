import type BezierEasing from "bezier-easing";
import type { BaseCtrl } from "./ctrl-base";
import type { DualRangeValue } from "./ctrl-dual-range";
import type { Easing } from "./ctrl-easing";
import type { Vector } from "./ctrl-vector";

export interface PRNG {
  (): number;
}

// Active controls
export type CtrlControlType =
  | "boolean"
  | "range"
  | "radio"
  | "seed"
  | "easing"
  | "dual-range"
  | "file"
  | "vector";

export type CtrlChangeHandler = (control: CtrlComponent) => void;

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
  file: {
    value: File | null;
    accept?: string;
  };
  vector: {
    value: Vector;
    size?: number;
  };
}

export type TypedControlConfig = {
  [K in CtrlControlType]: {
    type: K;
    name: string;
    label?: string;
    defaultValue?: CtrlTypeMap[K]["value"];
    isRandomizationDisabled?: boolean;
  } & Omit<CtrlTypeMap[K], "value">;
}[CtrlControlType];

export type GroupConfig = {
  type: "group";
  name: string;
  label?: string;
  // Groups can't be nested
  controls: readonly (TypedControlConfig | HTMLConfig)[];
  isCollapsed?: boolean;
};

export type HTMLConfig = {
  type: "html";
  name: string;
  label?: string;
  html: HTMLElement;
};

export type ConfigItem = TypedControlConfig | GroupConfig | HTMLConfig;

export type ConfigFor<T extends CtrlControlType> = Extract<
  TypedControlConfig,
  { type: T }
>;

type ExtractValues<Configs extends readonly ConfigItem[]> = {
  [C in Extract<
    Configs[number],
    { type: CtrlControlType }
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

// Values accepted by setValues, every key is optional, including the ones inside groups
export type PartialValues<Configs extends readonly ConfigItem[]> = {
  [C in Extract<
    Configs[number],
    { type: CtrlControlType }
  > as C["name"]]?: CtrlTypeMap[C["type"]]["value"];
} & {
  [C in Extract<
    Configs[number],
    { type: "group" }
  > as C["name"]]?: PartialValues<C["controls"]>;
};

export type ControlsOptions = {
  showRandomizeButton?: boolean;
  storage?: "hash" | "none";
  theme?: "system" | "light" | "dark";
  parent?: Element;
  title?: string;
};

export type CtrlComponent = BaseCtrl<unknown>;

export type ControlConstructor<T> = new (...args: any[]) => T;
