// debrief-engine.ts — Generates the final debrief after the intervention.
// Evaluates the player's performance across all phases and produces detailed feedback.

import type { MissionState } from './mission-state';
import type { TransmissionState } from './transmission-engine';
import { getTransmissionScore } from './transmission-engine';
import type { InternalPhysiologyState } from '../physiology/physiology-types';
import type { ClinicalProfile } from '../physiology/physiology-types';

export interface DebriefSection {
  title: string;
  score: number;
  maxScore: number;
  feedback: string[];
}

export interface DebriefResult {
  totalScore: number;
  sections: DebriefSection[];
  summary: string;
  correctActions: string[];
  missedActions: string[];
  clinicalCase: string;
}

export function generateDebrief(
  mission: MissionState,
  transmission: TransmissionState,
  physioState: InternalPhysiologyState,
  profile: ClinicalProfile,
  selectedActionIds: string[],
): DebriefResult {
  // Section 1: Scene management
  const sceneObjectives = ['secure_scene', 'observe_scene', 'approach_patient'];
  const sceneCompleted = sceneObjectives.filter((id) => mission.sceneActionsCompleted.includes(id));
  const sceneSection: DebriefSection = {
    title: 'Gestion de la scène',
    score: sceneCompleted.length,
    maxScore: sceneObjectives.length,
    feedback: sceneObjectives.map((id) => {
      const done = mission.sceneActionsCompleted.includes(id);
      const labels: Record<string, string> = {
        secure_scene: 'Sécurisation de la zone',
        observe_scene: 'Observation de l\'environnement',
        approach_patient: 'Approche du patient',
      };
      return done
        ? `${labels[id]} : effectué.`
        : `${labels[id]} : manquant — cette étape est indispensable avant d\'approcher le patient.`;
    }),
  };

  // Section 2: Vital signs measurement
  const vitalObjectives = ['measure_spo2', 'measure_bp', 'measure_glucose', 'evaluate_glasgow'];
  const vitalCompleted = vitalObjectives.filter((id) =>
    mission.objectives.find((o) => o.id === id)?.completed,
  );
  const vitalSection: DebriefSection = {
    title: 'Bilan vital',
    score: vitalCompleted.length,
    maxScore: vitalObjectives.length,
    feedback: vitalObjectives.map((id) => {
      const obj = mission.objectives.find((o) => o.id === id);
      const labels: Record<string, string> = {
        measure_spo2: 'Pose du saturomètre',
        measure_bp: 'Prise de tension',
        measure_glucose: 'Glycémie capillaire',
        evaluate_glasgow: 'Score de Glasgow',
      };
      return obj?.completed
        ? `${labels[id]} : effectué.`
        : `${labels[id]} : non réalisé — ${obj?.required ? 'indispensable pour ce cas.' : 'utile pour le bilan complet.'}`;
    }),
  };

  // Section 3: Clinical actions
  const correctActions = ['maintain_axis', 'apply_oxygen', 'reassure'];
  const correctSelected = selectedActionIds.filter((id) => correctActions.includes(id));
  const wrongActions = selectedActionIds.filter((id) => !correctActions.includes(id));
  const actionsSection: DebriefSection = {
    title: 'Gestes et actions',
    score: Math.max(0, correctSelected.length - wrongActions.length),
    maxScore: correctActions.length,
    feedback: [
      ...correctActions.map((id) => {
        const selected = selectedActionIds.includes(id);
        const labels: Record<string, string> = {
          maintain_axis: 'Maintien de l\'axe tête-cou-tronc',
          apply_oxygen: 'Administration d\'oxygène',
          reassure: 'Rassurer le patient',
        };
        return selected
          ? `${labels[id]} : geste adapté.`
          : `${labels[id]} : non réalisé — recommandé pour ce cas.`;
      }),
      ...(wrongActions.length > 0
        ? [`${wrongActions.length} geste(s) inadapté(s) sélectionné(s) — pénalité.`]
        : []),
    ],
  };

  // Section 4: Transmission
  const transScore = getTransmissionScore(transmission);
  const transmissionSection: DebriefSection = {
    title: 'Transmission au Centre 15',
    score: transScore.score,
    maxScore: transScore.maxScore,
    feedback: [
      ...transScore.feedback,
      ...(transScore.missing.length > 0
        ? [`Informations manquantes : ${transScore.missing.join(', ')}.`]
        : ['Toutes les informations essentielles ont été transmises.']),
      `${getAnsweredQuestionsCountSafe(transmission)} / ${transmission.regulatorQuestions.length} questions du régulateur traitées.`,
    ],
  };

  // Total score
  const totalScore = Math.round(
    ((sceneSection.score + vitalSection.score + actionsSection.score + transmissionSection.score) /
      (sceneSection.maxScore + vitalSection.maxScore + actionsSection.maxScore + transmissionSection.maxScore)) *
      100,
  );

  const summary =
    totalScore >= 85
      ? 'Excellente prise en charge. La méthodologie est maîtrisée.'
      : totalScore >= 65
      ? 'Bonne intervention. Quelques éléments à perfectionner.'
      : totalScore >= 40
      ? 'Prise en charge partielle. Reprenez la méthodologie ABCDE et la transmission.'
      : 'Intervention insuffisante. Reprenez les fondamentaux : sécurisation, bilan, gestes, transmission.';

  return {
    totalScore,
    sections: [sceneSection, vitalSection, actionsSection, transmissionSection],
    summary,
    correctActions: correctSelected,
    missedActions: correctActions.filter((id) => !selectedActionIds.includes(id)),
    clinicalCase: profile.label,
  };
}

function getAnsweredQuestionsCountSafe(transmission: TransmissionState): number {
  return transmission.regulatorQuestions.filter((q) => q.answered).length;
}
