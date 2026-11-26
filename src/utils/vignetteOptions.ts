import {
  CdssOptionOrderItem,
  ClinicalCase,
  ParticipantClinicalCase,
  VignetteAnswerRecord
} from '../types';

export interface CanonicalVignetteOption {
  optionId: string;
  originalIndex: number;
  text: string;
  isOther: boolean;
}

export interface VignetteComparisonResult {
  isShuffledCase: boolean;
  isLegacyRecord: boolean;
  isCorrect: boolean;
  selectedOptionId: string | null;
  selectedOptionLabel: string | null;
  selectedText: string;
  goldOptionId: string | null;
  goldOptionLabel: string | null;
  goldText: string;
  displayedOrder: CdssOptionOrderItem[];
  canonicalOptions: CanonicalVignetteOption[];
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function normalizeText(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase();
}

/**
 * Deterministic 32-bit FNV-1a hash for reproducible per-participant
 * Vignette 2-6 option shuffling.
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
 * Vignette 1 (post-01 — Cardiology) is strictly preserved in its fixed canonical order.
 * Vignettes 2-6 (post-02..post-06) are deterministically shuffled per participant.
 */
export function shouldShuffleVignetteOptions(caseId: string, caseNumber?: number): boolean {
  if (caseId === 'post-01' || caseNumber === 1) {
    return false;
  }
  return true;
}

/**
 * Maps the canonical mcqOptions array of a vignette case to stable option IDs:
 * - 'Other' -> 'opt_other'
 * - Non-'Other' items at canonical index i -> 'opt_${i + 1}' (e.g. 'opt_1'..'opt_4')
 */
export function getCanonicalVignetteOptions(mcqOptions: string[]): CanonicalVignetteOption[] {
  return (mcqOptions || []).map((text, index) => {
    const isOther = normalizeText(text) === 'other';
    return {
      optionId: isOther ? 'opt_other' : `opt_${index + 1}`,
      originalIndex: index,
      text,
      isOther
    };
  });
}

/**
 * Produces the displayed MCQ options for a vignette case.
 * - Vignette 1 (post-01): Returns fixed canonical order (no shuffling).
 * - Vignettes 2-6: Deterministically shuffles options using `${participantId}::${caseId}::vignette`.
 */
export function buildDisplayedVignetteOptions(
  participantId: string,
  caseId: string,
  mcqOptions: string[],
  caseNumber?: number
): CdssOptionOrderItem[] {
  const canonical = getCanonicalVignetteOptions(mcqOptions);

  if (!shouldShuffleVignetteOptions(caseId, caseNumber)) {
    return canonical.map((opt, displayIdx) => ({
      optionId: opt.optionId,
      label: OPTION_LETTERS[displayIdx] || String(displayIdx + 1),
      text: opt.text,
      isOther: opt.isOther
    }));
  }

  const clinicalOptions = canonical.filter(opt => !opt.isOther);
  const otherOptions = canonical.filter(opt => opt.isOther);

  const rand = createPrng(hashSeed(`${participantId}::${caseId}::vignette`));
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
    isOther: opt.isOther
  }));
}

/**
 * Resolves canonical optionId from submitted mostLikelyDiagnosis text against canonical mcqOptions.
 * Returns '' if no match and no 'Other' option exists (e.g., legacy responses under superseded options).
 */
export function resolveVignetteOptionIdFromDiagnosis(
  mcqOptions: string[],
  diagnosis: string | undefined | null
): string {
  const canonical = getCanonicalVignetteOptions(mcqOptions);
  const norm = normalizeText(diagnosis);
  if (!norm) return '';
  const match = canonical.find(opt => normalizeText(opt.text) === norm);
  if (match) return match.optionId;
  const otherOpt = canonical.find(opt => opt.isOther);
  return otherOpt ? otherOpt.optionId : '';
}

/**
 * Resolves the authoritative gold-standard optionId from the case's answer key.
 */
export function resolveVignetteGoldStandardOptionId(
  c: Pick<ClinicalCase, 'mcqOptions' | 'goldStandardDiagnosis'> | undefined
): string | null {
  if (!c || !c.goldStandardDiagnosis) return null;
  const canonical = getCanonicalVignetteOptions(c.mcqOptions);
  const normGold = normalizeText(c.goldStandardDiagnosis);
  const match = canonical.find(opt => normalizeText(opt.text) === normGold);
  return match ? match.optionId : null;
}

/**
 * Identifies historical vignette records submitted prior to the Vignette 2-6 option/shuffle schema.
 * Legacy rows must NEVER be reinterpreted with the new shuffled order.
 */
export function isLegacyVignetteRecord(
  record: Pick<VignetteAnswerRecord, 'selectedOptionId' | 'displayedOptionOrder'>
): boolean {
  return (
    !record.selectedOptionId &&
    (!record.displayedOptionOrder || record.displayedOptionOrder.length === 0)
  );
}

