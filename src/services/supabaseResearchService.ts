import {
  AiAgreementLevel,
  AiInteractionEvaluation,
  AiInteractionRecord,
  AssessorScoreRecord,
  CaseSessionTimer,
  CaseStage,
  CdssFollowUpSuggestion,
  CdssFollowupEvent,
  ClinicalCase,
  ClinicalImage,
  ClinicalInvestigation,
  ClinicalSpecialty,
  ClinicalVitals,
  GenAiAccessMethod,
  GenAiDailyDuration,
  GenAiFirstUseDuration,
  GenAiTaskFrequency,
  GenAiTaskMatrix,
  GenAiUsageFrequency,
  InstitutionType,
  InstitutionalPolicyStatus,
  Participant,
  ParticipantClinicalCase,
  ParticipantCompletionStatus,
  ParticipantDesignation,
  ParticipantSessionSnapshot,
  PatientInfoEntryFrequency,
  QuestionnaireResponse,
  RecruitmentLink,
  RecruitmentSource,
  RecruitmentTokenValidation,
  ResearchEventRecord,
  ResearchEventType,
  ResearchTeamMember,
  ResearcherOperationalParticipant,
  ResearcherPortalDataset,
  TeamMemberRole,
  VignetteAnswerRecord,
  VignetteScoreBreakdown,
  VignetteScoringStatus,
  YearsSinceMbbsBracket,
  ClinicalReasoningConsultationStage,
} from '../types';
import { isSupabaseConfigured, requireSupabaseClient, supabaseConfigError } from './supabaseClient';

export interface EnrollParticipantInput {
  designation: ParticipantDesignation;
  designationOther?: string;
  specialty: ClinicalSpecialty;
  specialtyOther?: string;
  yearsSinceMbbsBracket: YearsSinceMbbsBracket;
  institutionType: InstitutionType;
  institutionOther?: string;
  formalGenAiTraining: boolean;
  consentGiven: boolean;
  referralToken?: string | null;
}

export interface SubmitQuestionnaireInput {
  participantId: string;
  designation: ParticipantDesignation;
  designationOther?: string;
  specialty: ClinicalSpecialty;
  specialtyOther?: string;
  yearsSinceMbbsBracket: YearsSinceMbbsBracket;
  hospitalType: InstitutionType;
  hospitalTypeOther?: string;
  formalGenAiTraining: boolean;
  usedGenAiLast3Months: boolean;
  firstUseDuration?: GenAiFirstUseDuration;
  usageFrequency?: GenAiUsageFrequency;
  dailyTimeSpent?: GenAiDailyDuration;
  toolsUsed?: string[];
  medicalSpecificToolName?: string;
  otherToolName?: string;
  accessMethod?: GenAiAccessMethod;
  enteredPatientInfo?: PatientInfoEntryFrequency;
  taskFrequency?: GenAiTaskMatrix;
  reasoningConsultationStage?: ClinicalReasoningConsultationStage;
  last10CasesConsultedCount?: number;
  verificationFrequency?: GenAiTaskFrequency;
  institutionalPolicy?: InstitutionalPolicyStatus;
}

export interface SubmitAiInteractionInput {
  participantId: string;
  caseId: string;
  aiAgreement: AiAgreementLevel;
  finalDiagnosis: string;
  switchedDiagnosis: boolean;
  reasonForDecision: string;
  finalConfidence: number;
  willVerify: boolean;
  verificationTargets: string;
}

export interface SubmitVignetteAnswerInput {
  participantId: string;
  caseId: string;
  mostLikelyDiagnosis: string;
  differential1: string;
  differential2: string;
  redFlags: string;
  nextStep: string;
  confidence: number;
}

export interface CaseTimerOpenResult {
  firstDisplayedAt: string;
  lastOpenedAt: string;
  activeSeconds: number;
  openCount: number;
}

interface ClinicalCaseRow {
  id: string;
  case_number: number;
  stage: CaseStage;
  domain: string;
  title: string;
  presentation: string;
  medical_history: string;
  vitals: ClinicalVitals;
  physical_examination: string;
  investigations: ClinicalInvestigation[];
  clinical_images: ClinicalImage[] | null;
  mcq_options: string[];
  ai_diagnosis: string | null;
  ai_recommendation: string | null;
  ai_clinical_reasoning: string | null;
  ai_follow_up_suggestions: CdssFollowUpSuggestion[] | null;
  is_published: boolean;
  expert_reviewed: boolean;
}

interface ParticipantRow {
  id: string;
  auth_user_id: string;
  code: string;
  designation: ParticipantDesignation;
  designation_other: string | null;
  specialty: ClinicalSpecialty;
  specialty_other: string | null;
  years_since_mbbs_bracket: YearsSinceMbbsBracket;
  institution_type: InstitutionType;
  institution_other: string | null;
  formal_genai_training: boolean;
  consent_given: boolean;
  is_demo: boolean;
  recruitment_source: RecruitmentSource;
  recruited_by: string | null;
  researcher_code: string | null;
  recruitment_link_id: string | null;
  current_stage: number;
  completion_status: ParticipantCompletionStatus;
  completed: boolean;
  consented_at: string;
  registered_at: string;
  questionnaire_completed_at: string | null;
  cdss_started_at: string | null;
  cdss_completed_at: string | null;
  vignettes_started_at: string | null;
  vignettes_completed_at: string | null;
  completed_at: string | null;
  last_activity_at: string;
  created_at: string;
}

interface QuestionnaireRow {
  id: string;
  participant_id: string;
  is_demo: boolean;
  designation: ParticipantDesignation;
  designation_other: string | null;
  specialty: ClinicalSpecialty;
  specialty_other: string | null;
  years_since_mbbs_bracket: YearsSinceMbbsBracket;
  hospital_type: InstitutionType;
  hospital_type_other: string | null;
  formal_genai_training: boolean;
  used_genai_last_3_months: boolean;
  first_use_duration: GenAiFirstUseDuration | null;
  usage_frequency: GenAiUsageFrequency | null;
  daily_time_spent: GenAiDailyDuration | null;
  tools_used: string[] | null;
  medical_specific_tool_name: string | null;
  other_tool_name: string | null;
  access_method: GenAiAccessMethod | null;
  entered_patient_info: PatientInfoEntryFrequency | null;
  task_frequency: GenAiTaskMatrix | null;
  reasoning_consultation_stage: ClinicalReasoningConsultationStage | null;
  last_10_cases_consulted_count: number | null;
  verification_frequency: GenAiTaskFrequency | null;
  institutional_policy: InstitutionalPolicyStatus | null;
  submitted_at: string;
  created_at: string;
}

