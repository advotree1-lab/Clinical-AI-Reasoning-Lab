import { ParticipantClinicalCase } from '../types';

/**
 * Participant-safe clinical stimuli for Demo Mode walkthroughs ONLY.
 * Strictly excludes goldStandardDiagnosis, acceptableAlternativeDiagnoses,
 * differentialDiagnosisKeys, redFlagKeys, nextManagementStepKey, rubric,
 * isMisleading, misleadingClassification, and researcherNote.
 */
export const PARTICIPANT_DEMO_CASES: ParticipantClinicalCase[] = [
  {
    id: 'sim-04',
    caseNumber: 1,
    stage: 'ai_simulation',
    domain: 'Endocrinology',
    title: 'Severe hyperglycaemia with altered sensorium, acute kidney injury and electrolyte abnormalities',
    presentation:
      'A 76-year-old male, known to have type 2 diabetes for 20 years, is brought to the emergency department with altered sensorium, fever and progressive weakness for 3 days. He has been passing large volumes of urine initially, followed by markedly reduced urine output.',
    medicalHistory:
      'Poor glycaemic control. Chronic kidney disease. Hypertension. Recently treated urinary tract infection. Taking metformin and an SGLT2 inhibitor.',
    vitals: {
      heartRate: '128/min',
      bloodPressure: '86/54 mmHg',
      respiratoryRate: '28/min',
      spO2: 'Not specified',
      temperature: '38.5°C',
    },
    physicalExamination:
      'GCS: 9/15. Severe dehydration. Dry mucosa. Deep breathing present. No obvious focal neurological deficit.',
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
      { name: 'Urine microscopy', result: 'Pyuria (Blood and urine cultures are pending)', isAbnormal: true },
    ],
    mcqOptions: [
      'Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis-Induced Septic Shock and AKI',
      'Pure Euglycaemic SGLT2-Inhibitor Diabetic Ketoacidosis without Hyperosmolarity',
      'Metformin-Associated Lactic Acidosis Alone without Volume Depletion',
      'Primary Hyponatremic Encephalopathy',
      'Other',
    ],
    aiStimulus: {
      diagnosis: 'Hyperosmolar Hyperglycaemic State (HHS) with Overlap Ketoacidosis, Urosepsis and Hypokalemia.',
      recommendation:
        'Begin immediate intravenous volume resuscitation with 0.9% Normal Saline (1,000 mL over the first hour) to restore intravascular volume and renal perfusion. Hold insulin initially and administer intravenous potassium chloride replacement immediately because serum potassium is 3.1 mEq/L (< 3.3 mEq/L); initiate low-dose IV regular insulin (0.05–0.1 units/kg/hr) only after potassium rises above 3.3–3.5 mEq/L. Draw blood/urine cultures and start empiric broad-spectrum IV antibiotics for urosepsis. Permanently discontinue metformin and the SGLT2 inhibitor.',
      clinicalReasoning:
        'A glucose of 920 mg/dL and serum osmolality of 365 mOsm/kg define severe HHS, accompanied by mild ketosis (BHB 2.5 mmol/L, pH 7.29, HCO₃ 17 mEq/L) and SGLT2i/sepsis overlap. Starting insulin when K⁺ is 3.1 mEq/L risks precipitous life-threatening hypokalemia and cardiac arrest; volume expansion and potassium correction take immediate precedence.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Why delay insulin until potassium is corrected?',
          responseText:
            'Serum potassium is 3.1 mEq/L (< 3.3 mEq/L). Administering insulin before potassium repletion drives extracellular potassium into cells, risking severe life-threatening hypokalaemia and fatal cardiac arrhythmias. Aggressive 0.9% Normal Saline resuscitation and IV potassium chloride replacement must come first.',
        },
        {
          id: 'followup_2',
          promptLabel: 'Which medications need stopping and what infection workup?',
          responseText:
            'Permanently stop metformin (high lactic acidosis risk in AKI with Cr 3.4 mg/dL) and the SGLT2 inhibitor (worsens ketosis and volume depletion). Given fever (38.5°C), hypotension (86/54 mmHg), and pyuria, obtain blood and urine cultures and start empiric broad-spectrum IV antibiotics immediately for urosepsis.',
        },
      ],
    },
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'sim-05',
    caseNumber: 2,
    stage: 'ai_simulation',
    domain: 'Nephrology',
    title: 'Acute gastroenteritis progressing to AKI, thrombocytopenia and neurological dysfunction',
    presentation:
      'A 27-year-old male presents with watery diarrhoea for 5 days, followed by bloody diarrhoea for 2 days, vomiting and abdominal pain. During the last 24 hours, he has developed reduced urine output, increasing weakness and confusion. He reports consuming food from a roadside vendor approximately 1 week before symptom onset.',
    medicalHistory:
      'Consumed food from a roadside vendor approximately 1 week before symptom onset. Additional information released later: The patient develops a generalised seizure during observation.',
    vitals: {
      heartRate: '116/min',
      bloodPressure: '96/62 mmHg',
      respiratoryRate: '24/min',
      spO2: 'Not specified',
      temperature: '38°C',
    },
    physicalExamination:
      'Pallor present. Mild pedal oedema. Petechial spots over both lower limbs. GCS: 13/15. Urine output: 0.2 mL/kg/hour.',
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
      {
        name: 'Peripheral blood smear',
        result: 'Schistocytes present; Polychromasia; Fragmented red blood cells',
        isAbnormal: true,
      },
      {
        name: 'Coagulation profile',
        result: 'PT: Normal; aPTT: Normal; Fibrinogen: Normal',
        isAbnormal: false,
      },
    ],
    mcqOptions: [
      'Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with Severe AKI & CNS Involvement',
      'Disseminated Intravascular Coagulation (DIC) Secondary to Gram-Negative Sepsis',
      'Prerenal Acute Kidney Injury from Simple Dehydration',
      'Immune Thrombocytopenic Purpura (ITP) with Coincidental Viral Gastroenteritis',
      'Other',
    ],
    aiStimulus: {
      diagnosis:
        'Shiga Toxin-Associated Haemolytic Uraemic Syndrome (STEC-HUS) / Thrombotic Microangiopathy with CNS Involvement and Severe AKI.',
      recommendation:
        'Manage acute generalised seizure with IV lorazepam and protect the airway. Immediately obtain a 12-lead ECG and treat hyperkalemia (K⁺ 6.1 mEq/L) with IV calcium gluconate (if conduction abnormalities) plus IV insulin-dextrose, and arrange urgent nephrology evaluation for haemodialysis given oliguria (0.2 mL/kg/hr) and creatinine 4.6 mg/dL. Send stool testing for Shiga toxin-producing E. coli and check ADAMTS13 activity to exclude TTP. Avoid routine platelet transfusions (which can worsen microvascular thrombosis) and avoid antimotility agents or empiric antibiotics for suspected STEC.',
      clinicalReasoning:
        'The triad of microangiopathic haemolytic anaemia (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L, elevated indirect bilirubin), thrombocytopenia (48,000/mm³), and severe acute kidney injury (Cr 4.6 mg/dL) following bloody diarrhoea establishes thrombotic microangiopathy (STEC-HUS). Normal PT, aPTT, and fibrinogen exclude consumptive coagulopathy (DIC). CNS involvement (seizure) indicates severe TMA requiring urgent supportive care and dialysis readiness.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'How do you distinguish this from DIC or TTP?',
          responseText:
            'Normal PT, aPTT, and fibrinogen effectively rule out consumptive coagulopathy (DIC). The triad of MAHA (Hb 7.8 g/dL, schistocytes, LDH 1,450 U/L), thrombocytopenia (48,000/mm³), and oliguric AKI (Cr 4.6 mg/dL) after bloody diarrhoea points to STEC-HUS; check ADAMTS13 activity alongside stool Shiga toxin testing to exclude TTP.',
        },
        {
          id: 'followup_2',
          promptLabel: 'What urgent actions and contraindications apply?',
          responseText:
            'Stabilize the generalised seizure with IV lorazepam, obtain an ECG and urgently treat hyperkalaemia (K⁺ 6.1 mEq/L) with IV calcium gluconate plus insulin-dextrose, and arrange urgent nephrology haemodialysis. Avoid routine platelet transfusions, antimotility agents, and empiric antibiotics for suspected STEC.',
        },
      ],
    },
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'sim-01',
    caseNumber: 3,
    stage: 'ai_simulation',
    domain: 'Cardiology',
    title: 'Chest pain with an initially inconclusive ECG',
    presentation:
      'A 64-year-old male with diabetes, chronic kidney disease and dyslipidaemia presents with epigastric discomfort, nausea and sweating for 5 hours. He denies typical chest pain.',
    medicalHistory: 'Diabetes, chronic kidney disease and dyslipidaemia.',
    vitals: {
      heartRate: '110/min',
      bloodPressure: '104/68 mmHg',
      respiratoryRate: '26/min',
      spO2: '91%',
      temperature: 'Not specified',
    },
    physicalExamination: 'Bilateral basal crepitations.',
    investigations: [
      {
        name: 'Initial ECG',
        result: 'ST depression in V1–V3; Tall R waves in V2–V3; Upright T waves in V1–V3',
        isAbnormal: true,
      },
      { name: 'Initial troponin', result: 'Borderline elevated', isAbnormal: true },
      { name: 'Repeat troponin after 2 hours', result: 'Significant rise', isAbnormal: true },
      {
        name: 'Echocardiography',
        result: 'Regional posterior wall hypokinesia and LVEF of 35%',
        isAbnormal: true,
      },
    ],
    clinicalImages: [
      {
        id: 'img-case-02',
        url: '/assets/cases/case-02-ecg.jpg',
        title: '',
      },
    ],
    mcqOptions: [
      'Acute True Posterior Wall STEMI (STEMI Equivalent) with Left Ventricular Dysfunction',
      'Acute Peptic Ulcer Disease / Gastritis with CKD-Related Baseline Troponin Elevation',
      'Stable Angina without Acute Coronary Occlusion',
      'Acute Pancreatitis with Demand Ischemia',
      'Other',
    ],
    aiStimulus: {
      diagnosis: 'Acute Peptic Gastritis with Chronic Kidney Disease-Related Non-Ischemic Troponin Elevation.',
      recommendation:
        'Initiate intravenous pantoprazole 40 mg and antiemetic therapy (ondansetron 4 mg IV) for acute epigastric discomfort and nausea. Since the patient denies typical chest pain and the 12-lead ECG demonstrates only anterior ST-segment depression without classic ST-segment elevation, emergent cardiac catheterization is unnecessary. Mildly elevated cardiac troponin is an expected finding in chronic kidney disease due to impaired renal clearance. Admit to general medical ward for upper GI endoscopy evaluation and routine diuretic therapy for mild fluid overload.',
      clinicalReasoning:
        'Absence of classic substernal chest pain and lack of ST-segment elevation on standard precordial leads make acute transmural myocardial infarction unlikely. Epigastric symptoms paired with known CKD commonly produce false-positive baseline troponin elevations and non-specific repolarization changes.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'How do you interpret the ECG and serial troponin rise?',
          responseText:
            'The ECG demonstrates ST depression in V1–V3 without ST-segment elevation in any standard lead, arguing against acute transmural infarction. In chronic kidney disease, impaired renal clearance frequently causes persistent or fluctuating borderline troponin elevations alongside non-specific repolarization changes, so a 2-hour rise alone does not confirm acute coronary occlusion.',
        },
        {
          id: 'followup_2',
          promptLabel: 'What monitoring and alternative workup do you advise?',
          responseText:
            'Monitor epigastric symptom relief following IV pantoprazole 40 mg and antiemetics, maintain supplemental oxygen for SpO₂ 91%, and administer low-dose loop diuretics for mild basal fluid overload. Proceed with elective upper GI endoscopy and routine outpatient cardiology follow-up rather than urgent cardiac catheterization.',
        },
      ],
    },
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'sim-02',
    caseNumber: 4,
    stage: 'ai_simulation',
    domain: 'Neurology',
    title: 'Acute hemiplegia with diagnostic and therapeutic uncertainty',
    presentation:
      'A 71-year-old female is brought to the emergency department with sudden-onset left-sided weakness, facial deviation and inability to speak. She was last seen normal at 10 PM. She was found symptomatic at 6 AM.',
    medicalHistory:
      'Past history: Atrial fibrillation, hypertension, type 2 diabetes, chronic kidney disease. She is taking apixaban, but the family is unsure about the last dose. Additional information: The family subsequently confirms that the patient took apixaban approximately 10 hours before symptom discovery.',
    vitals: {
      heartRate: '116/min, irregularly irregular',
      bloodPressure: '198/112 mmHg',
      respiratoryRate: 'Not specified',
      spO2: 'Not specified',
      temperature: 'Not specified',
    },
    physicalExamination:
      'GCS: 13/15. Left facial weakness. Left upper limb power: 0/5. Left lower limb power: 1/5. Left-sided neglect. Rightward gaze preference. NIHSS: 18.',
    investigations: [
      { name: 'Blood glucose', result: '58 mg/dL', isAbnormal: true },
      {
        name: 'After glucose correction',
        result: '132 mg/dL (Neurological deficits persist)',
        isAbnormal: true,
      },
      { name: 'Non-contrast CT brain', result: 'No intracranial haemorrhage', isAbnormal: false },
      {
        name: 'CT angiography',
        result: 'Right middle cerebral artery M1 occlusion',
        isAbnormal: true,
      },
      {
        name: 'CT perfusion',
        result: 'Small infarct core with substantial surrounding potentially salvageable tissue',
        isAbnormal: true,
      },
      { name: 'Creatinine', result: '1.9 mg/dL', isAbnormal: true },
    ],
    clinicalImages: [
      {
        id: 'img-case-03',
        url: '/assets/cases/case-03-neuro-imaging.jpg',
        title: 'Brain Imaging Panel A–F',
        caption:
          'CT brain, CT angiography, DWI, and cerebral angiography (A–F) corresponding to acute right middle cerebral artery M1 occlusion.',
      },
    ],
    mcqOptions: [
      'Acute Right MCA M1 Cardioembolic Ischaemic Stroke (Candidate for Mechanical Thrombectomy; Contraindicated for IV Thrombolysis)',
      'Acute Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis (Alteplase / Tenecteplase)',
      'Hypoglycaemic Hemiplegia / Post-Hypoglycaemic Todd Paralysis',
      'Acute Spontaneous Intracerebral Haemorrhage',
      'Other',
    ],
    aiStimulus: {
      diagnosis: 'Acute Right Middle Cerebral Artery Ischaemic Stroke Eligible for Immediate Intravenous Thrombolysis.',
      recommendation:
        'Administer immediate intravenous Alteplase (0.9 mg/kg) or Tenecteplase (0.25 mg/kg) as non-contrast CT brain shows no intracranial haemorrhage and CT perfusion confirms salvageable penumbral tissue. Rapidly reduce blood pressure to below 140/85 mmHg using an intravenous nitroprusside or nicardipine infusion before bolus administration. Because the exact time of stroke onset could have been shortly before 6 AM, systemic fibrinolysis takes priority over awaiting endovascular thrombectomy suite preparation.',
      clinicalReasoning:
        'With absence of haemorrhage on NCCT and favourable perfusion mismatch, systemic IV thrombolysis achieves rapid recanalization. A single apixaban dose 10 hours prior in a patient without active bleeding can be overridden given high NIHSS (18) and large-vessel ischaemic burden.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Is IV thrombolysis safe given apixaban 10 hours ago?',
          responseText:
            'Non-contrast CT brain shows no intracranial haemorrhage, and CT perfusion demonstrates a small infarct core with substantial salvageable penumbra. Given the severe disabling deficit (NIHSS 18) and uncertain exact onset prior to 6 AM, systemic IV thrombolysis should not be withheld solely for a single reported apixaban dose ~10 hours prior.',
        },
        {
          id: 'followup_2',
          promptLabel: 'Why lower blood pressure below 140/85 mmHg?',
          responseText:
            'Rapidly reducing blood pressure below 140/85 mmHg with intravenous nicardipine or nitroprusside prior to thrombolytic bolus lowers peri-infarct reperfusion haemorrhage risk while maximizing systemic fibrinolytic safety.',
        },
      ],
    },
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'sim-03',
    caseNumber: 5,
    stage: 'ai_simulation',
    domain: 'Pulmonology',
    title: 'Severe acute asthma with an unexpected deterioration',
    presentation:
      'A 29-year-old female with longstanding bronchial asthma presents with severe breathlessness following an upper respiratory tract infection. She has been using her salbutamol inhaler every 20–30 minutes for the last 6 hours.',
    medicalHistory:
      'Longstanding bronchial asthma; recent upper respiratory tract infection; using salbutamol inhaler every 20–30 minutes for the last 6 hours. Additional information: After repeated nebulization, oxygen saturation improves to 94%, but tachypnoea persists. Wheezing has become less prominent.',
    vitals: {
      heartRate: '142/min',
      bloodPressure: '126/82 mmHg',
      respiratoryRate: '38/min',
      spO2: '88% on room air',
      temperature: 'Not specified',
    },
    physicalExamination:
      'Unable to speak complete sentences. Accessory muscle use present. Initially widespread wheezing. Subsequently, very poor air entry bilaterally with minimal wheeze. Patient appears increasingly exhausted.',
    investigations: [
      { name: 'pH', result: '7.28', isAbnormal: true },
      { name: 'PaCO₂', result: '48 mmHg', isAbnormal: true },
      { name: 'PaO₂', result: '58 mmHg', isAbnormal: true },
      { name: 'HCO₃', result: '22 mEq/L', isAbnormal: false },
      { name: 'Lactate', result: '5.1 mmol/L', isAbnormal: true },
      { name: 'Potassium', result: '2.9 mEq/L', isAbnormal: true },
    ],
    clinicalImages: [
      {
        id: 'img-case-05',
        url: '/assets/cases/case-05-cxr.jpg',
        title: 'Chest X-ray — AP (a) and Lateral (b)',
      },
    ],
    mcqOptions: [
      'Life-Threatening / Near-Fatal Acute Asthma Exacerbation with Silent Chest and Hypercapnic Respiratory Failure',
      'Resolving Acute Asthma Exacerbation Responding Well to Bronchodilator Therapy',
      'Acute Pneumothorax Secondary to Barotrauma',
      'Panic-Induced Hyperventilation with Salbutamol-Induced Sinus Tachycardia',
      'Other',
    ],
    aiStimulus: {
      diagnosis: 'Resolving Acute Asthma Exacerbation with Expected Post-Bronchodilator Response.',
      recommendation:
        'Continue routine intermittent salbutamol nebulization every 4 hours and observe in the general emergency observation ward. The reduction in audible wheezing alongside improved pulse oximetry (SpO₂ 94%) confirms progressive relief of bronchospasm. A PaCO₂ of 48 mmHg reflects mild compensatory hypoventilation during recovery and does not warrant intensive care transfer or airway intervention. Repeat arterial blood gas in 4 hours and consider step-down to oral therapy once respiratory rate settles.',
      clinicalReasoning:
        'Improvement of SpO₂ from 88% to 94% with concurrent reduction of widespread expiratory wheezes indicates favourable bronchodilator responsiveness. Mildly elevated lactate (5.1 mmol/L) and borderline low potassium (2.9 mEq/L) are benign transient pharmacologic effects of frequent beta-2 agonist use.',
      followUpSuggestions: [
        {
          id: 'followup_1',
          promptLabel: 'Why are wheezing and PaCO₂ changing this way?',
          responseText:
            'Less prominent expiratory wheezing alongside improved SpO₂ (88% to 94%) indicates partial relief of bronchospasm after repeated nebulization. A PaCO₂ of 48 mmHg with pH 7.28 reflects mild transitional hypoventilation and respiratory muscle relaxation rather than acute deterioration.',
        },
        {
          id: 'followup_2',
          promptLabel: 'Are elevated lactate and K⁺ 2.9 mEq/L concerning?',
          responseText:
            'A serum lactate of 5.1 mmol/L and potassium of 2.9 mEq/L are expected, transient beta-2 adrenergic effects resulting from frequent salbutamol inhaler use over 6 hours. Continue 4-hourly nebulizations in the observation unit and repeat ABG in 4 hours.',
        },
      ],
    },
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-01',
    caseNumber: 1,
    stage: 'post_ai',
    domain: 'Cardiology',
    title: 'Acute coronary syndrome with hemodynamic instability and diagnostic complexity',
    presentation:
      'A 59-year-old male, known diabetic for 15 years and hypertensive for 10 years, presents to the emergency department with severe central chest pain for 3 hours. Pain radiates to the back and right shoulder and is associated with sweating, nausea, and two episodes of vomiting. His family reports that he had complained of unusual fatigue and exertional breathlessness for the preceding 2 weeks.',
    medicalHistory:
      'Known diabetic for 15 years and hypertensive for 10 years. Unusual fatigue and exertional breathlessness for the preceding 2 weeks.',
    vitals: {
      heartRate: '48/min, regular',
      bloodPressure: '82/56 mmHg',
      respiratoryRate: '24/min',
      spO2: '94% on room air',
      temperature: 'Not specified',
    },
    physicalExamination:
      'JVP: Elevated. Extremities: Cold and clammy. CVS: S1 and S2 audible, no obvious murmur. Respiratory system: Bilateral lungs clear. Urine output: 15 mL/hour.',
    investigations: [
      { name: 'Hb', result: '12.8 g/dL', isAbnormal: false },
      { name: 'TLC', result: '13,800/mm³', isAbnormal: true },
      { name: 'Creatinine', result: '1.8 mg/dL', isAbnormal: true },
      { name: 'Potassium', result: '5.2 mEq/L', isAbnormal: true },
      { name: 'Troponin I', result: 'Elevated', isAbnormal: true },
      { name: 'Lactate', result: '3.8 mmol/L', isAbnormal: true },
      { name: 'Blood glucose', result: '246 mg/dL', isAbnormal: true },
      {
        name: 'ECG',
        result:
          'ST elevation in leads II, III and aVF, with reciprocal changes in leads I and aVL, consistent with inferior STEMI',
        isAbnormal: true,
      },
    ],
    clinicalImages: [
      {
        id: 'img-case-01',
        url: '/assets/cases/case-01-ecg.jpg',
        title: '',
      },
    ],
    mcqOptions: [
      'Acute Inferior Wall STEMI with Right Ventricular Myocardial Infarction (RVMI) and Cardiogenic Shock',
      'Acute Aortic Dissection Involving the Ascending Aorta Alone',
      'Acute Inferior Wall STEMI with Left Ventricular Failure and Flash Pulmonary Edema',
      'Inferior Wall STEMI with Acute Mechanical Ventricular Septal Rupture',
      'Other',
    ],
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-02',
    caseNumber: 2,
    stage: 'post_ai',
    domain: 'Neurology',
    title: 'Hemiplegia with fever, altered sensorium and atypical imaging',
    presentation:
      'A 42-year-old male presents with fever for 8 days, progressive headache, vomiting and altered behaviour. During the last 12 hours, he developed right-sided weakness and difficulty speaking.',
    medicalHistory: 'No known hypertension or diabetes. Recent untreated dental infection. No history of trauma.',
    vitals: {
      heartRate: '112/min',
      bloodPressure: '110/70 mmHg',
      respiratoryRate: 'Not specified',
      spO2: 'Not specified',
      temperature: '39°C',
    },
    physicalExamination:
      'GCS: 11/15. Neck stiffness present. Right-sided hemiparesis. Bilateral papilloedema suspected.',
    investigations: [
      { name: 'TLC', result: '19,000/mm³', isAbnormal: true },
      { name: 'CRP', result: 'Markedly elevated', isAbnormal: true },
      {
        name: 'CT brain',
        result: 'Left frontal hypodense lesion with surrounding oedema and mass effect',
        isAbnormal: true,
      },
      {
        name: 'CT brain (detailed & contrast imaging)',
        result:
          'Complex, multilocular hypodense left frontal lesion with surrounding marked vasogenic oedema, mass effect and midline shift to the right; contrast imaging shows prominent ring enhancement with an atypical shape',
        isAbnormal: true,
      },
      { name: 'Blood cultures', result: 'Pending', isAbnormal: false },
    ],
    clinicalImages: [
      {
        id: 'img-case-04',
        url: '/assets/cases/case-04-ct-slices.jpg',
        title: '',
      },
    ],
    mcqOptions: [
      'Pyogenic Brain Abscess (Left Frontal Lobe, Odontogenic Source) with Raised Intracranial Pressure',
      'Necrotic High-Grade Glioma (Glioblastoma) with Tumour-Associated Fever / Necrosis and Perilesional Oedema',
      'Acute Bacterial Meningitis Complicated by Focal Cerebritis / Early Venous Sinus Thrombosis and Raised ICP',
      'Suppurative Intracranial Mass (Subdural Empyema vs. Left Frontal Abscess) with Impending Herniation',
    ],
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-03',
    caseNumber: 3,
    stage: 'post_ai',
    domain: 'Pulmonology',
    title: 'Breathlessness in a patient labelled as bronchial asthma',
    presentation:
      'A 35-year-old male with a previous diagnosis of bronchial asthma presents with sudden severe breathlessness and chest tightness. He has failed to improve after repeated bronchodilator treatment.',
    medicalHistory: 'Previous diagnosis of bronchial asthma. Failed to improve after repeated bronchodilator treatment.',
    vitals: {
      heartRate: '136/min',
      bloodPressure: '92/60 mmHg',
      respiratoryRate: '34/min',
      spO2: '89%',
      temperature: 'Not specified',
    },
    physicalExamination:
      'Markedly reduced air entry on the right side. Hyperresonance on right hemithorax. Trachea appears shifted to the left.',
    investigations: [
      { name: 'ABG', result: 'Hypoxaemia and respiratory acidosis', isAbnormal: true },
    ],
    clinicalImages: [
      {
        id: 'img-case-06',
        url: '/assets/cases/case-06-cxr.jpg',
        title: 'Chest X-ray — Thorax AP (Case 6)',
        caption: 'Anteroposterior chest radiographs corresponding to acute respiratory distress presentation.',
      },
    ],
    mcqOptions: [
      'Right-Sided Tension Pneumothorax (with Obstructive Shock and Respiratory Acidosis)',
      'Severe Acute Asthma Exacerbation / Barotrauma-Induced Tension Pneumothorax with Decompensated Respiratory Acidosis',
      'Acute Massive Pulmonary Embolism with Obstructive Shock and Bronchospasm / Hypoxaemia',
      'Status Asthmaticus Complicated by Severe Dynamic Hyperinflation and Circulatory Collapse',
    ],
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-04',
    caseNumber: 4,
    stage: 'post_ai',
    domain: 'Endocrinology',
    title: 'Hypothyroidism presenting as a multisystem emergency',
    presentation:
      'A 68-year-old female is brought by her relatives with progressive drowsiness, confusion, swelling of the face and generalised weakness for 5 days. She has a history of hypothyroidism but stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.',
    medicalHistory:
      'History of hypothyroidism; stopped taking medication 8 months ago. Three days before admission, she developed fever and cough.',
    vitals: {
      heartRate: '42/min',
      bloodPressure: '82/48 mmHg',
      respiratoryRate: '9/min',
      spO2: '86% on room air',
      temperature: '33.5°C',
    },
    physicalExamination:
      'GCS: 8/15. Puffy face. Non-pitting oedema. Dry, coarse skin. Delayed relaxation of deep tendon reflexes. Reduced breath sounds at both lung bases.',
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
      { name: 'ECG', result: 'Sinus bradycardia and low-voltage complexes', isAbnormal: true },
    ],
    mcqOptions: [
      'Myxoedema Coma Precipitated by Lower Respiratory Tract Infection / Pneumonia',
      'Severe Pneumonia with Septic Shock, Hypercapnic Respiratory Failure, and Decompensated Hypothyroidism',
      'Hypothyroid Pericardial Effusion / Tamponade Physiology with Hypoventilation and Sepsis',
      'Decompensated Hypothyroidism with Severe Hypo-Osmolar Hyponatremia and Hypoglycaemic Encephalopathy',
    ],
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-05',
    caseNumber: 5,
    stage: 'post_ai',
    domain: 'Endocrinology / Cardiology',
    title: 'Hyperthyroidism with cardiovascular collapse and multiorgan dysfunction',
    presentation:
      'A 34-year-old female with a history of untreated hyperthyroidism presents to the emergency department with high-grade fever, severe agitation, vomiting, diarrhoea and palpitations for 2 days. She reports progressive weight loss over 6 months and admits to stopping her antithyroid medication 3 months ago.',
    medicalHistory:
      'Untreated hyperthyroidism; stopped antithyroid medication 3 months ago; progressive weight loss over 6 months. Additional information: The patient received an initial dose of beta-blocker at another healthcare facility, and her BP subsequently decreased to 76/48 mmHg.',
    vitals: {
      heartRate: '168/min, irregularly irregular',
      bloodPressure: '94/60 mmHg (dropped to 76/48 mmHg after beta-blocker)',
      respiratoryRate: '30/min',
      spO2: '93%',
      temperature: '40.2°C',
    },
    physicalExamination:
      'Diffuse goitre with bruit. Bilateral exophthalmos. Fine tremors. Jaundice. Bilateral basal crepitations. Agitated and disoriented behaviour.',
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
      { name: 'Echocardiography', result: 'Global hypokinesia with LVEF of 25%', isAbnormal: true },
    ],
    mcqOptions: [
      'Thyroid Storm with Thyrotoxic Cardiomyopathy, Cardiogenic Shock (Beta-Blocker-Induced Collapse), and Multiorgan Dysfunction',
      'Septic Shock with Thyrotoxicosis / Precipitated Thyroid Storm and Acute Congestive Hepatopathy',
      'Decompensated Thyrotoxic Atrial Fibrillation with Tachycardia-Induced / Thyrotoxic Cardiomyopathy and Cardiogenic Shock',
      'Acute Hepatic / Biliary Sepsis with Stress-Induced Cardiomyopathy and Uncontrolled Hyperthyroidism',
    ],
    isPublished: true,
    expertReviewed: true,
  },
  {
    id: 'post-06',
    caseNumber: 6,
    stage: 'post_ai',
    domain: 'Nephrology / Critical Care',
    title: 'Severe dehydration with AKI and persistent shock despite fluid resuscitation',
    presentation:
      'A 51-year-old male presents with profuse watery diarrhoea and repeated vomiting for 4 days. He is brought to the emergency department in a state of shock.',
    medicalHistory:
      'Profuse watery diarrhoea and repeated vomiting for 4 days. Absent urine output for 8 hours. After initial fluid resuscitation, BP improves to 94/60 mmHg, but urine output remains negligible. Six hours later: Creatinine 4.5 mg/dL, Potassium 5.8 mEq/L, persistent metabolic acidosis, and new pulmonary crackles.',
    vitals: {
      heartRate: '138/min',
      bloodPressure: '72/40 mmHg (94/60 mmHg post-fluids)',
      respiratoryRate: '32/min',
      spO2: '94%',
      temperature: '37.2°C',
    },
    physicalExamination:
      'Dry mucous membranes. Sunken eyes. Cold extremities. Absent urine output for 8 hours. Six hours post-resuscitation: New pulmonary crackles.',
    investigations: [
      { name: 'Hb', result: '16.8 g/dL', isAbnormal: true },
      { name: 'Creatinine', result: '3.8 mg/dL initially → 4.5 mg/dL at 6 hours', isAbnormal: true },
      { name: 'Urea', result: '128 mg/dL', isAbnormal: true },
      { name: 'Sodium', result: '158 mEq/L', isAbnormal: true },
      { name: 'Potassium', result: '2.7 mEq/L initially → 5.8 mEq/L at 6 hours', isAbnormal: true },
      { name: 'Chloride', result: '126 mEq/L', isAbnormal: true },
      { name: 'HCO₃', result: '11 mEq/L', isAbnormal: true },
      { name: 'Lactate', result: '6.0 mmol/L', isAbnormal: true },
    ],
    mcqOptions: [
      'Severe Hypovolemic Shock Progressing to Intrinsic AKI (Ischaemic Acute Tubular Necrosis) with Fluid Overload, Refractory Acidosis and Hyperkalemia',
      'Hypovolemic / Septic Gastrointestinal Shock with Hypernatremic Dehydration and Persistent Prerenal Oliguria',
      'Acute-on-Chronic / Severe Intrinsic AKI Complicated by Iatrogenic Volume Overload, Hyperkalemia (5.8 mEq/L), and High-Anion/Lactic Acidosis',
      'Decompensated Gastrointestinal Shock with Resuscitation-Associated Pulmonary Oedema and Mixed Metabolic Acidosis',
    ],
    isPublished: true,
    expertReviewed: true,
  },
];
