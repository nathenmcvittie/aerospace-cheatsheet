# AeroSpace Cheatsheet

A Raycast extension for looking up, learning, and running your
[AeroSpace](https://nikitabobko.github.io/AeroSpace/) keybindings.

It reads your own `aerospace.toml`. Every key it shows is a key you actually have, so it
works the same whether you run the defaults, a config you inherited from someone, or
your own bindings.

## Commands

| Command | What it does |
|---|---|
| AeroSpace Cheatsheet | Your bindings, grouped and named, with diagrams and recipes |
| Go to Workspace | Switch workspace, showing which apps are on each |
| Switch Windows | Focus any window across all workspaces |
| Show AeroSpace Config | The raw `toml`, syntax-highlighted, with a jump to your editor |
| AeroSpace Menu Bar | Current workspace plus common layout actions |

## The cheatsheet

**Readable names.** A row says "Send window to workspace 1–9", not
`move-node-to-workspace 1`. The raw command is still there in the detail panel when
you want it.

**Real key glyphs.** `ctrl-alt-cmd-l` renders as `⌃ ⌥ ⌘ L`, thin-spaced so the
modifiers don't smear together, and reordered into macOS order. `alt-ctrl-a` and
`ctrl-alt-a` both come out as `⌃ ⌥ A`.

**Less to read.** A config is mostly repetition: arrows and `hjkl` on the same command,
a nine-long run of workspace switches, mirrored `±50` resizes. Three rules collapse it.

| Rule | Example | Becomes |
|---|---|---|
| One command, several keys | `ctrl-alt-left` and `ctrl-alt-h` | one row, second key muted |
| Mirrored pair | `resize width -50` / `+50` | `Width −50 / +50` |
| Numeric run | `workspace 1` … `workspace 9` | `⌃ ⌥ 1–9` |

A typical config goes from 66 bindings to 37 rows.

**Search that finds things.** Every row carries its keys, its command, and plain words
for what it does. Searching `stack`, `⌘L`, `ctrl-alt-cmd-l`, or `join` all reach the
same row.

**Run it from Raycast.** Press return on any row to run that command against the
window you were last in. Handy when you want to see what a binding does before
committing it to muscle memory.

**Diagrams.** Rows that change the window layout show a small before-and-after picture
of what happens on screen. Useful for the ones that are hard to hold in your head, like
why joining a left or right neighbour produces a vertically stacked column.

**Recipes.** Short walkthroughs for shapes you want on screen: a strip down one side
with a stack beside it, a 2×2 grid, even columns, or a reset back to a clean workspace.
Each step names the key from your config.

**Nothing gets hidden.** A binding the extension doesn't recognise still appears, under
"Other", showing its raw command.

## Working from your config

Every row is matched by AeroSpace *command*, never by keystroke, which is what lets the
same dictionary describe anyone's setup. Diagrams contain no key glyphs for the same
reason: they are layout schematics, and the keystroke is drawn next to them from your
config rather than baked into the picture.

Recipes are resolved the same way. If a recipe needs a command you have not bound to
anything, the step says so instead of printing a key that does nothing.

## Install

Until this is on the Raycast store:

```sh
git clone https://github.com/nathenmcvittie/aerospace-cheatsheet
cd aerospace-cheatsheet
npm install
npm run dev
```

`npm run dev` builds the extension and loads it into Raycast, then watches for changes.
The commands appear in Raycast straight away. Stopping the process leaves them
installed until Raycast restarts.

Requires [AeroSpace](https://nikitabobko.github.io/AeroSpace/) and a config at
`~/.aerospace.toml` or `~/.config/aerospace/aerospace.toml`.

## Development

```sh
npm run dev        # build and load into Raycast, with hot reload
npm run build      # build and typecheck
npm run diagrams   # regenerate assets/diagrams
npm run icon       # regenerate assets/icon.png
npm run lint
```

Diagrams and the icon are both generated rather than drawn. To change the diagram
palette, edit `PAL` in `tools/gen-diagrams.mjs` and re-run `npm run diagrams`; all 42
SVGs re-emit. Each diagram ships as a light and a dark file, and Raycast picks between
them by the `@dark` filename suffix.

To teach the cheatsheet a command it does not know yet, add an entry to `ENTRIES` in
`src/lib/dictionary.ts`. An entry is a regex against the command plus a label, a group,
and optionally a diagram and an explanation.

## Prior art

[limonkufu/aerospace](https://www.raycast.com/limonkufu/aerospace) covers similar
ground and is where this started. The workspace and window commands do much the same
job. The cheatsheet is where this one goes further: grouping, the merge rules, search
terms, diagrams, recipes, and names instead of raw command strings.

## Licence

MIT. See [LICENSE](LICENSE).
