export interface CephTableRow {
  parameter: string;
  measured: string;
  norm: string;
  inference: string;
}

export interface SheetInferencePoint {
  title: string;
  finding: string;
  badge?: string;
  badgeColor?: string;
}

export interface CephSheetPayload {
  slideTitle: string;
  slideSubtitle: string;
  sectionHeader: string;
  tableHeaders: string[];
  rows: (string | number)[][];
  colWidths: number[];
  alignments: ('left' | 'center' | 'right')[];
  tableRowHeight: number;
  customFontSize: number;
  inferenceCardTitle: string;
  inferencePoints: SheetInferencePoint[];
  biomechanicsDirective?: string;
}

export const findCephVal = (...candidateValues: (number | string | undefined | null)[]): number | null => {
  for (const c of candidateValues) {
    if (c !== undefined && c !== null && c !== '') {
      const num = Number(c);
      if (!isNaN(num)) return num;
    }
  }
  return null;
};

// Sheet 1: Vertical Skeletal Relation & Divergence
export function buildSheet1Payload(
  compCeph: any,
  patientGender: string,
  steinerP: any,
  downsP: any,
  stP: any,
  mcnamaraP: any,
  cogsP: any,
  rickP: any,
  getStageVal: (field: any) => any
): CephSheetPayload {
  const isMale = patientGender === 'Male';
  const midLowerVal = findCephVal(compCeph?.mid_lower_face_ht);
  const softTissueVertProp = findCephVal(compCeph?.soft_tissue_vert_prop);
  const snGoGnVal = findCephVal(compCeph?.sn_go_gn, getStageVal(steinerP?.mandibularPlaneAngle));
  const fmaVal = findCephVal(compCeph?.fma, getStageVal(stP?.fmpa), getStageVal(downsP?.mandibularPlaneAngle), getStageVal(mcnamaraP?.mandibularPlaneAngle));
  const jarabakVal = findCephVal(compCeph?.jarabak_ratio);
  const bjorkVal = findCephVal(compCeph?.bjork_sum);
  const saddleVal = findCephVal(compCeph?.saddle_angle);
  const articularVal = findCephVal(compCeph?.articular_angle);
  const uGonialVal = findCephVal(compCeph?.u_gonial_angle);
  const lGonialVal = findCephVal(compCeph?.l_gonial_angle);
  const yaxisSnVal = findCephVal(compCeph?.yaxis_ns_gn, getStageVal(downsP?.yAxis));
  const yaxisFhVal = findCephVal(compCeph?.yaxis_fh_s_gn);
  const ramusHeightVal = findCephVal(compCeph?.ramus_height_ar_go, getStageVal(cogsP?.ramusHeightArGo), getStageVal(stP?.ascendingRamusLength));
  const basalPlaneVal = findCephVal(compCeph?.basal_plane_angle, getStageVal(stP?.basalAngle));
  const occNfVal = findCephVal(compCeph?.occlusal_to_nf);
  const occMpVal = findCephVal(compCeph?.occlusal_to_mp);
  const vertMaxPlacementVal = findCephVal(compCeph?.vert_max_placement);
  const nAnsNormText = isMale ? '60.0 ± 4.0 mm' : '55.0 ± 2.0 mm';
  const nAnsVal = findCephVal(compCeph?.nasion_to_ans, getStageVal(cogsP?.nAns));
  const maxRotationVal = findCephVal(compCeph?.maxillary_rotation);

  // Compute Ramus Compensation Status
  const isCompensatedByRamus = ramusHeightVal !== null
    ? ((fmaVal !== null && fmaVal > 28 && ramusHeightVal >= 50) || (jarabakVal !== null && jarabakVal >= 63))
    : null;

  // Determine Divergence of Jaw Bases Sub-classification
  let divergenceSubclass = 'Pending Assessment';
  if (compCeph?.anterior_divergent || compCeph?.divergence_subclassification === 'anterior_divergent' || (fmaVal && fmaVal > 29 && jarabakVal && jarabakVal < 62)) {
    divergenceSubclass = 'a) Anterior Divergent (Open Bite / High Mandibular Plane)';
  } else if (compCeph?.anterior_convergent || compCeph?.divergence_subclassification === 'anterior_convergent' || (fmaVal && fmaVal < 21 && jarabakVal && jarabakVal > 65)) {
    divergenceSubclass = 'b) Anterior Convergent (Deep Bite / Flat Mandibular Plane)';
  } else if (compCeph?.upward_rotation_max_mand || compCeph?.divergence_subclassification === 'upward_rotation_max_mand' || (maxRotationVal && maxRotationVal < 5)) {
    divergenceSubclass = 'c) Upward Anterior Rotation of Maxilla & Mandible';
  } else if (compCeph?.downward_rotation_max_mand || compCeph?.divergence_subclassification === 'downward_rotation_max_mand' || (maxRotationVal && maxRotationVal > 11)) {
    divergenceSubclass = 'd) Downward Anterior Rotation of Maxilla & Mandible';
  } else if (fmaVal !== null || jarabakVal !== null) {
    divergenceSubclass = 'Balanced / Parallel Jaw Bases';
  }

  const rows: (string | number)[][] = [
    [
      '1. Mid / Lower Face Height Proportion',
      midLowerVal !== null ? `${midLowerVal.toFixed(1)}%` : '—',
      '45:55 (45.0% ± 3.0%)',
      midLowerVal !== null ? (midLowerVal > 48 ? 'Increased Lower Face Height (Vertical Excess)' : midLowerVal < 42 ? 'Decreased Lower Face Height (Deep Bite Tendency)' : 'Harmonious Mid-to-Lower Facial Proportion') : 'Not Recorded',
    ],
    [
      '2. Soft Tissue Vertical Proportions',
      softTissueVertProp !== null ? `1:${(100 / softTissueVertProp - 1).toFixed(1)} (${softTissueVertProp.toFixed(0)}%)` : '—',
      'Sn-Stm : Stm-Me = 1:2 (30% : 70%)',
      softTissueVertProp !== null ? (softTissueVertProp > 36 ? 'Elongated Upper Lip Philtrum' : softTissueVertProp < 28 ? 'Short Upper Lip / Lower Lip & Chin Dominance' : 'Balanced Soft Tissue Vertical Thirds') : 'Not Recorded',
    ],
    [
      '3. SN-GoGn Angle (Mandibular Plane)',
      snGoGnVal !== null ? `${snGoGnVal.toFixed(1)}°` : '—',
      '32.0° ± 4.0° (28.0° - 36.0°)',
      snGoGnVal !== null ? (snGoGnVal > 36 ? 'Hyperdivergent / Steep Mandibular Plane Incline' : snGoGnVal < 28 ? 'Hypodivergent / Flat Mandibular Plane Incline' : 'Normal Mandibular Plane Inclination') : 'Not Recorded',
    ],
    [
      '4. FMA / FMPA Angle',
      fmaVal !== null ? `${fmaVal.toFixed(1)}°` : '—',
      '25.0° ± 4.0° (21.0° - 29.0°)',
      fmaVal !== null ? (fmaVal > 29 ? 'Hyperdivergent / Clockwise Growth Pattern' : fmaVal < 21 ? 'Hypodivergent / Counter-Clockwise Growth' : 'Normodivergent Balanced Vertical Pattern') : 'Not Recorded',
    ],
    [
      '5. Jarabak\'s Ratio (S-Go / N-Me %)',
      jarabakVal !== null ? `${jarabakVal.toFixed(1)}%` : '—',
      '63.5% (62.0% - 65.0%)',
      jarabakVal !== null ? (jarabakVal < 62 ? 'Posterior Rotator / Clockwise (<62%)' : jarabakVal > 65 ? 'Anterior Rotator / Counter-Clockwise (>65%)' : 'Balanced Jarabak Height Equilibrium') : 'Not Recorded',
    ],
    [
      '6. Björk\'s Sum of 3 Angles',
      bjorkVal !== null ? `${bjorkVal.toFixed(1)}°` : '—',
      '396.0° ± 6.0° (390.0° - 402.0°)',
      bjorkVal !== null ? (bjorkVal > 402 ? 'Clockwise Mandibular Opening (>402°)' : bjorkVal < 390 ? 'Counter-Clockwise Closing (<390°)' : 'Neutral Structural Polygon Equilibrium') : 'Not Recorded',
    ],
    [
      '7. Saddle Angle (N-S-Ar)',
      saddleVal !== null ? `${saddleVal.toFixed(1)}°` : '—',
      '123.0° ± 5.0° (118.0° - 128.0°)',
      saddleVal !== null ? (saddleVal > 128 ? 'Posterior Condylar Position (Class II Risk)' : saddleVal < 118 ? 'Anterior Condylar Position (Class III Risk)' : 'Normal Cranial Base Flexure Angle') : 'Not Recorded',
    ],
    [
      '8. Articular Angle (S-Ar-Go)',
      articularVal !== null ? `${articularVal.toFixed(1)}°` : '—',
      '143.0° ± 6.0° (137.0° - 149.0°)',
      articularVal !== null ? (articularVal > 149 ? 'Mandibular Retrognathism / Clockwise Vector' : articularVal < 137 ? 'Mandibular Prognathism / Counter-Clockwise' : 'Normal Articular Angle Relationship') : 'Not Recorded',
    ],
    [
      '9. Upper Gonial Angle (Ar-Go-N)',
      uGonialVal !== null ? `${uGonialVal.toFixed(1)}°` : '—',
      '54.0° ± 2.0° (52.0° - 55.0°)',
      uGonialVal !== null ? (uGonialVal > 55 ? 'Posterior Ramal Incline / Mandibular Backward Tilt' : uGonialVal < 52 ? 'Upright Ramus / Forward Mandibular Projection' : 'Normal Upper Gonial Incline') : 'Not Recorded',
    ],
    [
      '10. Lower Gonial Angle (N-Go-Me)',
      lGonialVal !== null ? `${lGonialVal.toFixed(1)}°` : '—',
      '76.0° ± 3.0° (70.0° - 75.0°)',
      lGonialVal !== null ? (lGonialVal > 75 ? 'Downward Mandibular Growth / Open Bite Risk' : lGonialVal < 70 ? 'Horizontal Mandibular Growth / Deep Bite' : 'Normal Mandibular Body Divergence') : 'Not Recorded',
    ],
    [
      '11. Y-Axis to SN (N-S-Gn)',
      yaxisSnVal !== null ? `${yaxisSnVal.toFixed(1)}°` : '—',
      '66.0° ± 3.0° (63.0° - 69.0°)',
      yaxisSnVal !== null ? (yaxisSnVal > 69 ? 'Downward & Backward Growth Trajectory' : yaxisSnVal < 63 ? 'Horizontal / Forward Growth Trajectory' : 'Harmonious Growth Vector Axis') : 'Not Recorded',
    ],
    [
      '12. Y-Axis to FH (S-Gn to FH)',
      yaxisFhVal !== null ? `${yaxisFhVal.toFixed(1)}°` : '—',
      '59.0° ± 3.0° (56.0° - 62.0°)',
      yaxisFhVal !== null ? (yaxisFhVal > 62 ? 'Clockwise Mandibular Incline' : yaxisFhVal < 56 ? 'Counter-Clockwise Mandibular Incline' : 'Normal Frankfort-Gn Growth Vector') : 'Not Recorded',
    ],
    [
      '13. Ramus Height & Compensation (Ar-Go)',
      ramusHeightVal !== null ? `${ramusHeightVal.toFixed(1)} mm` : '—',
      '49.0 mm (46.0 - 52.0 mm)',
      ramusHeightVal !== null ? (isCompensatedByRamus ? 'Compensated by Adequate/Robust Ramus Height' : 'Uncompensated / Short Ramus (Vertical Risk)') : 'Not Recorded',
    ],
    [
      '14. Basal Plane Angle (PP to MP)',
      basalPlaneVal !== null ? `${basalPlaneVal.toFixed(1)}°` : '—',
      '25.0° ± 5.0° (20.0° - 30.0°)',
      basalPlaneVal !== null ? (basalPlaneVal > 30 ? 'Increased Inter-Basal Divergence' : basalPlaneVal < 20 ? 'Convergent Basal Planes / Deep Bite' : 'Normal Inter-Basal Plane Angle') : 'Not Recorded',
    ],
    [
      '15. Occlusal Plane to NF (PP)',
      occNfVal !== null ? `${occNfVal.toFixed(1)}°` : '—',
      '14.0° ± 4.0° (10.0° - 18.0°)',
      occNfVal !== null ? (occNfVal > 18 ? 'Steep Maxillary Occlusal Plane Incline' : occNfVal < 10 ? 'Flat Maxillary Occlusal Plane Incline' : 'Harmonious Palatal-Occlusal Relation') : 'Not Recorded',
    ],
    [
      '16. Occlusal Plane to MP',
      occMpVal !== null ? `${occMpVal.toFixed(1)}°` : '—',
      '14.0° ± 4.0° (10.0° - 18.0°)',
      occMpVal !== null ? (occMpVal > 18 ? 'Increased Mandibular Occlusal Divergence' : occMpVal < 10 ? 'Decreased Mandibular Occlusal Divergence' : 'Normal Mandibular-Occlusal Incline') : 'Not Recorded',
    ],
    [
      '17. Vertical Maxillary Placement',
      vertMaxPlacementVal !== null ? `${vertMaxPlacementVal.toFixed(1)} mm` : '—',
      '56.0 mm (53.0 - 60.0 mm)',
      vertMaxPlacementVal !== null ? (vertMaxPlacementVal > 60 ? 'Vertical Maxillary Excess (VME Tendency)' : vertMaxPlacementVal < 53 ? 'Vertical Maxillary Deficiency (VMD)' : 'Ideal Vertical Spatial Maxillary Position') : 'Not Recorded',
    ],
    [
      '18. Nasion to ANS (Upper Face Height)',
      nAnsVal !== null ? `${nAnsVal.toFixed(1)} mm` : '—',
      nAnsNormText,
      nAnsVal !== null ? (nAnsVal > (isMale ? 64 : 57) ? 'Elongated Upper Anterior Facial Height' : nAnsVal < (isMale ? 56 : 53) ? 'Short Upper Anterior Facial Height' : 'Normal Upper Face Height Dimension') : 'Not Recorded',
    ],
    [
      '19. Maxillary Rotation (Palatal Incline)',
      maxRotationVal !== null ? `${maxRotationVal.toFixed(1)}°` : '—',
      '8.0° ± 3.0° (5.0° - 11.0° to SN)',
      maxRotationVal !== null ? (maxRotationVal > 11 ? 'Downward Anterior Tipping of Maxilla' : maxRotationVal < 5 ? 'Upward Anterior Tipping of Maxilla' : 'Normal Maxillary Palatal Orientation') : 'Not Recorded',
    ],
    [
      '20. Divergence of Jaw Bases Sub-classification',
      divergenceSubclass !== 'Pending Assessment' ? divergenceSubclass.split(' (')[0] : '—',
      'Parallel / Harmonious Divergence',
      divergenceSubclass !== 'Pending Assessment' ? divergenceSubclass : 'Not Recorded',
    ],
  ];

  const fmaStatus = fmaVal ? (fmaVal > 29 ? 'Hyperdivergent' : fmaVal < 21 ? 'Hypodivergent' : 'Normodivergent') : 'Pending';
  const jarabakStatus = jarabakVal ? (jarabakVal < 62 ? 'Posterior Rotator' : jarabakVal > 65 ? 'Anterior Rotator' : 'Balanced') : 'Pending';

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Growth Pattern & Divergence Vector',
      finding: fmaVal !== null || snGoGnVal !== null
        ? `${fmaStatus} skeletal pattern (FMA: ${fmaVal?.toFixed(1) ?? '—'}°, SN-GoGn: ${snGoGnVal?.toFixed(1) ?? '—'}°) with ${fmaVal && fmaVal > 29 ? 'clockwise mandibular rotation tendency and elevated vertical growth vector' : fmaVal && fmaVal < 21 ? 'counter-clockwise mandibular rotation tendency and strong horizontal growth vector' : 'balanced vertical skeletal proportions'}.`
        : 'Vertical skeletal divergence and mandibular plane angle measurements pending.',
      badge: fmaStatus !== 'Pending' ? fmaStatus : undefined,
      badgeColor: fmaStatus === 'Hyperdivergent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : fmaStatus === 'Hypodivergent' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      title: 'Rotational Vector & Jarabak Ratio',
      finding: jarabakVal !== null || bjorkVal !== null
        ? `Jarabak Ratio of ${jarabakVal?.toFixed(1) ?? '—'}% indicates a ${jarabakStatus} facial growth dynamic with Björk Sum of ${bjorkVal?.toFixed(1) ?? '—'}° (${bjorkVal && bjorkVal > 402 ? 'opening structural polygon predisposing to anterior open bite' : bjorkVal && bjorkVal < 390 ? 'closing structural polygon predisposing to skeletal deep bite' : 'neutral structural equilibrium'}).`
        : 'Jarabak facial height ratio and Björk polygon sum measurements pending.',
      badge: jarabakStatus !== 'Pending' ? jarabakStatus : undefined,
    },
    {
      title: 'Cranial Base, Gonial Form & Ramus Compensation',
      finding: saddleVal !== null || articularVal !== null || lGonialVal !== null
        ? `Saddle Angle (${saddleVal?.toFixed(1) ?? '—'}°) and Articular Angle (${articularVal?.toFixed(1) ?? '—'}°) establish ${saddleVal && saddleVal > 128 ? 'posterior glenoid fossa positioning' : saddleVal && saddleVal < 118 ? 'anterior glenoid fossa positioning' : 'harmonious TMJ fossa position'} with lower gonial divergence of ${lGonialVal?.toFixed(1) ?? '—'}°. Ramus Height (${ramusHeightVal?.toFixed(1) ?? '—'} mm) is ${isCompensatedByRamus ? 'sufficient to compensate mandibular plane angle' : 'insufficient to buffer hyperdivergent tendency'}.`
        : 'Cranial base flexure and gonial angle measurements pending.',
    },
    {
      title: 'Divergence of Jaw Bases Sub-classification',
      finding: divergenceSubclass !== 'Pending Assessment'
        ? `Categorized as: ${divergenceSubclass}. Mid/Lower facial proportion of ${midLowerVal?.toFixed(1) ?? '—'}% with N-ANS of ${nAnsVal?.toFixed(1) ?? '—'} mm confirms ${fmaVal && fmaVal > 29 ? 'vertical excess requiring strict vertical anchor mechanics' : fmaVal && fmaVal < 21 ? 'vertical deficiency favorable for bite-opening mechanics' : 'harmonious vertical development'}.`
        : 'Divergence sub-classification pending complete cephalometric entry.',
    },
  ];

  const biomechanicsDirective = fmaVal && fmaVal > 29
    ? 'Maximum vertical control required: strictly avoid molar extrusion, consider TAD-supported molar intrusion, high-pull headgear / transpalatal arch, and avoid Class II elastics without vertical anchorage support.'
    : fmaVal && fmaVal < 21
    ? 'Deep bite correction favored: bite opening via controlled molar extrusion and leveling of Curve of Spee tolerated without adverse facial lengthening.'
    : fmaVal !== null
    ? 'Maintain vertical equilibrium: standard leveling mechanics with light intermaxillary mechanics and moderate anchorage.'
    : undefined;

  return {
    slideTitle: '18C. Comprehensive Cephalometric Discrepancy (Sheet 1: Vertical Skeletal Relation & Divergence)',
    slideSubtitle: 'Vertical Skeletal Divergence, Rotational Vectors & Cranial Geometry (20 Parameters)',
    sectionHeader: 'Sheet 1: Vertical Skeletal Relation & Divergence (20 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [78, 30, 48, 109],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 5.4,
    customFontSize: 7.2,
    inferenceCardTitle: 'Vertical Skeletal Divergence & Growth Dynamic',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Sheet 1 (Part I: Vertical Skeletal Relation, Proportions & Rotational Vectors)
export function buildSheet1Part1Payload(
  compCeph: any,
  patientGender: string,
  steinerP: any,
  downsP: any,
  stP: any,
  mcnamaraP: any,
  cogsP: any,
  rickP: any,
  getStageVal: (field: any) => any
): CephSheetPayload {
  const full = buildSheet1Payload(compCeph, patientGender, steinerP, downsP, stP, mcnamaraP, cogsP, rickP, getStageVal);
  return {
    ...full,
    slideTitle: '18D (Part I-A). Cephalometric Discrepancy (Sheet 1 — Part I: Vertical Skeletal Relation & Vectors)',
    slideSubtitle: 'Vertical Skeletal Angles, Facial Proportions & Rotational Polygon (Params 1–10)',
    sectionHeader: 'Sheet 1 — Part I: Vertical Skeletal Relation & Rotational Dynamics',
    rows: full.rows.slice(0, 10),
    colWidths: [82, 36, 48, 99],
    tableRowHeight: 8.4,
    customFontSize: 9.5,
    inferencePoints: [
      ...full.inferencePoints.slice(0, 2),
      {
        title: 'Vertical Biomechanics & Anchorage Directive',
        finding: full.biomechanicsDirective || 'Maintain vertical equilibrium with strict anchorage monitoring.',
        badge: 'Mechanics',
        badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      },
    ],
  };
}

// Sheet 1 (Part II: Cranial Geometry, Ramus Compensation & Divergence Sub-Classifications)
export function buildSheet1Part2Payload(
  compCeph: any,
  patientGender: string,
  steinerP: any,
  downsP: any,
  stP: any,
  mcnamaraP: any,
  cogsP: any,
  rickP: any,
  getStageVal: (field: any) => any
): CephSheetPayload {
  const full = buildSheet1Payload(compCeph, patientGender, steinerP, downsP, stP, mcnamaraP, cogsP, rickP, getStageVal);
  return {
    ...full,
    slideTitle: '18E (Part II-A). Cephalometric Discrepancy (Sheet 1 — Part II: Ramus & Divergence Classification)',
    slideSubtitle: 'Growth Vectors, Ramus Compensation & 4 Divergence Sub-Classifications (Params 11–20)',
    sectionHeader: 'Sheet 1 — Part II: Cranial Flexure, Ramus Buffer & Divergence Categorization',
    rows: full.rows.slice(10, 20),
    colWidths: [82, 36, 48, 99],
    tableRowHeight: 8.4,
    customFontSize: 9.5,
    inferencePoints: [
      ...full.inferencePoints.slice(2, 4),
      {
        title: 'Ramus Height & Growth Buffer Synthesis',
        finding: 'Ramus geometry, lower gonial angle, and posterior-to-anterior facial height ratios establish the patient\'s biological resistance to bite opening during mechanotherapy.',
        badge: 'Equilibrium',
      },
    ],
  };
}

// Sheet 2: Sagittal & Vertical Interaction / Exposure & Treatment Pathway
export function buildSheet2Payload(
  compCeph: any,
  anbVal: number | null,
  fmaVal: number | null,
  sagVertData?: any,
  patientGender?: string,
  patientAge?: number | string
): CephSheetPayload {
  const isMale = patientGender === 'Male';
  const skeletalClass = compCeph?.skeletal_class || (anbVal !== null ? (anbVal > 4 ? 'Class II' : anbVal < 0 ? 'Class III' : 'Class I') : 'Class I');
  const skeletalSubtype = compCeph?.skeletal_subtype || (anbVal !== null ? (anbVal > 4 ? 'Class II Div 1' : anbVal < 0 ? 'Class III Prognathic' : 'Class I Normal / Bimaxillary') : 'Class I Normal');

  // Extract from dedicated sagittalVerticalInteractionAnalysis data structure or compCeph fallback
  const t1 = sagVertData?.table1Interaction;
  const t2 = sagVertData?.table2UpperIncisorExposure;

  const unaffectedText = t1?.sagittalUnaffectedByVertical?.preRx || (compCeph?.sagittal_unaffected ? 'Selected: Independent Base Relation' : 'Base relation independent of vertical vector');
  const causedText = t1?.sagittalCausedByVertical?.preRx || (compCeph?.sagittal_caused_by_vertical ? 'Selected: Rotational Origin' : 'Rotational divergence effect on AP base');
  const worsenedText = t1?.sagittalWorsenedByVertical?.preRx || (compCeph?.sagittal_worsened_by_vertical ? 'Selected: Vertical Plane Aggravation' : 'High angle / steep plane exacerbation');
  const compensatedText = t1?.sagittalCompensatedByVertical?.preRx || (compCeph?.sagittal_compensated ? 'Selected: Compensated / Masked' : 'Autorotation / dental compensation');

  const uiRestVal = findCephVal(t2?.uiExposureRest?.preRx, compCeph?.ui_exposure_rest);
  const uiSmileVal = findCephVal(t2?.uiExposureSmile?.preRx, compCeph?.ui_exposure_smile);
  const ansUiVal = findCephVal(t2?.ansToIncisor?.preRx, compCeph?.ans_to_incisor);
  const uLipLenVal = findCephVal(t2?.uLipLength?.preRx, compCeph?.u_lip_length);

  // Automated Differential Etiology Calculation
  const ansThreshold = isMale ? 36 : 33;
  const lipThreshold = isMale ? 20 : 18;
  const isAnsExcess = ansUiVal !== null && ansUiVal > ansThreshold;
  const isLipShort = uLipLenVal !== null && uLipLenVal < lipThreshold;
  const isExposureExcess = (uiRestVal !== null && uiRestVal > 4.0) || (uiSmileVal !== null && uiSmileVal > 10.0);

  let calculatedEtiology = sagVertData?.excessExposureCause;
  if (!calculatedEtiology) {
    if (uiRestVal === null && uiSmileVal === null && ansUiVal === null && uLipLenVal === null) {
      calculatedEtiology = 'Pending Examination';
    } else if (!isExposureExcess) {
      calculatedEtiology = 'Normal Incisor Exposure & Esthetic Smile Arc';
    } else if (isAnsExcess && isLipShort) {
      calculatedEtiology = 'Combination: Vertical Skeletal Excess (VME) + Short Upper Lip';
    } else if (isAnsExcess) {
      calculatedEtiology = 'Vertical Skeletal Excess (VME / Elongated Maxilla)';
    } else if (isLipShort) {
      calculatedEtiology = 'Short Upper Lip Philtrum Incompetence';
    } else {
      calculatedEtiology = 'Vertical Dental Excess (Incisor Extrusion)';
    }
  }

  const palatalSupport = sagVertData?.palatalCortexSupport || 'Adequate';
  const symphysealSupport = sagVertData?.symphysealCortexSupport || 'Adequate';
  const symphysealLoc = sagVertData?.symphysealCortexLocation || 'Mandible';

  const sagittalAlt = sagVertData?.sagittalAlterationNeeded || (anbVal !== null && (anbVal > 4 || anbVal < 0) ? 'Needed' : 'Not Needed');
  const verticalAlt = sagVertData?.verticalAlterationNeeded || (fmaVal !== null && (fmaVal > 29 || fmaVal < 21) ? 'Needed' : 'Not Needed');
  const skeletalAlt = sagVertData?.skeletalAlterationNeeded || (sagittalAlt === 'Needed' || verticalAlt === 'Needed' ? 'Needed' : 'Not Needed');

  const numericAge = typeof patientAge === 'number' ? patientAge : parseInt(String(patientAge || '14'), 10);
  const isGrowing = !isNaN(numericAge) && numericAge < 17;
  const pathway = sagVertData?.selectedPathway || (skeletalAlt === 'Needed' ? (isGrowing ? 'Growth Modulation' : 'Surgical Orthodontics') : 'Normal Skeletal Relation');

  const rows: (string | number)[][] = [
    [
      '1. Skeletal Sagittal Malocclusion Class',
      skeletalClass,
      'Class I Harmonious',
      `${skeletalClass} (${skeletalSubtype}) basal relationship`,
    ],
    [
      '2. a) Sagittal Unaffected by Vertical',
      unaffectedText,
      'Independent Base Growth',
      'Sagittal skeletal base develops independently of vertical rotation',
    ],
    [
      '3. b) Sagittal Caused by Vertical',
      causedText,
      'Rotational Origin',
      'AP discrepancy is secondary to vertical rotational divergence',
    ],
    [
      '4. c) Sagittal Worsened by Vertical',
      worsenedText,
      'Aggravating Divergence',
      'Hyperdivergent clockwise rotation exacerbates mandibular retrognathism',
    ],
    [
      '5. d) Sagittal Compensated by Vertical',
      compensatedText,
      'Counter-Clockwise Masking',
      'Hypodivergence / deep bite masks underlying skeletal defect',
    ],
    [
      '6. Upper Incisor Exposure at Rest',
      uiRestVal !== null ? `${uiRestVal.toFixed(1)} mm` : '—',
      isMale ? '2.0 - 4.0 mm (2.5 mm)' : '3.0 - 5.0 mm (3.5 mm)',
      uiRestVal !== null ? (uiRestVal > 4.0 ? 'Excessive Resting Incisor Show (VME Risk)' : uiRestVal < 2.0 ? 'Deficient Resting Incisor Show' : 'Ideal Incisor Exposure at Rest') : 'Not Recorded',
    ],
    [
      '7. Upper Incisor Exposure in Smile',
      uiSmileVal !== null ? `${uiSmileVal.toFixed(1)} mm` : '—',
      '8.0 - 10.0 mm (0-2 mm gingival show)',
      uiSmileVal !== null ? (uiSmileVal > 10.0 ? 'Gummy Smile / Excessive Gingival Display' : uiSmileVal < 7.0 ? 'Reduced Smile Incisor Display' : 'Harmonious Consonant Smile Arc Display') : 'Not Recorded',
    ],
    [
      '8. ANS to Incisor (Upper Dentoalveolar Ht)',
      ansUiVal !== null ? `${ansUiVal.toFixed(1)} mm` : '—',
      isMale ? '33.0 ± 3.0 mm (30 - 36 mm)' : '30.0 ± 3.0 mm (27 - 33 mm)',
      ansUiVal !== null ? (ansUiVal > ansThreshold ? 'Vertical Maxillary Dentoalveolar Excess' : ansUiVal < (ansThreshold - 6) ? 'Vertical Maxillary Dentoalveolar Deficiency' : 'Normal Maxillary Dentoalveolar Height') : 'Not Recorded',
    ],
    [
      '9. Upper Lip Length (Philtrum Height)',
      uLipLenVal !== null ? `${uLipLenVal.toFixed(1)} mm` : '—',
      isMale ? '22.0 ± 2.0 mm (20 - 24 mm)' : '20.0 ± 2.0 mm (18 - 22 mm)',
      uLipLenVal !== null ? (uLipLenVal < lipThreshold ? 'Short Upper Lip (Philtrum Incompetence)' : uLipLenVal > (lipThreshold + 4) ? 'Long Upper Lip (Curtains Smile Display)' : 'Harmonious Upper Lip Philtrum Dimension') : 'Not Recorded',
    ],
    [
      '10. Excess Exposure Etiology Diagnostic',
      calculatedEtiology !== 'Pending Examination' ? calculatedEtiology : '—',
      'Normal Esthetic Display',
      calculatedEtiology !== 'Pending Examination' ? `Differential Cause: ${calculatedEtiology}` : 'Not Recorded',
    ],
    [
      '11. Alveolar Support: Palatal Cortex',
      palatalSupport,
      'Adequate / Intact Cortex',
      palatalSupport.includes('Thin') || palatalSupport.includes('Risk') ? 'Periodontal Boundary: High Fenestration Risk during Retraction' : 'Adequate palatal bone support for incisor torque',
    ],
    [
      '12. Alveolar Support: Symphyseal Cortex',
      `${symphysealSupport} (${symphysealLoc})`,
      'Adequate Symphysis',
      symphysealSupport.includes('Narrow') || symphysealSupport.includes('Thin') ? 'Narrow symphyseal envelope limits AP tooth movement' : 'Sufficient symphyseal bone support',
    ],
    [
      '13. Skeletal Alteration Needed Matrix',
      `Sag: ${sagittalAlt} | Vert: ${verticalAlt}`,
      'Overall: ' + skeletalAlt,
      skeletalAlt === 'Needed' ? 'Orthopedic or surgical skeletal alteration indicated' : 'Pure dental alignment & arch coordination indicated',
    ],
    [
      '14. Treatment Planning Decision Pathway',
      pathway,
      skeletalAlt === 'Needed' ? (isGrowing ? 'Growth Modulation' : 'Surgery') : 'Dental Correction',
      `Selected Modality: ${pathway} (${isGrowing ? 'Actively Growing' : 'Adult / Non-Growing'})`,
    ],
  ];

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Sagittal-Vertical Interplay & Coupling Vector',
      finding: `${skeletalClass} (${skeletalSubtype}) basal architecture. Sagittal-vertical dynamic demonstrates ${compCeph.sagittal_worsened_by_vertical || worsenedText.includes('Selected') ? 'aggravation via hyperdivergent clockwise rotation' : compCeph.sagittal_caused_by_vertical || causedText.includes('Selected') ? 'rotational divergence as primary etiology' : compCeph.sagittal_compensated || compensatedText.includes('Selected') ? 'counter-clockwise masking / compensation' : 'independent basal development'}.`,
      badge: skeletalClass,
    },
    {
      title: 'Upper Incisor Exposure & Smile Esthetics Differential',
      finding: `Rest exposure (${uiRestVal?.toFixed(1)} mm) and smile exposure (${uiSmileVal?.toFixed(1)} mm) with ANS-UI of ${ansUiVal?.toFixed(1)} mm and lip length of ${uLipLenVal?.toFixed(1)} mm determine etiology: ${calculatedEtiology}.`,
      badge: isExposureExcess ? 'Excess Show' : 'Harmonious',
    },
    {
      title: 'Alveolar Cortical Boundaries & Periodontal Safety',
      finding: `Palatal cortex (${palatalSupport}) and symphyseal cortex (${symphysealSupport} in ${symphysealLoc}) define the anatomical biological limits of AP and vertical tooth movement.`,
      badge: palatalSupport.includes('Thin') || symphysealSupport.includes('Narrow') ? 'Border Warning' : 'Safe Limits',
    },
    {
      title: 'Treatment Planning Pathway & Modality Justification',
      finding: `Skeletal alteration is ${skeletalAlt}. Definitive treatment pathway: ${pathway} based on skeletal severity and growth status (${isGrowing ? 'Growing' : 'Non-Growing / Adult'}).`,
      badge: pathway,
    },
  ];

  const biomechanicsDirective = sagVertData?.justification
    ? sagVertData.justification
    : pathway === 'Growth Modulation'
    ? 'Orthopedic growth modification indicated (Twin Block / Herbst / Face Mask / High-Pull HG) utilizing active pubertal growth spurt; enforce vertical molar anchorage.'
    : pathway === 'Surgical Orthodontics'
    ? 'Combined surgical-orthodontic decompensation indicated (Le Fort I impaction / BSSO) respecting thin alveolar cortical boundaries.'
    : pathway === 'Orthodontic Camouflage'
    ? 'Orthodontic camouflage with selective extractions and differential torque mechanics indicated within soft tissue profile acceptance.'
    : 'Standard orthodontic alignment, leveling, space closure, and Class I intercuspation finishing.';

  return {
    slideTitle: '18F (Part A). Comprehensive Cephalometric Discrepancy (Sheet 2: Sagittal & Vertical Interaction / Exposure)',
    slideSubtitle: 'Interaction Dynamics, Incisor Exposure Differential, Cortical Limits & Treatment Tree (14 Parameters)',
    sectionHeader: 'Sheet 2: Sagittal & Vertical Interaction, Exposure & Treatment Tree (14 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [80, 36, 48, 101],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 7.2,
    customFontSize: 9.0,
    inferenceCardTitle: 'Sagittal & Vertical Interaction, Cortical Limits & Pathway Synthesis',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Sheet 3: Upper Dento-Alveolar & Soft Tissue
export function buildSheet3Payload(
  compCeph: any,
  downsP: any,
  steinerP: any,
  mcnamaraP: any,
  holdP: any,
  getStageVal: (field: any) => any
): CephSheetPayload {
  const nAMmVal = findCephVal(compCeph?.n_a_mm);
  const uiSnVal = findCephVal(compCeph?.ui_sn, getStageVal(downsP?.u1Sn));
  const uiNaDegVal = findCephVal(compCeph?.ui_na_deg, getStageVal(steinerP?.u1NaDeg));
  const uiNaMmVal = findCephVal(compCeph?.ui_na_mm, getStageVal(steinerP?.u1NaMm));
  const uiNlVal = findCephVal(compCeph?.ui_nl);
  const uiApogDegVal = findCephVal(compCeph?.ui_apog_deg);
  const uiApogMmVal = findCephVal(compCeph?.ui_apog_mm);
  const uiNpogMmVal = findCephVal(compCeph?.ui_npog_mm);
  const nasolabialVal = findCephVal(compCeph?.nasolabial_angle, getStageVal(mcnamaraP?.nasolabialAngle), getStageVal(steinerP?.nasolabialAngle));
  const nasalVal = findCephVal(compCeph?.nasal_angle);
  const labialVal = findCephVal(compCeph?.labial_angle);
  const uLipThickVal = findCephVal(compCeph?.u_lip_thickness, getStageVal(holdP?.upperLipThickness));
  const basicULipVal = findCephVal(compCeph?.basic_u_lip_thickness, getStageVal(holdP?.basicUpperLipThickness));

  const rows: (string | number)[][] = [
    [
      '1. N-A Linear Distance (Maxillary AP)',
      nAMmVal !== null ? `${nAMmVal.toFixed(1)} mm` : '—',
      '0.0 mm (-3.0 to +3.0 mm)',
      nAMmVal !== null ? (nAMmVal > 3.0 ? 'Maxillary Basal Protrusion' : nAMmVal < -3.0 ? 'Maxillary Basal Retrusion' : 'Normal Maxillary Basal Position') : 'Not Recorded',
    ],
    [
      '2. Upper Incisor to SN Angle (UI-SN)',
      uiSnVal !== null ? `${uiSnVal.toFixed(1)}°` : '—',
      '104.0° ± 4.0° (98.0° - 106.0°)',
      uiSnVal !== null ? (uiSnVal > 106.0 ? 'Proclined Upper Incisors to Cranial Base' : uiSnVal < 98.0 ? 'Retroclined Upper Incisors to Cranial Base' : 'Normal Upper Incisor Inclination (UI-SN)') : 'Not Recorded',
    ],
    [
      '3. Upper Incisor to NA Angle (UI-NA°)',
      uiNaDegVal !== null ? `${uiNaDegVal.toFixed(1)}°` : '—',
      '24.0° ± 4.0° (18.0° - 26.0°)',
      uiNaDegVal !== null ? (uiNaDegVal > 26.0 ? 'Proclined Upper Incisors to NA Line' : uiNaDegVal < 18.0 ? 'Retroclined Upper Incisors to NA Line' : 'Normal Upper Incisor Incline to NA') : 'Not Recorded',
    ],
    [
      '4. Upper Incisor to NA Distance (UI-NA mm)',
      uiNaMmVal !== null ? `${uiNaMmVal.toFixed(1)} mm` : '—',
      '4.0 ± 2.0 mm (2.0 - 6.0 mm)',
      uiNaMmVal !== null ? (uiNaMmVal > 6.0 ? 'Maxillary Incisor Linear Protrusion' : uiNaMmVal < 2.0 ? 'Maxillary Incisor Linear Retrusion' : 'Normal Maxillary Incisor AP Position') : 'Not Recorded',
    ],
    [
      '5. Upper Incisor to Palatal Plane (UI-NL)',
      uiNlVal !== null ? `${uiNlVal.toFixed(1)}°` : '—',
      '110.0° ± 5.0° (105.0° - 115.0°)',
      uiNlVal !== null ? (uiNlVal > 115.0 ? 'Proclined to Palatal Plane' : uiNlVal < 105.0 ? 'Retroclined to Palatal Plane' : 'Harmonious Palatal Incline') : 'Not Recorded',
    ],
    [
      '6. Upper Incisor to A-Pog Angle',
      uiApogDegVal !== null ? `${uiApogDegVal.toFixed(1)}°` : '—',
      '28.0° ± 4.0° (24.0° - 32.0°)',
      uiApogDegVal !== null ? (uiApogDegVal > 32.0 ? 'Increased Proclination relative to APog' : uiApogDegVal < 24.0 ? 'Decreased Incline relative to APog' : 'Normal APog Angle Balance') : 'Not Recorded',
    ],
    [
      '7. Upper Incisor to A-Pog Distance',
      uiApogMmVal !== null ? `${uiApogMmVal.toFixed(1)} mm` : '—',
      '5.0 ± 2.0 mm (3.0 - 7.0 mm)',
      uiApogMmVal !== null ? (uiApogMmVal > 7.0 ? 'Anterior Protrusion beyond APog' : uiApogMmVal < 3.0 ? 'Retrusion behind APog Line' : 'Normal Incisor Distance to APog') : 'Not Recorded',
    ],
    [
      '8. Upper Incisor to N-Pog Distance',
      uiNpogMmVal !== null ? `${uiNpogMmVal.toFixed(1)} mm` : '—',
      '2.0 ± 2.0 mm (0.0 - 4.0 mm)',
      uiNpogMmVal !== null ? (uiNpogMmVal > 4.0 ? 'Protruded relative to Facial Plane' : uiNpogMmVal < 0.0 ? 'Retruded relative to Facial Plane' : 'Normal Relation to Facial Plane') : 'Not Recorded',
    ],
    [
      '9. Nasolabial Angle (Cm-Sn-Ls)',
      nasolabialVal !== null ? `${nasolabialVal.toFixed(1)}°` : '—',
      '102.0° ± 8.0° (94.0° - 110.0°)',
      nasolabialVal !== null ? (nasolabialVal < 94.0 ? 'Acute Angle / Protrusive Upper Lip' : nasolabialVal > 110.0 ? 'Obtuse Angle / Retrusive Upper Lip' : 'Ideal Balanced Nasolabial Contour') : 'Not Recorded',
    ],
    [
      '10. Nasal Angle (Columella to FH)',
      nasalVal !== null ? `${nasalVal.toFixed(1)}°` : '—',
      '30.0° ± 5.0° (25.0° - 35.0°)',
      nasalVal !== null ? (nasalVal > 35.0 ? 'Upturned Nasal Tip / High Columella' : nasalVal < 25.0 ? 'Downward Downturned Nasal Tip' : 'Normal Nasal Tip Incline') : 'Not Recorded',
    ],
    [
      '11. Labial Angle (Upper Lip to FH)',
      labialVal !== null ? `${labialVal.toFixed(1)}°` : '—',
      '72.0° ± 7.0° (65.0° - 80.0°)',
      labialVal !== null ? (labialVal < 65.0 ? 'Proclined Upper Lip Incline' : labialVal > 80.0 ? 'Retroclined / Upright Upper Lip' : 'Normal Upper Lip Incline') : 'Not Recorded',
    ],
    [
      '12. Upper Lip Thickness (Vermilion)',
      uLipThickVal !== null ? `${uLipThickVal.toFixed(1)} mm` : '—',
      '13.0 ± 2.0 mm (12.0 - 15.0 mm)',
      uLipThickVal !== null ? (uLipThickVal > 15.0 ? 'Thick Vermilion Border' : uLipThickVal < 12.0 ? 'Thin Vermilion Border' : 'Normal Vermilion Thickness') : 'Not Recorded',
    ],
    [
      '13. Basic Upper Lip Thickness (A Point)',
      basicULipVal !== null ? `${basicULipVal.toFixed(1)} mm` : '—',
      '15.0 ± 2.0 mm (14.0 - 16.0 mm)',
      basicULipVal !== null ? (basicULipVal > 16.0 ? 'Thick Base Cushion (High Buffer)' : basicULipVal < 14.0 ? 'Thin Base (Direct 1:1 Response)' : 'Normal Base Lip Cushion') : 'Not Recorded',
    ],
  ];

  const maxRetractionLimit = uiNaMmVal !== null && uiNaMmVal > 4 ? (uiNaMmVal - 4).toFixed(1) : (uiNaMmVal !== null ? '0.0' : null);

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Maxillary AP Basal Position',
      finding: nAMmVal !== null
        ? `N-A distance of ${nAMmVal.toFixed(1)} mm indicates a ${nAMmVal > 3 ? 'protrusive' : nAMmVal < -3 ? 'retrusive' : 'neutral'} maxillary basal foundation.`
        : 'Maxillary basal position measurements pending.',
      badge: nAMmVal !== null ? (nAMmVal > 3 ? 'Protrusive' : 'Orthognathic') : undefined,
    },
    {
      title: 'Upper Incisor Inclination & Protrusion',
      finding: uiSnVal !== null || uiNaDegVal !== null || uiNaMmVal !== null
        ? `UI-SN (${uiSnVal?.toFixed(1) ?? '—'}°) and UI-NA (${uiNaDegVal?.toFixed(1) ?? '—'}° / ${uiNaMmVal?.toFixed(1) ?? '—'} mm) confirm ${uiNaDegVal && uiNaDegVal > 26 ? 'significant maxillary incisor proclination and flaring' : uiNaDegVal && uiNaDegVal < 18 ? 'retroclined maxillary incisors' : 'normal incisor torque and position'}.`
        : 'Upper incisor inclination measurements pending.',
      badge: uiNaDegVal !== null ? (uiNaDegVal > 26 ? 'Proclined' : 'Normal') : undefined,
    },
    {
      title: 'Permissible Upper Incisor Retraction',
      finding: maxRetractionLimit !== null
        ? `Estimated permissible incisor retraction capacity is approximately ${maxRetractionLimit} mm to achieve ideal UI-NA norm (4.0 mm) without compromising nasolabial support.`
        : 'Permissible incisor retraction capacity calculation pending UI-NA measurement.',
    },
    {
      title: 'Nasolabial Angle & Upper Lip Profile',
      finding: nasolabialVal !== null || basicULipVal !== null
        ? `Nasolabial angle of ${nasolabialVal?.toFixed(1) ?? '—'}° with basic lip thickness of ${basicULipVal?.toFixed(1) ?? '—'} mm provides ${basicULipVal && basicULipVal > 15 ? 'substantial soft tissue masking buffer during retraction' : 'direct 1:1 soft tissue retraction fidelity'}.`
        : 'Nasolabial angle and soft tissue thickness measurements pending.',
      badge: nasolabialVal !== null ? (nasolabialVal < 94 ? 'Acute / Full' : 'Balanced') : undefined,
    },
  ];

  const biomechanicsDirective = uiNaDegVal && uiNaDegVal > 26.0
    ? 'Extraction / space closure mechanics must incorporate high torque control brackets (torque-in-base) and palatal root torque to prevent excessive uprighting and obtuse nasolabial angle.'
    : 'Preserve existing maxillary incisor torque and avoid lingual tipping during retraction mechanics.';

  return {
    slideTitle: '18G (Part A). Comprehensive Cephalometric Discrepancy (Sheet 3: Upper Dento-Alveolar & Soft Tissue)',
    slideSubtitle: 'Maxillary Basal Position, Upper Incisor Proclination & Nasolabial Aesthetics (13 Parameters)',
    sectionHeader: 'Sheet 3: Upper Dento-Alveolar & Soft Tissue (13 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [80, 34, 48, 103],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 7.4,
    customFontSize: 9.2,
    inferenceCardTitle: 'Upper Dento-Alveolar & Soft Tissue Synthesis',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Sheet 4: Lower Dento-Alveolar & Soft Tissue
export function buildSheet4Payload(
  compCeph: any,
  stP: any,
  downsP: any,
  steinerP: any,
  rickP: any,
  getStageVal: (field: any) => any
): CephSheetPayload {
  const fmiaVal = findCephVal(compCeph?.li_fh, getStageVal(stP?.fmia));
  const impaVal = findCephVal(compCeph?.li_mp, getStageVal(stP?.impa), getStageVal(downsP?.impa));
  const l1NbDegVal = findCephVal(compCeph?.li_nb_deg, getStageVal(steinerP?.lowerIncisorToNbDeg));
  const l1NbMmVal = findCephVal(compCeph?.li_nb_mm, getStageVal(steinerP?.lowerIncisorToNbMm));
  const l1ApogVal = findCephVal(compCeph?.li_apog_mm, getStageVal(rickP?.lowerIncisorToAPogMm));
  const l1NpogVal = findCephVal(compCeph?.li_npog_mm);
  const holdawayRatioVal = findCephVal(compCeph?.li_nb_holdaway_ratio);
  const mentolabialVal = findCephVal(compCeph?.mentolabial_angle);
  const lLipThickVal = findCephVal(compCeph?.l_lip_thickness);
  const lLipLenVal = findCephVal(compCeph?.l_lip_length);

  const rows: (string | number)[][] = [
    [
      '1. Lower Incisor to FH (FMIA Angle)',
      fmiaVal !== null ? `${fmiaVal.toFixed(1)}°` : '—',
      '65.0° ± 4.0° (61.0° - 69.0°)',
      fmiaVal !== null ? (fmiaVal < 61.0 ? 'Proclined Lower Incisors (Decreased FMIA)' : fmiaVal > 69.0 ? 'Upright Lower Incisors (Increased FMIA)' : 'Ideal Tweed FMIA Stability Angle') : 'Not Recorded',
    ],
    [
      '2. Lower Incisor to MP (IMPA Angle)',
      impaVal !== null ? `${impaVal.toFixed(1)}°` : '—',
      '90.0° - 95.0° (85.0° - 95.0°)',
      impaVal !== null ? (impaVal > 95.0 ? 'Proclined beyond Symphysis / Thin Labial Plate Risk' : impaVal < 85.0 ? 'Retroclined / Uprighted Lower Incisors' : 'Harmonious IMPA on Mandibular Basal Bone') : 'Not Recorded',
    ],
    [
      '3. Lower Incisor to NB Angle (L1-NB°)',
      l1NbDegVal !== null ? `${l1NbDegVal.toFixed(1)}°` : '—',
      '25.0° ± 4.0° (21.0° - 29.0°)',
      l1NbDegVal !== null ? (l1NbDegVal > 29.0 ? 'Increased Lower Incisor Angulation to NB' : l1NbDegVal < 21.0 ? 'Decreased Lower Incisor Angulation to NB' : 'Normal Lower Incisor Incline to NB Line') : 'Not Recorded',
    ],
    [
      '4. Lower Incisor to NB Distance (L1-NB mm)',
      l1NbMmVal !== null ? `${l1NbMmVal.toFixed(1)} mm` : '—',
      '4.0 ± 2.0 mm (2.0 - 6.0 mm)',
      l1NbMmVal !== null ? (l1NbMmVal > 6.0 ? 'Lower Incisor Linear Protrusion past NB' : l1NbMmVal < 2.0 ? 'Lower Incisor Linear Retrusion behind NB' : 'Normal Lower Incisor Position to NB') : 'Not Recorded',
    ],
    [
      '5. Lower Incisor to A-Pog Distance',
      l1ApogVal !== null ? `${l1ApogVal.toFixed(1)} mm` : '—',
      '+1.0 ± 2.0 mm (0.0 - 4.0 mm)',
      l1ApogVal !== null ? (l1ApogVal > 4.0 ? 'Lower Incisor Protrusion past APog Line' : l1ApogVal < 0.0 ? 'Lower Incisor Retruded behind APog Line' : 'Ideal Incisor AP Stability on A-Pog Line') : 'Not Recorded',
    ],
    [
      '6. Lower Incisor to N-Pog Distance',
      l1NpogVal !== null ? `${l1NpogVal.toFixed(1)} mm` : '—',
      '1.0 ± 2.0 mm (-1.0 to +3.0 mm)',
      l1NpogVal !== null ? (l1NpogVal > 3.0 ? 'Protruded to Facial Plane' : l1NpogVal < -1.0 ? 'Retruded to Facial Plane' : 'Normal Relation to Facial Plane') : 'Not Recorded',
    ],
    [
      '7. Holdaway Ratio (LI-NB to Pog-NB)',
      holdawayRatioVal !== null ? `${holdawayRatioVal.toFixed(2)}:1` : '—',
      '1.00:1 (0.80 - 1.20:1)',
      holdawayRatioVal !== null ? (holdawayRatioVal > 1.2 ? 'Incisor Prominence exceeds Chin Projection' : holdawayRatioVal < 0.8 ? 'Prominent Bony Chin relative to Incisors' : 'Ideal 1:1 Holdaway Harmony Equilibrium') : 'Not Recorded',
    ],
    [
      '8. Mentolabial Sulcus Angle',
      mentolabialVal !== null ? `${mentolabialVal.toFixed(1)}°` : '—',
      '124.0° ± 10.0° (110.0° - 139.0°)',
      mentolabialVal !== null ? (mentolabialVal < 110.0 ? 'Deep Mentolabial Sulcus / Everted Lower Lip' : mentolabialVal > 139.0 ? 'Flat / Obliterated Mentolabial Sulcus' : 'Harmonious Mentolabial Sulcus Depth') : 'Not Recorded',
    ],
    [
      '9. Lower Lip Thickness (Vermilion)',
      lLipThickVal !== null ? `${lLipThickVal.toFixed(1)} mm` : '—',
      '13.0 ± 2.0 mm (11.0 - 15.0 mm)',
      lLipThickVal !== null ? (lLipThickVal > 15.0 ? 'Thick Lower Lip Vermilion' : lLipThickVal < 11.0 ? 'Thin Lower Lip Vermilion' : 'Normal Lower Lip Thickness') : 'Not Recorded',
    ],
    [
      '10. Lower Lip Length',
      lLipLenVal !== null ? `${lLipLenVal.toFixed(1)} mm` : '—',
      '44.0 ± 4.0 mm (40.0 - 48.0 mm)',
      lLipLenVal !== null ? (lLipLenVal > 48.0 ? 'Elongated Lower Lip' : lLipLenVal < 40.0 ? 'Short Lower Lip (Strain on closure)' : 'Normal Lower Lip Length') : 'Not Recorded',
    ],
  ];

  const impaStatus = impaVal !== null ? (impaVal > 95 ? 'Proclined' : impaVal < 85 ? 'Retroclined' : 'Stable') : undefined;

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Mandibular Incisor Inclination (IMPA / FMIA)',
      finding: impaVal !== null || fmiaVal !== null
        ? `IMPA of ${impaVal?.toFixed(1) ?? '—'}° and FMIA of ${fmiaVal?.toFixed(1) ?? '—'}° indicate ${impaVal && impaVal > 95 ? 'proclined lower incisors with potential cortical plate thinning' : impaVal && impaVal < 85 ? 'lingual uprighting of lower incisors' : 'stable lower incisor inclination centered on basal bone'}.`
        : 'Mandibular incisor inclination measurements pending.',
      badge: impaStatus,
    },
    {
      title: 'Lower Incisor AP Position to NB & FH',
      finding: l1NbMmVal !== null || l1ApogVal !== null
        ? `L1-NB distance (${l1NbMmVal?.toFixed(1) ?? '—'} mm) and A-Pog distance (${l1ApogVal?.toFixed(1) ?? '—'} mm) confirm ${l1ApogVal && l1ApogVal > 3 ? 'anterior protrusion beyond stable Tweed/Ricketts limits' : 'adequate positioning within the stability envelope'}.`
        : 'Lower incisor anteroposterior position measurements pending.',
      badge: l1ApogVal !== null ? (l1ApogVal > 3 ? 'Protruded' : 'Stable') : undefined,
    },
    {
      title: 'Holdaway Ratio Harmony',
      finding: holdawayRatioVal !== null
        ? `Holdaway ratio of ${holdawayRatioVal.toFixed(2)}:1 establishes ${holdawayRatioVal > 1.2 ? 'dominance of dental prominence over bony chin' : 'balanced incisor-to-chin aesthetic equilibrium'}.`
        : 'Holdaway ratio measurement pending.',
    },
    {
      title: 'Mentolabial Sulcus & Lower Lip Harmony',
      finding: mentolabialVal !== null || lLipThickVal !== null
        ? `Mentolabial angle of ${mentolabialVal?.toFixed(1) ?? '—'}° with lip thickness of ${lLipThickVal?.toFixed(1) ?? '—'} mm confirms ${mentolabialVal && mentolabialVal < 110 ? 'curled/everted lower lip from deep overbite' : 'harmonious chin-lip transition'}.`
        : 'Mentolabial sulcus and lower lip measurements pending.',
    },
  ];

  const biomechanicsDirective = impaVal && impaVal > 95.0
    ? 'Avoid further lower incisor proclination during alignment; maintain arch length without excessive labial tipping or consider premolar extractions / IPR to upright incisors.'
    : impaVal !== null
    ? 'Preserve current IMPA at 90°-93° on basal bone to guarantee long-term post-treatment stability.'
    : undefined;

  return {
    slideTitle: '18H (Part A). Comprehensive Cephalometric Discrepancy (Sheet 4: Lower Dento-Alveolar & Soft Tissue)',
    slideSubtitle: 'Mandibular Incisor Inclination, Holdaway Harmony & Mentolabial Sulcus (10 Parameters)',
    sectionHeader: 'Sheet 4: Lower Dento-Alveolar & Soft Tissue (10 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [80, 34, 48, 103],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 8.4,
    customFontSize: 9.5,
    inferenceCardTitle: 'Lower Dento-Alveolar & Soft Tissue Synthesis',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Master Discrepancy Payload 1: Master Hard Tissue Sagittal Standards, Soft Tissue Profile & Cranial Orientation (18 Parameters)
export function buildDiscrepancyMasterPayload1(
  cephDiscP: any,
  patientGender: string,
  getStageVal: (field: any) => any,
  steinerP: any,
  downsP: any,
  holdP: any,
  cogsSoftP: any,
  mcnamaraP: any,
  compCeph: any
): CephSheetPayload {
  const isMale = patientGender === 'Male';
  const anbVal = findCephVal(getStageVal(cephDiscP?.anbAngle), getStageVal(steinerP?.anb), getStageVal(downsP?.anb));
  const aMoBFhVal = findCephVal(getStageVal(cephDiscP?.aMoBFh));
  const witsVal = findCephVal(getStageVal(cephDiscP?.witsAoBo), getStageVal(steinerP?.wits));
  const betaVal = findCephVal(getStageVal(cephDiscP?.betaAngle));
  const naPogVal = findCephVal(getStageVal(cephDiscP?.naPog), getStageVal(downsP?.angleConvexity));
  const abNpogVal = findCephVal(getStageVal(cephDiscP?.abNpog));
  const maxMandRatioVal = findCephVal(
    getStageVal(cephDiscP?.maxMandRatio),
    mcnamaraP?.maxillaryUnitLength && mcnamaraP?.mandibularUnitLength && Number(getStageVal(mcnamaraP.mandibularUnitLength)) > 0
      ? Number((Number(getStageVal(mcnamaraP.maxillaryUnitLength)) / Number(getStageVal(mcnamaraP.mandibularUnitLength))).toFixed(2))
      : null
  );
  const harvoldDiffVal = findCephVal(getStageVal(cephDiscP?.harvoldUnitDiff), getStageVal(mcnamaraP?.maxMandDiff));
  const yenVal = findCephVal(getStageVal(cephDiscP?.yenAngle));
  const wVal = findCephVal(getStageVal(cephDiscP?.wAngle));
  const apdiVal = findCephVal(getStageVal(cephDiscP?.apdi));
  const softProfileAngleVal = findCephVal(getStageVal(cephDiscP?.softTissueProfileAngle), getStageVal(cogsSoftP?.gSnPg));
  const totalTissueProfileAngleVal = findCephVal(getStageVal(cephDiscP?.totalTissueProfileAngle), getStageVal(cogsSoftP?.totalProfileAngle));
  const softTissueFacialAngleVal = findCephVal(getStageVal(cephDiscP?.softTissueFacialAngle), getStageVal(holdP?.softTissueFacialAngle));
  const subnasaleToChinVal = findCephVal(getStageVal(cephDiscP?.subnasaleToChin), getStageVal(cogsSoftP?.snPg));
  const snOrientVal = findCephVal(getStageVal(cephDiscP?.snOrientationAngle), getStageVal(steinerP?.snToFh), getStageVal(downsP?.snFh));
  const basicUpperLipVal = findCephVal(getStageVal(cephDiscP?.basicUpperLip), getStageVal(holdP?.basicUpperLipThickness), getStageVal(holdP?.upperLipThickness), compCeph?.basic_u_lip_thickness);
  const softChinVal = findCephVal(getStageVal(holdP?.softTissueChinThickness), getStageVal(cephDiscP?.softTissueChin), getStageVal(cogsSoftP?.gPg));

  const totalProfileNormText = isMale ? '133.0° (130.0° - 136.0°)' : '137.0° (134.0° - 140.0°)';
  const totalProfileMin = isMale ? 130.0 : 134.0;
  const totalProfileMax = isMale ? 136.0 : 140.0;

  const rows: (string | number)[][] = [
    [
      '1. ANB Angle (Skeletal Relationship)',
      anbVal !== null ? `${anbVal.toFixed(1)}°` : '—',
      '2.0° (0.0° - 4.0°)',
      anbVal !== null ? (anbVal > 4 ? `Skeletal Class II Basal Discrepancy (${anbVal > 7.5 ? 'Severe' : anbVal > 5.5 ? 'Moderate' : 'Mild'})` : anbVal < 0 ? `Skeletal Class III Basal Discrepancy (${anbVal < -4 ? 'Severe' : anbVal < -2 ? 'Moderate' : 'Mild'})` : 'Skeletal Class I Harmonious Relationship') : 'Not Recorded',
    ],
    [
      '2. A-MoB-^nFH (Maxillomandibular AP)',
      aMoBFhVal !== null ? `${aMoBFhVal.toFixed(1)} mm` : '—',
      '4.0 mm (2.0 - 6.0 mm)',
      aMoBFhVal !== null ? (aMoBFhVal > 6 ? 'Increased Maxillomandibular AP Distance (Class II Tendency)' : aMoBFhVal < 2 ? 'Decreased Maxillomandibular AP Distance (Class III Tendency)' : 'Normal Maxillomandibular AP Alignment') : 'Not Recorded',
    ],
    [
      '3. AO to BO (Wits Appraisal)',
      witsVal !== null ? `${witsVal.toFixed(1)} mm` : '—',
      '0.0 mm (-1.0 to 1.0 mm)',
      witsVal !== null ? (witsVal > 1 ? `Wits Class II Basal Discrepancy (${witsVal > 5 ? 'Severe' : witsVal > 2.5 ? 'Moderate' : 'Mild'})` : witsVal < -1 ? `Wits Class III Basal Discrepancy (${witsVal < -5 ? 'Severe' : witsVal < -2.5 ? 'Moderate' : 'Mild'})` : 'Harmonious Wits Skeletal Relationship') : 'Not Recorded',
    ],
    [
      '4. Beta Angle',
      betaVal !== null ? `${betaVal.toFixed(1)}°` : '—',
      '31.0° (27.0° - 35.0°)',
      betaVal !== null ? (betaVal < 27 ? 'Class II Skeletal Discrepancy (Beta < 27°)' : betaVal > 35 ? 'Class III Skeletal Discrepancy (Beta > 35°)' : 'Class I Skeletal Harmony (Beta 27°-35°)') : 'Not Recorded',
    ],
    [
      '5. NA-Pog (Angle of Profile Convexity)',
      naPogVal !== null ? `${naPogVal.toFixed(1)}°` : '—',
      '0.0° (-8.5° to 10.0°)',
      naPogVal !== null ? (naPogVal > 10 ? 'Convex Facial Skeletal Profile (Class II Tendency)' : naPogVal < -8.5 ? 'Concave Facial Skeletal Profile (Class III Tendency)' : 'Straight / Normal Profile Convexity') : 'Not Recorded',
    ],
    [
      '6. AB-NPog (AB to Facial Plane)',
      abNpogVal !== null ? `${abNpogVal.toFixed(1)}°` : '—',
      '-4.5° (-8.0° to 0.0°)',
      abNpogVal !== null ? (abNpogVal < -8 ? 'Class II Relationship (Point B posterior to Point A)' : abNpogVal > 0 ? 'Class III Relationship (Point B anterior to Point A)' : 'Harmonious AB Plane to Facial Plane') : 'Not Recorded',
    ],
    [
      '7. Max:Mand Ratio (2:3 / Effective Ratio)',
      maxMandRatioVal !== null ? `${maxMandRatioVal.toFixed(2)}` : '—',
      '1.00 (0.95 - 1.05)',
      maxMandRatioVal !== null ? (maxMandRatioVal > 1.05 ? 'Relative Maxillary Excess / Mandibular Deficiency (Class II)' : maxMandRatioVal < 0.95 ? 'Relative Mandibular Excess / Maxillary Deficiency (Class III)' : 'Harmonious Maxillomandibular Ratio') : 'Not Recorded',
    ],
    [
      '8. Harvold\'s Unit Length Difference',
      harvoldDiffVal !== null ? `${harvoldDiffVal.toFixed(1)} mm` : '—',
      '26.0 mm (24.0 - 28.0 mm)',
      harvoldDiffVal !== null ? (harvoldDiffVal > 28 ? 'Increased Mandibular Differential (Class III Tendency)' : harvoldDiffVal < 24 ? 'Decreased Mandibular Differential (Class II Tendency)' : 'Normal Unit Length Differential (Harmonious Jaw Bases)') : 'Not Recorded',
    ],
    [
      '9. YEN Angle (Cranial Base Reference)',
      yenVal !== null ? `${yenVal.toFixed(1)}°` : '—',
      '120.0° (117.0° - 123.0°)',
      yenVal !== null ? (yenVal < 117 ? 'Class II Skeletal Pattern (YEN < 117°)' : yenVal > 123 ? 'Class III Skeletal Pattern (YEN > 123°)' : 'Class I Skeletal Pattern (YEN 117°-123°)') : 'Not Recorded',
    ],
    [
      '10. W Angle (True Sagittal Geometry)',
      wVal !== null ? `${wVal.toFixed(1)}°` : '—',
      '53.5° (51.0° - 56.0°)',
      wVal !== null ? (wVal < 51 ? 'Class II Skeletal Pattern (W < 51°)' : wVal > 56 ? 'Class III Skeletal Pattern (W > 56°)' : 'Class I Skeletal Pattern (W 51°-56°)') : 'Not Recorded',
    ],
    [
      '11. APDI (Anteroposterior Dysplasia Indicator)',
      apdiVal !== null ? `${apdiVal.toFixed(1)}°` : '—',
      '83.0° (81.0° - 85.0°)',
      apdiVal !== null ? (apdiVal < 81 ? 'APDI Class II Skeletal Discrepancy (<81°)' : apdiVal > 85 ? 'APDI Class III Skeletal Discrepancy (>85°)' : 'Normal Anteroposterior Skeletal Balance (81°-85°)') : 'Not Recorded',
    ],
    [
      '12. Soft Tissue Profile Angle (N\'-Sn-Pog\')',
      softProfileAngleVal !== null ? `${softProfileAngleVal.toFixed(1)}°` : '—',
      '161.0° (157.0° - 165.0°)',
      softProfileAngleVal !== null ? (softProfileAngleVal < 157 ? 'Convex Soft Tissue Profile / Subnasale-Chin Retrusion' : softProfileAngleVal > 165 ? 'Straight to Concave Soft Tissue Profile' : 'Harmonious Soft Tissue Profile Angle (161° Norm)') : 'Not Recorded',
    ],
    [
      '13. Total Tissue Profile Angle (Gl\'-Prn-Pog\')',
      totalTissueProfileAngleVal !== null ? `${totalTissueProfileAngleVal.toFixed(1)}°` : '—',
      totalProfileNormText,
      totalTissueProfileAngleVal !== null ? (totalTissueProfileAngleVal < totalProfileMin ? 'Hyper-Convex Total Profile (Prominent Nose / Retrusive Chin)' : totalTissueProfileAngleVal > totalProfileMax ? 'Flat / Concave Total Profile (Deficient Nose / Prominent Chin)' : 'Harmonious Total Soft Tissue Profile Contour') : 'Not Recorded',
    ],
    [
      '14. Soft Tissue Facial Angle (FH to N\'-Pog\')',
      softTissueFacialAngleVal !== null ? `${softTissueFacialAngleVal.toFixed(1)}°` : '—',
      '90.5° (87.0° - 94.0°)',
      softTissueFacialAngleVal !== null ? (softTissueFacialAngleVal > 94 ? 'Prominent / Prognathic Soft Tissue Chin' : softTissueFacialAngleVal < 87 ? 'Retrusive / Retrognathic Soft Tissue Chin' : 'Harmonious Soft Tissue Facial Angle (90.5° Norm)') : 'Not Recorded',
    ],
    [
      '15. Subnasale-to-Chin Distance (Sn to Pog\')',
      subnasaleToChinVal !== null ? `${subnasaleToChinVal.toFixed(1)} mm` : '—',
      '0.0 mm (-2.0 to 2.0 mm)',
      subnasaleToChinVal !== null ? (subnasaleToChinVal > 2 ? 'Anterior Chin Projection / Class III Soft Profile' : subnasaleToChinVal < -2 ? 'Retrusive Chin / Class II Soft Profile' : 'Ideal Subnasale-to-Chin Soft Tissue Alignment') : 'Not Recorded',
    ],
    [
      '16. SN Orientation Angle (SN to FH)',
      snOrientVal !== null ? `${snOrientVal.toFixed(1)}°` : '—',
      '7.0° (5.0° - 9.0°)',
      snOrientVal !== null ? (snOrientVal > 9 ? 'Steep Cranial Base (High SN / Masks Class II, lowers SNA/SNB)' : snOrientVal < 5 ? 'Flat Cranial Base (Low SN / Increases SNA/SNB readings)' : 'Normal Cranial Base Orientation (Reliable SN References)') : 'Not Recorded',
    ],
    [
      '17. Basic Upper Lip Thickness (A Point - Sn)',
      basicUpperLipVal !== null ? `${basicUpperLipVal.toFixed(1)} mm` : '—',
      '14.0 ± 1.0 mm (13.0 - 15.0 mm)',
      basicUpperLipVal !== null ? (basicUpperLipVal < 13 ? 'Thin Upper Lip (Limited buffer; direct 1:1 incisor retraction response)' : basicUpperLipVal > 15 ? 'Thick Upper Lip (High soft tissue cushioning buffer)' : 'Normal Upper Lip Thickness (14 mm norm)') : 'Not Recorded',
    ],
    [
      '18. Soft Tissue Chin Thickness (Pog - Pog\')',
      softChinVal !== null ? `${softChinVal.toFixed(1)} mm` : '—',
      '11.0 mm (10.0 - 12.0 mm)',
      softChinVal !== null ? (softChinVal < 10 ? 'Thin Soft Tissue Chin Pad (Deficient buffer; skeletal retrusion exposed)' : softChinVal > 12 ? 'Thick Soft Tissue Chin Cushion (Compensates skeletal deficiency)' : 'Normal Soft Tissue Chin Thickness (10-12 mm norm)') : 'Not Recorded',
    ],
  ];

  let primaryClass = 'Pending Assessment';
  if (anbVal !== null) {
    if (anbVal > 4) primaryClass = 'Skeletal Class II';
    else if (anbVal < 0) primaryClass = 'Skeletal Class III';
    else primaryClass = 'Skeletal Class I';
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Sagittal Skeletal Basal Relationship',
      finding: anbVal !== null || witsVal !== null || betaVal !== null
        ? `${primaryClass} indicated across ANB (${anbVal?.toFixed(1) ?? '—'}°), Wits appraisal (${witsVal?.toFixed(1) ?? '—'} mm), Beta angle (${betaVal?.toFixed(1) ?? '—'}°), YEN angle (${yenVal?.toFixed(1) ?? '—'}°), and W angle (${wVal?.toFixed(1) ?? '—'}°).`
        : 'Sagittal skeletal relationship measurements pending.',
      badge: primaryClass !== 'Pending Assessment' ? primaryClass : undefined,
    },
    {
      title: 'Harvold & Proportional Ratio Equilibrium',
      finding: harvoldDiffVal !== null || maxMandRatioVal !== null
        ? `Harvold unit length difference of ${harvoldDiffVal?.toFixed(1) ?? '—'} mm and Max:Mand Ratio of ${maxMandRatioVal?.toFixed(2) ?? '—'} confirm ${maxMandRatioVal && maxMandRatioVal > 1.05 ? 'maxillary dimension dominance' : maxMandRatioVal && maxMandRatioVal < 0.95 ? 'mandibular dimension dominance' : 'balanced inter-jaw unit length proportions'}.`
        : 'Harvold unit length and effective ratio measurements pending.',
    },
    {
      title: 'Soft Tissue Profile & Facial Contours',
      finding: softProfileAngleVal !== null || totalTissueProfileAngleVal !== null
        ? `Soft tissue profile angle of ${softProfileAngleVal?.toFixed(1) ?? '—'}° and total profile of ${totalTissueProfileAngleVal?.toFixed(1) ?? '—'}° establish ${softProfileAngleVal && softProfileAngleVal < 157 ? 'convex profile with chin retrusion' : 'harmonious soft tissue draping'}.`
        : 'Soft tissue profile contour measurements pending.',
    },
    {
      title: 'Cranial Orientation & Soft Tissue Masking Buffer',
      finding: snOrientVal !== null || basicUpperLipVal !== null || softChinVal !== null
        ? `SN Orientation angle (${snOrientVal?.toFixed(1) ?? '—'}°) validates cranial reference lines; basic upper lip (${basicUpperLipVal?.toFixed(1) ?? '—'} mm) and chin cushion (${softChinVal?.toFixed(1) ?? '—'} mm) provide ${basicUpperLipVal && basicUpperLipVal > 15 ? 'substantial masking cushion' : 'true anatomical reflection'}.`
        : 'Cranial orientation and soft tissue thickness measurements pending.',
    },
  ];

  const biomechanicsDirective = primaryClass === 'Skeletal Class II'
    ? 'Class II sagittal correction indicated with consideration of soft tissue masking capacity; preserve lip support and monitor cranial base tilt.'
    : primaryClass === 'Skeletal Class III'
    ? 'Class III sagittal protocol; evaluate maxillary skeletal protraction vs mandibular surgical repositioning based on discrepancy breakdown.'
    : primaryClass === 'Skeletal Class I'
    ? 'Harmonious Class I basal relation; focus on ideal leveling, arch coordination, and dental torque optimization.'
    : undefined;

  return {
    slideTitle: '18A. Master Cephalometric Discrepancy (Part 1: Sagittal Standards & Soft Tissue)',
    slideSubtitle: 'Hard Tissue Sagittal Standards, Soft Tissue Profile Metrics & Cranial Orientation (18 Parameters)',
    sectionHeader: 'Master Discrepancy: Sagittal & Soft Tissue Profile (18 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [78, 30, 48, 109],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 8.0,
    customFontSize: 9.2,
    inferenceCardTitle: 'Master Sagittal & Soft Tissue Profile Synthesis',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Master Discrepancy Payload 2: Detailed Maxillary & Mandibular Discrepancy Breakdown & Fault Localization (15 Parameters)
export function buildDiscrepancyMasterPayload2(
  cephDiscP: any,
  getStageVal: (field: any) => any,
  steinerP: any,
  downsP: any,
  mcnamaraP: any,
  cogsHardP: any,
  cogsSoftP: any,
  compCeph: any
): CephSheetPayload {
  const snaVal = findCephVal(getStageVal(cephDiscP?.snaAngle), getStageVal(steinerP?.sna), getStageVal(downsP?.sna));
  const aNPerpVal = findCephVal(getStageVal(cephDiscP?.aNPerp), getStageVal(mcnamaraP?.naPerpToPointA));
  const maxSizeAnsPnsVal = findCephVal(getStageVal(cephDiscP?.maxSizeAnsPns), getStageVal(cogsHardP?.ansPns));
  const maxEffLenVal = findCephVal(getStageVal(cephDiscP?.maxEffectiveLength), getStageVal(mcnamaraP?.maxillaryUnitLength));
  const maxPlacementVal = findCephVal(getStageVal(cephDiscP?.maxPlacementSInfPtmNf));

  const snbVal = findCephVal(getStageVal(cephDiscP?.snbAngle), getStageVal(steinerP?.snb), getStageVal(downsP?.snb));
  const pogNPerpVal = findCephVal(getStageVal(cephDiscP?.pogNPerp), getStageVal(mcnamaraP?.pogNaPerp));
  const facialAngleVal = findCephVal(getStageVal(cephDiscP?.facialAngle), getStageVal(downsP?.facialAngle));
  const mandCorpusSizeVal = findCephVal(getStageVal(cephDiscP?.mandCorpusSize), getStageVal(cogsHardP?.goPg));
  const mandRamusHeightVal = findCephVal(getStageVal(cephDiscP?.mandRamusHeight), getStageVal(cogsHardP?.arGo));
  const mandEffLenVal = findCephVal(getStageVal(cephDiscP?.mandEffectiveLength), getStageVal(mcnamaraP?.mandibularUnitLength));
  const saddleAngleVal = findCephVal(getStageVal(cephDiscP?.saddleAngle), compCeph?.saddle_angle);
  const postCranialBaseVal = findCephVal(getStageVal(cephDiscP?.postCranialBase));
  const effectOfGonialVal = findCephVal(getStageVal(cephDiscP?.effectOfGonialAngle), compCeph?.gonial_angle);
  const ramusOrientationVal = findCephVal(getStageVal(cephDiscP?.ramusOrientation), compCeph?.articular_angle);

  const rows: (string | number)[][] = [
    // Maxilla (5 parameters)
    [
      '1. SNA Angle (Maxillary AP Position)',
      snaVal !== null ? `${snaVal.toFixed(1)}°` : '—',
      '82.0° ± 2.0° (80.0° - 84.0°)',
      snaVal !== null ? (snaVal > 84 ? 'Maxillary Prognathism / Anterior Placement' : snaVal < 80 ? 'Maxillary Retrognathism / Posterior Placement' : 'Normal Maxillary Basal Position (SNA)') : 'Not Recorded',
    ],
    [
      '2. A-N1 / A-NPerp (Point A to N-Perp)',
      aNPerpVal !== null ? `${aNPerpVal.toFixed(1)} mm` : '—',
      '0.5 mm (0.0 - 1.0 mm)',
      aNPerpVal !== null ? (aNPerpVal > 1 ? 'Maxillary Midface Skeletal Protrusion' : aNPerpVal < 0 ? 'Maxillary Midface Skeletal Retrusion' : 'Normal Maxillary AP Alignment (A-NPerp)') : 'Not Recorded',
    ],
    [
      '3. Maxillary Size (ANS-PNS)',
      maxSizeAnsPnsVal !== null ? `${maxSizeAnsPnsVal.toFixed(1)} mm` : '—',
      '57.0 mm (52.0 - 62.0 mm)',
      maxSizeAnsPnsVal !== null ? (maxSizeAnsPnsVal > 62 ? 'Maxillary Basal Size Excess (Macro-Maxilla)' : maxSizeAnsPnsVal < 52 ? 'Maxillary Basal Size Deficiency (Micro-Maxilla)' : 'Normal Maxillary Basal Dimension (ANS-PNS)') : 'Not Recorded',
    ],
    [
      '4. Maxillary Effective Length (Co-ANS)',
      maxEffLenVal !== null ? `${maxEffLenVal.toFixed(1)} mm` : '—',
      '92.0 mm (85.0 - 98.0 mm)',
      maxEffLenVal !== null ? (maxEffLenVal > 98 ? 'Increased Maxillary Effective Unit Length' : maxEffLenVal < 85 ? 'Decreased Maxillary Effective Unit Length' : 'Normal Maxillary Effective Length (Co-ANS)') : 'Not Recorded',
    ],
    [
      '5. Maxillary Placement (S-INF to Ptm-INF)',
      maxPlacementVal !== null ? `${maxPlacementVal.toFixed(1)} mm` : '—',
      '0.0 mm (-2.0 to 2.0 mm)',
      maxPlacementVal !== null ? (maxPlacementVal > 2 ? 'Anterior Maxillary Placement in Craniofacial Complex' : maxPlacementVal < -2 ? 'Posterior Maxillary Placement in Craniofacial Complex' : 'Normal Maxillary Craniofacial Spatial Position') : 'Not Recorded',
    ],
    // Mandible (10 parameters)
    [
      '6. SNB Angle (Mandibular AP Position)',
      snbVal !== null ? `${snbVal.toFixed(1)}°` : '—',
      '80.0° ± 2.0° (78.0° - 82.0°)',
      snbVal !== null ? (snbVal > 82 ? 'Mandibular Prognathism / Anterior Placement' : snbVal < 78 ? 'Mandibular Retrognathism / Posterior Placement' : 'Normal Mandibular Basal Position (SNB)') : 'Not Recorded',
    ],
    [
      '7. B-N1 / Pog-NPerp (Pogonion to N-Perp)',
      pogNPerpVal !== null ? `${pogNPerpVal.toFixed(1)} mm` : '—',
      '1.0 mm (-2.0 to 4.0 mm)',
      pogNPerpVal !== null ? (pogNPerpVal < -2 ? 'Mandibular Retrusion / Deficient Chin Position' : pogNPerpVal > 4 ? 'Mandibular Protrusion / Prominent Chin Position' : 'Normal Mandibular Chin Alignment (Pog-NPerp)') : 'Not Recorded',
    ],
    [
      '8. Facial Angle (N-Pog to FH)',
      facialAngleVal !== null ? `${facialAngleVal.toFixed(1)}°` : '—',
      '87.8° ± 3.6° (84.0° - 91.0°)',
      facialAngleVal !== null ? (facialAngleVal > 91 ? 'Mandibular Prognathism / Prominent Chin Angle' : facialAngleVal < 84 ? 'Mandibular Retrognathism / Recessive Chin Angle' : 'Harmonious Frankfort-Facial Angle (N-Pog to FH)') : 'Not Recorded',
    ],
    [
      '9. Mandibular Corpus Size (Go-Pog)',
      mandCorpusSizeVal !== null ? `${mandCorpusSizeVal.toFixed(1)} mm` : '—',
      '75.0 mm (70.0 - 80.0 mm)',
      mandCorpusSizeVal !== null ? (mandCorpusSizeVal > 80 ? 'Mandibular Corpus Length Excess (Long Body)' : mandCorpusSizeVal < 70 ? 'Mandibular Corpus Length Deficiency (Short Body)' : 'Normal Mandibular Body Length (Go-Pog)') : 'Not Recorded',
    ],
    [
      '10. Mandibular Ramus Height (Ar-Go)',
      mandRamusHeightVal !== null ? `${mandRamusHeightVal.toFixed(1)} mm` : '—',
      '46.0 mm (42.0 - 50.0 mm)',
      mandRamusHeightVal !== null ? (mandRamusHeightVal > 50 ? 'Elongated Mandibular Ramus (Deep Bite Tendency)' : mandRamusHeightVal < 42 ? 'Short Mandibular Ramus (High Angle Tendency)' : 'Normal Ascending Ramus Height (Ar-Go)') : 'Not Recorded',
    ],
    [
      '11. Mandibular Effective Length (Co-Gn)',
      mandEffLenVal !== null ? `${mandEffLenVal.toFixed(1)} mm` : '—',
      '118.0 mm (110.0 - 125.0 mm)',
      mandEffLenVal !== null ? (mandEffLenVal > 125 ? 'Increased Total Effective Mandibular Unit Length' : mandEffLenVal < 110 ? 'Decreased Total Effective Mandibular Unit Length' : 'Normal Mandibular Effective Length (Co-Gn)') : 'Not Recorded',
    ],
    [
      '12. Saddle Angle (N-S-Ar Condyle Position)',
      saddleAngleVal !== null ? `${saddleAngleVal.toFixed(1)}°` : '—',
      '123.0° ± 5.0° (118.0° - 128.0°)',
      saddleAngleVal !== null ? (saddleAngleVal > 128 ? 'Posterior Condylar Placement (Class II Skeletal Tendency)' : saddleAngleVal < 118 ? 'Anterior Condylar Placement (Class III Skeletal Tendency)' : 'Normal Cranial Base Flexure / Condylar Placement') : 'Not Recorded',
    ],
    [
      '13. Post Cranial Base (S-Ar Length)',
      postCranialBaseVal !== null ? `${postCranialBaseVal.toFixed(1)} mm` : '—',
      '35.0 mm (32.0 - 38.0 mm)',
      postCranialBaseVal !== null ? (postCranialBaseVal > 38 ? 'Long Posterior Cranial Base (Condyle positioned backward)' : postCranialBaseVal < 32 ? 'Short Posterior Cranial Base (Condyle positioned forward)' : 'Normal Posterior Cranial Base Length (S-Ar)') : 'Not Recorded',
    ],
    [
      '14. Effect of Gonial Angle (Ar-Go-Me)',
      effectOfGonialVal !== null ? `${effectOfGonialVal.toFixed(1)}°` : '—',
      '128.0° ± 6.0° (120.0° - 130.0°)',
      effectOfGonialVal !== null ? (effectOfGonialVal > 130 ? 'Obtuse Gonial Angle (Downward/Backward Mandibular Rotation)' : effectOfGonialVal < 120 ? 'Acute Gonial Angle (Forward/Upward Mandibular Projection)' : 'Normal Gonial Angle Architectural Form') : 'Not Recorded',
    ],
    [
      '15. Ramus Orientation S-Ar-Go (Articular)',
      ramusOrientationVal !== null ? `${ramusOrientationVal.toFixed(1)}°` : '—',
      '143.0° ± 6.0° (137.0° - 149.0°)',
      ramusOrientationVal !== null ? (ramusOrientationVal > 149 ? 'Increased Articular Angle (Retrognathic Ramal Orientation)' : ramusOrientationVal < 137 ? 'Decreased Articular Angle (Prognathic Ramal Orientation)' : 'Harmonious Ramal Articular Orientation') : 'Not Recorded',
    ],
  ];

  // Fault localization synthesis
  const hasMaxData = maxEffLenVal !== null || snaVal !== null;
  const maxFault = hasMaxData
    ? ((maxEffLenVal && maxEffLenVal > 98) || (snaVal && snaVal > 84) ? 'Maxillary Skeletal Excess' : (maxEffLenVal && maxEffLenVal < 85) || (snaVal && snaVal < 80) ? 'Maxillary Skeletal Deficiency' : 'Normal Maxilla')
    : 'Pending Data';

  const hasMandData = mandEffLenVal !== null || snbVal !== null;
  const mandFault = hasMandData
    ? ((mandEffLenVal && mandEffLenVal < 110) || (snbVal && snbVal < 78) ? 'Mandibular Skeletal Retrognathism' : (mandEffLenVal && mandEffLenVal > 125) || (snbVal && snbVal > 82) ? 'Mandibular Skeletal Prognathism' : 'Normal Mandible')
    : 'Pending Data';

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Maxillary Size & Spatial Placement',
      finding: hasMaxData
        ? `Maxilla presents with SNA of ${snaVal?.toFixed(1) ?? '—'}°, ANS-PNS length of ${maxSizeAnsPnsVal?.toFixed(1) ?? '—'} mm, and Co-ANS of ${maxEffLenVal?.toFixed(1) ?? '—'} mm indicating ${maxFault.toLowerCase()}.`
        : 'Maxillary size and position measurements pending.',
      badge: maxFault !== 'Pending Data' ? (maxFault === 'Normal Maxilla' ? 'Normal Maxilla' : maxFault.includes('Excess') ? 'Maxillary Excess' : 'Maxillary Deficiency') : undefined,
    },
    {
      title: 'Mandibular Dimensions & Ramus Architecture',
      finding: hasMandData
        ? `Mandible displays SNB of ${snbVal?.toFixed(1) ?? '—'}°, corpus length of ${mandCorpusSizeVal?.toFixed(1) ?? '—'} mm, ramus height of ${mandRamusHeightVal?.toFixed(1) ?? '—'} mm, and Co-Gn of ${mandEffLenVal?.toFixed(1) ?? '—'} mm confirming ${mandFault.toLowerCase()}.`
        : 'Mandibular size and ramus measurements pending.',
      badge: mandFault !== 'Pending Data' ? (mandFault === 'Normal Mandible' ? 'Normal Mandible' : mandFault.includes('Retro') ? 'Mandibular Retrognathism' : 'Mandibular Prognathism') : undefined,
    },
    {
      title: 'Condylar Placement & Cranial Base Modifiers',
      finding: saddleAngleVal !== null || postCranialBaseVal !== null
        ? `Saddle Angle (${saddleAngleVal?.toFixed(1) ?? '—'}°) and S-Ar length (${postCranialBaseVal?.toFixed(1) ?? '—'} mm) establish ${saddleAngleVal && saddleAngleVal > 128 ? 'backward condylar displacement exacerbating mandibular retrusion' : 'neutral condylar seating'}.`
        : 'Condylar seating and posterior cranial base measurements pending.',
    },
    {
      title: 'Rotational Ramus & Gonial Angle Influence',
      finding: effectOfGonialVal !== null || ramusOrientationVal !== null
        ? `Gonial angle (${effectOfGonialVal?.toFixed(1) ?? '—'}°) and Articular angle (${ramusOrientationVal?.toFixed(1) ?? '—'}°) reveal ${effectOfGonialVal && effectOfGonialVal > 130 ? 'clockwise downward-backward mandibular rotation' : 'balanced muscular-skeletal ramal orientation'}.`
        : 'Gonial and articular rotational angle measurements pending.',
    },
  ];

  const biomechanicsDirective = (mandFault.includes('Retro') && maxFault.includes('Normal'))
    ? 'Mandibular advancement / orthopedic posturing or camouflage with Class II elastics indicated based on growth maturity status.'
    : (maxFault.includes('Excess') && mandFault.includes('Normal'))
    ? 'Maxillary retraction / high-pull headgear or differential premolar extractions indicated.'
    : (mandFault.includes('Prognathism'))
    ? 'Class III mechanics with consideration of mandibular setback or maxillary protraction.'
    : (hasMaxData || hasMandData)
    ? 'Class I basal relationship; maintain arch coordination and focus on dental detailing.'
    : undefined;

  return {
    slideTitle: '18B. Master Cephalometric Discrepancy (Part 2: Maxillary & Mandibular Breakdown)',
    slideSubtitle: 'Maxillary & Mandibular Size, Length, Spatial Placement & Fault Localization (15 Parameters)',
    sectionHeader: 'Master Discrepancy: Maxillary & Mandibular Breakdown (15 Parameters)',
    tableHeaders: ['Parameter Name', 'Measured Value', 'Clinical Norm (Range)', 'Diagnostic Clinical Inference'],
    rows,
    colWidths: [78, 30, 48, 109],
    alignments: ['left', 'center', 'center', 'left'],
    tableRowHeight: 8.0,
    customFontSize: 9.2,
    inferenceCardTitle: 'Maxillary & Mandibular Apical Base Breakdown & Fault Localization',
    inferencePoints,
    biomechanicsDirective,
  };
}

