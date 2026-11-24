import { AiInteractionRecord, ClinicalCase, ParticipantClinicalCase } from '../types';

export interface CanonicalCdssOption {
  optionId: string;
  originalIndex: number;
  text: string;
  isOther: boolean;
}

export interface CdssDisplayedOption {
  optionId: string;
  label: string;
  text: string;
  isOther?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function normalizeText(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase();
}

/**
 * Deterministic 32-bit FNV-1a hash used purely for reproducible per-participant
 * MCQ option order randomization.
 */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 deterministic PRNG.
 */
function createPrng(seedNum: number): () => number {
  let state = seedNum || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Maps the canonical mcqOptions array of a CDSS case to stable canonical option IDs:
 * - 'Other' -> 'opt_other'
 * - Non-'Other' items at canonical index i -> 'opt_${i + 1}' (e.g., 'opt_1'..'opt_4')
 */
export function getCanonicalCdssOptions(mcqOptions: string[]): CanonicalCdssOption[] {
  return (mcqOptions || []).map((text, index) => {
    const isOther = normalizeText(text) === 'other';
    return {
      optionId: isOther ? 'opt_other' : `opt_${index + 1}`,
      originalIndex: index,
      text,
      isOther,
    };
  });
}

/**
 * Produces the deterministic per-participant, per-case shuffled option display order.
 * Clinical options are shuffled via Fisher-Yates using `${participantId}::${caseId}`,
 * while 'Other' is always kept at the end.
 */
export function buildDisplayedCdssOptions(
  participantId: string,
  caseId: string,
  mcqOptions: string[]
): CdssDisplayedOption[] {
  const canonical = getCanonicalCdssOptions(mcqOptions);
  const clinicalOptions = canonical.filter(opt => !opt.isOther);
  const otherOptions = canonical.filter(opt => opt.isOther);

  const rand = createPrng(hashSeed(`${participantId}::${caseId}`));
  const shuffled = [...clinicalOptions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const ordered = [...shuffled, ...otherOptions];
  return ordered.map((opt, displayIdx) => ({
    optionId: opt.optionId,
    label: OPTION_LETTERS[displayIdx] || String(displayIdx + 1),
    text: opt.text,
    isOther: opt.isOther,
  }));
}

/**
 * Resolves the canonical optionId for a participant's submitted finalDiagnosis text.
 */
export function resolveOptionIdFromDiagnosis(
  mcqOptions: string[],
  finalDiagnosis: string | undefined | null
): string {
  const canonical = getCanonicalCdssOptions(mcqOptions);
  const norm = normalizeText(finalDiagnosis);
  if (!norm) return '';
  const match = canonical.find(opt => normalizeText(opt.text) === norm);
  if (match) return match.optionId;
  const otherOpt = canonical.find(opt => opt.isOther);
  return otherOpt ? otherOpt.optionId : 'opt_other';
}

/**
 * Resolves the authoritative gold-standard optionId from the case's answer key
 * (never hardcoding position assumptions).
 */
export function resolveGoldStandardOptionId(
  c: Pick<ClinicalCase, 'mcqOptions' | 'goldStandardDiagnosis'>
): string | null {
  if (!c.goldStandardDiagnosis) return null;
  const canonical = getCanonicalCdssOptions(c.mcqOptions);
  const normGold = normalizeText(c.goldStandardDiagnosis);
  const match = canonical.find(opt => normalizeText(opt.text) === normGold);
  return match ? match.optionId : null;
}

/**
 * Evaluates whether an AI interaction matched the authoritative gold standard
 * (via exact gold standard diagnosis, acceptable alternatives, or canonical gold optionId).
 */
export function evaluateMatchedGoldStandard(
  record: Pick<AiInteractionRecord, 'finalDiagnosis' | 'selectedOptionId' | 'matchedGoldStandard'>,
  clinicalCase: Pick<
    ClinicalCase,
    'mcqOptions' | 'goldStandardDiagnosis' | 'acceptableAlternativeDiagnoses'
  > | undefined
): boolean {
  if (typeof record.matchedGoldStandard === 'boolean') {
    return record.matchedGoldStandard;
  }
  if (!clinicalCase || !clinicalCase.goldStandardDiagnosis) {
    return false;
  }
  const goldOptionId = resolveGoldStandardOptionId(clinicalCase);
  if (record.selectedOptionId && goldOptionId && record.selectedOptionId === goldOptionId) {
    return true;
  }
  const normFinal = normalizeText(record.finalDiagnosis);
  if (!normFinal) return false;
  if (normFinal === normalizeText(clinicalCase.goldStandardDiagnosis)) {
    return true;
  }
  return (clinicalCase.acceptableAlternativeDiagnoses || []).some(
    alt => normalizeText(alt) === normFinal
  );
}

/**
 * Resolves the effective displayed option order for a record (preferring stored order,
 * falling back to deterministic per-participant reconstruction).
 */
export function getEffectiveDisplayedOrder(
  record: Pick<AiInteractionRecord, 'participantId' | 'caseId' | 'displayedOptionOrder'>,
  clinicalCase: Pick<ParticipantClinicalCase, 'id' | 'mcqOptions'> | undefined
): CdssDisplayedOption[] {
  if (record.displayedOptionOrder && record.displayedOptionOrder.length > 0) {
    return record.displayedOptionOrder;
  }
  if (!clinicalCase) return [];
  return buildDisplayedCdssOptions(record.participantId, record.caseId, clinicalCase.mcqOptions);
}
