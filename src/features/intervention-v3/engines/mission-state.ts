// mission-state.ts — Mission configuration and progression state.
// Defines the mission phases, objectives, and what actions are available at each step.

export type MissionPhase =
  | 'dispatch'
  | 'scene'
  | 'patient'
  | 'actions'
  | 'call15'
  | 'result';

export interface MissionObjective {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export interface MissionState {
  phase: MissionPhase;
  phaseHistory: MissionPhase[];
  objectives: MissionObjective[];
  sceneActionsCompleted: string[];
  startTime: number;
  elapsedSeconds: number;
  score: number;
}

export function createMissionState(): MissionState {
  return {
    phase: 'dispatch',
    phaseHistory: [],
    objectives: [
      { id: 'secure_scene', label: 'Sécuriser la zone', completed: false, required: true },
      { id: 'observe_scene', label: 'Observer l\'environnement', completed: false, required: true },
      { id: 'approach_patient', label: 'Approcher le patient', completed: false, required: true },
      { id: 'measure_spo2', label: 'Poser le saturomètre', completed: false, required: true },
      { id: 'measure_bp', label: 'Prendre la tension', completed: false, required: false },
      { id: 'measure_glucose', label: 'Mesurer la glycémie', completed: false, required: false },
      { id: 'evaluate_glasgow', label: 'Évaluer le Glasgow', completed: false, required: true },
      { id: 'perform_actions', label: 'Choisir les gestes adaptés', completed: false, required: true },
      { id: 'transmit_call15', label: 'Transmettre au Centre 15', completed: false, required: true },
    ],
    sceneActionsCompleted: [],
    startTime: Date.now(),
    elapsedSeconds: 0,
    score: 0,
  };
}

export function advancePhase(mission: MissionState, phase: MissionPhase): void {
  if (mission.phase !== phase) {
    mission.phaseHistory.push(mission.phase);
    mission.phase = phase;
  }
}

export function completeObjective(mission: MissionState, objectiveId: string): void {
  const obj = mission.objectives.find((o) => o.id === objectiveId);
  if (obj) obj.completed = true;
}

export function isObjectiveCompleted(mission: MissionState, objectiveId: string): boolean {
  return mission.objectives.find((o) => o.id === objectiveId)?.completed ?? false;
}
