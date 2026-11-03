import { dom } from "../utils/dom";
import random from "../utils/random";
import { toHtmlId } from "../utils/string-utils";
import type { ConfigFor, Ctrl, CtrlChangeHandler, CtrlItemType } from "./types";

export type Vector = {
  x: number;
  y: number;
};

// Pad is a square, so the same size is used for both axes
const w = 100;

export class VectorCtrl implements Ctrl<Vector> {
  type: CtrlItemType = "vector";
  id: string;
  group?: string;
  name: string;
  label: string;
  value: Vector;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  size: number;
  element: HTMLElement;
  control: HTMLDivElement;
  handle: HTMLButtonElement;
  line: SVGLineElement;
  valueSpan: HTMLSpanElement;

  constructor(
    config: ConfigFor<"vector">,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.name = config.name;
    this.id = config.id || config.name;
    this.group = config.group || "";
    this.label = config.label || config.name;
    this.size = config.size || 1;
    this.value =
      config.defaultValue === undefined
        ? this.getDefaultValue()
        : config.defaultValue;
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;

    const { element, control, handle, line, valueSpan } = this.buildUI();
    this.element = element;
    this.control = control;
    this.handle = handle;
    this.line = line;
    this.valueSpan = valueSpan;

    this.updateUI();
  }

  parse = (string: string) => {
    const [x, y] = string.split(",").map(parseFloat);

    return { x, y };
  };

  getRandomValue = () => {
    const { size } = this;

    return {
      x: random(-size, size, null, 2),
      y: random(-size, size, null, 2),
    };
  };

  getDefaultValue = () => {
    return { x: 0, y: 0 };
  };

  valueToString = (value: Vector = this.value) => {
    return `${value.x},${value.y}`;
  };

  capValue = (value: Vector) => {
    const { size } = this;

    return {
      x: Math.max(Math.min(value.x, size), -size),
      y: Math.max(Math.min(value.y, size), -size),
    };
  };

  getRelativeValues = (value: Vector = this.value) => {
    const { size } = this;
    const { x, y } = this.capValue(value);

    // ViewBox is 100x100, so these work both as SVG units and percentages
    // Y grows upwards, so it is flipped
    const left = ((x + size) / (2 * size)) * w;
    const top = ((size - y) / (2 * size)) * w;

    return { left, top };
  };

  buildUI = () => {
    const { size } = this;
    const id = toHtmlId(this.id);

    const axes = dom.path("ctrls__vector-axes", {
      d: `M ${w / 2} 0 v ${w} M 0 ${w / 2} h ${w}`,
    });

    const line = dom.line("ctrls__vector-line", {
      x1: w / 2,
      y1: w / 2,
    });

    const svg = dom.svg("", {
      viewBox: `0 0 ${w} ${w}`,
      children: [axes, line],
    });

    const handle = dom.button("ctrls__vector-handle");

    const control = dom.div("ctrls__vector", {
      children: [svg, handle],
    });

    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    let positionStart = { x: 0, y: 0 };

    const getNewValue = (clientX: number, clientY: number) => {
      const ratio = w / this.control.clientWidth;

      const left = positionStart.x + (clientX - dragStart.x) * ratio;
      const top = positionStart.y + (clientY - dragStart.y) * ratio;

      return this.capValue({
        x: parseFloat(((left / w) * 2 * size - size).toFixed(2)),
        y: parseFloat((size - (top / w) * 2 * size).toFixed(2)),
      });
    };

    // Mouse dragging
    handle.addEventListener("mousedown", (e: MouseEvent) => {
      dragStart = { x: e.clientX, y: e.clientY };
      positionStart = {
        x: parseFloat(handle.style.left),
        y: parseFloat(handle.style.top),
      };

      dragging = true;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mouseup", (e) => {
      if (dragging) {
        document.body.style.userSelect = "";
        dragging = false;

        this.value = getNewValue(e.clientX, e.clientY);
        this.onChange(this);
        this.update();
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (dragging) {
        this.value = getNewValue(e.clientX, e.clientY);
        this.updateUI();
        this.onInput(this);
      }
    });

    // Touch dragging
    handle.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) {
        return;
      }

      dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      positionStart = {
        x: parseFloat(handle.style.left),
        y: parseFloat(handle.style.top),
      };

      dragging = true;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("touchmove", (e) => {
      if (dragging) {
        e.preventDefault();

        this.value = getNewValue(e.touches[0].clientX, e.touches[0].clientY);
        this.updateUI();
        this.onInput(this);
      }
    });

    document.addEventListener("touchend", (e) => {
      if (dragging) {
        document.body.style.userSelect = "";
        dragging = false;

        this.value = getNewValue(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY,
        );
        this.onChange(this);
        this.update();
      }
    });

    // Arrow keys
    handle.addEventListener("keydown", (e: KeyboardEvent) => {
      const step = size * 0.05;
      const offsets: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };

      if (offsets[e.key]) {
        e.preventDefault();

        this.value = this.capValue({
          x: parseFloat((this.value.x + offsets[e.key][0]).toFixed(2)),
          y: parseFloat((this.value.y + offsets[e.key][1]).toFixed(2)),
        });
        this.onChange(this);
        this.onInput(this);
        this.update();
      }
    });

    const controlWrapper = dom.div("ctrls__vector-wrapper", {
      id,
      children: [control],
    });

    const right = dom.div("ctrls__control-right", {
      children: [controlWrapper],
    });

    const valueSpan = dom.span("ctrls__control-value");

    const label = dom.span("ctrls__control-label", {
      children: [this.label, " ", valueSpan],
    });

    const element = dom.div("ctrls__control ctrls__control--vector", {
      children: [label, right],
    });

    return {
      element,
      control,
      handle,
      line,
      valueSpan,
    };
  };

  updateUI = (value: Vector = this.value) => {
    const { handle, line, valueSpan } = this;
    const { left, top } = this.getRelativeValues(value);

    // Helper line
    line.setAttribute("x2", left.toString());
    line.setAttribute("y2", top.toString());

    // Handle
    handle.style.left = `${left}%`;
    handle.style.top = `${top}%`;

    valueSpan.textContent = `(${value.x}, ${value.y})`;
  };

  update = (value: Vector = this.value) => {
    this.value = value;

    this.updateUI();
  };
}
