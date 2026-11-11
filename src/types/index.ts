export type Role = 'participant' | 'researcher';

export type ParticipantDesignation =
  | 'Postgraduate resident'
  | 'Senior resident'
  | 'Medical officer'
  | 'Assistant professor'
  | 'Associate professor'
  | 'Professor'
  | 'Consultant'
  | 'General practitioner'
  | 'Other';

export type ClinicalSpecialty =
  | 'General medicine'
  | 'General surgery'
  | 'Obstetrics and gynaecology'
  | 'Paediatrics'
  | 'Cardiology'
  | 'Neurology'
  | 'Orthopaedics'
  | 'Dermatology'
  | 'Psychiatry'
  | 'Emergency medicine'
  | 'Nephrology'
  | 'Pulmonology'
  | 'Other';

export type InstitutionType =
  | 'Government hospital'
  | 'Private hospital'
  | 'Medical college'
  | 'Clinic'
  | 'Other';

export interface Participant {
  id: string; // UUID
  code: string; // DOC-1042
  designation: ParticipantDesignation;
  specialty: ClinicalSpecialty;
  yearsSinceMBBS: number;
  yearsExperience: number;
  institutionType: InstitutionType;
  dailyPatientLoad: number;
  priorAiExposure: boolean;
  consentGiven: boolean;
  isDemo: boolean;
  createdAt: string;
  completed: boolean;
  currentStage: number; // 1 to 8
}

export interface QuestionnaireResponse {
  id: string;
  participantId: string;
  isDemo: boolean;
  usedAiLast3Months: boolean;
  aiToolsUsed: string[]; // ['ChatGPT', 'Gemini', 'Claude', etc.]
  aiFrequency: string; // 'Multiple times daily' | 'Daily' | 'Several times weekly' | 'Weekly' | 'Rarely' | 'Never'
  primaryPurposes: string[]; // ['Differential diagnosis', 'Treatment planning', etc.]
  aiTiming: 'before' | 'after' | 'both';
  complexVsRoutine: boolean;
  verificationFrequency: string; // 'Always' | 'Often' | 'Sometimes' | 'Rarely' | 'Never'
  verificationResources: string[]; // ['UpToDate', 'Clinical Guidelines', 'Textbooks', etc.]
  // Section C: Cognitive Offloading Likert items (1 to 5)
  // 1: Strongly disagree, 2: Disagree, 3: Neutral, 4: Agree, 5: Strongly agree
  cognitiveOffloading: {
    dependDifferential: number;
    substituteRecall: number;
    interpretComplex: number;
    transferReasoning: number;
    consultBeforeThinking: number;
    reduceWorkload: number;
    verifyBeforeUsing: number;
  };
  // Section D: Perceived Cognitive Deskilling Risk Likert items (1 to 5)
  perceivedDeskilling: {
    reducedEffort: number;
    difficultWithoutAi: number;
    lessConfidentIndependent: number;
    dependInvestigations: number;
    affectProblemSolving: number;
    confidenceChange: number; // 1: Significantly decreased, 3: Unchanged, 5: Significantly increased
  };
  createdAt: string;
}

export type CaseStage = 'baseline' | 'ai_simulation' | 'post_ai';

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

export interface AiStimulus {
  diagnosis: string;
  recommendation: string;
  clinicalReasoning: string;
  isMisleading: boolean; // Researcher only! Hidden from participant
  misleadingClassification?: 'Diagnostic Anchoring' | 'Investigation Inversion' | 'Harmful Clinical Management';
  researcherNote?: string;
}

export interface ClinicalCase {
  id: string;
  caseNumber: number;
  stage: CaseStage;
  domain: string; // Cardiology, Pulmonology, etc.
  title: string;
  presentation: string;
  medicalHistory: string;
  vitals: ClinicalVitals;
  physicalExamination: string;
  investigations: ClinicalInvestigation[];
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
  // Step B: Initial commitments (Permanently locked)
  initialDiagnosis: string;
  initialJustification: string;
  initialConfidence: number; // 1 to 5
  initialSubmittedAt: string;
  // Step D & E: Post-AI commitments
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
  stage: 'baseline' | 'post_ai';
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
  baselineAssessmentEnabled: boolean;
  requireParticipantConsent: boolean;
  passcode: string;
  institutionName: string;
  protocolNumber: string;
  primaryInvestigator: string;
  dataRetentionMonths: number;
  allowDemoToggle: boolean;
}
