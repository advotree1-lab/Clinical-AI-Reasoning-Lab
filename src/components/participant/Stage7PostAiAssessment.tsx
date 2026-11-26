import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import {
  ParticipantClinicalCase,
  Participant,
  VignetteAnswerRecord,
  ResearchEventType
} from '../../types';
import { SubmitVignetteAnswerInput } from '../../services/supabaseResearchService';
import { ClinicalImageGallery } from '../common/ClinicalImageGallery';
import { useCaseActiveTimer } from '../../hooks/useCaseActiveTimer';

interface Stage7PostAiAssessmentProps {
  cases: ParticipantClinicalCase[];
  participant: Participant;
  isDemoMode: boolean;
  initialAnswers?: VignetteAnswerRecord[];
  onOpenCase?: (caseId: string) => Promise<void> | void;
  onHeartbeatTimer?: (caseId: string, deltaSeconds: number) => Promise<void> | void;
  onSubmitCase?: (input: SubmitVignetteAnswerInput) => Promise<VignetteAnswerRecord | void>;
  onComplete: (answers: VignetteAnswerRecord[]) => void | Promise<void>;
  onLogEvent?: (
    eventType: ResearchEventType,
    caseId?: string,
    payload?: Record<string, unknown>
  ) => void;
}

interface VignetteFormState {
  mostLikelyDiagnosis: string;
  customOtherDiagnosis: string;
  differential1: string;
  differential2: string;
  redFlags: string;
  nextStep: string;
  confidence: number;
}

