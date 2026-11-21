import React from 'react';
import { ShieldCheck, Users, ArrowRight, Lock } from 'lucide-react';

interface PublicPortalHomeProps {
  institutionName: string;
  protocolNumber: string;
  onSelectPiPortal: () => void;
  onSelectResearcherPortal: () => void;
}

export const PublicPortalHome: React.FC<PublicPortalHomeProps> = ({
  institutionName,
  protocolNumber,
  onSelectPiPortal,
  onSelectResearcherPortal
}) => {
  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700 font-semibold">
            <span>{institutionName}</span>
            <span aria-hidden="true">·</span>
            <span>Protocol {protocolNumber}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Clinical AI Reasoning Lab
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Controlled clinical reasoning, diagnostic anchoring, and cognitive offloading research platform. Access is restricted to authorised research personnel; study participants are enrolled strictly under supervised researcher sessions.
          </p>
        </div>

        {/* Two Entry Portals Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* A. Principal Investigator Portal */}
          <div className="flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-600/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  Portal A · Role: PI
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Principal Investigator
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Full study oversight, cohort completion metrics, participant records, recruitment team roster, dual-assessor adjudication, supervised participant enrollment, and SPSS/CSV exports.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Supabase email &amp; password authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Verified active <code className="font-mono text-[11px]">role = pi</code> membership</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onSelectPiPortal}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <span>Principal Investigator Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. Researcher Portal */}
          <div className="flex flex-col justify-between p-6 sm:p-8 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-600/50 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-teal-700" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  Portal B · Role: Researcher
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Researcher
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  View operational recruitment progress and active referral links, or launch a supervised anonymous participant enrollment session on a study workstation.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Supabase email &amp; password authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>Verified active research team membership</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/80">
              <button
                type="button"
                onClick={onSelectResearcherPortal}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <span>Researcher Login</span>
                <ArrowRight className="w-4 h-4 text-teal-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold">Participant Enrollment Policy:</strong>{' '}
          Direct public self-enrollment is disabled. Clinician participants must be initiated through an authorised Researcher or Principal Investigator session using supervised anonymous session handoff.
        </div>
      </div>
    </div>
  );
};
