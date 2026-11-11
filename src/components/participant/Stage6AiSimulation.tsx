import React, { useState } from 'react';
import {
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  ClinicalCase,
  Participant,
  AiInteractionRecord,
  AiAgreementLevel
} from '../../types';

interface Stage6AiSimulationProps {
  cases: ClinicalCase[];
  participant: Participant;
  onComplete: (records: AiInteractionRecord[]) => void;
  isDemoMode: boolean;
}

export const Stage6AiSimulation: React.FC<Stage6AiSimulationProps> = ({
  cases,
  participant,
  onComplete,
  isDemoMode
}) => {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);

  // Per-case interaction state
  const [initialDiagnosis, setInitialDiagnosis] = useState('');
  const [customOtherInitial, setCustomOtherInitial] = useState('');
  const [initialJustification, setInitialJustification] = useState('');
  const [initialConfidence, setInitialConfidence] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedTimestamp, setLockedTimestamp] = useState<string | null>(null);

  // Post-AI state
  const [aiAgreement, setAiAgreement] = useState<AiAgreementLevel>('Completely agree');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [customOtherFinal, setCustomOtherFinal] = useState('');
  const [reasonForDecision, setReasonForDecision] = useState('');
  const [finalConfidence, setFinalConfidence] = useState(3);
  const [willVerify, setWillVerify] = useState<boolean>(true);
  const [verificationTargets, setVerificationTargets] = useState('');

  const [completedRecords, setCompletedRecords] = useState<AiInteractionRecord[]>([]);

  const currentCase = cases[currentCaseIndex];
  const stimulus = currentCase.aiStimulus!;

  React.useEffect(() => {
    setInitialDiagnosis(currentCase.mcqOptions[0]);
    setCustomOtherInitial('');
    setInitialJustification('');
    setInitialConfidence(3);
    setIsLocked(false);
    setLockedTimestamp(null);

    setAiAgreement('Completely agree');
    setFinalDiagnosis(currentCase.mcqOptions[0]);
    setCustomOtherFinal('');
    setReasonForDecision('');
    setFinalConfidence(3);
    setWillVerify(true);
    setVerificationTargets('');
  }, [currentCaseIndex, currentCase]);

  const handleCommitAndLock = () => {
    const isOther = initialDiagnosis === 'Other';
    if (isOther && !customOtherInitial.trim()) return;
    if (!initialJustification.trim()) return;

    setIsLocked(true);
    setLockedTimestamp(new Date().toLocaleTimeString());
    const actualInitial = isOther ? customOtherInitial.trim() : initialDiagnosis;
    setFinalDiagnosis(actualInitial);
  };

  const isPostAiValid = () => {
    const isOther = finalDiagnosis === 'Other';
    if (isOther && !customOtherFinal.trim()) return false;
    if (!reasonForDecision.trim()) return false;
    if (willVerify && !verificationTargets.trim()) return false;
    return true;
  };

  const handleSaveAndNext = () => {
    if (!isPostAiValid()) return;

    const actualInitial = initialDiagnosis === 'Other' ? customOtherInitial.trim() : initialDiagnosis;
    const actualFinal = finalDiagnosis === 'Other' ? customOtherFinal.trim() : finalDiagnosis;

    const switched = actualInitial !== actualFinal;
    const isMisleading = stimulus.isMisleading;

    const switchedTowardsCorrect = switched && !isMisleading && actualFinal === currentCase.goldStandardDiagnosis;
    const acceptedMisleading = isMisleading && (
      aiAgreement === 'Completely agree' ||
      aiAgreement === 'Partially agree' ||
      actualFinal === stimulus.diagnosis
    );

    const record: AiInteractionRecord = {
      id: `ai-sim-${participant.id}-${currentCase.id}`,
      participantId: participant.id,
      caseId: currentCase.id,
      isDemo: isDemoMode,
      initialDiagnosis: actualInitial,
      initialJustification: initialJustification.trim(),
      initialConfidence,
      initialSubmittedAt: lockedTimestamp || new Date().toISOString(),
      aiAgreement,
      finalDiagnosis: actualFinal,
      reasonForDecision: reasonForDecision.trim(),
      finalConfidence,
      willVerify,
      verificationTargets: willVerify ? verificationTargets.trim() : 'No verification indicated',
      switchedDiagnosis: switched,
      switchedTowardsCorrect,
      acceptedMisleading,
      timeSpentSeconds: 120,
      completedAt: new Date().toISOString()
    };

    const updated = [...completedRecords, record];
    setCompletedRecords(updated);

    if (currentCaseIndex < cases.length - 1) {
      setCurrentCaseIndex(currentCaseIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete(updated);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>STAGE 06 / 08</span>
              <span aria-hidden="true">·</span>
              <span>AI CLINICAL ASSISTANT SIMULATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Simulation Vignette {currentCaseIndex + 1} of {cases.length}: {currentCase.domain}
            </h2>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            {cases.map((c, i) => (
              <div
                key={c.id}
                className={`w-7 h-7 rounded text-xs font-mono font-bold flex items-center justify-center ${
                  i === currentCaseIndex
                    ? 'bg-slate-900 text-white'
                    : i < currentCaseIndex
                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Presentation Panel */}
        <div className="mt-6 p-5 rounded bg-slate-50 border border-slate-200 space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Clinical Vignette Presentation
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {currentCase.presentation}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Medical & Drug History
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {currentCase.medicalHistory}
            </p>
          </div>

          {/* Vitals */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
              Admission Triage Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Heart Rate</div>
                <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.heartRate}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Blood Pressure</div>
                <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.bloodPressure}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Resp. Rate</div>
                <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.respiratoryRate}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-sans">SpO2</div>
                <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.spO2}</div>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-500 uppercase font-sans">Temperature</div>
                <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.temperature}</div>
              </div>
            </div>
          </div>

          {/* Physical Exam */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Physical Examination
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              {currentCase.physicalExamination}
            </p>
          </div>

          {/* Investigations */}
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
              Laboratory & Bedside Investigations
            </span>
            <div className="space-y-1">
              {currentCase.investigations.map((inv, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs gap-1"
                >
                  <span className="font-medium text-slate-800">{inv.name}</span>
                  <span className={`font-mono tabular-nums ${inv.isAbnormal ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                    {inv.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: INITIAL CLINICAL COMMITMENT */}
        <div className={`mt-6 p-6 rounded border transition-colors ${
          isLocked
            ? 'bg-slate-50/70 border-slate-300'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Step 1: Independent Initial Commitment
                </span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-900 bg-slate-200 px-2 py-0.5 rounded font-semibold">
                    <Lock className="w-3 h-3" />
                    PERMANENTLY LOCKED · {lockedTimestamp}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Commit your independent diagnosis prior to unmasking the standardized AI consultation.
              </p>
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={() => {
                  setInitialDiagnosis(currentCase.goldStandardDiagnosis);
                  setInitialJustification(`Initial formulation based on history, abnormal triage vitals (${currentCase.vitals.bloodPressure}, ${currentCase.vitals.heartRate}), and laboratory findings.`);
                  setInitialConfidence(4);
                  setIsLocked(true);
                  setLockedTimestamp(new Date().toLocaleTimeString());
                  setFinalDiagnosis(currentCase.goldStandardDiagnosis);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors shrink-0 self-start sm:self-auto"
                title="Fill initial clinical reasoning and lock"
              >
                <span>⚡ Auto-Fill & Lock Initial</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Initial MCQ */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                Primary Working Diagnosis (MCQ)
              </label>
              <div className="space-y-1.5">
                {currentCase.mcqOptions.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-2.5 rounded border text-xs ${
                      isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-slate-50'
                    } ${
                      initialDiagnosis === opt
                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`init-mcq-${currentCase.id}`}
                      disabled={isLocked}
                      checked={initialDiagnosis === opt}
                      onChange={() => setInitialDiagnosis(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {initialDiagnosis === 'Other' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    disabled={isLocked}
                    value={customOtherInitial}
                    onChange={(e) => setCustomOtherInitial(e.target.value)}
                    placeholder="Specify initial diagnosis..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Initial Justification */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1 font-mono">
                Clinical Justification
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                value={initialJustification}
                onChange={(e) => setInitialJustification(e.target.value)}
                placeholder="State the clinical reasoning supporting this diagnosis..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-600"
              />
            </div>

            {/* Initial Confidence */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  Initial Diagnostic Confidence
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {initialConfidence} / 5
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isLocked}
                    onClick={() => setInitialConfidence(lvl)}
                    className={`py-1.5 text-center rounded border text-xs font-mono font-bold transition-colors ${
                      initialConfidence === lvl
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    } ${isLocked ? 'cursor-not-allowed opacity-90' : ''}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Commit & Lock Button */}
            {!isLocked && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleCommitAndLock}
                  disabled={
                    (initialDiagnosis === 'Other' && !customOtherInitial.trim()) ||
                    !initialJustification.trim()
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Commit & Permanently Lock Initial Opinion</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: STANDARDIZED AI CONSULTATION CDSS STIMULUS */}
        {isLocked && (
          <div className="mt-6 p-5 rounded border border-slate-300 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">
                  CLINICAL DECISION SUPPORT SYSTEM (CDSS) · CONSULTATION
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                REF #STIM-0{currentCase.caseNumber}
              </span>
            </div>

            {/* AI Diagnosis */}
            <div className="p-3.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                AI Suggested Primary Diagnosis
              </span>
              <p className="text-sm font-bold text-slate-900">
                {stimulus.diagnosis}
              </p>
            </div>

            {/* AI Recommendation */}
            <div className="p-3.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                AI Recommended Immediate Clinical Action
              </span>
              <p className="text-xs text-slate-800 leading-relaxed">
                {stimulus.recommendation}
              </p>
            </div>

            {/* AI Clinical Reasoning */}
            <div className="p-3.5 rounded bg-white border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                AI Clinical Rationale
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {stimulus.clinicalReasoning}
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: POST-AI EVALUATION */}
        {isLocked && (
          <div className="mt-6 p-6 rounded border border-slate-200 bg-white space-y-6">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Step 3: Post-AI Evaluation & Final Formulation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record your evaluation of the AI guidance, your final working diagnosis, and verification intention.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (stimulus.isMisleading) {
                    setAiAgreement('Uncertain; requires verification');
                    setFinalDiagnosis(currentCase.goldStandardDiagnosis);
                    setReasonForDecision(`Identified inconsistency in AI recommendation: advice conflicts with clinical findings, patient hemodynamics, or contraindications.`);
                    setFinalConfidence(4);
                    setWillVerify(true);
                    setVerificationTargets('Cross-check clinical practice guidelines, consult senior consultant, and obtain confirmatory imaging.');
                  } else {
                    setAiAgreement('Completely agree');
                    setFinalDiagnosis(currentCase.goldStandardDiagnosis);
                    setReasonForDecision('AI guidance aligns with established evidence-based clinical protocols and standard guidelines.');
                    setFinalConfidence(5);
                    setWillVerify(true);
                    setVerificationTargets('Check drug dosing and verify ECG/biomarker repeat timing.');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors shrink-0 self-start sm:self-auto"
                title="Fill realistic clinical post-AI evaluation"
              >
                <span>⚡ Auto-Fill Post-AI Evaluation</span>
              </button>
            </div>

            {/* Agreement with AI */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                1. Agreement with AI Recommendation
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Completely agree',
                  'Partially agree',
                  'Disagree',
                  'Uncertain; requires verification'
                ].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setAiAgreement(level as AiAgreementLevel)}
                    className={`p-2.5 text-left rounded border text-xs font-medium transition-colors ${
                      aiAgreement === level
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Final Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                2. Final Working Diagnosis
              </label>
              <div className="space-y-1.5">
                {currentCase.mcqOptions.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer text-xs ${
                      finalDiagnosis === opt
                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`final-mcq-${currentCase.id}`}
                      checked={finalDiagnosis === opt}
                      onChange={() => setFinalDiagnosis(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {finalDiagnosis === 'Other' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={customOtherFinal}
                    onChange={(e) => setCustomOtherFinal(e.target.value)}
                    placeholder="Specify final diagnosis..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Reason for Decision */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                3. Clinical Rationale for Acceptance, Rejection, or Modification
              </label>
              <textarea
                rows={2}
                value={reasonForDecision}
                onChange={(e) => setReasonForDecision(e.target.value)}
                placeholder="Explain the clinical rationale behind your agreement, disagreement, or modification..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Final Confidence */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  4. Final Diagnostic Confidence
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {finalConfidence} / 5
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFinalConfidence(lvl)}
                    className={`py-1.5 text-center rounded border text-xs font-mono font-bold transition-colors ${
                      finalConfidence === lvl
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Independent Verification Intent */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                  5. Would you independently verify this AI recommendation before execution?
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="verifyChoice"
                      checked={willVerify === true}
                      onChange={() => setWillVerify(true)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>Yes, I would independently verify before acting</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="verifyChoice"
                      checked={willVerify === false}
                      onChange={() => setWillVerify(false)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>No, I would act directly on this advice</span>
                  </label>
                </div>
              </div>

              {willVerify && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Specific verification targets (guidelines, biomarkers, imaging):
                  </label>
                  <input
                    type="text"
                    value={verificationTargets}
                    onChange={(e) => setVerificationTargets(e.target.value)}
                    placeholder="e.g. Verify contraindications, obtain confirmatory scan, review guideline thresholds..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Save & Advance */}
            <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Responses are permanently committed upon moving forward.
              </span>

              <button
                type="button"
                onClick={handleSaveAndNext}
                disabled={!isPostAiValid()}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded transition-colors ${
                  isPostAiValid()
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                <span>
                  {currentCaseIndex === cases.length - 1
                    ? 'Complete Simulation & Proceed'
                    : 'Save & Next AI Vignette'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
