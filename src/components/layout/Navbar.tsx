import React from 'react';
import { Role, ResearchTeamMember } from '../../types';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  allowDemoToggle?: boolean;
  teamMember?: ResearchTeamMember | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  isDemoMode,
  onToggleDemoMode,
  allowDemoToggle = true,
  teamMember = null
}) => {
  const roleLabel =
    currentRole === 'researcher'
      ? isDemoMode
        ? 'Researcher Portal · Demo'
        : teamMember?.role === 'pi'
        ? 'Researcher Portal · PI'
        : teamMember?.role === 'assessor'
        ? `Researcher Portal · Assessor ${teamMember.assessorSlot ?? ''}`
        : teamMember?.role === 'researcher'
        ? 'Researcher Portal · Team'
        : 'Researcher Portal · Sign In'
      : 'Participant Study Portal';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs tracking-wider font-mono shrink-0">
              CRL
            </div>
            <div className="min-w-0">
              <a
                href="#/"
                onClick={e => {
                  e.preventDefault();
                  onRoleChange('participant');
                }}
                className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate block leading-tight hover:text-teal-700 transition-colors"
              >
                Clinical AI Reasoning Lab
              </a>
              <span className="text-[11px] font-medium text-slate-500 truncate hidden sm:block">
                {roleLabel}
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

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {allowDemoToggle && (
              <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(true)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    isDemoMode
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Demo Mode
                </button>
                <button
                  type="button"
                  onClick={() => onToggleDemoMode(false)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    !isDemoMode
                      ? 'bg-teal-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Live Study
                </button>
              </div>
            )}

            {currentRole === 'participant' ? (
              <button
                type="button"
                onClick={() => onRoleChange('researcher')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
              >
                Researcher Portal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRoleChange('participant')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer"
              >
                Participant Study Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Mobile Mode Strip when Demo Toggle is visible */}
      {allowDemoToggle && (
        <div className="sm:hidden flex items-center justify-between border-t border-slate-100 bg-slate-50/80 py-1.5 px-4 text-[11px]">
          <span className="font-mono text-slate-600 truncate">{roleLabel}</span>
          <div className="flex items-center p-0.5 bg-white rounded border border-slate-200">
            <button
              type="button"
              onClick={() => onToggleDemoMode(true)}
              className={`px-2 py-0.5 rounded font-medium ${
                isDemoMode ? 'bg-slate-900 text-white' : 'text-slate-500'
              }`}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => onToggleDemoMode(false)}
              className={`px-2 py-0.5 rounded font-medium ${
                !isDemoMode ? 'bg-teal-600 text-white' : 'text-slate-500'
              }`}
            >
              Live
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
