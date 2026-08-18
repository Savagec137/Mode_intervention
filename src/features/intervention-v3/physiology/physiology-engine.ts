// physiology-engine.ts — Core physiological simulation engine.
// Advances the patient's internal state tick by tick.
// NEVER exposes raw state to the UI — use physiology-selectors instead.

import type {
  ClinicalProfile,
  InternalPhysiologyState,
  LiveVitalId,
  SnapshotVitalId,
} from './physiology-types';
import { PRNG, seedFromString } from './prng';
import { LIVE_NOISE, SNAPSHOT_NOISE, applyNoise } from './vital-noise';
import {
  applyTrendDrift,
  applyOxygenEffect,
  applyReassuranceEffect,
  applyAxisEffect,
} from './vital-trends';
import {
  getDefaultEquipment,
  applyEquipment,
  removeEquipment,
  updateSignalQuality,
  processApplyingEquipment,
} from './equipment-monitoring';

export function createPhysiologyState(profile: ClinicalProfile, sessionSeed: string): InternalPhysiologyState {
  const seed = seedFromString(sessionSeed);
  return {
    tick: 0,
    seed,
    trend: profile.initialTrend,
    targets: {
      spo2: profile.baselineSpO2,
      heartRate: profile.baselineHeartRate,
      respiratoryRate: profile.baselineRespiratoryRate,
      bloodPressureSystolic: profile.baselineBloodPressureSystolic,
      bloodPressureDiastolic: profile.baselineBloodPressureDiastolic,
      glucose: profile.baselineGlucose,
      temperature: profile.baselineTemperature,
    },
    consciousness: profile.consciousness,
    consciousnessApproximate: profile.consciousnessApproximate,
    painLevel: profile.painLevel,
    skin: profile.skin,
    skinApproximate: profile.skinApproximate,
    glasgow: profile.glasgow,
    glasgowAssessed: false,
    oxygenApplied: false,
    oxygenEffectTicks: 0,
    axisMaintained: false,
    reassured: false,
    equipment: getDefaultEquipment(),
    equipmentAppliedAtTick: {},
    lastSnapshots: {},
    signalQuality: {
      spo2: 'lost',
      heartRate: 'lost',
      respiratoryRate: 'lost',
    },
    events: [],
  };
}

export interface PhysiologyEngine {
  state: InternalPhysiologyState;
  profile: ClinicalProfile;
  prng: PRNG;

  tick(): void;
  applySpo2Probe(): void;
  removeSpo2Probe(): void;
  takeBloodPressure(): { systolic: number; diastolic: number };
  takeGlucose(): number;
  takeTemperature(): number;
  countRespiratoryRate(): number;
  evaluateConsciousness(): void;
  evaluateGlasgow(): number;
  evaluatePain(): number;
  observeSkin(): void;
  applyOxygen(): void;
  maintainAxis(): void;
  reassure(): void;
  getRawState(): InternalPhysiologyState;
}