/**
 * Evaluates primary-diagnosis correctness for a vignette submission:
 * - If selectedOptionId is stored (non-legacy): matches against authoritative goldOptionId
 *   (or acceptable alternative text if Vignette 1 'Other' was typed).
 * - If legacy record (no selectedOptionId / displayedOptionOrder): compares stored
 *   mostLikelyDiagnosis text strictly against goldStandardDiagnosis / acceptableAlternativeDiagnoses
 *   without assuming new positional letters.
 */
export function evaluateVignetteDiagnosisCorrectness(
  record: Pick<
    VignetteAnswerRecord,
    'mostLikelyDiagnosis' | 'selectedOptionId' | 'displayedOptionOrder'
  >,
  clinicalCase:
    | Pick<
        ClinicalCase,
        'id' | 'caseNumber' | 'mcqOptions' | 'goldStandardDiagnosis' | 'acceptableAlternativeDiagnoses'
      >
    | undefined
): boolean {
  if (!clinicalCase || !clinicalCase.goldStandardDiagnosis) {
    return false;
  }

  const goldOptionId = resolveVignetteGoldStandardOptionId(clinicalCase);
  const normSubmitted = normalizeText(record.mostLikelyDiagnosis);
  const normGold = normalizeText(clinicalCase.goldStandardDiagnosis);

  if (record.selectedOptionId) {
    if (goldOptionId && record.selectedOptionId === goldOptionId) {
      return true;
    }
    if (record.selectedOptionId === 'opt_other' && normSubmitted) {
      if (normSubmitted === normGold) return true;
      return (clinicalCase.acceptableAlternativeDiagnoses || []).some(
        alt => normalizeText(alt) === normSubmitted
      );
    }
    return false;
  }

  if (!normSubmitted) return false;
  if (normSubmitted === normGold) return true;
  return (clinicalCase.acceptableAlternativeDiagnoses || []).some(
    alt => normalizeText(alt) === normSubmitted
  );
}

/**
 * Builds the complete PI / Researcher answer-key comparison payload for a vignette submission.
 */
export function resolveVignetteComparisonView(
  record: VignetteAnswerRecord,
  clinicalCase: ClinicalCase | undefined
): VignetteComparisonResult {
  const isShuffledCase = clinicalCase
    ? shouldShuffleVignetteOptions(clinicalCase.id, clinicalCase.caseNumber)
    : shouldShuffleVignetteOptions(record.caseId);

  const canonicalOptions = clinicalCase
    ? getCanonicalVignetteOptions(clinicalCase.mcqOptions)
    : [];
  const goldOptionId = resolveVignetteGoldStandardOptionId(clinicalCase);
  const goldText = clinicalCase?.goldStandardDiagnosis || '';
  const legacy = isShuffledCase && isLegacyVignetteRecord(record);

  let displayedOrder: CdssOptionOrderItem[] = [];
  if (record.displayedOptionOrder && record.displayedOptionOrder.length > 0) {
    displayedOrder = record.displayedOptionOrder;
  } else if (!legacy && clinicalCase) {
    displayedOrder = buildDisplayedVignetteOptions(
      record.participantId,
      record.caseId,
      clinicalCase.mcqOptions,
      clinicalCase.caseNumber
    );
  }

  const selectedOptionId =
    record.selectedOptionId ||
    (!legacy && clinicalCase
      ? resolveVignetteOptionIdFromDiagnosis(clinicalCase.mcqOptions, record.mostLikelyDiagnosis) || null
      : null);

  const selectedItem =
    selectedOptionId && displayedOrder.length > 0
      ? displayedOrder.find(item => item.optionId === selectedOptionId)
      : undefined;

  const goldItem =
    goldOptionId && displayedOrder.length > 0
      ? displayedOrder.find(item => item.optionId === goldOptionId)
      : undefined;

  const isCorrect = evaluateVignetteDiagnosisCorrectness(record, clinicalCase);

  return {
    isShuffledCase,
    isLegacyRecord: legacy,
    isCorrect,
    selectedOptionId,
    selectedOptionLabel: selectedItem?.label ?? null,
    selectedText: record.mostLikelyDiagnosis,
    goldOptionId,
    goldOptionLabel: goldItem?.label ?? (!isShuffledCase && goldOptionId === 'opt_1' ? 'A' : null),
    goldText,
    displayedOrder,
    canonicalOptions
  };
}

export function getEffectiveVignetteDisplayedOrder(
  record: Pick<VignetteAnswerRecord, 'participantId' | 'caseId' | 'selectedOptionId' | 'displayedOptionOrder'>,
  clinicalCase: Pick<ParticipantClinicalCase, 'id' | 'caseNumber' | 'mcqOptions'> | undefined
): CdssOptionOrderItem[] {
  if (record.displayedOptionOrder && record.displayedOptionOrder.length > 0) {
    return record.displayedOptionOrder;
  }
  if (!clinicalCase) return [];
  if (shouldShuffleVignetteOptions(clinicalCase.id, clinicalCase.caseNumber) && isLegacyVignetteRecord(record)) {
    return [];
  }
  return buildDisplayedVignetteOptions(
    record.participantId,
    record.caseId,
    clinicalCase.mcqOptions,
    clinicalCase.caseNumber
  );
}
