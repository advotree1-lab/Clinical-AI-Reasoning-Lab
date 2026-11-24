import React, { useState, useEffect } from 'react';
import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ParticipantClinicalCase,
  ResearchProtocolSettings,
  CdssFollowupEvent,
  RecruitmentTokenValidation,
  ResearchEventType
} from '../../types';
import { researchStore } from '../../services/researchStore';
import { Stage1Welcome } from './Stage1Welcome';
import { Stage2Eligibility } from './Stage2Eligibility';
import { Stage2Consent } from './Stage2Consent';
import { Stage4Questionnaire } from './Stage4Questionnaire';
import { Stage6AiSimulation } from './Stage6AiSimulation';
import { Stage7PostAiAssessment } from './Stage7PostAiAssessment';
import { Stage8Debriefing } from './Stage8Debriefing';
import { PrototypeDemoBar } from './PrototypeDemoBar';

interface ParticipantFlowProps {
  isDemoMode: boolean;
  onToggleDemoMode?: (isDemo: boolean) => void;
  settings: ResearchProtocolSettings;
  cases: ParticipantClinicalCase[];
  casesLoading?: boolean;
  casesError?: string | null;
  initialReferralToken?: string | null;
  initialReferralValidation?: RecruitmentTokenValidation | null;
  onCompleteReturnToLogin?: () => void;
}

const REFERRAL_SESSION_STORAGE_KEY = 'carl_referral_token_v1';
const SUPERVISED_SESSION_STORAGE_KEY = 'carl_supervised_session_v1';

/**
 * Maps database participants.current_stage (4..7) into the 7-step Participant UI flow:
 * DB 4 (enrolled / survey pending) -> UI 4 (Questionnaire)
 * DB 5 (survey done) -> UI 5 (5 CDSS cases)
 * DB 6 (cdss done) -> UI 6 (6 Post-AI vignettes)
 * DB 7 / completed -> UI 7 (Debriefing)
 */
function dbStageToUiStep(dbStage: number | undefined, completed: boolean): number {
  if (completed) return 7;
  return Math.max(4, Math.min(7, dbStage || 4));
}

