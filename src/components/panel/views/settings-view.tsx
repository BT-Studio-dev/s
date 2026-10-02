"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CloudUpload,
  Eye,
  Globe,
  Image as ImageIcon,
  Link2,
  Mail,
  Moon,
  Plus,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Sun,
  Trash,
  WavesHorizontal,
  ZoomIn,
} from "lucide-react";
import {
  SERVER_TEMPLATES,
  SHADER_VARIANTS,
  WALLPAPERS,
  WALLPAPER_CATEGORIES,
  parseShaderWallpaper,
  shaderWallpaperValue,
  type WallpaperItem,
} from "@/lib/panel/catalog";
import { LANGUAGES, type LanguageId } from "@/lib/panel/i18n";
import { DEFAULT_THEME, WALLPAPER_FITS, type NodeDto, type SettingsTab, type ThemeMode, type ThemeSettings, type WallpaperFit } from "@/lib/panel/types";
import { api, cn, compressImageFile, fileToDataUrl, isGifFile, isSvgFile, isVideoFile, isVideoUrl, WALLPAPER_ACCEPT } from "@/lib/utils";
import { usePanel } from "../context";
import { NodesPanel } from "./nodes-panel";
import { ShaderCanvas } from "../wallpaper-layer";
import { ColorField, Field, Slider, Spinner, ToggleRow } from "../ui";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "wallpapers", label: "Wallpapers" },
  { id: "bars", label: "Bars" },
  { id: "mail", label: "Mail" },
  { id: "advanced", label: "Advanced" },
  { id: "nodes", label: "Nodes" },
  { id: "access", label: "Access" },
];

/** Tab label in the panel's language, falling back to the English label. */
function useTabLabels() {
  const { t } = usePanel();
  return TABS.map((tab) => ({ ...tab, label: t(`tab.${tab.id}`) }));
}

const ACCENT_PRESETS = ["#3b82f6", "#06b6d4", "#22c55e", "#8b5cf6", "#ec4899", "#f5a623", "#ff4d00", "#d00000"];

export function SettingsView() {
  const { settingsTab, setSettingsTab } = usePanel();
  const tabs = useTabLabels();
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-[22px] font-extrabold tracking-tight">Settings Management</h2>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Configure your panel, appearance, integrations, and runtime defaults.
        </p>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn("pill-tab min-h-11 px-4", settingsTab === tab.id && "active")}
            onClick={() => setSettingsTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div key={settingsTab} className="view-enter">
        {settingsTab === "general" ? <GeneralPanel /> : null}
        {settingsTab === "appearance" ? <AppearancePanel /> : null}
        {settingsTab === "wallpapers" ? <WallpapersPanel /> : null}
        {settingsTab === "bars" ? <BarsPanel /> : null}
        {settingsTab === "mail" ? <MailPanel /> : null}
        {settingsTab === "advanced" ? <AdvancedPanel /> : null}
        {settingsTab === "nodes" ? <NodesPanel /> : null}
        {settingsTab === "access" ? <AccessPanel /> : null}
      </div>
    </div>
  );
}

// ── General ─────────────────────────────────────────────────────────────────
function GeneralPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    panelName: settings.panelName,
    defaultLanguage: settings.defaultLanguage,
    panelSubtitle: settings.panelSubtitle,
    faviconTitle: settings.faviconTitle,
    welcomeTitle: settings.welcomeTitle,
    welcomeMessage: settings.welcomeMessage,
    panelLogo: settings.panelLogo,
    faviconLogo: settings.faviconLogo,
  });
  const [saving, setSaving] = useState(false);

  async function onLogo(key: "panelLogo" | "faviconLogo", file?: File) {
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, key === "panelLogo" ? 256 : 128, 0.92, "image/png");
      setForm((f) => ({ ...f, [key]: dataUrl }));
      toast.success("Logo ready — press Save General to apply");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that image");
    }
  }

  return (
    <div className="glass p-5">
      <h3 className="text-[16px] font-extrabold">Branding &amp; Identity</h3>
      <p className="mt-1 text-[13px] font-semibold text-steel">
        Name the panel, set the browser tab title and upload your own logos.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Company name" hint="Used throughout the panel and in emails sent to users.">
          <input className="panel-input" value={form.panelName} maxLength={40} onChange={(e) => setForm({ ...form, panelName: e.target.value })} />
        </Field>
        <Field label="Default language" hint="Applied to the sidebar and panel chrome.">
          <select
            className="panel-input"
            value={form.defaultLanguage}
            onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value as LanguageId })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Panel subtitle">
          <input className="panel-input" value={form.panelSubtitle} maxLength={60} onChange={(e) => setForm({ ...form, panelSubtitle: e.target.value })} />
        </Field>
        <Field label="Browser tab title" hint="Falls back to the panel name when empty.">
          <input className="panel-input" value={form.faviconTitle} maxLength={60} onChange={(e) => setForm({ ...form, faviconTitle: e.target.value })} />
        </Field>
        <Field label="Welcome title">
          <input className="panel-input" value={form.welcomeTitle} maxLength={80} onChange={(e) => setForm({ ...form, welcomeTitle: e.target.value })} />
        </Field>
        <Field label="Welcome message" className="md:col-span-2">
          <textarea
            className="panel-input min-h-[88px] resize-y"
            value={form.welcomeMessage}
            maxLength={280}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
          />
        </Field>
        <LogoField
          label="Panel logo"
          hint="Sidebar & sign-in page · saved as a 256px PNG."
          value={form.panelLogo}
          fallback="/brand-mark.svg"
          onFile={(f) => void onLogo("panelLogo", f)}
          onClear={() => setForm({ ...form, panelLogo: "" })}
        />
        <LogoField
          label="Favicon"
          hint="Browser tab icon · saved as a 128px PNG."
          value={form.faviconLogo}
          fallback="/favicon.svg"
          onFile={(f) => void onLogo("faviconLogo", f)}
          onClear={() => setForm({ ...form, faviconLogo: "" })}
        />
      </div>
      <div className="mt-5">
        <button
          type="button"
          className="btn-accent"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await persistSettings(form, "Branding saved");
            setSaving(false);
          }}
        >
          {saving ? <Spinner /> : <Check className="size-4" />} Save General
        </button>
      </div>
    </div>
  );
}

