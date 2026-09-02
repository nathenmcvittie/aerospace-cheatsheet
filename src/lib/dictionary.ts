import { Color, Icon } from "@raycast/api";

/**
 * The curated command dictionary.
 *
 * Every entry matches on the AEROSPACE COMMAND, never on a keystroke. That is what
 * makes this extension work on someone else's config: we look up what `join-with
 * right` means and then render whatever key *they* bound to it. A user who has never
 * touched ⌃⌥⌘L still gets the right label, group, and diagram.
 *
 * Commands with no entry are not dropped — they fall through to the "Other" group
 * showing their raw command string, so the sheet is never quietly incomplete.
 */

export type GroupId =
  | "recipes"
  | "focus"
  | "move"
  | "build"
  | "resize"
  | "layout"
  | "workspaces"
  | "service"
  | "other";

export interface Group {
  id: GroupId;
  title: string;
  subtitle?: string;
  tint: Color;
}

export const GROUPS: Group[] = [
  { id: "recipes", title: "Recipes", subtitle: "goal → keys", tint: Color.Yellow },
  { id: "build", title: "Build layout", subtitle: "multi-axis tiling", tint: Color.Purple },
  { id: "focus", title: "Focus", tint: Color.Blue },
  { id: "move", title: "Move window", tint: Color.Green },
  { id: "resize", title: "Resize", tint: Color.Orange },
  { id: "layout", title: "Layout mode", tint: Color.Magenta },
  { id: "workspaces", title: "Workspaces", tint: Color.Blue },
  { id: "service", title: "Service mode", subtitle: "second tier", tint: Color.SecondaryText },
  { id: "other", title: "Other", subtitle: "not in the dictionary", tint: Color.SecondaryText },
];

export interface Entry {
  /** Matches the normalised command string. */
  test: RegExp;
  group: GroupId;
  icon: Icon;
  /** Human label. `$1`, `$2`… interpolate regex capture groups. */
  label: string;
  /** One sentence on what it does. Shown in the detail pane. */
  blurb: string;
  /** Diagram asset basename in assets/diagrams, without extension. */
  diagram?: string;
  /** The rule this binding teaches — the thing you'd want to have known. */
  teaches?: string;
  /** Command that undoes it, as a plain-English phrase. */
  undo?: string;
  /**
   * Nicer wording for a capture group, keyed by the captured value. Without this,
   * "Join with $1 neighbour" produces "Join with down neighbour".
   */
  phrases?: Record<string, string>;
  /** Extra search terms. */
  keywords?: string[];
  /**
   * How several bindings matching THIS entry collapse into one row.
   *  "series" — a numeric run (workspace 1…9) becomes a single row with a range.
   *  "pair"   — two mirrored bindings (−50/+50, prev/next) become one "A / B" row.
   *  omitted  — each match stays its own row, which is right for the four directions.
   */
  collapse?: "series" | "pair";
}

