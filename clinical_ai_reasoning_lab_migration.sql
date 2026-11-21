-- ==============================================================================
-- Clinical AI Reasoning Lab — Audited Production PostgreSQL / Supabase Migration
-- Version: 001_clinical_ai_reasoning_lab_schema
-- Compatible with: src/services/supabaseResearchService.ts & src/types/index.ts
-- ==============================================================================
-- Instructions:
--   1. Paste and run this entire script in Supabase Dashboard -> SQL Editor.
--   2. Enable "Allow anonymous sign-ins" in Authentication -> Providers.
--   3. Verify public.clinical_cases has 11 rows and public.clinical_case_answer_keys has 11 rows.
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sequence for human-readable anonymous participant codes (DOC-001001+)
CREATE SEQUENCE IF NOT EXISTS public.participant_code_seq START WITH 1001 INCREMENT BY 1;

-- ==============================================================================
-- 1. CORE TEAM, RECRUITMENT & CLINICAL CASE TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.research_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    researcher_code VARCHAR(32) NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('pi', 'researcher', 'assessor')),
    assessor_slot INT CHECK (assessor_slot IS NULL OR assessor_slot IN (1, 2)),
    recruitment_target INT NOT NULL DEFAULT 0 CHECK (recruitment_target >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assessor_requires_slot CHECK (
        role <> 'assessor' OR assessor_slot IN (1, 2)
    )
);

CREATE TABLE IF NOT EXISTS public.recruitment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    researcher_id UUID NOT NULL REFERENCES public.research_team_members(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INT CHECK (max_uses IS NULL OR max_uses > 0),
    uses_count INT NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participant-safe clinical stimuli ONLY (zero gold standards, keys, rubrics, or misleading flags)
CREATE TABLE IF NOT EXISTS public.clinical_cases (
    id VARCHAR(64) PRIMARY KEY,
    case_number INT NOT NULL CHECK (case_number > 0),
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('ai_simulation', 'post_ai')),
    domain VARCHAR(128) NOT NULL,
    title TEXT NOT NULL,
    presentation TEXT NOT NULL,
    medical_history TEXT NOT NULL,
    vitals JSONB NOT NULL,
    physical_examination TEXT NOT NULL,
    investigations JSONB NOT NULL DEFAULT '[]'::jsonb,
    clinical_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    mcq_options TEXT[] NOT NULL,
    ai_diagnosis TEXT,
    ai_recommendation TEXT,
    ai_clinical_reasoning TEXT,
    ai_follow_up_suggestions JSONB,
    is_published BOOLEAN NOT NULL DEFAULT true,
    expert_reviewed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stage, case_number)
);

-- Isolated Gold Standards, Rubrics & Misleading Stimulus Classifications (PI & Assessors only)
CREATE TABLE IF NOT EXISTS public.clinical_case_answer_keys (
    case_id VARCHAR(64) PRIMARY KEY REFERENCES public.clinical_cases(id) ON DELETE CASCADE,
    gold_standard_diagnosis TEXT NOT NULL,
    acceptable_alternatives TEXT[] NOT NULL DEFAULT '{}',
    differential_keys TEXT[] NOT NULL DEFAULT '{}',
    red_flag_keys TEXT[] NOT NULL DEFAULT '{}',
    next_step_key TEXT NOT NULL,
    rubric JSONB NOT NULL,
    is_misleading BOOLEAN NOT NULL DEFAULT false,
    misleading_classification TEXT CHECK (
        misleading_classification IS NULL
        OR misleading_classification IN (
            'Diagnostic Anchoring',
            'Investigation Inversion',
            'Harmful Clinical Management'
        )
    ),
    researcher_note TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. PARTICIPANT & CLINICAL WORKFLOW TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    designation TEXT NOT NULL CHECK (
        designation IN (
            'Junior Resident',
            'Senior Resident',
            'Assistant Professor',
            'Associate Professor',
            'Professor',
            'Consultant',
            'Other'
        )
    ),
    designation_other TEXT,
    specialty TEXT NOT NULL CHECK (
        specialty IN (
            'General Medicine',
            'General Surgery',
            'Pediatrics',
            'Obstetrics and Gynaecology',
            'Emergency Medicine',
            'Other'
        )
    ),
    specialty_other TEXT,
    years_since_mbbs_bracket TEXT NOT NULL CHECK (
        years_since_mbbs_bracket IN (
            'Less than 1 year',
            '1–5 years',
            '6–10 years',
            'More than 10 years'
        )
    ),
    institution_type TEXT NOT NULL CHECK (
        institution_type IN (
            'Government hospital',
            'Private hospital',
            'Teaching hospital',
            'Other'
        )
    ),
    institution_other TEXT,
    formal_genai_training BOOLEAN NOT NULL DEFAULT false,
    consent_given BOOLEAN NOT NULL CHECK (consent_given = true),
    is_demo BOOLEAN NOT NULL DEFAULT false CHECK (is_demo = false),
    -- Immutable recruitment attribution
    recruitment_source TEXT NOT NULL CHECK (recruitment_source IN ('direct', 'team')),
    recruited_by UUID REFERENCES public.research_team_members(id) ON DELETE RESTRICT,
    researcher_code VARCHAR(32),
    recruitment_link_id UUID REFERENCES public.recruitment_links(id) ON DELETE RESTRICT,
    -- Server-controlled workflow status & milestone timestamps
    current_stage INT NOT NULL DEFAULT 4 CHECK (current_stage BETWEEN 1 AND 7),
    completion_status TEXT NOT NULL DEFAULT 'registered' CHECK (
        completion_status IN ('registered', 'in_progress', 'completed', 'abandoned')
    ),
    completed BOOLEAN NOT NULL DEFAULT false,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    questionnaire_completed_at TIMESTAMPTZ,
    cdss_started_at TIMESTAMPTZ,
    cdss_completed_at TIMESTAMPTZ,
    vignettes_started_at TIMESTAMPTZ,
    vignettes_completed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT attribution_integrity CHECK (
        (recruitment_source = 'direct' AND recruited_by IS NULL AND researcher_code IS NULL AND recruitment_link_id IS NULL)
        OR
        (recruitment_source = 'team' AND recruited_by IS NOT NULL AND researcher_code IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
    is_demo BOOLEAN NOT NULL DEFAULT false CHECK (is_demo = false),
    designation TEXT NOT NULL,
    designation_other TEXT,
    specialty TEXT NOT NULL,
    specialty_other TEXT,
    years_since_mbbs_bracket TEXT NOT NULL,
    hospital_type TEXT NOT NULL,
    hospital_type_other TEXT,
    formal_genai_training BOOLEAN NOT NULL,
    used_genai_last_3_months BOOLEAN NOT NULL,
    first_use_duration TEXT CHECK (
        first_use_duration IS NULL OR first_use_duration IN (
            'Less than 3 months',
            '3–6 months',
            '6–12 months',
            'More than 12 months'
        )
    ),
    usage_frequency TEXT CHECK (
        usage_frequency IS NULL OR usage_frequency IN (
            'Less than once a week',
            '1–2 days per week',
            '3–5 days per week',
            'Daily',
            'Several times a day'
        )
    ),
    daily_time_spent TEXT CHECK (
        daily_time_spent IS NULL OR daily_time_spent IN (
            'Less than 10 minutes',
            '10–30 minutes',
            '31–60 minutes',
            'More than 60 minutes'
        )
    ),
    tools_used TEXT[] NOT NULL DEFAULT '{}',
    medical_specific_tool_name TEXT,
    other_tool_name TEXT,
    access_method TEXT CHECK (
        access_method IS NULL OR access_method IN (
            'Free public version',
            'Personal paid subscription',
            'Provided by my hospital/institution',
            'A combination of the above'
        )
    ),
    entered_patient_info TEXT CHECK (
        entered_patient_info IS NULL OR entered_patient_info IN (
            'Never',
            'Once or twice',
            'Sometimes',
            'Often'
        )
    ),
    task_frequency JSONB,
    reasoning_consultation_stage TEXT CHECK (
        reasoning_consultation_stage IS NULL OR reasoning_consultation_stage IN (
            'Before forming my own clinical assessment',
            'After my initial assessment, to cross-check my thinking',
            'When uncertain or unable to reach a conclusion',
            'After making a decision, primarily for documentation',
            'I do not use GenAI for clinical reasoning'
        )
    ),
    last_10_cases_consulted_count INT CHECK (
        last_10_cases_consulted_count IS NULL OR last_10_cases_consulted_count BETWEEN 0 AND 10
    ),
    verification_frequency TEXT CHECK (
        verification_frequency IS NULL OR verification_frequency IN (
            'Never',
            'Rarely',
            'Sometimes',
            'Often',
            'Very often'
        )
    ),
    institutional_policy TEXT CHECK (
        institutional_policy IS NULL OR institutional_policy IN ('Yes', 'No', 'Not sure')
    ),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_session_timers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id) ON DELETE RESTRICT,
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('ai_simulation', 'post_ai')),
    first_displayed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_seconds INT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    open_count INT NOT NULL DEFAULT 1 CHECK (open_count >= 1),
    submitted_at TIMESTAMPTZ,
    UNIQUE (participant_id, case_id)
);

CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id) ON DELETE RESTRICT,
    is_demo BOOLEAN NOT NULL DEFAULT false CHECK (is_demo = false),
    initial_diagnosis TEXT,
    initial_justification TEXT,
    initial_confidence INT CHECK (initial_confidence IS NULL OR initial_confidence BETWEEN 1 AND 5),
    initial_submitted_at TIMESTAMPTZ,
    ai_agreement TEXT NOT NULL CHECK (
        ai_agreement IN (
            'Completely agree',
            'Partially agree',
            'Disagree',
            'Uncertain; requires verification'
        )
    ),
    final_diagnosis TEXT NOT NULL,
    switched_diagnosis BOOLEAN NOT NULL DEFAULT false,
    reason_for_decision TEXT NOT NULL,
    final_confidence INT NOT NULL CHECK (final_confidence BETWEEN 1 AND 5),
    will_verify BOOLEAN NOT NULL,
    verification_targets TEXT NOT NULL,
    first_displayed_at TIMESTAMPTZ NOT NULL,
    last_opened_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_seconds INT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    wall_clock_seconds INT NOT NULL DEFAULT 0 CHECK (wall_clock_seconds >= 0),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id, case_id)
);

-- Server-evaluated CDSS outcomes (PI ONLY; isolated from participants)
CREATE TABLE IF NOT EXISTS public.ai_interaction_evaluations (
    ai_interaction_id UUID PRIMARY KEY REFERENCES public.ai_interactions(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id) ON DELETE RESTRICT,
    is_misleading BOOLEAN NOT NULL,
    matched_gold_standard BOOLEAN NOT NULL,
    switched_towards_correct BOOLEAN NOT NULL,
    accepted_misleading BOOLEAN NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.followup_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id) ON DELETE RESTRICT,
    suggestion_id TEXT NOT NULL CHECK (suggestion_id IN ('followup_1', 'followup_2')),
    prompt_label TEXT NOT NULL,
    response_text TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (participant_id, case_id, suggestion_id)
);

CREATE TABLE IF NOT EXISTS public.vignette_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    case_id VARCHAR(64) NOT NULL REFERENCES public.clinical_cases(id) ON DELETE RESTRICT,
    stage VARCHAR(32) NOT NULL DEFAULT 'post_ai' CHECK (stage = 'post_ai'),
    is_demo BOOLEAN NOT NULL DEFAULT false CHECK (is_demo = false),
    most_likely_diagnosis TEXT NOT NULL,
    differential_1 TEXT NOT NULL,
    differential_2 TEXT NOT NULL,
    red_flags TEXT NOT NULL,
    next_step TEXT NOT NULL,
    confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 5),
    first_displayed_at TIMESTAMPTZ NOT NULL,
    last_opened_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_seconds INT NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    wall_clock_seconds INT NOT NULL DEFAULT 0 CHECK (wall_clock_seconds >= 0),
    scoring_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        scoring_status IN ('pending', 'partial', 'dual_scored', 'adjudicated')
    ),
    final_resolved_score NUMERIC(4, 2) CHECK (
        final_resolved_score IS NULL OR (final_resolved_score >= 0 AND final_resolved_score <= 4)
    ),
    pi_adjudicated_score NUMERIC(4, 2) CHECK (
        pi_adjudicated_score IS NULL OR (pi_adjudicated_score >= 0 AND pi_adjudicated_score <= 4)
    ),
    UNIQUE (participant_id, case_id)
);

CREATE TABLE IF NOT EXISTS public.assessor_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vignette_answer_id UUID NOT NULL REFERENCES public.vignette_answers(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES public.research_team_members(id) ON DELETE RESTRICT,
    assessor_slot INT NOT NULL CHECK (assessor_slot IN (1, 2)),
    primary_diagnosis_mark NUMERIC(3, 2) NOT NULL CHECK (primary_diagnosis_mark IN (0, 0.5, 1.0)),
    differentials_mark NUMERIC(3, 2) NOT NULL CHECK (differentials_mark IN (0, 0.5, 1.0)),
    red_flags_mark NUMERIC(3, 2) NOT NULL CHECK (red_flags_mark IN (0, 0.5, 1.0)),
    next_step_mark NUMERIC(3, 2) NOT NULL CHECK (next_step_mark IN (0, 0.5, 1.0)),
    total_score NUMERIC(4, 2) GENERATED ALWAYS AS (
        primary_diagnosis_mark + differentials_mark + red_flags_mark + next_step_mark
    ) STORED,
    notes TEXT,
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (vignette_answer_id, assessor_slot)
);

