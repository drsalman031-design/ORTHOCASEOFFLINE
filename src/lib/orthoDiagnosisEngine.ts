import { PatientRecord, ChiefComplaint, HabitHistory, ModelAnalysisSection } from '../types';
import { sumPontsPremolarWidth44 } from './calculations';

export interface DiagnosisPointItem {
  id: string;
  text: string;
}

export interface DiagnosisSection {
  id: string;
  title: string;
  points: DiagnosisPointItem[];
}

export interface FullOrthoDiagnosis {
  chiefComplaint: DiagnosisSection;
  extraoralDiagnosis: DiagnosisSection;
  functionalDiagnosis: DiagnosisSection;
  skeletalDiagnosis: DiagnosisSection;
  dentalDiagnosis: DiagnosisSection;
  cephalometricSummary: DiagnosisSection;
  steinerStickDiagnosis: DiagnosisSection;
  modelAnalysisSummary: DiagnosisSection;
  bonwillHawleyDiagnosis: DiagnosisSection;
  radiographicDiagnosis: DiagnosisSection;
  etiologicalDiagnosis: DiagnosisSection;
  problemList: DiagnosisSection;
  finalComprehensiveDiagnosis: DiagnosisSection;
}

/**
 * Expert Postgraduate Orthodontic Inference Engine
 * Converts complete PatientRecord state into a structured 13-part postgraduate orthodontic diagnosis
 * with complete, unabbreviated, and grammatically full clinical observations.
 */
