import { buildRows } from "../../src/lib/rows";
import { GROUPS } from "../../src/lib/dictionary";
import { parseKey } from "../../src/lib/keys";
import { RECIPES, resolveRecipe } from "../../src/lib/recipes";
import type { Binding } from "../../src/lib/config";

const raw = JSON.parse(process.argv[2]) as { mode: string; bindings: Record<string, string> }[];
const bindings: Binding[] = raw.flatMap(({ mode, bindings: b }) =>
  Object.entries(b).map(([key, command]) => ({ mode, key, command, commands: command.split("; ") })),
);

const rows = buildRows(bindings);
console.log(`INPUT   ${bindings.length} bindings`);
console.log(`OUTPUT  ${rows.length} rows\n`);

for (const g of GROUPS) {
  const inGroup = rows.filter((r) => r.group === g.id);
  if (inGroup.length === 0) continue;
  console.log(`── ${g.title} (${inGroup.length})`);
  for (const r of inGroup) {
    const keys = r.keys.map((k) => (k.alternate ? `(${k.display})` : k.display)).join("  ");
    console.log(`   ${keys.padEnd(26)} ${r.title}${r.diagram ? `   [${r.diagram}]` : ""}`);
  }
}

console.log(`\n── Recipes`);
for (const recipe of RECIPES) {
  const r = resolveRecipe(recipe, bindings);
  const status = r.missing.length ? `MISSING: ${r.missing.join(", ")}` : "all steps bound";
  console.log(`   ${r.title.padEnd(26)} ${status}`);
  for (const s of r.resolved) console.log(`      ${(s.keys ?? "—").padEnd(12)} ${s.instruction.slice(0, 62)}`);
}

console.log(`\n── Key glyph spacing`);
for (const k of ["ctrl-alt-cmd-l", "ctrl-alt-shift-leftSquareBracket", "alt-ctrl-a", "esc", "ctrl-alt-minus"]) {
  const p = parseKey(k);
  console.log(`   ${k.padEnd(34)} → "${p.display}"   (codepoints: ${[...p.display].map((c) => c.codePointAt(0)!.toString(16)).join(" ")})`);
}
