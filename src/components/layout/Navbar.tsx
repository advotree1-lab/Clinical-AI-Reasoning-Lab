import React from 'react';
import { ResearchTeamMember } from '../../types';

export type PortalNavbarView =
  | 'home'
  | 'pi_login'
  | 'researcher_login'
  | 'pi_dashboard'
  | 'researcher_landing'
  | 'researcher_dashboard'
  | 'enrollment_prep'
  | 'participant_session';

interface NavbarProps {
  appView: PortalNavbarView;
  teamMember?: ResearchTeamMember | null;
  onNavigateHome: () => void;
  onSelectPiLogin: () => void;
  onSelectResearcherLogin: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  appView,
  teamMember = null,
  onNavigateHome,
  onSelectPiLogin,
  onSelectResearcherLogin,
  onSignOut
}) => {
  const isParticipantSession = appView === 'participant_session';
  const isAuthenticatedTeamView =
    appView === 'pi_dashboard' ||
    appView === 'researcher_landing' ||
    appView === 'researcher_dashboard' ||
    appView === 'enrollment_prep';

  const subtitle = isParticipantSession
    ? 'Supervised Participant Study Session'
    : appView === 'pi_dashboard'
    ? 'Principal Investigator Portal'
    : isAuthenticatedTeamView && teamMember?.role === 'assessor'
    ? `Clinical Assessor Portal · Slot ${teamMember.assessorSlot ?? '?'}`
    : isAuthenticatedTeamView
    ? 'Researcher Portal'
    : 'Clinical Reasoning & AI Simulation Study';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs tracking-wider font-mono shrink-0">
              CRL
            </div>
            <div className="min-w-0">
              {isParticipantSession ? (
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate block leading-tight">
                  Clinical AI Reasoning Lab
                </span>
              ) : (
                <a
                  href="#/"
                  onClick={e => {
                    e.preventDefault();
                    onNavigateHome();
                  }}
                  className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate block leading-tight hover:text-teal-700 transition-colors"
                >
                  Clinical AI Reasoning Lab
                </a>
              )}
              <span className="text-[11px] font-medium text-slate-500 truncate hidden sm:block">
                {subtitle}
              </span>
            </div>

            <div className="hidden xl:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 shrink-0">
              <img
                src="/assets/medikyne-emblem.png"
                alt="MediKyne"
                className="w-6 h-6 object-contain shrink-0"
              />
              <div className="leading-none">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">
                  Powered by
                </span>
                <span className="text-xs font-bold tracking-tight text-teal-700">
                  MediKyne
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2 & 3: Strict Portal-Scoped Actions */}
          {isParticipantSession ? (
            <div className="text-xs font-mono font-semibold text-teal-700 shrink-0">
              PARTICIPANT SESSION ACTIVE
            </div>
          ) : isAuthenticatedTeamView && teamMember ? (
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline text-xs font-mono text-slate-600">
                {teamMember.fullName} · {teamMember.researcherCode}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={onSelectResearcherLogin}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                  appView === 'researcher_login'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Researcher
              </button>
              <button
                type="button"
                onClick={onSelectPiLogin}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  appView === 'pi_login'
                    ? 'bg-teal-700 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                }`}
              >
                Principal Investigator
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
