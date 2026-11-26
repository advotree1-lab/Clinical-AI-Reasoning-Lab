export type Role = 'participant' | 'researcher';

export type AppRoute = 'home' | 'pi' | 'researcher' | 'participant';

export type TeamMemberRole = 'pi' | 'researcher' | 'assessor';

export type RecruitmentSource = 'direct' | 'team';

export type ParticipantCompletionStatus =
  | 'registered'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

export type VignetteScoringStatus =
  | 'pending'
  | 'partial'
  | 'dual_scored'
  | 'adjudicated';

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
  authUserId?: string;
  code: string; // DOC-001001 (DB) or DOC-XXXX (demo)
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
  // Recruitment attribution (immutable after enrollment)
  recruitmentSource?: RecruitmentSource;
  recruitedBy?: string | null;
  researcherCode?: string | null;
  recruitmentLinkId?: string | null;
  // Workflow status & server-authoritative milestone timestamps
  completionStatus?: ParticipantCompletionStatus;
  consentedAt?: string;
  registeredAt?: string;
  questionnaireCompletedAt?: string | null;
  cdssStartedAt?: string | null;
  cdssCompletedAt?: string | null;
  vignettesStartedAt?: string | null;
  vignettesCompletedAt?: string | null;
  completedAt?: string | null;
  lastActivityAt?: string;
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
  submittedAt?: string;
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

/**
 * Participant-safe CDSS stimulus fields ONLY.
 * Never includes isMisleading, misleadingClassification, or researcherNote.
 */
export interface ParticipantAiStimulus {
  diagnosis: string;
  recommendation: string;
  clinicalReasoning: string;
  followUpSuggestions?: CdssFollowUpSuggestion[];
}

export interface AiStimulus extends ParticipantAiStimulus {
  isMisleading: boolean; // Researcher/PI only! Never exposed to participants
  misleadingClassification?: 'Diagnostic Anchoring' | 'Investigation Inversion' | 'Harmful Clinical Management';
  researcherNote?: string;
}

export interface ClinicalImage {
  id: string;
  url: string;
  title: string;
  caption?: string;
}

/**
 * Participant-safe clinical case (maps directly to public.clinical_cases).
 * Contains zero gold standards, answer keys, misleading flags, or scoring rubrics.
 */
export interface ParticipantClinicalCase {
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
  aiStimulus?: ParticipantAiStimulus; // Only present for stage === 'ai_simulation'
  isPublished: boolean;
  expertReviewed: boolean;
}

export interface ClinicalCaseAnswerKey {
  caseId: string;
  goldStandardDiagnosis: string;
  acceptableAlternatives: string[];
  differentialKeys: string[];
  redFlagKeys: string[];
  nextStepKey: string;
  rubric: {
    primaryDiagnosisCriteria: string;
    differentialCriteria: string;
    redFlagsCriteria: string;
    nextStepCriteria: string;
  };
  isMisleading: boolean;
  misleadingClassification?: 'Diagnostic Anchoring' | 'Investigation Inversion' | 'Harmful Clinical Management';
  researcherNote?: string;
}

export interface ClinicalCase extends ParticipantClinicalCase {
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
}

export type AiAgreementLevel = 'Completely agree' | 'Partially agree' | 'Disagree' | 'Uncertain; requires verification';

export interface CdssOptionOrderItem {
  optionId: string;
  label: string;
  text: string;
  isOther?: boolean;
}

export interface CaseSessionTimer {
  id: string;
  participantId: string;
  caseId: string;
  stage: CaseStage;
  firstDisplayedAt: string;
  lastOpenedAt: string;
  lastHeartbeatAt: string;
  activeSeconds: number;
  openCount: number;
  displayedOptionOrder?: CdssOptionOrderItem[];
  submittedAt?: string | null;
}

export interface CdssFollowupEvent {
  id: string;
  participantId: string;
  caseId: string;
  suggestionId: 'followup_1' | 'followup_2';
  promptLabel: string;
  responseText: string;
  clickedAt: string;
}

