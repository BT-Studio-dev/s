"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import { Button, Empty, Panel } from "../ui";

const LEVEL_COLOR = {
  info: "text-ice",
  warn: "text-warn",
  error: "text-danger",
  success: "text-ok",
};

function timestamp(value) {
  if (!value) return "--:--:--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--:--" : date.toLocaleTimeString();
}

export function ConsoleTab({ server, events, onCommand, isPending }) {
  const [command, setCommand] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const sentRef = useRef([]);
  const logRef = useRef(null);

  // Pin the log to the newest line unless the operator scrolled up to read.
  useEffect(() => {
    const node = logRef.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 60;
    if (atBottom) node.scrollTop = node.scrollHeight;
  }, [events]);

  const online = server.status === "running";

  async function submit(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    sentRef.current = [value, ...sentRef.current].slice(0, 50);
    setHistoryIndex(-1);
    setCommand("");
    await onCommand(value);
  }

  // Up/down walks the locally sent command history, like a real console.
  function onKeyDown(event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const history = sentRef.current;
    if (!history.length) return;
    event.preventDefault();
    const next =
      event.key === "ArrowUp"
        ? Math.min(historyIndex + 1, history.length - 1)
        : Math.max(historyIndex - 1, -1);
    setHistoryIndex(next);
    setCommand(next === -1 ? "" : history[next]);
  }

  return (
    <Panel
      title="Console"
      description={online ? "Live output from the running server." : "The server is not running."}
    >
      <div
        ref={logRef}
        className="scrollbar-thin h-[420px] overflow-y-auto rounded-xl border border-line bg-sunken p-4 font-mono text-[12px] leading-relaxed"
      >
        {events.length === 0 ? (
          <Empty
            icon={Terminal}
            title="No console output yet"
            description="Start the server to see its boot log here."
          />
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex gap-3">
              <span className="shrink-0 text-faint">{timestamp(event.createdAt)}</span>
              <span className={LEVEL_COLOR[event.level] ?? "text-ice"}>{event.message}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <span className="font-mono text-[13px] font-extrabold text-[var(--accent)]">$</span>
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={online ? "Type a command and press Enter" : "Start the server to send commands"}
          disabled={!online}
          className="min-w-0 flex-1 rounded-xl border border-line bg-sunken px-3 py-2 font-mono text-[13px] outline-none transition focus:border-[var(--accent)] disabled:opacity-50"
        />
        <Button type="submit" variant="primary" loading={isPending("command")} disabled={!online}>
          Send
        </Button>
      </form>
    </Panel>
  );
}
