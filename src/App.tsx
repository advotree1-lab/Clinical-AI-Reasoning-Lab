import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  ResearchProtocolSettings,
  ParticipantClinicalCase,
  ResearchTeamMember,
  RecruitmentTokenValidation
} from './types';
import { researchStore } from './services/researchStore';
import { Navbar, PortalNavbarView } from './components/layout/Navbar';
import { PublicPortalHome } from './components/home/PublicPortalHome';
import { ParticipantFlow } from './components/participant/ParticipantFlow';

const ResearcherAuthView = lazy(() =>
  import('./components/researcher/ResearcherAuthView').then(m => ({
    default: m.ResearcherAuthView
  }))
);

const ResearcherLandingView = lazy(() =>
  import('./components/researcher/ResearcherLandingView').then(m => ({
    default: m.ResearcherLandingView
  }))
);

const EnrollmentPrepView = lazy(() =>
  import('./components/researcher/EnrollmentPrepView').then(m => ({
    default: m.EnrollmentPrepView
  }))
);

const ResearcherDashboard = lazy(
  () => import('./components/researcher/ResearcherDashboard')
);

const REFERRAL_SESSION_STORAGE_KEY = 'carl_referral_token_v1';
const SUPERVISED_SESSION_STORAGE_KEY = 'carl_supervised_session_v1';

type RequestedRouteIntent =
  | 'home'
  | 'pi_login'
  | 'researcher_login'
  | 'pi_dashboard'
  | 'researcher_dashboard'
  | 'enrollment_prep'
  | 'participant_attempt';

function detectRequestedRoute(): RequestedRouteIntent {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const portalParam = new URLSearchParams(window.location.search).get('portal')?.toLowerCase();

  if (
    hash.includes('participant') ||
    path.includes('participant') ||
    portalParam === 'participant'
  ) {
    return 'participant_attempt';
  }
  if (hash.includes('pi-dashboard')) return 'pi_dashboard';
  if (hash.includes('pi') || path.endsWith('/pi') || portalParam === 'pi') return 'pi_login';
  if (hash.includes('enroll')) return 'enrollment_prep';
  if (hash.includes('researcher-dashboard')) return 'researcher_dashboard';
  if (
    hash.includes('researcher') ||
    path.endsWith('/researcher') ||
    portalParam === 'researcher'
  ) {
    return 'researcher_login';
  }
  return 'home';
}