function LogoField({
  label,
  hint,
  value,
  fallback,
  onFile,
  onClear,
}: {
  label: string;
  hint: string;
  value: string;
  fallback: string;
  onFile: (file?: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-bold text-steel">{label}</span>
      <div className="flex items-center gap-3 rounded-[12px] border border-line bg-fill p-3">
        <img src={value || fallback} alt="" className="size-12 rounded-[10px] object-contain" />
        <div className="flex flex-1 flex-wrap gap-2">
          <label className="btn-ghost min-h-9 cursor-pointer px-3 text-[12px]">
            <CloudUpload className="size-3.5" /> Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {value ? (
            <button type="button" className="btn-ghost min-h-9 px-3 text-[12px]" onClick={onClear}>
              Reset to default
            </button>
          ) : null}
        </div>
      </div>
      <span className="mt-1 block text-[11px] font-semibold text-faint">{hint}</span>
    </div>
  );
}

// ── Appearance ──────────────────────────────────────────────────────────────
const MODES: { id: ThemeMode; label: string; hint: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Dark", hint: "classic night palette", icon: Moon },
  { id: "light", label: "Light", hint: "bright day palette", icon: Sun },
];

function AppearancePanel() {
  const { draft, setDraft, persistTheme, clearModeOverride, setSettingsTab } = usePanel();
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function onGlassChange(patch: Partial<ThemeSettings>) {
    setDraft(patch);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persistTheme(patch, { quiet: true }), 700);
  }

  async function save() {
    setSaving(true);
    await persistTheme();
    setSaving(false);
  }

  return (
    <div className="glass p-5">
      <h3 className="text-[16px] font-extrabold">Panel Appearance &amp; Glassmorphism</h3>
      <p className="mt-1 text-[13px] font-semibold text-steel">
        Customize background, glassmorphism blur, transparency, and panel colors. Changes preview live.
      </p>

      <div className="mt-4">
        <div className="text-[13px] font-extrabold">Base Theme</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {MODES.map((option) => {
            const active = draft.mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={cn("select-tile flex items-center gap-2.5 px-3 py-2.5 text-left", active && "active")}
                onClick={() => {
                  setDraft({ mode: option.id });
                  clearModeOverride();
                }}
              >
                <option.icon className={cn("size-[18px] shrink-0", active ? "text-accent" : "text-steel")} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold">{option.label}</span>
                  <span className="block truncate text-[10.5px] font-semibold text-steel">{option.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* suppressHydrationWarning: browser extensions and the embedded preview
            iframe rewrite this node's inline style before React hydrates, which
            React cannot reconcile and does not patch. Harmless — the element is
            static text. */}
        <p className="mt-1.5 text-[11px] font-semibold text-steel" suppressHydrationWarning>
          Panel-wide palette for everyone. Any user can still flip themselves dark↔light with the header sun/moon button.
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,1.05fr)]">
        <div>
          <div className="text-[13px] font-extrabold">Background Media</div>
          <WallpaperPreview url={draft.wallpaperUrl} />
          <UploadBox compact onUploaded={(u) => setDraft({ wallpaperUrl: u })} />
          <div className="mt-4">
            <div className="text-[12px] font-bold text-steel">External Image / Video URL</div>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                className="panel-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://images.pexels.com/…"
              />
              <button
                type="button"
                className="btn-accent shrink-0"
                onClick={() => {
                  if (!/^https?:\/\//i.test(url.trim())) {
                    toast.error("Enter an http(s) URL");
                    return;
                  }
                  setDraft({ wallpaperUrl: url.trim() });
                  toast.success("Background URL applied — Save Theme to keep it");
                }}
              >
                <Link2 className="size-4" /> Apply URL
              </button>
            </div>
          </div>
          <button type="button" className="btn-ghost mt-3 w-full" onClick={() => setSettingsTab("wallpapers")}>
            <Sparkles className="size-4" /> Browse 4K wallpapers &amp; live shaders
          </button>
        </div>

        <div className="grid content-start gap-4">
          <Slider label="Background Blur" value={draft.bgBlur} max={100} suffix="px" onChange={(v) => onGlassChange({ bgBlur: v })} />
          <Slider label="Background Opacity" value={draft.bgOpacity} max={100} suffix="%" onChange={(v) => onGlassChange({ bgOpacity: v })} />
          <div>
            <ColorField label="Accent Color" value={draft.accentColor} onChange={(v) => onGlassChange({ accentColor: v })} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    draft.accentColor.toLowerCase() === c ? "border-white" : "border-transparent",
                  )}
                  style={{ background: c, boxShadow: `0 0 12px ${c}66` }}
                  onClick={() => onGlassChange({ accentColor: c })}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
          </div>
          <ColorField label="Glass Tint" value={draft.glassTint} hint="Base color for glassmorphism panels" onChange={(v) => onGlassChange({ glassTint: v })} />
          <Slider
            label="Glass Opacity"
            value={draft.glassOpacity}
            max={100}
            suffix="%"
            hint="0% = fully transparent, 100% = full tint"
            onChange={(v) => onGlassChange({ glassOpacity: v })}
          />
          <ColorField label="Nav Text" value={draft.navText} hint="Sidebar inactive item text" onChange={(v) => onGlassChange({ navText: v })} />
          <ColorField label="Nav Text Active" value={draft.navTextActive} hint="Sidebar active item text" onChange={(v) => onGlassChange({ navTextActive: v })} />
          <Slider label="Glass Blur" value={draft.glassBlur} max={40} suffix="px" onChange={(v) => onGlassChange({ glassBlur: v })} />
          <Slider label="Glass Saturate" value={draft.glassSaturate} min={100} max={250} suffix="%" onChange={(v) => onGlassChange({ glassSaturate: v })} />
          <Slider label="Border Radius" value={draft.borderRadius} max={24} suffix="px" onChange={(v) => onGlassChange({ borderRadius: v })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-accent" disabled={saving} onClick={() => void save()}>
              {saving ? <Spinner /> : <Check className="size-4" />} Save Theme
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setDraft(DEFAULT_THEME);
                clearModeOverride();
                toast("Defaults restored — press Save Theme to keep them");
              }}
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      </div>
  );
}

