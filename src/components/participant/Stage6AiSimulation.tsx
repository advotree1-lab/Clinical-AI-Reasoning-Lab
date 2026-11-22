import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Bot, CornerDownRight, Check, Lock } from 'lucide-react';
import {
  ParticipantClinicalCase,
  Participant,
  AiInteractionRecord,
  AiAgreementLevel,
  CdssFollowUpSuggestion,
  CdssFollowupEvent,
  ResearchEventType
} from '../../types';
import { SubmitAiInteractionInput } from '../../services/supabaseResearchService';
import { ClinicalImageGallery } from '../common/ClinicalImageGallery';
import { useCaseActiveTimer } from '../../hooks/useCaseActiveTimer';

interface Stage6AiSimulationProps {
  cases: ParticipantClinicalCase[];
  participant: Participant;
  isDemoMode: boolean;
  initialRecords?: AiInteractionRecord[];
  initialFollowupEvents?: CdssFollowupEvent[];
  onOpenCase?: (caseId: string) => Promise<void> | void;
  onHeartbeatTimer?: (caseId: string, deltaSeconds: number) => Promise<void> | void;
  onLogFollowup?: (caseId: string, suggestionId: 'followup_1' | 'followup_2') => Promise<void> | void;
  onSubmitCase?: (input: SubmitAiInteractionInput) => Promise<AiInteractionRecord | void>;
  onComplete: (records: AiInteractionRecord[]) => void | Promise<void>;
  onLogEvent?: (
    eventType: ResearchEventType,
    caseId?: string,
    payload?: Record<string, unknown>
  ) => void;
}

interface ChatMessage {
  id: string;
  sender: 'cdss' | 'user';
  type: 'initial_stimulus' | 'text';
  text?: string;
  timestamp: string;
}

interface CaseEvaluationState {
  aiAgreement: AiAgreementLevel;
  finalDiagnosis: string;
  customOtherFinal: string;
  switchedAfterCdss: boolean;
  reasonForDecision: string;
  finalConfidence: number;
  willVerify: boolean;
  verificationTargets: string;
}

