# server-panel

The per-server control panel: the screen an operator sees after opening a
server from the servers list, or by visiting `/server/<id>` directly.

It is kept outside `src/` because it is a self-contained feature module with
its own data layer, UI primitives and tabs. The Next.js app imports it through
the `@server-panel/*` alias declared in `jsconfig.json`.

```
server-panel/
├── index.js             barrel export
├── server-panel.js      header, power controls, tab navigation
├── use-server-panel.js  polling + every mutation the tabs perform
├── ui.js                shared Panel / Button / Field / Input / Empty / Row
└── tabs/
    ├── console-tab.js   live console output + command input with history
    ├── resources-tab.js CPU / memory / disk / network sparklines
    ├── backups-tab.js   create, restore and delete backups
    ├── plugins-tab.js   Paper plugin catalog (desired-state list)
    ├── network-tab.js   allocation details and copy-to-clipboard address
    └── settings-tab.js  rename, ownership transfer, delete (danger zone)
```

## Usage

```jsx
import { ServerPanel } from "@server-panel";

<ServerPanel server={server} onBack={() => router.push("/servers")} />;
```

`server` is a `ServerDto` from `/api/bootstrap` or `/api/servers/<id>`. The
component must be rendered inside `PanelProvider`, which supplies
`upsertServer`, `team` and `isAdmin`.

## APIs it talks to

| Action | Endpoint |
| --- | --- |
| Snapshot + console events (polled every 3s) | `GET /api/servers/:id` |
| Power / command | `POST /api/servers/:id` |
| Rename | `PATCH /api/servers/:id` |
| Delete | `DELETE /api/servers/:id` |
| Backups | `GET/POST /api/servers/:id/backups`, `POST/DELETE .../:backupId` |
| Plugins | `GET/POST/DELETE /api/servers/:id/plugins` |
| Ownership | `PATCH /api/servers/:id/owner` |

No new endpoints were introduced — the module is built entirely on the panel's
existing API surface.
