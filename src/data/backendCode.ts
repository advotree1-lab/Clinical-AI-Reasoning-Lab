export const FASTAPI_MAIN_PY = `# ==============================================================================
# Clinical AI Reasoning Lab - FastAPI REST Application
# Standardized Research Protocol Backend
# Python 3.12+ | FastAPI | Pydantic v2 | SQLAlchemy 2.0
# ==============================================================================

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from models import Base, ParticipantModel, QuestionnaireModel, AiInteractionModel, VignetteAnswerModel
from schemas import (
    ParticipantCreate, ParticipantOut,
    QuestionnaireCreate, QuestionnaireOut,
    AiInteractionCreate, AiInteractionOut,
    VignetteAnswerCreate, VignetteAnswerOut
)
from database import engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clinical AI Reasoning Lab API",
    description="Backend research service for evaluating GenAI exposure, automation bias, cognitive offloading, and independent clinical reasoning.",
    version="2.0.0"
)

# CORS configuration for Vercel Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "Clinical AI Reasoning Lab Backend", "version": "2.0.0"}

# --- PARTICIPANTS ---
@app.post("/api/participants", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED, tags=["Participants"])
def register_participant(data: ParticipantCreate, db: Session = Depends(get_db)):
    db_obj = ParticipantModel(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@app.get("/api/participants/{participant_id}", response_model=ParticipantOut, tags=["Participants"])
def get_participant(participant_id: str, db: Session = Depends(get_db)):
    p = db.query(ParticipantModel).filter(ParticipantModel.id == participant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p

# --- QUESTIONNAIRE (SECTION I: PROFILE + SECTION II: GENAI EXPOSURE) ---
@app.post("/api/questionnaires", response_model=QuestionnaireOut, status_code=status.HTTP_201_CREATED, tags=["Survey"])
def submit_questionnaire(data: QuestionnaireCreate, db: Session = Depends(get_db)):
    db_obj = QuestionnaireModel(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- AI SIMULATION INTERACTION ---
@app.post("/api/ai-interactions", response_model=AiInteractionOut, status_code=status.HTTP_201_CREATED, tags=["AI Simulation"])
def record_ai_interaction(data: AiInteractionCreate, db: Session = Depends(get_db)):
    existing = db.query(AiInteractionModel).filter(
        AiInteractionModel.participant_id == data.participant_id,
        AiInteractionModel.case_id == data.case_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Initial diagnosis commitment has already been permanently locked for this case.")
    
    db_obj = AiInteractionModel(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- VIGNETTE ASSESSMENT (POST-AI UNAIDED) ---
@app.post("/api/vignette-answers", response_model=VignetteAnswerOut, status_code=status.HTTP_201_CREATED, tags=["Assessments"])
def submit_vignette_answer(data: VignetteAnswerCreate, db: Session = Depends(get_db)):
    db_obj = VignetteAnswerModel(**data.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# --- RESEARCH EXPORTS (SPSS / CSV) ---
@app.get("/api/research/export/{dataset_name}", tags=["Research Export"])
def export_dataset(dataset_name: str, include_demo: bool = Query(False), db: Session = Depends(get_db)):
    pass
`;

export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- Clinical AI Reasoning Lab - Supabase PostgreSQL Database Schema (v2)
-- Standardized Research Protocol Tables & Row Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Participants Table (Strictly Anonymous Identifiers)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    designation VARCHAR(64) NOT NULL,
    designation_other TEXT,
    specialty VARCHAR(64) NOT NULL,
    specialty_other TEXT,
    years_since_mbbs_bracket VARCHAR(32) NOT NULL,
    institution_type VARCHAR(64) NOT NULL,
    institution_other TEXT,
    formal_genai_training BOOLEAN NOT NULL DEFAULT false,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    current_stage INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Questionnaire Responses (Section I Profile + Section II GenAI Exposure Q1-Q12)
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    designation VARCHAR(64) NOT NULL,
    specialty VARCHAR(64) NOT NULL,
    years_since_mbbs_bracket VARCHAR(32) NOT NULL,
    hospital_type VARCHAR(64) NOT NULL,
    formal_genai_training BOOLEAN NOT NULL DEFAULT false,
    used_genai_last_3_months BOOLEAN NOT NULL,
    first_use_duration VARCHAR(64),
    usage_frequency VARCHAR(64),
    daily_time_spent VARCHAR(64),
    tools_used TEXT[] DEFAULT '{}',
    medical_specific_tool_name TEXT,
    other_tool_name TEXT,
    access_method VARCHAR(64),
    entered_patient_info VARCHAR(32),
    task_frequency JSONB, -- 8-item matrix (Never to Very often)
    reasoning_consultation_stage VARCHAR(128),
    last_10_cases_consulted_count INT CHECK (last_10_cases_consulted_count BETWEEN 0 AND 10),
    verification_frequency VARCHAR(32),
    institutional_policy VARCHAR(16),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Standardized Clinical Cases & Fixed Stimuli (5 CDSS + 6 Vignette Cases)
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id VARCHAR(64) PRIMARY KEY,
    case_number INT NOT NULL,
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('ai_simulation', 'post_ai')),
    domain VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    presentation TEXT NOT NULL,
    medical_history TEXT NOT NULL,
    vitals JSONB NOT NULL,
    physical_examination TEXT NOT NULL,
    investigations JSONB NOT NULL,
    mcq_options TEXT[] NOT NULL,
    gold_standard_diagnosis TEXT NOT NULL,
    acceptable_alternatives TEXT[] NOT NULL DEFAULT '{}',
    differential_keys TEXT[] NOT NULL DEFAULT '{}',
    red_flag_keys TEXT[] NOT NULL DEFAULT '{}',
    next_step_key TEXT NOT NULL,
    rubric JSONB NOT NULL,
    ai_stimulus JSONB,
    is_published BOOLEAN NOT NULL DEFAULT true,
    expert_reviewed BOOLEAN NOT NULL DEFAULT true
);

