import {
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyParametersMap,
} from '../types';

export interface AutoFetchSourceMap {
  value: number | '';
  source: string;
}

export type AutoFetchedDiscrepancyParams = Record<string, AutoFetchSourceMap>;

/**
 * Extracts and maps measured parameters from all primary cephalometric analyses
 * into CephDiscrepancy & Comprehensive Case Synthesis
 */
export function extractPrimaryCephValues(options: {
  downsAnalysis?: DownsAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
  stage?: 'pre' | 'mid' | 'post';
}): Record<string, AutoFetchSourceMap> {
  const {
    downsAnalysis,
    steinersAnalysis,
    rickettsAnalysis,
    mcnamaraAnalysis,
    schwarzTweedAnalysis,
    holdawayAnalysis,
    cogsAnalysis,
    cogsSoftTissueAnalysis,
    stage = 'pre',
  } = options;

  const result: Record<string, AutoFetchSourceMap> = {};

  const getStageVal = (obj: any, key: string): number | '' => {
    if (!obj || !obj[key]) return '';
    const val = obj[key]?.[stage] ?? obj[key];
    if (val === '' || val === undefined || val === null) return '';
    const num = Number(val);
    return isNaN(num) ? '' : num;
  };

  // 1. Steiner's Analysis Mappings
  if (steinersAnalysis) {
    const anb = getStageVal(steinersAnalysis, 'anb');
    if (anb !== '') result.anbAngle = { value: anb, source: "Steiner's" };

    const sna = getStageVal(steinersAnalysis, 'sna');
    if (sna !== '') result.snaAngle = { value: sna, source: "Steiner's" };

    const snb = getStageVal(steinersAnalysis, 'snb');
    if (snb !== '') result.snbAngle = { value: snb, source: "Steiner's" };

    const snGoGn = getStageVal(steinersAnalysis, 'snGoGn');
    if (snGoGn !== '') result.snGoGn = { value: snGoGn, source: "Steiner's" };

    const wits = getStageVal(steinersAnalysis, 'wits');
    if (wits !== '') result.witsAppraisal = { value: wits, source: "Steiner's" };

    const uiNaDeg = getStageVal(steinersAnalysis, 'upperIncisorToNaDeg');
    if (uiNaDeg !== '') {
      result.uiNaDeg = { value: uiNaDeg, source: "Steiner's" };
      result.ui_na_deg = { value: uiNaDeg, source: "Steiner's" };
    }

    const uiNaMm = getStageVal(steinersAnalysis, 'upperIncisorToNaMm');
    if (uiNaMm !== '') {
      result.uiNaMm = { value: uiNaMm, source: "Steiner's" };
      result.ui_na_mm = { value: uiNaMm, source: "Steiner's" };
    }

    const liNbDeg = getStageVal(steinersAnalysis, 'lowerIncisorToNbDeg');
    if (liNbDeg !== '') {
      result.liNbDeg = { value: liNbDeg, source: "Steiner's" };
      result.li_nb_deg = { value: liNbDeg, source: "Steiner's" };
    }

    const liNbMm = getStageVal(steinersAnalysis, 'lowerIncisorToNbMm');
    if (liNbMm !== '') {
      result.liNbMm = { value: liNbMm, source: "Steiner's" };
      result.li_nb_mm = { value: liNbMm, source: "Steiner's" };
    }
  }

  // 2. Downs Analysis Mappings
  if (downsAnalysis) {
    const facialAngle = getStageVal(downsAnalysis, 'facialAngle');
    if (facialAngle !== '') result.facialAngle = { value: facialAngle, source: 'Downs' };

    const angleConvexity = getStageVal(downsAnalysis, 'angleConvexity');
    if (angleConvexity !== '') result.angleConvexity = { value: angleConvexity, source: 'Downs' };

    const abPlane = getStageVal(downsAnalysis, 'abPlane');
    if (abPlane !== '') result.abPlane = { value: abPlane, source: 'Downs' };

    const fma = getStageVal(downsAnalysis, 'fma');
    if (fma !== '') {
      result.fma = { value: fma, source: 'Downs' };
    }

    const yAxis = getStageVal(downsAnalysis, 'yAxis');
    if (yAxis !== '') {
      result.yaxis_ns_gn = { value: yAxis, source: 'Downs' };
    }
  }

  // 3. Schwarz & Tweed Analysis Mappings
  if (schwarzTweedAnalysis) {
    const fma = getStageVal(schwarzTweedAnalysis, 'fma');
    if (fma !== '' && !result.fma) result.fma = { value: fma, source: 'Tweed' };

    const impa = getStageVal(schwarzTweedAnalysis, 'impa');
    if (impa !== '') {
      result.impa = { value: impa, source: 'Tweed' };
      result.li_mp = { value: impa, source: 'Tweed' };
    }

    const fmia = getStageVal(schwarzTweedAnalysis, 'fmia');
    if (fmia !== '') {
      result.fmia = { value: fmia, source: 'Tweed' };
      result.li_fh = { value: fmia, source: 'Tweed' };
    }
  }

  // 4. McNamara Analysis Mappings
  if (mcnamaraAnalysis) {
    const maxUnit = getStageVal(mcnamaraAnalysis, 'maxillaryUnitLength');
    if (maxUnit !== '') result.maxillaryUnitLength = { value: maxUnit, source: 'McNamara' };

    const mandUnit = getStageVal(mcnamaraAnalysis, 'mandibularUnitLength');
    if (mandUnit !== '') result.mandibularUnitLength = { value: mandUnit, source: 'McNamara' };

    const diff = getStageVal(mcnamaraAnalysis, 'maxMandDiff');
    if (diff !== '') result.maxMandDiff = { value: diff, source: 'McNamara' };
  }

  // 5. Holdaway Analysis Mappings
  if (holdawayAnalysis) {
    const nla = getStageVal(holdawayAnalysis, 'nasolabialAngle');
    if (nla !== '') {
      result.nasolabialAngle = { value: nla, source: 'Holdaway' };
      result.nasolabial_angle = { value: nla, source: 'Holdaway' };
    }

    const lipThick = getStageVal(holdawayAnalysis, 'upperLipThickness');
    if (lipThick !== '') {
      result.upperLipThickness = { value: lipThick, source: 'Holdaway' };
      result.u_lip_thickness = { value: lipThick, source: 'Holdaway' };
    }

    const hLine = getStageVal(holdawayAnalysis, 'hLineAngle');
    if (hLine !== '') result.hLineAngle = { value: hLine, source: 'Holdaway' };
  }

  // 6. COGS Analysis Mappings
  if (cogsAnalysis) {
    const cogsWits = getStageVal(cogsAnalysis, 'wits');
    if (cogsWits !== '' && !result.witsAppraisal) {
      result.witsAppraisal = { value: cogsWits, source: 'COGS' };
    }
  }

  return result;
}
