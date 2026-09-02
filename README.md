# AeroSpace Cheatsheet

A Raycast extension that turns your [AeroSpace](https://nikitabobko.github.io/AeroSpace/)
keybindings into something you can actually read — grouped, explained, and illustrated
with diagrams of the window layout each key produces.

It reads **your** `aerospace.toml`. Nothing is hardcoded to one person's config.

## Why

AeroSpace tiles a workspace as a *tree*, not a grid, and the tree is where people get
stuck. The single most confusing thing about it — that joining your **left or right**
neighbour produces a **vertically stacked** container — is a paragraph of prose or one
small picture. This extension picks the picture.

A raw config is also mostly repetition. Arrows and `hjkl` bound to the same command,
a nine-long run of workspace switches, mirrored `±50` resizes. Listing every line is
what makes a shortcut list unreadable, so three merge rules collapse it:

| Rule | Example | Result |
|---|---|---|
| Same command, several keys | `ctrl-alt-left` + `ctrl-alt-h` | one row, alternate key muted |
| Mirrored pair | `resize width -50` / `+50` | `Width −50 / +50` |
| Numeric run | `workspace 1` … `workspace 9` | `⌃ ⌥ 1–9` |

On a fairly typical config that is **66 bindings → 37 rows**.

## Commands

- **AeroSpace Cheatsheet** — the main view: recipes on top, then your bindings grouped
  by what they do, each with a diagram and an explanation. `↵` runs the command.
- **Go to Workspace** — jump to a workspace, showing which apps live on each.
- **Switch Windows** — focus any window across all workspaces.
- **Show AeroSpace Config** — the raw `toml`, syntax-highlighted.
- **AeroSpace Menu Bar** — current workspace plus layout actions.

## Recipes

Goal-oriented walkthroughs — *"I want this shape on screen, which keys get me there"*.
Steps name a **command**, and the key is resolved from your config when the recipe is
rendered. If you haven't bound a command a recipe needs, the step says so rather than
showing a keystroke that does nothing.

## Design notes

**Diagrams contain no key glyphs.** They are pure layout schematics, because the same
asset has to stay true on anybody's keybindings. The keystroke is rendered beside the
image from your live config, never baked into the picture.

**Every diagram ships as a theme pair** — `foo.svg` and `foo@dark.svg`, each tuned to
its own background rather than compromising on a mid-grey that looks weak in both.
Raycast swaps them automatically; markdown only ever references `foo.svg`.

**Modifier glyphs are thin-spaced** (`U+2009`) and reordered into macOS canonical
order, so `alt-ctrl-a` and `ctrl-alt-a` both render `⌃ ⌥ A`. Stacked modifiers collide
into an unreadable smear at list-row size; a thin space separates them without looking
like separate keys.

**Unknown commands are never dropped.** Anything not in the curated dictionary appears
in an "Other" group showing its raw command, so the sheet is never quietly incomplete.

## Development

```sh
npm install
npm run dev        # load into Raycast
npm run diagrams   # regenerate assets/diagrams from tools/gen-diagrams.mjs
npm run build
```

Diagrams are generated, not hand-drawn. To change the palette, edit `PAL` in
`tools/gen-diagrams.mjs` and re-run `npm run diagrams` — all 42 SVGs re-emit.

## Prior art

[limonkufu/aerospace](https://www.raycast.com/limonkufu/aerospace) covers the same
ground and is where this started. This one differs in the cheatsheet: grouping, merge
rules, diagrams, recipes, and human labels instead of raw command strings.

## Licence

MIT
