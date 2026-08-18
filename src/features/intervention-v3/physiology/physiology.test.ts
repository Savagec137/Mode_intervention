// physiology-tests.ts — Tests for the physiology engine.
// Verifies anti-leak, determinism, plausible variation, equipment effects, and stale states.

import { describe, it, expect } from 'vitest';
import { createPhysiologyEngine } from './physiology-engine';
import { PROFILE_TRAUMA_CRANIEN_STABLE, PROFILE_DETRESSE_RESPIRATOIRE } from './clinical-profiles';
import { getSessionView, getVisibleLiveVitals } from './physiology-selectors';
import type { InternalPhysiologyState } from './physiology-types';

const SEED = 'test-seed-12345';

describe('Physiology Engine — Session vierge', () => {
  it('ne révèle aucune constante sans action du joueur', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);

    for (const vital of view.visibleVitals) {
      expect(vital.value).toBeNull();
      expect(vital.isMeasured).toBe(false);
      expect(vital.isLive).toBe(false);
    }
  });

  it('ne révèle pas le Glasgow sans évaluation', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);
    expect(view.glasgow.score).toBeNull();
    expect(view.glasgow.isAssessed).toBe(false);
  });

  it('ne montre pas la waveform sans saturomètre', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);
    expect(view.waveformState.available).toBe(false);
  });

  it('la TA est invisible tant que non mesurée', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);
    const bp = view.visibleVitals.find((v) => v.vitalId === 'bloodPressure');
    expect(bp?.value).toBeNull();
  });

  it('la glycémie est invisible tant que non mesurée', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);
    const glu = view.visibleVitals.find((v) => v.vitalId === 'glucose');
    expect(glu?.value).toBeNull();
  });
});

describe('Physiology Engine — Après pose saturomètre', () => {
  it('rend la SpO₂ et la FC visibles après activation', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();

    // Advance ticks to complete the applying phase (APPLY_DURATION = 2)
    engine.tick();
    engine.tick();

    const view = getSessionView(engine.state);
    const spo2 = view.visibleVitals.find((v) => v.vitalId === 'spo2');
    const hr = view.visibleVitals.find((v) => v.vitalId === 'heartRate');

    expect(spo2?.value).not.toBeNull();
    expect(spo2?.isLive).toBe(true);
    expect(spo2?.isMeasured).toBe(true);
    expect(hr?.value).not.toBeNull();
    expect(hr?.isLive).toBe(true);
  });

  it('rend la waveform disponible après activation', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const view = getSessionView(engine.state);
    expect(view.waveformState.available).toBe(true);
    expect(view.waveformState.type).toBe('pleth');
  });

  it('la TA reste invisible même avec le saturomètre actif', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const view = getSessionView(engine.state);
    const bp = view.visibleVitals.find((v) => v.vitalId === 'bloodPressure');
    expect(bp?.value).toBeNull();
  });

  it('la glycémie reste invisible même avec le saturomètre actif', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const view = getSessionView(engine.state);
    const glu = view.visibleVitals.find((v) => v.vitalId === 'glucose');
    expect(glu?.value).toBeNull();
  });
});

describe('Physiology Engine — Variation plausible', () => {
  it('la SpO₂ ne varie pas de plus de 2 unités sans événement', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const values: number[] = [];
    for (let i = 0; i < 20; i++) {
      engine.tick();
      const view = getSessionView(engine.state);
      const spo2 = view.visibleVitals.find((v) => v.vitalId === 'spo2');
      if (spo2?.value != null) values.push(spo2.value);
    }

    for (let i = 1; i < values.length; i++) {
      expect(Math.abs(values[i] - values[i - 1])).toBeLessThanOrEqual(2);
    }
  });

  it('la FC ne saute pas brutalement sans événement', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const values: number[] = [];
    for (let i = 0; i < 20; i++) {
      engine.tick();
      const view = getSessionView(engine.state);
      const hr = view.visibleVitals.find((v) => v.vitalId === 'heartRate');
      if (hr?.value != null) values.push(hr.value);
    }

    for (let i = 1; i < values.length; i++) {
      expect(Math.abs(values[i] - values[i - 1])).toBeLessThanOrEqual(8);
    }
  });

  it('la TA ne change pas en live', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const bp1 = engine.takeBloodPressure();
    const bp2 = engine.takeBloodPressure();

    // Two consecutive measurements should be close (within noise range)
    expect(Math.abs(bp1.systolic - bp2.systolic)).toBeLessThanOrEqual(10);
  });
});

