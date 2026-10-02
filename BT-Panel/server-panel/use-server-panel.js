"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/utils";
import { sampleTelemetry } from "@/lib/panel/telemetry";

const POLL_MS = 3000;
const HISTORY_POINTS = 60;

/**
 * Everything the per-server panel needs: a polled snapshot of the server plus
 * its console events, the derived telemetry history, and the mutations each
 * tab performs. Keeping it in one hook means the tabs stay presentational and
 * the polling loop exists exactly once per open server.
 */
export function useServerPanel(initialServer, { onServerChange } = {}) {
  const [server, setServer] = useState(initialServer);
  const [events, setEvents] = useState([]);
  const [backups, setBackups] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState(null);

  const serverId = initialServer.id;
  const changeRef = useRef(onServerChange);
  useEffect(() => {
    changeRef.current = onServerChange;
  }, [onServerChange]);

  const applySnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    if (snapshot.server) {
      setServer(snapshot.server);
      changeRef.current?.(snapshot.server);
    }
    if (Array.isArray(snapshot.events)) setEvents(snapshot.events);
    if (Array.isArray(snapshot.backups)) setBackups(snapshot.backups);
  }, []);

  // ── Polling ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;
    let timer;

    const poll = async () => {
      try {
        const snapshot = await api(`/api/servers/${encodeURIComponent(serverId)}`);
        if (!active) return;
        applySnapshot(snapshot);
      } catch {
        // A failed poll is transient; the next tick retries.
      } finally {
        if (active) {
          setLoading(false);
          timer = setTimeout(poll, POLL_MS);
        }
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [applySnapshot, serverId]);

  // Telemetry is sampled from the live status so the graphs move while the
  // server is running and flatline the moment it stops.
  useEffect(() => {
    const tick = () => {
      const sample = sampleTelemetry(server, Date.now());
      setHistory((prev) => [...prev, sample].slice(-HISTORY_POINTS));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [server]);

  useEffect(() => {
    let active = true;
    api(`/api/servers/${encodeURIComponent(serverId)}/plugins`)
      .then((res) => active && setPlugins(res.plugins ?? []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [serverId]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const run = useCallback(async (key, fn, successMessage) => {
    setPending(key);
    try {
      const result = await fn();
      if (successMessage) toast.success(successMessage);
      return result;
    } catch (error) {
      toast.error(error?.message || "Something went wrong.");
      return null;
    } finally {
      setPending(null);
    }
  }, []);

  const power = useCallback(
    (action) =>
      run(`power:${action}`, async () => {
        const snapshot = await api(`/api/servers/${encodeURIComponent(serverId)}`, {
          method: "POST",
          body: { type: "power", action },
        });
        applySnapshot(snapshot);
        return snapshot;
      }),
    [applySnapshot, run, serverId],
  );

  const sendCommand = useCallback(
    (command) =>
      run("command", async () => {
        const snapshot = await api(`/api/servers/${encodeURIComponent(serverId)}`, {
          method: "POST",
          body: { type: "command", command },
        });
        applySnapshot(snapshot);
        return snapshot;
      }),
    [applySnapshot, run, serverId],
  );

  const rename = useCallback(
    (name) =>
      run(
        "rename",
        async () => {
          const res = await api(`/api/servers/${encodeURIComponent(serverId)}`, {
            method: "PATCH",
            body: { name },
          });
          if (res.server) {
            setServer(res.server);
            changeRef.current?.(res.server);
          }
          return res.server;
        },
        "Server renamed.",
      ),
    [run, serverId],
  );

  const createBackup = useCallback(
    (name) =>
      run(
        "backup:create",
        async () => {
          const res = await api(`/api/servers/${encodeURIComponent(serverId)}/backups`, {
            method: "POST",
            body: { name },
          });
          const listed = await api(`/api/servers/${encodeURIComponent(serverId)}/backups`);
          setBackups(listed.backups ?? []);
          return res.backup;
        },
        "Backup started.",
      ),
    [run, serverId],
  );

  const deleteBackup = useCallback(
    (backupId) =>
      run(
        `backup:delete:${backupId}`,
        async () => {
          await api(
            `/api/servers/${encodeURIComponent(serverId)}/backups/${encodeURIComponent(backupId)}`,
            { method: "DELETE" },
          );
          setBackups((prev) => prev.filter((backup) => backup.id !== backupId));
        },
        "Backup deleted.",
      ),
    [run, serverId],
  );

  const restoreBackup = useCallback(
    (backupId) =>
      run(
        `backup:restore:${backupId}`,
        async () => {
          const snapshot = await api(
            `/api/servers/${encodeURIComponent(serverId)}/backups/${encodeURIComponent(backupId)}`,
            { method: "POST" },
          );
          applySnapshot(snapshot);
        },
        "Backup restored.",
      ),
    [applySnapshot, run, serverId],
  );

  const addPlugin = useCallback(
    (catalogId) =>
      run(
        `plugin:add:${catalogId}`,
        async () => {
          await api(`/api/servers/${encodeURIComponent(serverId)}/plugins`, {
            method: "POST",
            body: { catalogId },
          });
          const listed = await api(`/api/servers/${encodeURIComponent(serverId)}/plugins`);
          setPlugins(listed.plugins ?? []);
        },
        "Plugin added.",
      ),
    [run, serverId],
  );

  const removePlugin = useCallback(
    (pluginId) =>
      run(
        `plugin:remove:${pluginId}`,
        async () => {
          const res = await api(
            `/api/servers/${encodeURIComponent(serverId)}/plugins?pluginId=${encodeURIComponent(pluginId)}`,
            { method: "DELETE" },
          );
          setPlugins(res.plugins ?? []);
        },
        "Plugin removed.",
      ),
    [run, serverId],
  );

  const transferOwner = useCallback(
    (ownerId) =>
      run(
        "owner",
        async () => {
          const res = await api(`/api/servers/${encodeURIComponent(serverId)}/owner`, {
            method: "PATCH",
            body: { ownerId },
          });
          if (res.server) {
            setServer(res.server);
            changeRef.current?.(res.server);
          }
        },
        "Owner updated.",
      ),
    [run, serverId],
  );

  const destroy = useCallback(
    () =>
      run(
        "delete",
        async () => {
          await api(`/api/servers/${encodeURIComponent(serverId)}`, { method: "DELETE" });
          return true;
        },
        "Server deleted.",
      ),
    [run, serverId],
  );

  return {
    server,
    events,
    backups,
    plugins,
    history,
    loading,
    pending,
    isPending: (key) => pending === key,
    actions: {
      power,
      sendCommand,
      rename,
      createBackup,
      deleteBackup,
      restoreBackup,
      addPlugin,
      removePlugin,
      transferOwner,
      destroy,
    },
  };
}
