// rule-engine.ts — Clinical rules that check player decisions against expected actions.
// Determines which actions are correct, incorrect, or dangerous for a given scenario.

import type { ClinicalProfile } from '../physiology/physiology-types';
import type { PlayerActionId } from './action-engine';

export interface ActionRule {
  actionId: PlayerActionId;
  category: 'correct' | 'incorrect' | 'dangerous' | 'optional';
  feedback: string;
}

export interface ScenarioRules {
  profileId: string;
  expectedActions: ActionRule[];
  unexpectedActions: ActionRule[];
  dangerousActions: ActionRule[];
}

export function getRulesForProfile(profile: ClinicalProfile): ScenarioRules {
  const commonCorrect: ActionRule[] = [
    { actionId: 'maintain_axis', category: 'correct', feedback: 'Le maintien de l\'axe tête-cou-tronc est indiqué pour tout patient traumatisé.' },
    { actionId: 'evaluate_glasgow', category: 'correct', feedback: 'L\'évaluation du Glasgow est indispensable après un traumatisme crânien.' },
    { actionId: 'evaluate_consciousness', category: 'correct', feedback: 'L\'évaluation AVPU est un prérequis.' },
    { actionId: 'apply_spo2_probe', category: 'correct', feedback: 'La pose du saturomètre permet le monitoring de la SpO₂ et du pouls.' },
  ];

  const commonIncorrect: ActionRule[] = [
    { actionId: 'remove_spo2_probe', category: 'incorrect', feedback: 'Retirer le saturomètre prématurément interrompt le monitoring.' },
  ];

  const commonDangerous: ActionRule[] = [
    { actionId: 'finish', category: 'dangerous', feedback: 'Terminer l\'intervention sans bilan complet est dangereux.' },
  ];

  // Oxygen is only correct if indicated by the profile
  if (profile.oxygenIndicated) {
    commonCorrect.push({
      actionId: 'apply_oxygen',
      category: 'correct',
      feedback: 'L\'oxygénothérapie est indiquée devant cette détresse respiratoire.',
    });
  } else {
    commonIncorrect.push({
      actionId: 'apply_oxygen',
      category: 'incorrect',
      feedback: 'L\'oxygène n\'est pas indiqué pour ce profil — la SpO₂ est déjà normale.',
    });
  }

  return {
    profileId: profile.id,
    expectedActions: commonCorrect,
    unexpectedActions: commonIncorrect,
    dangerousActions: commonDangerous,
  };
}

export function evaluateAction(
  profile: ClinicalProfile,
  actionId: PlayerActionId,
): ActionRule | null {
  const rules = getRulesForProfile(profile);
  return (
    rules.expectedActions.find((r) => r.actionId === actionId) ??
    rules.unexpectedActions.find((r) => r.actionId === actionId) ??
    rules.dangerousActions.find((r) => r.actionId === actionId) ??
    null
  );
}
