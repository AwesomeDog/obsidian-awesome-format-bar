import type { Extension } from "@codemirror/state";
/* eslint-disable-next-line import/no-extraneous-dependencies -- provided by Obsidian at runtime via peerDependency; declaring it would risk version drift from Obsidian's bundled CodeMirror */
import {
  Decoration,
  MatchDecorator,
  ViewPlugin,
  highlightWhitespace,
  type ViewUpdate,
} from "@codemirror/view";

/** NBSP, Ogham, EN/EM and friends, ideographic space, BOM — never plain U+0020. */
const ODD_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g;

/** One character per match, so a run of odd spaces draws one dot each. */
const oddSpaces = new MatchDecorator({
  regexp: ODD_SPACE,
  decoration: Decoration.mark({ class: "cm-highlightOddSpace" }),
});

/** CM6 draws U+0020 and Tab; this adds the rest. Colors live in styles.css. */
export const SHOW_WHITESPACE: Extension = [
  highlightWhitespace(),
  ViewPlugin.define(
    (view) => ({
      decorations: oddSpaces.createDeco(view),
      update(update: ViewUpdate) {
        this.decorations = oddSpaces.updateDeco(update, this.decorations);
      },
    }),
    { decorations: (plugin) => plugin.decorations },
  ),
];
