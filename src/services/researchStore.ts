import {
  Participant,
  QuestionnaireResponse,
  ClinicalCase,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ResearchProtocolSettings,
  VignetteScoreBreakdown
} from '../types';
import { INITIAL_CLINICAL_CASES } from '../data/clinicalCases';
import { generateSeedDemoData } from '../data/seedDemoData';

const DEMO_PARTICIPANTS_KEY = 'carl_demo_participants';
const DEMO_QUESTIONNAIRES_KEY = 'carl_demo_questionnaires';
const DEMO_AI_INTERACTIONS_KEY = 'carl_demo_ai_interactions';
const DEMO_VIGNETTES_KEY = 'carl_demo_vignettes';

const RESEARCH_PARTICIPANTS_KEY = 'carl_research_participants';
const RESEARCH_QUESTIONNAIRES_KEY = 'carl_research_questionnaires';
const RESEARCH_AI_INTERACTIONS_KEY = 'carl_research_ai_interactions';
const RESEARCH_VIGNETTES_KEY = 'carl_research_vignettes';

const PROTOCOL_SETTINGS_KEY = 'carl_protocol_settings';
const CASES_KEY = 'carl_clinical_cases';

const DEFAULT_SETTINGS: ResearchProtocolSettings = {
  baselineAssessmentEnabled: true,
  requireParticipantConsent: true,
  passcode: 'LAB2026',
  institutionName: 'Department of Medicine, Academic Medical College',
  protocolNumber: 'IEC/2026/RES-AI-884',
  primaryInvestigator: 'Dr. Research Fellow & Guide',
  dataRetentionMonths: 24,
  allowDemoToggle: true
};

class ResearchStore {
  private cases: ClinicalCase[] = [];
  private settings: ResearchProtocolSettings = DEFAULT_SETTINGS;

  constructor() {
    this.initStore();
  }

