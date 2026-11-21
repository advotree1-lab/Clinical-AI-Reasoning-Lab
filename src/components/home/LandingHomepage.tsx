import React from 'react';
import { ShieldCheck, Users, Stethoscope, ArrowRight } from 'lucide-react';
import { AppRoute, ResearchProtocolSettings } from '../../types';

interface LandingHomepageProps {
  settings: ResearchProtocolSettings;
  onSelectRoute: (route: AppRoute) => void;
  hasActiveReferralToken?: boolean;
  isDemoMode: boolean;
}

export const LandingHomepage: React.FC<LandingHomepageProps> = ({
  settings,
  onSelectRoute,
  hasActiveReferralToken = false,
  isDemoMode
}) => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-teal-700">
                <span>{settings.institutionName}</span>
                <span aria-hidden="true">·</span>
                <span>Protocol {settings.protocolNumber}</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                Clinical AI Reasoning Lab
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                A research initiative exploring the relationship between generative AI, clinical reasoning and cognitive offloading among doctors.
              </p>

              {hasActiveReferralToken && (
                <div className="pt-2 text-xs font-medium text-teal-800">
                  Study invitation code detected. Select &ldquo;Participate in the Study&rdquo; below to enter with automatic referral attribution.
                </div>
              )}

              {isDemoMode && (
                <div className="pt-1 text-xs font-mono text-amber-800">
                  Preview Mode Active: Local synthetic cohort &amp; simulated participant session enabled.
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 shrink-0 self-start">
              <div className="leading-tight">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  Research Platform
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Powered by MediKyne
                </span>
              </div>
              <img
                src="/assets/medikyne-logo.png"
                alt="MediKyne"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three Entry Portals */}
      <section className="bg-slate-50/70 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Select Your Portal
            </h2>
            <p className="text-sm text-slate-600">
              Choose the administrative portal matching your study credentials, or enter directly as a clinical participant.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* A. Principal Investigator Portal */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Portal A · Oversight
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Principal Investigator Portal
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Dedicated sign-in for the Principal Investigator to monitor enrolled DOC codes, inspect questionnaire and CDSS simulation logs, adjudicate dual-assessor vignette scores, and export CSV/SPSS datasets.
                </p>

                <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <li>· Verified Supabase Auth with active PI role check</li>
                  <li>· Full cohort analytics, follow-up events &amp; adjudication</li>
                  <li>· Anonymous participant identifiers only</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectRoute('pi')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>Principal Investigator Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* B. Researcher Portal */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Portal B · Study Team
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Researcher Portal
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Authorised sign-in for research collaborators and clinical assessors to manage recruitment referral links, track enrolled participant progression, and submit blinded vignette grading.
                </p>

                <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <li>· Verified active research_team_members access</li>
                  <li>· Scoped operational participant status &amp; targets</li>
                  <li>· Strict slot separation for clinical assessors</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectRoute('researcher')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <span>Researcher Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* C. Participant Study Access */}
            <div className="bg-white rounded-xl border-2 border-teal-600/80 p-6 sm:p-7 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-teal-700 font-semibold block">
                      Portal C · Clinicians
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Participant Study Access
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Open entry for medical doctors participating in the study. Complete eligibility confirmation, informed consent, the GenAI exposure survey, five CDSS cases, and six clinical reasoning vignettes.
                </p>

                <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <li>· No researcher credentials required</li>
                  <li>· Automatic anonymous participant code (DOC-ID)</li>
                  <li>· Estimated completion time: ~15 minutes</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectRoute('participant')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
              >
                <span>Participate in the Study</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Protocol Structure Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="space-y-1">
              <div className="font-bold text-slate-900">01. Anonymous Enrollment &amp; Survey</div>
              <p className="leading-relaxed">
                Participants confirm eligibility and consent before receiving an anonymous DOC identifier and completing the 12-item GenAI usage and cognitive offloading survey.
              </p>
            </div>
            <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6">
              <div className="font-bold text-slate-900">02. Five Standardized CDSS Cases</div>
              <p className="leading-relaxed">
                Clinicians evaluate five realistic medical cases alongside standardized clinical decision support outputs, follow-up prompts, and diagnostic confidence ratings.
              </p>
            </div>
            <div className="space-y-1 md:border-l md:border-slate-200 md:pl-6">
              <div className="font-bold text-slate-900">03. Six Independent Reasoning Vignettes</div>
              <p className="leading-relaxed">
                Participants formulate primary diagnoses, differentials, red flags, and immediate management steps unaided prior to study debriefing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
