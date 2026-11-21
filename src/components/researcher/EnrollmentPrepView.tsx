import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserCheck,
  Link2,
  CheckCircle2,
  AlertCircle,
  Play,
  ShieldAlert
} from 'lucide-react';
import {
  RecruitmentLink,
  RecruitmentTokenValidation,
  ResearchTeamMember
} from '../../types';
import { researchStore } from '../../services/researchStore';

interface EnrollmentPrepViewProps {
  member: ResearchTeamMember;
  onBack: () => void;
  onStartParticipantSession: (
    referralToken: string | null,
    validation: RecruitmentTokenValidation | null
  ) => Promise<void>;
}

export const EnrollmentPrepView: React.FC<EnrollmentPrepViewProps> = ({
  member,
  onBack,
  onStartParticipantSession
}) => {
  const [links, setLinks] = useState<RecruitmentLink[]>([]);
  const [linksLoading, setLinksLoading] = useState<boolean>(true);
  const [linksError, setLinksError] = useState<string | null>(null);

  const [selectedToken, setSelectedToken] = useState<string>('');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [validation, setValidation] = useState<RecruitmentTokenValidation | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLinksLoading(true);
    setLinksError(null);

    researchStore
      .fetchPermittedRecruitmentLinks()
      .then(fetched => {
        if (!active) return;
        setLinks(fetched);

        // Pre-select the first active, non-expired link belonging to this member (or first available)
        const activeLinks = fetched.filter(l => {
          const notExpired = !l.expiresAt || new Date(l.expiresAt) > new Date();
          const hasUsesLeft = l.maxUses === null || l.maxUses === undefined || l.usesCount < l.maxUses;
          return l.isActive && notExpired && hasUsesLeft;
        });

        const ownPreferred = activeLinks.find(l => l.researcherId === member.id) || activeLinks[0];
        if (ownPreferred) {
          setSelectedToken(ownPreferred.token);
          setManualTokenInput(ownPreferred.token);
          setValidation({
            isValid: true,
            researcherCode: member.role === 'pi' ? null : member.researcherCode,
            linkLabel: ownPreferred.label ?? null
          });
          // Validate via RPC to show exact researcherCode attribution
          void researchStore
            .validateReferralToken(ownPreferred.token)
            .then(res => {
              if (active) setValidation(res);
            })
            .catch(() => undefined);
        }
      })
      .catch(err => {
        if (!active) return;
        setLinksError(
          err instanceof Error ? err.message : 'Unable to load recruitment links from Supabase.'
        );
      })
      .finally(() => {
        if (active) setLinksLoading(false);
      });

    return () => {
      active = false;
    };
  }, [member.id, member.researcherCode, member.role]);

  const handleSelectLink = async (token: string) => {
    setSelectedToken(token);
    setManualTokenInput(token);
    setStartError(null);
    if (!token) {
      setValidation(null);
      return;
    }
    setIsValidating(true);
    try {
      const res = await researchStore.validateReferralToken(token);
      setValidation(res);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Token validation failed.');
      setValidation({ isValid: false, researcherCode: null, linkLabel: null });
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateManualToken = async () => {
    const clean = manualTokenInput.trim();
    setStartError(null);
    if (!clean) {
      setSelectedToken('');
      setValidation(null);
      return;
    }
    setIsValidating(true);
    try {
      const res = await researchStore.validateReferralToken(clean);
      setValidation(res);
      if (res.isValid) {
        setSelectedToken(clean);
      } else {
        setSelectedToken('');
      }
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Unable to validate token.');
      setValidation({ isValid: false, researcherCode: null, linkLabel: null });
    } finally {
      setIsValidating(false);
    }
  };

  const handleLaunchSession = async () => {
    if (isStarting) return;
    setStartError(null);

    const tokenToUse = selectedToken.trim() || null;

    // For researchers, require a valid active token if they have entered one or if active links exist
    if (manualTokenInput.trim() && (!validation || !validation.isValid)) {
      setStartError('Please validate a valid active recruitment token or clear the token field.');
      return;
    }

    setIsStarting(true);
    try {
      let finalValidation = validation;
      if (tokenToUse) {
        finalValidation = await researchStore.validateReferralToken(tokenToUse);
        if (!finalValidation.isValid) {
          setValidation(finalValidation);
          setStartError('Selected recruitment link is no longer valid or active.');
          setIsStarting(false);
          return;
        }
      }

      await onStartParticipantSession(tokenToUse, finalValidation);
    } catch (err) {
      setStartError(
        err instanceof Error
          ? err.message
          : 'Unable to hand over browser session to participant.'
      );
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8.5rem)] bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            disabled={isStarting}
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {member.role === 'pi' ? 'PI Dashboard' : 'Researcher Portal'}</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="text-xs font-mono text-teal-700 font-semibold">
                SUPERVISED ENROLLMENT PREPARATION
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Enroll New Study Participant
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Initiated by {member.fullName} ({member.researcherCode} ·{' '}
                {member.role === 'pi' ? 'Principal Investigator' : 'Researcher'})
              </p>
            </div>
          </div>

          {/* Step 1: Select or Validate Recruitment Link */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <Link2 className="w-4 h-4 text-teal-600" />
              <span>1. Select or Validate Recruitment Link Attribution</span>
            </div>

            {linksLoading ? (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
                Loading active recruitment links...
              </div>
            ) : linksError ? (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {linksError}
              </div>
            ) : links.length > 0 ? (
              <div className="space-y-2">
                {links.map(link => {
                  const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
                  const maxReached =
                    link.maxUses !== null && link.maxUses !== undefined && link.usesCount >= link.maxUses;
                  const usable = link.isActive && !isExpired && !maxReached;
                  const isSelected = selectedToken === link.token;

                  return (
                    <label
                      key={link.id}
                      className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-xs transition-colors ${
                        !usable
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-teal-50/70 border-teal-600 cursor-pointer'
                          : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="radio"
                          name="recruitmentLink"
                          disabled={!usable || isStarting}
                          checked={isSelected}
                          onChange={() => void handleSelectLink(link.token)}
                          className="text-teal-600 focus:ring-teal-600"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {link.label || 'Standard Recruitment Link'}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 truncate">
                            Token: {link.token}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] shrink-0">
                        <span className="text-slate-700 font-semibold block tabular-nums">
                          {link.usesCount} / {link.maxUses ?? '∞'} uses
                        </span>
                        <span className={usable ? 'text-emerald-700' : 'text-slate-500'}>
                          {usable ? 'Active' : isExpired ? 'Expired' : maxReached ? 'Limit reached' : 'Inactive'}
                        </span>
                      </div>
                    </label>
                  );
                })}

                {member.role === 'pi' && (
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer ${
                      selectedToken === '' && !manualTokenInput.trim()
                        ? 'bg-teal-50/70 border-teal-600'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recruitmentLink"
                      disabled={isStarting}
                      checked={selectedToken === '' && !manualTokenInput.trim()}
                      onChange={() => void handleSelectLink('')}
                      className="text-teal-600 focus:ring-teal-600"
                    />
                    <span className="font-medium text-slate-700">
                      Direct Enrollment (No referral link attribution)
                    </span>
                  </label>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                No pre-assigned recruitment links were found in <code className="font-mono">recruitment_links</code> for your account. You can validate a token manually below or proceed with direct enrollment if permitted.
              </div>
            )}

            {/* Manual Token Verification */}
            <div className="pt-2">
              <label
                htmlFor="manual-referral-token"
                className="block text-[11px] font-semibold text-slate-700 mb-1"
              >
                Or Enter / Verify Recruitment Token Manually
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="manual-referral-token"
                  type="text"
                  disabled={isStarting}
                  value={manualTokenInput}
                  onChange={e => {
                    setManualTokenInput(e.target.value);
                    setValidation(null);
                    if (!e.target.value.trim()) setSelectedToken('');
                  }}
                  placeholder="Enter recruitment token..."
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  disabled={isValidating || isStarting || !manualTokenInput.trim()}
                  onClick={() => void handleValidateManualToken()}
                  className="px-4 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 border border-teal-200 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {isValidating ? 'Validating...' : 'Validate Token'}
                </button>
              </div>
            </div>

            {/* Validation Status */}
            {validation && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  validation.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {validation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  {validation.isValid ? (
                    <span>
                      Valid recruitment token verified · Attributed to{' '}
                      <strong className="font-mono">{validation.researcherCode}</strong>
                      {validation.linkLabel ? ` (${validation.linkLabel})` : ''}.
                    </span>
                  ) : (
                    <span>
                      This recruitment token is invalid, inactive, expired, or has reached its usage limit.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Session Isolation & Handoff Protocol */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2 leading-relaxed">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-900 block">
                  Browser Session Isolation Notice
                </strong>
                Clicking <strong>START PARTICIPANT SESSION</strong> will:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>
                    Immediately sign out your authenticated researcher session (no researcher credentials or permissions remain in the browser).
                  </li>
                  <li>
                    Create a brand-new anonymous Supabase Auth identity exclusively for this participant via <code className="font-mono text-[11px]">ensureAnonymousParticipantAuth()</code>.
                  </li>
                  <li>
                    Launch the 8-stage participant study flow and require fresh researcher sign-in after the participant finishes debriefing.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {startError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{startError}</span>
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Hand device to the clinician participant after clicking start.
            </span>

            <button
              type="button"
              disabled={isStarting || isValidating}
              onClick={() => void handleLaunchSession()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>
                {isStarting
                  ? 'Ending Researcher Session & Starting...'
                  : 'START PARTICIPANT SESSION'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
