import { PatientRecord, StudentTreatmentPlan } from '../../../types';
import { generateOrthoTreatmentPlan } from '../../../lib/orthoTreatmentPlanEngine';

/**
 * Creates empty or initial Student Treatment Plan object
 */
export function createEmptyStudentPlan(): StudentTreatmentPlan {
  return {
    treatmentModality: '',
    growthModification: '',
    extractionDecision: '',
    applianceSelection: '',
    anchoragePlanning: '',
    biomechanics: '',
    treatmentSequence: '',
    elastics: '',
    tadRequirement: '',
    expansionPlan: '',
    surgicalPlan: '',
    retentionPlan: '',
    estimatedDuration: '',
    prognosis: '',
    patientInstructions: '',
    referencesJustification: '',
    treatmentObjectives: '',
    phase1AlignmentLeveling: '',
    phase2MolarSpaceClosure: '',
    phase3FinishingDetailing: '',
    retentionPhase: '',
  };
}

/**
 * Converts generated Ortho Plan Engine output to StudentTreatmentPlan format
 */
export function convertEnginePlanToStudentPlan(patient: PatientRecord): StudentTreatmentPlan {
  const fullEnginePlan = generateOrthoTreatmentPlan(patient);

  const getSectionText = (key: keyof typeof fullEnginePlan): string => {
    const sec = fullEnginePlan[key];
    if (!sec || !sec.points || sec.points.length === 0) return '';
    return sec.points.map((p) => p.text).join('\n• ');
  };

  const getSinglePoint = (key: keyof typeof fullEnginePlan, fallback = ''): string => {
    const sec = fullEnginePlan[key];
    if (!sec || !sec.points || sec.points.length === 0) return fallback;
    return sec.points[0].text;
  };

  const overjet = patient.intraoralSection?.overjetMm ?? 6.5;

  return {
    treatmentModality: getSinglePoint('treatmentModality', 'Comprehensive Fixed Orthodontic Treatment'),
    growthModification: getSinglePoint('growthModification', 'Not Indicated (Post-pubertal)'),
    extractionDecision: getSinglePoint('extractionDecision', 'Non-Extraction / Arch Expansion & Interproximal Reduction'),
    applianceSelection: getSinglePoint('applianceSelection', '0.022" x 0.028" MBT Prescription Metal Brackets'),
    anchoragePlanning: getSinglePoint('anchoragePlanning', 'Moderate Anchorage (Transpalatal Arch / Nance Appliance)'),
    biomechanics: getSectionText('biomechanics'),
    treatmentSequence: getSectionText('treatmentSequence'),
    elastics: 'Class II / Class III Elastics as needed in finishing phase',
    tadRequirement: 'TADs (Miniscrews) considered for maximum skeletal anchorage if required',
    expansionPlan: getSinglePoint('expansionPlan', 'Slow Maxillary Dentoalveolar Expansion'),
    surgicalPlan: getSinglePoint('orthognathicSurgery', 'Not Indicated (Non-Surgical Case)'),
    retentionPlan: 'Upper Hawley Retainer + Lower 3-3 Fixed Bonded Retainer',
    estimatedDuration: '18 - 24 Months',
    prognosis: 'Good, contingent on patient compliance with elastics and oral hygiene',
    patientInstructions: '1. Maintain strict oral hygiene with orthodontic brush and interdental brushes.\n2. Avoid hard, sticky, or chewy foods.\n3. Wear elastics as instructed for minimum 22 hours/day.',
    referencesJustification:
      '1. Proffit WR, Fields HW, Sarver DM. Contemporary Orthodontics. 6th ed. Elsevier; 2018.\n2. Graber LW, Vanarsdall RL, Vig KW. Orthodontics: Current Principles and Techniques. 6th ed. Mosby; 2017.',
    
    // Proffit-Based Format Defaults
    treatmentObjectives:
      '1. Achieve aesthetic smile arc and improve soft tissue profile.\n' +
      `2. Correct Class II molar and canine relationship and reduce overjet from ${overjet} mm to 2.0 mm.\n` +
      '3. Eliminate upper and lower anterior crowding and level Curve of Spee.\n' +
      '4. Establish coincident dental midlines and stable intercuspation.',

    phase1AlignmentLeveling:
      '• Appliance placement: 0.022" MBT slot pre-adjusted fixed appliance upper & lower arch.\n' +
      '• Initial archwire sequence: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi.\n' +
      '• Alignment strategy: Interproximal reduction (IPR) and arch expansion to relieve crowding.\n' +
      '• Bite opening: Continuous arch leveling with posterior bite blocks if needed for deep bite.\n' +
      '• Leveling mechanics: Progressive engagement of heavy rectangular 0.019" x 0.025" SS archwires.',

    phase2MolarSpaceClosure:
      '• Class II Correction: Class II intermaxillary elastics (3/16", 4.5 oz) for sagittal correction.\n' +
      '• Anchorage Mechanics: Transpalatal arch (TPA) for maxillary molar anchorage control.\n' +
      '• Space closure: Sliding mechanics with NiTi closed coil springs on 0.019" x 0.025" SS.\n' +
      '• TADs: Miniscrews in buccal shelf/infrazygomatic crest if maximum anchorage is required.\n' +
      '• Midline correction & Arch coordination: Asymmetric elastics and coordinated rectangular archwires.',

    phase3FinishingDetailing:
      '• Final detailing: 0.014" Braided SS / 0.016" x 0.022" TMA wires for individual tooth positioning.\n' +
      '• Root Parallelism: Evaluate panoramic radiograph for bracket repositioning.\n' +
      '• Settling Elastics: Triangular settling elastics (1/8", 2.5 oz) for solid intercuspation.\n' +
      '• Torque Corrections: Individual bracket torque adjustments and archwire artistic bends.',

    retentionPhase:
      '• Upper Retainer: Removable Hawley Retainer with anterior labial bow.\n' +
      '• Lower Retainer: Fixed 3-3 canine-to-canine bonded lingual retainer.\n' +
      '• Retention Duration: Full-time wear for 6 months followed by night-time wear indefinitely.\n' +
      '• Follow-up schedule: Check-ups at 1 month, 3 months, 6 months, and 12 months post-debond.',
  };
}

