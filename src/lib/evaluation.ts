import type {
  AssessmentData,
  Call15Data,
  CaseScenario,
  ExaminationFindings,
  VitalSigns,
} from '../types';

export interface StepResult {
  score: number;
  maxScore: number;
  feedback: string[];
}

export function evaluateVitals(
  recorded: Partial<VitalSigns>,
  expected: VitalSigns,
): StepResult {
  const fields: (keyof VitalSigns)[] = [
    'consciousness',
    'respiratoryRate',
    'heartRate',
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'spo2',
    'temperature',
    'capillaryRefill',
    'pupils',
    'skin',
    'painScale',
    'glucose',
  ];

  let correct = 0;
  let total = 0;
  const feedback: string[] = [];

  for (const field of fields) {
    const exp = expected[field];
    if (exp === null || exp === undefined) continue;
    total++;
    const rec = recorded[field];
    if (rec === null || rec === undefined) {
      feedback.push(`${labelOf(field)} non mesuré — valeur attendue : ${displayValue(exp)}`);
      continue;
    }
    if (typeof exp === 'number' && typeof rec === 'number') {
      if (Math.abs(exp - rec) <= tolerance(field)) {
        correct++;
      } else {
        feedback.push(`${labelOf(field)} : ${rec} (attendu ~${exp})`);
      }
    } else if (rec === exp) {
      correct++;
    } else {
      feedback.push(`${labelOf(field)} : ${displayValue(rec)} (attendu : ${displayValue(exp)})`);
    }
  }

  const maxScore = total;
  return { score: correct, maxScore, feedback };
}

function tolerance(field: keyof VitalSigns): number {
  switch (field) {
    case 'respiratoryRate':
    case 'heartRate':
    case 'bloodPressureSystolic':
    case 'bloodPressureDiastolic':
      return 5;
    case 'spo2':
      return 3;
    case 'temperature':
      return 0.5;
    case 'capillaryRefill':
      return 1;
    case 'painScale':
      return 2;
    case 'glucose':
      return 0.5;
    default:
      return 0;
  }
}

function labelOf(field: keyof VitalSigns): string {
  const labels: Record<keyof VitalSigns, string> = {
    consciousness: 'Conscience (AVPU)',
    respiratoryRate: 'Fréquence respiratoire',
    heartRate: 'Fréquence cardiaque',
    bloodPressureSystolic: 'Tension artérielle (systolique)',
    bloodPressureDiastolic: 'Tension artérielle (diastolique)',
    spo2: 'Saturation (SpO2)',
    temperature: 'Température',
    capillaryRefill: 'Temps de remplissage capillaire',
    pupils: 'Pupilles',
    skin: 'Peau',
    painScale: 'EVA (douleur)',
    glucose: 'Glycémie',
  };
  return labels[field];
}

function displayValue(v: unknown): string {
  if (v === null) return '—';
  const map: Record<string, string> = {
    alert: 'Conscient',
    verbal: 'Réagit à la voix',
    pain: 'Réagit à la douleur',
    unresponsive: 'Inconscient',
    normal: 'Normal',
    asymmetric: 'Asymétrique',
    dilated: 'Dilatées',
    constricted: 'Serrées',
    pale: 'Pâle',
    cyanotic: 'Cyanosée',
    flushed: 'Rouge',
    sweaty: 'Sueurs',
    clear: 'Libre',
    obstructed: 'Obstruée',
    partially_obstructed: 'Partiellement obstruée',
    labored: 'Laborieuse',
    rapid: 'Rapide',
    shallow: 'Superficielle',
    absent: 'Absente',
    weak: 'Filant',
    strong: 'Forte',
  };
  return map[String(v)] ?? String(v);
}

