import { PatientRecord } from '../types';

export interface WhyEvidenceDetail {
  finding: string;
  evidence: string;
  alsoConsider?: string;
}

export interface SectionTutorData {
  id: 'angle' | 'skeletal' | 'dental' | 'softTissue';
  sectionNumber: number;
  title: string;
  subtitle: string;
  patientFindings: string;
  aiGuidance: string;
  whyDetails: WhyEvidenceDetail;
  suggestedWording: string;
  subsections?: { title: string; findings: string; guidance: string }[];
}

export interface ReasoningStep {
  componentTitle: string;
  finding: string;
  evidence: string;
  inference: string;
  diagnosisComponent: string;
}

export interface ReasoningCheckResult {
  status: 'pass' | 'warning' | 'fail';
  title: string;
  message: string;
  suggestion?: string;
}

/**
 * Extracts and normalizes Ceph and clinical values from PatientRecord safely
 */
export function extractPatientOrthoFindings(patient: PatientRecord) {
  const rad = (patient.radiographyGrowth || {}) as any;
  const intra = (patient.intraoralSection || {}) as any;
  const extra = (patient.extraoralProfile || {}) as any;
  const model = (patient.modelAnalysis || {}) as any;
  const cephModule = (patient.cephLandmarkModuleData?.geometryData || {}) as any;
  const steiner = (rad.steinersAnalysis || {}) as any;
  const downs = (rad.downsAnalysis || {}) as any;
  const mcnamara = (rad.mcnamaraAnalysis || {}) as any;
  const cogs = (rad.cogsAnalysis || {}) as any;
  const cephText = rad.lateralCephFindings || patient.investigations?.cephalometricSummary || '';

  // Helper regex parser for ceph findings text if structured objects are empty
  const parseNumFromText = (keyPattern: RegExp): number | undefined => {
    if (!cephText) return undefined;
    const match = cephText.match(keyPattern);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      return isNaN(val) ? undefined : val;
    }
    return undefined;
  };

  // 1. Cephalometric Parameters
  const sna =
    steiner.sna?.pre !== undefined && steiner.sna?.pre !== ''
      ? Number(steiner.sna.pre)
      : cogs.sna !== undefined && cogs.sna !== ''
      ? Number(cogs.sna)
      : mcnamara.sna !== undefined && mcnamara.sna !== ''
      ? Number(mcnamara.sna)
      : cephModule.SNA !== undefined
      ? Number(cephModule.SNA)
      : parseNumFromText(/(?:SNA|sna)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const snb =
    steiner.snb?.pre !== undefined && steiner.snb?.pre !== ''
      ? Number(steiner.snb.pre)
      : cogs.snb !== undefined && cogs.snb !== ''
      ? Number(cogs.snb)
      : mcnamara.snb !== undefined && mcnamara.snb !== ''
      ? Number(mcnamara.snb)
      : cephModule.SNB !== undefined
      ? Number(cephModule.SNB)
      : parseNumFromText(/(?:SNB|snb)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  let anb =
    steiner.anb?.pre !== undefined && steiner.anb?.pre !== ''
      ? Number(steiner.anb.pre)
      : cogs.anb !== undefined && cogs.anb !== ''
      ? Number(cogs.anb)
      : mcnamara.anb !== undefined && mcnamara.anb !== ''
      ? Number(mcnamara.anb)
      : cephModule.ANB !== undefined
      ? Number(cephModule.ANB)
      : parseNumFromText(/(?:ANB|anb)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  if (anb === undefined && sna !== undefined && snb !== undefined) {
    anb = sna - snb;
  }

  const wits =
    mcnamara.wits !== undefined && mcnamara.wits !== ''
      ? Number(mcnamara.wits)
      : cogs.wits !== undefined && cogs.wits !== ''
      ? Number(cogs.wits)
      : cephModule.Wits !== undefined
      ? Number(cephModule.Wits)
      : parseNumFromText(/(?:Wits|wits)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const fma =
    steiner.goGnToSnDeg?.pre !== undefined && steiner.goGnToSnDeg?.pre !== ''
      ? Number(steiner.goGnToSnDeg.pre)
      : downs.mandibularPlaneAngle !== undefined && downs.mandibularPlaneAngle !== ''
      ? Number(downs.mandibularPlaneAngle)
      : cogs.fma !== undefined && cogs.fma !== ''
      ? Number(cogs.fma)
      : cephModule.FMA !== undefined
      ? Number(cephModule.FMA)
      : parseNumFromText(/(?:FMA|fma|SN-MP|GoGn-SN)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const yAxis =
    downs.yAxis !== undefined && downs.yAxis !== ''
      ? Number(downs.yAxis)
      : parseNumFromText(/(?:Y-axis|Y axis|YAxis)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const u1Sn =
    steiner.u1ToNaDeg?.pre !== undefined && steiner.u1ToNaDeg?.pre !== ''
      ? Number(steiner.u1ToNaDeg.pre)
      : cephModule['U1-SN'] !== undefined
      ? Number(cephModule['U1-SN'])
      : parseNumFromText(/(?:U1-SN|U1 to SN|U1-NA deg)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const impa =
    downs.l1ToMandibularPlane !== undefined && downs.l1ToMandibularPlane !== ''
      ? Number(downs.l1ToMandibularPlane)
      : steiner.l1ToNbDeg?.pre !== undefined && steiner.l1ToNbDeg?.pre !== ''
      ? Number(steiner.l1ToNbDeg.pre)
      : cephModule.IMPA !== undefined
      ? Number(cephModule.IMPA)
      : parseNumFromText(/(?:IMPA|L1-MP|L1 to MP)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  const interincisal =
    downs.interincisalAngle !== undefined && downs.interincisalAngle !== ''
      ? Number(downs.interincisalAngle)
      : steiner.interincisalDeg?.pre !== undefined && steiner.interincisalDeg?.pre !== ''
      ? Number(steiner.interincisalDeg.pre)
      : parseNumFromText(/(?:Interincisal|interincisal)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/i);

  // 2. Clinical Dental
  const molarRight = intra.buccalOcclusionRight || 'Class I';
  const molarLeft = intra.buccalOcclusionLeft || 'Class I';
  const canineRight = intra.canineRelationRight || 'Class I';
  const canineLeft = intra.canineRelationLeft || 'Class I';
  const incisorRel = intra.incisorRelation || 'Class I';

  const overjet = intra.overjetMm !== '' && intra.overjetMm !== undefined ? Number(intra.overjetMm) : undefined;
  const overbite = intra.overbiteMm !== '' && intra.overbiteMm !== undefined ? Number(intra.overbiteMm) : undefined;
  const crossbite = intra.crossbite || 'None';

  // 3. Soft Tissue & Profile
  const profileType = extra.profile || 'Convex';
  const lipCompetence = extra.lipPostureTonicity || 'Competent';
  const nasolabialAngle = extra.nasolabialAngle || 'Average';
  const facialDivergence = extra.facialDivergence || 'Straight';

  // 4. Crowding / Spacing / Arch Analysis
  const maxAlignment = model.archAlignment || intra.archInadequacies || '';
  const maxIrregularities = model.individualIrregularities || '';
  const archDiscrepancy = model.archDiscrepancyMm !== undefined && model.archDiscrepancyMm !== '' ? Number(model.archDiscrepancyMm) : undefined;
  const modelNotes = patient.investigations?.modelAnalysisSummary || '';

  return {
    sna,
    snb,
    anb,
    wits,
    fma,
    yAxis,
    u1Sn,
    impa,
    interincisal,
    molarRight,
    molarLeft,
    canineRight,
    canineLeft,
    incisorRel,
    overjet,
    overbite,
    crossbite,
    profileType,
    lipCompetence,
    nasolabialAngle,
    facialDivergence,
    maxAlignment,
    maxIrregularities,
    archDiscrepancy,
    modelNotes,
    hasPhotos: Boolean(
      patient.extraoralPhotos?.frontal_rest ||
      patient.extraoralPhotos?.profile ||
      patient.extraoralPhotos?.frontal_smile ||
      patient.extraoralPhotos?.frontalRest ||
      patient.extraoralPhotos?.profileRight
    ),
  };
}

/**
 * Builds the 4 major diagnosis sections based on saved patient findings
 */
export function buildFourDiagnosisSections(patient: PatientRecord): Record<'angle' | 'skeletal' | 'dental' | 'softTissue', SectionTutorData> {
  const d = extractPatientOrthoFindings(patient);

  // ==========================================
  // SECTION 1: ANGLE'S CLASSIFICATION
  // ==========================================
  const isMolarSame = d.molarRight === d.molarLeft;
  const molarText = isMolarSame ? `${d.molarRight} molar bilaterally` : `${d.molarRight} right / ${d.molarLeft} left`;
  const isCanineSame = d.canineRight === d.canineLeft;
  const canineText = isCanineSame ? `${d.canineRight} canine bilaterally` : `${d.canineRight} right / ${d.canineLeft} left`;
  
  const anglePatientFindings = `${molarText} · ${canineText} · ${d.incisorRel} incisor`;

  let angleAiGuidance = `The recorded molar and canine relationships support an Angle ${d.molarRight} dental relationship.`;
  if (d.molarRight.includes('Class II') && d.anb !== undefined && d.anb <= 4 && d.anb >= 0) {
    angleAiGuidance = `The recorded molar relationship indicates an Angle Class II dental relationship on a Skeletal Class I jaw base. Note: Angle Class II does not automatically indicate skeletal Class II.`;
  } else if (d.molarRight.includes('Class II')) {
    angleAiGuidance = `The recorded molar and canine relationships support an Angle Class II dental relationship.`;
  } else if (d.molarRight.includes('Class III')) {
    angleAiGuidance = `The recorded molar relationship supports an Angle Class III dental relationship. Note: Dental Class III does not automatically equal true skeletal Class III.`;
  }

  let angleSuggested = `Angle ${d.molarRight} malocclusion, characterized by ${molarText.toLowerCase()} and ${canineText.toLowerCase()} with ${d.incisorRel.toLowerCase()} incisor relationship.`;
  if (d.molarRight.includes('Class II') && d.overjet && d.overjet > 4) {
    angleSuggested = `Angle Class II Division 1 malocclusion, with ${molarText.toLowerCase()} and increased overjet.`;
  } else if (d.molarRight.includes('Class II') && d.u1Sn && d.u1Sn < 100) {
    angleSuggested = `Angle Class II Division 2 malocclusion, with ${molarText.toLowerCase()} and retroclined maxillary central incisors.`;
  }

  const angleSection: SectionTutorData = {
    id: 'angle',
    sectionNumber: 1,
    title: "01 · Angle's Classification",
    subtitle: 'Clinical dental relationship',
    patientFindings: anglePatientFindings,
    aiGuidance: angleAiGuidance,
    whyDetails: {
      finding: `Right Molar: ${d.molarRight}, Left Molar: ${d.molarLeft}, Canines: ${d.canineRight}`,
      evidence: `Angle's classification evaluates clinical dental relationships (molar and canine occlusion) rather than cephalometric jaw bases alone.`,
      alsoConsider: `Ceph jaw bases (ANB) to differentiate Dental Class II/III from Skeletal Class II/III.`,
    },
    suggestedWording: angleSuggested,
  };

  // ==========================================
  // SECTION 2: SKELETAL RELATIONSHIP (Sagittal, Vertical, Transverse)
  // ==========================================
  // Sagittal
  let sagFindings = `SNA ${d.sna !== undefined ? `${d.sna}°` : 'N/A'} · SNB ${d.snb !== undefined ? `${d.snb}°` : 'N/A'} · ANB ${d.anb !== undefined ? `${d.anb}°` : 'N/A'} · Wits ${d.wits !== undefined ? `${d.wits} mm` : 'not recorded'}`;
  let sagGuidance = '';
  if (d.anb !== undefined) {
    if (d.anb > 4) {
      sagGuidance = `The available sagittal measurements are compatible with a skeletal Class II relationship. ANB of ${d.anb}° supports this interpretation; SNA (${d.sna ?? 'N/A'}°) and SNB (${d.snb ?? 'N/A'}°) help assess the relative contribution of maxillary and mandibular position.`;
    } else if (d.anb < 0) {
      sagGuidance = `The available sagittal measurements indicate a skeletal Class III relationship. ANB of ${d.anb}° supports this interpretation; SNA and SNB help evaluate maxillary retrognathism vs mandibular prognathism.`;
    } else {
      sagGuidance = `The available sagittal measurements are compatible with a skeletal Class I relationship. ANB of ${d.anb}° supports this interpretation; SNA (${d.sna ?? 'N/A'}°) and SNB (${d.snb ?? 'N/A'}°) help assess the relative contribution of maxillary and mandibular position.`;
    }
  } else {
    sagGuidance = `Sagittal skeletal pattern cannot be confidently classified due to unrecorded ANB/SNA/SNB measurements.`;
  }

  // Vertical
  let vertFindings = `FMA ${d.fma !== undefined ? `${d.fma}°` : 'N/A'} · Y-axis ${d.yAxis !== undefined ? `${d.yAxis}°` : 'N/A'}`;
  let vertGuidance = '';
  if (d.fma !== undefined) {
    if (d.fma > 28) {
      vertGuidance = `FMA of ${d.fma}° indicates a hyperdivergent (high mandibular plane angle) vertical skeletal growth pattern.`;
    } else if (d.fma < 22) {
      vertGuidance = `FMA of ${d.fma}° indicates a hypodivergent (low mandibular plane angle) vertical skeletal growth pattern.`;
    } else {
      vertGuidance = `FMA of ${d.fma}° indicates an average normodivergent vertical skeletal growth pattern.`;
    }
  } else {
    vertGuidance = `Vertical skeletal pattern cannot be confidently classified from the available measurements.`;
  }

  // Transverse
  let transFindings = d.crossbite !== 'None' ? `Crossbite: ${d.crossbite}` : `Crossbite: None recorded`;
  let transGuidance = '';
  if (d.crossbite && d.crossbite !== 'None') {
    transGuidance = `Posterior/anterior crossbite (${d.crossbite}) indicates a transverse discrepancy requiring arch-width analysis.`;
  } else {
    transGuidance = `Transverse skeletal relationship cannot be confidently determined from the currently available data.`;
  }

  const skPatientFindings = `Sagittal: ANB ${d.anb !== undefined ? `${d.anb}°` : 'N/A'} · Vertical: FMA ${d.fma !== undefined ? `${d.fma}°` : 'N/A'} · Transverse: ${d.crossbite || 'No crossbite'}`;
  const skAiGuidance = `${sagGuidance} ${vertGuidance}`;

  let skSuggested = `Skeletal Class I sagittal relationship with an average vertical growth pattern and no significant transverse discrepancy.`;
  if (d.anb !== undefined && d.anb > 4) {
    const vertDesc = d.fma !== undefined && d.fma > 28 ? 'hyperdivergent' : d.fma !== undefined && d.fma < 22 ? 'hypodivergent' : 'average vertical';
    skSuggested = `Skeletal Class II sagittal relationship supported by an ANB of ${d.anb}°, with a ${vertDesc} skeletal pattern.`;
  } else if (d.anb !== undefined && d.anb < 0) {
    const vertDesc = d.fma !== undefined && d.fma > 28 ? 'hyperdivergent' : d.fma !== undefined && d.fma < 22 ? 'hypodivergent' : 'average vertical';
    skSuggested = `Skeletal Class III sagittal relationship supported by a negative ANB of ${d.anb}°, with a ${vertDesc} skeletal pattern.`;
  }

  const skeletalSection: SectionTutorData = {
    id: 'skeletal',
    sectionNumber: 2,
    title: '02 · Skeletal Relationship',
    subtitle: 'Sagittal · Vertical · Transverse',
    patientFindings: skPatientFindings,
    aiGuidance: skAiGuidance,
    whyDetails: {
      finding: `ANB = ${d.anb !== undefined ? `${d.anb}°` : 'N/A'}, FMA = ${d.fma !== undefined ? `${d.fma}°` : 'N/A'}, Wits = ${d.wits ?? 'N/A'}`,
      evidence: `ANB evaluates sagittal maxillo-mandibular discrepancy. FMA assesses vertical mandibular plane orientation relative to cranial base.`,
      alsoConsider: `SNA · SNB · Wits appraisal · facial heights · clinical crossbite findings`,
    },
    suggestedWording: skSuggested,
    subsections: [
      { title: 'Sagittal', findings: sagFindings, guidance: sagGuidance },
      { title: 'Vertical', findings: vertFindings, guidance: vertGuidance },
      { title: 'Transverse', findings: transFindings, guidance: transGuidance },
    ],
  };

  // ==========================================
  // SECTION 3: DENTAL RELATIONSHIP
  // ==========================================
  const ojText = d.overjet !== undefined ? `OJ ${d.overjet} mm` : 'OJ not recorded';
  const obText = d.overbite !== undefined ? `OB ${d.overbite} mm` : 'OB not recorded';
  const crowdText = d.archDiscrepancy !== undefined
    ? `Arch Discrepancy: ${d.archDiscrepancy} mm`
    : d.maxAlignment
    ? `Alignment: ${d.maxAlignment}`
    : 'Crowding/spacing not recorded';

  const dentalPatientFindings = `Molar: ${d.molarRight} · Canine: ${d.canineRight} · ${ojText} · ${obText} · ${crowdText}`;

  let dentalGuidance = `The recorded findings indicate a Class I dental relationship with approximately normal overjet and overbite.`;
  if (d.overjet !== undefined && d.overjet > 3) {
    dentalGuidance = `The recorded findings indicate a Class I dental relationship with increased overjet (${d.overjet} mm) and overbite (${d.overbite ?? 'N/A'} mm).`;
  }

  if (!d.archDiscrepancy && !d.maxAlignment) {
    dentalGuidance += ` Crowding/spacing cannot be quantified from the currently available data.`;
  } else if (d.archDiscrepancy !== undefined) {
    const absD = Math.abs(d.archDiscrepancy);
    const cat = absD <= 3 ? 'mild' : absD <= 6 ? 'moderate' : 'severe';
    dentalGuidance += ` A ${absD} mm arch-length discrepancy may be described as ${cat} crowding depending on the classification system used.`;
  }

  let dentalSuggested = `Class I dental relationship with normal overjet (${d.overjet ?? '2.5'} mm) and overbite (${d.overbite ?? '2.0'} mm).`;
  if (d.overjet !== undefined && d.overjet > 3) {
    dentalSuggested = `Class I dental relationship with increased overjet of ${d.overjet} mm and overbite of ${d.overbite ?? '2.0'} mm.`;
  }

  const dentalSection: SectionTutorData = {
    id: 'dental',
    sectionNumber: 3,
    title: '03 · Dental Relationship',
    subtitle: 'Molar · Canine · Incisor · OJ · OB · Compensation · Crowding/Spacing',
    patientFindings: dentalPatientFindings,
    aiGuidance: dentalGuidance,
    whyDetails: {
      finding: `Molar: ${d.molarRight}, OJ: ${d.overjet ?? 'N/A'} mm, OB: ${d.overbite ?? 'N/A'} mm, U1-SN: ${d.u1Sn ?? 'N/A'}°, IMPA: ${d.impa ?? 'N/A'}°`,
      evidence: `Evaluates dental occlusion, horizontal/vertical overlap, incisor inclination, dentoalveolar compensation, and arch length discrepancy.`,
      alsoConsider: `Dentoalveolar compensation masking skeletal base discrepancy.`,
    },
    suggestedWording: dentalSuggested,
    subsections: [
      {
        title: 'Occlusal relationship',
        findings: `Molar: ${d.molarRight} · Canine: ${d.canineRight} · Incisor: ${d.incisorRel}`,
        guidance: `Assesses buccal segment relationship and canine guidance.`,
      },
      {
        title: 'Incisor relationship & inclination',
        findings: `U1-SN: ${d.u1Sn !== undefined ? `${d.u1Sn}°` : 'N/A'} · IMPA: ${d.impa !== undefined ? `${d.impa}°` : 'N/A'}`,
        guidance: `Evaluates upper and lower incisor inclination relative to basal bones and dentoalveolar compensation.`,
      },
      {
        title: 'Overjet / Overbite',
        findings: `${ojText} · ${obText}`,
        guidance: `Measures horizontal overjet and vertical overbite in mm.`,
      },
      {
        title: 'Arch alignment (Crowding / Spacing)',
        findings: crowdText,
        guidance: d.archDiscrepancy !== undefined
          ? `Arch length discrepancy is ${d.archDiscrepancy} mm.`
          : `Crowding/spacing cannot be quantified from the currently available data.`,
      },
    ],
  };

  // ==========================================
  // SECTION 4: SOFT-TISSUE PROFILE
  // ==========================================
  const stPatientFindings = `${d.profileType} profile · ${d.lipCompetence} lips · Nasolabial angle: ${d.nasolabialAngle}`;

  const stAiGuidance = `The recorded ${d.profileType.toLowerCase()} profile should be interpreted together with the skeletal and dental findings rather than being used independently to establish skeletal classification.`;

  let stSuggested = `${d.profileType} soft-tissue profile with ${d.lipCompetence.toLowerCase()} lips at rest.`;

  const softTissueSection: SectionTutorData = {
    id: 'softTissue',
    sectionNumber: 4,
    title: '04 · Soft-Tissue Profile',
    subtitle: 'Profile contour · Lip posture · Nasolabial angle',
    patientFindings: stPatientFindings,
    aiGuidance: stAiGuidance,
    whyDetails: {
      finding: `Profile: ${d.profileType}, Lips: ${d.lipCompetence}, Nasolabial Angle: ${d.nasolabialAngle}`,
      evidence: `Soft tissue envelope reflects underlying skeletal jaw bases and incisor position.`,
      alsoConsider: `Soft tissue compensation and chin prominence.`,
    },
    suggestedWording: stSuggested,
  };

  return {
    angle: angleSection,
    skeletal: skeletalSection,
    dental: dentalSection,
    softTissue: softTissueSection,
  };
}

/**
 * Checks reasoning of student diagnosis for a specific section
 */
export function checkSectionReasoning(
  sectionKey: 'angle' | 'skeletal' | 'dental' | 'softTissue',
  studentText: string,
  patient: PatientRecord
): ReasoningCheckResult {
  const d = extractPatientOrthoFindings(patient);
  const textLower = studentText.toLowerCase().trim();

  if (!textLower) {
    return {
      status: 'warning',
      title: 'Empty Diagnosis Field',
      message: 'Please write your diagnosis for this section before checking reasoning.',
    };
  }

  if (sectionKey === 'angle') {
    if (d.molarRight.includes('Class II') && textLower.includes('class i') && !textLower.includes('class ii')) {
      return {
        status: 'fail',
        title: 'Review required',
        message: `❌ The recorded molar relationship is Class II, but your text states Class I.`,
        suggestion: `Revise to "Angle Class II malocclusion".`,
      };
    }
    return {
      status: 'pass',
      title: 'Consistent with available findings',
      message: `✓ Consistent with available findings for Angle's classification.`,
    };
  }

  if (sectionKey === 'skeletal') {
    if (d.anb !== undefined && d.anb > 4 && textLower.includes('skeletal class i') && !textLower.includes('class ii')) {
      return {
        status: 'fail',
        title: 'Review required',
        message: `❌ The available measurements (ANB = ${d.anb}°) indicate Skeletal Class II, but you entered Skeletal Class I.`,
        suggestion: `Revise to "Skeletal Class II" or re-check Ceph measurements.`,
      };
    }
    if (d.anb !== undefined && d.anb > 4 && textLower.includes('mandibular retrusion') && (d.snb === undefined || d.snb >= 78)) {
      return {
        status: 'warning',
        title: 'Partially supported',
        message: `⚠️ Partially supported. The sagittal measurements support a Class II relationship, but the available data do not conclusively establish mandibular retrusion as the sole cause (SNB = ${d.snb ?? 'N/A'}°).`,
        suggestion: `Consider phrasing as "Skeletal Class II sagittal relationship supported by ANB angle".`,
      };
    }
    return {
      status: 'pass',
      title: 'Consistent with available findings',
      message: `✓ Consistent with available sagittal, vertical, and transverse findings.`,
    };
  }

  if (sectionKey === 'dental') {
    if (textLower.includes('traumatic') && (d.overbite === undefined || d.overbite < 4)) {
      return {
        status: 'warning',
        title: 'Partially supported',
        message: `⚠️ "Traumatic" deep bite requires clinical documentation of palatal tissue impingement.`,
        suggestion: `Describe as "increased overbite (deep bite)" unless tissue trauma is verified.`,
      };
    }
    return {
      status: 'pass',
      title: 'Consistent with available findings',
      message: `✓ Consistent with recorded dental occlusion, overjet, overbite, and crowding parameters.`,
    };
  }

  if (sectionKey === 'softTissue') {
    return {
      status: 'pass',
      title: 'Consistent with available findings',
      message: `✓ Consistent with extraoral profile and lip posture findings.`,
    };
  }

  return {
    status: 'pass',
    title: 'Consistent with available findings',
    message: `✓ Consistent with recorded patient findings.`,
  };
}

/**
 * Refines wording for a specific section
 */
export function improveSectionWording(
  sectionKey: 'angle' | 'skeletal' | 'dental' | 'softTissue',
  studentText: string,
  patient: PatientRecord
): string {
  if (!studentText || !studentText.trim()) {
    const sections = buildFourDiagnosisSections(patient);
    return sections[sectionKey].suggestedWording;
  }

  let text = studentText.trim();

  // Common replacements for academic terminology
  text = text
    .replace(/upper teeth sticking out/gi, 'proclined maxillary incisors')
    .replace(/lower jaw behind/gi, 'mandibular retrusion')
    .replace(/crooked teeth/gi, 'anterior crowding')
    .replace(/upper jaw forward/gi, 'maxillary prognathism')
    .replace(/upper and lower jaws are normal/gi, 'Skeletal Class I sagittal relationship')
    .replace(/class 1/gi, 'Class I')
    .replace(/class 2/gi, 'Class II')
    .replace(/class 3/gi, 'Class III');

  return text;
}

/**
 * Explains step-by-step diagnostic reasoning chain for final diagnosis
 */
export function explainDiagnosisReasoning(studentText: string, patient: PatientRecord): ReasoningStep[] {
  const d = extractPatientOrthoFindings(patient);
  const textLower = studentText.toLowerCase();
  const steps: ReasoningStep[] = [];

  // Angle
  if (textLower.includes('angle') || textLower.includes('class i') || textLower.includes('class ii') || textLower.includes('class iii')) {
    steps.push({
      componentTitle: "1. Angle's Classification",
      finding: `Molar Relation: Right (${d.molarRight}), Left (${d.molarLeft}); Canine Relation: Right (${d.canineRight})`,
      evidence: `Occlusal inspection confirms ${d.molarRight} molar relation`,
      inference: `Dental malocclusion classification based on molar and canine occlusion`,
      diagnosisComponent: `Angle ${d.molarRight} malocclusion`,
    });
  }

  // Skeletal Sagittal
  if (textLower.includes('skeletal') || textLower.includes('sagittal') || d.anb !== undefined) {
    const anbStr = d.anb !== undefined ? `${d.anb}°` : 'recorded in Ceph';
    steps.push({
      componentTitle: '2. Skeletal Relationship (Sagittal)',
      finding: `ANB = ${anbStr}, SNA = ${d.sna ?? 'N/A'}°, SNB = ${d.snb ?? 'N/A'}°, Wits = ${d.wits ?? 'N/A'} mm`,
      evidence: d.anb !== undefined && d.anb > 4 ? `ANB > 4° indicates sagittal jaw discrepancy` : `ANB within 0-4° normal range`,
      inference: d.anb !== undefined && d.anb > 4 ? `Skeletal Class II jaw base` : `Skeletal Class I/III jaw base`,
      diagnosisComponent: d.anb !== undefined && d.anb > 4 ? `Skeletal Class II sagittal relationship` : `Skeletal Class I sagittal relationship`,
    });
  }

  // Skeletal Vertical
  if (textLower.includes('vertical') || textLower.includes('growth') || textLower.includes('divergent') || d.fma !== undefined) {
    steps.push({
      componentTitle: '2. Skeletal Relationship (Vertical)',
      finding: `FMA = ${d.fma ?? 'N/A'}°, Y-Axis = ${d.yAxis ?? 'N/A'}°`,
      evidence: d.fma !== undefined ? (d.fma > 28 ? 'FMA > 28° indicates vertical growth' : 'FMA within normal range') : 'Clinical FMA evaluation',
      inference: `Mandibular plane angle dictates facial divergence`,
      diagnosisComponent: d.fma !== undefined && d.fma > 28 ? `Hyperdivergent vertical pattern` : `Average vertical skeletal pattern`,
    });
  }

  // Dental
  if (textLower.includes('overjet') || textLower.includes('overbite') || textLower.includes('incisor') || textLower.includes('crowding')) {
    steps.push({
      componentTitle: '3. Dental Relationship',
      finding: `OJ = ${d.overjet ?? 'N/A'} mm, OB = ${d.overbite ?? 'N/A'} mm, U1-SN = ${d.u1Sn ?? 'N/A'}°, IMPA = ${d.impa ?? 'N/A'}°`,
      evidence: `Clinical and cephalometric dental measurements`,
      inference: `Dental relationship, overjet, overbite, and arch alignment`,
      diagnosisComponent: `Class I dental relationship with normal overjet and overbite`,
    });
  }

  // Soft Tissue
  if (textLower.includes('profile') || textLower.includes('lip') || textLower.includes('convex')) {
    steps.push({
      componentTitle: '4. Soft-Tissue Profile',
      finding: `Profile = ${d.profileType}, Lip Posture = ${d.lipCompetence}`,
      evidence: `Extraoral clinical examination`,
      inference: `Soft tissue envelope reflects underlying jaw bases`,
      diagnosisComponent: `${d.profileType} soft-tissue profile`,
    });
  }

  return steps;
}

/**
 * Combines confirmed section texts into a single integrated final diagnosis statement
 */
export function buildCombinedFinalDiagnosis(sectionsText: Record<'angle' | 'skeletal' | 'dental' | 'softTissue', string>): string {
  const parts: string[] = [];

  if (sectionsText.angle.trim()) parts.push(sectionsText.angle.trim());
  if (sectionsText.skeletal.trim()) parts.push(sectionsText.skeletal.trim());
  if (sectionsText.dental.trim()) parts.push(sectionsText.dental.trim());
  if (sectionsText.softTissue.trim()) parts.push(sectionsText.softTissue.trim());

  if (parts.length === 0) return '';

  const cleanParts = parts.map((p) => (p.endsWith('.') ? p : `${p}.`));
  return cleanParts.join(' ');
}
