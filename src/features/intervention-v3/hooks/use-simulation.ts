// use-simulation.ts — React hook that bridges the simulation engine to the UI.
// Returns ONLY a SessionView — the UI never touches raw physiological state.
// The hook manages the tick loop, phase transitions, and action dispatch.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createSimulation, type SimulationEngine } from '../engines/simulation-engine';
import type { PlayerActionId, ActionResult } from '../engines/action-engine';
import type { MissionPhase } from '../engines/mission-state';
import type { TransmissionInfoId } from '../engines/transmission-engine';
import type { SessionView } from '../physiology/physiology-selectors';
import type { ScenarioV3 } from '../scenario-v3';

export interface UseSimulationReturn {
  view: SessionView;
  phase: MissionPhase;
  lastActionResult: ActionResult | null;
  isRunning: boolean;
  performAction: (actionId: PlayerActionId) => void;
  goToPhase: (phase: MissionPhase) => void;
  toggleTransmissionInfo: (infoId: TransmissionInfoId) => void;
  selectedTransmissionInfo: TransmissionInfoId[];
  canPerform: (actionId: PlayerActionId) => boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  getDebrief: (selectedActionIds: string[]) => ReturnType<SimulationEngine['getDebrief']>;
  engine: SimulationEngine;
}

export function useSimulation(scenario: ScenarioV3, sessionSeed: string): UseSimulationReturn {
  const engineRef = useRef<SimulationEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createSimulation(scenario.profile, sessionSeed);
  }
  const engine = engineRef.current;

  const [view, setView] = useState<SessionView>(() => engine.getView());
  const [phase, setPhase] = useState<MissionPhase>('dispatch');
  const [lastActionResult, setLastActionResult] = useState<ActionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTransmissionInfo, setSelectedTransmissionInfo] = useState<TransmissionInfoId[]>([]);
  const [, forceUpdate] = useState(0);

  // Tick loop — advances physiology every 2 seconds when running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      engine.tick();
      setView(engine.getView());
      forceUpdate((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [engine, isRunning]);

  const performAction = useCallback(
    (actionId: PlayerActionId) => {
      const result = engine.performAction(actionId);
      setLastActionResult(result);
      setView(engine.getView());
      forceUpdate((n) => n + 1);
    },
    [engine],
  );

  const goToPhase = useCallback(
    (newPhase: MissionPhase) => {
      engine.goToPhase(newPhase);
      setPhase(newPhase);
      setView(engine.getView());
      forceUpdate((n) => n + 1);
    },
    [engine],
  );

  const toggleTransmissionInfo = useCallback(
    (infoId: TransmissionInfoId) => {
      engine.toggleTransmissionInfo(infoId);
      setSelectedTransmissionInfo([...engine.transmission.selectedInfo]);
    },
    [engine],
  );

  const startSimulation = useCallback(() => {
    engine.start();
    setIsRunning(true);
  }, [engine]);

  const stopSimulation = useCallback(() => {
    engine.stop();
    setIsRunning(false);
  }, [engine]);

  const canPerform = useCallback(
    (actionId: PlayerActionId) => engine.canPerform(actionId),
    [engine],
  );

  const getDebrief = useCallback(
    (selectedActionIds: string[]) => engine.getDebrief(selectedActionIds),
    [engine],
  );

  return useMemo(
    () => ({
      view,
      phase,
      lastActionResult,
      isRunning,
      performAction,
      goToPhase,
      toggleTransmissionInfo,
      selectedTransmissionInfo,
      canPerform,
      startSimulation,
      stopSimulation,
      getDebrief,
      engine,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, phase, lastActionResult, isRunning, selectedTransmissionInfo],
  );
}
