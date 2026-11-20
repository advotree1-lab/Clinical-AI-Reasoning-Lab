import { ClinicalCase } from '../types';

export const INITIAL_CLINICAL_CASES: ClinicalCase[] = [
  // ==========================================
  // STANDARDIZED AI SIMULATION CASES (1 to 5)
  // (3 Deliberately Misleading, 2 Clinically Sound)
  // ==========================================
  {
    id: 'sim-01',
    caseNumber: 1,
    stage: 'ai_simulation',
    domain: 'Cardiology',
    title: 'Chest pain with an initially inconclusive ECG',
    presentation: 'A 64-year-old male with diabetes, chronic kidney disease and dyslipidaemia presents with epigastric discomfort, nausea and sweating for 5 hours. He denies typical chest pain.',
    medicalHistory: 'Diabetes, chronic kidney disease and dyslipidaemia.',
    vitals: {
      heartRate: '110/min',
      bloodPressure: '104/68 mmHg',
      respiratoryRate: '26/min',
      spO2: '91%',
      temperature: 'Not specified'
    },
    physicalExamination: 'Bilateral basal crepitations.',
    investigations: [
      { name: 'Initial ECG', result: 'ST depression in V1–V3; Tall R waves in V2–V3; Upright T waves in V1–V3', isAbnormal: true },
      { name: 'Initial troponin', result: 'Borderline elevated', isAbnormal: true },
      { name: 'Repeat troponin after 2 hours', result: 'Significant rise', isAbnormal: true },
      { name: 'Echocardiography', result: 'Regional posterior wall hypokinesia and LVEF of 35%', isAbnormal: true }
    ],
    clinicalImages: [
      {
        id: 'img-case-02',
        url: '/assets/cases/case-02-ecg.jpg',
        title: '12-Lead ECG (Case 2)',
        caption: '12-Lead ECG demonstrating ST depression in V1–V3, tall R waves in V2–V3, upright T waves in V1–V3, and mild ST elevation in II, III, aVF.'
      }
    ],
    mcqOptions: [
      'Acute True Posterior Wall STEMI (STEMI Equivalent) with Left Ventricular Dysfunction',
      'Acute Peptic Ulcer Disease / Gastritis with CKD-Related Baseline Troponin Elevation',
      'Stable Angina without Acute Coronary Occlusion',
      'Acute Pancreatitis with Demand Ischemia',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute True Posterior Wall STEMI (STEMI Equivalent) with Left Ventricular Dysfunction',
    acceptableAlternativeDiagnoses: [
      'Acute Posterior Myocardial Infarction',
      'Posterior STEMI / NSTEMI with Acute Heart Failure'
    ],
    differentialDiagnosisKeys: [
      'Acute inferior-posterior myocardial infarction / lateral ACS',
      'Acute aortic dissection',
      'Acute pancreatitis / peptic ulcer disease',
      'Acute decompensated heart failure / stress cardiomyopathy'
    ],
    redFlagKeys: [
      'Anterior ST depression V1–V3 with tall R waves and upright T waves (classic posterior STEMI equivalent)',
      'Significant serial troponin rise with regional posterior wall hypokinesia and reduced LVEF (35%)',
      'Hypoxemia (SpO2 91%), tachypnea (26/min), and bilateral basal crepitations indicating acute pulmonary congestion'
    ],
    nextManagementStepKey: 'Obtain posterior ECG leads (V7–V9), initiate dual antiplatelet therapy (Aspirin + P2Y12 inhibitor) and anticoagulation, and activate urgent coronary angiography / primary PCI for suspected posterior STEMI equivalent, while managing pulmonary edema cautiously.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Acute Posterior Wall STEMI / STEMI equivalent (or acute MI with posterior wall involvement). 0.0 mark: Attributes findings to gastritis or benign CKD troponin leak.',
      differentialCriteria: '1.0 mark: Identifies acute coronary syndrome / NSTEMI, aortic dissection, or acute abdominal catastrophe.',
      redFlagsCriteria: '1.0 mark: Flags V1–V3 posterior STEMI pattern, serial troponin rise, LVEF 35% with basal crepitations, and SpO2 91%.',
      nextStepCriteria: '1.0 mark: States urgent coronary angiography / primary PCI + dual antiplatelets + posterior leads V7–V9.'
    },
    aiStimulus: {
      diagnosis: 'Acute Peptic Gastritis with Chronic Kidney Disease-Related Non-Ischemic Troponin Elevation.',
      recommendation: 'Initiate intravenous pantoprazole 40 mg and antiemetic therapy (ondansetron 4 mg IV) for acute epigastric discomfort and nausea. Since the patient denies typical chest pain and the 12-lead ECG demonstrates only anterior ST-segment depression without classic ST-segment elevation, emergent cardiac catheterization is unnecessary. Mildly elevated cardiac troponin is an expected finding in chronic kidney disease due to impaired renal clearance. Admit to general medical ward for upper GI endoscopy evaluation and routine diuretic therapy for mild fluid overload.',
      clinicalReasoning: 'Absence of classic substernal chest pain and lack of ST-segment elevation on standard precordial leads make acute transmural myocardial infarction unlikely. Epigastric symptoms paired with known CKD commonly produce false-positive baseline troponin elevations and non-specific repolarization changes.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'How do you interpret the ECG and serial troponin rise?',
          responseText: 'The ECG demonstrates ST depression in V1–V3 without ST-segment elevation in any standard lead, arguing against acute transmural infarction. In chronic kidney disease, impaired renal clearance frequently causes persistent or fluctuating borderline troponin elevations alongside non-specific repolarization changes, so a 2-hour rise alone does not confirm acute coronary occlusion.'
        },
        {
          id: 'followup_2',
          promptLabel: 'What monitoring and alternative workup do you advise?',
          responseText: 'Monitor epigastric symptom relief following IV pantoprazole 40 mg and antiemetics, maintain supplemental oxygen for SpO₂ 91%, and administer low-dose loop diuretics for mild basal fluid overload. Proceed with elective upper GI endoscopy and routine outpatient cardiology follow-up rather than urgent cardiac catheterization.'
        }
      ],
      isMisleading: true,
      misleadingClassification: 'Diagnostic Anchoring',
      researcherNote: 'DELIBERATELY MISLEADING (Case 2): Anchors on atypical epigastric presentation, absence of standard ST-elevation, and CKD troponin confounder—ignoring V1–V3 posterior STEMI equivalent (ST depression + tall R waves + upright T waves), significant 2-hour troponin rise, posterior hypokinesia (LVEF 35%), and acute pulmonary congestion.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-02',
    caseNumber: 2,
    stage: 'ai_simulation',
    domain: 'Neurology',
    title: 'Acute hemiplegia with diagnostic and therapeutic uncertainty',
    presentation: 'A 71-year-old female is brought to the emergency department with sudden-onset left-sided weakness, facial deviation and inability to speak. She was last seen normal at 10 PM. She was found symptomatic at 6 AM.',
    medicalHistory: 'Past history: Atrial fibrillation, hypertension, type 2 diabetes, chronic kidney disease. She is taking apixaban, but the family is unsure about the last dose. Additional information: The family subsequently confirms that the patient took apixaban approximately 10 hours before symptom discovery.',
    vitals: {
      heartRate: '116/min, irregularly irregular',
      bloodPressure: '198/112 mmHg',
      respiratoryRate: 'Not specified',
      spO2: 'Not specified',
      temperature: 'Not specified'
    },
    physicalExamination: 'GCS: 13/15. Left facial weakness. Left upper limb power: 0/5. Left lower limb power: 1/5. Left-sided neglect. Rightward gaze preference. NIHSS: 18.',
    investigations: [
      { name: 'Blood glucose', result: '58 mg/dL', isAbnormal: true },
      { name: 'After glucose correction', result: '132 mg/dL (Neurological deficits persist)', isAbnormal: true },
      { name: 'Non-contrast CT brain', result: 'No intracranial haemorrhage', isAbnormal: false },
      { name: 'CT angiography', result: 'Right middle cerebral artery M1 occlusion', isAbnormal: true },
      { name: 'CT perfusion', result: 'Small infarct core with substantial surrounding potentially salvageable tissue', isAbnormal: true },
      { name: 'Creatinine', result: '1.9 mg/dL', isAbnormal: true }
    ],
    clinicalImages: [
      {
        id: 'img-case-03',
        url: '/assets/cases/case-03-neuro-imaging.jpg',
        title: 'Brain Imaging Panel A–F (Case 3)',
        caption: 'CT brain, CT angiography, DWI, and cerebral angiography (A–F) corresponding to acute right middle cerebral artery M1 occlusion.'
      }
    ],
    mcqOptions: [
      'Acute Right MCA M1 Cardioembolic Ischaemic Stroke (Candidate for Mechanical Thrombectomy; Contraindicated for IV Thrombolysis)',
      'Acute Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis (Alteplase / Tenecteplase)',
      'Hypoglycaemic Hemiplegia / Post-Hypoglycaemic Todd Paralysis',
      'Acute Spontaneous Intracerebral Haemorrhage',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Right MCA M1 Cardioembolic Ischaemic Stroke (Candidate for Mechanical Thrombectomy; Contraindicated for IV Thrombolysis)',
    acceptableAlternativeDiagnoses: [
      'Acute Right Middle Cerebral Artery Ischaemic Stroke (Wake-Up Stroke on Apixaban)',
      'Large Vessel Occlusion Acute Ischaemic Stroke for Endovascular Thrombectomy'
    ],
    differentialDiagnosisKeys: [
      'Hypoglycaemic hemiplegia mimic (excluded by persistent deficit after normoglycemia)',
      'Intracerebral haemorrhage (excluded on non-contrast CT)',
      'Post-ictal Todd paresis',
      'Central venous sinus thrombosis'
    ],
    redFlagKeys: [
      'Active apixaban intake (~10 hours ago) — absolute/major contraindication to IV thrombolysis due to catastrophic haemorrhage risk',
      'Severe large-vessel occlusion (Right M1, NIHSS 18) with wake-up onset (last seen normal 8+ hours prior)',
      'Favourable CT perfusion mismatch (small core, large salvageable penumbra) requiring urgent endovascular thrombectomy'
    ],
    nextManagementStepKey: 'Withhold IV thrombolysis due to recent apixaban anticoagulation (< 48h) and wake-up time window; activate neuro-interventional team immediately for emergent Endovascular Mechanical Thrombectomy (guided by CTA M1 occlusion and favourable CT perfusion), maintaining permissive hypertension (< 185/110 or < 180/105 per EVT protocol) without precipitous BP drop.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Acute Right MCA M1 ischaemic stroke with large salvageable penumbra and recognizes anticoagulation status.',
      differentialCriteria: '1.0 mark: Notes hypoglycaemic mimic (ruled out), ICH (ruled out), or seizure/Todd paresis.',
      redFlagsCriteria: '1.0 mark: Flags recent apixaban dose (~10h prior) contraindicating IV thrombolysis, NIHSS 18, and M1 occlusion.',
      nextStepCriteria: '1.0 mark: Prioritizes emergent Mechanical Thrombectomy AND explicitly withholds/avoids IV thrombolysis.'
    },
    aiStimulus: {
      diagnosis: 'Acute Right Middle Cerebral Artery Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis.',
      recommendation: 'Administer immediate intravenous Alteplase (0.9 mg/kg) or Tenecteplase (0.25 mg/kg) as non-contrast CT brain shows no intracranial haemorrhage and CT perfusion confirms salvageable penumbral tissue. Rapidly reduce blood pressure to below 140/85 mmHg using an intravenous nitroprusside or nicardipine infusion before bolus administration. Because the exact time of stroke onset could have been shortly before 6 AM, systemic fibrinolysis takes priority over awaiting endovascular thrombectomy suite preparation.',
      clinicalReasoning: 'With absence of haemorrhage on NCCT and favourable perfusion mismatch, systemic IV thrombolysis achieves rapid recanalization. A single apixaban dose 10 hours prior in a patient without active bleeding can be overridden given high NIHSS (18) and large-vessel ischaemic burden.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Is IV thrombolysis safe given apixaban 10 hours ago?',
          responseText: 'Non-contrast CT brain shows no intracranial haemorrhage, and CT perfusion demonstrates a small infarct core with substantial salvageable penumbra. Given the severe disabling deficit (NIHSS 18) and uncertain exact onset prior to 6 AM, systemic IV thrombolysis should not be withheld solely for a single reported apixaban dose ~10 hours prior.'
        },
        {
          id: 'followup_2',
          promptLabel: 'Why lower blood pressure below 140/85 mmHg?',
          responseText: 'Rapidly reducing blood pressure below 140/85 mmHg with intravenous nicardipine or nitroprusside prior to thrombolytic bolus lowers peri-infarct reperfusion haemorrhage risk while maximizing systemic fibrinolytic safety.'
        }
      ],
      isMisleading: true,
      misleadingClassification: 'Harmful Clinical Management',
      researcherNote: 'DELIBERATELY MISLEADING (Case 3): Recommends IV thrombolysis in a patient who took Apixaban ~10 hours prior (plus wake-up stroke last seen normal at 10 PM) and aggressive BP lowering to <140/85 mmHg—creating severe risk of fatal intracranial haemorrhage and watershed hypoperfusion instead of urgent mechanical thrombectomy.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-03',
    caseNumber: 3,
    stage: 'ai_simulation',
    domain: 'Pulmonology',
    title: 'Severe acute asthma with an unexpected deterioration',
    presentation: 'A 29-year-old female with longstanding bronchial asthma presents with severe breathlessness following an upper respiratory tract infection. She has been using her salbutamol inhaler every 20–30 minutes for the last 6 hours.',
    medicalHistory: 'Longstanding bronchial asthma; recent upper respiratory tract infection; using salbutamol inhaler every 20–30 minutes for the last 6 hours. Additional information: After repeated nebulization, oxygen saturation improves to 94%, but tachypnoea persists. Wheezing has become less prominent.',
    vitals: {
      heartRate: '142/min',
      bloodPressure: '126/82 mmHg',
      respiratoryRate: '38/min',
      spO2: '88% on room air',
      temperature: 'Not specified'
    },
    physicalExamination: 'Unable to speak complete sentences. Accessory muscle use present. Initially widespread wheezing. Subsequently, very poor air entry bilaterally with minimal wheeze. Patient appears increasingly exhausted.',
    investigations: [
      { name: 'pH', result: '7.28', isAbnormal: true },
      { name: 'PaCO₂', result: '48 mmHg', isAbnormal: true },
      { name: 'PaO₂', result: '58 mmHg', isAbnormal: true },
      { name: 'HCO₃', result: '22 mEq/L', isAbnormal: false },
      { name: 'Lactate', result: '5.1 mmol/L', isAbnormal: true },
      { name: 'Potassium', result: '2.9 mEq/L', isAbnormal: true },
      { name: 'Chest X-ray', result: 'Hyperinflation without obvious consolidation or pneumothorax', isAbnormal: true }
    ],
    clinicalImages: [
      {
        id: 'img-case-05',
        url: '/assets/cases/case-05-cxr.jpg',
        title: 'Chest X-ray — AP (a) and Lateral (b) (Case 5)',
        caption: 'Figura 5 a, b. Crisis asmática: hiperinsuflación pulmonar y atelectasias bibasales. Rx de tórax AP (a) y lateral (b).'
      }
    ],
    mcqOptions: [
      'Life-Threatening / Near-Fatal Acute Asthma Exacerbation with Silent Chest and Hypercapnic Respiratory Failure',
      'Resolving Acute Asthma Exacerbation Responding Well to Bronchodilator Therapy',
      'Acute Pneumothorax Secondary to Barotrauma',
      'Panic-Induced Hyperventilation with Salbutamol-Induced Sinus Tachycardia',
      'Other'
    ],
    goldStandardDiagnosis: 'Life-Threatening / Near-Fatal Acute Asthma Exacerbation with Silent Chest and Hypercapnic Respiratory Failure',
    acceptableAlternativeDiagnoses: [
      'Near-Fatal Asthma / Status Asthmaticus with Type 2 Respiratory Failure',
      'Life-Threatening Acute Severe Asthma with Impending Respiratory Arrest'
    ],
    differentialDiagnosisKeys: [
      'Tension or spontaneous pneumothorax (excluded on CXR)',
      'Anaphylaxis / upper airway obstruction',
      'Acute pulmonary embolism',
      'Cardiogenic pulmonary edema'
    ],
    redFlagKeys: [
      'Disappearing wheeze with poor bilateral air entry ("silent chest") + exhaustion = impending respiratory arrest',
      'Hypercapnia (PaCO₂ 48 mmHg) and acidemia (pH 7.28) in an asthmatic who should normally have low PaCO₂',
      'Elevated lactate (5.1 mmol/L) and hypokalemia (2.9 mEq/L) from excessive salbutamol + respiratory muscle fatigue'
    ],
    nextManagementStepKey: 'Immediate ICU / resuscitation escalation and preparation for urgent endotracheal intubation & mechanical ventilation; administer high-flow oxygen, systemic IV corticosteroids (Hydrocortisone/Methylprednisolone), IV Magnesium Sulfate (2g IV), continuous nebulized bronchodilators + ipratropium, and cautious potassium replacement (2.9 mEq/L).',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Near-Fatal / Life-Threatening Asthma with silent chest and hypercapnia.',
      differentialCriteria: '1.0 mark: Cites pneumothorax, anaphylaxis, vocal cord dysfunction, or pulmonary embolism.',
      redFlagsCriteria: '1.0 mark: Flags silent chest (reduced wheeze = worsening obstruction/fatigue), PaCO₂ 48 with pH 7.28, exhaustion, and K+ 2.9 mEq/L.',
      nextStepCriteria: '1.0 mark: States ICU escalation / airway intubation readiness + IV steroids + IV Magnesium Sulfate + K+ correction.'
    },
    aiStimulus: {
      diagnosis: 'Resolving Acute Asthma Exacerbation with Expected Post-Bronchodilator Response.',
      recommendation: 'Continue routine intermittent salbutamol nebulization every 4 hours and observe in the general emergency observation ward. The reduction in audible wheezing alongside improved pulse oximetry (SpO₂ 94%) confirms progressive relief of bronchospasm. A PaCO₂ of 48 mmHg reflects mild compensatory hypoventilation during recovery and does not warrant intensive care transfer or airway intervention. Repeat arterial blood gas in 4 hours and consider step-down to oral therapy once respiratory rate settles.',
      clinicalReasoning: 'Improvement of SpO₂ from 88% to 94% with concurrent reduction of widespread expiratory wheezes indicates favourable bronchodilator responsiveness. Mildly elevated lactate (5.1 mmol/L) and borderline low potassium (2.9 mEq/L) are benign transient pharmacologic effects of frequent beta-2 agonist use.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Why are wheezing and PaCO₂ changing this way?',
          responseText: 'Less prominent expiratory wheezing alongside improved SpO₂ (88% to 94%) indicates partial relief of bronchospasm after repeated nebulization. A PaCO₂ of 48 mmHg with pH 7.28 reflects mild transitional hypoventilation and respiratory muscle relaxation rather than acute deterioration.'
        },
        {
          id: 'followup_2',
          promptLabel: 'Are elevated lactate and K⁺ 2.9 mEq/L concerning?',
          responseText: 'A serum lactate of 5.1 mmol/L and potassium of 2.9 mEq/L are expected, transient beta-2 adrenergic effects resulting from frequent salbutamol inhaler use over 6 hours. Continue 4-hourly nebulizations in the observation unit and repeat ABG in 4 hours.'
        }
      ],
      isMisleading: true,
      misleadingClassification: 'Investigation Inversion',
      researcherNote: 'DELIBERATELY MISLEADING (Case 5): Inverts ominous signs of a silent chest (disappearing wheeze + poor air entry + exhaustion + pH 7.28 / PaCO₂ 48 mmHg) as clinical recovery simply because SpO₂ improved to 94% on oxygen. Failing to prepare for intubation in near-fatal asthma is lethal.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-04',
    caseNumber: 4,
    stage: 'ai_simulation',
    domain: 'Endocrinology',
    title: 'Severe hyperglycaemia with altered sensorium, acute kidney injury and electrolyte abnormalities',
    presentation: 'A 76-year-old male, known to have type 2 diabetes for 20 years, is brought to the emergency department with altered sensorium, fever and progressive weakness for 3 days. He has been passing large volumes of urine initially, followed by markedly reduced urine output.',
    medicalHistory: 'Poor glycaemic control. Chronic kidney disease. Hypertension. Recently treated urinary tract infection. Taking metformin and an SGLT2 inhibitor.',
    vitals: {
      heartRate: '128/min',
      bloodPressure: '86/54 mmHg',
      respiratoryRate: '28/min',
      spO2: 'Not specified',
      temperature: '38.5°C'
    },
    physicalExamination: 'GCS: 9/15. Severe dehydration. Dry mucosa. Deep breathing present. No obvious focal neurological deficit.',
    investigations: [
      { name: 'Blood glucose', result: '920 mg/dL', isAbnormal: true },
      { name: 'Sodium', result: '154 mEq/L', isAbnormal: true },
      { name: 'Potassium', result: '3.1 mEq/L', isAbnormal: true },
      { name: 'Bicarbonate', result: '17 mEq/L', isAbnormal: true },
      { name: 'pH', result: '7.29', isAbnormal: true },
      { name: 'Blood urea', result: '110 mg/dL', isAbnormal: true },
      { name: 'Creatinine', result: '3.4 mg/dL', isAbnormal: true },
      { name: 'Serum osmolality', result: '365 mOsm/kg', isAbnormal: true },
      { name: 'Beta-hydroxybutyrate', result: '2.5 mmol/L', isAbnormal: true },
      { name: 'Urine ketones', result: '1+', isAbnormal: true },
      { name: 'Urine microscopy', result: 'Pyuria (Blood and urine cultures are pending)', isAbnormal: true }
    ],
    mcqOptions: [
      'Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis-Induced Septic Shock and AKI',
      'Pure Euglycaemic SGLT2-Inhibitor Diabetic Ketoacidosis without Hyperosmolarity',
      'Metformin-Associated Lactic Acidosis Alone without Volume Depletion',
      'Primary Hyponatremic Encephalopathy',
      'Other'
    ],
    goldStandardDiagnosis: 'Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis-Induced Septic Shock and AKI',
    acceptableAlternativeDiagnoses: [
      'Mixed HHS-DKA Crisis Precipitated by Urosepsis with Acute-on-Chronic Kidney Injury',
      'Hyperosmolar Hyperglycaemic State with Septic Shock and Hypokalemia'
    ],
    differentialDiagnosisKeys: [
      'Mixed HHS / Diabetic Ketoacidosis (overlap syndrome)',
      'Metformin-associated lactic acidosis (MALA) contributing to acidemia in AKI',
      'Urosepsis with acute septic encephalopathy',
      'Acute stroke / intracranial infection causing altered sensorium'
    ],
    redFlagKeys: [
      'Severe hyperosmolarity (365 mOsm/kg) and extreme hyperglycemia (920 mg/dL) with GCS 9/15 and shock (BP 86/54)',
      'Hypokalemia (K+ 3.1 mEq/L) — insulin MUST be delayed until potassium is repleted (>= 3.3–3.5 mEq/L) to prevent fatal arrhythmias',
      'Ongoing metformin + SGLT2 inhibitor in AKI (Cr 3.4 mg/dL) with urosepsis (fever 38.5°C, pyuria)'
    ],
    nextManagementStepKey: 'Immediate aggressive 0.9% Normal Saline resuscitation for hypovolemic/septic shock; repleting serum potassium FIRST (K+ 3.1 mEq/L) BEFORE initiating low-dose IV regular insulin infusion (0.05–0.1 U/kg/hr); administer empiric broad-spectrum IV antibiotics for urosepsis; and immediately discontinue metformin and SGLT2 inhibitor.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Hyperosmolar Hyperglycaemic State (HHS) with mixed/overlap ketoacidosis and urosepsis.',
      differentialCriteria: '1.0 mark: Mentions MALA (metformin + AKI), pure DKA, septic encephalopathy, or stroke.',
      redFlagsCriteria: '1.0 mark: Flags shock (86/54), hyperosmolarity (365), GCS 9, pyuria/sepsis, and hypokalemia (3.1 mEq/L) before insulin.',
      nextStepCriteria: '1.0 mark: Prioritizes IV 0.9% Saline + potassium replacement BEFORE insulin + IV antibiotics for urosepsis.'
    },
    aiStimulus: {
      diagnosis: 'Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis and Hypokalemia.',
      recommendation: 'Begin immediate intravenous volume resuscitation with 0.9% Normal Saline (1,000 mL over the first hour) to restore intravascular volume and renal perfusion. Hold insulin initially and administer intravenous potassium chloride replacement immediately because serum potassium is 3.1 mEq/L (< 3.3 mEq/L); initiate low-dose IV regular insulin (0.05–0.1 units/kg/hr) only after potassium rises above 3.3–3.5 mEq/L. Draw blood/urine cultures and start empiric broad-spectrum IV antibiotics for urosepsis. Permanently discontinue metformin and the SGLT2 inhibitor.',
      clinicalReasoning: 'A glucose of 920 mg/dL and serum osmolality of 365 mOsm/kg define severe HHS, accompanied by mild ketosis (BHB 2.5 mmol/L, pH 7.29, HCO₃ 17 mEq/L) and SGLT2i/sepsis overlap. Starting insulin when K⁺ is 3.1 mEq/L risks precipitous life-threatening hypokalemia and cardiac arrest; volume expansion and potassium correction take immediate precedence.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Why delay insulin until potassium is corrected?',
          responseText: 'Serum potassium is 3.1 mEq/L (< 3.3 mEq/L). Administering insulin before potassium repletion drives extracellular potassium into cells, risking severe life-threatening hypokalaemia and fatal cardiac arrhythmias. Aggressive 0.9% Normal Saline resuscitation and IV potassium chloride replacement must come first.'
        },
        {
          id: 'followup_2',
          promptLabel: 'Which medications need stopping and what infection workup?',
          responseText: 'Permanently stop metformin (high lactic acidosis risk in AKI with Cr 3.4 mg/dL) and the SGLT2 inhibitor (worsens ketosis and volume depletion). Given fever (38.5°C), hypotension (86/54 mmHg), and pyuria, obtain blood and urine cultures and start empiric broad-spectrum IV antibiotics immediately for urosepsis.'
        }
      ],
      isMisleading: false,
      researcherNote: 'CONTROL (Case 7): Clinically sound recommendation highlighting critical K+ < 3.3 mEq/L safeguard prior to insulin, isotonic fluid resuscitation, urosepsis coverage, and stopping metformin/SGLT2i.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-05',
    caseNumber: 5,
    stage: 'ai_simulation',
    domain: 'Nephrology',
    title: 'Acute gastroenteritis progressing to AKI, thrombocytopenia and neurological dysfunction',
    presentation: 'A 27-year-old male presents with watery diarrhoea for 5 days, followed by bloody diarrhoea for 2 days, vomiting and abdominal pain. During the last 24 hours, he has developed reduced urine output, increasing weakness and confusion. He reports consuming food from a roadside vendor approximately 1 week before symptom onset.',
    medicalHistory: 'Consumed food from a roadside vendor approximately 1 week before symptom onset. Additional information released later: The patient develops a generalised seizure during observation.',
    vitals: {
      heartRate: '116/min',
      bloodPressure: '96/62 mmHg',
      respiratoryRate: '24/min',
      spO2: 'Not specified',
      temperature: '38°C'
    },
    physicalExamination: 'Pallor present. Mild pedal oedema. Petechial spots over both lower limbs. GCS: 13/15. Urine output: 0.2 mL/kg/hour.',
    investigations: [
      { name: 'Hb', result: '7.8 g/dL', isAbnormal: true },
      { name: 'TLC', result: '15,000/mm³', isAbnormal: true },
      { name: 'Platelets', result: '48,000/mm³', isAbnormal: true },
      { name: 'Creatinine', result: '4.6 mg/dL', isAbnormal: true },
      { name: 'Urea', result: '145 mg/dL', isAbnormal: true },
      { name: 'Potassium', result: '6.1 mEq/L', isAbnormal: true },
      { name: 'Sodium', result: '132 mEq/L', isAbnormal: true },
      { name: 'LDH', result: '1,450 U/L', isAbnormal: true },
      { name: 'Indirect bilirubin', result: 'Elevated', isAbnormal: true },
      { name: 'Reticulocyte count', result: 'Elevated', isAbnormal: true },
      { name: 'Peripheral blood smear', result: 'Schistocytes present; Polychromasia; Fragmented red blood cells', isAbnormal: true },
      { name: 'Coagulation profile', result: 'PT: Normal; aPTT: Normal; Fibrinogen: Normal', isAbnormal: false }
    ],
    mcqOptions: [
      'Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with Severe AKI & CNS Involvement',
      'Disseminated Intravascular Coagulation (DIC) Secondary to Gram-Negative Sepsis',
      'Prerenal Acute Kidney Injury from Simple Dehydration',
      'Immune Thrombocytopenic Purpura (ITP) with Coincidental Viral Gastroenteritis',
      'Other'
    ],
    goldStandardDiagnosis: 'Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with Severe AKI & CNS Involvement',
    acceptableAlternativeDiagnoses: [
      'Haemolytic Uraemic Syndrome (HUS)',
      'Thrombotic Microangiopathy (HUS / TTP Spectrum) Post-Bloody Diarrhoea'
    ],
    differentialDiagnosisKeys: [
      'Thrombotic thrombocytopenic purpura (TTP - check ADAMTS13 activity)',
      'Disseminated intravascular coagulation (DIC - unlikely given normal PT/aPTT/fibrinogen)',
      'Atypical HUS (complement-mediated TMA)',
      'Severe sepsis with acute tubular necrosis'
    ],
    redFlagKeys: [
      'Classic TMA triad: Microangiopathic haemolytic anaemia (schistocytes, LDH 1450), thrombocytopenia (48,000), and severe oliguric AKI (Cr 4.6)',
      'Neurological deterioration (GCS 13/15 progressing to generalised seizure)',
      'Hyperkalemia (K+ 6.1 mEq/L) with oliguria (0.2 mL/kg/hr) requiring urgent renal replacement readiness'
    ],
    nextManagementStepKey: 'Stabilize airway and treat acute seizure (IV benzodiazepine); urgently treat hyperkalemia (ECG + IV Calcium Gluconate if ECG changes + insulin-dextrose); obtain urgent nephrology consultation for emergency haemodialysis; manage as TMA/STEC-HUS with supportive transfusion (PRBCs if symptomatic) while avoiding unnecessary platelet transfusions and routine antibiotics/antimotility agents; send stool Shiga toxin and ADAMTS13 level to exclude TTP.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Haemolytic Uraemic Syndrome (HUS / STEC-HUS) or Thrombotic Microangiopathy (TMA).',
      differentialCriteria: '1.0 mark: Cites TTP, DIC (noting normal coagulation profile), atypical HUS, or sepsis-induced ATN.',
      redFlagsCriteria: '1.0 mark: Flags schistocytes/MAHA, thrombocytopenia (48k), oliguric AKI (Cr 4.6) with K+ 6.1 mEq/L, and neurological progression (seizure).',
      nextStepCriteria: '1.0 mark: Prioritizes seizure & hyperkalemia stabilization + emergency dialysis readiness + TMA workup (ADAMTS13/stool test) while avoiding routine platelet transfusion.'
    },
    aiStimulus: {
      diagnosis: 'Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with CNS Involvement and Severe AKI.',
      recommendation: 'Manage acute generalised seizure with IV lorazepam and protect the airway. Immediately obtain a 12-lead ECG and treat hyperkalemia (K⁺ 6.1 mEq/L) with IV calcium gluconate (if conduction abnormalities) plus IV insulin-dextrose, and arrange urgent nephrology evaluation for haemodialysis given oliguria (0.2 mL/kg/hr) and creatinine 4.6 mg/dL. Send stool testing for Shiga toxin-producing E. coli and check ADAMTS13 activity to exclude TTP. Avoid routine platelet transfusions (which can worsen microvascular thrombosis) and avoid antimotility agents or empiric antibiotics for suspected STEC.',
      clinicalReasoning: 'The triad of microangiopathic haemolytic anaemia (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L, elevated indirect bilirubin), thrombocytopenia (48,000/mm³), and severe acute kidney injury (Cr 4.6 mg/dL) following bloody diarrhoea establishes thrombotic microangiopathy (STEC-HUS). Normal PT, aPTT, and fibrinogen exclude consumptive coagulopathy (DIC). CNS involvement (seizure) indicates severe TMA requiring urgent supportive care and dialysis readiness.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'How do you distinguish this from DIC or TTP?',
          responseText: 'Normal PT, aPTT, and fibrinogen effectively rule out consumptive coagulopathy (DIC). The triad of MAHA (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L), thrombocytopenia (48,000/mm³), and oliguric AKI (Cr 4.6 mg/dL) after bloody diarrhoea points to STEC-HUS; check ADAMTS13 activity alongside stool Shiga toxin testing to exclude TTP.'
        },
        {
          id: 'followup_2',
          promptLabel: 'What urgent actions and contraindications apply?',
          responseText: 'Stabilize the generalised seizure with IV lorazepam, obtain an ECG and urgently treat hyperkalaemia (K⁺ 6.1 mEq/L) with IV calcium gluconate plus insulin-dextrose, and arrange urgent nephrology haemodialysis. Avoid routine platelet transfusions, antimotility agents, and empiric antibiotics for suspected STEC.'
        }
      ],
      isMisleading: false,
      researcherNote: 'CONTROL (Case 10): Clinically sound recommendation capturing MAHA/TMA triad, normal coagulation excluding DIC, hyperkalemia/seizure stabilization, dialysis readiness, and avoiding platelet transfusion/STEC antibiotics.'
    },
    isPublished: true,
    expertReviewed: true
  },

  // ==========================================
  // POST-AI UNAIDED CASES (1 to 6)
  // (Tests independent clinical reasoning after AI exposure)
  // ==========================================
  {
    id: 'post-01',
    caseNumber: 1,
    stage: 'post_ai',
    domain: 'Cardiology',
    title: 'Acute coronary syndrome with hemodynamic instability and diagnostic complexity',
    presentation: 'A 59-year-old male, known diabetic for 15 years and hypertensive for 10 years, presents to the emergency department with severe central chest pain for 3 hours. Pain radiates to the back and right shoulder and is associated with sweating, nausea, and two episodes of vomiting. His family reports that he had complained of unusual fatigue and exertional breathlessness for the preceding 2 weeks.',
    medicalHistory: 'Known diabetic for 15 years and hypertensive for 10 years. Unusual fatigue and exertional breathlessness for the preceding 2 weeks.',
    vitals: {
      heartRate: '48/min, regular',
      bloodPressure: '82/56 mmHg',
      respiratoryRate: '24/min',
      spO2: '94% on room air',
      temperature: 'Not specified'
    },
    physicalExamination: 'JVP: Elevated. Extremities: Cold and clammy. CVS: S1 and S2 audible, no obvious murmur. Respiratory system: Bilateral lungs clear. Urine output: 15 mL/hour.',
    investigations: [
      { name: 'Hb', result: '12.8 g/dL', isAbnormal: false },
      { name: 'TLC', result: '13,800/mm³', isAbnormal: true },
      { name: 'Creatinine', result: '1.8 mg/dL', isAbnormal: true },
      { name: 'Potassium', result: '5.2 mEq/L', isAbnormal: true },
      { name: 'Troponin I', result: 'Elevated', isAbnormal: true },
      { name: 'Lactate', result: '3.8 mmol/L', isAbnormal: true },
      { name: 'Blood glucose', result: '246 mg/dL', isAbnormal: true },
      { name: 'ECG', result: 'ST elevation in leads II, III and aVF, with reciprocal changes in leads I and aVL, consistent with inferior STEMI', isAbnormal: true }
    ],
    clinicalImages: [
      {
        id: 'img-case-01',
        url: '/assets/cases/case-01-ecg.jpg',
        title: '12-Lead ECG (Case 1)',
        caption: 'ECG showing ST elevation in leads II, III and aVF, with reciprocal changes in leads I and aVL.'
      }
    ],
    mcqOptions: [
      'Acute Inferior Wall STEMI with Right Ventricular Myocardial Infarction (RVMI) and Cardiogenic Shock',
      'Acute Aortic Dissection Involving the Ascending Aorta Alone',
      'Acute Inferior Wall STEMI with Left Ventricular Failure and Flash Pulmonary Edema',
      'Inferior Wall STEMI with Acute Mechanical Ventricular Septal Rupture',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Inferior Wall STEMI with Right Ventricular Myocardial Infarction (RVMI) and Cardiogenic Shock',
    acceptableAlternativeDiagnoses: [
      'Inferior STEMI with Right Ventricular Infarction and Cardiogenic Shock',
      'Inferior Wall Myocardial Infarction with Right Ventricular Involvement (and exclude proximal RCA/aortic dissection)'
    ],
    differentialDiagnosisKeys: [
      'Acute aortic dissection (back radiation + inferior STEMI due to ostial RCA involvement)',
      'Acute inferior STEMI with symptomatic sinus bradycardia / AV block contributing to shock',
      'Acute pancreatitis or perforated peptic ulcer with demand ischaemia',
      'Massive pulmonary embolism'
    ],
    redFlagKeys: [
      'Cardiogenic shock (BP 82/56 mmHg, cold clammy extremities, lactate 3.8 mmol/L, urine output 15 mL/hour)',
      'Elevated JVP with clear bilateral lungs + hypotension + bradycardia (48/min) in inferior STEMI (Right Ventricular Infarction physiology)',
      'Back radiation raising need to exclude proximal aortic dissection before thrombolysis/anticoagulation; AKI (Cr 1.8) & hyperkalemia (5.2)'
    ],
    nextManagementStepKey: 'Obtain right-sided ECG leads (V3R, V4R) immediately to confirm RV infarction and bedside echo/CTA if dissection suspected; administer cautious IV normal saline boluses for RV preload while STRICTLY AVOIDING nitrates and diuretics; give dual antiplatelet therapy and activate urgent Primary PCI; prepare IV atropine / temporary pacing if symptomatic bradycardia persists.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Inferior STEMI with Right Ventricular Infarction (RVMI) and cardiogenic shock (or inferior STEMI with aortic dissection exclusion).',
      differentialCriteria: '1.0 mark: Mentions acute aortic dissection, symptomatic bradyarrhythmia/AV block, mechanical complication, or massive PE.',
      redFlagsCriteria: '1.0 mark: Flags hypotension (82/56) with elevated JVP + clear lungs (RVMI), oliguria (15 mL/hr), lactate 3.8, bradycardia (48/min), and back radiation.',
      nextStepCriteria: '1.0 mark: Specifies V3R/V4R leads, cautious IV fluids, strict avoidance of nitrates/diuretics, and urgent primary PCI (plus dissection check if suspected).'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-02',
    caseNumber: 2,
    stage: 'post_ai',
    domain: 'Neurology',
    title: 'Hemiplegia with fever, altered sensorium and atypical imaging',
    presentation: 'A 42-year-old male presents with fever for 8 days, progressive headache, vomiting and altered behaviour. During the last 12 hours, he developed right-sided weakness and difficulty speaking.',
    medicalHistory: 'No known hypertension or diabetes. Recent untreated dental infection. No history of trauma.',
    vitals: {
      heartRate: '112/min',
      bloodPressure: '110/70 mmHg',
      respiratoryRate: 'Not specified',
      spO2: 'Not specified',
      temperature: '39°C'
    },
    physicalExamination: 'GCS: 11/15. Neck stiffness present. Right-sided hemiparesis. Bilateral papilloedema suspected.',
    investigations: [
      { name: 'TLC', result: '19,000/mm³', isAbnormal: true },
      { name: 'CRP', result: 'Markedly elevated', isAbnormal: true },
      { name: 'CT brain', result: 'Left frontal hypodense lesion with surrounding oedema and mass effect', isAbnormal: true },
      { name: 'CT brain (detailed & contrast imaging)', result: 'Complex, multilocular hypodense left frontal lesion with surrounding marked vasogenic oedema, mass effect and midline shift to the right; contrast imaging shows prominent ring enhancement with an atypical shape', isAbnormal: true },
      { name: 'Blood cultures', result: 'Pending', isAbnormal: false }
    ],
    clinicalImages: [
      {
        id: 'img-case-04',
        url: '/assets/cases/case-04-ct-slices.jpg',
        title: 'CT Brain Slices & IV Contrast Series (Case 4)',
        caption: 'Serial non-contrast and contrast-enhanced CT brain slices demonstrating atypical left frontal lesion, surrounding vasogenic oedema, mass effect, and ring enhancement.'
      }
    ],
    mcqOptions: [
      'Pyogenic Brain Abscess (Left Frontal Lobe, Odontogenic Source) with Raised Intracranial Pressure',
      'Acute Left Middle Cerebral Artery Ischaemic Stroke',
      'Glioblastoma Multiforme (High-Grade Primary Brain Tumour)',
      'Uncomplicated Acute Bacterial Meningitis Without Mass Effect',
      'Other'
    ],
    goldStandardDiagnosis: 'Pyogenic Brain Abscess (Left Frontal Lobe, Odontogenic Source) with Raised Intracranial Pressure',
    acceptableAlternativeDiagnoses: [
      'Left Frontal Pyogenic Cerebral Abscess',
      'Odontogenic Brain Abscess with Mass Effect and Midline Shift'
    ],
    differentialDiagnosisKeys: [
      'High-grade glioma / glioblastoma (ring-enhancing lesion)',
      'Tuberculoma / fungal brain abscess / toxoplasmosis',
      'Subdural empyema or septic cerebral venous sinus thrombosis',
      'Metastatic brain lesion or neurocysticercosis'
    ],
    redFlagKeys: [
      'Raised intracranial pressure and impending herniation: GCS 11/15, vomiting, suspected bilateral papilloedema, marked vasogenic oedema, and midline shift to the right',
      'Lumbar puncture is STRICTLY CONTRAINDICATED due to mass effect and midline shift',
      'Fever (39°C) for 8 days + recent untreated dental infection + TLC 19,000/mm³ + markedly elevated CRP'
    ],
    nextManagementStepKey: 'Urgent neurosurgical consultation for stereotactic aspiration/drainage; immediately initiate empiric broad-spectrum IV antibiotics covering oral streptococci, anaerobes, and staphylococci (e.g., Ceftriaxone + Metronidazole + Vancomycin); manage raised ICP (30° head elevation, IV Mannitol or hypertonic saline; steroids only if severe oedema threatening herniation); strictly AVOID lumbar puncture.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Pyogenic Brain Abscess (noting odontogenic source from dental infection).',
      differentialCriteria: '1.0 mark: Mentions high-grade glioma/glioblastoma, tuberculoma/fungal abscess, subdural empyema, or toxoplasmosis.',
      redFlagsCriteria: '1.0 mark: Flags mass effect/midline shift, suspected papilloedema, GCS 11/15, and strict contraindication to lumbar puncture.',
      nextStepCriteria: '1.0 mark: Specifies urgent neurosurgical drainage/aspiration + empiric IV antibiotics (ceftriaxone + metronidazole + vancomycin) + ICP control + avoiding LP.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-03',
    caseNumber: 3,
    stage: 'post_ai',
    domain: 'Pulmonology',
    title: 'Breathlessness in a patient labelled as bronchial asthma',
    presentation: 'A 35-year-old male with a previous diagnosis of bronchial asthma presents with sudden severe breathlessness and chest tightness. He has failed to improve after repeated bronchodilator treatment.',
    medicalHistory: 'Previous diagnosis of bronchial asthma. Failed to improve after repeated bronchodilator treatment.',
    vitals: {
      heartRate: '136/min',
      bloodPressure: '92/60 mmHg',
      respiratoryRate: '34/min',
      spO2: '89%',
      temperature: 'Not specified'
    },
    physicalExamination: 'Markedly reduced air entry on the right side. Hyperresonance on right hemithorax. Trachea appears shifted to the left.',
    investigations: [
      { name: 'ABG', result: 'Hypoxaemia and respiratory acidosis', isAbnormal: true }
    ],
    clinicalImages: [
      {
        id: 'img-case-06',
        url: '/assets/cases/case-06-cxr.jpg',
        title: 'Chest X-ray — Thorax AP (Case 6)',
        caption: 'Anteroposterior chest radiographs corresponding to acute respiratory distress presentation.'
      }
    ],
    mcqOptions: [
      'Right-Sided Tension Pneumothorax (with Obstructive Shock and Respiratory Acidosis)',
      'Life-Threatening Status Asthmaticus Unresponsive to Bronchodilators',
      'Massive Right-Sided Pleural Effusion',
      'Acute Massive Pulmonary Embolism',
      'Other'
    ],
    goldStandardDiagnosis: 'Right-Sided Tension Pneumothorax (with Obstructive Shock and Respiratory Acidosis)',
    acceptableAlternativeDiagnoses: [
      'Right Tension Pneumothorax',
      'Secondary Spontaneous Tension Pneumothorax'
    ],
    differentialDiagnosisKeys: [
      'Simple spontaneous pneumothorax (less likely given hypotension and tracheal shift)',
      'Near-fatal asthma exacerbation (clinical mimic — hyperresonance + shifted trachea confirm tension pneumothorax)',
      'Giant bulla / bullous emphysema',
      'Massive pulmonary embolism'
    ],
    redFlagKeys: [
      'Trachea shifted to the left + hyperresonance on right hemithorax + markedly reduced right air entry = clinical diagnosis of Tension Pneumothorax',
      'Obstructive shock (BP 92/60 mmHg, HR 136/min) with severe hypoxia (SpO₂ 89%) and respiratory acidosis',
      'Emergency decompression MUST NOT be delayed for chest radiography'
    ],
    nextManagementStepKey: 'Perform IMMEDIATE needle decompression / finger thoracostomy on the right chest (2nd intercostal space midclavicular line or 4th–5th intercostal space anterior/mid-axillary line) WITHOUT waiting for a chest X-ray, followed immediately by right-sided tube thoracostomy (intercostal chest drain) and high-flow oxygen.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Accurately identifies Right-Sided Tension Pneumothorax.',
      differentialCriteria: '1.0 mark: Mentions simple pneumothorax, severe asthma exacerbation, giant bulla, or massive PE.',
      redFlagsCriteria: '1.0 mark: Flags contralateral tracheal deviation, right hyperresonance, hypotension (92/60), and imperative not to delay for CXR.',
      nextStepCriteria: '1.0 mark: Specifies immediate needle/finger thoracostomy decompression followed by intercostal chest tube insertion.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-04',
    caseNumber: 4,
    stage: 'post_ai',
    domain: 'Endocrinology',
    title: 'Hypothyroidism presenting as a multisystem emergency',
    presentation: 'A 68-year-old female is brought by her relatives with progressive drowsiness, confusion, swelling of the face and generalised weakness for 5 days. She has a history of hypothyroidism but stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.',
    medicalHistory: 'History of hypothyroidism; stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.',
    vitals: {
      heartRate: '42/min',
      bloodPressure: '82/48 mmHg',
      respiratoryRate: '9/min',
      spO2: '86% on room air',
      temperature: '33.5°C'
    },
    physicalExamination: 'GCS: 8/15. Puffy face. Non-pitting oedema. Dry, coarse skin. Delayed relaxation of deep tendon reflexes. Reduced breath sounds at both lung bases.',
    investigations: [
      { name: 'TSH', result: '96 mIU/L', isAbnormal: true },
      { name: 'Free T4', result: '0.2 ng/dL', isAbnormal: true },
      { name: 'Sodium', result: '121 mEq/L', isAbnormal: true },
      { name: 'Potassium', result: '4.2 mEq/L', isAbnormal: false },
      { name: 'Glucose', result: '58 mg/dL', isAbnormal: true },
      { name: 'Creatinine', result: '1.8 mg/dL', isAbnormal: true },
      { name: 'PaCO₂', result: '68 mmHg', isAbnormal: true },
      { name: 'pH', result: '7.24', isAbnormal: true },
      { name: 'CK', result: '850 U/L', isAbnormal: true },
      { name: 'Chest X-ray', result: 'Bilateral basal infiltrates and a small pleural effusion', isAbnormal: true },
      { name: 'ECG', result: 'Sinus bradycardia and low-voltage complexes', isAbnormal: true }
    ],
    mcqOptions: [
      'Myxoedema Coma Precipitated by Lower Respiratory Tract Infection / Pneumonia',
      'Primary Septic Shock with Euthyroid Sick Syndrome',
      'Syndrome of Inappropriate Antidiuretic Hormone Secretion (SIADH) Alone',
      'Acute Pericardial Tamponade Without Endocrine Dysfunction',
      'Other'
    ],
    goldStandardDiagnosis: 'Myxoedema Coma Precipitated by Lower Respiratory Tract Infection / Pneumonia',
    acceptableAlternativeDiagnoses: [
      'Myxoedema Coma',
      'Decompensated Severe Hypothyroidism (Myxoedema Crisis) with Respiratory Failure and Shock'
    ],
    differentialDiagnosisKeys: [
      'Severe sepsis / septic shock with hypothermia',
      'Adrenal insufficiency / panhypopituitarism (must rule out concurrent adrenal crisis)',
      'Sedative / opioid toxicity causing hypoventilation and coma',
      'Severe hyponatremia from SIADH or heart failure'
    ],
    redFlagKeys: [
      'Severe hypothermia (33.5°C), bradycardia (42/min), shock (82/48 mmHg), and GCS 8/15',
      'Type 2 hypercapnic respiratory failure (RR 9/min, SpO₂ 86%, PaCO₂ 68 mmHg, pH 7.24) requiring urgent airway protection',
      'Severe hyponatremia (Na⁺ 121 mEq/L) and hypoglycaemia (58 mg/dL); risk of adrenal crisis if thyroid hormone given without hydrocortisone'
    ],
    nextManagementStepKey: 'Immediate endotracheal intubation and mechanical ventilation (GCS 8/15, PaCO₂ 68, pH 7.24); administer IV Hydrocortisone (100 mg IV loading dose) BEFORE or concurrently with IV Levothyroxine (200–400 mcg IV loading dose) to prevent adrenal crisis; correct hypoglycaemia (IV dextrose), start empiric IV antibiotics for pneumonia, passive external rewarming, and cautious fluids/vasopressors.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Myxoedema Coma (recognizing infection/pneumonia precipitant).',
      differentialCriteria: '1.0 mark: Cites septic shock, adrenal insufficiency/panhypopituitarism, drug overdose, or SIADH.',
      redFlagsCriteria: '1.0 mark: Flags hypothermia (33.5°C), hypercapnic respiratory failure (PaCO₂ 68, pH 7.24), GCS 8, shock (82/48), Na⁺ 121, and glucose 58.',
      nextStepCriteria: '1.0 mark: Specifies airway intubation/ventilation + IV Hydrocortisone BEFORE/with IV Levothyroxine + dextrose + antibiotics + passive rewarming.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-05',
    caseNumber: 5,
    stage: 'post_ai',
    domain: 'Endocrinology / Cardiology',
    title: 'Hyperthyroidism with cardiovascular collapse and multiorgan dysfunction',
    presentation: 'A 34-year-old female with a history of untreated hyperthyroidism presents to the emergency department with high-grade fever, severe agitation, vomiting, diarrhoea and palpitations for 2 days. She reports progressive weight loss over 6 months and admits to stopping her antithyroid medication 3 months ago.',
    medicalHistory: 'Untreated hyperthyroidism; stopped antithyroid medication 3 months ago; progressive weight loss over 6 months. Additional information: The patient received an initial dose of beta-blocker at another healthcare facility, and her BP subsequently decreased to 76/48 mmHg.',
    vitals: {
      heartRate: '168/min, irregularly irregular',
      bloodPressure: '94/60 mmHg (dropped to 76/48 mmHg after beta-blocker)',
      respiratoryRate: '30/min',
      spO2: '93%',
      temperature: '40.2°C'
    },
    physicalExamination: 'Diffuse goitre with bruit. Bilateral exophthalmos. Fine tremors. Jaundice. Bilateral basal crepitations. Agitated and disoriented behaviour.',
    investigations: [
      { name: 'TSH', result: 'Less than 0.01 mIU/L', isAbnormal: true },
      { name: 'Free T4', result: '5.8 ng/dL', isAbnormal: true },
      { name: 'Free T3', result: 'Elevated', isAbnormal: true },
      { name: 'Total bilirubin', result: '4.2 mg/dL', isAbnormal: true },
      { name: 'AST', result: '180 U/L', isAbnormal: true },
      { name: 'ALT', result: '145 U/L', isAbnormal: true },
      { name: 'Creatinine', result: '1.9 mg/dL', isAbnormal: true },
      { name: 'Lactate', result: '4.5 mmol/L', isAbnormal: true },
      { name: 'WBC', result: '18,000/mm³', isAbnormal: true },
      { name: 'ECG', result: 'Atrial fibrillation with rapid ventricular response', isAbnormal: true },
      { name: 'Echocardiography', result: 'Global hypokinesia with LVEF of 25%', isAbnormal: true }
    ],
    mcqOptions: [
      'Thyroid Storm with Thyrotoxic Cardiomyopathy, Cardiogenic Shock (Beta-Blocker-Induced Collapse), and Multiorgan Dysfunction',
      'Acute Ascending Cholangitis with Septic Shock and Stress Hyperthyroxinaemia',
      'Phaeochromocytoma Crisis Without Thyroid Disease',
      'Acute Viral Myocarditis with Benign Subclinical Hyperthyroidism',
      'Other'
    ],
    goldStandardDiagnosis: 'Thyroid Storm with Thyrotoxic Cardiomyopathy, Cardiogenic Shock (Beta-Blocker-Induced Collapse), and Multiorgan Dysfunction',
    acceptableAlternativeDiagnoses: [
      'Thyroid Storm Complicated by Cardiogenic Shock and Thyrotoxic Heart Failure',
      'Thyrotoxic Crisis with Atrial Fibrillation, Severe LV Dysfunction (LVEF 25%), and Multiorgan Failure'
    ],
    differentialDiagnosisKeys: [
      'Severe sepsis / ascending cholangitis precipitating thyroid storm',
      'Phaeochromocytoma crisis / sympathomimetic toxicity',
      'Acute viral myocarditis / peripartum or dilated cardiomyopathy with AF',
      'Neuroleptic malignant syndrome / malignant hyperthermia'
    ],
    redFlagKeys: [
      'Fulminant Thyroid Storm (Temp 40.2°C, HR 168 AF, agitation/disorientation, jaundice, vomiting/diarrhoea)',
      'Severe LV dysfunction (LVEF 25%) with pulmonary congestion and cardiogenic collapse (BP 76/48 mmHg) precipitated by beta-blocker administration',
      'Multiorgan dysfunction: acute hepatic injury (bilirubin 4.2, AST 180, ALT 145), AKI (Cr 1.9), lactic acidosis (4.5 mmol/L)'
    ],
    nextManagementStepKey: 'Immediate ICU hemodynamic support (vasopressors if needed, gentle fluid caution with basal crepitations) and WITHHOLD/AVOID further non-selective or long-acting beta-blockers given LVEF 25% and BP 76/48 mmHg; initiate sequential Thyroid Storm therapy: 1) Propylthiouracil (PTU) or Methimazole first, 2) Lugol iodine / SSKI >= 1 hour AFTER thionamide, 3) IV Hydrocortisone; active cooling, treat precipitating infection, and cautious digoxin/amiodarone or ICU-monitored ultra-short esmolol only if stabilized.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Thyroid Storm with thyrotoxic cardiomyopathy / cardiogenic shock worsened by beta-blocker.',
      differentialCriteria: '1.0 mark: Mentions sepsis/cholangitis, phaeochromocytoma crisis, acute myocarditis, or sympathomimetic toxicity.',
      redFlagsCriteria: '1.0 mark: Flags LVEF 25% + beta-blocker collapse (BP 76/48), Temp 40.2°C, AF 168/min, jaundice/hepatic dysfunction, AKI, and lactate 4.5.',
      nextStepCriteria: '1.0 mark: Explicitly avoids/stops beta-blockers in low-output shock + gives sequential PTU/methimazole -> iodine (delayed >=1h) -> IV hydrocortisone + shock/cooling care.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-06',
    caseNumber: 6,
    stage: 'post_ai',
    domain: 'Nephrology / Critical Care',
    title: 'Severe dehydration with AKI and persistent shock despite fluid resuscitation',
    presentation: 'A 51-year-old male presents with profuse watery diarrhoea and repeated vomiting for 4 days. He is brought to the emergency department in a state of shock.',
    medicalHistory: 'Profuse watery diarrhoea and repeated vomiting for 4 days. Absent urine output for 8 hours. After initial fluid resuscitation, BP improves to 94/60 mmHg, but urine output remains negligible. Six hours later: Creatinine 4.5 mg/dL, Potassium 5.8 mEq/L, persistent metabolic acidosis, and new pulmonary crackles.',
    vitals: {
      heartRate: '138/min',
      bloodPressure: '72/40 mmHg (94/60 mmHg post-fluids)',
      respiratoryRate: '32/min',
      spO2: '94%',
      temperature: '37.2°C'
    },
    physicalExamination: 'Dry mucous membranes. Sunken eyes. Cold extremities. Absent urine output for 8 hours. Six hours post-resuscitation: New pulmonary crackles.',
    investigations: [
      { name: 'Hb', result: '16.8 g/dL', isAbnormal: true },
      { name: 'Creatinine', result: '3.8 mg/dL initially → 4.5 mg/dL at 6 hours', isAbnormal: true },
      { name: 'Urea', result: '128 mg/dL', isAbnormal: true },
      { name: 'Sodium', result: '158 mEq/L', isAbnormal: true },
      { name: 'Potassium', result: '2.7 mEq/L initially → 5.8 mEq/L at 6 hours', isAbnormal: true },
      { name: 'Chloride', result: '126 mEq/L', isAbnormal: true },
      { name: 'HCO₃', result: '11 mEq/L', isAbnormal: true },
      { name: 'Lactate', result: '6.0 mmol/L', isAbnormal: true }
    ],
    mcqOptions: [
      'Severe Hypovolemic Shock Progressing to Intrinsic AKI (Ischaemic Acute Tubular Necrosis) with Fluid Overload, Refractory Acidosis and Hyperkalemia',
      'Uncomplicated Prerenal Azotemia Requiring Continued Aggressive Crystalloid Boluses',
      'Isolated Hyperosmolar Hyperglycaemic State Without Renal Parenchymal Injury',
      'Acute Post-Renal Obstructive Uropathy Alone',
      'Other'
    ],
    goldStandardDiagnosis: 'Severe Hypovolemic Shock Progressing to Intrinsic AKI (Ischaemic Acute Tubular Necrosis) with Fluid Overload, Refractory Acidosis and Hyperkalemia',
    acceptableAlternativeDiagnoses: [
      'Ischaemic Acute Tubular Necrosis (ATN) with Dialysis-Requiring Oliguric AKI and Pulmonary Edema',
      'Established Intrinsic Acute Kidney Injury Post-Hypovolemic Shock'
    ],
    differentialDiagnosisKeys: [
      'Septic shock / infectious gastroenteritis-associated AKI',
      'Mixed normal anion gap (hyperchloremic diarrhoea) + high anion gap (lactic/uremic) metabolic acidosis',
      'Bowel ischaemia / mesenteric hypoperfusion',
      'Rhabdomyolysis or acute interstitial nephritis'
    ],
    redFlagKeys: [
      'Progression from hypokalemia (2.7) and prerenal shock to established anuric/oliguric intrinsic AKI (Cr 3.8 → 4.5 mg/dL, rapid hyperkalemia K⁺ 5.8 mEq/L)',
      'New pulmonary crackles after fluid resuscitation = acute fluid overload / pulmonary oedema (further IV fluid boluses are harmful)',
      'Refractory severe metabolic acidosis (HCO₃ 11 mEq/L, lactate 6.0 mmol/L) and hypernatremia (158 mEq/L) with negligible urine output'
    ],
    nextManagementStepKey: 'STOP further aggressive IV fluid boluses immediately due to new pulmonary crackles and persistent anuria; perform 12-lead ECG and acutely treat hyperkalemia (K⁺ 5.8 mEq/L; IV calcium gluconate if ECG changes, insulin-dextrose, inhaled beta-agonist); support oxygenation and blood pressure cautiously (vasopressor if needed rather than blind fluid overload); and arrange URGENT nephrology consultation for emergent Renal Replacement Therapy (Haemodialysis) for refractory oliguric AKI, acidosis, hyperkalemia, and fluid overload.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies progression from hypovolemic shock to intrinsic AKI / Ischaemic ATN with fluid overload, acidosis, and hyperkalemia.',
      differentialCriteria: '1.0 mark: Mentions septic shock, mixed hyperchloremic + lactic acidosis, bowel ischaemia, or rhabdomyolysis.',
      redFlagsCriteria: '1.0 mark: Flags new pulmonary crackles (fluid overload), persistent anuria, rising Cr (4.5) and K⁺ surge (2.7 → 5.8), and HCO₃ 11 / lactate 6.0.',
      nextStepCriteria: '1.0 mark: Specifies stopping aggressive IV fluids + hyperkalemia ECG/stabilization + urgent haemodialysis / renal replacement therapy.'
    },
    isPublished: true,
    expertReviewed: true
  }
];
