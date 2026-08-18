// vital-noise.ts — Per-vital noise parameters.
// Defines the amplitude and shape of natural variation for each monitored vital.

import type { LiveVitalId, SnapshotVitalId } from './physiology-types';

export interface NoiseConfig {
  amplitude: number; // half-range of natural variation
  clampMin: number;
  clampMax: number;
  round: boolean;
}

export const LIVE_NOISE: Record<LiveVitalId, NoiseConfig> = {
  spo2: { amplitude: 1.0, clampMin: 50, clampMax: 100, round: true },
  heartRate: { amplitude: 3.0, clampMin: 20, clampMax: 250, round: true },
  respiratoryRate: { amplitude: 1.5, clampMin: 4, clampMax: 60, round: true },
};

export const SNAPSHOT_NOISE: Record<SnapshotVitalId, NoiseConfig> = {
  bloodPressureSystolic: { amplitude: 4, clampMin: 40, clampMax: 300, round: true },
  bloodPressureDiastolic: { amplitude: 3, clampMin: 20, clampMax: 200, round: true },
  glucose: { amplitude: 0.1, clampMin: 0.2, clampMax: 30, round: false },
  temperature: { amplitude: 0.1, clampMin: 30, clampMax: 45, round: false },
};

export function applyNoise(
  target: number,
  config: NoiseConfig,
  prng: { noise: (amp: number) => number },
): number {
  const raw = target + prng.noise(config.amplitude);
  const clamped = Math.max(config.clampMin, Math.min(config.clampMax, raw));
  return config.round ? Math.round(clamped) : Math.round(clamped * 10) / 10;
}