export const ParticipantFlow: React.FC<ParticipantFlowProps> = ({
  isDemoMode,
  onToggleDemoMode,
  settings,
  cases,
  casesLoading = false,
  casesError = null,
  initialReferralToken = undefined,
  initialReferralValidation = null,
  onCompleteReturnToLogin
}) => {
  const [stage, setStage] = useState<number>(1);
  const [eligibilityConfirmed, setEligibilityConfirmed] = useState<boolean>(false);
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [restoredQuestionnaire, setRestoredQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [restoredAiInteractions, setRestoredAiInteractions] = useState<AiInteractionRecord[]>([]);
  const [restoredFollowupEvents, setRestoredFollowupEvents] = useState<CdssFollowupEvent[]>([]);
  const [restoredVignetteAnswers, setRestoredVignetteAnswers] = useState<VignetteAnswerRecord[]>([]);

  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(false);
  const [isSubmittingStage, setIsSubmittingStage] = useState<boolean>(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const [referralToken, setReferralToken] = useState<string | null>(() => {
    if (initialReferralToken !== undefined) return initialReferralToken;
    try {
      return sessionStorage.getItem(REFERRAL_SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [referralValidation, setReferralValidation] = useState<RecruitmentTokenValidation | null>(
    initialReferralValidation
  );

  const simCases = cases.filter(c => c.stage === 'ai_simulation');
  const postAiCases = cases.filter(c => c.stage === 'post_ai');

  useEffect(() => {
    let active = true;
    setStageError(null);

    if (isDemoMode) {
      setIsRestoringSession(false);
      setEligibilityConfirmed(false);
      setConsentConfirmed(false);
      setCurrentParticipant(null);
      setRestoredQuestionnaire(null);
      setRestoredAiInteractions([]);
      setRestoredFollowupEvents([]);
      setRestoredVignetteAnswers([]);
      setStage(1);
      return;
    }

    if (!researchStore.isLiveSupabaseAvailable()) {
      setIsRestoringSession(false);
      return;
    }

    setIsRestoringSession(true);

    (async () => {
      try {
        if (referralToken) {
          try {
            const validation = await researchStore.validateReferralToken(referralToken);
            if (active) setReferralValidation(validation);
          } catch {
            if (active) {
              setReferralValidation({
                isValid: false,
                researcherCode: null,
                linkLabel: null
              });
            }
          }
        }

        const snapshot = await researchStore.restoreLiveSession();
        if (!active) return;

        if (snapshot) {
          setEligibilityConfirmed(true);
          setConsentConfirmed(true);
          setCurrentParticipant(snapshot.participant);
          setRestoredQuestionnaire(snapshot.questionnaire);
          setRestoredAiInteractions(snapshot.aiInteractions);
          setRestoredFollowupEvents(snapshot.followupEvents);
          setRestoredVignetteAnswers(snapshot.vignetteAnswers);
          setStage(dbStageToUiStep(snapshot.participant.currentStage, snapshot.participant.completed));
        } else {
          setEligibilityConfirmed(false);
          setConsentConfirmed(false);
          setCurrentParticipant(null);
          setRestoredQuestionnaire(null);
          setRestoredAiInteractions([]);
          setRestoredFollowupEvents([]);
          setRestoredVignetteAnswers([]);
          setStage(1);
        }
      } catch (err) {
        if (active) {
          setStageError(
            err instanceof Error ? err.message : 'Failed to initialize live research session.'
          );
        }
      } finally {
        if (active) setIsRestoringSession(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isDemoMode, referralToken]);

  const logEventSafely = (
    eventType: ResearchEventType,
    caseId?: string,
    payload?: Record<string, unknown>
  ) => {
    if (isDemoMode || !currentParticipant || !researchStore.isLiveSupabaseAvailable()) return;
    const dbStage = Math.max(1, Math.min(7, stage));
    void researchStore
      .logLiveEvent({
        participantId: currentParticipant.id,
        eventType,
        stage: dbStage,
        caseId,
        payload,
        clientTimestamp: new Date().toISOString()
      })
      .catch(() => undefined);
  };

  const ensureDemoParticipant = (): Participant => {
    if (currentParticipant && currentParticipant.isDemo) return currentParticipant;
    const nowIso = new Date().toISOString();
    const p: Participant = {
      id: `part-demo-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 8000)}`,
      designation: 'Junior Resident',
      specialty: 'General Medicine',
      yearsSinceMbbsBracket: '1–5 years',
      institutionType: 'Teaching hospital',
      formalGenAiTraining: false,
      consentGiven: true,
      isDemo: true,
      recruitmentSource: 'direct',
      recruitedBy: null,
      researcherCode: null,
      createdAt: nowIso,
      completed: false,
      currentStage: Math.max(4, Math.min(7, stage))
    };
    setCurrentParticipant(p);
    researchStore.saveParticipant(p);
    return p;
  };

  const buildSampleQuestionnaire = (p: Participant): QuestionnaireResponse => ({
    id: `q-quick-${p.id}`,
    participantId: p.id,
    isDemo: true,
    designation: p.designation,
    designationOther: p.designationOther,
    specialty: p.specialty,
    specialtyOther: p.specialtyOther,
    yearsSinceMbbsBracket: p.yearsSinceMbbsBracket,
    hospitalType: p.institutionType,
    hospitalTypeOther: p.institutionOther,
    formalGenAiTraining: p.formalGenAiTraining,
    usedGenAiLast3Months: true,
    firstUseDuration: '6–12 months',
    usageFrequency: 'Daily',
    dailyTimeSpent: '10–30 minutes',
    toolsUsed: ['ChatGPT', 'Google Gemini'],
    accessMethod: 'Free public version',
    enteredPatientInfo: 'Never',
    taskFrequency: {
      differentialDiagnoses: 'Often',
      interpretingInvestigations: 'Sometimes',
      choosingInvestigations: 'Sometimes',
      identifyingManagement: 'Often',
      drugDosesAndInteractions: 'Often',
      summarisingLiterature: 'Very often',
      clinicalDocumentation: 'Sometimes',
      patientCommunication: 'Rarely'
    },
    reasoningConsultationStage: 'After my initial assessment, to cross-check my thinking',
    last10CasesConsultedCount: 4,
    verificationFrequency: 'Often',
    institutionalPolicy: 'No',
    createdAt: new Date().toISOString()
  });

  const handleQuickFillCurrentStep = () => {
    if (!isDemoMode) return;
    if (stage === 1) {
      handleBegin();
    } else if (stage === 2) {
      handleConfirmEligible();
    } else if (stage === 3) {
      handleConsent();
    } else if (stage === 4) {
      const p = ensureDemoParticipant();
      void handleQuestionnaireSubmit(buildSampleQuestionnaire(p), p);
    } else if (stage === 5) {
      if (restoredAiInteractions.length >= simCases.length && simCases.length > 0) {
        void handleAiSimulationComplete(restoredAiInteractions);
        return;
      }
      const p = ensureDemoParticipant();
      const nowIso = new Date().toISOString();
      const simRecords: AiInteractionRecord[] = simCases.map(c => {
        const existing = restoredAiInteractions.find(r => r.caseId === c.id);
        if (existing) return existing;
        return {
          id: `ai-sim-${p.id}-${c.id}`,
          participantId: p.id,
          caseId: c.id,
          isDemo: true,
          aiAgreement: 'Uncertain; requires verification',
          finalDiagnosis: c.mcqOptions[0] || 'Other',
          reasonForDecision:
            'Reviewed clinical history, vitals, and investigations against standardized CDSS recommendation.',
          finalConfidence: 4,
          willVerify: true,
          verificationTargets: 'Check clinical practice guidelines and obtain confirmatory testing.',
          switchedDiagnosis: false,
          firstDisplayedAt: nowIso,
          lastOpenedAt: nowIso,
          submittedAt: nowIso,
          activeSeconds: 0,
          wallClockSeconds: 0,
          completedAt: nowIso
        };
      });
      void handleAiSimulationComplete(simRecords);
    } else if (stage === 6) {
      if (restoredVignetteAnswers.length >= postAiCases.length && postAiCases.length > 0) {
        void handlePostAiComplete(restoredVignetteAnswers);
        return;
      }
      const p = ensureDemoParticipant();
      const nowIso = new Date().toISOString();
      const postRecords: VignetteAnswerRecord[] = postAiCases.map(c => {
        const existing = restoredVignetteAnswers.find(a => a.caseId === c.id);
        if (existing) return existing;
        return {
          id: `post-${p.id}-${c.id}`,
          participantId: p.id,
          caseId: c.id,
          stage: 'post_ai',
          isDemo: true,
          mostLikelyDiagnosis: c.mcqOptions[0] || 'Other',
          differential1: 'Alternative acute etiology',
          differential2: 'Secondary systemic condition',
          redFlags: 'Hemodynamic instability and urgent clinical danger indicators',
          nextStep: 'Immediate targeted stabilization and confirmatory investigation',
          confidence: 4,
          firstDisplayedAt: nowIso,
          lastOpenedAt: nowIso,
          activeSeconds: 0,
          wallClockSeconds: 0,
          submittedAt: nowIso
        };
      });
      void handlePostAiComplete(postRecords);
    }
  };

  const handleJumpToStage = (targetStage: number) => {
    if (isDemoMode && targetStage >= 5) {
      ensureDemoParticipant();
    }
    setStageError(null);
    setStage(targetStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadCompleteSession = () => {
    if (!isDemoMode) return;
    const nowIso = new Date().toISOString();
    const p: Participant = {
      id: `part-complete-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 7999)}`,
      designation: 'Junior Resident',
      specialty: 'General Medicine',
      yearsSinceMbbsBracket: '1–5 years',
      institutionType: 'Teaching hospital',
      formalGenAiTraining: false,
      consentGiven: true,
      isDemo: true,
      recruitmentSource: 'direct',
      recruitedBy: null,
      researcherCode: null,
      createdAt: nowIso,
      completed: true,
      currentStage: 7
    };
    const sampleQ = buildSampleQuestionnaire(p);
    const simRecords: AiInteractionRecord[] = simCases.map(c => ({
      id: `ai-sim-${p.id}-${c.id}`,
      participantId: p.id,
      caseId: c.id,
      isDemo: true,
      aiAgreement: 'Uncertain; requires verification',
      finalDiagnosis: c.mcqOptions[0] || 'Other',
      reasonForDecision: 'Evaluated CDSS recommendation against clinical findings.',
      finalConfidence: 4,
      willVerify: true,
      verificationTargets: 'Review clinical practice guidelines.',
      switchedDiagnosis: false,
      firstDisplayedAt: nowIso,
      lastOpenedAt: nowIso,
      submittedAt: nowIso,
      activeSeconds: 0,
      wallClockSeconds: 0,
      completedAt: nowIso
    }));
    const postRecords: VignetteAnswerRecord[] = postAiCases.map(c => ({
      id: `post-${p.id}-${c.id}`,
      participantId: p.id,
      caseId: c.id,
      stage: 'post_ai',
      isDemo: true,
      mostLikelyDiagnosis: c.mcqOptions[0] || 'Other',
      differential1: 'Alternative acute etiology',
      differential2: 'Secondary systemic condition',
      redFlags: 'Critical clinical danger indicators',
      nextStep: 'Immediate targeted management and diagnostic confirmation',
      confidence: 4,
      firstDisplayedAt: nowIso,
      lastOpenedAt: nowIso,
      activeSeconds: 0,
      wallClockSeconds: 0,
      submittedAt: nowIso
    }));

    setEligibilityConfirmed(true);
    setConsentConfirmed(true);
    setCurrentParticipant(p);
    setRestoredQuestionnaire(sampleQ);
    setRestoredAiInteractions(simRecords);
    setRestoredVignetteAnswers(postRecords);

    researchStore.saveParticipant(p);
    researchStore.saveQuestionnaire(sampleQ);
    simRecords.forEach(r => researchStore.saveAiInteraction(r));
    postRecords.forEach(a => researchStore.saveVignetteAnswer(a));

    setStage(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 1 -> 2 (Welcome -> Eligibility)
  const handleBegin = () => {
    setStageError(null);
    setStage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 2 -> 3 (Eligibility -> Consent)
  const handleConfirmEligible = () => {
    setStageError(null);
    setEligibilityConfirmed(true);
    setStage(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 3 -> 4 (Consent -> Survey)
  const handleConsent = () => {
    setStageError(null);
    setConsentConfirmed(true);
    setStage(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 4 -> 5 (Survey -> CDSS)
  const handleQuestionnaireSubmit = async (
    response: QuestionnaireResponse,
    updatedParticipant?: Participant
  ) => {
    setStageError(null);

    if (isDemoMode) {
      const nowIso = new Date().toISOString();
      const baseParticipant: Participant =
        updatedParticipant ||
        currentParticipant || {
          id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          code: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
          designation: response.designation,
          designationOther: response.designationOther,
          specialty: response.specialty,
          specialtyOther: response.specialtyOther,
          yearsSinceMbbsBracket: response.yearsSinceMbbsBracket,
          institutionType: response.hospitalType,
          institutionOther: response.hospitalTypeOther,
          formalGenAiTraining: response.formalGenAiTraining,
          consentGiven: true,
          isDemo: true,
          recruitmentSource: 'direct',
          recruitedBy: null,
          researcherCode: null,
          createdAt: nowIso,
          completed: false,
          currentStage: 5
        };

      const updated: Participant = {
        ...baseParticipant,
        designation: response.designation,
        designationOther: response.designationOther,
        specialty: response.specialty,
        specialtyOther: response.specialtyOther,
        yearsSinceMbbsBracket: response.yearsSinceMbbsBracket,
        institutionType: response.hospitalType,
        institutionOther: response.hospitalTypeOther,
        formalGenAiTraining: response.formalGenAiTraining,
        completed: baseParticipant.completed || false,
        currentStage: Math.max(5, baseParticipant.currentStage || 5)
      };
      const savedDemoQ: QuestionnaireResponse = {
        ...response,
        participantId: updated.id
      };
      setCurrentParticipant(updated);
      setRestoredQuestionnaire(savedDemoQ);
      researchStore.saveParticipant(updated);
      researchStore.saveQuestionnaire(savedDemoQ);
      setStage(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmittingStage(true);
    try {
      let activeParticipant = currentParticipant;
      if (!activeParticipant) {
        const validReferralToken =
          referralToken && referralValidation?.isValid ? referralToken : null;
        activeParticipant = await researchStore.enrollLiveParticipant({
          designation: response.designation,
          designationOther: response.designationOther,
          specialty: response.specialty,
          specialtyOther: response.specialtyOther,
          yearsSinceMbbsBracket: response.yearsSinceMbbsBracket,
          institutionType: response.hospitalType,
          institutionOther: response.hospitalTypeOther,
          formalGenAiTraining: response.formalGenAiTraining,
          consentGiven: true,
          referralToken: validReferralToken
        });
        setCurrentParticipant(activeParticipant);
        void researchStore
          .logLiveEvent({
            participantId: activeParticipant.id,
            eventType: 'stage_entered',
            stage: 4,
            clientTimestamp: new Date().toISOString()
          })
          .catch(() => undefined);
      }

      const savedQ = await researchStore.submitLiveQuestionnaire({
        participantId: activeParticipant.id,
        designation: response.designation,
        designationOther: response.designationOther,
        specialty: response.specialty,
        specialtyOther: response.specialtyOther,
        yearsSinceMbbsBracket: response.yearsSinceMbbsBracket,
        hospitalType: response.hospitalType,
        hospitalTypeOther: response.hospitalTypeOther,
        formalGenAiTraining: response.formalGenAiTraining,
        usedGenAiLast3Months: response.usedGenAiLast3Months,
        firstUseDuration: response.firstUseDuration,
        usageFrequency: response.usageFrequency,
        dailyTimeSpent: response.dailyTimeSpent,
        toolsUsed: response.toolsUsed,
        medicalSpecificToolName: response.medicalSpecificToolName,
        otherToolName: response.otherToolName,
        accessMethod: response.accessMethod,
        enteredPatientInfo: response.enteredPatientInfo,
        taskFrequency: response.taskFrequency,
        reasoningConsultationStage: response.reasoningConsultationStage,
        last10CasesConsultedCount: response.last10CasesConsultedCount,
        verificationFrequency: response.verificationFrequency,
        institutionalPolicy: response.institutionalPolicy
      });
      setRestoredQuestionnaire(savedQ);

      const refreshed = await researchStore.refreshLiveParticipant(activeParticipant.id);
      if (refreshed) {
        setCurrentParticipant(refreshed);
      } else {
        setCurrentParticipant(prev => (prev ? { ...prev, currentStage: 5 } : prev));
      }

      setStage(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void researchStore
        .logLiveEvent({
          participantId: activeParticipant.id,
          eventType: 'stage_entered',
          stage: 5,
          payload: { targetStage: 5 },
          clientTimestamp: new Date().toISOString()
        })
        .catch(() => undefined);
    } catch (err) {
      setStageError(
        err instanceof Error ? err.message : 'Unable to save questionnaire response.'
      );
    } finally {
      setIsSubmittingStage(false);
    }
  };

  // UI Step 5 -> 6 (CDSS -> Post-AI Vignettes)
  const handleAiSimulationComplete = async (records: AiInteractionRecord[]) => {
    setStageError(null);

    if (isDemoMode) {
      setRestoredAiInteractions(records);
      records.forEach(r => researchStore.saveAiInteraction(r));
      if (currentParticipant) {
        const updated = {
          ...currentParticipant,
          completed: currentParticipant.completed || false,
          currentStage: Math.max(6, currentParticipant.currentStage || 6)
        };
        setCurrentParticipant(updated);
        researchStore.saveParticipant(updated);
      }
      setStage(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const hasSurvey = Boolean(
      currentParticipant &&
        (restoredQuestionnaire ||
          currentParticipant.questionnaireCompletedAt ||
          currentParticipant.currentStage >= 5 ||
          currentParticipant.completed)
    );
    if (!currentParticipant || !hasSurvey) {
      setStage(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const alreadyPastCdss = currentParticipant.completed || currentParticipant.currentStage >= 6;
    if (!alreadyPastCdss) {
      await researchStore.completeLiveCdssStage(currentParticipant.id);
      const refreshed = await researchStore.refreshLiveParticipant(currentParticipant.id);
      if (refreshed) setCurrentParticipant(refreshed);
      logEventSafely('stage_entered', undefined, { targetStage: 6 });
    }
    setStage(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 6 -> 7 (Post-AI Vignettes -> Debriefing)
  const handlePostAiComplete = async (answers: VignetteAnswerRecord[]) => {
    setStageError(null);

    if (isDemoMode) {
      setRestoredVignetteAnswers(answers);
      answers.forEach(a => researchStore.saveVignetteAnswer(a));
      if (currentParticipant) {
        const updated = { ...currentParticipant, currentStage: 7, completed: true };
        setCurrentParticipant(updated);
        researchStore.saveParticipant(updated);
      }
      setStage(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const hasCdss = Boolean(
      currentParticipant &&
        (currentParticipant.cdssCompletedAt ||
          currentParticipant.currentStage >= 6 ||
          currentParticipant.completed)
    );
    if (!currentParticipant || !hasCdss) {
      setStage(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!currentParticipant.completed) {
      await researchStore.completeLiveVignetteStage(currentParticipant.id);
      const refreshed = await researchStore.refreshLiveParticipant(currentParticipant.id);
      if (refreshed) {
        setCurrentParticipant(refreshed);
      } else {
        setCurrentParticipant(prev => (prev ? { ...prev, completed: true, currentStage: 7 } : prev));
      }
      logEventSafely('stage_entered', undefined, { targetStage: 7 });

      // End the anonymous participant session immediately upon study completion
      try {
        await researchStore.resetLiveParticipantSession();
      } catch {
        // Proceed cleanly to debriefing confirmation
      }
      try {
        sessionStorage.removeItem(REFERRAL_SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SUPERVISED_SESSION_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }

    setStage(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishAndReturnToLogin = async () => {
    setStageError(null);
    if (!isDemoMode && researchStore.isLiveSupabaseAvailable()) {
      try {
        await researchStore.resetLiveParticipantSession();
      } catch {
        // Ignore signout errors when clearing UI
      }
      try {
        sessionStorage.removeItem(REFERRAL_SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SUPERVISED_SESSION_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      setReferralToken(null);
      setReferralValidation(null);
    }
    setEligibilityConfirmed(false);
    setConsentConfirmed(false);
    setCurrentParticipant(null);
    setRestoredQuestionnaire(null);
    setRestoredAiInteractions([]);
    setRestoredFollowupEvents([]);
    setRestoredVignetteAnswers([]);
    setStage(1);
    onCompleteReturnToLogin?.();
  };

  const stepLabels = [
    'Welcome',
    'Eligibility',
    'Consent',
    'Survey',
    'CDSS',
    'Vignettes',
    'Debriefing'
  ];

  if (!isDemoMode && !researchStore.isLiveSupabaseAvailable()) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-14 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-lg border border-slate-200 p-8 shadow-2xs space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-amber-700 font-bold">
            Study Session Unavailable
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Platform Configuration Incomplete
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {researchStore.getSupabaseConfigError() ||
              'This study session cannot connect right now because platform configuration is incomplete. Please notify your supervising researcher or study coordinator.'}
          </p>
          {onToggleDemoMode && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onToggleDemoMode(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
              >
                Switch to Demo Cohort Mode
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isDemoMode && (isRestoringSession || casesLoading)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-lg px-6 py-5 text-xs font-mono text-slate-700 shadow-2xs">
          Connecting to Clinical AI Reasoning Lab study session...
        </div>
      </div>
    );
  }

  if (!isDemoMode && casesError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-14 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-lg border border-rose-200 p-8 shadow-2xs space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-rose-700 font-bold">
            Live Study Cases Unavailable
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Unable to Load Published Cases
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">{casesError}</p>
          {onToggleDemoMode && (
            <button
              type="button"
              onClick={() => onToggleDemoMode(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
            >
              Switch to Demo Cohort Mode
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/70 pb-16">
      {isDemoMode && (
        <PrototypeDemoBar
          currentStage={stage}
          onJumpToStage={handleJumpToStage}
          onQuickFillStep={handleQuickFillCurrentStep}
          onLoadCompleteSession={handleLoadCompleteSession}
          onResetSession={() => void handleFinishAndReturnToLogin()}
          participant={currentParticipant}
        />
      )}

      {/* Top 7-Stage Progress Ribbon */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1.5 overflow-x-auto">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stage > stepNum;
            const isCurrent = stage === stepNum;
            const isClickable = true;

            return (
              <button
                key={label}
                type="button"
                disabled={!isClickable}
                title={`Jump to Stage ${stepNum}: ${label}`}
                onClick={() => handleJumpToStage(stepNum)}
                className={`flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 px-2 py-1 rounded transition-colors ${
                  isClickable ? 'cursor-pointer' : 'cursor-default opacity-65'
                } ${
                  isCurrent
                    ? 'text-teal-800 font-bold bg-teal-50 border border-teal-200'
                    : isCompleted
                    ? 'text-emerald-700 font-medium hover:bg-slate-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stepNum}
                </div>
                <span className="hidden md:inline">{label}</span>
                {idx < stepLabels.length - 1 && (
                  <span className="text-slate-300 mx-0.5 hidden xl:inline">/</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!isDemoMode && stageError && stage !== 4 && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {stageError}
          </div>
        </div>
      )}

      <main>
        {stage === 1 && (
          <Stage1Welcome
            onBegin={handleBegin}
            institutionName={settings.institutionName}
            protocolNumber={settings.protocolNumber}
          />
        )}

        {stage === 2 && (
          <Stage2Eligibility
            onConfirmEligible={handleConfirmEligible}
            onBack={() => setStage(1)}
            isDemoMode={isDemoMode}
            initialConfirmed={eligibilityConfirmed || Boolean(currentParticipant)}
          />
        )}

        {stage === 3 && (
          <Stage2Consent
            onConsent={handleConsent}
            onBack={() => setStage(2)}
            protocolNumber={settings.protocolNumber}
            isDemoMode={isDemoMode}
            initialConsented={consentConfirmed || Boolean(currentParticipant)}
          />
        )}

        {stage === 4 && (
          <Stage4Questionnaire
            participant={currentParticipant}
            existingResponse={restoredQuestionnaire}
            onSubmit={handleQuestionnaireSubmit}
            onContinueNext={() => {
              setStage(5);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => setStage(3)}
            isDemoMode={isDemoMode}
            isSubmitting={isSubmittingStage}
            errorMessage={stageError}
            referralToken={referralToken}
            referralValidation={referralValidation}
          />
        )}

        {stage === 5 && (() => {
          const canSubmitCdss =
            isDemoMode ||
            Boolean(currentParticipant && (restoredQuestionnaire || currentParticipant.questionnaireCompletedAt || currentParticipant.currentStage >= 5 || currentParticipant.completed));
          const displayParticipant: Participant = currentParticipant || {
            id: 'preview-pending',
            code: 'PENDING',
            designation: 'Junior Resident',
            specialty: 'General Medicine',
            yearsSinceMbbsBracket: '1–5 years',
            institutionType: 'Teaching hospital',
            formalGenAiTraining: false,
            consentGiven: consentConfirmed,
            isDemo: isDemoMode,
            recruitmentSource: 'direct',
            recruitedBy: null,
            researcherCode: null,
            createdAt: new Date().toISOString(),
            completed: false,
            currentStage: 5
          };

          return (
            <>
              {!canSubmitCdss && (
                <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6">
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
                    <span>
                      <strong>Open-Jump Preview:</strong> Complete Stage 4 (Survey) first to generate your Study ID and submit CDSS case evaluations.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleJumpToStage(4)}
                      className="px-3 py-1.5 rounded bg-amber-900 text-white font-semibold hover:bg-amber-800 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      Go to Stage 4 (Survey)
                    </button>
                  </div>
                </div>
              )}
              <Stage6AiSimulation
                key={canSubmitCdss ? 'live-cdss' : 'preview-cdss'}
                cases={simCases}
                participant={displayParticipant}
                isDemoMode={isDemoMode}
                isPreviewOnly={!canSubmitCdss}
                initialRecords={canSubmitCdss ? restoredAiInteractions : []}
                initialFollowupEvents={canSubmitCdss ? restoredFollowupEvents : []}
                onOpenCase={
                  isDemoMode || !currentParticipant || !canSubmitCdss
                    ? undefined
                    : (caseId) => researchStore.openLiveCaseSession(currentParticipant.id, caseId).then(() => undefined)
                }
                onHeartbeatTimer={
                  isDemoMode || !currentParticipant || !canSubmitCdss
                    ? undefined
                    : (caseId, deltaSeconds) =>
                        researchStore
                          .heartbeatLiveCaseTimer(currentParticipant.id, caseId, deltaSeconds)
                          .then(() => undefined)
                }
                onLogFollowup={
                  isDemoMode || !currentParticipant || !canSubmitCdss
                    ? undefined
                    : async (caseId, suggestionId) => {
                        const eventId = await researchStore.logLiveCdssFollowup(
                          currentParticipant.id,
                          caseId,
                          suggestionId
                        );
                        const matchedCase = simCases.find(c => c.id === caseId);
                        const stimulus = matchedCase?.aiStimulus;
                        const fallbackPrompt =
                          suggestionId === 'followup_1'
                            ? 'Explain key diagnostic reasoning'
                            : 'Summarize immediate management plan';
                        const fallbackResponse =
                          suggestionId === 'followup_1'
                            ? stimulus?.clinicalReasoning || ''
                            : stimulus?.recommendation || '';
                        const suggestion = stimulus?.followUpSuggestions?.find(
                          s => s.id === suggestionId
                        );
                        const newEvent: CdssFollowupEvent = {
                          id: eventId || `followup-${caseId}-${suggestionId}`,
                          participantId: currentParticipant.id,
                          caseId,
                          suggestionId,
                          promptLabel: suggestion?.promptLabel || fallbackPrompt,
                          responseText: suggestion?.responseText || fallbackResponse,
                          clickedAt: new Date().toISOString()
                        };
                        setRestoredFollowupEvents(prev =>
                          prev.some(ev => ev.caseId === caseId && ev.suggestionId === suggestionId)
                            ? prev
                            : [...prev, newEvent]
                        );
                      }
                }
                onSubmitCase={
                  isDemoMode
                    ? undefined
                    : async (input) => {
                        if (!currentParticipant || !canSubmitCdss) {
                          throw new Error('Please submit Stage 4 (Survey) first before recording CDSS case evaluations.');
                        }
                        const saved = await researchStore.submitLiveAiInteraction(input);
                        setRestoredAiInteractions(prev => [
                          ...prev.filter(r => r.caseId !== saved.caseId),
                          saved
                        ]);
                        return saved;
                      }
                }
                onComplete={handleAiSimulationComplete}
                onLogEvent={logEventSafely}
              />
            </>
          );
        })()}

        {stage === 6 && (() => {
          const canSubmitVignettes =
            isDemoMode ||
            Boolean(currentParticipant && (currentParticipant.cdssCompletedAt || currentParticipant.currentStage >= 6 || currentParticipant.completed));
          const displayParticipant: Participant = currentParticipant || {
            id: 'preview-pending',
            code: 'PENDING',
            designation: 'Junior Resident',
            specialty: 'General Medicine',
            yearsSinceMbbsBracket: '1–5 years',
            institutionType: 'Teaching hospital',
            formalGenAiTraining: false,
            consentGiven: consentConfirmed,
            isDemo: isDemoMode,
            recruitmentSource: 'direct',
            recruitedBy: null,
            researcherCode: null,
            createdAt: new Date().toISOString(),
            completed: false,
            currentStage: 6
          };

          return (
            <>
              {!canSubmitVignettes && (
                <div className="max-w-4xl mx-auto pt-6 px-4 sm:px-6">
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
                    <span>
                      <strong>Open-Jump Preview:</strong>{' '}
                      {!currentParticipant
                        ? 'Complete Stage 4 (Survey) and Stage 5 (CDSS) before submitting Vignette responses.'
                        : 'Complete all 5 CDSS cases in Stage 5 before submitting Vignette responses.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleJumpToStage(!currentParticipant ? 4 : 5)}
                      className="px-3 py-1.5 rounded bg-amber-900 text-white font-semibold hover:bg-amber-800 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      {!currentParticipant ? 'Go to Stage 4 (Survey)' : 'Go to Stage 5 (CDSS)'}
                    </button>
                  </div>
                </div>
              )}
              <Stage7PostAiAssessment
                key={canSubmitVignettes ? 'live-vignettes' : 'preview-vignettes'}
                cases={postAiCases}
                participant={displayParticipant}
                isDemoMode={isDemoMode}
                isPreviewOnly={!canSubmitVignettes}
                initialAnswers={canSubmitVignettes ? restoredVignetteAnswers : []}
                onOpenCase={
                  isDemoMode || !currentParticipant || !canSubmitVignettes
                    ? undefined
                    : (caseId) => researchStore.openLiveCaseSession(currentParticipant.id, caseId).then(() => undefined)
                }
                onHeartbeatTimer={
                  isDemoMode || !currentParticipant || !canSubmitVignettes
                    ? undefined
                    : (caseId, deltaSeconds) =>
                        researchStore
                          .heartbeatLiveCaseTimer(currentParticipant.id, caseId, deltaSeconds)
                          .then(() => undefined)
                }
                onSubmitCase={
                  isDemoMode
                    ? undefined
                    : async (input) => {
                        if (!currentParticipant || !canSubmitVignettes) {
                          throw new Error(
                            !currentParticipant
                              ? 'Please submit Stage 4 (Survey) and Stage 5 (CDSS) first before recording Vignette answers.'
                              : 'Please complete all 5 CDSS cases in Stage 5 before submitting Vignette answers.'
                          );
                        }
                        const saved = await researchStore.submitLiveVignetteAnswer(input);
                        setRestoredVignetteAnswers(prev => [
                          ...prev.filter(r => r.caseId !== saved.caseId),
                          saved
                        ]);
                        return saved;
                      }
                }
                onComplete={handlePostAiComplete}
                onLogEvent={logEventSafely}
              />
            </>
          );
        })()}

        {stage === 7 && (
          <Stage8Debriefing
            participant={
              currentParticipant || {
                id: 'preview-pending',
                code: 'PENDING',
                designation: 'Junior Resident',
                specialty: 'General Medicine',
                yearsSinceMbbsBracket: '1–5 years',
                institutionType: 'Teaching hospital',
                formalGenAiTraining: false,
                consentGiven: consentConfirmed,
                isDemo: isDemoMode,
                recruitmentSource: 'direct',
                recruitedBy: null,
                researcherCode: null,
                createdAt: new Date().toISOString(),
                completed: false,
                currentStage: 7
              }
            }
            onRepeatStudyFlow={() => {
              setStage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onCompleteReturnToLogin={() => void handleFinishAndReturnToLogin()}
            protocolNumber={settings.protocolNumber}
          />
        )}
      </main>
    </div>
  );
};