// =========================================================================
// SLIDE 18-SN-FH: SN-FH CRANIAL BASE CORRECTION MATRIX & ANGULAR ADJUSTMENT ENGINE
// =========================================================================
export function buildSnFhCorrectionMatrixPayload(
  snFhData: any,
  patientGender: string,
  steinerP: any,
  downsP: any,
  mcnamaraP: any,
  stP: any,
  compCeph: any,
  getStageVal: (field: any) => any,
  activeStageKey: 'pre' | 'mid' | 'post' | 'retention' = 'pre'
): CephSheetPayload {
  const isMale = patientGender === 'Male';
  const stageData = snFhData?.stages?.[activeStageKey] || {};

  // Standard norm is 7.5° (7° - 8°)
  const standardNorm = snFhData?.standardNorm || 7.5;
  const snFhVal = findCephVal(
    stageData.snFhAngle,
    getStageVal(steinerP?.snToFh),
    getStageVal(downsP?.snFh),
    compCeph?.sn_fh_angle,
    7.5
  );

  const delta = (snFhVal !== null ? snFhVal - standardNorm : 0);

  const snLenNorm = isMale ? 75 : 71;
  const snLengthVal = findCephVal(stageData.snLength, compCeph?.sn_length, snLenNorm);
  const saddleAngleVal = findCephVal(stageData.saddleAngle, compCeph?.saddle_angle, 130);

  // Raw measurements
  const rawSna = findCephVal(stageData.measuredSna, getStageVal(steinerP?.sna), getStageVal(downsP?.sna), compCeph?.sna);
  const rawSnb = findCephVal(stageData.measuredSnb, getStageVal(steinerP?.snb), getStageVal(downsP?.snb), compCeph?.snb);
  const rawAnb = findCephVal(stageData.measuredAnb, getStageVal(steinerP?.anb), getStageVal(downsP?.anb), (rawSna !== null && rawSnb !== null ? rawSna - rawSnb : null));
  const rawSnGoGn = findCephVal(stageData.measuredSnGoGn, getStageVal(steinerP?.mandibularPlaneAngle), compCeph?.sn_go_gn);
  const rawFma = findCephVal(stageData.measuredFma, getStageVal(stP?.fmpa), getStageVal(downsP?.mandibularPlaneAngle), getStageVal(mcnamaraP?.mandibularPlaneAngle), compCeph?.fma);
  const rawUiSn = findCephVal(stageData.measuredUiSn, getStageVal(steinerP?.upperIncisorToNaDeg), compCeph?.u1_sn);

  // Corrected values
  const corrSna = rawSna !== null ? rawSna + delta : null;
  const corrSnb = rawSnb !== null ? rawSnb + delta : null;
  const corrAnb = rawAnb; // Invariant
  const corrSnGoGn = rawSnGoGn !== null ? rawSnGoGn - delta : null;
  const corrFma = rawFma; // FH-referenced, immune to SN cant
  const corrUiSn = rawUiSn !== null ? rawUiSn + delta : null;

  // Format Helper
  const fmt = (val: number | null, unit = '°') => (val !== null ? `${val.toFixed(1)}${unit}` : '—');
  const fmtDelta = (d: number) => `${d >= 0 ? '+' : ''}${d.toFixed(1)}°`;

  const rows: (string | number)[][] = [
    [
      '1. SN-FH Angle (Cranial Base Cant)',
      fmt(snFhVal),
      '7.5° (7.0° - 8.0°)',
      'Baseline Cant',
      fmtDelta(delta),
      delta > 1.5 ? 'Clockwise Cant (Steep Cranial Base > 9°)' : delta < -1.5 ? 'Counter-Clockwise Cant (Flat Cranial Base < 6°)' : 'Normal Cranial Base Inclination'
    ],
    [
      '2. S-N Length (Anterior Cranial Base)',
      `${snLengthVal?.toFixed(1)} mm`,
      `${snLenNorm}.0 ± 3.0 mm`,
      'Anatomical Length',
      '—',
      snLengthVal! > snLenNorm + 3 ? 'Long anterior cranial base (recedes Nasion)' : snLengthVal! < snLenNorm - 3 ? 'Short cranial base (exaggerates jaw prognathism)' : 'Balanced anterior cranial base length'
    ],
    [
      '3. Saddle Angle (N-S-Ba / N-S-Ar)',
      fmt(saddleAngleVal),
      '130.0° (123.0° - 137.0°)',
      'Cranial Flexure',
      '—',
      saddleAngleVal! > 135 ? 'Obtuse saddle angle (posterior fossa displacement, Class II tendency)' : saddleAngleVal! < 123 ? 'Acute saddle angle (anterior fossa displacement, Class III tendency)' : 'Normal cranial base flexure'
    ],
    [
      '4. SNA Angle (Maxillary AP Position)',
      fmt(rawSna),
      '82.0° (80.0° - 84.0°)',
      fmt(corrSna),
      fmtDelta(delta),
      corrSna !== null
        ? corrSna > 84
          ? `Corrected Maxillary Prognathism ${Math.abs(delta) > 1.5 ? '(Adjusted for cranial cant)' : ''}`
          : corrSna < 80
          ? `Corrected Maxillary Retrognathism ${Math.abs(delta) > 1.5 ? '(Adjusted for cranial cant)' : ''}`
          : `Orthognathic / Normal Maxilla (True baseline: ${corrSna.toFixed(1)}°)`
        : 'Awaiting primary tracing'
    ],
    [
      '5. SNB Angle (Mandibular AP Position)',
      fmt(rawSnb),
      '80.0° (78.0° - 82.0°)',
      fmt(corrSnb),
      fmtDelta(delta),
      corrSnb !== null
        ? corrSnb > 82
          ? `Corrected Mandibular Prognathism ${Math.abs(delta) > 1.5 ? '(Adjusted for cranial cant)' : ''}`
          : corrSnb < 78
          ? `Corrected Mandibular Retrognathism ${Math.abs(delta) > 1.5 ? '(Adjusted for cranial cant)' : ''}`
          : `Orthognathic / Normal Mandible (True baseline: ${corrSnb.toFixed(1)}°)`
        : 'Awaiting primary tracing'
    ],
    [
      '6. ANB Angle (Basal Discrepancy)',
      fmt(rawAnb),
      '2.0° (0.0° - 4.0°)',
      fmt(corrAnb),
      '0.0° (Invariant)',
      corrAnb !== null
        ? corrAnb > 4
          ? 'Skeletal Class II Basal Relationship (Pure differential)'
          : corrAnb < 0
          ? 'Skeletal Class III Basal Relationship (Pure differential)'
          : 'Skeletal Class I Basal Relationship'
        : 'Awaiting primary tracing'
    ],
    [
      '7. SN-GoGn (Mandibular Plane Angle)',
      fmt(rawSnGoGn),
      '32.0° (28.0° - 36.0°)',
      fmt(corrSnGoGn),
      fmtDelta(-delta),
      corrSnGoGn !== null
        ? corrSnGoGn > 36
          ? `True Hyperdivergent Vertical Pattern (Adjusted: ${corrSnGoGn.toFixed(1)}°)`
          : corrSnGoGn < 28
          ? `True Hypodivergent Vertical Pattern (Adjusted: ${corrSnGoGn.toFixed(1)}°)`
          : `Balanced Normodivergent Vertical Vector (Adjusted: ${corrSnGoGn.toFixed(1)}°)`
        : 'Awaiting primary tracing'
    ],
    [
      '8. FMA (FH to Mandibular Plane)',
      fmt(rawFma),
      '25.0° (21.0° - 29.0°)',
      fmt(corrFma),
      '0.0° (Immune)',
      corrFma !== null
        ? corrFma > 29
          ? 'True Hyperdivergent Pattern (FH-referenced reference norm)'
          : corrFma < 21
          ? 'True Hypodivergent Pattern (FH-referenced reference norm)'
          : 'Normal Vertical Divergence'
        : 'Awaiting primary tracing'
    ],
    [
      '9. UI-SN (Upper Incisor Inclination)',
      fmt(rawUiSn),
      '103.0° (98.0° - 108.0°)',
      fmt(corrUiSn),
      fmtDelta(delta),
      corrUiSn !== null
        ? corrUiSn > 108
          ? `True Maxillary Incisor Proclination (Corrected: ${corrUiSn.toFixed(1)}°)`
          : corrUiSn < 98
          ? `True Maxillary Incisor Retroclination (Corrected: ${corrUiSn.toFixed(1)}°)`
          : `Balanced Incisal Angulation (Corrected: ${corrUiSn.toFixed(1)}°)`
        : 'Awaiting primary tracing'
    ],
  ];

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: 'Cranial Base Rotational Matrix Status',
      finding: `SN-FH angle measured at ${snFhVal?.toFixed(1)}° presents a deviation delta of ${fmtDelta(delta)} from standard norm (7.5°). ${
        delta > 1.5
          ? 'Steep anterior cranial base rotates Sella-Nasion clockwise, falsely depressing raw SNA/SNB and exaggerating SN-GoGn.'
          : delta < -1.5
          ? 'Flat anterior cranial base rotates Sella-Nasion counter-clockwise, falsely elevating raw SNA/SNB and underestimating SN-GoGn.'
          : 'Anterior cranial base is harmonious with Frankfort Horizontal (within 7.0° - 8.0° normal range).'
      }`,
      badge: Math.abs(delta) > 1.5 ? (delta > 0 ? 'Steep Cranial Base' : 'Flat Cranial Base') : 'Harmonious Cranial Base',
    },
    {
      title: 'Sagittal Diagnostic Correction (SNA & SNB)',
      finding: rawSna !== null && rawSnb !== null
        ? `Raw SNA (${fmt(rawSna)}) and SNB (${fmt(rawSnb)}) adjust to true corrected values of ${fmt(corrSna)} and ${fmt(corrSnb)}. ${
            Math.abs(delta) > 1.5
              ? `Rotational masking offset of ${fmtDelta(delta)} must be factored to avoid misdiagnosing true skeletal sagittal dysplasia.`
              : 'No rotational masking detected on sagittal jaw bases.'
          }`
        : 'Awaiting cephalometric tracing & landmark digitization for SNA & SNB raw baseline measurements.',
    },
    {
      title: 'Vertical Vector Realignment (SN-GoGn vs FMA)',
      finding: rawSnGoGn !== null
        ? `Raw SN-GoGn (${fmt(rawSnGoGn)}) corrects to ${fmt(corrSnGoGn)}, aligning with FH-referenced FMA (${fmt(corrFma)}). ${
            delta > 1.5
              ? 'Eliminates false hyperdivergence artifact caused by steep S-N inclination.'
              : delta < -1.5
              ? 'Eliminates false hypodivergence artifact caused by flat S-N inclination.'
              : 'High vertical concordancy between cranial and Frankfort reference planes.'
          }`
        : 'Awaiting cephalometric tracing for SN-GoGn and FMA raw angular measurements.',
    },
    {
      title: 'Dentoalveolar Incisal Torque Neutralization',
      finding: rawUiSn !== null
        ? `Upper incisor inclination relative to S-N (UI-SN raw: ${fmt(rawUiSn)}) adjusts to ${fmt(corrUiSn)} to represent genuine biological torque.`
        : 'Awaiting cephalometric tracing for UI-SN incisor torque calculation.',
    },
  ];

  const biomechanicsDirective = Math.abs(delta) > 1.5
    ? `Base sagittal extractions and orthognathic surgical planning on Adjusted SNA (${fmt(corrSna)}) & Adjusted SNB (${fmt(corrSnb)}) rather than raw S-N values to prevent overtreatment or erroneous tooth movements.`
    : 'Standard cephalometric cephalometric references are valid without rotational compensation.';

  return {
    slideTitle: '18C. SN-FH Cranial Base Correction Matrix & Angular Adjustment Engine',
    slideSubtitle: 'Automated Rotational Deviation Delta & True Skeletal/Dental Vector Normalization',
    sectionHeader: 'SN-FH Cranial Base Correction & Angular Adjustment Matrix',
    tableHeaders: ['Parameter / Landmark Metric', 'Measured', 'Norm Range', 'Adjusted Value', 'Delta', 'Diagnostic Masking Impact & True Clinical Inference'],
    rows,
    colWidths: [62, 22, 38, 25, 20, 98],
    alignments: ['left', 'center', 'center', 'center', 'center', 'left'],
    tableRowHeight: 8.2,
    customFontSize: 9.2,
    inferenceCardTitle: 'Cranial Base Angular Correction & Diagnostic Inferences',
    inferencePoints,
    biomechanicsDirective,
  };
}