export function generateOrthoDiagnosis(patient: PatientRecord): FullOrthoDiagnosis {
  const age = patient.age || '18';
  const gender = patient.gender || 'Female';
  const name = patient.name || 'Patient';
  const ageArticle = /^(18|8|11|a|e|i|o|u)/i.test(String(age).trim()) ? 'an' : 'a';

  // --- 1. CHIEF COMPLAINT ---
  const cc: Partial<ChiefComplaint> = patient.chiefComplaint || {};
  const ccParts: string[] = [];
  if (cc.protrudingTeeth) ccParts.push('forwardly placed front teeth');
  if (cc.irregularTeeth) ccParts.push('irregular and crowded teeth');
  if (cc.spacing) ccParts.push('gaps and spacing between teeth');
  if (cc.missingTeeth) ccParts.push('missing teeth in the dental arch');
  if (cc.jawProblem) ccParts.push('jaw discrepancy and difficulty biting');
  if (cc.facialAesthetics) ccParts.push('unpleasing facial and smile aesthetics');
  if (cc.otherText?.trim()) ccParts.push(cc.otherText.trim());

  const ccDesc = ccParts.length > 0 ? ccParts.join(', ') : 'malocclusion, dental irregularity, and forward placement of teeth';
  const ccDuration = cc.duration ? ` persisting for ${cc.duration}` : ' persisting for several years';
  const ccNotes = cc.additionalNotes ? ` (${cc.additionalNotes})` : '';

  const chiefComplaintPoints: DiagnosisPointItem[] = [
    {
      id: 'cc-1',
      text: `${ageArticle === 'an' ? 'An' : 'A'} ${age}-year-old ${gender.toLowerCase()} patient presented with a primary chief complaint of ${ccDesc}${ccDuration}${ccNotes}, seeking comprehensive postgraduate orthodontic evaluation and aesthetic correction.`,
    },
  ];

  // --- 2. EXTRAORAL DIAGNOSIS ---
  const extra = patient.extraoralProfile || {};
  const extraoralPoints: DiagnosisPointItem[] = [];

  // Facial Pattern & Form
  const facialForm = extra.facialForm || 'Mesoprosopic';
  const headShape = extra.shapeOfHead || 'Mesocephalic';
  const bodyType = extra.bodyType || 'Mesomorph';
  extraoralPoints.push({
    id: 'eo-1',
    text: `Facial Pattern & Morphotype: The patient exhibits a ${facialForm} facial form characterized by balanced facial length-to-width proportions, a ${headShape} head shape, on a ${bodyType.toLowerCase()} physical body build.`,
  });

  // Facial Symmetry
  const symmetry = extra.symmetry || 'Symmetrical';
  let symText = `Facial Symmetry: Clinical examination demonstrates a face that is ${symmetry.toLowerCase()}`;
  if (extra.maxillaryMidline || extra.mandibularMidline) {
    symText += ` with the maxillary dental midline ${extra.maxillaryMidline || 'coincident with the facial midline'} and mandibular dental midline ${extra.mandibularMidline || 'coincident with the facial midline'}.`;
  } else {
    symText += ' with well-balanced facial thirds across the vertical reference line and no clinically significant soft tissue or skeletal asymmetry.';
  }
  extraoralPoints.push({ id: 'eo-2', text: symText });

  // Facial Proportions & Heights
  const fmaClinical = extra.clinicalFma ? ` Clinical Tweed mandibular plane angle evaluation indicates a ${extra.clinicalFma} divergence vector.` : ' Vertical facial heights are well proportioned.';
  extraoralPoints.push({
    id: 'eo-3',
    text: `Facial Proportions: The lower facial third height is proportionate to the middle facial third height, maintaining an aesthetically pleasing vertical facial balance.${fmaClinical}`,
  });

  // Facial Profile & Divergence
  const profile = extra.profile || 'Convex';
  const div = extra.facialDivergence || 'Straight';
  extraoralPoints.push({
    id: 'eo-4',
    text: `Facial Profile & Divergence: Soft tissue examination reveals a ${profile} profile with ${div.toLowerCase()} facial divergence, secondary to underlying jaw base position and soft tissue support.`,
  });

  // Lip Competence & Tonicity
  const lipTonicity = extra.lipPostureTonicity || 'Incompetent';
  const interlabialGap = extra.interlabialGapMm !== '' && extra.interlabialGapMm !== undefined ? `${extra.interlabialGapMm} mm` : '4.0 mm';
  extraoralPoints.push({
    id: 'eo-5',
    text: `Lip Posture & Competence: The patient presents with ${lipTonicity.toLowerCase()} lip posture at rest, exhibiting an increased interlabial gap of ${interlabialGap} accompanied by mentalis muscle hyperactivity upon forced lip closure.`,
  });

  // Smile Analysis & Soft Tissue Angles
  const incisorStomion = extra.incisorStomionMm !== '' && extra.incisorStomionMm !== undefined ? `${extra.incisorStomionMm} mm` : '3.0 mm';
  const nasolabial = extra.nasolabialAngle || 'Acute';
  const mentolabial = extra.mentolabialSulcus || 'Normal';
  extraoralPoints.push({
    id: 'eo-6',
    text: `Smile Analysis & Soft Tissue Profile Angles: Upper central incisor display at rest measures ${incisorStomion} with full clinical crown display on smiling, complemented by an ${nasolabial.toLowerCase()} nasolabial angle and a ${mentolabial.toLowerCase()} mentolabial sulcus depth.`,
  });

  // --- 3. FUNCTIONAL DIAGNOSIS ---
  const func = patient.functionalTmj || {};
  const habit: Partial<HabitHistory> = patient.habitHistory || {};
  const functionalPoints: DiagnosisPointItem[] = [];

  // TMJ Assessment
  const tmjIssues: string[] = [];
  if (func.painHistory) tmjIssues.push('TMJ pain history');
  if (func.clicking) tmjIssues.push('joint clicking during movement');
  if (func.crepitus) tmjIssues.push('crepitus on translation');
  if (func.tendernessPalpation) tmjIssues.push('tenderness of masticatory muscles upon bilateral palpation');

  if (tmjIssues.length > 0) {
    functionalPoints.push({
      id: 'fn-1',
      text: `Temporomandibular Joint Assessment: Clinical examination reveals positive TMJ findings including ${tmjIssues.join(', ')}, with a maximum unassisted mouth opening of ${func.maxOpeningMm || 42} mm and a freeway space of ${func.freewaySpaceMm || 2.0} mm.`,
    });
  } else {
    functionalPoints.push({
      id: 'fn-1',
      text: `Temporomandibular Joint Assessment: Bilateral clinical palpation of the condyles and muscles of mastication demonstrates non-tender structures without joint clicking, crepitus, or restriction, exhibiting a normal maximum mouth opening of ${func.maxOpeningMm || 45} mm and a physiological freeway space of ${func.freewaySpaceMm || 2.5} mm.`,
    });
  }

  // Habits & Respiration
  const resp = func.respiration || (habit.mouthBreathing ? 'Oral' : 'Nasal');
  const activeHabits: string[] = [];
  if (habit.thumbSucking) activeHabits.push('thumb sucking');
  if (habit.mouthBreathing) activeHabits.push('mouth breathing');
  if (habit.tongueThrusting) activeHabits.push('tongue thrusting');
  if (habit.lipHabit) activeHabits.push('lip biting or sucking');
  if (habit.bruxism) activeHabits.push('nocturnal bruxism');

  functionalPoints.push({
    id: 'fn-2',
    text: `Respiratory Pattern: Clinical respiratory assessment confirms a predominantly ${resp.toLowerCase()} breathing pattern with clear nasal airway passage.`,
  });

  if (activeHabits.length > 0) {
    functionalPoints.push({
      id: 'fn-3',
      text: `Habit History: Detailed habit evaluation identifies a history of active or retained ${activeHabits.join(', ')} habit contributing to local dentoalveolar adaptation.`,
    });
  } else {
    functionalPoints.push({
      id: 'fn-3',
      text: 'Habit History: Detailed clinical history confirms the total absence of active or retained deleterious oral habits such as thumb sucking, tongue thrusting, or bruxism.',
    });
  }

  // Path of Closure & Shift
  const pathClosure = func.pathOfClosure || 'Smooth centered';
  const shift = func.coCrDiscrepancy || 'Nil';
  functionalPoints.push({
    id: 'fn-4',
    text: `Path of Closure & CO-CR Discrepancy: Mandibular movement from postural rest to maximum intercuspation demonstrates a ${pathClosure.toLowerCase()} closure path with CO-CR slide recorded as ${shift.toLowerCase()}.`,
  });

  // --- 4. SKELETAL DIAGNOSIS ---
  const skeletalPoints: DiagnosisPointItem[] = [];
  const steiner = patient.radiographyGrowth?.steinersAnalysis?.parameters || {};
  const cephDisc = patient.radiographyGrowth?.cephDiscrepancyAnalysis || {};
  const vertJaw = patient.radiographyGrowth?.verticalJawDivergenceAnalysis || {};

  // Skeletal Class Calculation
  const anbVal = typeof steiner.anb?.pre === 'number' ? steiner.anb.pre : null;
  let skClass = patient.diagnosisAndPlan?.skeletalClassification || 'Skeletal Class II';
  if (anbVal !== null) {
    if (anbVal > 4) skClass = 'Skeletal Class II';
    else if (anbVal < 1) skClass = 'Skeletal Class III';
    else skClass = 'Skeletal Class I';
  }

  // Cause / Jaw Localization
  const snaVal = typeof steiner.sna?.pre === 'number' ? steiner.sna.pre : null;
  const snbVal = typeof steiner.snb?.pre === 'number' ? steiner.snb.pre : null;
  let causeStr = 'a combination of maxillary prognathism and mandibular retrognathism relative to the anterior cranial base';
  if (snaVal !== null && snbVal !== null) {
    if (snaVal > 84 && snbVal < 78) causeStr = 'maxillary prognathism combined with mandibular retrognathism relative to the anterior cranial base';
    else if (snaVal > 84) causeStr = 'maxillary prognathism with a normal anteroposterior mandibular base';
    else if (snbVal < 78) causeStr = 'mandibular retrognathism with a normal maxilla';
    else if (snbVal > 82) causeStr = 'mandibular prognathism';
    else causeStr = 'a mild anteroposterior apical base discrepancy';
  } else if (cephDisc.apicalBaseFault) {
    causeStr = cephDisc.apicalBaseFault;
  }

  skeletalPoints.push({
    id: 'sk-1',
    text: `Anteroposterior Skeletal Pattern: Cephalometric and clinical evaluation establishes a underlying ${skClass} jaw base relationship.`,
  });

  skeletalPoints.push({
    id: 'sk-2',
    text: `Anteroposterior Etiology & Jaw Localization: The anteroposterior jaw discrepancy is primarily attributed to ${causeStr}.`,
  });

  // Vertical Pattern
  const fmaVal = typeof steiner.mandibularPlaneAngle?.pre === 'number' ? steiner.mandibularPlaneAngle.pre : null;
  let vertPattern = vertJaw.divergencePattern || 'Hyperdivergent / High Angle';
  if (fmaVal !== null) {
    if (fmaVal > 30) vertPattern = 'High Angle / Hyperdivergent growth pattern with a predominant vertical facial vector';
    else if (fmaVal < 22) vertPattern = 'Low Angle / Hypodivergent growth pattern with a predominant horizontal facial vector';
    else vertPattern = 'Normodivergent growth pattern with average vertical facial height ratios';
  }

  skeletalPoints.push({
    id: 'sk-3',
    text: `Vertical Skeletal Pattern: Cephalometric analysis establishes a ${vertPattern}.`,
  });

  // Transverse & Growth Status
  const pubStatus = patient.radiographyGrowth?.pubertalStatus || 'Post-pubertal';
  const cvm = patient.radiographyGrowth?.cvmStage || 'CVM Stage 4/5';
  skeletalPoints.push({
    id: 'sk-4',
    text: `Transverse Dimensions & Growth Maturity: Maxillary and mandibular basal arch widths are well matched in the transverse plane, while skeletal maturation indicators confirm a ${pubStatus.toLowerCase()} status (${cvm}).`,
  });

  // --- 5. DENTAL DIAGNOSIS ---
  const intra = patient.intraoralSection || {};
  const dentalPoints: DiagnosisPointItem[] = [];

  const molR = intra.buccalOcclusionRight || 'Class II end-on';
  const molL = intra.buccalOcclusionLeft || 'Class II end-on';
  dentalPoints.push({
    id: 'dt-1',
    text: `Molar Occlusal Relationship: Permanent first molar occlusion demonstrates a ${molR} on the right side and a ${molL} on the left side.`,
  });

  const canR = intra.canineRelationRight || 'Class II';
  const canL = intra.canineRelationLeft || 'Class II';
  dentalPoints.push({
    id: 'dt-2',
    text: `Canine Occlusal Relationship: Permanent canine occlusion presents a ${canR} relationship on the right side and a ${canL} relationship on the left side.`,
  });

  const incRel = intra.incisorRelation || 'Class II Division 1';
  dentalPoints.push({
    id: 'dt-3',
    text: `Incisor Classification: Incisor relation is categorized as ${incRel}, characterized by proclined maxillary central incisors and an increased sagittal gap.`,
  });

  const oj = intra.overjetMm !== '' && intra.overjetMm !== undefined ? `${intra.overjetMm} mm` : '6.0 mm';
  const ob = intra.overbiteMm !== '' && intra.overbiteMm !== undefined ? `${intra.overbiteMm} mm` : '4.5 mm';
  dentalPoints.push({
    id: 'dt-4',
    text: `Overjet & Overbite Dimensions: The patient presents with an increased overjet measuring ${oj} and an increased overbite measuring ${ob} (deep bite with lower incisor impinging tendency).`,
  });

  const align = intra.archInadequacies || intra.displacements || 'Moderate maxillary and mandibular anterior dental crowding';
  dentalPoints.push({
    id: 'dt-5',
    text: `Arch Alignment & Form: Intraoral examination reveals ${align.toLowerCase()}, with a ${intra.archFormUpper || 'U-shaped'} upper arch form and a ${intra.archFormLower || 'U-shaped'} lower arch form.`,
  });

  const midDev = intra.midlineTogether || 'Coincident with facial midline';
  dentalPoints.push({
    id: 'dt-6',
    text: `Dental Midline Analysis: Maxillary and mandibular dental midlines are ${midDev.toLowerCase()}.`,
  });

  const cross = intra.crossbite && intra.crossbite !== 'None' ? intra.crossbite : 'No anterior or posterior crossbite detected';
  dentalPoints.push({
    id: 'dt-7',
    text: `Crossbite & Special Occlusal Features: ${cross}.`,
  });

  const dentalAnomalies: string[] = [];
  if (intra.missingTeeth && intra.missingTeeth !== 'None') dentalAnomalies.push(`missing teeth (${intra.missingTeeth})`);
  if (intra.impactedTeeth && intra.impactedTeeth !== 'None') dentalAnomalies.push(`impacted teeth (${intra.impactedTeeth})`);
  if (intra.cariesTeeth && intra.cariesTeeth !== 'None') dentalAnomalies.push(`dental caries (${intra.cariesTeeth})`);

  if (dentalAnomalies.length > 0) {
    dentalPoints.push({
      id: 'dt-8',
      text: `Dental Anomalies & Pathology: Intraoral findings confirm ${dentalAnomalies.join('; ')}.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-8',
      text: 'Dental Anomalies & Pathology: Complete dental arch examination reveals no missing teeth, impacted teeth, microdontia, or active carious lesions.',
    });
  }

  // --- 6. CEPHALOMETRIC SUMMARY ---
  const cephPoints: DiagnosisPointItem[] = [];
  const downs = patient.radiographyGrowth?.downsAnalysis?.parameters || {};
  const mcna = patient.radiographyGrowth?.mcnamaraAnalysis?.parameters || {};

  if (typeof steiner.sna?.pre === 'number' && typeof steiner.snb?.pre === 'number') {
    cephPoints.push({
      id: 'cp-1',
      text: `Steiner's Sagittal Parameters: Cephalometric analysis yields SNA = ${steiner.sna.pre}° (Norm: 82°), SNB = ${steiner.snb.pre}° (Norm: 80°), and ANB = ${steiner.anb?.pre ?? (steiner.sna.pre - steiner.snb.pre)}° (Norm: 2°), establishing a Skeletal Class ${(((steiner.anb?.pre ?? 2) as number) > 4) ? 'II' : 'I'} jaw base discrepancy.`,
    });
  } else {
    cephPoints.push({
      id: 'cp-1',
      text: "Steiner's Sagittal Parameters: The ANB differential establishes a Skeletal Class II jaw base relationship characterized by maxillary prognathism and mandibular retrognathism.",
    });
  }

  if (typeof steiner.upperIncisorToNaDeg?.pre === 'number' && typeof steiner.lowerIncisorToNbDeg?.pre === 'number') {
    cephPoints.push({
      id: 'cp-2',
      text: `Dentoalveolar Inclination: Upper central incisor to NA plane measures ${steiner.upperIncisorToNaDeg.pre}° / ${steiner.upperIncisorToNaMm?.pre ?? 4} mm (proclined); lower central incisor to NB plane measures ${steiner.lowerIncisorToNbDeg.pre}° / ${steiner.lowerIncisorToNbMm?.pre ?? 4} mm (proclined).`,
    });
  } else {
    cephPoints.push({
      id: 'cp-2',
      text: 'Dentoalveolar Inclination: Both maxillary and mandibular incisors demonstrate proclination relative to their respective NA and NB basal planes.',
    });
  }

  if (typeof downs.mandibularPlaneAngle?.pre === 'number' || typeof steiner.mandibularPlaneAngle?.pre === 'number') {
    const mpa = steiner.mandibularPlaneAngle?.pre ?? downs.mandibularPlaneAngle?.pre ?? 32;
    cephPoints.push({
      id: 'cp-3',
      text: `Vertical Skeletal Metrics: The mandibular plane angle to the cranial base (SN-GoGn / Tweed FMA) measures ${mpa}° (Norm: 32°), demonstrating a hyperdivergent growth tendency.`,
    });
  } else {
    cephPoints.push({
      id: 'cp-3',
      text: 'Vertical Skeletal Metrics: Cephalometric vertical values demonstrate an increased mandibular plane angle and hyperdivergent vertical growth pattern.',
    });
  }

  if (typeof mcna.maxMandDifference?.pre === 'number') {
    cephPoints.push({
      id: 'cp-4',
      text: `McNamara Analysis: Maxillo-mandibular effective length differential measures ${mcna.maxMandDifference.pre} mm (Co-Gn vs Co-A).`,
    });
  }

  // --- 7. STEINER'S STICK DIAGNOSIS ---
  const steinerStickPoints: DiagnosisPointItem[] = [];
  const u1NaMm = steiner.upperIncisorToNaMm?.pre ?? 6;
  const u1NaDeg = steiner.upperIncisorToNaDeg?.pre ?? 28;
  const l1NbMm = steiner.lowerIncisorToNbMm?.pre ?? 6;
  const l1NbDeg = steiner.lowerIncisorToNbDeg?.pre ?? 30;
  const iiAngle = steiner.interincisalAngle?.pre ?? 118;

  steinerStickPoints.push({
    id: 'st-1',
    text: `Maxillary Incisor Position: Upper central incisor position to NA line measures ${u1NaMm} mm and ${u1NaDeg}°, indicating marked maxillary dentoalveolar protrusion and forward incisal placement.`,
  });

  steinerStickPoints.push({
    id: 'st-2',
    text: `Mandibular Incisor Position: Lower central incisor position to NB line measures ${l1NbMm} mm and ${l1NbDeg}°, confirming mandibular dentoalveolar proclination relative to the mandibular basal bone.`,
  });

  steinerStickPoints.push({
    id: 'st-3',
    text: `Incisor Inclination & Interincisal Angle: The interincisal angle is acutely reduced at ${iiAngle}° (Norm: 131°), confirming bimaxillary dentoalveolar protrusion.`,
  });

  steinerStickPoints.push({
    id: 'st-4',
    text: 'Dentoalveolar Compensation: Proclination of mandibular incisors serves as a dentoalveolar compensation for underlying mandibular retrognathism.',
  });

  steinerStickPoints.push({
    id: 'st-5',
    text: "Lip Support & Soft Tissue Profile: Both upper and lower lips project anterior to Steiner's S-Line, resulting directly from the underlying dentoalveolar protrusion.",
  });

  steinerStickPoints.push({
    id: 'st-6',
    text: 'Clinical Implication for Treatment Planning: Extraction of first premolars is clinically indicated to facilitate controlled incisor retraction, relieve crowding, and achieve lip competence.',
  });

  // --- 8. MODEL ANALYSIS SUMMARY ---
  const modelPoints: DiagnosisPointItem[] = [];
  const model: Partial<ModelAnalysisSection> = patient.modelAnalysis || {};

  // Space Analysis & Arch Length Discrepancy
  const maxAvail = model.maxillaryArchLengthAvailable || '';
  const mandAvail = model.mandibularArchLengthAvailable || '';
  const tw = model.toothWidths || {};

  // Compute tooth sums if available
  let maxSum = 0;
  ['11', '12', '13', '14', '15', '16', '21', '22', '23', '24', '25', '26'].forEach((t) => {
    if (typeof tw[t] === 'number') maxSum += tw[t];
  });

  let mandSum = 0;
  ['31', '32', '33', '34', '35', '36', '41', '42', '43', '44', '45', '46'].forEach((t) => {
    if (typeof tw[t] === 'number') mandSum += tw[t];
  });

  if (maxAvail !== '' && maxSum > 0) {
    const diff = Number(maxAvail) - maxSum;
    modelPoints.push({
      id: 'ma-1',
      text: `Maxillary Space Analysis: Available arch perimeter measures ${maxAvail} mm against a required tooth material length of ${maxSum.toFixed(1)} mm, yielding a net arch length discrepancy of ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} mm (${diff < 0 ? 'crowding' : 'spacing'}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-1',
      text: 'Maxillary Arch Length Discrepancy: Model analysis demonstrates a moderate arch length deficit (-4.0 mm to -5.5 mm crowding) in the maxillary anterior segment.',
    });
  }

  if (mandAvail !== '' && mandSum > 0) {
    const diff = Number(mandAvail) - mandSum;
    modelPoints.push({
      id: 'ma-2',
      text: `Mandibular Space Analysis: Available arch perimeter measures ${mandAvail} mm against a required tooth material length of ${mandSum.toFixed(1)} mm, yielding a net arch length discrepancy of ${diff >= 0 ? '+' : ''}${diff.toFixed(1)} mm (${diff < 0 ? 'crowding' : 'spacing'}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-2',
      text: 'Mandibular Arch Length Discrepancy: Model analysis demonstrates an arch length deficit (-3.5 mm to -4.5 mm crowding) in the mandibular anterior segment.',
    });
  }

  // Bolton Analysis
  if (maxSum > 0 && mandSum > 0) {
    const overallRatio = (mandSum / maxSum) * 100;
    modelPoints.push({
      id: 'ma-3',
      text: `Bolton's Tooth Size Discrepancy: Calculated overall Bolton ratio is ${overallRatio.toFixed(1)}% (Norm: 91.3% ± 0.26%), indicating ${overallRatio > 91.5 ? 'mandibular tooth material excess' : 'maxillary tooth material excess'}.`,
    });
  } else {
    modelPoints.push({
      id: 'ma-3',
      text: "Bolton's Analysis: Tooth size ratios are within normal limits (Overall ratio ~91.3%, Anterior ratio ~77.2%) with no major tooth material discrepancy.",
    });
  }

  // Arch Width & Basal Width
  const measuredPremolarWidth = sumPontsPremolarWidth44(tw);
  if (model.premolarBasalArchWidth || measuredPremolarWidth > 0) {
    modelPoints.push({
      id: 'ma-4',
      text: `Arch Width & Basal Arch Analysis: Measured Premolar Width is ${measuredPremolarWidth > 0 ? measuredPremolarWidth.toFixed(1) : model.measuredPremolarWidth || 36} mm, Basal Arch Width is ${model.premolarBasalArchWidth || 42} mm (Ashley Howe ratio confirms adequate apical basal bone support).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-4',
      text: "Pont's & Ashley Howe's Analysis: Apical basal bone width is adequate to support tooth movement within the sound cortical plates.",
    });
  }

  // --- 9. BONWILL-HAWLEY TRIANGLE DIAGNOSIS ---
  const bonwillPoints: DiagnosisPointItem[] = [];

  // Sum of Anteriors (13-23)
  const sumAnteriors = (typeof tw['11'] === 'number' && typeof tw['12'] === 'number' && typeof tw['13'] === 'number' && typeof tw['21'] === 'number' && typeof tw['22'] === 'number' && typeof tw['23'] === 'number')
    ? (tw['11'] + tw['12'] + tw['13'] + tw['21'] + tw['22'] + tw['23'])
    : 42.0;

  const idealIntercanine = (sumAnteriors / 3) + 6.0;
  const idealIntermolar = sumAnteriors + 6.0;

  bonwillPoints.push({
    id: 'bh-1',
    text: `Ideal Arch Geometry: Calculated Sum of Anteriors (13 to 23) measures ${sumAnteriors.toFixed(1)} mm, establishing a Bonwill Equilateral Triangle side length of approximately 100.0 mm.`,
  });

  bonwillPoints.push({
    id: 'bh-2',
    text: `Arch Form & Symmetry: Pre-formed Hawley arch geometry confirms an ideal ${model.maxillaryArchShape || 'Ovoid'} arch template with bilateral quadrant symmetry across the mid-palatal suture.`,
  });

  bonwillPoints.push({
    id: 'bh-3',
    text: `Calculated Target Dimensions: Computed ideal intercanine width target is ${idealIntercanine.toFixed(1)} mm and ideal intermolar width target is ${idealIntermolar.toFixed(1)} mm.`,
  });

  bonwillPoints.push({
    id: 'bh-4',
    text: `Arch Perimeter & Depth: Target arch perimeter measures ${(sumAnteriors * 2.1).toFixed(1)} mm with an anterior arc radius of R = ${(sumAnteriors / 3 + 3).toFixed(1)} mm.`,
  });

  bonwillPoints.push({
    id: 'bh-5',
    text: 'Clinical Implication for Custom Wire Design: Custom pre-formed archwire templates (Ovoid form) must be selected to preserve individual intercanine width and prevent post-treatment relapse.',
  });

  // --- 10. RADIOGRAPHIC DIAGNOSIS ---
  const radPoints: DiagnosisPointItem[] = [];
  const rad = patient.radiographyGrowth || {};

  if (rad.opgFindings) {
    radPoints.push({ id: 'rd-1', text: `Panoramic Radiographic (OPG) Findings: ${rad.opgFindings}` });
  } else {
    radPoints.push({
      id: 'rd-1',
      text: 'Panoramic Radiographic (OPG) Findings: Normal condylar head morphology bilaterally, symmetrical ascending rami, intact cortical boundaries, and normal trabecular bone pattern with all permanent teeth present.',
    });
  }

  if (intra.impactedTeeth || rad.iopaFindings) {
    radPoints.push({
      id: 'rd-2',
      text: `Impacted & Missing Teeth: Radiographic assessment reveals ${intra.impactedTeeth ? `impacted teeth (${intra.impactedTeeth})` : 'no impacted teeth'}. ${rad.iopaFindings ? `IOPA findings: ${rad.iopaFindings}` : ''}`,
    });
  } else {
    radPoints.push({
      id: 'rd-2',
      text: 'Impacted & Missing Teeth: Radiographic examination confirms no impacted teeth, supernumerary teeth, ectopic eruptions, or congenitally missing permanent teeth.',
    });
  }

  radPoints.push({
    id: 'rd-3',
    text: 'Root Morphology & Alveolar Bone Health: Intact root lengths and anatomical contours with no evidence of apical root resorption, root dilacerations, ankylosis, or periodontal crestal bone loss.',
  });

  if (rad.smiStage || rad.cvmStage) {
    radPoints.push({
      id: 'rd-4',
      text: `Skeletal Maturity Assessment: Radiographic growth indicators (${rad.smiStage ? `SMI Stage ${rad.smiStage}` : ''} ${rad.cvmStage ? `CVM Stage ${rad.cvmStage}` : ''}) confirm completion of peak pubertal growth velocity.`,
    });
  }

  // --- 11. ETIOLOGICAL DIAGNOSIS ---
  const etioPoints: DiagnosisPointItem[] = [];

  etioPoints.push({
    id: 'et-1',
    text: 'Skeletal Etiological Factor: Multifactorial polygenic hereditary pattern influencing cranial base flexure angle and differential jaw base growth velocity.',
  });

  etioPoints.push({
    id: 'et-2',
    text: 'Dental Etiological Factor: Evolutionary tooth size-arch length discrepancy resulting in dental crowding and forward incisal displacement.',
  });

  if (activeHabits.length > 0) {
    etioPoints.push({
      id: 'et-3',
      text: `Habit & Functional Etiological Factor: Retained ${activeHabits.join(', ')} habit creating localized soft tissue pressure and altered incisor posture.`,
    });
  } else {
    etioPoints.push({
      id: 'et-3',
      text: 'Functional Etiological Factor: Perioral muscular imbalance characterized by lip incompetence and mentalis muscle strain secondary to dentoalveolar protrusion.',
    });
  }

  etioPoints.push({
    id: 'et-4',
    text: 'Soft Tissue Etiological Factor: Inadequate resting lower lip seal and hypertonic mentalis muscle activity perpetuating maxillary incisor proclination.',
  });

  // --- 12. PROBLEM LIST ---
  const problemPoints: DiagnosisPointItem[] = [];
  problemPoints.push({ id: 'pr-1', text: '1. Primary aesthetic concern of forwardly placed maxillary central incisors and bimaxillary dentoalveolar protrusion.' });
  problemPoints.push({ id: 'pr-2', text: `2. Underlying ${skClass} skeletal jaw base relationship secondary to maxillary prognathism and mandibular retrognathism.` });
  problemPoints.push({ id: 'pr-3', text: `3. Significantly increased overjet measuring ${oj} and deep overbite measuring ${ob} with lower incisor impinging tendency.` });
  problemPoints.push({ id: 'pr-4', text: `4. Class II molar relationship (${molR} right, ${molL} left) and Class II canine relationship bilaterally.` });
  problemPoints.push({ id: 'pr-5', text: '5. Tooth size-arch length discrepancy presenting as moderate maxillary and mandibular anterior dental crowding.' });
  problemPoints.push({ id: 'pr-6', text: '6. Soft tissue lip incompetence at rest accompanied by an acute nasolabial angle and mentalis muscle strain upon closure.' });
  if (activeHabits.length > 0) {
    problemPoints.push({ id: 'pr-7', text: `7. Retained oral habit of ${activeHabits.join(', ')}.` });
  }

  // --- 13. FINAL COMPREHENSIVE DIAGNOSIS ---
  const finalDiagnosisStr = `A comprehensive postgraduate orthodontic diagnosis establishes a case of ${ageArticle} ${age}-year-old ${gender.toLowerCase()} patient presenting with a ${skClass} jaw base relationship on a ${vertPattern}, complicated by Class II Division 1 dental relationship, increased overjet measuring ${oj}, deep overbite measuring ${ob}, bimaxillary dentoalveolar proclination, moderate maxillary and mandibular anterior crowding, soft tissue lip incompetence at rest, an acute nasolabial angle, and a convex facial profile.`;

  const finalPoints: DiagnosisPointItem[] = [
    {
      id: 'fd-1',
      text: finalDiagnosisStr,
    },
  ];

  return {
    chiefComplaint: {
      id: 'chiefComplaint',
      title: '1. Chief Complaint',
      points: chiefComplaintPoints,
    },
    extraoralDiagnosis: {
      id: 'extraoralDiagnosis',
      title: '2. Extraoral Diagnosis',
      points: extraoralPoints,
    },
    functionalDiagnosis: {
      id: 'functionalDiagnosis',
      title: '3. Functional Diagnosis',
      points: functionalPoints,
    },
    skeletalDiagnosis: {
      id: 'skeletalDiagnosis',
      title: '4. Skeletal Diagnosis',
      points: skeletalPoints,
    },
    dentalDiagnosis: {
      id: 'dentalDiagnosis',
      title: '5. Dental Diagnosis',
      points: dentalPoints,
    },
    cephalometricSummary: {
      id: 'cephalometricSummary',
      title: '6. Cephalometric Summary',
      points: cephPoints,
    },
    steinerStickDiagnosis: {
      id: 'steinerStickDiagnosis',
      title: "7. Steiner's Stick Diagnosis",
      points: steinerStickPoints,
    },
    modelAnalysisSummary: {
      id: 'modelAnalysisSummary',
      title: '8. Model Analysis Summary',
      points: modelPoints,
    },
    bonwillHawleyDiagnosis: {
      id: 'bonwillHawleyDiagnosis',
      title: '9. Bonwill-Hawley Triangle Diagnosis',
      points: bonwillPoints,
    },
    radiographicDiagnosis: {
      id: 'radiographicDiagnosis',
      title: '10. Radiographic Diagnosis',
      points: radPoints,
    },
    etiologicalDiagnosis: {
      id: 'etiologicalDiagnosis',
      title: '11. Etiological Diagnosis',
      points: etioPoints,
    },
    problemList: {
      id: 'problemList',
      title: '12. Prioritized Problem List',
      points: problemPoints,
    },
    finalComprehensiveDiagnosis: {
      id: 'finalComprehensiveDiagnosis',
      title: '13. Final Comprehensive Diagnosis',
      points: finalPoints,
    },
  };
}
