// physiology-types.ts
// Internal physiological state — NEVER exposed to the UI directly.
// The UI only receives data through physiology-selectors.

export type VitalId =
  | 'spo2'
  | 'heartRate'
  | 'respiratoryRate'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'glucose'
  | 'temperature'
  | 'consciousness'
  | 'pain'
  | 'skin';

export type LiveVitalId = 'spo2' | 'heartRate' | 'respiratoryRate';

export type SnapshotVitalId =
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'glucose'
  | 'temperature';

export type ClinicalTrend =
  | 'stable'
  | 'improving'
  | 'degrading_slow'
  | 'degrading_fast'
  | 'critical';

export type ConsciousnessLevel = 'alert' | 'verbal' | 'pain' | 'unresponsive' | 'unknown';

export type SkinAspect = 'normal' | 'pale' | 'cyanotic' | 'flushed' | 'sweaty' | 'unknown';

export type SignalQuality = 'good' | 'fair' | 'poor' | 'lost';

export type EquipmentId = 'spo2_probe' | 'bp_cuff' | 'glucometer' | 'thermometer';

export type EquipmentState = 'not_applied' | 'applying' | 'active' | 'removed';

export type GlasgowScore = number; // 3–15, or null if not assessed

export interface VitalTarget {
  baseline: number;
  current: number;
  trend: ClinicalTrend;
  driftPerTick: number; // how much the target itself moves per tick
}

export interface InternalPhysiologyState {
  tick: number;
  seed: number;
  trend: ClinicalTrend;
  targets: {
    spo2: number;
    heartRate: number;
    respiratoryRate: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    glucose: number;
    temperature: number;
  };
  consciousness: ConsciousnessLevel;
  consciousnessApproximate: ConsciousnessLevel; // what you get from visual observation alone
  painLevel: number; // 0–10
  skin: SkinAspect;
  skinApproximate: SkinAspect; // visual-only
  glasgow: GlasgowScore;
  glasgowAssessed: boolean;
  // effects applied by player actions
  oxygenApplied: boolean;
  oxygenEffectTicks: number; // counts up after O2 applied
  axisMaintained: boolean;
  reassured: boolean;
  // equipment
  equipment: Record<EquipmentId, EquipmentState>;
  equipmentAppliedAtTick: Partial<Record<EquipmentId, number>>;
  // last measured snapshot values (for display when equipment removed)
  lastSnapshots: Partial<Record<SnapshotVitalId | 'spo2' | 'heartRate' | 'respiratoryRate', { value: number; tick: number }>>;
  // signal quality per live vital
  signalQuality: Record<LiveVitalId, SignalQuality>;
  // events log (internal)
  events: PhysioEvent[];
}

export interface PhysioEvent {
  tick: number;
  type: 'trend_change' | 'action_effect' | 'artifact' | 'measurement';
  message: string;
}

export interface ClinicalProfile {
  id: string;
  label: string;
  baselineSpO2: number;
  baselineHeartRate: number;
  baselineRespiratoryRate: number;
  baselineBloodPressureSystolic: number;
  baselineBloodPressureDiastolic: number;
  baselineGlucose: number;
  baselineTemperature: number;
  consciousness: ConsciousnessLevel;
  consciousnessApproximate: ConsciousnessLevel;
  painLevel: number;
  skin: SkinAspect;
  skinApproximate: SkinAspect;
  glasgow: GlasgowScore;
  initialTrend: ClinicalTrend;
  oxygenIndicated: boolean;
}
