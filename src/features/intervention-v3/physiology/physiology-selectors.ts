// physiology-selectors.ts — The ONLY interface between the physiology engine and the UI.
// These functions return only what the player is allowed to see based on their actions.
// Raw vitals, hidden facts, and internal targets are NEVER exposed.

import type {
  InternalPhysiologyState,
  LiveVitalId,
  SignalQuality,
  SnapshotVitalId,
  ConsciousnessLevel,
  SkinAspect,
} from './physiology-types';
import { PRNG } from './prng';
import { LIVE_NOISE, applyNoise } from './vital-noise';
import { isEquipmentActive, isEquipmentApplying } from './equipment-monitoring';

// ── Types returned to the UI ──

export interface VisibleVital {
  vitalId: string;
  label: string;
  value: number | null;
  unit: string;
  isMeasured: boolean;
  isLive: boolean;
  isStale: boolean;
  signalQuality: SignalQuality | null;
  trendDirection: 'up' | 'down' | 'flat' | null;
}

export interface VisibleMonitoringState {
  spo2Probe: 'not_applied' | 'applying' | 'active' | 'removed';
  bpCuff: 'not_applied' | 'applying' | 'active' | 'removed';
  glucometer: 'not_applied' | 'applying' | 'active' | 'removed';
  thermometer: 'not_applied' | 'applying' | 'active' | 'removed';
}

export interface VisibleWaveformState {
  available: boolean;
  type: 'pleth' | 'ecg' | null;
  heartRate: number | null; // for waveform animation speed
  signalQuality: SignalQuality;
}

export interface VisibleStaleVitals {
  [vitalId: string]: {
    isStale: boolean;
    lastMeasuredTick: number | null;
    ticksSinceMeasurement: number | null;
  };
}

export interface VisibleConsciousness {
  level: ConsciousnessLevel | null;
  isApproximate: boolean;
  isAssessed: boolean;
}

export interface VisibleSkin {
  aspect: SkinAspect | null;
  isApproximate: boolean;
  isObserved: boolean;
}

export interface VisibleGlasgow {
  score: number | null;
  isAssessed: boolean;
}

export interface VisiblePain {
  level: number | null;
  isAssessed: boolean;
}

export interface SessionView {
  visibleVitals: VisibleVital[];
  monitoringState: VisibleMonitoringState;
  waveformState: VisibleWaveformState;
  staleVitals: VisibleStaleVitals;
  consciousness: VisibleConsciousness;
  skin: VisibleSkin;
  glasgow: VisibleGlasgow;
  pain: VisiblePain;
  tick: number;
}

// ── Stale threshold ──
const STALE_THRESHOLD = 20; // ticks before a measurement is considered stale

// ── Selectors ──

export function getVisibleLiveVitals(state: InternalPhysiologyState): VisibleVital[] {
  const prng = new PRNG(state.seed ^ (state.tick * 0x85ebca6b));
  const spo2Active = isEquipmentActive(state, 'spo2_probe');
  const spo2Applying = isEquipmentApplying(state, 'spo2_probe');

  const vitals: VisibleVital[] = [];

  // SpO2 — live only if probe is active
  const spo2Snapshot = state.lastSnapshots.spo2;
  const spo2Measured = spo2Snapshot !== undefined;
  const spo2Live = spo2Active;
  const spo2Stale = spo2Measured && !spo2Live && state.tick - spo2Snapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'spo2',
    label: 'SpO₂',
    value: spo2Live
      ? applyNoise(state.targets.spo2, LIVE_NOISE.spo2, prng)
      : spo2Measured
      ? Math.round(spo2Snapshot!.value)
      : null,
    unit: '%',
    isMeasured: spo2Measured,
    isLive: spo2Live,
    isStale: spo2Stale ?? false,
    signalQuality: spo2Live ? state.signalQuality.spo2 : null,
    trendDirection: spo2Live ? getTrendDirection(state, 'spo2') : null,
  });

  // Heart rate — live only if probe is active (pulse oximetry)
  const hrSnapshot = state.lastSnapshots.heartRate;
  const hrMeasured = hrSnapshot !== undefined;
  const hrLive = spo2Active;
  const hrStale = hrMeasured && !hrLive && state.tick - hrSnapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'heartRate',
    label: 'FC',
    value: hrLive
      ? applyNoise(state.targets.heartRate, LIVE_NOISE.heartRate, prng)
      : hrMeasured
      ? Math.round(hrSnapshot!.value)
      : null,
    unit: 'bpm',
    isMeasured: hrMeasured,
    isLive: hrLive,
    isStale: hrStale ?? false,
    signalQuality: hrLive ? state.signalQuality.heartRate : null,
    trendDirection: hrLive ? getTrendDirection(state, 'heartRate') : null,
  });

  // Respiratory rate — snapshot only, after counting
  const rrSnapshot = state.lastSnapshots.respiratoryRate;
  const rrMeasured = rrSnapshot !== undefined;
  const rrStale = rrMeasured && state.tick - rrSnapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'respiratoryRate',
    label: 'FR',
    value: rrMeasured ? Math.round(rrSnapshot!.value) : null,
    unit: '/min',
    isMeasured: rrMeasured,
    isLive: false,
    isStale: rrStale ?? false,
    signalQuality: null,
    trendDirection: null,
  });

  // Blood pressure — snapshot only, after taking measurement
  const bpSysSnapshot = state.lastSnapshots.bloodPressureSystolic;
  const bpMeasured = bpSysSnapshot !== undefined;
  const bpStale = bpMeasured && state.tick - bpSysSnapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'bloodPressure',
    label: 'TA',
    value: bpMeasured
      ? Math.round(bpSysSnapshot!.value)
      : null,
    valueSecondary: bpMeasured
      ? Math.round(state.lastSnapshots.bloodPressureDiastolic!.value)
      : null,
    unit: 'mmHg',
    isMeasured: bpMeasured,
    isLive: false,
    isStale: bpStale ?? false,
    signalQuality: null,
    trendDirection: null,
  } as VisibleVital & { valueSecondary: number | null });

  // Glucose — snapshot only
  const gluSnapshot = state.lastSnapshots.glucose;
  const gluMeasured = gluSnapshot !== undefined;
  const gluStale = gluMeasured && state.tick - gluSnapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'glucose',
    label: 'Glycémie',
    value: gluMeasured ? gluSnapshot!.value : null,
    unit: 'g/L',
    isMeasured: gluMeasured,
    isLive: false,
    isStale: gluStale ?? false,
    signalQuality: null,
    trendDirection: null,
  });

  // Temperature — snapshot only
  const tempSnapshot = state.lastSnapshots.temperature;
  const tempMeasured = tempSnapshot !== undefined;
  const tempStale = tempMeasured && state.tick - tempSnapshot!.tick > STALE_THRESHOLD;

  vitals.push({
    vitalId: 'temperature',
    label: 'Temp.',
    value: tempMeasured ? tempSnapshot!.value : null,
    unit: '°C',
    isMeasured: tempMeasured,
    isLive: false,
    isStale: tempStale ?? false,
    signalQuality: null,
    trendDirection: null,
  });

  // Suppress applying state — show nothing yet while equipment is being applied
  if (spo2Applying && !spo2Measured) {
    vitals[0].value = null;
    vitals[1].value = null;
  }

  return vitals;
}