export function evaluateExamination(
  recorded: Partial<ExaminationFindings>,
  expected: Partial<ExaminationFindings>,
): StepResult {
  const fields: (keyof ExaminationFindings)[] = [
    'airway',
    'breathing',
    'circulation',
    'traumaHead',
    'traumaNeck',
    'traumaChest',
    'traumaAbdomen',
    'traumaPelvis',
    'traumaLimbs',
    'traumaBack',
    'bleedingExternal',
    'fracturesVisible',
    'burns',
  ];

  let correct = 0;
  let total = 0;
  const feedback: string[] = [];

  for (const field of fields) {
    const exp = expected[field];
    if (exp === undefined || exp === null) continue;
    total++;
    const rec = recorded[field];
    if (rec === undefined || rec === null) {
      feedback.push(`${examLabel(field)} non évalué`);
      continue;
    }
    if (rec === exp) {
      correct++;
    } else {
      feedback.push(`${examLabel(field)} : ${displayValue(rec)} (attendu : ${displayValue(exp)})`);
    }
  }

  return { score: correct, maxScore: total, feedback };
}

function examLabel(field: keyof ExaminationFindings): string {
  const labels: Record<keyof ExaminationFindings, string> = {
    airway: 'Voies aériennes',
    breathing: 'Respiration',
    circulation: 'Circulation',
    traumaHead: 'Trauma tête',
    traumaNeck: 'Trauma cou',
    traumaChest: 'Trauma thorax',
    traumaAbdomen: 'Trauma abdomen',
    traumaPelvis: 'Trauma bassin',
    traumaLimbs: 'Trauma membres',
    traumaBack: 'Trauma dos',
    bleedingExternal: 'Saignement externe',
    fracturesVisible: 'Fractures visibles',
    burns: 'Brûlures',
    notes: 'Notes',
  };
  return labels[field];
}

export function evaluateAssessment(
  recorded: Partial<AssessmentData>,
  expected: CaseScenario['expectedAssessment'],
): StepResult {
  let correct = 0;
  let total = 4;
  const feedback: string[] = [];

  if (recorded.mechanism && recorded.mechanism.trim().length > 10) {
    correct++;
  } else {
    feedback.push('Le mécanisme lésionnel n\'est pas décrit');
  }

  if (recorded.lesions && recorded.lesions.trim().length > 10) {
    correct++;
  } else {
    feedback.push('Les lésions ne sont pas décrites');
  }

  if (recorded.severity === expected.severity) {
    correct++;
  } else {
    feedback.push(`Gravité : ${recorded.severity ?? '—'} (attendu : ${severityLabel(expected.severity)})`);
  }

  if (recorded.priority === expected.priority) {
    correct++;
  } else {
    feedback.push(`Priorité : ${recorded.priority ?? '—'} (attendu : ${expected.priority})`);
  }

  return { score: correct, maxScore: total, feedback };
}

function severityLabel(s: AssessmentData['severity']): string {
  return {
    stable: 'Stable',
    potentially_unstable: 'Potentiellement instable',
    unstable: 'Instable',
    critical: 'Critique',
  }[s];
}

export function evaluateCall15(
  recorded: Partial<Call15Data>,
  expected: CaseScenario['expectedAssessment'],
): StepResult {
  let correct = 0;
  let total = 7;
  const feedback: string[] = [];

  if (recorded.center) correct++;
  else feedback.push('Centre de réception non précisé');

  if (recorded.callerName && recorded.callerName.trim().length > 1) correct++;
  else feedback.push('Nom de l\'appelant non précisé');

  if (recorded.callerFunction && recorded.callerFunction.trim().length > 1) correct++;
  else feedback.push('Fonction de l\'appelant non précisée');

  if (recorded.chiefComplaint && recorded.chiefComplaint.trim().length > 5) correct++;
  else feedback.push('Motif non transmis');

  if (recorded.vitalsReported && recorded.vitalsReported.trim().length > 10) correct++;
  else feedback.push('Constantes non transmises');

  if (recorded.lesionsReported && recorded.lesionsReported.trim().length > 10) correct++;
  else feedback.push('Lésions non transmises');

  if (recorded.request && recorded.request.trim().length > 3) correct++;
  else feedback.push('Demande (renfort, médicalisation) non précisée');

  return { score: correct, maxScore: total, feedback };
}

export function computeTotalScore(
  vitals: StepResult,
  examination: StepResult,
  assessment: StepResult,
  call15: StepResult,
): number {
  const total = vitals.maxScore + examination.maxScore + assessment.maxScore + call15.maxScore;
  const obtained = vitals.score + examination.score + assessment.score + call15.score;
  if (total === 0) return 0;
  return Math.round((obtained / total) * 100);
}
