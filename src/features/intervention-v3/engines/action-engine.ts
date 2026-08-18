// action-engine.ts — Processes player actions and their consequences.
// Each action has rules: prerequisites, effects on physiology, effects on mission, and feedback.

import type { PhysiologyEngine } from '../physiology/physiology-engine';
import type { MissionState } from './mission-state';
import { completeObjective } from './mission-state';

export type PlayerActionId =
  | 'secure_scene'
  | 'observe_scene'
  | 'approach_patient'
  | 'request_reinforcement'
  | 'apply_spo2_probe'
  | 'remove_spo2_probe'
  | 'take_blood_pressure'
  | 'take_glucose'
  | 'take_temperature'
  | 'count_respiratory_rate'
  | 'evaluate_consciousness'
  | 'evaluate_glasgow'
  | 'evaluate_pain'
  | 'observe_skin'
  | 'apply_oxygen'
  | 'maintain_axis'
  | 'reassure'
  | 'transmit_call15'
  | 'finish';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ActionRule {
  id: PlayerActionId;
  label: string;
  description: string;
  requiredPhase: string[];
  prerequisite?: (mission: MissionState) => boolean;
  execute: (physio: PhysiologyEngine, mission: MissionState) => ActionResult;
}

export const ACTION_RULES: Record<PlayerActionId, ActionRule> = {
  secure_scene: {
    id: 'secure_scene',
    label: 'Sécuriser la zone',
    description: 'Mettre en sécurité le patient et l\'environnement',
    requiredPhase: ['scene'],
    execute: (_physio, mission) => {
      mission.sceneActionsCompleted.push('secure_scene');
      completeObjective(mission, 'secure_scene');
      return { success: true, message: 'Zone sécurisée. Vous pouvez approcher le patient.' };
    },
  },
  observe_scene: {
    id: 'observe_scene',
    label: 'Observer l\'environnement',
    description: 'Rechercher dangers, témoins, indices',
    requiredPhase: ['scene'],
    execute: (_physio, mission) => {
      mission.sceneActionsCompleted.push('observe_scene');
      completeObjective(mission, 'observe_scene');
      return { success: true, message: 'Observation terminée. Aucun danger immédiat supplémentaire détecté.' };
    },
  },
  approach_patient: {
    id: 'approach_patient',
    label: 'Approcher le patient',
    description: 'Évaluer l\'état initial et la conscience',
    requiredPhase: ['scene'],
    prerequisite: (mission) => mission.sceneActionsCompleted.includes('secure_scene'),
    execute: (_physio, mission) => {
      mission.sceneActionsCompleted.push('approach_patient');
      completeObjective(mission, 'approach_patient');
      return { success: true, message: 'Patient approché. État de conscience approximatif : réagit à la voix.' };
    },
  },
  request_reinforcement: {
    id: 'request_reinforcement',
    label: 'Demander un renfort',
    description: 'Solliciter un moyen supplémentaire si nécessaire',
    requiredPhase: ['scene'],
    execute: (_physio, _mission) => {
      return { success: true, message: 'Renfort demandé au Centre 15.' };
    },
  },
  apply_spo2_probe: {
    id: 'apply_spo2_probe',
    label: 'Poser le saturomètre',
    description: 'Mesurer la SpO₂ et le pouls en continu',
    requiredPhase: ['patient'],
    execute: (physio, mission) => {
      physio.applySpo2Probe();
      completeObjective(mission, 'measure_spo2');
      return { success: true, message: 'Saturomètre en cours de pose... Le signal va apparaître dans un instant.' };
    },
  },
  remove_spo2_probe: {
    id: 'remove_spo2_probe',
    label: 'Retirer le saturomètre',
    description: 'Arrêter le monitoring live',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      physio.removeSpo2Probe();
      return { success: true, message: 'Saturomètre retiré. Monitoring live arrêté. Dernières valeurs conservées.' };
    },
  },
  take_blood_pressure: {
    id: 'take_blood_pressure',
    label: 'Prendre la tension',
    description: 'Mesurer la tension artérielle (snapshot)',
    requiredPhase: ['patient'],
    execute: (physio, mission) => {
      const bp = physio.takeBloodPressure();
      completeObjective(mission, 'measure_bp');
      return { success: true, message: `Tension artérielle mesurée : ${bp.systolic}/${bp.diastolic} mmHg.`, data: bp };
    },
  },
  take_glucose: {
    id: 'take_glucose',
    label: 'Mesurer la glycémie',
    description: 'Dextro capillaire (snapshot)',
    requiredPhase: ['patient'],
    execute: (physio, mission) => {
      const value = physio.takeGlucose();
      completeObjective(mission, 'measure_glucose');
      return { success: true, message: `Glycémie : ${value} g/L.`, data: value };
    },
  },
  take_temperature: {
    id: 'take_temperature',
    label: 'Prendre la température',
    description: 'Thermomètre (snapshot)',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      const value = physio.takeTemperature();
      return { success: true, message: `Température : ${value}°C.`, data: value };
    },
  },
  count_respiratory_rate: {
    id: 'count_respiratory_rate',
    label: 'Compter la FR',
    description: 'Compter les cycles respiratoires sur 1 minute',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      const value = physio.countRespiratoryRate();
      return { success: true, message: `Fréquence respiratoire : ${value}/min.`, data: value };
    },
  },
  evaluate_consciousness: {
    id: 'evaluate_consciousness',
    label: 'Évaluer la conscience (AVPU)',
    description: 'Évaluation structurée du niveau de conscience',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      physio.evaluateConsciousness();
      return { success: true, message: 'Évaluation AVPU terminée. Niveau de conscience précis disponible.' };
    },
  },
  evaluate_glasgow: {
    id: 'evaluate_glasgow',
    label: 'Évaluer le Glasgow',
    description: 'Score de Glasgow complet (oeil, verbal, moteur)',
    requiredPhase: ['patient'],
    execute: (physio, mission) => {
      const score = physio.evaluateGlasgow();
      completeObjective(mission, 'evaluate_glasgow');
      return { success: true, message: `Glasgow : ${score}/15.`, data: score };
    },
  },
  evaluate_pain: {
    id: 'evaluate_pain',
    label: 'Évaluer la douleur (EVA)',
    description: 'Échelle visuelle analogique',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      const value = physio.evaluatePain();
      return { success: true, message: `Douleur : ${value}/10.`, data: value };
    },
  },
  observe_skin: {
    id: 'observe_skin',
    label: 'Observer la peau',
    description: 'Aspect, couleur, température cutanée',
    requiredPhase: ['patient'],
    execute: (physio, _mission) => {
      physio.observeSkin();
      return { success: true, message: 'Peau observée : aspect précis disponible.' };
    },
  },
  apply_oxygen: {
    id: 'apply_oxygen',
    label: 'Administrer de l\'oxygène',
    description: 'Oxygénothérapie si indiquée',
    requiredPhase: ['actions'],
    execute: (physio, _mission) => {
      physio.applyOxygen();
      return { success: true, message: 'Oxygène administré. La SpO₂ va s\'améliorer progressivement si l\'indication est correcte.' };
    },
  },
  maintain_axis: {
    id: 'maintain_axis',
    label: 'Maintenir l\'axe tête-cou-tronc',
    description: 'Prévenir une aggravation neurologique',
    requiredPhase: ['actions'],
    execute: (physio, _mission) => {
      physio.maintainAxis();
      return { success: true, message: 'Maintien de l\'axe appliqué. La dégradation neurologique est ralentie.' };
    },
  },
  reassure: {
    id: 'reassure',
    label: 'Rassurer le patient',
    description: 'Calmer le patient pour réduire le stress',
    requiredPhase: ['actions'],
    execute: (physio, _mission) => {
      physio.reassure();
      return { success: true, message: 'Patient rassuré. Légère diminution de la fréquence cardiaque possible.' };
    },
  },
  transmit_call15: {
    id: 'transmit_call15',
    label: 'Transmettre au Centre 15',
    description: 'Transmettre le bilan au médecin régulateur',
    requiredPhase: ['call15'],
    execute: (_physio, mission) => {
      completeObjective(mission, 'transmit_call15');
      return { success: true, message: 'Transmission effectuée. Le régulateur accuse réception.' };
    },
  },
  finish: {
    id: 'finish',
    label: 'Terminer l\'intervention',
    description: 'Clôturer et passer au débrief',
    requiredPhase: ['call15'],
    execute: (_physio, mission) => {
      completeObjective(mission, 'transmit_call15');
      return { success: true, message: 'Intervention terminée. Passage au débrief.' };
    },
  },
};

export function canExecuteAction(mission: MissionState, actionId: PlayerActionId): boolean {
  const rule = ACTION_RULES[actionId];
  if (!rule) return false;
  if (!rule.requiredPhase.includes(mission.phase)) return false;
  if (rule.prerequisite && !rule.prerequisite(mission)) return false;
  return true;
}

export function executeAction(physio: PhysiologyEngine, mission: MissionState, actionId: PlayerActionId): ActionResult {
  const rule = ACTION_RULES[actionId];
  if (!rule) return { success: false, message: 'Action inconnue.' };
  if (!canExecuteAction(mission, actionId)) {
    return { success: false, message: 'Cette action n\'est pas disponible dans la phase actuelle.' };
  }
  return rule.execute(physio, mission);
}
