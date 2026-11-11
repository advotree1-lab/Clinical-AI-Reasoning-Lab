import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, X } from 'lucide-react';

interface ResearcherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: () => void;
  configuredPasscode: string;
}

export const ResearcherAuthModal: React.FC<ResearcherAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticate,
  configuredPasscode
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === configuredPasscode) {
      setError(false);
      onAuthenticate();
    } else {
      setError(true);
    }
  };

  const handleQuickDemoUnlock = () => {
    setPasscode(configuredPasscode);
    setError(false);
    onAuthenticate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Researcher & Admin Access</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            This portal contains unmasked answer keys, ground-truth AI classifications (misleading vs appropriate), participant statistical records, and scoring rubrics.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Research Protocol Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter access code..."
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-mono tracking-wider focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-emerald-200 focus:border-emerald-600'
                  }`}
                />
                <KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
              {error && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  Incorrect passcode. (Default demo passcode: LAB2026)
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Authenticate & Enter
              </button>
              <button
                type="button"
                onClick={handleQuickDemoUnlock}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Quickly fill LAB2026 for demonstration to guide/professor"
              >
                Demo Unlock (LAB2026)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
