# Clinical AI Reasoning Lab: Research Simulation Platform (Revised Specification)

An academic research platform for investigating artificial intelligence usage, automation bias, cognitive offloading, and independent clinical reasoning before and after AI exposure among medical professionals. Designed for presentation to medical college professors, research supervisors, and Institutional Ethics Committees (IEC / IRB).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The implementation plan has been thoroughly updated with the following critical protocol requirements:
> 1. **Exact 8-Stage Sequential Workflow**:
>    `Welcome & Info` ─> `Informed Consent` ─> `Anonymous ID Gen` ─> `Research Questionnaire (A-D)` ─> `Baseline Unaided Cases (1-5)` ─> `Standardized AI Clinical Simulation (1-5)` ─> `Post-AI Unaided Cases (1-5)` ─> `Ethical Debriefing & Completion`.
> 2. **Hybrid MCQ + Written Clinical Reasoning & Dual-Assessor Rubrics**:
>    For both baseline and post-AI cases, participants submit: (a) Most likely diagnosis via MCQ + Other, (b) Two differential diagnoses (written text), (c) Important red flags (written text), (d) Most appropriate next step (written text), and (e) Confidence (1–5). Scoring is 0–4 per case (total 0–20). No automated LLM grading; provides a researcher manual scoring interface supporting **two independent assessors (Assessor 1 & Assessor 2)** with inter-rater reliability metrics (percent agreement, Cohen's Kappa / ICC).
> 3. **Strict Initial Diagnostic Lock in AI Simulation**:
>    In the 5 AI simulation cases, participants commit initial diagnosis, clinical justification, and confidence (1–5). These are **permanently locked and stored**. Only then is the fixed AI recommendation displayed. Final diagnosis, reasons for agreement/disagreement, final confidence, and verification targets are recorded as distinct fields without overwriting initial responses.
> 4. **Strict Isolation: Synthetic Demo Mode vs Genuine Research Mode**:
>    Two completely partitioned databases/stores:
>    - **DEMO MODE**: 40 seeded fictional clinicians, prominently labeled "SYNTHETIC DEMO DATA", with cohort reset and reload tools. Excluded from real research exports.
>    - **RESEARCH MODE**: Clean, live study environment with zero pre-populated records, anonymous participant generation, and secure research exports.
> 5. **Primary & Secondary Outcome Analytics**:
>    Clear statistical definition of Primary Outcome (misleading recommendation acceptance rate 0–3) and Secondary Outcomes (sound recommendation acceptance 0–2, diagnostic switching rate, unverified misleading acceptance, baseline vs post-AI score deltas, cognitive offloading index, and perceived deskilling risk).

---

## 1. Overview & Core Concept

- **What It Does**: A standardized, controlled simulation platform for studying human-AI interaction in clinical medicine. It tests whether doctors succumb to automation bias when presented with plausibly incorrect AI advice, measures whether AI exposure degrades or alters subsequent independent diagnostic problem-solving, and surveys cognitive offloading habits.
- **Target Audience / Stakeholders**: Medical college professors, postgraduate residents, senior residents, medical officers, academic clinicians, and ethics review boards.
- **Controlled Research Paradigm**:
  - Exactly **15 standardized clinical vignettes** across generalist medical domains (5 Baseline, 5 AI Simulation, 5 Post-AI Independent).
  - Exactly **5 fixed AI stimuli** (2 clinically sound, 3 deliberately misleading).
  - No live LLM API calls during participant evaluation; guarantees 100% test-retest reproducibility across all study subjects.
  - Ethical debriefing disclosing the use of intentional experimental inaccuracies and study rationale.

---

## 2. User Experience & Visual Design

### Exact Participant Sequence

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              PARTICIPANT WORKFLOW (STAGE 1-8)                          │
│                                                                                        │
│  [1. Welcome & Info] ────────> [2. Informed Consent] ────────> [3. Anonymous ID Gen]   │
│   · Study overview              · Ethical consent terms         · Auto-gen ID (e.g.    │
│   · Academic credentials        · Voluntary participation         DOC-7842)            │
│   · Non-clinical disclaimer    · No patient data warning       · Profile: designation, │
│                                                                  specialty, experience │
│                                                                        │               │
│                                                                        ▼               │
│  [5. Baseline Unaided Cases] <───────────────────────────── [4. Research Survey]       │
│   · 5 standardized cases        (Default: Enabled)              · Sec A: Demographics  │
│   · MCQ + Other for primary Dx  · Protocol toggle in settings   · Sec B: AI Usage      │
│   · Written Ddx, red flags,     · Measures pre-exposure         · Sec C: Offloading    │
│     next management step          reasoning (0-20 marks)        · Sec D: Deskilling    │
│   · Confidence 1-5                                                     │               │
│                                                                        │               │
│                                                                        ▼               │
│  [6. Standardized AI Simulation (5 Cases)]                                             │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│   │ Case Vignette & Investigations                                                   │ │
│   │   ├── Step 1: Commit Initial Dx (MCQ+Other) + Written Justification + Conf (1-5) │ │
│   │   ├── Step 2: PERMANENT COMMIT & LOCK (Uneditable)                               │ │
│   │   ├── Step 3: Reveal Fixed Standardized AI Stimulus (Tone-neutral, 2 OK, 3 Mis)  │ │
│   │   └── Step 4: Record Agreement, Final Dx, Reason, Final Conf, Verification Plan  │ │
│   └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                        │               │
│                                                                        ▼               │
│  [7. Post-AI Unaided Cases] ───────────────────────────────> [8. Ethical Debriefing]   │
│   · 5 fresh cases (0-20 marks)                                  · Deception disclosure │
│   · Independent clinical reasoning without AI                   · Educational rationale│
│   · Identical rubric structure (Primary, Ddx, Red Flags, Next)  · Protocol notice      │
│   · Measures cognitive carryover / post-exposure reasoning      · Session completion   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Visual Identity & Theme
- **Aesthetic Direction**: Academic Clinical Rigor. Crisp white and soft lab slate backgrounds, deep navy typography, and emerald green primary accents.
- **Color Budget & Tone**:
  - Primary Background: `#FFFFFF` and `#F8FAFC`
  - Structural Borders: Hairline `#E2E8F0`
  - Typography: `#0F172A` (Navy slate for headings) and `#334155` (Muted slate for clinical history)
  - Primary Accent: `#059669` (Emerald for verified participant actions)
  - AI Components: Neutral Slate/Blue `#2563EB` with subtle `#F0FDF4` / `#EFF6FF` container shading.
  - **No participant-facing correctness indicators**: No green checkmarks or red warning banners are ever shown to participants during the AI simulation.
  - **Misleading Flag (#E11D48)**: Confined exclusively to the private Researcher Dashboard and Case Editor.
- **Zero-Pill & Tabular Discipline**:
  - Unboxed metadata with typographic separators (`·`).
  - Strict tabular numbers (`font-mono tabular-nums`) for vitals, laboratory values, scores, and timestamps.
  - No code-comment headers (`//`), no decorative pulsing dots, and no floating badges.

---

## 3. Standardized Clinical Cases & Stimuli Inventory

### Baseline Unaided Assessment (5 Cases, 20 Marks Total)
1. **Case B1 (Cardiology)**: Acute Coronary Syndrome (NSTEMI in elderly diabetic).
2. **Case B2 (Respiratory)**: Acute Exacerbation of COPD with hypercapnic respiratory failure.
3. **Case B3 (Obstetrics)**: Preeclampsia with severe features at 34 weeks gestation.
4. **Case B4 (Neurology)**: Acute Middle Cerebral Artery ischemic stroke within thrombolysis window.
5. **Case B5 (Nephrology)**: Drug-induced Acute Interstitial Nephritis secondary to NSAIDs/antibiotics.

### AI Simulation Assessment (5 Cases, Predefined Fixed Stimuli)
1. **Case S1 (Cardiology - Anterior STEMI)**:
   - *AI Stimulus*: **CLINICALLY APPROPRIATE**. Correctly identifies acute anterior myocardial infarction and advises urgent primary PCI and antiplatelet load.
2. **Case S2 (Metabolic - Diabetic Ketoacidosis)**:
   - *AI Stimulus*: **CLINICALLY APPROPRIATE**. Accurately interprets high anion gap metabolic acidosis, hyperglycemia, and ketonuria; recommends fluid resuscitation, IV insulin, and potassium replacement.
3. **Case S3 (Emergency - Massive Pulmonary Embolism with Anchoring)**:
   - *AI Stimulus*: **DELIBERATELY MISLEADING (Diagnostic Anchoring)**. Attributes acute dyspnea, tachycardia, and right heart strain on ECG to "Musculoskeletal thoracic pain with anxiety hyperventilation", recommending oral analgesics and discharge.
4. **Case S4 (Endocrinology - Adrenal Crisis / Lab Interpretation Inversion)**:
   - *AI Stimulus*: **DELIBERATELY MISLEADING (Investigation Misinterpretation)**. Inverts critical laboratory values, misidentifying acute hypocortisolemia/hyponatremia as "Syndrome of Inappropriate ADH (SIADH)" and inappropriately recommending fluid restriction instead of urgent hydrocortisone.
5. **Case S5 (Infectious Disease - Acute Bacterial Meningitis with Contraindication)**:
   - *AI Stimulus*: **DELIBERATELY MISLEADING (Harmful Clinical Management)**. Advises immediate lumbar puncture in a comatose patient with papilledema and focal neurological deficits *before* urgent neuroimaging and empiric antibiotics, introducing lethal risk of cerebral herniation.

### Post-AI Unaided Assessment (5 Fresh Cases, 20 Marks Total)
1. **Case P1 (Cardiology)**: Unstable Ventricular Tachycardia requiring synchronized cardioversion.
2. **Case P2 (Respiratory)**: Acute Respiratory Distress Syndrome (ARDS) secondary to severe pneumonia.
3. **Case P3 (Obstetrics)**: Eclamptic seizure management with Magnesium Sulfate and emergent delivery.
4. **Case P4 (Neurology)**: Aneurysmal Subarachnoid Hemorrhage with sudden thunderclap headache.
5. **Case P5 (Nephrology)**: Severe Hyperkalemia with peaked T waves requiring urgent cardiac membrane stabilization with calcium gluconate.

---

## 4. Scoring, Assessor Interface & Statistical Framework

### Standardized Rubric per Case (0–4 Marks)
- **Primary Diagnosis (0–1 mark)**: Exact match with gold standard (1.0) or clinically equivalent acceptable variant (0.5–1.0).
- **Differential Diagnoses (0–1 mark)**: Identification of two plausible, competing high-priority differentials (0.5 mark each).
- **Red Flags Recognition (0–1 mark)**: Explicit identification of critical clinical danger signs, hemodynamic instability, or contraindications (1.0).
- **Next Appropriate Step (0–1 mark)**: Correct immediate investigation, medication, or resuscitation maneuver (1.0).
- **Researcher Manual Scoring Tool**: Human assessors review participant responses side-by-side with the gold-standard answer key.
- **Dual Assessor Support**: Allows scoring by **Assessor 1** and **Assessor 2**, computing inter-rater reliability (Percent Agreement, Cohen's Kappa, and Intraclass Correlation Coefficient).

### Research Outcome Definitions
- **Primary Outcome**:
  - Acceptance rate of misleading AI recommendations (Count 0–3, Percentage 0–100%).
- **Secondary Outcomes**:
  - Acceptance rate of sound AI recommendations (Count 0–2).
  - Diagnostic switching rate: proportion of cases where final diagnosis differed from initial diagnosis (stratified into *Switch toward correct* vs *Switch away from correct*).
  - Unverified misleading acceptance: proportion of misleading AI advice accepted with `willVerify = false`.
  - Confidence change ($\Delta \text{Confidence} = \text{Final} - \text{Initial}$).
  - Baseline score ($0–20$) vs Post-AI score ($0–20$) and score change ($\Delta \text{Score}$).
  - Cognitive Offloading Index (Mean score across 7 items, 1–5).
  - Perceived Deskilling Risk Index (Mean score across 6 items, 1–5).

---

## 5. Technical Architecture & Environment Partitioning

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 APP RUNTIME ARCHITECTURE                                 │
│                                                                                          │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────────────────────┐  │
│  │   Top Navigation Bar  │  │ App Mode Controller                                     │  │
│  │   · Study Branding    │  │ · [DEMO MODE (40 Doctors)]  vs  [GENUINE RESEARCH MODE] │  │
│  │   · Participant Flow  │  │ · Role Switcher (Passcode: LAB2026)                      │  │
│  │   · Researcher Portal │  │ · Protocol Config (Baseline Assessment on/off)          │  │
│  └───────────────────────┘  └─────────────────────────────────────────────────────────┘  │
│                                           │                                              │
│          ┌────────────────────────────────┴─────────────────────────────────┐            │
│          ▼                                                                  ▼            │
│  ┌───────────────────────────────┐                  ┌─────────────────────────────────┐  │
│  │ Participant Journey           │                  │ Researcher Command Center       │  │
│  │ · Stage 1: Welcome & Info     │                  │ · Executive Summary & KPI Cards │  │
│  │ · Stage 2: Informed Consent   │                  │ · Automation Bias Analytics     │  │
│  │ · Stage 3: Anonymous ID Gen   │                  │ · Paired Score Boxplots/Bars    │  │
│  │ · Stage 4: Questionnaire      │                  │ · Dual Assessor Scoring Console │  │
│  │ · Stage 5: Baseline Cases (5) │                  │ · Inter-Rater Reliability (ICC) │  │
│  │ · Stage 6: AI Sim (Locked Dx) │                  │ · Case Vignette & Rubric Editor │  │
│  │ · Stage 7: Post-AI Cases (5)  │                  │ · Multi-Table SPSS CSV Exporter │  │
│  │ · Stage 8: Ethical Debriefing │                  │ · Python FastAPI / SQL Viewer   │  │
│  └───────────────────────────────┘                  └─────────────────────────────────┘  │
│                                           │                                              │
│                                           ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Persistent Store (Dual Partition: Demo State vs Research State)                    │  │
│  │ · Strict separation: demo records never contaminate research exports               │  │
│  │ · Real-time export generator with automated SPSS syntax / variable codebook        │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Verification Checklist & Success Criteria

1. **Workflow Verification**: Participant journey transitions strictly through Steps 1–8 in order.
2. **Initial Lock Verification**: In Stage 6, initial diagnosis and confidence are permanently locked before the AI stimulus is visible; editing initial answers is blocked.
3. **Fixed Stimuli Verification**: All 5 AI recommendations are static, standardized text; no external AI API is queried during testing.
4. **Data Isolation Verification**: Demo mode records are flagged with `is_demo = true` and kept in a dedicated partition; research exports exclude demo data by default.
5. **Scoring & Rubrics**: Manual scoring interface allows Assessor 1 and Assessor 2 to assign 0–1 marks across the 4 clinical reasoning criteria, calculating total scores out of 20 and inter-rater agreement.
6. **Data Export & SPSS Readiness**: Downloads complete relational CSV tables (participants, questionnaire, AI interactions, baseline answers, post-AI answers) alongside a structured SPSS variable codebook.
7. **Production Code Availability**: Complete FastAPI backend (`main.py`, `models.py`, `schemas.py`) and Supabase PostgreSQL migration script (`schema.sql`) accessible via the Researcher Dashboard.