export function getVisibleMonitoringState(state: InternalPhysiologyState): VisibleMonitoringState {
  return {
    spo2Probe: state.equipment.spo2_probe,
    bpCuff: state.equipment.bp_cuff,
    glucometer: state.equipment.glucometer,
    thermometer: state.equipment.thermometer,
  };
}

export function getVisibleWaveformState(state: InternalPhysiologyState): VisibleWaveformState {
  const spo2Active = isEquipmentActive(state, 'spo2_probe');
  const hrSnapshot = state.lastSnapshots.heartRate;

  if (!spo2Active) {
    return { available: false, type: null, heartRate: null, signalQuality: 'lost' };
  }

  return {
    available: true,
    type: 'pleth',
    heartRate: hrSnapshot ? Math.round(hrSnapshot.value) : null,
    signalQuality: state.signalQuality.spo2,
  };
}

export function getVisibleStaleVitals(state: InternalPhysiologyState): VisibleStaleVitals {
  const result: VisibleStaleVitals = {};
  const vitalIds = [
    'spo2',
    'heartRate',
    'respiratoryRate',
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'glucose',
    'temperature',
  ];

  for (const id of vitalIds) {
    const snapshot = state.lastSnapshots[id as keyof typeof state.lastSnapshots];
    if (snapshot) {
      const ticksSince = state.tick - snapshot.tick;
      result[id] = {
        isStale: ticksSince > STALE_THRESHOLD,
        lastMeasuredTick: snapshot.tick,
        ticksSinceMeasurement: ticksSince,
      };
    } else {
      result[id] = { isStale: false, lastMeasuredTick: null, ticksSinceMeasurement: null };
    }
  }

  return result;
}

export function getVisibleConsciousness(state: InternalPhysiologyState): VisibleConsciousness {
  // Approximate consciousness is available after approaching the patient (always visible once scene is secured)
  // Exact consciousness requires AVPU evaluation
  return {
    level: state.consciousnessApproximate,
    isApproximate: true,
    isAssessed: false, // set to true after evaluateConsciousness action
  };
}

export function getVisibleSkin(state: InternalPhysiologyState): VisibleSkin {
  return {
    aspect: state.skinApproximate,
    isApproximate: true,
    isObserved: false,
  };
}

export function getVisibleGlasgow(state: InternalPhysiologyState): VisibleGlasgow {
  return {
    score: state.glasgowAssessed ? state.glasgow : null,
    isAssessed: state.glasgowAssessed,
  };
}

export function getVisiblePain(state: InternalPhysiologyState): VisiblePain {
  return {
    level: null, // pain is only visible after evaluatePain action
    isAssessed: false,
  };
}

export function getSessionView(state: InternalPhysiologyState): SessionView {
  return {
    visibleVitals: getVisibleLiveVitals(state),
    monitoringState: getVisibleMonitoringState(state),
    waveformState: getVisibleWaveformState(state),
    staleVitals: getVisibleStaleVitals(state),
    consciousness: getVisibleConsciousness(state),
    skin: getVisibleSkin(state),
    glasgow: getVisibleGlasgow(state),
    pain: getVisiblePain(state),
    tick: state.tick,
  };
}

// Helper: determine trend direction by comparing current target to what it was a few ticks ago
function getTrendDirection(
  state: InternalPhysiologyState,
  vitalId: LiveVitalId,
): 'up' | 'down' | 'flat' {
  const current = state.targets[vitalId];
  const snapshot = state.lastSnapshots[vitalId];
  if (!snapshot) return 'flat';
  const diff = current - snapshot.value;
  if (diff > 0.5) return 'up';
  if (diff < -0.5) return 'down';
  return 'flat';
}
