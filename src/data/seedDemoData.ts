import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ParticipantDesignation,
  ClinicalSpecialty,
  InstitutionType
} from '../types';
import { INITIAL_CLINICAL_CASES } from './clinicalCases';

interface SeedDataResult {
  participants: Participant[];
  questionnaireResponses: QuestionnaireResponse[];
  aiInteractions: AiInteractionRecord[];
  vignetteAnswers: VignetteAnswerRecord[];
}

export function generateSeedDemoData(): SeedDataResult {
  const designations: ParticipantDesignation[] = [
    'Postgraduate resident', 'Postgraduate resident', 'Postgraduate resident',
    'Senior resident', 'Senior resident',
    'Medical officer', 'Medical officer',
    'Assistant professor', 'Assistant professor',
    'Associate professor',
    'Consultant', 'Consultant'
  ];

  const specialties: ClinicalSpecialty[] = [
    'General medicine', 'General medicine', 'Emergency medicine',
    'Cardiology', 'Pulmonology', 'Nephrology', 'General surgery',
    'Paediatrics', 'Neurology', 'Obstetrics and gynaecology'
  ];

  const institutions: InstitutionType[] = [
    'Medical college', 'Medical college', 'Government hospital', 'Private hospital'
  ];

  const aiToolsList = [
    ['ChatGPT (GPT-4o)', 'Gemini Advanced'],
    ['ChatGPT (GPT-4o)'],
    ['ChatGPT (GPT-4o)', 'Claude 3.5 Sonnet'],
    ['Gemini Advanced', 'Perplexity Pro'],
    ['ChatGPT (GPT-4o)', 'Perplexity Pro', 'Claude 3.5 Sonnet'],
    ['Perplexity Pro']
  ];

  const participants: Participant[] = [];
  const questionnaireResponses: QuestionnaireResponse[] = [];
  const aiInteractions: AiInteractionRecord[] = [];
  const vignetteAnswers: VignetteAnswerRecord[] = [];

  const baselineCases = INITIAL_CLINICAL_CASES.filter(c => c.stage === 'baseline');
  const simCases = INITIAL_CLINICAL_CASES.filter(c => c.stage === 'ai_simulation');
  const postCases = INITIAL_CLINICAL_CASES.filter(c => c.stage === 'post_ai');

  // Pseudo-random deterministic generator for consistent reproducibility
  let seed = 42;
  function rand(): number {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  for (let i = 1; i <= 40; i++) {
    const participantId = `demo-doc-${1000 + i}`;
    const code = `DOC-${2000 + i}`;
    const des = designations[(i - 1) % designations.length];
    const spec = specialties[(i - 1) % specialties.length];
    const inst = institutions[(i - 1) % institutions.length];
    
    // Years of experience correlated with designation
    let yearsExp = 2;
    if (des === 'Postgraduate resident') yearsExp = Math.floor(1 + rand() * 3);
    else if (des === 'Senior resident') yearsExp = Math.floor(4 + rand() * 3);
    else if (des === 'Medical officer') yearsExp = Math.floor(2 + rand() * 5);
    else if (des === 'Assistant professor') yearsExp = Math.floor(6 + rand() * 5);
    else if (des === 'Associate professor') yearsExp = Math.floor(11 + rand() * 6);
    else if (des === 'Consultant') yearsExp = Math.floor(8 + rand() * 12);
    else yearsExp = Math.floor(15 + rand() * 10);

    const participant: Participant = {
      id: participantId,
      code,
      designation: des,
      specialty: spec,
      yearsSinceMBBS: yearsExp + 1,
      yearsExperience: yearsExp,
      institutionType: inst,
      dailyPatientLoad: Math.floor(25 + rand() * 45),
      priorAiExposure: rand() > 0.15, // 85% have used some AI
      consentGiven: true,
      isDemo: true,
      createdAt: new Date(Date.now() - (41 - i) * 86400000 * 0.7).toISOString(),
      completed: true,
      currentStage: 8
    };
    participants.push(participant);

    // Questionnaire
    const isJunior = des === 'Postgraduate resident' || des === 'Medical officer';
    const offloadBase = isJunior ? 3.6 : 2.8;
    const deskillBase = isJunior ? 3.4 : 2.5;

    const clamp = (val: number) => Math.min(5, Math.max(1, Math.round(val)));

    const qResp: QuestionnaireResponse = {
      id: `demo-q-${participantId}`,
      participantId,
      isDemo: true,
      usedAiLast3Months: participant.priorAiExposure,
      aiToolsUsed: participant.priorAiExposure ? aiToolsList[i % aiToolsList.length] : [],
      aiFrequency: participant.priorAiExposure
        ? (rand() > 0.4 ? 'Daily' : (rand() > 0.5 ? 'Several times weekly' : 'Weekly'))
        : 'Never',
      primaryPurposes: [
        'Differential diagnosis formulation',
        'Clinical information retrieval',
        rand() > 0.5 ? 'Drug interaction checking' : 'Treatment guidelines review'
      ],
      aiTiming: rand() > 0.6 ? 'after' : (rand() > 0.5 ? 'both' : 'before'),
      complexVsRoutine: rand() > 0.3,
      verificationFrequency: rand() > 0.3 ? 'Often' : (rand() > 0.5 ? 'Always' : 'Sometimes'),
      verificationResources: ['UpToDate', 'Clinical Practice Guidelines', 'PubMed / Medline'],
      cognitiveOffloading: {
        dependDifferential: clamp(offloadBase + (rand() - 0.5) * 1.6),
        substituteRecall: clamp(offloadBase - 0.3 + (rand() - 0.5) * 1.5),
        interpretComplex: clamp(offloadBase + (rand() - 0.5) * 1.4),
        transferReasoning: clamp(offloadBase - 0.5 + (rand() - 0.5) * 1.4),
        consultBeforeThinking: clamp(offloadBase - 0.6 + (rand() - 0.5) * 1.5),
        reduceWorkload: clamp(offloadBase + 0.6 + (rand() - 0.5) * 1.2),
        verifyBeforeUsing: clamp(4.2 + (rand() - 0.5) * 1.2)
      },
      perceivedDeskilling: {
        reducedEffort: clamp(deskillBase + (rand() - 0.5) * 1.5),
        difficultWithoutAi: clamp(deskillBase - 0.4 + (rand() - 0.5) * 1.4),
        lessConfidentIndependent: clamp(deskillBase - 0.3 + (rand() - 0.5) * 1.4),
        dependInvestigations: clamp(deskillBase + (rand() - 0.5) * 1.3),
        affectProblemSolving: clamp(deskillBase + 0.2 + (rand() - 0.5) * 1.5),
        confidenceChange: clamp(3.0 + (rand() - 0.5) * 1.2)
      },
      createdAt: participant.createdAt
    };
    questionnaireResponses.push(qResp);

    // Baseline Cases (5 cases)
    baselineCases.forEach(bCase => {
      // Junior doctors score ~2.8-3.3, Senior doctors score ~3.2-3.8 out of 4
      const pCorrectProb = isJunior ? 0.72 : 0.88;
      const primaryMark = rand() < pCorrectProb ? 1 : (rand() < 0.5 ? 0.5 : 0);
      const diffMark = rand() < 0.75 ? 1 : 0.5;
      const redMark = rand() < 0.78 ? 1 : 0.5;
      const nextMark = rand() < 0.80 ? 1 : (rand() < 0.6 ? 0.5 : 0);
      const totalScore = primaryMark + diffMark + redMark + nextMark;

      // Simulated Assessor 2 with slight variance for inter-rater reliability demonstration
      const a2Primary = primaryMark;
      const a2Diff = rand() < 0.85 ? diffMark : (diffMark === 1 ? 0.5 : 1);
      const a2Red = rand() < 0.90 ? redMark : (redMark === 1 ? 0.5 : 1);
      const a2Next = rand() < 0.88 ? nextMark : (nextMark === 1 ? 0.5 : 0.5);
      const a2Total = a2Primary + a2Diff + a2Red + a2Next;

      const vAnswer: VignetteAnswerRecord = {
        id: `demo-base-${participantId}-${bCase.id}`,
        participantId,
        caseId: bCase.id,
        stage: 'baseline',
        isDemo: true,
        mostLikelyDiagnosis: primaryMark === 1 ? bCase.goldStandardDiagnosis : bCase.mcqOptions[1],
        differential1: bCase.differentialDiagnosisKeys[0],
        differential2: bCase.differentialDiagnosisKeys[1],
        redFlags: bCase.redFlagKeys[0] + '; ' + bCase.redFlagKeys[1],
        nextStep: bCase.nextManagementStepKey,
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

    // AI Simulation Cases (5 cases)
    simCases.forEach(sCase => {
      const stimulus = sCase.aiStimulus!;
      const isMisleading = stimulus.isMisleading;

      // Initial response formed independently
      const initialCorrect = rand() < (isJunior ? 0.70 : 0.88);
      const initialDiagnosis = initialCorrect
        ? sCase.goldStandardDiagnosis
        : sCase.mcqOptions[1];
      const initialConfidence = clamp(3 + Math.round(rand() * 2));

      // Probability of accepting recommendation:
      // If appropriate: ~88% acceptance
      // If misleading: ~40% acceptance (automation bias!), higher in juniors (~48%) than consultants (~28%)
      let acceptedAi = false;
      let aiAgreement: any = 'Disagree';

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

      // Final diagnosis logic
      let finalDiagnosis = initialDiagnosis;
      let switchedDiagnosis = false;
      let switchedTowardsCorrect = false;

      if (acceptedAi && isMisleading) {
        // Succumbed to misleading AI -> switched to AI recommendation
        finalDiagnosis = stimulus.diagnosis;
        switchedDiagnosis = initialDiagnosis !== finalDiagnosis;
        switchedTowardsCorrect = false;
      } else if (acceptedAi && !isMisleading) {
        if (!initialCorrect) {
          // AI helped correct an initial error
          finalDiagnosis = sCase.goldStandardDiagnosis;
          switchedDiagnosis = true;
          switchedTowardsCorrect = true;
        } else {
          finalDiagnosis = sCase.goldStandardDiagnosis;
          switchedDiagnosis = false;
        }
      } else {
        // Disagreed or uncertain
        finalDiagnosis = initialDiagnosis;
        switchedDiagnosis = false;
      }

      const willVerify = !acceptedAi || rand() < (isJunior ? 0.45 : 0.75);
      const finalConfidence = acceptedAi
        ? clamp(initialConfidence + (rand() > 0.5 ? 1 : 0))
        : clamp(initialConfidence - (rand() > 0.6 ? 1 : 0));

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
        reasonForDecision: acceptedAi
          ? `AI recommendation aligned with clinical assessment or provided plausible guidance.`
          : `AI recommendation conflicted with clinical evidence, patient hemodynamics, or established guidelines.`,
        finalConfidence,
        willVerify,
        verificationTargets: willVerify ? 'Check clinical practice guidelines, confirmatory CT/biomarkers, and consult senior colleague.' : 'None required.',
        switchedDiagnosis,
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

      const vAnswer: VignetteAnswerRecord = {
        id: `demo-post-${participantId}-${pCase.id}`,
        participantId,
        caseId: pCase.id,
        stage: 'post_ai',
        isDemo: true,
        mostLikelyDiagnosis: primaryMark === 1 ? pCase.goldStandardDiagnosis : pCase.mcqOptions[1],
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
