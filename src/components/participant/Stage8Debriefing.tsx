import React from 'react';
import {
  Printer,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { Participant } from '../../types';

interface Stage8DebriefingProps {
  participant: Participant;
  onRestart: () => void;
  onOpenResearcherDashboard: () => void;
  protocolNumber: string;
}

export const Stage8Debriefing: React.FC<Stage8DebriefingProps> = ({
  participant,
  onRestart,
  onOpenResearcherDashboard,
  protocolNumber
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
          <span>STAGE 07 / 07</span>
          <span aria-hidden="true">·</span>
          <span>SESSION COMPLETION & DEBRIEFING</span>
          <span aria-hidden="true">·</span>
          <span>PROTOCOL {protocolNumber}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Post-Participation Ethical Debriefing & Disclosures
        </h2>

        {/* Participant Session Details Ribbon (Unboxed) */}
        <div className="mt-5 p-4 rounded bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Anonymous Token</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{participant.code}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Designation</span>
            <span className="font-medium text-slate-900">{participant.designation === 'Other' && participant.designationOther ? participant.designationOther : participant.designation}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Specialty</span>
            <span className="font-medium text-slate-900">{participant.specialty === 'Other' && participant.specialtyOther ? participant.specialtyOther : participant.specialty}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-mono">Dataset Status</span>
            <span className="font-mono text-slate-900 font-semibold">SECURED & RECORDED</span>
          </div>
        </div>

        {/* Ethical Deception Disclosure Box */}
        <div className="mt-6 p-5 rounded border border-slate-200 bg-slate-50/80 space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
            Experimental Disclosure Regarding Standardized AI Stimuli
          </h3>

          <p className="text-xs text-slate-700 leading-relaxed">
            During Stage 5 (CDSS), you evaluated five standardized clinical cases alongside CDSS suggestions. To rigorously assess <strong>automation bias, cognitive offloading, and verification vigilance</strong>, the CDSS outputs were <strong>pre-calibrated research stimuli</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded bg-white border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block mb-0.5">2 Clinically Appropriate Recommendations</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hyperosmolar Hyperglycaemic State with Urosepsis/Hypokalaemia (Case 4) and Post-Diarrhoeal Haemolytic Uraemic Syndrome / TMA (Case 5) evaluated appropriate adoption of evidence-based guidance.
              </p>
            </div>

            <div className="p-3 rounded bg-white border border-slate-200 text-xs">
              <span className="font-bold text-slate-900 block mb-0.5">3 Deliberately Misleading Recommendations</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Posterior Wall STEMI Equivalent (diagnostic anchoring), Acute MCA Stroke on Apixaban (harmful thrombolysis advice), and Near-Fatal Asthma with Silent Chest (investigation inversion) tested whether clinicians detected safety violations or blindly deferred.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            All outputs were fixed, researcher-designed experimental stimuli and do not reflect the accuracy of any clinical machine learning model or institutional guideline.
          </p>
        </div>

        {/* Methodological Context Note */}
        <div className="mt-5 p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 block">
            Methodological Scope & Limitations
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            This study is a controlled academic simulation. Scores across the Vignette Cases reflect simulated independent task performance rather than permanent clinical cognitive deskilling. Self-reported survey responses capture work-related GenAI exposure over the past 3 months.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-5 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate of Participation</span>
            </button>
            <button
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>

          <button
            onClick={onOpenResearcherDashboard}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
          >
            <span>Open Researcher Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
