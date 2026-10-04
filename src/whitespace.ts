import type { Extension } from "@codemirror/state";
/* eslint-disable-next-line import/no-extraneous-dependencies -- provided by Obsidian at runtime via peerDependency; declaring it would risk version drift from Obsidian's bundled CodeMirror */
import {
  Decoration,
  MatchDecorator,
  ViewPlugin,
  WidgetType,
  highlightWhitespace,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";

/** NBSP, Ogham, EN/EM and friends, ideographic space — never plain U+0020. */
export const ODD_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g;

/** SHY, ZWSP/ZWNJ/ZWJ, LRM/RLM, word joiner, invisible math operators, BOM. */
export const INVISIBLE = /[\u00ad\u200b-\u200f\u2060-\u2064\ufeff]/g;

/** One character per match, so a run of odd spaces draws one dot each. */
const oddSpaces = new MatchDecorator({
  regexp: ODD_SPACE,
  decoration: Decoration.mark({ class: "cm-highlightOddSpace" }),
});

/** Stands in for a character that has no width of its own to paint on. */
class InvisibleMark extends WidgetType {
  constructor(private readonly codepoint: string) {
    super();
  }

  eq(other: InvisibleMark): boolean {
    return other.codepoint === this.codepoint;
  }

  /** Built off the editor root: a widget is handed to CodeMirror parentless. */
  toDOM(view: EditorView): HTMLElement {
    return view.dom.createSpan({
      cls: "cm-highlightInvisible",
      // The only way to tell which character it is: on screen they look alike.
      title: this.codepoint,
    });
  }
}

const invisible = new MatchDecorator({
  regexp: INVISIBLE,
  decoration: (match) => {
    const hex = (match[0].codePointAt(0) ?? 0).toString(16).toUpperCase();
    return Decoration.replace({
      widget: new InvisibleMark(`U+${hex.padStart(4, "0")}`),
    });
  },
});

/** One plugin per decorator: marks and replacements cannot share a set. */
function decoratedBy(decorator: MatchDecorator): Extension {
  return ViewPlugin.define(
    (view) => ({
      decorations: decorator.createDeco(view),
      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      },
    }),
    { decorations: (plugin) => plugin.decorations },
  );
}

/** CM6 draws U+0020 and Tab; this adds the rest. Colors live in styles.css. */
export const SHOW_WHITESPACE: Extension = [
  highlightWhitespace(),
  decoratedBy(oddSpaces),
  decoratedBy(invisible),
];
