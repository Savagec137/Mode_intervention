import type { CaseScenario, Call15Data } from '../types';
import { Section, Field, TextInput, TextArea, SelectInput, HintBox, Button, InfoBanner } from './ui';
import { PhoneCall, ArrowRight, Radio } from 'lucide-react';

export function Call15Step({
  scenario,
  call15,
  onChange,
  onContinue,
}: {
  scenario: CaseScenario;
  call15: Call15Data;
  onChange: (v: Call15Data) => void;
  onContinue: () => void;
}) {
  const update = (field: keyof Call15Data, value: Call15Data[keyof Call15Data]) => {
    onChange({ ...call15, [field]: value });
  };

  return (
    <div className="space-y-5">
      <Section
        title="Transmission — Appel 15 (SAMU)"
        subtitle="Transmettez le bilan au médecin régulateur du SAMU"
        icon={<PhoneCall className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <InfoBanner variant="warning">
            La transmission doit être structurée et concise. Suivez l'ordre : identification, motif,
            bilan, demande.
          </InfoBanner>

          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3">
            <Radio className="h-5 w-5 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Centre 15 — Médecin régulateur</p>
              <p className="text-xs text-rose-600">« Ambulance SMUR, vous êtes en ligne avec le SAMU, quelle est votre situation ? »</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Centre de réception">
              <SelectInput
                value={call15.center}
                onChange={(v) => update('center', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'SAMU', label: 'SAMU (Centre 15)' },
                  { value: 'Pompiers', label: 'Pompiers (SDIS)' },
                  { value: 'Police', label: 'Police (17)' },
                ]}
              />
            </Field>

            <Field label="Votre nom">
              <TextInput
                value={call15.callerName}
                onChange={(v) => update('callerName', v)}
                placeholder="ex: Dr Martin"
              />
            </Field>

            <Field label="Votre fonction">
              <TextInput
                value={call15.callerFunction}
                onChange={(v) => update('callerFunction', v)}
                placeholder="ex: Ambulancier DEAP"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Field label="Nombre de victimes">
              <TextInput
                value={call15.patientCount ? String(call15.patientCount) : ''}
                onChange={(v) => update('patientCount', v ? Number(v) : 0)}
                placeholder="ex: 1"
              />
            </Field>

            <Field label="Âge du patient">
              <TextInput
                value={call15.patientAge}
                onChange={(v) => update('patientAge', v)}
                placeholder="ex: 34 ans"
              />
            </Field>

            <Field label="Sexe">
              <SelectInput
                value={call15.patientSex}
                onChange={(v) => update('patientSex', v)}
                placeholder="Sélectionner..."
                options={[
                  { value: 'M', label: 'Homme' },
                  { value: 'F', label: 'Femme' },
                ]}
              />
            </Field>

            <Field label="Motif d'intervention">
              <TextInput
                value={call15.chiefComplaint}
                onChange={(v) => update('chiefComplaint', v)}
                placeholder="ex: Trauma thoracique"
              />
            </Field>
          </div>

          <Field label="Constantes vitales transmises" hint="FC, FR, TA, SpO2, conscience...">
            <TextArea
              value={call15.vitalsReported}
              onChange={(v) => update('vitalsReported', v)}
              placeholder="ex: FC 124, FR 28, TA 96/60, SpO2 91% à l'air, conscience réagit à la voix..."
              rows={3}
            />
          </Field>

          <Field label="Lésions et bilan transmis">
            <TextArea
              value={call15.lesionsReported}
              onChange={(v) => update('lesionsReported', v)}
              placeholder="ex: Volet costal, fracture du bassin, choc hémorragique..."
              rows={3}
            />
          </Field>

          <Field label="Gestes réalisés">
            <TextArea
              value={call15.actionsTaken}
              onChange={(v) => update('actionsTaken', v)}
              placeholder="ex: Voie veineuse, remplissage, immobilisation, O2 15L..."
              rows={2}
            />
          </Field>

          <Field label="Demande au régulateur" hint="Médicalisation, transport, consignes...">
            <TextArea
              value={call15.request}
              onChange={(v) => update('request', v)}
              placeholder="ex: Demande médicalisation SMUR pour transport en urgence vers trauma center..."
              rows={2}
            />
          </Field>
        </div>
      </Section>

      <HintBox hints={scenario.hints.call15} />

      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Voir le bilan et l'évaluation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
