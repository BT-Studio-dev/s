import type { ServerDto } from "./types";
import { clamp, hashString } from "@/lib/utils";

/**
 * Simulated live telemetry (no real daemon is attached in this demo).
 * Deterministic per server id + wall clock so every view agrees.
 */
export type Telemetry = { cpu: number; memMb: number; diskMb: number; netIn: number; netOut: number };

export function sampleTelemetry(server: ServerDto, now: number): Telemetry {
  const seed = hashString(server.id);
  const s = (seed % 1000) / 1000;
  const t = now / 1000;
  const wave = (freq: number, phase: number) => Math.sin(t * freq + s * 12.9898 + phase);
  const diskMb = server.diskMb * (0.14 + ((seed >>> 3) % 30) / 100);
  if (server.status === "offline") return { cpu: 0, memMb: 0, diskMb, netIn: 0, netOut: 0 };
  if (server.status === "starting") {
    return {
      cpu: server.cpuLimit * (0.6 + 0.25 * Math.abs(wave(2.3, 0))),
      memMb: server.memoryMb * (0.22 + 0.12 * Math.abs(wave(0.7, 1))),
      diskMb,
      netIn: 40 + 30 * Math.abs(wave(1.1, 2)),
      netOut: 8,
    };
  }
  if (server.status === "stopping") {
    return { cpu: server.cpuLimit * (0.18 + 0.1 * Math.abs(wave(2.9, 3))), memMb: server.memoryMb * 0.35, diskMb, netIn: 4, netOut: 2 };
  }
  const base = 0.14 + ((seed >>> 5) % 24) / 100;
  // Multiplicative jitter around a per-server baseline: a running server never reads 0%.
  const load = base * (1 + 0.32 * wave(0.19, 0) + 0.18 * wave(0.71, 2) + 0.1 * wave(2.3, 4));
  const cpu = clamp(server.cpuLimit * load, 0.5, server.cpuLimit);
  const memMb = clamp(server.memoryMb * (0.38 + ((seed >>> 7) % 30) / 100 + 0.025 * wave(0.05, 1)), 48, server.memoryMb);
  const scale = 1 + ((seed >>> 9) % 5);
  const netIn = Math.max(0.2, (140 + 90 * wave(0.37, 3) + 45 * wave(1.27, 5)) * scale);
  const netOut = Math.max(0.1, (60 + 40 * wave(0.29, 6) + 25 * wave(1.61, 1)) * scale);
  return { cpu, memMb, diskMb, netIn, netOut };
}

export function formatRate(kbps: number): string {
  return kbps >= 1024 ? `${(kbps / 1024).toFixed(1)} MB/s` : `${kbps.toFixed(0)} KB/s`;
}
