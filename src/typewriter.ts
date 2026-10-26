import type { Extension } from "@codemirror/state";
/* eslint-disable-next-line import/no-extraneous-dependencies -- provided by Obsidian at runtime via peerDependency; declaring it would risk version drift from Obsidian's bundled CodeMirror */
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

const OFFSET_RATIO = 0.5;

const EDITOR_CLASS = "awesome-format-bar-typewriter";
const LINE_CLASS = "awesome-format-bar-current-line";

let enabled = false;

export function isTypewriterModeEnabled(): boolean {
  return enabled;
}

/** The caller reconfigures: extensions are read once per editor, not per toggle. */
export function toggleTypewriterMode(): void {
  enabled = !enabled;
}

const currentLine = Decoration.line({ class: LINE_CLASS });

class Typewriter {
  decorations: DecorationSet = Decoration.none;

  private alive = true;
  private readonly observer = new ResizeObserver(() => this.center());

  constructor(private readonly view: EditorView) {
    this.observer.observe(view.dom);
    this.decorate();
    this.center();
  }

  update(update: ViewUpdate): void {
    // Geometry is the observer's job; reacting to it here would loop.
    if (!update.selectionSet && !update.docChanged) return;
    this.decorate();
    // A click parks the caret where it was put; typing still recenters.
    if (!update.transactions.some((tr) => tr.isUserEvent("select.pointer")))
      this.center();
  }

  destroy(): void {
    this.alive = false;
    this.observer.disconnect();
    // Reconfigure reuses the editor DOM, so the padding outlives the plugin.
    this.view.contentDOM.style.removeProperty("padding-block");
  }

  private decorate(): void {
    const head = this.view.state.selection.main.head;
    const line = this.view.state.doc.lineAt(head);
    this.decorations = Decoration.set(currentLine.range(line.from));
  }

  /** The height comes from a measure: `update()` runs before the DOM is resynced. */
  private center(): void {
    const win = this.view.dom.ownerDocument.defaultView ?? window;
    this.view.requestMeasure({
      read: (view) => ({
        offset: Math.round(view.dom.clientHeight * OFFSET_RATIO),
        head: view.state.selection.main.head,
      }),
      write: ({ offset, head }, view) => {
        if (!this.alive) return;
        view.contentDOM.style.paddingBlock = `${offset}px`;
        win.requestAnimationFrame(() => {
          if (!this.alive) return;
          view.dispatch({
            effects: EditorView.scrollIntoView(head, {
              y: "start",
              yMargin: offset,
            }),
          });
        });
      },
    });
  }
}

export const TYPEWRITER: Extension = [
  EditorView.editorAttributes.of({ class: EDITOR_CLASS }),
  ViewPlugin.define((view) => new Typewriter(view), {
    decorations: (plugin) => plugin.decorations,
  }),
];