CREATE TABLE IF NOT EXISTS public.assessor_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessor_score_id UUID NOT NULL REFERENCES public.assessor_scores(id) ON DELETE CASCADE,
    vignette_answer_id UUID NOT NULL REFERENCES public.vignette_answers(id) ON DELETE CASCADE,
    assessor_id UUID NOT NULL REFERENCES public.research_team_members(id) ON DELETE RESTRICT,
    assessor_slot INT NOT NULL CHECK (assessor_slot IN (1, 2)),
    previous_total NUMERIC(4, 2),
    new_total NUMERIC(4, 2) NOT NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'session_resumed',
            'stage_entered',
            'case_opened',
            'case_navigated',
            'tab_hidden',
            'tab_visible',
            'page_exit_beacon',
            'cdss_followup_clicked',
            'cdss_submitted',
            'vignette_submitted',
            'questionnaire_submitted',
            'study_completed'
        )
    ),
    stage INT CHECK (stage IS NULL OR stage BETWEEN 1 AND 7),
    case_id VARCHAR(64) REFERENCES public.clinical_cases(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_team_members_auth_user ON public.research_team_members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role_active ON public.research_team_members(role, is_active);
CREATE INDEX IF NOT EXISTS idx_recruitment_links_researcher ON public.recruitment_links(researcher_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_links_token_active ON public.recruitment_links(token, is_active);

CREATE INDEX IF NOT EXISTS idx_participants_auth_user ON public.participants(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_participants_recruited_by ON public.participants(recruited_by);
CREATE INDEX IF NOT EXISTS idx_participants_completion_status ON public.participants(completion_status);
CREATE INDEX IF NOT EXISTS idx_participants_last_activity ON public.participants(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_timers_participant_case ON public.case_session_timers(participant_id, case_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_participant ON public.ai_interactions(participant_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_case ON public.ai_interactions(case_id);
CREATE INDEX IF NOT EXISTS idx_ai_evals_participant ON public.ai_interaction_evaluations(participant_id);
CREATE INDEX IF NOT EXISTS idx_followup_events_participant ON public.followup_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_vignette_answers_participant ON public.vignette_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_vignette_answers_scoring_status ON public.vignette_answers(scoring_status);
CREATE INDEX IF NOT EXISTS idx_assessor_scores_vignette ON public.assessor_scores(vignette_answer_id);
CREATE INDEX IF NOT EXISTS idx_research_events_participant_time ON public.research_events(participant_id, server_timestamp DESC);

-- ==============================================================================
-- 4. SECURITY HELPER FUNCTIONS & IMMUTABILITY TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_team_member()
RETURNS public.research_team_members
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT *
    FROM public.research_team_members
    WHERE auth_user_id = auth.uid()
      AND is_active = true
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_team_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_team_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_active_pi()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.research_team_members
        WHERE auth_user_id = auth.uid()
          AND role = 'pi'
          AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_pi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_pi() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_active_team_member()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.research_team_members
        WHERE auth_user_id = auth.uid()
          AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_team_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_team_member() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_active_assessor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.research_team_members
        WHERE auth_user_id = auth.uid()
          AND role = 'assessor'
          AND assessor_slot IN (1, 2)
          AND is_active = true
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_assessor() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_assessor() TO authenticated;

-- Prevent any mutation of identity or recruitment attribution columns on participants
CREATE OR REPLACE FUNCTION public.enforce_participant_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.id <> OLD.id
       OR NEW.auth_user_id <> OLD.auth_user_id
       OR NEW.code <> OLD.code
       OR NEW.recruitment_source <> OLD.recruitment_source
       OR NEW.recruited_by IS DISTINCT FROM OLD.recruited_by
       OR NEW.researcher_code IS DISTINCT FROM OLD.researcher_code
       OR NEW.recruitment_link_id IS DISTINCT FROM OLD.recruitment_link_id
       OR NEW.consented_at <> OLD.consented_at
       OR NEW.registered_at <> OLD.registered_at
       OR NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'Participant identity, consent timestamp, and recruitment attribution fields are immutable.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_participants_immutable ON public.participants;
CREATE TRIGGER trg_participants_immutable
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_participant_immutability();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) & LEAST-PRIVILEGE GRANTS
-- ==============================================================================

ALTER TABLE public.research_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_case_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_session_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vignette_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessor_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessor_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_events ENABLE ROW LEVEL SECURITY;

-- Revoke all direct writes from anon/authenticated; writes flow through audited RPCs
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Grant narrow SELECT where RLS policies apply (direct INSERT/UPDATE/DELETE remain revoked)
GRANT SELECT ON public.clinical_cases TO authenticated;
GRANT SELECT ON public.clinical_case_answer_keys TO authenticated;
GRANT SELECT ON public.research_team_members TO authenticated;
GRANT SELECT ON public.recruitment_links TO authenticated;
GRANT SELECT ON public.participants TO authenticated;
GRANT SELECT ON public.questionnaire_responses TO authenticated;
GRANT SELECT ON public.case_session_timers TO authenticated;
GRANT SELECT ON public.ai_interactions TO authenticated;
GRANT SELECT ON public.ai_interaction_evaluations TO authenticated;
GRANT SELECT ON public.followup_events TO authenticated;
GRANT SELECT ON public.vignette_answers TO authenticated;
GRANT SELECT ON public.assessor_scores TO authenticated;
GRANT SELECT ON public.assessor_score_history TO authenticated;
GRANT SELECT ON public.research_events TO authenticated;

-- clinical_cases: published stimuli readable by any authenticated participant/team member
DROP POLICY IF EXISTS "clinical_cases_select_published_or_team" ON public.clinical_cases;
CREATE POLICY "clinical_cases_select_published_or_team"
    ON public.clinical_cases
    FOR SELECT
    TO authenticated
    USING (is_published = true OR public.is_active_team_member());

-- clinical_case_answer_keys: ONLY PI and Assessors (NEVER participants or general researchers)
DROP POLICY IF EXISTS "answer_keys_select_pi_or_assessor" ON public.clinical_case_answer_keys;
CREATE POLICY "answer_keys_select_pi_or_assessor"
    ON public.clinical_case_answer_keys
    FOR SELECT
    TO authenticated
    USING (public.is_active_pi() OR public.is_active_assessor());

-- research_team_members: own row or PI
DROP POLICY IF EXISTS "team_members_select_own_or_pi" ON public.research_team_members;
CREATE POLICY "team_members_select_own_or_pi"
    ON public.research_team_members
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_active_pi());

-- recruitment_links: own researcher or PI
DROP POLICY IF EXISTS "recruitment_links_select_own_or_pi" ON public.recruitment_links;
CREATE POLICY "recruitment_links_select_own_or_pi"
    ON public.recruitment_links
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR researcher_id = (SELECT id FROM public.research_team_members WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1)
    );

-- participants: own auth_user_id OR PI ONLY (researchers use operational RPC, not raw table)
DROP POLICY IF EXISTS "participants_select_own_or_pi" ON public.participants;
CREATE POLICY "participants_select_own_or_pi"
    ON public.participants
    FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() OR public.is_active_pi());

-- questionnaire_responses: own participant OR PI
DROP POLICY IF EXISTS "questionnaires_select_own_or_pi" ON public.questionnaire_responses;
CREATE POLICY "questionnaires_select_own_or_pi"
    ON public.questionnaire_responses
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = questionnaire_responses.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- case_session_timers: own participant OR PI
DROP POLICY IF EXISTS "timers_select_own_or_pi" ON public.case_session_timers;
CREATE POLICY "timers_select_own_or_pi"
    ON public.case_session_timers
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = case_session_timers.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- ai_interactions: own participant OR PI
DROP POLICY IF EXISTS "ai_interactions_select_own_or_pi" ON public.ai_interactions;
CREATE POLICY "ai_interactions_select_own_or_pi"
    ON public.ai_interactions
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = ai_interactions.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- ai_interaction_evaluations: PI ONLY (participants and assessors never read misleading/correct flags)
DROP POLICY IF EXISTS "ai_evals_select_pi_only" ON public.ai_interaction_evaluations;
CREATE POLICY "ai_evals_select_pi_only"
    ON public.ai_interaction_evaluations
    FOR SELECT
    TO authenticated
    USING (public.is_active_pi());

-- followup_events: own participant OR PI
DROP POLICY IF EXISTS "followup_events_select_own_or_pi" ON public.followup_events;
CREATE POLICY "followup_events_select_own_or_pi"
    ON public.followup_events
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = followup_events.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- vignette_answers: own participant, PI, or active assessor
DROP POLICY IF EXISTS "vignettes_select_own_pi_or_assessor" ON public.vignette_answers;
CREATE POLICY "vignettes_select_own_pi_or_assessor"
    ON public.vignette_answers
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR public.is_active_assessor()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = vignette_answers.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- assessor_scores: blinded slot isolation (Assessor 1 sees only slot 1; Assessor 2 sees only slot 2; PI sees all)
DROP POLICY IF EXISTS "assessor_scores_select_slot_or_pi" ON public.assessor_scores;
CREATE POLICY "assessor_scores_select_slot_or_pi"
    ON public.assessor_scores
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1
            FROM public.research_team_members m
            WHERE m.auth_user_id = auth.uid()
              AND m.is_active = true
              AND m.role = 'assessor'
              AND m.assessor_slot = assessor_scores.assessor_slot
        )
    );

-- assessor_score_history: PI only
DROP POLICY IF EXISTS "assessor_history_select_pi_only" ON public.assessor_score_history;
CREATE POLICY "assessor_history_select_pi_only"
    ON public.assessor_score_history
    FOR SELECT
    TO authenticated
    USING (public.is_active_pi());

