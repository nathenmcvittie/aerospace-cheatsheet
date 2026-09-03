import { parse } from "smol-toml";

/**
 * Surgical edits to aerospace.toml.
 *
 * These work on the raw text, one line at a time, and never round-trip through a TOML
 * parser. Parsing and re-serializing would produce a valid file that threw away every
 * comment, every blank line and every hand-aligned `=` column — for a config people
 * write by hand and annotate heavily, that is a destructive "fix". So the rules here
 * are deliberately narrow: locate the one line, change the one thing, leave every
 * other byte exactly as it was.
 *
 * The result is always validated by re-parsing before anything reaches disk.
 */

/** TOML bare keys are letters, digits, underscore and hyphen; escape anyway. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface Section {
  /** Index of the `[mode.x.binding]` header line. */
  header: number;
  /** First line index inside the section. */
  start: number;
  /** Index one past the section's last line. */
  end: number;
}

/**
 * Splits a TOML table header into its key path, honoring quoted segments.
 *
 * `[mode."main".binding]` is valid TOML and parses to the same table as
 * `[mode.main.binding]`, so a matcher that only accepts the bare form fails to find a
 * section the parser can see. That made editing impossible on such a config, and made
 * `addBinding` append a second `[mode.main.binding]` header, producing a file TOML
 * rejects as a redefined table.
 */
function tablePath(line: string): string[] | undefined {
  const match = line.match(/^\s*\[([^\]]+)\]\s*$/);
  if (!match) return undefined;

  const segments: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of match[1]) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ".") {
      segments.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current.trim());
  return segments;
}

