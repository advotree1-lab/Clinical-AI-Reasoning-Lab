import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ParticipantDesignation,
  ClinicalSpecialty,
  YearsSinceMbbsBracket,
  InstitutionType,
  GenAiTaskFrequency,
  GenAiFirstUseDuration,
  GenAiUsageFrequency,
  GenAiDailyDuration,
  GenAiAccessMethod,
  PatientInfoEntryFrequency,
  ClinicalReasoningConsultationStage,
  InstitutionalPolicyStatus
} from '../types';
import { INITIAL_CLINICAL_CASES } from './clinicalCases';
import {
  buildDisplayedCdssOptions,
  resolveOptionIdFromDiagnosis,
  evaluateMatchedGoldStandard
} from '../utils/cdssOptions';
import {
  buildDisplayedVignetteOptions,
  getCanonicalVignetteOptions
} from '../utils/vignetteOptions';

interface SeedDataResult {
  participants: Participant[];
  questionnaireResponses: QuestionnaireResponse[];
  aiInteractions: AiInteractionRecord[];
  vignetteAnswers: VignetteAnswerRecord[];
}

export function generateSeedDemoData(): SeedDataResult {
  const designations: ParticipantDesignation[] = [
    'Junior Resident', 'Junior Resident', 'Junior Resident',
    'Senior Resident', 'Senior Resident',
    'Assistant Professor', 'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Consultant', 'Consultant'
  ];

  const specialties: ClinicalSpecialty[] = [
    'General Medicine', 'General Medicine', 'General Medicine',
    'Emergency Medicine', 'Emergency Medicine',
    'General Surgery', 'Pediatrics', 'Obstetrics and Gynaecology'
  ];

  const institutions: InstitutionType[] = [
    'Teaching hospital', 'Teaching hospital', 'Government hospital', 'Private hospital'
  ];

  const toolCombinations: string[][] = [
    ['ChatGPT', 'Google Gemini'],
    ['ChatGPT'],
    ['ChatGPT', 'Claude'],
    ['Google Gemini', 'Perplexity'],
    ['ChatGPT', 'Microsoft Copilot', 'Perplexity'],
    ['ChatGPT', 'Google Gemini', 'Claude']
  ];

  const firstUseDurations: GenAiFirstUseDuration[] = [
    'Less than 3 months',
    '3–6 months',
    '6–12 months',
    'More than 12 months'
  ];

  const usageFrequencies: GenAiUsageFrequency[] = [
    'Less than once a week',
    '1–2 days per week',
    '3–5 days per week',
    'Daily',
    'Several times a day'
  ];

  const dailyDurations: GenAiDailyDuration[] = [
    'Less than 10 minutes',
    '10–30 minutes',
    '31–60 minutes',
    'More than 60 minutes'
  ];

  const accessMethods: GenAiAccessMethod[] = [
    'Free public version',
    'Free public version',
    'Personal paid subscription',
    'Provided by my hospital/institution',
    'A combination of the above'
  ];

  const patientInfoEntries: PatientInfoEntryFrequency[] = [
    'Never',
    'Never',
    'Once or twice',
    'Sometimes',
    'Often'
  ];

  const taskLevels: GenAiTaskFrequency[] = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'];

  const consultationStages: ClinicalReasoningConsultationStage[] = [
    'Before forming my own clinical assessment',
    'After my initial assessment, to cross-check my thinking',
    'When uncertain or unable to reach a conclusion',
    'After making a decision, primarily for documentation',
    'I do not use GenAI for clinical reasoning'
  ];

  const policyStatuses: InstitutionalPolicyStatus[] = ['Yes', 'No', 'Not sure'];

  const participants: Participant[] = [];
  const questionnaireResponses: QuestionnaireResponse[] = [];
  const aiInteractions: AiInteractionRecord[] = [];
  const vignetteAnswers: VignetteAnswerRecord[] = [];

  const simCases = INITIAL_CLINICAL_CASES.filter(c => c.stage === 'ai_simulation');
  const postCases = INITIAL_CLINICAL_CASES.filter(c => c.stage === 'post_ai');

  // Pseudo-random deterministic generator for consistent reproducibility
  let seed = 42;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const pickTaskFreq = (biasIdx: number): GenAiTaskFrequency => {
    const idx = Math.min(4, Math.max(0, Math.round(biasIdx + (rand() - 0.5) * 2.4)));
    return taskLevels[idx];
  };

  for (let i = 1; i <= 40; i++) {
    const participantId = `demo-doc-${1000 + i}`;
    const code = `DOC-${2000 + i}`;
    const des = designations[(i - 1) % designations.length];
    const spec = specialties[(i - 1) % specialties.length];
    const inst = institutions[(i - 1) % institutions.length];

    let mbbsBracket: YearsSinceMbbsBracket = '1–5 years';
    if (des === 'Junior Resident') mbbsBracket = rand() > 0.35 ? '1–5 years' : 'Less than 1 year';
    else if (des === 'Senior Resident') mbbsBracket = rand() > 0.4 ? '1–5 years' : '6–10 years';
    else if (des === 'Assistant Professor') mbbsBracket = rand() > 0.4 ? '6–10 years' : 'More than 10 years';
    else mbbsBracket = 'More than 10 years';

    const formalTraining = rand() < 0.28;
    const usedLast3Months = rand() > 0.15; // 85% used GenAI in past 3 months

    const participant: Participant = {
      id: participantId,
      code,
      designation: des,
      specialty: spec,
      yearsSinceMbbsBracket: mbbsBracket,
      institutionType: inst,
      formalGenAiTraining: formalTraining,
      consentGiven: true,
      isDemo: true,
      createdAt: new Date(Date.now() - (41 - i) * 86400000 * 0.7).toISOString(),
      completed: true,
      currentStage: 7
    };
    participants.push(participant);

    const isJunior = des === 'Junior Resident' || des === 'Senior Resident';
    const taskBias = isJunior ? 2.6 : 1.9;

    const qResp: QuestionnaireResponse = {
      id: `demo-q-${participantId}`,
      participantId,
      isDemo: true,
      designation: des,
      specialty: spec,
      yearsSinceMbbsBracket: mbbsBracket,
      hospitalType: inst,
      formalGenAiTraining: formalTraining,
      usedGenAiLast3Months: usedLast3Months,
      ...(usedLast3Months
        ? {
            firstUseDuration: firstUseDurations[Math.floor(rand() * firstUseDurations.length)],
            usageFrequency: usageFrequencies[Math.min(4, Math.floor(rand() * (isJunior ? 5 : 4)))],
            dailyTimeSpent: dailyDurations[Math.floor(rand() * dailyDurations.length)],
            toolsUsed: toolCombinations[i % toolCombinations.length],
            accessMethod: accessMethods[Math.floor(rand() * accessMethods.length)],
            enteredPatientInfo: patientInfoEntries[Math.floor(rand() * patientInfoEntries.length)],
            taskFrequency: {
              differentialDiagnoses: pickTaskFreq(taskBias),
              interpretingInvestigations: pickTaskFreq(taskBias - 0.3),
              choosingInvestigations: pickTaskFreq(taskBias - 0.4),
              identifyingManagement: pickTaskFreq(taskBias - 0.1),
              drugDosesAndInteractions: pickTaskFreq(taskBias + 0.2),
              summarisingLiterature: pickTaskFreq(taskBias + 0.5),
              clinicalDocumentation: pickTaskFreq(taskBias - 0.2),
              patientCommunication: pickTaskFreq(taskBias - 0.8)
            },
            reasoningConsultationStage: isJunior
              ? consultationStages[rand() < 0.35 ? 0 : rand() < 0.7 ? 1 : 2]
              : consultationStages[rand() < 0.6 ? 1 : rand() < 0.85 ? 2 : 3],
            last10CasesConsultedCount: isJunior ? Math.floor(2 + rand() * 6) : Math.floor(1 + rand() * 4),
            verificationFrequency: isJunior
              ? taskLevels[Math.min(4, Math.max(1, Math.round(2.8 + (rand() - 0.5) * 2)))]
              : taskLevels[Math.min(4, Math.max(2, Math.round(3.6 + (rand() - 0.5) * 1.5)))],
            institutionalPolicy: policyStatuses[Math.floor(rand() * policyStatuses.length)]
          }
        : {}),
      createdAt: participant.createdAt
    };
    questionnaireResponses.push(qResp);

    const clamp = (val: number) => Math.min(5, Math.max(1, Math.round(val)));

    // AI Simulation Cases (5 cases)
    simCases.forEach(sCase => {
      const stimulus = sCase.aiStimulus!;
      const isMisleading = stimulus.isMisleading;

      const initialCorrect = rand() < (isJunior ? 0.70 : 0.88);
      const initialDiagnosis = initialCorrect
        ? sCase.goldStandardDiagnosis
        : sCase.mcqOptions[1];
      const initialConfidence = clamp(3 + Math.round(rand() * 2));

      let acceptedAi = false;
      let aiAgreement: AiInteractionRecord['aiAgreement'] = 'Disagree';

      if (!isMisleading) {
        acceptedAi = rand() < (isJunior ? 0.86 : 0.94);
        aiAgreement = acceptedAi ? (rand() > 0.4 ? 'Completely agree' : 'Partially agree') : 'Uncertain; requires verification';
      } else {
        const acceptMisleadingProb = isJunior ? 0.46 : 0.28;
        acceptedAi = rand() < acceptMisleadingProb;
        if (acceptedAi) {
          aiAgreement = rand() > 0.5 ? 'Completely agree' : 'Partially agree';
        } else {
          aiAgreement = rand() > 0.4 ? 'Disagree' : 'Uncertain; requires verification';
        }
      }

      let finalDiagnosis = initialDiagnosis;
      let switchedDiagnosis = false;
      let switchedTowardsCorrect = false;

      if (acceptedAi && isMisleading) {
        finalDiagnosis = stimulus.diagnosis;
        switchedDiagnosis = initialDiagnosis !== finalDiagnosis;
        switchedTowardsCorrect = false;
      } else if (acceptedAi && !isMisleading) {
        if (!initialCorrect) {
          finalDiagnosis = sCase.goldStandardDiagnosis;
          switchedDiagnosis = true;
          switchedTowardsCorrect = true;
        } else {
          finalDiagnosis = sCase.goldStandardDiagnosis;
          switchedDiagnosis = false;
        }
      } else {
        finalDiagnosis = initialDiagnosis;
        switchedDiagnosis = false;
      }

      const willVerify = !acceptedAi || rand() < (isJunior ? 0.45 : 0.75);
      const finalConfidence = acceptedAi
        ? clamp(initialConfidence + (rand() > 0.5 ? 1 : 0))
        : clamp(initialConfidence - (rand() > 0.6 ? 1 : 0));

      const displayedOptionOrder = buildDisplayedCdssOptions(
        participantId,
        sCase.id,
        sCase.mcqOptions
      );
      const selectedOptionId = resolveOptionIdFromDiagnosis(sCase.mcqOptions, finalDiagnosis);
      const matchedGoldStandard = evaluateMatchedGoldStandard(
        { finalDiagnosis, selectedOptionId },
        sCase
      );

      const aiRecord: AiInteractionRecord = {
        id: `demo-ai-${participantId}-${sCase.id}`,
        participantId,
        caseId: sCase.id,
        isDemo: true,
        initialDiagnosis,
        initialJustification: `Initial clinical reasoning based on acute clinical presentation, vitals, and laboratory markers.`,
        initialConfidence,
        initialSubmittedAt: participant.createdAt,
        aiAgreement,
        finalDiagnosis,
        selectedOptionId,
        displayedOptionOrder,
        reasonForDecision: acceptedAi
          ? `AI recommendation aligned with clinical assessment or provided plausible guidance.`
          : `AI recommendation conflicted with clinical evidence, patient hemodynamics, or established guidelines.`,
        finalConfidence,
        willVerify,
        verificationTargets: willVerify ? 'Check clinical practice guidelines, confirmatory CT/biomarkers, and consult senior colleague.' : 'None required.',
        switchedDiagnosis,
        matchedGoldStandard,
        switchedTowardsCorrect,
        acceptedMisleading: acceptedAi && isMisleading,
        timeSpentSeconds: Math.floor(110 + rand() * 180),
        completedAt: participant.createdAt
      };
      aiInteractions.push(aiRecord);
    });

    // Post-AI Cases (5 cases)
    postCases.forEach(pCase => {
      const pCorrectProb = isJunior ? 0.74 : 0.90;
      const primaryMark = rand() < pCorrectProb ? 1 : (rand() < 0.5 ? 0.5 : 0);
      const diffMark = rand() < 0.76 ? 1 : 0.5;
      const redMark = rand() < 0.82 ? 1 : 0.5;
      const nextMark = rand() < 0.82 ? 1 : (rand() < 0.6 ? 0.5 : 0);
      const totalScore = primaryMark + diffMark + redMark + nextMark;

      const a2Primary = primaryMark;
      const a2Diff = rand() < 0.88 ? diffMark : (diffMark === 1 ? 0.5 : 1);
      const a2Red = rand() < 0.92 ? redMark : (redMark === 1 ? 0.5 : 1);
      const a2Next = rand() < 0.89 ? nextMark : (nextMark === 1 ? 0.5 : 0.5);
      const a2Total = a2Primary + a2Diff + a2Red + a2Next;

      const displayedOptionOrder = buildDisplayedVignetteOptions(
        participantId,
        pCase.id,
        pCase.mcqOptions,
        pCase.caseNumber
      );
      const canonical = getCanonicalVignetteOptions(pCase.mcqOptions);
      const chosenOpt = primaryMark === 1 ? canonical[0] : (canonical[1] || canonical[0]);

      const vAnswer: VignetteAnswerRecord = {
        id: `demo-post-${participantId}-${pCase.id}`,
        participantId,
        caseId: pCase.id,
        stage: 'post_ai',
        isDemo: true,
        mostLikelyDiagnosis: chosenOpt ? chosenOpt.text : pCase.goldStandardDiagnosis,
        selectedOptionId: chosenOpt?.optionId,
        displayedOptionOrder,
        differential1: pCase.differentialDiagnosisKeys[0],
        differential2: pCase.differentialDiagnosisKeys[1],
        redFlags: pCase.redFlagKeys[0] + '; ' + pCase.redFlagKeys[1],
        nextStep: pCase.nextManagementStepKey,
        confidence: Math.round(3 + rand() * 2),
        assessor1Score: {
          primaryDiagnosisMark: primaryMark,
          differentialsMark: diffMark,
          redFlagsMark: redMark,
          nextStepMark: nextMark,
          totalScore,
          assessorName: 'Dr. S. K. Mehta (Assessor 1)',
          scoredAt: participant.createdAt
        },
        assessor2Score: {
          primaryDiagnosisMark: a2Primary,
          differentialsMark: a2Diff,
          redFlagsMark: a2Red,
          nextStepMark: a2Next,
          totalScore: a2Total,
          assessorName: 'Prof. R. V. Raman (Assessor 2)',
          scoredAt: participant.createdAt
        },
        finalResolvedScore: (totalScore + a2Total) / 2,
        submittedAt: participant.createdAt
      };
      vignetteAnswers.push(vAnswer);
    });
  }

  return {
    participants,
    questionnaireResponses,
    aiInteractions,
    vignetteAnswers
  };
}
