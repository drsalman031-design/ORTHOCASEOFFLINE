import { Gender } from '../types';

export type ClinicalStatus = 'Normal' | 'Borderline' | 'Increased' | 'Decreased' | 'PENDING_INPUT';

export type CephDiagnosticKey =
  | 'SAGITTAL_SKELETAL'
  | 'MAXILLARY_POSITION'
  | 'MANDIBULAR_POSITION'
  | 'WITS_SAGITTAL'
  | 'FACIAL_CONVEXITY'
  | 'FACIAL_ANGLE'
  | 'AB_PLANE_RELATION'
  | 'VERTICAL_GROWTH'
  | 'MANDIBULAR_PLANE'
  | 'FACIAL_AXIS_GROWTH'
  | 'BJORK_POLYGON'
  | 'JARABAK_RATIO'
  | 'OCCLUSAL_PLANE_CANT'
  | 'DENTAL_PROCLINATION_MAXILLARY'
  | 'DENTAL_PROCLINATION_MANDIBULAR'
  | 'INTERINCISAL_RELATION'
  | 'INCISOR_TO_APOG'
  | 'DENTOALVEOLAR_COMPENSATION'
  | 'SOFT_TISSUE_PROFILE'
  | 'NASOLABIAL_RELATION'
  | 'ESTHETIC_LINE'
  | 'HOLDAWAY_HARMONY'
  | 'MCNAMARA_MIDFACE'
  | 'MCNAMARA_MANDIBLE'
  | 'MCNAMARA_MAX_MAND_DIFF'
  | 'FACIAL_HEIGHT_LAFH'
  | 'PHARYNGEAL_AIRWAY'
  | 'CRANIAL_BASE_FLEXURE'
  | 'GENERAL_PARAMETER';

export interface DiagnosisCardData {
  diagnosticKey: CephDiagnosticKey;
  analysisName: string;
  parameterName: string;
  measuredValue: number | null;
  unit: string;
  referenceRange: string;
  status: ClinicalStatus;
  statusColor: 'green' | 'amber' | 'red' | 'gray';
  aiInterpretation: string;
  clinicalSignificance: string;
  category?: 'Skeletal' | 'Dental' | 'Soft Tissue' | 'Vertical' | 'Airway' | 'General';
}

export interface EvaluateParamOptions {
  parameterKey: string;
  parameterName: string;
  analysisName: string;
  value: number | string | '' | null | undefined;
  minNormal: number;
  maxNormal: number;
  unit?: string;
  gender?: Gender | string;
  age?: number | string;
  category?: 'Skeletal' | 'Dental' | 'Soft Tissue' | 'Vertical' | 'Airway' | 'General';
  diagnosticKey?: CephDiagnosticKey;
  includePending?: boolean;
}

/**
 * Sanitizes input numbers from arbitrary string inputs, nulls, undefined, and non-numeric chars.
 */