function findSection(lines: string[], mode: string): Section | undefined {
  const index = lines.findIndex((line) => {
    const path = tablePath(line);
    return path?.length === 3 && path[0] === "mode" && path[1] === mode && path[2] === "binding";
  });
  if (index === -1) return undefined;

  let end = lines.length;
  for (let i = index + 1; i < lines.length; i++) {
    if (/^\s*\[/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { header: index, start: index + 1, end };
}

/** Index of the line binding `key` within `mode`, or -1. */
export function findBindingLine(raw: string, mode: string, key: string): number {
  const lines = raw.split("\n");
  const section = findSection(lines, mode);
  if (!section) return -1;

  // A key may be written bare or quoted; both are valid TOML.
  const pattern = new RegExp(`^\\s*(?:['"])?${escapeRegExp(key)}(?:['"])?\\s*=`);
  for (let i = section.start; i < section.end; i++) {
    if (pattern.test(lines[i])) return i;
  }
  return -1;
}

/**
 * Renders a command as a TOML value.
 *
 * A binding that runs several commands is stored as an array, which is how AeroSpace
 * expresses a sequence, so a "; "-joined command round-trips back to that shape rather
 * than being flattened into one string the CLI would reject.
 */
export function toTomlValue(command: string): string {
  const parts = command
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean);
  const quote = (value: string) => (value.includes("'") ? JSON.stringify(value) : `'${value}'`);
  return parts.length > 1 ? `[${parts.map(quote).join(", ")}]` : quote(parts[0] ?? "");
}

/**
 * Splits a binding line into the part before the value and any trailing comment, so a
 * rewrite can preserve both. The `=` alignment people use to line up a column lives in
 * the prefix, and the comment explaining the binding lives in the suffix; losing
 * either is the thing this whole module exists to avoid.
 */
function splitLine(line: string): { prefix: string; suffix: string } | undefined {
  const match = line.match(/^(\s*(?:['"])?[\w.-]+(?:['"])?\s*=\s*)(.*)$/);
  if (!match) return undefined;

  const [, prefix, rest] = match;
  let end = 0;
  if (rest.startsWith("[")) {
    let depth = 0;
    let quote: string | null = null;
    for (let i = 0; i < rest.length; i++) {
      const char = rest[i];
      if (quote) {
        if (char === quote) quote = null;
        continue;
      }
      if (char === "'" || char === '"') quote = char;
      else if (char === "[") depth++;
      else if (char === "]" && --depth === 0) {
        end = i + 1;
        break;
      }
    }
  } else if (rest.startsWith("'") || rest.startsWith('"')) {
    const quote = rest[0];
    const close = rest.indexOf(quote, 1);
    end = close === -1 ? rest.length : close + 1;
  } else {
    const hash = rest.indexOf("#");
    end = hash === -1 ? rest.length : hash;
  }
  return { prefix, suffix: rest.slice(end) };
}

export interface EditResult {
  raw: string;
  /** Human-readable description of what changed, for the toast. */
  summary: string;
}

/** Rewrites an existing binding, optionally under a new key. */
export function updateBinding(
  raw: string,
  mode: string,
  key: string,
  next: { key: string; command: string },
): EditResult {
  const lines = raw.split("\n");
  const index = findBindingLine(raw, mode, key);
  if (index === -1) throw new Error(`No binding for ${key} in [mode.${mode}.binding].`);

  const parts = splitLine(lines[index]);
  if (!parts) throw new Error(`Could not read the binding on line ${index + 1}.`);

  // Rebuild the prefix only when the key itself changed, so existing alignment and
  // indentation survive an edit that only touches the command.
  const prefix =
    next.key === key ? parts.prefix : parts.prefix.replace(/^(\s*)(?:['"])?[\w.-]+(?:['"])?/, `$1${next.key}`);

  lines[index] = `${prefix}${toTomlValue(next.command)}${parts.suffix}`;
  return {
    raw: lines.join("\n"),
    summary: next.key === key ? `Updated ${key}` : `Rebound ${key} to ${next.key}`,
  };
}

/** Adds a binding to the end of a mode's section, creating the section if needed. */
export function addBinding(raw: string, mode: string, key: string, command: string): EditResult {
  if (findBindingLine(raw, mode, key) !== -1) {
    throw new Error(`${key} is already bound in [mode.${mode}.binding].`);
  }

  const lines = raw.split("\n");
  const section = findSection(lines, mode);
  if (!section) {
    const trimmed = raw.replace(/\s*$/, "");
    return {
      raw: `${trimmed}\n\n[mode.${mode}.binding]\n    ${key} = ${toTomlValue(command)}\n`,
      summary: `Added ${key} in a new [mode.${mode}.binding]`,
    };
  }

  // Match the indentation the section already uses rather than imposing our own.
  const existing = lines.slice(section.start, section.end).find((l) => /^\s*[\w.'"-]+\s*=/.test(l));
  const indent = existing?.match(/^(\s*)/)?.[1] ?? "    ";

  let insertAt = section.end;
  while (insertAt > section.start && lines[insertAt - 1].trim() === "") insertAt--;

  lines.splice(insertAt, 0, `${indent}${key} = ${toTomlValue(command)}`);
  return { raw: lines.join("\n"), summary: `Added ${key}` };
}

export function removeBinding(raw: string, mode: string, key: string): EditResult {
  const lines = raw.split("\n");
  const index = findBindingLine(raw, mode, key);
  if (index === -1) throw new Error(`No binding for ${key} in [mode.${mode}.binding].`);
  lines.splice(index, 1);
  return { raw: lines.join("\n"), summary: `Removed ${key}` };
}

/**
 * Re-parses edited text and confirms the binding landed as intended.
 *
 * Valid TOML is necessary but not sufficient: an edit that produced a syntactically
 * fine file binding the wrong thing would still be a bug, so the expected outcome is
 * asserted too. This runs before anything is written.
 */
export function verifyEdit(
  raw: string,
  mode: string,
  key: string | null,
  expected: string | null,
): { ok: true } | { ok: false; reason: string } {
  let parsed: { mode?: Record<string, { binding?: Record<string, string | string[]> }> };
  try {
    parsed = parse(raw) as never;
  } catch (e) {
    return { ok: false, reason: `That would make the config invalid: ${e instanceof Error ? e.message : e}` };
  }

  const bindings = parsed.mode?.[mode]?.binding ?? {};
  if (key === null) return { ok: true };

  const value = bindings[key];
  if (expected === null) {
    return value === undefined ? { ok: true } : { ok: false, reason: `${key} is still bound after removal.` };
  }
  if (value === undefined) return { ok: false, reason: `${key} is missing after the edit.` };

  const actual = (Array.isArray(value) ? value : [value]).join("; ");
  const wanted = expected
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .join("; ");
  return actual === wanted ? { ok: true } : { ok: false, reason: `${key} became "${actual}" rather than "${wanted}".` };
}
