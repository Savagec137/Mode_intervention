// App.tsx — Entry point. Routes to the V3 simulation engine.
// The old V2 code is replaced by the new architecture with the physiology engine.

import { useState } from 'react';
import { SimulationV3 } from '@/features/intervention-v3/components/SimulationV3';
import { Truck, HeartPulse, Zap, Clock3, UserRound } from 'lucide-react';

function App() {
  const [started, setStarted] = useState(false);

  if (started) {
    return <SimulationV3 onExit={() => setStarted(false)} />;
  }

  return (
    <div className="v3-app v3-launch-screen">
      <header className="v3-topbar">
        <div className="v3-top-stat"><Clock3 size={18} /><b>14:37</b></div>
        <div className="v3-top-stat"><HeartPulse size={18} /><b>5/5</b><span>Vies</span></div>
        <div className="v3-brand"><div className="v3-brand-mark"><HeartPulse size={28} /></div><span>MEDOCA</span></div>
        <div className="v3-top-stat"><Zap size={17} /><b>2 450</b><span>Pièces</span></div>
        <div className="v3-level-stat"><span>NIVEAU 12</span><div className="v3-xp-bar"><i /></div><small>2 850 / 4 000 XP</small></div>
        <div className="v3-avatar"><UserRound size={25} /><span>12</span></div>
      </header>
      <main className="v3-screen-wrap v3-mission-screen">
        <div className="v3-section-title-row">
          <div>
            <p className="v3-eyebrow"><span className="v3-live-dot" /> SIMULATEUR D'INTERVENTION — V3</p>
            <h1>Medoca — Simulation ambulancière</h1>
          </div>
        </div>
        <section className="v3-glass-panel v3-mission-card">
          <div className="v3-mission-hero" style={{ backgroundImage: `url(https://images.pexels.com/photos/8943080/pexels-photo-8943080.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)` }}>
            <div className="v3-image-overlay" />
            <div className="v3-mission-hero-content">
              <span className="v3-call-chip"><Truck size={14} /> MOTEUR V3</span>
              <h2>Simulation physiologique réaliste</h2>
              <p>Un moteur physiologique fait vivre les constantes du patient. Aucune donnée clinique n'est affichée sans action de votre part. Posez le matériel, évaluez, choisissez les gestes, transmettez au Centre 15.</p>
            </div>
          </div>
          <div className="v3-mission-facts">
            <div className="v3-fact"><span className="v3-fact-icon"><HeartPulse /></span><span><small>Moteur</small><b>Physiologique</b></span></div>
            <div className="v3-fact"><span className="v3-fact-icon"><Zap /></span><span><small>Constantes</small><b>Animées en direct</b></span></div>
            <div className="v3-fact"><span className="v3-fact-icon"><Clock3 /></span><span><small>Anti-fuite</small><b>Selectors uniquement</b></span></div>
            <div className="v3-fact"><span className="v3-fact-icon"><UserRound /></span><span><b>1 scénario</b></span></div>
          </div>
        </section>
        <div className="v3-mission-actions">
          <button className="v3-big-button accept" onClick={() => setStarted(true)}>
            <Truck size={27} /><span><b>LANCER LA SIMULATION</b><small>Traumatisme crânien — Chute</small></span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
