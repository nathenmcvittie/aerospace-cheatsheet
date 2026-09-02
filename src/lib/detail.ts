import SIZES from "./diagram-sizes.json";
import type { Row } from "./rows";
import type { ResolvedRecipe } from "./recipes";

/**
 * Builds the markdown for the detail pane.
 *
 * Split of responsibilities, applied consistently:
 *   markdown  — anything SPATIAL or SEQUENTIAL (a diagram, a numbered walkthrough)
 *   metadata  — LOOKUP FACTS (keys, raw command, mode, what undoes it)
 *
 * Keys are always rendered from the live config, never from the diagram, because the
 * diagrams are shared assets that have to stay true on anybody's keybindings.
 */

type SizeMap = Record<string, [number, number]>;
const sizes = SIZES as SizeMap;

/**
 * Reference the light asset only — Raycast automatically substitutes the `@dark`
 * twin. Width and height are pinned to the SVG's intrinsic size so the pane never
 * stretches it.
 */
export function diagramMarkdown(name: string | undefined, alt = ""): string {
  if (!name) return "";
  const size = sizes[name];
  const query = size ? `?raycast-width=${size[0]}&raycast-height=${size[1]}` : "";
  return `![${alt}](diagrams/${name}.svg${query})`;
}

function keyLine(row: Row): string {
  const primary = row.keys.filter((k) => !k.alternate).map((k) => `\`${k.display}\``);
  const alternates = row.keys.filter((k) => k.alternate).map((k) => `\`${k.display}\``);
  const parts = [primary.join(" · ")];
  if (alternates.length > 0) parts.push(`or ${alternates.join(" · ")}`);
  return parts.join("  ");
}

export function rowMarkdown(row: Row): string {
  const out: string[] = [`## ${row.title}`, "", keyLine(row), ""];

  const diagram = diagramMarkdown(row.diagram, row.title);
  if (diagram) out.push(diagram, "");

  if (row.entry?.blurb) out.push(row.entry.blurb, "");
  if (row.entry?.teaches) out.push(row.entry.teaches, "");

  if (!row.entry) {
    out.push(
      "This binding isn't in the cheatsheet's dictionary yet, so it's shown exactly as written in your config.",
      "",
    );
  }
  return out.join("\n");
}

export function recipeMarkdown(recipe: ResolvedRecipe, { storyboard = false } = {}): string {
  const out: string[] = [`## ${recipe.title}`, ""];

  const image = storyboard && recipe.storyboard ? recipe.storyboard : recipe.diagram;
  const diagram = diagramMarkdown(image, recipe.title);
  if (diagram) out.push(diagram, "");

  out.push(recipe.outcome, "");

  if (recipe.missing.length > 0) {
    out.push(
      `> **Not fully available on your config.** This recipe needs ${recipe.missing
        .map((c) => `\`${c}\``)
        .join(" and ")}, which you haven't bound to a key. Add a binding to run it as written.`,
      "",
    );
  }

  recipe.resolved.forEach((step, index) => {
    const key = step.unbound ? "_not bound_" : step.keys ? `\`${step.keys}\`` : "";
    out.push(`${index + 1}. ${key}${key ? ": " : ""}${step.instruction}`);
  });

  return out.join("\n");
}