-- research_events: own participant OR PI
DROP POLICY IF EXISTS "research_events_select_own_or_pi" ON public.research_events;
CREATE POLICY "research_events_select_own_or_pi"
    ON public.research_events
    FOR SELECT
    TO authenticated
    USING (
        public.is_active_pi()
        OR EXISTS (
            SELECT 1 FROM public.participants p
            WHERE p.id = research_events.participant_id
              AND p.auth_user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 6. PARTICIPANT WORKFLOW RPC FUNCTIONS (Exact Matches for supabaseResearchService.ts)
-- ==============================================================================

-- 6.1 validate_recruitment_token
CREATE OR REPLACE FUNCTION public.validate_recruitment_token(p_token TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    researcher_code TEXT,
    link_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_token TEXT := NULLIF(BTRIM(p_token), '');
    v_res_code TEXT;
    v_label TEXT;
BEGIN
    IF v_clean_token IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    SELECT m.researcher_code, rl.label
    INTO v_res_code, v_label
    FROM public.recruitment_links rl
    JOIN public.research_team_members m ON m.id = rl.researcher_id
    WHERE rl.token = v_clean_token
      AND rl.is_active = true
      AND m.is_active = true
      AND (rl.expires_at IS NULL OR rl.expires_at > NOW())
      AND (rl.max_uses IS NULL OR rl.uses_count < rl.max_uses)
    LIMIT 1;

    IF v_res_code IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT;
    ELSE
        RETURN QUERY SELECT true, v_res_code, v_label;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_recruitment_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_recruitment_token(TEXT) TO anon, authenticated;

-- 6.2 enroll_participant
CREATE OR REPLACE FUNCTION public.enroll_participant(
    p_designation TEXT,
    p_designation_other TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT 'General Medicine',
    p_specialty_other TEXT DEFAULT NULL,
    p_years_since_mbbs_bracket TEXT DEFAULT '1–5 years',
    p_institution_type TEXT DEFAULT 'Teaching hospital',
    p_institution_other TEXT DEFAULT NULL,
    p_formal_genai_training BOOLEAN DEFAULT false,
    p_consent_given BOOLEAN DEFAULT false,
    p_referral_token TEXT DEFAULT NULL
)
RETURNS TABLE (
    participant_id UUID,
    participant_code TEXT,
    recruitment_source TEXT,
    researcher_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing public.participants;
    v_link public.recruitment_links;
    v_member public.research_team_members;
    v_clean_token TEXT := NULLIF(BTRIM(p_referral_token), '');
    v_rec_source TEXT := 'direct';
    v_rec_by UUID := NULL;
    v_res_code VARCHAR(32) := NULL;
    v_link_id UUID := NULL;
    v_new_id UUID;
    v_new_code VARCHAR(32);
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required before participant enrollment.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.research_team_members WHERE auth_user_id = v_uid) THEN
        RAISE EXCEPTION 'Research team accounts cannot enroll as study participants.';
    END IF;

    IF p_consent_given IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Informed consent is required before enrollment.';
    END IF;

    -- Idempotent return if this anonymous user already enrolled
    SELECT * INTO v_existing
    FROM public.participants
    WHERE auth_user_id = v_uid
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY
        SELECT v_existing.id, v_existing.code::TEXT, v_existing.recruitment_source, v_existing.researcher_code::TEXT;
        RETURN;
    END IF;

    -- Resolve optional referral token authoritatively server-side
    IF v_clean_token IS NOT NULL THEN
        SELECT * INTO v_link
        FROM public.recruitment_links
        WHERE token = v_clean_token
        FOR UPDATE;

        IF NOT FOUND OR v_link.is_active IS DISTINCT FROM true THEN
            RAISE EXCEPTION 'Invalid or inactive recruitment link token.';
        END IF;

        IF v_link.expires_at IS NOT NULL AND v_link.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Recruitment link has expired.';
        END IF;

        IF v_link.max_uses IS NOT NULL AND v_link.uses_count >= v_link.max_uses THEN
            RAISE EXCEPTION 'Recruitment link maximum usage reached.';
        END IF;

        SELECT * INTO v_member
        FROM public.research_team_members
        WHERE id = v_link.researcher_id
          AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Recruiting researcher account is inactive.';
        END IF;

        UPDATE public.recruitment_links
        SET uses_count = uses_count + 1
        WHERE id = v_link.id;

        v_rec_source := 'team';
        v_rec_by := v_member.id;
        v_res_code := v_member.researcher_code;
        v_link_id := v_link.id;
    END IF;

    v_new_code := 'DOC-' || LPAD(nextval('public.participant_code_seq')::TEXT, 6, '0');

    INSERT INTO public.participants (
        auth_user_id,
        code,
        designation,
        designation_other,
        specialty,
        specialty_other,
        years_since_mbbs_bracket,
        institution_type,
        institution_other,
        formal_genai_training,
        consent_given,
        is_demo,
        recruitment_source,
        recruited_by,
        researcher_code,
        recruitment_link_id,
        current_stage,
        completion_status,
        completed,
        consented_at,
        registered_at,
        last_activity_at,
        created_at
    )
    VALUES (
        v_uid,
        v_new_code,
        p_designation,
        NULLIF(BTRIM(p_designation_other), ''),
        p_specialty,
        NULLIF(BTRIM(p_specialty_other), ''),
        p_years_since_mbbs_bracket,
        p_institution_type,
        NULLIF(BTRIM(p_institution_other), ''),
        COALESCE(p_formal_genai_training, false),
        true,
        false,
        v_rec_source,
        v_rec_by,
        v_res_code,
        v_link_id,
        4,
        'registered',
        false,
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
    RETURNING id INTO v_new_id;

    RETURN QUERY SELECT v_new_id, v_new_code::TEXT, v_rec_source, v_res_code::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_participant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enroll_participant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT) TO authenticated;

-- 6.3 submit_questionnaire
CREATE OR REPLACE FUNCTION public.submit_questionnaire(
    p_participant_id UUID,
    p_designation TEXT,
    p_designation_other TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT 'General Medicine',
    p_specialty_other TEXT DEFAULT NULL,
    p_years_since_mbbs_bracket TEXT DEFAULT '1–5 years',
    p_hospital_type TEXT DEFAULT 'Teaching hospital',
    p_hospital_type_other TEXT DEFAULT NULL,
    p_formal_genai_training BOOLEAN DEFAULT false,
    p_used_genai_last_3_months BOOLEAN DEFAULT false,
    p_first_use_duration TEXT DEFAULT NULL,
    p_usage_frequency TEXT DEFAULT NULL,
    p_daily_time_spent TEXT DEFAULT NULL,
    p_tools_used TEXT[] DEFAULT '{}',
    p_medical_specific_tool_name TEXT DEFAULT NULL,
    p_other_tool_name TEXT DEFAULT NULL,
    p_access_method TEXT DEFAULT NULL,
    p_entered_patient_info TEXT DEFAULT NULL,
    p_task_frequency JSONB DEFAULT NULL,
    p_reasoning_consultation_stage TEXT DEFAULT NULL,
    p_last_10_cases_consulted_count INT DEFAULT NULL,
    p_verification_frequency TEXT DEFAULT NULL,
    p_institutional_policy TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_participant public.participants;
    v_qid UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_participant
    FROM public.participants
    WHERE id = p_participant_id
      AND auth_user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participant session not found or unauthorized.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.questionnaire_responses WHERE participant_id = p_participant_id) THEN
        RAISE EXCEPTION 'Questionnaire response has already been submitted and locked.';
    END IF;

    INSERT INTO public.questionnaire_responses (
        participant_id,
        is_demo,
        designation,
        designation_other,
        specialty,
        specialty_other,
        years_since_mbbs_bracket,
        hospital_type,
        hospital_type_other,
        formal_genai_training,
        used_genai_last_3_months,
        first_use_duration,
        usage_frequency,
        daily_time_spent,
        tools_used,
        medical_specific_tool_name,
        other_tool_name,
        access_method,
        entered_patient_info,
        task_frequency,
        reasoning_consultation_stage,
        last_10_cases_consulted_count,
        verification_frequency,
        institutional_policy,
        submitted_at,
        created_at
    )
    VALUES (
        p_participant_id,
        false,
        p_designation,
        NULLIF(BTRIM(p_designation_other), ''),
        p_specialty,
        NULLIF(BTRIM(p_specialty_other), ''),
        p_years_since_mbbs_bracket,
        p_hospital_type,
        NULLIF(BTRIM(p_hospital_type_other), ''),
        COALESCE(p_formal_genai_training, false),
        COALESCE(p_used_genai_last_3_months, false),
        CASE WHEN p_used_genai_last_3_months THEN p_first_use_duration ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_usage_frequency ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_daily_time_spent ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN COALESCE(p_tools_used, '{}') ELSE '{}' END,
        CASE WHEN p_used_genai_last_3_months THEN NULLIF(BTRIM(p_medical_specific_tool_name), '') ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN NULLIF(BTRIM(p_other_tool_name), '') ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_access_method ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_entered_patient_info ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_task_frequency ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_reasoning_consultation_stage ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_last_10_cases_consulted_count ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_verification_frequency ELSE NULL END,
        CASE WHEN p_used_genai_last_3_months THEN p_institutional_policy ELSE NULL END,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_qid;

    UPDATE public.participants
    SET designation = p_designation,
        designation_other = NULLIF(BTRIM(p_designation_other), ''),
        specialty = p_specialty,
        specialty_other = NULLIF(BTRIM(p_specialty_other), ''),
        years_since_mbbs_bracket = p_years_since_mbbs_bracket,
        institution_type = p_hospital_type,
        institution_other = NULLIF(BTRIM(p_hospital_type_other), ''),
        formal_genai_training = COALESCE(p_formal_genai_training, false),
        questionnaire_completed_at = NOW(),
        current_stage = GREATEST(current_stage, 5),
        completion_status = 'in_progress',
        last_activity_at = NOW()
    WHERE id = p_participant_id;

    INSERT INTO public.research_events (participant_id, event_type, stage, server_timestamp)
    VALUES (p_participant_id, 'questionnaire_submitted', 4, NOW());

    RETURN v_qid;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_questionnaire(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN,
    TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_questionnaire(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN,
    TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, INT, TEXT, TEXT
) TO authenticated;

-- 6.4 open_study_case
CREATE OR REPLACE FUNCTION public.open_study_case(
    p_participant_id UUID,
    p_case_id VARCHAR(64)
)
RETURNS TABLE (
    first_displayed_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    active_seconds INT,
    open_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_case public.clinical_cases;
    v_timer public.case_session_timers;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    SELECT * INTO v_case
    FROM public.clinical_cases
    WHERE id = p_case_id AND is_published = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Published study case % not found.', p_case_id;
    END IF;

    INSERT INTO public.case_session_timers (
        participant_id,
        case_id,
        stage,
        first_displayed_at,
        last_opened_at,
        last_heartbeat_at,
        active_seconds,
        open_count
    )
    VALUES (
        p_participant_id,
        p_case_id,
        v_case.stage,
        NOW(),
        NOW(),
        NOW(),
        0,
        1
    )
    ON CONFLICT (participant_id, case_id) DO UPDATE
    SET last_opened_at = NOW(),
        last_heartbeat_at = NOW(),
        open_count = public.case_session_timers.open_count + 1
    RETURNING * INTO v_timer;

    UPDATE public.participants
    SET cdss_started_at = CASE
            WHEN v_case.stage = 'ai_simulation' THEN COALESCE(cdss_started_at, NOW())
            ELSE cdss_started_at
        END,
        vignettes_started_at = CASE
            WHEN v_case.stage = 'post_ai' THEN COALESCE(vignettes_started_at, NOW())
            ELSE vignettes_started_at
        END,
        completion_status = CASE WHEN completed THEN 'completed' ELSE 'in_progress' END,
        last_activity_at = NOW()
    WHERE id = p_participant_id;

    INSERT INTO public.research_events (participant_id, event_type, stage, case_id, server_timestamp)
    VALUES (
        p_participant_id,
        CASE WHEN v_timer.open_count = 1 THEN 'case_opened' ELSE 'case_navigated' END,
        CASE WHEN v_case.stage = 'ai_simulation' THEN 5 ELSE 6 END,
        p_case_id,
        NOW()
    );

    RETURN QUERY
    SELECT v_timer.first_displayed_at, v_timer.last_opened_at, v_timer.active_seconds, v_timer.open_count;
END;
$$;

REVOKE ALL ON FUNCTION public.open_study_case(UUID, VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_study_case(UUID, VARCHAR) TO authenticated;

-- 6.5 heartbeat_case_timer
CREATE OR REPLACE FUNCTION public.heartbeat_case_timer(
    p_participant_id UUID,
    p_case_id VARCHAR(64),
    p_delta_seconds INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_timer public.case_session_timers;
    v_clamped_delta INT;
    v_elapsed_since_last INT;
    v_safe_increment INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    SELECT * INTO v_timer
    FROM public.case_session_timers
    WHERE participant_id = p_participant_id
      AND case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    IF v_timer.submitted_at IS NOT NULL THEN
        RETURN v_timer.active_seconds;
    END IF;

    v_clamped_delta := LEAST(GREATEST(COALESCE(p_delta_seconds, 0), 0), 30);
    v_elapsed_since_last := GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (NOW() - v_timer.last_heartbeat_at)))::INT + 2
    );
    v_safe_increment := LEAST(v_clamped_delta, v_elapsed_since_last);

    UPDATE public.case_session_timers
    SET active_seconds = active_seconds + v_safe_increment,
        last_heartbeat_at = NOW()
    WHERE id = v_timer.id
    RETURNING active_seconds INTO v_clamped_delta;

    UPDATE public.participants
    SET last_activity_at = NOW()
    WHERE id = p_participant_id;

    RETURN v_clamped_delta;
END;
$$;

REVOKE ALL ON FUNCTION public.heartbeat_case_timer(UUID, VARCHAR, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.heartbeat_case_timer(UUID, VARCHAR, INT) TO authenticated;

-- 6.6 log_cdss_followup
CREATE OR REPLACE FUNCTION public.log_cdss_followup(
    p_participant_id UUID,
    p_case_id VARCHAR(64),
    p_suggestion_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_case public.clinical_cases;
    v_item JSONB;
    v_prompt TEXT;
    v_response TEXT;
    v_event_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF p_suggestion_id NOT IN ('followup_1', 'followup_2') THEN
        RAISE EXCEPTION 'Invalid follow-up suggestion id.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    SELECT * INTO v_case
    FROM public.clinical_cases
    WHERE id = p_case_id
      AND stage = 'ai_simulation'
      AND is_published = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CDSS case % not found.', p_case_id;
    END IF;

    SELECT elem INTO v_item
    FROM jsonb_array_elements(COALESCE(v_case.ai_follow_up_suggestions, '[]'::jsonb)) elem
    WHERE elem->>'id' = p_suggestion_id
    LIMIT 1;

    IF v_item IS NOT NULL THEN
        v_prompt := COALESCE(v_item->>'promptLabel', p_suggestion_id);
        v_response := COALESCE(v_item->>'responseText', COALESCE(v_case.ai_clinical_reasoning, ''));
    ELSIF p_suggestion_id = 'followup_1' THEN
        v_prompt := 'Explain key diagnostic reasoning';
        v_response := COALESCE(v_case.ai_clinical_reasoning, '');
    ELSE
        v_prompt := 'Summarize immediate management plan';
        v_response := COALESCE(v_case.ai_recommendation, '');
    END IF;

    INSERT INTO public.followup_events (
        participant_id,
        case_id,
        suggestion_id,
        prompt_label,
        response_text,
        clicked_at
    )
    VALUES (
        p_participant_id,
        p_case_id,
        p_suggestion_id,
        v_prompt,
        v_response,
        NOW()
    )
    ON CONFLICT (participant_id, case_id, suggestion_id) DO UPDATE
    SET prompt_label = EXCLUDED.prompt_label
    RETURNING id INTO v_event_id;

    INSERT INTO public.research_events (
        participant_id,
        event_type,
        stage,
        case_id,
        payload,
        server_timestamp
    )
    VALUES (
        p_participant_id,
        'cdss_followup_clicked',
        5,
        p_case_id,
        jsonb_build_object('suggestion_id', p_suggestion_id),
        NOW()
    );

    UPDATE public.participants
    SET last_activity_at = NOW()
    WHERE id = p_participant_id;

    RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_cdss_followup(UUID, VARCHAR, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_cdss_followup(UUID, VARCHAR, TEXT) TO authenticated;

-- 6.7 submit_ai_interaction
CREATE OR REPLACE FUNCTION public.submit_ai_interaction(
    p_participant_id UUID,
    p_case_id VARCHAR(64),
    p_ai_agreement TEXT,
    p_final_diagnosis TEXT,
    p_switched_diagnosis BOOLEAN,
    p_reason_for_decision TEXT,
    p_final_confidence INT,
    p_will_verify BOOLEAN,
    p_verification_targets TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_participant public.participants;
    v_case public.clinical_cases;
    v_key public.clinical_case_answer_keys;
    v_timer public.case_session_timers;
    v_interaction_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_first TIMESTAMPTZ;
    v_last TIMESTAMPTZ;
    v_active INT;
    v_wall INT;
    v_matched_gold BOOLEAN;
    v_accepted_misleading BOOLEAN;
    v_switched_towards_correct BOOLEAN;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_participant
    FROM public.participants
    WHERE id = p_participant_id
      AND auth_user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    IF v_participant.questionnaire_completed_at IS NULL THEN
        RAISE EXCEPTION 'Study questionnaire must be submitted before CDSS cases.';
    END IF;

    SELECT * INTO v_case
    FROM public.clinical_cases
    WHERE id = p_case_id
      AND stage = 'ai_simulation'
      AND is_published = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Published CDSS case % not found.', p_case_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.ai_interactions
        WHERE participant_id = p_participant_id AND case_id = p_case_id
    ) THEN
        RAISE EXCEPTION 'CDSS case % has already been submitted and locked.', p_case_id;
    END IF;

    SELECT * INTO v_timer
    FROM public.case_session_timers
    WHERE participant_id = p_participant_id AND case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.case_session_timers (
            participant_id, case_id, stage, first_displayed_at, last_opened_at, last_heartbeat_at, active_seconds, open_count, submitted_at
        )
        VALUES (
            p_participant_id, p_case_id, 'ai_simulation', v_now, v_now, v_now, 0, 1, v_now
        )
        RETURNING * INTO v_timer;
    ELSE
        UPDATE public.case_session_timers
        SET submitted_at = COALESCE(submitted_at, v_now)
        WHERE id = v_timer.id
        RETURNING * INTO v_timer;
    END IF;

    v_first := v_timer.first_displayed_at;
    v_last := v_timer.last_opened_at;
    v_wall := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_now - v_first)))::INT);
    v_active := LEAST(v_timer.active_seconds, v_wall);

    INSERT INTO public.ai_interactions (
        participant_id,
        case_id,
        is_demo,
        ai_agreement,
        final_diagnosis,
        switched_diagnosis,
        reason_for_decision,
        final_confidence,
        will_verify,
        verification_targets,
        first_displayed_at,
        last_opened_at,
        submitted_at,
        active_seconds,
        wall_clock_seconds,
        completed_at
    )
    VALUES (
        p_participant_id,
        p_case_id,
        false,
        p_ai_agreement,
        BTRIM(p_final_diagnosis),
        COALESCE(p_switched_diagnosis, false),
        BTRIM(p_reason_for_decision),
        p_final_confidence,
        COALESCE(p_will_verify, false),
        BTRIM(p_verification_targets),
        v_first,
        v_last,
        v_now,
        v_active,
        v_wall,
        v_now
    )
    RETURNING id INTO v_interaction_id;

    -- Server-side analytical classification into isolated PI-only evaluation table
    SELECT * INTO v_key
    FROM public.clinical_case_answer_keys
    WHERE case_id = p_case_id;

    IF FOUND THEN
        v_matched_gold := (
            LOWER(BTRIM(p_final_diagnosis)) = LOWER(BTRIM(v_key.gold_standard_diagnosis))
            OR LOWER(BTRIM(p_final_diagnosis)) = ANY (
                SELECT LOWER(BTRIM(a)) FROM unnest(v_key.acceptable_alternatives) AS a
            )
        );
        v_accepted_misleading := (
            v_key.is_misleading = true
            AND (
                p_ai_agreement IN ('Completely agree', 'Partially agree')
                OR LOWER(BTRIM(p_final_diagnosis)) = LOWER(BTRIM(COALESCE(v_case.ai_diagnosis, '')))
            )
        );
        v_switched_towards_correct := (
            COALESCE(p_switched_diagnosis, false) = true
            AND v_key.is_misleading = false
            AND v_matched_gold = true
        );

        INSERT INTO public.ai_interaction_evaluations (
            ai_interaction_id,
            participant_id,
            case_id,
            is_misleading,
            matched_gold_standard,
            switched_towards_correct,
            accepted_misleading,
            evaluated_at
        )
        VALUES (
            v_interaction_id,
            p_participant_id,
            p_case_id,
            v_key.is_misleading,
            v_matched_gold,
            v_switched_towards_correct,
            v_accepted_misleading,
            v_now
        );
    END IF;

    UPDATE public.participants
    SET cdss_started_at = COALESCE(cdss_started_at, v_first),
        last_activity_at = v_now
    WHERE id = p_participant_id;

    INSERT INTO public.research_events (participant_id, event_type, stage, case_id, server_timestamp)
    VALUES (p_participant_id, 'cdss_submitted', 5, p_case_id, v_now);

    RETURN v_interaction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_ai_interaction(UUID, VARCHAR, TEXT, TEXT, BOOLEAN, TEXT, INT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_ai_interaction(UUID, VARCHAR, TEXT, TEXT, BOOLEAN, TEXT, INT, BOOLEAN, TEXT) TO authenticated;

-- 6.8 complete_cdss_stage
CREATE OR REPLACE FUNCTION public.complete_cdss_stage(p_participant_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_required_count INT;
    v_submitted_count INT;
    v_completed_at TIMESTAMPTZ := NOW();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    SELECT COUNT(*) INTO v_required_count
    FROM public.clinical_cases
    WHERE stage = 'ai_simulation' AND is_published = true;

    SELECT COUNT(DISTINCT ai.case_id) INTO v_submitted_count
    FROM public.ai_interactions ai
    JOIN public.clinical_cases cc ON cc.id = ai.case_id
    WHERE ai.participant_id = p_participant_id
      AND cc.stage = 'ai_simulation'
      AND cc.is_published = true;

    IF v_submitted_count < v_required_count THEN
        RAISE EXCEPTION 'All % CDSS cases must be submitted before proceeding (% of % completed).',
            v_required_count, v_submitted_count, v_required_count;
    END IF;

    UPDATE public.participants
    SET cdss_completed_at = COALESCE(cdss_completed_at, v_completed_at),
        current_stage = GREATEST(current_stage, 6),
        last_activity_at = v_completed_at
    WHERE id = p_participant_id
    RETURNING cdss_completed_at INTO v_completed_at;

    RETURN v_completed_at;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_cdss_stage(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_cdss_stage(UUID) TO authenticated;

-- 6.9 submit_vignette_answer
CREATE OR REPLACE FUNCTION public.submit_vignette_answer(
    p_participant_id UUID,
    p_case_id VARCHAR(64),
    p_most_likely_diagnosis TEXT,
    p_differential_1 TEXT,
    p_differential_2 TEXT,
    p_red_flags TEXT,
    p_next_step TEXT,
    p_confidence INT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_participant public.participants;
    v_timer public.case_session_timers;
    v_answer_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_first TIMESTAMPTZ;
    v_last TIMESTAMPTZ;
    v_active INT;
    v_wall INT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_participant
    FROM public.participants
    WHERE id = p_participant_id
      AND auth_user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    IF v_participant.cdss_completed_at IS NULL THEN
        RAISE EXCEPTION 'CDSS cases must be completed before submitting unaided vignette answers.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.clinical_cases
        WHERE id = p_case_id AND stage = 'post_ai' AND is_published = true
    ) THEN
        RAISE EXCEPTION 'Published vignette case % not found.', p_case_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.vignette_answers
        WHERE participant_id = p_participant_id AND case_id = p_case_id
    ) THEN
        RAISE EXCEPTION 'Vignette case % has already been submitted and locked.', p_case_id;
    END IF;

    SELECT * INTO v_timer
    FROM public.case_session_timers
    WHERE participant_id = p_participant_id AND case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.case_session_timers (
            participant_id, case_id, stage, first_displayed_at, last_opened_at, last_heartbeat_at, active_seconds, open_count, submitted_at
        )
        VALUES (
            p_participant_id, p_case_id, 'post_ai', v_now, v_now, v_now, 0, 1, v_now
        )
        RETURNING * INTO v_timer;
    ELSE
        UPDATE public.case_session_timers
        SET submitted_at = COALESCE(submitted_at, v_now)
        WHERE id = v_timer.id
        RETURNING * INTO v_timer;
    END IF;

    v_first := v_timer.first_displayed_at;
    v_last := v_timer.last_opened_at;
    v_wall := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (v_now - v_first)))::INT);
    v_active := LEAST(v_timer.active_seconds, v_wall);

    INSERT INTO public.vignette_answers (
        participant_id,
        case_id,
        stage,
        is_demo,
        most_likely_diagnosis,
        differential_1,
        differential_2,
        red_flags,
        next_step,
        confidence,
        first_displayed_at,
        last_opened_at,
        submitted_at,
        active_seconds,
        wall_clock_seconds,
        scoring_status
    )
    VALUES (
        p_participant_id,
        p_case_id,
        'post_ai',
        false,
        BTRIM(p_most_likely_diagnosis),
        BTRIM(p_differential_1),
        BTRIM(p_differential_2),
        BTRIM(p_red_flags),
        BTRIM(p_next_step),
        p_confidence,
        v_first,
        v_last,
        v_now,
        v_active,
        v_wall,
        'pending'
    )
    RETURNING id INTO v_answer_id;

    UPDATE public.participants
    SET vignettes_started_at = COALESCE(vignettes_started_at, v_first),
        last_activity_at = v_now
    WHERE id = p_participant_id;

    INSERT INTO public.research_events (participant_id, event_type, stage, case_id, server_timestamp)
    VALUES (p_participant_id, 'vignette_submitted', 6, p_case_id, v_now);

    RETURN v_answer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_vignette_answer(UUID, VARCHAR, TEXT, TEXT, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_vignette_answer(UUID, VARCHAR, TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO authenticated;

-- 6.10 complete_vignette_stage
CREATE OR REPLACE FUNCTION public.complete_vignette_stage(p_participant_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_required_count INT;
    v_submitted_count INT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    SELECT COUNT(*) INTO v_required_count
    FROM public.clinical_cases
    WHERE stage = 'post_ai' AND is_published = true;

    SELECT COUNT(DISTINCT va.case_id) INTO v_submitted_count
    FROM public.vignette_answers va
    JOIN public.clinical_cases cc ON cc.id = va.case_id
    WHERE va.participant_id = p_participant_id
      AND cc.stage = 'post_ai'
      AND cc.is_published = true;

    IF v_submitted_count < v_required_count THEN
        RAISE EXCEPTION 'All % unaided vignette cases must be submitted before completing the study (% of % completed).',
            v_required_count, v_submitted_count, v_required_count;
    END IF;

    UPDATE public.participants
    SET vignettes_completed_at = COALESCE(vignettes_completed_at, v_now),
        completed_at = COALESCE(completed_at, v_now),
        completed = true,
        completion_status = 'completed',
        current_stage = 7,
        last_activity_at = v_now
    WHERE id = p_participant_id
    RETURNING completed_at INTO v_now;

    INSERT INTO public.research_events (participant_id, event_type, stage, server_timestamp)
    VALUES (p_participant_id, 'study_completed', 7, v_now);

    RETURN v_now;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_vignette_stage(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_vignette_stage(UUID) TO authenticated;

-- 6.11 log_research_event
CREATE OR REPLACE FUNCTION public.log_research_event(
    p_participant_id UUID,
    p_event_type TEXT,
    p_stage INT DEFAULT NULL,
    p_case_id VARCHAR(64) DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_client_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_event_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.participants
        WHERE id = p_participant_id AND auth_user_id = v_uid
    ) THEN
        RAISE EXCEPTION 'Participant not found or unauthorized.';
    END IF;

    INSERT INTO public.research_events (
        participant_id,
        event_type,
        stage,
        case_id,
        payload,
        client_timestamp,
        server_timestamp
    )
    VALUES (
        p_participant_id,
        p_event_type,
        p_stage,
        p_case_id,
        COALESCE(p_payload, '{}'::jsonb),
        p_client_timestamp,
        NOW()
    )
    RETURNING id INTO v_event_id;

    UPDATE public.participants
    SET last_activity_at = NOW()
    WHERE id = p_participant_id;

    RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_research_event(UUID, TEXT, INT, VARCHAR, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_research_event(UUID, TEXT, INT, VARCHAR, JSONB, TIMESTAMPTZ) TO authenticated;

-- ==============================================================================
-- 7. TEAM, ASSESSOR & PI GOVERNANCE RPCs (Blinded Scoring & Scoped Researcher Access)
-- ==============================================================================

-- Operational participant view for researchers (excludes demographics & clinical answers)
CREATE OR REPLACE FUNCTION public.get_researcher_operational_participants()
RETURNS TABLE (
    participant_id UUID,
    code VARCHAR(32),
    recruitment_source TEXT,
    recruited_by UUID,
    researcher_code VARCHAR(32),
    current_stage INT,
    completion_status TEXT,
    completed BOOLEAN,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_member public.research_team_members;
BEGIN
    SELECT * INTO v_member
    FROM public.research_team_members
    WHERE auth_user_id = auth.uid() AND is_active = true
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Active research team membership required.';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.code,
        p.recruitment_source,
        p.recruited_by,
        p.researcher_code,
        p.current_stage,
        p.completion_status,
        p.completed,
        p.last_activity_at,
        p.created_at,
        p.completed_at
    FROM public.participants p
    WHERE v_member.role = 'pi'
       OR p.recruited_by = v_member.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_researcher_operational_participants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_researcher_operational_participants() TO authenticated;

-- Server-enforced Assessor Slot Scoring (Assessor 1 cannot overwrite Assessor 2 & vice versa)
CREATE OR REPLACE FUNCTION public.submit_assessor_score(
    p_vignette_answer_id UUID,
    p_primary_diagnosis_mark NUMERIC(3, 2),
    p_differentials_mark NUMERIC(3, 2),
    p_red_flags_mark NUMERIC(3, 2),
    p_next_step_mark NUMERIC(3, 2),
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_member public.research_team_members;
    v_existing public.assessor_scores;
    v_score_id UUID;
    v_new_total NUMERIC(4, 2);
    v_s1 NUMERIC(4, 2);
    v_s2 NUMERIC(4, 2);
    v_new_status TEXT;
    v_resolved NUMERIC(4, 2);
BEGIN
    SELECT * INTO v_member
    FROM public.research_team_members
    WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND role = 'assessor'
      AND assessor_slot IN (1, 2)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Only an active assigned Assessor (Slot 1 or 2) may submit vignette scores.';
    END IF;

    SELECT * INTO v_existing
    FROM public.assessor_scores
    WHERE vignette_answer_id = p_vignette_answer_id
      AND assessor_slot = v_member.assessor_slot
    FOR UPDATE;

    v_new_total := p_primary_diagnosis_mark + p_differentials_mark + p_red_flags_mark + p_next_step_mark;

    IF NOT FOUND THEN
        INSERT INTO public.assessor_scores (
            vignette_answer_id,
            assessor_id,
            assessor_slot,
            primary_diagnosis_mark,
            differentials_mark,
            red_flags_mark,
            next_step_mark,
            notes,
            scored_at,
            updated_at
        )
        VALUES (
            p_vignette_answer_id,
            v_member.id,
            v_member.assessor_slot,
            p_primary_diagnosis_mark,
            p_differentials_mark,
            p_red_flags_mark,
            p_next_step_mark,
            NULLIF(BTRIM(p_notes), ''),
            NOW(),
            NOW()
        )
        RETURNING id INTO v_score_id;
    ELSE
        UPDATE public.assessor_scores
        SET assessor_id = v_member.id,
            primary_diagnosis_mark = p_primary_diagnosis_mark,
            differentials_mark = p_differentials_mark,
            red_flags_mark = p_red_flags_mark,
            next_step_mark = p_next_step_mark,
            notes = NULLIF(BTRIM(p_notes), ''),
            updated_at = NOW()
        WHERE id = v_existing.id
        RETURNING id INTO v_score_id;
    END IF;

    INSERT INTO public.assessor_score_history (
        assessor_score_id,
        vignette_answer_id,
        assessor_id,
        assessor_slot,
        previous_total,
        new_total,
        notes,
        changed_at
    )
    VALUES (
        v_score_id,
        p_vignette_answer_id,
        v_member.id,
        v_member.assessor_slot,
        v_existing.total_score,
        v_new_total,
        NULLIF(BTRIM(p_notes), ''),
        NOW()
    );

    SELECT total_score INTO v_s1 FROM public.assessor_scores WHERE vignette_answer_id = p_vignette_answer_id AND assessor_slot = 1;
    SELECT total_score INTO v_s2 FROM public.assessor_scores WHERE vignette_answer_id = p_vignette_answer_id AND assessor_slot = 2;

    IF v_s1 IS NOT NULL AND v_s2 IS NOT NULL THEN
        v_new_status := 'dual_scored';
        v_resolved := ROUND((v_s1 + v_s2) / 2.0, 2);
    ELSE
        v_new_status := 'partial';
        v_resolved := COALESCE(v_s1, v_s2);
    END IF;

    UPDATE public.vignette_answers
    SET scoring_status = CASE WHEN scoring_status = 'adjudicated' THEN 'adjudicated' ELSE v_new_status END,
        final_resolved_score = CASE WHEN pi_adjudicated_score IS NOT NULL THEN pi_adjudicated_score ELSE v_resolved END
    WHERE id = p_vignette_answer_id;

    RETURN v_score_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_assessor_score(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_assessor_score(UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) TO authenticated;

-- PI-only adjudication RPC
CREATE OR REPLACE FUNCTION public.pi_adjudicate_vignette(
    p_vignette_answer_id UUID,
    p_adjudicated_score NUMERIC(4, 2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_active_pi() THEN
        RAISE EXCEPTION 'Principal Investigator role required.';
    END IF;

    UPDATE public.vignette_answers
    SET pi_adjudicated_score = p_adjudicated_score,
        final_resolved_score = p_adjudicated_score,
        scoring_status = 'adjudicated'
    WHERE id = p_vignette_answer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.pi_adjudicate_vignette(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pi_adjudicate_vignette(UUID, NUMERIC) TO authenticated;

-- ==============================================================================
-- 8. SEED ALL 11 FIXED CLINICAL CASES (5 CDSS + 6 UNAIDED VIGNETTES)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- sim-01: CDSS Case 1 (Cardiology — Deliberately Misleading)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions,
    is_published, expert_reviewed
) VALUES (
    'sim-01', 1, 'ai_simulation', 'Cardiology',
    $sql$Chest pain with an initially inconclusive ECG$sql$,
    $sql$A 64-year-old male with diabetes, chronic kidney disease and dyslipidaemia presents with epigastric discomfort, nausea and sweating for 5 hours. He denies typical chest pain.$sql$,
    $sql$Diabetes, chronic kidney disease and dyslipidaemia.$sql$,
    $sql${"heartRate":"110/min","bloodPressure":"104/68 mmHg","respiratoryRate":"26/min","spO2":"91%","temperature":"Not specified"}$sql$::jsonb,
    $sql$Bilateral basal crepitations.$sql$,
    $sql$[
      {"name":"Initial ECG","result":"ST depression in V1–V3; Tall R waves in V2–V3; Upright T waves in V1–V3","isAbnormal":true},
      {"name":"Initial troponin","result":"Borderline elevated","isAbnormal":true},
      {"name":"Repeat troponin after 2 hours","result":"Significant rise","isAbnormal":true},
      {"name":"Echocardiography","result":"Regional posterior wall hypokinesia and LVEF of 35%","isAbnormal":true}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-02","url":"/assets/cases/case-02-ecg.jpg","title":"12-Lead ECG (Case 2)","caption":"12-Lead ECG demonstrating ST depression in V1–V3, tall R waves in V2–V3, upright T waves in V1–V3, and mild ST elevation in II, III, aVF."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Acute True Posterior Wall STEMI (STEMI Equivalent) with Left Ventricular Dysfunction$sql$,
      $sql$Acute Peptic Ulcer Disease / Gastritis with CKD-Related Baseline Troponin Elevation$sql$,
      $sql$Stable Angina without Acute Coronary Occlusion$sql$,
      $sql$Acute Pancreatitis with Demand Ischemia$sql$,
      $sql$Other$sql$
    ],
    $sql$Acute Peptic Gastritis with Chronic Kidney Disease-Related Non-Ischemic Troponin Elevation.$sql$,
    $sql$Initiate intravenous pantoprazole 40 mg and antiemetic therapy (ondansetron 4 mg IV) for acute epigastric discomfort and nausea. Since the patient denies typical chest pain and the 12-lead ECG demonstrates only anterior ST-segment depression without classic ST-segment elevation, emergent cardiac catheterization is unnecessary. Mildly elevated cardiac troponin is an expected finding in chronic kidney disease due to impaired renal clearance. Admit to general medical ward for upper GI endoscopy evaluation and routine diuretic therapy for mild fluid overload.$sql$,
    $sql$Absence of classic substernal chest pain and lack of ST-segment elevation on standard precordial leads make acute transmural myocardial infarction unlikely. Epigastric symptoms paired with known CKD commonly produce false-positive baseline troponin elevations and non-specific repolarization changes.$sql$,
    $sql$[
      {"id":"followup_1","promptLabel":"How do you interpret the ECG and serial troponin rise?","responseText":"The ECG demonstrates ST depression in V1–V3 without ST-segment elevation in any standard lead, arguing against acute transmural infarction. In chronic kidney disease, impaired renal clearance frequently causes persistent or fluctuating borderline troponin elevations alongside non-specific repolarization changes, so a 2-hour rise alone does not confirm acute coronary occlusion."},
      {"id":"followup_2","promptLabel":"What monitoring and alternative workup do you advise?","responseText":"Monitor epigastric symptom relief following IV pantoprazole 40 mg and antiemetics, maintain supplemental oxygen for SpO₂ 91%, and administer low-dose loop diuretics for mild basal fluid overload. Proceed with elective upper GI endoscopy and routine outpatient cardiology follow-up rather than urgent cardiac catheterization."}
    ]$sql$::jsonb,
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number,
    stage = EXCLUDED.stage,
    domain = EXCLUDED.domain,
    title = EXCLUDED.title,
    presentation = EXCLUDED.presentation,
    medical_history = EXCLUDED.medical_history,
    vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination,
    investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images,
    mcq_options = EXCLUDED.mcq_options,
    ai_diagnosis = EXCLUDED.ai_diagnosis,
    ai_recommendation = EXCLUDED.ai_recommendation,
    ai_clinical_reasoning = EXCLUDED.ai_clinical_reasoning,
    ai_follow_up_suggestions = EXCLUDED.ai_follow_up_suggestions,
    is_published = EXCLUDED.is_published,
    expert_reviewed = EXCLUDED.expert_reviewed,
    updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading, misleading_classification, researcher_note
) VALUES (
    'sim-01',
    $sql$Acute True Posterior Wall STEMI (STEMI Equivalent) with Left Ventricular Dysfunction$sql$,
    ARRAY[$sql$Acute Posterior Myocardial Infarction$sql$, $sql$Posterior STEMI / NSTEMI with Acute Heart Failure$sql$],
    ARRAY[
      $sql$Acute inferior-posterior myocardial infarction / lateral ACS$sql$,
      $sql$Acute aortic dissection$sql$,
      $sql$Acute pancreatitis / peptic ulcer disease$sql$,
      $sql$Acute decompensated heart failure / stress cardiomyopathy$sql$
    ],
    ARRAY[
      $sql$Anterior ST depression V1–V3 with tall R waves and upright T waves (classic posterior STEMI equivalent)$sql$,
      $sql$Significant serial troponin rise with regional posterior wall hypokinesia and reduced LVEF (35%)$sql$,
      $sql$Hypoxemia (SpO2 91%), tachypnea (26/min), and bilateral basal crepitations indicating acute pulmonary congestion$sql$
    ],
    $sql$Obtain posterior ECG leads (V7–V9), initiate dual antiplatelet therapy (Aspirin + P2Y12 inhibitor) and anticoagulation, and activate urgent coronary angiography / primary PCI for suspected posterior STEMI equivalent, while managing pulmonary edema cautiously.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Acute Posterior Wall STEMI / STEMI equivalent (or acute MI with posterior wall involvement). 0.0 mark: Attributes findings to gastritis or benign CKD troponin leak.",
      "differentialCriteria":"1.0 mark: Identifies acute coronary syndrome / NSTEMI, aortic dissection, or acute abdominal catastrophe.",
      "redFlagsCriteria":"1.0 mark: Flags V1–V3 posterior STEMI pattern, serial troponin rise, LVEF 35% with basal crepitations, and SpO2 91%.",
      "nextStepCriteria":"1.0 mark: States urgent coronary angiography / primary PCI + dual antiplatelets + posterior leads V7–V9."
    }$sql$::jsonb,
    true, 'Diagnostic Anchoring',
    $sql$DELIBERATELY MISLEADING (Case 2): Anchors on atypical epigastric presentation, absence of standard ST-elevation, and CKD troponin confounder—ignoring V1–V3 posterior STEMI equivalent (ST depression + tall R waves + upright T waves), significant 2-hour troponin rise, posterior hypokinesia (LVEF 35%), and acute pulmonary congestion.$sql$
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis,
    acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys,
    red_flag_keys = EXCLUDED.red_flag_keys,
    next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric,
    is_misleading = EXCLUDED.is_misleading,
    misleading_classification = EXCLUDED.misleading_classification,
    researcher_note = EXCLUDED.researcher_note,
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- sim-02: CDSS Case 2 (Neurology — Deliberately Misleading)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions,
    is_published, expert_reviewed
) VALUES (
    'sim-02', 2, 'ai_simulation', 'Neurology',
    $sql$Acute hemiplegia with diagnostic and therapeutic uncertainty$sql$,
    $sql$A 71-year-old female is brought to the emergency department with sudden-onset left-sided weakness, facial deviation and inability to speak. She was last seen normal at 10 PM. She was found symptomatic at 6 AM.$sql$,
    $sql$Past history: Atrial fibrillation, hypertension, type 2 diabetes, chronic kidney disease. She is taking apixaban, but the family is unsure about the last dose. Additional information: The family subsequently confirms that the patient took apixaban approximately 10 hours before symptom discovery.$sql$,
    $sql${"heartRate":"116/min, irregularly irregular","bloodPressure":"198/112 mmHg","respiratoryRate":"Not specified","spO2":"Not specified","temperature":"Not specified"}$sql$::jsonb,
    $sql$GCS: 13/15. Left facial weakness. Left upper limb power: 0/5. Left lower limb power: 1/5. Left-sided neglect. Rightward gaze preference. NIHSS: 18.$sql$,
    $sql$[
      {"name":"Blood glucose","result":"58 mg/dL","isAbnormal":true},
      {"name":"After glucose correction","result":"132 mg/dL (Neurological deficits persist)","isAbnormal":true},
      {"name":"Non-contrast CT brain","result":"No intracranial haemorrhage","isAbnormal":false},
      {"name":"CT angiography","result":"Right middle cerebral artery M1 occlusion","isAbnormal":true},
      {"name":"CT perfusion","result":"Small infarct core with substantial surrounding potentially salvageable tissue","isAbnormal":true},
      {"name":"Creatinine","result":"1.9 mg/dL","isAbnormal":true}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-03","url":"/assets/cases/case-03-neuro-imaging.jpg","title":"Brain Imaging Panel A–F (Case 3)","caption":"CT brain, CT angiography, DWI, and cerebral angiography (A–F) corresponding to acute right middle cerebral artery M1 occlusion."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Acute Right MCA M1 Cardioembolic Ischaemic Stroke (Candidate for Mechanical Thrombectomy; Contraindicated for IV Thrombolysis)$sql$,
      $sql$Acute Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis (Alteplase / Tenecteplase)$sql$,
      $sql$Hypoglycaemic Hemiplegia / Post-Hypoglycaemic Todd Paralysis$sql$,
      $sql$Acute Spontaneous Intracerebral Haemorrhage$sql$,
      $sql$Other$sql$
    ],
    $sql$Acute Right Middle Cerebral Artery Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis.$sql$,
    $sql$Administer immediate intravenous Alteplase (0.9 mg/kg) or Tenecteplase (0.25 mg/kg) as non-contrast CT brain shows no intracranial haemorrhage and CT perfusion confirms salvageable penumbral tissue. Rapidly reduce blood pressure to below 140/85 mmHg using an intravenous nitroprusside or nicardipine infusion before bolus administration. Because the exact time of stroke onset could have been shortly before 6 AM, systemic fibrinolysis takes priority over awaiting endovascular thrombectomy suite preparation.$sql$,
    $sql$With absence of haemorrhage on NCCT and favourable perfusion mismatch, systemic IV thrombolysis achieves rapid recanalization. A single apixaban dose 10 hours prior in a patient without active bleeding can be overridden given high NIHSS (18) and large-vessel ischaemic burden.$sql$,
    $sql$[
      {"id":"followup_1","promptLabel":"Is IV thrombolysis safe given apixaban 10 hours ago?","responseText":"Non-contrast CT brain shows no intracranial haemorrhage, and CT perfusion demonstrates a small infarct core with substantial salvageable penumbra. Given the severe disabling deficit (NIHSS 18) and uncertain exact onset prior to 6 AM, systemic IV thrombolysis should not be withheld solely for a single reported apixaban dose ~10 hours prior."},
      {"id":"followup_2","promptLabel":"Why lower blood pressure below 140/85 mmHg?","responseText":"Rapidly reducing blood pressure below 140/85 mmHg with intravenous nicardipine or nitroprusside prior to thrombolytic bolus lowers peri-infarct reperfusion haemorrhage risk while maximizing systemic fibrinolytic safety."}
    ]$sql$::jsonb,
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    ai_diagnosis = EXCLUDED.ai_diagnosis, ai_recommendation = EXCLUDED.ai_recommendation,
    ai_clinical_reasoning = EXCLUDED.ai_clinical_reasoning, ai_follow_up_suggestions = EXCLUDED.ai_follow_up_suggestions,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading, misleading_classification, researcher_note
) VALUES (
    'sim-02',
    $sql$Acute Right MCA M1 Cardioembolic Ischaemic Stroke (Candidate for Mechanical Thrombectomy; Contraindicated for IV Thrombolysis)$sql$,
    ARRAY[
      $sql$Acute Right Middle Cerebral Artery Ischaemic Stroke (Wake-Up Stroke on Apixaban)$sql$,
      $sql$Large Vessel Occlusion Acute Ischaemic Stroke for Endovascular Thrombectomy$sql$
    ],
    ARRAY[
      $sql$Hypoglycaemic hemiplegia mimic (excluded by persistent deficit after normoglycemia)$sql$,
      $sql$Intracerebral haemorrhage (excluded on non-contrast CT)$sql$,
      $sql$Post-ictal Todd paresis$sql$,
      $sql$Central venous sinus thrombosis$sql$
    ],
    ARRAY[
      $sql$Active apixaban intake (~10 hours ago) — absolute/major contraindication to IV thrombolysis due to catastrophic haemorrhage risk$sql$,
      $sql$Severe large-vessel occlusion (Right M1, NIHSS 18) with wake-up onset (last seen normal 8+ hours prior)$sql$,
      $sql$Favourable CT perfusion mismatch (small core, large salvageable penumbra) requiring urgent endovascular thrombectomy$sql$
    ],
    $sql$Withhold IV thrombolysis due to recent apixaban anticoagulation (< 48h) and wake-up time window; activate neuro-interventional team immediately for emergent Endovascular Mechanical Thrombectomy (guided by CTA M1 occlusion and favourable CT perfusion), maintaining permissive hypertension (< 185/110 or < 180/105 per EVT protocol) without precipitous BP drop.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Acute Right MCA M1 ischaemic stroke with large salvageable penumbra and recognizes anticoagulation status.",
      "differentialCriteria":"1.0 mark: Notes hypoglycaemic mimic (ruled out), ICH (ruled out), or seizure/Todd paresis.",
      "redFlagsCriteria":"1.0 mark: Flags recent apixaban dose (~10h prior) contraindicating IV thrombolysis, NIHSS 18, and M1 occlusion.",
      "nextStepCriteria":"1.0 mark: Prioritizes emergent Mechanical Thrombectomy AND explicitly withholds/avoids IV thrombolysis."
    }$sql$::jsonb,
    true, 'Harmful Clinical Management',
    $sql$DELIBERATELY MISLEADING (Case 3): Recommends IV thrombolysis in a patient who took Apixaban ~10 hours prior (plus wake-up stroke last seen normal at 10 PM) and aggressive BP lowering to <140/85 mmHg—creating severe risk of fatal intracranial haemorrhage and watershed hypoperfusion instead of urgent mechanical thrombectomy.$sql$
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, misleading_classification = EXCLUDED.misleading_classification,
    researcher_note = EXCLUDED.researcher_note, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- sim-03: CDSS Case 3 (Pulmonology — Deliberately Misleading)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions,
    is_published, expert_reviewed
) VALUES (
    'sim-03', 3, 'ai_simulation', 'Pulmonology',
    $sql$Severe acute asthma with an unexpected deterioration$sql$,
    $sql$A 29-year-old female with longstanding bronchial asthma presents with severe breathlessness following an upper respiratory tract infection. She has been using her salbutamol inhaler every 20–30 minutes for the last 6 hours.$sql$,
    $sql$Longstanding bronchial asthma; recent upper respiratory tract infection; using salbutamol inhaler every 20–30 minutes for the last 6 hours. Additional information: After repeated nebulization, oxygen saturation improves to 94%, but tachypnoea persists. Wheezing has become less prominent.$sql$,
    $sql${"heartRate":"142/min","bloodPressure":"126/82 mmHg","respiratoryRate":"38/min","spO2":"88% on room air","temperature":"Not specified"}$sql$::jsonb,
    $sql$Unable to speak complete sentences. Accessory muscle use present. Initially widespread wheezing. Subsequently, very poor air entry bilaterally with minimal wheeze. Patient appears increasingly exhausted.$sql$,
    $sql$[
      {"name":"pH","result":"7.28","isAbnormal":true},
      {"name":"PaCO₂","result":"48 mmHg","isAbnormal":true},
      {"name":"PaO₂","result":"58 mmHg","isAbnormal":true},
      {"name":"HCO₃","result":"22 mEq/L","isAbnormal":false},
      {"name":"Lactate","result":"5.1 mmol/L","isAbnormal":true},
      {"name":"Potassium","result":"2.9 mEq/L","isAbnormal":true},
      {"name":"Chest X-ray","result":"Hyperinflation without obvious consolidation or pneumothorax","isAbnormal":true}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-05","url":"/assets/cases/case-05-cxr.jpg","title":"Chest X-ray — AP (a) and Lateral (b) (Case 5)","caption":"Figura 5 a, b. Crisis asmática: hiperinsuflación pulmonar y atelectasias bibasales. Rx de tórax AP (a) y lateral (b)."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Life-Threatening / Near-Fatal Acute Asthma Exacerbation with Silent Chest and Hypercapnic Respiratory Failure$sql$,
      $sql$Resolving Acute Asthma Exacerbation Responding Well to Bronchodilator Therapy$sql$,
      $sql$Acute Pneumothorax Secondary to Barotrauma$sql$,
      $sql$Panic-Induced Hyperventilation with Salbutamol-Induced Sinus Tachycardia$sql$,
      $sql$Other$sql$
    ],
    $sql$Resolving Acute Asthma Exacerbation with Expected Post-Bronchodilator Response.$sql$,
    $sql$Continue routine intermittent salbutamol nebulization every 4 hours and observe in the general emergency observation ward. The reduction in audible wheezing alongside improved pulse oximetry (SpO₂ 94%) confirms progressive relief of bronchospasm. A PaCO₂ of 48 mmHg reflects mild compensatory hypoventilation during recovery and does not warrant intensive care transfer or airway intervention. Repeat arterial blood gas in 4 hours and consider step-down to oral therapy once respiratory rate settles.$sql$,
    $sql$Improvement of SpO₂ from 88% to 94% with concurrent reduction of widespread expiratory wheezes indicates favourable bronchodilator responsiveness. Mildly elevated lactate (5.1 mmol/L) and borderline low potassium (2.9 mEq/L) are benign transient pharmacologic effects of frequent beta-2 agonist use.$sql$,
    $sql$[
      {"id":"followup_1","promptLabel":"Why are wheezing and PaCO₂ changing this way?","responseText":"Less prominent expiratory wheezing alongside improved SpO₂ (88% to 94%) indicates partial relief of bronchospasm after repeated nebulization. A PaCO₂ of 48 mmHg with pH 7.28 reflects mild transitional hypoventilation and respiratory muscle relaxation rather than acute deterioration."},
      {"id":"followup_2","promptLabel":"Are elevated lactate and K⁺ 2.9 mEq/L concerning?","responseText":"A serum lactate of 5.1 mmol/L and potassium of 2.9 mEq/L are expected, transient beta-2 adrenergic effects resulting from frequent salbutamol inhaler use over 6 hours. Continue 4-hourly nebulizations in the observation unit and repeat ABG in 4 hours."}
    ]$sql$::jsonb,
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    ai_diagnosis = EXCLUDED.ai_diagnosis, ai_recommendation = EXCLUDED.ai_recommendation,
    ai_clinical_reasoning = EXCLUDED.ai_clinical_reasoning, ai_follow_up_suggestions = EXCLUDED.ai_follow_up_suggestions,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading, misleading_classification, researcher_note
) VALUES (
    'sim-03',
    $sql$Life-Threatening / Near-Fatal Acute Asthma Exacerbation with Silent Chest and Hypercapnic Respiratory Failure$sql$,
    ARRAY[
      $sql$Near-Fatal Asthma / Status Asthmaticus with Type 2 Respiratory Failure$sql$,
      $sql$Life-Threatening Acute Severe Asthma with Impending Respiratory Arrest$sql$
    ],
    ARRAY[
      $sql$Tension or spontaneous pneumothorax (excluded on CXR)$sql$,
      $sql$Anaphylaxis / upper airway obstruction$sql$,
      $sql$Acute pulmonary embolism$sql$,
      $sql$Cardiogenic pulmonary edema$sql$
    ],
    ARRAY[
      $sql$Disappearing wheeze with poor bilateral air entry ("silent chest") + exhaustion = impending respiratory arrest$sql$,
      $sql$Hypercapnia (PaCO₂ 48 mmHg) and acidemia (pH 7.28) in an asthmatic who should normally have low PaCO₂$sql$,
      $sql$Elevated lactate (5.1 mmol/L) and hypokalemia (2.9 mEq/L) from excessive salbutamol + respiratory muscle fatigue$sql$
    ],
    $sql$Immediate ICU / resuscitation escalation and preparation for urgent endotracheal intubation & mechanical ventilation; administer high-flow oxygen, systemic IV corticosteroids (Hydrocortisone/Methylprednisolone), IV Magnesium Sulfate (2g IV), continuous nebulized bronchodilators + ipratropium, and cautious potassium replacement (2.9 mEq/L).$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Near-Fatal / Life-Threatening Asthma with silent chest and hypercapnia.",
      "differentialCriteria":"1.0 mark: Cites pneumothorax, anaphylaxis, vocal cord dysfunction, or pulmonary embolism.",
      "redFlagsCriteria":"1.0 mark: Flags silent chest (reduced wheeze = worsening obstruction/fatigue), PaCO₂ 48 with pH 7.28, exhaustion, and K+ 2.9 mEq/L.",
      "nextStepCriteria":"1.0 mark: States ICU escalation / airway intubation readiness + IV steroids + IV Magnesium Sulfate + K+ correction."
    }$sql$::jsonb,
    true, 'Investigation Inversion',
    $sql$DELIBERATELY MISLEADING (Case 5): Inverts ominous signs of a silent chest (disappearing wheeze + poor air entry + exhaustion + pH 7.28 / PaCO₂ 48 mmHg) as clinical recovery simply because SpO₂ improved to 94% on oxygen. Failing to prepare for intubation in near-fatal asthma is lethal.$sql$
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, misleading_classification = EXCLUDED.misleading_classification,
    researcher_note = EXCLUDED.researcher_note, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- sim-04: CDSS Case 4 (Endocrinology — Clinically Sound Control)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions,
    is_published, expert_reviewed
) VALUES (
    'sim-04', 4, 'ai_simulation', 'Endocrinology',
    $sql$Severe hyperglycaemia with altered sensorium, acute kidney injury and electrolyte abnormalities$sql$,
    $sql$A 76-year-old male, known to have type 2 diabetes for 20 years, is brought to the emergency department with altered sensorium, fever and progressive weakness for 3 days. He has been passing large volumes of urine initially, followed by markedly reduced urine output.$sql$,
    $sql$Poor glycaemic control. Chronic kidney disease. Hypertension. Recently treated urinary tract infection. Taking metformin and an SGLT2 inhibitor.$sql$,
    $sql${"heartRate":"128/min","bloodPressure":"86/54 mmHg","respiratoryRate":"28/min","spO2":"Not specified","temperature":"38.5°C"}$sql$::jsonb,
    $sql$GCS: 9/15. Severe dehydration. Dry mucosa. Deep breathing present. No obvious focal neurological deficit.$sql$,
    $sql$[
      {"name":"Blood glucose","result":"920 mg/dL","isAbnormal":true},
      {"name":"Sodium","result":"154 mEq/L","isAbnormal":true},
      {"name":"Potassium","result":"3.1 mEq/L","isAbnormal":true},
      {"name":"Bicarbonate","result":"17 mEq/L","isAbnormal":true},
      {"name":"pH","result":"7.29","isAbnormal":true},
      {"name":"Blood urea","result":"110 mg/dL","isAbnormal":true},
      {"name":"Creatinine","result":"3.4 mg/dL","isAbnormal":true},
      {"name":"Serum osmolality","result":"365 mOsm/kg","isAbnormal":true},
      {"name":"Beta-hydroxybutyrate","result":"2.5 mmol/L","isAbnormal":true},
      {"name":"Urine ketones","result":"1+","isAbnormal":true},
      {"name":"Urine microscopy","result":"Pyuria (Blood and urine cultures are pending)","isAbnormal":true}
    ]$sql$::jsonb,
    '[]'::jsonb,
    ARRAY[
      $sql$Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis-Induced Septic Shock and AKI$sql$,
      $sql$Pure Euglycaemic SGLT2-Inhibitor Diabetic Ketoacidosis without Hyperosmolarity$sql$,
      $sql$Metformin-Associated Lactic Acidosis Alone without Volume Depletion$sql$,
      $sql$Primary Hyponatremic Encephalopathy$sql$,
      $sql$Other$sql$
    ],
    $sql$Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis and Hypokalemia.$sql$,
    $sql$Begin immediate intravenous volume resuscitation with 0.9% Normal Saline (1,000 mL over the first hour) to restore intravascular volume and renal perfusion. Hold insulin initially and administer intravenous potassium chloride replacement immediately because serum potassium is 3.1 mEq/L (< 3.3 mEq/L); initiate low-dose IV regular insulin (0.05–0.1 units/kg/hr) only after potassium rises above 3.3–3.5 mEq/L. Draw blood/urine cultures and start empiric broad-spectrum IV antibiotics for urosepsis. Permanently discontinue metformin and the SGLT2 inhibitor.$sql$,
    $sql$A glucose of 920 mg/dL and serum osmolality of 365 mOsm/kg define severe HHS, accompanied by mild ketosis (BHB 2.5 mmol/L, pH 7.29, HCO₃ 17 mEq/L) and SGLT2i/sepsis overlap. Starting insulin when K⁺ is 3.1 mEq/L risks precipitous life-threatening hypokalemia and cardiac arrest; volume expansion and potassium correction take immediate precedence.$sql$,
    $sql$[
      {"id":"followup_1","promptLabel":"Why delay insulin until potassium is corrected?","responseText":"Serum potassium is 3.1 mEq/L (< 3.3 mEq/L). Administering insulin before potassium repletion drives extracellular potassium into cells, risking severe life-threatening hypokalaemia and fatal cardiac arrhythmias. Aggressive 0.9% Normal Saline resuscitation and IV potassium chloride replacement must come first."},
      {"id":"followup_2","promptLabel":"Which medications need stopping and what infection workup?","responseText":"Permanently stop metformin (high lactic acidosis risk in AKI with Cr 3.4 mg/dL) and the SGLT2 inhibitor (worsens ketosis and volume depletion). Given fever (38.5°C), hypotension (86/54 mmHg), and pyuria, obtain blood and urine cultures and start empiric broad-spectrum IV antibiotics immediately for urosepsis."}
    ]$sql$::jsonb,
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    ai_diagnosis = EXCLUDED.ai_diagnosis, ai_recommendation = EXCLUDED.ai_recommendation,
    ai_clinical_reasoning = EXCLUDED.ai_clinical_reasoning, ai_follow_up_suggestions = EXCLUDED.ai_follow_up_suggestions,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading, misleading_classification, researcher_note
) VALUES (
    'sim-04',
    $sql$Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis-Induced Septic Shock and AKI$sql$,
    ARRAY[
      $sql$Mixed HHS-DKA Crisis Precipitated by Urosepsis with Acute-on-Chronic Kidney Injury$sql$,
      $sql$Hyperosmolar Hyperglycaemic State with Septic Shock and Hypokalemia$sql$
    ],
    ARRAY[
      $sql$Mixed HHS / Diabetic Ketoacidosis (overlap syndrome)$sql$,
      $sql$Metformin-associated lactic acidosis (MALA) contributing to acidemia in AKI$sql$,
      $sql$Urosepsis with acute septic encephalopathy$sql$,
      $sql$Acute stroke / intracranial infection causing altered sensorium$sql$
    ],
    ARRAY[
      $sql$Severe hyperosmolarity (365 mOsm/kg) and extreme hyperglycemia (920 mg/dL) with GCS 9/15 and shock (BP 86/54)$sql$,
      $sql$Hypokalemia (K+ 3.1 mEq/L) — insulin MUST be delayed until potassium is repleted (>= 3.3–3.5 mEq/L) to prevent fatal arrhythmias$sql$,
      $sql$Ongoing metformin + SGLT2 inhibitor in AKI (Cr 3.4 mg/dL) with urosepsis (fever 38.5°C, pyuria)$sql$
    ],
    $sql$Immediate aggressive 0.9% Normal Saline resuscitation for hypovolemic/septic shock; repleting serum potassium FIRST (K+ 3.1 mEq/L) BEFORE initiating low-dose IV regular insulin infusion (0.05–0.1 U/kg/hr); administer empiric broad-spectrum IV antibiotics for urosepsis; and immediately discontinue metformin and SGLT2 inhibitor.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Hyperosmolar Hyperglycaemic State (HHS) with mixed/overlap ketoacidosis and urosepsis.",
      "differentialCriteria":"1.0 mark: Mentions MALA (metformin + AKI), pure DKA, septic encephalopathy, or stroke.",
      "redFlagsCriteria":"1.0 mark: Flags shock (86/54), hyperosmolarity (365), GCS 9, pyuria/sepsis, and hypokalemia (3.1 mEq/L) before insulin.",
      "nextStepCriteria":"1.0 mark: Prioritizes IV 0.9% Saline + potassium replacement BEFORE insulin + IV antibiotics for urosepsis."
    }$sql$::jsonb,
    false, NULL,
    $sql$CONTROL (Case 7): Clinically sound recommendation highlighting critical K+ < 3.3 mEq/L safeguard prior to insulin, isotonic fluid resuscitation, urosepsis coverage, and stopping metformin/SGLT2i.$sql$
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, misleading_classification = EXCLUDED.misleading_classification,
    researcher_note = EXCLUDED.researcher_note, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- sim-05: CDSS Case 5 (Nephrology — Clinically Sound Control)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    ai_diagnosis, ai_recommendation, ai_clinical_reasoning, ai_follow_up_suggestions,
    is_published, expert_reviewed
) VALUES (
    'sim-05', 5, 'ai_simulation', 'Nephrology',
    $sql$Acute gastroenteritis progressing to AKI, thrombocytopenia and neurological dysfunction$sql$,
    $sql$A 27-year-old male presents with watery diarrhoea for 5 days, followed by bloody diarrhoea for 2 days, vomiting and abdominal pain. During the last 24 hours, he has developed reduced urine output, increasing weakness and confusion. He reports consuming food from a roadside vendor approximately 1 week before symptom onset.$sql$,
    $sql$Consumed food from a roadside vendor approximately 1 week before symptom onset. Additional information released later: The patient develops a generalised seizure during observation.$sql$,
    $sql${"heartRate":"116/min","bloodPressure":"96/62 mmHg","respiratoryRate":"24/min","spO2":"Not specified","temperature":"38°C"}$sql$::jsonb,
    $sql$Pallor present. Mild pedal oedema. Petechial spots over both lower limbs. GCS: 13/15. Urine output: 0.2 mL/kg/hour.$sql$,
    $sql$[
      {"name":"Hb","result":"7.8 g/dL","isAbnormal":true},
      {"name":"TLC","result":"15,000/mm³","isAbnormal":true},
      {"name":"Platelets","result":"48,000/mm³","isAbnormal":true},
      {"name":"Creatinine","result":"4.6 mg/dL","isAbnormal":true},
      {"name":"Urea","result":"145 mg/dL","isAbnormal":true},
      {"name":"Potassium","result":"6.1 mEq/L","isAbnormal":true},
      {"name":"Sodium","result":"132 mEq/L","isAbnormal":true},
      {"name":"LDH","result":"1,450 U/L","isAbnormal":true},
      {"name":"Indirect bilirubin","result":"Elevated","isAbnormal":true},
      {"name":"Reticulocyte count","result":"Elevated","isAbnormal":true},
      {"name":"Peripheral blood smear","result":"Schistocytes present; Polychromasia; Fragmented red blood cells","isAbnormal":true},
      {"name":"Coagulation profile","result":"PT: Normal; aPTT: Normal; Fibrinogen: Normal","isAbnormal":false}
    ]$sql$::jsonb,
    '[]'::jsonb,
    ARRAY[
      $sql$Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with Severe AKI & CNS Involvement$sql$,
      $sql$Disseminated Intravascular Coagulation (DIC) Secondary to Gram-Negative Sepsis$sql$,
      $sql$Prerenal Acute Kidney Injury from Simple Dehydration$sql$,
      $sql$Immune Thrombocytopenic Purpura (ITP) with Coincidental Viral Gastroenteritis$sql$,
      $sql$Other$sql$
    ],
    $sql$Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with CNS Involvement and Severe AKI.$sql$,
    $sql$Manage acute generalised seizure with IV lorazepam and protect the airway. Immediately obtain a 12-lead ECG and treat hyperkalemia (K⁺ 6.1 mEq/L) with IV calcium gluconate (if conduction abnormalities) plus IV insulin-dextrose, and arrange urgent nephrology evaluation for haemodialysis given oliguria (0.2 mL/kg/hr) and creatinine 4.6 mg/dL. Send stool testing for Shiga toxin-producing E. coli and check ADAMTS13 activity to exclude TTP. Avoid routine platelet transfusions (which can worsen microvascular thrombosis) and avoid antimotility agents or empiric antibiotics for suspected STEC.$sql$,
    $sql$The triad of microangiopathic haemolytic anaemia (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L, elevated indirect bilirubin), thrombocytopenia (48,000/mm³), and severe acute kidney injury (Cr 4.6 mg/dL) following bloody diarrhoea establishes thrombotic microangiopathy (STEC-HUS). Normal PT, aPTT, and fibrinogen exclude consumptive coagulopathy (DIC). CNS involvement (seizure) indicates severe TMA requiring urgent supportive care and dialysis readiness.$sql$,
    $sql$[
      {"id":"followup_1","promptLabel":"How do you distinguish this from DIC or TTP?","responseText":"Normal PT, aPTT, and fibrinogen effectively rule out consumptive coagulopathy (DIC). The triad of MAHA (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L), thrombocytopenia (48,000/mm³), and oliguric AKI (Cr 4.6 mg/dL) after bloody diarrhoea points to STEC-HUS; check ADAMTS13 activity alongside stool Shiga toxin testing to exclude TTP."},
      {"id":"followup_2","promptLabel":"What urgent actions and contraindications apply?","responseText":"Stabilize the generalised seizure with IV lorazepam, obtain an ECG and urgently treat hyperkalaemia (K⁺ 6.1 mEq/L) with IV calcium gluconate plus insulin-dextrose, and arrange urgent nephrology haemodialysis. Avoid routine platelet transfusions, antimotility agents, and empiric antibiotics for suspected STEC."}
    ]$sql$::jsonb,
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    ai_diagnosis = EXCLUDED.ai_diagnosis, ai_recommendation = EXCLUDED.ai_recommendation,
    ai_clinical_reasoning = EXCLUDED.ai_clinical_reasoning, ai_follow_up_suggestions = EXCLUDED.ai_follow_up_suggestions,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading, misleading_classification, researcher_note
) VALUES (
    'sim-05',
    $sql$Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with Severe AKI & CNS Involvement$sql$,
    ARRAY[
      $sql$Haemolytic Uraemic Syndrome (HUS)$sql$,
      $sql$Thrombotic Microangiopathy (HUS / TTP Spectrum) Post-Bloody Diarrhoea$sql$
    ],
    ARRAY[
      $sql$Thrombotic thrombocytopenic purpura (TTP - check ADAMTS13 activity)$sql$,
      $sql$Disseminated intravascular coagulation (DIC - unlikely given normal PT/aPTT/fibrinogen)$sql$,
      $sql$Atypical HUS (complement-mediated TMA)$sql$,
      $sql$Severe sepsis with acute tubular necrosis$sql$
    ],
    ARRAY[
      $sql$Classic TMA triad: Microangiopathic haemolytic anaemia (schistocytes, LDH 1450), thrombocytopenia (48,000), and severe oliguric AKI (Cr 4.6)$sql$,
      $sql$Neurological deterioration (GCS 13/15 progressing to generalised seizure)$sql$,
      $sql$Hyperkalemia (K+ 6.1 mEq/L) with oliguria (0.2 mL/kg/hr) requiring urgent renal replacement readiness$sql$
    ],
    $sql$Stabilize airway and treat acute seizure (IV benzodiazepine); urgently treat hyperkalemia (ECG + IV Calcium Gluconate if ECG changes + insulin-dextrose); obtain urgent nephrology consultation for emergency haemodialysis; manage as TMA/STEC-HUS with supportive transfusion (PRBCs if symptomatic) while avoiding unnecessary platelet transfusions and routine antibiotics/antimotility agents; send stool Shiga toxin and ADAMTS13 level to exclude TTP.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Haemolytic Uraemic Syndrome (HUS / STEC-HUS) or Thrombotic Microangiopathy (TMA).",
      "differentialCriteria":"1.0 mark: Cites TTP, DIC (noting normal coagulation profile), atypical HUS, or sepsis-induced ATN.",
      "redFlagsCriteria":"1.0 mark: Flags schistocytes/MAHA, thrombocytopenia (48k), oliguric AKI (Cr 4.6) with K+ 6.1 mEq/L, and neurological progression (seizure).",
      "nextStepCriteria":"1.0 mark: Prioritizes seizure & hyperkalemia stabilization + emergency dialysis readiness + TMA workup (ADAMTS13/stool test) while avoiding routine platelet transfusion."
    }$sql$::jsonb,
    false, NULL,
    $sql$CONTROL (Case 10): Clinically sound recommendation capturing MAHA/TMA triad, normal coagulation excluding DIC, hyperkalemia/seizure stabilization, dialysis readiness, and avoiding platelet transfusion/STEC antibiotics.$sql$
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, misleading_classification = EXCLUDED.misleading_classification,
    researcher_note = EXCLUDED.researcher_note, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-01: Unaided Vignette Case 1 (Cardiology)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-01', 1, 'post_ai', 'Cardiology',
    $sql$Acute coronary syndrome with hemodynamic instability and diagnostic complexity$sql$,
    $sql$A 59-year-old male, known diabetic for 15 years and hypertensive for 10 years, presents to the emergency department with severe central chest pain for 3 hours. Pain radiates to the back and right shoulder and is associated with sweating, nausea, and two episodes of vomiting. His family reports that he had complained of unusual fatigue and exertional breathlessness for the preceding 2 weeks.$sql$,
    $sql$Known diabetic for 15 years and hypertensive for 10 years. Unusual fatigue and exertional breathlessness for the preceding 2 weeks.$sql$,
    $sql${"heartRate":"48/min, regular","bloodPressure":"82/56 mmHg","respiratoryRate":"24/min","spO2":"94% on room air","temperature":"Not specified"}$sql$::jsonb,
    $sql$JVP: Elevated. Extremities: Cold and clammy. CVS: S1 and S2 audible, no obvious murmur. Respiratory system: Bilateral lungs clear. Urine output: 15 mL/hour.$sql$,
    $sql$[
      {"name":"Hb","result":"12.8 g/dL","isAbnormal":false},
      {"name":"TLC","result":"13,800/mm³","isAbnormal":true},
      {"name":"Creatinine","result":"1.8 mg/dL","isAbnormal":true},
      {"name":"Potassium","result":"5.2 mEq/L","isAbnormal":true},
      {"name":"Troponin I","result":"Elevated","isAbnormal":true},
      {"name":"Lactate","result":"3.8 mmol/L","isAbnormal":true},
      {"name":"Blood glucose","result":"246 mg/dL","isAbnormal":true},
      {"name":"ECG","result":"ST elevation in leads II, III and aVF, with reciprocal changes in leads I and aVL, consistent with inferior STEMI","isAbnormal":true}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-01","url":"/assets/cases/case-01-ecg.jpg","title":"12-Lead ECG (Case 1)","caption":"ECG showing ST elevation in leads II, III and aVF, with reciprocal changes in leads I and aVL."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Acute Inferior Wall STEMI with Right Ventricular Myocardial Infarction (RVMI) and Cardiogenic Shock$sql$,
      $sql$Acute Aortic Dissection Involving the Ascending Aorta Alone$sql$,
      $sql$Acute Inferior Wall STEMI with Left Ventricular Failure and Flash Pulmonary Edema$sql$,
      $sql$Inferior Wall STEMI with Acute Mechanical Ventricular Septal Rupture$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-01',
    $sql$Acute Inferior Wall STEMI with Right Ventricular Myocardial Infarction (RVMI) and Cardiogenic Shock$sql$,
    ARRAY[
      $sql$Inferior STEMI with Right Ventricular Infarction and Cardiogenic Shock$sql$,
      $sql$Inferior Wall Myocardial Infarction with Right Ventricular Involvement (and exclude proximal RCA/aortic dissection)$sql$
    ],
    ARRAY[
      $sql$Acute aortic dissection (back radiation + inferior STEMI due to ostial RCA involvement)$sql$,
      $sql$Acute inferior STEMI with symptomatic sinus bradycardia / AV block contributing to shock$sql$,
      $sql$Acute pancreatitis or perforated peptic ulcer with demand ischaemia$sql$,
      $sql$Massive pulmonary embolism$sql$
    ],
    ARRAY[
      $sql$Cardiogenic shock (BP 82/56 mmHg, cold clammy extremities, lactate 3.8 mmol/L, urine output 15 mL/hour)$sql$,
      $sql$Elevated JVP with clear bilateral lungs + hypotension + bradycardia (48/min) in inferior STEMI (Right Ventricular Infarction physiology)$sql$,
      $sql$Back radiation raising need to exclude proximal aortic dissection before thrombolysis/anticoagulation; AKI (Cr 1.8) & hyperkalemia (5.2)$sql$
    ],
    $sql$Obtain right-sided ECG leads (V3R, V4R) immediately to confirm RV infarction and bedside echo/CTA if dissection suspected; administer cautious IV normal saline boluses for RV preload while STRICTLY AVOIDING nitrates and diuretics; give dual antiplatelet therapy and activate urgent Primary PCI; prepare IV atropine / temporary pacing if symptomatic bradycardia persists.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Inferior STEMI with Right Ventricular Infarction (RVMI) and cardiogenic shock (or inferior STEMI with aortic dissection exclusion).",
      "differentialCriteria":"1.0 mark: Mentions acute aortic dissection, symptomatic bradyarrhythmia/AV block, mechanical complication, or massive PE.",
      "redFlagsCriteria":"1.0 mark: Flags hypotension (82/56) with elevated JVP + clear lungs (RVMI), oliguria (15 mL/hr), lactate 3.8, bradycardia (48/min), and back radiation.",
      "nextStepCriteria":"1.0 mark: Specifies V3R/V4R leads, cautious IV fluids, strict avoidance of nitrates/diuretics, and urgent primary PCI (plus dissection check if suspected)."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-02: Unaided Vignette Case 2 (Neurology)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-02', 2, 'post_ai', 'Neurology',
    $sql$Hemiplegia with fever, altered sensorium and atypical imaging$sql$,
    $sql$A 42-year-old male presents with fever for 8 days, progressive headache, vomiting and altered behaviour. During the last 12 hours, he developed right-sided weakness and difficulty speaking.$sql$,
    $sql$No known hypertension or diabetes. Recent untreated dental infection. No history of trauma.$sql$,
    $sql${"heartRate":"112/min","bloodPressure":"110/70 mmHg","respiratoryRate":"Not specified","spO2":"Not specified","temperature":"39°C"}$sql$::jsonb,
    $sql$GCS: 11/15. Neck stiffness present. Right-sided hemiparesis. Bilateral papilloedema suspected.$sql$,
    $sql$[
      {"name":"TLC","result":"19,000/mm³","isAbnormal":true},
      {"name":"CRP","result":"Markedly elevated","isAbnormal":true},
      {"name":"CT brain","result":"Left frontal hypodense lesion with surrounding oedema and mass effect","isAbnormal":true},
      {"name":"CT brain (detailed & contrast imaging)","result":"Complex, multilocular hypodense left frontal lesion with surrounding marked vasogenic oedema, mass effect and midline shift to the right; contrast imaging shows prominent ring enhancement with an atypical shape","isAbnormal":true},
      {"name":"Blood cultures","result":"Pending","isAbnormal":false}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-04","url":"/assets/cases/case-04-ct-slices.jpg","title":"CT Brain Slices & IV Contrast Series (Case 4)","caption":"Serial non-contrast and contrast-enhanced CT brain slices demonstrating atypical left frontal lesion, surrounding vasogenic oedema, mass effect, and ring enhancement."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Pyogenic Brain Abscess (Left Frontal Lobe, Odontogenic Source) with Raised Intracranial Pressure$sql$,
      $sql$Acute Left Middle Cerebral Artery Ischaemic Stroke$sql$,
      $sql$Glioblastoma Multiforme (High-Grade Primary Brain Tumour)$sql$,
      $sql$Uncomplicated Acute Bacterial Meningitis Without Mass Effect$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-02',
    $sql$Pyogenic Brain Abscess (Left Frontal Lobe, Odontogenic Source) with Raised Intracranial Pressure$sql$,
    ARRAY[
      $sql$Left Frontal Pyogenic Cerebral Abscess$sql$,
      $sql$Odontogenic Brain Abscess with Mass Effect and Midline Shift$sql$
    ],
    ARRAY[
      $sql$High-grade glioma / glioblastoma (ring-enhancing lesion)$sql$,
      $sql$Tuberculoma / fungal brain abscess / toxoplasmosis$sql$,
      $sql$Subdural empyema or septic cerebral venous sinus thrombosis$sql$,
      $sql$Metastatic brain lesion or neurocysticercosis$sql$
    ],
    ARRAY[
      $sql$Raised intracranial pressure and impending herniation: GCS 11/15, vomiting, suspected bilateral papilloedema, marked vasogenic oedema, and midline shift to the right$sql$,
      $sql$Lumbar puncture is STRICTLY CONTRAINDICATED due to mass effect and midline shift$sql$,
      $sql$Fever (39°C) for 8 days + recent untreated dental infection + TLC 19,000/mm³ + markedly elevated CRP$sql$
    ],
    $sql$Urgent neurosurgical consultation for stereotactic aspiration/drainage; immediately initiate empiric broad-spectrum IV antibiotics covering oral streptococci, anaerobes, and staphylococci (e.g., Ceftriaxone + Metronidazole + Vancomycin); manage raised ICP (30° head elevation, IV Mannitol or hypertonic saline; steroids only if severe oedema threatening herniation); strictly AVOID lumbar puncture.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Pyogenic Brain Abscess (noting odontogenic source from dental infection).",
      "differentialCriteria":"1.0 mark: Mentions high-grade glioma/glioblastoma, tuberculoma/fungal abscess, subdural empyema, or toxoplasmosis.",
      "redFlagsCriteria":"1.0 mark: Flags mass effect/midline shift, suspected papilloedema, GCS 11/15, and strict contraindication to lumbar puncture.",
      "nextStepCriteria":"1.0 mark: Specifies urgent neurosurgical drainage/aspiration + empiric IV antibiotics (ceftriaxone + metronidazole + vancomycin) + ICP control + avoiding LP."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-03: Unaided Vignette Case 3 (Pulmonology)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-03', 3, 'post_ai', 'Pulmonology',
    $sql$Breathlessness in a patient labelled as bronchial asthma$sql$,
    $sql$A 35-year-old male with a previous diagnosis of bronchial asthma presents with sudden severe breathlessness and chest tightness. He has failed to improve after repeated bronchodilator treatment.$sql$,
    $sql$Previous diagnosis of bronchial asthma. Failed to improve after repeated bronchodilator treatment.$sql$,
    $sql${"heartRate":"136/min","bloodPressure":"92/60 mmHg","respiratoryRate":"34/min","spO2":"89%","temperature":"Not specified"}$sql$::jsonb,
    $sql$Markedly reduced air entry on the right side. Hyperresonance on right hemithorax. Trachea appears shifted to the left.$sql$,
    $sql$[
      {"name":"ABG","result":"Hypoxaemia and respiratory acidosis","isAbnormal":true}
    ]$sql$::jsonb,
    $sql$[
      {"id":"img-case-06","url":"/assets/cases/case-06-cxr.jpg","title":"Chest X-ray — Thorax AP (Case 6)","caption":"Anteroposterior chest radiographs corresponding to acute respiratory distress presentation."}
    ]$sql$::jsonb,
    ARRAY[
      $sql$Right-Sided Tension Pneumothorax (with Obstructive Shock and Respiratory Acidosis)$sql$,
      $sql$Life-Threatening Status Asthmaticus Unresponsive to Bronchodilators$sql$,
      $sql$Massive Right-Sided Pleural Effusion$sql$,
      $sql$Acute Massive Pulmonary Embolism$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-03',
    $sql$Right-Sided Tension Pneumothorax (with Obstructive Shock and Respiratory Acidosis)$sql$,
    ARRAY[
      $sql$Right Tension Pneumothorax$sql$,
      $sql$Secondary Spontaneous Tension Pneumothorax$sql$
    ],
    ARRAY[
      $sql$Simple spontaneous pneumothorax (less likely given hypotension and tracheal shift)$sql$,
      $sql$Near-fatal asthma exacerbation (clinical mimic — hyperresonance + shifted trachea confirm tension pneumothorax)$sql$,
      $sql$Giant bulla / bullous emphysema$sql$,
      $sql$Massive pulmonary embolism$sql$
    ],
    ARRAY[
      $sql$Trachea shifted to the left + hyperresonance on right hemithorax + markedly reduced right air entry = clinical diagnosis of Tension Pneumothorax$sql$,
      $sql$Obstructive shock (BP 92/60 mmHg, HR 136/min) with severe hypoxia (SpO₂ 89%) and respiratory acidosis$sql$,
      $sql$Emergency decompression MUST NOT be delayed for chest radiography$sql$
    ],
    $sql$Perform IMMEDIATE needle decompression / finger thoracostomy on the right chest (2nd intercostal space midclavicular line or 4th–5th intercostal space anterior/mid-axillary line) WITHOUT waiting for a chest X-ray, followed immediately by right-sided tube thoracostomy (intercostal chest drain) and high-flow oxygen.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Accurately identifies Right-Sided Tension Pneumothorax.",
      "differentialCriteria":"1.0 mark: Mentions simple pneumothorax, severe asthma exacerbation, giant bulla, or massive PE.",
      "redFlagsCriteria":"1.0 mark: Flags contralateral tracheal deviation, right hyperresonance, hypotension (92/60), and imperative not to delay for CXR.",
      "nextStepCriteria":"1.0 mark: Specifies immediate needle/finger thoracostomy decompression followed by intercostal chest tube insertion."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-04: Unaided Vignette Case 4 (Endocrinology)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-04', 4, 'post_ai', 'Endocrinology',
    $sql$Hypothyroidism presenting as a multisystem emergency$sql$,
    $sql$A 68-year-old female is brought by her relatives with progressive drowsiness, confusion, swelling of the face and generalised weakness for 5 days. She has a history of hypothyroidism but stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.$sql$,
    $sql$History of hypothyroidism; stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.$sql$,
    $sql${"heartRate":"42/min","bloodPressure":"82/48 mmHg","respiratoryRate":"9/min","spO2":"86% on room air","temperature":"33.5°C"}$sql$::jsonb,
    $sql$GCS: 8/15. Puffy face. Non-pitting oedema. Dry, coarse skin. Delayed relaxation of deep tendon reflexes. Reduced breath sounds at both lung bases.$sql$,
    $sql$[
      {"name":"TSH","result":"96 mIU/L","isAbnormal":true},
      {"name":"Free T4","result":"0.2 ng/dL","isAbnormal":true},
      {"name":"Sodium","result":"121 mEq/L","isAbnormal":true},
      {"name":"Potassium","result":"4.2 mEq/L","isAbnormal":false},
      {"name":"Glucose","result":"58 mg/dL","isAbnormal":true},
      {"name":"Creatinine","result":"1.8 mg/dL","isAbnormal":true},
      {"name":"PaCO₂","result":"68 mmHg","isAbnormal":true},
      {"name":"pH","result":"7.24","isAbnormal":true},
      {"name":"CK","result":"850 U/L","isAbnormal":true},
      {"name":"Chest X-ray","result":"Bilateral basal infiltrates and a small pleural effusion","isAbnormal":true},
      {"name":"ECG","result":"Sinus bradycardia and low-voltage complexes","isAbnormal":true}
    ]$sql$::jsonb,
    '[]'::jsonb,
    ARRAY[
      $sql$Myxoedema Coma Precipitated by Lower Respiratory Tract Infection / Pneumonia$sql$,
      $sql$Primary Septic Shock with Euthyroid Sick Syndrome$sql$,
      $sql$Syndrome of Inappropriate Antidiuretic Hormone Secretion (SIADH) Alone$sql$,
      $sql$Acute Pericardial Tamponade Without Endocrine Dysfunction$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-04',
    $sql$Myxoedema Coma Precipitated by Lower Respiratory Tract Infection / Pneumonia$sql$,
    ARRAY[
      $sql$Myxoedema Coma$sql$,
      $sql$Decompensated Severe Hypothyroidism (Myxoedema Crisis) with Respiratory Failure and Shock$sql$
    ],
    ARRAY[
      $sql$Severe sepsis / septic shock with hypothermia$sql$,
      $sql$Adrenal insufficiency / panhypopituitarism (must rule out concurrent adrenal crisis)$sql$,
      $sql$Sedative / opioid toxicity causing hypoventilation and coma$sql$,
      $sql$Severe hyponatremia from SIADH or heart failure$sql$
    ],
    ARRAY[
      $sql$Severe hypothermia (33.5°C), bradycardia (42/min), shock (82/48 mmHg), and GCS 8/15$sql$,
      $sql$Type 2 hypercapnic respiratory failure (RR 9/min, SpO₂ 86%, PaCO₂ 68 mmHg, pH 7.24) requiring urgent airway protection$sql$,
      $sql$Severe hyponatremia (Na⁺ 121 mEq/L) and hypoglycaemia (58 mg/dL); risk of adrenal crisis if thyroid hormone given without hydrocortisone$sql$
    ],
    $sql$Immediate endotracheal intubation and mechanical ventilation (GCS 8/15, PaCO₂ 68, pH 7.24); administer IV Hydrocortisone (100 mg IV loading dose) BEFORE or concurrently with IV Levothyroxine (200–400 mcg IV loading dose) to prevent adrenal crisis; correct hypoglycaemia (IV dextrose), start empiric IV antibiotics for pneumonia, passive external rewarming, and cautious fluids/vasopressors.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Myxoedema Coma (recognizing infection/pneumonia precipitant).",
      "differentialCriteria":"1.0 mark: Cites septic shock, adrenal insufficiency/panhypopituitarism, drug overdose, or SIADH.",
      "redFlagsCriteria":"1.0 mark: Flags hypothermia (33.5°C), hypercapnic respiratory failure (PaCO₂ 68, pH 7.24), GCS 8, shock (82/48), Na⁺ 121, and glucose 58.",
      "nextStepCriteria":"1.0 mark: Specifies airway intubation/ventilation + IV Hydrocortisone BEFORE/with IV Levothyroxine + dextrose + antibiotics + passive rewarming."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-05: Unaided Vignette Case 5 (Endocrinology / Cardiology)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-05', 5, 'post_ai', 'Endocrinology / Cardiology',
    $sql$Hyperthyroidism with cardiovascular collapse and multiorgan dysfunction$sql$,
    $sql$A 34-year-old female with a history of untreated hyperthyroidism presents to the emergency department with high-grade fever, severe agitation, vomiting, diarrhoea and palpitations for 2 days. She reports progressive weight loss over 6 months and admits to stopping her antithyroid medication 3 months ago.$sql$,
    $sql$Untreated hyperthyroidism; stopped antithyroid medication 3 months ago; progressive weight loss over 6 months. Additional information: The patient received an initial dose of beta-blocker at another healthcare facility, and her BP subsequently decreased to 76/48 mmHg.$sql$,
    $sql${"heartRate":"168/min, irregularly irregular","bloodPressure":"94/60 mmHg (dropped to 76/48 mmHg after beta-blocker)","respiratoryRate":"30/min","spO2":"93%","temperature":"40.2°C"}$sql$::jsonb,
    $sql$Diffuse goitre with bruit. Bilateral exophthalmos. Fine tremors. Jaundice. Bilateral basal crepitations. Agitated and disoriented behaviour.$sql$,
    $sql$[
      {"name":"TSH","result":"Less than 0.01 mIU/L","isAbnormal":true},
      {"name":"Free T4","result":"5.8 ng/dL","isAbnormal":true},
      {"name":"Free T3","result":"Elevated","isAbnormal":true},
      {"name":"Total bilirubin","result":"4.2 mg/dL","isAbnormal":true},
      {"name":"AST","result":"180 U/L","isAbnormal":true},
      {"name":"ALT","result":"145 U/L","isAbnormal":true},
      {"name":"Creatinine","result":"1.9 mg/dL","isAbnormal":true},
      {"name":"Lactate","result":"4.5 mmol/L","isAbnormal":true},
      {"name":"WBC","result":"18,000/mm³","isAbnormal":true},
      {"name":"ECG","result":"Atrial fibrillation with rapid ventricular response","isAbnormal":true},
      {"name":"Echocardiography","result":"Global hypokinesia with LVEF of 25%","isAbnormal":true}
    ]$sql$::jsonb,
    '[]'::jsonb,
    ARRAY[
      $sql$Thyroid Storm with Thyrotoxic Cardiomyopathy, Cardiogenic Shock (Beta-Blocker-Induced Collapse), and Multiorgan Dysfunction$sql$,
      $sql$Acute Ascending Cholangitis with Septic Shock and Stress Hyperthyroxinaemia$sql$,
      $sql$Phaeochromocytoma Crisis Without Thyroid Disease$sql$,
      $sql$Acute Viral Myocarditis with Benign Subclinical Hyperthyroidism$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-05',
    $sql$Thyroid Storm with Thyrotoxic Cardiomyopathy, Cardiogenic Shock (Beta-Blocker-Induced Collapse), and Multiorgan Dysfunction$sql$,
    ARRAY[
      $sql$Thyroid Storm Complicated by Cardiogenic Shock and Thyrotoxic Heart Failure$sql$,
      $sql$Thyrotoxic Crisis with Atrial Fibrillation, Severe LV Dysfunction (LVEF 25%), and Multiorgan Failure$sql$
    ],
    ARRAY[
      $sql$Severe sepsis / ascending cholangitis precipitating thyroid storm$sql$,
      $sql$Phaeochromocytoma crisis / sympathomimetic toxicity$sql$,
      $sql$Acute viral myocarditis / peripartum or dilated cardiomyopathy with AF$sql$,
      $sql$Neuroleptic malignant syndrome / malignant hyperthermia$sql$
    ],
    ARRAY[
      $sql$Fulminant Thyroid Storm (Temp 40.2°C, HR 168 AF, agitation/disorientation, jaundice, vomiting/diarrhoea)$sql$,
      $sql$Severe LV dysfunction (LVEF 25%) with pulmonary congestion and cardiogenic collapse (BP 76/48 mmHg) precipitated by beta-blocker administration$sql$,
      $sql$Multiorgan dysfunction: acute hepatic injury (bilirubin 4.2, AST 180, ALT 145), AKI (Cr 1.9), lactic acidosis (4.5 mmol/L)$sql$
    ],
    $sql$Immediate ICU hemodynamic support (vasopressors if needed, gentle fluid caution with basal crepitations) and WITHHOLD/AVOID further non-selective or long-acting beta-blockers given LVEF 25% and BP 76/48 mmHg; initiate sequential Thyroid Storm therapy: 1) Propylthiouracil (PTU) or Methimazole first, 2) Lugol iodine / SSKI >= 1 hour AFTER thionamide, 3) IV Hydrocortisone; active cooling, treat precipitating infection, and cautious digoxin/amiodarone or ICU-monitored ultra-short esmolol only if stabilized.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies Thyroid Storm with thyrotoxic cardiomyopathy / cardiogenic shock worsened by beta-blocker.",
      "differentialCriteria":"1.0 mark: Mentions sepsis/cholangitis, phaeochromocytoma crisis, acute myocarditis, or sympathomimetic toxicity.",
      "redFlagsCriteria":"1.0 mark: Flags LVEF 25% + beta-blocker collapse (BP 76/48), Temp 40.2°C, AF 168/min, jaundice/hepatic dysfunction, AKI, and lactate 4.5.",
      "nextStepCriteria":"1.0 mark: Explicitly avoids/stops beta-blockers in low-output shock + gives sequential PTU/methimazole -> iodine (delayed >=1h) -> IV hydrocortisone + shock/cooling care."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

-- ------------------------------------------------------------------------------
-- post-06: Unaided Vignette Case 6 (Nephrology / Critical Care)
-- ------------------------------------------------------------------------------
INSERT INTO public.clinical_cases (
    id, case_number, stage, domain, title, presentation, medical_history,
    vitals, physical_examination, investigations, clinical_images, mcq_options,
    is_published, expert_reviewed
) VALUES (
    'post-06', 6, 'post_ai', 'Nephrology / Critical Care',
    $sql$Severe dehydration with AKI and persistent shock despite fluid resuscitation$sql$,
    $sql$A 51-year-old male presents with profuse watery diarrhoea and repeated vomiting for 4 days. He is brought to the emergency department in a state of shock.$sql$,
    $sql$Profuse watery diarrhoea and repeated vomiting for 4 days. Absent urine output for 8 hours. After initial fluid resuscitation, BP improves to 94/60 mmHg, but urine output remains negligible. Six hours later: Creatinine 4.5 mg/dL, Potassium 5.8 mEq/L, persistent metabolic acidosis, and new pulmonary crackles.$sql$,
    $sql${"heartRate":"138/min","bloodPressure":"72/40 mmHg (94/60 mmHg post-fluids)","respiratoryRate":"32/min","spO2":"94%","temperature":"37.2°C"}$sql$::jsonb,
    $sql$Dry mucous membranes. Sunken eyes. Cold extremities. Absent urine output for 8 hours. Six hours post-resuscitation: New pulmonary crackles.$sql$,
    $sql$[
      {"name":"Hb","result":"16.8 g/dL","isAbnormal":true},
      {"name":"Creatinine","result":"3.8 mg/dL initially → 4.5 mg/dL at 6 hours","isAbnormal":true},
      {"name":"Urea","result":"128 mg/dL","isAbnormal":true},
      {"name":"Sodium","result":"158 mEq/L","isAbnormal":true},
      {"name":"Potassium","result":"2.7 mEq/L initially → 5.8 mEq/L at 6 hours","isAbnormal":true},
      {"name":"Chloride","result":"126 mEq/L","isAbnormal":true},
      {"name":"HCO₃","result":"11 mEq/L","isAbnormal":true},
      {"name":"Lactate","result":"6.0 mmol/L","isAbnormal":true}
    ]$sql$::jsonb,
    '[]'::jsonb,
    ARRAY[
      $sql$Severe Hypovolemic Shock Progressing to Intrinsic AKI (Ischaemic Acute Tubular Necrosis) with Fluid Overload, Refractory Acidosis and Hyperkalemia$sql$,
      $sql$Uncomplicated Prerenal Azotemia Requiring Continued Aggressive Crystalloid Boluses$sql$,
      $sql$Isolated Hyperosmolar Hyperglycaemic State Without Renal Parenchymal Injury$sql$,
      $sql$Acute Post-Renal Obstructive Uropathy Alone$sql$,
      $sql$Other$sql$
    ],
    true, true
)
ON CONFLICT (id) DO UPDATE SET
    case_number = EXCLUDED.case_number, stage = EXCLUDED.stage, domain = EXCLUDED.domain, title = EXCLUDED.title,
    presentation = EXCLUDED.presentation, medical_history = EXCLUDED.medical_history, vitals = EXCLUDED.vitals,
    physical_examination = EXCLUDED.physical_examination, investigations = EXCLUDED.investigations,
    clinical_images = EXCLUDED.clinical_images, mcq_options = EXCLUDED.mcq_options,
    is_published = EXCLUDED.is_published, expert_reviewed = EXCLUDED.expert_reviewed, updated_at = NOW();

INSERT INTO public.clinical_case_answer_keys (
    case_id, gold_standard_diagnosis, acceptable_alternatives, differential_keys,
    red_flag_keys, next_step_key, rubric, is_misleading
) VALUES (
    'post-06',
    $sql$Severe Hypovolemic Shock Progressing to Intrinsic AKI (Ischaemic Acute Tubular Necrosis) with Fluid Overload, Refractory Acidosis and Hyperkalemia$sql$,
    ARRAY[
      $sql$Ischaemic Acute Tubular Necrosis (ATN) with Dialysis-Requiring Oliguric AKI and Pulmonary Edema$sql$,
      $sql$Established Intrinsic Acute Kidney Injury Post-Hypovolemic Shock$sql$
    ],
    ARRAY[
      $sql$Septic shock / infectious gastroenteritis-associated AKI$sql$,
      $sql$Mixed normal anion gap (hyperchloremic diarrhoea) + high anion gap (lactic/uremic) metabolic acidosis$sql$,
      $sql$Bowel ischaemia / mesenteric hypoperfusion$sql$,
      $sql$Rhabdomyolysis or acute interstitial nephritis$sql$
    ],
    ARRAY[
      $sql$Progression from hypokalemia (2.7) and prerenal shock to established anuric/oliguric intrinsic AKI (Cr 3.8 → 4.5 mg/dL, rapid hyperkalemia K⁺ 5.8 mEq/L)$sql$,
      $sql$New pulmonary crackles after fluid resuscitation = acute fluid overload / pulmonary oedema (further IV fluid boluses are harmful)$sql$,
      $sql$Refractory severe metabolic acidosis (HCO₃ 11 mEq/L, lactate 6.0 mmol/L) and hypernatremia (158 mEq/L) with negligible urine output$sql$
    ],
    $sql$STOP further aggressive IV fluid boluses immediately due to new pulmonary crackles and persistent anuria; perform 12-lead ECG and acutely treat hyperkalemia (K⁺ 5.8 mEq/L; IV calcium gluconate if ECG changes, insulin-dextrose, inhaled beta-agonist); support oxygenation and blood pressure cautiously (vasopressor if needed rather than blind fluid overload); and arrange URGENT nephrology consultation for emergent Renal Replacement Therapy (Haemodialysis) for refractory oliguric AKI, acidosis, hyperkalemia, and fluid overload.$sql$,
    $sql${
      "primaryDiagnosisCriteria":"1.0 mark: Identifies progression from hypovolemic shock to intrinsic AKI / Ischaemic ATN with fluid overload, acidosis, and hyperkalemia.",
      "differentialCriteria":"1.0 mark: Mentions septic shock, mixed hyperchloremic + lactic acidosis, bowel ischaemia, or rhabdomyolysis.",
      "redFlagsCriteria":"1.0 mark: Flags new pulmonary crackles (fluid overload), persistent anuria, rising Cr (4.5) and K⁺ surge (2.7 → 5.8), and HCO₃ 11 / lactate 6.0.",
      "nextStepCriteria":"1.0 mark: Specifies stopping aggressive IV fluids + hyperkalemia ECG/stabilization + urgent haemodialysis / renal replacement therapy."
    }$sql$::jsonb,
    false
)
ON CONFLICT (case_id) DO UPDATE SET
    gold_standard_diagnosis = EXCLUDED.gold_standard_diagnosis, acceptable_alternatives = EXCLUDED.acceptable_alternatives,
    differential_keys = EXCLUDED.differential_keys, red_flag_keys = EXCLUDED.red_flag_keys, next_step_key = EXCLUDED.next_step_key,
    rubric = EXCLUDED.rubric, is_misleading = EXCLUDED.is_misleading, updated_at = NOW();

COMMIT;
