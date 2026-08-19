export interface BoltonResult {
  mand6: number;
  max6: number;
  mand12: number;
  max12: number;
  anteriorRatio: number | null;
  overallRatio: number | null;
  anteriorInference: string;
  anteriorBadgeColor: 'green' | 'amber' | 'red';
  overallInference: string;
  overallBadgeColor: 'green' | 'amber' | 'red';
}

export interface CareyResult {
  totalToothMaterial: number;
  discrepancy: number | null;
  inference: string;
  badgeColor: 'green' | 'amber' | 'red';
}

export interface PontsResult {
  sumOfIncisors: number;
  measuredPremolarWidth: number;
  measuredMolarWidth: number;
  calculatedMPV: number | null;
  calculatedMMV: number | null;
  premolarExpansionNeeded: number | null;
  molarExpansionNeeded: number | null;
  inference: string;
  badgeColor: 'green' | 'amber' | 'blue';
}

export interface AshleyHoweResult {
  pmbaRatio: number | null;
  inference: string;
  badgeColor: 'green' | 'amber' | 'red';
}

function getToothWidthMm(toothWidths: Record<string, number | ''>, tooth: string): number {
  const val = toothWidths[tooth];
  return typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0;
}

/** Maxillary 6 anterior teeth (FDI) — Bolton / Hawley Method B. */
export const MAXILLARY_ANTERIOR_6_FDI = ['13', '12', '11', '21', '22', '23'] as const;

/** Mandibular 6 anterior teeth (FDI) — Bolton / Hawley Method B. */
export const MANDIBULAR_ANTERIOR_6_FDI = ['43', '42', '41', '31', '32', '33'] as const;

export function getAnterior6FdiTeeth(archType: 'maxillary' | 'mandibular' | 'Maxillary' | 'Mandibular' | string): readonly string[] {
  const normalized = archType.toLowerCase() === 'maxillary' ? 'maxillary' : 'mandibular';
  return normalized === 'maxillary' ? MAXILLARY_ANTERIOR_6_FDI : MANDIBULAR_ANTERIOR_6_FDI;
}

export function sumAnterior6FromFdi(
  toothWidths: Record<string, number | ''>,
  archType: 'maxillary' | 'mandibular' | string
): number {
  const normalized = archType.toLowerCase() === 'maxillary' ? 'maxillary' : 'mandibular';
  return getAnterior6FdiTeeth(normalized).reduce(
    (sum, tooth) => sum + getToothWidthMm(toothWidths, tooth),
    0
  );
}

/** Maxillary 12 teeth (FDI) — Bolton Overall Ratio (16 to 26). */
export const BOLTON_MAXILLARY_12_FDI = [
  '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26',
] as const;

/** Mandibular 12 teeth (FDI) — Bolton Overall Ratio (36 to 46). */
export const BOLTON_MANDIBULAR_12_FDI = [
  '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36',
] as const;

