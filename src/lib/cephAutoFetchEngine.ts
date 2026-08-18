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
    if (wits !== '') {
      result.witsAppraisal = { value: wits, source: "Steiner's" };
      result.witsAoBo = { value: wits, source: "Steiner's" };
    }

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
    if (angleConvexity !== '') {
      result.angleConvexity = { value: angleConvexity, source: 'Downs' };
      result.naPog = { value: angleConvexity, source: 'Downs' };
    }

    const abPlane = getStageVal(downsAnalysis, 'abPlane');
    if (abPlane !== '') {
      result.abPlane = { value: abPlane, source: 'Downs' };
      result.abNpog = { value: abPlane, source: 'Downs' };
    }

    const mpa = getStageVal(downsAnalysis, 'mandibularPlaneAngle') || getStageVal(downsAnalysis, 'fma');
    if (mpa !== '') {
      result.fma = { value: mpa, source: 'Downs' };
    }

    const yAxis = getStageVal(downsAnalysis, 'yAxis');
    if (yAxis !== '') {
      result.yaxis_ns_gn = { value: yAxis, source: 'Downs' };
    }

    const impa = getStageVal(downsAnalysis, 'impa');
    if (impa !== '' && !result.li_mp) {
      result.li_mp = { value: impa, source: 'Downs' };
    }

    const interincisal = getStageVal(downsAnalysis, 'interincisalAngle');
    if (interincisal !== '' && !result.interincisal_angle) {
      result.interincisal_angle = { value: interincisal, source: 'Downs' };
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

    const mandLen = getStageVal(schwarzTweedAnalysis, 'mandibularLength');
    if (mandLen !== '' && !result.mandCorpusSize) {
      result.mandCorpusSize = { value: mandLen, source: 'Schwarz-Tweed' };
    }

    const ramusLen = getStageVal(schwarzTweedAnalysis, 'ascendingRamusLength');
    if (ramusLen !== '' && !result.mandRamusHeight) {
      result.mandRamusHeight = { value: ramusLen, source: 'Schwarz-Tweed' };
    }

    const maxLen = getStageVal(schwarzTweedAnalysis, 'maxillaryLength');
    if (maxLen !== '' && !result.maxSizeAnsPns) {
      result.maxSizeAnsPns = { value: maxLen, source: 'Schwarz-Tweed' };
    }
  }

  // 4. McNamara Analysis Mappings
  if (mcnamaraAnalysis) {
    const maxUnit = getStageVal(mcnamaraAnalysis, 'maxillaryLengthCoPointA') || getStageVal(mcnamaraAnalysis, 'maxillaryUnitLength');
    if (maxUnit !== '') {
      result.maxillaryUnitLength = { value: maxUnit, source: 'McNamara' };
      result.maxEffectiveLength = { value: maxUnit, source: 'McNamara' };
    }

    const mandUnit = getStageVal(mcnamaraAnalysis, 'mandibularLengthCoGn') || getStageVal(mcnamaraAnalysis, 'mandibularUnitLength');
    if (mandUnit !== '') {
      result.mandibularUnitLength = { value: mandUnit, source: 'McNamara' };
      result.mandEffectiveLength = { value: mandUnit, source: 'McNamara' };
    }

    const diff = getStageVal(mcnamaraAnalysis, 'maxMandDifference') || getStageVal(mcnamaraAnalysis, 'maxMandDiff');
    if (diff !== '') {
      result.maxMandDiff = { value: diff, source: 'McNamara' };
      result.harvoldUnitDiff = { value: diff, source: 'McNamara' };
    }

    const aNPerp = getStageVal(mcnamaraAnalysis, 'naPerpToPointA');
    if (aNPerp !== '') result.aNPerp = { value: aNPerp, source: 'McNamara' };

    const pogNPerp = getStageVal(mcnamaraAnalysis, 'pogNaPerp');
    if (pogNPerp !== '') result.pogNPerp = { value: pogNPerp, source: 'McNamara' };

    if (maxUnit !== '' && mandUnit !== '' && Number(mandUnit) > 0) {
      const ratio = Number((Number(maxUnit) / Number(mandUnit)).toFixed(2));
      result.maxMandRatio = { value: ratio, source: 'McNamara' };
    }
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
      if (!result.basicUpperLip) {
        result.basicUpperLip = { value: lipThick, source: 'Holdaway' };
      }
    }

    const basicLip = getStageVal(holdawayAnalysis, 'basicUpperLipThickness');
    if (basicLip !== '') {
      result.basicUpperLip = { value: basicLip, source: 'Holdaway' };
      result.basic_u_lip_thickness = { value: basicLip, source: 'Holdaway' };
    }

    const softChin = getStageVal(holdawayAnalysis, 'softTissueChinThickness');
    if (softChin !== '') {
      result.softTissueChin = { value: softChin, source: 'Holdaway' };
    }

    const hLine = getStageVal(holdawayAnalysis, 'hLineAngle') || getStageVal(holdawayAnalysis, 'hAngle');
    if (hLine !== '') {
      result.hLineAngle = { value: hLine, source: 'Holdaway' };
      if (!result.softTissueProfileAngle) {
        result.softTissueProfileAngle = { value: 180 - Number(hLine), source: 'Holdaway H-Angle' };
      }
    }

    const softFacial = getStageVal(holdawayAnalysis, 'softTissueFacialAngle');
    if (softFacial !== '') {
      result.softTissueFacialAngle = { value: softFacial, source: 'Holdaway' };
    }
  }

  // 6. COGS Analysis Mappings
  if (cogsAnalysis) {
    const cogsWits = getStageVal(cogsAnalysis, 'wits');
    if (cogsWits !== '' && !result.witsAppraisal) {
      result.witsAppraisal = { value: cogsWits, source: 'COGS' };
      if (!result.witsAoBo) result.witsAoBo = { value: cogsWits, source: 'COGS' };
    }

    const ptmA = getStageVal(cogsAnalysis, 'maxillaryLengthPtmA');
    if (ptmA !== '' && !result.maxSizeAnsPns) {
      result.maxSizeAnsPns = { value: ptmA, source: 'COGS' };
    }

    const arPg = getStageVal(cogsAnalysis, 'totalMandibularLengthArPg');
    if (arPg !== '' && !result.mandEffectiveLength) {
      result.mandEffectiveLength = { value: arPg, source: 'COGS' };
    }

    const goPg = getStageVal(cogsAnalysis, 'corpusLengthGoPg');
    if (goPg !== '' && !result.mandCorpusSize) {
      result.mandCorpusSize = { value: goPg, source: 'COGS' };
    }

    const arGo = getStageVal(cogsAnalysis, 'ramusHeightArGo');
    if (arGo !== '' && !result.mandRamusHeight) {
      result.mandRamusHeight = { value: arGo, source: 'COGS' };
    }
  }

  // 7. COGS Soft Tissue Analysis Mappings
  if (cogsSoftTissueAnalysis) {
    const gSnPg = getStageVal(cogsSoftTissueAnalysis, 'gSnPg');
    if (gSnPg !== '' && !result.softTissueProfileAngle) {
      result.softTissueProfileAngle = { value: gSnPg, source: 'COGS' };
    }

    const merrifieldZ = getStageVal(cogsSoftTissueAnalysis, 'merrifieldZAngle');
    if (merrifieldZ !== '') {
      result.merrifieldZAngle = { value: merrifieldZ, source: 'COGS' };
    }

    const gPg = getStageVal(cogsSoftTissueAnalysis, 'gPg');
    if (gPg !== '' && !result.softTissueChin) {
      result.softTissueChin = { value: gPg, source: 'COGS' };
    }
  }

  return result;
}
