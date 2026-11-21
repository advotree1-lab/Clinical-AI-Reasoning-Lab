import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  Participant,
  QuestionnaireResponse,
  AiInteractionRecord,
  CdssFollowupEvent,
  ClinicalCase,
  ResearcherOperationalParticipant
} from '../../types';

interface OperationalParticipantsTableProps {
  participants: Participant[];
  operationalParticipants: ResearcherOperationalParticipant[];
  isPiOrDemo: boolean;
}

export const OperationalParticipantsTable: React.FC<OperationalParticipantsTableProps> = ({
  participants,
  operationalParticipants,
  isPiOrDemo
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const rows =
    isPiOrDemo && participants.length > 0
      ? participants.map(p => ({
          id: p.id,
          code: p.code,
          recruitmentSource: p.recruitmentSource || 'direct',
          researcherCode: p.researcherCode || 'Direct',
          currentStage: p.currentStage,
          completionStatus: p.completionStatus || (p.completed ? 'completed' : 'in_progress'),
          completed: p.completed,
          designation: p.designation === 'Other' && p.designationOther ? p.designationOther : p.designation,
          specialty: p.specialty === 'Other' && p.specialtyOther ? p.specialtyOther : p.specialty,
          questionnaireCompletedAt: p.questionnaireCompletedAt,
          cdssCompletedAt: p.cdssCompletedAt,
          vignettesCompletedAt: p.vignettesCompletedAt,
          lastActivityAt: p.lastActivityAt || p.createdAt,
          createdAt: p.createdAt
        }))
      : operationalParticipants.map(op => ({
          id: op.participantId,
          code: op.code,
          recruitmentSource: op.recruitmentSource,
          researcherCode: op.researcherCode || 'Direct',
          currentStage: op.currentStage,
          completionStatus: op.completionStatus,
          completed: op.completed,
          designation: null as string | null,
          specialty: null as string | null,
          questionnaireCompletedAt: null as string | null,
          cdssCompletedAt: null as string | null,
          vignettesCompletedAt: null as string | null,
          lastActivityAt: op.lastActivityAt,
          createdAt: op.createdAt
        }));

  const filtered = rows.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.completionStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.code.toLowerCase().includes(q) ||
      (r.researcherCode || '').toLowerCase().includes(q) ||
      (r.designation || '').toLowerCase().includes(q) ||
      (r.specialty || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const stageName = (dbStage: number, done: boolean) => {
    if (done || dbStage >= 7) return 'Completed (8/8)';
    if (dbStage === 4) return 'Survey (5/8)';
    if (dbStage === 5) return 'CDSS (6/8)';
    if (dbStage === 6) return 'Vignettes (7/8)';
    return `Stage ${dbStage}`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Enrolled Participants &amp; Study Progress ({filtered.length})
          </h3>
          <p className="text-xs text-slate-500">
            {isPiOrDemo
              ? 'Participant progression, demographics, and milestone timestamps.'
              : 'Operational status roster scoped to participants recruited via your team referral links (demographics and clinical answers masked per protocol RLS).'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search DOC code..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-none focus:border-teal-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="registered">Registered</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
          No matching participant records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-semibold">Participant Code</th>
                {isPiOrDemo && <th className="p-3 font-semibold">Designation &amp; Specialty</th>}
                <th className="p-3 font-semibold">Recruitment</th>
                <th className="p-3 font-semibold">Current Stage</th>
                <th className="p-3 font-semibold">Status</th>
                {isPiOrDemo && <th className="p-3 font-semibold">Milestones</th>}
                <th className="p-3 font-semibold">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-mono font-bold text-slate-900">{r.code}</td>
                  {isPiOrDemo && (
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{r.designation}</div>
                      <div className="text-[11px] text-slate-500">{r.specialty}</div>
                    </td>
                  )}
                  <td className="p-3 font-mono text-slate-700">
                    {r.recruitmentSource === 'team' ? r.researcherCode : 'Direct'}
                  </td>
                  <td className="p-3 text-slate-700">{stageName(r.currentStage, r.completed)}</td>
                  <td className="p-3 font-mono">
                    <span
                      className={
                        r.completionStatus === 'completed'
                          ? 'text-emerald-700 font-semibold'
                          : r.completionStatus === 'abandoned'
                          ? 'text-rose-700 font-semibold'
                          : 'text-teal-700 font-semibold'
                      }
                    >
                      {r.completionStatus}
                    </span>
                  </td>
                  {isPiOrDemo && (
                    <td className="p-3 font-mono text-[11px] text-slate-600">
                      Q: {r.questionnaireCompletedAt ? 'Done' : 'Pending'} · CDSS:{' '}
                      {r.cdssCompletedAt ? 'Done' : 'Pending'} · Vig:{' '}
                      {r.vignettesCompletedAt ? 'Done' : 'Pending'}
                    </td>
                  )}
                  <td className="p-3 font-mono text-[11px] text-slate-500">
                    {new Date(r.lastActivityAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface QuestionnaireStatusTableProps {
  participants: Participant[];
  questionnaires: QuestionnaireResponse[];
}

export const QuestionnaireStatusTable: React.FC<QuestionnaireStatusTableProps> = ({
  participants,
  questionnaires
}) => {
  const qByParticipant = new Map<string, QuestionnaireResponse>();
  questionnaires.forEach(q => qByParticipant.set(q.participantId, q));

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div className="pb-3 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">
          Questionnaire Completion Status ({questionnaires.length} / {participants.length} Submitted)
        </h3>
        <p className="text-xs text-slate-500">
          Baseline GenAI exposure survey completion and key self-reported exposure metrics per doctor.
        </p>
      </div>

      {participants.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
          No participant enrollments recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-semibold">Participant</th>
                <th className="p-3 font-semibold">Survey Status</th>
                <th className="p-3 font-semibold">Q1 · GenAI 3 Mo</th>
                <th className="p-3 font-semibold">Frequency</th>
                <th className="p-3 font-semibold">Tools Used</th>
                <th className="p-3 font-semibold">Q11 · Verify Freq</th>
                <th className="p-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map(p => {
                const q = qByParticipant.get(p.id);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">{p.code}</td>
                    <td className="p-3 font-mono">
                      {q ? (
                        <span className="text-emerald-700 font-semibold">Completed</span>
                      ) : (
                        <span className="text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      {q ? (q.usedGenAiLast3Months ? 'Yes' : 'No (Skipped Q2–12)') : '—'}
                    </td>
                    <td className="p-3 text-slate-700">{q?.usageFrequency || '—'}</td>
                    <td className="p-3 text-slate-700 max-w-xs truncate">
                      {q?.toolsUsed && q.toolsUsed.length > 0 ? q.toolsUsed.join(', ') : '—'}
                    </td>
                    <td className="p-3 text-slate-700">{q?.verificationFrequency || '—'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {q ? new Date(q.submittedAt || q.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface AiRecordsAndFollowupsPanelProps {
  participants: Participant[];
  aiInteractions: AiInteractionRecord[];
  followupEvents: CdssFollowupEvent[];
  cases: ClinicalCase[];
}

export const AiRecordsAndFollowupsPanel: React.FC<AiRecordsAndFollowupsPanelProps> = ({
  participants,
  aiInteractions,
  followupEvents,
  cases
}) => {
  const [subView, setSubView] = useState<'interactions' | 'followups'>('interactions');
  const participantById = new Map<string, Participant>();
  participants.forEach(p => participantById.set(p.id, p));
  const caseById = new Map<string, ClinicalCase>();
  cases.forEach(c => caseById.set(c.id, c));

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Simulation Interaction Logs &amp; Follow-up Events
          </h3>
          <p className="text-xs text-slate-500">
            Individual CDSS decisions, active case timing, and standardized follow-up prompt clicks.
          </p>
        </div>

        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSubView('interactions')}
            className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
              subView === 'interactions' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            AI Interactions ({aiInteractions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('followups')}
            className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
              subView === 'followups' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Follow-up Events ({followupEvents.length})
          </button>
        </div>
      </div>

      {subView === 'interactions' ? (
        aiInteractions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            No CDSS interaction records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="p-3 font-semibold">Participant</th>
                  <th className="p-3 font-semibold">Case</th>
                  <th className="p-3 font-semibold">Agreement</th>
                  <th className="p-3 font-semibold">Final Diagnosis</th>
                  <th className="p-3 font-semibold text-right">Conf.</th>
                  <th className="p-3 font-semibold text-right">Verify?</th>
                  <th className="p-3 font-semibold text-right">Active Time</th>
                  <th className="p-3 font-semibold">Misleading Eval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aiInteractions.slice(0, 150).map(rec => {
                  const p = participantById.get(rec.participantId);
                  const c = caseById.get(rec.caseId);
                  const isMis = c?.aiStimulus?.isMisleading;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {p?.code || rec.participantId.slice(0, 8)}
                      </td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        Case {c?.caseNumber ?? rec.caseId} ({c?.domain || rec.caseId})
                      </td>
                      <td className="p-3 text-slate-700">{rec.aiAgreement}</td>
                      <td className="p-3 text-slate-900 max-w-xs truncate" title={rec.finalDiagnosis}>
                        {rec.finalDiagnosis}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums">{rec.finalConfidence}/5</td>
                      <td className="p-3 text-right font-mono">
                        {rec.willVerify ? 'Yes' : 'No'}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                        {typeof rec.activeSeconds === 'number' ? `${rec.activeSeconds}s` : '—'}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {isMis ? (
                          rec.acceptedMisleading ? (
                            <span className="text-rose-700 font-semibold">Accepted Misleading</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Rejected Misleading</span>
                          )
                        ) : (
                          <span className="text-slate-600">Sound Stimulus</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : followupEvents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
          No CDSS follow-up prompt clicks recorded in this dataset yet.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-700">
                <th className="p-3 font-semibold">Participant</th>
                <th className="p-3 font-semibold">Case</th>
                <th className="p-3 font-semibold">Prompt ID</th>
                <th className="p-3 font-semibold">Follow-Up Question</th>
                <th className="p-3 font-semibold">Clicked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followupEvents.slice(0, 200).map(ev => {
                const p = participantById.get(ev.participantId);
                const c = caseById.get(ev.caseId);
                return (
                  <tr key={ev.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {p?.code || ev.participantId.slice(0, 8)}
                    </td>
                    <td className="p-3 text-slate-700">
                      Case {c?.caseNumber ?? ev.caseId} ({c?.domain || ev.caseId})
                    </td>
                    <td className="p-3 font-mono text-slate-600">{ev.suggestionId}</td>
                    <td className="p-3 text-slate-800">{ev.promptLabel}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {new Date(ev.clickedAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