export function calculateBolton(toothWidths: Record<string, number | ''>): BoltonResult {
  const getVal = (tooth: string): number => {
    const val = toothWidths[tooth];
    return typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0;
  };

  const mand6 = getVal('43') + getVal('42') + getVal('41') + getVal('31') + getVal('32') + getVal('33');
  const max6 = getVal('13') + getVal('12') + getVal('11') + getVal('21') + getVal('22') + getVal('23');

  const mand12 = mand6 + getVal('46') + getVal('45') + getVal('44') + getVal('34') + getVal('35') + getVal('36');
  const max12 = max6 + getVal('16') + getVal('15') + getVal('14') + getVal('24') + getVal('25') + getVal('26');

  // Input Validation: Bolton Anterior Ratio requires ALL 6 maxillary AND ALL 6 mandibular anterior teeth
  const hasAllMax6 = MAXILLARY_ANTERIOR_6_FDI.every((t) => getVal(t) > 0);
  const hasAllMand6 = MANDIBULAR_ANTERIOR_6_FDI.every((t) => getVal(t) > 0);

  let anteriorRatio: number | null = null;
  let anteriorInference = 'Enter all 6 maxillary (13-23) & 6 mandibular (33-43) anterior tooth widths';
  let anteriorBadgeColor: 'green' | 'amber' | 'red' = 'amber';

  if (hasAllMax6 && hasAllMand6 && max6 > 0) {
    anteriorRatio = (mand6 / max6) * 100;
    const diff = anteriorRatio - 77.2;
    if (Math.abs(diff) < 0.2) {
      anteriorInference = 'Normal Anterior Ratio (77.2%)';
      anteriorBadgeColor = 'green';
    } else if (anteriorRatio > 77.2) {
      const excess = mand6 - max6 * 0.772;
      anteriorInference = `Mandibular Anterior Tooth Material Excess of ${excess.toFixed(1)} mm`;
      anteriorBadgeColor = 'red';
    } else {
      const excess = max6 - mand6 / 0.772;
      anteriorInference = `Maxillary Anterior Tooth Material Excess of ${excess.toFixed(1)} mm`;
      anteriorBadgeColor = 'red';
    }
  }

  // Input Validation: Bolton Overall Ratio requires ALL 12 maxillary AND ALL 12 mandibular teeth
  const hasAllMax12 = BOLTON_MAXILLARY_12_FDI.every((t) => getVal(t) > 0);
  const hasAllMand12 = BOLTON_MANDIBULAR_12_FDI.every((t) => getVal(t) > 0);

  let overallRatio: number | null = null;
  let overallInference = 'Enter all 12 maxillary (16-26) & 12 mandibular (36-46) tooth widths';
  let overallBadgeColor: 'green' | 'amber' | 'red' = 'amber';

  if (hasAllMax12 && hasAllMand12 && max12 > 0) {
    overallRatio = (mand12 / max12) * 100;
    const diff = overallRatio - 91.3;
    if (Math.abs(diff) < 0.2) {
      overallInference = 'Normal Overall Ratio (91.3%)';
      overallBadgeColor = 'green';
    } else if (overallRatio > 91.3) {
      const excess = mand12 - max12 * 0.913;
      overallInference = `Mandibular Overall Tooth Material Excess of ${excess.toFixed(1)} mm`;
      overallBadgeColor = 'red';
    } else {
      const excess = max12 - mand12 / 0.913;
      overallInference = `Maxillary Overall Tooth Material Excess of ${excess.toFixed(1)} mm`;
      overallBadgeColor = 'red';
    }
  }

  return {
    mand6,
    max6,
    mand12,
    max12,
    anteriorRatio,
    overallRatio,
    anteriorInference,
    anteriorBadgeColor,
    overallInference,
    overallBadgeColor,
  };
}

/** Mandibular teeth summed for Carey's total tooth material (35 to 45). */
export const CAREY_MANDIBULAR_TEETH = [
  '45', '44', '43', '42', '41', '31', '32', '33', '34', '35',
] as const;

/** Maxillary teeth summed for Arch Perimeter / Nance's total tooth material (15 to 25). */
export const NANCE_MAXILLARY_TEETH = [
  '15', '14', '13', '12', '11', '21', '22', '23', '24', '25',
] as const;

export function sumCareyMandibularToothMaterial(toothWidths: Record<string, number | ''>): number {
  return CAREY_MANDIBULAR_TEETH.reduce((sum, tooth) => sum + getToothWidthMm(toothWidths, tooth), 0);
}

export function sumMaxillaryArchToothMaterial(toothWidths: Record<string, number | ''>): number {
  return NANCE_MAXILLARY_TEETH.reduce((sum, tooth) => sum + getToothWidthMm(toothWidths, tooth), 0);
}

/** Legacy alias for backward compatibility */
export const CAREY_MAXILLARY_TEETH = NANCE_MAXILLARY_TEETH;
export const sumCareyMaxillaryToothMaterial = sumMaxillaryArchToothMaterial;

/**
 * Carey's Model Analysis (Mandibular Arch Perimeter Analysis: 35 to 45 vs Available Arch Length)
 */
