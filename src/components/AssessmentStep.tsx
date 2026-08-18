import type { CaseScenario, AssessmentData } from '../types';
import { Section, Field, TextArea, SelectInput, HintBox, Button, InfoBanner } from './ui';
import { ClipboardList, ArrowRight, Plus, X } from 'lucide-react';

const actionOptions = [
  'Pose d\'une voie veineuse périphérique',
  'Oxygénothérapie',
  'Remplissage vasculaire',
  'Administration d\'adrénaline IM',
  'Immobilisation par attelle',
  'Collier cervical',
  'Matelas immobilisateur à dépression',
  'Pansement compressif',
  'Garrot',
  'Position latérale de sécurité',
  'Intubation',
  'Ventilation au masque',
  'ECG 18 dérivations',
  'Aspirine 250mg',
  'Fentanyl / antalgique',
  'Réchauffement actif',
];

export function AssessmentStep({
  scenario,
  assessment,
  onChange,
  onContinue,
}: {
  scenario: CaseScenario;
  assessment: AssessmentData;
  onChange: (v: AssessmentData) => void;
  onContinue: () => void;
}) {
  const update = (field: keyof AssessmentData, value: AssessmentData[keyof AssessmentData]) => {
    onChange({ ...assessment, [field]: value });
  };

  const toggleAction = (action: string) => {
    const actions = assessment.actionsTaken;
    if (actions.includes(action)) {
      update('actionsTaken', actions.filter((a) => a !== action));
    } else {
      update('actionsTaken', [...actions, action]);
    }
  };

  return (
    <div className="space-y-5">
      <Section
        title="Bilan lésionnel & synthèse"
        subtitle="Formulez votre hypothèse diagnostique et déterminez la gravité"
        icon={<ClipboardList className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <Field label="Mécanisme lésionnel" hint="Décrivez le mécanisme et les circonstances">
            <TextArea
              value={assessment.mechanism}
              onChange={(v) => update('mechanism', v)}
              placeholder="ex: Choc frontal à haute cinétique, ceinture attachée, volant déformé..."
              rows={2}
            />
          </Field>

          <Field label="Lésions identifiées" hint="Listez les lésions traumatiques ou médicales">
            <TextArea
              value={assessment.lesions}
              onChange={(v) => update('lesions', v)}
              placeholder="ex: Volet costal droit, fracture du bassin, état de choc..."
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gravité de l'état">
              <SelectInput
                value={assessment.severity}
                onChange={(v) => update('severity', v ?? 'stable')}
                placeholder="Sélectionner..."
                options={[
                  { value: 'stable', label: 'Stable' },
                  { value: 'potentially_unstable', label: 'Potentiellement instable' },
                  { value: 'unstable', label: 'Instable' },
                  { value: 'critical', label: 'Critique (urgence vitale)' },
                ]}
              />
            </Field>

            <Field label="Priorité d'évacuation">
              <SelectInput
                value={assessment.priority}
                onChange={(v) => update('priority', v ?? 'P3')}
                placeholder="Sélectionner..."
                options={[
                  { value: 'P1', label: 'P1 — Urgence absolue (immédiate)' },
                  { value: 'P2', label: 'P2 — Urgence relative' },
                  { value: 'P3', label: 'P3 — Urgence différée' },
                  { value: 'P4', label: 'P4 — Décédé' },
                ]}
              />
            </Field>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Gestes et actions réalisés</p>
            <div className="flex flex-wrap gap-2">
              {actionOptions.map((action) => {
                const selected = assessment.actionsTaken.includes(action);
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => toggleAction(action)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {selected ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {action}
                  </button>
                );
              })}
            </div>
            {assessment.actionsTaken.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                {assessment.actionsTaken.length} action(s) sélectionnée(s)
              </p>
            )}
          </div>
        </div>
      </Section>

      <HintBox hints={scenario.hints.assessment} />

      <InfoBanner>
        La gravité et la priorité guident le mode d'évacuation (SMUR, VSAV, ambulance) et la destination.
      </InfoBanner>

      <div className="flex justify-end">
        <Button onClick={onContinue}>
          Transmission au SAMU (Appel 15)
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
