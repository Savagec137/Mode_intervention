// scenario-v3.ts — Scenario definition for the trauma crânien case.
// This is the bridge between clinical profiles, patient state, and the simulation engine.

import type { ClinicalProfile } from './physiology/clinical-profiles';
import { PROFILE_TRAUMA_CRANIEN_STABLE } from './physiology/clinical-profiles';
import { getPatientForScenario } from './engines/patient-state';
import type { PatientState } from './engines/patient-state';

export interface ScenarioV3 {
  id: string;
  profile: ClinicalProfile;
  patient: PatientState;
  title: string;
  description: string;
  hints: {
    scene: string[];
    patient: string[];
    actions: string[];
    call15: string[];
  };
}

export const SCENARIO_TRAUMA_CRANIEN: ScenarioV3 = {
  id: 'v3_trauma_cranien_chute_n104',
  profile: PROFILE_TRAUMA_CRANIEN_STABLE,
  patient: getPatientForScenario('v3_trauma_cranien_chute_n104'),
  title: 'Traumatisme crânien — Chute',
  description:
    'Un homme de 54 ans a fait une chute dans son garage. Perte de connaissance initiale rapportée par le témoin. Le patient est confus à l\'arrivée des secours.',
  hints: {
    scene: [
      'Sécurisez la zone avant toute approche',
      'Le risque principal est neurologique — maintenez l\'axe tête-cou-tronc',
      'Un hématome pariétal est visible',
    ],
    patient: [
      'Posez le saturomètre pour monitorer la SpO₂',
      'Le Glasgow ne sera disponible qu\'après évaluation complète',
      'Des constantes normales n\'éliminent pas le risque neurologique',
    ],
    actions: [
      'Le maintien de l\'axe est prioritaire pour ce patient',
      'L\'oxygène n\'est pas indiqué — la SpO₂ est normale',
      'La surveillance est essentielle : l\'état peut se dégrader',
    ],
    call15: [
      'Transmettez le mécanisme, la perte de connaissance initiale et le Glasgow',
      'Précisez la confusion et l\'hématome',
      'Demandez un transport médicalisé',
    ],
  },
};
