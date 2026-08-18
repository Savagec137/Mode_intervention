// equipment-monitoring.ts — Manages equipment state and signal quality.
// Equipment must be applied before any vital is visible to the UI.

import type { EquipmentId, EquipmentState, InternalPhysiologyState, LiveVitalId, SignalQuality } from './physiology-types';
import type { PRNG } from './prng';

export function getDefaultEquipment(): Record<EquipmentId, EquipmentState> {
  return {
    spo2_probe: 'not_applied',
    bp_cuff: 'not_applied',
    glucometer: 'not_applied',
    thermometer: 'not_applied',
  };
}

export function applyEquipment(state: InternalPhysiologyState, equipment: EquipmentId): void {
  state.equipment[equipment] = 'applying';
  state.equipmentAppliedAtTick[equipment] = state.tick;
  state.events.push({
    tick: state.tick,
    type: 'measurement',
    message: `${equipmentLabel(equipment)} en cours de pose.`,
  });
}

export function completeApplication(state: InternalPhysiologyState, equipment: EquipmentId): void {
  if (state.equipment[equipment] !== 'applying') return;
  state.equipment[equipment] = 'active';
  state.events.push({
    tick: state.tick,
    type: 'measurement',
    message: `${equipmentLabel(equipment)} actif.`,
  });
}

export function removeEquipment(state: InternalPhysiologyState, equipment: EquipmentId): void {
  if (state.equipment[equipment] !== 'active') return;
  state.equipment[equipment] = 'removed';

  // When SpO2 probe is removed, stop live monitoring
  if (equipment === 'spo2_probe') {
    state.signalQuality.spo2 = 'lost';
    state.signalQuality.heartRate = 'lost';
    // Keep last measured values as snapshots
    state.lastSnapshots.spo2 = { value: state.targets.spo2, tick: state.tick };
    state.lastSnapshots.heartRate = { value: state.targets.heartRate, tick: state.tick };
  }

  state.events.push({
    tick: state.tick,
    type: 'artifact',
    message: `${equipmentLabel(equipment)} retiré. Monitoring live arrêté.`,
  });
}

// Update signal quality each tick — artifacts like poor contact, movement
export function updateSignalQuality(state: InternalPhysiologyState, prng: PRNG): void {
  const spo2Active = state.equipment.spo2_probe === 'active';

  if (spo2Active) {
    // Mostly good signal, occasionally fair
    const roll = prng.next();
    if (roll < 0.85) {
      state.signalQuality.spo2 = 'good';
      state.signalQuality.heartRate = 'good';
    } else if (roll < 0.97) {
      state.signalQuality.spo2 = 'fair';
      state.signalQuality.heartRate = 'fair';
    } else {
      state.signalQuality.spo2 = 'poor';
      state.signalQuality.heartRate = 'fair';
      state.events.push({
        tick: state.tick,
        type: 'artifact',
        message: 'Signal spo2 faible — repositionner le capteur.',
      });
    }
  } else {
    state.signalQuality.spo2 = 'lost';
    state.signalQuality.heartRate = 'lost';
  }

  // Respiratory rate is never "live" in the same way — it's counted, not monitored
  state.signalQuality.respiratoryRate = 'lost';
}

export function equipmentLabel(equipment: EquipmentId): string {
  const labels: Record<EquipmentId, string> = {
    spo2_probe: 'Saturomètre',
    bp_cuff: 'Tensiomètre',
    glucometer: 'Glucomètre',
    thermometer: 'Thermomètre',
  };
  return labels[equipment];
}

export function isEquipmentActive(state: InternalPhysiologyState, equipment: EquipmentId): boolean {
  return state.equipment[equipment] === 'active';
}

export function isEquipmentApplying(state: InternalPhysiologyState, equipment: EquipmentId): boolean {
  return state.equipment[equipment] === 'applying';
}

// How many ticks does it take for equipment to go from 'applying' to 'active'?
export const APPLY_DURATION: Record<EquipmentId, number> = {
  spo2_probe: 2,
  bp_cuff: 4,
  glucometer: 3,
  thermometer: 3,
};

export function processApplyingEquipment(state: InternalPhysiologyState): void {
  for (const equipment of Object.keys(state.equipment) as EquipmentId[]) {
    if (state.equipment[equipment] === 'applying') {
      const appliedAt = state.equipmentAppliedAtTick[equipment] ?? 0;
      if (state.tick - appliedAt >= APPLY_DURATION[equipment]) {
        completeApplication(state, equipment);
      }
    }
  }
}
