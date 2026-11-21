import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Download,
  RotateCcw,
  Code,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  UserPlus,
  ArrowLeft
} from 'lucide-react';
import {
  ClinicalCase,
  ResearchProtocolSettings,
  GenAiTaskFrequency,
  ResearchTeamMember,
  ResearcherPortalDataset,
  VignetteAnswerRecord
} from '../../types';
import { researchStore } from '../../services/researchStore';
import { computeAnalytics, exportToCsv } from '../../services/analytics';
import { SPSS_SYNTAX_SPS } from '../../data/backendCode';
import { ClinicalImageGallery } from '../common/ClinicalImageGallery';
import { RecruitmentAndTeamPanel } from './RecruitmentAndTeamPanel';
import {
  OperationalParticipantsTable,
  QuestionnaireStatusTable,
  AiRecordsAndFollowupsPanel
} from './RecordsTablesPanel';

export type ResearcherTabId =
  | 'overview'
  | 'participants'
  | 'recruitment'
  | 'offloading'
  | 'automation_bias'
  | 'manual_scoring'
  | 'cases'
  | 'export'
  | 'settings';

interface ResearcherDashboardProps {
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  settings: ResearchProtocolSettings;
  onUpdateSettings: (newSettings: Partial<ResearchProtocolSettings>) => void;
  teamMember?: ResearchTeamMember | null;
  onSignOut?: () => Promise<void> | void;
  onOpenEnrollParticipant?: () => void;
  onBackToLanding?: () => void;
  showDemoToggle?: boolean;
  requestedTab?: ResearcherTabId;
  onTabSelected?: (tab: ResearcherTabId) => void;
}

const TASK_FREQ_NUMERIC: Record<GenAiTaskFrequency, number> = {
  Never: 1,
  Rarely: 2,
  Sometimes: 3,
  Often: 4,
  'Very often': 5
};

