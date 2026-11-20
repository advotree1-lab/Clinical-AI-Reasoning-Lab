import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Stage1WelcomeProps {
  onBegin: () => void;
  institutionName: string;
  protocolNumber: string;
}

export const Stage1Welcome: React.FC<Stage1WelcomeProps> = ({
  onBegin,
  institutionName,
  protocolNumber
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata Ribbon */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-3">
          <span>MEDICAL RESEARCH SIMULATION</span>
          <span aria-hidden="true">·</span>
          <span>PROTOCOL {protocolNumber}</span>
          <span aria-hidden="true">·</span>
          <span>IRB APPROVED</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
          Clinical AI Reasoning Lab
        </h1>
        
        <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          An experimental research simulation evaluating generative AI exposure, automation bias, cognitive offloading behaviors, and independent clinical reasoning among medical doctors.
        </p>

        {/* Institutional Governance Box */}
        <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">Academic Affiliation: </span>
          Conducted by the {institutionName}. This software administers a structured GenAI exposure survey alongside controlled clinical vignette stimuli to measure diagnostic revision, verification rigor, and independent clinical reasoning.
        </div>

        {/* 4 Core Research Dimensions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-slate-200/70 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              01. GenAI Exposure & Workflow Integration
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Examines frequency, clinical duration, access channels, and privacy practices of generative AI usage during work-related duties over the past 3 months.
            </p>
          </div>

          <div className="p-4 rounded border border-slate-200/70 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              02. Cognitive Offloading Across Clinical Tasks
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates task-level offloading across differential generation, investigation interpretation, management planning, dosing, and literature synthesis.
            </p>
          </div>

          <div className="p-4 rounded border border-slate-200/70 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              03. Automation Bias Evaluation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Measures diagnostic switching and acceptance rates when clinicians evaluate standardized clinically appropriate versus subtly misleading AI recommendations.
            </p>
          </div>

          <div className="p-4 rounded border border-slate-200/70 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              04. Independent Clinical Reasoning (Vignette Cases)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assesses unaided diagnostic formulation, differential identification, red flag recognition, and immediate clinical management steps across Vignette Cases.
            </p>
          </div>
        </div>

        {/* Non-Clinical Notice */}
        <div className="mt-6 p-3.5 rounded bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 leading-relaxed">
          <span className="font-semibold text-amber-900">Research Stimuli Notice: </span>
          All clinical cases, investigations, and AI consultation outputs in this system are controlled research stimuli. They are designed for behavioral assessment and must not be used for actual patient care.
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 pt-6 border-t border-slate-200/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Estimated Duration: ~15 Minutes · Anonymous Session
          </span>
          <button
            onClick={onBegin}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
          >
            <span>Proceed to Informed Consent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
