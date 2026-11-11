import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Participant,
  ParticipantDesignation,
  ClinicalSpecialty,
  InstitutionType
} from '../../types';

interface Stage3RegistrationProps {
  onRegister: (participant: Participant) => void;
  onBack: () => void;
  isDemoMode: boolean;
}

export const Stage3Registration: React.FC<Stage3RegistrationProps> = ({
  onRegister,
  onBack,
  isDemoMode
}) => {
  const [anonymousCode] = useState(() => `DOC-${Math.floor(1000 + Math.random() * 9000)}`);

  const [designation, setDesignation] = useState<ParticipantDesignation>('Postgraduate resident');
  const [specialty, setSpecialty] = useState<ClinicalSpecialty>('General medicine');
  const [yearsSinceMBBS, setYearsSinceMBBS] = useState<number>(3);
  const [yearsExperience, setYearsExperience] = useState<number>(2);
  const [institutionType, setInstitutionType] = useState<InstitutionType>('Medical college');
  const [dailyPatientLoad, setDailyPatientLoad] = useState<number>(35);
  const [priorAiExposure, setPriorAiExposure] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const participant: Participant = {
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: anonymousCode,
      designation,
      specialty,
      yearsSinceMBBS,
      yearsExperience,
      institutionType,
      dailyPatientLoad,
      priorAiExposure,
      consentGiven: true,
      isDemo: isDemoMode,
      createdAt: new Date().toISOString(),
      completed: false,
      currentStage: 4
    };

    onRegister(participant);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-2">
          <span>STAGE 03 / 08</span>
          <span aria-hidden="true">·</span>
          <span>PARTICIPANT PROFILE</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Professional Demographic Profile
        </h2>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Provide your professional background for stratified cohort analysis. All entries are linked strictly to your anonymous research identifier.
        </p>

        {/* Anonymous ID Strip (Clean, Unboxed) */}
        <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Anonymous Research Token
            </span>
            <span className="text-xl font-mono font-bold text-slate-900">{anonymousCode}</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {isDemoMode ? 'COHORT DEMO' : 'ACTIVE PROTOCOL'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Designation / Cadre
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value as ParticipantDesignation)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Postgraduate resident">Postgraduate resident</option>
                <option value="Senior resident">Senior resident</option>
                <option value="Medical officer">Medical officer</option>
                <option value="Assistant professor">Assistant professor</option>
                <option value="Associate professor">Associate professor</option>
                <option value="Professor">Professor</option>
                <option value="Consultant">Consultant</option>
                <option value="General practitioner">General practitioner</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Specialty
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as ClinicalSpecialty)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="General medicine">General medicine</option>
                <option value="Emergency medicine">Emergency medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Neurology">Neurology</option>
                <option value="General surgery">General surgery</option>
                <option value="Obstetrics and gynaecology">Obstetrics and gynaecology</option>
                <option value="Paediatrics">Paediatrics</option>
                <option value="Orthopaedics">Orthopaedics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Years since MBBS */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Years Since MBBS Graduation
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsSinceMBBS}
                onChange={(e) => setYearsSinceMBBS(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Post-Registration Clinical Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Institution */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Primary Institution Type
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Medical college">Medical college / University hospital</option>
                <option value="Government hospital">Government public health hospital</option>
                <option value="Private hospital">Private hospital / Multispecialty center</option>
                <option value="Clinic">Outpatient clinic</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Patient load */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Average Daily Patient Volume (OPD + IPD)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={dailyPatientLoad}
                onChange={(e) => setDailyPatientLoad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* AI Exposure Radio */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Have you ever utilized generative AI tools (e.g. ChatGPT, Claude, Gemini) for clinical tasks?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="priorAi"
                  checked={priorAiExposure === true}
                  onChange={() => setPriorAiExposure(true)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Yes, I have prior exposure</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="priorAi"
                  checked={priorAiExposure === false}
                  onChange={() => setPriorAiExposure(false)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>No, I have no previous exposure</span>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-slate-200/70 flex items-center justify-between">
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
              <span>Save Profile & Proceed to Survey</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