function wallpaperLabel(url: string): string {
  const shader = parseShaderWallpaper(url);
  if (shader) return `Live shader · ${SHADER_VARIANTS.find((v) => v.id === shader)?.name ?? shader}`;
  if (!url) return "Default gradient";
  const known = WALLPAPERS.find((w) => w.full === url);
  if (known) return known.title;
  if (url.startsWith("/api/media/")) return "Uploaded image";
  return isVideoUrl(url) ? "Custom video" : "Custom URL";
}

function WallpaperPreview({ url }: { url: string }) {
  const shader = parseShaderWallpaper(url);
  return (
    <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-line bg-fill p-2.5">
      <div className="wallpaper-tile w-28 shrink-0 cursor-default">
        {shader ? (
          <ShaderCanvas variant={shader} maxDpr={1} className="size-full" />
        ) : url && !isVideoUrl(url) ? (
          <img src={url} alt="" />
        ) : (
          <div className="size-full" style={{ background: "var(--default-wallpaper)" }} />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-extrabold tracking-[0.12em] text-steel uppercase">Current background</div>
        <div className="truncate text-[13px] font-extrabold">{wallpaperLabel(url)}</div>
      </div>
    </div>
  );
}

const UPLOAD_MAX_BYTES = { image: 4_500_000, video: 17_000_000 } as const;

function UploadBox({ onUploaded, compact }: { onUploaded: (url: string) => void; compact?: boolean }) {
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    const video = isVideoFile(file);
    const raw = isGifFile(file);
    if (!video && !file.type.startsWith("image/")) {
      toast.error("Choose an image (PNG, JPEG, WebP, AVIF, GIF) or a video (MP4, WebM, MOV)");
      return;
    }
    if (isSvgFile(file)) {
      toast.error("SVG is not supported as a wallpaper — export it as PNG instead.");
      return;
    }
    const max = video ? UPLOAD_MAX_BYTES.video : UPLOAD_MAX_BYTES.image;
    if (file.size > max) {
      toast.error(`${video ? "Video" : "Image"} is too large (max ${Math.round(max / 1_000_000)} MB).`);
      return;
    }
    setUploading(true);
    try {
      // GIF and video are sent untouched — a canvas round-trip would flatten
      // the animation and cannot decode video at all. Stills get compressed
      // to 2560px so a 12 MP phone photo does not become a multi-MB row.
      const dataUrl =
        video || raw
          ? await fileToDataUrl(file)
          : await compressImageFile(file, 2560, 0.86, "image/jpeg");
      const res = await api<{ url: string }>("/api/media", { body: { name: file.name, dataUrl } });
      onUploaded(res.url);
      toast.success("Uploaded — previewing now. Save or Apply to keep it.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <label
      className={cn(
        "mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-line-strong bg-sunken px-4 text-center transition-colors hover:border-accent/60",
        compact ? "min-h-[110px]" : "min-h-[180px]",
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files[0]);
      }}
    >
      {uploading ? <Spinner className="size-5 text-accent" /> : <CloudUpload className="size-6 text-accent" />}
      <span className="mt-2 text-[14px] font-extrabold">{uploading ? "Uploading…" : "Click or drag to upload"}</span>
      <span className="mt-1 text-[12px] font-semibold text-steel">
        GIF, PNG, JPEG, WebP or AVIF · MP4, WebM or MOV video · max 17 MB
      </span>
      <span className="mt-0.5 text-[11px] font-semibold text-faint">
        Animated GIFs and videos upload as-is; stills are compressed to 2560px.
      </span>
      <input type="file" accept={WALLPAPER_ACCEPT} className="hidden" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} />
    </label>
  );
}

// ── Wallpapers / Background Engine ─────────────────────────────────────────
type EngineMode = "catalog" | "shaders" | "url" | "upload";

const ENGINE_TABS: { id: EngineMode; label: string; icon: typeof Eye }[] = [
  { id: "catalog", label: "Wallpapers", icon: ImageIcon },
  { id: "shaders", label: "Live Shaders", icon: WavesHorizontal },
  { id: "url", label: "Custom URL", icon: Link2 },
  { id: "upload", label: "Upload Media", icon: CloudUpload },
];

function WallpapersPanel() {
  const { draft, setDraft, persistTheme, settings } = usePanel();
  const [mode, setMode] = useState<EngineMode>("catalog");
  const [category, setCategory] = useState<(typeof WALLPAPER_CATEGORIES)[number]["id"]>("all");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const saved = settings.wallpaperUrl;
  const previewing = draft.wallpaperUrl !== saved;
  const validUrl = /^https?:\/\/\S+$/i.test(url.trim());

  async function apply(value: string, label: string) {
    setBusy(value);
    setDraft({ wallpaperUrl: value });
    const ok = await persistTheme({ wallpaperUrl: value }, { quiet: true });
    if (ok) toast.success(`${label} applied for everyone`);
    setBusy(null);
  }

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
            <ImageIcon className="size-4 text-accent" /> Panel Background Engine
          </h3>
          <p className="mt-1 text-[13px] font-semibold text-steel">
            Curated wallpapers, live WebGL shaders, or your own GIF, image or video. Preview first, then apply for
            everyone.
          </p>
        </div>
        {previewing ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-warn/30 bg-warn/10 px-3 py-2 text-[12px] font-bold text-warn">
            <Eye className="size-4" /> Previewing {wallpaperLabel(draft.wallpaperUrl)}
            <button type="button" className="btn-ghost min-h-8 px-2.5 text-[11.5px]" onClick={() => setDraft({ wallpaperUrl: saved })}>
              Revert
            </button>
            <button
              type="button"
              className="btn-accent min-h-8 px-2.5 text-[11.5px]"
              onClick={() => void apply(draft.wallpaperUrl, wallpaperLabel(draft.wallpaperUrl))}
            >
              Apply
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {ENGINE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn("pill-tab inline-flex items-center gap-1.5", mode === tab.id && "active")}
            onClick={() => setMode(tab.id)}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "catalog" ? (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {WALLPAPER_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn("chip-tab px-3 py-1.5 text-[12px] font-bold", category === c.id && "active")}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {WALLPAPERS.filter((w) => category === "all" || w.category === category).map((w) => (
              <WallpaperCard
                key={w.id}
                item={w}
                active={draft.wallpaperUrl === w.full}
                busy={busy === w.full}
                onPreview={() => setDraft({ wallpaperUrl: w.full })}
                onApply={() => void apply(w.full, w.title)}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] font-semibold text-faint">Photos via Pexels (free to use). Hover a tile to preview or apply.</p>
        </>
      ) : null}

      {mode === "shaders" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SHADER_VARIANTS.map((v) => {
            const value = shaderWallpaperValue(v.id);
            const active = draft.wallpaperUrl === value;
            return (
              <div
                key={v.id}
                className={cn("overflow-hidden rounded-[14px] border border-line bg-fill", active && "outline-2 outline-offset-2 outline-accent")}
              >
                <div className="relative aspect-[16/10]">
                  <ShaderCanvas variant={v.id} maxDpr={1} className="absolute inset-0 size-full" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-extrabold">{v.name}</span>
                    {active ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[9.5px] font-extrabold tracking-wide text-white">ACTIVE</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-steel">{v.description}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-ghost min-h-9 flex-1 px-2 text-[12px]" onClick={() => setDraft({ wallpaperUrl: value })}>
                      <Eye className="size-3.5" /> Preview
                    </button>
                    <button
                      type="button"
                      className="btn-accent min-h-9 flex-1 px-2 text-[12px]"
                      disabled={busy === value}
                      onClick={() => void apply(value, v.name)}
                    >
                      {busy === value ? <Spinner /> : <Check className="size-3.5" />} Apply
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {mode === "url" ? (
        <div className="mt-4 max-w-2xl">
          <Field label="Image or video URL" hint="Direct links to .jpg, .png, .webp, .mp4 or .webm files work best.">
            <input className="panel-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/wallpaper.jpg" />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={!validUrl} onClick={() => setDraft({ wallpaperUrl: url.trim() })}>
              <Eye className="size-4" /> Preview
            </button>
            <button type="button" className="btn-accent" disabled={!validUrl || busy !== null} onClick={() => void apply(url.trim(), "Custom wallpaper")}>
              <Link2 className="size-4" /> Apply URL
            </button>
          </div>
        </div>
      ) : null}

      {mode === "upload" ? (
        <div className="max-w-2xl">
          <UploadBox onUploaded={(u) => setDraft({ wallpaperUrl: u })} />
        </div>
      ) : null}

      <ZoomFitPanel />
    </div>
  );
}

const FIT_LABELS: { id: WallpaperFit; label: string; hint: string }[] = [
  { id: "cover", label: "Fill", hint: "crop to screen" },
  { id: "contain", label: "Fit", hint: "whole image" },
  { id: "tile", label: "Tile", hint: "repeat pattern" },
  { id: "stretch", label: "Stretch", hint: "distort to fit" },
];

/** Screen zoom + fit for the current wallpaper. Applies to images, GIFs and
 *  video alike — the video layer uses the same two CSS variables. */
function ZoomFitPanel() {
  const { draft, setDraft, persistTheme, settings } = usePanel();
  const zoom = draft.wallpaperZoom ?? 100;
  const fit = draft.wallpaperFit ?? "cover";
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const setFit = (next: WallpaperFit) => {
    setDraft({ wallpaperFit: next });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persistTheme({ wallpaperFit: next }, { quiet: true }), 400);
  };

  const setZoom = (next: number) => {
    setDraft({ wallpaperZoom: next });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persistTheme({ wallpaperZoom: next }, { quiet: true }), 400);
  };

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-2 text-[14px] font-extrabold">
            <ZoomIn className="size-4 text-accent" /> Zoom &amp; Fit
          </h4>
          <p className="mt-0.5 text-[12px] font-semibold text-steel">
            Scales the background on screen. Works for photos, animated GIFs and video.
          </p>
        </div>
        {draft.wallpaperZoom !== settings.wallpaperZoom || draft.wallpaperFit !== settings.wallpaperFit ? (
          <button
            type="button"
            className="btn-ghost min-h-8 px-2.5 text-[11.5px]"
            onClick={() => setDraft({ wallpaperZoom: settings.wallpaperZoom, wallpaperFit: settings.wallpaperFit })}
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIT_LABELS.map((option) => {
          const active = fit === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={cn("select-tile px-3 py-2.5 text-left", active && "active")}
              onClick={() => setFit(option.id)}
            >
              <span className="block text-[13px] font-extrabold">{option.label}</span>
              <span className="block text-[10.5px] font-semibold text-steel">{option.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <Slider label="Zoom" value={zoom} min={100} max={300} suffix="%" onChange={setZoom} />
      </div>
      <div className="mt-2 flex gap-1.5">
        {[100, 125, 150, 200].map((value) => (
          <button
            key={value}
            type="button"
            className={cn("pill-tab min-h-8 px-2.5 text-[11.5px]", zoom === value && "active")}
            onClick={() => setZoom(value)}
          >
            {value}%
          </button>
        ))}
      </div>
    </div>
  );
}

function WallpaperCard({
  item,
  active,
  busy,
  onPreview,
  onApply,
}: {
  item: WallpaperItem;
  active: boolean;
  busy: boolean;
  onPreview: () => void;
  onApply: () => void;
}) {
  return (
    <div className="group">
      <div className={cn("wallpaper-tile", active && "active")}>
        <img src={item.thumb} alt={item.title} loading="lazy" />
        <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/75 via-black/10 to-transparent p-2.5 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <div className="flex w-full gap-1.5">
            <button
              type="button"
              className="flex-1 rounded-[8px] bg-white/15 px-2 py-1.5 text-[11.5px] font-bold text-white backdrop-blur hover:bg-white/25"
              onClick={onPreview}
            >
              Preview
            </button>
            <button
              type="button"
              className="flex-1 rounded-[8px] bg-accent px-2 py-1.5 text-[11.5px] font-bold text-white hover:brightness-110"
              onClick={onApply}
              disabled={busy}
            >
              {busy ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
        {active ? (
          <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-accent text-white shadow-[0_0_12px_var(--accent-glow)]">
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-[12.5px] font-extrabold">{item.title}</span>
        <span className="truncate text-[10.5px] font-semibold text-faint">© {item.credit}</span>
      </div>
    </div>
  );
}

// ── Bars ────────────────────────────────────────────────────────────────────
function BarsPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    showAdminStats: settings.showAdminStats,
    showVersion: settings.showVersion,
    showRole: settings.showRole,
    showHeaderUser: settings.showHeaderUser,
  });
  const [saving, setSaving] = useState(false);
  return (
    <div className="glass p-5">
      <h3 className="text-[16px] font-extrabold">Home indicators</h3>
      <p className="mt-1 text-[13px] font-semibold text-steel">Choose which bars and cards appear on Home and in the header.</p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        <ToggleRow label="Admin statistics" hint="Total users & quick links on Home (admins only)" checked={form.showAdminStats} onChange={(v) => setForm({ ...form, showAdminStats: v })} />
        <ToggleRow label="Panel version card" hint="Running version and access level" checked={form.showVersion} onChange={(v) => setForm({ ...form, showVersion: v })} />
        <ToggleRow label="Signed-in role phrase" hint="“You are signed in as a …” on Home" checked={form.showRole} onChange={(v) => setForm({ ...form, showRole: v })} />
        <ToggleRow label="Top-header account control" hint="Avatar menu in the top-right header" checked={form.showHeaderUser} onChange={(v) => setForm({ ...form, showHeaderUser: v })} />
      </div>
      <button
        type="button"
        className="btn-accent mt-5"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await persistSettings(form, "Bars saved");
          setSaving(false);
        }}
      >
        {saving ? <Spinner /> : <Check className="size-4" />} Save Bars
      </button>
    </div>
  );
}

// ── Access ──────────────────────────────────────────────────────────────────
function AccessPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    allowRegistration: settings.allowRegistration,
    passwordResetEnabled: settings.passwordResetEnabled,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom,
    googleOauthEnabled: settings.googleOauthEnabled,
    googleClientId: settings.googleClientId,
    googleClientSecret: settings.googleClientSecret,
    googleAllowedEmail: settings.googleAllowedEmail,
  });
  const [saving, setSaving] = useState(false);
  const googleReady =
    form.googleOauthEnabled && form.googleClientId.trim() && (form.googleClientSecret.trim() || settings.googleClientSecretConfigured);
  return (
    <div className="grid gap-4">
      <div className="glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <ShieldCheck className="size-4 text-accent" /> Access &amp; Feature Toggles
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-steel">Control registration, password recovery, and sign-in options.</p>
        <div className="mt-4 grid gap-2">
          <ToggleRow
            label="Public registration"
            hint="Visitors can create member accounts from the sign-up page"
            checked={form.allowRegistration}
            onChange={(v) => setForm({ ...form, allowRegistration: v })}
          />
          <ToggleRow
            label="Forgot password"
            hint="Show a Forgot-password link on the sign-in page and let users email themselves a reset link"
            checked={form.passwordResetEnabled}
            onChange={(v) => setForm({ ...form, passwordResetEnabled: v })}
          />
        </div>
      </div>
      <div className="glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <Globe className="size-4 text-accent" /> Continue with Google
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Let visitors sign in with their Google account. Create OAuth credentials at
          {" "}
          <a className="text-accent underline" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
            console.cloud.google.com/apis/credentials
          </a>{" "}
          and add <code className="rounded bg-fill px-1 font-mono text-[11px]">{`<your-panel-url>/api/auth/google/callback`}</code> as an authorized redirect URI.
        </p>
        <div className="mt-3">
          <ToggleRow
            label="Enable Google sign-in"
            hint="Show a “Continue with Google” button on the sign-in page"
            checked={form.googleOauthEnabled}
            onChange={(v) => setForm({ ...form, googleOauthEnabled: v })}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Google Client ID" hint="Ends with .apps.googleusercontent.com">
            <input
              className="panel-input font-mono"
              value={form.googleClientId}
              placeholder="xxxxx.apps.googleusercontent.com"
              onChange={(e) => setForm({ ...form, googleClientId: e.target.value })}
            />
          </Field>
          <Field label="Google Client Secret">
            <input
              className="panel-input font-mono"
              type="password"
              value={form.googleClientSecret}
              placeholder={settings.googleClientSecretConfigured ? "Saved — enter a new secret to replace" : "GOCSPX-…"}
              onChange={(e) => setForm({ ...form, googleClientSecret: e.target.value })}
            />
          </Field>
          <Field
            label="Restrict to one email (optional)"
            hint="When set, only this Google account may sign in"
            className="sm:col-span-2"
          >
            <input
              className="panel-input"
              type="email"
              value={form.googleAllowedEmail}
              placeholder="owner@gmail.com"
              onChange={(e) => setForm({ ...form, googleAllowedEmail: e.target.value })}
            />
          </Field>
        </div>
        {form.googleOauthEnabled ? (
          <p
            className={cn(
              "mt-3 rounded-[10px] border px-3 py-2 text-[12px] font-semibold",
              googleReady
                ? "border-ok/35 bg-ok/10 text-ok"
                : "border-warn/35 bg-warn/10 text-warn",
            )}
          >
            {googleReady
              ? "Google sign-in is configured. Visitors will see a “Continue with Google” button."
              : "Add both a Client ID and Client Secret to enable the button."}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        className="btn-accent justify-self-start"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          const { smtpPass, googleClientSecret, ...fields } = form;
          await persistSettings({
            ...fields,
            ...(smtpPass.trim() ? { smtpPass } : {}),
            ...(googleClientSecret.trim() ? { googleClientSecret } : {}),
          }, "Access settings saved");
          setSaving(false);
        }}
      >
        {saving ? <Spinner /> : <Check className="size-4" />} Save Access
      </button>
    </div>
  );
}

function MailPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpSecure: settings.smtpSecure,
    smtpUser: settings.smtpUser,
    smtpPass: settings.smtpPass,
    smtpFrom: settings.smtpFrom,
  });
  const [saving, setSaving] = useState(false);
  const configured = Boolean(form.smtpHost.trim() && form.smtpFrom.trim());

  return (
    <>
        <div className="glass p-5">
          <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
            <Mail className="size-4 text-accent" /> Password reset email (SMTP)
          </h3>
          <p className="mt-1 text-[13px] font-semibold text-steel">
            Where to send the reset link. With Gmail, use an <strong className="text-ice">App Password</strong> (not your normal
            password) and set <code className="rounded bg-fill px-1 font-mono text-[11px]">SMTP_SECURE=true</code> for port 465.
            Leave the host blank to fall back to the console transport (logs the link to the server).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="SMTP host" hint="e.g. smtp.gmail.com">
              <input
                className="panel-input"
                value={form.smtpHost}
                placeholder="smtp.gmail.com"
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Field label="SMTP port" hint="587 for STARTTLS, 465 for SMTPS">
                <input
                  className="panel-input font-mono"
                  type="number"
                  min={1}
                  max={65535}
                  value={form.smtpPort}
                  onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) || 587 })}
                />
              </Field>
              <Field label="TLS">
                <button
                  type="button"
                  className={cn("pill-tab h-[44px] px-4", form.smtpSecure && "active")}
                  onClick={() => setForm({ ...form, smtpSecure: !form.smtpSecure })}
                >
                  {form.smtpSecure ? "SSL/TLS" : "STARTTLS"}
                </button>
              </Field>
            </div>
            <Field label="Username" hint="Usually your full email address for Gmail">
              <input
                className="panel-input"
                value={form.smtpUser}
                placeholder="you@gmail.com"
                onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
              />
            </Field>
            <Field label="Password / App Password" hint={settings.smtpPassConfigured ? "A password is saved. Leave blank to keep it, or enter a new one." : "For Gmail: create one at myaccount.google.com → App passwords"}>
              <input
                className="panel-input font-mono"
                type="password"
                value={form.smtpPass}
                placeholder={settings.smtpPassConfigured ? "Saved — enter a new password to replace" : "App password"}
                onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
              />
            </Field>
            <Field label="From address" hint="Shown in the recipient's inbox" className="sm:col-span-2">
              <input
                className="panel-input"
                value={form.smtpFrom}
                placeholder='BT Panel <no-reply@btpanel.local>'
                onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })}
              />
            </Field>
          </div>
        </div>
      <div className="mt-4 glass p-5">
        <p className={cn(
          "rounded-[10px] border px-3 py-2 text-[12px] font-semibold",
          configured
            ? "border-ok/35 bg-ok/10 text-ok"
            : "border-warn/35 bg-warn/10 text-warn",
        )}>
          {configured
            ? `Password reset emails will be sent from ${form.smtpFrom.trim()}.`
            : "No mail server configured — password reset falls back to the console transport and prints the link in the server log."}
        </p>
        <button
          type="button"
          className="btn-accent mt-4"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const { smtpPass, ...fields } = form;
            await persistSettings({ ...fields, ...(smtpPass.trim() ? { smtpPass } : {}) }, "Mail settings saved");
            setSaving(false);
          }}
        >
          {saving ? <Spinner /> : <Check className="size-4" />} Save Mail
        </button>
      </div>
    </>
  );
}

