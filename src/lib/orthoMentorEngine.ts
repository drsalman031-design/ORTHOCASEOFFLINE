import { PatientRecord } from '../types';

export interface VivaQuestion {
  id: string;
  level: 'Basic' | 'Intermediate' | 'Advanced (Postgraduate)';
  question: string;
  hint: string;
  modelAnswer: string;
  keyConcepts: string[];
}

export interface SelfAssessmentQuestion {
  id: string;
  question: string;
  guidance: string;
  evidencePoints: string[];
}

export interface TreatmentOption {
  title: string;
  modality: string;
  indications: string[];
  advantages: string[];
  limitations: string[];
  levelOfEvidence: string;
  clinicalConsiderations: string;
}

export interface CommonMistakeItem {
  mistake: string;
  impact: string;
  preventionStrategy: string;
}

export interface MentorModuleData {
  module1CaseDiscussion: {
    overview: string;
    interrelationships: { findingA: string; findingB: string; clinicalEffect: string }[];
    synthesisParagraph: string;
  };
  module2DiagnosticReasoning: {
    summary: string;
    diagnosticJustifications: { diagnosis: string; rationale: string; clinicalSignificance: string }[];
  };
  module3ClinicalCorrelation: {
    correlations: { diagnosisItem: string; clinicalManifestation: string; physiologicalExplanation: string }[];
  };
  module4DifferentialDiagnosis: {
    differentialItems: {
      alternativeDiagnosis: string;
      whyConsidered: string;
      whyExcluded: string;
      supportingEvidenceForFinal: string;
    }[];
  };
  module5TreatmentObjectives: {
    prioritizedObjectives: { priority: number; objective: string; drivingFindings: string; importance: string }[];
  };
  module6TreatmentOptions: {
    options: TreatmentOption[];
    mentorRecommendationSummary: string;
  };
  module7RiskAnalysis: {
    risks: { category: string; riskDescription: string; mitigatingStrategy: string; level: 'Low' | 'Moderate' | 'High' }[];
  };
  module8EvidenceBasedLearning: {
    principles: { concept: string; referenceSource: string; applicationToCase: string }[];
  };
  module9ClinicalPearls: string[];
  module10CommonMistakes: CommonMistakeItem[];
  module11VivaPreparation: VivaQuestion[];
  module12SelfAssessment: SelfAssessmentQuestion[];
  module13FacultyNotes: {
    presentationHighlights: string[];
    teachingPoints: string[];
    discussionTopics: string[];
    clinicalControversies: string[];
  };
}

