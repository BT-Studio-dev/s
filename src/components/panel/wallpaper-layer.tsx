"use client";

import { useEffect, useRef, useState } from "react";
import { parseShaderWallpaper, type ShaderVariant } from "@/lib/panel/catalog";
import type { ThemeSettings } from "@/lib/panel/types";
import { isVideoUrl } from "@/lib/utils";

/**
 * Panel Background Engine — real WebGL fragment shaders tinted live from
 * --accent, light-mode aware, capped DPR, single static frame when the user
 * prefers reduced motion. Falls back to the CSS wallpaper when WebGL fails.
 */

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const COMMON = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_accent;
uniform float u_light;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i = 0; i < 5; i++){ v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.55; }
  return v;
}
vec3 finish(vec3 tint, float glow){
  vec3 dark = vec3(0.006, 0.008, 0.016) + tint * glow;
  vec3 light = mix(vec3(0.91, 0.93, 0.965), tint, clamp(glow * 0.9, 0.0, 1.0));
  return mix(dark, light, u_light);
}
`;

const FRAG: Record<ShaderVariant, string> = {
  waves:
    COMMON +
    `void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.055;
  float f = fbm(vec2(uv.x * 1.3 + t * 0.7, uv.y * 2.0 - t * 0.5) + fbm(uv * 2.1 + t * 0.4) * 0.9);
  float glow = smoothstep(0.30, 0.95, f) * 0.5;
  gl_FragColor = vec4(finish(u_accent, glow), 1.0);
}`,
  aurora:
    COMMON +
    `void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.05;
  float w = fbm(vec2(uv.x * 1.6 + t * 0.8, t * 0.35));
  float band = abs(uv.y * 1.5 + (w - 0.5) * 1.6 + 0.3 * sin(uv.x * 2.0 + t));
  float glow = smoothstep(0.9, 0.15, band) * 0.45 * (0.55 + 0.45 * fbm(uv * 1.8 + t));
  gl_FragColor = vec4(finish(u_accent, glow), 1.0);
}`,
  mesh:
    COMMON +
    `void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.05;
  float d1 = length(uv - vec2(0.9 * sin(t * 1.1), 0.5 * cos(t * 0.8)));
  float d2 = length(uv - vec2(-0.8 * cos(t * 0.9), -0.5 * sin(t * 1.2)));
  float d3 = length(uv - vec2(0.6 * sin(t * 0.6 + 1.7), 0.45 * cos(t * 0.9 + 2.9)));
  float glow = clamp(0.13 / max(d1, 0.12) + 0.11 / max(d2, 0.12) + 0.10 / max(d3, 0.12), 0.0, 1.0) * 0.5;
  gl_FragColor = vec4(finish(u_accent, glow), 1.0);
}`,
  nebula:
    COMMON +
    `void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);
  float t = u_time * 0.03;
  vec2 q = vec2(fbm(uv * 1.4 + t), fbm(uv * 1.4 - t + 3.1));
  float f = fbm(uv * 1.8 + q * 1.6 + vec2(t * 0.6, -t * 0.4));
  float glow = smoothstep(0.38, 1.0, f) * 0.62;
  vec3 tint = mix(u_accent, vec3(0.32, 0.36, 0.95), clamp(q.x - 0.3, 0.0, 1.0) * 0.6);
  vec2 cell = floor(gl_FragCoord.xy / 2.0);
  float star = step(0.9975, hash(cell)) * (0.55 + 0.45 * sin(u_time * 1.7 + hash(cell + 7.0) * 6.2831));
  vec3 col = finish(tint, glow) + vec3(star) * 0.7 * (1.0 - u_light);
  gl_FragColor = vec4(col, 1.0);
}`,
};

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function readAccent(): [number, number, number] {
  const fallback: [number, number, number] = [208 / 255, 0, 0];
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const match = raw.match(/^#?([0-9a-f]{6})$/i) || raw.match(/^#?([0-9a-f]{3})$/i);
  if (!match) return fallback;
  let hex = match[1];
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const n = parseInt(hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readLight(): number {
  return document.documentElement.dataset.themeMode === "light" ? 1 : 0;
}

export function ShaderCanvas({
  variant,
  className,
  maxDpr = 1.5,
}: {
  variant: ShaderVariant;
  className?: string;
  maxDpr?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) {
      setFailed(true);
      return;
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG[variant]);
    const program = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uAccent = gl.getUniformLocation(program, "u_accent");
    const uLight = gl.getUniformLocation(program, "u_light");

    let accent = readAccent();
    let light = readLight();
    const observer = new MutationObserver(() => {
      accent = readAccent();
      light = readLight();
      if (staticFrame) drawFrame(3.0);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-theme-mode"] });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(2, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(2, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawFrame = (seconds: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);
      gl.uniform1f(uLight, light);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const staticFrame = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const start = performance.now() - 20_000; // skip the "empty" first seconds
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      drawFrame((now - start) / 1000);
    };
    if (staticFrame) drawFrame(3.0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      ro.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [variant, maxDpr]);

  if (failed) return null;
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

export function WallpaperLayer({ theme }: { theme: ThemeSettings }) {
  const url = theme.wallpaperUrl;
  const shader = parseShaderWallpaper(url);
  const video = !shader && Boolean(url) && isVideoUrl(url);
  return (
    <div className="bg-layer" aria-hidden="true">
      {!video ? <div className="bg-layer-image" /> : null}
      {video ? <video className="bg-layer-video" src={url} autoPlay loop muted playsInline /> : null}
      {shader ? <ShaderCanvas key={shader} variant={shader} className="bg-layer-video" /> : null}
      <div className="bg-vignette" />
    </div>
  );
}
