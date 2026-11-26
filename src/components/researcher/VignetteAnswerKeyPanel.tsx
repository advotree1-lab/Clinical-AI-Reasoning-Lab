import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, KeyRound, History } from 'lucide-react';
import {
  ClinicalCase,
  Participant,
  ResearcherOperationalParticipant,
  VignetteAnswerRecord
} from '../../types';
import {
  getCanonicalVignetteOptions,
  resolveVignetteComparisonView,
  resolveVignetteGoldStandardOptionId,
  shouldShuffleVignetteOptions
} from '../../utils/vignetteOptions';

interface VignetteAnswerKeyPanelProps {
  participants: Participant[];
  operationalParticipants: ResearcherOperationalParticipant[];
  vignetteAnswers: VignetteAnswerRecord[];
  cases: ClinicalCase[];
  isPiOrDemo: boolean;
}

export const VignetteAnswerKeyPanel: React.FC<VignetteAnswerKeyPanelProps> = ({
  participants,
  operationalParticipants,
  vignetteAnswers,
  cases,
  isPiOrDemo
}) => {
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [matchFilter, setMatchFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const postCases = useMemo(
    () =>
      cases
        .filter(c => c.stage === 'post_ai')
        .sort((a, b) => a.caseNumber - b.caseNumber),
    [cases]
  );

  const caseById = useMemo(() => {
    const map = new Map<string, ClinicalCase>();
    postCases.forEach(c => map.set(c.id, c));
    return map;
  }, [postCases]);

  const participantCodeById = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach(p => map.set(p.id, p.code));
    operationalParticipants.forEach(op => {
      if (!map.has(op.participantId)) {
        map.set(op.participantId, op.code);
      }
    });
    return map;
  }, [participants, operationalParticipants]);

  const participantOptions = useMemo(() => {
    const idsWithAnswers = new Set(vignetteAnswers.map(v => v.participantId));
    const list: { id: string; code: string }[] = [];
    idsWithAnswers.forEach(id => {
      list.push({
        id,
        code: participantCodeById.get(id) || `ID-${id.slice(0, 8)}`
      });
    });
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [vignetteAnswers, participantCodeById]);

  const evaluatedRows = useMemo(() => {
    return vignetteAnswers
      .filter(v => {
        if (selectedParticipantId !== 'all' && v.participantId !== selectedParticipantId) {
          return false;
        }
        if (selectedCaseId !== 'all' && v.caseId !== selectedCaseId) {
          return false;
        }
        return true;
      })
      .map(record => {
        const clinicalCase = caseById.get(record.caseId);
        const comparison = resolveVignetteComparisonView(record, clinicalCase);
        const participantCode =
          participantCodeById.get(record.participantId) ||
          `ID-${record.participantId.slice(0, 8)}`;
        return {
          record,
          clinicalCase,
          comparison,
          participantCode
        };
      })
      .filter(item => {
        if (matchFilter === 'correct') return item.comparison.isCorrect;
        if (matchFilter === 'incorrect') return !item.comparison.isCorrect;
        return true;
      })
      .sort((a, b) => {
        const codeCmp = a.participantCode.localeCompare(b.participantCode);
        if (codeCmp !== 0) return codeCmp;
        return (a.clinicalCase?.caseNumber ?? 99) - (b.clinicalCase?.caseNumber ?? 99);
      });
  }, [
    vignetteAnswers,
    selectedParticipantId,
    selectedCaseId,
    matchFilter,
    caseById,
    participantCodeById
  ]);

  const totalShown = evaluatedRows.length;
  const correctCount = evaluatedRows.filter(r => r.comparison.isCorrect).length;
  const legacyCount = evaluatedRows.filter(r => r.comparison.isLegacyRecord).length;

  return (
    <div className="space-y-6">
      {/* Authoritative Vignette 1–6 Answer Key Reference Cards */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 uppercase">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Authoritative Clinical Vignette Answer Keys (Vignettes 1–6)</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Vignette 1 preserves fixed canonical option ordering. Vignettes 2–6 shuffle deterministically per participant while preserving exact answer-key mapping by Option ID.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 shrink-0 tabular-nums">
            {postCases.length} Vignettes
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {postCases.map(c => {
            const canonical = getCanonicalVignetteOptions(c.mcqOptions);
            const goldOptId = resolveVignetteGoldStandardOptionId(c);
            const isShuffled = shouldShuffleVignetteOptions(c.id, c.caseNumber);

            return (
              <div
                key={c.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900">
                    Vignette {c.caseNumber}
                  </span>
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 bg-white text-slate-700">
                    {isShuffled ? 'Per-Participant Shuffled (A–D)' : 'Fixed Canonical Order'}
                  </span>
                </div>

                {c.goldStandardDiagnosis ? (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <span className="font-mono text-[10px] font-bold uppercase text-emerald-800 block mb-0.5">
                      Authoritative Correct Answer {goldOptId ? `[${goldOptId}]` : ''}
                    </span>
                    <span className="font-semibold leading-snug block">
                      {c.goldStandardDiagnosis}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    Answer key metadata unavailable in current database response. Apply the latest SQL migration to enable full Vignette Answer Key lookup.
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Canonical Options
                  </div>
                  {canonical.map((opt, idx) => {
                    const isGold = goldOptId === opt.optionId;
                    return (
                      <div
                        key={opt.optionId}
                        className={`p-2 rounded border text-[11px] flex items-start gap-2 ${
                          isGold
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                          {idx + 1}. [{opt.optionId}]
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Participant Selected Option vs Authoritative Key Comparison Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Vignette Participant Selection vs. Authoritative Answer Key ({totalShown})
            </h3>
            <p className="text-xs text-slate-500">
              {isPiOrDemo
                ? 'Displays exact letter seen by each participant, authoritative key position in their randomized layout, canonical wording, and legacy record status.'
                : 'Scoped to your recruited participants. Displays participant vignette diagnosis selections, displayed option order, and authoritative answer-key match.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-semibold tabular-nums">
              Correct: {correctCount} / {totalShown}
            </span>
            {legacyCount > 0 && (
              <span className="px-2.5 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 font-mono font-semibold tabular-nums">
                Legacy Pre-Shuffle: {legacyCount}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Participant</label>
            <select
              value={selectedParticipantId}
              onChange={e => setSelectedParticipantId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              <option value="all">All Participants ({participantOptions.length})</option>
              {participantOptions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vignette</label>
            <select
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              <option value="all">All Vignettes (1–6)</option>
              {postCases.map(c => (
                <option key={c.id} value={c.id}>
                  Vignette {c.caseNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Answer Match</label>
            <select
              value={matchFilter}
              onChange={e => setMatchFilter(e.target.value as typeof matchFilter)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              <option value="all">All Responses</option>
              <option value="correct">Correct Only</option>
              <option value="incorrect">Incorrect Only</option>
            </select>
          </div>
        </div>

        {evaluatedRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            No vignette responses match the selected filters yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="p-3 font-semibold whitespace-nowrap">Participant</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Vignette</th>
                  <th className="p-3 font-semibold">Participant Selected Answer</th>
                  <th className="p-3 font-semibold">Correct Answer (Authoritative Key)</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Result</th>
                  <th className="p-3 font-semibold text-right whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluatedRows.slice(0, 240).map(({ record, clinicalCase, comparison, participantCode }) => {
                  const isExpanded = expandedRowId === record.id;
                  return (
                    <React.Fragment key={record.id}>
                      <tr className="hover:bg-slate-50/70 align-top">
                        <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {participantCode}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            Vignette {clinicalCase?.caseNumber ?? record.caseId}
                          </div>
                        </td>
                        <td className="p-3 max-w-sm">
                          {comparison.isLegacyRecord ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                                <History className="w-3 h-3" />
                                <span>Legacy Pre-Shuffle</span>
                              </span>
                              <div className="text-slate-900 font-medium leading-snug">
                                {comparison.selectedText}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {comparison.selectedOptionLabel && (
                                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                    Option {comparison.selectedOptionLabel}
                                  </span>
                                )}
                                {comparison.selectedOptionId && (
                                  <span className="font-mono text-[10px] text-slate-500">
                                    [{comparison.selectedOptionId}]
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-900 font-medium leading-snug">
                                {comparison.selectedText}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 max-w-sm">
                          {comparison.goldText ? (
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {comparison.isLegacyRecord ? (
                                  <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
                                    Canonical #1
                                  </span>
                                ) : comparison.goldOptionLabel ? (
                                  <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[10px]">
                                    Option {comparison.goldOptionLabel}
                                  </span>
                                ) : null}
                                {comparison.goldOptionId && (
                                  <span className="font-mono text-[10px] text-slate-500">
                                    [{comparison.goldOptionId}]
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-800 leading-snug">
                                {comparison.goldText}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {comparison.goldText ? (
                            comparison.isCorrect ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Correct</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-800 border-rose-200">
                                <XCircle className="w-3 h-3" />
                                <span>Incorrect</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedRowId(prev => (prev === record.id ? null : record.id))}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-medium text-slate-700 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={6} className="p-4 border-t border-slate-200">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-[11px]">
                              {/* Actual Displayed Order Presented to Participant */}
                              <div className="space-y-2">
                                <div className="font-mono font-bold text-slate-800 uppercase">
                                  {comparison.isLegacyRecord
                                    ? 'Historical Pre-Shuffle Submission'
                                    : comparison.isShuffledCase
                                    ? `Actual Shuffled Order Presented to ${participantCode}`
                                    : `Fixed Option Order Presented to ${participantCode}`}
                                </div>

                                {comparison.isLegacyRecord ? (
                                  <div className="p-3 rounded border border-amber-200 bg-amber-50/70 text-amber-950 leading-relaxed">
                                    Submitted prior to the Vignette 2–6 option update and per-participant randomization. Stored diagnosis text (<strong>{comparison.selectedText}</strong>) is preserved verbatim without retroactively assigning Option A–D letters.
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {comparison.displayedOrder.map(opt => {
                                      const isSelected = comparison.selectedOptionId === opt.optionId;
                                      const isGold = comparison.goldOptionId === opt.optionId;
                                      return (
                                        <div
                                          key={opt.optionId}
                                          className={`p-2 rounded border flex items-start gap-2 ${
                                            isSelected && isGold
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                              : isSelected
                                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                                              : isGold
                                              ? 'bg-teal-50 border-teal-200 text-teal-950'
                                              : 'bg-white border-slate-200 text-slate-700'
                                          }`}
                                        >
                                          <span className="font-mono font-bold shrink-0">
                                            Option {opt.label}
                                          </span>
                                          <div className="min-w-0">
                                            <div className="font-medium leading-snug">{opt.text}</div>
                                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                                              [{opt.optionId}]
                                              {isSelected ? ' · Participant Selected' : ''}
                                              {isGold ? ' · Authoritative Key' : ''}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Canonical Option Reference */}
                              <div className="space-y-2">
                                <div className="font-mono font-bold text-slate-800 uppercase">
                                  Original Canonical Option Wording (Vignette {clinicalCase?.caseNumber ?? record.caseId})
                                </div>
                                <div className="space-y-1.5">
                                  {comparison.canonicalOptions.map((opt, idx) => {
                                    const isGold = comparison.goldOptionId === opt.optionId;
                                    return (
                                      <div
                                        key={opt.optionId}
                                        className={`p-2 rounded border flex items-start gap-2 ${
                                          isGold
                                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                            : 'bg-white border-slate-200 text-slate-700'
                                        }`}
                                      >
                                        <span className="font-mono font-bold shrink-0 text-slate-500">
                                          #{idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <div className="font-medium leading-snug">{opt.text}</div>
                                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                                            [{opt.optionId}]
                                            {isGold ? ' · Correct Answer' : ''}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
