import { Action, ActionPanel, Icon, List, closeMainWindow, showToast, Toast } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { focusWindow, listWindows } from "./lib/workspaces";

export default function Command() {
  const { data, isLoading, error } = useCachedPromise(async () => listWindows(), []);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Focus a window…">
      {error && <List.EmptyView icon={Icon.Warning} title="AeroSpace isn't reachable" description={error.message} />}
      {(data ?? []).map((w) => (
        <List.Item
          key={w.windowId}
          icon={Icon.AppWindow}
          title={w.appName}
          subtitle={w.windowTitle}
          keywords={[w.windowTitle, String(w.windowId)]}
          accessories={w.workspace ? [{ tag: w.workspace }] : []}
          actions={
            <ActionPanel>
              <Action
                title="Focus Window"
                icon={Icon.Center}
                onAction={async () => {
                  try {
                    await focusWindow(w.windowId);
                    await closeMainWindow();
                  } catch (e) {
                    await showToast({ style: Toast.Style.Failure, title: "Couldn't focus", message: String(e) });
                  }
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