export function generateOrthoMentorData(patient: PatientRecord): MentorModuleData {
  const name = patient.name || 'Patient';
  const age = typeof patient.age === 'number' ? patient.age : Number(patient.age) || 14;
  const gender = patient.gender || 'Female';

  const steiners = patient.radiographyGrowth?.steinersAnalysis?.parameters;
  const anbVal = typeof steiners?.anb?.pre === 'number' ? steiners.anb.pre : undefined;
  const snaVal = typeof steiners?.sna?.pre === 'number' ? steiners.sna.pre : undefined;
  const snbVal = typeof steiners?.snb?.pre === 'number' ? steiners.snb.pre : undefined;
  const upperIncNaDeg = typeof steiners?.upperIncisorToNaDeg?.pre === 'number' ? steiners.upperIncisorToNaDeg.pre : undefined;

  const fmaVal = patient.radiographyGrowth?.schwarzTweedAnalysis?.parameters?.fmpa?.pre;

  const overjet = typeof patient.intraoralSection?.overjetMm === 'number' ? patient.intraoralSection.overjetMm : 4.5;
  const overbite = typeof patient.intraoralSection?.overbiteMm === 'number' ? patient.intraoralSection.overbiteMm : 3.5;
  const molarRight = patient.intraoralSection?.buccalOcclusionRight || 'Class I';
  const molarLeft = patient.intraoralSection?.buccalOcclusionLeft || 'Class I';
  const profile = patient.extraoralProfile?.profile || 'Convex';
  const lipPosturing = patient.extraoralProfile?.lipPostureTonicity || 'Incompetent';
  const nasolabial = patient.extraoralProfile?.nasolabialAngle || 'Normal (90-110°)';

  // Determine skeletal class
  const skeletalClass =
    anbVal !== undefined
      ? anbVal > 4
        ? 'Skeletal Class II'
        : anbVal < 0
        ? 'Skeletal Class III'
        : 'Skeletal Class I'
      : 'Skeletal Class II';

  // Growth pattern
  const growthPattern =
    typeof fmaVal === 'number'
      ? fmaVal > 28
        ? 'Hyperdivergent (High Angle / Vertical Growth)'
        : fmaVal < 20
        ? 'Hypodivergent (Low Angle / Horizontal Growth)'
        : 'Normodivergent (Average Angle)'
      : 'Normodivergent / Average Angle';

  const isGrowing = age < (gender === 'Female' ? 15 : 17);

  return {
    module1CaseDiscussion: {
      overview: `Patient ${name}, a ${age}-year-old ${gender.toLowerCase()}, presents with a chief complaint regarding dental aesthetics and alignment. Clinical and diagnostic analysis reveals a ${skeletalClass} pattern associated with a ${growthPattern} growth direction, ${profile.toLowerCase()} facial profile, and ${lipPosturing.toLowerCase()} lip posture.`,
      interrelationships: [
        {
          findingA: `Skeletal Pattern (${skeletalClass} - ANB ${anbVal ?? '5.2'}°)`,
          findingB: `Facial Profile & Lip Posture (${profile}, ${lipPosturing})`,
          clinicalEffect: `Mandibular retrognathism or maxillary excess directly manifests as soft tissue convexity and lip incompetence at rest due to increase in soft tissue overjet.`,
        },
        {
          findingA: `Vertical Growth Direction (${growthPattern})`,
          findingB: `Incisor Overbite & Lower Facial Height`,
          clinicalEffect: `Clockwise rotation of the mandible accentuates mandibular retrognathism, increases lower anterior facial height (LAFH), and can lead to anterior open bite tendencies or deep bite depending on molar eruption vectors.`,
        },
        {
          findingA: `Dental Occlusion (${molarRight} Molar Right / ${molarLeft} Left, Overjet ${overjet}mm)`,
          findingB: `Habit & Soft Tissue Function (${patient.habitHistory?.tongueThrusting ? 'Tongue Thrust' : 'Normal swallow'}, ${lipPosturing})`,
          clinicalEffect: `The increased overjet prevents lip seal, encouraging lower lip trapping behind upper incisors and compensatory tongue placement, worsening incisor proclinations.`,
        },
      ],
      synthesisParagraph: `In summary, the chief complaint is not an isolated dental misalignment but a direct biomechanical consequence of underlying ${skeletalClass} jaw relationship and ${growthPattern} facial morphology. Treatment planning must address both skeletal framework and dentoalveolar compensation.`,
    },

    module2DiagnosticReasoning: {
      summary: `Diagnostic synthesis requires triangulating clinical examination findings with cephalometric angular measurements, model discrepancy analyses, and facial photographic proportions rather than relying on isolated metric thresholds.`,
      diagnosticJustifications: [
        {
          diagnosis: skeletalClass,
          rationale: `Supported by ANB angle of ${anbVal ?? '5.2'}° (Norm 2°), Wits appraisal, and clinical profile examination demonstrating facial convexity.`,
          clinicalSignificance: `Distinguishes true skeletal discrepancy from purely dentoalveolar Class II malocclusion, directing whether growth modification, dental camouflage, or orthognathic surgery is indicated.`,
        },
        {
          diagnosis: growthPattern,
          rationale: `Correlated via Tweed FMPA/FMA (${fmaVal ?? '26'}°), Jarabak ratio, and clinical lower facial height ratio.`,
          clinicalSignificance: `Guides vertical anchorage control; high angle cases demand strict vertical molar control to avoid undesirable backward mandibular rotation during leveling.`,
        },
        {
          diagnosis: `Overjet Discrepancy (${overjet} mm) & Incisor Proclination`,
          rationale: `Intraoral measurement correlated with Steiner U1-NA angle (${upperIncNaDeg ?? '28'}°) and Tweed IMPA.`,
          clinicalSignificance: `Differentiates skeletal disharmony from dental compensation; upper incisor retroclination or lower incisor proclination reflects physiological compensation masking skeletal severity.`,
        },
      ],
    },

    module3ClinicalCorrelation: {
      correlations: [
        {
          diagnosisItem: `Mandibular Retrusion / Deficiency (SNB ${snbVal ?? '75.8'}°)`,
          clinicalManifestation: `Retrognathic chin posture, convex facial profile, deficient throat length, and increased overjet.`,
          physiologicalExplanation: `The underdeveloped or posteriorly positioned mandible sets the lower dentition and chin point backward relative to the anterior cranial base.`,
        },
        {
          diagnosisItem: `Divergent Growth / High Angle FMPA (${fmaVal ?? '26'}°)`,
          clinicalManifestation: `Increased lower third facial height, lip incompetence, narrow alar base, and vertical chin elongation.`,
          physiologicalExplanation: `Excessive posterior vertical maxillary growth or steep gonial angle causes backward and downward rotation of the mandible around the TMJ condylar axis.`,
        },
        {
          diagnosisItem: `Upper Incisor Proclination (U1-NA ${upperIncNaDeg ?? '28'}°)`,
          clinicalManifestation: `Protruding upper teeth, lip strain on closure, acute nasolabial angle, and deep mentolabial sulcus.`,
          physiologicalExplanation: `Dentoalveolar labial tipping occurs as teeth accommodate space loss or neuromuscular forces, compromising soft tissue support and lip seal.`,
        },
      ],
    },

    module4DifferentialDiagnosis: {
      differentialItems: [
        {
          alternativeDiagnosis: `True Maxillary Prognathism vs. Mandibular Retrognathism`,
          whyConsidered: `Both present with a convex profile and Skeletal Class II relation (increased ANB angle).`,
          whyExcluded: `SNA angle is normal (${snaVal ?? '81'}°), while SNB is reduced (${snbVal ?? '75.8'}° vs norm 80°), indicating the primary defect resides in mandibular position rather than maxillary excess.`,
          supportingEvidenceForFinal: `Cephalometric Steiner & McNamara analyses demonstrate normal Nasion-Perpendicular to Point A distance with deficient Nasion-Perpendicular to Pogonion distance.`,
        },
        {
          alternativeDiagnosis: `Skeletal Open Bite vs. Dentoalveolar Open Bite`,
          whyConsidered: `Incompetent lips, reduced overbite (${overbite}mm), and steep mandibular plane angle.`,
          whyExcluded: `Infra-buccal occlusal contact is present, and anterior open bite is limited to localized dentoalveolar displacement without severe gape between posterior occlusal planes.`,
          supportingEvidenceForFinal: `Bjork sum and Jarabak ratio fall within upper-normal thresholds without posterior maxillary vertical excess on COGS analysis.`,
        },
      ],
    },

    module5TreatmentObjectives: {
      prioritizedObjectives: [
        {
          priority: 1,
          objective: `Normalize Sagittal Jaw & Occlusal Relationship`,
          drivingFindings: `ANB ${anbVal ?? '5.2'}°, Overjet ${overjet}mm, ${molarRight} Molar Relation`,
          importance: `Primary foundation for functional occlusion, canine guidance, and long-term TMJ health.`,
        },
        {
          priority: 2,
          objective: `Improve Facial Aesthetics & Lip Competency`,
          drivingFindings: `${profile} Profile, ${lipPosturing}, Nasolabial angle ${nasolabial}`,
          importance: `Addresses the patient's primary aesthetic chief complaint and restores relaxed lip closure.`,
        },
        {
          priority: 3,
          objective: `Maintain / Control Vertical Dimension & Mandibular Plane Angle`,
          drivingFindings: `FMPA ${fmaVal ?? '26'}°, LAFH proportion`,
          importance: `Prevents clockwise rotation of mandible during extrusion of molars during leveling and space closure.`,
        },
        {
          priority: 4,
          objective: `Achieve Arch Alignment, Arch Form Harmony & Stable Incisor Position`,
          drivingFindings: `Anterior crowding/spacing, IMPA`,
          importance: `Ensures cortical bone integrity, avoids gingival recession, and maintains long-term post-treatment stability.`,
        },
      ],
    },

    module6TreatmentOptions: {
      options: [
        {
          title: isGrowing ? `Option A: Growth Modification (Functional / Orthopedic Appliance)` : `Option A: Comprehensive Dentoalveolar Camouflage (Fixed Orthodontic Appliance)`,
          modality: isGrowing ? `Functional Appliance (Twin Block / Herbst) followed by Fixed Appliances` : `Fixed Preadjusted Edgewise Appliance (0.022" MBT / Roth slot) with extraction/TADs`,
          indications: isGrowing
            ? [`Growing patient (skeletal age before peak CS3-CS4) with mandibular deficiency.`, `Active cervical vertebral maturation stage.`]
            : [`Non-growing patient with mild-to-moderate Skeletal Class II discrepancy.`, `Acceptable soft tissue profile.`],
          advantages: isGrowing
            ? [`Corrects underlying skeletal disparity naturally.`, `Enhances facial profile.`, `Reduces need for future permanent extractions or orthognathic surgery.`]
            : [`Avoids surgical risk and hospitalization.`, `Achieves Class I canine guidance and normal overjet efficiently.`],
          limitations: isGrowing
            ? [`Strict patient compliance dependent.`, `Limited effect if patient is past skeletal growth peak.`]
            : [`Does not correct true jaw base size discrepancy.`, `Reliant on dental tipping and anatomical compensation limits.`],
          levelOfEvidence: `High (Cochrane Systematic Reviews & Systematic Reviews in AJO-DO)`,
          clinicalConsiderations: `Evaluate Cervical Vertebral Maturation (CVM stage) on lateral cephalogram before prescribing growth modification.`,
        },
        {
          title: isGrowing ? `Option B: Dentoalveolar Camouflage with Selective Premolar Extractions` : `Option B: Surgical Orthognathic Correction (BSSO Mandibular Advancement)`,
          modality: isGrowing ? `Fixed Appliances with Upper First Premolar Extractions` : `Combined Orthodontic-Orthognathic Surgical Treatment (De-compensation + Bilateral Sagittal Split Osteotomy)`,
          indications: isGrowing
            ? [`Severe arch length discrepancy or crowding.`, `Marked upper incisor proclination with acceptable chin.`, `Borderline growth potential.`]
            : [`Severe skeletal Class II (ANB > 7°).`, `Non-growing patient with marked chin retrognathism.`, `Significant profile compromise.`],
          advantages: isGrowing
            ? [`Relieves severe anterior crowding predictably.`, `Reduces overjet reliably without needing active skeletal growth.`]
            : [`Completely normalizes facial profile, chin projection, throat length, airway dimensions, and skeletal bases.`],
          limitations: isGrowing
            ? [`May flatten nasolabial angle if over-retracted.`, `Does not advance retrognathic chin.`]
            : [`Requires general anesthesia, hospitalization, higher cost, and pre-surgical decompensation.`],
          levelOfEvidence: `High (Controlled Clinical Trials & Systematic Reviews)`,
          clinicalConsiderations: `Pre-surgical decompensation will temporarily increase overjet and worsen profile appearance prior to surgery.`,
        },
      ],
      mentorRecommendationSummary: `For this patient, ${isGrowing ? 'Growth Modification using a functional appliance is the preferred primary modality if CVM stage indicates active growth.' : 'Comprehensive Dentoalveolar Camouflage with fixed preadjusted appliances provides the most balanced risk-benefit profile.'}`,
    },

    module7RiskAnalysis: {
      risks: [
        {
          category: `Anchorage Loss`,
          riskDescription: `Mesial migration of upper molars during anterior retraction, leading to incomplete overjet reduction or loss of Class I molar relationship.`,
          mitigatingStrategy: `Utilize Temporary Anchorage Devices (TADs) or Transpalatal Arch (TPA) for maximum/absolute anchorage control.`,
          level: 'Moderate',
        },
        {
          category: `Anterior Cortical Bone Dehiscence & Root Resorption`,
          riskDescription: `Excessive labial tipping of lower incisors against the thin mandibular symphysis cortical plate can cause fenestration, gingival recession, and apical root resorption.`,
          mitigatingStrategy: `Monitor lower incisor inclination (keep IMPA ≤ 95°), apply light continuous forces, and obtain CBCT/periapicals if roots approach cortical bone.`,
          level: 'High',
        },
        {
          category: `Profile Flattening & Nasolabial Compromise`,
          riskDescription: `Over-retraction of upper incisors in extraction cases may overly increase nasolabial angle (>110°), resulting in an aged facial appearance.`,
          mitigatingStrategy: `Evaluate upper lip thickness and holdaway line before deciding on upper premolar extractions versus distalization.`,
          level: 'Low',
        },
        {
          category: `Post-Treatment Relapse`,
          riskDescription: `Rebound of overjet or crowding due to persistent muscular habits (tongue thrust) or incomplete rotational settling.`,
          mitigatingStrategy: `Implement habit breaker therapy during treatment and prescribe long-term bonded lingual retainer + vacuum formed retainer (VFR).`,
          level: 'Moderate',
        },
      ],
    },

    module8EvidenceBasedLearning: {
      principles: [
        {
          concept: `Proffit's Equilibrium Theory`,
          referenceSource: `Proffit WR. Contemporary Orthodontics, 6th Edition. Elsevier.`,
          applicationToCase: `Tooth position is determined by resting soft tissue pressures (lips, cheeks, tongue). Restoring lip competency is vital for stable tooth positioning.`,
        },
        {
          concept: `Andrews' Six Keys to Normal Occlusion`,
          referenceSource: `Andrews LF. The six keys to normal occlusion. Am J Orthod. 1972;62(3):296-309.`,
          applicationToCase: `Target Key 1 (Molar Relationship), Key 2 (Crown Angulation), Key 3 (Crown Inclination), Key 4 (No Rotations), Key 5 (Tight Contacts), Key 6 (Flat Curve of Spee).`,
        },
        {
          concept: `Tweed's Diagnostic Facial Triangle`,
          referenceSource: `Tweed CH. The Frankfort-mandibular incisor angle (FMIA) in orthodontic diagnosis. Am J Orthod. 1954.`,
          applicationToCase: `Aim for FMIA = 65°, FMA = 25°, and IMPA = 90° for optimal balance of lower incisors over basal bone.`,
        },
      ],
    },

    module9ClinicalPearls: [
      `Clinical Pearl #1: Always evaluate lower incisor compensation (IMPA) before deciding between camouflage and orthognathic surgery in Skeletal Class II cases.`,
      `Clinical Pearl #2: Mandibular retrognathism (decreased SNB) is statistically the most common primary component of Skeletal Class II malocclusion.`,
      `Clinical Pearl #3: In high-angle hyperdivergent cases, avoid extruding posterior teeth during leveling—every 1mm of molar extrusion results in approximately 1.5mm to 2mm of anterior open bite opening at the incisors.`,
      `Clinical Pearl #4: Check lip thickness at Point A and Holdaway soft tissue angles prior to extraction decisions to prevent unwanted facial flattening.`,
      `Clinical Pearl #5: Soft tissue lip seal is a key natural retainer—achieving spontaneous lip closure at rest significantly reduces long-term relapse risk.`,
    ],

    module10CommonMistakes: [
      {
        mistake: `Relying solely on ANB angle without checking SNA and SNB angles independently.`,
        impact: `Failing to differentiate maxillary prognathism from mandibular retrognathism leads to improper appliance selection (e.g., using headgear for mandibular deficiency).`,
        preventionStrategy: `Always evaluate SNA, SNB, Wits appraisal, and Nasion Perpendicular distances together to pinpoint the exact jaw responsible for Class II pattern.`,
      },
    ],

    module11VivaPreparation: [
      {
        id: 'viva-1',
        level: 'Basic',
        question: `What is the primary skeletal problem in this patient, and which cephalometric parameter confirms it?`,
        hint: `Look at the relationship between SNA, SNB, and ANB angles on Steiner analysis.`,
        modelAnswer: `The primary skeletal problem is ${skeletalClass} due to mandibular retrognathism. Confirmed by an increased ANB angle (${anbVal ?? '5.2'}°) with a reduced SNB angle (${snbVal ?? '75.8'}°) and normal SNA angle (${snaVal ?? '81'}°).`,
        keyConcepts: ['ANB Angle', 'Skeletal Class II', 'Mandibular Retrognathism'],
      },
      {
        id: 'viva-2',
        level: 'Intermediate',
        question: `How does the patient's vertical growth pattern (FMPA ${fmaVal ?? '26'}°) influence your choice of anchorage and bite opening mechanics?`,
        hint: `Consider the effect of molar extrusion on mandibular rotation.`,
        modelAnswer: `In hyperdivergent/high-angle growth patterns, molar extrusion causes backward and downward rotation of the mandible, worsening Class II overjet and profile convexity. Therefore, vertical anchorage control (such as intruding/holding molars with TPA or TADs) is critical.`,
        keyConcepts: ['FMPA Angle', 'Vertical Anchorage Control', 'Clockwise Mandibular Rotation'],
      },
      {
        id: 'viva-3',
        level: 'Advanced (Postgraduate)',
        question: `In a borderline Skeletal Class II patient, what anatomical limits govern lower incisor decompensation/proclination (IMPA)?`,
        hint: `Think about alveolar bone limits at the symphysis.`,
        modelAnswer: `Lower incisor proclination is governed by the thickness of the labial cortical plate at the mandibular symphysis and the attached gingival biotype. Exceeding IMPA 95-98° risks dehiscence, fenestration, gingival recession, and instability due to lip musculature pressure.`,
        keyConcepts: ['IMPA Limits', 'Mandibular Symphysis Cortical Bone', 'Gingival Biotype'],
      },
    ],

    module12SelfAssessment: [
      {
        id: 'sa-1',
        question: `What is the primary skeletal problem in this patient?`,
        guidance: `Verify whether ANB is > 4° (Class II) or < 0° (Class III) and check if SNA vs SNB is abnormal.`,
        evidencePoints: [
          `ANB Angle: ${anbVal ?? '5.2'}°`,
          `SNA: ${snaVal ?? '81'}° vs SNB: ${snbVal ?? '75.8'}°`,
          `Facial Profile: ${profile}`,
        ],
      },
      {
        id: 'sa-2',
        question: `Could this case be managed without permanent tooth extractions?`,
        guidance: `Evaluate total space discrepancy (ALD + Carey analysis), overjet magnitude, and lower incisor position (IMPA).`,
        evidencePoints: [
          `Overjet: ${overjet}mm`,
          `Carey Space Discrepancy`,
          `Nasolabial Angle & Lip Support`,
        ],
      },
    ],

    module13FacultyNotes: {
      presentationHighlights: [
        `Case presentation for ${name} (${age}y/${gender}): ${skeletalClass} malocclusion on a ${growthPattern} facial skeleton with ${profile.toLowerCase()} profile.`,
        `Primary diagnostic challenge: Balancing sagittal correction with vertical mandibular plane control.`,
        `Treatment modality decision: ${isGrowing ? 'Functional growth modification phase 1 recommended.' : 'Comprehensive dentoalveolar camouflage phase recommended.'}`,
      ],
      teachingPoints: [
        `Highlight the difference between skeletal ANB angle and soft tissue convexity angle.`,
        `Emphasize the role of tongue thrust habit on anterior open bite / increased overjet persistence.`,
        `Demonstrate pre-treatment vs target post-treatment Steiner stick overlay calculations.`,
      ],
      discussionTopics: [
        `Indication criteria for growth modification vs. extraction camouflage vs. orthognathic surgery.`,
        `Reliability of Wits appraisal in high-angle cases where the occlusal plane is steep.`,
        `Comparison of TAD-assisted maxillary molar distalization versus premolar extraction in Class II overjet reduction.`,
      ],
      clinicalControversies: [
        `Timing of Class II functional appliance therapy: Peak pubertal growth spurt (CS3-CS4) vs early mixed dentition intervention.`,
        `Extraction vs Non-extraction profile impact in borderline convex soft tissue profiles.`,
      ],
    },
  };
}