export function sanitizeNumericValue(val: number | string | '' | null | undefined): number | null {
  if (val === '' || val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const cleanStr = String(val).replace(/[^0-9.-]/g, '').trim();
  if (cleanStr === '' || cleanStr === '-' || cleanStr === '.') return null;
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Determine Clinical Status & Color Badge using strict statistical bounds
 */
export function determineClinicalStatus(
  val: number,
  minNorm: number,
  maxNorm: number,
  tolerance = 0.5
): { status: ClinicalStatus; statusColor: 'green' | 'amber' | 'red' } {
  if (val >= minNorm && val <= maxNorm) {
    return { status: 'Normal', statusColor: 'green' };
  }

  const isBelow = val < minNorm;
  const diff = isBelow ? minNorm - val : val - maxNorm;

  if (diff <= tolerance) {
    return { status: 'Borderline', statusColor: 'amber' };
  }

  return {
    status: isBelow ? 'Decreased' : 'Increased',
    statusColor: diff > tolerance * 3 ? 'red' : 'amber',
  };
}

/**
 * Map parameter names/keys to a deterministic CephDiagnosticKey
 */
export function resolveDiagnosticKey(key: string, name: string): CephDiagnosticKey {
  const k = key.toLowerCase();
  const n = name.toLowerCase();

  if (k.includes('anb') || n.includes('anb')) return 'SAGITTAL_SKELETAL';
  if (k.includes('sna') || n.includes('sna')) return 'MAXILLARY_POSITION';
  if (k.includes('snb') || n.includes('snb')) return 'MANDIBULAR_POSITION';
  if (k.includes('wits') || n.includes('wits')) return 'WITS_SAGITTAL';
  if (k.includes('convexity') || n.includes('convexity')) return 'FACIAL_CONVEXITY';
  if (k.includes('facialangle') || n.includes('facial angle')) return 'FACIAL_ANGLE';
  if (k.includes('abplane') || n.includes('a-b plane') || n.includes('ab plane')) return 'AB_PLANE_RELATION';

  if (k.includes('mandibularplane') || k.includes('fma') || k.includes('fmpa') || k.includes('gogn') || n.includes('mandibular plane') || n.includes('fma')) {
    return 'MANDIBULAR_PLANE';
  }
  if (k.includes('yaxis') || n.includes('y-axis') || n.includes('growth axis') || n.includes('facial axis')) {
    return 'FACIAL_AXIS_GROWTH';
  }
  if (k.includes('bjork') || n.includes('bjork')) return 'BJORK_POLYGON';
  if (k.includes('jarabak') || n.includes('jarabak')) return 'JARABAK_RATIO';
  if (k.includes('cant') || n.includes('cant') || k.includes('occlusalplane') || n.includes('occlusal plane')) {
    return 'OCCLUSAL_PLANE_CANT';
  }

  if (k.includes('impa') || n.includes('impa') || k.includes('li_mp') || k.includes('linb') || k.includes('li_nb') || n.includes('lower incisor to nb') || n.includes('fmia')) {
    return 'DENTAL_PROCLINATION_MANDIBULAR';
  }
  if (k.includes('uisn') || k.includes('ui_sn') || k.includes('uina') || k.includes('ui_na') || n.includes('upper incisor') || n.includes('1 to sn') || n.includes('1 to na')) {
    return 'DENTAL_PROCLINATION_MAXILLARY';
  }
  if (k.includes('interincisal') || n.includes('interincisal')) return 'INTERINCISAL_RELATION';
  if (k.includes('apog') || n.includes('a-po') || n.includes('a-pog')) return 'INCISOR_TO_APOG';

  if (k.includes('nasolabial') || n.includes('nasolabial')) return 'NASOLABIAL_RELATION';
  if (k.includes('eline') || n.includes('e-line') || n.includes('esthetic')) return 'ESTHETIC_LINE';
  if (k.includes('holdaway') || n.includes('holdaway') || k.includes('h_angle') || n.includes('h-angle')) return 'HOLDAWAY_HARMONY';

  if (k.includes('naperp') || n.includes('na perp') || n.includes('n-a (mm)')) return 'MCNAMARA_MIDFACE';
  if (k.includes('pognaperp') || n.includes('pog na perp') || n.includes('pog to na')) return 'MCNAMARA_MANDIBLE';
  if (k.includes('maxmand') || n.includes('maxillomandibular difference') || n.includes('unit diff')) return 'MCNAMARA_MAX_MAND_DIFF';
  if (k.includes('lafh') || k.includes('ans_me') || n.includes('lower anterior facial height')) return 'FACIAL_HEIGHT_LAFH';
  if (k.includes('airway') || n.includes('airway') || n.includes('pharyngeal')) return 'PHARYNGEAL_AIRWAY';
  if (k.includes('saddle') || n.includes('saddle') || k.includes('cranialbase') || n.includes('cranial base')) return 'CRANIAL_BASE_FLEXURE';

  return 'GENERAL_PARAMETER';
}

/**
 * Evaluates cephalometric parameters using strict statistical norms and deterministic interpretations.
 */
export function evaluateCephParameter(options: EvaluateParamOptions): DiagnosisCardData | null {
  const {
    parameterKey,
    parameterName,
    analysisName,
    value,
    minNormal,
    maxNormal,
    unit = '°',
    category = 'General',
    diagnosticKey: explicitDiagnosticKey,
    includePending = false,
    gender,
  } = options;

  const numVal = sanitizeNumericValue(value);

  const diagKey = explicitDiagnosticKey || resolveDiagnosticKey(parameterKey, parameterName);
  const refText = `${minNormal}${unit} to ${maxNormal}${unit}`;

  // Handle Missing / Pending Input Case
  if (numVal === null) {
    if (!includePending) return null;
    return {
      diagnosticKey: diagKey,
      analysisName,
      parameterName,
      measuredValue: null,
      unit,
      referenceRange: refText,
      status: 'PENDING_INPUT',
      statusColor: 'gray',
      aiInterpretation: `Awaiting input measurement for ${parameterName}. Normative standard is ${refText}.`,
      clinicalSignificance: 'Measurement required to compute structural cephalometric synthesis.',
      category,
    };
  }

  const { status, statusColor } = determineClinicalStatus(numVal, minNormal, maxNormal);

  const keyLower = parameterKey.toLowerCase();
  const nameLower = parameterName.toLowerCase();

  let aiInterpretation = '';
  let clinicalSignificance = '';

  // ------------------------------------------------------------
  // 1. SKELETAL SAGITTAL PARAMETERS (SNA, SNB, ANB, WITS, DOWNS)
  // ------------------------------------------------------------
  if (diagKey === 'MAXILLARY_POSITION' || keyLower.includes('sna') || nameLower.includes('sna')) {
    if (status === 'Normal') {
      aiInterpretation = 'The maxilla is in a normal anteroposterior sagittal position relative to the anterior cranial base (Sella-Nasion) (Norm: 82° ±2°).';
      clinicalSignificance = 'Supports a balanced midface profile and aids in establishing a favorable Skeletal Class I foundation.';
    } else if (status === 'Increased') {
      aiInterpretation = `Maxillary prognathism with anterior positioning of Point A relative to the cranial base (SNA: ${numVal}° > 84°).`;
      clinicalSignificance = 'Contributes to Skeletal Class II discrepancy and upper facial convexity; extraction or maxillary retraction may be indicated.';
    } else {
      aiInterpretation = `Maxillary retrognathism or skeletal midface deficiency (SNA: ${numVal}° < 80°).`;
      clinicalSignificance = 'Contributes to Skeletal Class III profile; protraction facemask or surgical maxillary advancement should be considered.';
    }
  } else if (diagKey === 'MANDIBULAR_POSITION' || keyLower.includes('snb') || nameLower.includes('snb')) {
    if (status === 'Normal') {
      aiInterpretation = 'The mandible exhibits normal anteroposterior positioning relative to the anterior cranial base (Norm: 80° ±2°).';
      clinicalSignificance = 'Provides a harmonious lower facial third and stable chin projection.';
    } else if (status === 'Increased') {
      aiInterpretation = `Mandibular prognathism with forward projection of Point B relative to Sella-Nasion (SNB: ${numVal}° > 82°).`;
      clinicalSignificance = 'Predisposes to Skeletal Class III relationship and anterior crossbite tendency; surgical or growth-redirection evaluation warranted.';
    } else {
      aiInterpretation = `Mandibular retrognathism with recessed chin positioning relative to cranial base (SNB: ${numVal}° < 78°).`;
      clinicalSignificance = 'Primary contributor to Skeletal Class II discrepancy; functional growth modification or mandibular advancement indicated.';
    }
  } else if (diagKey === 'SAGITTAL_SKELETAL' || keyLower.includes('anb') || nameLower.includes('anb')) {
    if (status === 'Normal') {
      aiInterpretation = `Harmonious Skeletal Class I jaw relationship with balanced anteroposterior basal alignment (ANB: ${numVal}°, Norm: 0°–4°).`;
      clinicalSignificance = 'Ideal skeletal framework supporting routine orthodontic alignment and favorable facial aesthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = `Skeletal Class II jaw relationship (ANB: ${numVal}° > 4°), secondary to maxillary prognathism, mandibular retrognathism, or a combination.`;
      clinicalSignificance = 'Evaluate growth potential for functional orthopedic appliance, orthodontic camouflage, or orthognathic surgery.';
    } else {
      aiInterpretation = `Skeletal Class III jaw relationship (ANB: ${numVal}° < 0°), indicating negative sagittal apical base discrepancy.`;
      clinicalSignificance = 'Early intervention with maxillary protraction or combined surgical-orthodontic planning recommended.';
    }
  } else if (diagKey === 'WITS_SAGITTAL' || keyLower.includes('wits') || nameLower.includes('wits')) {
    const isMale = String(gender).toLowerCase() === 'male';
    const normDesc = isMale ? '-1.0 mm ± 2.0 mm (-3.0 to +1.0 mm)' : '0.0 mm ± 2.0 mm (-2.0 to +2.0 mm)';
    if (status === 'Normal') {
      aiInterpretation = `Skeletal Class I apical base relationship on the occlusal plane (Wits: ${numVal} mm, Norm: ${normDesc}).`;
      clinicalSignificance = 'Confirms true sagittal jaw base harmony independent of cranial base flexure or Sella-Nasion variations.';
    } else if (status === 'Increased') {
      aiInterpretation = `Skeletal Class II apical base discrepancy with Point A projected anteriorly along the occlusal plane (Wits: ${numVal} mm).`;
      clinicalSignificance = 'Confirms true Class II skeletal disharmony requiring sagittal overjet reduction or functional orthopedics.';
    } else {
      aiInterpretation = `Skeletal Class III apical base discrepancy with Point B projected anteriorly relative to Point A (Wits: ${numVal} mm).`;
      clinicalSignificance = 'Confirms true Skeletal Class III base relationship; caution with camouflage mechanics due to anterior crossbite risk.';
    }
  } else if (diagKey === 'FACIAL_ANGLE' || keyLower.includes('facialangle') || nameLower.includes('facial angle')) {
    if (status === 'Normal') {
      aiInterpretation = 'Orthognathic mandible with favorable chin projection relative to Frankfurt Horizontal (Norm: 87.8° [84°–91.5°]).';
      clinicalSignificance = 'Ensures pleasing chin prominence and balanced lower facial profile.';
    } else if (status === 'Increased') {
      aiInterpretation = `Prognathic chin projection with prominent lower jaw orientation (Facial Angle: ${numVal}° > 91.5°).`;
      clinicalSignificance = 'Associated with Class III mandibular skeletal vector and prominent pogonion posture.';
    } else {
      aiInterpretation = `Retrognathic chin posture with recessed lower jaw profile (Facial Angle: ${numVal}° < 84.0°).`;
      clinicalSignificance = 'Primary contributor to facial profile convexity and Skeletal Class II malocclusion.';
    }
  } else if (diagKey === 'FACIAL_CONVEXITY' || keyLower.includes('angleconvexity') || nameLower.includes('angle of convexity')) {
    if (status === 'Normal') {
      aiInterpretation = 'Straight facial profile with ideal soft and skeletal tissue harmony (Angle of Convexity: 0° [-5° to +5°]).';
      clinicalSignificance = 'Provides optimal aesthetic profile balance and harmonious lip support.';
    } else if (status === 'Increased') {
      aiInterpretation = `Convex facial profile diagnostic of Skeletal Class II jaw discrepancy / maxillary prominence (${numVal}° > +5°).`;
      clinicalSignificance = 'High aesthetic impact; treatment planning should focus on reducing facial convexity and managing lip incompetence.';
    } else {
      aiInterpretation = `Concave facial profile diagnostic of Skeletal Class III relationship / mandibular prominence (${numVal}° < -5°).`;
      clinicalSignificance = 'Associated with midface deficiency or prominent chin posture; requires midface protraction or mandibular setback evaluation.';
    }
  } else if (diagKey === 'AB_PLANE_RELATION' || keyLower.includes('abplane') || nameLower.includes('a-b plane')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal sagittal alignment between maxillary and mandibular basal limits (Norm: -4.6° [-8.5° to 0°]).';
      clinicalSignificance = 'Favorable intermaxillary basal relationship for routine orthodontic alignment.';
    } else if (status === 'Increased') {
      aiInterpretation = `Class III skeletal discrepancy with Point B positioned forward relative to Point A (A-B Plane: ${numVal}° > 0°).`;
      clinicalSignificance = 'Alerts to Class III skeletal vector; monitor anterior crossbite and mandibular excess.';
    } else {
      aiInterpretation = `Class II skeletal discrepancy with Point B positioned posterior to Point A (A-B Plane: ${numVal}° < -8.5°).`;
      clinicalSignificance = 'Supports Class II sagittal mechanics, overjet reduction, or functional orthopedics.';
    }

  // ------------------------------------------------------------
  // 2. VERTICAL & GROWTH PATTERN PARAMETERS (FMA, SN-GOGN, Y-AXIS, BJORK, JARABAK)
  // ------------------------------------------------------------
  } else if (diagKey === 'MANDIBULAR_PLANE' || keyLower.includes('mandibularplane') || keyLower.includes('fma') || keyLower.includes('fmpa')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normodivergent growth pattern with balanced vertical facial proportions and average mandibular plane angle (Norm: 25° ±3° / 22°–28°).';
      clinicalSignificance = 'Ideal vertical skeletal framework; allows standard mechanics without excessive open-bite or deep-bite risk.';
    } else if (status === 'Increased') {
      aiInterpretation = `Hyperdivergent / High Angle vertical growth tendency with steep mandibular plane angle (${numVal}° > 28°).`;
      clinicalSignificance = 'Requires vertical anchorage control, avoidance of extrusive mechanics, and monitoring for anterior open bite.';
    } else {
      aiInterpretation = `Hypodivergent / Low Angle horizontal growth pattern with reduced lower facial height and flat mandibular plane (${numVal}° < 22°).`;
      clinicalSignificance = 'Associated with deep bite tendency, strong masseter musculature, and high anchorage potential.';
    }
  } else if (diagKey === 'FACIAL_AXIS_GROWTH' || keyLower.includes('yaxis') || nameLower.includes('y-axis') || nameLower.includes('growth axis')) {
    if (status === 'Normal') {
      aiInterpretation = 'Harmonious facial growth vector with proportional vertical and anteroposterior facial development (Norm: 59.4° [53°–66°]).';
      clinicalSignificance = 'Predictable facial growth direction supporting stable long-term treatment results.';
    } else if (status === 'Increased') {
      aiInterpretation = `Downward and backward mandibular growth vector indicating vertical divergence (Y-Axis: ${numVal}° > 66°).`;
      clinicalSignificance = 'Increases facial convexity and lower anterior face height; monitor for open bite development.';
    } else {
      aiInterpretation = `Forward and upward mandibular growth vector indicating horizontal growth tendency (Y-Axis: ${numVal}° < 53°).`;
      clinicalSignificance = 'Fosters chin prominence and deep bite development; beneficial for Class II growth modification.';
    }
  } else if (diagKey === 'BJORK_POLYGON' || keyLower.includes('bjork') || nameLower.includes('bjork')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal sum of posterior cranial base, articular, and gonial angles indicating balanced growth (Norm: 396° ±6°).';
      clinicalSignificance = 'Stable vertical facial growth with minimal vertical divergence risk.';
    } else if (status === 'Increased') {
      aiInterpretation = `Clockwise mandibular rotation pattern with hyperdivergent vertical skeletal tendency (Björk Sum: ${numVal}° > 402°).`;
      clinicalSignificance = 'Demands strict vertical control to prevent open bite and vertical face lengthening.';
    } else {
      aiInterpretation = `Counter-clockwise mandibular rotation pattern with hypodivergent skeletal tendency (Björk Sum: ${numVal}° < 390°).`;
      clinicalSignificance = 'Associated with low angle deep bite morphology and strong masseter muscle vector.';
    }
  } else if (diagKey === 'JARABAK_RATIO' || keyLower.includes('jarabak') || nameLower.includes('jarabak')) {
    if (status === 'Normal') {
      aiInterpretation = 'Balanced ratio of posterior facial height (S-Go) to anterior facial height (N-Me) (Norm: 62%–65%).';
      clinicalSignificance = 'Favorable vertical facial height ratio for stable facial esthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = `High Jarabak ratio indicating counter-clockwise mandibular growth tendency and deep bite pattern (${numVal}% > 65%).`;
      clinicalSignificance = 'Hypodivergent growth vector; excellent anchorage support for heavy leveling forces.';
    } else {
      aiInterpretation = `Low Jarabak ratio indicating clockwise mandibular growth vector and hyperdivergence (${numVal}% < 62%).`;
      clinicalSignificance = 'High vertical growth risk; high-pull traction or intrusive mechanics may be indicated.';
    }
  } else if (diagKey === 'OCCLUSAL_PLANE_CANT' || keyLower.includes('cant') || nameLower.includes('occlusal plane')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal occlusal plane inclination relative to reference cranial planes (Norm: 9.3° [1.5°–14°]).';
      clinicalSignificance = 'Allows uniform intercuspation and balanced functional masticatory movements.';
    } else if (status === 'Increased') {
      aiInterpretation = `Steep occlusal plane cant associated with vertical skeletal growth vector (${numVal}° > 14°).`;
      clinicalSignificance = 'Increases open bite tendency and Class II jaw vector during level alignment.';
    } else {
      aiInterpretation = `Flat occlusal plane cant associated with hypodivergent deep bite pattern (${numVal}° < 1.5°).`;
      clinicalSignificance = 'Supports deep bite mechanics and anterior leveling without vertical loss.';
    }

  // ------------------------------------------------------------
  // 3. DENTAL INCISOR & OCCLUSAL PARAMETERS (U1-NA, L1-NB, IMPA, INTERINCISAL)
  // ------------------------------------------------------------
  } else if (diagKey === 'DENTAL_PROCLINATION_MAXILLARY' || keyLower.includes('uina') || keyLower.includes('uisn') || nameLower.includes('upper incisor to na') || nameLower.includes('upper incisor to sn')) {
    const isAngle = unit.includes('°');
    if (status === 'Normal') {
      aiInterpretation = `Upper incisors are normally inclined and positioned relative to cranial/basal reference planes (Norm: ${refText}).`;
      clinicalSignificance = 'Provides harmonious upper lip support and proper anterior torque control.';
    } else if (status === 'Increased') {
      aiInterpretation = `Maxillary incisors are ${isAngle ? 'proclined' : 'protrusive'} relative to basal reference planes (${numVal}${unit} > ${maxNormal}${unit}).`;
      clinicalSignificance = 'Contributes to upper lip protrusion and overjet increase; extraction or torquing mechanics may be needed for retraction.';
    } else {
      aiInterpretation = `Maxillary incisors are ${isAngle ? 'retroclined' : 'retrusive'} relative to basal reference planes (${numVal}${unit} < ${minNormal}${unit}).`;
      clinicalSignificance = 'Restricts mandibular closure path and worsens deep bite; requires crown labial torquing to restore proper inclination.';
    }
  } else if (diagKey === 'DENTAL_PROCLINATION_MANDIBULAR' || keyLower.includes('impa') || keyLower.includes('linb') || nameLower.includes('impa') || nameLower.includes('lower incisor')) {
    const isImpa = keyLower.includes('impa') || nameLower.includes('impa');
    if (status === 'Normal') {
      aiInterpretation = isImpa
        ? `Lower incisors are well-positioned within the mandibular basal bone with ideal IMPA (Norm: 90° ±5° / 85°–95°).`
        : `Lower incisors are well-positioned relative to the NB line (Norm: ${refText}).`;
      clinicalSignificance = 'Supports periodontal health, optimal lower lip posture, and long-term post-treatment stability.';
    } else if (status === 'Increased') {
      aiInterpretation = isImpa
        ? `Lower incisors are proclined (IMPA: ${numVal}° > 95°), indicating labial tipping or dentoalveolar camouflage.`
        : `Lower incisors are proclined and protrusive relative to NB line (${numVal}${unit} > ${maxNormal}${unit}).`;
      clinicalSignificance = 'Limits further lower incisor advancement, increases risk of labial gingival recession, and impacts anchorage planning.';
    } else {
      aiInterpretation = isImpa
        ? `Lower incisors are retroclined (IMPA: ${numVal}° < 85°), commonly associated with deep bite or compensatory positioning.`
        : `Lower incisors are retroclined and retrusive relative to NB line (${numVal}${unit} < ${minNormal}${unit}).`;
      clinicalSignificance = 'Provides opportunity for lower incisor decompensation or proclination to resolve anterior crowding or improve overbite.';
    }
  } else if (diagKey === 'INTERINCISAL_RELATION' || keyLower.includes('interincisal') || nameLower.includes('interincisal angle')) {
    if (status === 'Normal') {
      aiInterpretation = `Normal interincisal angular relationship between upper and lower central incisors (Norm: ${refText}).`;
      clinicalSignificance = 'Ensures ideal anterior guidance, deep bite prevention, and overbite stability.';
    } else if (status === 'Decreased') {
      aiInterpretation = `Acute/reduced interincisal angle (${numVal}° < ${minNormal}°), indicating bimaxillary incisor proclination or labial tipping.`;
      clinicalSignificance = 'Associated with bimaxillary protrusion, lip strain, and potential instability if overbite guidance is inadequate.';
    } else {
      aiInterpretation = `Obtuse/increased interincisal angle (${numVal}° > ${maxNormal}°), associated with upright or retroclined incisors.`;
      clinicalSignificance = 'Predisposes to severe deep overbite and traumatic occlusion; requires root torque correction.';
    }
  } else if (diagKey === 'INCISOR_TO_APOG' || keyLower.includes('apog') || nameLower.includes('a-pog')) {
    if (status === 'Normal') {
      aiInterpretation = `Incisors sit in ideal AP position relative to the A-Pog reference line (Norm: ${refText}).`;
      clinicalSignificance = 'Key determinant of arch stability, facial esthetics, and overjet harmony.';
    } else if (status === 'Increased') {
      aiInterpretation = `Incisors protrude anterior to Ricketts A-Pog line (${numVal}${unit} > ${maxNormal}${unit}).`;
      clinicalSignificance = 'Indicates anterior dentoalveolar protrusion; space creation or retraction required for lip strain relief.';
    } else {
      aiInterpretation = `Incisors sit posterior to Ricketts A-Pog line (${numVal}${unit} < ${minNormal}${unit}).`;
      clinicalSignificance = 'Incisors are retroclined or recessed; proclination will enhance soft tissue profile support.';
    }

  // ------------------------------------------------------------
  // 4. SOFT TISSUE & PROFILE PARAMETERS (NASOLABIAL, E-LINE, HOLDAWAY)
  // ------------------------------------------------------------
  } else if (diagKey === 'NASOLABIAL_RELATION' || keyLower.includes('nasolabial') || nameLower.includes('nasolabial angle')) {
    if (status === 'Normal') {
      aiInterpretation = `Nasolabial angle is within ideal aesthetic norms (Norm: 102° ±8° / 94°–110°), indicating balanced upper lip posture.`;
      clinicalSignificance = 'Preserves natural subnasale aesthetics; avoid excessive incisor retraction that flattens upper lip.';
    } else if (status === 'Increased') {
      aiInterpretation = `Obtuse nasolabial angle (${numVal}° > 110°) with a flat or retracted upper lip posture.`;
      clinicalSignificance = 'Cautious upper incisor retraction required to prevent premature facial aging or sunken upper lip appearance.';
    } else {
      aiInterpretation = `Acute nasolabial angle (${numVal}° < 94°) with upper lip protrusion or dentoalveolar maxilla forwardness.`;
      clinicalSignificance = 'Favorable candidate for upper incisor retraction and premolar extraction to improve lip competence.';
    }
  } else if (diagKey === 'ESTHETIC_LINE' || keyLower.includes('eline') || nameLower.includes('e-line')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lips are positioned harmoniously relative to Ricketts Esthetic Line (E-Line).';
      clinicalSignificance = 'Optimal soft tissue profile balance and facial esthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = `Lips protrude anterior to the Esthetic E-Line (${numVal}${unit} > ${maxNormal}${unit}).`;
      clinicalSignificance = 'Indicates soft tissue lip strain and bimaxillary protrusion; retraction improves profile.';
    } else {
      aiInterpretation = `Lips sit posterior to the E-Line (concave soft tissue profile, ${numVal}${unit} < ${minNormal}${unit}).`;
      clinicalSignificance = 'Profile is flat or retrusive; avoid extractions that further collapse lip projection.';
    }
  } else if (diagKey === 'HOLDAWAY_HARMONY' || keyLower.includes('holdaway') || nameLower.includes('holdaway') || keyLower.includes('h_angle')) {
    if (status === 'Normal') {
      aiInterpretation = 'Soft tissue parameters conform to Holdaway soft tissue harmony standards.';
      clinicalSignificance = 'Favorable soft tissue thickness and lip sulcus depth for attractive profile balance.';
    } else if (status === 'Increased') {
      aiInterpretation = `Excessive soft tissue projection or lip strain above Holdaway norm (${numVal}${unit} > ${maxNormal}${unit}).`;
      clinicalSignificance = 'Relieve lip strain through arch retraction or dentoalveolar reduction.';
    } else {
      aiInterpretation = `Reduced soft tissue projection or deficient lip thickness (${numVal}${unit} < ${minNormal}${unit}).`;
      clinicalSignificance = 'Soft tissue support is thin; monitor incisor positions to preserve lip fullness.';
    }

  // ------------------------------------------------------------
  // 5. MCNAMARA & COGS EXTENDED SKELETAL PARAMETERS
  // ------------------------------------------------------------
  } else if (diagKey === 'MCNAMARA_MIDFACE' || keyLower.includes('naperp') || nameLower.includes('na perp') || nameLower.includes('n-a (mm)')) {
    if (status === 'Normal') {
      aiInterpretation = 'Point A lies on or near the Nasion Perpendicular line (Norm: 0 to 1 mm, ideal maxillary AP position).';
      clinicalSignificance = 'Normal midface projection in McNamara analysis.';
    } else if (status === 'Increased') {
      aiInterpretation = `Maxilla is positioned anteriorly relative to Nasion Perpendicular (${numVal} mm > 1 mm, maxillary protrusion).`;
      clinicalSignificance = 'Skeletal midface protrusion contributing to Class II profile.';
    } else {
      aiInterpretation = `Maxilla is retruded relative to Nasion Perpendicular (${numVal} mm < 0 mm, maxillary deficiency).`;
      clinicalSignificance = 'Midface deficiency; protraction orthopedics or LeFort I osteotomy may be indicated.';
    }
  } else if (diagKey === 'MCNAMARA_MANDIBLE' || keyLower.includes('pognaperp') || nameLower.includes('pog na perp') || nameLower.includes('pog to na')) {
    if (status === 'Normal') {
      aiInterpretation = 'Chin (Pogonion) is ideally positioned relative to Nasion Perpendicular line.';
      clinicalSignificance = 'Establishes proper lower facial third projection in McNamara analysis.';
    } else if (status === 'Increased') {
      aiInterpretation = `Chin is positioned anteriorly relative to Nasion Perpendicular (${numVal} mm, mandibular prognathism).`;
      clinicalSignificance = 'Mandibular excess contributing to Class III profile.';
    } else {
      aiInterpretation = `Chin is retrognathic relative to Nasion Perpendicular (${numVal} mm, mandibular retrognathism).`;
      clinicalSignificance = 'Mandibular deficiency; functional appliance or bilateral sagittal split osteotomy (BSSO) consideration.';
    }
  } else if (diagKey === 'FACIAL_HEIGHT_LAFH' || keyLower.includes('lafh') || keyLower.includes('ans_me') || nameLower.includes('lower anterior facial height')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lower anterior facial height (ANS-Me) is proportional to upper facial height.';
      clinicalSignificance = 'Maintains balanced vertical facial thirds.';
    } else if (status === 'Increased') {
      aiInterpretation = `Increased lower anterior facial height creating vertical facial excess (LAFH: ${numVal} mm).`;
      clinicalSignificance = 'Hyperdivergent vertical excess; high risk of anterior open bite and lip incompetence.';
    } else {
      aiInterpretation = `Short lower anterior facial height resulting in vertical facial deficiency (LAFH: ${numVal} mm).`;
      clinicalSignificance = 'Hypodivergent short-face syndrome; deep bite and overclosure tendency.';
    }
  } else if (diagKey === 'PHARYNGEAL_AIRWAY' || keyLower.includes('airway') || nameLower.includes('airway') || nameLower.includes('pharyngeal')) {
    if (status === 'Normal') {
      aiInterpretation = 'Pharyngeal airway passage dimension is clear and within normal cephalometric limits.';
      clinicalSignificance = 'Supports healthy nasal respiratory airflow and normal tongue posture.';
    } else if (status === 'Decreased') {
      aiInterpretation = `Constricted pharyngeal airway space detected on lateral cephalogram (${numVal} mm).`;
      clinicalSignificance = 'Alerts to potential mouth breathing, OSA risk, or adenoidal hypertrophy; ENT evaluation recommended.';
    } else {
      aiInterpretation = 'Widely patent pharyngeal airway space.';
      clinicalSignificance = 'Adequate respiratory passage with minimal airway resistance.';
    }

  // ------------------------------------------------------------
  // 6. GENERIC FALLBACK LOGIC
  // ------------------------------------------------------------
  } else {
    const isAngle = unit.includes('°');
    if (status === 'Normal') {
      aiInterpretation = `${parameterName} is within normal reference parameters (${refText}), indicating balanced structural alignment.`;
      clinicalSignificance = `Supports stable ${category.toLowerCase()} relationship and favorable clinical aesthetics.`;
    } else if (status === 'Increased') {
      aiInterpretation = `${parameterName} is elevated (${numVal}${unit} vs ref ${refText}), indicating an increased ${isAngle ? 'angular divergence or protrusion' : 'linear dimension or protrusion'}.`;
      clinicalSignificance = `May influence ${category.toLowerCase()} treatment planning, anchorage requirements, and aesthetic outcome goals.`;
    } else {
      aiInterpretation = `${parameterName} is reduced (${numVal}${unit} vs ref ${refText}), indicating a decreased ${isAngle ? 'angular inclination or deficiency' : 'linear dimension or deficiency'}.`;
      clinicalSignificance = `May require ${category.toLowerCase()} compensation, arch expansion, or torque adjustment to achieve ideal norms.`;
    }
  }

  return {
    diagnosticKey: diagKey,
    analysisName,
    parameterName,
    measuredValue: numVal,
    unit,
    referenceRange: refText,
    status,
    statusColor,
    aiInterpretation,
    clinicalSignificance,
    category,
  };
}

/**
 * Strict Deduplication Engine: Guarantees zero duplicate findings across all inferences.
 * Filters and maps by diagnosticKey, ensuring only one canonical inference per structural category.
 */
export function deduplicateInferences<T extends { diagnosticKey?: string; text?: string; id?: string }>(
  inferences: T[]
): T[] {
  if (!inferences || inferences.length === 0) return [];

  const seenKeys = new Set<string>();
  const seenTexts = new Set<string>();
  const result: T[] = [];

  for (const item of inferences) {
    const key = item.diagnosticKey ? item.diagnosticKey.trim() : null;
    const text = item.text ? item.text.trim().toLowerCase() : '';

    if (key) {
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
    } else if (text) {
      if (seenTexts.has(text)) continue;
      seenTexts.add(text);
    }

    result.push(item);
  }

  return result;
}
