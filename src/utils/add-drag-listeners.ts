type DragHandlers = {
  onStart: () => void;
  // Pointer offset in pixels from where the drag started
  onMove: (dx: number, dy: number) => void;
  onEnd: () => void;
};

// Mouse, touch and pen dragging using pointer events.
// Pointer capture keeps sending events to the element even when the pointer leaves it.
// The element needs "touch-action: none" to prevent scrolling on touch devices.
export const addDragListeners = (
  element: HTMLElement,
  { onStart, onMove, onEnd }: DragHandlers,
) => {
  let start: { x: number; y: number } | null = null;

  element.addEventListener("pointerdown", (e) => {
    // Ignore additional touches and right clicks
    if (!e.isPrimary || e.button !== 0) {
      return;
    }

    start = { x: e.clientX, y: e.clientY };
    element.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";

    onStart();
  });

  element.addEventListener("pointermove", (e) => {
    if (start) {
      onMove(e.clientX - start.x, e.clientY - start.y);
    }
  });

  const end = () => {
    if (start) {
      start = null;
      document.body.style.userSelect = "";

      onEnd();
    }
  };

  element.addEventListener("pointerup", end);
  element.addEventListener("pointercancel", end);
};