export function calculateCarey(
  toothWidths: Record<string, number | ''>,
  mandibularArchLengthAvailable: number | ''
): CareyResult {
  const totalToothMaterial = sumCareyMandibularToothMaterial(toothWidths);

  const hasArchLength =
    typeof mandibularArchLengthAvailable === 'number' &&
    !isNaN(mandibularArchLengthAvailable) &&
    mandibularArchLengthAvailable > 0;
  const hasAll10MandibularTeeth = CAREY_MANDIBULAR_TEETH.every((t) => getToothWidthMm(toothWidths, t) > 0);

  if (!hasArchLength || !hasAll10MandibularTeeth) {
    let inference = 'Enter Mandibular Arch Length Available and all 10 Tooth Widths (35 to 45)';
    if (!hasArchLength && hasAll10MandibularTeeth) {
      inference = 'Enter Mandibular Arch Length Available';
    } else if (hasArchLength && !hasAll10MandibularTeeth) {
      inference = 'Enter all 10 Mandibular Tooth Widths (35 to 45)';
    }

    return {
      totalToothMaterial,
      discrepancy: null,
      inference,
      badgeColor: 'amber',
    };
  }

  const discrepancy = mandibularArchLengthAvailable - totalToothMaterial;

  if (Math.abs(discrepancy) < 0.2) {
    return {
      totalToothMaterial,
      discrepancy,
      inference: 'Normal Arch Perimeter (Balanced Arch Length)',
      badgeColor: 'green',
    };
  } else if (discrepancy < 0) {
    const deficit = Math.abs(discrepancy);
    return {
      totalToothMaterial,
      discrepancy,
      inference: deficit > 5.0
        ? `Arch Length Deficiency of ${deficit.toFixed(1)} mm (> 5mm: Extraction typically indicated)`
        : deficit >= 2.5
        ? `Arch Length Deficiency of ${deficit.toFixed(1)} mm (2.5-5mm: Borderline / Expansion or Stripping)`
        : `Mild Arch Length Deficiency of ${deficit.toFixed(1)} mm (< 2.5mm: Non-Extraction / Proximal Stripping)`,
      badgeColor: deficit > 5.0 ? 'red' : 'amber',
    };
  } else {
    return {
      totalToothMaterial,
      discrepancy,
      inference: `Arch Length Excess of ${discrepancy.toFixed(1)} mm (Spacing Present)`,
      badgeColor: 'amber',
    };
  }
}

/** Maxillary premolars summed for Pont's 4-4 crown reference (14, 15, 24, 25). */
export const PONTS_PM_44_TEETH = ['14', '15', '24', '25'] as const;
export const PONTS_M_66_TEETH = ['16', '17', '26', '27'] as const;
export const PONTS_MAXILLARY_INCISORS = ['12', '11', '21', '22'] as const;

export function sumPontsPremolarWidth44(toothWidths: Record<string, number | ''>): number {
  return PONTS_PM_44_TEETH.reduce((sum, tooth) => sum + getToothWidthMm(toothWidths, tooth), 0);
}

export function sumPontsMolarWidth66(toothWidths: Record<string, number | ''>): number {
  return PONTS_M_66_TEETH.reduce((sum, tooth) => sum + getToothWidthMm(toothWidths, tooth), 0);
}

/**
 * Pont's Index Analysis:
 * - Sum of Incisors (SI) = 12 + 11 + 21 + 22 (All 4 maxillary incisors required)
 * - Expected Premolar Arch Width (MPV) = (SI / 80) * 100
 * - Expected Molar Arch Width (MMV) = (SI / 64) * 100
 * - Transverse Expansion Need = Expected Width - Measured Transverse Caliper Width
 */
