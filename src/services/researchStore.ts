import {
  Participant,
  QuestionnaireResponse,
  ClinicalCase,
  ParticipantClinicalCase,
  AiInteractionRecord,
  VignetteAnswerRecord,
  ResearchProtocolSettings,
  VignetteScoreBreakdown,
  CaseStage,
  ParticipantSessionSnapshot,
  RecruitmentTokenValidation,
  ResearchEventType,
  ResearchTeamMember,
  ResearcherPortalDataset
} from '../types';
import { PARTICIPANT_DEMO_CASES } from '../data/participantCases';
import {
  supabaseResearchService,
  EnrollParticipantInput,
  SubmitQuestionnaireInput,
  SubmitAiInteractionInput,
  SubmitVignetteAnswerInput,
  SubmitAssessorScoreInput,
  CaseTimerOpenResult
} from './supabaseResearchService';

const DEMO_PARTICIPANTS_KEY = 'carl_demo_participants_v6';
const DEMO_QUESTIONNAIRES_KEY = 'carl_demo_questionnaires_v6';
const DEMO_AI_INTERACTIONS_KEY = 'carl_demo_ai_interactions_v6';
const DEMO_VIGNETTES_KEY = 'carl_demo_vignettes_v6';

const PROTOCOL_SETTINGS_KEY = 'carl_protocol_settings_v6';
const CASES_KEY = 'carl_clinical_cases_v6';

const DEFAULT_SETTINGS: ResearchProtocolSettings = {
  requireParticipantConsent: true,
  institutionName: 'Department of Medicine, Academic Medical College',
  protocolNumber: 'IEC/2026/RES-AI-884',
  primaryInvestigator: 'Dr. Research Fellow & Guide',
  dataRetentionMonths: 24,
  allowDemoToggle: true
};

class ResearchStore {
  private adminCases: ClinicalCase[] = [];
  private adminLoaded = false;
  private adminLoadPromise: Promise<void> | null = null;
  private settings: ResearchProtocolSettings = DEFAULT_SETTINGS;

  constructor() {
    this.initSettings();
  }

