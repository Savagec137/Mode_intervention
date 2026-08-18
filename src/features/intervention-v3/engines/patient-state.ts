// patient-state.ts — Patient identity and clinical context.
// This is the "who" and "what happened", not the live physiology.
// The UI can access this freely — it's the dispatch information, not hidden clinical data.

import type { ConsciousnessLevel, SkinAspect } from '../physiology/physiology-types';

export interface PatientState {
  name: string;
  age: number;
  sex: 'M' | 'F';
  history: string;
  chiefComplaint: string;
  // What the dispatcher told the crew — NOT what the crew discovers on scene
  dispatchInfo: string[];
  sceneDescription: string;
  sceneHazards: string[];
  location: string;
  time: string;
}

export function getPatientForScenario(scenarioId: string): PatientState {
  const map: Record<string, PatientState> = {
    v3_trauma_cranien_chute_n104: {
      name: 'M. L.',
      age: 54,
      sex: 'M',
      history: 'Hypertension traitée, pas d\'allergie connue, pas de traitement anticoagulant.',
      chiefComplaint: 'Chute avec perte de connaissance initiale, confusion à l\'arrivée',
      dispatchInfo: [
        'Patient au sol après une chute d\'environ 1 mètre',
        'Perte de connaissance initiale rapportée par le témoin',
        'Patient confus à l\'arrivée des secours',
        'Présence d\'un témoin sur place',
      ],
      sceneDescription:
        'Le patient est allongé sur le sol de son garage, près d\'un escabeau renversé. Il est confus, répond de façon incohérente. Un hématome pariétal est visible. Un voisin est présent et a alerté les secours.',
      sceneHazards: [
        'Escabeau renversé à proximité',
        'Sol potentiellement glissant',
        'Risque d\'agitation du patient',
      ],
      location: '23 rue des Acacias, garage',
      time: '22:47',
    },
  };

  return map[scenarioId] ?? map['v3_trauma_cranien_chute_n104'];
}
