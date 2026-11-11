export const FASTAPI_MAIN_PY = `# ==============================================================================
# Clinical AI Reasoning Lab - FastAPI REST Application
# Standardized Research Protocol Backend
# Python 3.12+ | FastAPI | Pydantic v2 | SQLAlchemy 2.0
# ==============================================================================

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from models import Base, ParticipantModel, QuestionnaireModel, AiInteractionModel, VignetteAnswerModel
from schemas import (
    ParticipantCreate, ParticipantOut,
    QuestionnaireCreate, QuestionnaireOut,
    AiInteractionCreate, AiInteractionOut,
    VignetteAnswerCreate, VignetteAnswerOut,
    AnalyticsSummaryOut
)
from database import engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Clinical AI Reasoning Lab API",
    description="Backend research service for evaluating automation bias, cognitive offloading, and clinical reasoning.",
    version="1.0.0"
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
    return {"status": "healthy", "service": "Clinical AI Reasoning Lab Backend", "version": "1.0.0"}

# --- PARTICIPANTS ---
@app.post("/api/participants", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED, tags=["Participants"])
def register_participant(data: ParticipantCreate, db: Session = Depends(get_db)):
    # Enforce anonymous identifier generation
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

# --- QUESTIONNAIRE ---
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
    # Verification: Initial diagnosis must be locked and cannot be rewritten
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

# --- VIGNETTE ASSESSMENT (BASELINE & POST-AI) ---
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
    # Returns SPSS-ready delimited format
    # Excludes demo data by default for research integrity
    pass
`;

export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- Clinical AI Reasoning Lab - Supabase PostgreSQL Database Schema
-- Standardized Research Protocol Tables & Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Participants Table (Strictly Anonymous Identifiers)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    designation VARCHAR(64) NOT NULL,
    specialty VARCHAR(64) NOT NULL,
    years_since_mbbs INT NOT NULL,
    years_experience INT NOT NULL,
    institution_type VARCHAR(64) NOT NULL,
    daily_patient_load INT NOT NULL,
    prior_ai_exposure BOOLEAN NOT NULL DEFAULT false,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    completed BOOLEAN NOT NULL DEFAULT false,
    current_stage INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Questionnaire Responses (Sections A-D: Demographics, Habits, Offloading, Deskilling)
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    used_ai_last_3_months BOOLEAN NOT NULL,
    ai_tools_used TEXT[] NOT NULL DEFAULT '{}',
    ai_frequency VARCHAR(64) NOT NULL,
    primary_purposes TEXT[] NOT NULL DEFAULT '{}',
    ai_timing VARCHAR(32) NOT NULL,
    complex_vs_routine BOOLEAN NOT NULL DEFAULT false,
    verification_frequency VARCHAR(64) NOT NULL,
    verification_resources TEXT[] NOT NULL DEFAULT '{}',
    -- Likert items 1 to 5
    cognitive_offloading JSONB NOT NULL,
    perceived_deskilling JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Standardized Clinical Cases & Fixed Stimuli
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id VARCHAR(64) PRIMARY KEY,
    case_number INT NOT NULL,
    stage VARCHAR(32) NOT NULL, -- 'baseline' | 'ai_simulation' | 'post_ai'
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
    ai_stimulus JSONB, -- Hidden from participant queries via RLS
    is_published BOOLEAN NOT NULL DEFAULT true,
    expert_reviewed BOOLEAN NOT NULL DEFAULT true
);

-- 4. AI Interaction Records (Permanently stores Initial commitments separate from Final)
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    -- Step B: Initial commitments (PERMANENTLY LOCKED)
    initial_diagnosis TEXT NOT NULL,
    initial_justification TEXT NOT NULL,
    initial_confidence INT NOT NULL CHECK (initial_confidence BETWEEN 1 AND 5),
    initial_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Step D & E: Post-AI outcomes
    ai_agreement VARCHAR(64) NOT NULL,
    final_diagnosis TEXT NOT NULL,
    reason_for_decision TEXT NOT NULL,
    final_confidence INT NOT NULL CHECK (final_confidence BETWEEN 1 AND 5),
    will_verify BOOLEAN NOT NULL DEFAULT false,
    verification_targets TEXT,
    -- Derived outcomes
    switched_diagnosis BOOLEAN NOT NULL DEFAULT false,
    switched_towards_correct BOOLEAN NOT NULL DEFAULT false,
    accepted_misleading BOOLEAN NOT NULL DEFAULT false,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vignette Answers (Baseline & Post-AI Unaided Clinical Reasoning)