/** Collapse whitespace so `layout   --root  h_tiles` matches `layout --root h_tiles`. */
export function normalise(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

const DIRECTION = "(left|down|up|right)";

export const ENTRIES: Entry[] = [
  // ---------------------------------------------------------------- build layout
  {
    test: new RegExp(`^join-with ${DIRECTION}$`),
    group: "build",
    icon: Icon.PlusSquare,
    label: "Join with $1",
    blurb: "Pulls the focused window and $1 under one new container, so they share a slot in the parent.",
    phrases: {
      left: "the window to its left",
      right: "the window to its right",
      up: "the window above",
      down: "the window below",
    },
    teaches:
      "The new container is laid out on the **opposite axis** to the one it sits in. Joining a left or right neighbour inside a row of columns therefore gives you a **top-to-bottom stack** — which is how you get a strip down one side and a stack beside it.",
    diagram: "join-$1",
    undo: "Flatten the workspace tree",
    keywords: ["nest", "container", "split", "stack", "group"],
  },
  {
    test: /^layout --root h_tiles$/,
    group: "build",
    icon: Icon.BarChart,
    label: "Root axis → columns",
    blurb: "Lays the workspace's top-level windows out side by side.",
    teaches:
      "This sets the axis of the **root** only. Nested containers keep alternating from it, so the children of a columns root are stacks.",
    diagram: "root-columns",
    keywords: ["horizontal", "side by side", "vertical strip"],
  },
  {
    test: /^layout --root v_tiles$/,
    group: "build",
    icon: Icon.BarChart,
    label: "Root axis → rows",
    blurb: "Stacks the workspace's top-level windows top to bottom.",
    teaches:
      "This sets the axis of the **root** only. Nested containers keep alternating from it, so the children of a rows root sit side by side.",
    diagram: "root-rows",
    keywords: ["vertical", "stacked", "rows"],
  },
  {
    test: /^flatten-workspace-tree$/,
    group: "build",
    icon: Icon.Trash,
    label: "Flatten — undo all nesting",
    blurb: "Collapses every container so all windows become direct children of the root again.",
    teaches: "The escape hatch. When a tree gets away from you, flatten and rebuild rather than unpicking it.",
    diagram: "flatten",
    keywords: ["reset", "collapse", "start over", "unnest"],
  },
  {
    test: /^balance-sizes$/,
    group: "build",
    icon: Icon.Equal,
    label: "Balance all splits",
    blurb: "Equalises every split in the workspace, on both axes at once.",
    diagram: "balance",
    keywords: ["even", "equalise", "equalize", "same size"],
  },

  // ---------------------------------------------------------------- focus / move
  {
    test: new RegExp(`^focus ${DIRECTION}$`),
    group: "focus",
    icon: Icon.Center,
    label: "Focus $1",
    blurb: "Moves focus to the nearest window $1, crossing into containers as needed.",
    diagram: "focus-$1",
    keywords: ["select", "activate", "go to"],
  },
  {
    test: new RegExp(`^move ${DIRECTION}$`),
    group: "move",
    icon: Icon.ArrowRight,
    label: "Move window $1",
    blurb: "Moves the focused window $1, swapping with a plain neighbour.",
    teaches:
      "If the neighbour is a **container**, the window moves *into* it rather than past it. That is how you add a third window to an existing stack.",
    diagram: "move-$1",
    keywords: ["swap", "push", "reorder", "into stack"],
  },
  {
    test: /^move-node-to-monitor (?:--wrap-around )?(prev|next)$/,
    group: "move",
    icon: Icon.Window,
    label: "Send to $1 monitor",
    blurb: "Moves the focused window to the $1 display.",
    keywords: ["display", "screen", "monitor"],
    collapse: "pair",
  },

  // ---------------------------------------------------------------- resize
  {
    test: /^resize smart ([+-]\d+)$/,
    group: "resize",
    icon: Icon.ArrowsExpand,
    label: "Resize along parent axis $1",
    blurb: "Grows or shrinks the window along whichever axis its parent container uses.",
    teaches: "Ambiguous once the tree is nested — reach for the explicit width or height binding instead.",
    keywords: ["smart", "grow", "shrink"],
    collapse: "pair",
  },
  {
    test: /^resize width ([+-]\d+)$/,
    group: "resize",
    icon: Icon.ArrowsExpand,
    label: "Width $1",
    blurb: "Changes the window's width regardless of how the tree is nested.",
    keywords: ["wider", "narrower", "horizontal"],
    collapse: "pair",
  },
  {
    test: /^resize height ([+-]\d+)$/,
    group: "resize",
    icon: Icon.ArrowsExpand,
    label: "Height $1",
    blurb: "Changes the window's height regardless of how the tree is nested.",
    keywords: ["taller", "shorter", "vertical"],
    collapse: "pair",
  },

  // ---------------------------------------------------------------- layout mode
  {
    test: /^layout tiles horizontal vertical$/,
    group: "layout",
    icon: Icon.AppWindowGrid2x2,
    label: "Toggle tiling axis",
    blurb: "Flips the focused container between horizontal and vertical tiling.",
    keywords: ["toggle", "flip", "rotate"],
  },
  {
    test: /^layout accordion horizontal vertical$/,
    group: "layout",
    icon: Icon.AppWindowList,
    label: "Toggle accordion",
    blurb: "Switches the container to accordion — windows overlap with only the focused one expanded.",
    keywords: ["tabs", "tabbed", "stack", "overlap"],
  },
  {
    test: /^layout floating tiling$/,
    group: "layout",
    icon: Icon.Move,
    label: "Toggle float / tile",
    blurb: "Pops the focused window out of the tiling tree, or puts it back.",
    keywords: ["float", "unfloat", "free"],
  },
  {
    test: /^fullscreen$/,
    group: "layout",
    icon: Icon.Maximize,
    label: "Fullscreen",
    blurb: "Fills the monitor with the focused window, keeping it in the tree.",
    keywords: ["maximise", "maximize", "zoom", "full"],
  },

  // ---------------------------------------------------------------- workspaces
  {
    test: /^workspace (\d+|[A-Za-z]+)$/,
    group: "workspaces",
    icon: Icon.Layers,
    label: "Go to workspace $1",
    blurb: "Switches the focused monitor to workspace $1.",
    keywords: ["switch", "desktop", "space"],
    collapse: "series",
  },
  {
    test: /^move-node-to-workspace (\d+|[A-Za-z]+)$/,
    group: "workspaces",
    icon: Icon.ArrowRightCircle,
    label: "Send window to workspace $1",
    blurb: "Moves the focused window to workspace $1 without following it.",
    keywords: ["send", "throw", "desktop", "space"],
    collapse: "series",
  },
  {
    test: /^workspace-back-and-forth$/,
    group: "workspaces",
    icon: Icon.Repeat,
    label: "Back and forth",
    blurb: "Returns to the workspace you were on before this one.",
    keywords: ["previous", "last", "toggle", "alt tab"],
  },
  {
    test: /^exec-and-forget .*--empty no.*(prev|next)$/,
    group: "workspaces",
    icon: Icon.ArrowClockwise,
    label: "Cycle to $1 non-empty workspace",
    blurb: "Wraps around the focused monitor's workspaces, skipping any that are empty.",
    keywords: ["cycle", "skip empty", "wrap"],
    collapse: "pair",
  },

  // ---------------------------------------------------------------- modes & service
  {
    test: /^mode (\w+)$/,
    group: "service",
    icon: Icon.Cog,
    label: "Enter $1 mode",
    blurb: "Switches to the $1 binding mode — its keys become live until you leave it.",
    keywords: ["mode", "layer"],
  },
  {
    test: /^close-all-windows-but-current$/,
    group: "service",
    icon: Icon.XMarkCircle,
    label: "Close all but current",
    blurb: "Closes every other window in the workspace. Not undoable.",
    keywords: ["close", "only", "solo"],
  },
  {
    test: /^reload-config$/,
    group: "service",
    icon: Icon.ArrowClockwise,
    label: "Reload config",
    blurb: "Re-reads the config file from disk.",
    keywords: ["reload", "refresh", "apply"],
  },
];

export function lookup(command: string): { entry: Entry; match: RegExpMatchArray } | undefined {
  const normalised = normalise(command);
  for (const entry of ENTRIES) {
    const match = normalised.match(entry.test);
    if (match) return { entry, match };
  }
  return undefined;
}

/**
 * Substitutes `$1`, `$2`… with regex captures.
 *
 * Two touch-ups on the way through: an entry's `phrases` map can replace a raw
 * capture with better wording, and a negative number is rendered with a true minus
 * sign (U+2212) rather than the ASCII hyphen the config happens to use.
 */
export function interpolate(template: string, match: RegExpMatchArray, entry?: Entry): string {
  return template.replace(/\$(\d)/g, (_, index) => {
    const captured = match[Number(index)] ?? "";
    const phrased = entry?.phrases?.[captured] ?? captured;
    return /^-\d+$/.test(phrased) ? phrased.replace(/^-/, "\u2212") : phrased;
  });
}