// Downs' Analysis Synthesis & Full Diagnostic Inferences Builder
export function buildDownsInferencePayload(
  downsP: any,
  getStageVal: (field: any) => any,
  customConclusion?: string
): {
  slideTitle: string;
  slideSubtitle: string;
  inferencePoints: SheetInferencePoint[];
  overallConclusion: string;
} {
  const fa = getStageVal(downsP?.facialAngle);
  const ac = getStageVal(downsP?.angleConvexity);
  const ab = getStageVal(downsP?.abPlane);
  const mpa = getStageVal(downsP?.mandibularPlaneAngle);
  const y = getStageVal(downsP?.yAxis);
  const cant = getStageVal(downsP?.cantOfOcclusion);
  const l1Op = getStageVal(downsP?.lowerIncisorToOcclusal);
  const impa = getStageVal(downsP?.impa);
  const interincisal = getStageVal(downsP?.interincisalAngle);
  const u1Apo = getStageVal(downsP?.upperIncisalAngle);

  // 1. Sagittal Pattern Evaluation
  let skClass: 'I' | 'II' | 'III' = 'I';
  let skFinding = 'Skeletal Class I orthognathic craniofacial form with straight facial profile.';
  let skBadge = 'Skeletal Class I';
  let skBadgeColor = '#10b981';

  const isClass2Convexity = ac !== null && ac > 5.0;
  const isClass2FacialAngle = fa !== null && fa < 84.0;
  const isClass2AbPlane = ab !== null && ab < -8.5;

  const isClass3Convexity = ac !== null && ac < -5.0;
  const isClass3FacialAngle = fa !== null && fa > 91.5;
  const isClass3AbPlane = ab !== null && ab > 0.0;

  if (isClass2Convexity || isClass2FacialAngle || isClass2AbPlane) {
    skClass = 'II';
    skBadge = 'Skeletal Class II';
    skBadgeColor = '#ef4444';
    const sub: string[] = [];
    if (isClass2FacialAngle) sub.push(`mandibular retrognathism (Facial Angle: ${fa?.toFixed(1)}° < 84.0°)`);
    if (isClass2Convexity) sub.push(`convex facial profile (Convexity: ${ac > 0 ? '+' : ''}${ac?.toFixed(1)}° > +5.0°)`);
    if (isClass2AbPlane) sub.push(`retrusive mandibular apical base relative to maxilla (A-B Plane: ${ab?.toFixed(1)}° < -8.5°)`);
    skFinding = `Skeletal Class II basal architecture characterized by ${sub.join(', ')}.`;
  } else if (isClass3Convexity || isClass3FacialAngle || isClass3AbPlane) {
    skClass = 'III';
    skBadge = 'Skeletal Class III';
    skBadgeColor = '#f59e0b';
    const sub: string[] = [];
    if (isClass3FacialAngle) sub.push(`mandibular prognathism (Facial Angle: ${fa?.toFixed(1)}° > 91.5°)`);
    if (isClass3Convexity) sub.push(`concave facial profile (Convexity: ${ac?.toFixed(1)}° < -5.0°)`);
    if (isClass3AbPlane) sub.push(`anterior mandibular apical base protrusion (A-B Plane: ${ab > 0 ? '+' : ''}${ab?.toFixed(1)}° > 0.0°)`);
    skFinding = `Skeletal Class III basal architecture characterized by ${sub.join(', ')}.`;
  } else if (fa !== null || ac !== null || ab !== null) {
    skFinding = `Skeletal Class I orthognathic jaw relationship with balanced facial angle (${fa !== null ? `${fa.toFixed(1)}°` : '87.8°'}), straight convexity (${ac !== null ? `${ac > 0 ? '+' : ''}${ac.toFixed(1)}°` : '0.0°'}), and harmonious A-B relationship (${ab !== null ? `${ab.toFixed(1)}°` : '-4.6°'}).`;
  }

  // 2. Vertical Vector & Mandibular Divergence
  let vertFinding = 'Normodivergent balanced vertical facial proportions with average growth vector.';
  let vertBadge = 'Normodivergent';
  let vertBadgeColor = '#10b981';

  const isHyper = (mpa !== null && mpa > 26.0) || (y !== null && y > 64.0) || (cant !== null && cant > 13.5);
  const isHypo = (mpa !== null && mpa < 17.0) || (y !== null && y < 55.0) || (cant !== null && cant < 5.5);

  if (isHyper) {
    vertBadge = 'Hyperdivergent / High Angle';
    vertBadgeColor = '#ef4444';
    const vSub: string[] = [];
    if (mpa !== null && mpa > 26.0) vSub.push(`steep mandibular plane angle (MP-FH: ${mpa.toFixed(1)}° > 26.0°)`);
    if (y !== null && y > 64.0) vSub.push(`downward-backward mandibular growth direction (Y-Axis: ${y.toFixed(1)}° > 64.0°)`);
    if (cant !== null && cant > 13.5) vSub.push(`steep cant of occlusal plane (${cant.toFixed(1)}° > 13.5°)`);
    vertFinding = `Hyperdivergent vertical growth pattern with downward-backward mandibular rotation (${vSub.join(', ')}). Demands strict vertical anchorage control and molar intrusion consideration.`;
  } else if (isHypo) {
    vertBadge = 'Hypodivergent / Low Angle';
    vertBadgeColor = '#3b82f6';
    const vSub: string[] = [];
    if (mpa !== null && mpa < 17.0) vSub.push(`flat mandibular plane angle (MP-FH: ${mpa.toFixed(1)}° < 17.0°)`);
    if (y !== null && y < 55.0) vSub.push(`forward horizontal growth axis (Y-Axis: ${y.toFixed(1)}° < 55.0°)`);
    if (cant !== null && cant < 5.5) vSub.push(`flat occlusal plane (${cant.toFixed(1)}° < 5.5°)`);
    vertFinding = `Hypodivergent horizontal growth pattern with forward rotational growth vector (${vSub.join(', ')}). Associated with deep bite tendency and strong muscular anchorage conservation.`;
  } else if (mpa !== null || y !== null || cant !== null) {
    vertFinding = `Normodivergent balanced vertical facial proportions with harmonious mandibular plane angle (${mpa !== null ? `${mpa.toFixed(1)}°` : '21.9°'}), Y-axis (${y !== null ? `${y.toFixed(1)}°` : '59.4°'}), and cant of occlusion (${cant !== null ? `${cant.toFixed(1)}°` : '9.3°'}).`;
  }

  // 3. Occlusal Plane Cant & Functional Dentoalveolar Plane
  let occlusalFinding = 'Cant of occlusal plane is within normal physiological limits (5.5° to 13.5°).';
  if (cant !== null) {
    if (cant > 13.5) occlusalFinding = `Steep occlusal plane (${cant.toFixed(1)}° > 13.5°) predisposing to open bite tendency and backward mandibular rotation.`;
    else if (cant < 5.5) occlusalFinding = `Flat occlusal plane (${cant.toFixed(1)}° < 5.5°) predisposing to deep bite / Class III anterior interlocking.`;
    else occlusalFinding = `Harmonious occlusal plane slope (${cant.toFixed(1)}°) maintaining optimal functional disclusion and canine guidance vectors.`;
  }

  // 4. Lower Incisor Inclination & Apical Base Compensation (IMPA & L1-OP)
  let l1Finding = 'Lower incisors are well-positioned on mandibular basal bone.';
  let l1Badge = 'Normal IMPA';
  let l1BadgeColor = '#10b981';

  let isL1Pro = false;
  let isL1Retro = false;
  if (impa !== null) {
    if (impa > 50) {
      if (impa > 95.0) isL1Pro = true;
      if (impa < 85.0) isL1Retro = true;
    } else {
      if (impa > 5.0) isL1Pro = true;
      if (impa < -5.0) isL1Retro = true;
    }
  }
  if (l1Op !== null) {
    if (l1Op > 18.0) isL1Pro = true;
    if (l1Op < 11.0) isL1Retro = true;
  }

  if (isL1Pro) {
    l1Badge = 'Lower Incisor Proclination';
    l1BadgeColor = '#ef4444';
    l1Finding = `Lower incisors exhibit labial proclination (${impa !== null ? `IMPA: ${impa.toFixed(1)}°` : ''}${l1Op !== null ? `, L1-OP: ${l1Op.toFixed(1)}°` : ''}) encroaching on anterior symphyseal cortical bone; indicates dentoalveolar protrusion or compensation.`;
  } else if (isL1Retro) {
    l1Badge = 'Lower Incisor Retroclination';
    l1BadgeColor = '#f59e0b';
    l1Finding = `Lower incisors are retroclined / upright (${impa !== null ? `IMPA: ${impa.toFixed(1)}°` : ''}${l1Op !== null ? `, L1-OP: ${l1Op.toFixed(1)}°` : ''}); reflects lingual tipping or natural compensation for skeletal Class III pattern.`;
  } else if (impa !== null || l1Op !== null) {
    l1Finding = `Lower incisors demonstrate optimal biological inclination on mandibular apical base (IMPA: ${impa !== null ? `${impa.toFixed(1)}°` : '91.4°'}, L1-OP: ${l1Op !== null ? `${l1Op.toFixed(1)}°` : '14.5°'}).`;
  }

  // 5. Interincisal Angle & Anterior Overjet/Overbite Coupling
  let interFinding = 'Interincisal angle indicates balanced anterior axial relationships (130.0° to 142.0°).';
  let interBadge = 'Harmonious U1-L1';
  let interBadgeColor = '#10b981';

  if (interincisal !== null) {
    if (interincisal < 130.0) {
      interBadge = 'Acute Angle / Bimaxillary';
      interBadgeColor = '#ef4444';
      interFinding = `Acute interincisal angle (${interincisal.toFixed(1)}° < 130.0°) reflecting bimaxillary dentoalveolar proclination with reduced anterior vertical coupling and lip fullness.`;
    } else if (interincisal > 142.0) {
      interBadge = 'Obtuse Angle / Upright';
      interBadgeColor = '#f59e0b';
      interFinding = `Obtuse interincisal angle (${interincisal.toFixed(1)}° > 142.0°) indicating retroclined incisors typical of Class II Division 2 malocclusions and severe deep overbite tendency.`;
    } else {
      interFinding = `Balanced interincisal angle (${interincisal.toFixed(1)}°) ensuring proper anterior guidance, incisal coupling, and esthetic lip support.`;
    }
  }

  // 6. Upper Incisor to A-Pog Projection
  let u1Finding = 'Upper incisor anteroposterior projection to A-Pog line is within normal limits (+0.5 to +5.0 mm).';
  if (u1Apo !== null) {
    if (u1Apo > 5.0) {
      u1Finding = `Upper incisor protrusion (${u1Apo > 0 ? '+' : ''}${u1Apo.toFixed(1)} mm > +5.0 mm to A-Pog line) contributing to excessive overjet and lip incompetency (Class II Division 1 manifestation).`;
    } else if (u1Apo < 0.5) {
      u1Finding = `Upper incisor retrusion (${u1Apo > 0 ? '+' : ''}${u1Apo.toFixed(1)} mm < +0.5 mm to A-Pog line) presenting deficient midfacial dental projection or lingual tipping.`;
    } else {
      u1Finding = `Ideal upper incisor position relative to the functional A-Pog plane (${u1Apo > 0 ? '+' : ''}${u1Apo.toFixed(1)} mm) harmonizing with facial profile.`;
    }
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Sagittal Skeletal Pattern & Facial Profile Form',
      finding: skFinding,
      badge: skBadge,
      badgeColor: skBadgeColor,
    },
    {
      title: '2. Vertical Growth Vector & Mandibular Divergence',
      finding: vertFinding,
      badge: vertBadge,
      badgeColor: vertBadgeColor,
    },
    {
      title: '3. Occlusal Plane Cant & Functional Stability',
      finding: occlusalFinding,
    },
    {
      title: '4. Mandibular Incisor Torque & Symphyseal Limits (IMPA)',
      finding: l1Finding,
      badge: l1Badge,
      badgeColor: l1BadgeColor,
    },
    {
      title: '5. Interincisal Angulation & Overjet/Overbite Harmony',
      finding: interFinding,
      badge: interBadge,
      badgeColor: interBadgeColor,
    },
    {
      title: '6. Maxillary Incisor AP Projection (1 to A-Pog)',
      finding: u1Finding,
    },
  ];

  const overallConclusion = customConclusion || (
    fa !== null || ac !== null || mpa !== null
      ? `Downs' Cephalometric Analysis indicates ${skFinding.toLowerCase()} combined with ${vertFinding.toLowerCase()} Dentoalveolar and incisal evaluations reflect sagittal and vertical compensation with ${interFinding.toLowerCase()}`
      : "Downs' cephalometric evaluation synthesized across 5 skeletal and 5 dental diagnostic parameters."
  );

  return {
    slideTitle: "10B. Downs' Analysis: Overall Diagnostic Summary & Clinical Inferences",
    slideSubtitle: 'Comprehensive Craniofacial Form, Growth Vector & Dentoalveolar Arc Synthesis',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// Steiner's Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildSteinerInferencePayload(
  steinerP: any,
  getStageVal: (field: any) => number | null,
  customConclusion?: string
) {
  const sna = getStageVal(steinerP.sna);
  const snb = getStageVal(steinerP.snb);
  const anb = getStageVal(steinerP.anb);
  const occlusal = getStageVal(steinerP.occlusalPlaneAngle);
  const mp = getStageVal(steinerP.mandibularPlaneAngle);
  const u1NaDeg = getStageVal(steinerP.upperIncisorToNaDeg);
  const u1NaMm = getStageVal(steinerP.upperIncisorToNaMm);
  const l1NbDeg = getStageVal(steinerP.lowerIncisorToNbDeg);
  const l1NbMm = getStageVal(steinerP.lowerIncisorToNbMm);
  const interincisal = getStageVal(steinerP.interincisalAngle);
  const sLine = getStageVal(steinerP.steinersSLine);

  // 1. Maxillary & Mandibular Basal Relationship (SNA, SNB, ANB)
  let skFinding = 'Skeletal basal bones exhibit Class I normognathic harmony (ANB: 2.0°).';
  let skBadge = 'Skeletal Class I';
  let skBadgeColor = '#10b981';

  if (anb !== null) {
    if (anb > 4.0) {
      skBadge = 'Skeletal Class II';
      skBadgeColor = '#ef4444';
      const maxDesc = sna !== null && sna > 84.0 ? 'maxillary prognathism' : sna !== null && sna < 80.0 ? 'retrognathic maxilla' : 'orthognathic maxilla';
      const mandDesc = snb !== null && snb < 78.0 ? 'mandibular retrognathism' : snb !== null && snb > 82.0 ? 'mandibular prognathism' : 'orthognathic mandible';
      skFinding = `Skeletal Class II basal discrepancy (ANB: ${anb.toFixed(1)}° > 4.0°) resulting from ${maxDesc} (SNA: ${sna !== null ? `${sna.toFixed(1)}°` : '—'}) and ${mandDesc} (SNB: ${snb !== null ? `${snb.toFixed(1)}°` : '—'}).`;
    } else if (anb < 0.0) {
      skBadge = 'Skeletal Class III';
      skBadgeColor = '#3b82f6';
      const mandDesc = snb !== null && snb > 82.0 ? 'true mandibular prognathism' : 'relative mandibular prominence';
      const maxDesc = sna !== null && sna < 80.0 ? 'associated with midface retrusion' : 'with normal maxillary projection';
      skFinding = `Skeletal Class III basal relationship (ANB: ${anb.toFixed(1)}° < 0.0°) characterized by ${mandDesc} (SNB: ${snb !== null ? `${snb.toFixed(1)}°` : '—'}) ${maxDesc} (SNA: ${sna !== null ? `${sna.toFixed(1)}°` : '—'}).`;
    } else {
      skFinding = `Skeletal Class I orthognathic apical base harmony (ANB: ${anb.toFixed(1)}°, SNA: ${sna !== null ? `${sna.toFixed(1)}°` : '82.0°'}, SNB: ${snb !== null ? `${snb.toFixed(1)}°` : '80.0°'}).`;
    }
  }

  // 2. Vertical Skeletal Pattern & Mandibular Plane Divergence (GoGn-SN & OP-SN)
  let vertFinding = 'Normodivergent balanced vertical facial growth pattern (GoGn-SN: 32.0°).';
  let vertBadge = 'Normodivergent';
  let vertBadgeColor = '#10b981';

  if (mp !== null) {
    if (mp > 35.0) {
      vertBadge = 'Hyperdivergent / High Angle';
      vertBadgeColor = '#ef4444';
      vertFinding = `Hyperdivergent / high mandibular plane angle (GoGn-SN: ${mp.toFixed(1)}° > 35.0°) indicating backward mandibular rotation vector, anterior open-bite risk, and increased lower anterior facial height.`;
    } else if (mp < 29.0) {
      vertBadge = 'Hypodivergent / Low Angle';
      vertBadgeColor = '#3b82f6';
      vertFinding = `Hypodivergent / low mandibular plane angle (GoGn-SN: ${mp.toFixed(1)}° < 29.0°) indicating forward mandibular rotation vector, strong musculature, and deep overbite tendency.`;
    } else {
      vertFinding = `Normodivergent balanced vertical growth pattern (GoGn-SN: ${mp.toFixed(1)}°, norm 29° - 35°).`;
    }
  }
  if (occlusal !== null) {
    vertFinding += ` Occlusal Plane to SN is ${occlusal.toFixed(1)}° (${occlusal > 16 ? 'steep slope' : occlusal < 12 ? 'flat slope' : 'normal inclination'}).`;
  }

  // 3. Maxillary Incisor Inclination & AP Position (U1 to NA)
  let u1Finding = 'Upper incisors show normal axial angulation and bodily positioning relative to NA line.';
  let u1Badge = 'Normal U1-NA';
  let u1BadgeColor = '#10b981';

  if (u1NaDeg !== null || u1NaMm !== null) {
    const isPro = (u1NaDeg !== null && u1NaDeg > 26.0) || (u1NaMm !== null && u1NaMm > 6.0);
    const isRetro = (u1NaDeg !== null && u1NaDeg < 18.0) || (u1NaMm !== null && u1NaMm < 2.0);
    if (isPro) {
      u1Badge = 'Upper Incisor Proclination';
      u1BadgeColor = '#ef4444';
      u1Finding = `Upper incisor proclination & protrusion relative to NA (${u1NaDeg !== null ? `Angle: ${u1NaDeg.toFixed(1)}°` : ''}${u1NaMm !== null ? `, Linear: ${u1NaMm.toFixed(1)} mm` : ''}) contributing to excessive overjet and lip fullness.`;
    } else if (isRetro) {
      u1Badge = 'Upper Incisor Retroclination';
      u1BadgeColor = '#f59e0b';
      u1Finding = `Upper incisor retroclination / lingual tipping relative to NA (${u1NaDeg !== null ? `Angle: ${u1NaDeg.toFixed(1)}°` : ''}${u1NaMm !== null ? `, Linear: ${u1NaMm.toFixed(1)} mm` : ''}) characteristic of Class II Div 2 incisor posture.`;
    } else {
      u1Finding = `Upper incisors display ideal torque and AP position relative to the NA line (${u1NaDeg !== null ? `${u1NaDeg.toFixed(1)}°` : '22.0°'}, ${u1NaMm !== null ? `${u1NaMm.toFixed(1)} mm` : '4.0 mm'}).`;
    }
  }

  // 4. Mandibular Incisor Inclination & AP Position (L1 to NB)
  let l1Finding = 'Lower incisors demonstrate balanced axial inclination and linear prominence relative to NB line.';
  let l1Badge = 'Normal L1-NB';
  let l1BadgeColor = '#10b981';

  if (l1NbDeg !== null || l1NbMm !== null) {
    const isPro = (l1NbDeg !== null && l1NbDeg > 29.0) || (l1NbMm !== null && l1NbMm > 6.0);
    const isRetro = (l1NbDeg !== null && l1NbDeg < 21.0) || (l1NbMm !== null && l1NbMm < 2.0);
    if (isPro) {
      l1Badge = 'Lower Incisor Proclination';
      l1BadgeColor = '#ef4444';
      l1Finding = `Lower incisor proclination & protrusion to NB line (${l1NbDeg !== null ? `Angle: ${l1NbDeg.toFixed(1)}°` : ''}${l1NbMm !== null ? `, Linear: ${l1NbMm.toFixed(1)} mm` : ''}) encroaching on anterior symphyseal cortical plate limits.`;
    } else if (isRetro) {
      l1Badge = 'Lower Incisor Retroclination';
      l1BadgeColor = '#f59e0b';
      l1Finding = `Lower incisor retroclination / lingual uprighting relative to NB line (${l1NbDeg !== null ? `Angle: ${l1NbDeg.toFixed(1)}°` : ''}${l1NbMm !== null ? `, Linear: ${l1NbMm.toFixed(1)} mm` : ''}).`;
    } else {
      l1Finding = `Lower incisors show physiological inclination and AP position on basal mandibular bone (${l1NbDeg !== null ? `${l1NbDeg.toFixed(1)}°` : '25.0°'}, ${l1NbMm !== null ? `${l1NbMm.toFixed(1)} mm` : '4.0 mm'}).`;
    }
  }

  // 5. Interincisal Angulation (U1 to L1)
  let interFinding = 'Interincisal angle reflects balanced axial relationship (130.0° ± 5.0°).';
  let interBadge = 'Harmonious U1-L1';
  let interBadgeColor = '#10b981';

  if (interincisal !== null) {
    if (interincisal < 125.0) {
      interBadge = 'Acute Angle / Bimaxillary';
      interBadgeColor = '#ef4444';
      interFinding = `Acute interincisal angle (${interincisal.toFixed(1)}° < 125.0°) indicating bimaxillary dentoalveolar proclination with compromised incisal coupling.`;
    } else if (interincisal > 135.0) {
      interBadge = 'Obtuse Angle / Upright';
      interBadgeColor = '#f59e0b';
      interFinding = `Obtuse interincisal angle (${interincisal.toFixed(1)}° > 135.0°) indicating upright/retroclined incisor axes with deep bite tendency.`;
    } else {
      interFinding = `Harmonious interincisal relationship (${interincisal.toFixed(1)}°) ensuring functional anterior guidance and stability.`;
    }
  }

  // 6. Soft Tissue Esthetic Profile (Steiner's S-Line)
  let softFinding = "Soft tissue lip profile is harmoniously positioned tangent to Steiner's S-Line.";
  let softBadge = 'Balanced S-Line';
  let softBadgeColor = '#10b981';

  if (sLine !== null) {
    if (sLine > 2.0) {
      softBadge = 'Lip Protrusion';
      softBadgeColor = '#ef4444';
      softFinding = `Soft tissue lip protrusion (${sLine > 0 ? '+' : ''}${sLine.toFixed(1)} mm anterior to S-Line) indicating bimaxillary lip fullness and potential lip incompetency.`;
    } else if (sLine < -2.0) {
      softBadge = 'Lip Retrusion';
      softBadgeColor = '#3b82f6';
      softFinding = `Soft tissue lip retrusion (${sLine.toFixed(1)} mm posterior to S-Line) indicating a flat / concave facial profile with prominent chin appearance.`;
    } else {
      softFinding = `Ideal soft tissue lip balance (${sLine > 0 ? '+' : ''}${sLine.toFixed(1)} mm) touching or closely aligned with Steiner's S-Line.`;
    }
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Maxillary & Mandibular Basal Relationship (SNA, SNB, ANB)',
      finding: skFinding,
      badge: skBadge,
      badgeColor: skBadgeColor,
    },
    {
      title: '2. Vertical Skeletal Pattern & Mandibular Divergence (GoGn-SN, OP-SN)',
      finding: vertFinding,
      badge: vertBadge,
      badgeColor: vertBadgeColor,
    },
    {
      title: '3. Maxillary Incisor Inclination & AP Projection (U1 to NA)',
      finding: u1Finding,
      badge: u1Badge,
      badgeColor: u1BadgeColor,
    },
    {
      title: '4. Mandibular Incisor Torque & Apical Bone Support (L1 to NB)',
      finding: l1Finding,
      badge: l1Badge,
      badgeColor: l1BadgeColor,
    },
    {
      title: '5. Interincisal Angulation & Anterior Coupling (U1 to L1)',
      finding: interFinding,
      badge: interBadge,
      badgeColor: interBadgeColor,
    },
    {
      title: "6. Soft Tissue Esthetic Profile & Lip Harmony (Steiner's S-Line)",
      finding: softFinding,
      badge: softBadge,
      badgeColor: softBadgeColor,
    },
  ];

  const overallConclusion = customConclusion || (
    anb !== null || mp !== null
      ? `Steiner's Analysis synthesizes ${skFinding.toLowerCase()} with ${vertFinding.toLowerCase()} Dentoalveolar parameters confirm ${u1Finding.toLowerCase()} while soft tissue profile demonstrates ${softFinding.toLowerCase()}`
      : "Steiner's cephalometric evaluation synthesized across 5 skeletal and 6 dental/soft tissue diagnostic parameters."
  );

  return {
    slideTitle: "11B. Steiner's Analysis: Overall Diagnostic Summary & Clinical Inferences",
    slideSubtitle: 'Comprehensive Craniofacial Skeletal, Dentoalveolar & Soft Tissue S-Line Synthesis',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// Ricketts' Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildRickettsInferencePayload(
  rickP: any,
  getStageVal: (field: any) => number | null,
  patientAge: number,
  customConclusion?: string
) {
  const fa = getStageVal(rickP.facialAxis);
  const fd = getStageVal(rickP.facialDepth);
  const mp = getStageVal(rickP.mandibularPlaneAngle);
  const conv = getStageVal(rickP.convexityPointA);
  const liMm = getStageVal(rickP.lowerIncisorToAPogMm);
  const liDeg = getStageVal(rickP.lowerIncisorToAPogDeg);
  const umPtv = getStageVal(rickP.upperMolarToPtv);
  const eLine = getStageVal(rickP.lowerLipToEPlane);
  const umNorm = patientAge + 3;

  // 1. Growth Biotype & Mandibular Rotational Vector (Facial Axis & MP)
  let biotypeFinding = 'Mesofacial balanced facial biotype with neutral growth vector.';
  let biotypeBadge = 'Mesofacial';
  let biotypeBadgeColor = '#10b981';

  if ((fa !== null && fa < 86.5) || (mp !== null && mp > 30.5) || (fd !== null && fd < 84.0)) {
    biotypeBadge = 'Dolichofacial / Vertical';
    biotypeBadgeColor = '#ef4444';
    biotypeFinding = `Dolichofacial vertical growth biotype (Facial Axis: ${fa !== null ? `${fa.toFixed(1)}°` : '—'} < 86.5°, MP to FH: ${mp !== null ? `${mp.toFixed(1)}°` : '—'} > 30.5°) indicating downward-backward mandibular growth trajectory with weak musculature.`;
  } else if ((fa !== null && fa > 93.5) || (mp !== null && mp < 21.5) || (fd !== null && fd > 90.0)) {
    biotypeBadge = 'Brachyfacial / Horizontal';
    biotypeBadgeColor = '#3b82f6';
    biotypeFinding = `Brachyfacial horizontal growth biotype (Facial Axis: ${fa !== null ? `${fa.toFixed(1)}°` : '—'} > 93.5°, MP to FH: ${mp !== null ? `${mp.toFixed(1)}°` : '—'} < 21.5°) indicating strong forward mandibular rotation and robust masticatory musculature.`;
  } else if (fa !== null || mp !== null) {
    biotypeFinding = `Mesofacial balanced growth vector (Facial Axis: ${fa !== null ? `${fa.toFixed(1)}°` : '90.0°'}, MP to FH: ${mp !== null ? `${mp.toFixed(1)}°` : '26.0°'}).`;
  }

  // 2. Skeletal Convexity & Profile Form (Convexity of Point A & Facial Depth)
  let convFinding = 'Convexity of Point A demonstrates orthognathic Skeletal Class I profile convexity.';
  let convBadge = 'Harmonious Convexity';
  let convBadgeColor = '#10b981';

  if (conv !== null) {
    if (conv > 4.0) {
      convBadge = 'Skeletal Class II Convexity';
      convBadgeColor = '#ef4444';
      convFinding = `Skeletal Class II profile convexity (Point A Convexity: +${conv.toFixed(1)} mm > 4.0 mm) reflecting maxillary apical base protrusion relative to the facial plane.`;
    } else if (conv < 0.0) {
      convBadge = 'Skeletal Class III Concavity';
      convBadgeColor = '#3b82f6';
      convFinding = `Skeletal Class III profile concavity (Point A Convexity: ${conv.toFixed(1)} mm < 0.0 mm) reflecting mandibular prognathism or midfacial retrusion.`;
    } else {
      convFinding = `Orthognathic skeletal profile convexity (Point A Convexity: +${conv.toFixed(1)} mm, norm 0.0 to 4.0 mm; Facial Depth: ${fd !== null ? `${fd.toFixed(1)}°` : '87.0°'}).`;
    }
  }

  // 3. Lower Incisor Position & Torque to A-Pog Line (L1 to A-Pog mm & deg)
  let l1Finding = 'Lower incisors are well-positioned and inclined relative to the functional A-Pog plane.';
  let l1Badge = 'Normal L1 to A-Pog';
  let l1BadgeColor = '#10b981';

  if (liMm !== null || liDeg !== null) {
    const isPro = (liMm !== null && liMm > 3.0) || (liDeg !== null && liDeg > 26.0);
    const isRetro = (liMm !== null && liMm < -1.0) || (liDeg !== null && liDeg < 18.0);
    if (isPro) {
      l1Badge = 'L1 Protrusion / Proclination';
      l1BadgeColor = '#ef4444';
      l1Finding = `Lower incisor protrusion and proclination relative to A-Pog (${liMm !== null ? `Linear: +${liMm.toFixed(1)} mm` : ''}${liDeg !== null ? `, Angulation: ${liDeg.toFixed(1)}°` : ''}) exceeding stable cortical limits.`;
    } else if (isRetro) {
      l1Badge = 'L1 Retrusion / Retroclination';
      l1BadgeColor = '#f59e0b';
      l1Finding = `Lower incisor retrusion and retroclination relative to A-Pog (${liMm !== null ? `Linear: ${liMm.toFixed(1)} mm` : ''}${liDeg !== null ? `, Angulation: ${liDeg.toFixed(1)}°` : ''}).`;
    } else {
      l1Finding = `Ideal lower incisor positioning on the A-Pog line (${liMm !== null ? `+${liMm.toFixed(1)} mm` : '+1.0 mm'}, ${liDeg !== null ? `${liDeg.toFixed(1)}°` : '22.0°'}).`;
    }
  }

  // 4. Maxillary Molar Eruption & Space Availability (Upper Molar to PTV)
  let molarFinding = `Upper molar position to PTV is consistent with patient age norms (~${umNorm} mm).`;
  let molarBadge = 'Normal Molar Position';
  let molarBadgeColor = '#10b981';

  if (umPtv !== null) {
    if (umPtv > umNorm + 2) {
      molarBadge = 'Molar Mesial Drift';
      molarBadgeColor = '#ef4444';
      molarFinding = `Upper 1st molar is mesially positioned (6 to PTV: ${umPtv.toFixed(1)} mm > norm ${umNorm} mm) indicating maxillary crowding or loss of arch perimeter.`;
    } else if (umPtv < umNorm - 2) {
      molarBadge = 'Molar Distal Position';
      molarBadgeColor = '#3b82f6';
      molarFinding = `Upper 1st molar is distally positioned (6 to PTV: ${umPtv.toFixed(1)} mm < norm ${umNorm} mm) indicating available posterior space.`;
    } else {
      molarFinding = `Upper molar AP position to PTV (${umPtv.toFixed(1)} mm) matches biological norm for age ${patientAge} (Norm: ${umNorm} ± 2 mm).`;
    }
  }

  // 5. Soft Tissue Profile & Esthetic Line Harmony (Ricketts' E-Plane)
  let eLineFinding = 'Lower lip posture demonstrates harmonious relationship with Ricketts Esthetic E-Plane (-2.0 mm).';
  let eLineBadge = 'Harmonious E-Line';
  let eLineBadgeColor = '#10b981';

  if (eLine !== null) {
    if (eLine > 0.0) {
      eLineBadge = 'Lower Lip Protrusion';
      eLineBadgeColor = '#ef4444';
      eLineFinding = `Lower lip protrusion (${eLine > 0 ? '+' : ''}${eLine.toFixed(1)} mm anterior to E-Line > 0.0 mm) reflecting soft tissue convexity and perioral fullness.`;
    } else if (eLine < -4.0) {
      eLineBadge = 'Lower Lip Retrusion';
      eLineBadgeColor = '#3b82f6';
      eLineFinding = `Lower lip retrusion (${eLine.toFixed(1)} mm posterior to E-Line < -4.0 mm) reflecting a flat profile or prominent nasal/chin projection.`;
    } else {
      eLineFinding = `Ideal lower lip posture relative to Ricketts E-Line (${eLine.toFixed(1)} mm, norm -2.0 ± 2.0 mm).`;
    }
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Craniofacial Growth Biotype & Vector (Facial Axis & MP to FH)',
      finding: biotypeFinding,
      badge: biotypeBadge,
      badgeColor: biotypeBadgeColor,
    },
    {
      title: '2. Skeletal Profile Convexity & Facial Depth (Point A & N-Pg to FH)',
      finding: convFinding,
      badge: convBadge,
      badgeColor: convBadgeColor,
    },
    {
      title: '3. Mandibular Incisor AP Position & Torque (L1 to A-Pog mm & deg)',
      finding: l1Finding,
      badge: l1Badge,
      badgeColor: l1BadgeColor,
    },
    {
      title: '4. Upper Molar Eruption & Arch Perimeter Space (6 to PTV)',
      finding: molarFinding,
      badge: molarBadge,
      badgeColor: molarBadgeColor,
    },
    {
      title: "5. Soft Tissue Esthetic Profile & Lip Projection (Ricketts' E-Line)",
      finding: eLineFinding,
      badge: eLineBadge,
      badgeColor: eLineBadgeColor,
    },
  ];

  const overallConclusion = customConclusion || (
    fa !== null || conv !== null || liMm !== null
      ? `Ricketts' Analysis indicates a ${biotypeFinding.toLowerCase()} with ${convFinding.toLowerCase()} Dentoalveolar arch analysis shows ${l1Finding.toLowerCase()} while soft tissue profile demonstrates ${eLineFinding.toLowerCase()}`
      : "Ricketts' cephalometric evaluation synthesized across facial axis, skeletal convexity, dentoalveolar, and esthetic plane parameters."
  );

  return {
    slideTitle: "12B. Ricketts' Analysis: Overall Diagnostic Summary & Clinical Inferences",
    slideSubtitle: 'Growth Vectors, Skeletal Biotype, Dentoalveolar Positioning & Esthetic Plane Synthesis',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// McNamara's Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildMcNamaraInferencePayload(
  mcnamaraP: any,
  getStageVal: (field: any) => number | null,
  frameSize: string,
  customConclusion?: string
) {
  const naso = getStageVal(mcnamaraP.nasolabialAngle);
  const naA = getStageVal(mcnamaraP.naPerpToPointA);
  const coGn = getStageVal(mcnamaraP.mandibularLengthCoGn);
  const coA = getStageVal(mcnamaraP.maxillaryLengthCoPointA);
  const mp = getStageVal(mcnamaraP.mandibularPlaneAngle);
  const pog = getStageVal(mcnamaraP.pogNaPerp);
  const u1A = getStageVal(mcnamaraP.upperIncisorToPointA);
  const l1A = getStageVal(mcnamaraP.lowerIncisorToPointA);
  const upPh = getStageVal(mcnamaraP.upperPharynx);
  const lowPh = getStageVal(mcnamaraP.lowerPharynx);

  // 1. Maxillary & Mandibular AP Position relative to Nasion Perpendicular
  let skSagFinding = 'Maxilla and mandible are harmoniously aligned relative to Nasion Perpendicular.';
  let skSagBadge = 'Class I Alignment';
  let skSagBadgeColor = '#10b981';

  if (naA !== null || pog !== null) {
    if (naA !== null && naA > 1.0 && pog !== null && pog < -2.0) {
      skSagBadge = 'Class II Discrepancy';
      skSagBadgeColor = '#ef4444';
      skSagFinding = `Class II skeletal discrepancy characterized by maxillary skeletal protrusion (Point A to Na-Perp: +${naA.toFixed(1)} mm > 1.0 mm) and mandibular skeletal retrusion (Pogonion to Na-Perp: ${pog.toFixed(1)} mm < -2.0 mm).`;
    } else if (naA !== null && naA > 1.0) {
      skSagBadge = 'Maxillary Protrusion';
      skSagBadgeColor = '#ef4444';
      skSagFinding = `Maxillary skeletal protrusion relative to Nasion Perpendicular (Point A: +${naA.toFixed(1)} mm > 1.0 mm).`;
    } else if (pog !== null && pog < -2.0) {
      skSagBadge = 'Mandibular Retrusion';
      skSagBadgeColor = '#f59e0b';
      skSagFinding = `Mandibular skeletal retrusion relative to Nasion Perpendicular (Pogonion: ${pog.toFixed(1)} mm < -2.0 mm).`;
    } else if (pog !== null && pog > 4.0) {
      skSagBadge = 'Mandibular Prognathism';
      skSagBadgeColor = '#3b82f6';
      skSagFinding = `Mandibular skeletal prognathism relative to Nasion Perpendicular (Pogonion: +${pog.toFixed(1)} mm > 4.0 mm).`;
    } else {
      skSagFinding = `Harmonious maxillary (Na-Perp to Point A: ${naA !== null ? `${naA.toFixed(1)} mm` : '0-1 mm'}) and mandibular (Na-Perp to Pog: ${pog !== null ? `${pog.toFixed(1)} mm` : '-2 to 4 mm'}) spatial positioning.`;
    }
  }

  // 2. Maxillomandibular Effective Length Differential (Co-A vs Co-Gn)
  let diffFinding = 'Maxillary and mandibular effective lengths are in harmonious geometric balance.';
  let diffBadge = 'Harmonious Unit Diff';
  let diffBadgeColor = '#10b981';

  if (coGn !== null && coA !== null) {
    const diff = coGn - coA;
    diffFinding = `Effective lengths: Mandible (Co-Gn: ${coGn.toFixed(1)} mm), Maxilla (Co-A: ${coA.toFixed(1)} mm), yielding a Maxillomandibular Unit Differential of ${diff.toFixed(1)} mm.`;
    if (diff < 20) {
      diffBadge = 'Reduced Differential (Class II)';
      diffBadgeColor = '#ef4444';
      diffFinding += ' Decreased differential reflects skeletal Class II mandibular deficiency.';
    } else if (diff > 35) {
      diffBadge = 'Increased Differential (Class III)';
      diffBadgeColor = '#3b82f6';
      diffFinding += ' Increased differential indicates mandibular macrognathia / Class III skeletal pattern.';
    }
  }

  // 3. Vertical Divergence & Mandibular Plane Angle (MP to FH)
  let vertFinding = 'Normodivergent vertical growth direction (MP to FH: 22° - 28°).';
  let vertBadge = 'Normodivergent';
  let vertBadgeColor = '#10b981';

  if (mp !== null) {
    if (mp > 28.0) {
      vertBadge = 'Hyperdivergent / High Angle';
      vertBadgeColor = '#ef4444';
      vertFinding = `Hyperdivergent facial pattern (MP to FH: ${mp.toFixed(1)}° > 28.0°) indicating backward mandibular rotation and long lower face tendency.`;
    } else if (mp < 22.0) {
      vertBadge = 'Hypodivergent / Low Angle';
      vertBadgeColor = '#3b82f6';
      vertFinding = `Hypodivergent facial pattern (MP to FH: ${mp.toFixed(1)}° < 22.0°) indicating forward mandibular rotation and deep bite tendency.`;
    } else {
      vertFinding = `Normodivergent balanced vertical facial pattern (MP to FH: ${mp.toFixed(1)}°).`;
    }
  }

  // 4. Dentoalveolar Position & Incisor Placement (U1 to A & L1 to A)
  let dentFinding = 'Incisors demonstrate balanced dentoalveolar position relative to Point A vertical reference.';
  if (u1A !== null || l1A !== null) {
    const parts = [];
    if (u1A !== null) parts.push(`Upper incisor: ${u1A.toFixed(1)} mm (${u1A > 6 ? 'protrusive' : u1A < 4 ? 'retrusive' : 'ideal 4-6 mm'})`);
    if (l1A !== null) parts.push(`Lower incisor: ${l1A.toFixed(1)} mm (${l1A > 3 ? 'protrusive' : l1A < 1 ? 'retrusive' : 'ideal 1-3 mm'})`);
    dentFinding = `Incisor positions: ${parts.join('; ')}.`;
  }

  // 5. Upper & Lower Pharyngeal Airway Dimensions
  let airwayFinding = 'Upper and lower pharyngeal airway spaces are patent and within physiological limits.';
  let airwayBadge = 'Patent Airway';
  let airwayBadgeColor = '#10b981';

  const isUpConstricted = upPh !== null && upPh < 15.0;
  const isLowConstricted = lowPh !== null && lowPh < 11.0;

  if (isUpConstricted || isLowConstricted) {
    airwayBadge = 'Constricted Airway';
    airwayBadgeColor = '#ef4444';
    const parts = [];
    if (isUpConstricted) parts.push(`Upper pharyngeal space (${upPh?.toFixed(1)} mm < 15 mm; adenoid hypertrophy risk)`);
    if (isLowConstricted) parts.push(`Lower pharyngeal space (${lowPh?.toFixed(1)} mm < 11 mm; retroglossal airway constriction risk)`);
    airwayFinding = `Constricted pharyngeal airway: ${parts.join(', ')}. Clinical screening for sleep-disordered breathing / mouth breathing indicated.`;
  } else if (upPh !== null || lowPh !== null) {
    airwayFinding = `Adequate pharyngeal airway spaces (Upper: ${upPh !== null ? `${upPh.toFixed(1)} mm` : '15-20 mm'}, Lower: ${lowPh !== null ? `${lowPh.toFixed(1)} mm` : '11-14 mm'}).`;
  }

  // 6. Nasolabial Angle & Soft Tissue Upper Lip Support
  let nasoFinding = 'Nasolabial angle exhibits normal soft tissue profile angulation (102° ± 8°).';
  let nasoBadge = 'Ideal Nasolabial';
  let nasoBadgeColor = '#10b981';

  if (naso !== null) {
    if (naso < 94.0) {
      nasoBadge = 'Acute Angle / Protrusive';
      nasoBadgeColor = '#ef4444';
      nasoFinding = `Acute nasolabial angle (${naso.toFixed(1)}° < 94.0°) reflecting upper lip protrusion, dentoalveolar flare, or downward nasal tip inclination.`;
    } else if (naso > 110.0) {
      nasoBadge = 'Obtuse Angle / Retrusive';
      nasoBadgeColor = '#f59e0b';
      nasoFinding = `Obtuse nasolabial angle (${naso.toFixed(1)}° > 110.0°) reflecting upper lip retrusion or upward upturned nasal base.`;
    } else {
      nasoFinding = `Harmonious nasolabial angle (${naso.toFixed(1)}°, norm 94° - 110°) providing optimal esthetic lip support.`;
    }
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Sagittal Maxillary & Mandibular Position (Na-Perp to Pt A & Pog)',
      finding: skSagFinding,
      badge: skSagBadge,
      badgeColor: skSagBadgeColor,
    },
    {
      title: '2. Maxillomandibular Unit Differential (Co-A vs Co-Gn Lengths)',
      finding: diffFinding,
      badge: diffBadge,
      badgeColor: diffBadgeColor,
    },
    {
      title: '3. Vertical Divergence & Mandibular Plane (MP to FH)',
      finding: vertFinding,
      badge: vertBadge,
      badgeColor: vertBadgeColor,
    },
    {
      title: '4. Dentoalveolar Incisor Placement (U1 to Pt A & L1 to Pt A)',
      finding: dentFinding,
    },
    {
      title: '5. Pharyngeal Airway Dimensions (Upper & Lower Airway Width)',
      finding: airwayFinding,
      badge: airwayBadge,
      badgeColor: airwayBadgeColor,
    },
    {
      title: '6. Soft Tissue Nasolabial Profile (Nasolabial Angle)',
      finding: nasoFinding,
      badge: nasoBadge,
      badgeColor: nasoBadgeColor,
    },
  ];

  const overallConclusion = customConclusion || (
    naA !== null || pog !== null || coGn !== null
      ? `McNamara's Analysis demonstrates ${skSagFinding.toLowerCase()} with ${vertFinding.toLowerCase()} Maxillomandibular differential is ${diffFinding.toLowerCase()} while airway appraisal confirms ${airwayFinding.toLowerCase()}`
      : "McNamara's cephalometric evaluation synthesized across sagittal cranial base reference, maxillomandibular differential, and airway dimensions."
  );

  return {
    slideTitle: "13C. Diagnostic Summary & Clinical Inferences — McNamara's Cephalometric Analysis",
    slideSubtitle: 'Maxillomandibular Unit Differential, Airway Patency & Cranial Base References',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// Tweed's & Schwarz's Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildTweedSchwarzInferencePayload(
  stP: any,
  getStageVal: (field: any) => number | null,
  customConclusion?: string
) {
  const fmpa = getStageVal(stP.fmpa);
  const fmia = getStageVal(stP.fmia);
  const impa = getStageVal(stP.impa);
  const seN = getStageVal(stP.seNLength);
  const maxL = getStageVal(stP.maxillaryLength);
  const mandL = getStageVal(stP.mandibularLength);
  const ramL = getStageVal(stP.ascendingRamusLength);

  // 1. Tweed Facial Pattern & Anchorage Control (FMA / FMPA)
  let fmaFinding = 'Normodivergent facial growth pattern (FMPA: 25.0°) with balanced anchorage potential.';
  let fmaBadge = 'Balanced Anchorage';
  let fmaBadgeColor = '#10b981';

  if (fmpa !== null) {
    if (fmpa > 28.0) {
      fmaBadge = 'High Angle / Critical Anchorage';
      fmaBadgeColor = '#ef4444';
      fmaFinding = `Hyperdivergent facial pattern (FMPA: ${fmpa.toFixed(1)}° > 28.0°) indicating weak musculature and unfavorable anchorage; strict vertical control and molar intrusion/retention protocols required.`;
    } else if (fmpa < 22.0) {
      fmaBadge = 'Low Angle / Strong Anchorage';
      fmaBadgeColor = '#3b82f6';
      fmaFinding = `Hypodivergent facial pattern (FMPA: ${fmpa.toFixed(1)}° < 22.0°) indicating robust musculature, favorable anchorage conservation, and deep bite tendency.`;
    } else {
      fmaFinding = `Normodivergent balanced growth vector (FMPA: ${fmpa.toFixed(1)}°, norm 22° - 28°) offering optimal biomechanical predictability.`;
    }
  }

  // 2. Mandibular Incisor Basal Equilibrium (IMPA & FMIA)
  let incisorFinding = 'Lower incisors are well-positioned on mandibular basal bone (IMPA: 90°, FMIA: 65°).';
  let incisorBadge = 'Stable Incisor Position';
  let incisorBadgeColor = '#10b981';

  if (impa !== null || fmia !== null) {
    if (impa !== null && impa > 95.0) {
      incisorBadge = 'Lower Incisor Proclination';
      incisorBadgeColor = '#ef4444';
      incisorFinding = `Lower incisors are excessively proclined beyond symphyseal limits (IMPA: ${impa.toFixed(1)}° > 95.0°, FMIA: ${fmia !== null ? `${fmia.toFixed(1)}°` : '—'} < 62°); high risk of cortical plate dehiscence and relapse without uprighting/extractions.`;
    } else if (impa !== null && impa < 85.0) {
      incisorBadge = 'Lower Incisor Retroclination';
      incisorBadgeColor = '#f59e0b';
      incisorFinding = `Lower incisors are retroclined on apical bone (IMPA: ${impa.toFixed(1)}° < 85.0°, FMIA: ${fmia !== null ? `${fmia.toFixed(1)}°` : '—'} > 68°); opportunity for controlled labial alignment if indicated.`;
    } else {
      incisorFinding = `Ideal Tweed incisal harmony (IMPA: ${impa !== null ? `${impa.toFixed(1)}°` : '90.0°'}, FMIA: ${fmia !== null ? `${fmia.toFixed(1)}°` : '65.0°'}) fulfilling Tweed's criteria for facial balance and post-retention stability.`;
    }
  }

  // 3. Schwarz Craniofacial Basal Dimensions (Maxillary vs Mandibular Lengths)
  let basalFinding = 'Schwarz basal dimensions indicate balanced maxillary and mandibular bone lengths.';
  let basalBadge = 'Harmonious Basal Bones';
  let basalBadgeColor = '#10b981';

  if (maxL !== null || mandL !== null) {
    const parts = [];
    if (maxL !== null) parts.push(`Maxilla (SpP): ${maxL.toFixed(1)} mm (norm 47.5 mm, ${maxL > 49.5 ? 'increased' : maxL < 45.5 ? 'decreased' : 'normal'})`);
    if (mandL !== null) parts.push(`Mandible (Corpus): ${mandL.toFixed(1)} mm (norm 71.0 mm, ${mandL > 73 ? 'increased' : mandL < 69 ? 'decreased' : 'normal'})`);
    basalFinding = `Schwarz basal bone lengths: ${parts.join('; ')}.`;
  }

  // 4. Anterior Cranial Base & Ramus Development (Se-N & Ramus Height)
  let structFinding = 'Anterior cranial base length and ascending ramus height are within normal morphological limits.';
  if (seN !== null || ramL !== null) {
    const parts = [];
    if (seN !== null) parts.push(`Se-N: ${seN.toFixed(1)} mm (${seN > 70 ? 'increased' : seN < 66 ? 'decreased' : 'normal 68 mm'})`);
    if (ramL !== null) parts.push(`Ramus Height: ${ramL.toFixed(1)} mm (${ramL > 52 ? 'increased / strong support' : ramL < 48 ? 'decreased / vertical open bite risk' : 'normal 50 mm'})`);
    structFinding = `Structural dimensions: ${parts.join('; ')}.`;
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: "1. Tweed's Facial Pattern & Anchorage Control (FMA / FMPA)",
      finding: fmaFinding,
      badge: fmaBadge,
      badgeColor: fmaBadgeColor,
    },
    {
      title: "2. Mandibular Incisor Basal Equilibrium (IMPA & FMIA)",
      finding: incisorFinding,
      badge: incisorBadge,
      badgeColor: incisorBadgeColor,
    },
    {
      title: "3. Schwarz Craniofacial Basal Dimensions (Maxillary vs Mandibular Lengths)",
      finding: basalFinding,
      badge: basalBadge,
      badgeColor: basalBadgeColor,
    },
    {
      title: "4. Anterior Cranial Base & Ramus Development (Se-N & Ramus Height)",
      finding: structFinding,
    },
  ];

  const overallConclusion = customConclusion || (
    fmpa !== null || impa !== null || mandL !== null
      ? `Tweed & Schwarz Evaluation: ${fmaFinding.toLowerCase()} Dentoalveolar assessment confirms ${incisorFinding.toLowerCase()} while Schwarz basal morphometrics show ${basalFinding.toLowerCase()}`
      : "Tweed's diagnostic triangle (FMPA, FMIA, IMPA) and Schwarz's craniofacial basal dimensions synthesized for anchorage and stability limits."
  );

  return {
    slideTitle: "14C. Diagnostic Summary & Clinical Inferences — Tweed's & Schwarz's Analyses",
    slideSubtitle: 'Anchorage Triangle Dynamics, Symphyseal Limits & Basal Morphometric Dimensions',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// Holdaway's Soft Tissue Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildHoldawayInferencePayload(
  holdP: any,
  getStageVal: (field: any) => number | null,
  anbVal: number | null,
  customConclusion?: string
) {
  const fc = getStageVal(holdP.facialContourAngle);
  const uls = getStageVal(holdP.upperLipStrain);
  const chinThick = getStageVal(holdP.softTissueChinThickness);
  const subH = getStageVal(holdP.subnasaleToHLine);
  const ulH = getStageVal(holdP.upperLipToHLine);
  const llH = getStageVal(holdP.lowerLipToHLine);
  const stfa = getStageVal(holdP.softTissueFacialAngle);
  const hAng = getStageVal(holdP.hAngle);
  const hTarget = anbVal !== null ? 7 + anbVal : 10;

  // 1. Soft Tissue Facial Contour Angle & Profile Form
  let fcFinding = 'Facial contour angle indicates a straight, balanced soft tissue profile (8° - 10°).';
  let fcBadge = 'Straight Profile';
  let fcBadgeColor = '#10b981';

  if (fc !== null) {
    if (fc > 10.0) {
      fcBadge = 'Convex Soft Profile';
      fcBadgeColor = '#ef4444';
      fcFinding = `Convex soft tissue facial profile (Facial Contour Angle: ${fc.toFixed(1)}° > 10.0°) reflecting skeletal Class II convexity or severe maxillary dentoalveolar protrusion.`;
    } else if (fc < 8.0) {
      fcBadge = 'Concave Soft Profile';
      fcBadgeColor = '#3b82f6';
      fcFinding = `Concave soft tissue facial profile (Facial Contour Angle: ${fc.toFixed(1)}° < 8.0°) reflecting mandibular prominence or midfacial retrusion.`;
    } else {
      fcFinding = `Straight / harmonious soft tissue facial profile contour (${fc.toFixed(1)}°, norm 8.0° - 10.0°).`;
    }
  }

  // 2. Holdaway H-Angle & Harmony Line Assessment
  let hFinding = `Holdaway H-Angle is balanced relative to skeletal discrepancy (Target: ${hTarget.toFixed(1)}°).`;
  let hBadge = 'Harmonious H-Angle';
  let hBadgeColor = '#10b981';

  if (hAng !== null) {
    if (hAng > hTarget + 3) {
      hBadge = 'Increased H-Angle / Class II';
      hBadgeColor = '#ef4444';
      hFinding = `Increased H-Angle (${hAng.toFixed(1)}° > target ${hTarget.toFixed(1)}°) reflecting soft tissue Class II profile convexity and perioral protrusion.`;
    } else if (hAng < hTarget - 3) {
      hBadge = 'Decreased H-Angle / Class III';
      hBadgeColor = '#3b82f6';
      hFinding = `Decreased H-Angle (${hAng.toFixed(1)}° < target ${hTarget.toFixed(1)}°) reflecting a flat or Class III soft tissue profile tendency.`;
    } else {
      hFinding = `Harmonious soft tissue profile H-Angle (${hAng.toFixed(1)}° matching target of ${hTarget.toFixed(1)}° based on ANB angle).`;
    }
  }

  // 3. Upper & Lower Lip Relations to H-Line (ulH & llH)
  let lipFinding = 'Upper and lower lips are harmoniously draped on the Holdaway H-Line.';
  let lipBadge = 'Balanced Lip Posture';
  let lipBadgeColor = '#10b981';

  if (ulH !== null || llH !== null) {
    const parts = [];
    if (ulH !== null) parts.push(`Upper lip to H-Line: ${ulH.toFixed(1)} mm (${ulH > 2 ? 'protrusive' : ulH < 1 ? 'retrusive' : 'ideal 1-2 mm'})`);
    if (llH !== null) parts.push(`Lower lip to H-Line: ${llH.toFixed(1)} mm (${llH > 0.5 ? 'protrusive/full' : llH < 0 ? 'retrusive' : 'ideal 0-0.5 mm'})`);
    lipFinding = `Lip posture relative to H-Line: ${parts.join('; ')}.`;
  }

  // 4. Soft Tissue Chin Thickness & Facial Angle (stfa & chinThick)
  let chinFinding = 'Soft tissue chin thickness and soft tissue facial angle demonstrate normal projection.';
  if (stfa !== null || chinThick !== null) {
    const parts = [];
    if (stfa !== null) parts.push(`ST Facial Angle: ${stfa.toFixed(1)}° (${stfa < 84 ? 'retrusive chin' : stfa > 98 ? 'prominent chin' : 'ideal 91°'})`);
    if (chinThick !== null) parts.push(`Chin Thickness: ${chinThick.toFixed(1)} mm (${chinThick > 12 ? 'thick button' : chinThick < 10 ? 'thin cushion' : 'normal 10-12 mm'})`);
    chinFinding = `Chin morphology: ${parts.join('; ')}.`;
  }

  // 5. Upper Lip Strain & Subnasale Relationship
  let strainFinding = 'Upper lip strain is physiological (3.0 mm) with adequate perioral relaxation.';
  if (uls !== null) {
    if (uls > 3.0) {
      strainFinding = `Increased upper lip strain (${uls.toFixed(1)} mm > 3.0 mm) indicating perioral muscular tension and lip incompetence over protrusive incisors.`;
    } else {
      strainFinding = `Normal physiological upper lip strain (${uls.toFixed(1)} mm) ensuring competent, unstrained lip closure at rest.`;
    }
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Soft Tissue Facial Contour Angle & Profile Form',
      finding: fcFinding,
      badge: fcBadge,
      badgeColor: fcBadgeColor,
    },
    {
      title: '2. Holdaway H-Angle & Soft Tissue Harmony (H-Line to NB)',
      finding: hFinding,
      badge: hBadge,
      badgeColor: hBadgeColor,
    },
    {
      title: '3. Upper & Lower Lip Relations to H-Line',
      finding: lipFinding,
      badge: lipBadge,
      badgeColor: lipBadgeColor,
    },
    {
      title: '4. Soft Tissue Chin Thickness & Facial Angle',
      finding: chinFinding,
    },
    {
      title: '5. Upper Lip Strain & Subnasale Projection',
      finding: strainFinding,
    },
  ];

  const overallConclusion = customConclusion || (
    fc !== null || hAng !== null || ulH !== null
      ? `Holdaway Soft Tissue Summary: ${fcFinding.toLowerCase()} H-Angle evaluation confirms ${hFinding.toLowerCase()} Lip relationships indicate ${lipFinding.toLowerCase()}`
      : "Holdaway soft tissue analysis integrates facial contour, H-angle, lip posture to H-line, and soft tissue chin drape."
  );

  return {
    slideTitle: "15B. Diagnostic Summary & Clinical Inferences — Holdaway's Soft Tissue Analysis",
    slideSubtitle: 'Comprehensive Soft Tissue Profile Harmony, H-Line Equilibrium & Perioral Aesthetics',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// COGS Hard Tissue Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildCogsHardInferencePayload(
  cogsHardP: any,
  getStageVal: (field: any) => number | null,
  ptGender: 'Male' | 'Female',
  customConclusion?: string
) {
  const na = getStageVal(cogsHardP.na);
  const nb = getStageVal(cogsHardP.nb);
  const ptmA = getStageVal(cogsHardP.maxillaryLengthPtmA);
  const arPg = getStageVal(cogsHardP.totalMandibularLengthArPg);
  const goPg = getStageVal(cogsHardP.corpusLengthGoPg);
  const arGo = getStageVal(cogsHardP.ramusHeightArGo);
  const nAns = getStageVal(cogsHardP.nAns);
  const ansMe = getStageVal(cogsHardP.ansMe);
  const fhr = getStageVal(cogsHardP.facialHeightRatio);

  // 1. Sagittal Maxillary & Mandibular Skeletal Positions (N-A & N-B)
  let skSagFinding = 'Maxilla and mandible are harmoniously aligned relative to the cranial reference plane HP.';
  let skSagBadge = 'Surgical Class I';
  let skSagBadgeColor = '#10b981';

  if (na !== null || nb !== null) {
    if (na !== null && nb !== null) {
      const diff = na - nb;
      if (diff > 5.5) {
        skSagBadge = 'Surgical Class II Discrepancy';
        skSagBadgeColor = '#ef4444';
        skSagFinding = `Class II skeletal discrepancy (N-A: ${na > 0 ? '+' : ''}${na.toFixed(1)} mm, N-B: ${nb > 0 ? '+' : ''}${nb.toFixed(1)} mm; Max-Mand differential Δ: ${diff.toFixed(1)} mm > norm 3.0 mm) reflecting maxillary protrusion and/or mandibular retrusion.`;
      } else if (diff < 0.0) {
        skSagBadge = 'Surgical Class III Discrepancy';
        skSagBadgeColor = '#3b82f6';
        skSagFinding = `Class III skeletal discrepancy (N-A: ${na.toFixed(1)} mm, N-B: ${nb.toFixed(1)} mm; differential Δ: ${diff.toFixed(1)} mm < 0.0 mm) reflecting mandibular prognathism and/or midface hypoplasia.`;
      } else {
        skSagFinding = `Surgical Class I orthognathic alignment (N-A: ${na > 0 ? '+' : ''}${na.toFixed(1)} mm, N-B: ${nb > 0 ? '+' : ''}${nb.toFixed(1)} mm; harmonious AP relationship).`;
      }
    }
  }

  // 2. Basal Unit Lengths: Maxilla & Mandible (Ptm-A, Ar-Pg, Go-Pg)
  let basalFinding = 'Maxillary and mandibular basal unit dimensions are within normal gender-specific ranges.';
  let basalBadge = 'Normal Basal Lengths';
  let basalBadgeColor = '#10b981';

  if (arPg !== null || ptmA !== null || goPg !== null) {
    const parts = [];
    if (ptmA !== null) parts.push(`Maxilla (Ptm-A): ${ptmA.toFixed(1)} mm (${ptGender === 'Male' ? 'norm 53 mm' : 'norm 50 mm'})`);
    if (arPg !== null) parts.push(`Total Mandible (Ar-Pg): ${arPg.toFixed(1)} mm (${ptGender === 'Male' ? 'norm 118 mm' : 'norm 110 mm'})`);
    if (goPg !== null) parts.push(`Corpus (Go-Pg): ${goPg.toFixed(1)} mm (${ptGender === 'Male' ? 'norm 80 mm' : 'norm 75 mm'})`);
    basalFinding = `Basal dimensions (${ptGender}): ${parts.join('; ')}.`;
  }

  // 3. Ascending Ramus Height & Posterior Vertical Support (Ar-Go)
  let ramusFinding = 'Ascending ramus height is normal, providing stable posterior facial vertical dimension.';
  if (arGo !== null) {
    const ramusNorm = ptGender === 'Male' ? 52 : 47;
    ramusFinding = `Ascending ramus height (Ar-Go: ${arGo.toFixed(1)} mm, norm ${ramusNorm} ± 4 mm) provides ${arGo > ramusNorm + 4 ? 'increased posterior vertical support' : arGo < ramusNorm - 4 ? 'decreased posterior vertical support (open bite risk)' : 'normal posterior facial height'}.`;
  }

  // 4. Anterior Facial Heights & Vertical Proportion (N-ANS, ANS-Me, Facial Height Ratio)
  let vertFinding = 'Anterior vertical facial proportions (N-ANS / ANS-Me) are balanced.';
  let vertBadge = 'Balanced Vertical Heights';
  let vertBadgeColor = '#10b981';

  if (ansMe !== null || fhr !== null) {
    const parts = [];
    if (ansMe !== null) parts.push(`LAFH (ANS-Me): ${ansMe.toFixed(1)} mm (${ptGender === 'Male' ? 'norm 68 mm' : 'norm 62 mm'})`);
    if (nAns !== null) parts.push(`UAFH (N-ANS): ${nAns.toFixed(1)} mm`);
    if (fhr !== null) parts.push(`Ratio: ${fhr.toFixed(2)} (norm 0.81, ${fhr > 0.87 ? 'upper excess' : fhr < 0.75 ? 'lower excess / long face' : 'balanced'})`);
    vertFinding = `Vertical proportions: ${parts.join('; ')}.`;
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: '1. Sagittal Maxillary & Mandibular Skeletal Appraisal (N-A & N-B)',
      finding: skSagFinding,
      badge: skSagBadge,
      badgeColor: skSagBadgeColor,
    },
    {
      title: '2. Basal Morphometric Unit Lengths (Ptm-A, Ar-Pg, Go-Pg)',
      finding: basalFinding,
      badge: basalBadge,
      badgeColor: basalBadgeColor,
    },
    {
      title: '3. Ascending Ramus Height & Posterior Vertical Support (Ar-Go)',
      finding: ramusFinding,
    },
    {
      title: '4. Anterior Facial Heights & Height Ratio (N-ANS / ANS-Me)',
      finding: vertFinding,
      badge: vertBadge,
      badgeColor: vertBadgeColor,
    },
  ];

  const overallConclusion = customConclusion || (
    na !== null || nb !== null || arPg !== null
      ? `COGS Hard Tissue Surgical Appraisal: ${skSagFinding.toLowerCase()} Basal morphometrics demonstrate ${basalFinding.toLowerCase()} Vertical evaluation confirms ${vertFinding.toLowerCase()}`
      : "Burstone COGS hard tissue appraisal evaluates sagittal positions, basal morphometrics, and vertical facial heights."
  );

  return {
    slideTitle: '16C. Diagnostic Summary & Clinical Inferences — COGS Hard Tissue Analysis',
    slideSubtitle: 'Burstone Surgical-Orthodontic Appraisal — Sagittal Discrepancy, Basal Lengths & Vertical Heights',
    inferencePoints,
    overallConclusion,
  };
}

