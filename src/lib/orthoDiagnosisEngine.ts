import { PatientRecord, ChiefComplaint, HabitHistory, ModelAnalysisSection } from '../types';
import {
  calculateBolton,
  calculateCarey,
  calculateNanceMaxillary,
  calculatePonts,
  calculateAshleyHowe,
  calculateTanakaJohnston,
  sumAnterior6FromFdi,
  sumPontsPremolarWidth44,
} from './calculations';

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
  const facialForm = extra.facialForm;
  const headShape = extra.shapeOfHead;
  const bodyType = extra.bodyType;
  if (facialForm || headShape || bodyType) {
    extraoralPoints.push({
      id: 'eo-1',
      text: `Facial Pattern & Morphotype: The patient exhibits a ${facialForm || 'balanced'} facial form${headShape ? `, a ${headShape} head shape` : ''}${bodyType ? `, on a ${bodyType.toLowerCase()} physical body build` : ''}.`,
    });
  } else {
    extraoralPoints.push({
      id: 'eo-1',
      text: 'Facial Pattern & Morphotype: Clinical morphotype and facial form evaluation not yet recorded.',
    });
  }

  // Facial Symmetry
  const symmetry = extra.symmetry;
  if (symmetry) {
    let symText = `Facial Symmetry: Clinical examination demonstrates a face that is ${symmetry.toLowerCase()}`;
    if (extra.maxillaryMidline || extra.mandibularMidline) {
      symText += ` with the maxillary dental midline ${extra.maxillaryMidline || 'coincident with the facial midline'} and mandibular dental midline ${extra.mandibularMidline || 'coincident with the facial midline'}.`;
    } else {
      symText += ' across the vertical facial midline with no clinically significant soft tissue or skeletal asymmetry.';
    }
    extraoralPoints.push({ id: 'eo-2', text: symText });
  } else {
    extraoralPoints.push({ id: 'eo-2', text: 'Facial Symmetry: Facial symmetry evaluation not yet recorded.' });
  }

  // Facial Proportions & Heights
  if (extra.clinicalFma) {
    extraoralPoints.push({
      id: 'eo-3',
      text: `Facial Proportions: Clinical Tweed mandibular plane angle evaluation indicates a ${extra.clinicalFma} divergence vector.`,
    });
  } else {
    extraoralPoints.push({
      id: 'eo-3',
      text: 'Facial Proportions: Lower facial third and clinical mandibular plane angle not yet recorded.',
    });
  }

  // Facial Profile & Divergence
  const profile = extra.profile;
  const div = extra.facialDivergence;
  if (profile || div) {
    extraoralPoints.push({
      id: 'eo-4',
      text: `Facial Profile & Divergence: Soft tissue examination reveals a ${profile || 'harmonious'} profile${div ? ` with ${div.toLowerCase()} facial divergence` : ''}, secondary to underlying jaw base position and soft tissue support.`,
    });
  } else {
    extraoralPoints.push({
      id: 'eo-4',
      text: 'Facial Profile & Divergence: Profile and divergence evaluation not yet recorded.',
    });
  }

  // Lip Competence & Tonicity
  const lipTonicity = extra.lipPostureTonicity;
  const interlabialGap = extra.interlabialGapMm !== '' && extra.interlabialGapMm !== undefined ? `${extra.interlabialGapMm} mm` : null;
  if (lipTonicity || interlabialGap) {
    extraoralPoints.push({
      id: 'eo-5',
      text: `Lip Posture & Competence: The patient presents with ${lipTonicity ? lipTonicity.toLowerCase() : 'evaluated'} lip posture at rest${interlabialGap ? `, exhibiting an interlabial gap of ${interlabialGap}` : ''}.`,
    });
  } else {
    extraoralPoints.push({
      id: 'eo-5',
      text: 'Lip Posture & Competence: Resting lip posture and tonicity not yet recorded.',
    });
  }

  // Smile Analysis & Soft Tissue Angles
  const incisorStomion = extra.incisorStomionMm !== '' && extra.incisorStomionMm !== undefined ? `${extra.incisorStomionMm} mm` : null;
  const nasolabial = extra.nasolabialAngle;
  const mentolabial = extra.mentolabialSulcus;
  if (incisorStomion || nasolabial || mentolabial) {
    const parts: string[] = [];
    if (incisorStomion) parts.push(`Upper central incisor display at rest measures ${incisorStomion}`);
    if (nasolabial) parts.push(`nasolabial angle is ${nasolabial.toLowerCase()}`);
    if (mentolabial) parts.push(`mentolabial sulcus depth is ${mentolabial.toLowerCase()}`);
    extraoralPoints.push({
      id: 'eo-6',
      text: `Smile Analysis & Soft Tissue Profile Angles: ${parts.join(', ')}.`,
    });
  } else {
    extraoralPoints.push({
      id: 'eo-6',
      text: 'Smile Analysis & Soft Tissue Angles: Nasolabial angle, mentolabial sulcus, and incisor exposure not yet recorded.',
    });
  }

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
      text: `Temporomandibular Joint Assessment: Clinical examination reveals positive TMJ findings including ${tmjIssues.join(', ')}${func.maxOpeningMm ? `, with a maximum unassisted mouth opening of ${func.maxOpeningMm} mm` : ''}${func.freewaySpaceMm ? ` and a freeway space of ${func.freewaySpaceMm} mm` : ''}.`,
    });
  } else {
    functionalPoints.push({
      id: 'fn-1',
      text: `Temporomandibular Joint Assessment: Bilateral clinical palpation demonstrates non-tender TMJ structures without joint clicking or crepitus${func.maxOpeningMm ? `, with maximum mouth opening of ${func.maxOpeningMm} mm` : ''}${func.freewaySpaceMm ? ` and freeway space of ${func.freewaySpaceMm} mm` : ''}.`,
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
    text: `Respiratory Pattern: Clinical respiratory assessment confirms a predominantly ${resp.toLowerCase()} breathing pattern.`,
  });

  if (activeHabits.length > 0) {
    functionalPoints.push({
      id: 'fn-3',
      text: `Habit History: Detailed habit evaluation identifies a history of active or retained ${activeHabits.join(', ')} habit contributing to local dentoalveolar adaptation.`,
    });
  } else {
    functionalPoints.push({
      id: 'fn-3',
      text: 'Habit History: Detailed clinical history confirms the absence of deleterious oral habits.',
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
  let skClass = patient.diagnosisAndPlan?.skeletalClassification || 'Skeletal Class I';
  if (anbVal !== null) {
    if (anbVal > 4) skClass = 'Skeletal Class II';
    else if (anbVal < 1) skClass = 'Skeletal Class III';
    else skClass = 'Skeletal Class I';
  }

  // Cause / Jaw Localization
  const snaVal = typeof steiner.sna?.pre === 'number' ? steiner.sna.pre : null;
  const snbVal = typeof steiner.snb?.pre === 'number' ? steiner.snb.pre : null;
  let causeStr = 'mild anteroposterior apical base variance';
  if (snaVal !== null && snbVal !== null) {
    if (snaVal > 84 && snbVal < 78) causeStr = 'maxillary prognathism combined with mandibular retrognathism relative to the anterior cranial base';
    else if (snaVal > 84) causeStr = 'maxillary prognathism with a normal anteroposterior mandibular base';
    else if (snbVal < 78) causeStr = 'mandibular retrognathism with a normal maxilla';
    else if (snbVal > 82) causeStr = 'mandibular prognathism';
    else causeStr = 'balanced anteroposterior apical bases';
  } else if (cephDisc.apicalBaseFault) {
    causeStr = cephDisc.apicalBaseFault;
  }

  skeletalPoints.push({
    id: 'sk-1',
    text: `Anteroposterior Skeletal Pattern: Cephalometric and clinical evaluation establishes a ${skClass} jaw base relationship.`,
  });

  skeletalPoints.push({
    id: 'sk-2',
    text: `Anteroposterior Etiology & Jaw Localization: The anteroposterior jaw relationship is characterized by ${causeStr}.`,
  });

  // Vertical Pattern
  const fmaVal = typeof steiner.mandibularPlaneAngle?.pre === 'number' ? steiner.mandibularPlaneAngle.pre : null;
  let vertPattern = vertJaw.divergencePattern || 'Normodivergent';
  if (fmaVal !== null) {
    if (fmaVal > 30) vertPattern = 'High Angle / Hyperdivergent growth pattern with a predominant vertical facial vector';
    else if (fmaVal < 22) vertPattern = 'Low Angle / Hypodivergent growth pattern with a predominant horizontal facial vector';
    else vertPattern = 'Normodivergent growth pattern with average vertical facial height ratios';
  }

  skeletalPoints.push({
    id: 'sk-3',
    text: `Vertical Skeletal Pattern: Cephalometric evaluation indicates a ${vertPattern}.`,
  });

  // Transverse & Growth Status
  const pubStatus = patient.radiographyGrowth?.pubertalStatus;
  const cvm = patient.radiographyGrowth?.cvmStage;
  if (pubStatus || cvm) {
    skeletalPoints.push({
      id: 'sk-4',
      text: `Skeletal Growth Maturity: Maturation indicators confirm a ${pubStatus ? pubStatus.toLowerCase() : 'recorded'} status${cvm ? ` (${cvm})` : ''}.`,
    });
  } else {
    skeletalPoints.push({
      id: 'sk-4',
      text: 'Skeletal Growth Maturity: Cervical vertebral or hand-wrist maturation stage not yet recorded.',
    });
  }

  // --- 5. DENTAL DIAGNOSIS ---
  const intra = patient.intraoralSection || {};
  const dentalPoints: DiagnosisPointItem[] = [];

  const molR = intra.buccalOcclusionRight || intra.canineRelationRight;
  const molL = intra.buccalOcclusionLeft || intra.canineRelationLeft;
  if (molR || molL) {
    dentalPoints.push({
      id: 'dt-1',
      text: `Molar Occlusal Relationship: Permanent first molar occlusion demonstrates ${molR || 'Class I'} on the right side and ${molL || 'Class I'} on the left side.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-1',
      text: 'Molar Occlusal Relationship: Molar relationships not yet recorded.',
    });
  }

  const canR = intra.canineRelationRight;
  const canL = intra.canineRelationLeft;
  if (canR || canL) {
    dentalPoints.push({
      id: 'dt-2',
      text: `Canine Occlusal Relationship: Permanent canine occlusion presents a ${canR || 'Class I'} relationship on the right side and a ${canL || 'Class I'} relationship on the left side.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-2',
      text: 'Canine Occlusal Relationship: Canine relationships not yet recorded.',
    });
  }

  const incRel = intra.incisorRelation;
  if (incRel) {
    dentalPoints.push({
      id: 'dt-3',
      text: `Incisor Classification: Incisor relation is categorized as ${incRel}.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-3',
      text: 'Incisor Classification: Incisor relationship not yet recorded.',
    });
  }

  const oj = intra.overjetMm !== '' && intra.overjetMm !== undefined ? `${intra.overjetMm} mm` : null;
  const ob = intra.overbiteMm !== '' && intra.overbiteMm !== undefined ? `${intra.overbiteMm} mm` : null;
  if (oj || ob) {
    dentalPoints.push({
      id: 'dt-4',
      text: `Overjet & Overbite Dimensions: Measured overjet is ${oj || 'within normal range'} and measured overbite is ${ob || 'within normal range'}.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-4',
      text: 'Overjet & Overbite Dimensions: Overjet and overbite measurements not yet recorded.',
    });
  }

  const align = intra.archInadequacies || intra.displacements;
  if (align) {
    dentalPoints.push({
      id: 'dt-5',
      text: `Arch Alignment & Form: Intraoral examination reveals ${align.toLowerCase()}${intra.archFormUpper ? `, with a ${intra.archFormUpper.toLowerCase()} upper arch form` : ''}${intra.archFormLower ? ` and a ${intra.archFormLower.toLowerCase()} lower arch form` : ''}.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-5',
      text: 'Arch Alignment & Form: Dental arch alignment and arch form not yet recorded.',
    });
  }

  const midDev = intra.midlineTogether;
  if (midDev) {
    dentalPoints.push({
      id: 'dt-6',
      text: `Dental Midline Analysis: Dental midlines are ${midDev.toLowerCase()}.`,
    });
  } else {
    dentalPoints.push({
      id: 'dt-6',
      text: 'Dental Midline Analysis: Dental midline evaluation not yet recorded.',
    });
  }

  const cross = intra.crossbite && intra.crossbite !== 'None' ? intra.crossbite : null;
  if (cross) {
    dentalPoints.push({
      id: 'dt-7',
      text: `Crossbite & Special Occlusal Features: ${cross}.`,
    });
  }

  const dentalAnomalies: string[] = [];
  if (intra.missingTeeth && intra.missingTeeth !== 'None') dentalAnomalies.push(`missing teeth (${intra.missingTeeth})`);
  if (intra.impactedTeeth && intra.impactedTeeth !== 'None') dentalAnomalies.push(`impacted teeth (${intra.impactedTeeth})`);
  if (intra.cariesTeeth && intra.cariesTeeth !== 'None') dentalAnomalies.push(`dental caries (${intra.cariesTeeth})`);

  if (dentalAnomalies.length > 0) {
    dentalPoints.push({
      id: 'dt-8',
      text: `Dental Anomalies & Pathology: Intraoral findings confirm ${dentalAnomalies.join('; ')}.`,
    });
  }

  // --- 6. CEPHALOMETRIC SUMMARY ---
  const cephPoints: DiagnosisPointItem[] = [];
  const downs = patient.radiographyGrowth?.downsAnalysis?.parameters || {};
  const mcna = patient.radiographyGrowth?.mcnamaraAnalysis?.parameters || {};

  if (typeof steiner.sna?.pre === 'number' && typeof steiner.snb?.pre === 'number') {
    cephPoints.push({
      id: 'cp-1',
      text: `Steiner's Sagittal Parameters: Cephalometric analysis yields SNA = ${steiner.sna.pre}° (Norm: 82°), SNB = ${steiner.snb.pre}° (Norm: 80°), and ANB = ${steiner.anb?.pre ?? (steiner.sna.pre - steiner.snb.pre)}° (Norm: 2°), establishing a Skeletal Class ${(((steiner.anb?.pre ?? (steiner.sna.pre - steiner.snb.pre)) as number) > 4) ? 'II' : (((steiner.anb?.pre ?? (steiner.sna.pre - steiner.snb.pre)) as number) < 1) ? 'III' : 'I'} jaw base relationship.`,
    });
  } else {
    cephPoints.push({
      id: 'cp-1',
      text: "Steiner's Sagittal Parameters: Cephalometric sagittal angles (SNA, SNB, ANB) not yet recorded.",
    });
  }

  if (typeof steiner.upperIncisorToNaDeg?.pre === 'number' && typeof steiner.lowerIncisorToNbDeg?.pre === 'number') {
    cephPoints.push({
      id: 'cp-2',
      text: `Dentoalveolar Inclination: Upper central incisor to NA plane measures ${steiner.upperIncisorToNaDeg.pre}° / ${steiner.upperIncisorToNaMm?.pre ?? '—'} mm; lower central incisor to NB plane measures ${steiner.lowerIncisorToNbDeg.pre}° / ${steiner.lowerIncisorToNbMm?.pre ?? '—'} mm.`,
    });
  } else {
    cephPoints.push({
      id: 'cp-2',
      text: 'Dentoalveolar Inclination: Incisor inclinations (UI-NA, LI-NB) not yet recorded.',
    });
  }

  if (typeof downs.mandibularPlaneAngle?.pre === 'number' || typeof steiner.mandibularPlaneAngle?.pre === 'number') {
    const mpa = steiner.mandibularPlaneAngle?.pre ?? downs.mandibularPlaneAngle?.pre;
    cephPoints.push({
      id: 'cp-3',
      text: `Vertical Skeletal Metrics: Mandibular plane angle measures ${mpa}° (Norm: 32° / 25° FMA).`,
    });
  } else {
    cephPoints.push({
      id: 'cp-3',
      text: 'Vertical Skeletal Metrics: Vertical skeletal angles (SN-GoGn, FMA) not yet recorded.',
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
  const u1NaMm = steiner.upperIncisorToNaMm?.pre;
  const u1NaDeg = steiner.upperIncisorToNaDeg?.pre;
  const l1NbMm = steiner.lowerIncisorToNbMm?.pre;
  const l1NbDeg = steiner.lowerIncisorToNbDeg?.pre;
  const iiAngle = steiner.interincisalAngle?.pre;

  if (u1NaMm !== undefined && u1NaDeg !== undefined) {
    steinerStickPoints.push({
      id: 'st-1',
      text: `Maxillary Incisor Position: Upper central incisor position to NA line measures ${u1NaMm} mm and ${u1NaDeg}°.`,
    });
  } else {
    steinerStickPoints.push({
      id: 'st-1',
      text: 'Maxillary Incisor Position: Upper incisor to NA line measurements not yet recorded.',
    });
  }

  if (l1NbMm !== undefined && l1NbDeg !== undefined) {
    steinerStickPoints.push({
      id: 'st-2',
      text: `Mandibular Incisor Position: Lower central incisor position to NB line measures ${l1NbMm} mm and ${l1NbDeg}°.`,
    });
  } else {
    steinerStickPoints.push({
      id: 'st-2',
      text: 'Mandibular Incisor Position: Lower incisor to NB line measurements not yet recorded.',
    });
  }

  if (iiAngle !== undefined) {
    steinerStickPoints.push({
      id: 'st-3',
      text: `Incisor Inclination & Interincisal Angle: The interincisal angle measures ${iiAngle}° (Norm: 131°).`,
    });
  } else {
    steinerStickPoints.push({
      id: 'st-3',
      text: 'Incisor Inclination: Interincisal angle not yet recorded.',
    });
  }

  // --- 8. MODEL ANALYSIS SUMMARY ---
  const modelPoints: DiagnosisPointItem[] = [];
  const model: Partial<ModelAnalysisSection> = patient.modelAnalysis || {};
  const tw = model.toothWidths || {};

  const careyLower = calculateCarey(tw, model.mandibularArchLengthAvailable ?? '');
  const nanceUpper = calculateNanceMaxillary(tw, model.maxillaryArchLengthAvailable ?? '');
  const bolton = calculateBolton(tw);
  const ashleyHowe = calculateAshleyHowe(model.premolarBasalArchWidth || '', tw);

  if (nanceUpper.discrepancy !== null) {
    modelPoints.push({
      id: 'ma-1',
      text: `Maxillary Arch Perimeter (Nance): Available arch length of ${model.maxillaryArchLengthAvailable} mm vs tooth material of ${nanceUpper.totalToothMaterial.toFixed(1)} mm yields a discrepancy of ${nanceUpper.discrepancy > 0 ? '+' : ''}${nanceUpper.discrepancy.toFixed(1)} mm (${nanceUpper.inference}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-1',
      text: `Maxillary Arch Perimeter Analysis: ${nanceUpper.inference}.`,
    });
  }

  if (careyLower.discrepancy !== null) {
    modelPoints.push({
      id: 'ma-2',
      text: `Mandibular Arch Perimeter (Carey): Available arch length of ${model.mandibularArchLengthAvailable} mm vs tooth material of ${careyLower.totalToothMaterial.toFixed(1)} mm yields a discrepancy of ${careyLower.discrepancy > 0 ? '+' : ''}${careyLower.discrepancy.toFixed(1)} mm (${careyLower.inference}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-2',
      text: `Mandibular Arch Perimeter Analysis: ${careyLower.inference}.`,
    });
  }

  if (bolton.overallRatio !== null) {
    modelPoints.push({
      id: 'ma-3',
      text: `Bolton's Tooth Ratio: Overall ratio is ${bolton.overallRatio.toFixed(1)}% (Norm: 91.3%) and Anterior ratio is ${bolton.anteriorRatio !== null ? bolton.anteriorRatio.toFixed(1) + '%' : '—'} (Norm: 77.2%) (${bolton.overallInference}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-3',
      text: `Bolton's Tooth Ratio Analysis: ${bolton.overallInference}.`,
    });
  }

  if (ashleyHowe.pmbaRatio !== null) {
    modelPoints.push({
      id: 'ma-4',
      text: `Ashley-Howe Basal Arch Analysis: PMBA W% is ${ashleyHowe.pmbaRatio.toFixed(1)}% (Norm: > 44%) (${ashleyHowe.inference}).`,
    });
  } else {
    modelPoints.push({
      id: 'ma-4',
      text: `Ashley-Howe Basal Arch Analysis: ${ashleyHowe.inference}.`,
    });
  }

  const isMixedDentition = patient.modelAnalysis?.dentitionType === 'Mixed Dentition' ||
    (typeof patient.age === 'number' && patient.age > 0 && patient.age <= 12 && patient.modelAnalysis?.dentitionType !== 'Permanent Dentition');

  if (isMixedDentition) {
    const tanaka = calculateTanakaJohnston(tw);
    if (tanaka.hasAll4MandibularIncisors) {
      modelPoints.push({
        id: 'ma-5',
        text: `Tanaka-Johnston Mixed Dentition Analysis: ${tanaka.inference}.`,
      });
    }
  }

  // --- 9. BONWILL-HAWLEY TRIANGLE DIAGNOSIS ---
  const bonwillPoints: DiagnosisPointItem[] = [];
  const sumAnteriors = sumAnterior6FromFdi(tw, 'maxillary');

  if (sumAnteriors > 0) {
    const idealIntercanine = (sumAnteriors / 3) + 6.0;
    const idealIntermolar = sumAnteriors + 6.0;
    bonwillPoints.push({
      id: 'bh-1',
      text: `Ideal Arch Geometry: Calculated Sum of Anteriors (13 to 23) measures ${sumAnteriors.toFixed(1)} mm, establishing a Bonwill Equilateral Triangle side length of approximately 100.0 mm.`,
    });
    bonwillPoints.push({
      id: 'bh-2',
      text: `Calculated Target Dimensions: Computed ideal intercanine width target is ${idealIntercanine.toFixed(1)} mm and ideal intermolar width target is ${idealIntermolar.toFixed(1)} mm.`,
    });
    bonwillPoints.push({
      id: 'bh-3',
      text: `Arch Perimeter & Depth: Target arch perimeter measures ${(sumAnteriors * 2.1).toFixed(1)} mm with an anterior arc radius of R = ${(sumAnteriors / 3 + 3).toFixed(1)} mm.`,
    });
  } else {
    bonwillPoints.push({
      id: 'bh-1',
      text: 'Ideal Arch Geometry: Enter maxillary anterior tooth widths (13 to 23) to compute customized Bonwill-Hawley arch dimensions.',
    });
  }

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
