import type { CaseScenario, ExaminationFindings } from '../types';
import { Section, Field, SelectInput, Toggle, TextArea, HintBox, Button, InfoBanner } from './ui';
import { Stethoscope, ArrowRight, Heart, Wind, Droplets } from 'lucide-react';

export function ExaminationStep({
  scenario,
  findings,
  onChange,
  onContinue,
}: {
  scenario: CaseScenario;
  findings: ExaminationFindings;
  onChange: (v: ExaminationFindings) => void;
  onContinue: () => void;
}) {
  const update = (field: keyof ExaminationFindings, value: ExaminationFindings[keyof ExaminationFindings]) => {
    onChange({ ...findings, [field]: value });
  };

  return (
    <div className="space-y-5">
      <Section
        title="Examen clinique — ABCDE"
        subtitle="Évaluation systématique : Voies aériennes, Respiration, Circulation, Déficit, Examen complet"
        icon={<Stethoscope className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="A — Voies aériennes">
              <SelectInput
                value={findings.airway}
                onChange={(v) => update('airway', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'clear', label: 'Libres' },
                  { value: 'partially_obstructed', label: 'Partiellement obstruées' },
                  { value: 'obstructed', label: 'Obstruées' },
                ]}
              />
            </Field>

            <Field label="B — Respiration">
              <SelectInput
                value={findings.breathing}
                onChange={(v) => update('breathing', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'normal', label: 'Normale' },
                  { value: 'labored', label: 'Laborieuse' },
                  { value: 'rapid', label: 'Rapide (tachypnée)' },
                  { value: 'shallow', label: 'Superficielle' },
                  { value: 'absent', label: 'Absente' },
                ]}
              />
            </Field>

            <Field label="C — Circulation">
              <SelectInput
                value={findings.circulation}
                onChange={(v) => update('circulation', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'normal', label: 'Normale' },
                  { value: 'weak', label: 'Filant / faible' },
                  { value: 'strong', label: 'Forte / bondée' },
                  { value: 'absent', label: 'Absente' },
                ]}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ABCDCard
              letter="A"
              icon={<Wind className="h-4 w-4" />}
              label="Voies aériennes"
              status={findings.airway}
              good={findings.airway === 'clear'}
            />
            <ABCDCard
              letter="B"
              icon={<Stethoscope className="h-4 w-4" />}
              label="Respiration"
              status={findings.breathing}
              good={findings.breathing === 'normal'}
            />
            <ABCDCard
              letter="C"
              icon={<Heart className="h-4 w-4" />}
              label="Circulation"
              status={findings.circulation}
              good={findings.circulation === 'normal'}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">
              D & E — Recherche de lésions traumatiques
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Toggle checked={findings.traumaHead} onChange={(v) => update('traumaHead', v)} label="Tête" />
              <Toggle checked={findings.traumaNeck} onChange={(v) => update('traumaNeck', v)} label="Cou / Rachis" />
              <Toggle checked={findings.traumaChest} onChange={(v) => update('traumaChest', v)} label="Thorax" />
              <Toggle checked={findings.traumaAbdomen} onChange={(v) => update('traumaAbdomen', v)} label="Abdomen" />
              <Toggle checked={findings.traumaPelvis} onChange={(v) => update('traumaPelvis', v)} label="Bassin" />
              <Toggle checked={findings.traumaLimbs} onChange={(v) => update('traumaLimbs', v)} label="Membres" />
              <Toggle checked={findings.traumaBack} onChange={(v) => update('traumaBack', v)} label="Dos" />
              <Toggle checked={findings.bleedingExternal} onChange={(v) => update('bleedingExternal', v)} label="Saignement ext." />
              <Toggle checked={findings.fracturesVisible} onChange={(v) => update('fracturesVisible', v)} label="Fracture visible" />
              <Toggle checked={findings.burns} onChange={(v) => update('burns', v)} label="Brûlures" />
            </div>
          </div>

          <Field label="Notes cliniques" hint="Observations complémentaires, auscultation, palpation...">
            <TextArea
              value={findings.notes}
              onChange={(v) => update('notes', v)}
              placeholder="ex: Auscultation pulmonaire : murmure vésiculaire présent bilatéralement..."
              rows={3}
            />
          </Field>
        </div>
      </Section>

      <HintBox hints={scenario.hints.examination} />

      <InfoBanner>
        L'examen ABCDE est systématique : ne sautez aucune étape. Chaque anomalie doit être notée.
      </InfoBanner>

      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Bilan lésionnel
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ABCDCard({
  letter,
  icon,
  label,
  status,
  good,
}: {
  letter: string;
  icon: React.ReactNode;
  label: string;
  status: string | null;
  good: boolean;
}) {
  const isSet = status !== null;
  const color = !isSet
    ? 'border-slate-200 bg-slate-50'
    : good
    ? 'border-emerald-200 bg-emerald-50'
    : 'border-rose-200 bg-rose-50';
  const text = !isSet ? 'text-slate-400' : good ? 'text-emerald-700' : 'text-rose-700';

  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${text} bg-white/60`}>
          {letter}
        </span>
        {icon}
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <p className={`text-sm font-medium ${text}`}>
        {isSet ? status : 'Non évalué'}
      </p>
    </div>
  );
}
