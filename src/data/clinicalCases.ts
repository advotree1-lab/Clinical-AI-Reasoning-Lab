import { ClinicalCase } from '../types';

export const INITIAL_CLINICAL_CASES: ClinicalCase[] = [
  // ==========================================
  // BASELINE UNAIDED CASES (1 to 5)
  // ==========================================
  {
    id: 'base-01',
    caseNumber: 1,
    stage: 'baseline',
    domain: 'Cardiology',
    title: 'Elderly Diabetic with Atypical Epigastric Discomfort',
    presentation: 'A 64-year-old male with a 15-year history of type 2 diabetes mellitus presents to the casualty department with a 3-hour history of severe dull epigastric discomfort, persistent nausea, and cold diaphoresis.',
    medicalHistory: 'Type 2 Diabetes Mellitus (HbA1c 8.8%), Essential Hypertension, 20 pack-year smoking history. Medications: Metformin 1000mg BD, Glimepiride 2mg OD, Telmisartan 40mg OD.',
    vitals: {
      heartRate: '98 bpm (regular)',
      bloodPressure: '104/68 mmHg',
      respiratoryRate: '20 /min',
      spO2: '96% on room air',
      temperature: '36.8 °C'
    },
    physicalExamination: 'Patient appears anxious, pale, and clammy. Heart sounds: S1 and S2 present, soft S4 audible at cardiac apex. Chest: Clear to auscultation bilaterally. Abdomen: Soft, non-tender, mild fullness, no guarding or rebound tenderness. Peripheral pulses present but faint.',
    investigations: [
      { name: '12-Lead ECG', result: 'Sinus rhythm; 1.5mm ST-segment depression in leads II, III, aVF and V4-V6; T-wave inversion in V5-V6', isAbnormal: true },
      { name: 'High-Sensitivity Troponin I', result: '184 ng/L (Elevated; reference < 14 ng/L)', isAbnormal: true },
      { name: 'Random Blood Glucose', result: '242 mg/dL', isAbnormal: true },
      { name: 'Serum Creatinine', result: '1.2 mg/dL (Baseline 1.0)', isAbnormal: false },
      { name: 'Bedside Echocardiogram', result: 'Inferolateral wall hypokinesia; LVEF approximately 45%', isAbnormal: true }
    ],
    mcqOptions: [
      'Acute Non-ST Elevation Myocardial Infarction (NSTEMI)',
      'Acute Peptic Ulcer Disease / Perforation',
      'Acute Cholecystitis',
      'Diabetic Gastroparesis Flare',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Non-ST Elevation Myocardial Infarction (NSTEMI)',
    acceptableAlternativeDiagnoses: [
      'Non-ST Elevation Acute Coronary Syndrome',
      'Acute Coronary Syndrome (Atypical Presentation)',
      'NSTEMI'
    ],
    differentialDiagnosisKeys: [
      'Acute pericarditis / myocarditis',
      'Acute pancreatitis',
      'Aortic dissection (Stanford Type A/B)',
      'Gastroesophageal reflux disease / Esophageal spasm'
    ],
    redFlagKeys: [
      'Diaphoresis and borderline hypotension (BP 104/68)',
      'Elevated cardiac biomarker with ischemic ECG changes',
      'High risk for silent ischemia in longstanding diabetes',
      'Threat of cardiogenic shock or malignant arrhythmia'
    ],
    nextManagementStepKey: 'Immediate dual antiplatelet therapy (Aspirin 300mg + Ticagrelor 180mg), anticoagulation (Enoxaparin/Heparin), continuous ECG monitoring, and urgent cardiology consultation for early invasive angiography.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Recognizes NSTEMI / Non-ST elevation acute coronary syndrome. 0.0 mark: Misidentifies as primary gastrointestinal pathology (PUD, GERD, Cholecystitis).',
      differentialCriteria: '1.0 mark: Identifies at least two clinically acute competing differentials (Aortic dissection, pancreatitis, peptic ulcer perforation, pericarditis).',
      redFlagsCriteria: '1.0 mark: Explicitly mentions diabetic autonomic neuropathy masking angina, autonomic symptoms (clammy/pale), hemodynamics, or troponin leak.',
      nextStepCriteria: '1.0 mark: Mentions antiplatelets + anticoagulation + coronary angiography / cardiology triage.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'base-02',
    caseNumber: 2,
    stage: 'baseline',
    domain: 'Pulmonology',
    title: 'Severe Dyspnea and Somnolence in Chronic Smoker',
    presentation: 'A 68-year-old female known to have severe COPD presents with 4 days of worsening shortness of breath, purulent green sputum production, and increasing daytime somnolence and confusion noted by family.',
    medicalHistory: 'Severe COPD (GOLD Stage 3, FEV1 38% predicted), 40 pack-year smoking history. Home medications: Formoterol/Budesonide inhaler, Tiotropium inhaler. Received 4L/min oxygen via nasal cannula in transit.',
    vitals: {
      heartRate: '112 bpm (regular)',
      bloodPressure: '142/88 mmHg',
      respiratoryRate: '28 /min (shallow, with pursed-lip breathing)',
      spO2: '94% on 4L/min nasal O2',
      temperature: '38.1 °C'
    },
    physicalExamination: 'Drowsy, asterixis (flapping tremor) observed when asked to extend wrists. Barrel chest with intercostal indrawing. Bilateral diffuse coarse expiratory wheezing with scattered bibasilar crackles.',
    investigations: [
      { name: 'Arterial Blood Gas (on 4L/min O2)', result: 'pH 7.26, PaCO2 68 mmHg, PaO2 84 mmHg, HCO3- 32 mEq/L, Base Excess +5.8 (Acute-on-chronic respiratory acidosis)', isAbnormal: true },
      { name: 'Chest X-ray (AP Portable)', result: 'Hyperinflated lung fields, flattened diaphragms, patchy opacity in right lower zone suspicious for bronchopneumonia', isAbnormal: true },
      { name: 'Total Leukocyte Count', result: '15,800 /uL (86% neutrophils)', isAbnormal: true },
      { name: 'Serum Potassium', result: '4.1 mEq/L', isAbnormal: false }
    ],
    mcqOptions: [
      'Acute Exacerbation of COPD with Hypercapnic Type 2 Respiratory Failure',
      'Acute Pulmonary Thromboembolism',
      'Congestive Heart Failure Exacerbation',
      'Severe Sepsis secondary to Meningitis',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Exacerbation of COPD with Hypercapnic Type 2 Respiratory Failure',
    acceptableAlternativeDiagnoses: [
      'AECOPD with Acute-on-Chronic Type 2 Respiratory Failure',
      'COPD Exacerbation with CO2 Narcosis and Bronchopneumonia'
    ],
    differentialDiagnosisKeys: [
      'Community-acquired pneumonia with secondary respiratory decompensation',
      'Acute left ventricular failure / cardiogenic pulmonary edema',
      'Pulmonary embolism complicating immobility',
      'Metabolic encephalopathy'
    ],
    redFlagKeys: [
      'Severe respiratory acidosis (pH 7.26, PaCO2 68 mmHg)',
      'Asterixis and altered consciousness (CO2 retention/narcosis)',
      'High FiO2 toxicity risk blunting hypoxic ventilatory drive'
    ],
    nextManagementStepKey: 'Titrate oxygen delivery immediately to target SpO2 88-92% (Venturi mask), initiate Non-Invasive Positive Pressure Ventilation (BiPAP/NIV), nebulized bronchodilators, systemic corticosteroids, and empiric antibiotics.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Recognizes acute exacerbation of COPD with hypercapnic/Type 2 respiratory failure. 0.5 mark: COPD exacerbation without acknowledging hypercapnia/respiratory failure.',
      differentialCriteria: '1.0 mark: Cites plausible competing causes (Pneumonia, PE, Congestive heart failure, Oversedation).',
      redFlagsCriteria: '1.0 mark: Recognizes lethargy/asterixis indicating carbon dioxide narcosis, acidosis pH < 7.30, or uncontrolled oxygenation danger.',
      nextStepCriteria: '1.0 mark: Identifies Non-Invasive Ventilation (NIV/BiPAP) and controlled oxygen targeting 88-92%.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'base-03',
    caseNumber: 3,
    stage: 'baseline',
    domain: 'Obstetrics',
    title: 'Severe Headache and Hyperreflexia at 33 Weeks Gestation',
    presentation: 'A 26-year-old primigravida at 33 weeks and 4 days of gestation presents with a 24-hour history of unremitting throbbing frontal headache, visual blurring with flashing scotomata, and severe epigastric discomfort.',
    medicalHistory: 'Primigravida. Normal booking blood pressure at 12 weeks (110/70 mmHg). No previous medical conditions.',
    vitals: {
      heartRate: '88 bpm',
      bloodPressure: '172/114 mmHg (confirmed on two repeat checks 15 mins apart)',
      respiratoryRate: '18 /min',
      spO2: '98% on room air',
      temperature: '37.0 °C'
    },
    physicalExamination: 'Brisk deep tendon patellar reflexes (+3) with 4 beats of unsustained ankle clonus. Marked bilateral lower extremity pitting edema up to mid-calf. Abdomen: Gravid uterus corresponding to 32 weeks, tenderness in right upper quadrant. Fetal heart rate: 144 bpm, reassuring reactive trace.',
    investigations: [
      { name: 'Urine Dipstick', result: 'Protein 3+ (approx 3.0 g/L)', isAbnormal: true },
      { name: 'Platelet Count', result: '92,000 /uL (Thrombocytopenia; reference 150k-400k)', isAbnormal: true },
      { name: 'Serum AST / ALT', result: 'AST 148 IU/L, ALT 162 IU/L (Markedly elevated)', isAbnormal: true },
      { name: 'Serum Creatinine', result: '1.3 mg/dL (Elevated for pregnancy)', isAbnormal: true },
      { name: 'Serum Uric Acid', result: '7.8 mg/dL', isAbnormal: true }
    ],
    mcqOptions: [
      'Preeclampsia with Severe Features / Impending Eclampsia (HELLP evolution)',
      'Gestational Hypertension with Migraine Headache',
      'Acute Viral Hepatitis during Pregnancy',
      'Idiopathic Intracranial Hypertension (Pseudotumor)',
      'Other'
    ],
    goldStandardDiagnosis: 'Preeclampsia with Severe Features / Impending Eclampsia (HELLP evolution)',
    acceptableAlternativeDiagnoses: [
      'Severe Preeclampsia with Impending Eclampsia',
      'Pre-eclampsia with Severe Features and partial HELLP syndrome'
    ],
    differentialDiagnosisKeys: [
      'Eclampsia (once convulsions manifest)',
      'HELLP Syndrome (Hemolysis, Elevated Liver Enzymes, Low Platelets)',
      'Acute fatty liver of pregnancy',
      'Thrombotic Thrombocytopenic Purpura (TTP) / Atypical HUS'
    ],
    redFlagKeys: [
      'Systolic BP >= 160 mmHg or Diastolic BP >= 110 mmHg',
      'Neurological symptoms (headache, visual disturbance, clonus) signaling cerebral edema',
      'Thrombocytopenia and hepatic transaminitis with RUQ pain (hepatic capsule stretch / rupture risk)'
    ],
    nextManagementStepKey: 'Immediate initiation of Magnesium Sulfate loading dose (4g IV over 20 min) for seizure prophylaxis, rapid-acting parenteral antihypertensive (IV Labetalol or IV Hydralazine), and urgent obstetric consultation for delivery stabilization.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies preeclampsia with severe features / impending eclampsia / HELLP. 0.0 mark: Gestational hypertension or tension headache.',
      differentialCriteria: '1.0 mark: Lists HELLP, AFLP, intracranial hemorrhage, TTP, or migraine.',
      redFlagsCriteria: '1.0 mark: Cites severe blood pressure range, clonus/hyperreflexia, or thrombocytopenia/elevated transaminases.',
      nextStepCriteria: '1.0 mark: Must state Magnesium Sulfate for eclampsia prevention + IV antihypertensives (Labetalol/Hydralazine).'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'base-04',
    caseNumber: 4,
    stage: 'baseline',
    domain: 'Neurology',
    title: 'Acute Right-Sided Hemiparesis and Expressive Aphasia',
    presentation: 'A 59-year-old male is brought to the emergency department by emergency medical services 75 minutes after sudden onset of right facial droop, complete right upper and lower extremity weakness, and inability to speak coherently.',
    medicalHistory: 'Permanent Atrial Fibrillation (non-adherent with Apixaban), Hypertension. Last seen completely normal at 08:30 AM (arrival time 09:45 AM).',
    vitals: {
      heartRate: '106 bpm (irregularly irregular)',
      bloodPressure: '166/96 mmHg',
      respiratoryRate: '16 /min',
      spO2: '97% on room air',
      temperature: '36.9 °C'
    },
    physicalExamination: 'Patient is conscious but exhibits profound Broca expressive aphasia (intact comprehension of simple commands, unable to name or repeat). Right central facial palsy. Right upper extremity motor power 0/5, right lower extremity 1/5. Right extensor plantar response (Babinski positive). NIHSS score calculated at 17.',
    investigations: [
      { name: 'Non-Contrast Brain CT', result: 'No acute intracranial hemorrhage or subdural collection; subtle early loss of insular ribbon and hyperdense left MCA sign noted', isAbnormal: true },
      { name: 'Capillary Blood Glucose', result: '128 mg/dL', isAbnormal: false },
      { name: 'ECG', result: 'Atrial fibrillation with rapid ventricular response', isAbnormal: true },
      { name: 'Coagulation Profile (PT/INR)', result: 'INR 1.1 (Apixaban missed for past 2 weeks confirmed by family)', isAbnormal: false }
    ],
    mcqOptions: [
      'Acute Ischemic Stroke (Left Middle Cerebral Artery territory, within thrombolytic window)',
      'Acute Subdural Hematoma',
      'Todd Paralysis post-Focal Seizure',
      'Hypoglycemic Hemiplegic Episode',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Ischemic Stroke (Left Middle Cerebral Artery territory, within thrombolytic window)',
    acceptableAlternativeDiagnoses: [
      'Acute Left MCA Ischemic Stroke',
      'Acute Cardioembolic Stroke (Left MCA territory)'
    ],
    differentialDiagnosisKeys: [
      'Intracranial hemorrhage (ruled out by non-contrast CT)',
      'Complex basilar or hemiplegic migraine',
      'Todd post-ictal paresis',
      'Conversion disorder / functional neurological deficit'
    ],
    redFlagKeys: [
      'NIHSS score of 17 (Severe neurological deficit)',
      'Time elapsed from last known normal (critical 4.5-hour IV thrombolysis and 24-hour mechanical thrombectomy window)',
      'Cardioembolic origin with risk of hemorrhagic transformation'
    ],
    nextManagementStepKey: 'Activate code stroke protocol immediately: administer intravenous recombinant tissue plasminogen activator (IV Tenecteplase / Alteplase) if no absolute contraindications, and transfer for emergent CT Angiography / Endovascular Mechanical Thrombectomy.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Recognizes acute ischemic stroke in Left MCA territory within time window.',
      differentialCriteria: '1.0 mark: Mentions ICH, Todd paralysis, hypoglycemic mimic, or subdural hematoma.',
      redFlagsCriteria: '1.0 mark: Identifies symptom onset time window (< 4.5 hours), NIHSS severity, or hemorrhagic transformation danger.',
      nextStepCriteria: '1.0 mark: States IV thrombolysis (Alteplase/Tenecteplase) and/or emergent CTA/mechanical thrombectomy.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'base-05',
    caseNumber: 5,
    stage: 'baseline',
    domain: 'Nephrology',
    title: 'Oliguria, Maculopapular Rash, and Arthralgia Post-Antibiotics',
    presentation: 'A 48-year-old male presents with 3 days of progressive malaise, low-grade fevers, bilateral flank aching, widespread skin rash, and dark, tea-colored urine with markedly reduced urine output (< 400 mL in 24 hours).',
    medicalHistory: 'Treated 10 days ago for acute sinusitis with Oral Amoxicillin-Clavulanate and Diclofenac 50mg TID for persistent facial pain. No previous renal pathology; baseline serum creatinine 2 months ago was 0.9 mg/dL.',
    vitals: {
      heartRate: '84 bpm',
      bloodPressure: '138/86 mmHg',
      respiratoryRate: '16 /min',
      spO2: '99% on room air',
      temperature: '38.2 °C'
    },
    physicalExamination: 'Erythematous maculopapular pruritic eruption distributed over trunk and proximal extremities. Mild tenderness on deep palpation over bilateral renal angles. No peripheral edema, no joint effusions.',
    investigations: [
      { name: 'Serum Creatinine', result: '4.8 mg/dL (Marked acute kidney injury; baseline 0.9 mg/dL)', isAbnormal: true },
      { name: 'Blood Urea Nitrogen', result: '62 mg/dL', isAbnormal: true },
      { name: 'Urinalysis', result: 'Mild proteinuria (1+), 15-20 WBCs/hpf, white blood cell casts present, no erythrocyte dysmorphic casts', isAbnormal: true },
      { name: 'Hansel Stain for Urine Eosinophils', result: 'Positive (> 5% urine eosinophils)', isAbnormal: true },
      { name: 'Complete Blood Count', result: 'Total WBC 11,400 /uL, absolute eosinophil count 1,200 /uL (Eosinophilia)', isAbnormal: true },
      { name: 'Renal Ultrasound', result: 'Normal to slightly enlarged kidneys with increased cortical echogenicity, no hydronephrosis or stone', isAbnormal: true }
    ],
    mcqOptions: [
      'Drug-Induced Acute Interstitial Nephritis (AIN)',
      'Post-Streptococcal Glomerulonephritis',
      'Acute Tubular Necrosis secondary to Dehydration',
      'Renal Cell Carcinoma with Paraneoplastic Syndrome',
      'Other'
    ],
    goldStandardDiagnosis: 'Drug-Induced Acute Interstitial Nephritis (AIN)',
    acceptableAlternativeDiagnoses: [
      'Allergic / Drug-Induced Interstitial Nephritis',
      'Acute Interstitial Nephritis secondary to NSAIDs / Beta-lactams'
    ],
    differentialDiagnosisKeys: [
      'Acute tubular necrosis (ischemic or toxic)',
      'Rapidly progressive glomerulonephritis (RPGN / ANCA vasculitis)',
      'Acute bilateral pyelonephritis',
      'Atheroembolic renal disease'
    ],
    redFlagKeys: [
      'Rapid tenfold creatinine elevation (4.8 mg/dL) with oliguria',
      'Classic triad of fever, rash, and eosinophilia/eosinophiluria post-drug exposure',
      'Risk of irreversible chronic tubulointerstitial fibrosis if offending agent continued'
    ],
    nextManagementStepKey: 'Immediate withdrawal and cessation of the offending drugs (Amoxicillin-Clavulanate and Diclofenac); if no improvement in renal parameters within 48-72 hours, initiate systemic corticosteroid therapy (Oral Prednisone 1 mg/kg/day).',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Accurately identifies Drug-Induced Acute Interstitial Nephritis (AIN).',
      differentialCriteria: '1.0 mark: Lists ATN, Glomerulonephritis/RPGN, Pyelonephritis, or atheroemboli.',
      redFlagsCriteria: '1.0 mark: Notes severe azotemia/oliguria, hypersensitivity triad (fever/rash/eosinophilia), and progressive loss of GFR.',
      nextStepCriteria: '1.0 mark: States immediate discontinuation of culprit drugs (NSAID/antibiotic) +/- corticosteroid trial.'
    },
    isPublished: true,
    expertReviewed: true
  },

  // ==========================================
  // STANDARDIZED AI SIMULATION CASES (1 to 5)
  // (2 Clinically Sound, 3 Deliberately Misleading)
  // ==========================================
  {
    id: 'sim-01',
    caseNumber: 1,
    stage: 'ai_simulation',
    domain: 'Cardiology',
    title: 'Crushing Retrosternal Chest Pain with Diaphoresis',
    presentation: 'A 54-year-old male bus driver presents to the acute resuscitation bay with a 45-minute history of crushing retrosternal chest pain radiating to his left shoulder and jaw, accompanied by profound diaphoresis, dyspnea, and lightheadedness.',
    medicalHistory: 'Hypertension, Dyslipidemia, 25 pack-year cigarette smoking. Medications: Amlodipine 5mg OD, Atorvastatin 20mg OD.',
    vitals: {
      heartRate: '108 bpm (sinus tachycardia)',
      bloodPressure: '88/58 mmHg (hypotensive)',
      respiratoryRate: '24 /min',
      spO2: '93% on room air',
      temperature: '36.6 °C'
    },
    physicalExamination: 'Patient appears pale, profusely sweating, in severe agony holding his chest (Levine sign). Heart sounds: S1 and S2 muffled, bilateral bibasilar fine crackles at lung bases. Extremities are cool with prolonged capillary refill of 4 seconds.',
    investigations: [
      { name: '12-Lead ECG', result: 'Sinus tachycardia at 108 bpm; 4mm ST-segment elevation in leads V1, V2, V3, and V4 with reciprocal ST-segment depression in leads II, III, and aVF', isAbnormal: true },
      { name: 'Point-of-Care Troponin T', result: 'Qualitative positive (> 100 ng/L)', isAbnormal: true },
      { name: 'Point-of-Care Blood Glucose', result: '146 mg/dL', isAbnormal: false },
      { name: 'Portable Chest Radiograph', result: 'Mild pulmonary venous congestion, normal cardiac silhouette, no mediastinal widening', isAbnormal: true }
    ],
    mcqOptions: [
      'Acute Extensive Anterior ST-Elevation Myocardial Infarction (STEMI) with Impending Cardiogenic Shock',
      'Acute Aortic Dissection with Pericardial Tamponade',
      'Acute Massive Pulmonary Embolism',
      'Severe Gastroesophageal Reflux with Esophageal Spasm',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Extensive Anterior ST-Elevation Myocardial Infarction (STEMI) with Impending Cardiogenic Shock',
    acceptableAlternativeDiagnoses: [
      'Acute Anterior Wall STEMI',
      'Extensive Anterior STEMI with Hemodynamic Instability'
    ],
    differentialDiagnosisKeys: [
      'Acute aortic dissection with coronary ostial involvement',
      'Massive pulmonary embolism',
      'Acute pericarditis with effusion',
      'Esophageal rupture (Boerhaave syndrome)'
    ],
    redFlagKeys: [
      'ST-elevation > 2mm across precordial leads V1-V4',
      'Hypotension (BP 88/58 mmHg) with pulmonary congestion (Killip Class II-III / cardiogenic shock risk)',
      'Severe ongoing ischemia with high risk of ventricular fibrillation or cardiac arrest'
    ],
    nextManagementStepKey: 'Immediate activation of Cardiac Catheterization Laboratory for Emergent Primary Percutaneous Coronary Intervention (PCI); administer loading doses of Aspirin 300mg and Ticagrelor 180mg, supplemental oxygen, cautious fluid challenge for hypotension, and prepare inotropic / mechanical circulatory support.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Recognizes Acute Anterior STEMI with hemodynamic compromise.',
      differentialCriteria: '1.0 mark: Identifies aortic dissection, pulmonary embolism, or pericarditis.',
      redFlagsCriteria: '1.0 mark: Flags hypotension (88/58), cool peripheries, pulmonary crackles, and ischemic ECG.',
      nextStepCriteria: '1.0 mark: States emergency cath lab activation / primary PCI within 90 minutes + dual antiplatelets.'
    },
    // FIXED STANDARDIZED AI STIMULUS: CLINICALLY APPROPRIATE (Outcome 1: Sound advice)
    aiStimulus: {
      diagnosis: 'Acute Extensive Anterior ST-Elevation Myocardial Infarction (STEMI) with Early Cardiogenic Decompensation (Killip Class II).',
      recommendation: 'Immediate activation of the cardiac catheterization team for urgent Primary Percutaneous Coronary Intervention (target door-to-balloon time < 90 minutes). Administer Aspirin 300 mg chewed and Ticagrelor 180 mg orally immediately. Initiate weight-adjusted unfractionated heparin bolus. Provide supplemental oxygen via nasal cannula to achieve SpO2 > 94%. Avoid nitrates due to borderline hypotension (BP 88/58 mmHg). Maintain continuous defibrillator readiness.',
      clinicalReasoning: 'The clinical presentation of acute crushing substernal chest discomfort with diaphoresis, combined with 4mm ST-elevation in V1-V4 and reciprocal inferior ST depressions, fulfills the diagnostic criteria for acute anterior myocardial infarction caused by proximal left anterior descending (LAD) coronary occlusion. Concomitant systemic hypotension and basal rales warrant emergent revascularization without delay.',
      isMisleading: false,
      researcherNote: 'CONTROL: Clinically sound recommendation. Measures participant acceptance and appropriate clinical compliance.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-02',
    caseNumber: 2,
    stage: 'ai_simulation',
    domain: 'General Medicine',
    title: 'Vomiting, Kussmaul Respiration, and Altered Sensorium in Type 1 Diabetes',
    presentation: 'A 22-year-old female with known Type 1 Diabetes Mellitus presents to the emergency department accompanied by her roommate, with a 2-day history of intractable nausea, vomiting, severe abdominal pain, and rapid, deep labored breathing, accompanied by drowsiness.',
    medicalHistory: 'Type 1 Diabetes Mellitus diagnosed 7 years ago. Missed her basal insulin (Glargine) doses for the preceding 48 hours following a viral gastroenteritis episode because she was unable to eat.',
    vitals: {
      heartRate: '124 bpm (sinus tachycardia)',
      bloodPressure: '92/60 mmHg (orthostatic)',
      respiratoryRate: '32 /min (deep, rapid Kussmaul pattern)',
      spO2: '98% on room air',
      temperature: '37.8 °C'
    },
    physicalExamination: 'Patient is lethargic, responds sluggishly to vocal commands. Fruity/acetone odor noted on breath. Dry buccal mucosa, sunken orbits, skin turgor severely decreased. Abdomen: Generalized mild tenderness without localized rebound or guarding. Bowel sounds are diminished.',
    investigations: [
      { name: 'Venous Blood Gas', result: 'pH 7.14, pCO2 20 mmHg, HCO3- 8 mEq/L, Base Excess -18 mEq/L (Severe High Anion Gap Metabolic Acidosis)', isAbnormal: true },
      { name: 'Plasma Glucose', result: '462 mg/dL (Marked hyperglycemia)', isAbnormal: true },
      { name: 'Serum Sodium', result: '131 mEq/L (Corrected sodium ~ 137 mEq/L)', isAbnormal: false },
      { name: 'Serum Potassium', result: '5.2 mEq/L', isAbnormal: true },
      { name: 'Serum Chloride', result: '98 mEq/L', isAbnormal: false },
      { name: 'Serum Beta-Hydroxybutyrate', result: '6.4 mmol/L (Markedly elevated; normal < 0.5 mmol/L)', isAbnormal: true },
      { name: 'Urine Dipstick', result: 'Glucose 4+, Ketones 4+ (large)', isAbnormal: true }
    ],
    mcqOptions: [
      'Diabetic Ketoacidosis (DKA) with Severe Metabolic Acidosis and Moderate Dehydration',
      'Hyperosmolar Hyperglycemic State (HHS)',
      'Acute Surgical Abdomen (Appendicitis / Peritonitis)',
      'Lactic Acidosis secondary to Septic Shock',
      'Other'
    ],
    goldStandardDiagnosis: 'Diabetic Ketoacidosis (DKA) with Severe Metabolic Acidosis and Moderate Dehydration',
    acceptableAlternativeDiagnoses: [
      'Severe Diabetic Ketoacidosis',
      'DKA triggered by insulin omission and gastroenteritis'
    ],
    differentialDiagnosisKeys: [
      'Hyperglycemic Hyperosmolar State (HHS)',
      'Alcoholic ketoacidosis / starvation ketosis',
      'Acute pancreatitis',
      'Salicylate or toxic alcohol poisoning'
    ],
    redFlagKeys: [
      'Severe acidemia with arterial/venous pH < 7.20 and bicarbonate 8 mEq/L',
      'Altered level of consciousness with potential aspiration risk',
      'Critical intracellular potassium deficit despite normal/high extracellular serum potassium (5.2 mEq/L)'
    ],
    nextManagementStepKey: 'Aggressive isotonic intravenous fluid resuscitation (0.9% Normal Saline 1-1.5 L in the first hour), followed by continuous IV regular insulin infusion (0.1 units/kg/hr) once fluid expansion is underway, with close hourly monitoring of glucose, potassium, and venous blood gases.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Correctly identifies Diabetic Ketoacidosis (DKA) with severe high anion gap acidosis.',
      differentialCriteria: '1.0 mark: Cites HHS, lactic acidosis, acute surgical abdomen, or toxic ingestion.',
      redFlagsCriteria: '1.0 mark: Identifies severe acidosis (pH 7.14), Kussmaul respirations, sensorium depression, and potassium shift risks.',
      nextStepCriteria: '1.0 mark: Prioritizes aggressive fluid rehydration (IV NS) before/concurrent with insulin drip, and potassium monitoring.'
    },
    // FIXED STANDARDIZED AI STIMULUS: CLINICALLY APPROPRIATE (Outcome 1: Sound advice)
    aiStimulus: {
      diagnosis: 'Severe Diabetic Ketoacidosis (DKA) with High Anion Gap Metabolic Acidosis secondary to Insulin Omission.',
      recommendation: 'Initiate immediate intravenous fluid resuscitation with 0.9% Normal Saline at 1,000 mL/hr for the initial 1-2 hours. Begin continuous intravenous regular insulin infusion at 0.1 units/kg/hr (or 0.14 units/kg/hr without bolus) once fluid therapy is initiated and serum potassium is confirmed >= 3.5 mEq/L. Serum potassium is currently 5.2 mEq/L; anticipate rapid decline with insulin therapy and prepare to add potassium chloride (20-30 mEq/L) to maintenance fluids once potassium falls below 5.0 mEq/L. Monitor blood glucose hourly and electrolytes/venous blood gases every 2 hours. Do not administer sodium bicarbonate.',
      clinicalReasoning: 'The triad of hyperglycemia (glucose 462 mg/dL), severe high anion gap metabolic acidosis (pH 7.14, HCO3 8 mEq/L, anion gap 25 mEq/L), and elevated serum beta-hydroxybutyrate (6.4 mmol/L) with 4+ urinary ketones establishes the diagnosis of severe DKA according to international diabetes clinical guidelines.',
      isMisleading: false,
      researcherNote: 'CONTROL: Clinically sound recommendation. Validates appropriate acceptance and standard protocol execution.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-03',
    caseNumber: 3,
    stage: 'ai_simulation',
    domain: 'Emergency Medicine',
    title: 'Sudden Pleuritic Chest Pain, Tachycardia, and Hypoxemia Post-Surgery',
    presentation: 'A 42-year-old female presents to the triage area with sudden-onset sharp right-sided pleuritic chest pain that began 2 hours ago, accompanied by worsening breathlessness, lightheadedness, and an episode of dry coughing.',
    medicalHistory: 'Underwent elective right knee arthroscopic cruciate ligament reconstruction 10 days ago; has been largely sedentary at home with a knee immobilizer. Oral contraceptive pill user for 6 years.',
    vitals: {
      heartRate: '118 bpm (persistent sinus tachycardia)',
      bloodPressure: '108/72 mmHg',
      respiratoryRate: '26 /min',
      spO2: '91% on room air (responsive to 2L O2 with SpO2 95%)',
      temperature: '37.3 °C'
    },
    physicalExamination: 'Patient appears anxious and tachypneic. Auscultation reveals clear breath sounds bilaterally with no rhonchi or wheeze, but an accented pulmonary second heart sound (P2) is noted at the upper left sternal border. Right calf shows mild non-tender edema compared to left.',
    investigations: [
      { name: '12-Lead ECG', result: 'Sinus tachycardia at 118 bpm, S wave in lead I, Q wave in lead III, inverted T wave in lead III (S1Q3T3 pattern), T-wave inversions in V1-V3 (Right ventricular strain)', isAbnormal: true },
      { name: 'Bedside D-Dimer', result: '3,450 ng/mL (Significantly elevated; reference < 500 ng/mL)', isAbnormal: true },
      { name: 'Portable Chest X-ray', result: 'Unremarkable lung fields, no focal consolidation, no pneumothorax, clear costophrenic angles', isAbnormal: false },
      { name: 'High-Sensitivity Troponin T', result: '38 ng/L (Mild elevation; reference < 14 ng/L)', isAbnormal: true }
    ],
    mcqOptions: [
      'Acute Submassive / High-Intermediate Risk Pulmonary Embolism',
      'Musculoskeletal Intercostal Chest Wall Strain with Panic Hyperventilation',
      'Spontaneous Pneumothorax',
      'Atypical Community-Acquired Pneumonia',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Submassive / High-Intermediate Risk Pulmonary Embolism',
    acceptableAlternativeDiagnoses: [
      'Acute Pulmonary Thromboembolism (PE)',
      'Submassive PE with Right Ventricular Strain'
    ],
    differentialDiagnosisKeys: [
      'Acute coronary syndrome (NSTEMI)',
      'Acute pleurisy / pleuritis',
      'Spontaneous pneumothorax',
      'Aortic dissection'
    ],
    redFlagKeys: [
      'Wells score >= 6 (High clinical probability: surgery/immobilization, tachycardia 118 bpm, OCP)',
      'Hypoxemia (SpO2 91%) and ECG right ventricular strain pattern (S1Q3T3 + V1-V3 inversion)',
      'Elevated D-dimer and troponin elevation indicating RV micro-infarction'
    ],
    nextManagementStepKey: 'Immediate therapeutic anticoagulation (e.g., subcutaneous Low Molecular Weight Heparin like Enoxaparin 1 mg/kg or IV unfractionated heparin) while expediting urgent CT Pulmonary Angiography (CTPA) and bedside echocardiogram.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Acute Pulmonary Embolism (PE). 0.0 mark: Accepts musculoskeletal strain, anxiety, or pleurodynia.',
      differentialCriteria: '1.0 mark: Cites pneumothorax, acute coronary syndrome, pneumonia, or pericarditis.',
      redFlagsCriteria: '1.0 mark: Notes tachycardia, hypoxemia, recent orthopedic surgery + OCP (Virchow triad), and S1Q3T3/RV strain.',
      nextStepCriteria: '1.0 mark: Mentions immediate anticoagulation (LMWH/Heparin) and urgent CTPA / bedside echo.'
    },
    // FIXED STANDARDIZED AI STIMULUS: DELIBERATELY MISLEADING (Outcome 2: Diagnostic Anchoring)
    aiStimulus: {
      diagnosis: 'Acute Musculoskeletal Intercostal Chest Wall Strain Exacerbated by Acute Hyperventilation Syndrome.',
      recommendation: 'Reassure the patient that the unremarkable chest radiograph rules out pulmonary consolidation or pneumothorax. Prescribe oral non-steroidal anti-inflammatory therapy (Ibuprofen 400 mg TDS with food) and Paracetamol 1g QDS for thoracic wall discomfort. Recommend diaphragmatic breathing exercises for anxiety-related hyperventilation. The mild D-dimer elevation is an anticipated non-specific postoperative finding secondary to recent knee arthroscopy and does not require vascular imaging or anticoagulation. Safe for outpatient discharge with surgical clinic follow-up.',
      clinicalReasoning: 'Normal bilateral chest auscultation, unremarkable lung fields on radiograph, and localized pleuritic discomfort are classic for musculoskeletal chest wall strain. Post-surgical systemic inflammatory responses routinely elevate D-dimer and inflammatory markers, which represents a well-documented false-positive confounder. Patient shows stable systemic hemodynamics with preserved blood pressure.',
      isMisleading: true,
      misleadingClassification: 'Diagnostic Anchoring',
      researcherNote: 'DELIBERATELY MISLEADING: Anchors on normal X-ray and surgical inflammation, ignoring persistent tachycardia (118), hypoxemia (91%), S1Q3T3 strain, and elevated troponin. Tests if participant detects anchoring bias or blindly accepts safe discharge recommendation.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-04',
    caseNumber: 4,
    stage: 'ai_simulation',
    domain: 'Endocrinology',
    title: 'Profound Hyponatremia, Hyperkalemia, and Refractory Hypotension',
    presentation: 'A 38-year-old female presents to the intensive care step-down unit with a 2-week history of worsening fatigue, generalized muscle weakness, anorexia, postural dizziness, and repeated episodes of vomiting for the past 24 hours.',
    medicalHistory: 'History of Vitiligo and Autoimmune Thyroiditis (Hashimoto) on Levothyroxine 75 mcg daily. Recently treated for an uncomplicated urinary tract infection 3 days ago.',
    vitals: {
      heartRate: '110 bpm (weak, thready)',
      bloodPressure: '82/52 mmHg (supine), unrecordable standing due to presyncope',
      respiratoryRate: '18 /min',
      spO2: '98% on room air',
      temperature: '37.1 °C'
    },
    physicalExamination: 'Hyperpigmentation noted across palmar creases, buccal mucosa, and dental gingival margins. Patient is drowsy but oriented. Heart sounds are distant; lungs are clear bilaterally. Abdomen: Diffuse epigastric tenderness without peritonism.',
    investigations: [
      { name: 'Serum Sodium', result: '118 mEq/L (Severe hyponatremia; reference 135-145)', isAbnormal: true },
      { name: 'Serum Potassium', result: '6.2 mEq/L (Hyperkalemia; reference 3.5-5.0)', isAbnormal: true },
      { name: 'Serum Chloride', result: '86 mEq/L', isAbnormal: true },
      { name: 'Serum Bicarbonate', result: '18 mEq/L (Mild metabolic acidosis)', isAbnormal: true },
      { name: 'Blood Urea Nitrogen', result: '48 mg/dL', isAbnormal: true },
      { name: 'Serum Creatinine', result: '1.6 mg/dL (Prerenal azotemia)', isAbnormal: true },
      { name: 'Random Serum Cortisol (drawn at 09:00 AM in crisis)', result: '2.1 ug/dL (Critically low for acute stress; normal > 18 ug/dL)', isAbnormal: true },
      { name: 'Plasma ACTH', result: '340 pg/mL (Markedly elevated; reference 10-60)', isAbnormal: true },
      { name: 'Urine Sodium', result: '58 mEq/L (Inappropriate renal sodium wasting in setting of hyponatremia)', isAbnormal: true }
    ],
    mcqOptions: [
      'Acute Primary Adrenal Crisis (Addisonian Crisis) with Mineralocorticoid Deficiency',
      'Syndrome of Inappropriate Antidiuretic Hormone Secretion (SIADH)',
      'Severe Dehydration secondary to Acute Infectious Gastroenteritis alone',
      'Hashitoxicosis / Severe Myxedema Coma with Hyponatremia',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Primary Adrenal Crisis (Addisonian Crisis) with Mineralocorticoid Deficiency',
    acceptableAlternativeDiagnoses: [
      'Primary Adrenocortical Insufficiency Crisis',
      'Addisonian Crisis triggered by infection'
    ],
    differentialDiagnosisKeys: [
      'Syndrome of Inappropriate ADH (SIADH - though K+ is typically normal/low, not high)',
      'Salt-wasting nephropathy',
      'Hypovolemic shock from gastrointestinal losses',
      'Secondary adrenal insufficiency (hypopituitarism - usually lacks hyperpigmentation & hyperkalemia)'
    ],
    redFlagKeys: [
      'Refractory hypotension (BP 82/52) unresponsive to standard vasopressors without steroids',
      'Hyperkalemia (6.2 mEq/L) with concurrent severe hyponatremia (118 mEq/L)',
      'Hyperpigmentation denoting primary adrenal failure (elevated POMC/ACTH)',
      'Imminent cardiovascular collapse'
    ],
    nextManagementStepKey: 'Immediate administration of Intravenous Hydrocortisone (100 mg stat IV bolus, followed by 100 mg IV every 6-8 hours or continuous infusion 200 mg/24h) and aggressive fluid resuscitation with 0.9% Normal Saline + 5% Dextrose, without waiting for ACTH stimulation confirmation.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Acute Adrenal Crisis / Addisonian Crisis. 0.0 mark: SIADH or simple gastroenteritis.',
      differentialCriteria: '1.0 mark: Mentions SIADH, salt-wasting, hypopituitarism, or septic shock.',
      redFlagsCriteria: '1.0 mark: Flags hypotension (82/52), hyperkalemia (6.2 mEq/L), severe hyponatremia (118), and mucosal hyperpigmentation.',
      nextStepCriteria: '1.0 mark: Must state IV Hydrocortisone (100mg stat) + IV Normal Saline resuscitation.'
    },
    // FIXED STANDARDIZED AI STIMULUS: DELIBERATELY MISLEADING (Outcome 2: Investigation Inversion)
    aiStimulus: {
      diagnosis: 'Syndrome of Inappropriate Antidiuretic Hormone Secretion (SIADH) Induced by Recent Urinary Infection.',
      recommendation: 'Strict fluid restriction to less than 800 mL per 24 hours. Administer 3% Hypertonic Saline at 30 mL/hr to gradually elevate serum sodium by no more than 6-8 mEq/L over 24 hours to avoid osmotic demyelination syndrome. Discontinue intravenous saline infusions immediately to prevent volume overload. Steroid replacement is contraindicated in the absence of documented hypothalamic-pituitary structural lesion on MRI brain.',
      clinicalReasoning: 'The combination of profound hyponatremia (118 mEq/L) with high urinary sodium excretion (58 mEq/L) in a patient with a recent infection is the classic hallmark of SIADH. In SIADH, fluid administration worsens water retention and exacerbates hypotonicity. Strict fluid restriction is the primary therapeutic pillar.',
      isMisleading: true,
      misleadingClassification: 'Investigation Inversion',
      researcherNote: 'DELIBERATELY MISLEADING: Inverts clinical signs. Severe hyperkalemia (6.2 mEq/L), prerenal azotemia (BUN 48), hypotension (82/52), low cortisol (2.1), and hyperpigmentation directly contradict euvolemic SIADH. Fluid restriction in an adrenal crisis is lethal. Tests if doctor identifies inverted lab interpretation.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'sim-05',
    caseNumber: 5,
    stage: 'ai_simulation',
    domain: 'Infectious Disease',
    title: 'High Fever, Altered Sensorium, Papilledema, and Focal Neurological Signs',
    presentation: 'A 29-year-old male is brought into the acute medical ward in a stuporous state after 24 hours of progressively worsening severe throbbing holocranial headache, rigors, photophobia, high-grade fevers, and two episodes of generalized seizures.',
    medicalHistory: 'Previously healthy. No known chronic illnesses, no history of epilepsy.',
    vitals: {
      heartRate: '56 bpm (relative bradycardia)',
      bloodPressure: '178/104 mmHg (hypertensive with widening pulse pressure)',
      respiratoryRate: '12 /min (irregular, Cheyne-Stokes pattern)',
      spO2: '94% on room air',
      temperature: '39.4 °C'
    },
    physicalExamination: 'Glasgow Coma Scale: 9/15 (E2 V2 M5). Marked nuchal rigidity with positive Kernig and Brudzinski signs. Fundoscopic examination reveals bilateral blurring of optic disc margins with frank papilledema and absent venous pulsations. Right pupil is 5mm, sluggishly reactive to light; left pupil is 3mm, briskly reactive. Right-sided hyperreflexia and right extensor plantar response.',
    investigations: [
      { name: 'Total Leukocyte Count', result: '22,400 /uL (92% neutrophils with band forms)', isAbnormal: true },
      { name: 'C-Reactive Protein', result: '248 mg/L (Markedly elevated; normal < 5 mg/L)', isAbnormal: true },
      { name: 'Serum Procalcitonin', result: '14.2 ng/mL (High risk of invasive bacterial infection)', isAbnormal: true },
      { name: 'Peripheral Blood Smear', result: 'Toxic granulations in neutrophils, no malarial parasites', isAbnormal: true },
      { name: 'Blood Cultures (2 sets)', result: 'Gram-positive diplococci visible on preliminary Gram stain (Pending formal identification)', isAbnormal: true }
    ],
    mcqOptions: [
      'Acute Bacterial Meningitis with Raised Intracranial Pressure and Impending Brainstem Herniation',
      'Acute Herpes Simplex Encephalitis without Mass Effect',
      'Cerebral Malaria with Convulsions',
      'Meningococcal Sepsis without Central Nervous System Hypertension',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Bacterial Meningitis with Raised Intracranial Pressure and Impending Brainstem Herniation',
    acceptableAlternativeDiagnoses: [
      'Acute Purulent Bacterial Meningitis with Severe Intracranial Hypertension',
      'Pneumococcal Meningitis with Cushing Triad and Herniation Threat'
    ],
    differentialDiagnosisKeys: [
      'Acute bacterial brain abscess with rupture / mass effect',
      'Herpes Simplex Virus (HSV) encephalitis',
      'Acute subdural empyema',
      'Tuberculous meningitis with basal exudates and hydrocephalus'
    ],
    redFlagKeys: [
      'Cushing Triad (Hypertension 178/104, bradycardia 56 bpm, irregular breathing) indicating critical raised ICP',
      'Papilledema and anisocoria (right pupil 5mm, sluggish) demonstrating impending uncal/transtentorial herniation',
      'Absolute contraindication to immediate Lumbar Puncture prior to neuroimaging'
    ],
    nextManagementStepKey: 'IMMEDIATELY draw blood cultures and start empiric Intravenous Dexamethasone (10mg IV) and high-dose bactericidal antibiotics (IV Ceftriaxone 2g BD + IV Vancomycin 15-20 mg/kg BD +/- Ampicillin), intubate for airway protection (GCS 9) with hyperventilation/mannitol for ICP control, and perform Urgent Non-Contrast Head CT. DO NOT perform lumbar puncture until head CT confirms absence of brain herniation risk.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Acute Bacterial Meningitis with severely raised ICP / impending herniation.',
      differentialCriteria: '1.0 mark: Mentions brain abscess, HSV encephalitis, subdural empyema, or TB meningitis.',
      redFlagsCriteria: '1.0 mark: Recognizes Cushing triad, papilledema, anisocoria, and the lethal risk of brain herniation.',
      nextStepCriteria: '1.0 mark: Explicitly prioritizes immediate empiric IV antibiotics/steroids + urgent head CT; MUST defer/contraindicate immediate lumbar puncture.'
    },
    // FIXED STANDARDIZED AI STIMULUS: DELIBERATELY MISLEADING (Outcome 2: Harmful Clinical Management)
    aiStimulus: {
      diagnosis: 'Acute Bacterial (Pneumococcal) Meningitis.',
      recommendation: 'Perform immediate bedside diagnostic Lumbar Puncture in the left lateral decubitus position using a 20-gauge spinal needle to obtain CSF cell count, biochemistry, and Gram stain before starting antimicrobial therapy. Administering antibiotics prior to CSF collection sterilizes the cerebrospinal fluid and degrades diagnostic microbiological yield. Withhold systemic corticosteroids and antibiotics until CSF opening pressure and turbidity are visually inspected. Airway intervention is unnecessary as spontaneous respiratory efforts remain present.',
      clinicalReasoning: 'Definitive etiology of acute purulent meningitis requires direct cerebrospinal fluid examination. Sterilizing antibiotics before lumbar puncture reduces CSF culture sensitivity from > 85% to < 50% within hours. Securing the diagnostic lumbar puncture is therefore the paramount clinical priority.',
      isMisleading: true,
      misleadingClassification: 'Harmful Clinical Management',
      researcherNote: 'DELIBERATELY MISLEADING & HARMFUL: Suggests immediate lumbar puncture in a patient with frank papilledema, Cushing triad, and unequal pupils (GCS 9), which creates an acute risk of catastrophic tentorial herniation and death. Also dangerous to withhold empiric antibiotics. Tests if participant recognizes contraindication to AI advice.'
    },
    isPublished: true,
    expertReviewed: true
  },

  // ==========================================
  // POST-AI UNAIDED CASES (1 to 5)
  // (Tests independent clinical reasoning after AI exposure)
  // ==========================================
  {
    id: 'post-01',
    caseNumber: 1,
    stage: 'post_ai',
    domain: 'Cardiology',
    title: 'Palpitations, Syncope, and Wide-Complex Tachycardia',
    presentation: 'A 60-year-old male with an ischemic cardiomyopathy history presents 30 minutes after experiencing sudden onset of racing heart palpitations, dizziness, cold sweating, and a witnessed syncopal collapse lasting 45 seconds while climbing stairs.',
    medicalHistory: 'Previous anterior myocardial infarction 4 years ago with LVEF 30%. Coronary artery bypass graft (CABG). Medications: Bisoprolol 5mg OD, Ramipril 5mg OD, Eplerenone 25mg OD.',
    vitals: {
      heartRate: '182 bpm (rapid, regular)',
      bloodPressure: '82/48 mmHg (hemodynamically unstable)',
      respiratoryRate: '22 /min',
      spO2: '92% on room air',
      temperature: '36.7 °C'
    },
    physicalExamination: 'Patient is diaphoretic, drowsy, answering questions with single words. Jugular venous pulse shows intermittent large "cannon A-waves". S1 has variable intensity; S2 is soft. Lungs: Bilateral fine basal crackles.',
    investigations: [
      { name: '12-Lead ECG', result: 'Regular wide-complex tachycardia at 182 bpm (QRS duration 160 ms); concordance in precordial leads; AV dissociation with capture and fusion beats visible in rhythm strip', isAbnormal: true },
      { name: 'Point-of-Care Glucose', result: '112 mg/dL', isAbnormal: false },
      { name: 'Serum Potassium', result: '3.8 mEq/L', isAbnormal: false },
      { name: 'Serum Magnesium', result: '1.6 mg/dL (Low; reference 1.8-2.4)', isAbnormal: true }
    ],
    mcqOptions: [
      'Unstable Monomorphic Sustained Ventricular Tachycardia (VT)',
      'Supraventricular Tachycardia with Aberrant Conduction (SVT with Aberrancy)',
      'Atrial Fibrillation with Wolff-Parkinson-White Pre-excitation',
      'Sinus Tachycardia with Pre-existing Left Bundle Branch Block',
      'Other'
    ],
    goldStandardDiagnosis: 'Unstable Monomorphic Sustained Ventricular Tachycardia (VT)',
    acceptableAlternativeDiagnoses: [
      'Sustained Ventricular Tachycardia with Hemodynamic Instability',
      'Ischemic Ventricular Tachycardia'
    ],
    differentialDiagnosisKeys: [
      'Supraventricular tachycardia with bundle branch block aberrancy',
      'Antidromic atrioventricular reentrant tachycardia (AVRT)',
      'Torsades de pointes / Polymorphic VT',
      'Hyperkalemia-induced sine wave rhythm'
    ],
    redFlagKeys: [
      'Hemodynamic instability: Hypotension (BP 82/48) with altered mental state',
      'History of structural heart disease / low EF (ischemic cardiomyopathy)',
      'ECG signs of VT: AV dissociation, fusion/capture beats, QRS > 140 ms',
      'High risk of rapid degeneration into ventricular fibrillation and cardiac arrest'
    ],
    nextManagementStepKey: 'Immediate Synchronized Electrical Cardioversion (100J biphasic, escalating to 200J) under brief procedural sedation/analgesia; provide supplemental oxygen, correct hypomagnesemia/potassium, and prepare IV Amiodarone.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Accurately identifies Unstable Sustained Ventricular Tachycardia (VT). 0.0 mark: Diagnoses benign SVT or sinus tachycardia.',
      differentialCriteria: '1.0 mark: Cites SVT with aberrancy, pre-excited AF (WPW), or polymorphic VT.',
      redFlagsCriteria: '1.0 mark: Identifies hypotension (82/48), altered perfusion, low EF history, and AV dissociation.',
      nextStepCriteria: '1.0 mark: States immediate synchronized electrical cardioversion.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-02',
    caseNumber: 2,
    stage: 'post_ai',
    domain: 'Pulmonology',
    title: 'Severe Refractory Hypoxemia Following Severe Lobar Pneumonia',
    presentation: 'A 51-year-old previously healthy female hospitalized for 3 days with severe Streptococcus pneumoniae pneumonia develops sudden worsening dyspnea, agitation, tachypnea, and cyanosis unresponsive to high-flow nasal oxygen.',
    medicalHistory: 'No chronic respiratory disease. Non-smoker. Admitted 72 hours ago; receiving IV Ceftriaxone and Azithromycin.',
    vitals: {
      heartRate: '128 bpm',
      bloodPressure: '112/66 mmHg',
      respiratoryRate: '38 /min (respiratory distress with sternal retractions)',
      spO2: '84% on High-Flow Nasal Cannula (FiO2 0.80 at 50 L/min flow)',
      temperature: '38.8 °C'
    },
    physicalExamination: 'Marked respiratory distress, speaking only in syllables. Bilateral diffuse bronchial breath sounds and extensive inspiratory coarse crackles throughout both middle and lower lung zones. Jugular venous pressure normal (3 cm above sternal angle). No lower extremity edema; heart sounds normal without murmur or S3 gallop.',
    investigations: [
      { name: 'Arterial Blood Gas (on FiO2 0.80)', result: 'pH 7.32, PaCO2 48 mmHg, PaO2 56 mmHg, HCO3- 24 mEq/L (PaO2/FiO2 ratio = 70 mmHg; Severe ARDS)', isAbnormal: true },
      { name: 'Chest Radiograph (AP Portable)', result: 'Bilateral diffuse confluent alveolar infiltrates (white-out) sparing costophrenic angles, normal cardiac size, no pleural effusion', isAbnormal: true },
      { name: 'Bedside Transthoracic Echocardiogram', result: 'Normal left ventricular systolic function (EF 60%), normal left atrial size, no significant valvular regurgitation, IVC collapsibility > 50% (Non-cardiogenic)', isAbnormal: false },
      { name: 'B-Type Natriuretic Peptide (BNP)', result: '68 pg/mL (Normal; reference < 100 pg/mL)', isAbnormal: false }
    ],
    mcqOptions: [
      'Acute Respiratory Distress Syndrome (Severe ARDS, Berlin Criteria)',
      'Acute Cardiogenic Pulmonary Edema / Flash Pulmonary Edema',
      'Massive Pulmonary Embolism',
      'Hospital-Acquired Pleural Effusion / Empyema',
      'Other'
    ],
    goldStandardDiagnosis: 'Acute Respiratory Distress Syndrome (Severe ARDS, Berlin Criteria)',
    acceptableAlternativeDiagnoses: [
      'Severe Acute Respiratory Distress Syndrome',
      'Non-cardiogenic pulmonary edema / ARDS secondary to pneumonia'
    ],
    differentialDiagnosisKeys: [
      'Acute cardiogenic pulmonary edema (decompensated heart failure)',
      'Diffuse alveolar hemorrhage',
      'Acute eosinophilic pneumonia',
      'Massive pulmonary embolism'
    ],
    redFlagKeys: [
      'PaO2/FiO2 ratio = 70 mmHg (Classifies as Severe ARDS under Berlin definition, high mortality)',
      'Failure of high-flow nasal oxygen with severe refractory hypoxemia',
      'Acute onset within 1 week of clinical insult with bilateral opacities not explained by cardiac failure'
    ],
    nextManagementStepKey: 'Immediate endotracheal intubation and lung-protective mechanical ventilation (Low tidal volume 6 mL/kg predicted body weight, plateau pressure < 30 cmH2O, titrated PEEP), with early prone positioning (>= 16 hours/day) and conservative fluid management.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Severe Acute Respiratory Distress Syndrome (ARDS) by Berlin definition.',
      differentialCriteria: '1.0 mark: Cites cardiogenic pulmonary edema, pulmonary embolism, or alveolar hemorrhage.',
      redFlagsCriteria: '1.0 mark: Calculates/identifies PaO2/FiO2 ratio < 100 mmHg, refractory cyanosis, and non-cardiogenic confirmation.',
      nextStepCriteria: '1.0 mark: Specifies lung-protective ventilation (low tidal volume 6mL/kg) and prone positioning.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-03',
    caseNumber: 3,
    stage: 'post_ai',
    domain: 'Obstetrics',
    title: 'Generalized Convulsion in Laboring Parturient',
    presentation: 'A 24-year-old unbooked primigravida at 38 weeks of gestation admitted in early active labor suddenly develops generalized tonic-clonic motor convulsions lasting approximately 90 seconds, followed by post-ictal stertorous respiration.',
    medicalHistory: 'Unbooked pregnancy with no prior antenatal care. Family reports she had swollen face and feet and complained of severe headache and vomiting over the past 12 hours.',
    vitals: {
      heartRate: '116 bpm',
      bloodPressure: '184/120 mmHg (Severe gestational hypertension)',
      respiratoryRate: '20 /min (deep, post-ictal)',
      spO2: '93% on room air',
      temperature: '37.4 °C'
    },
    physicalExamination: 'Patient is stuporous, with tongue bite laceration on lateral border and frothy blood-tinged sputum. 4+ generalized pitting edema involving hands, face, and abdominal wall. Abdomen: Uterus 38 weeks size, contracting 3 in 10 minutes. Cervix is 5 cm dilated, 80% effaced. Fetal heart rate shows persistent bradycardia at 85 bpm.',
    investigations: [
      { name: 'Urinary Catheterization Dipstick', result: 'Protein 4+ (massive proteinuria)', isAbnormal: true },
      { name: 'Capillary Blood Glucose', result: '98 mg/dL (Excludes hypoglycemia)', isAbnormal: false },
      { name: 'Platelet Count', result: '88,000 /uL (Thrombocytopenia)', isAbnormal: true },
      { name: 'Serum Uric Acid', result: '8.4 mg/dL', isAbnormal: true },
      { name: 'Serum Creatinine', result: '1.4 mg/dL', isAbnormal: true }
    ],
    mcqOptions: [
      'Eclampsia (Obstetric Emergency)',
      'Primary Generalized Epilepsy with Status Epilepticus',
      'Intracranial Hemorrhage / Ruptured Arteriovenous Malformation',
      'Hypocalcemic Tetany with Laryngospasm',
      'Other'
    ],
    goldStandardDiagnosis: 'Eclampsia (Obstetric Emergency)',
    acceptableAlternativeDiagnoses: [
      'Intrapartum Eclampsia',
      'Severe Preeclampsia complicated by Eclamptic Seizures'
    ],
    differentialDiagnosisKeys: [
      'Pre-existing seizure disorder / epilepsy triggered by labor',
      'Cerebral venous sinus thrombosis (CVST)',
      'Intracranial hemorrhage / subarachnoid hemorrhage',
      'Amniotic fluid embolism'
    ],
    redFlagKeys: [
      'Active or recurrent eclamptic seizure with aspiration risk and tongue trauma',
      'Severe range blood pressure (184/120 mmHg) with maternal stroke threat',
      'Sustained fetal bradycardia (85 bpm) indicating severe fetal compromise / placental abruption risk'
    ],
    nextManagementStepKey: 'Secure airway in left lateral tilt; administer intravenous Magnesium Sulfate (4g IV over 10-15 min loading dose followed by 1g/hr maintenance infusion; or Pritchard regimen); control severe hypertension with IV Labetalol (20mg IV bolus) or IV Hydralazine; expedite emergent delivery once mother is stabilized.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Accurately identifies Eclampsia.',
      differentialCriteria: '1.0 mark: Cites epilepsy, intracranial hemorrhage, cerebral venous thrombosis, or amniotic fluid embolism.',
      redFlagsCriteria: '1.0 mark: Flags severe BP (184/120), sustained fetal bradycardia (85 bpm), and airway compromise.',
      nextStepCriteria: '1.0 mark: Specifies Magnesium Sulfate protocol (loading + maintenance) + IV antihypertensive (Labetalol/Hydralazine) + delivery planning.'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-04',
    caseNumber: 4,
    stage: 'post_ai',
    domain: 'Neurology',
    title: 'Sudden Thunderclap Headache, Meningism, and Normal Initial CT',
    presentation: 'A 44-year-old male presents to the acute assessment unit 14 hours after the abrupt onset of what he describes as "the worst headache of my life," reaching peak 10/10 intensity within 30 seconds during sexual intercourse. Accompanied by neck stiffness, photophobia, and repeated vomiting.',
    medicalHistory: 'Polycystic Kidney Disease (ADPKD) in father; patient has mild hypertension on Enalapril 10mg OD. Heavy smoker.',
    vitals: {
      heartRate: '68 bpm',
      bloodPressure: '158/94 mmHg',
      respiratoryRate: '16 /min',
      spO2: '99% on room air',
      temperature: '37.6 °C'
    },
    physicalExamination: 'Patient is conscious, alert, lying in a dark room with eyes closed due to photophobia. Cranial nerves: Pupils equal and reactive, no visual field defect, no papilledema. Prominent nuchal rigidity with positive Kernig sign. No focal limb motor or sensory deficit. Plantars bilateral flexor.',
    investigations: [
      { name: 'Non-Contrast Brain CT (Performed 14 hours post-onset)', result: 'No clear subarachnoid blood or hyperdense basal cisterns visualized; subtle questionable fullness in interpeduncular cistern', isAbnormal: false },
      { name: 'Complete Blood Count', result: 'WBC 10,200 /uL, Platelets 220,000 /uL', isAbnormal: false },
      { name: 'Serum Creatinine', result: '1.1 mg/dL', isAbnormal: false }
    ],
    mcqOptions: [
      'Aneurysmal Subarachnoid Hemorrhage (SAH) requiring Diagnostic Lumbar Puncture / CTA',
      'Acute Migraine without Aura',
      'Coital Benign Cephalea',
      'Cervical Musculoskeletal Strain with Occipital Neuralgia',
      'Other'
    ],
    goldStandardDiagnosis: 'Aneurysmal Subarachnoid Hemorrhage (SAH) requiring Diagnostic Lumbar Puncture / CTA',
    acceptableAlternativeDiagnoses: [
      'Subarachnoid Hemorrhage (CT-negative SAH)',
      'Aneurysmal SAH secondary to ruptured intracranial berry aneurysm'
    ],
    differentialDiagnosisKeys: [
      'Reversible Cerebral Vasoconstriction Syndrome (RCVS)',
      'Cervical artery dissection (vertebral / carotid)',
      'Cerebral venous sinus thrombosis',
      'Pituitary apoplexy',
      'Acute meningitis'
    ],
    redFlagKeys: [
      'Thunderclap onset (peak intensity < 1 minute) — cardinal red flag for vascular intracranial catastrophe',
      'Known ADPKD family history (5-10 fold higher prevalence of intracranial saccular berry aneurysms)',
      'False-negative rate of non-contrast CT increases after 6 hours; a normal CT DOES NOT rule out SAH'
    ],
    nextManagementStepKey: 'Perform diagnostic Lumbar Puncture >= 12 hours post-symptom onset to evaluate for CSF xanthochromia (via spectrophotometry) and persistent RBCs across tube 1 and tube 4; proceed directly to CT Angiography (CTA) of cerebral vessels.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Subarachnoid Hemorrhage (SAH) / ruptured berry aneurysm despite negative plain CT.',
      differentialCriteria: '1.0 mark: Mentions RCVS, cervical dissection, cerebral venous thrombosis, or meningitis.',
      redFlagsCriteria: '1.0 mark: Identifies thunderclap timing (< 1 min), ADPKD aneurysm risk, and that normal CT does not exclude SAH.',
      nextStepCriteria: '1.0 mark: Explicitly mandates lumbar puncture for CSF xanthochromia and/or CT Angiography (CTA).'
    },
    isPublished: true,
    expertReviewed: true
  },
  {
    id: 'post-05',
    caseNumber: 5,
    stage: 'post_ai',
    domain: 'Nephrology',
    title: 'Peaked T-Waves, Muscle Weakness, and Severe Hyperkalemia',
    presentation: 'A 66-year-old male with Stage 4 Chronic Kidney Disease is referred to the emergency department after routine nephrology clinic blood tests drawn 2 hours ago show severe electrolyte derangement. He complains of progressive ascending bilateral leg weakness, paresthesia of hands and perioral region, and profound fatigue.',
    medicalHistory: 'Hypertensive Nephrosclerosis (baseline eGFR 22 mL/min). Two days ago, a community physician started him on Spironolactone 25mg OD for ankle edema, and he also took over-the-counter Ibuprofen 400mg TDS for knee pain. Continued on baseline Enalapril 20mg OD.',
    vitals: {
      heartRate: '48 bpm (sinus bradycardia with irregular pauses)',
      bloodPressure: '102/62 mmHg',
      respiratoryRate: '18 /min',
      spO2: '97% on room air',
      temperature: '36.5 °C'
    },
    physicalExamination: 'Patient is conscious, pale, and lethargic. Symmetrical flaccid lower extremity weakness (motor power 3/5 bilaterally) with diminished deep tendon patellar reflexes (+1). S1 and S2 present, bradycardic. Lungs clear.',
    investigations: [
      { name: 'Serum Potassium (Urgent Repeat)', result: '7.6 mEq/L (Critically life-threatening hyperkalemia; reference 3.5-5.0)', isAbnormal: true },
      { name: '12-Lead ECG', result: 'Tall, narrow, peaked "tent-like" T waves across all leads, PR interval prolongation (260 ms), loss of P waves, and wide QRS complex (148 ms) progressing toward a sine-wave pattern', isAbnormal: true },
      { name: 'Serum Sodium', result: '133 mEq/L', isAbnormal: false },
      { name: 'Serum Creatinine', result: '3.8 mg/dL (Acute-on-chronic kidney injury; baseline 2.2 mg/dL)', isAbnormal: true },
      { name: 'Venous Blood Gas', result: 'pH 7.24, HCO3- 14 mEq/L (Metabolic acidosis)', isAbnormal: true }
    ],
    mcqOptions: [
      'Life-Threatening Severe Hyperkalemia with Conduction Abnormality and Cardiac Toxicity',
      'Acute Guillain-Barré Syndrome with Autonomic Dysfunction',
      'Acute Myasthenia Gravis Crisis',
      'Hypokalemic Periodic Paralysis',
      'Other'
    ],
    goldStandardDiagnosis: 'Life-Threatening Severe Hyperkalemia with Conduction Abnormality and Cardiac Toxicity',
    acceptableAlternativeDiagnoses: [
      'Severe Hyperkalemia (K+ 7.6 mEq/L) with Sine Wave ECG',
      'Drug-Induced Severe Hyperkalemia in CKD'
    ],
    differentialDiagnosisKeys: [
      'Guillain-Barré syndrome / acute inflammatory polyradiculoneuropathy',
      'Hypermagnesemic paralysis',
      'Acute coronary syndrome with hyperacute T waves',
      'Hypocalcemic tetany'
    ],
    redFlagKeys: [
      'K+ 7.6 mEq/L with ECG conduction delay (widened QRS, absent P wave, peaked T waves) indicating impending asystole or VF',
      'Ascending motor flaccid weakness mimicking lower motor neuron disease',
      'Lethal polypharmacy combination (ACE inhibitor + Aldosterone antagonist + NSAID in CKD Stage 4)'
    ],
    nextManagementStepKey: 'Immediate intravenous administration of 10% Calcium Gluconate (10 mL IV over 2-3 minutes) or Calcium Chloride to stabilize myocardial cell membrane, followed immediately by shifting agents (10 units IV regular insulin with 50 mL of 50% Dextrose + nebulized Salbutamol), sodium bicarbonate for acidosis, and urgent preparation for emergent hemodialysis.',
    rubric: {
      primaryDiagnosisCriteria: '1.0 mark: Identifies Severe Life-Threatening Hyperkalemia with cardiotoxicity / ECG conduction delay.',
      differentialCriteria: '1.0 mark: Cites Guillain-Barré syndrome, hypermagnesemia, or hyperacute anterior STEMI.',
      redFlagsCriteria: '1.0 mark: Recognizes K+ >= 7.0 with QRS widening / peaked T waves (imminent cardiac arrest) and nephrotoxic drug combination.',
      nextStepCriteria: '1.0 mark: Must state IV Calcium Gluconate (membrane stabilization) as the immediate FIRST step, followed by insulin/dextrose and emergency dialysis.'
    },
    isPublished: true,
    expertReviewed: true
  }
];
