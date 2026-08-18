// SimulationV3.tsx — Main V3 simulation screen.
// Connects to the simulation engine via use-simulation hook.
// ONLY receives SessionView — never raw physiological state.

import { useState, useEffect } from 'react';
import { useSimulation } from '../hooks/use-simulation';
import { SCENARIO_TRAUMA_CRANIEN } from '../scenario-v3';
import { WaveformDisplay } from './WaveformDisplay';
import {
  Activity, AlertTriangle, Ambulance, ArrowLeft, ArrowRight, BadgeCheck,
  CheckCircle2, ChevronRight, ClipboardList, Clock3, Crosshair, Droplets,
  Eye, FileText, HeartPulse, Info, MapPin, MessageCircle, Mic, Phone,
  PhoneCall, Radio, RefreshCcw, ShieldAlert, Stethoscope, Thermometer,
  Timer, Truck, UserRound, UsersRound, Wind, Zap,
} from 'lucide-react';
import type { PlayerActionId } from '../engines/action-engine';
import type { TransmissionInfoId } from '../engines/transmission-engine';
import { TRANSMISSION_ITEMS, REGULATOR_QUESTIONS } from '../engines/transmission-engine';

const SCENE_IMAGE = 'https://images.pexels.com/photos/8943080/pexels-photo-8943080.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const PATIENT_IMAGE = 'https://images.pexels.com/photos/6520059/pexels-photo-6520059.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

type Screen = 'mission' | 'scene' | 'patient' | 'actions' | 'call15' | 'result';

const SCENE_ACTIONS = [
  { id: 'secure_scene' as PlayerActionId, icon: ShieldAlert, title: 'SÉCURISER LA ZONE', subtitle: 'Mettre en sécurité le patient et l\'environnement' },
  { id: 'observe_scene' as PlayerActionId, icon: Eye, title: 'OBSERVER L\'ENVIRONNEMENT', subtitle: 'Rechercher dangers, témoins, indices' },
  { id: 'approach_patient' as PlayerActionId, icon: UserRound, title: 'APPROCHER LE PATIENT', subtitle: 'Évaluer l\'état initial et la conscience' },
  { id: 'request_reinforcement' as PlayerActionId, icon: Radio, title: 'DEMANDER RENFORT', subtitle: 'Solliciter un moyen supplémentaire si nécessaire' },
];

const PATIENT_TOOLS = [
  { id: 'apply_spo2_probe' as PlayerActionId, icon: Activity, label: 'Saturomètre', subtitle: 'SpO₂ + FC en continu' },
  { id: 'take_blood_pressure' as PlayerActionId, icon: HeartPulse, label: 'Tensiomètre', subtitle: 'TA snapshot' },
  { id: 'count_respiratory_rate' as PlayerActionId, icon: Wind, label: 'Compter la FR', subtitle: 'Cycles/min' },
  { id: 'take_glucose' as PlayerActionId, icon: Droplets, label: 'Glucomètre', subtitle: 'Dextro g/L' },
  { id: 'take_temperature' as PlayerActionId, icon: Thermometer, label: 'Thermomètre', subtitle: '°C' },
  { id: 'evaluate_consciousness' as PlayerActionId, icon: UserRound, label: 'Évaluer conscience', subtitle: 'AVPU' },
  { id: 'evaluate_glasgow' as PlayerActionId, icon: Crosshair, label: 'Glasgow', subtitle: 'Score complet' },
  { id: 'evaluate_pain' as PlayerActionId, icon: Activity, label: 'Évaluer douleur', subtitle: 'EVA 0-10' },
  { id: 'observe_skin' as PlayerActionId, icon: Eye, label: 'Observer la peau', subtitle: 'Aspect cutané' },
];

