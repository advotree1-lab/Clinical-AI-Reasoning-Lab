export type Role = 'participant' | 'researcher';

export type ParticipantDesignation =
  | 'Junior Resident'
  | 'Senior Resident'
  | 'Assistant Professor'
  | 'Associate Professor'
  | 'Professor'
  | 'Consultant'
  | 'Other';

export type ClinicalSpecialty =
  | 'General Medicine'
  | 'General Surgery'
  | 'Pediatrics'
  | 'Obstetrics and Gynaecology'
  | 'Emergency Medicine'
  | 'Other';

export type YearsSinceMbbsBracket =
  | 'Less than 1 year'
  | '1–5 years'
  | '6–10 years'
  | 'More than 10 years';

export type InstitutionType =
  | 'Government hospital'
  | 'Private hospital'
  | 'Teaching hospital'
  | 'Other';

export type GenAiTaskFrequency =
  | 'Never'
  | 'Rarely'
  | 'Sometimes'
  | 'Often'
  | 'Very often';

export type GenAiFirstUseDuration =
  | 'Less than 3 months'
  | '3–6 months'
  | '6–12 months'
  | 'More than 12 months';

export type GenAiUsageFrequency =
  | 'Less than once a week'
  | '1–2 days per week'
  | '3–5 days per week'
  | 'Daily'
  | 'Several times a day';

export type GenAiDailyDuration =
  | 'Less than 10 minutes'
  | '10–30 minutes'
  | '31–60 minutes'
  | 'More than 60 minutes';

export type GenAiAccessMethod =
  | 'Free public version'
  | 'Personal paid subscription'
  | 'Provided by my hospital/institution'
  | 'A combination of the above';

export type PatientInfoEntryFrequency =
  | 'Never'
  | 'Once or twice'
  | 'Sometimes'
  | 'Often';

export type ClinicalReasoningConsultationStage =
  | 'Before forming my own clinical assessment'
  | 'After my initial assessment, to cross-check my thinking'
  | 'When uncertain or unable to reach a conclusion'
  | 'After making a decision, primarily for documentation'
  | 'I do not use GenAI for clinical reasoning';

export type InstitutionalPolicyStatus = 'Yes' | 'No' | 'Not sure';

export interface Participant {
  id: string; // UUID
  code: string; // DOC-1042
  designation: ParticipantDesignation;
  designationOther?: string;
  specialty: ClinicalSpecialty;
  specialtyOther?: string;
  yearsSinceMbbsBracket: YearsSinceMbbsBracket;
  institutionType: InstitutionType;
  institutionOther?: string;
  formalGenAiTraining: boolean;
  consentGiven: boolean;
  isDemo: boolean;
  createdAt: string;
  completed: boolean;
  currentStage: number; // 1 to 7
}

export interface GenAiTaskMatrix {
  differentialDiagnoses: GenAiTaskFrequency;
  interpretingInvestigations: GenAiTaskFrequency;
  choosingInvestigations: GenAiTaskFrequency;
  identifyingManagement: GenAiTaskFrequency;
  drugDosesAndInteractions: GenAiTaskFrequency;
  summarisingLiterature: GenAiTaskFrequency;
  clinicalDocumentation: GenAiTaskFrequency;
  patientCommunication: GenAiTaskFrequency;
}

export interface QuestionnaireResponse {
  id: string;
  participantId: string;
  isDemo: boolean;
  // SECTION I: RESPONDENT PROFILE
  designation: ParticipantDesignation;
  designationOther?: string;
  specialty: ClinicalSpecialty;
  specialtyOther?: string;
  yearsSinceMbbsBracket: YearsSinceMbbsBracket;
  hospitalType: InstitutionType;
  hospitalTypeOther?: string;
  formalGenAiTraining: boolean;
  // SECTION II: GENAI EXPOSURE (past 3 months work-related use)
  usedGenAiLast3Months: boolean; // Q1: If No, skip Q2-Q12 and proceed to clinical vignettes
  firstUseDuration?: GenAiFirstUseDuration; // Q2
  usageFrequency?: GenAiUsageFrequency; // Q3
  dailyTimeSpent?: GenAiDailyDuration; // Q4
  toolsUsed?: string[]; // Q5
  medicalSpecificToolName?: string; // Q5 specify
  otherToolName?: string; // Q5 specify
  accessMethod?: GenAiAccessMethod; // Q6
  enteredPatientInfo?: PatientInfoEntryFrequency; // Q7
  taskFrequency?: GenAiTaskMatrix; // Q8 (a-h)
  reasoningConsultationStage?: ClinicalReasoningConsultationStage; // Q9
  last10CasesConsultedCount?: number; // Q10 (0 to 10)
  verificationFrequency?: GenAiTaskFrequency; // Q11
  institutionalPolicy?: InstitutionalPolicyStatus; // Q12
  createdAt: string;
}

