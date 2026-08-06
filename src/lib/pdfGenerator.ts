import { jsPDF } from 'jspdf';
import { PatientRecord, StudentProfile } from '../types';

export function generatePatientPDF(patient: PatientRecord, profile: StudentProfile): void {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('ORTHODONTIC CASE HISTORY REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${profile.institution} - ${profile.department}`, margin, 18);
  doc.text(`Student: ${profile.studentName} (${profile.rollNumber}) | Year: ${profile.academicYear}`, margin, 23);

  y = 35;

  // Section Header Function
  const addSectionHeader = (title: string) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(13, 148, 136); // teal-600
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 3, y + 4.5);
    y += 10;
    doc.setTextColor(30, 41, 59);
  };

  // 1. Patient Information
  addSectionHeader('1. Patient Demographics');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const col1 = margin + 2;
  const col2 = margin + 95;

  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.name}`, col1 + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Patient ID:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.patientId}`, col2 + 20, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Age / Gender:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.age} Yrs / ${patient.gender}`, col1 + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Exam Date:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.examDate}`, col2 + 20, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${patient.contact || 'N/A'} ${patient.email ? '(' + patient.email + ')' : ''}`, col1 + 25, y);
  y += 8;

  // 2. Chief Complaint & Duration
  addSectionHeader('2. Chief Complaint & History');
  doc.setFont('helvetica', 'bold');
  doc.text('Chief Complaints:', col1, y);
  doc.setFont('helvetica', 'normal');

  const complaints = [];
  const cc = patient.chiefComplaint || {} as any;
  if (cc.irregularTeeth) complaints.push('Irregular teeth');
  if (cc.protrudingTeeth) complaints.push('Protruding teeth');
  if (cc.spacing) complaints.push('Spacing');
  if (cc.missingTeeth) complaints.push('Missing teeth');
  if (cc.jawProblem) complaints.push('Jaw problem');
  if (cc.facialAesthetics) complaints.push('Facial aesthetics concern');
  if (cc.otherText) complaints.push(cc.otherText);

  doc.text(complaints.length > 0 ? complaints.join(', ') : 'None specified', col1 + 30, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Duration:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(cc.duration || 'N/A', col1 + 30, y);
  y += 5;

  if (cc.additionalNotes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', col1, y);
    doc.setFont('helvetica', 'normal');
    const notesText = doc.splitTextToSize(cc.additionalNotes, pageWidth - margin * 2 - 30);
    doc.text(notesText, col1 + 30, y);
    y += notesText.length * 4.5;
  }
  y += 3;

  // Medical, Dental, Habit
  doc.setFont('helvetica', 'bold');
  doc.text('Medical History:', col1, y);
  doc.setFont('helvetica', 'normal');
  const med = patient.medicalHistory || {} as any;
  const medList = [];
  if (med.noSignificantHistory) medList.push('No significant history');
  if (med.diabetes) medList.push('Diabetes');
  if (med.hypertension) medList.push('Hypertension');
  if (med.asthma) medList.push('Asthma');
  if (med.allergy) medList.push('Allergy');
  if (med.bleedingDisorder) medList.push('Bleeding Disorder');
  if (med.otherMedical) medList.push('Other medical condition');
  doc.text(medList.join(', ') || 'None', col1 + 30, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Dental History:', col1, y);
  doc.setFont('helvetica', 'normal');
  const dent = patient.dentalHistory || {} as any;
  const dentList = [];
  if (dent.previousExtraction) dentList.push('Previous Extraction');
  if (dent.previousOrtho) dentList.push('Previous Ortho Treatment');
  if (dent.trauma) dentList.push('Dental Trauma');
  if (dent.restoration) dentList.push('Restorations');
  doc.text(dentList.join(', ') || 'No previous significant dental history', col1 + 30, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Habit History:', col1, y);
  doc.setFont('helvetica', 'normal');
  const hab = patient.habitHistory || {} as any;
  const habList = [];
  if (hab.none) habList.push('No habits reported');
  if (hab.thumbSucking) habList.push('Thumb sucking');
  if (hab.mouthBreathing) habList.push('Mouth breathing');
  if (hab.tongueThrusting) habList.push('Tongue thrusting');
  if (hab.lipHabit) habList.push('Lip biting/sucking');
  if (hab.bruxism) habList.push('Bruxism');
  doc.text(habList.join(', ') || 'None', col1 + 30, y);
  y += 8;

  // 3. Clinical Examination
  addSectionHeader('3. Clinical Examination Findings');

  const ex = patient.extraoralExam || patient.extraoralProfile || {} as any;
  doc.setFont('helvetica', 'bold');
  doc.text('Extraoral:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Symmetry: ${ex.symmetry || 'Symmetrical'} | Profile: ${ex.profile || 'Convex'} | Facial Type: ${ex.facialType || ex.facialForm || 'Mesofacial'} | Lip: ${ex.lipCompetency || ex.lipPostureTonicity || 'Competent'}`,
    col1 + 22,
    y
  );
  y += 5;

  // Extraoral Photo Analyzer Summary Block
  const photos = patient.extraoralPhotos || {};
  const photoAnalysis = patient.extraoralPhotoAnalysis || {};
  const uploadedList = [];
  if (photos.frontal_rest) uploadedList.push('Frontal Rest');
  if (photos.frontal_smile) uploadedList.push('Frontal Smile');
  if (photos.profile) uploadedList.push('Profile');
  if (photos.oblique) uploadedList.push('Oblique');
  if (photos.vto) uploadedList.push('VTO');

  if (uploadedList.length > 0 || photoAnalysis.thirdsInterpretation || photoAnalysis.vtoComparison) {
    doc.setFont('helvetica', 'bold');
    doc.text('Extraoral Photos:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(uploadedList.length > 0 ? uploadedList.join(', ') : 'None uploaded', col1 + 32, y);
    y += 5;

    if (photoAnalysis.guides) {
      const g = photoAnalysis.guides;
      const totalSpan = Math.max(0.01, g.mentonY - g.trichionY);
      const upperPct = Math.round(((g.glabellaY - g.trichionY) / totalSpan) * 100);
      const middlePct = Math.round(((g.subnasaleY - g.glabellaY) / totalSpan) * 100);
      const lowerPct = Math.round(((g.mentonY - g.subnasaleY) / totalSpan) * 100);

      doc.setFont('helvetica', 'bold');
      doc.text('Facial Thirds:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Upper: ${upperPct}% | Middle: ${middlePct}% | Lower: ${lowerPct}% (${photoAnalysis.thirdsInterpretation || 'Calibrated'})`, col1 + 25, y);
      y += 5;
    }

    if (photoAnalysis.vtoComparison?.overallImprovement) {
      doc.setFont('helvetica', 'bold');
      doc.text('VTO Compare:', col1, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Improvement: ${photoAnalysis.vtoComparison.overallImprovement} | Lip: ${photoAnalysis.vtoComparison.lipCompetence || 'N/A'} | Chin: ${photoAnalysis.vtoComparison.chinProjection || 'N/A'}`, col1 + 27, y);
      y += 5;
    }
  }

  const ie = patient.intraoralExam || patient.intraoralSection || {} as any;
  doc.setFont('helvetica', 'bold');
  doc.text('Molar Relation:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Right: ${ie.molarRight || ie.molarRelationRight || 'Class I'} | Left: ${ie.molarLeft || ie.molarRelationLeft || 'Class I'}`, col1 + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Canine Relation:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Right: ${ie.canineRight || ie.canineRelationRight || 'Class I'} | Left: ${ie.canineLeft || ie.canineRelationLeft || 'Class I'}`, col2 + 28, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Measurements:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Overjet: ${ie.overjetMm !== undefined && ie.overjetMm !== '' ? ie.overjetMm + ' mm' : 'N/A'} | Overbite: ${ie.overbiteMm !== undefined && ie.overbiteMm !== '' ? ie.overbiteMm + ' mm' : 'N/A'} | Crowding: Upper ${ie.crowdingUpperMm || 0}mm, Lower ${ie.crowdingLowerMm || 0}mm | Spacing: Upper ${ie.spacingUpperMm || 0}mm, Lower ${ie.spacingLowerMm || 0}mm | Crossbite: ${ie.crossbite || 'None'}`,
    col1 + 25,
    y
  );
  y += 5;

  const fn = patient.functionalExam || patient.functionalTmj || {} as any;
  doc.setFont('helvetica', 'bold');
  doc.text('Functional:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Breathing: ${fn.breathing || fn.respiration || 'Nasal'} | Swallowing: ${fn.swallowing || fn.mastication || 'Normal'} | TMJ Status: ${fn.tmj || fn.clicking || 'Normal'}`, col1 + 22, y);
  y += 8;

  // 4. Diagnosis & Treatment Plan
  addSectionHeader('4. Diagnosis & Treatment Plan');
  const dp = patient.diagnosisAndPlan || {} as any;

  doc.setFont('helvetica', 'bold');
  doc.text('Provisional Diagnosis:', col1, y);
  doc.setFont('helvetica', 'normal');
  const diagLines = doc.splitTextToSize(dp.provisionalDiagnosis || 'Pending clinical synthesis', pageWidth - margin * 2 - 35);
  doc.text(diagLines, col1 + 35, y);
  y += diagLines.length * 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Classification:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Skeletal: ${dp.skeletalClassification || 'N/A'} | Dental: ${dp.dentalClassification || 'N/A'}`, col1 + 25, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Proposed Appliance:', col1, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dp.proposedAppliance || 'N/A'}`, col1 + 32, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Extraction Plan:', col2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dp.extractionPlan || 'N/A'}`, col2 + 25, y);
  y += 5;

  if (dp.treatmentObjectives) {
    doc.setFont('helvetica', 'bold');
    doc.text('Treatment Objectives:', col1, y);
    doc.setFont('helvetica', 'normal');
    const objLines = doc.splitTextToSize(dp.treatmentObjectives, pageWidth - margin * 2 - 35);
    doc.text(objLines, col1 + 35, y);
    y += objLines.length * 4.5;
  }

  if (dp.retentionPlan) {
    doc.setFont('helvetica', 'bold');
    doc.text('Retention Plan:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dp.retentionPlan}`, col1 + 28, y);
    y += 5;
  }

  y += 5;

  // 5. Investigations & Photographs (Page 2 / Section 5 if images exist)
  if (patient.investigations.images && patient.investigations.images.length > 0) {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }

    addSectionHeader('5. Orthodontic Records & Photographs');

    let xPos = col1;
    let imgHeight = 40;
    let imgWidth = 55;

    patient.investigations.images.forEach((img, index) => {
      if (y + imgHeight + 10 > 280) {
        doc.addPage();
        y = 20;
        xPos = col1;
      }

      try {
        doc.addImage(img.dataUrl, 'JPEG', xPos, y, imgWidth, imgHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`${img.category}: ${img.title}`, xPos, y + imgHeight + 4);
      } catch (err) {
        // Fallback for non-standard image URLs
        doc.rect(xPos, y, imgWidth, imgHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`[Image: ${img.title}]`, xPos + 5, y + imgHeight / 2);
      }

      xPos += imgWidth + 10;
      if ((index + 1) % 3 === 0) {
        xPos = col1;
        y += imgHeight + 12;
      }
    });

    if (patient.investigations.images.length % 3 !== 0) {
      y += imgHeight + 12;
    }
  }

  // Footer / Signature lines
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 10;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Student Signature: __________________________', col1, y);
  doc.text('Guide / Staff Signature: __________________________', col2 - 10, y);

  y += 10;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated via OrthoCase Student App | Offline Digital Case Record | ${new Date().toLocaleDateString()}`, margin, y);

  // Save PDF file
  const fileName = `${patient.patientId || 'Case'}_${patient.name.replace(/\s+/g, '_')}_CaseHistory.pdf`;
  doc.save(fileName);
}
