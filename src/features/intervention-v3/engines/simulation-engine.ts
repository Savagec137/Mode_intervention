// simulation-engine.ts — Top-level orchestrator.
// Brings together physiology, mission, action, transmission, and debrief engines.
// Exposes ONLY a SessionView to the UI — never raw physiological state.

import type { PhysiologyEngine } from '../physiology/physiology-engine';
import { createPhysiologyEngine } from '../physiology/physiology-engine';
import { getSessionView, type SessionView } from '../physiology/physiology-selectors';
import type { ClinicalProfile } from '../physiology/physiology-types';
import { createMissionState, advancePhase, type MissionState, type MissionPhase } from './mission-state';
import { executeAction, canExecuteAction, type PlayerActionId, type ActionResult, ACTION_RULES } from './action-engine';
import { createTransmissionState, toggleInfoSelection, type TransmissionState, type TransmissionInfoId } from './transmission-engine';
import { generateDebrief, type DebriefResult } from './debrief-engine';
import { createTimeEngine, type TimeEngine } from './time-engine';

export interface SimulationEngine {
  physio: PhysiologyEngine;
  mission: MissionState;
  transmission: TransmissionState;
  time: TimeEngine;

  start(): void;
  stop(): void;
  tick(): void;
  getView(): SessionView;
  performAction(actionId: PlayerActionId): ActionResult;
  canPerform(actionId: PlayerActionId): boolean;
  goToPhase(phase: MissionPhase): void;
  toggleTransmissionInfo(infoId: TransmissionInfoId): void;
  getDebrief(selectedActionIds: string[]): DebriefResult;
  getActionRules(): typeof ACTION_RULES;
}

export function createSimulation(profile: ClinicalProfile, sessionSeed: string): SimulationEngine {
  const physio = createPhysiologyEngine(profile, sessionSeed);
  const mission = createMissionState();
  const transmission = createTransmissionState();
  const time = createTimeEngine(physio, 2000);

  function start(): void {
    time.start();
  }

  function stop(): void {
    time.stop();
  }

  function tick(): void {
    physio.tick();
  }

  function getView(): SessionView {
    return getSessionView(physio.state);
  }

  function performAction(actionId: PlayerActionId): ActionResult {
    return executeAction(physio, mission, actionId);
  }

  function canPerform(actionId: PlayerActionId): boolean {
    return canExecuteAction(mission, actionId);
  }

  function goToPhase(phase: MissionPhase): void {
    advancePhase(mission, phase);
  }

  function toggleTransmissionInfo(infoId: TransmissionInfoId): void {
    toggleInfoSelection(transmission, infoId);
  }

  function getDebrief(selectedActionIds: string[]): DebriefResult {
    return generateDebrief(mission, transmission, physio.state, profile, selectedActionIds);
  }

  return {
    physio,
    mission,
    transmission,
    time,
    start,
    stop,
    tick,
    getView,
    performAction,
    canPerform,
    goToPhase,
    toggleTransmissionInfo,
    getDebrief,
    getActionRules: () => ACTION_RULES,
  };
}
