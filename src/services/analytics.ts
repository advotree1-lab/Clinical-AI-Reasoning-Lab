import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ClinicalCase,
  GenAiTaskFrequency
} from '../types';

const TASK_FREQ_SCORE: Record<GenAiTaskFrequency, number> = {
  'Never': 1,
  'Rarely': 2,
  'Sometimes': 3,
  'Often': 4,
  'Very often': 5
};

export interface ResearchAnalyticsSummary {
  totalEnrolled: number;
  registeredCount: number;
  inProgressCount: number;
  completedCount: number;
  abandonedCount: number;
  completionRate: number;
  // Primary Outcome
  primaryMisleadingAcceptanceRate: number; // percentage (0-100)
  meanMisleadingAcceptedCount: number; // 0 to 3
  misleadingDistribution: { count: number; participants: number; percentage: number }[];
  // Secondary Outcomes
  soundAdviceAcceptanceRate: number; // percentage (0-100)
  meanSoundAcceptedCount: number; // 0 to 2
  diagnosticSwitchingRate: number;
  switchAwayToMisleadingRate: number;
  switchTowardCorrectRate: number;
  unverifiedMisleadingAcceptanceRate: number;
  initialMeanConfidence: number;
  finalMeanConfidence: number;
  confidenceDelta: number;
  meanCdssActiveSeconds: number;
  meanVignetteActiveSeconds: number;
  // Post-AI Unaided Reasoning Performance
  postAiMeanScore: number; // out of postAiMaxScore
  postAiMaxScore: number; // 4 marks per post-AI case
  postAiStdDev: number;
  postAiMeanPercentage: number;
  postAiCaseMeans: { caseNumber: number; domain: string; title: string; meanScore: number }[];
  // Inter-Rater Reliability (Assessor 1 vs Assessor 2)
  interRaterAgreementPercentage: number;
  cohensKappaApprox: number;
  totalVignettesScoredByBoth: number;
  // GenAI Exposure & Task-Offloading Survey Metrics
  genAiAdoptionRate: number; // % who answered Yes to Q1
  formalTrainingRate: number; // % with formal GenAI training
  patientInfoEnteredRate: number; // % of GenAI users who entered patient info (>= Once or twice)
  meanCasesConsultedOutOf10: number; // Q10 mean (0-10)
  alwaysOrOftenVerifyRate: number; // % of GenAI users verifying Often or Very often (Q11)
  taskFrequencyAverages: {
    task: string;
    meanScore: number; // 1 to 5
    oftenOrVeryOftenPct: number;
  }[];
  consultationStageBreakdown: { stage: string; count: number; percentage: number }[];
  institutionalPolicyBreakdown: { status: string; count: number; percentage: number }[];
  // Breakdowns
  designationBreakdown: { name: string; count: number; misleadingAcceptanceRate: number }[];
  specialtyBreakdown: { name: string; count: number }[];
  caseWiseMisleadingBreakdown: { caseNumber: number; title: string; acceptanceRate: number; verificationRate: number }[];
}

