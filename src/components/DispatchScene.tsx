import type { CaseScenario } from '../types';
import { Section, InfoBanner, Button, HintBox } from './ui';
import { MapPin, Clock, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export function DispatchScene({
  scenario,
  onContinue,
}: {
  scenario: CaseScenario;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <Section
        title="Alerte — Régulation"
        subtitle="Vous êtes l'équipage ambulancier SMUR en intervention"
        icon={<ShieldAlert className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700">Lieu</p>
              <p className="text-sm text-slate-600">{scenario.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-700">Heure de l'alerte</p>
              <p className="text-sm text-slate-600">{scenario.time}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-sm text-slate-600 leading-relaxed">{scenario.description}</p>
          </div>
        </div>
      </Section>

      <Section
        title="Arrivée sur scène"
        subtitle="Évaluation de la situation et sécurisation"
        icon={<AlertTriangle className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Description de la scène</p>
            <p className="text-sm text-slate-600 leading-relaxed">{scenario.sceneDescription}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Risques identifiés sur la scène</p>
            <div className="flex flex-wrap gap-2">
              {scenario.sceneHazards.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm text-amber-800"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {h}
                </span>
              ))}
            </div>
          </div>

          <InfoBanner variant="warning">
            Avant toute approche du patient, sécurisez la zone, évaluez les risques résiduels et
            portez vos EPI.
          </InfoBanner>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Patient</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Info label="Âge" value={`${scenario.patient.age} ans`} />
              <Info label="Sexe" value={scenario.patient.sex === 'M' ? 'Homme' : 'Femme'} />
              <Info label="Motif" value={scenario.chiefComplaint} />
              <Info label="Antécédents" value={scenario.patient.history} />
            </div>
          </div>
        </div>
      </Section>

      <HintBox hints={scenario.hints.dispatch} />

      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Commencer le bilan vital
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 font-medium">{value}</p>
    </div>
  );
}
