import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Participant } from '../../types';

interface PrototypeDemoBarProps {
  currentStage: number;
  onJumpToStage: (stage: number) => void;
  onQuickFillStep: () => void;
  onLoadCompleteSession: () => void;
  onResetSession: () => void;
  participant: Participant | null;
}

export const PrototypeDemoBar: React.FC<PrototypeDemoBarProps> = ({
  currentStage,
  onJumpToStage,
  onQuickFillStep,
  onLoadCompleteSession,
  onResetSession,
  participant
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const stageNames = [
    { num: 1, label: 'Welcome' },
    { num: 2, label: 'Eligibility' },
    { num: 3, label: 'Consent' },
    { num: 4, label: 'ID & Profile' },
    { num: 5, label: 'Survey' },
    { num: 6, label: 'CDSS (5)' },
    { num: 7, label: 'Vignettes (6)' },
    { num: 8, label: 'Debriefing' }
  ];

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-sm sticky top-16 z-30 font-sans transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left Title Lockup */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Prototype Walkthrough
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                {participant ? `${participant.code} · ${participant.designation}` : 'Protocol Demonstration Active'}
              </span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onQuickFillStep}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors shadow-2xs"
              title="Automatically fill current stage with realistic resident physician data and advance"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Auto-Fill Step</span>
            </button>

            <button
              onClick={onLoadCompleteSession}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded transition-colors border border-slate-700"
              title="Instantly generate a complete participant run across all 7 stages"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Populate Full Run</span>
            </button>

            <button
              onClick={onResetSession}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Reset walkthrough to Stage 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse stage selector' : 'Expand stage selector'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

        {/* Step Selector Ribbon */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider mr-1.5 shrink-0">
              Jump:
            </span>
            {stageNames.map(s => {
              const isActive = currentStage === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => onJumpToStage(s.num)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70 mr-1">{s.num}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