function AdvancedPanel() {
  const { settings, persistSettings } = usePanel();
  const [form, setForm] = useState({
    requireTwoFactor: settings.requireTwoFactor,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    maxServersPerUser: settings.maxServersPerUser,
    defaultTemplate: settings.defaultTemplate,
    backupRetention: settings.backupRetention,
    debugLogging: settings.debugLogging,
  });
  const [saving, setSaving] = useState(false);

  return (
    <>
      <div className="glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <Wrench className="size-4 text-accent" /> Maintenance
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Put the panel into maintenance while you do work that would confuse users.
        </p>
        <div className="mt-3">
          <ToggleRow
            label="Enable maintenance mode"
            hint="Signed-in users see the notice instead of the dashboard"
            checked={form.maintenanceMode}
            onChange={(v) => setForm({ ...form, maintenanceMode: v })}
          />
        </div>
        {form.maintenanceMode ? (
          <div className="mt-4">
            <Field label="Maintenance notice" hint="Shown to signed-in users.">
              <input
                className="panel-input"
                value={form.maintenanceMessage}
                maxLength={280}
                placeholder="Upgrading nodes — back in 10 minutes."
                onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <div className="mt-4 glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <Server className="size-4 text-accent" /> Allocation defaults
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Caps and pre-selections applied when someone creates a server.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Max servers per user" hint="1–100.">
            <input
              className="panel-input"
              type="number"
              min={1}
              max={100}
              value={form.maxServersPerUser}
              onChange={(e) => setForm({ ...form, maxServersPerUser: Number(e.target.value) })}
            />
          </Field>
          <Field label="Default service" hint="Pre-selected in the create form.">
            <select
              className="panel-input"
              value={form.defaultTemplate}
              onChange={(e) => setForm({ ...form, defaultTemplate: e.target.value })}
            >
              {SERVER_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Backups kept per server" hint="1–100.">
            <input
              className="panel-input"
              type="number"
              min={1}
              max={100}
              value={form.backupRetention}
              onChange={(e) => setForm({ ...form, backupRetention: Number(e.target.value) })}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <ShieldCheck className="size-4 text-accent" /> Two-factor authentication
        </h3>
        <p className="mt-1 text-[13px] font-semibold text-steel">
          Require every admin to have TOTP enrolled before they can sign in.
        </p>
        <div className="mt-3">
          <ToggleRow
            label="Require 2FA for admins"
            hint="Owners and admins are refused at login until they enrol in My Account → Security."
            checked={form.requireTwoFactor}
            onChange={(v) => setForm({ ...form, requireTwoFactor: v })}
          />
        </div>
        {form.requireTwoFactor ? (
          <p className="mt-3 rounded-[10px] border border-warn/35 bg-warn/10 px-3 py-2 text-[12px] font-semibold text-warn">
            Enrol your own account before saving. Once this is on, an admin without 2FA cannot sign in.
          </p>
        ) : null}
      </div>

      <div className="mt-4 glass p-5">
        <h3 className="flex items-center gap-2 text-[16px] font-extrabold">
          <Terminal className="size-4 text-accent" /> Diagnostics
        </h3>
        <div className="mt-3">
          <ToggleRow
            label="Verbose debug logging"
            hint="Log request detail and command output. Leave off in production."
            checked={form.debugLogging}
            onChange={(v) => setForm({ ...form, debugLogging: v })}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="btn-accent"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await persistSettings(form, "Advanced settings saved");
            setSaving(false);
          }}
        >
          {saving ? <Spinner /> : <Check className="size-4" />} Save Advanced
        </button>
      </div>
    </>
  );
}
