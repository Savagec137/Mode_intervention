// transmission-engine.ts — Manages the Call 15 transmission flow.
// The player selects information items to transmit. The regulator asks questions.
// Missing or incorrect information affects the debrief score.

export type TransmissionInfoId =
  | 'identity'
  | 'reason'
  | 'circumstances'
  | 'consciousness'
  | 'vitals'
  | 'pain'
  | 'history'
  | 'treatment'
  | 'allergies'
  | 'time'
  | 'actions'
  | 'reinforce'
  | 'transport';

export interface TransmissionInfoItem {
  id: TransmissionInfoId;
  label: string;
  subtitle: string;
  essential: boolean; // must be transmitted for a complete call
}

export const TRANSMISSION_ITEMS: TransmissionInfoItem[] = [
  { id: 'identity', label: 'Identité', subtitle: 'sexe / âge', essential: true },
  { id: 'reason', label: 'Motif', subtitle: 'd\'appel', essential: true },
  { id: 'circumstances', label: 'Circonstances', subtitle: 'de l\'intervention', essential: true },
  { id: 'consciousness', label: 'Niveau de conscience', subtitle: 'AVPU / Glasgow', essential: true },
  { id: 'vitals', label: 'Constantes', subtitle: 'mesurées', essential: true },
  { id: 'pain', label: 'Douleur', subtitle: 'EVA', essential: false },
  { id: 'history', label: 'Antécédents', subtitle: 'médicaux', essential: false },
  { id: 'treatment', label: 'Traitements', subtitle: 'en cours', essential: false },
  { id: 'allergies', label: 'Allergies', subtitle: 'connues', essential: false },
  { id: 'time', label: 'Heure de début', subtitle: 'des symptômes', essential: true },
  { id: 'actions', label: 'Gestes réalisés', subtitle: 'sur place', essential: true },
  { id: 'reinforce', label: 'Demande de renfort', subtitle: 'si nécessaire', essential: false },
  { id: 'transport', label: 'Décision de transport', subtitle: 'et destination', essential: false },
];

export interface RegulatorQuestion {
  id: string;
  text: string;
  answered: boolean;
  answer?: string;
}

export const REGULATOR_QUESTIONS: RegulatorQuestion[] = [
  { id: 'q_consciousness', text: 'Quel est l\'état de conscience exact ?', answered: false },
  { id: 'q_bp', text: 'Avez-vous pris la tension ?', answered: false },
  { id: 'q_history', text: 'Le patient a-t-il des antécédents ?', answered: false },
  { id: 'q_pck', text: 'Y a-t-il une perte de connaissance initiale ?', answered: false },
];

export interface TransmissionState {
  selectedInfo: TransmissionInfoId[];
  regulatorQuestions: RegulatorQuestion[];
  transmitted: boolean;
}

export function createTransmissionState(): TransmissionState {
  return {
    selectedInfo: [],
    regulatorQuestions: REGULATOR_QUESTIONS.map((q) => ({ ...q })),
    transmitted: false,
  };
}

export function toggleInfoSelection(state: TransmissionState, infoId: TransmissionInfoId): void {
  if (state.selectedInfo.includes(infoId)) {
    state.selectedInfo = state.selectedInfo.filter((id) => id !== infoId);
  } else {
    state.selectedInfo.push(infoId);
  }
}

export function answerRegulatorQuestion(state: TransmissionState, questionId: string, answer: string): void {
  const question = state.regulatorQuestions.find((q) => q.id === questionId);
  if (question) {
    question.answered = true;
    question.answer = answer;
  }
}

export function getTransmissionScore(state: TransmissionState): { score: number; maxScore: number; missing: string[] } {
  const essentialItems = TRANSMISSION_ITEMS.filter((item) => item.essential);
  const maxScore = essentialItems.length;
  const transmitted = essentialItems.filter((item) => state.selectedInfo.includes(item.id));
  const missing = essentialItems
    .filter((item) => !state.selectedInfo.includes(item.id))
    .map((item) => item.label);
  return { score: transmitted.length, maxScore, missing };
}

export function getAnsweredQuestionsCount(state: TransmissionState): number {
  return state.regulatorQuestions.filter((q) => q.answered).length;
}
