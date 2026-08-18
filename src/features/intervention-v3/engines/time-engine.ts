// time-engine.ts — Manages simulation time, ticking the physiology engine at a fixed rate.

import type { PhysiologyEngine } from '../physiology/physiology-engine';

export interface TimeEngine {
  start(): void;
  stop(): void;
  tick(): void;
  getElapsedTicks(): number;
  isRunning(): boolean;
}

export function createTimeEngine(physioEngine: PhysiologyEngine, intervalMs: number = 2000): TimeEngine {
  let interval: ReturnType<typeof setInterval> | null = null;
  let elapsedTicks = 0;
  let running = false;

  function start(): void {
    if (running) return;
    running = true;
    interval = setInterval(() => {
      physioEngine.tick();
      elapsedTicks++;
    }, intervalMs);
  }

  function stop(): void {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    running = false;
  }

  function tick(): void {
    physioEngine.tick();
    elapsedTicks++;
  }

  function getElapsedTicks(): number {
    return elapsedTicks;
  }

  function isRunning(): boolean {
    return running;
  }

  return { start, stop, tick, getElapsedTicks, isRunning };
}