  private initSettings() {
    try {
      const storedSettings = localStorage.getItem(PROTOCOL_SETTINGS_KEY);
      if (storedSettings) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
      } else {
        localStorage.setItem(PROTOCOL_SETTINGS_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.warn('Settings storage init fallback to memory', e);
    }
  }

  /**
   * Lazily loads full researcher datasets (clinicalCases with answer keys + synthetic 40-doctor cohort)
   * using dynamic imports so answer keys and rubrics are NEVER bundled into the participant entry chunk.
   */
  public async ensureDemoAdminLoaded(): Promise<void> {
    if (this.adminLoaded) return;
    if (this.adminLoadPromise) return this.adminLoadPromise;

    this.adminLoadPromise = (async () => {
      const [{ INITIAL_CLINICAL_CASES }, { generateSeedDemoData }] = await Promise.all([
        import('../data/clinicalCases'),
        import('../data/seedDemoData')
      ]);

      try {
        const storedCases = localStorage.getItem(CASES_KEY);
        if (storedCases) {
          const parsed: ClinicalCase[] = JSON.parse(storedCases);
          this.adminCases = parsed.map(stored => {
            const baseline = INITIAL_CLINICAL_CASES.find(ic => ic.id === stored.id);
            return baseline
              ? {
                  ...stored,
                  clinicalImages: stored.clinicalImages ?? baseline.clinicalImages
                }
              : stored;
          });
          localStorage.setItem(CASES_KEY, JSON.stringify(this.adminCases));
        } else {
          this.adminCases = INITIAL_CLINICAL_CASES;
          localStorage.setItem(CASES_KEY, JSON.stringify(this.adminCases));
        }

        const demoP = localStorage.getItem(DEMO_PARTICIPANTS_KEY);
        if (!demoP) {
          const seed = generateSeedDemoData();
          localStorage.setItem(DEMO_PARTICIPANTS_KEY, JSON.stringify(seed.participants));
          localStorage.setItem(DEMO_QUESTIONNAIRES_KEY, JSON.stringify(seed.questionnaireResponses));
          localStorage.setItem(DEMO_AI_INTERACTIONS_KEY, JSON.stringify(seed.aiInteractions));
          localStorage.setItem(DEMO_VIGNETTES_KEY, JSON.stringify(seed.vignetteAnswers));
        }
      } catch (e) {
        console.warn('Demo admin storage init fallback to memory', e);
        this.adminCases = INITIAL_CLINICAL_CASES;
      }

      this.adminLoaded = true;
    })();

    return this.adminLoadPromise;
  }

  public async resetDemoData(): Promise<void> {
    const { generateSeedDemoData } = await import('../data/seedDemoData');
    const seed = generateSeedDemoData();
    localStorage.setItem(DEMO_PARTICIPANTS_KEY, JSON.stringify(seed.participants));
    localStorage.setItem(DEMO_QUESTIONNAIRES_KEY, JSON.stringify(seed.questionnaireResponses));
    localStorage.setItem(DEMO_AI_INTERACTIONS_KEY, JSON.stringify(seed.aiInteractions));
    localStorage.setItem(DEMO_VIGNETTES_KEY, JSON.stringify(seed.vignetteAnswers));
  }

  // --- PROTOCOL & PARTICIPANT-SAFE CASES ---
  public getSettings(): ResearchProtocolSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<ResearchProtocolSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(PROTOCOL_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  /**
   * Participant-safe case stimuli (zero gold standards, zero misleading flags, zero rubrics).
   */
  public getParticipantCases(stage?: CaseStage): ParticipantClinicalCase[] {
    if (stage) {
      return PARTICIPANT_DEMO_CASES.filter(c => c.stage === stage);
    }
    return [...PARTICIPANT_DEMO_CASES];
  }

  /**
   * Full researcher case records (populated only after ensureDemoAdminLoaded()).
   */
  public getCases(stage?: CaseStage): ClinicalCase[] {
    if (stage) {
      return this.adminCases.filter(c => c.stage === stage);
    }
    return [...this.adminCases];
  }

  public updateCase(updatedCase: ClinicalCase) {
    this.adminCases = this.adminCases.map(c => (c.id === updatedCase.id ? updatedCase : c));
    localStorage.setItem(CASES_KEY, JSON.stringify(this.adminCases));
  }

  // --- DEMO MODE LOCAL STORAGE (Partitioned from Live Research Mode) ---
  public getParticipants(isDemo: boolean): Participant[] {
    if (!isDemo) return [];
    const data = localStorage.getItem(DEMO_PARTICIPANTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  public saveParticipant(participant: Participant) {
    if (!participant.isDemo) {
      throw new Error('Live research participant records are saved directly to the research platform.');
    }
    const list = this.getParticipants(true);
    const existingIndex = list.findIndex(p => p.id === participant.id);
    if (existingIndex >= 0) {
      list[existingIndex] = participant;
    } else {
      list.push(participant);
    }
    localStorage.setItem(DEMO_PARTICIPANTS_KEY, JSON.stringify(list));
  }

  public getQuestionnaires(isDemo: boolean): QuestionnaireResponse[] {
    if (!isDemo) return [];
    const data = localStorage.getItem(DEMO_QUESTIONNAIRES_KEY);
    return data ? JSON.parse(data) : [];
  }

  public saveQuestionnaire(resp: QuestionnaireResponse) {
    if (!resp.isDemo) {
      throw new Error('Live questionnaire responses are saved directly to the research platform.');
    }
    const list = this.getQuestionnaires(true);
    const existingIndex = list.findIndex(
      q => q.id === resp.id || q.participantId === resp.participantId
    );
    if (existingIndex >= 0) {
      list[existingIndex] = resp;
    } else {
      list.push(resp);
    }
    localStorage.setItem(DEMO_QUESTIONNAIRES_KEY, JSON.stringify(list));
  }

  public getAiInteractions(isDemo: boolean): AiInteractionRecord[] {
    if (!isDemo) return [];
    const data = localStorage.getItem(DEMO_AI_INTERACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  public saveAiInteraction(record: AiInteractionRecord) {
    if (!record.isDemo) {
      throw new Error('Live clinical case records are saved directly to the research platform.');
    }
    const list = this.getAiInteractions(true);
    const existingIndex = list.findIndex(
      r => r.participantId === record.participantId && r.caseId === record.caseId
    );
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(DEMO_AI_INTERACTIONS_KEY, JSON.stringify(list));
  }

  public getVignetteAnswers(isDemo: boolean, stage?: 'post_ai'): VignetteAnswerRecord[] {
    if (!isDemo) return [];
    const data = localStorage.getItem(DEMO_VIGNETTES_KEY);
    const list: VignetteAnswerRecord[] = data ? JSON.parse(data) : [];
    if (stage) {
      return list.filter(v => v.stage === stage);
    }
    return list;
  }

  public saveVignetteAnswer(record: VignetteAnswerRecord) {
    if (!record.isDemo) {
      throw new Error('Live vignette answers are saved directly to the research platform.');
    }
    const list = this.getVignetteAnswers(true);
    const existingIndex = list.findIndex(
      v => v.participantId === record.participantId && v.caseId === record.caseId
    );
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(DEMO_VIGNETTES_KEY, JSON.stringify(list));
  }

  public scoreVignette(
    isDemo: boolean,
    vignetteId: string,
    assessorNumber: 1 | 2,
    score: VignetteScoreBreakdown
  ) {
    if (!isDemo) return;
    const list = this.getVignetteAnswers(true);
    const item = list.find(v => v.id === vignetteId);
    if (item) {
      if (assessorNumber === 1) {
        item.assessor1Score = score;
      } else {
        item.assessor2Score = score;
      }
      const s1 = item.assessor1Score?.totalScore;
      const s2 = item.assessor2Score?.totalScore;
      if (s1 !== undefined && s2 !== undefined) {
        item.finalResolvedScore = Number(((s1 + s2) / 2).toFixed(2));
      } else if (s1 !== undefined) {
        item.finalResolvedScore = s1;
      } else if (s2 !== undefined) {
        item.finalResolvedScore = s2;
      }
      localStorage.setItem(DEMO_VIGNETTES_KEY, JSON.stringify(list));
    }
  }

  // --- LIVE RESEARCH MODE (SUPABASE) ---
  public isLiveSupabaseAvailable(): boolean {
    return supabaseResearchService.isConfigured();
  }

  public getSupabaseConfigError(): string | null {
    return supabaseResearchService.getConfigError();
  }

  public validateReferralToken(token: string): Promise<RecruitmentTokenValidation> {
    return supabaseResearchService.validateRecruitmentToken(token);
  }

  public restoreLiveSession(): Promise<ParticipantSessionSnapshot | null> {
    return supabaseResearchService.restoreParticipantSession();
  }

  public loadLiveParticipantCases(): Promise<ParticipantClinicalCase[]> {
    return supabaseResearchService.fetchPublishedParticipantCases();
  }

  public enrollLiveParticipant(input: EnrollParticipantInput): Promise<Participant> {
    return supabaseResearchService.enrollParticipant(input);
  }

  public submitLiveQuestionnaire(input: SubmitQuestionnaireInput): Promise<QuestionnaireResponse> {
    return supabaseResearchService.submitQuestionnaire(input);
  }

  public openLiveCaseSession(participantId: string, caseId: string): Promise<CaseTimerOpenResult> {
    return supabaseResearchService.openStudyCase(participantId, caseId);
  }

  public heartbeatLiveCaseTimer(
    participantId: string,
    caseId: string,
    deltaSeconds: number
  ): Promise<number> {
    return supabaseResearchService.heartbeatCaseTimer(participantId, caseId, deltaSeconds);
  }

  public logLiveCdssFollowup(
    participantId: string,
    caseId: string,
    suggestionId: 'followup_1' | 'followup_2'
  ): Promise<string> {
    return supabaseResearchService.logCdssFollowup(participantId, caseId, suggestionId);
  }

  public submitLiveAiInteraction(input: SubmitAiInteractionInput): Promise<AiInteractionRecord> {
    return supabaseResearchService.submitAiInteraction(input);
  }

  public completeLiveCdssStage(participantId: string): Promise<string> {
    return supabaseResearchService.completeCdssStage(participantId);
  }

  public submitLiveVignetteAnswer(input: SubmitVignetteAnswerInput): Promise<VignetteAnswerRecord> {
    return supabaseResearchService.submitVignetteAnswer(input);
  }

  public completeLiveVignetteStage(participantId: string): Promise<string> {
    return supabaseResearchService.completeVignetteStage(participantId);
  }

  public refreshLiveParticipant(participantId: string): Promise<Participant | null> {
    return supabaseResearchService.fetchOwnParticipant(participantId);
  }

  public logLiveEvent(input: {
    participantId: string;
    eventType: ResearchEventType;
    stage?: number;
    caseId?: string;
    payload?: Record<string, unknown>;
    clientTimestamp?: string;
  }): Promise<string | null> {
    return supabaseResearchService.logResearchEvent(input);
  }

  public startFreshAnonymousParticipantSession(): Promise<string> {
    return supabaseResearchService.startFreshAnonymousParticipantSession();
  }

  public resetLiveParticipantSession(): Promise<void> {
    return supabaseResearchService.resetParticipantAuthSession();
  }

  public getAuthSessionType(): Promise<'none' | 'anonymous_participant' | 'authenticated_user'> {
    return supabaseResearchService.getSessionType();
  }

  public getAuthenticatedTeamMember(): Promise<ResearchTeamMember | null> {
    return supabaseResearchService.getAuthenticatedTeamMember();
  }

  public signInTeamMember(email: string, password: string): Promise<ResearchTeamMember> {
    return supabaseResearchService.signInTeamMember(email, password);
  }

  public signInPortalTeamMember(
    email: string,
    password: string,
    portal: 'pi' | 'researcher'
  ): Promise<ResearchTeamMember> {
    return supabaseResearchService.signInPortalTeamMember(email, password, portal);
  }

  public fetchPermittedRecruitmentLinks() {
    return supabaseResearchService.fetchPermittedRecruitmentLinks();
  }

  public signOutTeamMember(): Promise<void> {
    return supabaseResearchService.signOutTeamMember();
  }

  public fetchResearcherPortalDataset(member: ResearchTeamMember): Promise<ResearcherPortalDataset> {
    return supabaseResearchService.fetchResearcherPortalDataset(member);
  }

  public submitLiveAssessorScore(input: SubmitAssessorScoreInput): Promise<string> {
    return supabaseResearchService.submitAssessorScore(input);
  }

  public piAdjudicateLiveVignette(vignetteAnswerId: string, adjudicatedScore: number): Promise<void> {
    return supabaseResearchService.piAdjudicateVignette(vignetteAnswerId, adjudicatedScore);
  }
}

export const researchStore = new ResearchStore();