export const Stage6AiSimulation: React.FC<Stage6AiSimulationProps> = ({
  cases,
  participant,
  isDemoMode,
  initialRecords = [],
  initialFollowupEvents = [],
  onOpenCase,
  onHeartbeatTimer,
  onLogFollowup,
  onSubmitCase,
  onComplete,
  onLogEvent
}) => {
  const [submittedRecords, setSubmittedRecords] = useState<Record<string, AiInteractionRecord>>(() => {
    const map: Record<string, AiInteractionRecord> = {};
    initialRecords.forEach(r => {
      map[r.caseId] = r;
    });
    return map;
  });

  const [currentCaseIndex, setCurrentCaseIndex] = useState(() => {
    if (cases.length === 0) return 0;
    const firstUnsubmitted = cases.findIndex(
      c => !initialRecords.some(r => r.caseId === c.id)
    );
    return firstUnsubmitted >= 0 ? firstUnsubmitted : 0;
  });

  const [evaluations, setEvaluations] = useState<Record<string, CaseEvaluationState>>(() => {
    const initial: Record<string, CaseEvaluationState> = {};
    initialRecords.forEach(rec => {
      const matchedCase = cases.find(c => c.id === rec.caseId);
      const isOptionMatch = matchedCase?.mcqOptions.includes(rec.finalDiagnosis);
      initial[rec.caseId] = {
        aiAgreement: rec.aiAgreement,
        finalDiagnosis: isOptionMatch ? rec.finalDiagnosis : 'Other',
        customOtherFinal: isOptionMatch ? '' : rec.finalDiagnosis,
        switchedAfterCdss: rec.switchedDiagnosis,
        reasonForDecision: rec.reasonForDecision,
        finalConfidence: rec.finalConfidence,
        willVerify: rec.willVerify,
        verificationTargets: rec.verificationTargets
      };
    });
    return initial;
  });

  const [askedByCase, setAskedByCase] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    initialFollowupEvents.forEach(ev => {
      const existing = map[ev.caseId] || [];
      if (!existing.includes(ev.suggestionId)) {
        map[ev.caseId] = [...existing, ev.suggestionId];
      }
    });
    return map;
  });

  const [chatByCase, setChatByCase] = useState<Record<string, ChatMessage[]>>(() => {
    const map: Record<string, ChatMessage[]> = {};
    initialFollowupEvents.forEach(ev => {
      const base: ChatMessage[] = map[ev.caseId] || [
        {
          id: `init-${ev.caseId}`,
          sender: 'cdss',
          type: 'initial_stimulus',
          timestamp: 'Initial Assessment'
        }
      ];
      map[ev.caseId] = [
        ...base,
        {
          id: `user-${ev.suggestionId}`,
          sender: 'user',
          type: 'text',
          text: ev.promptLabel,
          timestamp: 'Clinician'
        },
        {
          id: `cdss-${ev.suggestionId}`,
          sender: 'cdss',
          type: 'text',
          text: ev.responseText,
          timestamp: 'CDSS Reply'
        }
      ];
    });
    return map;
  });

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSubmittingCase, setIsSubmittingCase] = useState<boolean>(false);
  const [isCompletingStage, setIsCompletingStage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const currentCase = cases[currentCaseIndex];
  const currentSubmittedRecord = currentCase ? submittedRecords[currentCase.id] : undefined;
  const isCurrentSubmittedLocked = !isDemoMode && Boolean(currentSubmittedRecord);

  const { flushCurrent, getLocalTiming } = useCaseActiveTimer({
    caseId: currentCase?.id,
    isLocked: isCurrentSubmittedLocked,
    isDemoMode,
    onOpenCase,
    onHeartbeatTimer,
    onLogEvent
  });

  useEffect(() => {
    setIsTyping(false);
    setErrorMessage(null);
  }, [currentCaseIndex]);

  const currentAskedIds = currentCase ? askedByCase[currentCase.id] || [] : [];
  const currentChatMessages: ChatMessage[] = currentCase
    ? chatByCase[currentCase.id] || [
        {
          id: `init-${currentCase.id}`,
          sender: 'cdss',
          type: 'initial_stimulus',
          timestamp: 'Initial Assessment'
        }
      ]
    : [];

  useEffect(() => {
    if (currentChatMessages.length > 1 || isTyping) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentChatMessages.length, isTyping]);

  if (!currentCase || !currentCase.aiStimulus) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-xs text-slate-600">
        No CDSS clinical cases are currently available.
      </div>
    );
  }

  const stimulus = currentCase.aiStimulus;
  const followUpSuggestions: CdssFollowUpSuggestion[] = stimulus.followUpSuggestions || [
    {
      id: 'followup_1',
      promptLabel: 'Explain key diagnostic reasoning',
      responseText: stimulus.clinicalReasoning
    },
    {
      id: 'followup_2',
      promptLabel: 'Summarize immediate management plan',
      responseText: stimulus.recommendation
    }
  ];

  const currentEval: CaseEvaluationState = evaluations[currentCase.id] || {
    aiAgreement: 'Completely agree',
    finalDiagnosis: currentCase.mcqOptions[0] || 'Other',
    customOtherFinal: '',
    switchedAfterCdss: false,
    reasonForDecision: '',
    finalConfidence: 3,
    willVerify: true,
    verificationTargets: ''
  };

  const updateCurrentEval = <K extends keyof CaseEvaluationState>(
    field: K,
    value: CaseEvaluationState[K]
  ) => {
    if (isCurrentSubmittedLocked) return;
    setErrorMessage(null);
    setEvaluations(prev => ({
      ...prev,
      [currentCase.id]: {
        ...(prev[currentCase.id] || currentEval),
        [field]: value
      }
    }));
  };

  const handleSelectSuggestion = (suggestion: CdssFollowUpSuggestion) => {
    if (currentAskedIds.includes(suggestion.id) || isTyping) return;
    const caseId = currentCase.id;

    setAskedByCase(prev => ({
      ...prev,
      [caseId]: [...(prev[caseId] || []), suggestion.id]
    }));

    if (!isDemoMode && onLogFollowup) {
      void Promise.resolve(onLogFollowup(caseId, suggestion.id)).catch(() => undefined);
    }

    setChatByCase(prev => {
      const existing = prev[caseId] || [
        {
          id: `init-${caseId}`,
          sender: 'cdss' as const,
          type: 'initial_stimulus' as const,
          timestamp: 'Initial Assessment'
        }
      ];
      return {
        ...prev,
        [caseId]: [
          ...existing,
          {
            id: `user-${suggestion.id}`,
            sender: 'user',
            type: 'text',
            text: suggestion.promptLabel,
            timestamp: 'Clinician'
          }
        ]
      };
    });

    setIsTyping(true);
    window.setTimeout(() => {
      setChatByCase(prev => {
        const existing = prev[caseId] || [];
        return {
          ...prev,
          [caseId]: [
            ...existing,
            {
              id: `cdss-${suggestion.id}`,
              sender: 'cdss',
              type: 'text',
              text: suggestion.responseText,
              timestamp: 'CDSS Reply'
            }
          ]
        };
      });
      setIsTyping(false);
    }, 320);
  };

  const isCaseStartedOrFilled = (c: ParticipantClinicalCase) => {
    if (submittedRecords[c.id]) return true;
    const ev = evaluations[c.id];
    return Boolean(ev && ev.reasonForDecision.trim());
  };

  const handleSelectCase = async (idx: number) => {
    await flushCurrent();
    setCurrentCaseIndex(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resolveFinalDiagnosis = (ev: CaseEvaluationState) =>
    ev.finalDiagnosis === 'Other' && ev.customOtherFinal.trim()
      ? ev.customOtherFinal.trim()
      : ev.finalDiagnosis;

  const validateEvaluation = (ev: CaseEvaluationState): string | null => {
    if (ev.finalDiagnosis === 'Other' && !ev.customOtherFinal.trim()) {
      return 'Please specify your alternative working diagnosis before submitting this case.';
    }
    if (!ev.reasonForDecision.trim()) {
      return 'Please provide your clinical rationale for agreeing, disagreeing, or modifying your diagnosis.';
    }
    if (ev.willVerify && !ev.verificationTargets.trim()) {
      return 'Please specify what clinical guideline, biomarker, or source you would check to verify this suggestion.';
    }
    return null;
  };

  const buildDemoRecord = (
    c: ParticipantClinicalCase,
    ev: CaseEvaluationState
  ): AiInteractionRecord => {
    const timing = getLocalTiming(c.id);
    const actualFinal = resolveFinalDiagnosis(ev);
    const rationaleText = ev.reasonForDecision.trim() || 'Reviewed in demo walkthrough';
    return {
      id: `ai-sim-${participant.id}-${c.id}`,
      participantId: participant.id,
      caseId: c.id,
      isDemo: true,
      aiAgreement: ev.aiAgreement,
      finalDiagnosis: actualFinal,
      reasonForDecision: rationaleText,
      finalConfidence: ev.finalConfidence,
      willVerify: ev.willVerify,
      verificationTargets: ev.willVerify
        ? ev.verificationTargets.trim() || 'Standard clinical guideline verification'
        : 'No verification indicated',
      switchedDiagnosis: ev.switchedAfterCdss,
      firstDisplayedAt: timing.firstDisplayedAt,
      lastOpenedAt: timing.lastOpenedAt,
      submittedAt: timing.submittedAt,
      activeSeconds: timing.activeSeconds,
      wallClockSeconds: timing.wallClockSeconds,
      completedAt: timing.submittedAt
    };
  };

  const handleSubmitCurrentLiveCase = async (): Promise<Record<string, AiInteractionRecord> | null> => {
    const validationErr = validateEvaluation(currentEval);
    if (validationErr) {
      setErrorMessage(validationErr);
      return null;
    }

    setErrorMessage(null);
    setIsSubmittingCase(true);
    try {
      await flushCurrent();

      const actualFinal = resolveFinalDiagnosis(currentEval);
      const input: SubmitAiInteractionInput = {
        participantId: participant.id,
        caseId: currentCase.id,
        aiAgreement: currentEval.aiAgreement,
        finalDiagnosis: actualFinal,
        switchedDiagnosis: currentEval.switchedAfterCdss,
        reasonForDecision: currentEval.reasonForDecision.trim(),
        finalConfidence: currentEval.finalConfidence,
        willVerify: currentEval.willVerify,
        verificationTargets: currentEval.willVerify
          ? currentEval.verificationTargets.trim()
          : 'No verification indicated'
      };

      const saved = onSubmitCase ? await onSubmitCase(input) : undefined;
      if (saved) {
        const nextMap = { ...submittedRecords, [currentCase.id]: saved };
        setSubmittedRecords(nextMap);
        return nextMap;
      }
      return submittedRecords;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to save case evaluation. Please try again.'
      );
      return null;
    } finally {
      setIsSubmittingCase(false);
    }
  };

  const handleCompleteStageDemo = () => {
    const records: AiInteractionRecord[] = cases.map(c => {
      const ev = evaluations[c.id] || {
        aiAgreement: 'Completely agree' as AiAgreementLevel,
        finalDiagnosis: c.mcqOptions[0] || 'Other',
        customOtherFinal: '',
        switchedAfterCdss: false,
        reasonForDecision: '',
        finalConfidence: 3,
        willVerify: true,
        verificationTargets: ''
      };
      return buildDemoRecord(c, ev);
    });
    void onComplete(records);
  };

  const allCasesSubmitted = cases.every(c => Boolean(submittedRecords[c.id]));

  const handleNextOrFinish = async () => {
    if (isDemoMode) {
      await flushCurrent();
      if (currentCaseIndex < cases.length - 1) {
        await handleSelectCase(currentCaseIndex + 1);
      } else {
        handleCompleteStageDemo();
      }
      return;
    }

    let latestMap = submittedRecords;
    if (!isCurrentSubmittedLocked) {
      const savedMap = await handleSubmitCurrentLiveCase();
      if (!savedMap) return;
      latestMap = savedMap;
    }

    const nextUnsubmittedIdx = cases.findIndex((c, idx) => idx > currentCaseIndex && !latestMap[c.id]);
    const anyUnsubmittedIdx = cases.findIndex(c => !latestMap[c.id]);

    if (nextUnsubmittedIdx >= 0) {
      await handleSelectCase(nextUnsubmittedIdx);
      return;
    }
    if (anyUnsubmittedIdx >= 0 && currentCaseIndex < cases.length - 1) {
      await handleSelectCase(currentCaseIndex + 1);
      return;
    }
    if (anyUnsubmittedIdx >= 0) {
      await handleSelectCase(anyUnsubmittedIdx);
      return;
    }

    // All 5 cases submitted in live Research Mode
    setIsCompletingStage(true);
    setErrorMessage(null);
    try {
      await onComplete(cases.map(c => latestMap[c.id]).filter(Boolean));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to complete CDSS stage. Please retry.'
      );
    } finally {
      setIsCompletingStage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-6 sm:p-8 shadow-2xs">
        
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-teal-700 mb-1">
              <span>STAGE 06 / 08</span>
              <span aria-hidden="true">·</span>
              <span>CDSS SIMULATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              CDSS Case {currentCaseIndex + 1} of {cases.length}: {currentCase.domain}
            </h2>
          </div>

          {/* Case Stepper */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
              Cases ({Object.keys(submittedRecords).length}/{cases.length}):
            </span>
            {cases.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void handleSelectCase(i)}
                title={`Jump to Case ${i + 1}: ${c.domain}`}
                className={`w-8 h-8 rounded text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  i === currentCaseIndex
                    ? 'bg-slate-900 text-white'
                    : isCaseStartedOrFilled(c)
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* SIDE-BY-SIDE: CLINICAL CASE (LEFT) + INTERACTIVE CDSS CHATBOT (RIGHT) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Clinical Case Details */}
          <div className="lg:col-span-7 p-5 rounded bg-slate-50 border border-slate-200 space-y-4">
            <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                Clinical Case · {currentCase.title}
              </span>
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                {currentCase.domain}
              </span>
            </div>

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
                Medical &amp; Drug History
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentCase.medicalHistory}
              </p>
            </div>

            {/* Vitals */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                Triage Vitals
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
                Investigations
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

          {/* Right Column: Interactive CDSS Chatbot Beside Case */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 rounded-lg border border-slate-300 bg-white shadow-2xs overflow-hidden flex flex-col">
            {/* Chatbot Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wide font-mono">
                    CDSS CLINICAL ASSISTANT
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Standardized Decision Support · REF #CDSS-0{currentCase.caseNumber}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                ACTIVE
              </span>
            </div>

            {/* Chatbot Messages Feed */}
            <div className="p-4 bg-slate-50/80 space-y-3.5 max-h-[470px] overflow-y-auto">
              {currentChatMessages.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-lg rounded-tr-xs bg-slate-900 text-white px-3.5 py-2.5 shadow-2xs">
                        <div className="text-[10px] font-mono text-slate-400 mb-0.5 text-right">
                          You
                        </div>
                        <p className="text-xs leading-relaxed font-medium">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (msg.type === 'initial_stimulus') {
                  return (
                    <div key={msg.id} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="flex-1 rounded-lg rounded-tl-xs bg-white border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                            CDSS · Initial Case Impression
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {msg.timestamp}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                            Suggested Primary Diagnosis
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {stimulus.diagnosis}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                            Recommended Action
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            {stimulus.recommendation}
                          </p>
                        </div>

                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                            Clinical Rationale
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {stimulus.clinicalReasoning}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 rounded-lg rounded-tl-xs bg-white border border-slate-200 p-3 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                          CDSS · Follow-Up
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="rounded-lg rounded-tl-xs bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 font-mono">
                    CDSS reviewing case parameters...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Interactive Two-Suggestion Prompt Bar */}
            <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Suggested Follow-Up Questions ({2 - currentAskedIds.length} remaining)
                </span>
              </div>

              <div className="space-y-1.5">
                {followUpSuggestions.slice(0, 2).map((suggestion) => {
                  const isAsked = currentAskedIds.includes(suggestion.id);
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      disabled={isAsked || isTyping}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full text-left px-3 py-2 rounded border text-xs transition-colors flex items-center justify-between gap-2 ${
                        isAsked
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
                          : 'bg-white border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-slate-800 font-medium cursor-pointer shadow-2xs'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isAsked ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                        <span>{suggestion.promptLabel}</span>
                      </span>
                      {isAsked && (
                        <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">
                          Asked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 text-[10px] font-mono text-slate-400">
                Standardized CDSS interface · Responses are identical for all participants.
              </div>
            </div>
          </div>

        </div>

        {/* CLINICIAN DECISION & CDSS EVALUATION */}
        <div className="mt-6 p-6 rounded border border-slate-200 bg-white space-y-6">
          <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                Clinical Decision &amp; CDSS Evaluation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Record your agreement with the CDSS output, your final working diagnosis, and verification plan.
              </p>
            </div>

            {isDemoMode && (
              <button
                type="button"
                onClick={() => {
                  setEvaluations(prev => ({
                    ...prev,
                    [currentCase.id]: {
                      aiAgreement: 'Uncertain; requires verification',
                      finalDiagnosis: currentCase.mcqOptions[0] || 'Other',
                      customOtherFinal: '',
                      switchedAfterCdss: false,
                      reasonForDecision:
                        'Cross-checked CDSS recommendation against clinical findings, triage vitals, and safety contraindications.',
                      finalConfidence: 4,
                      willVerify: true,
                      verificationTargets:
                        'Cross-check clinical practice guidelines, consult senior colleague, and obtain confirmatory testing.'
                    }
                  }));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors shrink-0 self-start sm:self-auto"
                title="Fill sample CDSS evaluation for demo walkthrough"
              >
                <span>⚡ Auto-Fill CDSS Evaluation</span>
              </button>
            )}
          </div>

          {isCurrentSubmittedLocked && currentSubmittedRecord && (
            <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  Case evaluation submitted and securely recorded.
                </span>
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

          {/* 1. Agreement with CDSS */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
              1. Agreement with CDSS Suggestion
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                'Completely agree',
                'Partially agree',
                'Disagree',
                'Uncertain; requires verification'
              ].map((level) => (
                <button
                  key={level}
                  type="button"
                  disabled={isCurrentSubmittedLocked}
                  onClick={() => updateCurrentEval('aiAgreement', level as AiAgreementLevel)}
                  className={`p-2.5 text-left rounded border text-xs font-medium transition-colors ${
                    currentEval.aiAgreement === level
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  } disabled:opacity-80 disabled:cursor-default`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Final Working Diagnosis */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
              2. Final Working Diagnosis
            </label>
            <div className="space-y-1.5">
              {currentCase.mcqOptions.map(opt => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-2.5 rounded border text-xs ${
                    isCurrentSubmittedLocked ? 'cursor-default opacity-85' : 'cursor-pointer'
                  } ${
                    currentEval.finalDiagnosis === opt
                      ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name={`final-mcq-${currentCase.id}`}
                    disabled={isCurrentSubmittedLocked}
                    checked={currentEval.finalDiagnosis === opt}
                    onChange={() => updateCurrentEval('finalDiagnosis', opt)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            {currentEval.finalDiagnosis === 'Other' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  disabled={isCurrentSubmittedLocked}
                  value={currentEval.customOtherFinal}
                  onChange={(e) => updateCurrentEval('customOtherFinal', e.target.value)}
                  placeholder="Specify final diagnosis..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 disabled:bg-slate-50"
                />
              </div>
            )}
          </div>

          {/* 3. Influence on Initial Impression */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200">
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
              3. Did the CDSS suggestion alter your initial clinical impression?
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex items-center gap-2 text-xs font-medium text-slate-800 ${isCurrentSubmittedLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name={`switched-${currentCase.id}`}
                  disabled={isCurrentSubmittedLocked}
                  checked={!currentEval.switchedAfterCdss}
                  onChange={() => updateCurrentEval('switchedAfterCdss', false)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>No — Maintained my independent working diagnosis</span>
              </label>
              <label className={`flex items-center gap-2 text-xs font-medium text-slate-800 ${isCurrentSubmittedLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name={`switched-${currentCase.id}`}
                  disabled={isCurrentSubmittedLocked}
                  checked={currentEval.switchedAfterCdss}
                  onChange={() => updateCurrentEval('switchedAfterCdss', true)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Yes — Modified my diagnosis after reviewing CDSS</span>
              </label>
            </div>
          </div>

          {/* 4. Reason for Decision */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
              4. Clinical Rationale for Acceptance, Rejection, or Modification
            </label>
            <textarea
              rows={2}
              disabled={isCurrentSubmittedLocked}
              value={currentEval.reasonForDecision}
              onChange={(e) => updateCurrentEval('reasonForDecision', e.target.value)}
              placeholder="Explain the clinical rationale behind your agreement, disagreement, or modification..."
              className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
            />
          </div>

          {/* 5. Diagnostic Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                5. Diagnostic Confidence
              </label>
              <span className="text-xs font-mono font-bold text-slate-900">
                {currentEval.finalConfidence} / 5
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  disabled={isCurrentSubmittedLocked}
                  onClick={() => updateCurrentEval('finalConfidence', lvl)}
                  className={`py-1.5 text-center rounded border text-xs font-mono font-bold transition-colors ${
                    currentEval.finalConfidence === lvl
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  } disabled:opacity-80 disabled:cursor-default`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Independent Verification Intent */}
          <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                6. Would you independently verify this CDSS suggestion before execution?
              </label>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className={`flex items-center gap-2 text-xs font-medium text-slate-800 ${isCurrentSubmittedLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name={`verifyChoice-${currentCase.id}`}
                    disabled={isCurrentSubmittedLocked}
                    checked={currentEval.willVerify === true}
                    onChange={() => updateCurrentEval('willVerify', true)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>Yes, I would independently verify before acting</span>
                </label>
                <label className={`flex items-center gap-2 text-xs font-medium text-slate-800 ${isCurrentSubmittedLocked ? 'cursor-default' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name={`verifyChoice-${currentCase.id}`}
                    disabled={isCurrentSubmittedLocked}
                    checked={currentEval.willVerify === false}
                    onChange={() => updateCurrentEval('willVerify', false)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>No, I would act directly on this advice</span>
                </label>
              </div>
            </div>

            {currentEval.willVerify && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Specific verification targets (guidelines, biomarkers, imaging):
                </label>
                <input
                  type="text"
                  disabled={isCurrentSubmittedLocked}
                  value={currentEval.verificationTargets}
                  onChange={(e) => updateCurrentEval('verificationTargets', e.target.value)}
                  placeholder="e.g. Verify contraindications, obtain confirmatory scan, review guideline thresholds..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white disabled:bg-slate-50"
                />
              </div>
            )}
          </div>

          {/* Navigation & Per-Case Persistence Controls */}
          <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => currentCaseIndex > 0 && void handleSelectCase(currentCaseIndex - 1)}
              disabled={currentCaseIndex === 0 || isSubmittingCase || isCompletingStage}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous CDSS Case</span>
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {isDemoMode && currentCaseIndex < cases.length - 1 && (
                <button
                  type="button"
                  onClick={handleCompleteStageDemo}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors"
                >
                  Proceed to Vignette Cases
                </button>
              )}

              <button
                type="button"
                disabled={isSubmittingCase || isCompletingStage}
                onClick={() => void handleNextOrFinish()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white shadow-2xs cursor-pointer"
              >
                <span>
                  {isSubmittingCase
                    ? 'Saving Case...'
                    : isCompletingStage
                    ? 'Finalizing CDSS Stage...'
                    : isDemoMode
                    ? currentCaseIndex === cases.length - 1
                      ? 'Complete CDSS & Proceed to Vignette Cases'
                      : 'Next CDSS Case'
                    : isCurrentSubmittedLocked
                    ? allCasesSubmitted
                      ? 'Complete CDSS & Proceed to Vignette Cases'
                      : 'Next CDSS Case'
                    : Object.keys(submittedRecords).length === cases.length - 1
                    ? 'Submit Final Case & Proceed to Vignette Cases'
                    : 'Save & Submit Case Evaluation'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