/**
 * Parameter labels, descriptions, and quick-select tags for student guidance
 */
export interface ParameterConfig {
  key: keyof StudentTreatmentPlan;
  title: string;
  stepNumber: number;
  description: string;
  placeholder: string;
  quickTags: string[];
}

export const TREATMENT_PLAN_PARAMETERS: ParameterConfig[] = [
  {
    key: 'treatmentModality',
    title: 'Treatment Modality',
    stepNumber: 1,
    description: 'Select primary therapeutic approach (Fixed, Aligners, Interceptive, Surgical Camouflage)',
    placeholder: 'e.g. Comprehensive Fixed Appliance Therapy, Camouflage Orthodontics, Interceptive Treatment...',
    quickTags: [
      'Comprehensive Fixed Orthodontic Treatment',
      'Orthodontic Camouflage',
      'Interceptive Orthodontics',
      'Clear Aligner Therapy',
      'Surgical Orthodontics (Orthognathic)',
    ],
  },
  {
    key: 'growthModification',
    title: 'Growth Modification Plan',
    stepNumber: 2,
    description: 'Specify dentofacial orthopedics or functional appliance (Twin Block, Reverse Pull Facemask, RME)',
    placeholder: 'e.g. Twin Block appliance during active pubertal peak, Reverse-pull Facemask, or Not Indicated...',
    quickTags: [
      'Twin Block Functional Appliance',
      'Herbst Appliance',
      'Reverse-Pull Facemask (Class III)',
      'Headgear (High-Pull / Cervical)',
      'Not Indicated (Post-pubertal)',
    ],
  },
  {
    key: 'extractionDecision',
    title: 'Extraction / Non-Extraction Decision',
    stepNumber: 3,
    description: 'Specify extraction protocol or non-extraction strategy (IPR, Arch Expansion, Distalization)',
    placeholder: 'e.g. Extract All First Premolars (14, 24, 34, 44) or Non-Extraction with Arch Expansion & IPR...',
    quickTags: [
      'Non-Extraction (Expansion & IPR)',
      'Extract All 1st Premolars (14, 24, 34, 44)',
      'Extract Upper 1st (14, 24) & Lower 2nd Premolars (35, 45)',
      'Asymmetric Extraction',
      'Lower Incisor Extraction',
    ],
  },
  {
    key: 'applianceSelection',
    title: 'Appliance Selection',
    stepNumber: 4,
    description: 'Choose bracket system, slot dimension, and prescription (MBT 0.022", Roth 0.018", Ceramic, Damon)',
    placeholder: 'e.g. 0.022" x 0.028" MBT System Ceramic Brackets upper, Metal lower...',
    quickTags: [
      '0.022" MBT Prescription Brackets',
      '0.018" Roth Prescription Brackets',
      'Damon Self-Ligating System',
      'Esthetic Ceramic Brackets (3-3)',
      'Custom Clear Aligners',
    ],
  },
  {
    key: 'anchoragePlanning',
    title: 'Anchorage Planning',
    stepNumber: 5,
    description: 'Plan anchorage requirements (Maximum, Moderate, Minimum) and anchorage devices (TPA, Nance, TADs)',
    placeholder: 'e.g. Maximum Anchorage using Transpalatal Arch (TPA) & Nance Holding Arch...',
    quickTags: [
      'Maximum Anchorage (TPA + Nance Button)',
      'Moderate Anchorage',
      'Minimum / Interactive Anchorage',
      'Absolute Anchorage (TADs / Miniscrews)',
      'Cervical Headgear Anchorage',
    ],
  },
  {
    key: 'biomechanics',
    title: 'Biomechanics & Force Vectors',
    stepNumber: 6,
    description: 'Detail leveling, space closure method (Friction vs. Frictionless), loop mechanics, torque control',
    placeholder: 'e.g. Leveling with NiTi wires, space closure via sliding mechanics on 0.019x0.025 SS with NiTi springs...',
    quickTags: [
      'Sliding Mechanics (NiTi Coil Springs on 0.019x0.025 SS)',
      'Frictionless Loop Mechanics (TMA retraction loops)',
      'Continuous Archwire Technique',
      'Sectional Arch Biomechanics',
      'Anterior Torque Control Hooks',
    ],
  },
  {
    key: 'treatmentSequence',
    title: 'Step-by-Step Treatment Sequence',
    stepNumber: 7,
    description: 'Chronological phases: Pre-treatment, Bonding, Leveling, Space Closure, Detailing, Debonding',
    placeholder: 'Phase 1: Bonding & Leveling (0.014 NiTi -> 0.018 NiTi -> 0.017x0.025 NiTi)\nPhase 2: Space Closure...\nPhase 3: Finishing & Detailing...',
    quickTags: [
      'Phase 1: Alignment & Leveling (0.014 CuNiTi to 0.019x0.025 SS)',
      'Phase 2: Space Closure & AP Correction',
      'Phase 3: Finishing, Detailing & Arch Matching',
      'Phase 4: Debonding & Immediate Retainer Placement',
    ],
  },
  {
    key: 'elastics',
    title: 'Intermaxillary Elastics Plan',
    stepNumber: 8,
    description: 'Specify elastic types, vector (Class II, Class III, Box, Crossbite, Triangular), diameter & force',
    placeholder: 'e.g. Class II Elastics (1/4", 4.5 oz) 3-6 weeks during space closure; Box elastics for settling...',
    quickTags: [
      'Class II Elastics (1/4" 4.5oz)',
      'Class III Elastics (1/4" 4.5oz)',
      'Vertical Triangular Settling Elastics (3/16")',
      'Crossbite Elastics (3/16" 6oz)',
      'Midline Correction Elastics',
    ],
  },
  {
    key: 'tadRequirement',
    title: 'TAD / Miniscrew Requirement',
    stepNumber: 9,
    description: 'Indicate miniscrew placement sites, diameter, length, and biomechanical purpose (molar intrusion, en-masse retraction)',
    placeholder: 'e.g. 2 Interradicular TADs (1.5mm x 8mm) between 15-16 and 25-26 for maximum en-masse retraction...',
    quickTags: [
      'Not Required',
      'Maxillary Buccal Interradicular TADs (1.5mm x 8mm)',
      'Infrazygomatic Crest (IZC) Miniscrews (2.0mm x 12mm)',
      'Mandibular Buccal Shelf (MBS) Miniscrews',
      'Palatal TAD for Molar Intrusion / Distalization',
    ],
  },
  {
    key: 'expansionPlan',
    title: 'Expansion Plan',
    stepNumber: 10,
    description: 'Define maxillary/mandibular arch expansion protocol (RME, MARPE, Quad Helix, Slow Expansion)',
    placeholder: 'e.g. Rapid Maxillary Expansion (RME) with Hyrax appliance 2 turns/day for 14 days, followed by 3-month retention...',
    quickTags: [
      'Not Required (Arch Width Normal)',
      'Rapid Maxillary Expansion (Hyrax Appliance)',
      'Miniscrew-Assisted RME (MARPE)',
      'Quad Helix Slow Maxillary Expansion',
      'Dentoalveolar Expansion via Archwires',
    ],
  },
  {
    key: 'surgicalPlan',
    title: 'Surgical Plan (If Indicated)',
    stepNumber: 11,
    description: 'Describe orthognathic surgery details if skeletal discrepancy exceeds orthodontic camouflage limits',
    placeholder: 'e.g. Not Indicated OR Bilateral Sagittal Split Osteotomy (BSSO) Mandibular Advancement 6mm + Le Fort I Osteotomy...',
    quickTags: [
      'Not Indicated (Non-Surgical Camouflage)',
      'Maxillary Le Fort I Osteotomy (Impaction / Advancement)',
      'Mandibular BSSO Advancement',
      'Mandibular BSSO Setback',
      'Genioplasty for Chin Augmentation',
    ],
  },
  {
    key: 'retentionPlan',
    title: 'Retention Plan',
    stepNumber: 12,
    description: 'Design retention protocol: Upper appliance, Lower appliance, wear schedule, and duration',
    placeholder: 'e.g. Maxillary Hawley Retainer with anterior labial bow + Mandibular 3-3 Fixed Bonded Lingual Retainer (0.0175" multistrand)...',
    quickTags: [
      'Maxillary Hawley Retainer + Mandibular 3-3 Fixed Bonded Retainer',
      'Dual Essix Vacuum-Formed Clear Retainers',
      'Maxillary & Mandibular Fixed Lingual Wire Retainers (3-3)',
      'Positioner Appliance for Finishing',
      'Begg Retainer with Wrap-around Bow',
    ],
  },
  {
    key: 'estimatedDuration',
    title: 'Estimated Treatment Duration',
    stepNumber: 13,
    description: 'Expected active treatment timeframe in months',
    placeholder: 'e.g. 18 - 24 Months',
    quickTags: ['12 - 18 Months', '18 - 24 Months', '24 - 30 Months', '30 - 36 Months'],
  },
  {
    key: 'prognosis',
    title: 'Prognosis',
    stepNumber: 14,
    description: 'Assessment of predicted clinical result and stability factors',
    placeholder: 'e.g. Excellent / Good prognosis, dependent on patient elastic compliance and oral hygiene maintenance...',
    quickTags: [
      'Excellent (High compliance anticipated)',
      'Good (Satisfactory stability and profile correction)',
      'Fair (Dependent on strict compliance and growth vector)',
      'Guarded (High risk of relapse or root resorption)',
    ],
  },
  {
    key: 'patientInstructions',
    title: 'Patient Instructions & Compliance',
    stepNumber: 15,
    description: 'Dietary restrictions, oral hygiene routines, emergency contact, and elastic wear guidelines',
    placeholder: '1. Avoid hard, sticky, and sugary foods.\n2. Brush with orthodontic toothbrush and interdental brush after every meal.\n3. Wear elastics 22 hours per day...',
    quickTags: [
      'Strict Dietary Guidance (No hard/chewy foods)',
      'Orthodontic Oral Hygiene Protocol (Interdental brushes & Fluoride rinse)',
      '22-Hour Daily Elastic Compliance',
      'Wax application for mucosal irritation',
    ],
  },
  {
    key: 'referencesJustification',
    title: 'References / Clinical Justification (Optional)',
    stepNumber: 16,
    description: 'Postgraduate literature citations or evidence justification for chosen biomechanics and extraction choice',
    placeholder: '1. Proffit WR. Contemporary Orthodontics. 6th ed.\n2. Steiner CC. Cephalometrics for you and me. Am J Orthod 1953...',
    quickTags: [
      'Proffit WR, Fields HW. Contemporary Orthodontics. 6th ed.',
      'Graber LW. Orthodontics: Current Principles and Techniques. 6th ed.',
      'Tweed CH. The Frankfort-mandibular plane angle in orthodontic diagnosis. Am J Orthod 1946.',
      'Kokich VG. Esthetics and anterior tooth position. J Esthet Dent 1993.',
    ],
  },
];