interface CaseSessionTimerRow {
  id: string;
  participant_id: string;
  case_id: string;
  stage: CaseStage;
  first_displayed_at: string;
  last_opened_at: string;
  last_heartbeat_at: string;
  active_seconds: number;
  open_count: number;
  submitted_at: string | null;
}

interface AiInteractionRow {
  id: string;
  participant_id: string;
  case_id: string;
  is_demo: boolean;
  initial_diagnosis: string | null;
  initial_justification: string | null;
  initial_confidence: number | null;
  initial_submitted_at: string | null;
  ai_agreement: AiAgreementLevel;
  final_diagnosis: string;
  switched_diagnosis: boolean;
  reason_for_decision: string;
  final_confidence: number;
  will_verify: boolean;
  verification_targets: string;
  first_displayed_at: string;
  last_opened_at: string;
  submitted_at: string;
  active_seconds: number;
  wall_clock_seconds: number;
  completed_at: string;
}

interface FollowupEventRow {
  id: string;
  participant_id: string;
  case_id: string;
  suggestion_id: 'followup_1' | 'followup_2';
  prompt_label: string;
  response_text: string;
  clicked_at: string;
}

interface VignetteAnswerRow {
  id: string;
  participant_id: string;
  case_id: string;
  stage: 'post_ai';
  is_demo: boolean;
  most_likely_diagnosis: string;
  differential_1: string;
  differential_2: string;
  red_flags: string;
  next_step: string;
  confidence: number;
  first_displayed_at: string;
  last_opened_at: string;
  submitted_at: string;
  active_seconds: number;
  wall_clock_seconds: number;
  scoring_status: VignetteScoringStatus;
  final_resolved_score: number | null;
  pi_adjudicated_score: number | null;
}

interface ResearchTeamMemberRow {
  id: string;
  auth_user_id: string | null;
  researcher_code: string;
  full_name: string;
  email: string;
  role: TeamMemberRole;
  assessor_slot: 1 | 2 | null;
  recruitment_target: number;
  is_active: boolean;
  created_at: string;
}

interface RecruitmentLinkRow {
  id: string;
  researcher_id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  created_at: string;
}

interface OperationalParticipantRow {
  participant_id: string;
  code: string;
  recruitment_source: RecruitmentSource;
  recruited_by: string | null;
  researcher_code: string | null;
  current_stage: number;
  completion_status: ParticipantCompletionStatus;
  completed: boolean;
  last_activity_at: string;
  created_at: string;
  completed_at: string | null;
}

interface ClinicalCaseAnswerKeyRow {
  case_id: string;
  gold_standard_diagnosis: string;
  acceptable_alternatives: string[];
  differential_keys: string[];
  red_flag_keys: string[];
  next_step_key: string;
  rubric: {
    primaryDiagnosisCriteria: string;
    differentialCriteria: string;
    redFlagsCriteria: string;
    nextStepCriteria: string;
  };
  is_misleading: boolean;
  misleading_classification: 'Diagnostic Anchoring' | 'Investigation Inversion' | 'Harmful Clinical Management' | null;
  researcher_note: string | null;
}

interface AiInteractionEvaluationRow {
  ai_interaction_id: string;
  participant_id: string;
  case_id: string;
  is_misleading: boolean;
  matched_gold_standard: boolean;
  switched_towards_correct: boolean;
  accepted_misleading: boolean;
  evaluated_at: string;
}

interface AssessorScoreDbRow {
  id: string;
  vignette_answer_id: string;
  assessor_id: string;
  assessor_slot: 1 | 2;
  primary_diagnosis_mark: number;
  differentials_mark: number;
  red_flags_mark: number;
  next_step_mark: number;
  total_score: number;
  notes: string | null;
  scored_at: string;
  updated_at: string;
}

interface ResearchEventDbRow {
  id: string;
  participant_id: string;
  event_type: ResearchEventType;
  stage: number | null;
  case_id: string | null;
  payload: Record<string, unknown>;
  client_timestamp: string | null;
  server_timestamp: string;
}

export interface SubmitAssessorScoreInput {
  vignetteAnswerId: string;
  primaryDiagnosisMark: 0 | 0.5 | 1;
  differentialsMark: 0 | 0.5 | 1;
  redFlagsMark: 0 | 0.5 | 1;
  nextStepMark: 0 | 0.5 | 1;
  notes?: string;
}

function mapClinicalCaseRow(row: ClinicalCaseRow): ParticipantClinicalCase {
  return {
    id: row.id,
    caseNumber: row.case_number,
    stage: row.stage,
    domain: row.domain,
    title: row.title,
    presentation: row.presentation,
    medicalHistory: row.medical_history,
    vitals: row.vitals,
    physicalExamination: row.physical_examination,
    investigations: row.investigations || [],
    clinicalImages: row.clinical_images || [],
    mcqOptions: row.mcq_options || [],
    aiStimulus:
      row.stage === 'ai_simulation' && row.ai_diagnosis && row.ai_recommendation && row.ai_clinical_reasoning
        ? {
            diagnosis: row.ai_diagnosis,
            recommendation: row.ai_recommendation,
            clinicalReasoning: row.ai_clinical_reasoning,
            followUpSuggestions: row.ai_follow_up_suggestions || undefined,
          }
        : undefined,
    isPublished: row.is_published,
    expertReviewed: row.expert_reviewed,
  };
}

