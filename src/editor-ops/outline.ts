import { compareText, type Lines } from "./lines";

/** One node of the outline: its own lines, and the ones nested under it. */
export interface Outline {
  readonly level: number;
  readonly start: number;
  end: number;
  readonly lines: string[];
  readonly children: Outline[];
  parent: Outline | null;
}

/** `levelOf` gives a line depth, or `null` for one that rides with the open node. */
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
    if (level === null) {
      stack[stack.length - 1]?.lines.push(text);
      continue;
    }

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      if (!current || current.level < level) break;
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

export function outlineAt(
  nodes: readonly Outline[],
  line: number,
): Outline | null {
  for (const node of nodes) {
    if (line < node.start || line > node.end) continue;
    return outlineAt(node.children, line) ?? node;
  }
  return null;
}

export function sortOutline(
  nodes: readonly Outline[],
  textOf: (node: Outline) => string,
): Outline[] {
  return nodes
    .map((node) => ({ ...node, children: sortOutline(node.children, textOf) }))
    .sort((a, b) => compareText(textOf(a), textOf(b)));
}

/** Moves `node` one place `direction`, carrying its subtree; out of siblings it joins
 * the uncle on that side. Shared by Move Section and Move List Item. */
export function moveOutline(
  roots: Outline[],
  node: Outline,
  direction: -1 | 1,
): { lines: readonly string[]; targetLine: number } | null {
  const siblings = node.parent?.children ?? roots;
  const index = siblings.indexOf(node);
  if (index < 0) return null;

  const neighbor = siblings[index + direction];
  if (neighbor) {
    siblings[index + direction] = node;
    siblings[index] = neighbor;
    return flattenOutline(roots, node);
  }

  const parent = node.parent;
  if (!parent) return null;
  const uncles = parent.parent?.children ?? roots;
  const uncle = uncles[uncles.indexOf(parent) + direction];
  if (!uncle) return null;
  siblings.splice(index, 1);
  if (direction < 0) uncle.children.push(node);
  else uncle.children.unshift(node);
  node.parent = uncle;
  return flattenOutline(roots, node);
}

/** Depth-first, a node before its children; `targetLine` is where `target` landed. */
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