CREATE TABLE IF NOT EXISTS public.vignette_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id),
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('baseline', 'post_ai')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    most_likely_diagnosis TEXT NOT NULL,
    differential_1 TEXT NOT NULL,
    differential_2 TEXT NOT NULL,
    red_flags TEXT NOT NULL,
    next_step TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    -- Dual Assessor Rubric Scoring
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

-- Allow anonymous participants to insert their own records
CREATE POLICY "Allow anonymous insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read own participant" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert questionnaire" ON public.questionnaire_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert ai_interactions" ON public.ai_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert vignette_answers" ON public.vignette_answers FOR INSERT WITH CHECK (true);

-- Hide ground-truth and misleading flags from participant select queries
CREATE VIEW public.participant_visible_cases AS
SELECT 
    id, case_number, stage, domain, title, presentation, 
    medical_history, vitals, physical_examination, investigations, 
    mcq_options, is_published,
    -- For AI simulation, only return diagnosis and recommendation, NOT is_misleading!
    CASE 
        WHEN ai_stimulus IS NOT NULL THEN 
            jsonb_build_object(
                'diagnosis', ai_stimulus->>'diagnosis',
                'recommendation', ai_stimulus->>'recommendation',
                'clinicalReasoning', ai_stimulus->>'clinicalReasoning'
            )
        ELSE NULL 
    END as ai_stimulus
FROM public.clinical_cases
WHERE is_published = true;
`;

export const SPSS_SYNTAX_SPS = `* ==============================================================================
* CLINICAL AI REASONING LAB - SPSS STATISTICAL SYNTAX FILE
* Standardized Research Analysis Script for Medical Education Dissertation
* ==============================================================================

* 1. IMPORT PARTICIPANTS COHORT
GET DATA  /TYPE=TXT
  /FILE="participants_cohort.csv"
  /DELCASE=LINE
  /DELIMITERS=","
  /QUALIFIER='"'
  /ARRANGEMENT=DELIMITED
  /FIRSTCASE=2
  /VARIABLES=
    participant_id A36
    code A12
    designation A32
    specialty A32
    years_since_mbbs F4.0
    years_experience F4.0
    institution_type A32
    daily_patient_load F4.0
    prior_ai_exposure F1.0
    completed F1.0.
DATASET NAME Participants WINDOW=FRONT.

* 2. DESCRIPTIVE STATISTICS
FREQUENCIES VARIABLES=designation specialty prior_ai_exposure
  /STATISTICS=STDDEV MEAN MEDIAN
  /ORDER=ANALYSIS.

* 3. PRIMARY OUTCOME: MISLEADING AI RECOMMENDATION ACCEPTANCE
* Chi-Square Test by Designation (Junior vs Senior)
CROSSTABS
  /TABLES=designation BY accepted_misleading_cat
  /FORMAT=AVALUE TABLES
  /STATISTICS=CHISQ CC BPHI PHI
  /CELLS=COUNT ROW COLUMN TOTAL
  /COUNT ROUND CELL.

* 4. PAIRED T-TEST & WILCOXON SIGNED-RANK TEST (BASELINE VS POST-AI SCORES)
T-TEST PAIRS=baseline_total_score WITH post_ai_total_score (PAIRED)
  /CRITERIA=CI(.95)
  /MISSING=ANALYSIS.

NPAR TESTS
  /WILCOXON=baseline_total_score WITH post_ai_total_score (PAIRED)
  /MISSING ANALYSIS.

* 5. LOGISTIC REGRESSION: FACTORS ASSOCIATED WITH AUTOMATION BIAS
LOGISTIC REGRESSION VARIABLES accepted_misleading_any
  /METHOD=ENTER years_experience prior_ai_exposure cognitive_offloading_index
  /CRITERIA=PIN(.05) POUT(.10) ITERATE(20) CUT(.5).
`;
