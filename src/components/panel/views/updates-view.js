"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import { formatNewsDate, newsKind, LATEST, NEWS } from "@/lib/panel/news";
import { PANEL_VERSION, REPO_URL } from "@/lib/panel/types";
import { cn } from "@/lib/utils";
import { usePanel } from "../context";

/**
 * Release notes for the panel. Read-only: the list is shipped with the build
 * (see lib/panel/news.js), so this view needs no API and renders offline.
 */
export function UpdatesView() {
  const { language } = usePanel();
  // The build's version is the source of truth; flag a mismatch rather than
  // quietly claiming the newest entry is what is running.
  const current = PANEL_VERSION === LATEST.version;
  return (
    <div className="flex flex-col gap-4">
      <section className="glass overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold">
              <Sparkles className="size-4 text-accent" />
              What&apos;s new
            </h2>
            <p className="mt-0.5 text-[12px] font-semibold text-steel">
              Release notes for BT-Panel · running {PANEL_VERSION}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {current ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-extrabold text-emerald-300">
                <Check className="size-3.5" /> Up to date
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-extrabold text-amber-300">
                {LATEST.version} available
              </span>
            )}
            <a
              className="btn-ghost"
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              Repository <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13px] font-semibold text-steel">{LATEST.summary}</p>
        </div>
      </section>

      <ol className="flex flex-col gap-4">
        {NEWS.map((release, index) => (
          <li key={release.version}>
            <ReleaseCard release={release} latest={index === 0} language={language} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReleaseCard({ release, latest, language }) {
  return (
    <article className="glass overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <h3 className="font-mono text-[15px] font-extrabold text-ice">{release.version}</h3>
          {latest ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold text-accent">
              Latest
            </span>
          ) : null}
          <span className="truncate text-[13px] font-bold text-steel">{release.title}</span>
        </div>
        <time className="text-[11px] font-semibold text-faint" dateTime={release.date}>
          {formatNewsDate(release.date, language)}
        </time>
      </div>
      <ul className="flex flex-col gap-2.5 px-5 py-4">
        {release.items.map((item, i) => {
          const kind = newsKind(item.kind);
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-px shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold",
                  kind.className,
                )}
              >
                {kind.label}
              </span>
              <span className="text-[13px] font-semibold text-steel">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
