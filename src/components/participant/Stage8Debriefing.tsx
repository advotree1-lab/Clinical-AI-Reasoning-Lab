import React from 'react';
import {
  Printer,
  CheckCircle2,
  Lock,
  RotateCcw,
  ShieldCheck,
  BookOpen,
  ClipboardCheck
} from 'lucide-react';
import { Participant } from '../../types';
import { BrandMark } from '../common/BrandLogo';

interface Stage8DebriefingProps {
  participant: Participant;
  institutionName?: string;
  cdssCompletedCount?: number;
  cdssTotalCount?: number;
  vignettesCompletedCount?: number;
  vignettesTotalCount?: number;
  onRepeatStudyFlow?: () => void;
  onCompleteReturnToLogin: () => void;
  protocolNumber: string;
}

export const Stage8Debriefing: React.FC<Stage8DebriefingProps> = ({
  participant,
  institutionName = 'Ayaan Medical College',
  cdssCompletedCount = 5,
  cdssTotalCount = 5,
  vignettesCompletedCount = 6,
  vignettesTotalCount = 6,
  onRepeatStudyFlow,
  onCompleteReturnToLogin,
  protocolNumber
}) => {
  const displayDesignation =
    participant.designation === 'Other' && participant.designationOther
      ? participant.designationOther
      : participant.designation;

  const displaySpecialty =
    participant.specialty === 'Other' && participant.specialtyOther
      ? participant.specialtyOther
      : participant.specialty;

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Top Academic Header Band */}
        <div className="bg-slate-900 text-white px-6 sm:px-10 py-7 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/95 border border-slate-200/30 shadow-xs shrink-0 flex items-center justify-center">
                <BrandMark size={44} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-teal-300 uppercase tracking-wider mb-1">
                  <span>STAGE 08 / 08</span>
                  <span aria-hidden="true">·</span>
                  <span>PROTOCOL {protocolNumber}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Study Completion &amp; Academic Debriefing
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Clinical AI Reasoning Lab · {institutionName}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300 shrink-0 self-start sm:self-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">8 / 8 STAGES COMPLETE</span>
            </div>
          </div>

          {/* Milestone Completion Progress Strip */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <span className="text-slate-300">Consent &amp; Survey</span>
              <span className="font-mono font-bold text-emerald-300 tabular-nums">Recorded</span>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <span className="text-slate-300">CDSS Simulation Cases</span>
              <span className="font-mono font-bold text-emerald-300 tabular-nums">
                {cdssCompletedCount} / {cdssTotalCount} Submitted
              </span>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
              <span className="text-slate-300">Unaided Clinical Vignettes</span>
              <span className="font-mono font-bold text-emerald-300 tabular-nums">
                {vignettesCompletedCount} / {vignettesTotalCount} Submitted
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-6">
          {/* Respectful Study-Completion Acknowledgement */}
          <div className="p-4 sm:p-5 rounded-lg bg-teal-50/80 border border-teal-200 flex items-start gap-3.5 text-xs text-teal-950 leading-relaxed">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-teal-950">
                Thank You for Completing the Study
              </h3>
              <p>
                All workflow stages have been completed and your responses have been securely saved under your anonymous research identifier. No identifying clinical or personal details are retained, and your session is ready to close.
              </p>
            </div>
          </div>

          {/* Anonymous Session Record Card */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">
                Anonymous Study ID
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {participant.code}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">
                Designation
              </span>
              <span className="font-semibold text-slate-900">{displayDesignation}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">
                Specialty
              </span>
              <span className="font-semibold text-slate-900">{displaySpecialty}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">
                Record Status
              </span>
              <span className="font-mono text-emerald-700 font-bold">LOCKED &amp; ARCHIVED</span>
            </div>
          </div>

          {/* Section 1: Purpose & Experimental Disclosure */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                Study Purpose &amp; Experimental Disclosure
              </h3>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              This study investigates how generative AI exposure and Clinical Decision Support System (CDSS) recommendations relate to independent clinical reasoning, diagnostic verification behavior, and cognitive offloading among medical doctors.
            </p>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-[13px] text-slate-900 leading-relaxed">
              <p className="font-semibold text-slate-900">
                CDSS Cases 3, 4 and 5 contained misleading or intentionally incorrect AI/CDSS recommendations, according to the study&apos;s approved case design.
              </p>
              <p className="text-slate-700 mt-1.5">
                These three cases were included specifically to examine how clinicians evaluate and respond when AI-generated clinical guidance conflicts with bedside clinical findings, diagnostic investigations, or patient-safety principles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-xs space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-teal-800 block">
                  CDSS Cases 1 &amp; 2 · Clinically Appropriate
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Case 1 (Hyperosmolar Hyperglycaemic State with overlap ketoacidosis, urosepsis, and hypokalaemia) and Case 2 (Shiga toxin-associated HUS / TMA) presented evidence-aligned CDSS suggestions.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 text-xs space-y-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-slate-800 block">
                  CDSS Cases 3, 4 &amp; 5 · Intentionally Misleading Stimuli
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Case 3 (Posterior STEMI equivalent), Case 4 (Acute MCA stroke with recent apixaban), and Case 5 (Near-fatal asthma with silent chest) presented pre-designed inaccurate CDSS stimuli to study clinical scrutiny.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Clinical Reasoning & Safe AI Verification Principles */}
          <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/80">
              <BookOpen className="w-4 h-4 text-teal-700 shrink-0" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                Clinical Reasoning &amp; Critical Evaluation Principles
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Independent Clinical Reasoning</h4>
                <p>
                  Forming a primary differential diagnosis from history, vitals, physical examination, and primary data before consulting automated systems reduces premature anchoring and preserves diagnostic vigilance.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Critical Evaluation of AI Outputs</h4>
                <p>
                  Fluent or authoritative automated outputs can still omit critical contraindications, misinterpret subtle ECG or imaging cues, or invert deteriorating clinical trends.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Evidence &amp; Patient-Context Verification</h4>
                <p>
                  AI-generated suggestions should always be cross-checked against primary investigations, current clinical guidelines, medication history, and real-time bedside trajectory.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Decision Support, Not Replacement</h4>
                <p>
                  AI and CDSS tools serve strictly as adjunct decision-support aids and never replace professional clinical judgement, accountability, or multidisciplinary bedside review.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1 text-[11px] text-slate-600 leading-relaxed">
              <ClipboardCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <p>
                All scenarios in this simulation were standardized academic research stimuli analysed purely in aggregate for scientific inquiry, without individual performance grading or clinical attribution.
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Participation Summary</span>
            </button>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5">
              {onRepeatStudyFlow && (
                <button
                  type="button"
                  onClick={onRepeatStudyFlow}
                  title="Review completed workflow stages (submitted cases remain locked read-only)"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Review Completed Workflow</span>
                </button>
              )}

              <button
                type="button"
                onClick={onCompleteReturnToLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Complete &amp; Close Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