export function computeAnalytics(
  participants: Participant[],
  questionnaires: QuestionnaireResponse[],
  aiInteractions: AiInteractionRecord[],
  vignetteAnswers: VignetteAnswerRecord[],
  cases: ClinicalCase[]
): ResearchAnalyticsSummary {
  const totalEnrolled = participants.length;
  if (totalEnrolled === 0) {
    return getEmptyAnalytics();
  }

  const completedParticipants = participants.filter(
    p => p.completed || p.completionStatus === 'completed'
  );
  const completedCount = completedParticipants.length;
  const registeredCount = participants.filter(p => p.completionStatus === 'registered').length;
  const abandonedCount = participants.filter(p => p.completionStatus === 'abandoned').length;
  const inProgressCount = participants.filter(
    p => !p.completed && p.completionStatus !== 'registered' && p.completionStatus !== 'abandoned'
  ).length;
  const completionRate = Number(((completedCount / totalEnrolled) * 100).toFixed(1));

  // Sim cases ground truth
  const misleadingCaseIds = new Set(
    cases.filter(c => c.stage === 'ai_simulation' && c.aiStimulus?.isMisleading).map(c => c.id)
  );
  const soundCaseIds = new Set(
    cases.filter(c => c.stage === 'ai_simulation' && !c.aiStimulus?.isMisleading).map(c => c.id)
  );

  // Group AI interactions by participant
  const aiByParticipant: Record<string, AiInteractionRecord[]> = {};
  aiInteractions.forEach(r => {
    if (!aiByParticipant[r.participantId]) aiByParticipant[r.participantId] = [];
    aiByParticipant[r.participantId].push(r);
  });

  let totalMisleadingExposures = 0;
  let totalMisleadingAccepted = 0;
  let totalSoundExposures = 0;
  let totalSoundAccepted = 0;

  let totalSwitchedCases = 0;
  let totalSwitchAwayToMisleading = 0;
  let totalSwitchTowardCorrect = 0;
  let totalUnverifiedMisleading = 0;

  let sumInitialConf = 0;
  let initialConfCount = 0;
  let sumFinalConf = 0;
  let totalAiInteractions = 0;
  let sumCdssActive = 0;
  let cdssTimedCount = 0;

  const misleadingCountsPerParticipant: number[] = [];

  participants.forEach(p => {
    const records = aiByParticipant[p.id] || [];
    let pMisleadingCount = 0;

    records.forEach(r => {
      totalAiInteractions++;
      if (typeof r.initialConfidence === 'number') {
        sumInitialConf += r.initialConfidence;
        initialConfCount++;
      }
      if (typeof r.activeSeconds === 'number' && r.activeSeconds > 0) {
        sumCdssActive += r.activeSeconds;
        cdssTimedCount++;
      }
      sumFinalConf += r.finalConfidence;

      const isMis = misleadingCaseIds.has(r.caseId);
      const isSound = soundCaseIds.has(r.caseId);
      const agreed = r.aiAgreement === 'Completely agree' || r.aiAgreement === 'Partially agree';

      if (isMis) {
        totalMisleadingExposures++;
        if (r.acceptedMisleading !== undefined ? r.acceptedMisleading : agreed) {
          totalMisleadingAccepted++;
          pMisleadingCount++;
          if (!r.willVerify) {
            totalUnverifiedMisleading++;
          }
        }
      }

      if (isSound) {
        totalSoundExposures++;
        if (agreed) {
          totalSoundAccepted++;
        }
      }

      if (r.switchedDiagnosis) {
        totalSwitchedCases++;
        if (r.switchedTowardsCorrect) {
          totalSwitchTowardCorrect++;
        } else {
          totalSwitchAwayToMisleading++;
        }
      }
    });

    misleadingCountsPerParticipant.push(pMisleadingCount);
  });

  const meanCdssActiveSeconds =
    cdssTimedCount > 0 ? Math.round(sumCdssActive / cdssTimedCount) : 0;
  const timedVignettes = vignetteAnswers.filter(
    v => typeof v.activeSeconds === 'number' && v.activeSeconds > 0
  );
  const meanVignetteActiveSeconds =
    timedVignettes.length > 0
      ? Math.round(
          timedVignettes.reduce((acc, v) => acc + (v.activeSeconds ?? 0), 0) / timedVignettes.length
        )
      : 0;

  const primaryMisleadingAcceptanceRate = totalMisleadingExposures > 0
    ? Number(((totalMisleadingAccepted / totalMisleadingExposures) * 100).toFixed(1))
    : 0;

  const meanMisleadingAcceptedCount = participants.length > 0
    ? Number((totalMisleadingAccepted / participants.length).toFixed(2))
    : 0;

  const distCounts = [0, 0, 0, 0];
  misleadingCountsPerParticipant.forEach(c => {
    const idx = Math.min(3, Math.max(0, c));
    distCounts[idx]++;
  });

  const misleadingDistribution = distCounts.map((count, i) => ({
    count: i,
    participants: count,
    percentage: participants.length > 0 ? Number(((count / participants.length) * 100).toFixed(1)) : 0
  }));

  const soundAdviceAcceptanceRate = totalSoundExposures > 0
    ? Number(((totalSoundAccepted / totalSoundExposures) * 100).toFixed(1))
    : 0;

  const meanSoundAcceptedCount = participants.length > 0
    ? Number((totalSoundAccepted / participants.length).toFixed(2))
    : 0;

  const diagnosticSwitchingRate = totalAiInteractions > 0
    ? Number(((totalSwitchedCases / totalAiInteractions) * 100).toFixed(1))
    : 0;

  const switchAwayToMisleadingRate = totalAiInteractions > 0
    ? Number(((totalSwitchAwayToMisleading / totalAiInteractions) * 100).toFixed(1))
    : 0;

  const switchTowardCorrectRate = totalAiInteractions > 0
    ? Number(((totalSwitchTowardCorrect / totalAiInteractions) * 100).toFixed(1))
    : 0;

  const unverifiedMisleadingAcceptanceRate = totalMisleadingAccepted > 0
    ? Number(((totalUnverifiedMisleading / totalMisleadingAccepted) * 100).toFixed(1))
    : 0;

  const initialMeanConfidence = initialConfCount > 0
    ? Number((sumInitialConf / initialConfCount).toFixed(2))
    : 0;

  const finalMeanConfidence = totalAiInteractions > 0
    ? Number((sumFinalConf / totalAiInteractions).toFixed(2))
    : 0;

  const confidenceDelta = Number((finalMeanConfidence - initialMeanConfidence).toFixed(2));

  // Post-AI Independent Reasoning Vignette Scores
  const postCasesList = cases.filter(c => c.stage === 'post_ai');
  const postAiMaxScore = Math.max(4, postCasesList.length * 4);

  const postByParticipant: Record<string, number> = {};
  vignetteAnswers.forEach(v => {
    const score = v.finalResolvedScore ?? v.assessor1Score?.totalScore ?? 0;
    postByParticipant[v.participantId] = (postByParticipant[v.participantId] || 0) + score;
  });

  const postScores = Object.values(postByParticipant);
  const calcMeanStd = (arr: number[]) => {
    if (arr.length === 0) return { mean: 0, std: 0 };
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return { mean: Number(mean.toFixed(2)), std: Number(Math.sqrt(variance).toFixed(2)) };
  };

  const pStats = calcMeanStd(postScores);
  const postAiMeanPercentage = Number(((pStats.mean / postAiMaxScore) * 100).toFixed(1));
  const postAiCaseMeans = postCasesList.map(c => {
    const answersForCase = vignetteAnswers.filter(v => v.caseId === c.id);
    const scored = answersForCase.filter(v => (v.finalResolvedScore ?? v.assessor1Score?.totalScore) !== undefined);
    const sum = scored.reduce((acc, v) => acc + (v.finalResolvedScore ?? v.assessor1Score?.totalScore ?? 0), 0);
    return {
      caseNumber: c.caseNumber,
      domain: c.domain,
      title: c.title,
      meanScore: scored.length > 0 ? Number((sum / scored.length).toFixed(2)) : 0
    };
  });

  // Inter-Rater Reliability (Assessor 1 vs Assessor 2)
  let bothScoredCount = 0;
  let exactAgreementCount = 0;
  let primaryAgreementCount = 0;

  vignetteAnswers.forEach(v => {
    if (v.assessor1Score && v.assessor2Score) {
      bothScoredCount++;
      const s1 = v.assessor1Score.totalScore;
      const s2 = v.assessor2Score.totalScore;
      if (Math.abs(s1 - s2) < 0.5) {
        exactAgreementCount++;
      }
      if (v.assessor1Score.primaryDiagnosisMark === v.assessor2Score.primaryDiagnosisMark) {
        primaryAgreementCount++;
      }
    }
  });

  const interRaterAgreementPercentage = bothScoredCount > 0
    ? Number(((exactAgreementCount / bothScoredCount) * 100).toFixed(1))
    : 0;

  const cohensKappaApprox = bothScoredCount > 0
    ? Number((((primaryAgreementCount / bothScoredCount) - 0.5) / (1 - 0.5)).toFixed(2))
    : 0;

  // GenAI Exposure & Task-Offloading Questionnaire Analytics
  const qTotal = questionnaires.length;
  const genAiUsers = questionnaires.filter(q => q.usedGenAiLast3Months);
  const userCount = genAiUsers.length;

  const genAiAdoptionRate = qTotal > 0 ? Number(((userCount / qTotal) * 100).toFixed(1)) : 0;
  const formalTrainingRate = qTotal > 0
    ? Number(((questionnaires.filter(q => q.formalGenAiTraining).length / qTotal) * 100).toFixed(1))
    : 0;

  const patientInfoEnteredRate = userCount > 0
    ? Number(((genAiUsers.filter(q => q.enteredPatientInfo && q.enteredPatientInfo !== 'Never').length / userCount) * 100).toFixed(1))
    : 0;

  const meanCasesConsultedOutOf10 = userCount > 0
    ? Number((genAiUsers.reduce((acc, q) => acc + (q.last10CasesConsultedCount ?? 0), 0) / userCount).toFixed(1))
    : 0;

  const alwaysOrOftenVerifyRate = userCount > 0
    ? Number(((genAiUsers.filter(q => q.verificationFrequency === 'Often' || q.verificationFrequency === 'Very often').length / userCount) * 100).toFixed(1))
    : 0;

  const taskDefs: { key: keyof NonNullable<QuestionnaireResponse['taskFrequency']>; label: string }[] = [
    { key: 'differentialDiagnoses', label: 'a. Generating differential diagnoses' },
    { key: 'interpretingInvestigations', label: 'b. Interpreting investigation results' },
    { key: 'choosingInvestigations', label: 'c. Choosing investigations' },
    { key: 'identifyingManagement', label: 'd. Identifying management options' },
    { key: 'drugDosesAndInteractions', label: 'e. Drug doses and interactions' },
    { key: 'summarisingLiterature', label: 'f. Summarising literature or guidelines' },
    { key: 'clinicalDocumentation', label: 'g. Clinical documentation or letters' },
    { key: 'patientCommunication', label: 'h. Patient communication' }
  ];

  const taskFrequencyAverages = taskDefs.map(def => {
    const valid = genAiUsers.filter(q => q.taskFrequency?.[def.key]);
    if (valid.length === 0) {
      return { task: def.label, meanScore: 0, oftenOrVeryOftenPct: 0 };
    }
    const sum = valid.reduce((acc, q) => acc + TASK_FREQ_SCORE[q.taskFrequency![def.key]], 0);
    const highCount = valid.filter(q => {
      const val = q.taskFrequency![def.key];
      return val === 'Often' || val === 'Very often';
    }).length;
    return {
      task: def.label,
      meanScore: Number((sum / valid.length).toFixed(2)),
      oftenOrVeryOftenPct: Number(((highCount / valid.length) * 100).toFixed(1))
    };
  });

  const stageCounts: Record<string, number> = {};
  const policyCounts: Record<string, number> = { Yes: 0, No: 0, 'Not sure': 0 };
  genAiUsers.forEach(q => {
    if (q.reasoningConsultationStage) {
      stageCounts[q.reasoningConsultationStage] = (stageCounts[q.reasoningConsultationStage] || 0) + 1;
    }
    if (q.institutionalPolicy) {
      policyCounts[q.institutionalPolicy] = (policyCounts[q.institutionalPolicy] || 0) + 1;
    }
  });

  const consultationStageBreakdown = Object.entries(stageCounts)
    .map(([stage, count]) => ({
      stage,
      count,
      percentage: userCount > 0 ? Number(((count / userCount) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const institutionalPolicyBreakdown = Object.entries(policyCounts).map(([status, count]) => ({
    status,
    count,
    percentage: userCount > 0 ? Number(((count / userCount) * 100).toFixed(1)) : 0
  }));

  // Designation breakdown
  const desMap: Record<string, { count: number; misleadingAccepted: number; misleadingTotal: number }> = {};
  participants.forEach(p => {
    if (!desMap[p.designation]) {
      desMap[p.designation] = { count: 0, misleadingAccepted: 0, misleadingTotal: 0 };
    }
    desMap[p.designation].count++;

    const pRecords = aiByParticipant[p.id] || [];
    pRecords.forEach(r => {
      if (misleadingCaseIds.has(r.caseId)) {
        desMap[p.designation].misleadingTotal++;
        if (r.acceptedMisleading || r.aiAgreement === 'Completely agree' || r.aiAgreement === 'Partially agree') {
          desMap[p.designation].misleadingAccepted++;
        }
      }
    });
  });

  const designationBreakdown = Object.entries(desMap).map(([name, data]) => ({
    name,
    count: data.count,
    misleadingAcceptanceRate: data.misleadingTotal > 0
      ? Number(((data.misleadingAccepted / data.misleadingTotal) * 100).toFixed(1))
      : 0
  })).sort((a, b) => b.misleadingAcceptanceRate - a.misleadingAcceptanceRate);

  // Specialty breakdown
  const specMap: Record<string, number> = {};
  participants.forEach(p => {
    specMap[p.specialty] = (specMap[p.specialty] || 0) + 1;
  });
  const specialtyBreakdown = Object.entries(specMap).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Case-wise breakdown
  const simCasesList = cases.filter(c => c.stage === 'ai_simulation');
  const caseWiseMisleadingBreakdown = simCasesList.map(c => {
    const cRecords = aiInteractions.filter(r => r.caseId === c.id);
    const total = cRecords.length;
    const agreed = cRecords.filter(r => r.aiAgreement === 'Completely agree' || r.aiAgreement === 'Partially agree').length;
    const verified = cRecords.filter(r => r.willVerify).length;
    return {
      caseNumber: c.caseNumber,
      title: c.title,
      acceptanceRate: total > 0 ? Number(((agreed / total) * 100).toFixed(1)) : 0,
      verificationRate: total > 0 ? Number(((verified / total) * 100).toFixed(1)) : 0
    };
  });

  return {
    totalEnrolled,
    registeredCount,
    inProgressCount,
    completedCount,
    abandonedCount,
    completionRate,
    primaryMisleadingAcceptanceRate,
    meanMisleadingAcceptedCount,
    misleadingDistribution,
    soundAdviceAcceptanceRate,
    meanSoundAcceptedCount,
    diagnosticSwitchingRate,
    switchAwayToMisleadingRate,
    switchTowardCorrectRate,
    unverifiedMisleadingAcceptanceRate,
    initialMeanConfidence,
    finalMeanConfidence,
    confidenceDelta,
    meanCdssActiveSeconds,
    meanVignetteActiveSeconds,
    postAiMeanScore: pStats.mean,
    postAiMaxScore,
    postAiStdDev: pStats.std,
    postAiMeanPercentage,
    postAiCaseMeans,
    interRaterAgreementPercentage,
    cohensKappaApprox,
    totalVignettesScoredByBoth: bothScoredCount,
    genAiAdoptionRate,
    formalTrainingRate,
    patientInfoEnteredRate,
    meanCasesConsultedOutOf10,
    alwaysOrOftenVerifyRate,
    taskFrequencyAverages,
    consultationStageBreakdown,
    institutionalPolicyBreakdown,
    designationBreakdown,
    specialtyBreakdown,
    caseWiseMisleadingBreakdown
  };
}

function getEmptyAnalytics(): ResearchAnalyticsSummary {
  return {
    totalEnrolled: 0,
    registeredCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    abandonedCount: 0,
    completionRate: 0,
    primaryMisleadingAcceptanceRate: 0,
    meanMisleadingAcceptedCount: 0,
    misleadingDistribution: [
      { count: 0, participants: 0, percentage: 0 },
      { count: 1, participants: 0, percentage: 0 },
      { count: 2, participants: 0, percentage: 0 },
      { count: 3, participants: 0, percentage: 0 }
    ],
    soundAdviceAcceptanceRate: 0,
    meanSoundAcceptedCount: 0,
    diagnosticSwitchingRate: 0,
    switchAwayToMisleadingRate: 0,
    switchTowardCorrectRate: 0,
    unverifiedMisleadingAcceptanceRate: 0,
    initialMeanConfidence: 0,
    finalMeanConfidence: 0,
    confidenceDelta: 0,
    meanCdssActiveSeconds: 0,
    meanVignetteActiveSeconds: 0,
    postAiMeanScore: 0,
    postAiMaxScore: 24,
    postAiStdDev: 0,
    postAiMeanPercentage: 0,
    postAiCaseMeans: [],
    interRaterAgreementPercentage: 0,
    cohensKappaApprox: 0,
    totalVignettesScoredByBoth: 0,
    genAiAdoptionRate: 0,
    formalTrainingRate: 0,
    patientInfoEnteredRate: 0,
    meanCasesConsultedOutOf10: 0,
    alwaysOrOftenVerifyRate: 0,
    taskFrequencyAverages: [],
    consultationStageBreakdown: [],
    institutionalPolicyBreakdown: [],
    designationBreakdown: [],
    specialtyBreakdown: [],
    caseWiseMisleadingBreakdown: []
  };
}

function sanitizeCsvString(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.map(h => sanitizeCsvString(h)).join(','),
    ...rows.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === undefined || val === null) return '""';
          if (typeof val === 'string') {
            return sanitizeCsvString(val);
          }
          if (Array.isArray(val)) {
            return sanitizeCsvString(val.join('; '));
          }
          if (typeof val === 'number' || typeof val === 'boolean') {
            return String(val);
          }
          return sanitizeCsvString(JSON.stringify(val));
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
