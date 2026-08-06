import { Gender } from '../types';

export type ClinicalStatus = 'Normal' | 'Borderline' | 'Increased' | 'Decreased';

export interface DiagnosisCardData {
  analysisName: string;
  parameterName: string;
  measuredValue: number;
  unit: string;
  referenceRange: string;
  status: ClinicalStatus;
  statusColor: 'green' | 'amber' | 'red';
  aiInterpretation: string;
  clinicalSignificance: string;
  category?: 'Skeletal' | 'Dental' | 'Soft Tissue' | 'Vertical' | 'Airway' | 'General';
}

export interface EvaluateParamOptions {
  parameterKey: string;
  parameterName: string;
  analysisName: string;
  value: number | '' | null | undefined;
  minNormal: number;
  maxNormal: number;
  unit?: string;
  gender?: Gender | string;
  age?: number | string;
  category?: 'Skeletal' | 'Dental' | 'Soft Tissue' | 'Vertical' | 'Airway' | 'General';
}

/**
 * Determine Clinical Status & Color Badge
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
 * Comprehensive Specialist-Level Orthodontic Clinical Diagnosis Engine
 */
export function evaluateCephParameter(options: EvaluateParamOptions): DiagnosisCardData | null {
  const { parameterKey, parameterName, analysisName, value, minNormal, maxNormal, unit = '°', category = 'General' } = options;

  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numVal = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numVal)) return null;

  const { status, statusColor } = determineClinicalStatus(numVal, minNormal, maxNormal);

  const keyLower = parameterKey.toLowerCase();
  const nameLower = parameterName.toLowerCase();
  const refText = `${minNormal}${unit} to ${maxNormal}${unit}`;

  let aiInterpretation = '';
  let clinicalSignificance = '';

  // ------------------------------------------------------------
  // 1. SKELETAL SAGITTAL PARAMETERS
  // ------------------------------------------------------------
  if (keyLower.includes('sna') || nameLower.includes('sna')) {
    if (status === 'Normal') {
      aiInterpretation = 'The maxilla is in a normal anteroposterior sagittal position relative to the anterior cranial base (Sella-Nasion).';
      clinicalSignificance = 'Supports a balanced midface profile and aids in establishing a favorable Skeletal Class I foundation.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Maxillary prognathism with anterior positioning of Point A relative to the cranial base.';
      clinicalSignificance = 'Contributes to a Skeletal Class II discrepancy and upper facial convexity; may warrant extractions or maxillary retraction.';
    } else {
      aiInterpretation = 'Maxillary retrognathism or skeletal deficiency in the sagittal plane.';
      clinicalSignificance = 'May contribute to Skeletal Class III profile or midface deficiency; protraction facemask or surgical maxillary advancement may be considered.';
    }
  } else if (keyLower.includes('snb') || nameLower.includes('snb')) {
    if (status === 'Normal') {
      aiInterpretation = 'The mandible exhibits normal anteroposterior positioning relative to the cranial base.';
      clinicalSignificance = 'Provides a harmonious lower facial third and stable chin projection.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Mandibular prognathism with forward projection of Point B relative to Sella-Nasion.';
      clinicalSignificance = 'Predisposes to Skeletal Class III relationship and anterior crossbite tendency; surgical or chin cup evaluation may be needed.';
    } else {
      aiInterpretation = 'Mandibular retrognathism or posterior chin positioning relative to cranial base.';
      clinicalSignificance = 'Primary contributor to Skeletal Class II discrepancy; growth modification with functional appliances or mandibular advancement surgery may be required.';
    }
  } else if (keyLower.includes('anb') || nameLower.includes('anb')) {
    if (status === 'Normal') {
      aiInterpretation = 'Harmonious Skeletal Class I jaw relationship with balanced anteroposterior basal alignment.';
      clinicalSignificance = 'Ideal skeletal framework supporting simple dentoalveolar alignment and favorable facial aesthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Skeletal Class II jaw relationship, which may result from maxillary prognathism, mandibular retrognathism, or a combination of both.';
      clinicalSignificance = 'Evaluate growth potential and treatment options such as growth modification, camouflage, or orthognathic surgery depending on patient age and severity.';
    } else {
      aiInterpretation = 'Skeletal Class III relationship with possible maxillary deficiency and/or mandibular excess.';
      clinicalSignificance = 'Indicates negative or edge-to-edge sagittal jaw discrepancy; early intervention with protraction or orthognathic surgical planning recommended.';
    }
  } else if (keyLower.includes('wits') || nameLower.includes('wits')) {
    if (status === 'Normal') {
      aiInterpretation = 'Skeletal Class I jaw base relationship projected onto the occlusal plane (Ao-Bo alignment).';
      clinicalSignificance = 'Confirms true sagittal jaw base harmony independent of cranial base flexure or Sella-Nasion variations.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Severe Skeletal Class II discrepancy with Point A projected markedly anterior to Point B along the occlusal plane.';
      clinicalSignificance = 'Reflects severe sagittal skeletal disharmony requiring substantial overjet reduction, growth modification, or surgical correction.';
    } else {
      aiInterpretation = 'Skeletal Class III jaw base discrepancy with Point B projected anteriorly relative to Point A.';
      clinicalSignificance = 'Confirms skeletal Class III base relationship; caution with camouflage mechanics due to anterior crossbite risk.';
    }
  } else if (keyLower.includes('facialangle') || nameLower.includes('facial angle')) {
    if (status === 'Normal') {
      aiInterpretation = 'Orthognathic mandible with favorable chin projection relative to the Frankfurt Horizontal plane.';
      clinicalSignificance = 'Ensures pleasing chin prominence and balanced lower facial profile.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Prognathic chin projection with prominent lower jaw orientation.';
      clinicalSignificance = 'Associated with Class III mandibular skeletal vector and prominent pogonion posture.';
    } else {
      aiInterpretation = 'Retrognathic chin posture with recessed lower jaw profile.';
      clinicalSignificance = 'Accentuates facial convexity; chin augmentation or mandibular advancement may enhance chin definition.';
    }
  } else if (keyLower.includes('angleconvexity') || nameLower.includes('angle of convexity')) {
    if (status === 'Normal') {
      aiInterpretation = 'Straight facial profile with ideal soft and skeletal tissue harmony.';
      clinicalSignificance = 'Provides optimal aesthetic profile balance and harmonious lip support.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Convex facial profile associated with Skeletal Class II jaw discrepancy.';
      clinicalSignificance = 'High aesthetic impact; treatment planning should focus on reducing facial convexity and managing lip incompetency.';
    } else {
      aiInterpretation = 'Concave facial profile typical of Skeletal Class III relationship.';
      clinicalSignificance = 'Associated with midface deficiency or prominent chin posture; requires midface protraction or mandibular setback evaluation.';
    }
  } else if (keyLower.includes('abplane') || nameLower.includes('a-b plane')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal sagittal alignment between maxillary and mandibular basal limits.';
      clinicalSignificance = 'Favorable intermaxillary basal relationship for routine orthodontic alignment.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Class III skeletal tendency with Point B positioned forward relative to Point A.';
      clinicalSignificance = 'Alerts to Class III skeletal vector; monitor anterior crossbite risk.';
    } else {
      aiInterpretation = 'Class II skeletal tendency with Point A positioned anterior to Point B.';
      clinicalSignificance = 'Supports Class II sagittal mechanics and overjet reduction planning.';
    }

  // ------------------------------------------------------------
  // 2. VERTICAL & GROWTH PATTERN PARAMETERS
  // ------------------------------------------------------------
  } else if (keyLower.includes('mandibularplaneangle') || keyLower.includes('fma') || keyLower.includes('gogn') || nameLower.includes('mandibular plane')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normodivergent growth pattern with balanced vertical facial proportions and average mandibular plane angle.';
      clinicalSignificance = 'Ideal vertical skeletal framework; allows standard mechanics without high open-bite or deep-bite risk.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Vertical growth tendency (hyperdivergent) with increased lower anterior facial height and steep mandibular plane angle.';
      clinicalSignificance = 'Requires vertical anchorage control, avoidance of extrusive mechanics, and consideration of open bite tendency.';
    } else {
      aiInterpretation = 'Horizontal growth pattern (hypodivergent) with reduced lower facial height and low mandibular plane angle.';
      clinicalSignificance = 'Associated with deep bite tendency, strong masticatory musculature, and high anchorage potential.';
    }
  } else if (keyLower.includes('yaxis') || nameLower.includes('y-axis') || nameLower.includes('growth axis')) {
    if (status === 'Normal') {
      aiInterpretation = 'Harmonious growth vector with proportional vertical and anteroposterior facial development.';
      clinicalSignificance = 'Predictable facial growth direction supporting stable long-term treatment results.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Downward and backward mandibular growth vector (vertical growth tendency).';
      clinicalSignificance = 'Increases facial convexity and lower anterior face height; monitor for open bite development.';
    } else {
      aiInterpretation = 'Forward and upward mandibular growth vector (horizontal growth tendency).';
      clinicalSignificance = 'Fosters chin prominence and deep bite development; beneficial for Class II growth modification.';
    }
  } else if (keyLower.includes('bjork') || nameLower.includes('bjork')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal sum of posterior cranial base, articular, and gonial angles indicating balanced growth.';
      clinicalSignificance = 'Stable vertical facial growth with minimal vertical divergence risk.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Clockwise mandibular rotation pattern with hyperdivergent vertical skeletal tendency.';
      clinicalSignificance = 'Demands strict vertical control to prevent open bite and vertical face lengthening.';
    } else {
      aiInterpretation = 'Counter-clockwise mandibular rotation pattern with hypodivergent skeletal tendency.';
      clinicalSignificance = 'Associated with low angle deep bite morphology and strong masseter muscle vector.';
    }
  } else if (keyLower.includes('jarabak') || nameLower.includes('jarabak')) {
    if (status === 'Normal') {
      aiInterpretation = 'Balanced ratio of posterior facial height (S-Go) to anterior facial height (N-Me).';
      clinicalSignificance = 'Favorable vertical facial height ratio for stable facial esthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = 'High Jarabak ratio indicating counter-clockwise mandibular growth tendency.';
      clinicalSignificance = 'Hypodivergent growth vector; excellent anchorage support for heavy leveling forces.';
    } else {
      aiInterpretation = 'Low Jarabak ratio indicating clockwise mandibular growth vector and hyperdivergence.';
      clinicalSignificance = 'High vertical growth risk; extra-oral high-pull traction or intrusive mechanics may be indicated.';
    }

  // ------------------------------------------------------------
  // 3. DENTAL INCISOR & OCCLUSAL PARAMETERS
  // ------------------------------------------------------------
  } else if (keyLower.includes('uisn') || nameLower.includes('upper incisor to sn') || nameLower.includes('1 to sn')) {
    if (status === 'Normal') {
      aiInterpretation = 'Upper incisors are normally inclined relative to the anterior cranial base plane.';
      clinicalSignificance = 'Provides harmonious upper lip support and proper anterior torque control.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Maxillary incisors are proclined relative to the cranial base.';
      clinicalSignificance = 'Contributes to upper lip protrusion and overjet increase; extraction or torquing mechanics may be needed for retraction.';
    } else {
      aiInterpretation = 'Maxillary incisors are retroclined relative to the cranial base.';
      clinicalSignificance = 'Restricts mandibular closure path and worsens deep bite; requires crown labial torquing to restore proper inclination.';
    }
  } else if (keyLower.includes('uina') || keyLower.includes('ui_na') || nameLower.includes('upper incisor to na')) {
    if (status === 'Normal') {
      aiInterpretation = 'Maxillary incisors are in a normal position and angle relative to the Nasion-Point A line.';
      clinicalSignificance = 'Favorable upper dentoalveolar position supporting proper overjet and lip posture.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Upper incisors are protrusive and proclined relative to the NA reference line.';
      clinicalSignificance = 'May cause lip incompetence and increased overjet; retraction or space creation required.';
    } else {
      aiInterpretation = 'Upper incisors are retrusive and retroclined relative to the NA line.';
      clinicalSignificance = 'Reduced overjet or Class II div 2 appearance; requires labial arch expansion or torque correction.';
    }
  } else if (keyLower.includes('impa') || nameLower.includes('impa') || keyLower.includes('li_mp')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lower incisors are well-positioned within the mandibular basal bone with ideal IMPA.';
      clinicalSignificance = 'Supports periodontal health, optimal lower lip posture, and long-term post-treatment stability.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Lower incisors are proclined, suggesting dentoalveolar compensation or orthodontic camouflage.';
      clinicalSignificance = 'Limits further lower incisor advancement, increases risk of labial gingival recession, and impacts anchorage planning.';
    } else {
      aiInterpretation = 'Lower incisors are retroclined, commonly associated with deep bite or compensatory tooth positioning.';
      clinicalSignificance = 'Provides opportunity for lower incisor decompensation or proclination to resolve anterior crowding or improve overbite.';
    }
  } else if (keyLower.includes('linb') || keyLower.includes('li_nb') || nameLower.includes('lower incisor to nb')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lower incisors are well-positioned relative to the Nasion-Point B line.';
      clinicalSignificance = 'Optimal lower dentoalveolar position for overjet control and lower lip balance.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Lower incisors are proclined and protrusive relative to the NB line.';
      clinicalSignificance = 'Reflects lower arch protrusion or dentoalveolar compensation; monitor periodontal support.';
    } else {
      aiInterpretation = 'Lower incisors are retroclined relative to the NB line.';
      clinicalSignificance = 'Compensatory labial uprighting; decompensation required if surgical intervention is planned.';
    }
  } else if (keyLower.includes('uiapog') || keyLower.includes('ui_apog') || nameLower.includes('upper incisor to a-po') || nameLower.includes('upper incisor to a-pog')) {
    if (status === 'Normal') {
      aiInterpretation = 'The maxillary incisors are positioned normally relative to the basal bone with no clinically significant protrusion or retrusion.';
      clinicalSignificance = 'This indicates favorable anterior tooth positioning and supports good facial esthetics and overjet control.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Maxillary incisors are protrusive relative to the basal bone (A-Pog line).';
      clinicalSignificance = 'May require space creation via extraction or interproximal reduction (IPR) to achieve lip competence and profile balance.';
    } else {
      aiInterpretation = 'Maxillary incisors are retrusive relative to the basal bone (A-Pog line).';
      clinicalSignificance = 'May allow anterior expansion or proclination to support upper lip posture and optimize overjet.';
    }
  } else if (keyLower.includes('liapog') || keyLower.includes('li_apog') || nameLower.includes('lower incisor to a-po') || nameLower.includes('lower incisor to a-pog')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lower incisors sit in ideal AP position relative to the dentognathic A-Pog line (Ricketts line).';
      clinicalSignificance = 'Key determinant of lower arch stability, facial esthetics, and overjet harmony.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Lower incisor apex/edge protrudes anterior to Ricketts A-Pog line.';
      clinicalSignificance = 'Indicates lower dentoalveolar protrusion; space creation or retraction required for lip strain relief.';
    } else {
      aiInterpretation = 'Lower incisors sit posterior to Ricketts A-Pog line.';
      clinicalSignificance = 'Lower incisors are retroclined or recessed; proclination to A-Pog line will enhance lower lip posture.';
    }
  } else if (keyLower.includes('interincisal') || nameLower.includes('interincisal angle')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal interincisal angular relationship between upper and lower central incisors.';
      clinicalSignificance = 'Ensures ideal anterior guidance, deep bite prevention, and overbite stability.';
    } else if (status === 'Decreased') {
      aiInterpretation = 'Reduced interincisal angle indicating bimaxillary incisor proclination or labial tipping.';
      clinicalSignificance = 'Associated with bimaxillary protrusion, lip strain, and potential instability if overbite guidance is inadequate.';
    } else {
      aiInterpretation = 'Increased interincisal angle associated with upright or retroclined incisors (Class II div 2 tendency).';
      clinicalSignificance = 'Predisposes to severe deep overbite and traumatic occlusion; requires root torque correction.';
    }
  } else if (keyLower.includes('cant') || nameLower.includes('cant of occlusion') || nameLower.includes('occlusal plane')) {
    if (status === 'Normal') {
      aiInterpretation = 'Normal occlusal plane inclination relative to reference cranial planes.';
      clinicalSignificance = 'Allows uniform intercuspation and balanced functional masticatory movements.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Steep occlusal plane cant associated with vertical skeletal growth vector.';
      clinicalSignificance = 'Increases open bite tendency and Class II jaw vector during level alignment.';
    } else {
      aiInterpretation = 'Flat occlusal plane cant associated with hypodivergent deep bite pattern.';
      clinicalSignificance = 'Supports deep bite mechanics and anterior leveling without vertical loss.';
    }

  // ------------------------------------------------------------
  // 4. SOFT TISSUE PARAMETERS
  // ------------------------------------------------------------
  } else if (keyLower.includes('nasolabial') || nameLower.includes('nasolabial angle')) {
    if (status === 'Normal') {
      aiInterpretation = 'Nasolabial angle is within ideal aesthetic norms, indicating balanced upper lip posture.';
      clinicalSignificance = 'Preserves natural subnasale aesthetics; avoid excessive incisor retraction that flattens upper lip.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Obtuse nasolabial angle with a flat or retracted upper lip posture.';
      clinicalSignificance = 'Cautious upper incisor retraction required to prevent premature facial aging or sunken upper lip appearance.';
    } else {
      aiInterpretation = 'Acute nasolabial angle with upper lip protrusion or dentoalveolar maxilla forwardness.';
      clinicalSignificance = 'Favorable candidate for upper incisor retraction and premolar extraction to improve lip competence.';
    }
  } else if (keyLower.includes('eline') || nameLower.includes('e-line') || nameLower.includes('esthet')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lips are positioned harmoniously relative to Ricketts Esthetic Line (E-Line).';
      clinicalSignificance = 'Optimal soft tissue profile balance and facial esthetics.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Lips protrude anterior to the Esthetic E-Line.';
      clinicalSignificance = 'Indicates soft tissue lip strain and bimaxillary protrusion; retraction improves profile.';
    } else {
      aiInterpretation = 'Lips sit posterior to the E-Line (concave soft tissue profile).';
      clinicalSignificance = 'Profile is flat or retrusive; avoid extractions that further collapse lip projection.';
    }
  } else if (keyLower.includes('holdaway') || nameLower.includes('h-line') || nameLower.includes('holdaway')) {
    if (status === 'Normal') {
      aiInterpretation = 'Soft tissue parameters conform to Holdaway soft tissue harmony standards.';
      clinicalSignificance = 'Favorable soft tissue thickness and lip sulcus depth for attractive profile balance.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Excessive soft tissue projection or upper lip strain above Holdaway norm.';
      clinicalSignificance = 'Relieve lip strain through arch retraction or dentoalveolar reduction.';
    } else {
      aiInterpretation = 'Reduced soft tissue projection or deficient lip thickness.';
      clinicalSignificance = 'Soft tissue support is thin; monitor incisor positions to preserve lip fullness.';
    }

  // ------------------------------------------------------------
  // 5. MCNAMARA & COGS EXTENDED PARAMETERS
  // ------------------------------------------------------------
  } else if (keyLower.includes('naperp') || nameLower.includes('na perp') || nameLower.includes('n-a (mm)')) {
    if (status === 'Normal') {
      aiInterpretation = 'Point A lies on or near the Nasion Perpendicular line (ideal maxillary AP position).';
      clinicalSignificance = 'Normal midface projection in McNamara analysis.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Maxilla is positioned anteriorly relative to Nasion Perpendicular (maxillary protrusion).';
      clinicalSignificance = 'Skeletal midface protrusion contributing to Class II profile.';
    } else {
      aiInterpretation = 'Maxilla is retruded relative to Nasion Perpendicular (maxillary deficiency).';
      clinicalSignificance = 'Midface deficiency; protraction orthopedics or LeFort I osteotomy may be indicated.';
    }
  } else if (keyLower.includes('pognaperp') || nameLower.includes('pog na perp') || nameLower.includes('pog to na')) {
    if (status === 'Normal') {
      aiInterpretation = 'Chin (Pogonion) is ideally positioned relative to Nasion Perpendicular line.';
      clinicalSignificance = 'Establishes proper lower facial third projection in McNamara analysis.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Chin is positioned anteriorly relative to Nasion Perpendicular (mandibular prognathism).';
      clinicalSignificance = 'Mandibular excess contributing to Class III profile.';
    } else {
      aiInterpretation = 'Chin is retrognathic relative to Nasion Perpendicular (mandibular retrognathism).';
      clinicalSignificance = 'Mandibular deficiency; functional appliance or bilateral sagittal split osteotomy (BSSO) consideration.';
    }
  } else if (keyLower.includes('co_a') || keyLower.includes('effmaxillary') || nameLower.includes('effective maxillary length')) {
    if (status === 'Normal') {
      aiInterpretation = 'Effective maxillary length (Condylion to Point A) is within normal limits for patient age/gender.';
      clinicalSignificance = 'Ideal anatomical maxillary unit size.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Increased effective maxillary length indicating enlarged maxilla size.';
      clinicalSignificance = 'Structural maxillary excess contributing to Class II skeletal pattern.';
    } else {
      aiInterpretation = 'Reduced effective maxillary length indicating hypoplastic maxilla.';
      clinicalSignificance = 'Structural maxillary hypoplasia; common in Class III skeletal patterns.';
    }
  } else if (keyLower.includes('co_gn') || keyLower.includes('effmandibular') || nameLower.includes('effective mandibular length')) {
    if (status === 'Normal') {
      aiInterpretation = 'Effective mandibular length (Condylion to Gnathion) matches anatomical reference norms.';
      clinicalSignificance = 'Optimal mandibular size for facial harmony.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Increased effective mandibular length (macromandible).';
      clinicalSignificance = 'True structural mandibular excess; monitor Class III growth potential.';
    } else {
      aiInterpretation = 'Decreased effective mandibular length (micromandible).';
      clinicalSignificance = 'Structural mandibular hypoplasia; primary cause of Class II division 1 skeletal retrognathism.';
    }
  } else if (keyLower.includes('lafh') || keyLower.includes('ans_me') || nameLower.includes('lower anterior facial height')) {
    if (status === 'Normal') {
      aiInterpretation = 'Lower anterior facial height (ANS-Me) is proportional to upper facial height.';
      clinicalSignificance = 'Maintains balanced vertical facial thirds.';
    } else if (status === 'Increased') {
      aiInterpretation = 'Increased lower anterior facial height creating vertical facial excess.';
      clinicalSignificance = 'Hyperdivergent vertical excess; high risk of anterior open bite and lip incompetence.';
    } else {
      aiInterpretation = 'Short lower anterior facial height resulting in vertical facial deficiency.';
      clinicalSignificance = 'Hypodivergent short-face syndrome; deep bite and overclosure tendency.';
    }
  } else if (keyLower.includes('airway') || nameLower.includes('airway') || nameLower.includes('pharyngeal')) {
    if (status === 'Normal') {
      aiInterpretation = 'Pharyngeal airway passage dimension is clear and within normal cephalometric limits.';
      clinicalSignificance = 'Supports healthy nasal respiratory airflow and normal tongue posture.';
    } else if (status === 'Decreased') {
      aiInterpretation = 'Constricted pharyngeal airway space detected on lateral cephalogram.';
      clinicalSignificance = 'Alerts to potential mouth breathing, obstructive sleep apnea (OSA) risk, or adenoidal hypertrophy; ENT consultation recommended.';
    } else {
      aiInterpretation = 'Widely patent pharyngeal airway space.';
      clinicalSignificance = 'Adequate respiratory passage with minimal airway resistance.';
    }

  // ------------------------------------------------------------
  // 6. GENERIC / DYNAMIC FALLBACK LOGIC FOR ANY FUTURE PARAMETER
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
