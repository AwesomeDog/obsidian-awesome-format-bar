/** One floating layer at a time: positioning and dismissal, nothing else. */
interface FloatingLayer {
  readonly el: HTMLElement;
  /** Re-measure once the content is in: the rect is empty before that. */
  place(): void;
  close(): void;
}

let openEl: HTMLElement | null = null;
let release: (() => void) | null = null;

export function closeFloating(): void {
  release?.();
  release = null;
  openEl?.remove();
  openEl = null;
}

/** Opening one closes the other: two layers cannot share Escape. */
export function openFloatingLayer(
  anchor: HTMLElement,
  /** Escape only: the caret goes back because the menu closed without acting. */
  onDismiss?: () => void,
  /** Every close, dismissal included, for callers holding something outside. */
  onClose?: () => void,
): FloatingLayer {
  closeFloating();
  const doc = anchor.ownerDocument;
  // Fullscreen renders only its own subtree, so the layer must go inside it.
  const host =
    doc.fullscreenElement instanceof HTMLElement
      ? doc.fullscreenElement
      : doc.body;
  // Carries the base class: the layer lives outside the bar.
  const el = host.createDiv({
    cls: "awesome-format-bar awesome-format-bar--menu",
  });
  openEl = el;

  const close = (): void => {
    doc.removeEventListener("pointerdown", dismiss, true);
    doc.removeEventListener("keydown", onKey, true);
    if (openEl === el) {
      release = null;
      openEl = null;
    }
    el.remove();
    onClose?.();
  };

  const dismiss = (event: MouseEvent): void => {
    if (el.contains(event.target as Node)) return;
    close();
  };

  // Escape returns focus to where the user was: the editor, not the button.
  const onKey = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
    onDismiss?.();
  };

  const place = (): void => {
    const anchorRect = anchor.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const win = doc.defaultView ?? window;
    const left = Math.min(
      Math.max(8, anchorRect.left),
      win.innerWidth - rect.width - 8,
    );
    const below = anchorRect.bottom + 4;
    const top =
      below + rect.height > win.innerHeight
        ? anchorRect.top - rect.height - 4
        : below;
    el.style.left = `${left}px`;
    el.style.top = `${Math.max(8, top)}px`;
  };

  doc.addEventListener("pointerdown", dismiss, true);
  doc.addEventListener("keydown", onKey, true);
  release = close;

  return { close, el, place };
}
