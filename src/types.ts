export type Sex = 'M' | 'F';

export type Step = 'dispatch' | 'scene' | 'vitals' | 'examination' | 'assessment' | 'call15' | 'summary';

export interface VitalSigns {
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive' | null;
  respiratoryRate: number | null;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  spo2: number | null;
  temperature: number | null;
  capillaryRefill: number | null;
  pupils: 'normal' | 'asymmetric' | 'dilated' | 'constricted' | null;
  skin: 'normal' | 'pale' | 'cyanotic' | 'flushed' | 'sweaty' | null;
  painScale: number | null;
  glucose: number | null;
}

export interface ExaminationFindings {
  airway: 'clear' | 'obstructed' | 'partially_obstructed' | null;
  breathing: 'normal' | 'labored' | 'rapid' | 'shallow' | 'absent' | null;
  circulation: 'normal' | 'weak' | 'absent' | 'strong' | null;
  traumaHead: boolean;
  traumaNeck: boolean;
  traumaChest: boolean;
  traumaAbdomen: boolean;
  traumaPelvis: boolean;
  traumaLimbs: boolean;
  traumaBack: boolean;
  bleedingExternal: boolean;
  fracturesVisible: boolean;
  burns: boolean;
  notes: string;
}

export interface AssessmentData {
  mechanism: string;
  lesions: string;
  severity: 'stable' | 'potentially_unstable' | 'unstable' | 'critical';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  actionsTaken: string[];
}

export interface Call15Data {
  callerName: string;
  callerFunction: string;
  center: 'SAMU' | 'Pompiers' | 'Police' | null;
  patientCount: number;
  patientAge: string;
  patientSex: Sex | null;
  chiefComplaint: string;
  vitalsReported: string;
  lesionsReported: string;
  actionsTaken: string;
  request: string;
}

export interface CaseScenario {
  id: string;
  title: string;
  description: string;
  location: string;
  time: string;
  patient: {
    age: number;
    sex: Sex;
    name: string;
    history: string;
  };
  chiefComplaint: string;
  sceneDescription: string;
  sceneHazards: string[];
  expectedVitals: VitalSigns;
  expectedExamination: Partial<ExaminationFindings>;
  expectedAssessment: {
    mechanism: string;
    lesions: string;
    severity: AssessmentData['severity'];
    priority: AssessmentData['priority'];
  };
  hints: Record<Step, string[]>;
}

export interface InterventionReport {
  id: string;
  case_id: string;
  case_title: string;
  patient_age: number | null;
  patient_sex: string | null;
  chief_complaint: string | null;
  vitals: Partial<VitalSigns>;
  assessment: Partial<AssessmentData>;
  call15: Partial<Call15Data>;
  score: number;
  feedback: Record<string, string>;
  completed_at: string;
  created_at: string;
}