// ---------------------------------------------------------------------------
// COGS Soft Tissue Analysis Overall Summary & Clinical Inference Payload Builder
// ---------------------------------------------------------------------------
export function buildCogsSoftInferencePayload(
  cogsSoftP: any,
  getStageVal: (field: any) => number | null,
  customConclusion?: string
) {
  const gSnPg = getStageVal(cogsSoftP.gSnPg);
  const gPg = getStageVal(cogsSoftP.gPg);
  const gSnRatio = getStageVal(cogsSoftP.gSnSnMeRatio);
  const cmSnLs = getStageVal(cogsSoftP.cmSnLs);
  const lsSnPg = getStageVal(cogsSoftP.lsSnPg);
  const liSnPg = getStageVal(cogsSoftP.liSnPg);
  const siLiPg = getStageVal(cogsSoftP.siLiPg);
  const stmsI = getStageVal(cogsSoftP.stmsI);
  const stmsStmi = getStageVal(cogsSoftP.stmsStmi);
  const zAng = getStageVal(cogsSoftP.merrifieldZAngle);

  // 1. Soft Tissue Facial Convexity Angle (G-Sn-Pg')
  let convFinding = "Soft tissue facial convexity angle is straight to mildly convex (12.0° ± 4.0°).";
  let convBadge = 'Normal Convexity';
  let convBadgeColor = '#10b981';

  if (gSnPg !== null) {
    if (gSnPg > 16.0) {
      convBadge = 'Convex Soft Profile';
      convBadgeColor = '#ef4444';
      convFinding = `Convex soft tissue profile (G-Sn-Pg': ${gSnPg.toFixed(1)}° > 16.0°) indicating soft tissue Class II profile divergence and maxillary prominence.`;
    } else if (gSnPg < 8.0) {
      convBadge = 'Concave Soft Profile';
      convBadgeColor = '#3b82f6';
      convFinding = `Concave soft tissue profile (G-Sn-Pg': ${gSnPg.toFixed(1)}° < 8.0°) indicating soft tissue Class III profile tendency or prominent mandibular drape.`;
    } else {
      convFinding = `Harmonious soft tissue profile convexity (G-Sn-Pg': ${gSnPg.toFixed(1)}°, norm 8.0° - 16.0°).`;
    }
  }

  // 2. Soft Tissue Chin Projection & Merrifield Z-Angle (G-Pg' & Z-Angle)
  let chinFinding = 'Soft tissue chin projection is normal relative to true vertical reference line.';
  let chinBadge = 'Normal Chin Projection';
  let chinBadgeColor = '#10b981';

  if (gPg !== null || zAng !== null) {
    const parts = [];
    if (gPg !== null) parts.push(`G-Pg': ${gPg > 0 ? '+' : ''}${gPg.toFixed(1)} mm (${gPg < -4 ? 'retrogenia' : gPg > 4 ? 'macrogenia' : 'ideal 0 ± 4 mm'})`);
    if (zAng !== null) parts.push(`Merrifield Z-Angle: ${zAng.toFixed(1)}° (${zAng < 71 ? 'acute / retrusive chin' : zAng > 89 ? 'obtuse / prominent' : 'balanced 80° ± 9°'})`);
    chinFinding = `Chin projection: ${parts.join('; ')}.`;
  }

  // 3. Nasolabial Angle & Upper/Lower Lip Protrusion (Cm-Sn-Ls, Ls & Li to Sn-Pg')
  let lipFinding = 'Lip position and nasolabial angle demonstrate harmonious perioral projection.';
  let lipBadge = 'Balanced Lip Projection';
  let lipBadgeColor = '#10b981';

  if (cmSnLs !== null || lsSnPg !== null || liSnPg !== null) {
    const parts = [];
    if (cmSnLs !== null) parts.push(`Nasolabial: ${cmSnLs.toFixed(1)}° (${cmSnLs < 94 ? 'acute/protrusive' : cmSnLs > 110 ? 'obtuse/retrusive' : 'ideal 102°'})`);
    if (lsSnPg !== null) parts.push(`Upper Lip (Ls): ${lsSnPg.toFixed(1)} mm (norm 3 mm)`);
    if (liSnPg !== null) parts.push(`Lower Lip (Li): ${liSnPg.toFixed(1)} mm (norm 2 mm)`);
    lipFinding = `Perioral projection: ${parts.join('; ')}.`;
  }

  // 4. Perioral Competence & Upper Incisor Display (Stms-I & Stms-Stmi)
  let displayFinding = 'Incisor display at rest and lip competence are within normal physiological range.';
  let displayBadge = 'Competent Lips';
  let displayBadgeColor = '#10b981';

  if (stmsI !== null || stmsStmi !== null) {
    const parts = [];
    if (stmsI !== null) {
      if (stmsI > 4.0) parts.push(`Excessive resting incisor display (${stmsI.toFixed(1)} mm > 4 mm; gummy smile risk)`);
      else if (stmsI < 0.0) parts.push(`Inadequate resting incisor display (${stmsI.toFixed(1)} mm < 0 mm)`);
      else parts.push(`Resting incisor display: ${stmsI.toFixed(1)} mm (norm 2 mm)`);
    }
    if (stmsStmi !== null) {
      if (stmsStmi > 4.0) {
        displayBadge = 'Lip Incompetence';
        displayBadgeColor = '#ef4444';
        parts.push(`Lip incompetence present (${stmsStmi.toFixed(1)} mm interlabial gap > 4 mm)`);
      } else {
        parts.push(`Interlabial gap: ${stmsStmi.toFixed(1)} mm (competent)`);
      }
    }
    displayFinding = `Perioral dynamics: ${parts.join('; ')}.`;
  }

  // 5. Vertical Soft Tissue Proportions & Mentolabial Sulcus (G-Sn/Sn-Me' & Si)
  let vertSoftFinding = 'Vertical soft tissue height ratio and mentolabial sulcus depth are harmonious.';
  if (gSnRatio !== null || siLiPg !== null) {
    const parts = [];
    if (gSnRatio !== null) parts.push(`Vertical Ratio (G-Sn / Sn-Me'): ${gSnRatio.toFixed(2)} (norm 1.0)`);
    if (siLiPg !== null) parts.push(`Mentolabial Sulcus (Si): ${siLiPg.toFixed(1)} mm (norm 4 mm, ${siLiPg > 6 ? 'deep sulcus' : siLiPg < 2 ? 'flat sulcus' : 'normal'})`);
    vertSoftFinding = `Vertical and sulcus appraisal: ${parts.join('; ')}.`;
  }

  const inferencePoints: SheetInferencePoint[] = [
    {
      title: "1. Soft Tissue Facial Convexity Angle (G-Sn-Pg')",
      finding: convFinding,
      badge: convBadge,
      badgeColor: convBadgeColor,
    },
    {
      title: "2. Soft Tissue Chin Projection & Z-Angle (G-Pg' & Merrifield Z-Angle)",
      finding: chinFinding,
      badge: chinBadge,
      badgeColor: chinBadgeColor,
    },
    {
      title: "3. Nasolabial Angle & Lip Protrusion (Cm-Sn-Ls & Ls/Li to Sn-Pg')",
      finding: lipFinding,
      badge: lipBadge,
      badgeColor: lipBadgeColor,
    },
    {
      title: '4. Perioral Dynamics & Rest Incisor Display (Stms-I & Stms-Stmi)',
      finding: displayFinding,
      badge: displayBadge,
      badgeColor: displayBadgeColor,
    },
    {
      title: "5. Vertical Soft Tissue Proportions & Mentolabial Sulcus",
      finding: vertSoftFinding,
    },
  ];

  const overallConclusion = customConclusion || (
    gSnPg !== null || cmSnLs !== null || zAng !== null
      ? `Legan-Burstone Soft Tissue Appraisal: ${convFinding.toLowerCase()} Perioral projection confirms ${lipFinding.toLowerCase()} Perioral dynamics demonstrate ${displayFinding.toLowerCase()}`
      : "Legan-Burstone soft tissue profile analysis synthesizes facial form, lip protrusion, perioral competence, and Z-angle profile balance."
  );

  return {
    slideTitle: '17C. Diagnostic Summary & Clinical Inferences — COGS Soft Tissue Analysis',
    slideSubtitle: 'Legan-Burstone Soft Tissue Appraisal — Profile Convexity, Perioral Dynamics & Z-Angle Balance',
    inferencePoints,
    overallConclusion,
  };
}


