import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Stage2ConsentProps {
  onConsent: () => void;
  onBack: () => void;
  protocolNumber: string;
}

export const Stage2Consent: React.FC<Stage2ConsentProps> = ({
  onConsent,
  onBack,
  protocolNumber
}) => {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedAnonymous, setAgreedAnonymous] = useState(false);
  const [agreedSimulated, setAgreedSimulated] = useState(false);

  const canProceed = agreedTerms && agreedAnonymous && agreedSimulated;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
          <span>STAGE 02 / 08</span>
          <span aria-hidden="true">·</span>
          <span>INFORMED CONSENT & TERMS</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Participant Information Sheet & Consent
        </h2>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Please review the study parameters and ethical terms before confirming your voluntary participation.
        </p>

        {/* Scrollable Information Sheet */}
        <div className="mt-5 p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-4 max-h-72 overflow-y-auto leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 font-mono">
              1. Nature and Purpose of the Study
            </h3>
            <p>
              This investigation evaluates physician decision-making, clinical reasoning, and verification behavior when interacting with simulated artificial intelligence recommendations.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 font-mono">
              2. Voluntary Participation
            </h3>
            <p>
              Participation is entirely voluntary. You may decline to answer any specific question or discontinue participation at any time without negative consequence or loss of benefit.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 font-mono">
              3. Data Anonymization & Confidentiality
            </h3>
            <p>
              No personally identifiable clinical or personal data is collected. All data points are linked solely to an anonymous identifier (e.g., DOC-XXXX). Aggregated data will be analyzed for dissertation and academic publication purposes only.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1 font-mono">
              4. Research Stimuli Clarification
            </h3>
            <p>
              All patient scenarios and AI outputs in this simulation are controlled research stimuli designed to observe diagnostic interaction. They do not constitute real clinical decision support.
            </p>
          </div>
        </div>

        {/* Affirmative Checkboxes */}
        <div className="mt-6 space-y-3">
          <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-800 leading-normal font-medium">
              I confirm that I have read the participant information sheet and voluntarily agree to participate in this study.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreedAnonymous}
              onChange={(e) => setAgreedAnonymous(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-800 leading-normal font-medium">
              I understand that my responses are recorded anonymously under Protocol Ref: {protocolNumber}.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded border border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={agreedSimulated}
              onChange={(e) => setAgreedSimulated(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-800 leading-normal font-medium">
              I understand that all clinical scenarios and AI outputs are standardized experimental stimuli.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-5 border-t border-slate-200/70 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            onClick={onConsent}
            disabled={!canProceed}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded transition-colors ${
              canProceed
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <span>Confirm Consent & Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
