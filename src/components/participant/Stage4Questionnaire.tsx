import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Participant,
  QuestionnaireResponse,
  ParticipantDesignation,
  ClinicalSpecialty,
  YearsSinceMbbsBracket,
  InstitutionType,
  GenAiFirstUseDuration,
  GenAiUsageFrequency,
  GenAiDailyDuration,
  GenAiAccessMethod,
  PatientInfoEntryFrequency,
  GenAiTaskFrequency,
  GenAiTaskMatrix,
  ClinicalReasoningConsultationStage,
  InstitutionalPolicyStatus
} from '../../types';

interface Stage4QuestionnaireProps {
  participant: Participant;
  existingResponse?: QuestionnaireResponse | null;
  onSubmit: (response: QuestionnaireResponse, updatedParticipant: Participant) => void | Promise<void>;
  onContinueNext?: () => void;
  onBack: () => void;
  isDemoMode: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

const DESIGNATION_OPTIONS: ParticipantDesignation[] = [
  'Junior Resident',
  'Senior Resident',
  'Assistant Professor',
  'Associate Professor',
  'Professor',
  'Consultant',
  'Other'
];

const SPECIALTY_OPTIONS: ClinicalSpecialty[] = [
  'General Medicine',
  'General Surgery',
  'Pediatrics',
  'Obstetrics and Gynaecology',
  'Emergency Medicine',
  'Other'
];

const MBBS_BRACKETS: YearsSinceMbbsBracket[] = [
  'Less than 1 year',
  '1–5 years',
  '6–10 years',
  'More than 10 years'
];

const HOSPITAL_TYPES: InstitutionType[] = [
  'Government hospital',
  'Private hospital',
  'Teaching hospital',
  'Other'
];

const TASK_FREQ_OPTIONS: GenAiTaskFrequency[] = [
  'Never',
  'Rarely',
  'Sometimes',
  'Often',
  'Very often'
];

const TASK_ROWS: { key: keyof GenAiTaskMatrix; code: string; label: string }[] = [
  { key: 'differentialDiagnoses', code: 'a', label: 'Generating differential diagnoses' },
  { key: 'interpretingInvestigations', code: 'b', label: 'Interpreting investigation results' },
  { key: 'choosingInvestigations', code: 'c', label: 'Choosing investigations' },
  { key: 'identifyingManagement', code: 'd', label: 'Identifying management options' },
  { key: 'drugDosesAndInteractions', code: 'e', label: 'Drug doses and interactions' },
  { key: 'summarisingLiterature', code: 'f', label: 'Summarising literature or guidelines' },
  { key: 'clinicalDocumentation', code: 'g', label: 'Clinical documentation or letters' },
  { key: 'patientCommunication', code: 'h', label: 'Patient communication' }
];

export const Stage4Questionnaire: React.FC<Stage4QuestionnaireProps> = ({
  participant,
  existingResponse = null,
  onSubmit,
  onContinueNext,
  onBack,
  isDemoMode,
  isSubmitting = false,
  errorMessage = null
}) => {
  const isLockedInLive = !isDemoMode && Boolean(existingResponse);

  // SECTION I: RESPONDENT PROFILE (Initialized from Stage 3 participant or existingResponse)
  const [designation, setDesignation] = useState<ParticipantDesignation>(
    existingResponse?.designation ?? participant.designation
  );
  const [designationOther, setDesignationOther] = useState(
    existingResponse?.designationOther ?? participant.designationOther ?? ''
  );
  const [specialty, setSpecialty] = useState<ClinicalSpecialty>(
    existingResponse?.specialty ?? participant.specialty
  );
  const [specialtyOther, setSpecialtyOther] = useState(
    existingResponse?.specialtyOther ?? participant.specialtyOther ?? ''
  );
  const [yearsSinceMbbsBracket, setYearsSinceMbbsBracket] = useState<YearsSinceMbbsBracket>(
    existingResponse?.yearsSinceMbbsBracket ?? participant.yearsSinceMbbsBracket
  );
  const [hospitalType, setHospitalType] = useState<InstitutionType>(
    existingResponse?.hospitalType ?? participant.institutionType
  );
  const [hospitalTypeOther, setHospitalTypeOther] = useState(
    existingResponse?.hospitalTypeOther ?? participant.institutionOther ?? ''
  );
  const [formalGenAiTraining, setFormalGenAiTraining] = useState<boolean>(
    existingResponse?.formalGenAiTraining ?? participant.formalGenAiTraining
  );

  // SECTION II: GENAI EXPOSURE (Q1 - Q12)
  const [usedGenAiLast3Months, setUsedGenAiLast3Months] = useState<boolean>(
    existingResponse ? existingResponse.usedGenAiLast3Months : true
  );
  const [firstUseDuration, setFirstUseDuration] = useState<GenAiFirstUseDuration>(
    existingResponse?.firstUseDuration ?? '6–12 months'
  );
  const [usageFrequency, setUsageFrequency] = useState<GenAiUsageFrequency>(
    existingResponse?.usageFrequency ?? '3–5 days per week'
  );
  const [dailyTimeSpent, setDailyTimeSpent] = useState<GenAiDailyDuration>(
    existingResponse?.dailyTimeSpent ?? '10–30 minutes'
  );
  const [toolsUsed, setToolsUsed] = useState<string[]>(
    existingResponse?.toolsUsed ?? ['ChatGPT', 'Google Gemini']
  );
  const [medicalSpecificToolName, setMedicalSpecificToolName] = useState(
    existingResponse?.medicalSpecificToolName ?? ''
  );
  const [otherToolName, setOtherToolName] = useState(existingResponse?.otherToolName ?? '');
  const [accessMethod, setAccessMethod] = useState<GenAiAccessMethod>(
    existingResponse?.accessMethod ?? 'Free public version'
  );
  const [enteredPatientInfo, setEnteredPatientInfo] = useState<PatientInfoEntryFrequency>(
    existingResponse?.enteredPatientInfo ?? 'Never'
  );
  const [taskFrequency, setTaskFrequency] = useState<GenAiTaskMatrix>(
    existingResponse?.taskFrequency ?? {
      differentialDiagnoses: 'Sometimes',
      interpretingInvestigations: 'Sometimes',
      choosingInvestigations: 'Rarely',
      identifyingManagement: 'Sometimes',
      drugDosesAndInteractions: 'Often',
      summarisingLiterature: 'Often',
      clinicalDocumentation: 'Rarely',
      patientCommunication: 'Never'
    }
  );
  const [reasoningConsultationStage, setReasoningConsultationStage] =
    useState<ClinicalReasoningConsultationStage>(
      existingResponse?.reasoningConsultationStage ??
        'After my initial assessment, to cross-check my thinking'
    );
  const [last10CasesConsultedCount, setLast10CasesConsultedCount] = useState<number>(
    existingResponse?.last10CasesConsultedCount ?? 3
  );
  const [verificationFrequency, setVerificationFrequency] = useState<GenAiTaskFrequency>(
    existingResponse?.verificationFrequency ?? 'Often'
  );
  const [institutionalPolicy, setInstitutionalPolicy] = useState<InstitutionalPolicyStatus>(
    existingResponse?.institutionalPolicy ?? 'Not sure'
  );

  const toggleTool = (tool: string) => {
    if (toolsUsed.includes(tool)) {
      setToolsUsed(toolsUsed.filter(t => t !== tool));
    } else {
      setToolsUsed([...toolsUsed, tool]);
    }
  };

  const handleAutoFillSurvey = () => {
    setUsedGenAiLast3Months(true);
    setFirstUseDuration('6–12 months');
    setUsageFrequency('Daily');
    setDailyTimeSpent('10–30 minutes');
    setToolsUsed(['ChatGPT', 'Google Gemini', 'Perplexity']);
    setMedicalSpecificToolName('');
    setOtherToolName('');
    setAccessMethod('Free public version');
    setEnteredPatientInfo('Once or twice');
    setTaskFrequency({
      differentialDiagnoses: 'Often',
      interpretingInvestigations: 'Sometimes',
      choosingInvestigations: 'Sometimes',
      identifyingManagement: 'Often',
      drugDosesAndInteractions: 'Often',
      summarisingLiterature: 'Very often',
      clinicalDocumentation: 'Sometimes',
      patientCommunication: 'Rarely'
    });
    setReasoningConsultationStage('After my initial assessment, to cross-check my thinking');
    setLast10CasesConsultedCount(4);
    setVerificationFrequency('Often');
    setInstitutionalPolicy('No');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (isLockedInLive) {
      onContinueNext?.();
      return;
    }

    const updatedParticipant: Participant = {
      ...participant,
      designation,
      designationOther: designation === 'Other' ? (designationOther.trim() || 'Other (Not specified)') : undefined,
      specialty,
      specialtyOther: specialty === 'Other' ? (specialtyOther.trim() || 'Other (Not specified)') : undefined,
      yearsSinceMbbsBracket,
      institutionType: hospitalType,
      institutionOther: hospitalType === 'Other' ? (hospitalTypeOther.trim() || 'Other (Not specified)') : undefined,
      formalGenAiTraining
    };

    const response: QuestionnaireResponse = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantId: participant.id,
      isDemo: isDemoMode,
      designation,
      designationOther: designation === 'Other' ? (designationOther.trim() || 'Other (Not specified)') : undefined,
      specialty,
      specialtyOther: specialty === 'Other' ? (specialtyOther.trim() || 'Other (Not specified)') : undefined,
      yearsSinceMbbsBracket,
      hospitalType,
      hospitalTypeOther: hospitalType === 'Other' ? (hospitalTypeOther.trim() || 'Other (Not specified)') : undefined,
      formalGenAiTraining,
      usedGenAiLast3Months,
      ...(usedGenAiLast3Months
        ? {
            firstUseDuration,
            usageFrequency,
            dailyTimeSpent,
            toolsUsed,
            medicalSpecificToolName: toolsUsed.includes('Medical-specific AI tool')
              ? medicalSpecificToolName.trim()
              : undefined,
            otherToolName: toolsUsed.includes('Other') ? otherToolName.trim() : undefined,
            accessMethod,
            enteredPatientInfo,
            taskFrequency,
            reasoningConsultationStage,
            last10CasesConsultedCount,
            verificationFrequency,
            institutionalPolicy
          }
        : {}),
      createdAt: new Date().toISOString()
    };

    onSubmit(response, updatedParticipant);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-teal-700 mb-1">
              <span>STAGE 05 / 08</span>
              <span aria-hidden="true">·</span>
              <span>STUDY QUESTIONNAIRE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              GenAI Exposure and Cognitive Offloading Among Medical Doctors
            </h2>
            <div className="text-xs text-slate-500 mt-1">
              Subject: <span className="font-mono font-semibold text-slate-800">{participant.code}</span> · {designation === 'Other' && designationOther ? designationOther : designation} ({specialty === 'Other' && specialtyOther ? specialtyOther : specialty})
            </div>
          </div>

          {isDemoMode && (
            <button
              type="button"
              onClick={handleAutoFillSurvey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors shrink-0 self-start sm:self-auto"
              title="Auto-fill representative questionnaire responses"
            >
              <span>⚡ Auto-Fill Survey</span>
            </button>
          )}
        </div>

        {isLockedInLive && (
          <div className="mb-6 p-3.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
            Your Study Questionnaire response has already been submitted and saved. Proceed below to continue to the CDSS stage.
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Participant Information and Instructions */}
        <div className="mb-8 p-4 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900">
            Participant Information and Instructions
          </div>
          <p>
            This questionnaire aims to assess the use of Generative Artificial Intelligence (GenAI) tools and their association with cognitive offloading among medical doctors.
          </p>
          <p>
            For this questionnaire, GenAI refers to tools that generate text in response to prompts, such as <strong>ChatGPT, Google Gemini, Microsoft Copilot and Claude</strong>.
          </p>
          <p>
            Please answer all questions based on your <strong>work-related use during the past 3 months only</strong>. Do not include personal or entertainment use.
          </p>
          <p className="text-slate-600">
            Do not enter or disclose patient names or identifiable information. Your responses will be kept confidential and used exclusively for research purposes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* ==================================================== */}
          {/* SECTION I: RESPONDENT PROFILE */}
          {/* ==================================================== */}
          <div className="p-5 sm:p-6 rounded bg-slate-50/70 border border-slate-200 space-y-5">
            <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                Section I: Respondent Profile
              </h3>
              <span className="text-[10px] font-mono text-slate-500">5 ITEMS</span>
            </div>

            {/* Q1. Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                1. Designation:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {DESIGNATION_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                      designation === opt
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sec1-designation"
                      checked={designation === opt}
                      onChange={() => setDesignation(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {designation === 'Other' && (
                <input
                  type="text"
                  value={designationOther}
                  onChange={(e) => setDesignationOther(e.target.value)}
                  placeholder="Specify designation..."
                  className="mt-2 w-full sm:w-1/2 px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                />
              )}
            </div>

            {/* Q2. Specialty */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                2. Specialty:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SPECIALTY_OPTIONS.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                      specialty === opt
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sec1-specialty"
                      checked={specialty === opt}
                      onChange={() => setSpecialty(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {specialty === 'Other' && (
                <input
                  type="text"
                  value={specialtyOther}
                  onChange={(e) => setSpecialtyOther(e.target.value)}
                  placeholder="Specify specialty..."
                  className="mt-2 w-full sm:w-1/2 px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                />
              )}
            </div>

            {/* Q3. Years since MBBS completion */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                3. Years since MBBS completion:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MBBS_BRACKETS.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                      yearsSinceMbbsBracket === opt
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sec1-mbbs"
                      checked={yearsSinceMbbsBracket === opt}
                      onChange={() => setYearsSinceMbbsBracket(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Q4. Type of hospital */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                4. Type of hospital:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {HOSPITAL_TYPES.map(opt => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                      hospitalType === opt
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sec1-hospital"
                      checked={hospitalType === opt}
                      onChange={() => setHospitalType(opt)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {hospitalType === 'Other' && (
                <input
                  type="text"
                  value={hospitalTypeOther}
                  onChange={(e) => setHospitalTypeOther(e.target.value)}
                  placeholder="Specify type of hospital..."
                  className="mt-2 w-full sm:w-1/2 px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                />
              )}
            </div>

            {/* Q5. Formal training */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                5. Have you received any formal training regarding the use of GenAI in healthcare?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="sec1-training"
                    checked={formalGenAiTraining === true}
                    onChange={() => setFormalGenAiTraining(true)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="sec1-training"
                    checked={formalGenAiTraining === false}
                    onChange={() => setFormalGenAiTraining(false)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION II: GENAI EXPOSURE */}
          {/* ==================================================== */}
          <div className="p-5 sm:p-6 rounded bg-slate-50/70 border border-slate-200 space-y-6">
            <div className="pb-2 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                  Section II: GenAI Exposure
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Answer based on your work-related use during the past 3 months.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">12 ITEMS</span>
            </div>

            {/* Q1. Used GenAI in past 3 months */}
            <div className="p-4 rounded bg-white border border-slate-200 space-y-2.5">
              <label className="block text-xs font-semibold text-slate-900">
                1. In the past 3 months, have you used any GenAI tool for a work-related clinical purpose?
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="sec2-q1"
                    checked={usedGenAiLast3Months === true}
                    onChange={() => setUsedGenAiLast3Months(true)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="sec2-q1"
                    checked={usedGenAiLast3Months === false}
                    onChange={() => setUsedGenAiLast3Months(false)}
                    className="text-slate-900 focus:ring-slate-900"
                  />
                  <span>No</span>
                </label>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                If No, skip to the clinical vignette section.
              </p>
            </div>

            {!usedGenAiLast3Months ? (
              <div className="p-4 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <strong>Skip Logic Applied:</strong> Because you selected <strong>No</strong> for Question 1, Questions 2–12 are skipped. Click below to proceed directly to the clinical vignette section.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Q2. First use duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    2. How long ago did you first use GenAI for work-related purposes?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      'Less than 3 months',
                      '3–6 months',
                      '6–12 months',
                      'More than 12 months'
                    ] as GenAiFirstUseDuration[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFirstUseDuration(opt)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          firstUseDuration === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3. Frequency of use during past 3 months */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    3. Frequency of use during the past 3 months:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {([
                      'Less than once a week',
                      '1–2 days per week',
                      '3–5 days per week',
                      'Daily',
                      'Several times a day'
                    ] as GenAiUsageFrequency[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setUsageFrequency(opt)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          usageFrequency === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4. Total time spent per day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    4. Total time spent per day when using GenAI for work:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      'Less than 10 minutes',
                      '10–30 minutes',
                      '31–60 minutes',
                      'More than 60 minutes'
                    ] as GenAiDailyDuration[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDailyTimeSpent(opt)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          dailyTimeSpent === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q5. Which GenAI tools */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    5. Which GenAI tools have you used? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'ChatGPT',
                      'Google Gemini',
                      'Microsoft Copilot',
                      'Claude',
                      'Perplexity',
                      'Medical-specific AI tool',
                      'Other'
                    ].map(tool => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          toolsUsed.includes(tool)
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>

                  {toolsUsed.includes('Medical-specific AI tool') && (
                    <input
                      type="text"
                      value={medicalSpecificToolName}
                      onChange={(e) => setMedicalSpecificToolName(e.target.value)}
                      placeholder="Specify medical-specific AI tool (e.g., OpenEvidence, Glass Health)..."
                      className="mt-2.5 w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  )}

                  {toolsUsed.includes('Other') && (
                    <input
                      type="text"
                      value={otherToolName}
                      onChange={(e) => setOtherToolName(e.target.value)}
                      placeholder="Specify other GenAI tool..."
                      className="mt-2.5 w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 bg-white"
                    />
                  )}
                </div>

                {/* Q6. Access method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    6. How do you usually access GenAI tools for work?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {([
                      'Free public version',
                      'Personal paid subscription',
                      'Provided by my hospital/institution',
                      'A combination of the above'
                    ] as GenAiAccessMethod[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAccessMethod(opt)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          accessMethod === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q7. Entered patient-related information */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    7. Have you entered patient-related information (even without patient name or identifiers) into a publicly available GenAI tool?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      'Never',
                      'Once or twice',
                      'Sometimes',
                      'Often'
                    ] as PatientInfoEntryFrequency[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEnteredPatientInfo(opt)}
                        className={`px-3 py-2 text-xs text-left rounded border transition-colors ${
                          enteredPatientInfo === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q8. Task Frequency Matrix */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    8. During the past 3 months, how often have you used GenAI for each of the following work-related tasks?
                  </label>
                  <div className="bg-white rounded border border-slate-200 overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                          <th className="p-3 text-left font-semibold min-w-[210px]">Work-Related Task</th>
                          {TASK_FREQ_OPTIONS.map(freq => (
                            <th key={freq} className="p-2.5 text-center font-semibold whitespace-nowrap">
                              {freq}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {TASK_ROWS.map(row => (
                          <tr key={row.key} className="hover:bg-slate-50/60">
                            <td className="p-3 text-slate-800 font-medium">
                              <span className="font-mono text-slate-400 mr-1.5">{row.code}.</span>
                              {row.label}
                            </td>
                            {TASK_FREQ_OPTIONS.map(freq => (
                              <td key={freq} className="p-2 text-center">
                                <input
                                  type="radio"
                                  name={`task-${row.key}`}
                                  aria-label={`${row.label} - ${freq}`}
                                  checked={taskFrequency[row.key] === freq}
                                  onChange={() =>
                                    setTaskFrequency(prev => ({ ...prev, [row.key]: freq }))
                                  }
                                  className="text-slate-900 focus:ring-slate-900 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Q9. Stage during clinical reasoning task */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    9. At what stage during a clinical reasoning task do you most often consult GenAI?
                  </label>
                  <div className="space-y-1.5">
                    {([
                      'Before forming my own clinical assessment',
                      'After my initial assessment, to cross-check my thinking',
                      'When uncertain or unable to reach a conclusion',
                      'After making a decision, primarily for documentation',
                      'I do not use GenAI for clinical reasoning'
                    ] as ClinicalReasoningConsultationStage[]).map(opt => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer text-xs transition-colors ${
                          reasoningConsultationStage === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sec2-q9"
                          checked={reasoningConsultationStage === opt}
                          onChange={() => setReasoningConsultationStage(opt)}
                          className="text-slate-900 focus:ring-slate-900"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q10. Last 10 clinical cases consulted count */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-800">
                      10. Out of your last 10 clinical cases where you were deciding diagnosis, investigations, or management, in how many did you consult a GenAI tool?
                    </label>
                    <span className="font-mono text-xs font-bold text-slate-900 shrink-0 ml-3">
                      {last10CasesConsultedCount} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLast10CasesConsultedCount(num)}
                        className={`py-2 rounded border text-xs font-mono font-bold transition-colors ${
                          last10CasesConsultedCount === num
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q11. Verification frequency */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    11. How often do you verify GenAI-generated answers against a clinical guideline, reference source, or qualified colleague?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TASK_FREQ_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setVerificationFrequency(opt)}
                        className={`px-3 py-2 text-xs text-center rounded border transition-colors ${
                          verificationFrequency === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q12. Institutional written policy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    12. Does your institution have a written policy regarding the use of GenAI in clinical work?
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:w-1/2">
                    {(['Yes', 'No', 'Not sure'] as InstitutionalPolicyStatus[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setInstitutionalPolicy(opt)}
                        className={`px-3 py-2 text-xs text-center rounded border transition-colors ${
                          institutionalPolicy === opt
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
            {isDemoMode ? (
              <button
                type="button"
                onClick={onBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-slate-500">
                Study ID: {participant.code}
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? 'Saving Questionnaire...'
                  : isLockedInLive
                  ? 'Proceed to CDSS'
                  : usedGenAiLast3Months
                  ? 'Submit Questionnaire & Proceed to CDSS'
                  : 'Skip to CDSS & Vignette Cases'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
