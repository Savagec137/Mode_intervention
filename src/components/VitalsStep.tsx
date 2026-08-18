import type { CaseScenario, VitalSigns } from '../types';
import { Section, Field, NumberInput, SelectInput, HintBox, Button, InfoBanner } from './ui';
import { Activity, HeartPulse, Droplet, Thermometer, Eye, Hand, ArrowRight } from 'lucide-react';

export function VitalsStep({
  scenario,
  vitals,
  onChange,
  onContinue,
}: {
  scenario: CaseScenario;
  vitals: VitalSigns;
  onChange: (v: VitalSigns) => void;
  onContinue: () => void;
}) {
  const update = (field: keyof VitalSigns, value: VitalSigns[keyof VitalSigns]) => {
    onChange({ ...vitals, [field]: value });
  };

  return (
    <div className="space-y-5">
      <Section
        title="Bilan vital — Constantes"
        subtitle="Mesurez et enregistrez les paramètres vitaux du patient"
        icon={<Activity className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Conscience (AVPU)">
              <SelectInput
                value={vitals.consciousness}
                onChange={(v) => update('consciousness', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'alert', label: 'Alerte (conscient)' },
                  { value: 'verbal', label: 'Réagit à la voix' },
                  { value: 'pain', label: 'Réagit à la douleur' },
                  { value: 'unresponsive', label: 'Inconscient' },
                ]}
              />
            </Field>

            <Field label="Fréquence respiratoire" hint="Respirations par minute">
              <NumberInput
                value={vitals.respiratoryRate}
                onChange={(v) => update('respiratoryRate', v)}
                placeholder="ex: 18"
                unit="/min"
                min={0}
                max={60}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fréquence cardiaque" hint="Pouls par minute">
              <div className="relative">
                <HeartPulse className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                <input
                  type="number"
                  value={vitals.heartRate ?? ''}
                  onChange={(e) => update('heartRate', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="ex: 80"
                  min={0}
                  max={250}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-12 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">/min</span>
              </div>
            </Field>

            <Field label="Tension artérielle" hint="Systolique / Diastolique (mmHg)">
              <div className="flex items-center gap-2">
                <NumberInput
                  value={vitals.bloodPressureSystolic}
                  onChange={(v) => update('bloodPressureSystolic', v)}
                  placeholder="Syst."
                  min={0}
                  max={300}
                />
                <span className="text-slate-400 font-medium">/</span>
                <NumberInput
                  value={vitals.bloodPressureDiastolic}
                  onChange={(v) => update('bloodPressureDiastolic', v)}
                  placeholder="Diast."
                  min={0}
                  max={200}
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Saturation (SpO2)">
              <div className="relative">
                <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500" />
                <input
                  type="number"
                  value={vitals.spo2 ?? ''}
                  onChange={(e) => update('spo2', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="ex: 98"
                  min={0}
                  max={100}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">%</span>
              </div>
            </Field>

            <Field label="Température">
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-500" />
                <input
                  type="number"
                  value={vitals.temperature ?? ''}
                  onChange={(e) => update('temperature', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="ex: 37.0"
                  min={30}
                  max={45}
                  step={0.1}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">°C</span>
              </div>
            </Field>

            <Field label="TRC (remplissage cap.)" hint="Secondes">
              <NumberInput
                value={vitals.capillaryRefill}
                onChange={(v) => update('capillaryRefill', v)}
                placeholder="ex: 2"
                unit="s"
                min={0}
                max={10}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Pupilles">
              <SelectInput
                value={vitals.pupils}
                onChange={(v) => update('pupils', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'normal', label: 'Normales, symétriques, réactives' },
                  { value: 'asymmetric', label: 'Asymétriques' },
                  { value: 'dilated', label: 'Dilatées (mydriase)' },
                  { value: 'constricted', label: 'Serrées (myosis)' },
                ]}
              />
            </Field>

            <Field label="Aspect de la peau">
              <SelectInput
                value={vitals.skin}
                onChange={(v) => update('skin', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'normal', label: 'Normale' },
                  { value: 'pale', label: 'Pâle' },
                  { value: 'cyanotic', label: 'Cyanosée' },
                  { value: 'flushed', label: 'Rouge, chaude' },
                  { value: 'sweaty', label: 'Sueurs (diaphorèse)' },
                ]}
              />
            </Field>

            <Field label="Échelle visuelle analogique (EVA)" hint="Douleur de 0 à 10">
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={vitals.painScale ?? 0}
                  onChange={(e) => update('painScale', Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0 — aucune</span>
                  <span className="font-semibold text-rose-600">{vitals.painScale ?? 0}/10</span>
                  <span>10 — max</span>
                </div>
              </div>
            </Field>
          </div>

          <Field label="Glycémie capillaire" hint="Dextro (g/L)">
            <div className="relative max-w-[200px]">
              <input
                type="number"
                value={vitals.glucose ?? ''}
                onChange={(e) => update('glucose', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="ex: 1.0"
                min={0}
                max={30}
                step={0.1}
                className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
              />
              <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">g/L</span>
            </div>
          </Field>
        </div>
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VitalCard
          icon={<HeartPulse className="h-5 w-5" />}
          label="Fréquence cardiaque"
          value={vitals.heartRate}
          unit="bpm"
          normal={[60, 100]}
        />
        <VitalCard
          icon={<Activity className="h-5 w-5" />}
          label="Fréquence resp."
          value={vitals.respiratoryRate}
          unit="/min"
          normal={[12, 20]}
        />
        <VitalCard
          icon={<Droplet className="h-5 w-5" />}
          label="Saturation"
          value={vitals.spo2}
          unit="%"
          normal={[95, 100]}
          inverted
        />
      </div>

      <HintBox hints={scenario.hints.vitals} />

      <InfoBanner>
        Pensez à l'AVPU pour la conscience, aux pupilles pour le neuro, et au TRC pour la perfusion.
      </InfoBanner>

      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Examen clinique
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function VitalCard({
  icon,
  label,
  value,
  unit,
  normal,
  inverted,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
  normal: [number, number];
  inverted?: boolean;
}) {
  const isAbnormal = () => {
    if (value === null) return null;
    const [min, max] = normal;
    if (inverted) return value < min;
    return value < min || value > max;
  };
  const abnormal = isAbnormal();
  const color =
    abnormal === null
      ? 'text-slate-400'
      : abnormal
      ? 'text-rose-600'
      : 'text-emerald-600';

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
        {value !== null && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      <p className="text-xs text-slate-400 mt-1">Normal : {normal[0]}–{normal[1]} {unit}</p>
    </div>
  );
}
