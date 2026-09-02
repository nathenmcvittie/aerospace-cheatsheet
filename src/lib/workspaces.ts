import { aerospace } from "./config";

/**
 * Thin wrappers over the AeroSpace CLI's `--json` output.
 *
 * Field names are hyphenated in AeroSpace's JSON (`window-id`, `app-name`), so they
 * are mapped to camelCase here rather than being carried through the UI.
 */

export interface Workspace {
  name: string;
  isEmpty: boolean;
  isFocused: boolean;
}

export interface WindowInfo {
  windowId: number;
  appName: string;
  windowTitle: string;
  workspace?: string;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const [allRaw, nonEmptyRaw, focused] = await Promise.all([
    aerospace("list-workspaces", "--all", "--json"),
    aerospace("list-workspaces", "--monitor", "focused", "--empty", "no", "--json").catch(() => "[]"),
    aerospace("list-workspaces", "--focused").catch(() => ""),
  ]);

  const all = JSON.parse(allRaw) as { workspace: string }[];
  const nonEmpty = new Set((JSON.parse(nonEmptyRaw) as { workspace: string }[]).map((w) => w.workspace));

  return all.map(({ workspace }) => ({
    name: workspace,
    isEmpty: !nonEmpty.has(workspace),
    isFocused: workspace === focused.trim(),
  }));
}

export async function listWindows(workspace?: string): Promise<WindowInfo[]> {
  const args = workspace ? ["list-windows", "--workspace", workspace] : ["list-windows", "--all"];
  const raw = await aerospace(...args, "--json");
  const parsed = JSON.parse(raw) as {
    "window-id": number;
    "app-name": string;
    "window-title": string;
    workspace?: string;
  }[];
  return parsed.map((w) => ({
    windowId: w["window-id"],
    appName: w["app-name"],
    windowTitle: w["window-title"],
    workspace: w.workspace,
  }));
}

export async function focusWorkspace(name: string): Promise<void> {
  await aerospace("workspace", name);
}

export async function focusWindow(windowId: number): Promise<void> {
  await aerospace("focus", "--window-id", String(windowId));
}