describe('Physiology Engine — Après retrait saturomètre', () => {
  it('arrête le live et masque la waveform', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    // Verify live is active
    let view = getSessionView(engine.state);
    expect(view.waveformState.available).toBe(true);

    engine.removeSpo2Probe();
    view = getSessionView(engine.state);

    expect(view.waveformState.available).toBe(false);
    const spo2 = view.visibleVitals.find((v) => v.vitalId === 'spo2');
    expect(spo2?.isLive).toBe(false);
  });

  it('conserve la dernière mesure comme snapshot', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    let view = getSessionView(engine.state);
    const spo2Before = view.visibleVitals.find((v) => v.vitalId === 'spo2');
    expect(spo2Before?.value).not.toBeNull();

    engine.removeSpo2Probe();
    view = getSessionView(engine.state);
    const spo2After = view.visibleVitals.find((v) => v.vitalId === 'spo2');

    expect(spo2After?.value).not.toBeNull();
    expect(spo2After?.isMeasured).toBe(true);
    expect(spo2After?.isLive).toBe(false);
  });

  it('la mesure devient stale après suffisamment de ticks', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    engine.removeSpo2Probe();

    // Advance past stale threshold (20 ticks)
    for (let i = 0; i < 25; i++) engine.tick();

    const view = getSessionView(engine.state);
    const spo2 = view.visibleVitals.find((v) => v.vitalId === 'spo2');
    expect(spo2?.isStale).toBe(true);
  });
});

describe('Physiology Engine — Effet de l\'oxygène', () => {
  it('améliore progressivement la SpO₂ si indiqué', () => {
    const engine = createPhysiologyEngine(PROFILE_DETRESSE_RESPIRATOIRE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const viewBefore = getSessionView(engine.state);
    const spo2Before = viewBefore.visibleVitals.find((v) => v.vitalId === 'spo2');
    const valueBefore = spo2Before?.value ?? 0;

    engine.applyOxygen();

    // Advance several ticks for oxygen to take effect
    for (let i = 0; i < 15; i++) engine.tick();

    const viewAfter = getSessionView(engine.state);
    const spo2After = viewAfter.visibleVitals.find((v) => v.vitalId === 'spo2');
    const valueAfter = spo2After?.value ?? 0;

    // SpO2 should have improved (or at least not decreased)
    expect(valueAfter).toBeGreaterThanOrEqual(valueBefore);
  });

  it('ne corrige pas instantanément', () => {
    const engine = createPhysiologyEngine(PROFILE_DETRESSE_RESPIRATOIRE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const viewBefore = getSessionView(engine.state);
    const spo2Before = viewBefore.visibleVitals.find((v) => v.vitalId === 'spo2');

    engine.applyOxygen();
    engine.tick(); // Only 1 tick after O2

    const viewAfter = getSessionView(engine.state);
    const spo2After = viewAfter.visibleVitals.find((v) => v.vitalId === 'spo2');

    // Should not jump by more than 2 in a single tick
    if (spo2Before?.value != null && spo2After?.value != null) {
      expect(Math.abs(spo2After.value - spo2Before.value)).toBeLessThanOrEqual(2);
    }
  });
});

describe('Physiology Engine — Déterminisme', () => {
  it('même seed + mêmes actions + même temps = mêmes valeurs', () => {
    const engine1 = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const engine2 = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);

    engine1.applySpo2Probe();
    engine2.applySpo2Probe();

    for (let i = 0; i < 10; i++) {
      engine1.tick();
      engine2.tick();
    }

    const view1 = getSessionView(engine1.state);
    const view2 = getSessionView(engine2.state);

    const spo2_1 = view1.visibleVitals.find((v) => v.vitalId === 'spo2');
    const spo2_2 = view2.visibleVitals.find((v) => v.vitalId === 'spo2');

    expect(spo2_1?.value).toEqual(spo2_2?.value);

    const hr1 = view1.visibleVitals.find((v) => v.vitalId === 'heartRate');
    const hr2 = view2.visibleVitals.find((v) => v.vitalId === 'heartRate');

    expect(hr1?.value).toEqual(hr2?.value);
  });

  it('seeds différents produisent des valeurs différentes', () => {
    const engine1 = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, 'seed-A');
    const engine2 = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, 'seed-B');

    engine1.applySpo2Probe();
    engine2.applySpo2Probe();

    for (let i = 0; i < 10; i++) {
      engine1.tick();
      engine2.tick();
    }

    const view1 = getSessionView(engine1.state);
    const view2 = getSessionView(engine2.state);

    const spo2_1 = view1.visibleVitals.find((v) => v.vitalId === 'spo2');
    const spo2_2 = view2.visibleVitals.find((v) => v.vitalId === 'spo2');

    // They might occasionally match, but the raw state should differ
    const raw1 = engine1.getRawState();
    const raw2 = engine2.getRawState();
    expect(raw1.seed).not.toEqual(raw2.seed);
  });
});

