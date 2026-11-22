import React, { useState } from 'react';
import { Copy, Check, Link2, Users, ShieldCheck } from 'lucide-react';
import {
  Participant,
  RecruitmentLink,
  ResearchTeamMember,
  ResearcherOperationalParticipant
} from '../../types';

interface RecruitmentAndTeamPanelProps {
  member: ResearchTeamMember | null;
  teamMembers: ResearchTeamMember[];
  recruitmentLinks: RecruitmentLink[];
  operationalParticipants: ResearcherOperationalParticipant[];
  participants: Participant[];
  isDemoMode: boolean;
}

export const RecruitmentAndTeamPanel: React.FC<RecruitmentAndTeamPanelProps> = ({
  member,
  teamMembers,
  recruitmentLinks,
  operationalParticipants,
  participants,
  isDemoMode
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (link: RecruitmentLink) => {
    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(link.token)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // Fallback if clipboard API unavailable
      setCopiedId(null);
    }
  };

  if (isDemoMode) {
    return (
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-base font-bold text-slate-900">
          Recruitment Links &amp; Research Team Roster
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Recruitment link tracking and team target metrics operate in live study mode. Sign in with an authorised team account to inspect active recruitment links and team counts.
        </p>
      </div>
    );
  }

  const getRecruitedCountForMember = (teamId: string): number => {
    if (participants.length > 0) {
      return participants.filter(p => p.recruitedBy === teamId).length;
    }
    return operationalParticipants.filter(p => p.recruitedBy === teamId).length;
  };

  const getCompletedCountForMember = (teamId: string): number => {
    if (participants.length > 0) {
      return participants.filter(p => p.recruitedBy === teamId && p.completed).length;
    }
    return operationalParticipants.filter(p => p.recruitedBy === teamId && p.completed).length;
  };

  const memberById = new Map<string, ResearchTeamMember>();
  teamMembers.forEach(t => memberById.set(t.id, t));

  return (
    <div className="space-y-6">
      {/* Role-Scoped Governance Notice */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 flex items-start gap-3 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-teal-900 block">
            Role-Scoped Recruitment &amp; Team Governance
          </strong>
          Access to recruitment links and team rosters is scoped to your assigned study role. Principal Investigators have visibility across all links and team members, while Research Team Members see their own assigned links and target progress. Provisioning new team accounts or issuing additional referral tokens is managed by the Principal Investigator and study administration.
        </div>
      </div>

      {/* Recruitment Links Table */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Recruitment Links ({recruitmentLinks.length})
              </h3>
              <p className="text-xs text-slate-500">
                Shareable referral URLs automatically attributed to the assigned researcher upon participant enrollment.
              </p>
            </div>
          </div>
        </div>

        {recruitmentLinks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            No recruitment links are currently assigned to your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-semibold">Label</th>
                  <th className="p-3 font-semibold">Token</th>
                  {member?.role === 'pi' && <th className="p-3 font-semibold">Assigned Researcher</th>}
                  <th className="p-3 font-semibold text-right">Uses / Max</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Expires</th>
                  <th className="p-3 font-semibold text-right">Referral URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recruitmentLinks.map(link => {
                  const owner = memberById.get(link.researcherId);
                  const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
                  const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(link.token)}`;
                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-medium text-slate-900">
                        {link.label || 'Standard Referral Link'}
                      </td>
                      <td className="p-3 font-mono text-slate-700">{link.token}</td>
                      {member?.role === 'pi' && (
                        <td className="p-3 text-slate-700">
                          {owner ? `${owner.fullName} (${owner.researcherCode})` : link.researcherId.slice(0, 8)}
                        </td>
                      )}
                      <td className="p-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                        {link.usesCount} / {link.maxUses ?? '∞'}
                      </td>
                      <td className="p-3">
                        {link.isActive && !isExpired ? (
                          <span className="font-mono text-emerald-700 font-semibold">Active</span>
                        ) : (
                          <span className="font-mono text-slate-500">
                            {isExpired ? 'Expired' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(link)}
                          title={shareUrl}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors cursor-pointer"
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check className="w-3 h-3 text-teal-700" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-teal-700" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Research Team Roster */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Users className="w-4 h-4 text-teal-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {member?.role === 'pi'
                ? `Authorized Research Team Roster (${teamMembers.length})`
                : 'My Research Team Profile & Recruitment Target'}
            </h3>
            <p className="text-xs text-slate-500">
              Active research staff accounts and recruitment targets.
            </p>
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
            No team records loaded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-semibold">Code</th>
                  <th className="p-3 font-semibold">Name &amp; Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold text-right">Recruited / Target</th>
                  <th className="p-3 font-semibold text-right">Completed</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map(tm => {
                  const recruited = getRecruitedCountForMember(tm.id);
                  const completed = getCompletedCountForMember(tm.id);
                  return (
                    <tr key={tm.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-900">{tm.researcherCode}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{tm.fullName}</div>
                        <div className="text-[11px] text-slate-500">{tm.email}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {tm.role === 'pi'
                          ? 'Principal Investigator'
                          : tm.role === 'assessor'
                          ? `Independent Assessor (Slot ${tm.assessorSlot ?? '?'})`
                          : 'Research Team Member'}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                        {recruited} / {tm.recruitmentTarget}
                      </td>
                      <td className="p-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                        {completed}
                      </td>
                      <td className="p-3 font-mono">
                        <span className={tm.isActive ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                          {tm.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
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
