import { PatientRecord, CaseSectionStatus } from '../types';

export function calculateCompletionStatus(patient: Partial<PatientRecord>): CaseSectionStatus {
  const history = Boolean(
    patient.name &&
    patient.age &&
    patient.gender &&
    patient.patientId &&
    patient.contact
  );

  const extraoralProfile = Boolean(
    patient.extraoralProfile &&
    (patient.extraoralProfile.profile || patient.extraoralProfile.symmetry || patient.extraoralProfile.built)
  );

  const functionalTmj = Boolean(
    patient.functionalTmj &&
    (patient.functionalTmj.respiration || patient.functionalTmj.mastication || patient.functionalTmj.speech || patient.functionalTmj.clicking)
  );

  const intraoral = Boolean(
    patient.intraoralSection &&
    (patient.intraoralSection.incisorRelation || patient.intraoralSection.overjetMm !== '' || patient.intraoralSection.cariesTeeth)
  );

  const radiographyGrowth = Boolean(
    (patient.radiographyGrowth && (patient.radiographyGrowth.opgFindings || patient.radiographyGrowth.lateralCephFindings || patient.radiographyGrowth.cvmStage)) ||
    (patient.investigations && patient.investigations.images && patient.investigations.images.length >= 1)
  );

  const modelAnalysis = Boolean(
    patient.modelAnalysis &&
    (patient.modelAnalysis.maxillaryArchShape || (patient.modelAnalysis.toothWidths && Object.keys(patient.modelAnalysis.toothWidths).length > 0))
  );

  const cephalometricAnalysis = Boolean(
    (patient.radiographyGrowth?.downsAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.downsAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.steinersAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.steinersAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.rickettsAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.rickettsAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.mcnamaraAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.mcnamaraAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.schwarzTweedAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.schwarzTweedAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.holdawayAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.holdawayAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.cogsAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.cogsAnalysis.parameters).length > 0) ||
    (patient.radiographyGrowth?.cogsSoftTissueAnalysis?.parameters &&
      Object.keys(patient.radiographyGrowth.cogsSoftTissueAnalysis.parameters).length > 0)
  );

  // Equal weight distribution across 7 tabs (approx 14.3% each)
  let score = 0;
  if (history) score += 16;
  if (extraoralProfile) score += 14;
  if (functionalTmj) score += 14;
  if (intraoral) score += 14;
  if (radiographyGrowth) score += 14;
  if (modelAnalysis) score += 14;
  if (cephalometricAnalysis) score += 14;

  return {
    history,
    extraoralProfile,
    functionalTmj,
    intraoral,
    radiographyGrowth,
    modelAnalysis,
    cephalometricAnalysis,
    overallPercentage: Math.min(100, score),
  };
}