export type CaseStage = 'ai_simulation' | 'post_ai';

export interface ClinicalVitals {
  heartRate: string;
  bloodPressure: string;
  respiratoryRate: string;
  spO2: string;
  temperature: string;
}

export interface ClinicalInvestigation {
  name: string;
  result: string;
  referenceRange?: string;
  isAbnormal?: boolean;
}

export interface CdssFollowUpSuggestion {
  id: 'followup_1' | 'followup_2';
  promptLabel: string;
  responseText: string;
}

export interface AiStimulus {
  diagnosis: string;
  recommendation: string;
  clinicalReasoning: string;
  followUpSuggestions?: CdssFollowUpSuggestion[];
  isMisleading: boolean; // Researcher only! Hidden from participant
  misleadingClassification?: 'Diagnostic Anchoring' | 'Investigation Inversion' | 'Harmful Clinical Management';
  researcherNote?: string;
}

export interface ClinicalImage {
  id: string;
  url: string;
  title: string;
  caption?: string;
}

export interface ClinicalCase {
  id: string;
  caseNumber: number;
  stage: CaseStage;
  domain: string;
  title: string;
  presentation: string;
  medicalHistory: string;
  vitals: ClinicalVitals;
  physicalExamination: string;
  investigations: ClinicalInvestigation[];
  clinicalImages?: ClinicalImage[];
  mcqOptions: string[];
  goldStandardDiagnosis: string;
  acceptableAlternativeDiagnoses: string[];
  differentialDiagnosisKeys: string[];
  redFlagKeys: string[];
  nextManagementStepKey: string;
  rubric: {
    primaryDiagnosisCriteria: string;
    differentialCriteria: string;
    redFlagsCriteria: string;
    nextStepCriteria: string;
  };
  aiStimulus?: AiStimulus; // Only present for stage === 'ai_simulation'
  isPublished: boolean;
  expertReviewed: boolean;
}

export type AiAgreementLevel = 'Completely agree' | 'Partially agree' | 'Disagree' | 'Uncertain; requires verification';

export interface AiInteractionRecord {
  id: string;
  participantId: string;
  caseId: string;
  isDemo: boolean;
  // Initial commitments (Permanently locked)
  initialDiagnosis: string;
  initialJustification: string;
  initialConfidence: number; // 1 to 5
  initialSubmittedAt: string;
  // Post-AI commitments
  aiAgreement: AiAgreementLevel;
  finalDiagnosis: string;
  reasonForDecision: string;
  finalConfidence: number; // 1 to 5
  willVerify: boolean;
  verificationTargets: string;
  // Derived analytical metrics
  switchedDiagnosis: boolean;
  switchedTowardsCorrect: boolean;
  acceptedMisleading: boolean;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface VignetteScoreBreakdown {
  primaryDiagnosisMark: number; // 0 to 1
  differentialsMark: number; // 0 to 1
  redFlagsMark: number; // 0 to 1
  nextStepMark: number; // 0 to 1
  totalScore: number; // 0 to 4
  assessorName: string;
  scoredAt: string;
  notes?: string;
}

export interface VignetteAnswerRecord {
  id: string;
  participantId: string;
  caseId: string;
  stage: 'post_ai';
  isDemo: boolean;
  mostLikelyDiagnosis: string;
  differential1: string;
  differential2: string;
  redFlags: string;
  nextStep: string;
  confidence: number; // 1 to 5
  assessor1Score?: VignetteScoreBreakdown;
  assessor2Score?: VignetteScoreBreakdown;
  finalResolvedScore?: number; // 0 to 4
  submittedAt: string;
}

export interface ResearchProtocolSettings {
  requireParticipantConsent: boolean;
  passcode: string;
  institutionName: string;
  protocolNumber: string;
  primaryInvestigator: string;
  dataRetentionMonths: number;
  allowDemoToggle: boolean;
}