export interface AiInteractionRecord {
  id: string;
  participantId: string;
  caseId: string;
  isDemo: boolean;
  // Optional legacy commitments (null in live side-by-side CDSS mode)
  initialDiagnosis?: string;
  initialJustification?: string;
  initialConfidence?: number; // 1 to 5
  initialSubmittedAt?: string;
  // Post-CDSS participant evaluation
  aiAgreement: AiAgreementLevel;
  finalDiagnosis: string;
  selectedOptionId?: string;
  displayedOptionOrder?: CdssOptionOrderItem[];
  reasonForDecision: string;
  finalConfidence: number; // 1 to 5
  willVerify: boolean;
  verificationTargets: string;
  switchedDiagnosis: boolean;
  // Server-computed analytical flags (populated in PI evaluations table & Demo Mode only)
  matchedGoldStandard?: boolean;
  switchedTowardsCorrect?: boolean;
  acceptedMisleading?: boolean;
  // Server-authoritative timing fields
  firstDisplayedAt?: string;
  lastOpenedAt?: string;
  submittedAt?: string;
  activeSeconds?: number;
  wallClockSeconds?: number;
  timeSpentSeconds?: number; // Demo analytics fallback only
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
  selectedOptionId?: string;
  displayedOptionOrder?: CdssOptionOrderItem[];
  differential1: string;
  differential2: string;
  redFlags: string;
  nextStep: string;
  confidence: number; // 1 to 5
  assessor1Score?: VignetteScoreBreakdown;
  assessor2Score?: VignetteScoreBreakdown;
  finalResolvedScore?: number; // 0 to 4
  scoringStatus?: VignetteScoringStatus;
  piAdjudicatedScore?: number | null;
  firstDisplayedAt?: string;
  lastOpenedAt?: string;
  activeSeconds?: number;
  wallClockSeconds?: number;
  submittedAt: string;
}

export type ResearchEventType =
  | 'session_resumed'
  | 'stage_entered'
  | 'case_opened'
  | 'case_navigated'
  | 'tab_hidden'
  | 'tab_visible'
  | 'page_exit_beacon'
  | 'cdss_followup_clicked'
  | 'cdss_submitted'
  | 'vignette_submitted'
  | 'questionnaire_submitted'
  | 'study_completed';

export interface ResearchEventRecord {
  id?: string;
  participantId: string;
  eventType: ResearchEventType;
  stage?: number;
  caseId?: string;
  payload?: Record<string, unknown>;
  clientTimestamp?: string;
  serverTimestamp?: string;
}

export interface RecruitmentTokenValidation {
  isValid: boolean;
  researcherCode: string | null;
  linkLabel: string | null;
}

export interface ParticipantSessionSnapshot {
  participant: Participant;
  questionnaire: QuestionnaireResponse | null;
  aiInteractions: AiInteractionRecord[];
  followupEvents: CdssFollowupEvent[];
  vignetteAnswers: VignetteAnswerRecord[];
  caseTimers: CaseSessionTimer[];
}

export interface ResearchTeamMember {
  id: string;
  authUserId: string;
  researcherCode: string;
  fullName: string;
  email: string;
  role: TeamMemberRole;
  assessorSlot?: 1 | 2 | null;
  recruitmentTarget: number;
  isActive: boolean;
  createdAt: string;
}

export interface RecruitmentLink {
  id: string;
  researcherId: string;
  token: string;
  label?: string | null;
  isActive: boolean;
  maxUses?: number | null;
  usesCount: number;
  expiresAt?: string | null;
  createdAt: string;
}

export interface ResearcherOperationalParticipant {
  participantId: string;
  code: string;
  recruitmentSource: RecruitmentSource;
  recruitedBy: string | null;
  researcherCode: string | null;
  currentStage: number;
  completionStatus: ParticipantCompletionStatus;
  completed: boolean;
  lastActivityAt: string;
  createdAt: string;
  completedAt: string | null;
}

export interface AiInteractionEvaluation {
  aiInteractionId: string;
  participantId: string;
  caseId: string;
  isMisleading: boolean;
  matchedGoldStandard: boolean;
  switchedTowardsCorrect: boolean;
  acceptedMisleading: boolean;
  evaluatedAt: string;
}

export interface AssessorScoreRecord {
  id: string;
  vignetteAnswerId: string;
  assessorId: string;
  assessorSlot: 1 | 2;
  primaryDiagnosisMark: number;
  differentialsMark: number;
  redFlagsMark: number;
  nextStepMark: number;
  totalScore: number;
  notes?: string;
  scoredAt: string;
  updatedAt: string;
}

export interface ResearcherPortalDataset {
  member: ResearchTeamMember;
  operationalParticipants: ResearcherOperationalParticipant[];
  participants: Participant[];
  questionnaires: QuestionnaireResponse[];
  aiInteractions: AiInteractionRecord[];
  aiEvaluations: AiInteractionEvaluation[];
  followupEvents: CdssFollowupEvent[];
  vignetteAnswers: VignetteAnswerRecord[];
  assessorScores: AssessorScoreRecord[];
  teamMembers: ResearchTeamMember[];
  recruitmentLinks: RecruitmentLink[];
  clinicalCases: ClinicalCase[];
  participantCases: ParticipantClinicalCase[];
  researchEvents: ResearchEventRecord[];
  caseTimers: CaseSessionTimer[];
}

export interface ResearchProtocolSettings {
  requireParticipantConsent: boolean;
  institutionName: string;
  protocolNumber: string;
  primaryInvestigator: string;
  dataRetentionMonths: number;
  allowDemoToggle: boolean;
}