function mapParticipantRow(row: ParticipantRow): Participant {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    code: row.code,
    designation: row.designation,
    designationOther: row.designation_other ?? undefined,
    specialty: row.specialty,
    specialtyOther: row.specialty_other ?? undefined,
    yearsSinceMbbsBracket: row.years_since_mbbs_bracket,
    institutionType: row.institution_type,
    institutionOther: row.institution_other ?? undefined,
    formalGenAiTraining: row.formal_genai_training,
    consentGiven: row.consent_given,
    isDemo: row.is_demo,
    recruitmentSource: row.recruitment_source,
    recruitedBy: row.recruited_by,
    researcherCode: row.researcher_code,
    recruitmentLinkId: row.recruitment_link_id,
    currentStage: row.current_stage,
    completionStatus: row.completion_status,
    completed: row.completed,
    consentedAt: row.consented_at,
    registeredAt: row.registered_at,
    questionnaireCompletedAt: row.questionnaire_completed_at,
    cdssStartedAt: row.cdss_started_at,
    cdssCompletedAt: row.cdss_completed_at,
    vignettesStartedAt: row.vignettes_started_at,
    vignettesCompletedAt: row.vignettes_completed_at,
    completedAt: row.completed_at,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  };
}

function mapQuestionnaireRow(row: QuestionnaireRow): QuestionnaireResponse {
  return {
    id: row.id,
    participantId: row.participant_id,
    isDemo: row.is_demo,
    designation: row.designation,
    designationOther: row.designation_other ?? undefined,
    specialty: row.specialty,
    specialtyOther: row.specialty_other ?? undefined,
    yearsSinceMbbsBracket: row.years_since_mbbs_bracket,
    hospitalType: row.hospital_type,
    hospitalTypeOther: row.hospital_type_other ?? undefined,
    formalGenAiTraining: row.formal_genai_training,
    usedGenAiLast3Months: row.used_genai_last_3_months,
    firstUseDuration: row.first_use_duration ?? undefined,
    usageFrequency: row.usage_frequency ?? undefined,
    dailyTimeSpent: row.daily_time_spent ?? undefined,
    toolsUsed: row.tools_used ?? undefined,
    medicalSpecificToolName: row.medical_specific_tool_name ?? undefined,
    otherToolName: row.other_tool_name ?? undefined,
    accessMethod: row.access_method ?? undefined,
    enteredPatientInfo: row.entered_patient_info ?? undefined,
    taskFrequency: row.task_frequency ?? undefined,
    reasoningConsultationStage: row.reasoning_consultation_stage ?? undefined,
    last10CasesConsultedCount: row.last_10_cases_consulted_count ?? undefined,
    verificationFrequency: row.verification_frequency ?? undefined,
    institutionalPolicy: row.institutional_policy ?? undefined,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

function mapCaseTimerRow(row: CaseSessionTimerRow): CaseSessionTimer {
  return {
    id: row.id,
    participantId: row.participant_id,
    caseId: row.case_id,
    stage: row.stage,
    firstDisplayedAt: row.first_displayed_at,
    lastOpenedAt: row.last_opened_at,
    lastHeartbeatAt: row.last_heartbeat_at,
    activeSeconds: row.active_seconds,
    openCount: row.open_count,
    submittedAt: row.submitted_at,
  };
}

function mapAiInteractionRow(row: AiInteractionRow): AiInteractionRecord {
  return {
    id: row.id,
    participantId: row.participant_id,
    caseId: row.case_id,
    isDemo: row.is_demo,
    initialDiagnosis: row.initial_diagnosis ?? undefined,
    initialJustification: row.initial_justification ?? undefined,
    initialConfidence: row.initial_confidence ?? undefined,
    initialSubmittedAt: row.initial_submitted_at ?? undefined,
    aiAgreement: row.ai_agreement,
    finalDiagnosis: row.final_diagnosis,
    reasonForDecision: row.reason_for_decision,
    finalConfidence: row.final_confidence,
    willVerify: row.will_verify,
    verificationTargets: row.verification_targets,
    switchedDiagnosis: row.switched_diagnosis,
    firstDisplayedAt: row.first_displayed_at,
    lastOpenedAt: row.last_opened_at,
    submittedAt: row.submitted_at,
    activeSeconds: row.active_seconds,
    wallClockSeconds: row.wall_clock_seconds,
    completedAt: row.completed_at,
  };
}

function mapFollowupRow(row: FollowupEventRow): CdssFollowupEvent {
  return {
    id: row.id,
    participantId: row.participant_id,
    caseId: row.case_id,
    suggestionId: row.suggestion_id,
    promptLabel: row.prompt_label,
    responseText: row.response_text,
    clickedAt: row.clicked_at,
  };
}

function mapVignetteAnswerRow(row: VignetteAnswerRow): VignetteAnswerRecord {
  return {
    id: row.id,
    participantId: row.participant_id,
    caseId: row.case_id,
    stage: row.stage,
    isDemo: row.is_demo,
    mostLikelyDiagnosis: row.most_likely_diagnosis,
    differential1: row.differential_1,
    differential2: row.differential_2,
    redFlags: row.red_flags,
    nextStep: row.next_step,
    confidence: row.confidence,
    finalResolvedScore: row.final_resolved_score ?? undefined,
    scoringStatus: row.scoring_status,
    piAdjudicatedScore: row.pi_adjudicated_score,
    firstDisplayedAt: row.first_displayed_at,
    lastOpenedAt: row.last_opened_at,
    activeSeconds: row.active_seconds,
    wallClockSeconds: row.wall_clock_seconds,
    submittedAt: row.submitted_at,
  };
}

function mapTeamMemberRow(row: ResearchTeamMemberRow): ResearchTeamMember {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? '',
    researcherCode: row.researcher_code,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    assessorSlot: row.assessor_slot,
    recruitmentTarget: row.recruitment_target,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapRecruitmentLinkRow(row: RecruitmentLinkRow): RecruitmentLink {
  return {
    id: row.id,
    researcherId: row.researcher_id,
    token: row.token,
    label: row.label,
    isActive: row.is_active,
    maxUses: row.max_uses,
    usesCount: row.uses_count,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function mapOperationalParticipantRow(row: OperationalParticipantRow): ResearcherOperationalParticipant {
  return {
    participantId: row.participant_id,
    code: row.code,
    recruitmentSource: row.recruitment_source,
    recruitedBy: row.recruited_by,
    researcherCode: row.researcher_code,
    currentStage: row.current_stage,
    completionStatus: row.completion_status,
    completed: row.completed,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapAiEvaluationRow(row: AiInteractionEvaluationRow): AiInteractionEvaluation {
  return {
    aiInteractionId: row.ai_interaction_id,
    participantId: row.participant_id,
    caseId: row.case_id,
    isMisleading: row.is_misleading,
    matchedGoldStandard: row.matched_gold_standard,
    switchedTowardsCorrect: row.switched_towards_correct,
    acceptedMisleading: row.accepted_misleading,
    evaluatedAt: row.evaluated_at,
  };
}

function mapAssessorScoreRow(row: AssessorScoreDbRow): AssessorScoreRecord {
  return {
    id: row.id,
    vignetteAnswerId: row.vignette_answer_id,
    assessorId: row.assessor_id,
    assessorSlot: row.assessor_slot,
    primaryDiagnosisMark: Number(row.primary_diagnosis_mark),
    differentialsMark: Number(row.differentials_mark),
    redFlagsMark: Number(row.red_flags_mark),
    nextStepMark: Number(row.next_step_mark),
    totalScore: Number(row.total_score),
    notes: row.notes ?? undefined,
    scoredAt: row.scored_at,
    updatedAt: row.updated_at,
  };
}

function toScoreBreakdown(row: AssessorScoreRecord, assessorName: string): VignetteScoreBreakdown {
  return {
    primaryDiagnosisMark: row.primaryDiagnosisMark,
    differentialsMark: row.differentialsMark,
    redFlagsMark: row.redFlagsMark,
    nextStepMark: row.nextStepMark,
    totalScore: row.totalScore,
    assessorName,
    scoredAt: row.scoredAt,
    notes: row.notes,
  };
}

function mapResearchEventRow(row: ResearchEventDbRow): ResearchEventRecord {
  return {
    id: row.id,
    participantId: row.participant_id,
    eventType: row.event_type,
    stage: row.stage ?? undefined,
    caseId: row.case_id ?? undefined,
    payload: row.payload || {},
    clientTimestamp: row.client_timestamp ?? undefined,
    serverTimestamp: row.server_timestamp,
  };
}

export const supabaseResearchService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  getConfigError(): string | null {
    return supabaseConfigError;
  },

  async ensureAnonymousParticipantAuth(): Promise<string> {
    const client = requireSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      throw new Error('Unable to verify your active session. Please refresh the page and try again.');
    }

    const existingUser = sessionData.session?.user;
    if (existingUser) {
      if (existingUser.is_anonymous === false) {
        throw new Error(
          'A Research Team account is currently signed in. Please sign out before starting a participant session.'
        );
      }
      return existingUser.id;
    }

    const { data: anonData, error: anonError } = await client.auth.signInAnonymously();
    if (anonError || !anonData.user) {
      throw new Error(
        'Unable to initialize a temporary participant session. Please contact the Principal Investigator or supervising researcher.'
      );
    }

    return anonData.user.id;
  },

  /**
   * Ends any active browser auth session (researcher, PI, or prior participant)
   * and creates a brand-new anonymous Supabase Auth participant session.
   */
  async startFreshAnonymousParticipantSession(): Promise<string> {
    const client = requireSupabaseClient();
    await client.auth.signOut();
    return this.ensureAnonymousParticipantAuth();
  },

  async resetParticipantAuthSession(): Promise<void> {
    const client = requireSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session?.user?.is_anonymous) {
      await client.auth.signOut();
    }
  },

  async validateRecruitmentToken(token: string): Promise<RecruitmentTokenValidation> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('validate_recruitment_token', {
      p_token: token,
    });
    if (error) {
      throw new Error('Unable to verify this recruitment token. Please check the code and try again.');
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      isValid: Boolean(row?.is_valid),
      researcherCode: row?.researcher_code ?? null,
      linkLabel: row?.link_label ?? null,
    };
  },

  async fetchPublishedParticipantCases(): Promise<ParticipantClinicalCase[]> {
    const client = requireSupabaseClient();
    // Ensure caller holds at least an anonymous authenticated JWT because clinical_cases RLS grants SELECT to authenticated
    await this.ensureAnonymousParticipantAuth();

    const { data, error } = await client
      .from('clinical_cases')
      .select(
        'id, case_number, stage, domain, title, presentation, medical_history, vitals, physical_examination, investigations, clinical_images, mcq_options, ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions, is_published, expert_reviewed'
      )
      .eq('is_published', true)
      .order('stage', { ascending: true })
      .order('case_number', { ascending: true });

    if (error) {
      throw new Error('Unable to load clinical study cases right now. Please refresh or contact your supervising researcher.');
    }

    return ((data || []) as ClinicalCaseRow[]).map(mapClinicalCaseRow);
  },

  async restoreParticipantSession(): Promise<ParticipantSessionSnapshot | null> {
    if (!isSupabaseConfigured) return null;
    const client = requireSupabaseClient();

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    const userId = sessionData.session.user.id;
    const { data: pRow, error: pError } = await client
      .from('participants')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (pError) {
      throw new Error('Unable to restore your study session. Please refresh or notify your supervising researcher.');
    }
    if (!pRow) {
      return null;
    }

    const participant = mapParticipantRow(pRow as ParticipantRow);

    const [qRes, aiRes, followRes, vigRes, timerRes] = await Promise.all([
      client
        .from('questionnaire_responses')
        .select('*')
        .eq('participant_id', participant.id)
        .maybeSingle(),
      client
        .from('ai_interactions')
        .select(
          'id, participant_id, case_id, is_demo, initial_diagnosis, initial_justification, initial_confidence, initial_submitted_at, ai_agreement, final_diagnosis, switched_diagnosis, reason_for_decision, final_confidence, will_verify, verification_targets, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, completed_at'
        )
        .eq('participant_id', participant.id),
      client
        .from('followup_events')
        .select('*')
        .eq('participant_id', participant.id)
        .order('clicked_at', { ascending: true }),
      client
        .from('vignette_answers')
        .select(
          'id, participant_id, case_id, stage, is_demo, most_likely_diagnosis, differential_1, differential_2, red_flags, next_step, confidence, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, scoring_status, final_resolved_score, pi_adjudicated_score'
        )
        .eq('participant_id', participant.id),
      client
        .from('case_session_timers')
        .select('*')
        .eq('participant_id', participant.id),
    ]);

    if (qRes.error) throw new Error('Unable to restore saved questionnaire responses. Please refresh the page.');
    if (aiRes.error) throw new Error('Unable to restore clinical simulation records. Please refresh the page.');
    if (followRes.error) throw new Error('Unable to restore simulation prompt history. Please refresh the page.');
    if (vigRes.error) throw new Error('Unable to restore clinical vignette answers. Please refresh the page.');
    if (timerRes.error) throw new Error('Unable to restore case timing state. Please refresh the page.');

    // Log advisory session_resumed telemetry non-blockingly
    void this.logResearchEvent({
      participantId: participant.id,
      eventType: 'session_resumed',
      stage: participant.currentStage,
      clientTimestamp: new Date().toISOString(),
    }).catch(() => undefined);

    return {
      participant,
      questionnaire: qRes.data ? mapQuestionnaireRow(qRes.data as QuestionnaireRow) : null,
      aiInteractions: ((aiRes.data || []) as AiInteractionRow[]).map(mapAiInteractionRow),
      followupEvents: ((followRes.data || []) as FollowupEventRow[]).map(mapFollowupRow),
      vignetteAnswers: ((vigRes.data || []) as VignetteAnswerRow[]).map(mapVignetteAnswerRow),
      caseTimers: ((timerRes.data || []) as CaseSessionTimerRow[]).map(mapCaseTimerRow),
    };
  },

  async enrollParticipant(input: EnrollParticipantInput): Promise<Participant> {
    const client = requireSupabaseClient();
    await this.ensureAnonymousParticipantAuth();

    const { data, error } = await client.rpc('enroll_participant', {
      p_designation: input.designation,
      p_designation_other: input.designationOther ?? null,
      p_specialty: input.specialty,
      p_specialty_other: input.specialtyOther ?? null,
      p_years_since_mbbs_bracket: input.yearsSinceMbbsBracket,
      p_institution_type: input.institutionType,
      p_institution_other: input.institutionOther ?? null,
      p_formal_genai_training: input.formalGenAiTraining,
      p_consent_given: input.consentGiven,
      p_referral_token: input.referralToken?.trim() || null,
    });

    if (error) {
      throw new Error('Unable to complete participant registration. Please confirm your profile details and try again.');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.participant_id) {
      throw new Error('Participant registration did not return an active participant code. Please try again.');
    }

    const { data: fullRow, error: fetchError } = await client
      .from('participants')
      .select('*')
      .eq('id', row.participant_id)
      .single();

    if (fetchError || !fullRow) {
      throw new Error('Your registration profile could not be loaded. Please refresh and try again.');
    }

    return mapParticipantRow(fullRow as ParticipantRow);
  },

  async submitQuestionnaire(input: SubmitQuestionnaireInput): Promise<QuestionnaireResponse> {
    const client = requireSupabaseClient();

    const { data: qid, error } = await client.rpc('submit_questionnaire', {
      p_participant_id: input.participantId,
      p_designation: input.designation,
      p_designation_other: input.designationOther ?? null,
      p_specialty: input.specialty,
      p_specialty_other: input.specialtyOther ?? null,
      p_years_since_mbbs_bracket: input.yearsSinceMbbsBracket,
      p_hospital_type: input.hospitalType,
      p_hospital_type_other: input.hospitalTypeOther ?? null,
      p_formal_genai_training: input.formalGenAiTraining,
      p_used_genai_last_3_months: input.usedGenAiLast3Months,
      p_first_use_duration: input.usedGenAiLast3Months ? (input.firstUseDuration ?? null) : null,
      p_usage_frequency: input.usedGenAiLast3Months ? (input.usageFrequency ?? null) : null,
      p_daily_time_spent: input.usedGenAiLast3Months ? (input.dailyTimeSpent ?? null) : null,
      p_tools_used: input.usedGenAiLast3Months ? (input.toolsUsed ?? []) : [],
      p_medical_specific_tool_name: input.usedGenAiLast3Months ? (input.medicalSpecificToolName ?? null) : null,
      p_other_tool_name: input.usedGenAiLast3Months ? (input.otherToolName ?? null) : null,
      p_access_method: input.usedGenAiLast3Months ? (input.accessMethod ?? null) : null,
      p_entered_patient_info: input.usedGenAiLast3Months ? (input.enteredPatientInfo ?? null) : null,
      p_task_frequency: input.usedGenAiLast3Months ? (input.taskFrequency ?? null) : null,
      p_reasoning_consultation_stage: input.usedGenAiLast3Months
        ? (input.reasoningConsultationStage ?? null)
        : null,
      p_last_10_cases_consulted_count: input.usedGenAiLast3Months
        ? (input.last10CasesConsultedCount ?? null)
        : null,
      p_verification_frequency: input.usedGenAiLast3Months ? (input.verificationFrequency ?? null) : null,
      p_institutional_policy: input.usedGenAiLast3Months ? (input.institutionalPolicy ?? null) : null,
    });

    if (error) {
      throw new Error('Unable to submit your questionnaire responses. Please review your selections and try again.');
    }

    const { data: qRow, error: qError } = await client
      .from('questionnaire_responses')
      .select('*')
      .eq('id', qid)
      .single();

    if (qError || !qRow) {
      throw new Error('Your questionnaire response was saved, but the summary could not be reloaded. Please refresh.');
    }

    return mapQuestionnaireRow(qRow as QuestionnaireRow);
  },

  async openStudyCase(participantId: string, caseId: string): Promise<CaseTimerOpenResult> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('open_study_case', {
      p_participant_id: participantId,
      p_case_id: caseId,
    });
    if (error) {
      throw new Error('Unable to open this clinical case. Please refresh and try again.');
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      firstDisplayedAt: row.first_displayed_at,
      lastOpenedAt: row.last_opened_at,
      activeSeconds: row.active_seconds ?? 0,
      openCount: row.open_count ?? 1,
    };
  },

  async heartbeatCaseTimer(participantId: string, caseId: string, deltaSeconds: number): Promise<number> {
    if (deltaSeconds <= 0) return 0;
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('heartbeat_case_timer', {
      p_participant_id: participantId,
      p_case_id: caseId,
      p_delta_seconds: Math.round(deltaSeconds),
    });
    if (error) {
      throw new Error('Unable to update case elapsed time.');
    }
    return Number(data ?? 0);
  },

  async logCdssFollowup(
    participantId: string,
    caseId: string,
    suggestionId: 'followup_1' | 'followup_2'
  ): Promise<string> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('log_cdss_followup', {
      p_participant_id: participantId,
      p_case_id: caseId,
      p_suggestion_id: suggestionId,
    });
    if (error) {
      throw new Error('Unable to record follow-up prompt selection. Please try again.');
    }
    return String(data);
  },

  async submitAiInteraction(input: SubmitAiInteractionInput): Promise<AiInteractionRecord> {
    const client = requireSupabaseClient();
    const { data: interactionId, error } = await client.rpc('submit_ai_interaction', {
      p_participant_id: input.participantId,
      p_case_id: input.caseId,
      p_ai_agreement: input.aiAgreement,
      p_final_diagnosis: input.finalDiagnosis,
      p_switched_diagnosis: input.switchedDiagnosis,
      p_reason_for_decision: input.reasonForDecision,
      p_final_confidence: input.finalConfidence,
      p_will_verify: input.willVerify,
      p_verification_targets: input.verificationTargets,
    });

    if (error) {
      throw new Error('Unable to save this case evaluation. Please ensure all required fields are completed.');
    }

    const { data: row, error: fetchError } = await client
      .from('ai_interactions')
      .select(
        'id, participant_id, case_id, is_demo, initial_diagnosis, initial_justification, initial_confidence, initial_submitted_at, ai_agreement, final_diagnosis, switched_diagnosis, reason_for_decision, final_confidence, will_verify, verification_targets, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, completed_at'
      )
      .eq('id', interactionId)
      .single();

    if (fetchError || !row) {
      throw new Error('Your case evaluation was recorded, but could not be refreshed. Please reload the page.');
    }

    return mapAiInteractionRow(row as AiInteractionRow);
  },

  async completeCdssStage(participantId: string): Promise<string> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('complete_cdss_stage', {
      p_participant_id: participantId,
    });
    if (error) {
      throw new Error('Please complete and submit all five clinical simulation cases before advancing.');
    }
    return String(data);
  },

  async submitVignetteAnswer(input: SubmitVignetteAnswerInput): Promise<VignetteAnswerRecord> {
    const client = requireSupabaseClient();
    const { data: answerId, error } = await client.rpc('submit_vignette_answer', {
      p_participant_id: input.participantId,
      p_case_id: input.caseId,
      p_most_likely_diagnosis: input.mostLikelyDiagnosis,
      p_differential_1: input.differential1,
      p_differential_2: input.differential2,
      p_red_flags: input.redFlags,
      p_next_step: input.nextStep,
      p_confidence: input.confidence,
    });

    if (error) {
      throw new Error('Unable to save this clinical vignette response. Please verify all fields are complete.');
    }

    const { data: row, error: fetchError } = await client
      .from('vignette_answers')
      .select(
        'id, participant_id, case_id, stage, is_demo, most_likely_diagnosis, differential_1, differential_2, red_flags, next_step, confidence, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, scoring_status, final_resolved_score, pi_adjudicated_score'
      )
      .eq('id', answerId)
      .single();

    if (fetchError || !row) {
      throw new Error('Your vignette response was saved, but could not be refreshed. Please reload the page.');
    }

    return mapVignetteAnswerRow(row as VignetteAnswerRow);
  },

  async completeVignetteStage(participantId: string): Promise<string> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('complete_vignette_stage', {
      p_participant_id: participantId,
    });
    if (error) {
      throw new Error('Please complete and submit all six clinical vignettes before finishing the study.');
    }
    return String(data);
  },

  async fetchOwnParticipant(participantId: string): Promise<Participant | null> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .maybeSingle();

    if (error) {
      throw new Error('Unable to refresh your study profile. Please reload the page.');
    }
    return data ? mapParticipantRow(data as ParticipantRow) : null;
  },

  async logResearchEvent(input: {
    participantId: string;
    eventType: ResearchEventType;
    stage?: number;
    caseId?: string;
    payload?: Record<string, unknown>;
    clientTimestamp?: string;
  }): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('log_research_event', {
      p_participant_id: input.participantId,
      p_event_type: input.eventType,
      p_stage: input.stage ?? null,
      p_case_id: input.caseId ?? null,
      p_payload: input.payload ?? {},
      p_client_timestamp: input.clientTimestamp ?? new Date().toISOString(),
    });
    if (error) {
      throw new Error('Unable to record study activity timing.');
    }
    return data ? String(data) : null;
  },

  // ===========================================================================
  // RESEARCH TEAM PORTAL AUTHENTICATION & ROLE-SCOPED QUERIES / RPCs
  // ===========================================================================

  async getSessionType(): Promise<'none' | 'anonymous_participant' | 'authenticated_user'> {
    if (!isSupabaseConfigured) return 'none';
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user) return 'none';
    return data.session.user.is_anonymous ? 'anonymous_participant' : 'authenticated_user';
  },

  async getAuthenticatedTeamMember(): Promise<ResearchTeamMember | null> {
    if (!isSupabaseConfigured) return null;
    const client = requireSupabaseClient();

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError || !sessionData.session?.user) {
      return null;
    }

    const user = sessionData.session.user;
    // Block anonymous participant accounts from entering Researcher Portal
    if (user.is_anonymous) {
      return null;
    }

    const { data, error } = await client
      .from('research_team_members')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw new Error('Unable to verify research team authorisation. Please try again or contact the Principal Investigator.');
    }

    return data ? mapTeamMemberRow(data as ResearchTeamMemberRow) : null;
  },

  async signInTeamMember(email: string, password: string): Promise<ResearchTeamMember> {
    const client = requireSupabaseClient();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both your authorised email address and password.');
    }

    // If an anonymous participant session is currently active, clear it before credential login
    const { data: preSession } = await client.auth.getSession();
    if (preSession.session?.user?.is_anonymous) {
      await client.auth.signOut();
    }

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      throw new Error('Invalid email address or password. Please check your credentials and try again.');
    }

    if (authData.user.is_anonymous) {
      await client.auth.signOut();
      throw new Error('Participant study sessions cannot access the Research Team portal.');
    }

    const { data: memberRow, error: memberError } = await client
      .from('research_team_members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (memberError) {
      await client.auth.signOut();
      throw new Error('Unable to verify your research team authorisation. Please try again or contact the Principal Investigator.');
    }

    if (!memberRow) {
      await client.auth.signOut();
      throw new Error(
        'Your account is not yet authorised for this research platform. Please contact the Principal Investigator.'
      );
    }

    return mapTeamMemberRow(memberRow as ResearchTeamMemberRow);
  },

  async signInPortalTeamMember(
    email: string,
    password: string,
    portal: 'pi' | 'researcher'
  ): Promise<ResearchTeamMember> {
    const member = await this.signInTeamMember(email, password);
    const client = requireSupabaseClient();

    if (portal === 'pi' && member.role !== 'pi') {
      await client.auth.signOut();
      throw new Error(
        'This portal is restricted to Principal Investigator accounts. Please sign in through the Research Team portal.'
      );
    }

    if (portal === 'researcher' && member.role !== 'researcher' && member.role !== 'assessor') {
      await client.auth.signOut();
      throw new Error(
        'Principal Investigator accounts must sign in through the Principal Investigator portal.'
      );
    }

    return member;
  },

  async fetchPermittedRecruitmentLinks(): Promise<RecruitmentLink[]> {
    const client = requireSupabaseClient();
    const { data, error } = await client
      .from('recruitment_links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Unable to load recruitment links. Please refresh and try again.');
    }

    return ((data || []) as RecruitmentLinkRow[]).map(mapRecruitmentLinkRow);
  },

  async signOutTeamMember(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const client = requireSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error('Unable to sign out cleanly. Please refresh the browser.');
    }
  },

  async fetchResearcherPortalDataset(member: ResearchTeamMember): Promise<ResearcherPortalDataset> {
    const client = requireSupabaseClient();

    // Verify caller still holds an active non-anonymous session
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session?.user || sessionData.session.user.is_anonymous) {
      throw new Error('Your research team session has expired. Please sign in again.');
    }

    const [casesRes, linksRes, opRes] = await Promise.all([
      client
        .from('clinical_cases')
        .select(
          'id, case_number, stage, domain, title, presentation, medical_history, vitals, physical_examination, investigations, clinical_images, mcq_options, ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions, is_published, expert_reviewed'
        )
        .order('stage', { ascending: true })
        .order('case_number', { ascending: true }),
      client
        .from('recruitment_links')
        .select('*')
        .order('created_at', { ascending: false }),
      client.rpc('get_researcher_operational_participants'),
    ]);

    if (casesRes.error) {
      throw new Error('Unable to load clinical cases. Please refresh and try again.');
    }
    if (linksRes.error) {
      throw new Error('Unable to load recruitment links. Please refresh and try again.');
    }
    if (opRes.error) {
      throw new Error('Unable to load the participant progress roster. Please refresh and try again.');
    }

    const participantCases = ((casesRes.data || []) as ClinicalCaseRow[]).map(mapClinicalCaseRow);
    const recruitmentLinks = ((linksRes.data || []) as RecruitmentLinkRow[]).map(mapRecruitmentLinkRow);
    const operationalParticipants = ((opRes.data || []) as OperationalParticipantRow[]).map(
      mapOperationalParticipantRow
    );

    if (member.role === 'researcher') {
      return {
        member,
        operationalParticipants,
        participants: [],
        questionnaires: [],
        aiInteractions: [],
        aiEvaluations: [],
        followupEvents: [],
        vignetteAnswers: [],
        assessorScores: [],
        teamMembers: [member],
        recruitmentLinks,
        clinicalCases: [],
        participantCases,
        researchEvents: [],
        caseTimers: [],
      };
    }

    // Both 'assessor' and 'pi' can read clinical_case_answer_keys, vignette_answers, and permitted assessor_scores
    const [keysRes, vigRes, scoresRes] = await Promise.all([
      client.from('clinical_case_answer_keys').select('*'),
      client
        .from('vignette_answers')
        .select(
          'id, participant_id, case_id, stage, is_demo, most_likely_diagnosis, differential_1, differential_2, red_flags, next_step, confidence, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, scoring_status, final_resolved_score, pi_adjudicated_score'
        )
        .order('submitted_at', { ascending: false }),
      client
        .from('assessor_scores')
        .select('*')
        .order('scored_at', { ascending: false }),
    ]);

    if (keysRes.error) {
      throw new Error('Unable to load evaluation answer keys. Please refresh and try again.');
    }
    if (vigRes.error) {
      throw new Error('Unable to load vignette responses. Please refresh and try again.');
    }
    if (scoresRes.error) {
      throw new Error('Unable to load assessment scores. Please refresh and try again.');
    }

    const keyMap = new Map<string, ClinicalCaseAnswerKeyRow>();
    ((keysRes.data || []) as ClinicalCaseAnswerKeyRow[]).forEach(k => keyMap.set(k.case_id, k));

    const clinicalCases: ClinicalCase[] = participantCases.map(pc => {
      const k = keyMap.get(pc.id);
      return {
        ...pc,
        goldStandardDiagnosis: k?.gold_standard_diagnosis ?? '',
        acceptableAlternativeDiagnoses: k?.acceptable_alternatives ?? [],
        differentialDiagnosisKeys: k?.differential_keys ?? [],
        redFlagKeys: k?.red_flag_keys ?? [],
        nextManagementStepKey: k?.next_step_key ?? '',
        rubric: k?.rubric ?? {
          primaryDiagnosisCriteria: '',
          differentialCriteria: '',
          redFlagsCriteria: '',
          nextStepCriteria: '',
        },
        aiStimulus: pc.aiStimulus
          ? {
              ...pc.aiStimulus,
              isMisleading: k?.is_misleading ?? false,
              misleadingClassification: k?.misleading_classification ?? undefined,
              researcherNote: k?.researcher_note ?? undefined,
            }
          : undefined,
      };
    });

    const assessorScores = ((scoresRes.data || []) as AssessorScoreDbRow[]).map(mapAssessorScoreRow);
    const scoresByVignette = new Map<string, { s1?: AssessorScoreRecord; s2?: AssessorScoreRecord }>();
    assessorScores.forEach(s => {
      const entry = scoresByVignette.get(s.vignetteAnswerId) || {};
      if (s.assessorSlot === 1) entry.s1 = s;
      if (s.assessorSlot === 2) entry.s2 = s;
      scoresByVignette.set(s.vignetteAnswerId, entry);
    });

    if (member.role === 'assessor') {
      const vignetteAnswers = ((vigRes.data || []) as VignetteAnswerRow[]).map(row => {
        const mapped = mapVignetteAnswerRow(row);
        const sc = scoresByVignette.get(mapped.id);
        return {
          ...mapped,
          assessor1Score: sc?.s1 ? toScoreBreakdown(sc.s1, 'Assessor 1') : undefined,
          assessor2Score: sc?.s2 ? toScoreBreakdown(sc.s2, 'Assessor 2') : undefined,
        };
      });

      return {
        member,
        operationalParticipants,
        participants: [],
        questionnaires: [],
        aiInteractions: [],
        aiEvaluations: [],
        followupEvents: [],
        vignetteAnswers,
        assessorScores,
        teamMembers: [member],
        recruitmentLinks,
        clinicalCases,
        participantCases,
        researchEvents: [],
        caseTimers: [],
      };
    }

    // Principal Investigator ('pi') reads full research tables
    const [pRes, qRes, aiRes, evalRes, followRes, teamRes, eventsRes, timersRes] = await Promise.all([
      client.from('participants').select('*').order('created_at', { ascending: false }),
      client.from('questionnaire_responses').select('*').order('created_at', { ascending: false }),
      client
        .from('ai_interactions')
        .select(
          'id, participant_id, case_id, is_demo, initial_diagnosis, initial_justification, initial_confidence, initial_submitted_at, ai_agreement, final_diagnosis, switched_diagnosis, reason_for_decision, final_confidence, will_verify, verification_targets, first_displayed_at, last_opened_at, submitted_at, active_seconds, wall_clock_seconds, completed_at'
        )
        .order('completed_at', { ascending: false }),
      client.from('ai_interaction_evaluations').select('*'),
      client.from('followup_events').select('*').order('clicked_at', { ascending: false }),
      client.from('research_team_members').select('*').order('role', { ascending: true }).order('researcher_code', { ascending: true }),
      client.from('research_events').select('*').order('server_timestamp', { ascending: false }).limit(500),
      client.from('case_session_timers').select('*').order('last_opened_at', { ascending: false }),
    ]);

    if (pRes.error) throw new Error('Unable to load enrolled participant records. Please refresh and try again.');
    if (qRes.error) throw new Error('Unable to load questionnaire responses. Please refresh and try again.');
    if (aiRes.error) throw new Error('Unable to load AI simulation records. Please refresh and try again.');
    if (evalRes.error) throw new Error('Unable to load simulation evaluation flags. Please refresh and try again.');
    if (followRes.error) throw new Error('Unable to load follow-up prompt records. Please refresh and try again.');
    if (teamRes.error) throw new Error('Unable to load the research team roster. Please refresh and try again.');
    if (eventsRes.error) throw new Error('Unable to load study audit events. Please refresh and try again.');
    if (timersRes.error) throw new Error('Unable to load case timing records. Please refresh and try again.');

    const teamMembers = ((teamRes.data || []) as ResearchTeamMemberRow[]).map(mapTeamMemberRow);
    const teamById = new Map<string, ResearchTeamMember>();
    teamMembers.forEach(t => teamById.set(t.id, t));

    const aiEvaluations = ((evalRes.data || []) as AiInteractionEvaluationRow[]).map(mapAiEvaluationRow);
    const evalByInteractionId = new Map<string, AiInteractionEvaluation>();
    aiEvaluations.forEach(ev => evalByInteractionId.set(ev.aiInteractionId, ev));

    const aiInteractions = ((aiRes.data || []) as AiInteractionRow[]).map(row => {
      const mapped = mapAiInteractionRow(row);
      const ev = evalByInteractionId.get(mapped.id);
      return ev
        ? {
            ...mapped,
            switchedTowardsCorrect: ev.switchedTowardsCorrect,
            acceptedMisleading: ev.acceptedMisleading,
          }
        : mapped;
    });

    const vignetteAnswers = ((vigRes.data || []) as VignetteAnswerRow[]).map(row => {
      const mapped = mapVignetteAnswerRow(row);
      const sc = scoresByVignette.get(mapped.id);
      const s1Name = sc?.s1 ? teamById.get(sc.s1.assessorId)?.fullName || 'Assessor 1' : 'Assessor 1';
      const s2Name = sc?.s2 ? teamById.get(sc.s2.assessorId)?.fullName || 'Assessor 2' : 'Assessor 2';
      return {
        ...mapped,
        assessor1Score: sc?.s1 ? toScoreBreakdown(sc.s1, s1Name) : undefined,
        assessor2Score: sc?.s2 ? toScoreBreakdown(sc.s2, s2Name) : undefined,
      };
    });

    return {
      member,
      operationalParticipants,
      participants: ((pRes.data || []) as ParticipantRow[]).map(mapParticipantRow),
      questionnaires: ((qRes.data || []) as QuestionnaireRow[]).map(mapQuestionnaireRow),
      aiInteractions,
      aiEvaluations,
      followupEvents: ((followRes.data || []) as FollowupEventRow[]).map(mapFollowupRow),
      vignetteAnswers,
      assessorScores,
      teamMembers,
      recruitmentLinks,
      clinicalCases,
      participantCases,
      researchEvents: ((eventsRes.data || []) as ResearchEventDbRow[]).map(mapResearchEventRow),
      caseTimers: ((timersRes.data || []) as CaseSessionTimerRow[]).map(mapCaseTimerRow),
    };
  },

  async submitAssessorScore(input: SubmitAssessorScoreInput): Promise<string> {
    const client = requireSupabaseClient();
    const { data, error } = await client.rpc('submit_assessor_score', {
      p_vignette_answer_id: input.vignetteAnswerId,
      p_primary_diagnosis_mark: input.primaryDiagnosisMark,
      p_differentials_mark: input.differentialsMark,
      p_red_flags_mark: input.redFlagsMark,
      p_next_step_mark: input.nextStepMark,
      p_notes: input.notes?.trim() || null,
    });
    if (error) {
      throw new Error('Unable to save your evaluation score. Please verify Independent Assessor permissions and try again.');
    }
    return String(data);
  },

  async piAdjudicateVignette(vignetteAnswerId: string, adjudicatedScore: number): Promise<void> {
    const client = requireSupabaseClient();
    const { error } = await client.rpc('pi_adjudicate_vignette', {
      p_vignette_answer_id: vignetteAnswerId,
      p_adjudicated_score: adjudicatedScore,
    });
    if (error) {
      throw new Error('Unable to save Principal Investigator adjudication. Please try again.');
    }
  },
};