export function calculatePonts(
  toothWidths: Record<string, number | ''>,
  customPremolarWidth?: number | '',
  customMolarWidth?: number | ''
): PontsResult {
  const sumOfIncisors =
    getToothWidthMm(toothWidths, '12') +
    getToothWidthMm(toothWidths, '11') +
    getToothWidthMm(toothWidths, '21') +
    getToothWidthMm(toothWidths, '22');

  const hasAll4Incisors = PONTS_MAXILLARY_INCISORS.every((t) => getToothWidthMm(toothWidths, t) > 0);

  const measuredPremolarWidth =
    typeof customPremolarWidth === 'number' && !isNaN(customPremolarWidth) && customPremolarWidth > 0
      ? customPremolarWidth
      : 0;

  const measuredMolarWidth =
    typeof customMolarWidth === 'number' && !isNaN(customMolarWidth) && customMolarWidth > 0
      ? customMolarWidth
      : 0;

  if (!hasAll4Incisors || sumOfIncisors === 0) {
    return {
      sumOfIncisors,
      measuredPremolarWidth,
      measuredMolarWidth,
      calculatedMPV: null,
      calculatedMMV: null,
      premolarExpansionNeeded: null,
      molarExpansionNeeded: null,
      inference: 'Enter widths of all 4 maxillary incisors (12, 11, 21, 22)',
      badgeColor: 'amber',
    };
  }

  const calculatedMPV = (sumOfIncisors / 80) * 100;
  const calculatedMMV = (sumOfIncisors / 64) * 100;

  let premolarExpansionNeeded: number | null = null;
  let molarExpansionNeeded: number | null = null;
  let inference = `Expected MPV: ${calculatedMPV.toFixed(1)} mm | Expected MMV: ${calculatedMMV.toFixed(1)} mm`;

  if (measuredPremolarWidth > 0) {
    premolarExpansionNeeded = calculatedMPV - measuredPremolarWidth;
  }
  if (measuredMolarWidth > 0) {
    molarExpansionNeeded = calculatedMMV - measuredMolarWidth;
  }

  if (measuredPremolarWidth > 0 || measuredMolarWidth > 0) {
    const pmText =
      measuredPremolarWidth > 0
        ? premolarExpansionNeeded! > 0.5
          ? `Premolar Exp: ${premolarExpansionNeeded!.toFixed(1)} mm expansion needed`
          : 'Premolar Arch Width: Adequate'
        : '';
    const mText =
      measuredMolarWidth > 0
        ? molarExpansionNeeded! > 0.5
          ? `Molar Exp: ${molarExpansionNeeded!.toFixed(1)} mm expansion needed`
          : 'Molar Arch Width: Adequate'
        : '';
    inference = [pmText, mText].filter(Boolean).join(' • ') || inference;
  } else {
    inference = `Expected MPV: ${calculatedMPV.toFixed(1)} mm (Premolar Arch Width) • Expected MMV: ${calculatedMMV.toFixed(1)} mm (Molar Arch Width). Enter measured arch widths to calculate expansion.`;
  }

  return {
    sumOfIncisors,
    measuredPremolarWidth,
    measuredMolarWidth,
    calculatedMPV,
    calculatedMMV,
    premolarExpansionNeeded,
    molarExpansionNeeded,
    inference,
    badgeColor: (premolarExpansionNeeded && premolarExpansionNeeded > 1.5) || (molarExpansionNeeded && molarExpansionNeeded > 1.5) ? 'amber' : 'green',
  };
}

export function calculateAshleyHowe(
  pmbaWidth: number | '',
  totalToothMaterial: number | ''
): AshleyHoweResult {
  if (
    typeof pmbaWidth !== 'number' ||
    isNaN(pmbaWidth) ||
    typeof totalToothMaterial !== 'number' ||
    isNaN(totalToothMaterial) ||
    totalToothMaterial === 0
  ) {
    return {
      pmbaRatio: null,
      inference: 'Enter Premolar Basal Arch Width (PMBAW) and Total Tooth Material (TTM)',
      badgeColor: 'amber',
    };
  }

  const pmbaRatio = (pmbaWidth / totalToothMaterial) * 100;

  if (pmbaRatio < 37) {
    return {
      pmbaRatio,
      inference: `PMBA W% = ${pmbaRatio.toFixed(1)}% (< 37%): Basal arch deficiency — Extraction indicated (Basal bone cannot accommodate tooth material)`,
      badgeColor: 'red',
    };
  } else if (pmbaRatio >= 37 && pmbaRatio <= 44) {
    return {
      pmbaRatio,
      inference: `PMBA W% = ${pmbaRatio.toFixed(1)}% (37%-44%): Borderline Case — Arch expansion or non-extraction possible with careful monitoring`,
      badgeColor: 'amber',
    };
  } else {
    return {
      pmbaRatio,
      inference: `PMBA W% = ${pmbaRatio.toFixed(1)}% (> 44%): Broad basal arch — Non-extraction treatment indicated`,
      badgeColor: 'green',
    };
  }
}
