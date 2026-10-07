import { normalizeRanges, order, type Plan, type Range } from "./plan";

export function insertText(
  doc: string,
  ranges: readonly Range[],
  text: string,
): Plan {
  const list = normalizeRanges(ranges);
  const changes = list.map((range) => ({
    from: range.from,
    to: range.to,
    text,
  }));
  if (list.length !== 1) return { changes: order(changes) };
  const first = list[0];
  if (!first) return { changes };
  const caret = first.from + text.length;
  return { changes, select: { from: caret, to: caret } };
}

export function deleteRanges(ranges: readonly Range[]): Plan {
  return {
    changes: order(
      normalizeRanges(ranges)
        .filter((range) => range.from !== range.to)
        .map((range) => ({ from: range.from, to: range.to, text: "" })),
    ),
  };
}
/** A fixed en-US formatter — no locale drift. */
function parts(date: Date, options: Intl.DateTimeFormatOptions) {
  const formatted = new Intl.DateTimeFormat("en-US", options).formatToParts(
    date,
  );
  return (type: string): string =>
    formatted.find((part) => part.type === type)?.value ?? "";
}

/** `YYYY-MM-DD HH:mm` */
export function formatDateTime(date: Date): string {
  const get = parts(date, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")} ${hour}:${get("minute")}`;
}

/** `YYYY-MM-DD`, the form a Gantt chart dates its tasks in. */
export function formatDate(date: Date): string {
  const get = parts(date, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${get("year")}-${get("month")}-${get("day")}`;
}
