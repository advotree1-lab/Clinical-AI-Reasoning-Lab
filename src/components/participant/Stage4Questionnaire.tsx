import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Participant, QuestionnaireResponse } from '../../types';

interface Stage4QuestionnaireProps {
  participant: Participant;
  onSubmit: (response: QuestionnaireResponse) => void;
  onBack: () => void;
  isDemoMode: boolean;
}

export const Stage4Questionnaire: React.FC<Stage4QuestionnaireProps> = ({
  participant,
  onSubmit,
  onBack,
  isDemoMode
}) => {
  // Section B
  const [usedAiLast3Months, setUsedAiLast3Months] = useState(participant.priorAiExposure);
  const [aiToolsUsed, setAiToolsUsed] = useState<string[]>(['ChatGPT (GPT-4o)']);
  const [aiFrequency, setAiFrequency] = useState<string>('Several times weekly');
  const [primaryPurposes, setPrimaryPurposes] = useState<string[]>([
    'Differential diagnosis formulation',
    'Clinical information retrieval'
  ]);
  const [aiTiming, setAiTiming] = useState<'before' | 'after' | 'both'>('after');
  const [complexVsRoutine, setComplexVsRoutine] = useState<boolean>(true);
  const [verificationFrequency, setVerificationFrequency] = useState<string>('Often');
  const [verificationResources, setVerificationResources] = useState<string[]>([
    'UpToDate / Dynamed',
    'Clinical Practice Guidelines'
  ]);

  // Section C: Cognitive Offloading (1: Strongly Disagree, 5: Strongly Agree)
  const [cogOffloading, setCogOffloading] = useState({
    dependDifferential: 3,
    substituteRecall: 3,
    interpretComplex: 3,
    transferReasoning: 2,
    consultBeforeThinking: 2,
    reduceWorkload: 4,
    verifyBeforeUsing: 4
  });

  // Section D: Perceived Cognitive Deskilling Risk (1 to 5)
  const [perceivedDeskilling, setPerceivedDeskilling] = useState({
    reducedEffort: 3,
    difficultWithoutAi: 2,
    lessConfidentIndependent: 2,
    dependInvestigations: 3,
    affectProblemSolving: 3,
    confidenceChange: 3
  });

  const toggleTool = (tool: string) => {
    if (aiToolsUsed.includes(tool)) {
      setAiToolsUsed(aiToolsUsed.filter(t => t !== tool));
    } else {
      setAiToolsUsed([...aiToolsUsed, tool]);
    }
  };

  const togglePurpose = (purpose: string) => {
    if (primaryPurposes.includes(purpose)) {
      setPrimaryPurposes(primaryPurposes.filter(p => p !== purpose));
    } else {
      setPrimaryPurposes([...primaryPurposes, purpose]);
    }
  };

  const handleAutoFillSurvey = () => {
    setUsedAiLast3Months(true);
    setAiToolsUsed(['ChatGPT (GPT-4o)', 'Gemini (Google)']);
    setAiFrequency('Daily');
    setPrimaryPurposes(['Differential diagnosis formulation', 'Clinical information retrieval', 'Investigation interpretation']);
    setAiTiming('after');
    setComplexVsRoutine(true);
    setVerificationFrequency('Often');
    setVerificationResources(['UpToDate / Dynamed', 'Clinical Practice Guidelines']);
    setCogOffloading({
      dependDifferential: 3,
      substituteRecall: 3,
      interpretComplex: 3,
      transferReasoning: 2,
      consultBeforeThinking: 2,
      reduceWorkload: 4,
      verifyBeforeUsing: 4
    });
    setPerceivedDeskilling({
      reducedEffort: 3,
      difficultWithoutAi: 2,
      lessConfidentIndependent: 2,
      dependInvestigations: 3,
      affectProblemSolving: 3,
      confidenceChange: 3
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const response: QuestionnaireResponse = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantId: participant.id,
      isDemo: isDemoMode,
      usedAiLast3Months,
      aiToolsUsed,
      aiFrequency: usedAiLast3Months ? aiFrequency : 'Never',
      primaryPurposes: usedAiLast3Months ? primaryPurposes : [],
      aiTiming,
      complexVsRoutine,
      verificationFrequency,
      verificationResources,
      cognitiveOffloading: cogOffloading,
      perceivedDeskilling,
      createdAt: new Date().toISOString()
    };

    onSubmit(response);
  };

  const renderLikertRow = (
    index: number,
    label: string,
    value: number,
    onChange: (val: number) => void,
    descriptions: [string, string, string, string, string] = [
      'Strongly Disagree',
      'Disagree',
      'Neutral / Cannot Judge',
      'Agree',
      'Strongly Agree'
    ]
  ) => {
    return (
      <div className="py-3 border-b border-slate-100 last:border-b-0">
        <p className="text-xs font-medium text-slate-800 mb-2 leading-relaxed">
          <span className="font-mono text-slate-400 mr-1.5">{index}.</span>
          {label}
        </p>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5].map((level, i) => (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`py-2 px-1 text-center rounded border transition-colors text-xs ${
                value === level
                  ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-mono font-bold">{level}</div>
              <div className="text-[10px] line-clamp-1 opacity-80 hidden sm:block font-sans">{descriptions[i]}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>STAGE 04 / 08</span>
              <span aria-hidden="true">·</span>
              <span>STRUCTURED INQUIRY</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Generative AI Usage & Cognitive Inquiry
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Subject: <span className="font-mono font-semibold text-slate-800">{participant.code}</span> · {participant.designation} ({participant.specialty})
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoFillSurvey}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors shrink-0 self-start sm:self-auto"
            title="Auto-fill typical survey responses"
          >
            <span>⚡ Auto-Fill Survey</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION B: CLINICAL AI USAGE */}
          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Section B: Generative AI Usage in Clinical Practice
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Have you used generative AI tools for clinical tasks during the last three months?
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="usedAiLast3Months"
                      checked={usedAiLast3Months === true}
                      onChange={() => setUsedAiLast3Months(true)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="usedAiLast3Months"
                      checked={usedAiLast3Months === false}
                      onChange={() => setUsedAiLast3Months(false)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {usedAiLast3Months && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Commonly utilized platforms (Select all that apply)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['ChatGPT (GPT-4o)', 'Gemini (Google)', 'Claude (Anthropic)', 'Perplexity Pro', 'Open-source LLMs', 'Copilot / Other'].map(tool => (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => toggleTool(tool)}
                          className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                            aiToolsUsed.includes(tool)
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Frequency of Clinical Use
                      </label>
                      <select
                        value={aiFrequency}
                        onChange={(e) => setAiFrequency(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                      >
                        <option value="Multiple times daily">Multiple times daily</option>
                        <option value="Daily">Daily</option>
                        <option value="Several times weekly">Several times weekly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Rarely">Rarely</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Consultation Sequence
                      </label>
                      <select
                        value={aiTiming}
                        onChange={(e) => setAiTiming(e.target.value as any)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                      >
                        <option value="before">Consult AI before independently formulating a diagnosis</option>
                        <option value="after">Formulate clinical opinion independently, then consult AI</option>
                        <option value="both">Both equally / depends on case urgency</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Primary Clinical Applications
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Differential diagnosis formulation',
                        'Clinical information retrieval',
                        'Investigation interpretation',
                        'Treatment protocol review',
                        'Drug interaction checking',
                        'Documentation drafting'
                      ].map(purpose => (
                        <button
                          key={purpose}
                          type="button"
                          onClick={() => togglePurpose(purpose)}
                          className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                            primaryPurposes.includes(purpose)
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {purpose}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Verification Frequency of AI Outputs
                      </label>
                      <select
                        value={verificationFrequency}
                        onChange={(e) => setVerificationFrequency(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                      >
                        <option value="Always">Always (100% of the time)</option>
                        <option value="Often">Often (70–90%)</option>
                        <option value="Sometimes">Sometimes (40–60%)</option>
                        <option value="Rarely">Rarely (&lt; 30%)</option>
                        <option value="Never">Never</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Clinical Complexity Preference
                      </label>
                      <select
                        value={complexVsRoutine ? 'complex' : 'routine'}
                        onChange={(e) => setComplexVsRoutine(e.target.value === 'complex')}
                        className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                      >
                        <option value="complex">Use AI more frequently for complex/atypical presentations</option>
                        <option value="routine">Use AI more frequently for routine presentations</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECTION C: COGNITIVE OFFLOADING */}
          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Section C: Cognitive Offloading Scale
              </h3>
              <span className="text-[10px] font-mono text-slate-500">1: Strongly Disagree · 5: Strongly Agree</span>
            </div>

            <div className="divide-y divide-slate-200/60">
              {renderLikertRow(
                1,
                'I frequently depend on AI to formulate differential diagnoses.',
                cogOffloading.dependDifferential,
                (val) => setCogOffloading({ ...cogOffloading, dependDifferential: val })
              )}
              {renderLikertRow(
                2,
                'I use AI instead of independently recalling memorized clinical information.',
                cogOffloading.substituteRecall,
                (val) => setCogOffloading({ ...cogOffloading, substituteRecall: val })
              )}
              {renderLikertRow(
                3,
                'I rely on AI to interpret complex clinical findings.',
                cogOffloading.interpretComplex,
                (val) => setCogOffloading({ ...cogOffloading, interpretComplex: val })
              )}
              {renderLikertRow(
                4,
                'I sometimes transfer clinical reasoning tasks to AI rather than performing them independently.',
                cogOffloading.transferReasoning,
                (val) => setCogOffloading({ ...cogOffloading, transferReasoning: val })
              )}
              {renderLikertRow(
                5,
                'I consult AI before independently considering all possible diagnoses.',
                cogOffloading.consultBeforeThinking,
                (val) => setCogOffloading({ ...cogOffloading, consultBeforeThinking: val })
              )}
              {renderLikertRow(
                6,
                'I find AI useful for reducing my overall cognitive workload.',
                cogOffloading.reduceWorkload,
                (val) => setCogOffloading({ ...cogOffloading, reduceWorkload: val })
              )}
              {renderLikertRow(
                7,
                'I independently verify AI recommendations before applying them.',
                cogOffloading.verifyBeforeUsing,
                (val) => setCogOffloading({ ...cogOffloading, verifyBeforeUsing: val })
              )}
            </div>
          </div>

          {/* SECTION D: PERCEIVED COGNITIVE DESKILLING RISK */}
          <div className="p-5 rounded bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Section D: Perceived Cognitive Deskilling Risk
              </h3>
              <span className="text-[10px] font-mono text-slate-500">1: Strongly Disagree · 5: Strongly Agree</span>
            </div>

            <div className="p-3 rounded bg-white border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Methodological Clarification: </strong>
              These items measure subjective perceptions and concerns; they do not establish permanent cognitive decline or objective loss of clinical reasoning.
            </div>

            <div className="divide-y divide-slate-200/60">
              {renderLikertRow(
                1,
                'My reliance on AI has reduced the effort I spend independently formulating differential diagnoses.',
                perceivedDeskilling.reducedEffort,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, reducedEffort: val })
              )}
              {renderLikertRow(
                2,
                'I sometimes find it difficult to make clinical decisions without AI assistance.',
                perceivedDeskilling.difficultWithoutAi,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, difficultWithoutAi: val })
              )}
              {renderLikertRow(
                3,
                'I feel less confident in independent clinical reasoning when AI is unavailable.',
                perceivedDeskilling.lessConfidentIndependent,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, lessConfidentIndependent: val })
              )}
              {renderLikertRow(
                4,
                'I increasingly depend on AI to interpret investigations.',
                perceivedDeskilling.dependInvestigations,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, dependInvestigations: val })
              )}
              {renderLikertRow(
                5,
                'I feel that frequent AI use may affect my ability to independently solve clinical problems.',
                perceivedDeskilling.affectProblemSolving,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, affectProblemSolving: val })
              )}
              {renderLikertRow(
                6,
                'Compared with before using AI, how has your confidence in independent clinical reasoning changed?',
                perceivedDeskilling.confidenceChange,
                (val) => setPerceivedDeskilling({ ...perceivedDeskilling, confidenceChange: val }),
                [
                  'Significantly Decreased',
                  'Decreased',
                  'Unchanged / Neutral',
                  'Increased',
                  'Significantly Increased'
                ]
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-2xs"
            >
              <span>Submit Survey & Proceed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