const CLINICAL_ACTIONS = [
  { id: 'maintain_axis' as PlayerActionId, icon: ShieldAlert, title: 'Maintenir l\'axe tête-cou-tronc', subtitle: 'Prévenir une aggravation neurologique' },
  { id: 'apply_oxygen' as PlayerActionId, icon: Wind, title: 'Administrer de l\'oxygène', subtitle: 'Oxygénothérapie si indiquée' },
  { id: 'reassure' as PlayerActionId, icon: MessageCircle, title: 'Rassurer le patient', subtitle: 'Calmer pour réduire le stress' },
];

export function SimulationV3({ onExit }: { onExit: () => void }) {
  const scenario = SCENARIO_TRAUMA_CRANIEN;
  const sessionSeed = `session-${scenario.id}-${Date.now()}`;
  const sim = useSimulation(scenario, sessionSeed);
  const [screen, setScreen] = useState<Screen>('mission');
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [selectedClinicalActions, setSelectedClinicalActions] = useState<string[]>([]);
  const [regulatorAnswers, setRegulatorAnswers] = useState<Record<string, boolean>>({});
  const [debrief, setDebrief] = useState<ReturnType<typeof sim.getDebrief> | null>(null);

  // Auto-start the simulation timer when entering patient phase
  useEffect(() => {
    if (screen === 'patient' || screen === 'actions') {
      sim.startSimulation();
    }
    return () => {
      sim.stopSimulation();
    };
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doAction = (actionId: PlayerActionId) => {
    const result = sim.performAction(actionId);
    if (result.success) {
      setActionLog((prev) => [...prev, result.message]);
    }
  };

  const toggleClinicalAction = (actionId: string) => {
    setSelectedClinicalActions((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : prev.length < 3
        ? [...prev, actionId]
        : prev,
    );
  };

  const toggleRegulatorAnswer = (questionId: string) => {
    setRegulatorAnswers((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const finishSimulation = () => {
    const result = sim.getDebrief(selectedClinicalActions);
    setDebrief(result);
    sim.stopSimulation();
    goTo('result');
  };

  const view = sim.view;
  const vitals = view.visibleVitals;
  const spo2Vital = vitals.find((v) => v.vitalId === 'spo2');
  const hrVital = vitals.find((v) => v.vitalId === 'heartRate');
  const rrVital = vitals.find((v) => v.vitalId === 'respiratoryRate');
  const bpVital = vitals.find((v) => v.vitalId === 'bloodPressure') as (typeof vitals)[0] & { valueSecondary: number | null } | undefined;
  const gluVital = vitals.find((v) => v.vitalId === 'glucose');
  const tempVital = vitals.find((v) => v.vitalId === 'temperature');

  return (
    <div className="v3-app">
      <V3TopBar screen={screen} onExit={onExit} />
      {screen === 'mission' && (
        <MissionScreen scenario={scenario} onAccept={() => { sim.goToPhase('scene'); goTo('scene'); }} />
      )}
      {screen === 'scene' && (
        <SceneScreen
          scenario={scenario}
          completedActions={sim.engine.mission.sceneActionsCompleted}
          onAction={doAction}
          canPerform={sim.canPerform}
          onBack={() => goTo('mission')}
          onContinue={() => { sim.goToPhase('patient'); goTo('patient'); }}
        />
      )}
      {screen === 'patient' && (
        <PatientScreen
          scenario={scenario}
          view={view}
          vitals={{ spo2Vital, hrVital, rrVital, bpVital, gluVital, tempVital }}
          onAction={doAction}
          canPerform={sim.canPerform}
          actionLog={actionLog}
          onBack={() => goTo('scene')}
          onContinue={() => { sim.goToPhase('actions'); goTo('actions'); }}
        />
      )}
      {screen === 'actions' && (
        <ActionsScreen
          scenario={scenario}
          selectedActions={selectedClinicalActions}
          onToggle={toggleClinicalAction}
          onValidate={() => { sim.goToPhase('call15'); goTo('call15'); }}
          onBack={() => goTo('patient')}
        />
      )}
      {screen === 'call15' && (
        <Call15Screen
          scenario={scenario}
          selectedInfo={sim.selectedTransmissionInfo}
          onToggleInfo={sim.toggleTransmissionInfo}
          regulatorAnswers={regulatorAnswers}
          onToggleRegulatorAnswer={toggleRegulatorAnswer}
          onFinish={finishSimulation}
          onBack={() => goTo('actions')}
        />
      )}
      {screen === 'result' && debrief && (
        <ResultScreen debrief={debrief} onReplay={() => onExit()} onExit={onExit} />
      )}
      <V3BottomNav screen={screen} onNavigate={goTo} />
    </div>
  );
}

// ── Top Bar ──
function V3TopBar({ screen, onExit }: { screen: Screen; onExit: () => void }) {
  return (
    <header className="v3-topbar">
      <button className="v3-icon-button" onClick={onExit}><ArrowLeft size={22} /></button>
      <div className="v3-top-stat"><Clock3 size={18} /><b>14:37</b></div>
      <div className="v3-top-stat"><HeartPulse size={18} /><b>5/5</b><span>Vies</span></div>
      <div className="v3-brand"><div className="v3-brand-mark"><HeartPulse size={28} /></div><span>MEDOCA</span></div>
      <div className="v3-top-stat"><Zap size={17} /><b>2 450</b><span>Pièces</span></div>
      <div className="v3-level-stat"><span>NIVEAU 12</span><div className="v3-xp-bar"><i /></div><small>2 850 / 4 000 XP</small></div>
      <div className="v3-avatar"><UserRound size={25} /><span>12</span></div>
    </header>
  );
}

// ── Mission Screen ──
function MissionScreen({ scenario, onAccept }: { scenario: typeof SCENARIO_TRAUMA_CRANIEN; onAccept: () => void }) {
  return (
    <main className="v3-screen-wrap v3-mission-screen">
      <div className="v3-section-title-row">
        <div>
          <p className="v3-eyebrow"><span className="v3-live-dot" /> NOUVEL APPEL — CENTRE 15</p>
          <h1>{scenario.title}</h1>
        </div>
        <span className="v3-priority-pill high"><AlertTriangle size={15} /> Mission prioritaire</span>
      </div>
      <section className="v3-glass-panel v3-mission-card">
        <div className="v3-mission-hero" style={{ backgroundImage: `url(${SCENE_IMAGE})` }}>
          <div className="v3-image-overlay" />
          <div className="v3-mission-hero-content">
            <span className="v3-call-chip"><Radio size={14} /> APPEL ENTRANT</span>
            <h2>{scenario.title}</h2>
            <p>{scenario.description}</p>
          </div>
        </div>
        <div className="v3-mission-facts">
          <Fact icon={<MapPin />} label="Lieu" value={scenario.patient.location} />
          <Fact icon={<AlertTriangle />} label="Priorité" value="Élevée" alert />
          <Fact icon={<UsersRound />} label="Équipe" value="Ambulance + binôme" />
          <Fact icon={<MessageCircle />} label="Contexte" value="Appel témoin" />
        </div>
        <div className="v3-received-info">
          <div className="v3-subheading"><FileText size={18} /> INFORMATIONS REÇUES</div>
          <div className="v3-info-list">
            {scenario.patient.dispatchInfo.map((info, i) => <span key={i}>{info}</span>)}
          </div>
          <Activity className="v3-ekg-large" />
        </div>
      </section>
      <div className="v3-mission-actions">
        <button className="v3-big-button accept" onClick={onAccept}>
          <CheckCircle2 size={27} /><span><b>ACCEPTER LA MISSION</b><small>Débuter l'intervention</small></span>
        </button>
      </div>
    </main>
  );
}

// ── Scene Screen ──
function SceneScreen({ scenario, completedActions, onAction, canPerform, onBack, onContinue }: {
  scenario: typeof SCENARIO_TRAUMA_CRANIEN;
  completedActions: string[];
  onAction: (id: PlayerActionId) => void;
  canPerform: (id: PlayerActionId) => boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <main className="v3-screen-wrap v3-scene-screen">
      <PageHeading icon={<MapPin />} eyebrow="INTERVENTION EN COURS" title="Arrivée sur les lieux" subtitle={scenario.patient.chiefComplaint} onBack={onBack} />
      <section className="v3-glass-panel v3-scene-card">
        <div className="v3-scene-image" style={{ backgroundImage: `url(${SCENE_IMAGE})` }}>
          <div className="v3-image-overlay" />
          <div className="v3-weather-pill">☔ 18°C</div>
        </div>
        <div className="v3-scene-meta">
          <Fact icon={<Clock3 />} label="Heure" value={scenario.patient.time} />
          <Fact icon={<MapPin />} label="Localisation" value={scenario.patient.location} />
          <Fact icon={<Crosshair />} label="Distance" value="2,4 km" />
        </div>
        <div className="v3-scene-desc">
          <p className="v3-subheading"><Eye size={18} /> DESCRIPTION DE LA SCÈNE</p>
          <p className="v3-scene-text">{scenario.patient.sceneDescription}</p>
        </div>
        <div className="v3-hazards">
          <p className="v3-subheading"><AlertTriangle size={18} /> RISQUES IDENTIFIÉS</p>
          <div className="v3-hazard-list">
            {scenario.patient.sceneHazards.map((h, i) => (
              <span key={i} className="v3-hazard-chip"><AlertTriangle size={14} /> {h}</span>
            ))}
          </div>
        </div>
        <div className="v3-actions-title">ACTIONS DISPONIBLES</div>
        <div className="v3-scene-actions">
          {SCENE_ACTIONS.map((opt) => {
            const done = completedActions.includes(opt.id);
            const can = canPerform(opt.id);
            return (
              <button key={opt.id} className={`v3-action-row ${done ? 'done' : ''} ${!can ? 'disabled' : ''}`} onClick={() => can && onAction(opt.id)} disabled={!can}>
                <span className="v3-action-icon"><opt.icon size={27} /></span>
                <span><b>{opt.title}</b><small>{done ? 'Action effectuée' : opt.subtitle}</small></span>
                <ChevronRight size={23} />
              </button>
            );
          })}
        </div>
        {completedActions.includes('secure_scene') && completedActions.includes('approach_patient') && (
          <button className="v3-continue-button" onClick={onContinue}>PATIENT APPROCHÉ — COMMENCER LE BILAN <ArrowRight size={18} /></button>
        )}
      </section>
    </main>
  );
}

// ── Patient Screen ──
function PatientScreen({ scenario, view, vitals, onAction, canPerform, actionLog, onBack, onContinue }: {
  scenario: typeof SCENARIO_TRAUMA_CRANIEN;
  view: typeof sim.view;
  vitals: { spo2Vital: any; hrVital: any; rrVital: any; bpVital: any; gluVital: any; tempVital: any };
  onAction: (id: PlayerActionId) => void;
  canPerform: (id: PlayerActionId) => boolean;
  actionLog: string[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const { spo2Vital, hrVital, rrVital, bpVital, gluVital, tempVital } = vitals;
  const measuredCount = view.visibleVitals.filter((v: any) => v.isMeasured).length;
  const completion = Math.round((measuredCount / 6) * 100);
  const canContinue = measuredCount >= 3;

  return (
    <main className="v3-screen-wrap v3-patient-screen">
      <PageHeading icon={<Activity />} eyebrow="CONSTANTES EN DIRECT" title="Surveillance et mesures" subtitle="Patient sous surveillance" onBack={onBack} />
      <section className="v3-glass-panel v3-patient-card">
        <div className="v3-patient-visual" style={{ backgroundImage: `url(${PATIENT_IMAGE})` }}>
          <div className="v3-image-overlay" />
          <div className="v3-patient-status">
            <span className="v3-status-label">ÉTAT DU PATIENT</span>
            <strong><span className="v3-green-dot" /> {view.consciousness.level === 'verbal' ? 'Réagit à la voix' : view.consciousness.level ?? 'Non évalué'}</strong>
            <span><UserRound size={16} /> {scenario.patient.name}, {scenario.patient.age} ans</span>
            <span><MessageCircle size={16} /> Confus</span>
          </div>
          <div className="v3-equipment-status">
            <span className="v3-status-label">MATÉRIEL</span>
            <span className={view.monitoringState.spo2Probe === 'active' ? 'used' : ''}>
              <span className="v3-equipment-dot" />Saturomètre {view.monitoringState.spo2Probe === 'active' && <CheckCircle2 size={14} />}
            </span>
            <span className={view.monitoringState.bpCuff === 'active' ? 'used' : ''}>
              <span className="v3-equipment-dot" />Tensiomètre {view.monitoringState.bpCuff === 'active' && <CheckCircle2 size={14} />}
            </span>
            <span className={view.monitoringState.glucometer === 'active' ? 'used' : ''}>
              <span className="v3-equipment-dot" />Glucomètre {view.monitoringState.glucometer === 'active' && <CheckCircle2 size={14} />}
            </span>
          </div>
        </div>

        <div className="v3-vitals-title">SIGNES VITAUX <span>{completion}% du bilan</span></div>
        <div className="v3-vital-cards">
          <VitalCard label="SpO₂" value={spo2Vital?.value} unit="%" sub="Normal 95-100%" live={spo2Vital?.isLive} stale={spo2Vital?.isStale} signal={spo2Vital?.signalQuality} />
          <VitalCard label="FC" value={hrVital?.value} unit="bpm" sub="Normal 60-100" live={hrVital?.isLive} stale={hrVital?.isStale} signal={hrVital?.signalQuality} />
          <VitalCard label="FR" value={rrVital?.value} unit="/min" sub="Normal 12-20" live={false} stale={rrVital?.isStale} />
          <VitalCard label="TA" value={bpVital?.value} valueSecondary={bpVital?.valueSecondary} unit="mmHg" sub="Snapshot" live={false} stale={bpVital?.isStale} />
          <VitalCard label="Glycémie" value={gluVital?.value} unit="g/L" sub="0.7-1.2" live={false} stale={gluVital?.isStale} />
          <VitalCard label="Temp." value={tempVital?.value} unit="°C" sub="36.5-37.5" live={false} stale={tempVital?.isStale} />
        </div>

        {/* Waveform — only when spo2 probe is active */}
        <div className="v3-waveform-section">
          <WaveformDisplay available={view.waveformState.available} heartRate={view.waveformState.heartRate} signalQuality={view.waveformState.signalQuality} />
        </div>

        {/* Glasgow */}
        <div className="v3-glasgow-section">
          <div className="v3-subheading"><Crosshair size={18} /> GLASGOW</div>
          {view.glasgow.isAssessed ? (
            <div className="v3-glasgow-score">{view.glasgow.score}<span>/15</span></div>
          ) : (
            <div className="v3-glasgow-hidden"><Info size={16} /> Évaluez le Glasgow pour révéler le score</div>
          )}
        </div>

        <div className="v3-measurement-note">
          <Info size={21} />
          <span>{measuredCount === 0 ? 'Utilisez le matériel ci-dessous pour obtenir les constantes.' : `${measuredCount} mesure(s) réalisée(s). Les valeurs live se mettent à jour automatiquement.`}</span>
        </div>

        <div className="v3-measure-section">
          <div className="v3-actions-title">ACTIONS ET MESURES</div>
          <div className="v3-tool-grid">
            {PATIENT_TOOLS.map((tool) => {
              const can = canPerform(tool.id);
              return (
                <button key={tool.id} className={`v3-tool-button ${!can ? 'disabled' : ''}`} onClick={() => can && onAction(tool.id)} disabled={!can}>
                  <tool.icon size={27} />
                  <span><b>{tool.label}</b><small>{tool.subtitle}</small></span>
                </button>
              );
            })}
          </div>
        </div>

        {actionLog.length > 0 && (
          <div className="v3-action-log">
            <div className="v3-subheading"><ClipboardList size={16} /> DERNIÈRES ACTIONS</div>
            {actionLog.slice(-3).map((msg, i) => (
              <div key={i} className="v3-log-entry"><CheckCircle2 size={15} /> {msg}</div>
            ))}
          </div>
        )}

        {canContinue && (
          <button className="v3-continue-button" onClick={onContinue}>BILAN SUFFISANT — CHOISIR LES GESTES <ArrowRight size={18} /></button>
        )}
      </section>
    </main>
  );
}

// ── Actions Screen ──
function ActionsScreen({ scenario, selectedActions, onToggle, onValidate, onBack }: {
  scenario: typeof SCENARIO_TRAUMA_CRANIEN;
  selectedActions: string[];
  onToggle: (id: string) => void;
  onValidate: () => void;
  onBack: () => void;
}) {
  return (
    <main className="v3-screen-wrap v3-actions-screen">
      <PageHeading icon={<Crosshair />} eyebrow="GESTES PRIORITAIRES" title="Choisir les actions adaptées" subtitle="Stabiliser le patient avant le relais" onBack={onBack} />
      <section className="v3-glass-panel v3-actions-hero">
        <div className="v3-action-patient-image" style={{ backgroundImage: `url(${PATIENT_IMAGE})` }}>
          <div className="v3-image-overlay" />
        </div>
        <div className="v3-objective-box">
          <span className="v3-objective-icon"><Crosshair size={28} /></span>
          <div>
            <b>OBJECTIF OPÉRATIONNEL</b>
            <p>Stabiliser le patient, surveiller l'évolution, appliquer les gestes adaptés et transmettre toute aggravation.</p>
          </div>
        </div>
        <div className="v3-actions-title">CHOISIR LES GESTES</div>
        <div className="v3-action-choice-grid">
          {CLINICAL_ACTIONS.map((action) => {
            const selected = selectedActions.includes(action.id);
            return (
              <button key={action.id} className={`v3-choice-card ${selected ? 'selected' : ''}`} onClick={() => onToggle(action.id)}>
                <action.icon size={27} />
                <span><b>{action.title}</b><small>{action.subtitle}</small></span>
                {selected && <CheckCircle2 className="v3-choice-check" size={18} />}
              </button>
            );
          })}
        </div>
        <div className="v3-selection-box">
          <div>
            <span className="v3-actions-title">SÉLECTION EN COURS</span>
            <small>Actions sélectionnées : <b>{selectedActions.length} / 3</b></small>
          </div>
          <div className="v3-selection-items">
            {selectedActions.map((id) => {
              const action = CLINICAL_ACTIONS.find((a) => a.id === id);
              return <span key={id}><CheckCircle2 size={16} /> {action?.title}</span>;
            })}
            {selectedActions.length < 3 && <span className="v3-empty-slot">Choisir une action supplémentaire</span>}
          </div>
        </div>
        <div className="v3-action-footer">
          <button className="v3-footer-action green" onClick={onValidate}><CheckCircle2 size={20} /> VALIDER LES GESTES</button>
          <button className="v3-footer-action blue" onClick={onBack}><ClipboardList size={20} /> RETOUR AU BILAN</button>
        </div>
      </section>
    </main>
  );
}

// ── Call 15 Screen ──
function Call15Screen({ scenario, selectedInfo, onToggleInfo, regulatorAnswers, onToggleRegulatorAnswer, onFinish, onBack }: {
  scenario: typeof SCENARIO_TRAUMA_CRANIEN;
  selectedInfo: TransmissionInfoId[];
  onToggleInfo: (id: TransmissionInfoId) => void;
  regulatorAnswers: Record<string, boolean>;
  onToggleRegulatorAnswer: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  return (
    <main className="v3-screen-wrap v3-call-screen">
      <PageHeading icon={<PhoneCall />} eyebrow="APPEL AU 15" title="Transmission au médecin régulateur" subtitle="Communication en cours" onBack={onBack} />
      <section className="v3-glass-panel v3-call-card">
        <div className="v3-call-image" style={{ backgroundImage: `url(${SCENE_IMAGE})` }}>
          <div className="v3-image-overlay" />
          <div className="v3-call-image-caption">
            <span><Radio size={16} /> SAMU 15</span>
            <b>« Je vous écoute, transmettez votre bilan. »</b>
          </div>
        </div>
        <div className="v3-call-summary">
          <div className="v3-actions-title"><ClipboardList size={18} /> RÉSUMÉ DE L'INTERVENTION</div>
          <div className="v3-summary-columns">
            <div>
              <span><UserRound size={15} /> Patient : {scenario.patient.sex === 'M' ? 'homme' : 'femme'}, {scenario.patient.age} ans</span>
              <span><MessageCircle size={15} /> Motif : {scenario.patient.chiefComplaint}</span>
            </div>
            <div>
              <span><MapPin size={15} /> Lieu : {scenario.patient.location}</span>
              <span><UsersRound size={15} /> Contexte : chute, témoin présent</span>
            </div>
          </div>
        </div>
        <div className="v3-call-selection">
          <div className="v3-actions-title">CHOISIR LES INFORMATIONS À TRANSMETTRE</div>
          <div className="v3-call-info-grid">
            {TRANSMISSION_ITEMS.map((item) => {
              const selected = selectedInfo.includes(item.id);
              return (
                <button key={item.id} className={`v3-call-info ${selected ? 'selected' : ''}`} onClick={() => onToggleInfo(item.id)}>
                  <span className="v3-info-label"><b>{item.label}</b><small>{item.subtitle}</small></span>
                  {selected ? <CheckCircle2 size={16} /> : <span className="v3-empty-circle" />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="v3-regulator-questions">
          <div className="v3-actions-title"><MessageCircle size={18} /> QUESTIONS DU RÉGULATEUR</div>
          {REGULATOR_QUESTIONS.map((q) => (
            <button key={q.id} className={`v3-regulator-q ${regulatorAnswers[q.id] ? 'answered' : ''}`} onClick={() => onToggleRegulatorAnswer(q.id)}>
              <MessageCircle size={16} /> {q.text}
              {regulatorAnswers[q.id] && <CheckCircle2 size={16} />}
            </button>
          ))}
        </div>
        <div className="v3-call-actions">
          <button className="v3-footer-action green" onClick={onFinish}><Mic size={20} /> TRANSMETTRE ET TERMINER</button>
          <button className="v3-footer-action blue" onClick={onBack}><UserRound size={20} /> RETOUR PATIENT</button>
        </div>
      </section>
    </main>
  );
}

// ── Result Screen ──
function ResultScreen({ debrief, onReplay, onExit }: {
  debrief: NonNullable<ReturnType<typeof sim.getDebrief>>;
  onReplay: () => void;
  onExit: () => void;
}) {
  return (
    <main className="v3-screen-wrap v3-result-screen">
      <div className="v3-glass-panel v3-result-card">
        <div className="v3-result-icon"><BadgeCheck size={48} /></div>
        <p className="v3-eyebrow">INTERVENTION TERMINÉE</p>
        <h1>Bilan de mission</h1>
        <p className="v3-result-case">{debrief.clinicalCase}</p>
        <div className="v3-score-ring"><strong>{debrief.totalScore}</strong><span>/100</span></div>
        <p className="v3-score-label">{debrief.summary}</p>
        <div className="v3-result-sections">
          {debrief.sections.map((section, i) => (
            <div key={i} className="v3-result-section">
              <div className="v3-result-section-header">
                <span>{section.title}</span>
                <span className="v3-result-section-score">{section.score}/{section.maxScore}</span>
              </div>
              <div className="v3-result-section-bar">
                <i style={{ width: `${section.maxScore > 0 ? (section.score / section.maxScore) * 100 : 0}%` }} />
              </div>
              <ul>
                {section.feedback.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="v3-result-actions">
          <button className="v3-footer-action green" onClick={onReplay}><RefreshCcw size={20} /> REJOUER</button>
          <button className="v3-footer-action blue" onClick={onExit}><Truck size={20} /> QUITTER</button>
        </div>
      </div>
    </main>
  );
}

// ── Shared components ──
function PageHeading({ icon, eyebrow, title, subtitle, onBack }: { icon: React.ReactNode; eyebrow: string; title: string; subtitle: string; onBack: () => void }) {
  return (
    <div className="v3-page-heading">
      <button className="v3-back-button" onClick={onBack}><ArrowLeft size={25} /></button>
      <div className="v3-heading-icon">{icon}</div>
      <div className="v3-heading-copy">
        <p className="v3-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Fact({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div className="v3-fact">
      <span className="v3-fact-icon">{icon}</span>
      <span><small>{label}</small><b className={alert ? 'v3-alert-text' : ''}>{value}</b></span>
    </div>
  );
}

function VitalCard({ label, value, valueSecondary, unit, sub, live, stale, signal }: {
  label: string;
  value: number | null | undefined;
  valueSecondary?: number | null | undefined;
  unit: string;
  sub: string;
  live?: boolean;
  stale?: boolean;
  signal?: string | null;
}) {
  const isMeasured = value !== null && value !== undefined;
  const danger = isMeasured && (
    (label === 'SpO₂' && (value ?? 100) < 95) ||
    (label === 'FC' && ((value ?? 80) < 50 || (value ?? 80) > 120)) ||
    (label === 'FR' && ((value ?? 18) < 10 || (value ?? 18) > 25))
  );
  return (
    <div className={`v3-vital-card ${stale ? 'stale' : ''} ${live ? 'live' : ''}`}>
      <div className="v3-vital-card-top">
        <span>{label}</span>
        {live && <span className="v3-live-badge">LIVE</span>}
        {stale && <span className="v3-stale-badge">À RÉÉVALUER</span>}
      </div>
      <div className={`v3-vital-value ${danger ? 'v3-danger-text' : isMeasured ? 'v3-normal-text' : 'v3-hidden-text'}`}>
        {isMeasured ? (valueSecondary !== null && valueSecondary !== undefined ? `${value}/${valueSecondary}` : value) : '—'}
        {isMeasured && <span className="v3-vital-unit">{unit}</span>}
      </div>
      <div className={`v3-vital-sub ${danger ? 'v3-danger-text' : 'v3-normal-text'}`}>
        {danger ? 'À surveiller' : isMeasured ? 'Normal' : 'Non mesuré'}
      </div>
      <small>{sub}</small>
    </div>
  );
}

function V3BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  return (
    <nav className="v3-bottom-nav">
      <button className={screen === 'mission' || screen === 'scene' ? 'active' : ''} onClick={() => onNavigate('mission')}><MapPin size={21} /><span>Mission</span></button>
      <button className={screen === 'patient' ? 'active' : ''} onClick={() => onNavigate('patient')}><UserRound size={21} /><span>Patient</span></button>
      <button className={screen === 'patient' ? 'active' : ''} onClick={() => onNavigate('patient')}><Activity size={22} /><span>Surveillance</span></button>
      <button className={screen === 'actions' ? 'active' : ''} onClick={() => onNavigate('actions')}><HeartPulse size={21} /><span>Gestes</span></button>
      <button onClick={() => onNavigate('mission')}><PhoneCall size={21} /><span>Menu</span></button>
    </nav>
  );
}