  private initStore() {
    try {
      // Cases
      const storedCases = localStorage.getItem(CASES_KEY);
      if (storedCases) {
        this.cases = JSON.parse(storedCases);
      } else {
        this.cases = INITIAL_CLINICAL_CASES;
        localStorage.setItem(CASES_KEY, JSON.stringify(this.cases));
      }

      // Settings
      const storedSettings = localStorage.getItem(PROTOCOL_SETTINGS_KEY);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } else {
        localStorage.setItem(PROTOCOL_SETTINGS_KEY, JSON.stringify(this.settings));
      }

      // Demo data seeding if empty
      const demoP = localStorage.getItem(DEMO_PARTICIPANTS_KEY);
      if (!demoP) {
        this.resetDemoData();
      }
    } catch (e) {
      console.warn('Storage init fallback to memory', e);
      this.cases = INITIAL_CLINICAL_CASES;
    }
  }

  public resetDemoData() {
    const seed = generateSeedDemoData();
    localStorage.setItem(DEMO_PARTICIPANTS_KEY, JSON.stringify(seed.participants));
    localStorage.setItem(DEMO_QUESTIONNAIRES_KEY, JSON.stringify(seed.questionnaireResponses));
    localStorage.setItem(DEMO_AI_INTERACTIONS_KEY, JSON.stringify(seed.aiInteractions));
    localStorage.setItem(DEMO_VIGNETTES_KEY, JSON.stringify(seed.vignetteAnswers));
  }

  // --- PROTOCOL & CASES ---
  public getSettings(): ResearchProtocolSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<ResearchProtocolSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(PROTOCOL_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  public getCases(stage?: 'baseline' | 'ai_simulation' | 'post_ai'): ClinicalCase[] {
    if (stage) {
      return this.cases.filter(c => c.stage === stage);
    }
    return [...this.cases];
  }

  public updateCase(updatedCase: ClinicalCase) {
    this.cases = this.cases.map(c => c.id === updatedCase.id ? updatedCase : c);
    localStorage.setItem(CASES_KEY, JSON.stringify(this.cases));
  }

  // --- PARTICIPANTS ---
  public getParticipants(isDemo: boolean): Participant[] {
    const key = isDemo ? DEMO_PARTICIPANTS_KEY : RESEARCH_PARTICIPANTS_KEY;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  public saveParticipant(participant: Participant) {
    const key = participant.isDemo ? DEMO_PARTICIPANTS_KEY : RESEARCH_PARTICIPANTS_KEY;
    const list = this.getParticipants(participant.isDemo);
    const existingIndex = list.findIndex(p => p.id === participant.id);
    if (existingIndex >= 0) {
      list[existingIndex] = participant;
    } else {
      list.push(participant);
    }
    localStorage.setItem(key, JSON.stringify(list));
  }

  // --- QUESTIONNAIRES ---
  public getQuestionnaires(isDemo: boolean): QuestionnaireResponse[] {
    const key = isDemo ? DEMO_QUESTIONNAIRES_KEY : RESEARCH_QUESTIONNAIRES_KEY;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  public saveQuestionnaire(resp: QuestionnaireResponse) {
    const key = resp.isDemo ? DEMO_QUESTIONNAIRES_KEY : RESEARCH_QUESTIONNAIRES_KEY;
    const list = this.getQuestionnaires(resp.isDemo);
    const existingIndex = list.findIndex(q => q.id === resp.id || q.participantId === resp.participantId);
    if (existingIndex >= 0) {
      list[existingIndex] = resp;
    } else {
      list.push(resp);
    }
    localStorage.setItem(key, JSON.stringify(list));
  }

  // --- AI INTERACTIONS ---
  public getAiInteractions(isDemo: boolean): AiInteractionRecord[] {
    const key = isDemo ? DEMO_AI_INTERACTIONS_KEY : RESEARCH_AI_INTERACTIONS_KEY;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  public saveAiInteraction(record: AiInteractionRecord) {
    const key = record.isDemo ? DEMO_AI_INTERACTIONS_KEY : RESEARCH_AI_INTERACTIONS_KEY;
    const list = this.getAiInteractions(record.isDemo);
    const existingIndex = list.findIndex(r => r.participantId === record.participantId && r.caseId === record.caseId);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(key, JSON.stringify(list));
  }

  // --- VIGNETTES (BASELINE & POST-AI) ---
  public getVignetteAnswers(isDemo: boolean, stage?: 'baseline' | 'post_ai'): VignetteAnswerRecord[] {
    const key = isDemo ? DEMO_VIGNETTES_KEY : RESEARCH_VIGNETTES_KEY;
    const data = localStorage.getItem(key);
    const list: VignetteAnswerRecord[] = data ? JSON.parse(data) : [];
    if (stage) {
      return list.filter(v => v.stage === stage);
    }
    return list;
  }

  public saveVignetteAnswer(record: VignetteAnswerRecord) {
    const key = record.isDemo ? DEMO_VIGNETTES_KEY : RESEARCH_VIGNETTES_KEY;
    const list = this.getVignetteAnswers(record.isDemo);
    const existingIndex = list.findIndex(v => v.participantId === record.participantId && v.caseId === record.caseId);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(key, JSON.stringify(list));
  }

  public scoreVignette(
    isDemo: boolean,
    vignetteId: string,
    assessorNumber: 1 | 2,
    score: VignetteScoreBreakdown
  ) {
    const key = isDemo ? DEMO_VIGNETTES_KEY : RESEARCH_VIGNETTES_KEY;
    const list = this.getVignetteAnswers(isDemo);
    const item = list.find(v => v.id === vignetteId);
    if (item) {
      if (assessorNumber === 1) {
        item.assessor1Score = score;
      } else {
        item.assessor2Score = score;
      }
      // compute resolved score
      const s1 = item.assessor1Score?.totalScore;
      const s2 = item.assessor2Score?.totalScore;
      if (s1 !== undefined && s2 !== undefined) {
        item.finalResolvedScore = Number(((s1 + s2) / 2).toFixed(2));
      } else if (s1 !== undefined) {
        item.finalResolvedScore = s1;
      } else if (s2 !== undefined) {
        item.finalResolvedScore = s2;
      }
      localStorage.setItem(key, JSON.stringify(list));
    }
  }

  public clearResearchData() {
    localStorage.removeItem(RESEARCH_PARTICIPANTS_KEY);
    localStorage.removeItem(RESEARCH_QUESTIONNAIRES_KEY);
    localStorage.removeItem(RESEARCH_AI_INTERACTIONS_KEY);
    localStorage.removeItem(RESEARCH_VIGNETTES_KEY);
  }
}

export const researchStore = new ResearchStore();
