import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, LogOut, Database } from 'lucide-react';
import { ResearchTeamMember } from '../../types';
import { researchStore } from '../../services/researchStore';

interface ResearcherAuthViewProps {
  isSupabaseAvailable: boolean;
  configError: string | null;
  sessionType: 'none' | 'anonymous_participant' | 'authenticated_user';
  unauthorizedAccountNotice: string | null;
  onAuthenticated: (member: ResearchTeamMember) => void;
  onSwitchToDemoDashboard?: () => void;
  onBackToParticipant: () => void;
  onSessionCleared: () => void;
}

export const ResearcherAuthView: React.FC<ResearcherAuthViewProps> = ({
  isSupabaseAvailable,
  configError,
  sessionType,
  unauthorizedAccountNotice,
  onAuthenticated,
  onSwitchToDemoDashboard,
  onBackToParticipant,
  onSessionCleared
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(unauthorizedAccountNotice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const member = await researchStore.signInTeamMember(email, password);
      setPassword('');
      onAuthenticated(member);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in with these credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutParticipant = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await researchStore.resetLiveParticipantSession();
      onSessionCleared();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to clear participant session.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-50/70 py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <button
            type="button"
            onClick={onBackToParticipant}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Participant Study Portal</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-200/80">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-teal-700 font-semibold">
                Researcher &amp; Assessor Portal
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Investigator Sign In
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Sign in with your authorised Supabase Auth credentials. Access level is verified against{' '}
            <code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
              research_team_members
            </code>{' '}
            (Principal Investigator, Researcher, or Assigned Assessor).
          </p>

          {sessionType === 'anonymous_participant' && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-amber-900">
                    Active Anonymous Participant Session Detected
                  </strong>
                  Anonymous participant sessions are strictly blocked from the Researcher Portal. Sign out of the participant session first or authenticate below to switch.
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSignOutParticipant()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded hover:bg-amber-100/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Participant Session</span>
              </button>
            </div>
          )}

          {!isSupabaseAvailable ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="font-semibold text-amber-900">
                Supabase Authentication Not Configured
              </div>
              <p className="leading-relaxed">
                {configError ||
                  'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required for Researcher Portal login.'}
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="researcher-email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Authorised Email Address
                </label>
                <input
                  id="researcher-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="investigator@hospital.edu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="researcher-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="researcher-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter password..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                {isSubmitting ? 'Verifying Credentials & Team Role...' : 'Sign In to Researcher Portal'}
              </button>
            </form>
          )}

          {onSwitchToDemoDashboard && (
            <div className="pt-4 border-t border-slate-200/80 space-y-2">
              <div className="text-[11px] text-slate-500">
                No live researcher credentials yet? Explore the synthetic N=40 simulation cohort locally without accessing live participant tables.
              </div>
              <button
                type="button"
                onClick={onSwitchToDemoDashboard}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-teal-700" />
                <span>Preview Demo Cohort Analytics (Synthetic N = 40)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
