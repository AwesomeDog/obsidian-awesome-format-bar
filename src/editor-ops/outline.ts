import { compareText, type Lines } from "./lines";

/** One node of the outline Sort Headings and Sort List both walk: the lines it
 * owns, and the ones nested under it. */
export interface Outline {
  /** What nests a node under another: a heading's level, or an item's indent. */
  readonly level: number;
  /** The line it opens on, and the last line its subtree covers. */
  readonly start: number;
  end: number;
  /** Its own line, plus every line that opens no node of its own. */
  readonly lines: string[];
  readonly children: Outline[];
  /** Moved by the sort and by moving an item: which node it sits under. */
  parent: Outline | null;
}

/** Parses `from..to` into a tree: `levelOf` gives the depth of a line that opens
 * a node, or `null` for one that rides with the node already open. A node is
 * closed by the next line at its own depth or a shallower one. */
export function parseOutline(
  lines: Lines,
  from: number,
  to: number,
  levelOf: (text: string, line: number) => number | null,
): Outline[] {
  const roots: Outline[] = [];
  const stack: Outline[] = [];

  for (let line = from; line <= to; line++) {
    const text = lines.at(line);
    const level = levelOf(text, line);
    // Rides with the node on top of the stack; with none open, it is dropped.
    if (level === null) {
      stack[stack.length - 1]?.lines.push(text);
      continue;
    }

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (!current || current.level < level) break;
      // The line above this one was its last: that closes its subtree.
      current.end = line - 1;
      stack.pop();
    }

    const parent = stack[stack.length - 1] ?? null;
    const node: Outline = {
      children: [],
      end: to,
      level,
      lines: [text],
      parent,
      start: line,
    };
    (parent ? parent.children : roots).push(node);
    stack.push(node);
  }
  return roots;
}

/** Sorts every level by `textOf`; a node keeps its own lines and its children. */
export function sortOutline(
  nodes: readonly Outline[],
  textOf: (node: Outline) => string,
): Outline[] {
  return nodes
    .map((node) => ({ ...node, children: sortOutline(node.children, textOf) }))
    .sort((a, b) => compareText(textOf(a), textOf(b)));
}

/** Depth-first, a node before its children. `targetLine` is where `target`
 * landed: the index of its first line, or -1 when it is not in the tree. */
export function flattenOutline(
  nodes: readonly Outline[],
  target?: Outline,
): { lines: string[]; targetLine: number } {
  const lines: string[] = [];
  let targetLine = -1;

  for (const node of nodes) {
    const at = lines.length;
    if (node === target) targetLine = at;
    lines.push(...node.lines);

    const children = flattenOutline(node.children, target);
    if (targetLine < 0 && children.targetLine >= 0)
      targetLine = at + node.lines.length + children.targetLine;
    lines.push(...children.lines);
  }
  return { lines, targetLine };
}
