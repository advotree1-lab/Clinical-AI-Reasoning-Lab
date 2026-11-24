import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Stage2EligibilityProps {
  onConfirmEligible: () => void;
  onBack: () => void;
  isDemoMode: boolean;
  initialConfirmed?: boolean;
}

export const Stage2Eligibility: React.FC<Stage2EligibilityProps> = ({
  onConfirmEligible,
  onBack,
  isDemoMode,
  initialConfirmed = false
}) => {
  const [isMedicalDoctor, setIsMedicalDoctor] = useState(initialConfirmed);
  const [isClinicallyActive, setIsClinicallyActive] = useState(initialConfirmed);
  const [willAvoidExternalAi, setWillAvoidExternalAi] = useState(initialConfirmed);
  const [firstTimeParticipant, setFirstTimeParticipant] = useState(initialConfirmed);
  const [declinedEligibility, setDeclinedEligibility] = useState(false);

  useEffect(() => {
    if (initialConfirmed) {
      setIsMedicalDoctor(true);
      setIsClinicallyActive(true);
      setWillAvoidExternalAi(true);
      setFirstTimeParticipant(true);
      setDeclinedEligibility(false);
    }
  }, [initialConfirmed]);

  const allConfirmed =
    isMedicalDoctor && isClinicallyActive && willAvoidExternalAi && firstTimeParticipant;
  const isBlocked = !isDemoMode && !allConfirmed;

  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-6 sm:p-10 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-mono text-teal-700 mb-2">
          <span>STAGE 02 / 08</span>
          <span aria-hidden="true">·</span>
          <span>PARTICIPANT ELIGIBILITY CHECK</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Eligibility Confirmation
        </h2>

        <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          Please confirm that you meet all study inclusion criteria before viewing the Participant Information Sheet and Informed Consent.
        </p>

        <div className="mt-6 space-y-3">
          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-600/50 hover:bg-teal-50/20 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isMedicalDoctor}
              onChange={(e) => {
                setIsMedicalDoctor(e.target.checked);
                setDeclinedEligibility(false);
              }}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <span className="text-xs sm:text-sm text-slate-800 leading-snug">
              <strong className="text-slate-900">Qualified Medical Doctor:</strong> I hold an MBBS (or equivalent primary medical degree) and am currently working as a resident, medical officer, fellow, consultant, or faculty physician.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-600/50 hover:bg-teal-50/20 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={isClinicallyActive}
              onChange={(e) => {
                setIsClinicallyActive(e.target.checked);
                setDeclinedEligibility(false);
              }}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <span className="text-xs sm:text-sm text-slate-800 leading-snug">
              <strong className="text-slate-900">Active Clinical Decision-Making:</strong> I participate in patient assessment, diagnostic formulation, or investigation and management decisions in clinical practice.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-600/50 hover:bg-teal-50/20 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={willAvoidExternalAi}
              onChange={(e) => {
                setWillAvoidExternalAi(e.target.checked);
                setDeclinedEligibility(false);
              }}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <span className="text-xs sm:text-sm text-slate-800 leading-snug">
              <strong className="text-slate-900">Standardized Simulation Conditions:</strong> I agree to evaluate the research cases independently without consulting external Generative AI tools or search engines during the simulation.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 hover:border-teal-600/50 hover:bg-teal-50/20 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={firstTimeParticipant}
              onChange={(e) => {
                setFirstTimeParticipant(e.target.checked);
                setDeclinedEligibility(false);
              }}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <span className="text-xs sm:text-sm text-slate-800 leading-snug">
              <strong className="text-slate-900">Single Enrolment:</strong> I have not previously completed this Clinical AI Reasoning Lab study.
            </span>
          </label>
        </div>

        {allConfirmed && (
          <div className="mt-5 p-3.5 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-2.5 text-xs text-teal-900 font-medium">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Eligibility confirmed. You may now review the Participant Information Sheet &amp; Consent.</span>
          </div>
        )}

        {declinedEligibility && (
          <div className="mt-5 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-amber-900">Not Eligible for Protocol Enrollment</strong>
              Thank you for your interest. Enrollment in this simulation requires meeting all four inclusion criteria above. You may return to the study introduction page or close this window.
            </div>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setDeclinedEligibility(true)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer"
            >
              I do not meet these criteria
            </button>
          </div>

          <button
            type="button"
            onClick={onConfirmEligible}
            disabled={isBlocked}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <span>Confirm Eligibility &amp; View Consent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
