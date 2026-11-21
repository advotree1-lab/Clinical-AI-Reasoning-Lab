import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  Role,
  ResearchProtocolSettings,
  ParticipantClinicalCase,
  ResearchTeamMember
} from './types';
import { researchStore } from './services/researchStore';
import { Navbar } from './components/layout/Navbar';
import { ParticipantFlow } from './components/participant/ParticipantFlow';

const ResearcherAuthView = lazy(() =>
  import('./components/researcher/ResearcherAuthView').then(m => ({
    default: m.ResearcherAuthView
  }))
);

const ResearcherDashboard = lazy(
  () => import('./components/researcher/ResearcherDashboard')
);

function detectInitialRole(): Role {
  if (typeof window === 'undefined') return 'participant';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const portalParam = new URLSearchParams(window.location.search).get('portal')?.toLowerCase();
  if (path.endsWith('/researcher') || hash.includes('researcher') || portalParam === 'researcher') {
    return 'researcher';
  }
  return 'participant';
}

function detectInitialDemoMode(): boolean {
  if (typeof window === 'undefined') return true;
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode')?.toLowerCase();
  if (modeParam === 'demo') return true;
  if (!researchStore.isLiveSupabaseAvailable()) return true;
  if (modeParam === 'live' || params.has('ref')) return false;
  return false;
}

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>(() => detectInitialRole());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => detectInitialDemoMode());

  const [settings, setSettings] = useState<ResearchProtocolSettings>(() =>
    researchStore.getSettings()
  );
  const [participantCases, setParticipantCases] = useState<ParticipantClinicalCase[]>(() =>
    researchStore.getParticipantCases()
  );
  const [liveCasesLoading, setLiveCasesLoading] = useState<boolean>(false);
  const [liveCasesError, setLiveCasesError] = useState<string | null>(null);

  // Researcher Supabase Auth state (Portal 2)
  const [teamMember, setTeamMember] = useState<ResearchTeamMember | null>(null);
  const [authSessionType, setAuthSessionType] = useState<
    'none' | 'anonymous_participant' | 'authenticated_user'
  >('none');
  const [authChecking, setAuthChecking] = useState<boolean>(false);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);

  // Sync URL hash with active portal
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.toLowerCase().includes('researcher')) {
        setCurrentRole('researcher');
      } else if (window.location.hash === '#/' || window.location.hash === '') {
        setCurrentRole('participant');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Load participant-safe published cases in Live Mode when on Participant Portal
  useEffect(() => {
    let active = true;

    if (currentRole !== 'participant') return;

    if (isDemoMode) {
      setParticipantCases(researchStore.getParticipantCases());
      setLiveCasesLoading(false);
      setLiveCasesError(null);
      return;
    }

    if (!researchStore.isLiveSupabaseAvailable()) {
      setLiveCasesLoading(false);
      setLiveCasesError(null);
      return;
    }

    setLiveCasesLoading(true);
    setLiveCasesError(null);

    researchStore
      .loadLiveParticipantCases()
      .then(loaded => {
        if (!active) return;
        if (loaded.length === 0) {
          setLiveCasesError(
            'No published clinical cases were found in Supabase clinical_cases. Please verify the SQL migration and case seed ran successfully.'
          );
          setParticipantCases([]);
        } else {
          setParticipantCases(loaded);
        }
      })
      .catch(err => {
        if (!active) return;
        setLiveCasesError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch clinical cases from Supabase.'
        );
      })
      .finally(() => {
        if (active) setLiveCasesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isDemoMode, currentRole]);

  // Verify researcher auth session whenever entering Researcher Portal in Live Mode
  const refreshResearcherAuth = useCallback(async () => {
    if (!researchStore.isLiveSupabaseAvailable()) {
      setTeamMember(null);
      setAuthSessionType('none');
      setUnauthorizedNotice(null);
      setAuthChecking(false);
      return;
    }

    setAuthChecking(true);
    setUnauthorizedNotice(null);
    try {
      const sType = await researchStore.getAuthSessionType();
      setAuthSessionType(sType);

      if (sType !== 'authenticated_user') {
        setTeamMember(null);
        return;
      }

      const member = await researchStore.getAuthenticatedTeamMember();
      if (!member) {
        setTeamMember(null);
        setUnauthorizedNotice(
          'Your authenticated Supabase account is not an active member of research_team_members. Please contact the Principal Investigator or sign in with an authorised team account.'
        );
      } else {
        setTeamMember(member);
      }
    } catch (err) {
      setTeamMember(null);
      setUnauthorizedNotice(
        err instanceof Error
          ? err.message
          : 'Unable to verify researcher session in Supabase.'
      );
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    if (currentRole === 'researcher' && !isDemoMode) {
      void refreshResearcherAuth();
    }
  }, [currentRole, isDemoMode, refreshResearcherAuth]);

  const handleUpdateSettings = (newSettings: Partial<ResearchProtocolSettings>) => {
    researchStore.updateSettings(newSettings);
    setSettings(researchStore.getSettings());
  };

  const handleRoleChange = (targetRole: Role) => {
    setCurrentRole(targetRole);
    try {
      const targetHash = targetRole === 'researcher' ? '#researcher' : '#/';
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${targetHash}`);
      }
    } catch {
      // Ignore history pushState restrictions in sandboxed iframes
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    if (!val && currentRole === 'researcher') {
      void refreshResearcherAuth();
    }
  };

  const handleTeamSignOut = async () => {
    try {
      await researchStore.signOutTeamMember();
    } finally {
      setTeamMember(null);
      setAuthSessionType('none');
      setUnauthorizedNotice(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        allowDemoToggle={settings.allowDemoToggle}
        teamMember={teamMember}
      />

      {/* Main Viewport */}
      <div className="flex-1">
        {currentRole === 'participant' ? (
          <ParticipantFlow
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
            settings={settings}
            cases={participantCases}
            casesLoading={liveCasesLoading}
            casesError={liveCasesError}
          />
        ) : (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto py-12 px-4 text-xs font-mono text-slate-500">
                Loading Researcher Portal...
              </div>
            }
          >
            {isDemoMode ? (
              <ResearcherDashboard
                isDemoMode={true}
                onToggleDemoMode={handleToggleDemoMode}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            ) : authChecking ? (
              <div className="max-w-md mx-auto py-16 px-4 text-center">
                <div className="p-6 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600 shadow-2xs">
                  Verifying Researcher Auth Session &amp; Role...
                </div>
              </div>
            ) : teamMember ? (
              <ResearcherDashboard
                isDemoMode={false}
                onToggleDemoMode={handleToggleDemoMode}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                teamMember={teamMember}
                onSignOut={handleTeamSignOut}
              />
            ) : (
              <ResearcherAuthView
                isSupabaseAvailable={researchStore.isLiveSupabaseAvailable()}
                configError={researchStore.getSupabaseConfigError()}
                sessionType={authSessionType}
                unauthorizedAccountNotice={unauthorizedNotice}
                onAuthenticated={member => {
                  setTeamMember(member);
                  setAuthSessionType('authenticated_user');
                  setUnauthorizedNotice(null);
                }}
                onSwitchToDemoDashboard={
                  settings.allowDemoToggle ? () => setIsDemoMode(true) : undefined
                }
                onBackToParticipant={() => handleRoleChange('participant')}
                onSessionCleared={() => {
                  setAuthSessionType('none');
                  setUnauthorizedNotice(null);
                }}
              />
            )}
          </Suspense>
        )}
      </div>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            Clinical AI Reasoning Lab · {settings.institutionName}
          </div>
          <div className="inline-flex items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Powered by
            </span>
            <img
              src="/assets/medikyne-logo.png"
              alt="MediKyne — The Intelligence Layer for Healthcare"
              className="h-11 w-auto object-contain"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
