import React, { useState, useEffect } from 'react';
import { Check, Lock } from 'lucide-react';
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
import { buildDisplayedCdssOptions } from '../../utils/cdssOptions';
import { Stage1Welcome } from './Stage1Welcome';
import { Stage2Eligibility } from './Stage2Eligibility';
import { Stage2Consent } from './Stage2Consent';
import { Stage4Questionnaire, RegistrationProfileDraft } from './Stage4Questionnaire';
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
 * Maps database participants.current_stage (4..7) into the 8-step Participant UI flow:
 * DB 4 (enrolled / survey pending) -> UI 5 (Questionnaire)
 * DB 5 (survey done) -> UI 6 (5 CDSS cases)
 * DB 6 (cdss done) -> UI 7 (6 Unaided Clinical Vignettes)
 * DB 7 / completed -> UI 8 (Debriefing)
 */
function dbStageToUiStep(dbStage: number | undefined, completed: boolean): number {
  if (completed || (dbStage !== undefined && dbStage >= 7)) return 8;
  if (dbStage === 6) return 7;
  if (dbStage === 5) return 6;
  return 5;
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
  const [registrationConfirmed, setRegistrationConfirmed] = useState<boolean>(false);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationProfileDraft | null>(null);

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
      setRegistrationConfirmed(false);
      setRegistrationDraft(null);
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
          const p = snapshot.participant;
          setEligibilityConfirmed(true);
          setConsentConfirmed(true);
          setRegistrationConfirmed(true);
          setRegistrationDraft({
            designation: p.designation,
            designationOther: p.designationOther || '',
            specialty: p.specialty,
            specialtyOther: p.specialtyOther || '',
            yearsSinceMbbsBracket: p.yearsSinceMbbsBracket,
            hospitalType: p.institutionType,
            hospitalTypeOther: p.institutionOther || '',
            formalGenAiTraining: p.formalGenAiTraining
          });
          setCurrentParticipant(p);
          setRestoredQuestionnaire(snapshot.questionnaire);
          setRestoredAiInteractions(snapshot.aiInteractions);
          setRestoredFollowupEvents(snapshot.followupEvents);
          setRestoredVignetteAnswers(snapshot.vignetteAnswers);
          setStage(dbStageToUiStep(p.currentStage, p.completed));
        } else {
          setEligibilityConfirmed(false);
          setConsentConfirmed(false);
          setRegistrationConfirmed(false);
          setRegistrationDraft(null);
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
    // DB telemetry constraint requires stage BETWEEN 1 AND 7
    const dbStage = stage >= 8 ? 7 : stage >= 6 ? stage - 1 : Math.max(1, Math.min(4, stage));
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

  // --- STEP COMPLETION & PREREQUISITE ACCESS LOGIC (8 STEPS) ---
  const isStep1Done = stage > 1 || eligibilityConfirmed || Boolean(currentParticipant);
  const isStep2Done = eligibilityConfirmed || Boolean(currentParticipant);
  const isStep3Done = consentConfirmed || Boolean(currentParticipant);
  const isStep4Done =
    registrationConfirmed || Boolean(restoredQuestionnaire) || Boolean(currentParticipant);
  const isStep5Done = Boolean(
    restoredQuestionnaire ||
      currentParticipant?.questionnaireCompletedAt ||
      (currentParticipant?.currentStage ?? 0) >= 5 ||
      currentParticipant?.completed
  );
  const isStep6Done = Boolean(
    currentParticipant &&
      ((simCases.length > 0 && restoredAiInteractions.length >= simCases.length) ||
        currentParticipant.cdssCompletedAt ||
        currentParticipant.currentStage >= 6 ||
        currentParticipant.completed)
  );
  const isStep7Done = Boolean(
    isStep5Done &&
      isStep6Done &&
      currentParticipant &&
      ((postAiCases.length > 0 && restoredVignetteAnswers.length >= postAiCases.length) ||
        currentParticipant.vignettesCompletedAt ||
        currentParticipant.completed)
  );
  const isStep8Done = Boolean(isStep7Done && currentParticipant?.completed);

  const stepCompletedMap: Record<number, boolean> = {
    1: isStep1Done,
    2: isStep2Done,
    3: isStep3Done,
    4: isStep4Done,
    5: isStep5Done,
    6: isStep6Done,
    7: isStep7Done,
    8: isStep8Done
  };

  const canAccessStep = (targetStep: number): boolean => {
    if (targetStep === 1 || targetStep === 2) return true;
    if (targetStep === 3) return isStep2Done;
    if (targetStep === 4) return isStep3Done;
    if (targetStep === 5) return isStep4Done;
    if (targetStep === 6) return isStep5Done;
    if (targetStep === 7) return isStep6Done;
    if (targetStep === 8) return isStep7Done;
    return false;
  };

  const maxAccessibleStage = !isStep2Done
    ? 2
    : !isStep3Done
    ? 3
    : !isStep4Done
    ? 4
    : !isStep5Done
    ? 5
    : !isStep6Done
    ? 6
    : !isStep7Done
    ? 7
    : 8;

  const ensureDemoParticipant = (draftOverride?: RegistrationProfileDraft | null): Participant => {
    const activeDraft = draftOverride ?? registrationDraft;
    if (currentParticipant && currentParticipant.isDemo) {
      if (activeDraft) {
        const synced: Participant = {
          ...currentParticipant,
          designation: activeDraft.designation,
          designationOther: activeDraft.designationOther || undefined,
          specialty: activeDraft.specialty,
          specialtyOther: activeDraft.specialtyOther || undefined,
          yearsSinceMbbsBracket: activeDraft.yearsSinceMbbsBracket,
          institutionType: activeDraft.hospitalType,
          institutionOther: activeDraft.hospitalTypeOther || undefined,
          formalGenAiTraining: activeDraft.formalGenAiTraining
        };
        setCurrentParticipant(synced);
        researchStore.saveParticipant(synced);
        return synced;
      }
      return currentParticipant;
    }

    const nowIso = new Date().toISOString();
    const p: Participant = {
      id: `part-demo-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 8000)}`,
      designation: activeDraft?.designation || 'Junior Resident',
      designationOther: activeDraft?.designationOther || undefined,
      specialty: activeDraft?.specialty || 'General Medicine',
      specialtyOther: activeDraft?.specialtyOther || undefined,
      yearsSinceMbbsBracket: activeDraft?.yearsSinceMbbsBracket || '1–5 years',
      institutionType: activeDraft?.hospitalType || 'Teaching hospital',
      institutionOther: activeDraft?.hospitalTypeOther || undefined,
      formalGenAiTraining: activeDraft?.formalGenAiTraining ?? false,
      consentGiven: true,
      isDemo: true,
      recruitmentSource: 'direct',
      recruitedBy: null,
      researcherCode: null,
      createdAt: nowIso,
      completed: false,
      currentStage: 4
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
      const sampleDraft: RegistrationProfileDraft = {
        designation: 'Junior Resident',
        designationOther: '',
        specialty: 'General Medicine',
        specialtyOther: '',
        yearsSinceMbbsBracket: '1–5 years',
        hospitalType: 'Teaching hospital',
        hospitalTypeOther: '',
        formalGenAiTraining: false
      };
      handleConfirmRegistration(sampleDraft);
    } else if (stage === 5) {
      const p = ensureDemoParticipant();
      void handleQuestionnaireSubmit(buildSampleQuestionnaire(p), p);
    } else if (stage === 6) {
      if (restoredAiInteractions.length >= simCases.length && simCases.length > 0) {
        void handleAiSimulationComplete(restoredAiInteractions);
        return;
      }
      const p = ensureDemoParticipant();
      const nowIso = new Date().toISOString();
      const simRecords: AiInteractionRecord[] = simCases.map(c => {
        const existing = restoredAiInteractions.find(r => r.caseId === c.id);
        if (existing) return existing;
        const displayedOrder = buildDisplayedCdssOptions(p.id, c.id, c.mcqOptions);
        const chosenOpt = displayedOrder[0];
        return {
          id: `ai-sim-${p.id}-${c.id}`,
          participantId: p.id,
          caseId: c.id,
          isDemo: true,
          aiAgreement: 'Uncertain; requires verification',
          finalDiagnosis: chosenOpt?.text || c.mcqOptions[0] || 'Other',
          selectedOptionId: chosenOpt?.optionId || 'opt_1',
          displayedOptionOrder: displayedOrder,
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
    } else if (stage === 7) {
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
    if (!canAccessStep(targetStage)) {
      setStageError(
        `Stage ${targetStage} is currently locked. Please complete all preceding study stages sequentially first.`
      );
      return;
    }
    setStageError(null);
    setStage(targetStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadCompleteSession = () => {
    if (!isDemoMode) return;
    const nowIso = new Date().toISOString();
    const demoDraft: RegistrationProfileDraft = {
      designation: 'Junior Resident',
      designationOther: '',
      specialty: 'General Medicine',
      specialtyOther: '',
      yearsSinceMbbsBracket: '1–5 years',
      hospitalType: 'Teaching hospital',
      hospitalTypeOther: '',
      formalGenAiTraining: false
    };
    const p: Participant = {
      id: `part-complete-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 7999)}`,
      designation: demoDraft.designation,
      specialty: demoDraft.specialty,
      yearsSinceMbbsBracket: demoDraft.yearsSinceMbbsBracket,
      institutionType: demoDraft.hospitalType,
      formalGenAiTraining: demoDraft.formalGenAiTraining,
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
    const simRecords: AiInteractionRecord[] = simCases.map(c => {
      const displayedOrder = buildDisplayedCdssOptions(p.id, c.id, c.mcqOptions);
      const chosenOpt = displayedOrder[0];
      return {
        id: `ai-sim-${p.id}-${c.id}`,
        participantId: p.id,
        caseId: c.id,
        isDemo: true,
        aiAgreement: 'Uncertain; requires verification',
        finalDiagnosis: chosenOpt?.text || c.mcqOptions[0] || 'Other',
        selectedOptionId: chosenOpt?.optionId || 'opt_1',
        displayedOptionOrder: displayedOrder,
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
      };
    });
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
    setRegistrationConfirmed(true);
    setRegistrationDraft(demoDraft);
    setCurrentParticipant(p);
    setRestoredQuestionnaire(sampleQ);
    setRestoredAiInteractions(simRecords);
    setRestoredVignetteAnswers(postRecords);

    researchStore.saveParticipant(p);
    researchStore.saveQuestionnaire(sampleQ);
    simRecords.forEach(r => researchStore.saveAiInteraction(r));
    postRecords.forEach(a => researchStore.saveVignetteAnswer(a));

    setStage(8);
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

  // UI Step 3 -> 4 (Consent -> Registration / Section I Respondent Profile)
  const handleConsent = () => {
    setStageError(null);
    setConsentConfirmed(true);
    setStage(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 4 -> 5 (Registration Profile Q1-Q5 -> Questionnaire Q6-Q17)
  const handleConfirmRegistration = (draft: RegistrationProfileDraft) => {
    setStageError(null);
    setRegistrationDraft(draft);
    setRegistrationConfirmed(true);
    if (isDemoMode) {
      ensureDemoParticipant(draft);
    }
    setStage(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 5 -> 6 (Questionnaire -> CDSS)
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
      setRegistrationConfirmed(true);
      setRegistrationDraft({
        designation: response.designation,
        designationOther: response.designationOther || '',
        specialty: response.specialty,
        specialtyOther: response.specialtyOther || '',
        yearsSinceMbbsBracket: response.yearsSinceMbbsBracket,
        hospitalType: response.hospitalType,
        hospitalTypeOther: response.hospitalTypeOther || '',
        formalGenAiTraining: response.formalGenAiTraining
      });
      setCurrentParticipant(updated);
      setRestoredQuestionnaire(savedDemoQ);
      researchStore.saveParticipant(updated);
      researchStore.saveQuestionnaire(savedDemoQ);
      setStage(6);
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
      setRegistrationConfirmed(true);

      const refreshed = await researchStore.refreshLiveParticipant(activeParticipant.id);
      if (refreshed) {
        setCurrentParticipant(refreshed);
      } else {
        setCurrentParticipant(prev => (prev ? { ...prev, currentStage: 5 } : prev));
      }

      setStage(6);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      void researchStore
        .logLiveEvent({
          participantId: activeParticipant.id,
          eventType: 'stage_entered',
          stage: 5,
          payload: { targetStage: 6 },
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

  // UI Step 6 -> 7 (CDSS -> Unaided Clinical Vignettes)
  const handleAiSimulationComplete = async (records: AiInteractionRecord[]) => {
    setStageError(null);

    if (records.length < simCases.length) {
      setStageError('Please submit all 5 CDSS cases before continuing to Clinical Vignettes.');
      return;
    }

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
      setStage(7);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!currentParticipant || !isStep5Done) {
      setStageError('Please complete Stage 5 (Questionnaire) before proceeding.');
      return;
    }

    const alreadyPastCdss = currentParticipant.completed || currentParticipant.currentStage >= 6;
    if (!alreadyPastCdss) {
      await researchStore.completeLiveCdssStage(currentParticipant.id);
      const refreshed = await researchStore.refreshLiveParticipant(currentParticipant.id);
      if (refreshed) setCurrentParticipant(refreshed);
      logEventSafely('stage_entered', undefined, { targetStage: 7 });
    }
    setStage(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI Step 7 -> 8 (Unaided Clinical Vignettes -> Debriefing)
  const handlePostAiComplete = async (answers: VignetteAnswerRecord[]) => {
    setStageError(null);

    if (answers.length < postAiCases.length) {
      setStageError('Please submit all 6 clinical vignettes before proceeding to Debriefing.');
      return;
    }

    if (isDemoMode) {
      setRestoredVignetteAnswers(answers);
      answers.forEach(a => researchStore.saveVignetteAnswer(a));
      if (currentParticipant) {
        const updated = { ...currentParticipant, currentStage: 7, completed: true };
        setCurrentParticipant(updated);
        researchStore.saveParticipant(updated);
      }
      setStage(8);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!currentParticipant || !isStep6Done) {
      setStageError('Please complete all 5 CDSS cases in Stage 6 before proceeding to Debriefing.');
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
      logEventSafely('stage_entered', undefined, { targetStage: 8 });

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

    setStage(8);
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
    setRegistrationConfirmed(false);
    setRegistrationDraft(null);
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
    'Registration',
    'Questionnaire',
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
          maxAccessibleStage={maxAccessibleStage}
          onJumpToStage={handleJumpToStage}
          onQuickFillStep={handleQuickFillCurrentStep}
          onLoadCompleteSession={handleLoadCompleteSession}
          onResetSession={() => void handleFinishAndReturnToLogin()}
          participant={currentParticipant}
        />
      )}

      {/* Top 8-Stage Progress Ribbon with Distinct Completed / Current / Locked / Upcoming States */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 overflow-x-auto">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCurrent = stage === stepNum;
            const isUnlocked = canAccessStep(stepNum);
            const isCompleted = Boolean(stepCompletedMap[stepNum]) && !isCurrent;
            const isLocked = !isUnlocked;

            return (
              <button
                key={label}
                type="button"
                disabled={isLocked}
                title={
                  isLocked
                    ? `Complete earlier study steps to unlock Stage ${stepNum}: ${label}`
                    : `Stage ${stepNum}: ${label}`
                }
                onClick={() => handleJumpToStage(stepNum)}
                className={`flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isCurrent
                    ? 'text-teal-900 font-bold bg-teal-50 border-teal-300 shadow-2xs cursor-pointer'
                    : isCompleted
                    ? 'text-emerald-800 font-semibold bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 cursor-pointer'
                    : isLocked
                    ? 'text-slate-400 bg-slate-50 border-slate-200/70 cursor-not-allowed opacity-70'
                    : 'text-slate-700 font-medium bg-white border-slate-200 hover:text-slate-900 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-teal-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isLocked
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isLocked ? (
                    <Lock className="w-2.5 h-2.5" />
                  ) : (
                    stepNum
                  )}
                </div>
                <span className="hidden md:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {stageError && stage !== 4 && stage !== 5 && (
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
            key="stage-4-registration"
            activeSection="registration"
            participant={currentParticipant}
            existingResponse={restoredQuestionnaire}
            registrationDraft={registrationDraft}
            onConfirmRegistration={handleConfirmRegistration}
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

        {stage === 5 && (
          <Stage4Questionnaire
            key={`stage-5-questionnaire-${restoredQuestionnaire?.id || 'pending'}-${registrationConfirmed ? '1' : '0'}`}
            activeSection="questionnaire"
            participant={currentParticipant}
            existingResponse={restoredQuestionnaire}
            registrationDraft={registrationDraft}
            onSubmit={handleQuestionnaireSubmit}
            onContinueNext={() => {
              if (isStep5Done) {
                setStage(6);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onBack={() => setStage(4)}
            isDemoMode={isDemoMode}
            isSubmitting={isSubmittingStage}
            errorMessage={stageError}
            referralToken={referralToken}
            referralValidation={referralValidation}
          />
        )}

        {stage === 6 && currentParticipant && isStep5Done && (
          <Stage6AiSimulation
            key={`cdss-${currentParticipant.id}`}
            cases={simCases}
            participant={currentParticipant}
            isDemoMode={isDemoMode}
            initialRecords={restoredAiInteractions}
            initialFollowupEvents={restoredFollowupEvents}
            onOpenCase={
              isDemoMode
                ? undefined
                : (caseId, displayedOptionOrder) =>
                    researchStore
                      .openLiveCaseSession(currentParticipant.id, caseId, displayedOptionOrder)
                      .then(() => undefined)
            }
            onHeartbeatTimer={
              isDemoMode
                ? undefined
                : (caseId, deltaSeconds) =>
                    researchStore
                      .heartbeatLiveCaseTimer(currentParticipant.id, caseId, deltaSeconds)
                      .then(() => undefined)
            }
            onLogFollowup={
              isDemoMode
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
            onSubmitCase={async (input) => {
              if (isDemoMode) {
                const nowIso = new Date().toISOString();
                const demoRec: AiInteractionRecord = {
                  id: `ai-sim-${input.participantId}-${input.caseId}`,
                  participantId: input.participantId,
                  caseId: input.caseId,
                  isDemo: true,
                  aiAgreement: input.aiAgreement,
                  finalDiagnosis: input.finalDiagnosis,
                  selectedOptionId: input.selectedOptionId,
                  displayedOptionOrder: input.displayedOptionOrder,
                  reasonForDecision: input.reasonForDecision,
                  finalConfidence: input.finalConfidence,
                  willVerify: input.willVerify,
                  verificationTargets: input.verificationTargets,
                  switchedDiagnosis: input.switchedDiagnosis,
                  firstDisplayedAt: nowIso,
                  lastOpenedAt: nowIso,
                  submittedAt: nowIso,
                  completedAt: nowIso
                };
                researchStore.saveAiInteraction(demoRec);
                setRestoredAiInteractions(prev => [
                  ...prev.filter(r => r.caseId !== demoRec.caseId),
                  demoRec
                ]);
                return demoRec;
              }
              const saved = await researchStore.submitLiveAiInteraction(input);
              setRestoredAiInteractions(prev => [
                ...prev.filter(r => r.caseId !== saved.caseId),
                saved
              ]);
              return saved;
            }}
            onComplete={handleAiSimulationComplete}
            onLogEvent={logEventSafely}
          />
        )}

        {stage === 7 && currentParticipant && isStep6Done && (
          <Stage7PostAiAssessment
            key={`vignettes-${currentParticipant.id}`}
            cases={postAiCases}
            participant={currentParticipant}
            isDemoMode={isDemoMode}
            initialAnswers={restoredVignetteAnswers}
            onOpenCase={
              isDemoMode
                ? undefined
                : (caseId) =>
                    researchStore.openLiveCaseSession(currentParticipant.id, caseId).then(() => undefined)
            }
            onHeartbeatTimer={
              isDemoMode
                ? undefined
                : (caseId, deltaSeconds) =>
                    researchStore
                      .heartbeatLiveCaseTimer(currentParticipant.id, caseId, deltaSeconds)
                      .then(() => undefined)
            }
            onSubmitCase={async (input) => {
              if (isDemoMode) {
                const nowIso = new Date().toISOString();
                const demoAns: VignetteAnswerRecord = {
                  id: `post-${input.participantId}-${input.caseId}`,
                  participantId: input.participantId,
                  caseId: input.caseId,
                  stage: 'post_ai',
                  isDemo: true,
                  mostLikelyDiagnosis: input.mostLikelyDiagnosis,
                  differential1: input.differential1,
                  differential2: input.differential2,
                  redFlags: input.redFlags,
                  nextStep: input.nextStep,
                  confidence: input.confidence,
                  firstDisplayedAt: nowIso,
                  lastOpenedAt: nowIso,
                  submittedAt: nowIso
                };
                researchStore.saveVignetteAnswer(demoAns);
                setRestoredVignetteAnswers(prev => [
                  ...prev.filter(r => r.caseId !== demoAns.caseId),
                  demoAns
                ]);
                return demoAns;
              }
              const saved = await researchStore.submitLiveVignetteAnswer(input);
              setRestoredVignetteAnswers(prev => [
                ...prev.filter(r => r.caseId !== saved.caseId),
                saved
              ]);
              return saved;
            }}
            onComplete={handlePostAiComplete}
            onLogEvent={logEventSafely}
          />
        )}

        {stage === 8 && currentParticipant && isStep7Done && (
          <Stage8Debriefing
            participant={currentParticipant}
            institutionName={settings.institutionName}
            cdssCompletedCount={Math.max(
              restoredAiInteractions.length,
              currentParticipant.cdssCompletedAt || currentParticipant.completed ? simCases.length : 0
            )}
            cdssTotalCount={simCases.length || 5}
            vignettesCompletedCount={Math.max(
              restoredVignetteAnswers.length,
              currentParticipant.vignettesCompletedAt || currentParticipant.completed
                ? postAiCases.length
                : 0
            )}
            vignettesTotalCount={postAiCases.length || 6}
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
