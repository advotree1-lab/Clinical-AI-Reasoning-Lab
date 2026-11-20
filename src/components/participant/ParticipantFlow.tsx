import React, { useState } from 'react';
import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ClinicalCase,
  ResearchProtocolSettings
} from '../../types';
import { researchStore } from '../../services/researchStore';
import { Stage1Welcome } from './Stage1Welcome';
import { Stage2Consent } from './Stage2Consent';
import { Stage3Registration } from './Stage3Registration';
import { Stage4Questionnaire } from './Stage4Questionnaire';
import { Stage6AiSimulation } from './Stage6AiSimulation';
import { Stage7PostAiAssessment } from './Stage7PostAiAssessment';
import { Stage8Debriefing } from './Stage8Debriefing';
import { PrototypeDemoBar } from './PrototypeDemoBar';

interface ParticipantFlowProps {
  isDemoMode: boolean;
  settings: ResearchProtocolSettings;
  cases: ClinicalCase[];
  onOpenResearcherDashboard: () => void;
}

export const ParticipantFlow: React.FC<ParticipantFlowProps> = ({
  isDemoMode,
  settings,
  cases,
  onOpenResearcherDashboard
}) => {
  const [stage, setStage] = useState<number>(1);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);

  const simCases = cases.filter(c => c.stage === 'ai_simulation');
  const postAiCases = cases.filter(c => c.stage === 'post_ai');

  // Helper to ensure a valid participant exists for jumping
  const ensureParticipant = (): Participant => {
    if (currentParticipant) return currentParticipant;
    const p: Participant = {
      id: `part-demo-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 8000)}`,
      designation: 'Junior Resident',
      specialty: 'General Medicine',
      yearsSinceMbbsBracket: '1–5 years',
      institutionType: 'Teaching hospital',
      formalGenAiTraining: false,
      consentGiven: true,
      isDemo: isDemoMode,
      createdAt: new Date().toISOString(),
      completed: false,
      currentStage: stage
    };
    setCurrentParticipant(p);
    researchStore.saveParticipant(p);
    return p;
  };

  const buildSampleQuestionnaire = (p: Participant): QuestionnaireResponse => ({
    id: `q-quick-${p.id}`,
    participantId: p.id,
    isDemo: isDemoMode,
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

  // Quick-Fill the Current Step
  const handleQuickFillCurrentStep = () => {
    if (stage === 1) {
      handleBegin();
    } else if (stage === 2) {
      handleConsent();
    } else if (stage === 3) {
      const p = ensureParticipant();
      handleRegister(p);
    } else if (stage === 4) {
      const p = ensureParticipant();
      handleQuestionnaireSubmit(buildSampleQuestionnaire(p), p);
    } else if (stage === 5) {
      const p = ensureParticipant();
      const simRecords: AiInteractionRecord[] = simCases.map(c => {
        const isMisleading = c.aiStimulus?.isMisleading;
        return {
          id: `ai-sim-${p.id}-${c.id}`,
          participantId: p.id,
          caseId: c.id,
          isDemo: isDemoMode,
          initialDiagnosis: c.goldStandardDiagnosis,
          initialJustification: 'Formulated diagnosis based on acute history, vitals, and diagnostic findings.',
          initialConfidence: 4,
          initialSubmittedAt: new Date().toISOString(),
          aiAgreement: isMisleading ? 'Uncertain; requires verification' : 'Completely agree',
          finalDiagnosis: c.goldStandardDiagnosis,
          reasonForDecision: isMisleading
            ? 'Recognized inconsistency between AI advice and patient contraindications/findings.'
            : 'AI recommendation aligns with standard clinical practice guidelines.',
          finalConfidence: 4,
          willVerify: true,
          verificationTargets: 'Check clinical practice guidelines and obtain confirmatory testing.',
          switchedDiagnosis: false,
          switchedTowardsCorrect: false,
          acceptedMisleading: false,
          timeSpentSeconds: 120,
          completedAt: new Date().toISOString()
        };
      });
      handleAiSimulationComplete(simRecords);
    } else if (stage === 6) {
      const p = ensureParticipant();
      const postRecords: VignetteAnswerRecord[] = postAiCases.map(c => ({
        id: `post-${p.id}-${c.id}`,
        participantId: p.id,
        caseId: c.id,
        stage: 'post_ai',
        isDemo: isDemoMode,
        mostLikelyDiagnosis: c.goldStandardDiagnosis,
        differential1: c.differentialDiagnosisKeys[0] || 'Competing Differential 1',
        differential2: c.differentialDiagnosisKeys[1] || 'Competing Differential 2',
        redFlags: c.redFlagKeys[0] || 'Critical clinical indicators',
        nextStep: c.nextManagementStepKey,
        confidence: 4,
        submittedAt: new Date().toISOString()
      }));
      handlePostAiComplete(postRecords);
    }
  };

  // Jump directly to any stage
  const handleJumpToStage = (targetStage: number) => {
    ensureParticipant();
    setStage(targetStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load a complete pre-filled session
  const handleLoadCompleteSession = () => {
    const p: Participant = {
      id: `part-complete-${Date.now()}`,
      code: `DOC-${Math.floor(2000 + Math.random() * 7999)}`,
      designation: 'Junior Resident',
      specialty: 'General Medicine',
      yearsSinceMbbsBracket: '1–5 years',
      institutionType: 'Teaching hospital',
      formalGenAiTraining: false,
      consentGiven: true,
      isDemo: isDemoMode,
      createdAt: new Date().toISOString(),
      completed: true,
      currentStage: 7
    };
    setCurrentParticipant(p);
    researchStore.saveParticipant(p);
    researchStore.saveQuestionnaire(buildSampleQuestionnaire(p));

    // Save AI simulation
    simCases.forEach(c => {
      const isMisleading = c.aiStimulus?.isMisleading;
      researchStore.saveAiInteraction({
        id: `ai-sim-${p.id}-${c.id}`,
        participantId: p.id,
        caseId: c.id,
        isDemo: isDemoMode,
        initialDiagnosis: c.goldStandardDiagnosis,
        initialJustification: 'Independent initial diagnosis based on history, exam, and lab findings.',
        initialConfidence: 4,
        initialSubmittedAt: new Date().toISOString(),
        aiAgreement: isMisleading ? 'Uncertain; requires verification' : 'Completely agree',
        finalDiagnosis: c.goldStandardDiagnosis,
        reasonForDecision: isMisleading ? 'Challenged misleading advice.' : 'Aligned with guidelines.',
        finalConfidence: 4,
        willVerify: true,
        verificationTargets: 'Review clinical practice guidelines.',
        switchedDiagnosis: false,
        switchedTowardsCorrect: false,
        acceptedMisleading: false,
        timeSpentSeconds: 140,
        completedAt: new Date().toISOString()
      });
    });

    // Save post-AI
    postAiCases.forEach(c => {
      researchStore.saveVignetteAnswer({
        id: `post-${p.id}-${c.id}`,
        participantId: p.id,
        caseId: c.id,
        stage: 'post_ai',
        isDemo: isDemoMode,
        mostLikelyDiagnosis: c.goldStandardDiagnosis,
        differential1: c.differentialDiagnosisKeys[0] || 'Differential 1',
        differential2: c.differentialDiagnosisKeys[1] || 'Differential 2',
        redFlags: c.redFlagKeys[0] || 'Acute clinical indicators',
        nextStep: c.nextManagementStepKey,
        confidence: 4,
        submittedAt: new Date().toISOString()
      });
    });

    setStage(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 1 -> 2
  const handleBegin = () => {
    setStage(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 2 -> 3
  const handleConsent = () => {
    setStage(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 3 -> 4
  const handleRegister = (participant: Participant) => {
    setCurrentParticipant(participant);
    researchStore.saveParticipant(participant);
    setStage(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 4 -> 5 (AI Simulation)
  const handleQuestionnaireSubmit = (
    response: QuestionnaireResponse,
    updatedParticipant?: Participant
  ) => {
    researchStore.saveQuestionnaire(response);
    const baseParticipant = updatedParticipant || currentParticipant;
    if (baseParticipant) {
      const updated = {
        ...baseParticipant,
        currentStage: 5
      };
      setCurrentParticipant(updated);
      researchStore.saveParticipant(updated);
    }

    setStage(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 5 -> 6 (Post-AI Independent Reasoning)
  const handleAiSimulationComplete = (records: AiInteractionRecord[]) => {
    records.forEach(r => researchStore.saveAiInteraction(r));
    if (currentParticipant) {
      const updated = { ...currentParticipant, currentStage: 6 };
      setCurrentParticipant(updated);
      researchStore.saveParticipant(updated);
    }
    setStage(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stage 6 -> 7 (Debriefing)
  const handlePostAiComplete = (answers: VignetteAnswerRecord[]) => {
    answers.forEach(a => researchStore.saveVignetteAnswer(a));
    if (currentParticipant) {
      const updated = { ...currentParticipant, currentStage: 7, completed: true };
      setCurrentParticipant(updated);
      researchStore.saveParticipant(updated);
    }
    setStage(7);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = () => {
    setCurrentParticipant(null);
    setStage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepLabels = [
    'Welcome',
    'Consent',
    'ID Profile',
    'Survey',
    'CDSS',
    'Vignette Cases',
    'Debriefing'
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 pb-16">
      {/* Prototype Demonstration Controller Bar */}
      <PrototypeDemoBar
        currentStage={stage}
        onJumpToStage={handleJumpToStage}
        onQuickFillStep={handleQuickFillCurrentStep}
        onLoadCompleteSession={handleLoadCompleteSession}
        onResetSession={handleRestart}
        participant={currentParticipant}
      />

      {/* Top progress ribbon */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stage > stepNum;
            const isCurrent = stage === stepNum;

            return (
              <button
                key={label}
                type="button"
                onClick={() => handleJumpToStage(stepNum)}
                className={`flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 px-2 py-1 rounded transition-colors cursor-pointer ${
                  isCurrent
                    ? 'text-slate-900 font-bold bg-slate-100'
                    : isCompleted
                    ? 'text-emerald-700 font-medium hover:bg-slate-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isCurrent
                      ? 'bg-slate-900 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stepNum}
                </div>
                <span className="hidden sm:inline">{label}</span>
                {idx < stepLabels.length - 1 && (
                  <span className="text-slate-300 mx-1 hidden lg:inline">/</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Router */}
      <main>
        {stage === 1 && (
          <Stage1Welcome
            onBegin={handleBegin}
            institutionName={settings.institutionName}
            protocolNumber={settings.protocolNumber}
          />
        )}

        {stage === 2 && (
          <Stage2Consent
            onConsent={handleConsent}
            onBack={() => setStage(1)}
            protocolNumber={settings.protocolNumber}
          />
        )}

        {stage === 3 && (
          <Stage3Registration
            onRegister={handleRegister}
            onBack={() => setStage(2)}
            isDemoMode={isDemoMode}
          />
        )}

        {stage === 4 && currentParticipant && (
          <Stage4Questionnaire
            participant={currentParticipant}
            onSubmit={handleQuestionnaireSubmit}
            onBack={() => setStage(3)}
            isDemoMode={isDemoMode}
          />
        )}

        {stage === 5 && currentParticipant && (
          <Stage6AiSimulation
            cases={simCases}
            participant={currentParticipant}
            onComplete={handleAiSimulationComplete}
            isDemoMode={isDemoMode}
          />
        )}

        {stage === 6 && currentParticipant && (
          <Stage7PostAiAssessment
            cases={postAiCases}
            participant={currentParticipant}
            onComplete={handlePostAiComplete}
            isDemoMode={isDemoMode}
          />
        )}

        {stage === 7 && currentParticipant && (
          <Stage8Debriefing
            participant={currentParticipant}
            onRestart={handleRestart}
            onOpenResearcherDashboard={onOpenResearcherDashboard}
            protocolNumber={settings.protocolNumber}
          />
        )}
      </main>
    </div>
  );
};