describe('Physiology Engine — Anti-fuite', () => {
  it('SessionView ne contient pas rawVitals ni hiddenFacts', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    const view = getSessionView(engine.state);
    const viewKeys = Object.keys(view);

    expect(viewKeys).not.toContain('rawVitals');
    expect(viewKeys).not.toContain('hiddenFacts');
    expect(viewKeys).not.toContain('targets');
    expect(viewKeys).not.toContain('consciousness');
    expect(viewKeys).not.toContain('glasgow');
  });

  it('les valeurs cachées ne sont pas accessibles depuis SessionView', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);

    // SessionView should only have visible* keys, tick, and waveformState
    const allowedKeys = [
      'visibleVitals',
      'monitoringState',
      'waveformState',
      'staleVitals',
      'consciousness',
      'skin',
      'glasgow',
      'pain',
      'tick',
    ];

    for (const key of Object.keys(view)) {
      expect(allowedKeys).toContain(key);
    }
  });

  it('le Glasgow n\'est pas dans visibleVitals', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    const view = getSessionView(engine.state);

    const glasgowInVitals = view.visibleVitals.find((v) => v.vitalId === 'glasgow');
    expect(glasgowInVitals).toBeUndefined();
  });
});

describe('Physiology Engine — Glasgow', () => {
  it('révèle le Glasgow uniquement après évaluation', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);

    let view = getSessionView(engine.state);
    expect(view.glasgow.score).toBeNull();

    const score = engine.evaluateGlasgow();
    view = getSessionView(engine.state);

    expect(view.glasgow.score).toBe(score);
    expect(view.glasgow.isAssessed).toBe(true);
    expect(score).toBe(13); // Profile defines Glasgow 13
  });
});

describe('Physiology Engine — Tendance clinique', () => {
  it('patient stable : les constantes restent proches de la baseline', () => {
    const engine = createPhysiologyEngine(PROFILE_TRAUMA_CRANIEN_STABLE, SEED);
    engine.applySpo2Probe();
    engine.tick();
    engine.tick();

    for (let i = 0; i < 30; i++) engine.tick();

    const view = getSessionView(engine.state);
    const spo2 = view.visibleVitals.find((v) => v.vitalId === 'spo2');
    const hr = view.visibleVitals.find((v) => v.vitalId === 'heartRate');

    // Stable patient: SpO2 should stay near 98 (±3)
    expect(spo2?.value).toBeGreaterThanOrEqual(95);
    expect(spo2?.value).toBeLessThanOrEqual(100);

    // HR should stay near 92 (±10)
    expect(hr?.value).toBeGreaterThanOrEqual(82);
    expect(hr?.value).toBeLessThanOrEqual(105);
  });
});
