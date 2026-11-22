import React from 'react';
import { BarChart3, UserPlus, ArrowRight, LogOut } from 'lucide-react';
import { ResearchTeamMember } from '../../types';
import { BrandMark } from '../common/BrandLogo';

interface ResearcherLandingViewProps {
  member: ResearchTeamMember;
  onOpenDashboard: () => void;
  onOpenEnrollParticipant: () => void;
  onSignOut: () => Promise<void> | void;
}

export const ResearcherLandingView: React.FC<ResearcherLandingViewProps> = ({
  member,
  onOpenDashboard,
  onOpenEnrollParticipant,
  onSignOut
}) => {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-slate-50/70 py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Authenticated Research Team Header */}
        <div className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <BrandMark size={40} className="mt-0.5" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700 font-semibold mb-1">
                <span>Research Team Member</span>
                <span aria-hidden="true">·</span>
                <span>{member.researcherCode}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Target: {member.recruitmentTarget} participants</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome, {member.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Signed in as {member.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Two Prominent Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Option 1: Research Dashboard */}
          <div className="flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-teal-700" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  Option 1
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Research Dashboard
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Review your operational recruitment roster, completion status by participant code, assigned recruitment links, target attainment, and published study cases.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Research Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Option 2: Enroll Participant */}
          <div className="flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-white border border-teal-600/40 shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono font-semibold text-teal-700">
                  Option 2
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Enroll Participant
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Prepare and validate a recruitment link, securely conclude your research team session, and initiate a dedicated anonymous participant session for the eight-stage study.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onOpenEnrollParticipant}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <span>Prepare Participant Enrollment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