export const Stage7PostAiAssessment: React.FC<Stage7PostAiAssessmentProps> = ({
  cases,
  participant,
  isDemoMode,
  initialAnswers = [],
  onOpenCase,
  onHeartbeatTimer,
  onSubmitCase,
  onComplete,
  onLogEvent
}) => {
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, VignetteAnswerRecord>>(() => {
    const map: Record<string, VignetteAnswerRecord> = {};
    initialAnswers.forEach(a => {
      map[a.caseId] = a;
    });
    return map;
  });

  const [currentCaseIndex, setCurrentCaseIndex] = useState(() => {
    if (cases.length === 0) return 0;
    const firstUnsubmitted = cases.findIndex(
      c => !initialAnswers.some(a => a.caseId === c.id)
    );
    return firstUnsubmitted >= 0 ? firstUnsubmitted : 0;
  });

  const [answers, setAnswers] = useState<Record<string, VignetteFormState>>(() => {
    const map: Record<string, VignetteFormState> = {};
    initialAnswers.forEach(ans => {
      const matchedCase = cases.find(c => c.id === ans.caseId);
      const isOptionMatch = matchedCase?.mcqOptions.includes(ans.mostLikelyDiagnosis);
      map[ans.caseId] = {
        mostLikelyDiagnosis: isOptionMatch ? ans.mostLikelyDiagnosis : 'Other',
        customOtherDiagnosis: isOptionMatch ? '' : ans.mostLikelyDiagnosis,
        differential1: ans.differential1,
        differential2: ans.differential2,
        redFlags: ans.redFlags,
        nextStep: ans.nextStep,
        confidence: ans.confidence
      };
    });
    return map;
  });

  const [isSubmittingCase, setIsSubmittingCase] = useState(false);
  const [isCompletingStage, setIsCompletingStage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentCase = cases[currentCaseIndex];
  const currentSubmittedRecord = currentCase ? submittedAnswers[currentCase.id] : undefined;
  const isCurrentSubmittedLocked = Boolean(currentSubmittedRecord);

  const firstUnsubmittedIndex = cases.findIndex(c => !submittedAnswers[c.id]);
  const maxUnlockedIndex =
    firstUnsubmittedIndex === -1 ? Math.max(0, cases.length - 1) : firstUnsubmittedIndex;

  const { flushCurrent, getLocalTiming } = useCaseActiveTimer({
    caseId: currentCase?.id,
    isLocked: isCurrentSubmittedLocked,
    isDemoMode,
    onOpenCase,
    onHeartbeatTimer,
    onLogEvent
  });

  useEffect(() => {
    setErrorMessage(null);
  }, [currentCaseIndex]);

  if (!currentCase) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-xs text-slate-600">
        No vignette cases are currently available.
      </div>
    );
  }

  const currentAnswer: VignetteFormState = answers[currentCase.id] || {
    mostLikelyDiagnosis: '',
    customOtherDiagnosis: '',
    differential1: '',
    differential2: '',
    redFlags: '',
    nextStep: '',
    confidence: 3
  };

  const updateCurrentAnswer = <K extends keyof VignetteFormState>(
    field: K,
    value: VignetteFormState[K]
  ) => {
    if (isCurrentSubmittedLocked) return;
    setErrorMessage(null);
    setAnswers(prev => ({
      ...prev,
      [currentCase.id]: {
        ...(prev[currentCase.id] || currentAnswer),
        [field]: value
      }
    }));
  };

  const validateCurrent = (a: VignetteFormState): string | null => {
    if (!a.mostLikelyDiagnosis.trim()) {
      return 'Please select your most likely primary diagnosis.';
    }
    if (a.mostLikelyDiagnosis === 'Other' && !a.customOtherDiagnosis.trim()) {
      return 'Please specify your alternative primary diagnosis.';
    }
    if (!a.differential1.trim() || !a.differential2.trim()) {
      return 'Please enter two relevant differential diagnoses before submitting.';
    }
    if (!a.redFlags.trim()) {
      return 'Please identify the critical red flags and risk indicators.';
    }
    if (!a.nextStep.trim()) {
      return 'Please enter the most appropriate next investigation or management step.';
    }
    return null;
  };

  const handleSelectCase = async (idx: number) => {
    if (idx < 0 || idx >= cases.length) return;
    const targetCase = cases[idx];
    const canVisit = Boolean(submittedAnswers[targetCase.id]) || idx <= maxUnlockedIndex;
    if (!canVisit) {
      setErrorMessage(
        `Vignette Case ${idx + 1} is locked until Case ${maxUnlockedIndex + 1} is completed.`
      );
      return;
    }
    await flushCurrent();
    setCurrentCaseIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resolveDiagnosis = (a: VignetteFormState) =>
    a.mostLikelyDiagnosis === 'Other' && a.customOtherDiagnosis.trim()
      ? a.customOtherDiagnosis.trim()
      : a.mostLikelyDiagnosis;

  const handleSubmitCurrentCase = async (): Promise<Record<string, VignetteAnswerRecord> | null> => {
    const validationErr = validateCurrent(currentAnswer);
    if (validationErr) {
      setErrorMessage(validationErr);
      return null;
    }

    setErrorMessage(null);
    setIsSubmittingCase(true);
    try {
      await flushCurrent();

      if (isDemoMode) {
        const timing = getLocalTiming(currentCase.id);
        const demoAnswer: VignetteAnswerRecord = {
          id: `post-${participant.id}-${currentCase.id}`,
          participantId: participant.id,
          caseId: currentCase.id,
          stage: 'post_ai',
          isDemo: true,
          mostLikelyDiagnosis: resolveDiagnosis(currentAnswer),
          differential1: currentAnswer.differential1.trim(),
          differential2: currentAnswer.differential2.trim(),
          redFlags: currentAnswer.redFlags.trim(),
          nextStep: currentAnswer.nextStep.trim(),
          confidence: currentAnswer.confidence,
          firstDisplayedAt: timing.firstDisplayedAt,
          lastOpenedAt: timing.lastOpenedAt,
          activeSeconds: timing.activeSeconds,
          wallClockSeconds: timing.wallClockSeconds,
          submittedAt: timing.submittedAt
        };
        if (onSubmitCase) {
          await onSubmitCase({
            participantId: participant.id,
            caseId: currentCase.id,
            mostLikelyDiagnosis: demoAnswer.mostLikelyDiagnosis,
            differential1: demoAnswer.differential1,
            differential2: demoAnswer.differential2,
            redFlags: demoAnswer.redFlags,
            nextStep: demoAnswer.nextStep,
            confidence: demoAnswer.confidence
          });
        }
        const nextMap = { ...submittedAnswers, [currentCase.id]: demoAnswer };
        setSubmittedAnswers(nextMap);
        return nextMap;
      }

      const input: SubmitVignetteAnswerInput = {
        participantId: participant.id,
        caseId: currentCase.id,
        mostLikelyDiagnosis: resolveDiagnosis(currentAnswer),
        differential1: currentAnswer.differential1.trim(),
        differential2: currentAnswer.differential2.trim(),
        redFlags: currentAnswer.redFlags.trim(),
        nextStep: currentAnswer.nextStep.trim(),
        confidence: currentAnswer.confidence
      };

      const saved = onSubmitCase ? await onSubmitCase(input) : undefined;
      if (saved) {
        const nextMap = { ...submittedAnswers, [currentCase.id]: saved };
        setSubmittedAnswers(nextMap);
        return nextMap;
      }
      return submittedAnswers;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to save vignette submission. Please retry.'
      );
      return null;
    } finally {
      setIsSubmittingCase(false);
    }
  };

  const allCasesSubmitted = cases.every(c => Boolean(submittedAnswers[c.id]));

  const handleNext = async () => {
    let latestMap = submittedAnswers;
    if (!isCurrentSubmittedLocked) {
      const savedMap = await handleSubmitCurrentCase();
      if (!savedMap) return;
      latestMap = savedMap;
    }

    const nextUnsubmittedIdx = cases.findIndex((c, idx) => idx > currentCaseIndex && !latestMap[c.id]);
    const anyUnsubmittedIdx = cases.findIndex(c => !latestMap[c.id]);

    if (isCurrentSubmittedLocked && currentCaseIndex < cases.length - 1) {
      const nextTarget = currentCaseIndex + 1;
      if (submittedAnswers[cases[nextTarget].id] || nextTarget <= maxUnlockedIndex) {
        await handleSelectCase(nextTarget);
        return;
      }
    }

    if (nextUnsubmittedIdx >= 0) {
      await flushCurrent();
      setCurrentCaseIndex(nextUnsubmittedIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (anyUnsubmittedIdx >= 0) {
      await flushCurrent();
      setCurrentCaseIndex(anyUnsubmittedIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsCompletingStage(true);
    setErrorMessage(null);
    try {
      await onComplete(cases.map(c => latestMap[c.id]).filter(Boolean));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to finalize vignette assessment. Please retry.'
      );
    } finally {
      setIsCompletingStage(false);
    }
  };

  const handlePrev = () => {
    if (currentCaseIndex > 0) {
      void handleSelectCase(currentCaseIndex - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Transition Banner */}
      <div className="mb-5 p-3.5 rounded bg-slate-100 border border-slate-300 text-xs text-slate-800 leading-relaxed font-mono">
        <strong>PROTOCOL TRANSITION:</strong> CDSS phase complete. Independent Vignette Cases active. External tools and CDSS recommendations are unavailable.
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-teal-700 mb-1">
              <span>STAGE 07 / 08</span>
              <span aria-hidden="true">·</span>
              <span>UNAIDED CLINICAL VIGNETTES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Vignette Case {currentCaseIndex + 1} of {cases.length}: {currentCase.domain}
            </h2>
          </div>

          {/* Sequential Case Stepper */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
              Cases ({Object.keys(submittedAnswers).length}/{cases.length}):
            </span>
            {cases.map((c, i) => {
              const isSubmitted = Boolean(submittedAnswers[c.id]);
              const isLockedFuture = !isSubmitted && i > maxUnlockedIndex;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isLockedFuture}
                  onClick={() => void handleSelectCase(i)}
                  title={
                    isSubmitted
                      ? `Vignette Case ${i + 1} submitted (locked read-only)`
                      : isLockedFuture
                      ? `Vignette Case ${i + 1} locked until Case ${maxUnlockedIndex + 1} is submitted`
                      : `Vignette Case ${i + 1} (current)`
                  }
                  className={`w-8 h-8 rounded text-xs font-mono font-bold flex items-center justify-center transition-colors ${
                    isLockedFuture ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
                  } ${
                    i === currentCaseIndex
                      ? 'bg-slate-900 text-white'
                      : isSubmitted
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isLockedFuture ? <Lock className="w-3 h-3" /> : i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clinical Vignette Box */}
        <div className="mt-6 space-y-4">
          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Clinical Presentation
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {currentCase.presentation}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Medical &amp; Treatment History
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentCase.medicalHistory}
              </p>
            </div>

            {/* Vitals */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                Current Triage Vitals
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
                Diagnostic Investigations
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

            {/* Attached Clinical Imaging / ECG */}
            <ClinicalImageGallery images={currentCase.clinicalImages} />
          </div>

          {/* Reasoning Fields */}
          <div className="p-6 rounded border border-slate-200 bg-white space-y-6">
            <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Independent Clinical Formulation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unaided independent assessment. Complete all four clinical reasoning criteria.
                </p>
              </div>

              {isDemoMode && !isCurrentSubmittedLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setAnswers(prev => ({
                      ...prev,
                      [currentCase.id]: {
                        mostLikelyDiagnosis: currentCase.mcqOptions[0] || 'Other',
                        customOtherDiagnosis: '',
                        differential1: 'Alternative acute etiology',
                        differential2: 'Secondary systemic condition',
                        redFlags: 'Hemodynamic instability, neurological compromise, end-organ dysfunction',
                        nextStep: 'Immediate targeted stabilization and confirmatory diagnostic testing',
                        confidence: 4
                      }
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors shrink-0 self-start sm:self-auto"
                  title="Fill sample clinical answers for demo walkthrough"
                >
                  <span>⚡ Auto-Fill This Case</span>
                </button>
              )}
            </div>

            {isCurrentSubmittedLocked && currentSubmittedRecord && (
              <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Vignette case submitted and locked. Responses cannot be modified.</span>
                </div>
                {typeof currentSubmittedRecord.activeSeconds === 'number' && (
                  <span className="font-mono text-[11px] font-semibold text-emerald-800 shrink-0">
                    Active Time: {currentSubmittedRecord.activeSeconds}s
                  </span>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1. Most Likely Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                1. Most Likely Primary Diagnosis
              </label>
              <div className="space-y-1.5">
                {currentCase.mcqOptions.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-2.5 rounded border transition-colors text-xs ${
                      isCurrentSubmittedLocked ? 'cursor-default opacity-85' : 'cursor-pointer'
                    } ${
                      currentAnswer.mostLikelyDiagnosis === opt
                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`post-mcq-${currentCase.id}`}
                      disabled={isCurrentSubmittedLocked}
                      checked={currentAnswer.mostLikelyDiagnosis === opt}
                      onChange={() => updateCurrentAnswer('mostLikelyDiagnosis', opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {currentAnswer.mostLikelyDiagnosis === 'Other' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    disabled={isCurrentSubmittedLocked}
                    value={currentAnswer.customOtherDiagnosis}
                    onChange={(e) => updateCurrentAnswer('customOtherDiagnosis', e.target.value)}
                    placeholder="Specify alternative primary diagnosis..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
                  />
                </div>
              )}
            </div>

            {/* 2. Differential Diagnoses */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                2. Two Relevant Differential Diagnoses (Short Text)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  disabled={isCurrentSubmittedLocked}
                  value={currentAnswer.differential1}
                  onChange={(e) => updateCurrentAnswer('differential1', e.target.value)}
                  placeholder="Differential 1..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
                />
                <input
                  type="text"
                  disabled={isCurrentSubmittedLocked}
                  value={currentAnswer.differential2}
                  onChange={(e) => updateCurrentAnswer('differential2', e.target.value)}
                  placeholder="Differential 2..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* 3. Red Flags */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                3. Critical Red Flags &amp; Risk Indicators (Short Text)
              </label>
              <input
                type="text"
                disabled={isCurrentSubmittedLocked}
                value={currentAnswer.redFlags}
                onChange={(e) => updateCurrentAnswer('redFlags', e.target.value)}
                placeholder="Key danger signs, life-threatening complications, or hemodynamic parameters..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
              />
            </div>

            {/* 4. Next Step */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                4. Most Appropriate Next Investigation or Management Step (Short Text)
              </label>
              <input
                type="text"
                disabled={isCurrentSubmittedLocked}
                value={currentAnswer.nextStep}
                onChange={(e) => updateCurrentAnswer('nextStep', e.target.value)}
                placeholder="Immediate pharmacotherapy, intervention, or confirmatory test..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
              />
            </div>

            {/* 5. Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  5. Diagnostic Confidence Rating
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {currentAnswer.confidence} / 5
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={isCurrentSubmittedLocked}
                    onClick={() => updateCurrentAnswer('confidence', lvl)}
                    className={`py-2 px-1 text-center rounded border transition-colors text-xs ${
                      currentAnswer.confidence === lvl
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    } disabled:opacity-80 disabled:cursor-default`}
                  >
                    <div className="font-mono font-bold">{lvl}</div>
                    <div className="text-[10px] hidden sm:block opacity-80">
                      {lvl === 1 ? 'Very Low' : lvl === 3 ? 'Moderate' : lvl === 5 ? 'Very High' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentCaseIndex === 0 || isSubmittingCase || isCompletingStage}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Vignette Case</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={isSubmittingCase || isCompletingStage}
              onClick={() => void handleNext()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white shadow-2xs cursor-pointer"
            >
              <span>
                {isSubmittingCase
                  ? 'Saving Vignette...'
                  : isCompletingStage
                  ? 'Completing Study...'
                  : isCurrentSubmittedLocked
                  ? currentCaseIndex < cases.length - 1
                    ? 'Next Vignette Case'
                    : allCasesSubmitted
                    ? 'Complete Vignette Cases & Proceed to Debriefing'
                    : 'Next Vignette Case'
                  : Object.keys(submittedAnswers).length === cases.length - 1
                  ? 'Submit Final Vignette & Complete Study'
                  : 'Save & Submit Vignette'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
