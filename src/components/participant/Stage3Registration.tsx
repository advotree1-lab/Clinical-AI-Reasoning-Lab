import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  ParticipantDesignation,
  ClinicalSpecialty,
  YearsSinceMbbsBracket,
  InstitutionType,
  RecruitmentTokenValidation
} from '../../types';
import { EnrollParticipantInput } from '../../services/supabaseResearchService';

interface Stage3RegistrationProps {
  onRegister: (input: EnrollParticipantInput) => void | Promise<void>;
  onBack: () => void;
  isDemoMode: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  referralToken?: string | null;
  referralValidation?: RecruitmentTokenValidation | null;
}

export const Stage3Registration: React.FC<Stage3RegistrationProps> = ({
  onRegister,
  onBack,
  isDemoMode,
  isSubmitting = false,
  errorMessage = null,
  referralToken = null,
  referralValidation = null
}) => {
  const [demoCode] = useState(() => `DOC-${Math.floor(1000 + Math.random() * 9000)}`);

  const [designation, setDesignation] = useState<ParticipantDesignation>('Junior Resident');
  const [designationOther, setDesignationOther] = useState('');
  const [specialty, setSpecialty] = useState<ClinicalSpecialty>('General Medicine');
  const [specialtyOther, setSpecialtyOther] = useState('');
  const [yearsSinceMbbsBracket, setYearsSinceMbbsBracket] = useState<YearsSinceMbbsBracket>('1–5 years');
  const [institutionType, setInstitutionType] = useState<InstitutionType>('Teaching hospital');
  const [institutionOther, setInstitutionOther] = useState('');
  const [formalGenAiTraining, setFormalGenAiTraining] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validReferralToken =
      !isDemoMode && referralToken && referralValidation?.isValid ? referralToken : null;

    onRegister({
      designation,
      designationOther:
        designation === 'Other' ? designationOther.trim() || 'Other (Not specified)' : undefined,
      specialty,
      specialtyOther:
        specialty === 'Other' ? specialtyOther.trim() || 'Other (Not specified)' : undefined,
      yearsSinceMbbsBracket,
      institutionType,
      institutionOther:
        institutionType === 'Other' ? institutionOther.trim() || 'Other (Not specified)' : undefined,
      formalGenAiTraining,
      consentGiven: true,
      referralToken: validReferralToken
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-lg border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
        
        {/* Header Metadata */}
        <div className="flex items-center gap-2 text-xs font-mono text-teal-700 mb-2">
          <span>STAGE 04 / 08</span>
          <span aria-hidden="true">·</span>
          <span>ANONYMOUS TOKEN &amp; RESPONDENT PROFILE</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Participant Token &amp; Respondent Profile
        </h2>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          {isDemoMode
            ? 'Your anonymous research identifier has been generated. Complete your baseline professional profile before proceeding to the GenAI Exposure and Cognitive Offloading Study Questionnaire.'
            : 'Complete your baseline professional profile below. Your unique anonymous research code (DOC-XXXXXX) will be assigned securely upon enrollment.'}
        </p>

        {/* Anonymous ID Strip */}
        <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Anonymous Research Token
            </span>
            <span className="text-lg sm:text-xl font-mono font-bold text-slate-900">
              {isDemoMode ? demoCode : 'Assigned on enrollment (DOC-XXXXXX)'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-slate-500 block">
              {isDemoMode ? 'COHORT DEMO' : 'ACTIVE PROTOCOL'}
            </span>
            {!isDemoMode && referralValidation?.isValid && referralValidation.researcherCode && (
              <span className="text-[11px] font-mono font-semibold text-emerald-700 block mt-0.5">
                Recruited via {referralValidation.researcherCode}
              </span>
            )}
          </div>
        </div>

        {!isDemoMode && referralToken && referralValidation && !referralValidation.isValid && (
          <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
            The referral link parameter could not be verified or has expired. Your enrollment will be recorded as <strong>Direct participation</strong>.
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1. Designation
              </label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value as ParticipantDesignation)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Junior Resident">Junior Resident</option>
                <option value="Senior Resident">Senior Resident</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Consultant">Consultant</option>
                <option value="Other">Other</option>
              </select>
              {designation === 'Other' && (
                <input
                  type="text"
                  value={designationOther}
                  onChange={(e) => setDesignationOther(e.target.value)}
                  placeholder="Specify designation..."
                  className="mt-2 w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                />
              )}
            </div>

            {/* 2. Specialty */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                2. Specialty
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as ClinicalSpecialty)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="General Surgery">General Surgery</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Obstetrics and Gynaecology">Obstetrics and Gynaecology</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Other">Other</option>
              </select>
              {specialty === 'Other' && (
                <input
                  type="text"
                  value={specialtyOther}
                  onChange={(e) => setSpecialtyOther(e.target.value)}
                  placeholder="Specify specialty..."
                  className="mt-2 w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                />
              )}
            </div>

            {/* 3. Years since MBBS completion */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                3. Years since MBBS completion
              </label>
              <select
                value={yearsSinceMbbsBracket}
                onChange={(e) => setYearsSinceMbbsBracket(e.target.value as YearsSinceMbbsBracket)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1–5 years">1–5 years</option>
                <option value="6–10 years">6–10 years</option>
                <option value="More than 10 years">More than 10 years</option>
              </select>
            </div>

            {/* 4. Type of hospital */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                4. Type of hospital
              </label>
              <select
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              >
                <option value="Government hospital">Government hospital</option>
                <option value="Private hospital">Private hospital</option>
                <option value="Teaching hospital">Teaching hospital</option>
                <option value="Other">Other</option>
              </select>
              {institutionType === 'Other' && (
                <input
                  type="text"
                  value={institutionOther}
                  onChange={(e) => setInstitutionOther(e.target.value)}
                  placeholder="Specify type of hospital..."
                  className="mt-2 w-full px-3 py-2 rounded border border-slate-300 text-xs text-slate-800"
                />
              )}
            </div>
          </div>

          {/* 5. Formal training regarding GenAI in healthcare */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              5. Have you received any formal training regarding the use of GenAI in healthcare?
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="formalGenAiTraining"
                  checked={formalGenAiTraining === true}
                  onChange={() => setFormalGenAiTraining(true)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                <input
                  type="radio"
                  name="formalGenAiTraining"
                  checked={formalGenAiTraining === false}
                  onChange={() => setFormalGenAiTraining(false)}
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-slate-200/70 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <span>
                {isSubmitting ? 'Enrolling Participant...' : 'Save Profile & Proceed to Questionnaire'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