-- 4. AI Interaction Records (Permanently stores Initial commitments separate from Final)
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    initial_diagnosis TEXT NOT NULL,
    initial_justification TEXT NOT NULL,
    initial_confidence INT NOT NULL CHECK (initial_confidence BETWEEN 1 AND 5),
    initial_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ai_agreement VARCHAR(64) NOT NULL,
    final_diagnosis TEXT NOT NULL,
    reason_for_decision TEXT NOT NULL,
    final_confidence INT NOT NULL CHECK (final_confidence BETWEEN 1 AND 5),
    will_verify BOOLEAN NOT NULL DEFAULT false,
    verification_targets TEXT,
    switched_diagnosis BOOLEAN NOT NULL DEFAULT false,
    switched_towards_correct BOOLEAN NOT NULL DEFAULT false,
    accepted_misleading BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vignette Answers (Post-AI Unaided Clinical Reasoning)
CREATE TABLE IF NOT EXISTS public.vignette_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id),
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('post_ai')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    most_likely_diagnosis TEXT NOT NULL,
    differential_1 TEXT NOT NULL,
    differential_2 TEXT NOT NULL,
    red_flags TEXT NOT NULL,
    next_step TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    assessor1_score JSONB,
    assessor2_score JSONB,
    final_resolved_score NUMERIC(3, 2),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Configuration
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vignette_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read own participant" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert questionnaire" ON public.questionnaire_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert ai_interactions" ON public.ai_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert vignette_answers" ON public.vignette_answers FOR INSERT WITH CHECK (true);
`;

export const SPSS_SYNTAX_SPS = `* ==============================================================================
* CLINICAL AI REASONING LAB - SPSS STATISTICAL SYNTAX FILE (v3)
* Section I: Respondent Profile (Q1-Q5)
* Section II: GenAI Exposure, Cognitive Offloading & Reasoning (Q6-Q17)
* ==============================================================================

* 1. IMPORT QUESTIONNAIRE & COHORT DATASET
GET DATA  /TYPE=TXT
  /FILE="carl_questionnaires_research.csv"
  /DELCASE=LINE
  /DELIMITERS=","
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    response_id A36
    participant_id A36
    q1_designation A48
    q1_designation_category A32
    q1_designation_other A48
    q2_specialty A48
    q2_specialty_category A32
    q2_specialty_other A48
    q3_years_since_mbbs_bracket A24
    q4_hospital_type A48
    q4_hospital_type_category A24
    q4_hospital_type_other A48
    q5_formal_genai_training F1.0
    q6_used_genai_last_3_months F1.0
    q7_first_use_duration A24
    q8_usage_frequency A24
    q9_daily_time_spent A24
    q10_tools_used A128
    q10_medical_specific_tool A64
    q10_other_tool A64
    q11_access_method A36
    q12_entered_patient_info A24
    q13a_task_diff_dx F1.0
    q13b_task_interp_inv F1.0
    q13c_task_choose_inv F1.0
    q13d_task_mgmt_opt F1.0
    q13e_task_drug_dose F1.0
    q13f_task_lit_summary F1.0
    q13g_task_doc_letters F1.0
    q13h_task_patient_comm F1.0
    q14_reasoning_consultation_stage A80
    q15_last_10_cases_consulted_count F2.0
    q16_verification_frequency A16
    q17_institutional_policy A16
    is_demo F1.0
    created_at A32.
DATASET NAME Survey WINDOW=FRONT.

VARIABLE LABELS
  q1_designation "Q1. Designation (with Other text)"
  q2_specialty "Q2. Specialty (with Other text)"
  q3_years_since_mbbs_bracket "Q3. Years since MBBS completion"
  q4_hospital_type "Q4. Type of hospital (with Other text)"
  q5_formal_genai_training "Q5. Formal GenAI in healthcare training"
  q6_used_genai_last_3_months "Q6. Used GenAI clinically in past 3 months"
  q12_entered_patient_info "Q12. Entered identifiable/clinical patient info"
  q14_reasoning_consultation_stage "Q14. Clinical reasoning consultation timing"
  q15_last_10_cases_consulted_count "Q15. Out of last 10 cases GenAI consulted"
  q16_verification_frequency "Q16. Frequency of guideline verification"
  q17_institutional_policy "Q17. Institutional written GenAI policy".

* 2. DESCRIPTIVE STATISTICS: RESPONDENT PROFILE & COGNITIVE OFFLOADING
FREQUENCIES VARIABLES=q1_designation q2_specialty q3_years_since_mbbs_bracket q4_hospital_type q5_formal_genai_training q6_used_genai_last_3_months q8_usage_frequency q14_reasoning_consultation_stage q17_institutional_policy
  /STATISTICS=STDDEV MEAN MEDIAN
  /ORDER=ANALYSIS.

* 3. PRIMARY OUTCOME: MISLEADING AI RECOMMENDATION ACCEPTANCE BY CADRE
CROSSTABS
  /TABLES=q1_designation BY accepted_misleading_cat
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ CC BPHI PHI
  /CELLS=COUNT ROW COLUMN TOTAL
  /COUNT ROUND CELL.

* 4. LOGISTIC REGRESSION: FACTORS ASSOCIATED WITH AUTOMATION BIAS
LOGISTIC REGRESSION VARIABLES accepted_misleading_any
  /METHOD=ENTER q5_formal_genai_training q15_last_10_cases_consulted_count q16_verification_frequency
  /CRITERIA=PIN(.05) POUT(.10) ITERATE(20) CUT(.5).
`;