function getAvailableTabsForRole(
  isDemoMode: boolean,
  role?: ResearchTeamMember['role']
): { id: ResearcherTabId; label: string }[] {
  if (isDemoMode || role === 'pi') {
    return [
      { id: 'overview', label: 'Overview & Analytics' },
      { id: 'participants', label: 'Participants' },
      { id: 'recruitment', label: 'Recruitment & Team' },
      { id: 'offloading', label: 'Questionnaires' },
      { id: 'automation_bias', label: 'CDSS & Follow-ups' },
      { id: 'manual_scoring', label: 'Vignettes & Scoring' },
      { id: 'cases', label: 'Cases & Rubrics' },
      { id: 'export', label: 'CSV & SPSS Export' },
      { id: 'settings', label: 'Protocol Info' }
    ];
  }

  if (role === 'researcher') {
    return [
      { id: 'overview', label: 'Recruitment Overview' },
      { id: 'participants', label: 'Enrolled Participants' },
      { id: 'recruitment', label: 'Recruitment Links & Target' },
      { id: 'cases', label: 'Published Stimuli' }
    ];
  }

  // role === 'assessor'
  return [
    { id: 'overview', label: 'Scoring Queue Overview' },
    { id: 'manual_scoring', label: 'Assessor Scoring Console' },
    { id: 'cases', label: 'Answer Keys & Rubrics' }
  ];
}

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({
  isDemoMode,
  onToggleDemoMode,
  settings,
  onUpdateSettings,
  teamMember = null,
  onSignOut,
  onOpenEnrollParticipant,
  onBackToLanding,
  showDemoToggle = false,
  requestedTab,
  onTabSelected
}) => {
  const availableTabs = getAvailableTabsForRole(isDemoMode, teamMember?.role);
  const [activeTab, setActiveTab] = useState<ResearcherTabId>('overview');

  // Demo mode lazy loader state
  const [demoReady, setDemoReady] = useState(false);
  const [demoRefreshNonce, setDemoRefreshNonce] = useState(0);
  const [demoCases, setDemoCases] = useState<ClinicalCase[]>([]);

  // Live mode Supabase dataset state
  const [liveDataset, setLiveDataset] = useState<ResearcherPortalDataset | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Scoring state
  type RubricMark = 0 | 0.5 | 1;
  const toRubricMark = (val: number): RubricMark =>
    val === 0 ? 0 : val === 0.5 ? 0.5 : 1;

  const [selectedVignetteId, setSelectedVignetteId] = useState<string>('');
  const [vignetteFilter, setVignetteFilter] = useState<'all' | 'pending_my_slot' | 'needs_adjudication'>('all');
  const [demoAssessorSlot, setDemoAssessorSlot] = useState<1 | 2>(1);
  const [scorePrimary, setScorePrimary] = useState<RubricMark>(1);
  const [scoreDiff, setScoreDiff] = useState<RubricMark>(1);
  const [scoreRedFlags, setScoreRedFlags] = useState<RubricMark>(1);
  const [scoreNextStep, setScoreNextStep] = useState<RubricMark>(1);
  const [assessorNotes, setAssessorNotes] = useState<string>('');
  const [adjudicationInput, setAdjudicationInput] = useState<string>('');
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [scoreFeedback, setScoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Case viewer/editor state
  const [selectedEditCaseId, setSelectedEditCaseId] = useState<string>('');

  // Sync externally requested tab if allowed for current role
  useEffect(() => {
    if (requestedTab && availableTabs.some(t => t.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab, availableTabs]);

  // Reset to a valid tab if role switches
  useEffect(() => {
    if (!availableTabs.some(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || 'overview');
    }
  }, [availableTabs, activeTab]);

  // Load Demo data when in Demo Mode
  useEffect(() => {
    if (!isDemoMode) return;
    let mounted = true;
    researchStore.ensureDemoAdminLoaded().then(() => {
      if (!mounted) return;
      setDemoCases(researchStore.getCases());
      setDemoReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [isDemoMode]);

  // Load Live Supabase dataset when authenticated
  const loadLiveDataset = useCallback(async () => {
    if (isDemoMode || !teamMember) return;
    setLiveLoading(true);
    setLiveError(null);
    try {
      const ds = await researchStore.fetchResearcherPortalDataset(teamMember);
      setLiveDataset(ds);
    } catch (err) {
      setLiveError(
        err instanceof Error ? err.message : 'Unable to fetch researcher dataset from Supabase.'
      );
    } finally {
      setLiveLoading(false);
    }
  }, [isDemoMode, teamMember]);

  useEffect(() => {
    if (!isDemoMode && teamMember) {
      void loadLiveDataset();
    }
  }, [isDemoMode, teamMember, loadLiveDataset]);

  const handleSelectTab = (tab: ResearcherTabId) => {
    setActiveTab(tab);
    onTabSelected?.(tab);
  };

  // Resolve active dataset (Demo vs Live)
  void demoRefreshNonce;
  const participants = isDemoMode
    ? demoReady
      ? researchStore.getParticipants(true)
      : []
    : liveDataset?.participants ?? [];
  const operationalParticipants = isDemoMode
    ? []
    : liveDataset?.operationalParticipants ?? [];
  const questionnaires = isDemoMode
    ? demoReady
      ? researchStore.getQuestionnaires(true)
      : []
    : liveDataset?.questionnaires ?? [];
  const aiInteractions = isDemoMode
    ? demoReady
      ? researchStore.getAiInteractions(true)
      : []
    : liveDataset?.aiInteractions ?? [];
  const followupEvents = isDemoMode ? [] : liveDataset?.followupEvents ?? [];
  const vignetteAnswers = isDemoMode
    ? demoReady
      ? researchStore.getVignetteAnswers(true)
      : []
    : liveDataset?.vignetteAnswers ?? [];
  const teamMembers = liveDataset?.teamMembers ?? (teamMember ? [teamMember] : []);
  const recruitmentLinks = liveDataset?.recruitmentLinks ?? [];
  const researchEvents = liveDataset?.researchEvents ?? [];
  const cases: ClinicalCase[] = isDemoMode
    ? demoCases
    : liveDataset?.clinicalCases && liveDataset.clinicalCases.length > 0
    ? liveDataset.clinicalCases
    : (liveDataset?.participantCases ?? []).map(pc => ({
        ...pc,
        goldStandardDiagnosis: '',
        acceptableAlternativeDiagnoses: [],
        differentialDiagnosisKeys: [],
        redFlagKeys: [],
        nextManagementStepKey: '',
        rubric: {
          primaryDiagnosisCriteria: '',
          differentialCriteria: '',
          redFlagsCriteria: '',
          nextStepCriteria: ''
        },
        aiStimulus: pc.aiStimulus
          ? {
              ...pc.aiStimulus,
              isMisleading: false
            }
          : undefined
      }));

  const isPiOrDemo = isDemoMode || teamMember?.role === 'pi';
  const effectiveAssessorSlot: 1 | 2 = isDemoMode
    ? demoAssessorSlot
    : teamMember?.assessorSlot === 2
    ? 2
    : 1;

  // Analytics summary
  const analytics = computeAnalytics(
    participants,
    questionnaires,
    aiInteractions,
    vignetteAnswers,
    cases
  );

  // Filter vignette answers for manual scoring queue
  const filteredVignettesForScoring = vignetteAnswers.filter(v => {
    if (vignetteFilter === 'pending_my_slot') {
      return effectiveAssessorSlot === 1 ? !v.assessor1Score : !v.assessor2Score;
    }
    if (vignetteFilter === 'needs_adjudication') {
      return (
        v.assessor1Score !== undefined &&
        v.assessor2Score !== undefined &&
        v.assessor1Score.totalScore !== v.assessor2Score.totalScore &&
        (v.piAdjudicatedScore === null || v.piAdjudicatedScore === undefined)
      );
    }
    return true;
  });

  const currentScoringVignette: VignetteAnswerRecord | undefined =
    filteredVignettesForScoring.find(v => v.id === selectedVignetteId) ||
    filteredVignettesForScoring[0];
  const currentScoringCase = cases.find(c => c.id === currentScoringVignette?.caseId);
  const participantMap = new Map(participants.map(p => [p.id, p]));
  const currentScoringParticipantCode = currentScoringVignette
    ? participantMap.get(currentScoringVignette.participantId)?.code ||
      `ID-${currentScoringVignette.participantId.slice(0, 8)}`
    : '';

  // Pre-populate form marks when switching vignette or slot
  useEffect(() => {
    if (!currentScoringVignette) return;
    const existing =
      effectiveAssessorSlot === 1
        ? currentScoringVignette.assessor1Score
        : currentScoringVignette.assessor2Score;
    if (existing) {
      setScorePrimary(toRubricMark(existing.primaryDiagnosisMark));
      setScoreDiff(toRubricMark(existing.differentialsMark));
      setScoreRedFlags(toRubricMark(existing.redFlagsMark));
      setScoreNextStep(toRubricMark(existing.nextStepMark));
      setAssessorNotes(existing.notes ?? '');
    } else {
      setScorePrimary(1);
      setScoreDiff(1);
      setScoreRedFlags(1);
      setScoreNextStep(1);
      setAssessorNotes('');
    }
    setAdjudicationInput(
      currentScoringVignette.piAdjudicatedScore !== null &&
        currentScoringVignette.piAdjudicatedScore !== undefined
        ? String(currentScoringVignette.piAdjudicatedScore)
        : currentScoringVignette.finalResolvedScore !== undefined
        ? String(currentScoringVignette.finalResolvedScore)
        : ''
    );
  }, [currentScoringVignette?.id, effectiveAssessorSlot]);

  const editingCase = cases.find(c => c.id === selectedEditCaseId) || cases[0];

  const handleUpdateDemoCase = (updated: ClinicalCase) => {
    if (!isDemoMode) return;
    researchStore.updateCase(updated);
    setDemoCases(researchStore.getCases());
  };

  const handleSaveScore = async () => {
    if (!currentScoringVignette || isSavingScore) return;
    setScoreFeedback(null);
    const total = Number((scorePrimary + scoreDiff + scoreRedFlags + scoreNextStep).toFixed(2));

    if (isDemoMode) {
      researchStore.scoreVignette(true, currentScoringVignette.id, effectiveAssessorSlot, {
        primaryDiagnosisMark: scorePrimary,
        differentialsMark: scoreDiff,
        redFlagsMark: scoreRedFlags,
        nextStepMark: scoreNextStep,
        totalScore: total,
        assessorName:
          effectiveAssessorSlot === 1
            ? 'Assessor 1 (Lead Evaluator)'
            : 'Assessor 2 (Independent Reviewer)',
        scoredAt: new Date().toISOString(),
        notes: assessorNotes
      });
      setDemoRefreshNonce(n => n + 1);
      setScoreFeedback({
        type: 'success',
        message: `Saved Assessor ${effectiveAssessorSlot} score (${total} / 4.0) to Demo Cohort.`
      });
      return;
    }

    if (teamMember?.role !== 'assessor') {
      setScoreFeedback({
        type: 'error',
        message:
          'Database RLS restricts direct rubric submission to authorised Assessor accounts (role = assessor). As PI, inspect Assessor 1 & 2 marks and submit final adjudication below.'
      });
      return;
    }

    setIsSavingScore(true);
    try {
      await researchStore.submitLiveAssessorScore({
        vignetteAnswerId: currentScoringVignette.id,
        primaryDiagnosisMark: scorePrimary,
        differentialsMark: scoreDiff,
        redFlagsMark: scoreRedFlags,
        nextStepMark: scoreNextStep,
        notes: assessorNotes
      });
      await loadLiveDataset();
      setScoreFeedback({
        type: 'success',
        message: `Assessor ${effectiveAssessorSlot} score (${total} / 4.0) saved to Supabase.`
      });
    } catch (err) {
      setScoreFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save assessor score.'
      });
    } finally {
      setIsSavingScore(false);
    }
  };

  const handlePiAdjudicate = async () => {
    if (!currentScoringVignette || isSavingScore) return;
    const numeric = parseFloat(adjudicationInput);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 4) {
      setScoreFeedback({
        type: 'error',
        message: 'Adjudicated score must be between 0.0 and 4.0.'
      });
      return;
    }
    setIsSavingScore(true);
    setScoreFeedback(null);
    try {
      await researchStore.piAdjudicateLiveVignette(currentScoringVignette.id, numeric);
      await loadLiveDataset();
      setScoreFeedback({
        type: 'success',
        message: `PI adjudicated score (${numeric} / 4.0) recorded in Supabase.`
      });
    } catch (err) {
      setScoreFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save PI adjudication.'
      });
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleResetDemoCohort = async () => {
    await researchStore.resetDemoData();
    setDemoRefreshNonce(n => n + 1);
  };

  // CSV Exporters
  const handleExportParticipants = () => {
    const rows = participants.map(p => ({
      participant_id: p.id,
      code: p.code,
      recruitment_source: p.recruitmentSource ?? 'direct',
      researcher_code: p.researcherCode ?? '',
      designation:
        p.designation === 'Other' && p.designationOther ? p.designationOther : p.designation,
      specialty: p.specialty === 'Other' && p.specialtyOther ? p.specialtyOther : p.specialty,
      years_since_mbbs_bracket: p.yearsSinceMbbsBracket,
      institution_type:
        p.institutionType === 'Other' && p.institutionOther
          ? p.institutionOther
          : p.institutionType,
      formal_genai_training: p.formalGenAiTraining ? 1 : 0,
      consent_given: p.consentGiven ? 1 : 0,
      completion_status: p.completionStatus ?? (p.completed ? 'completed' : 'in_progress'),
      current_stage: p.currentStage,
      completed: p.completed ? 1 : 0,
      is_demo: p.isDemo ? 1 : 0,
      created_at: p.createdAt,
      completed_at: p.completedAt ?? ''
    }));
    exportToCsv(`carl_participants_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportQuestionnaire = () => {
    const rows = questionnaires.map(q => ({
      response_id: q.id,
      participant_id: q.participantId,
      designation:
        q.designation === 'Other' && q.designationOther ? q.designationOther : q.designation,
      specialty: q.specialty === 'Other' && q.specialtyOther ? q.specialtyOther : q.specialty,
      years_since_mbbs_bracket: q.yearsSinceMbbsBracket,
      hospital_type:
        q.hospitalType === 'Other' && q.hospitalTypeOther ? q.hospitalTypeOther : q.hospitalType,
      formal_genai_training: q.formalGenAiTraining ? 1 : 0,
      used_genai_last_3_months: q.usedGenAiLast3Months ? 1 : 0,
      first_use_duration: q.firstUseDuration ?? '',
      usage_frequency: q.usageFrequency ?? '',
      daily_time_spent: q.dailyTimeSpent ?? '',
      tools_used: (q.toolsUsed ?? []).join('; '),
      medical_specific_tool: q.medicalSpecificToolName ?? '',
      other_tool: q.otherToolName ?? '',
      access_method: q.accessMethod ?? '',
      entered_patient_info: q.enteredPatientInfo ?? '',
      task_diff_dx: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.differentialDiagnoses] : '',
      task_interp_inv: q.taskFrequency
        ? TASK_FREQ_NUMERIC[q.taskFrequency.interpretingInvestigations]
        : '',
      task_choose_inv: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.choosingInvestigations] : '',
      task_mgmt_opt: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.identifyingManagement] : '',
      task_drug_dose: q.taskFrequency
        ? TASK_FREQ_NUMERIC[q.taskFrequency.drugDosesAndInteractions]
        : '',
      task_lit_summary: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.summarisingLiterature] : '',
      task_doc_letters: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.clinicalDocumentation] : '',
      task_patient_comm: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.patientCommunication] : '',
      reasoning_consultation_stage: q.reasoningConsultationStage ?? '',
      last_10_cases_consulted_count: q.last10CasesConsultedCount ?? '',
      verification_frequency: q.verificationFrequency ?? '',
      institutional_policy: q.institutionalPolicy ?? '',
      is_demo: q.isDemo ? 1 : 0,
      created_at: q.createdAt
    }));
    exportToCsv(`carl_questionnaires_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportAiInteractions = () => {
    const rows = aiInteractions.map(r => ({
      interaction_id: r.id,
      participant_id: r.participantId,
      case_id: r.caseId,
      ai_agreement: r.aiAgreement,
      final_diagnosis: r.finalDiagnosis,
      reason_for_decision: r.reasonForDecision,
      final_confidence: r.finalConfidence,
      will_verify: r.willVerify ? 1 : 0,
      verification_targets: r.verificationTargets,
      switched_diagnosis: r.switchedDiagnosis ? 1 : 0,
      switched_towards_correct: r.switchedTowardsCorrect ? 1 : 0,
      accepted_misleading: r.acceptedMisleading ? 1 : 0,
      active_seconds: r.activeSeconds ?? '',
      wall_clock_seconds: r.wallClockSeconds ?? '',
      is_demo: r.isDemo ? 1 : 0,
      completed_at: r.completedAt
    }));
    exportToCsv(`carl_cdss_interactions_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportFollowupEvents = () => {
    const rows = followupEvents.map(ev => ({
      followup_id: ev.id,
      participant_id: ev.participantId,
      case_id: ev.caseId,
      suggestion_id: ev.suggestionId,
      prompt_label: ev.promptLabel,
      clicked_at: ev.clickedAt
    }));
    exportToCsv('carl_followup_events_research.csv', rows);
  };

  const handleExportPostAiVignettes = () => {
    const rows = vignetteAnswers.map(v => ({
      vignette_id: v.id,
      participant_id: v.participantId,
      case_id: v.caseId,
      stage: v.stage,
      most_likely_diagnosis: v.mostLikelyDiagnosis,
      differential_1: v.differential1,
      differential_2: v.differential2,
      red_flags: v.redFlags,
      next_step: v.nextStep,
      confidence: v.confidence,
      assessor1_score: v.assessor1Score?.totalScore ?? null,
      assessor2_score: v.assessor2Score?.totalScore ?? null,
      pi_adjudicated_score: v.piAdjudicatedScore ?? null,
      final_resolved_score: v.finalResolvedScore ?? null,
      scoring_status: v.scoringStatus ?? '',
      active_seconds: v.activeSeconds ?? '',
      wall_clock_seconds: v.wallClockSeconds ?? '',
      is_demo: v.isDemo ? 1 : 0,
      submitted_at: v.submittedAt
    }));
    exportToCsv(`carl_vignette_cases_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportResearchEvents = () => {
    const rows = researchEvents.map(ev => ({
      event_id: ev.id ?? '',
      participant_id: ev.participantId,
      event_type: ev.eventType,
      stage: ev.stage ?? '',
      case_id: ev.caseId ?? '',
      client_timestamp: ev.clientTimestamp ?? '',
      server_timestamp: ev.serverTimestamp ?? ''
    }));
    exportToCsv('carl_research_events.csv', rows);
  };

  const roleDisplayLabel = isDemoMode
    ? 'Demo Investigator Preview'
    : teamMember?.role === 'pi'
    ? 'Principal Investigator'
    : teamMember?.role === 'assessor'
    ? `Clinical Assessor (Slot ${teamMember.assessorSlot ?? '?'})`
    : 'Researcher';

  // Counts for live summary cards across roles
  const totalOperational = isDemoMode ? participants.length : operationalParticipants.length;
  const completedOperational = isDemoMode
    ? analytics.completedCount
    : operationalParticipants.filter(op => op.completed || op.completionStatus === 'completed')
        .length;
  const scoredByMySlotCount = vignetteAnswers.filter(v =>
    effectiveAssessorSlot === 1 ? v.assessor1Score !== undefined : v.assessor2Score !== undefined
  ).length;
  const pendingMySlotCount = Math.max(0, vignetteAnswers.length - scoredByMySlotCount);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Console Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 rounded-xl bg-white border border-slate-200 shadow-2xs gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700 font-semibold mb-1">
            <span>{roleDisplayLabel.toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span>PROTOCOL {settings.protocolNumber}</span>
            {teamMember && !isDemoMode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-slate-600">{teamMember.researcherCode}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {teamMember?.role === 'pi'
              ? 'Clinical AI Reasoning Lab: Principal Investigator Dashboard'
              : 'Clinical AI Reasoning Lab: Researcher Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {teamMember && !isDemoMode
              ? `Signed in as ${teamMember.fullName} (${teamMember.email})`
              : 'Synthetic N=40 simulation analytics, dual-assessor rubrics & SPSS exports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {showDemoToggle && settings.allowDemoToggle && (
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  isDemoMode
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Demo Cohort (N = 40)
              </button>
              <button
                type="button"
                onClick={() => onToggleDemoMode(false)}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  !isDemoMode
                    ? 'bg-teal-600 text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Live Research Mode
              </button>
            </div>
          )}

          {isDemoMode ? (
            <button
              type="button"
              onClick={() => void handleResetDemoCohort()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Cohort</span>
            </button>
          ) : (
            <>
              {onBackToLanding && (
                <button
                  type="button"
                  onClick={onBackToLanding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Researcher Options</span>
                </button>
              )}
              {onOpenEnrollParticipant && (
                <button
                  type="button"
                  onClick={onOpenEnrollParticipant}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll Participant</span>
                </button>
              )}
              <button
                type="button"
                disabled={liveLoading}
                onClick={() => void loadLiveDataset()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${liveLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mode Notice */}
      {isDemoMode ? (
        <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs text-amber-950 font-mono">
          <span>
            SYNTHETIC DEMO MODE ACTIVE: Evaluating 40 simulated clinicians stored locally in your browser. Partitioned from Supabase live records.
          </span>
          <span className="text-[11px] bg-white px-2.5 py-0.5 rounded border border-amber-300 font-bold shrink-0 ml-3">
            DEMO N = 40
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-teal-50/80 border border-teal-200 flex items-center justify-between text-xs text-teal-950 font-mono">
          <span>
            LIVE SUPABASE RESEARCH MODE: Role-scoped access ({roleDisplayLabel}) enforced by PostgreSQL Row-Level Security.
          </span>
          <span className="text-[11px] bg-white px-2.5 py-0.5 rounded border border-teal-300 font-bold text-teal-800 shrink-0 ml-3">
            LIVE STUDY
          </span>
        </div>
      )}

      {/* Loading / Error states for Live Mode */}
      {!isDemoMode && liveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block">Unable to load live dataset</strong>
              <span>{liveError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadLiveDataset()}
            className="px-3 py-1.5 font-semibold text-rose-800 bg-white border border-rose-300 rounded-lg hover:bg-rose-100/60 shrink-0 cursor-pointer"
          >
            Retry Query
          </button>
        </div>
      )}

      {!isDemoMode && liveLoading && !liveDataset && (
        <div className="p-10 rounded-xl bg-white border border-slate-200 text-center text-xs font-mono text-slate-600">
          Loading live Supabase study records for {roleDisplayLabel}...
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2.5">
        {availableTabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelectTab(t.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-teal-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* TAB: OVERVIEW */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Role-scoped KPI strip */}
          {!isDemoMode && teamMember?.role === 'researcher' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700 block mb-1">
                  Recruited Cohort
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                  {totalOperational}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Target: {teamMember.recruitmentTarget} participants
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Study Completed
                </span>
                <div className="text-3xl font-mono font-bold text-emerald-700 tabular-nums">
                  {completedOperational}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {totalOperational > 0
                    ? `${Math.round((completedOperational / totalOperational) * 100)}% completion rate`
                    : '0% completion rate'}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Active In-Progress
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                  {
                    operationalParticipants.filter(
                      op => !op.completed && op.completionStatus !== 'abandoned'
                    ).length
                  }
                </div>
                <div className="text-xs text-slate-600 mt-1">Currently moving through stages</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Active Referral Links
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                  {recruitmentLinks.filter(l => l.isActive).length}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {recruitmentLinks.reduce((acc, l) => acc + l.usesCount, 0)} total link uses
                </div>
              </div>
            </div>
          ) : !isDemoMode && teamMember?.role === 'assessor' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700 block mb-1">
                  Total Vignettes Submitted
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                  {vignetteAnswers.length}
                </div>
                <div className="text-xs text-slate-600 mt-1">Post-AI independent reasoning cases</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  Scored (Slot {effectiveAssessorSlot})
                </span>
                <div className="text-3xl font-mono font-bold text-emerald-700 tabular-nums">
                  {scoredByMySlotCount}
                </div>
                <div className="text-xs text-slate-600 mt-1">Blindly evaluated in your slot</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 block mb-1">
                  Pending Review
                </span>
                <div className="text-3xl font-mono font-bold text-amber-700 tabular-nums">
                  {pendingMySlotCount}
                </div>
                <div className="text-xs text-slate-600 mt-1">Awaiting Assessor {effectiveAssessorSlot} mark</div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Published Answer Keys
                </span>
                <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                  {cases.filter(c => c.stage === 'post_ai').length}
                </div>
                <div className="text-xs text-slate-600 mt-1">Standardized 4-mark rubrics loaded</div>
              </div>
            </div>
          ) : (
            <>
              {/* Enrollment & Completion Row (PI / Demo) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 block">
                    Total Enrolled
                  </span>
                  <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                    {analytics.totalEnrolled}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {analytics.completionRate}% study completion
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                    Completed (8/8)
                  </span>
                  <div className="text-2xl font-mono font-bold text-emerald-700 tabular-nums mt-1">
                    {analytics.completedCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Mean CDSS time: {analytics.meanCdssActiveSeconds}s
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    In Progress
                  </span>
                  <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                    {analytics.inProgressCount + analytics.registeredCount}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Abandoned: {analytics.abandonedCount}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 block">
                    Misleading AI Accepted
                  </span>
                  <div className="text-2xl font-mono font-bold text-rose-700 tabular-nums mt-1">
                    {analytics.primaryMisleadingAcceptanceRate}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Mean {analytics.meanMisleadingAcceptedCount} / 3 cases
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Vignette Mean Score
                  </span>
                  <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums mt-1">
                    {analytics.postAiMeanScore} / {analytics.postAiMaxScore}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {analytics.postAiMeanPercentage}% · SD {analytics.postAiStdDev}
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Primary Outcome: Misleading AI Acceptance Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Number of deliberately misleading CDSS recommendations accepted per clinician (0 to 3)
                  </p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.misleadingDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="count"
                          tickFormatter={v => `${v} Accepted`}
                          textAnchor="middle"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={val => [`${val} clinicians`, 'Count']}
                          labelFormatter={l => `${l} Misleading Advice Accepted`}
                        />
                        <Bar dataKey="participants" fill="#e11d48" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Automation Bias by Clinical Designation
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Misleading AI acceptance rate stratified by clinician hierarchy
                  </p>
                  {analytics.designationBreakdown.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                      Awaiting CDSS participant submissions.
                    </div>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.designationBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={val => [`${val}%`, 'Acceptance Rate']} />
                          <Bar
                            dataKey="misleadingAcceptanceRate"
                            fill="#0D9488"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: PARTICIPANTS */}
      {/* ==================================================== */}
      {activeTab === 'participants' && (
        <OperationalParticipantsTable
          participants={participants}
          operationalParticipants={operationalParticipants}
          isPiOrDemo={isPiOrDemo}
        />
      )}

      {/* ==================================================== */}
      {/* TAB: RECRUITMENT & TEAM */}
      {/* ==================================================== */}
      {activeTab === 'recruitment' && (
        <RecruitmentAndTeamPanel
          member={teamMember}
          teamMembers={teamMembers}
          recruitmentLinks={recruitmentLinks}
          operationalParticipants={operationalParticipants}
          participants={participants}
          isDemoMode={isDemoMode}
        />
      )}

      {/* ==================================================== */}
      {/* TAB: QUESTIONNAIRE & OFFLOADING */}
      {/* ==================================================== */}
      {activeTab === 'offloading' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Q1 · 3-Month Clinical GenAI Use
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                {analytics.genAiAdoptionRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Formal training: {analytics.formalTrainingRate}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Q10 · Last 10 Cases Consulted
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                {analytics.meanCasesConsultedOutOf10} / 10
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Mean cases among active users
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-rose-700 uppercase block">
                Q7 · Patient Info Entered
              </span>
              <div className="text-2xl font-mono font-bold text-rose-700 mt-1 tabular-nums">
                {analytics.patientInfoEnteredRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Entered clinical data into public GenAI
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-teal-700 uppercase block">
                Q11 · Guideline Verification
              </span>
              <div className="text-2xl font-mono font-bold text-teal-700 mt-1 tabular-nums">
                {analytics.alwaysOrOftenVerifyRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Verify answers Often / Very often
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Q8 · Work-Related Task Offloading Frequency (1 = Never to 5 = Very often)
              </h3>
              <div className="space-y-3 pt-2 text-xs">
                {analytics.taskFrequencyAverages.map(item => (
                  <div key={item.task} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>{item.task}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {item.meanScore} / 5 ({item.oftenOrVeryOftenPct}% Often+)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${(item.meanScore / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Q9 · Stage of Clinical Reasoning When GenAI Is Consulted
                </h3>
                {analytics.consultationStageBreakdown.length === 0 ? (
                  <p className="text-xs text-slate-500">No active GenAI user responses yet.</p>
                ) : (
                  <div className="space-y-2.5 pt-1 text-xs">
                    {analytics.consultationStageBreakdown.map(row => (
                      <div key={row.stage} className="space-y-1">
                        <div className="flex justify-between text-slate-700 gap-2">
                          <span>{row.stage}</span>
                          <span className="font-mono font-bold text-slate-900 shrink-0 tabular-nums">
                            {row.count} ({row.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-slate-900 h-2 rounded-full"
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Q12 · Institutional Written GenAI Policy Awareness
                </h3>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {analytics.institutionalPolicyBreakdown.map(item => (
                    <div
                      key={item.status}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center"
                    >
                      <div className="text-xs font-semibold text-slate-700">{item.status}</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5 tabular-nums">
                        {item.percentage}%
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">n = {item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <QuestionnaireStatusTable participants={participants} questionnaires={questionnaires} />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: CDSS & FOLLOW-UP EVENTS */}
      {/* ==================================================== */}
      {activeTab === 'automation_bias' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Standardized CDSS Stimuli Breakdown (5 Cases)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Participant acceptance and verification across the 2 clinically appropriate and 3 deliberately misleading CDSS stimuli.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <th className="p-3 font-semibold">Case</th>
                    <th className="p-3 font-semibold">Domain</th>
                    <th className="p-3 font-semibold">Clinical Stimulus Classification</th>
                    <th className="p-3 font-semibold text-right">Acceptance Rate</th>
                    <th className="p-3 font-semibold text-right">Verification Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.caseWiseMisleadingBreakdown.map(c => {
                    const matchedCase = cases.find(
                      item => item.caseNumber === c.caseNumber && item.stage === 'ai_simulation'
                    );
                    const isMisleading = matchedCase?.aiStimulus?.isMisleading;
                    return (
                      <tr key={c.caseNumber} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-900">Case {c.caseNumber}</td>
                        <td className="p-3 text-slate-700">{matchedCase?.domain}</td>
                        <td className="p-3">
                          {isMisleading ? (
                            <span className="font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                              DELIBERATELY MISLEADING ({matchedCase?.aiStimulus?.misleadingClassification})
                            </span>
                          ) : (
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                              CLINICALLY APPROPRIATE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {c.acceptanceRate}%
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700 tabular-nums">
                          {c.verificationRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <AiRecordsAndFollowupsPanel
            participants={participants}
            aiInteractions={aiInteractions}
            followupEvents={followupEvents}
            cases={cases}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: VIGNETTES & DUAL-ASSESSOR SCORING CONSOLE */}
      {/* ==================================================== */}
      {activeTab === 'manual_scoring' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Inter-Rater Agreement %
              </span>
              <div className="text-2xl font-mono font-bold text-teal-700 mt-1 tabular-nums">
                {analytics.interRaterAgreementPercentage}%
              </div>
              <p className="text-[11px] text-slate-500">Dual-evaluator score concordance</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Cohen&apos;s Kappa (Approx)
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                κ = {analytics.cohensKappaApprox}
              </div>
              <p className="text-[11px] text-slate-500">Primary diagnosis inter-rater agreement</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Dual-Evaluated Vignettes
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1 tabular-nums">
                {analytics.totalVignettesScoredByBoth} / {vignetteAnswers.length}
              </div>
              <p className="text-[11px] text-slate-500">
                Scored by both Assessor 1 &amp; Assessor 2
              </p>
            </div>
          </div>

          {analytics.postAiCaseMeans.length > 0 && isPiOrDemo && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 font-mono">
                Mean Score by Vignette Case (Max 4.0 Marks)
              </h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.postAiCaseMeans}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={val => [`${val} / 4.0`, 'Mean Score']} />
                    <Bar dataKey="meanScore" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Scoring Workspace */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Independent Vignette Grading &amp; Slot Isolation Console
                </h3>
                <p className="text-xs text-slate-500">
                  {isDemoMode
                    ? 'Demo simulation: toggle between Assessor 1 & Assessor 2 slots.'
                    : teamMember?.role === 'assessor'
                    ? `Blinded Assessor Slot ${effectiveAssessorSlot}: RLS restricts scoring exclusively to your assigned slot.`
                    : 'Principal Investigator view: review Assessor 1 & Assessor 2 scores side-by-side and resolve discrepancies.'}
                </p>
              </div>

              {isDemoMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Demo Slot:</span>
                  <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setDemoAssessorSlot(1)}
                      className={`px-3 py-1 rounded font-medium cursor-pointer ${
                        demoAssessorSlot === 1 ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Assessor 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoAssessorSlot(2)}
                      className={`px-3 py-1 rounded font-medium cursor-pointer ${
                        demoAssessorSlot === 2 ? 'bg-teal-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Assessor 2
                    </button>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-xs font-mono font-semibold text-teal-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {teamMember?.role === 'assessor'
                      ? `Locked: Assessor Slot ${effectiveAssessorSlot}`
                      : 'PI Adjudication Access'}
                  </span>
                </div>
              )}
            </div>

            {/* Filter & Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Vignette Submission ({filteredVignettesForScoring.length} matching)
                </label>
                <select
                  value={currentScoringVignette?.id || ''}
                  onChange={e => setSelectedVignetteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                >
                  {filteredVignettesForScoring.slice(0, 120).map(v => {
                    const c = cases.find(item => item.id === v.caseId);
                    const pCode =
                      participantMap.get(v.participantId)?.code ||
                      `ID-${v.participantId.slice(0, 8)}`;
                    const statusLabel =
                      v.finalResolvedScore !== undefined
                        ? `Score: ${v.finalResolvedScore}/4`
                        : v.scoringStatus || 'pending';
                    return (
                      <option key={v.id} value={v.id}>
                        {pCode} · Case {c?.caseNumber ?? '?'} ({c?.domain}) — {statusLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Queue Filter
                </label>
                <select
                  value={vignetteFilter}
                  onChange={e =>
                    setVignetteFilter(e.target.value as typeof vignetteFilter)
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                >
                  <option value="all">All Vignette Answers ({vignetteAnswers.length})</option>
                  {teamMember?.role !== 'pi' && (
                    <option value="pending_my_slot">
                      Pending My Slot ({pendingMySlotCount})
                    </option>
                  )}
                  {(isDemoMode || teamMember?.role === 'pi') && (
                    <option value="needs_adjudication">Discrepancies Needing PI Adjudication</option>
                  )}
                </select>
              </div>
            </div>

            {currentScoringVignette && currentScoringCase ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Participant Written Response */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">
                      Participant Vignette Answer
                    </span>
                    <span className="font-mono text-slate-600">
                      {currentScoringParticipantCode} · Case {currentScoringCase.caseNumber}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Primary Diagnosis Submitted:
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-900">
                      {currentScoringVignette.mostLikelyDiagnosis}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Differential Diagnoses:
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                      1. {currentScoringVignette.differential1} <br />
                      2. {currentScoringVignette.differential2}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Identified Red Flags:
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                      {currentScoringVignette.redFlags}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      Next Management Step:
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                      {currentScoringVignette.nextStep}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 pt-1">
                    <span>
                      Self-Reported Confidence:{' '}
                      <strong className="font-mono text-slate-900">
                        {currentScoringVignette.confidence} / 5
                      </strong>
                    </span>
                    {typeof currentScoringVignette.activeSeconds === 'number' && (
                      <span className="font-mono text-[11px] text-slate-500">
                        Active Time: {currentScoringVignette.activeSeconds}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Rubric & Scoring / PI Adjudication Column */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">
                      Expert Answer Key &amp; 4-Mark Rubric
                    </span>
                    <span className="font-mono text-teal-700 font-bold">
                      {currentScoringVignette.scoringStatus || 'pending'}
                    </span>
                  </div>

                  {/* Criteria Boxes */}
                  <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">1. Primary Diagnosis (0–1)</span>
                      {(isDemoMode || teamMember?.role === 'assessor') && (
                        <select
                          value={scorePrimary}
                          onChange={e => setScorePrimary(toRubricMark(parseFloat(e.target.value)))}
                          className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                        >
                          <option value={1.0}>1.0 (Full Match)</option>
                          <option value={0.5}>0.5 (Partial)</option>
                          <option value={0.0}>0.0 (Missed)</option>
                        </select>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Gold Standard:</strong>{' '}
                      {currentScoringCase.goldStandardDiagnosis}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">2. Differentials (0–1)</span>
                      {(isDemoMode || teamMember?.role === 'assessor') && (
                        <select
                          value={scoreDiff}
                          onChange={e => setScoreDiff(toRubricMark(parseFloat(e.target.value)))}
                          className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                        >
                          <option value={1.0}>1.0 (2 Plausible)</option>
                          <option value={0.5}>0.5 (1 Plausible)</option>
                          <option value={0.0}>0.0 (Inaccurate)</option>
                        </select>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Accepted Keys:</strong>{' '}
                      {currentScoringCase.differentialDiagnosisKeys.join(', ')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">3. Red Flags (0–1)</span>
                      {(isDemoMode || teamMember?.role === 'assessor') && (
                        <select
                          value={scoreRedFlags}
                          onChange={e => setScoreRedFlags(toRubricMark(parseFloat(e.target.value)))}
                          className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                        >
                          <option value={1.0}>1.0 (Identified)</option>
                          <option value={0.5}>0.5 (Partial)</option>
                          <option value={0.0}>0.0 (Missed)</option>
                        </select>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Key Red Flags:</strong>{' '}
                      {currentScoringCase.redFlagKeys.join('; ')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">4. Next Step (0–1)</span>
                      {(isDemoMode || teamMember?.role === 'assessor') && (
                        <select
                          value={scoreNextStep}
                          onChange={e => setScoreNextStep(toRubricMark(parseFloat(e.target.value)))}
                          className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                        >
                          <option value={1.0}>1.0 (Appropriate)</option>
                          <option value={0.5}>0.5 (Delayed)</option>
                          <option value={0.0}>0.0 (Unsafe)</option>
                        </select>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Gold Standard Action:</strong>{' '}
                      {currentScoringCase.nextManagementStepKey}
                    </p>
                  </div>

                  {/* Assessor Submit Section */}
                  {(isDemoMode || teamMember?.role === 'assessor') && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Assessor {effectiveAssessorSlot} Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={assessorNotes}
                          onChange={e => setAssessorNotes(e.target.value)}
                          placeholder="Optional grading rationale..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs">
                          Assessor {effectiveAssessorSlot} Total:{' '}
                          <span className="font-mono font-bold text-teal-700 text-sm">
                            {scorePrimary + scoreDiff + scoreRedFlags + scoreNextStep} / 4.0
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isSavingScore}
                          onClick={() => void handleSaveScore()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>
                            {isSavingScore
                              ? 'Saving...'
                              : `Save Assessor ${effectiveAssessorSlot} Score`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PI Side-by-side Assessor Comparison & Adjudication */}
                  {!isDemoMode && teamMember?.role === 'pi' && (
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                      <div className="font-bold text-slate-900">
                        Dual-Assessor Comparison &amp; PI Adjudication
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <div className="font-semibold text-slate-600">Assessor 1 Score</div>
                          <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                            {currentScoringVignette.assessor1Score
                              ? `${currentScoringVignette.assessor1Score.totalScore} / 4.0`
                              : 'Pending'}
                          </div>
                          {currentScoringVignette.assessor1Score?.notes && (
                            <p className="text-slate-500 mt-1">
                              {currentScoringVignette.assessor1Score.notes}
                            </p>
                          )}
                        </div>
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <div className="font-semibold text-slate-600">Assessor 2 Score</div>
                          <div className="text-base font-mono font-bold text-slate-900 mt-0.5">
                            {currentScoringVignette.assessor2Score
                              ? `${currentScoringVignette.assessor2Score.totalScore} / 4.0`
                              : 'Pending'}
                          </div>
                          {currentScoringVignette.assessor2Score?.notes && (
                            <p className="text-slate-500 mt-1">
                              {currentScoringVignette.assessor2Score.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-end gap-2 pt-1">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            PI Final Adjudicated Score (0.0 – 4.0)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={4}
                            step={0.5}
                            value={adjudicationInput}
                            onChange={e => setAdjudicationInput(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-xs bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={isSavingScore}
                          onClick={() => void handlePiAdjudicate()}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          {isSavingScore ? 'Recording...' : 'Record PI Adjudication'}
                        </button>
                      </div>
                    </div>
                  )}

                  {scoreFeedback && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2 font-medium ${
                        scoreFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {scoreFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{scoreFeedback.message}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No vignette submissions match the current filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: CLINICAL CASES & ANSWER KEYS */}
      {/* ==================================================== */}
      {activeTab === 'cases' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Standardized Case Library ({cases.length} Cases)
              </h3>
              <p className="text-xs text-slate-500">
                {isDemoMode
                  ? 'Inspect or edit local Demo Mode stimuli and rubrics.'
                  : teamMember?.role === 'researcher'
                  ? 'Read-only view of the 11 published participant clinical cases (answer keys restricted to PI & Assessors).'
                  : 'Read-only view of the 11 Supabase clinical cases and locked answer keys.'}
              </p>
            </div>

            <select
              value={editingCase?.id || ''}
              onChange={e => setSelectedEditCaseId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
            >
              {cases.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.stage === 'ai_simulation' ? 'CDSS' : 'VIGNETTE'}] Case {c.caseNumber}:{' '}
                  {c.domain} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {editingCase && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                  <input
                    type="text"
                    disabled
                    value={editingCase.stage === 'ai_simulation' ? 'CDSS Simulation' : 'Post-AI Vignette'}
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Domain</label>
                  <input
                    type="text"
                    disabled={!isDemoMode}
                    value={editingCase.domain}
                    onChange={e => handleUpdateDemoCase({ ...editingCase, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                  <input
                    type="text"
                    disabled={!isDemoMode}
                    value={editingCase.title}
                    onChange={e => handleUpdateDemoCase({ ...editingCase, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clinical Vignette Presentation
                </label>
                <textarea
                  rows={3}
                  disabled={!isDemoMode}
                  value={editingCase.presentation}
                  onChange={e =>
                    handleUpdateDemoCase({ ...editingCase, presentation: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50"
                />
              </div>

              {editingCase.goldStandardDiagnosis && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gold Standard Diagnosis (Restricted Answer Key)
                  </label>
                  <input
                    type="text"
                    disabled={!isDemoMode}
                    value={editingCase.goldStandardDiagnosis}
                    onChange={e =>
                      handleUpdateDemoCase({
                        ...editingCase,
                        goldStandardDiagnosis: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-teal-800 disabled:bg-slate-50"
                  />
                </div>
              )}

              {editingCase.clinicalImages && editingCase.clinicalImages.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <ClinicalImageGallery images={editingCase.clinicalImages} />
                </div>
              )}

              {editingCase.stage === 'ai_simulation' && editingCase.aiStimulus && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">
                      Fixed AI Consultation Stimulus
                    </span>
                    {editingCase.goldStandardDiagnosis && (
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold ${
                          editingCase.aiStimulus.isMisleading
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {editingCase.aiStimulus.isMisleading
                          ? 'DELIBERATELY MISLEADING'
                          : 'CLINICALLY APPROPRIATE'}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      AI Proposed Diagnosis:
                    </span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-900">
                      {editingCase.aiStimulus.diagnosis}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      AI Recommendation:
                    </span>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                      {editingCase.aiStimulus.recommendation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: CSV & SPSS DATA EXPORT */}
      {/* ==================================================== */}
      {activeTab === 'export' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Multi-Table Relational Data Export (CSV &amp; SPSS)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download formula-sanitized CSV tables ready for R, Stata, Python, or IBM SPSS Statistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Participants Cohort ({participants.length})</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Participant code, recruitment attribution, designation, specialty, MBBS bracket, and completion milestones.
                </p>
              </div>
              <button
                type="button"
                disabled={participants.length === 0}
                onClick={handleExportParticipants}
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export participants.csv</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Questionnaires ({questionnaires.length})</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Section I demographics + Section II GenAI exposure &amp; Q8 task-offloading matrix.
                </p>
              </div>
              <button
                type="button"
                disabled={questionnaires.length === 0}
                onClick={handleExportQuestionnaire}
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export questionnaires.csv</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>CDSS Interactions ({aiInteractions.length})</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Agreement, final diagnosis, rationale, verification intent, active timing, and server misleading evaluation flags.
                </p>
              </div>
              <button
                type="button"
                disabled={aiInteractions.length === 0}
                onClick={handleExportAiInteractions}
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export cdss_interactions.csv</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>Vignette Answers &amp; Scores ({vignetteAnswers.length})</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Independent reasoning submissions, Assessor 1 &amp; 2 totals, PI adjudication, and timing.
                </p>
              </div>
              <button
                type="button"
                disabled={vignetteAnswers.length === 0}
                onClick={handleExportPostAiVignettes}
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export vignette_scores.csv</span>
              </button>
            </div>

            {!isDemoMode && (
              <>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                      <span>CDSS Follow-Up Events ({followupEvents.length})</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Exact timestamps of standardized CDSS follow-up prompts clicked per participant &amp; case.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={followupEvents.length === 0}
                    onClick={handleExportFollowupEvents}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export followup_events.csv</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                      <span>Telemetry Audit Log ({researchEvents.length})</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Session resumptions, tab visibility events, and case transition timestamps.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={researchEvents.length === 0}
                    onClick={handleExportResearchEvents}
                    className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export research_events.csv</span>
                  </button>
                </div>
              </>
            )}

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-teal-950 mb-1">
                  <Code className="w-4 h-4 text-teal-700" />
                  <span>SPSS Variable Codebook (.sps)</span>
                </div>
                <p className="text-[11px] text-teal-900">
                  IBM SPSS Statistics syntax script defining variable labels, value labels, and core analyses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([SPSS_SYNTAX_SPS], { type: 'text/plain;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'carl_spss_analysis.sps';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download SPSS Syntax (.sps)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: PROTOCOL SETTINGS */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Study Protocol Metadata &amp; Authentication Governance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Institutional details displayed on consent and debriefing screens. Researcher authentication is enforced strictly by Supabase Auth and{' '}
              <code className="font-mono text-[11px]">research_team_members</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={e => onUpdateSettings({ institutionName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ethics Committee Protocol Ref
              </label>
              <input
                type="text"
                value={settings.protocolNumber}
                onChange={e => onUpdateSettings({ protocolNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Investigator Label
              </label>
              <input
                type="text"
                value={settings.primaryInvestigator}
                onChange={e => onUpdateSettings({ primaryInvestigator: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Retention Period (Months)
              </label>
              <input
                type="number"
                value={settings.dataRetentionMonths}
                onChange={e =>
                  onUpdateSettings({ dataRetentionMonths: parseInt(e.target.value, 10) || 24 })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearcherDashboard;
