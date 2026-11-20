import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Download,
  RotateCcw,
  Code,
  FileSpreadsheet
} from 'lucide-react';
import {
  ClinicalCase,
  ResearchProtocolSettings,
  GenAiTaskFrequency
} from '../../types';
import { researchStore } from '../../services/researchStore';
import { computeAnalytics, exportToCsv } from '../../services/analytics';
import { FASTAPI_MAIN_PY, SUPABASE_SQL_MIGRATION, SPSS_SYNTAX_SPS } from '../../data/backendCode';
import { ClinicalImageGallery } from '../common/ClinicalImageGallery';

interface ResearcherDashboardProps {
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  settings: ResearchProtocolSettings;
  onUpdateSettings: (newSettings: Partial<ResearchProtocolSettings>) => void;
  cases: ClinicalCase[];
  onUpdateCase: (c: ClinicalCase) => void;
}

const TASK_FREQ_NUMERIC: Record<GenAiTaskFrequency, number> = {
  'Never': 1,
  'Rarely': 2,
  'Sometimes': 3,
  'Often': 4,
  'Very often': 5
};

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({
  isDemoMode,
  onToggleDemoMode,
  settings,
  onUpdateSettings,
  cases,
  onUpdateCase
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'automation_bias'
    | 'independent_reasoning'
    | 'offloading'
    | 'manual_scoring'
    | 'cases'
    | 'export'
    | 'backend'
    | 'settings'
  >('overview');

  // Load datasets based on active mode
  const participants = researchStore.getParticipants(isDemoMode);
  const questionnaires = researchStore.getQuestionnaires(isDemoMode);
  const aiInteractions = researchStore.getAiInteractions(isDemoMode);
  const vignetteAnswers = researchStore.getVignetteAnswers(isDemoMode);

  // Compute live research analytics
  const analytics = computeAnalytics(
    participants,
    questionnaires,
    aiInteractions,
    vignetteAnswers,
    cases
  );

  // Manual scoring state
  const [selectedVignetteId, setSelectedVignetteId] = useState<string>('');
  const [activeAssessor, setActiveAssessor] = useState<1 | 2>(1);
  const [scorePrimary, setScorePrimary] = useState<number>(1);
  const [scoreDiff, setScoreDiff] = useState<number>(1);
  const [scoreRedFlags, setScoreRedFlags] = useState<number>(1);
  const [scoreNextStep, setScoreNextStep] = useState<number>(1);
  const [assessorNotes, setAssessorNotes] = useState<string>('');
  const [scoreSavedMessage, setScoreSavedMessage] = useState<string | null>(null);
  const [copiedCodeType, setCopiedCodeType] = useState<string | null>(null);

  const currentScoringVignette =
    vignetteAnswers.find(v => v.id === selectedVignetteId) || vignetteAnswers[0];
  const currentScoringCase = cases.find(c => c.id === currentScoringVignette?.caseId);
  const currentParticipant = participants.find(
    p => p.id === currentScoringVignette?.participantId
  );

  // Case editor state
  const [selectedEditCaseId, setSelectedEditCaseId] = useState<string>(cases[0]?.id || '');
  const editingCase = cases.find(c => c.id === selectedEditCaseId) || cases[0];

  const handleSaveScore = () => {
    if (!currentScoringVignette) return;
    const total = scorePrimary + scoreDiff + scoreRedFlags + scoreNextStep;
    researchStore.scoreVignette(isDemoMode, currentScoringVignette.id, activeAssessor, {
      primaryDiagnosisMark: scorePrimary,
      differentialsMark: scoreDiff,
      redFlagsMark: scoreRedFlags,
      nextStepMark: scoreNextStep,
      totalScore: total,
      assessorName:
        activeAssessor === 1 ? 'Assessor 1 (Lead Evaluator)' : 'Assessor 2 (Independent Reviewer)',
      scoredAt: new Date().toISOString(),
      notes: assessorNotes
    });
    setScoreSavedMessage(`Assessor ${activeAssessor} score saved: ${total} / 4 marks.`);
    setTimeout(() => setScoreSavedMessage(null), 3500);
  };

  const handleResetDemoCohort = () => {
    researchStore.resetDemoData();
    window.location.reload();
  };

  // CSV Exporters
  const handleExportParticipants = () => {
    const rows = participants.map(p => ({
      participant_id: p.id,
      code: p.code,
      designation: p.designation === 'Other' && p.designationOther ? p.designationOther : p.designation,
      specialty: p.specialty === 'Other' && p.specialtyOther ? p.specialtyOther : p.specialty,
      years_since_mbbs_bracket: p.yearsSinceMbbsBracket,
      institution_type:
        p.institutionType === 'Other' && p.institutionOther
          ? p.institutionOther
          : p.institutionType,
      formal_genai_training: p.formalGenAiTraining ? 1 : 0,
      consent_given: p.consentGiven ? 1 : 0,
      completed: p.completed ? 1 : 0,
      is_demo: p.isDemo ? 1 : 0,
      created_at: p.createdAt
    }));
    exportToCsv(`carl_participants_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportQuestionnaire = () => {
    const rows = questionnaires.map(q => ({
      response_id: q.id,
      participant_id: q.participantId,
      designation: q.designation === 'Other' && q.designationOther ? q.designationOther : q.designation,
      specialty: q.specialty === 'Other' && q.specialtyOther ? q.specialtyOther : q.specialty,
      years_since_mbbs_bracket: q.yearsSinceMbbsBracket,
      hospital_type: q.hospitalType === 'Other' && q.hospitalTypeOther ? q.hospitalTypeOther : q.hospitalType,
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
      task_interp_inv: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.interpretingInvestigations] : '',
      task_choose_inv: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.choosingInvestigations] : '',
      task_mgmt_opt: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.identifyingManagement] : '',
      task_drug_dose: q.taskFrequency ? TASK_FREQ_NUMERIC[q.taskFrequency.drugDosesAndInteractions] : '',
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
      initial_diagnosis: r.initialDiagnosis,
      initial_confidence: r.initialConfidence,
      ai_agreement: r.aiAgreement,
      final_diagnosis: r.finalDiagnosis,
      final_confidence: r.finalConfidence,
      will_verify: r.willVerify ? 1 : 0,
      switched_diagnosis: r.switchedDiagnosis ? 1 : 0,
      switched_towards_correct: r.switchedTowardsCorrect ? 1 : 0,
      accepted_misleading: r.acceptedMisleading ? 1 : 0,
      is_demo: r.isDemo ? 1 : 0,
      completed_at: r.completedAt
    }));
    exportToCsv(`carl_cdss_interactions_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportPostAiVignettes = () => {
    const list = vignetteAnswers.filter(v => v.stage === 'post_ai');
    const rows = list.map(v => ({
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
      final_resolved_score: v.finalResolvedScore ?? null,
      is_demo: v.isDemo ? 1 : 0,
      submitted_at: v.submittedAt
    }));
    exportToCsv(`carl_vignette_cases_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-lg bg-white border border-slate-200/90 shadow-2xs gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span>INVESTIGATOR COMMAND CENTER</span>
            <span aria-hidden="true">·</span>
            <span>PROTOCOL {settings.protocolNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Clinical AI Reasoning Lab: Research Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GenAI exposure & cognitive offloading metrics, automation bias rates, dual-assessor rubrics & SPSS exports.
          </p>
        </div>

        {/* Mode Selector & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 bg-slate-100 rounded border border-slate-200 text-xs font-medium">
            <button
              onClick={() => onToggleDemoMode(true)}
              className={`px-3 py-1.5 rounded transition-colors ${
                isDemoMode ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Demo Cohort (N = 40)
            </button>
            <button
              onClick={() => onToggleDemoMode(false)}
              className={`px-3 py-1.5 rounded transition-colors ${
                !isDemoMode ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Research Data ({researchStore.getParticipants(false).length})
            </button>
          </div>

          {isDemoMode && (
            <button
              onClick={handleResetDemoCohort}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-200 shadow-2xs"
              title="Reset synthetic demo cohort back to default 40 doctors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Cohort</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Notice */}
      {isDemoMode ? (
        <div className="p-3 rounded bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950 font-mono">
          <span>SYNTHETIC DEMO MODE ACTIVE: Evaluating 40 simulated clinicians. Fictional demo records are partitioned from genuine research data.</span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-300 font-bold shrink-0 ml-3">
            N = 40
          </span>
        </div>
      ) : (
        <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-mono">
          <span>GENUINE RESEARCH MODE ACTIVE: Live consenting participants only. Zero synthetic records.</span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold shrink-0 ml-3">
            LIVE STUDY
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-2">
        {[
          { id: 'overview', label: '1. Executive Overview' },
          { id: 'automation_bias', label: '2. CDSS & Automation Bias' },
          { id: 'independent_reasoning', label: '3. Vignette Cases' },
          { id: 'offloading', label: '4. GenAI Exposure & Offloading' },
          { id: 'manual_scoring', label: '5. Dual-Assessor Console' },
          { id: 'cases', label: '6. Case Management' },
          { id: 'export', label: '7. SPSS Data Export' },
          { id: 'backend', label: '8. FastAPI / SQL Code' },
          { id: 'settings', label: '9. Protocol Settings' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ==================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 block mb-1">
                Primary Outcome · Automation Bias
              </span>
              <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analytics.primaryMisleadingAcceptanceRate}%
              </div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                Misleading AI Advice Accepted
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                Mean: {analytics.meanMisleadingAcceptedCount} / 3 cases per doctor
              </div>
            </div>

            <div className="p-5 rounded bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Secondary Outcome · Sound AI
              </span>
              <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analytics.soundAdviceAcceptanceRate}%
              </div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                Appropriate Advice Accepted
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                Mean: {analytics.meanSoundAcceptedCount} / 2 cases per doctor
              </div>
            </div>

            <div className="p-5 rounded bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Diagnostic Revision Rate
              </span>
              <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analytics.diagnosticSwitchingRate}%
              </div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                Initial-to-Final Modifications
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                {analytics.switchAwayToMisleadingRate}% switched to misleading AI
              </div>
            </div>

            <div className="p-5 rounded bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Vignette Cases
              </span>
              <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analytics.postAiMeanScore} / {analytics.postAiMaxScore}
              </div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                Mean Vignette Cases Score
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                SD = {analytics.postAiStdDev} · {analytics.postAiMeanPercentage}% accuracy
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Primary Outcome: Misleading AI Acceptance Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Number of deliberately misleading recommendations accepted per participant (Range: 0 to 3)
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.misleadingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="count" tickFormatter={(v) => `${v} Accepted`} textAnchor="middle" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} doctors`, 'Count']}
                      labelFormatter={(l) => `${l} Misleading Advice Accepted`}
                    />
                    <Bar dataKey="participants" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Automation Bias by Clinical Hierarchy
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Misleading AI acceptance rate stratified by clinician designation
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.designationBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Acceptance Rate']} />
                    <Bar dataKey="misleadingAcceptanceRate" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: AUTOMATION BIAS & AI INTERACTIONS */}
      {/* ==================================================== */}
      {activeTab === 'automation_bias' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Standardized CDSS Stimuli Breakdown (5 Cases)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation of participant acceptance and verification across the 2 clinically appropriate and 3 misleading CDSS stimuli.
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
                    const matchedCase = cases.find(item => item.caseNumber === c.caseNumber && item.stage === 'ai_simulation');
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
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {c.acceptanceRate}%
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {c.verificationRate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Unverified Misleading Acceptance
              </div>
              <div className="text-2xl font-mono font-bold text-rose-600">
                {analytics.unverifiedMisleadingAcceptanceRate}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Accepted misleading AI guidance with zero independent verification plan.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Switched to Inaccurate AI
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900">
                {analytics.switchAwayToMisleadingRate}%
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Clinicians who had the correct initial diagnosis but were swayed away by misleading AI advice.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Confidence Shift
              </div>
              <div className="text-2xl font-mono font-bold text-slate-900">
                {analytics.confidenceDelta >= 0 ? `+${analytics.confidenceDelta}` : analytics.confidenceDelta}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Mean initial confidence {analytics.initialMeanConfidence} → Final confidence {analytics.finalMeanConfidence} / 5.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: POST-AI INDEPENDENT REASONING */}
      {/* ==================================================== */}
      {activeTab === 'independent_reasoning' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Vignette Cases Assessment (0–{analytics.postAiMaxScore} Marks)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Performance across the {cases.filter(c => c.stage === 'post_ai').length} independent clinical Vignette Cases (4 marks per case: Primary Diagnosis, Differentials, Red Flags, Next Step).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Vignette Cases Mean Total Score</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {analytics.postAiMeanScore} / {analytics.postAiMaxScore}
                </div>
                <div className="text-[11px] font-mono text-slate-500">SD = {analytics.postAiStdDev}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mean Rubric Accuracy</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {analytics.postAiMeanPercentage}%
                </div>
                <div className="text-[11px] font-mono text-slate-500">Across {cases.filter(c => c.stage === 'post_ai').length} Vignette Cases</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Inter-Rater Agreement</span>
                <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
                  {analytics.interRaterAgreementPercentage}%
                </div>
                <div className="text-[11px] font-mono text-slate-500">κ = {analytics.cohensKappaApprox} (Dual-scored)</div>
              </div>
            </div>

            {analytics.postAiCaseMeans.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 font-mono">
                  Mean Score by Vignette Case (Max 4.0 Marks)
                </h4>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.postAiCaseMeans}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="domain" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => [`${val} / 4.0`, 'Mean Score']} />
                      <Bar dataKey="meanScore" fill="#0f172a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: GENAI EXPOSURE & COGNITIVE OFFLOADING */}
      {/* ==================================================== */}
      {activeTab === 'offloading' && (
        <div className="space-y-6">
          {/* Top Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Q1 · 3-Month Clinical GenAI Use
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {analytics.genAiAdoptionRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Formal training: {analytics.formalTrainingRate}%
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Q10 · Last 10 Cases Consulted
              </span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {analytics.meanCasesConsultedOutOf10} / 10
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Mean cases among active users
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-rose-700 uppercase block">
                Q7 · Patient Info Entered
              </span>
              <div className="text-2xl font-mono font-bold text-rose-700 mt-1">
                {analytics.patientInfoEnteredRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Entered clinical data into public GenAI
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase block">
                Q11 · Guideline Verification
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
                {analytics.alwaysOrOftenVerifyRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Verify answers Often / Very often
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Q8 Task Offloading Frequency Matrix */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Q8 · Work-Related Task Offloading Frequency (Scale 1 = Never to 5 = Very often)
              </h3>
              <p className="text-xs text-slate-500">
                Mean frequency across clinical tasks during the past 3 months among active GenAI users.
              </p>

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
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${(item.meanScore / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Q9 Stage of Consultation & Q12 Policy */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Q9 · Stage of Clinical Reasoning When GenAI Is Consulted
                </h3>
                <div className="space-y-2.5 pt-1 text-xs">
                  {analytics.consultationStageBreakdown.map(row => (
                    <div key={row.stage} className="space-y-1">
                      <div className="flex justify-between text-slate-700 gap-2">
                        <span>{row.stage}</span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
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
              </div>

              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Q12 · Institutional Written GenAI Policy Awareness
                </h3>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {analytics.institutionalPolicyBreakdown.map(item => (
                    <div key={item.status} className="p-3 rounded bg-slate-50 border border-slate-200 text-center">
                      <div className="text-xs font-semibold text-slate-700">{item.status}</div>
                      <div className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                        {item.percentage}%
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">n = {item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: MANUAL SCORING & INTER-RATER RELIABILITY */}
      {/* ==================================================== */}
      {activeTab === 'manual_scoring' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Inter-Rater Agreement %</span>
              <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
                {analytics.interRaterAgreementPercentage}%
              </div>
              <p className="text-[11px] text-slate-500">Dual-evaluator score concordance</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cohen&apos;s Kappa (Approx)</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                κ = {analytics.cohensKappaApprox}
              </div>
              <p className="text-[11px] text-slate-500">Inter-rater diagnostic reliability</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Dual-Evaluated Vignettes</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {analytics.totalVignettesScoredByBoth} Vignettes
              </div>
              <p className="text-[11px] text-slate-500">Evaluated by Assessor 1 & Assessor 2</p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Human Expert Manual Scoring Console
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluate participant&apos;s written reasoning side-by-side with transparent rubrics and gold-standard keys.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Active Evaluator:</span>
                <div className="flex p-0.5 bg-slate-100 rounded border border-slate-200 text-xs">
                  <button
                    onClick={() => setActiveAssessor(1)}
                    className={`px-3 py-1 rounded font-medium ${
                      activeAssessor === 1 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    Assessor 1
                  </button>
                  <button
                    onClick={() => setActiveAssessor(2)}
                    className={`px-3 py-1 rounded font-medium ${
                      activeAssessor === 2 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    Assessor 2
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Participant &amp; Vignette Case Answer to Evaluate:
                </label>
                <select
                  value={selectedVignetteId || currentScoringVignette?.id || ''}
                  onChange={(e) => setSelectedVignetteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                >
                  {vignetteAnswers.slice(0, 50).map(v => {
                    const c = cases.find(item => item.id === v.caseId);
                    const p = participants.find(item => item.id === v.participantId);
                    return (
                      <option key={v.id} value={v.id}>
                        [VIGNETTE CASE] {p?.code} - {c?.domain}: {c?.title} (Score: {v.finalResolvedScore ?? 'Pending'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {currentScoringVignette && currentScoringCase ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">Participant Response</span>
                    <span className="font-mono text-slate-500">{currentParticipant?.code}</span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Primary Diagnosis Submitted:</span>
                    <p className="p-2 rounded bg-white border border-slate-200 font-medium text-slate-900">
                      {currentScoringVignette.mostLikelyDiagnosis}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Differential Diagnoses:</span>
                    <p className="p-2 rounded bg-white border border-slate-200 text-slate-800">
                      1. {currentScoringVignette.differential1} <br />
                      2. {currentScoringVignette.differential2}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Identified Red Flags:</span>
                    <p className="p-2 rounded bg-white border border-slate-200 text-slate-800">
                      {currentScoringVignette.redFlags}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Next Management Step:</span>
                    <p className="p-2 rounded bg-white border border-slate-200 text-slate-800">
                      {currentScoringVignette.nextStep}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Self-Reported Confidence:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currentScoringVignette.confidence} / 5
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">Expert Answer Key & Rubric</span>
                    <span className="font-mono text-emerald-700 font-bold">Max 4.0 Marks</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">1. Primary Diagnosis (0–1 Mark)</span>
                      <select
                        value={scorePrimary}
                        onChange={(e) => setScorePrimary(parseFloat(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                      >
                        <option value={1.0}>1.0 (Full Match)</option>
                        <option value={0.5}>0.5 (Partial / Equivalent)</option>
                        <option value={0.0}>0.0 (Incorrect / Missed)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Gold Standard:</strong> {currentScoringCase.goldStandardDiagnosis}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Differential Diagnoses (0–1 Mark)</span>
                      <select
                        value={scoreDiff}
                        onChange={(e) => setScoreDiff(parseFloat(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                      >
                        <option value={1.0}>1.0 (Two Plausible Competing)</option>
                        <option value={0.5}>0.5 (One Plausible)</option>
                        <option value={0.0}>0.0 (Unreasonable / Inaccurate)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Accepted Keys:</strong> {currentScoringCase.differentialDiagnosisKeys.join(', ')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">3. Red Flags Recognition (0–1 Mark)</span>
                      <select
                        value={scoreRedFlags}
                        onChange={(e) => setScoreRedFlags(parseFloat(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                      >
                        <option value={1.0}>1.0 (Critical Risks Identified)</option>
                        <option value={0.5}>0.5 (Partial Awareness)</option>
                        <option value={0.0}>0.0 (Missed Red Flags)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Key Red Flags:</strong> {currentScoringCase.redFlagKeys.join('; ')}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">4. Next Management Step (0–1 Mark)</span>
                      <select
                        value={scoreNextStep}
                        onChange={(e) => setScoreNextStep(parseFloat(e.target.value))}
                        className="px-2 py-1 rounded border border-slate-300 font-mono font-bold text-xs"
                      >
                        <option value={1.0}>1.0 (Appropriate Immediate Step)</option>
                        <option value={0.5}>0.5 (Delayed / Secondary Step)</option>
                        <option value={0.0}>0.0 (Inappropriate / Contraindicated)</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-800">Gold Standard Action:</strong> {currentScoringCase.nextManagementStepKey}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Assessor Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={assessorNotes}
                      onChange={(e) => setAssessorNotes(e.target.value)}
                      placeholder="Optional grading rationale..."
                      className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs">
                      Total Case Score:{' '}
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {scorePrimary + scoreDiff + scoreRedFlags + scoreNextStep} / 4.0
                      </span>
                      {scoreSavedMessage && (
                        <span className="ml-2 text-emerald-700 font-medium">{scoreSavedMessage}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveScore}
                      className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Save Assessor {activeAssessor} Score
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No post-AI vignette submissions recorded in this dataset yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: CASE MANAGEMENT & RUBRICS EDITOR */}
      {/* ==================================================== */}
      {activeTab === 'cases' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Standardized Case Library & Stimuli Editor ({cases.length} Cases)
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect or modify patient histories, vitals, answer keys, and fixed CDSS stimuli across the {cases.filter(c => c.stage === 'ai_simulation').length} CDSS and {cases.filter(c => c.stage === 'post_ai').length} Vignette Cases.
                </p>
              </div>

              <select
                value={selectedEditCaseId}
                onChange={(e) => setSelectedEditCaseId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.stage === 'ai_simulation' ? 'CDSS' : 'VIGNETTE CASE'}] Case {c.caseNumber}: {c.domain} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {editingCase && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stage</label>
                    <input
                      type="text"
                      disabled
                      value={editingCase.stage === 'ai_simulation' ? 'CDSS' : 'Vignette Cases'}
                      className="w-full px-3 py-2 rounded bg-slate-100 border border-slate-200 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Domain</label>
                    <input
                      type="text"
                      value={editingCase.domain}
                      onChange={(e) => onUpdateCase({ ...editingCase, domain: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Case Title</label>
                    <input
                      type="text"
                      value={editingCase.title}
                      onChange={(e) => onUpdateCase({ ...editingCase, title: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-slate-300"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Clinical Vignette Presentation</label>
                  <textarea
                    rows={3}
                    value={editingCase.presentation}
                    onChange={(e) => onUpdateCase({ ...editingCase, presentation: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Gold Standard Diagnosis</label>
                  <input
                    type="text"
                    value={editingCase.goldStandardDiagnosis}
                    onChange={(e) => onUpdateCase({ ...editingCase, goldStandardDiagnosis: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 font-semibold text-emerald-800"
                  />
                </div>

                {editingCase.clinicalImages && editingCase.clinicalImages.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <ClinicalImageGallery images={editingCase.clinicalImages} />
                  </div>
                )}

                {editingCase.stage === 'ai_simulation' && editingCase.aiStimulus && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-900 uppercase">
                        Fixed AI Consultation Stimulus
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        editingCase.aiStimulus.isMisleading
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {editingCase.aiStimulus.isMisleading ? 'DELIBERATELY MISLEADING' : 'CLINICALLY APPROPRIATE'}
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">AI Proposed Diagnosis:</span>
                      <input
                        type="text"
                        value={editingCase.aiStimulus.diagnosis}
                        onChange={(e) => {
                          onUpdateCase({
                            ...editingCase,
                            aiStimulus: { ...editingCase.aiStimulus!, diagnosis: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 rounded border border-slate-300"
                      />
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">AI Recommendation:</span>
                      <textarea
                        rows={2}
                        value={editingCase.aiStimulus.recommendation}
                        onChange={(e) => {
                          onUpdateCase({
                            ...editingCase,
                            aiStimulus: { ...editingCase.aiStimulus!, recommendation: e.target.value }
                          });
                        }}
                        className="w-full px-3 py-2 rounded border border-slate-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 7: SPSS DATA EXPORT */}
      {/* ==================================================== */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Table Relational Data Export (SPSS Ready)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download structured CSV files formatted with consistent variable naming and documentation for statistical packages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Participants Cohort Dataset</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    One row per participant: anonymous ID, designation, specialty, MBBS bracket, hospital type, formal GenAI training.
                  </p>
                </div>
                <button
                  onClick={handleExportParticipants}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export participants.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Study Questionnaire Dataset</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Section I profile + Section II GenAI Exposure Q1–Q12 (including 8 task offloading items, last 10 cases, policy).
                  </p>
                </div>
                <button
                  onClick={handleExportQuestionnaire}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export questionnaire.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>CDSS Interaction Log</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    One row per CDSS case per participant: CDSS agreement, final Dx, decision rationale, confidence, verification intent.
                  </p>
                </div>
                <button
                  onClick={handleExportAiInteractions}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export cdss_interactions.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Vignette Cases Scores</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Independent Vignette Cases responses and Assessor 1 &amp; 2 scores (0–4 marks per case).
                  </p>
                </div>
                <button
                  onClick={handleExportPostAiVignettes}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export vignette_cases_scores.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 mb-1">
                    <Code className="w-4 h-4 text-emerald-600" />
                    <span>SPSS Variable Codebook (.sps)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Ready-to-run IBM SPSS Statistics syntax script defining variable types, value labels, and statistical tests.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([SPSS_SYNTAX_SPS], { type: 'text/plain;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'carl_spss_analysis.sps';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download SPSS Syntax (.sps)</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 8: BACKEND CODE & SQL VIEWER */}
      {/* ==================================================== */}
      {activeTab === 'backend' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Production Backend & Database Specification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete FastAPI Python backend and Supabase PostgreSQL schema with Row-Level Security for production deployment on Render/Supabase.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    FastAPI REST Application (main.py)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(FASTAPI_MAIN_PY);
                      setCopiedCodeType('main.py');
                      setTimeout(() => setCopiedCodeType(null), 2500);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {copiedCodeType === 'main.py' ? 'Copied' : 'Copy main.py'}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {FASTAPI_MAIN_PY}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    Supabase PostgreSQL Migration Script (schema.sql)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
                      setCopiedCodeType('schema.sql');
                      setTimeout(() => setCopiedCodeType(null), 2500);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {copiedCodeType === 'schema.sql' ? 'Copied' : 'Copy schema.sql'}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {SUPABASE_SQL_MIGRATION}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 9: PROTOCOL SETTINGS */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Research Protocol & Session Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize study variables and institutional details according to IEC-approved protocols.
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={settings.institutionName}
                    onChange={(e) => onUpdateSettings({ institutionName: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ethics Committee Protocol Ref</label>
                  <input
                    type="text"
                    value={settings.protocolNumber}
                    onChange={(e) => onUpdateSettings({ protocolNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Researcher Portal Passcode</label>
                  <input
                    type="text"
                    value={settings.passcode}
                    onChange={(e) => onUpdateSettings({ passcode: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Retention Period (Months)</label>
                  <input
                    type="number"
                    value={settings.dataRetentionMonths}
                    onChange={(e) => onUpdateSettings({ dataRetentionMonths: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-rose-700 block">Purge Genuine Research Records</span>
                  <span className="text-slate-500 text-[11px]">
                    Permanently delete non-demo research participant data collected on this device.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    researchStore.clearResearchData();
                    window.location.reload();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Clear Research Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
