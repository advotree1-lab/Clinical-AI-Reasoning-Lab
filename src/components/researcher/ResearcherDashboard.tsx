import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  ShieldAlert,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Database,
  Sliders,
  Code,
  FileSpreadsheet,
  Award,
  BookOpen,
  Settings,
  Scale
} from 'lucide-react';
import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ClinicalCase,
  ResearchProtocolSettings
} from '../../types';
import { researchStore } from '../../services/researchStore';
import { computeAnalytics, exportToCsv } from '../../services/analytics';
import { FASTAPI_MAIN_PY, SUPABASE_SQL_MIGRATION, SPSS_SYNTAX_SPS } from '../../data/backendCode';

interface ResearcherDashboardProps {
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  settings: ResearchProtocolSettings;
  onUpdateSettings: (newSettings: Partial<ResearchProtocolSettings>) => void;
  cases: ClinicalCase[];
  onUpdateCase: (c: ClinicalCase) => void;
}

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({
  isDemoMode,
  onToggleDemoMode,
  settings,
  onUpdateSettings,
  cases,
  onUpdateCase
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'automation_bias' | 'independent_reasoning' | 'offloading' | 'manual_scoring' | 'cases' | 'export' | 'backend' | 'settings'>('overview');

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

  // Selected vignette answer
  const currentScoringVignette = vignetteAnswers.find(v => v.id === selectedVignetteId) || vignetteAnswers[0];
  const currentScoringCase = cases.find(c => c.id === currentScoringVignette?.caseId);
  const currentParticipant = participants.find(p => p.id === currentScoringVignette?.participantId);

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
      assessorName: activeAssessor === 1 ? 'Assessor 1 (Lead Evaluator)' : 'Assessor 2 (Independent Reviewer)',
      scoredAt: new Date().toISOString(),
      notes: assessorNotes
    });
    alert(`Assessor ${activeAssessor} score saved: ${total} / 4 marks.`);
  };

  const handleResetDemoCohort = () => {
    if (window.confirm('Reset synthetic demonstration cohort to default 40 clinicians?')) {
      researchStore.resetDemoData();
      window.location.reload();
    }
  };

  // CSV Exporters for the 5 datasets
  const handleExportParticipants = () => {
    const rows = participants.map(p => ({
      participant_id: p.id,
      code: p.code,
      designation: p.designation,
      specialty: p.specialty,
      years_since_mbbs: p.yearsSinceMBBS,
      years_experience: p.yearsExperience,
      institution_type: p.institutionType,
      daily_patient_load: p.dailyPatientLoad,
      prior_ai_exposure: p.priorAiExposure ? 1 : 0,
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
      used_ai_last_3_months: q.usedAiLast3Months ? 1 : 0,
      ai_frequency: q.aiFrequency,
      ai_timing: q.aiTiming,
      complex_vs_routine: q.complexVsRoutine ? 1 : 0,
      verification_frequency: q.verificationFrequency,
      // Section C Offloading
      cog_depend_diff: q.cognitiveOffloading.dependDifferential,
      cog_substitute_recall: q.cognitiveOffloading.substituteRecall,
      cog_interpret_complex: q.cognitiveOffloading.interpretComplex,
      cog_transfer_reasoning: q.cognitiveOffloading.transferReasoning,
      cog_consult_before: q.cognitiveOffloading.consultBeforeThinking,
      cog_reduce_workload: q.cognitiveOffloading.reduceWorkload,
      cog_verify_before: q.cognitiveOffloading.verifyBeforeUsing,
      // Section D Deskilling
      desk_reduced_effort: q.perceivedDeskilling.reducedEffort,
      desk_difficult_without: q.perceivedDeskilling.difficultWithoutAi,
      desk_less_confident: q.perceivedDeskilling.lessConfidentIndependent,
      desk_depend_investigations: q.perceivedDeskilling.dependInvestigations,
      desk_affect_problem_solving: q.perceivedDeskilling.affectProblemSolving,
      desk_confidence_change: q.perceivedDeskilling.confidenceChange,
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
    exportToCsv(`carl_ai_interactions_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
  };

  const handleExportVignettes = (stage: 'baseline' | 'post_ai') => {
    const list = vignetteAnswers.filter(v => v.stage === stage);
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
    exportToCsv(`carl_${stage}_vignettes_${isDemoMode ? 'demo' : 'research'}.csv`, rows);
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
            Automation bias metrics, pre/post score comparisons, dual-assessor rubrics & SPSS exports.
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
              Research Data ({participants.filter(p => !p.isDemo).length})
            </button>
          </div>

          {isDemoMode && (
            <button
              onClick={handleResetDemoCohort}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded transition-colors border border-slate-200 shadow-2xs"
              title="Reset synthetic demo cohort back to initial 40 doctors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Cohort</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Warning Notice (Quiet Unboxed) */}
      {isDemoMode ? (
        <div className="p-3 rounded bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-950 font-mono">
          <div className="flex items-center gap-2">
            <span>SYNTHETIC DEMO MODE ACTIVE: Currently evaluating 40 simulated clinicians. Fictional demo records are partitioned from genuine research data.</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">
            N = 40
          </span>
        </div>
      ) : (
        <div className="p-3 rounded bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-mono">
          <div className="flex items-center gap-2">
            <span>GENUINE RESEARCH MODE ACTIVE: Live consenting participants only. Zero synthetic records.</span>
          </div>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">
            LIVE STUDY
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 pb-2">
        {[
          { id: 'overview', label: '1. Executive Overview' },
          { id: 'automation_bias', label: '2. Automation Bias & Stimuli' },
          { id: 'independent_reasoning', label: '3. Pre/Post Paired Reasoning' },
          { id: 'offloading', label: '4. Cognitive Offloading' },
          { id: 'manual_scoring', label: '5. Dual-Assessor Console' },
          { id: 'cases', label: '6. Case Management' },
          { id: 'export', label: '7. SPSS Data Export' },
          { id: 'backend', label: '8. FastAPI / SQL Code' },
          { id: 'settings', label: '9. Protocol Settings' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
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
            
            {/* Primary Outcome: Misleading Acceptance */}
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

            {/* Sound AI Acceptance */}
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

            {/* Diagnostic Switching */}
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

            {/* Score Delta */}
            <div className="p-5 rounded bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Pre vs Post Score Delta
              </span>
              <div className="text-3xl font-mono font-bold text-slate-900 tabular-nums">
                {analytics.meanScoreDifference >= 0 ? `+${analytics.meanScoreDifference}` : analytics.meanScoreDifference}
              </div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                Baseline {analytics.baselineMeanScore} vs Post-AI {analytics.postAiMeanScore}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2">
                Paired t = {analytics.pairedTStatApprox} (p ≈ {analytics.pValueApprox})
              </div>
            </div>

          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Misleading Acceptance Distribution (0, 1, 2, 3) */}
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

            {/* Designation vs Misleading Acceptance */}
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
                Standardized AI Stimuli Breakdown (5 Cases)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation of participant acceptance and verification across the 2 sound and 3 misleading stimuli.
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

          {/* Diagnostic Switching Details */}
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
      {/* TAB 3: INDEPENDENT REASONING (BASELINE VS POST-AI) */}
      {/* ==================================================== */}
      {activeTab === 'independent_reasoning' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Independent Clinical Reasoning Comparison (0–20 Marks)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Paired analysis of 5 Baseline Unaided cases versus 5 Post-AI Unaided cases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Baseline Mean Score</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {analytics.baselineMeanScore} / 20
                </div>
                <div className="text-[11px] font-mono text-slate-500">SD = {analytics.baselineStdDev}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Post-AI Mean Score</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {analytics.postAiMeanScore} / 20
                </div>
                <div className="text-[11px] font-mono text-slate-500">SD = {analytics.postAiStdDev}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Paired Difference</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {analytics.meanScoreDifference >= 0 ? `+${analytics.meanScoreDifference}` : analytics.meanScoreDifference}
                </div>
                <div className="text-[11px] font-mono text-slate-500">Post - Baseline score delta</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Statistical Significance</span>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  p ≈ {analytics.pValueApprox}
                </div>
                <div className="text-[11px] font-mono text-slate-500">Paired t = {analytics.pairedTStatApprox}</div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold">Interpretation Guidelines for Academic Defense: </span>
              In a single-group research design, differences between baseline and post-AI scores may reflect test fatigue, practice effects, or task difficulty variance across domains rather than permanent cognitive deskilling. Formal SPSS scripts for repeated-measures ANOVA and Wilcoxon signed-rank tests are provided in the Export section.
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: COGNITIVE OFFLOADING & PERCEIVED DESKILLING */}
      {/* ==================================================== */}
      {activeTab === 'offloading' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cognitive Offloading Items */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Cognitive Offloading Habits (Likert 1 to 5)
              </h3>
              <p className="text-xs text-slate-500">
                Self-reported transfer of diagnostic recall, synthesis, and reasoning to AI.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                {Object.entries(analytics.cognitiveOffloadingAverages).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-mono font-bold text-slate-900">{val} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Perceived Deskilling Risk Items */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Perceived Cognitive Deskilling Risk (Likert 1 to 5)
              </h3>
              <p className="text-xs text-slate-500">
                Subjective concerns regarding diagnostic dependence and problem-solving confidence.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                {Object.entries(analytics.perceivedDeskillingAverages).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-mono font-bold text-slate-900">{val} / 5</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(val / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
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
          {/* Inter-Rater Reliability Header Ribbon */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Inter-Rater Agreement %</span>
              <div className="text-2xl font-mono font-bold text-emerald-700 mt-1">
                {analytics.interRaterAgreementPercentage}%
              </div>
              <p className="text-[11px] text-slate-500">Dual-evaluator score concordance</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cohen's Kappa (Approx)</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                κ = {analytics.cohensKappaApprox}
              </div>
              <p className="text-[11px] text-slate-500">High inter-rater diagnostic reliability</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Dual-Evaluated Vignettes</span>
              <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                {analytics.totalVignettesScoredByBoth} Vignettes
              </div>
              <p className="text-[11px] text-slate-500">Evaluated by Assessor 1 & Assessor 2</p>
            </div>
          </div>

          {/* Interactive Manual Scoring Console */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Human Expert Manual Scoring Console
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluate participant's written reasoning side-by-side with transparent rubrics and gold-standard keys.
                </p>
              </div>

              {/* Assessor Switcher */}
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

            {/* Select Vignette */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Participant & Vignette Answer to Evaluate:
                </label>
                <select
                  value={selectedVignetteId || currentScoringVignette?.id}
                  onChange={(e) => setSelectedVignetteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                >
                  {vignetteAnswers.slice(0, 50).map(v => {
                    const c = cases.find(item => item.id === v.caseId);
                    const p = participants.find(item => item.id === v.participantId);
                    return (
                      <option key={v.id} value={v.id}>
                        [{v.stage.toUpperCase()}] {p?.code} - {c?.domain}: {c?.title} (Score: {v.finalResolvedScore ?? 'Pending'})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {currentScoringVignette && currentScoringCase && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* Left: Participant's Written Submissions */}
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

                {/* Right: Gold Standard & Rubric Scoring */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 uppercase">Expert Answer Key & Rubric</span>
                    <span className="font-mono text-emerald-700 font-bold">Max 4.0 Marks</span>
                  </div>

                  {/* Criteria 1: Primary Dx */}
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

                  {/* Criteria 2: Differentials */}
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

                  {/* Criteria 3: Red Flags */}
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

                  {/* Criteria 4: Next Step */}
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

                  {/* Save button */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs">
                      Total Case Score: <span className="font-mono font-bold text-emerald-700 text-sm">{scorePrimary + scoreDiff + scoreRedFlags + scoreNextStep} / 4.0</span>
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
                  Standardized Case Library & Stimuli Editor (15 Cases)
                </h3>
                <p className="text-xs text-slate-500">
                  Inspect or modify patient histories, vitals, answer keys, and fixed AI stimuli.
                </p>
              </div>

              {/* Case selector */}
              <select
                value={selectedEditCaseId}
                onChange={(e) => setSelectedEditCaseId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.stage.toUpperCase()}] Case {c.caseNumber}: {c.domain} - {c.title}
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
                      value={editingCase.stage}
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

                {/* AI Stimulus (If in AI simulation stage) */}
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
                    One row per participant: anonymous ID, designation, specialty, years of experience, daily load, AI exposure.
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
                    <span>Questionnaire Survey Dataset</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    All Sections A-D survey items, AI frequency, 7 cognitive offloading items, and 6 deskilling items.
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
                    <span>AI Simulation Interaction Log</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    One row per case per participant: Initial Dx, locked timestamp, AI agreement, final Dx, confidence shift, verification intent.
                  </p>
                </div>
                <button
                  onClick={handleExportAiInteractions}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export ai_interactions.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Baseline Unaided Scores</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Primary diagnosis, differentials, red flags, next step, confidence, and Assessor 1 & 2 scores (0-4 marks).
                  </p>
                </div>
                <button
                  onClick={() => handleExportVignettes('baseline')}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export baseline_scores.csv</span>
                </button>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Post-AI Unaided Scores</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Post-exposure clinical reasoning scores across 5 new clinical cases for paired comparative testing.
                  </p>
                </div>
                <button
                  onClick={() => handleExportVignettes('post_ai')}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export post_ai_scores.csv</span>
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
              {/* FastAPI */}
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    FastAPI REST Application (main.py)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(FASTAPI_MAIN_PY);
                      alert('FastAPI source code copied to clipboard.');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    Copy main.py
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                  {FASTAPI_MAIN_PY}
                </pre>
              </div>

              {/* Supabase SQL */}
              <div>
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    Supabase PostgreSQL Migration Script (schema.sql)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
                      alert('Supabase SQL migration copied to clipboard.');
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    Copy schema.sql
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
                Customize study variables, institutional details, and baseline enablement according to IEC-approved protocols.
              </p>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              
              {/* Baseline Assessment Toggle */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Baseline Unaided Clinical Reasoning Stage</span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">
                    When enabled (default), participants complete 5 baseline cases before AI exposure. When disabled, participants proceed directly to the AI simulation.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.baselineAssessmentEnabled}
                    onChange={(e) => onUpdateSettings({ baselineAssessmentEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Protocol Details */}
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

              {/* Data Deletion */}
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
                    if (window.confirm('Are you sure you want to delete all genuine research participant records? This cannot be undone.')) {
                      researchStore.clearResearchData();
                      window.location.reload();
                    }
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
