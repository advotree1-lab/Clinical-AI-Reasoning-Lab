import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ClinicalCase, Participant, VignetteAnswerRecord } from '../../types';
import { ClinicalImageGallery } from '../common/ClinicalImageGallery';

interface Stage7PostAiAssessmentProps {
  cases: ClinicalCase[];
  participant: Participant;
  onComplete: (answers: VignetteAnswerRecord[]) => void;
  isDemoMode: boolean;
}

export const Stage7PostAiAssessment: React.FC<Stage7PostAiAssessmentProps> = ({
  cases,
  participant,
  onComplete,
  isDemoMode
}) => {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, {
    mostLikelyDiagnosis: string;
    customOtherDiagnosis: string;
    differential1: string;
    differential2: string;
    redFlags: string;
    nextStep: string;
    confidence: number;
  }>>({});

  const currentCase = cases[currentCaseIndex];

  const currentAnswer = answers[currentCase.id] || {
    mostLikelyDiagnosis: currentCase.mcqOptions[0],
    customOtherDiagnosis: '',
    differential1: '',
    differential2: '',
    redFlags: '',
    nextStep: '',
    confidence: 3
  };

  const updateCurrentAnswer = (field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentCase.id]: {
        ...currentAnswer,
        [field]: value
      }
    }));
  };

  const isCurrentValid = () => {
    const isOther = currentAnswer.mostLikelyDiagnosis === 'Other';
    if (isOther && !currentAnswer.customOtherDiagnosis.trim()) return false;
    if (!currentAnswer.differential1.trim() || !currentAnswer.differential2.trim()) return false;
    if (!currentAnswer.redFlags.trim()) return false;
    if (!currentAnswer.nextStep.trim()) return false;
    return true;
  };

  const handleNext = () => {
    if (currentCaseIndex < cases.length - 1) {
      setCurrentCaseIndex(currentCaseIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleCompleteAll();
    }
  };

  const handleCompleteAll = () => {
    const finalRecords: VignetteAnswerRecord[] = cases.map(c => {
      const a = answers[c.id] || {
        mostLikelyDiagnosis: c.mcqOptions[0],
        customOtherDiagnosis: '',
        differential1: '',
        differential2: '',
        redFlags: '',
        nextStep: '',
        confidence: 3
      };
      const actualDiagnosis =
        a.mostLikelyDiagnosis === 'Other' && a.customOtherDiagnosis.trim()
          ? a.customOtherDiagnosis.trim()
          : a.mostLikelyDiagnosis;

      return {
        id: `post-${participant.id}-${c.id}`,
        participantId: participant.id,
        caseId: c.id,
        stage: 'post_ai',
        isDemo: isDemoMode,
        mostLikelyDiagnosis: actualDiagnosis,
        differential1: a.differential1.trim() || 'Not entered (Prototype skip)',
        differential2: a.differential2.trim() || 'Not entered (Prototype skip)',
        redFlags: a.redFlags.trim() || 'Not entered (Prototype skip)',
        nextStep: a.nextStep.trim() || 'Not entered (Prototype skip)',
        confidence: a.confidence,
        submittedAt: new Date().toISOString()
      };
    });

    onComplete(finalRecords);
  };

  const handlePrev = () => {
    if (currentCaseIndex > 0) {
      setCurrentCaseIndex(currentCaseIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Transition Banner */}
      <div className="mb-5 p-3.5 rounded bg-slate-100 border border-slate-300 text-xs text-slate-800 leading-relaxed font-mono">
        <strong>PROTOCOL TRANSITION:</strong> CDSS phase complete. Independent Vignette Cases active. External tools and CDSS recommendations are unavailable.
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200/80 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>STAGE 06 / 07</span>
              <span aria-hidden="true">·</span>
              <span>VIGNETTE CASES</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Vignette Case {currentCaseIndex + 1} of {cases.length}: {currentCase.domain}
            </h2>
          </div>

          {/* Unrestricted Clickable Stepper */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
              Cases:
            </span>
            {cases.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCurrentCaseIndex(i);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                title={`Jump to Vignette Case ${i + 1}: ${c.domain}`}
                className={`w-8 h-8 rounded text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  i === currentCaseIndex
                    ? 'bg-slate-900 text-white'
                    : answers[c.id]
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Clinical Vignette Box */}
        <div className="mt-6 space-y-4">
          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Clinical Presentation
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {currentCase.presentation}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Medical & Treatment History
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentCase.medicalHistory}
              </p>
            </div>

            {/* Vitals */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5">
                Current Triage Vitals
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Heart Rate</div>
                  <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.heartRate}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Blood Pressure</div>
                  <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.bloodPressure}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Resp. Rate</div>
                  <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.respiratoryRate}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">SpO2</div>
                  <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.spO2}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 uppercase font-sans">Temperature</div>
                  <div className="font-bold text-slate-900 tabular-nums">{currentCase.vitals.temperature}</div>
                </div>
              </div>
            </div>

            {/* Physical Exam */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Physical Examination
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {currentCase.physicalExamination}
              </p>
            </div>

            {/* Investigations */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
                Diagnostic Investigations
              </span>
              <div className="space-y-1">
                {currentCase.investigations.map((inv, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs gap-1"
                  >
                    <span className="font-medium text-slate-800">{inv.name}</span>
                    <span className={`font-mono tabular-nums ${inv.isAbnormal ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                      {inv.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Clinical Imaging / ECG */}
            <ClinicalImageGallery images={currentCase.clinicalImages} />
          </div>

          {/* Reasoning Fields */}
          <div className="p-6 rounded border border-slate-200 bg-white space-y-6">
            <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Independent Clinical Formulation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unaided independent assessment. Complete all four clinical reasoning criteria.
                </p>
              </div>

              {/* Auto-Fill Button */}
              <button
                type="button"
                onClick={() => {
                  updateCurrentAnswer('mostLikelyDiagnosis', currentCase.goldStandardDiagnosis);
                  updateCurrentAnswer('differential1', currentCase.differentialDiagnosisKeys[0] || 'Competing Differential 1');
                  updateCurrentAnswer('differential2', currentCase.differentialDiagnosisKeys[1] || 'Competing Differential 2');
                  updateCurrentAnswer('redFlags', currentCase.redFlagKeys[0] || 'Hemodynamic instability and urgent clinical indicators');
                  updateCurrentAnswer('nextStep', currentCase.nextManagementStepKey || 'Immediate protocol resuscitation and diagnostic confirmation');
                  updateCurrentAnswer('confidence', 4);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded transition-colors shrink-0 self-start sm:self-auto"
                title="Fill realistic clinical answers for this case"
              >
                <span>⚡ Auto-Fill This Case</span>
              </button>
            </div>

            {/* 1. Most Likely Diagnosis */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2 font-mono">
                1. Most Likely Primary Diagnosis
              </label>
              <div className="space-y-1.5">
                {currentCase.mcqOptions.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors text-xs ${
                      currentAnswer.mostLikelyDiagnosis === opt
                        ? 'border-slate-900 bg-slate-50 font-semibold text-slate-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`post-mcq-${currentCase.id}`}
                      checked={currentAnswer.mostLikelyDiagnosis === opt}
                      onChange={() => updateCurrentAnswer('mostLikelyDiagnosis', opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {currentAnswer.mostLikelyDiagnosis === 'Other' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={currentAnswer.customOtherDiagnosis}
                    onChange={(e) => updateCurrentAnswer('customOtherDiagnosis', e.target.value)}
                    placeholder="Specify alternative primary diagnosis..."
                    className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* 2. Differential Diagnoses */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                2. Two Relevant Differential Diagnoses (Short Text)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={currentAnswer.differential1}
                  onChange={(e) => updateCurrentAnswer('differential1', e.target.value)}
                  placeholder="Differential 1..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={currentAnswer.differential2}
                  onChange={(e) => updateCurrentAnswer('differential2', e.target.value)}
                  placeholder="Differential 2..."
                  className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* 3. Red Flags */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                3. Critical Red Flags & Risk Indicators (Short Text)
              </label>
              <input
                type="text"
                value={currentAnswer.redFlags}
                onChange={(e) => updateCurrentAnswer('redFlags', e.target.value)}
                placeholder="Key danger signs, life-threatening complications, or hemodynamic parameters..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
              />
            </div>

            {/* 4. Next Step */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5 font-mono">
                4. Most Appropriate Next Investigation or Management Step (Short Text)
              </label>
              <input
                type="text"
                value={currentAnswer.nextStep}
                onChange={(e) => updateCurrentAnswer('nextStep', e.target.value)}
                placeholder="Immediate pharmacotherapy, intervention, or confirmatory test..."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
              />
            </div>

            {/* 5. Confidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  5. Diagnostic Confidence Rating
                </label>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {currentAnswer.confidence} / 5
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateCurrentAnswer('confidence', lvl)}
                    className={`py-2 px-1 text-center rounded border transition-colors text-xs ${
                      currentAnswer.confidence === lvl
                        ? 'bg-slate-900 text-white font-bold border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-mono font-bold">{lvl}</div>
                    <div className="text-[10px] hidden sm:block opacity-80">
                      {lvl === 1 ? 'Very Low' : lvl === 3 ? 'Moderate' : lvl === 5 ? 'Very High' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-5 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentCaseIndex === 0}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Vignette Case</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {currentCaseIndex < cases.length - 1 && (
              <button
                type="button"
                onClick={handleCompleteAll}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors"
              >
                Proceed to Debriefing
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded transition-colors bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
            >
              <span>
                {currentCaseIndex === cases.length - 1
                  ? 'Complete Vignette Cases & Proceed to Debriefing'
                  : 'Next Vignette Case'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
