// vital-trends.ts — Clinical trend logic.
// The patient's underlying trend influences target values over time.
// A stable patient drifts slightly; a degrading patient drifts toward worse values.

import type { ClinicalTrend, ClinicalProfile, InternalPhysiologyState } from './physiology-types';

export interface TrendDrift {
  spo2: number;
  heartRate: number;
  respiratoryRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  glucose: number;
  temperature: number;
}

// Per-tick drift rates for each trend state.
// Positive = increases, negative = decreases.
const DRIFT_TABLE: Record<ClinicalTrend, TrendDrift> = {
  stable: {
    spo2: 0,
    heartRate: 0,
    respiratoryRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    glucose: 0,
    temperature: 0,
  },
  improving: {
    spo2: 0.08,
    heartRate: -0.3,
    respiratoryRate: -0.05,
    bloodPressureSystolic: 0.1,
    bloodPressureDiastolic: 0.05,
    glucose: 0,
    temperature: 0,
  },
  degrading_slow: {
    spo2: -0.04,
    heartRate: 0.2,
    respiratoryRate: 0.03,
    bloodPressureSystolic: -0.1,
    bloodPressureDiastolic: -0.05,
    glucose: 0,
    temperature: 0,
  },
  degrading_fast: {
    spo2: -0.15,
    heartRate: 0.8,
    respiratoryRate: 0.15,
    bloodPressureSystolic: -0.4,
    bloodPressureDiastolic: -0.2,
    glucose: 0,
    temperature: 0.01,
  },
  critical: {
    spo2: -0.25,
    heartRate: 1.5,
    respiratoryRate: 0.3,
    bloodPressureSystolic: -0.6,
    bloodPressureDiastolic: -0.3,
    glucose: 0,
    temperature: 0.02,
  },
};

export function getDriftForTrend(trend: ClinicalTrend): TrendDrift {
  return DRIFT_TABLE[trend];
}

export function applyTrendDrift(
  state: InternalPhysiologyState,
  profile: ClinicalProfile,
): void {
  const drift = getDriftForTrend(state.trend);

  state.targets.spo2 = clamp(state.targets.spo2 + drift.spo2, 40, 100);
  state.targets.heartRate = clamp(state.targets.heartRate + drift.heartRate, 20, 250);
  state.targets.respiratoryRate = clamp(state.targets.respiratoryRate + drift.respiratoryRate, 4, 60);
  state.targets.bloodPressureSystolic = clamp(
    state.targets.bloodPressureSystolic + drift.bloodPressureSystolic,
    40,
    300,
  );
  state.targets.bloodPressureDiastolic = clamp(
    state.targets.bloodPressureDiastolic + drift.bloodPressureDiastolic,
    20,
    200,
  );
  state.targets.glucose = clamp(state.targets.glucose + drift.glucose, 0.2, 30);
  state.targets.temperature = clamp(state.targets.temperature + drift.temperature, 30, 45);
}

// Oxygen effect: if O2 is applied and indicated, SpO2 improves gradually.
export function applyOxygenEffect(state: InternalPhysiologyState, profile: ClinicalProfile): void {
  if (!state.oxygenApplied || !profile.oxygenIndicated) return;

  state.oxygenEffectTicks++;
  // Gradual improvement: +0.12 per tick, capped at baseline+2
  const cap = profile.baselineSpO2 + 2;
  if (state.targets.spo2 < cap) {
    state.targets.spo2 = Math.min(cap, state.targets.spo2 + 0.12);
  }
  // Slight HR decrease as distress eases
  if (state.targets.heartRate > profile.baselineHeartRate - 5) {
    state.targets.heartRate = Math.max(profile.baselineHeartRate - 5, state.targets.heartRate - 0.15);
  }
  // Slight RR decrease
  if (state.targets.respiratoryRate > profile.baselineRespiratoryRate - 2) {
    state.targets.respiratoryRate = Math.max(
      profile.baselineRespiratoryRate - 2,
      state.targets.respiratoryRate - 0.05,
    );
  }
}

// Reassurance effect: slight HR and RR decrease if patient is stressed
export function applyReassuranceEffect(state: InternalPhysiologyState): void {
  if (!state.reassured) return;
  // One-time gentle effect, not cumulative
  if (state.targets.heartRate > 80) {
    state.targets.heartRate = Math.max(80, state.targets.heartRate - 2);
  }
}

// Axis maintenance: prevents neurological deterioration
export function applyAxisEffect(state: InternalPhysiologyState, profile: ClinicalProfile): void {
  if (!state.axisMaintained) return;
  // If axis is maintained, prevent any neurological drift from making things worse
  // (no magic improvement, but locks the trend from degrading_fast -> degrading_slow for neuro cases)
  if (state.trend === 'degrading_fast') {
    state.trend = 'degrading_slow';
    state.events.push({
      tick: state.tick,
      type: 'action_effect',
      message: 'Maintien de l\'axe tête-cou-tronc : la dégradation neurologique est ralentie.',
    });
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
