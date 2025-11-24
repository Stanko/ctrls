import { dom } from "../utils/dom";
import { deleteIcon } from "../utils/icons";
import { toHtmlId } from "../utils/string-utils";
import type {
  Ctrl,
  CtrlChangeHandler,
  CtrlConfig,
  CtrlItemType,
} from "./types";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg+xml"];

export class FileCtrl implements Ctrl<File | null> {
  id: string;
  type: CtrlItemType = "file";
  name: string;
  label: string;
  group: string;
  value: File | null;
  isRandomizationDisabled: boolean;
  onChange: CtrlChangeHandler;
  onInput: CtrlChangeHandler;
  element: HTMLElement;
  input: HTMLInputElement;
  preview: HTMLDivElement;
  accept: string;

  constructor(
    config: CtrlConfig<File | null>,
    onChange: CtrlChangeHandler,
    onInput: CtrlChangeHandler,
  ) {
    this.name = config.name;
    this.id = config.id || config.name;
    this.label = config.label || config.name;
    this.group = config.group || "";
    this.value = null;
    this.accept = config.accept || "";
    this.isRandomizationDisabled = config.isRandomizationDisabled || false;
    this.onChange = onChange;
    this.onInput = onInput;

    const { input, element, preview } = this.buildUI();
    this.input = input;
    this.element = element;
    this.preview = preview;
  }
  buildUI = () => {
    const id = toHtmlId(this.id);

    const input = dom.input("ctrls__file-input", {
      type: "file",
      id: id,
      name: id,
    });
    input.addEventListener("change", () => {
      this.update(input.files ? input.files[0] : null);
      this.onChange(this);
      this.onInput(this);
    });

    const fakeInput = dom.label(
      "ctrls__file-fake-input ctrls__btn ctrls__btn--sm",
      {
        for: id,
        children: ["select file"],
      },
    );

    if (this.accept) {
      const acceptSpan = dom.span("", { children: [this.accept] });
      fakeInput.append(acceptSpan);
    }

    const clearButton = dom.button("ctrls__file-clear ctrls__btn", {
      innerHTML: deleteIcon,
      "aria-label": "Clear file",
    });
    clearButton.addEventListener("click", () => {
      if (input.files) {
        this.update(null);
        this.onChange(this);
        this.onInput(this);
      }
    });

    const top = dom.div("ctrls__file-top", {
      children: [input, fakeInput, clearButton],
    });

    const preview = dom.div("ctrls__file-preview");

    const right = dom.div("ctrls__control-right", {
      children: [top, preview],
    });

    const label = dom.label("ctrls__control-label", {
      for: id,
      children: [this.label],
    });

    const element = dom.div("ctrls__control ctrls__control--file", {
      children: [label, right],
    });

    return {
      element,
      input,
      preview,
    };
  };

  update = (file: File | null) => {
    this.value = file;

    if (file) {
      const isImage = IMAGE_EXTENSIONS.includes(file.type.split("/")[1]);

      const img = isImage
        ? dom.img("ctrls__file-image", {
            src: URL.createObjectURL(file),
            alt: file.name,
          })
        : "";

      const label = dom.figcaption("ctrls__file-label", {
        children: [file.name],
      });

      const item = dom.figure("ctrls__file-preview-item", {
        children: [img, label],
      });

      this.preview.replaceChildren(item);
    } else {
      this.preview.innerHTML = "";
      this.input.value = "";
    }
  };

  // Files can't be preserved in the URL hash,
  // so these are only placeholders to satisfy the interface
  parse = () => null;
  getRandomValue = () => null;
  getDefaultValue = () => null;
  valueToString = () => "";
}
