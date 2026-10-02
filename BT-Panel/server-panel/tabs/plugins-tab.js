"use client";

import { Plug, Plus, Trash2 } from "lucide-react";
import { PAPER_PLUGINS } from "@/lib/panel/catalog";
import { Button, Empty, Panel } from "../ui";

/**
 * Paper plugins are tracked as a desired-state list: the panel records what
 * should be installed, it does not download jars.
 */
export function PluginsTab({ server, plugins, actions, isPending }) {
  const supported = server.template === "minecraft";
  const installedIds = new Set(plugins.map((plugin) => plugin.catalogId));
  const available = PAPER_PLUGINS.filter((plugin) => !installedIds.has(plugin.id));

  if (!supported) {
    return (
      <Panel title="Plugins">
        <Empty
          icon={Plug}
          title="Plugins are a Paper feature"
          description={`This server runs the ${server.template} template, which has no plugin catalog.`}
        />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Installed" description={`${plugins.length} plugin(s) on this server.`}>
        {plugins.length === 0 ? (
          <Empty
            icon={Plug}
            title="No plugins yet"
            description="Add one from the catalog below."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-fill px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold">{plugin.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-steel">{plugin.version}</p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => actions.removePlugin(plugin.id)}
                  loading={isPending(`plugin:remove:${plugin.id}`)}
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Catalog" description="Plugins known to this panel.">
        {available.length === 0 ? (
          <Empty icon={Plug} title="Everything in the catalog is installed" />
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {available.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-fill px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-extrabold">{plugin.name}</p>
                  {plugin.description ? (
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-steel">
                      {plugin.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="primary"
                  onClick={() => actions.addPlugin(plugin.id)}
                  loading={isPending(`plugin:add:${plugin.id}`)}
                >
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
