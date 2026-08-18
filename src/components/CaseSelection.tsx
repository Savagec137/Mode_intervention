import type { CaseScenario } from '../types';
import { Button } from './ui';
import { Truck, ArrowRight, Clock, MapPin, User } from 'lucide-react';

export function CaseSelection({
  scenarios,
  onSelect,
  pastReports,
}: {
  scenarios: CaseScenario[];
  onSelect: (s: CaseScenario) => void;
  pastReports: { case_id: string; score: number; case_title: string; completed_at: string }[];
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/20 mb-4">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Simulateur d'intervention ambulancière</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Entraînez-vous à la prise en charge complète d'un patient : bilan vital, examen clinique,
          bilan lésionnel et transmission au SAMU (Appel 15).
        </p>
      </div>

      {pastReports.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Interventions récentes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastReports.slice(0, 3).map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{r.case_title}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.completed_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`text-lg font-bold ${
                    r.score >= 80 ? 'text-emerald-600' : r.score >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}
                >
                  {r.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Choisissez un cas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="group text-left rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-base pr-2">{s.title}</h3>
              <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">{s.description}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {s.patient.sex === 'M' ? 'Homme' : 'Femme'}, {s.patient.age} ans
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {s.location.split(',')[0]}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {s.time}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