function updateUrlHashSafely(targetHash: string) {
  try {
    const url = new URL(window.location.href);
    const normalizedPath = url.pathname.replace(
      /\/(participant|participant-session|pi|pi-login|pi-dashboard|researcher|researcher-login|researcher-dashboard|enroll|enrollment-prep)\/?$/i,
      '/'
    );
    url.searchParams.delete('portal');
    const cleanSearch = url.searchParams.toString();
    const targetUrl = `${normalizedPath || '/'}${cleanSearch ? `?${cleanSearch}` : ''}${targetHash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== targetUrl) {
      window.history.replaceState(null, '', targetUrl);
    }
  } catch {
    // Ignore history API restrictions inside sandboxed iframes
  }
}

export default function App() {
  const [appView, setAppView] = useState<PortalNavbarView>('home');
  const [authBootstrapped, setAuthBootstrapped] = useState<boolean>(false);

  const [settings, setSettings] = useState<ResearchProtocolSettings>(() =>
    researchStore.getSettings()
  );
  const [teamMember, setTeamMember] = useState<ResearchTeamMember | null>(null);
  const [authSessionType, setAuthSessionType] = useState<
    'none' | 'anonymous_participant' | 'authenticated_user'
  >('none');
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);

  // Supervised participant session context
  const [supervisedToken, setSupervisedToken] = useState<string | null>(null);
  const [supervisedValidation, setSupervisedValidation] =
    useState<RecruitmentTokenValidation | null>(null);
  const [participantCases, setParticipantCases] = useState<ParticipantClinicalCase[]>([]);
  const [liveCasesLoading, setLiveCasesLoading] = useState<boolean>(false);
  const [liveCasesError, setLiveCasesError] = useState<string | null>(null);

  const loadParticipantCasesFromSupabase = useCallback(async () => {
    if (!researchStore.isLiveSupabaseAvailable()) return;
    setLiveCasesLoading(true);
    setLiveCasesError(null);
    try {
      const loaded = await researchStore.loadLiveParticipantCases();
      if (loaded.length === 0) {
        setLiveCasesError(
          'Published clinical cases are not currently available for this study session. Please contact the Principal Investigator or study coordinator.'
        );
        setParticipantCases([]);
      } else {
        setParticipantCases(loaded);
      }
    } catch (err) {
      setLiveCasesError(
        err instanceof Error
          ? err.message
          : 'Unable to load published clinical cases right now.'
      );
    } finally {
      setLiveCasesLoading(false);
    }
  }, []);

  const routeWithVerifiedSession = useCallback(async () => {
    const requested = detectRequestedRoute();

    if (!researchStore.isLiveSupabaseAvailable()) {
      setTeamMember(null);
      setAuthSessionType('none');
      if (requested === 'pi_login' || requested === 'pi_dashboard') {
        setAppView('pi_login');
        updateUrlHashSafely('#/pi-login');
      } else if (
        requested === 'researcher_login' ||
        requested === 'researcher_dashboard' ||
        requested === 'enrollment_prep'
      ) {
        setAppView('researcher_login');
        updateUrlHashSafely('#/researcher-login');
      } else {
        setAppView('home');
        updateUrlHashSafely('#/');
      }
      setAuthBootstrapped(true);
      return;
    }

    try {
      const sType = await researchStore.getAuthSessionType();
      setAuthSessionType(sType);

      if (sType === 'authenticated_user') {
        const member = await researchStore.getAuthenticatedTeamMember();
        if (!member) {
          await researchStore.signOutTeamMember().catch(() => undefined);
          setTeamMember(null);
          setAuthSessionType('none');
          setUnauthorizedNotice(
            'Your account is not yet authorised for this research platform. Please contact the Principal Investigator.'
          );
          setAppView(
            requested === 'pi_login' || requested === 'pi_dashboard'
              ? 'pi_login'
              : 'researcher_login'
          );
          return;
        }

        setTeamMember(member);
        setUnauthorizedNotice(null);

        if (member.role === 'pi') {
          if (requested === 'enrollment_prep') {
            setAppView('enrollment_prep');
            updateUrlHashSafely('#/enrollment-prep');
          } else {
            setAppView('pi_dashboard');
            updateUrlHashSafely('#/pi-dashboard');
          }
        } else if (member.role === 'researcher') {
          if (requested === 'enrollment_prep') {
            setAppView('enrollment_prep');
            updateUrlHashSafely('#/enrollment-prep');
          } else if (requested === 'researcher_dashboard') {
            setAppView('researcher_dashboard');
            updateUrlHashSafely('#/researcher-dashboard');
          } else {
            setAppView('researcher_landing');
            updateUrlHashSafely('#/researcher');
          }
        } else {
          // role === 'assessor'
          setAppView('researcher_dashboard');
          updateUrlHashSafely('#/researcher-dashboard');
        }
        return;
      }

      if (sType === 'anonymous_participant') {
        // Only allow active supervised participant sessions (mid-study reloads before completion)
        let hasSupervisedFlag = false;
        try {
          hasSupervisedFlag = sessionStorage.getItem(SUPERVISED_SESSION_STORAGE_KEY) === '1';
        } catch {
          hasSupervisedFlag = false;
        }

        const snapshot = await researchStore.restoreLiveSession().catch(() => null);
        const hasActiveIncompleteParticipant =
          snapshot !== null && !snapshot.participant.completed;

        if (hasSupervisedFlag || hasActiveIncompleteParticipant) {
          // If participant tries to manually enter researcher/PI URLs, keep them blocked in participant session
          setTeamMember(null);
          setAppView('participant_session');
          updateUrlHashSafely('#/participant-session');
          void loadParticipantCasesFromSupabase();
          return;
        }

        // Unsolicited or already-completed anonymous session: terminate cleanly and show Public Homepage
        await researchStore.resetLiveParticipantSession().catch(() => undefined);
        try {
          sessionStorage.removeItem(SUPERVISED_SESSION_STORAGE_KEY);
          sessionStorage.removeItem(REFERRAL_SESSION_STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
        setAuthSessionType('none');
        setTeamMember(null);
        setAppView('home');
        updateUrlHashSafely('#/');
        return;
      }

      // sType === 'none' (Unauthenticated visitor):
      // Block direct access to participant route, enrollment prep, PI dashboard, or researcher dashboard
      setTeamMember(null);
      if (requested === 'pi_login' || requested === 'pi_dashboard') {
        setAppView('pi_login');
        updateUrlHashSafely('#/pi-login');
      } else if (
        requested === 'researcher_login' ||
        requested === 'researcher_dashboard' ||
        requested === 'enrollment_prep'
      ) {
        setAppView('researcher_login');
        updateUrlHashSafely('#/researcher-login');
      } else {
        setAppView('home');
        updateUrlHashSafely('#/');
      }
    } finally {
      setAuthBootstrapped(true);
    }
  }, [loadParticipantCasesFromSupabase]);

  useEffect(() => {
    void routeWithVerifiedSession();

    const handleHashOrPop = () => {
      void routeWithVerifiedSession();
    };
    window.addEventListener('hashchange', handleHashOrPop);
    window.addEventListener('popstate', handleHashOrPop);
    return () => {
      window.removeEventListener('hashchange', handleHashOrPop);
      window.removeEventListener('popstate', handleHashOrPop);
    };
  }, [routeWithVerifiedSession]);

  const handleUpdateSettings = (newSettings: Partial<ResearchProtocolSettings>) => {
    researchStore.updateSettings(newSettings);
    setSettings(researchStore.getSettings());
  };

  const navigateTo = (target: PortalNavbarView, hash: string) => {
    // Prevent unauthorized client view transitions
    if (authSessionType === 'anonymous_participant' && target !== 'participant_session') {
      return;
    }
    setAppView(target);
    updateUrlHashSafely(hash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthenticated = (member: ResearchTeamMember) => {
    setTeamMember(member);
    setAuthSessionType('authenticated_user');
    setUnauthorizedNotice(null);

    if (member.role === 'pi') {
      setAppView('pi_dashboard');
      updateUrlHashSafely('#/pi-dashboard');
    } else if (member.role === 'researcher') {
      setAppView('researcher_landing');
      updateUrlHashSafely('#/researcher');
    } else {
      setAppView('researcher_dashboard');
      updateUrlHashSafely('#/researcher-dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOutTeam = async () => {
    try {
      await researchStore.signOutTeamMember();
    } finally {
      setTeamMember(null);
      setAuthSessionType('none');
      setUnauthorizedNotice(null);
      setAppView('home');
      updateUrlHashSafely('#/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartSupervisedParticipantSession = async (
    referralToken: string | null,
    validation: RecruitmentTokenValidation | null
  ) => {
    // Verify active team session server-side right before handoff
    const currentMember = await researchStore.getAuthenticatedTeamMember();
    if (!currentMember || (currentMember.role !== 'pi' && currentMember.role !== 'researcher')) {
      setTeamMember(null);
      setAuthSessionType('none');
      setAppView('researcher_login');
      updateUrlHashSafely('#/researcher-login');
      throw new Error('Your research team session has expired. Please sign in again before enrolling a participant.');
    }

    // Store non-secret supervised handoff token & flag before closing researcher session
    try {
      if (referralToken) {
        sessionStorage.setItem(REFERRAL_SESSION_STORAGE_KEY, referralToken);
      } else {
        sessionStorage.removeItem(REFERRAL_SESSION_STORAGE_KEY);
      }
      sessionStorage.setItem(SUPERVISED_SESSION_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }

    // End researcher session and start a brand-new anonymous participant Supabase session
    await researchStore.startFreshAnonymousParticipantSession();

    // Clear all researcher state from memory before showing participant study flow
    setTeamMember(null);
    setUnauthorizedNotice(null);
    setAuthSessionType('anonymous_participant');
    setSupervisedToken(referralToken);
    setSupervisedValidation(validation);

    setAppView('participant_session');
    updateUrlHashSafely('#/participant-session');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    await loadParticipantCasesFromSupabase();
  };

  const handleParticipantCompleteToLogin = () => {
    setTeamMember(null);
    setAuthSessionType('none');
    setSupervisedToken(null);
    setSupervisedValidation(null);
    setParticipantCases([]);
    setAppView('researcher_login');
    updateUrlHashSafely('#/researcher-login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        appView={appView}
        teamMember={teamMember}
        onNavigateHome={() => {
          if (teamMember) {
            if (teamMember.role === 'pi') navigateTo('pi_dashboard', '#/pi-dashboard');
            else if (teamMember.role === 'researcher')
              navigateTo('researcher_landing', '#/researcher');
            else navigateTo('researcher_dashboard', '#/researcher-dashboard');
          } else {
            navigateTo('home', '#/');
          }
        }}
        onSelectPiLogin={() => {
          setUnauthorizedNotice(null);
          navigateTo('pi_login', '#/pi-login');
        }}
        onSelectResearcherLogin={() => {
          setUnauthorizedNotice(null);
          navigateTo('researcher_login', '#/researcher-login');
        }}
        onSignOut={() => void handleSignOutTeam()}
      />

      <div className="flex-1">
        {!authBootstrapped ? (
          <div className="max-w-md mx-auto py-16 px-4 text-center">
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-600 shadow-2xs">
              Verifying Clinical AI Reasoning Lab Session...
            </div>
          </div>
        ) : appView === 'home' ? (
          <PublicPortalHome
            institutionName={settings.institutionName}
            protocolNumber={settings.protocolNumber}
            onSelectPiPortal={() => {
              setUnauthorizedNotice(null);
              navigateTo('pi_login', '#/pi-login');
            }}
            onSelectResearcherPortal={() => {
              setUnauthorizedNotice(null);
              navigateTo('researcher_login', '#/researcher-login');
            }}
          />
        ) : appView === 'participant_session' ? (
          <ParticipantFlow
            isDemoMode={false}
            settings={settings}
            cases={participantCases}
            casesLoading={liveCasesLoading}
            casesError={liveCasesError}
            initialReferralToken={supervisedToken}
            initialReferralValidation={supervisedValidation}
            onCompleteReturnToLogin={handleParticipantCompleteToLogin}
          />
        ) : (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto py-12 px-4 text-xs font-mono text-slate-500">
                Loading Portal...
              </div>
            }
          >
            {(appView === 'pi_login' || appView === 'researcher_login') && (
              <ResearcherAuthView
                portalType={appView === 'pi_login' ? 'pi' : 'researcher'}
                isSupabaseAvailable={researchStore.isLiveSupabaseAvailable()}
                configError={researchStore.getSupabaseConfigError()}
                sessionType={authSessionType}
                unauthorizedAccountNotice={unauthorizedNotice}
                onAuthenticated={handleAuthenticated}
                onBackToHome={() => navigateTo('home', '#/')}
                onSessionCleared={() => {
                  setAuthSessionType('none');
                  setUnauthorizedNotice(null);
                }}
              />
            )}

            {appView === 'researcher_landing' && teamMember && (
              <ResearcherLandingView
                member={teamMember}
                onOpenDashboard={() =>
                  navigateTo('researcher_dashboard', '#/researcher-dashboard')
                }
                onOpenEnrollParticipant={() =>
                  navigateTo('enrollment_prep', '#/enrollment-prep')
                }
                onSignOut={handleSignOutTeam}
              />
            )}

            {appView === 'enrollment_prep' &&
              teamMember &&
              (teamMember.role === 'pi' || teamMember.role === 'researcher') && (
                <EnrollmentPrepView
                  member={teamMember}
                  onBack={() =>
                    teamMember.role === 'pi'
                      ? navigateTo('pi_dashboard', '#/pi-dashboard')
                      : navigateTo('researcher_landing', '#/researcher')
                  }
                  onStartParticipantSession={handleStartSupervisedParticipantSession}
                />
              )}

            {(appView === 'pi_dashboard' || appView === 'researcher_dashboard') &&
              teamMember && (
                <ResearcherDashboard
                  isDemoMode={false}
                  onToggleDemoMode={() => undefined}
                  showDemoToggle={false}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  teamMember={teamMember}
                  onSignOut={handleSignOutTeam}
                  onBackToLanding={
                    teamMember.role === 'researcher'
                      ? () => navigateTo('researcher_landing', '#/researcher')
                      : undefined
                  }
                  onOpenEnrollParticipant={
                    teamMember.role === 'pi' || teamMember.role === 'researcher'
                      ? () => navigateTo('enrollment_prep', '#/enrollment-prep')
                      : undefined
                  }
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
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-lg bg-black border border-slate-800 shadow-2xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
              Powered by
            </span>
            <img
              src="/assets/medikyne-logo.png"
              alt="MediKyne — The Intelligence Layer for Healthcare"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
