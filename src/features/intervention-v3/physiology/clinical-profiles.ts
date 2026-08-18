// clinical-profiles.ts — Predefined patient physiological profiles.
// Each profile defines the baseline state and initial trend for a clinical scenario.

import type { ClinicalProfile } from './physiology-types';

export const PROFILE_TRAUMA_CRANIEN_STABLE: ClinicalProfile = {
  id: 'v3_trauma_cranien_chute_n104',
  label: 'Traumatisme crânien — Chute — N104',
  baselineSpO2: 98,
  baselineHeartRate: 92,
  baselineRespiratoryRate: 18,
  baselineBloodPressureSystolic: 130,
  baselineBloodPressureDiastolic: 85,
  baselineGlucose: 1.1,
  baselineTemperature: 36.8,
  consciousness: 'verbal',
  consciousnessApproximate: 'verbal',
  painLevel: 6,
  skin: 'pale',
  skinApproximate: 'pale',
  glasgow: 13,
  oxygenIndicated: false,
  initialTrend: 'stable',
};

export const PROFILE_DETRESSE_RESPIRATOIRE: ClinicalProfile = {
  id: 'v3_detresse_respiratoire_n207',
  label: 'Détresse respiratoire — N207',
  baselineSpO2: 91,
  baselineHeartRate: 115,
  baselineRespiratoryRate: 28,
  baselineBloodPressureSystolic: 145,
  baselineBloodPressureDiastolic: 90,
  baselineGlucose: 1.3,
  baselineTemperature: 37.2,
  consciousness: 'alert',
  consciousnessApproximate: 'alert',
  painLevel: 3,
  skin: 'cyanotic',
  skinApproximate: 'pale',
  glasgow: 15,
  oxygenIndicated: true,
  initialTrend: 'degrading_slow',
};

export const PROFILE_CHOC_HEMORRAGIQUE: ClinicalProfile = {
  id: 'v3_choc_hemorragique_n301',
  label: 'Choc hémorragique — N301',
  baselineSpO2: 95,
  baselineHeartRate: 128,
  baselineRespiratoryRate: 24,
  baselineBloodPressureSystolic: 88,
  baselineBloodPressureDiastolic: 55,
  baselineGlucose: 1.4,
  baselineTemperature: 36.2,
  consciousness: 'pain',
  consciousnessApproximate: 'verbal',
  painLevel: 8,
  skin: 'sweaty',
  skinApproximate: 'pale',
  glasgow: 11,
  oxygenIndicated: true,
  initialTrend: 'degrading_fast',
};

export const PROFILE_MALAISE_HYPOGLYCEMIQUE: ClinicalProfile = {
  id: 'v3_malaise_hypoglycemique_n108',
  label: 'Malaise hypoglycémique — N108',
  baselineSpO2: 97,
  baselineHeartRate: 88,
  baselineRespiratoryRate: 14,
  baselineBloodPressureSystolic: 125,
  baselineBloodPressureDiastolic: 80,
  baselineGlucose: 0.5,
  baselineTemperature: 36.5,
  consciousness: 'verbal',
  consciousnessApproximate: 'verbal',
  painLevel: 0,
  skin: 'sweaty',
  skinApproximate: 'pale',
  glasgow: 12,
  oxygenIndicated: false,
  initialTrend: 'degrading_slow',
};

export function getProfileById(id: string): ClinicalProfile | undefined {
  const profiles = [
    PROFILE_TRAUMA_CRANIEN_STABLE,
    PROFILE_DETRESSE_RESPIRATOIRE,
    PROFILE_CHOC_HEMORRAGIQUE,
    PROFILE_MALAISE_HYPOGLYCEMIQUE,
  ];
  return profiles.find((p) => p.id === id);
}