export function createPhysiologyEngine(profile: ClinicalProfile, sessionSeed: string): PhysiologyEngine {
  const state = createPhysiologyState(profile, sessionSeed);
  const prng = new PRNG(state.seed);

  function tick(): void {
    state.tick++;

    // Process equipment that is in 'applying' state
    processApplyingEquipment(state);

    // Apply clinical trend drift
    applyTrendDrift(state, profile);

    // Apply action effects
    applyOxygenEffect(state, profile);
    applyReassuranceEffect(state);
    applyAxisEffect(state, profile);

    // Update signal quality
    updateSignalQuality(state, prng);

    // If spo2 probe is active, update last snapshots for live vitals
    if (state.equipment.spo2_probe === 'active') {
      state.lastSnapshots.spo2 = { value: Math.round(state.targets.spo2), tick: state.tick };
      state.lastSnapshots.heartRate = { value: Math.round(state.targets.heartRate), tick: state.tick };
    }
  }

  function applySpo2Probe(): void {
    applyEquipment(state, 'spo2_probe');
  }

  function removeSpo2Probe(): void {
    removeEquipment(state, 'spo2_probe');
  }

  function takeBloodPressure(): { systolic: number; diastolic: number } {
    const systolic = applyNoise(state.targets.bloodPressureSystolic, SNAPSHOT_NOISE.bloodPressureSystolic, prng);
    const diastolic = applyNoise(state.targets.bloodPressureDiastolic, SNAPSHOT_NOISE.bloodPressureDiastolic, prng);
    state.lastSnapshots.bloodPressureSystolic = { value: systolic, tick: state.tick };
    state.lastSnapshots.bloodPressureDiastolic = { value: diastolic, tick: state.tick };
    state.events.push({ tick: state.tick, type: 'measurement', message: `TA mesurée : ${systolic}/${diastolic} mmHg.` });
    return { systolic, diastolic };
  }

  function takeGlucose(): number {
    const value = applyNoise(state.targets.glucose, SNAPSHOT_NOISE.glucose, prng);
    state.lastSnapshots.glucose = { value, tick: state.tick };
    state.events.push({ tick: state.tick, type: 'measurement', message: `Glycémie : ${value} g/L.` });
    return value;
  }

  function takeTemperature(): number {
    const value = applyNoise(state.targets.temperature, SNAPSHOT_NOISE.temperature, prng);
    state.lastSnapshots.temperature = { value, tick: state.tick };
    state.events.push({ tick: state.tick, type: 'measurement', message: `Température : ${value}°C.` });
    return value;
  }

  function countRespiratoryRate(): number {
    const value = applyNoise(state.targets.respiratoryRate, LIVE_NOISE.respiratoryRate, prng);
    state.lastSnapshots.respiratoryRate = { value, tick: state.tick };
    state.events.push({ tick: state.tick, type: 'measurement', message: `FR comptée : ${value}/min.` });
    return value;
  }

  function evaluateConsciousness(): void {
    // Full AVPU evaluation reveals exact consciousness level
    state.events.push({
      tick: state.tick,
      type: 'measurement',
      message: `Évaluation AVPU : ${state.consciousness}.`,
    });
  }

  function evaluateGlasgow(): number {
    state.glasgowAssessed = true;
    state.events.push({
      tick: state.tick,
      type: 'measurement',
      message: `Glasgow évalué : ${state.glasgow}.`,
    });
    return state.glasgow;
  }

  function evaluatePain(): number {
    state.events.push({
      tick: state.tick,
      type: 'measurement',
      message: `EVA douleur : ${state.painLevel}/10.`,
    });
    return state.painLevel;
  }

  function observeSkin(): void {
    state.events.push({
      tick: state.tick,
      type: 'measurement',
      message: `Peau observée : ${state.skin}.`,
    });
  }

  function applyOxygen(): void {
    state.oxygenApplied = true;
    state.events.push({
      tick: state.tick,
      type: 'action_effect',
      message: 'Oxygène administré.',
    });
  }

  function maintainAxis(): void {
    state.axisMaintained = true;
    state.events.push({
      tick: state.tick,
      type: 'action_effect',
      message: 'Maintien de l\'axe tête-cou-tronc appliqué.',
    });
  }

  function reassure(): void {
    state.reassured = true;
    state.events.push({
      tick: state.tick,
      type: 'action_effect',
      message: 'Patient rassuré.',
    });
  }

  function getRawState(): InternalPhysiologyState {
    return state;
  }

  return {
    state,
    profile,
    prng,
    tick,
    applySpo2Probe,
    removeSpo2Probe,
    takeBloodPressure,
    takeGlucose,
    takeTemperature,
    countRespiratoryRate,
    evaluateConsciousness,
    evaluateGlasgow,
    evaluatePain,
    observeSkin,
    applyOxygen,
    maintainAxis,
    reassure,
    getRawState,
  };
}

// Compute a live vital value with noise (used by selectors)
export function computeLiveValue(
  vitalId: LiveVitalId,
  state: InternalPhysiologyState,
  prng: PRNG,
): number {
  const target = state.targets[vitalId];
  return applyNoise(target, LIVE_NOISE[vitalId], prng);
}

// Compute a snapshot vital value with noise (used by selectors)
export function computeSnapshotValue(
  vitalId: SnapshotVitalId,
  state: InternalPhysiologyState,
  prng: PRNG,
): number {
  const target = state.targets[vitalId];
  return applyNoise(target, SNAPSHOT_NOISE[vitalId], prng);
}
