import type { CaseScenario, VitalSigns, ExaminationFindings, AssessmentData, Call15Data } from '../types';
import {
  evaluateVitals,
  evaluateExamination,
  evaluateAssessment,
  evaluateCall15,
  computeTotalScore,
  type StepResult,
} from '../lib/evaluation';
import { Section, Button, InfoBanner } from './ui';
import {
  Activity,
  Stethoscope,
  ClipboardList,
  PhoneCall,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  TrendingUp,
} from 'lucide-react';

export function SummaryStep({
  scenario,
  vitals,
  examination,
  assessment,
  call15,
  onRestart,
}: {
  scenario: CaseScenario;
  vitals: VitalSigns;
  examination: ExaminationFindings;
  assessment: AssessmentData;
  call15: Call15Data;
  onRestart: () => void;
}) {
  const vitalsResult = evaluateVitals(vitals, scenario.expectedVitals);
  const examResult = evaluateExamination(examination, scenario.expectedExamination);
  const assessmentResult = evaluateAssessment(assessment, scenario.expectedAssessment);
  const call15Result = evaluateCall15(call15, scenario.expectedAssessment);
  const totalScore = computeTotalScore(vitalsResult, examResult, assessmentResult, call15Result);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Award className="h-8 w-8 text-rose-400" />
          <div>
            <h2 className="text-xl font-bold">Bilan de l'intervention</h2>
            <p className="text-sm text-slate-300">{scenario.title}</p>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Score global</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-bold ${scoreColor(totalScore)}`}>{totalScore}</span>
              <span className="text-xl text-slate-400">/100</span>
            </div>
          </div>
          <div className="flex-1 ml-4">
            <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(totalScore)}`}
                style={{ width: `${totalScore}%` }}
              />
            </div>
            <p className="text-sm text-slate-300 mt-2">{scoreLabel(totalScore)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          icon={<Activity className="h-5 w-5" />}
          title="Constantes"
          result={vitalsResult}
        />
        <ScoreCard
          icon={<Stethoscope className="h-5 w-5" />}
          title="Examen ABCDE"
          result={examResult}
        />
        <ScoreCard
          icon={<ClipboardList className="h-5 w-5" />}
          title="Bilan lésionnel"
          result={assessmentResult}
        />
        <ScoreCard
          icon={<PhoneCall className="h-5 w-5" />}
          title="Appel 15"
          result={call15Result}
        />
      </div>

      <Section
        title="Détail de l'évaluation"
        subtitle="Points à améliorer pour chaque étape"
        icon={<TrendingUp className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <FeedbackBlock title="Constantes vitales" result={vitalsResult} />
          <FeedbackBlock title="Examen clinique (ABCDE)" result={examResult} />
          <FeedbackBlock title="Bilan lésionnel & gravité" result={assessmentResult} />
          <FeedbackBlock title="Transmission SAMU (Appel 15)" result={call15Result} />
        </div>
      </Section>

      <Section
        title="Cas attendu — Corrigé"
        subtitle="Ce qu'il fallait identifier"
        icon={<CheckCircle2 className="h-5 w-5" />}
      >
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Mécanisme</p>
            <p className="text-slate-600">{scenario.expectedAssessment.mechanism}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1">Lésions attendues</p>
            <p className="text-slate-600">{scenario.expectedAssessment.lesions}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-slate-700 mb-1">Gravité</p>
              <p className="text-slate-600 capitalize">{scenario.expectedAssessment.severity.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-1">Priorité</p>
              <p className="text-slate-600">{scenario.expectedAssessment.priority}</p>
            </div>
          </div>
        </div>
      </Section>

      <InfoBanner>
        Vous pouvez recommencer ce cas ou choisir un autre scénario pour vous entraîner.
      </InfoBanner>

      <div className="flex justify-center">
        <Button onClick={onRestart}>
          <RotateCcw className="h-4 w-4" />
          Choisir un autre scénario
        </Button>
      </div>
    </div>
  );
}

function ScoreCard({
  icon,
  title,
  result,
}: {
  icon: React.ReactNode;
  title: string;
  result: StepResult;
}) {
  const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
  const color = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600';
  const bg = pct >= 80 ? 'bg-emerald-50 border-emerald-200' : pct >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${color}`}>{result.score}</span>
        <span className="text-sm text-slate-400">/ {result.maxScore}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/60 mt-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeedbackBlock({ title, result }: { title: string; result: StepResult }) {
  const allGood = result.feedback.length === 0;
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-slate-700">{title}</p>
        <span className="text-sm text-slate-500">
          {result.score}/{result.maxScore}
        </span>
      </div>
      {allGood ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          Parfait — toutes les réponses sont correctes.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {result.feedback.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-rose-500" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-rose-500';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent — Intervention maîtrisée. Continuez comme ça.';
  if (score >= 75) return 'Très bon bilan — Quelques détails à peaufiner.';
  if (score >= 50) return 'Correct — Des éléments importants manquent. Révisez les points signalés.';
  return 'Insuffisant — Reprenez la méthodologie ABCDE et la transmission SAMU.';
}
