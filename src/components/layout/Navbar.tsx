import React from 'react';
import { Role } from '../../types';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDemoMode: boolean;
  onToggleDemoMode: (isDemo: boolean) => void;
  participantId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  isDemoMode,
  onToggleDemoMode
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single Wordmark & Academic Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-wider font-mono">
              CRL
            </div>
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange('participant');
                }}
                className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight hover:text-emerald-800 transition-colors"
              >
                Clinical AI Reasoning Lab
              </a>
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap hidden sm:block">
                Center for Medical Education & Diagnostic Informatics
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Clean unboxed typography) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <button
              onClick={() => onTabChange('participant')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'participant'
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Participant Journey
            </button>
            <button
              onClick={() => onTabChange('researcher')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'researcher'
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Researcher Console
            </button>
            <button
              onClick={() => onTabChange('cases')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'cases'
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Clinical Cases & Rubrics
            </button>
            <button
              onClick={() => onTabChange('export')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'export'
                  ? 'text-slate-900 font-bold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              SPSS Data Export
            </button>
          </nav>

          {/* Zone 3: Actions (Environment Segment + Portal Switcher) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Segmented Mode Control */}
            <div className="hidden sm:flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-medium">
              <button
                onClick={() => onToggleDemoMode(true)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  isDemoMode
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Demo Cohort (40)
              </button>
              <button
                onClick={() => onToggleDemoMode(false)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  !isDemoMode
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Research Mode
              </button>
            </div>

            {/* Portal Switch Button */}
            {currentRole === 'participant' ? (
              <button
                onClick={() => onRoleChange('researcher')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
              >
                Researcher Portal
              </button>
            ) : (
              <button
                onClick={() => onRoleChange('participant')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 whitespace-nowrap"
              >
                Exit to Participant
              </button>
            )}
          </div>

        </div>
      </div>
      
      {/* Mobile Sub-Navigation */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50 py-2 px-3 text-xs font-medium">
        <button
          onClick={() => onTabChange('participant')}
          className={activeTab === 'participant' ? 'text-slate-900 font-bold' : 'text-slate-500'}
        >
          Participant
        </button>
        <button
          onClick={() => onTabChange('researcher')}
          className={activeTab === 'researcher' ? 'text-slate-900 font-bold' : 'text-slate-500'}
        >
          Researcher
        </button>
        <button
          onClick={() => onTabChange('cases')}
          className={activeTab === 'cases' ? 'text-slate-900 font-bold' : 'text-slate-500'}
        >
          Cases
        </button>
        <button
          onClick={() => onTabChange('export')}
          className={activeTab === 'export' ? 'text-slate-900 font-bold' : 'text-slate-500'}
        >
          Export
        </button>
      </div>
    </header>
  );
};
