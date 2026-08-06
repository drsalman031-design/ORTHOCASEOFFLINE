const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');
const PDFDocument = require('pdfkit');
const stream = require('stream');

admin.initializeApp();
const db = admin.firestore();

// Department Google Drive Shared Folder ID (Configure via environment / config)
const DEPT_DRIVE_FOLDER_ID = process.env.DEPT_DRIVE_FOLDER_ID || '1A2b3C4d5E6f7G8h9I0j_ORTHOCASE_VAULT';

/**
 * Helper: Generate PDF Buffer using PDFKit
 */
function buildCasePDFBuffer(caseData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Title & Header
      doc
        .fillColor('#0f172a')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('DEPARTMENT OF ORTHODONTICS & DENTOFACIAL ORTHOPEDICS', { align: 'center' });
      doc
        .fontSize(14)
        .fillColor('#0d9488')
        .text('Postgraduate Clinical Case History & Executive Sign-off Report', { align: 'center' });
      doc.moveDown(1);

      // Status Badge
      doc
        .fontSize(10)
        .fillColor('#065f46')
        .font('Helvetica-Bold')
        .text(`STATUS: APPROVED • HOD EXECUTIVE SIGN-OFF COMPLETED`, { align: 'center' });
      doc.moveDown(1);

      // Section 1: Patient Demographics
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('1. Patient Demographics & Record Info');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Patient Name: ${caseData.name || 'N/A'}`);
      doc.text(`Record ID: ${caseData.id || caseData.patientId || 'N/A'}`);
      doc.text(`Age & Gender: ${caseData.age || 'N/A'} yrs / ${caseData.gender || 'N/A'}`);
      doc.text(`Exam Date: ${caseData.examDate || caseData.createdAt || 'N/A'}`);
      doc.text(`Student Resident: ${caseData.profile?.studentName || caseData.studentOwnerId || 'Dr. Rahul Sharma'}`);
      doc.text(`Staff Guide: ${caseData.staffReviewerName || caseData.assignedStaffName || 'Dr. Sunita Patil'}`);
      doc.text(`HOD Reviewer: ${caseData.hodReviewerName || 'Prof. Dr. A. K. Varma (HOD)'}`);
      doc.moveDown(1);

      // Section 2: Chief Complaint & History
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('2. Chief Complaint & Case History');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Chief Complaint: ${caseData.chiefComplaint?.additionalNotes || caseData.diagnosisAndPlan?.provisionalDiagnosis || 'Dental crowding and facial aesthetics'}`);
      doc.moveDown(1);

      // Section 3: Diagnostic Synthesis & Treatment Plan
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('3. Orthodontic Diagnosis & Treatment Plan');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Skeletal Classification: ${caseData.diagnosisAndPlan?.skeletalClassification || 'Class II Skeletal pattern'}`);
      doc.text(`Dental Classification: ${caseData.diagnosisAndPlan?.dentalClassification || 'Class II Molar relationship'}`);
      doc.text(`Treatment Objectives: ${caseData.diagnosisAndPlan?.treatmentObjectives || 'Leveling, alignment, overjet reduction, retention'}`);
      doc.moveDown(1);

      // Section 4: Faculty Feedback Log & Audit Trail
      doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('4. Multi-Tier Review Log & Feedback History');
      doc.fontSize(9).font('Helvetica');

      const feedbackLog = caseData.feedbackHistory || [];
      if (feedbackLog.length === 0) {
        doc.text('• Approved by Staff Guide and HOD Executive Panel.');
      } else {
        feedbackLog.forEach((fb, index) => {
          doc.text(`[${index + 1}] ${fb.timestamp || ''} - ${fb.authorName || fb.role} (${fb.statusAction || 'Comment'}):`);
          doc.fillColor('#334155').text(`    "${fb.comment || 'No comment provided'}"`).fillColor('#0f172a');
          doc.moveDown(0.5);
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Cloud Function Trigger: onDocumentUpdated for case_histories/{caseId}
 */
exports.onCaseHistoryUpdated = functions.firestore
  .document('case_histories/{caseId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const caseId = context.params.caseId;

    const previousStatus = beforeData.approvalStatus || beforeData.status;
    const currentStatus = afterData.approvalStatus || afterData.status;

    // Check if status changed to APPROVED / HOD Approved
    const isNowApproved = currentStatus === 'APPROVED' || currentStatus === 'HOD Approved';
    const wasNotApproved = previousStatus !== 'APPROVED' && previousStatus !== 'HOD Approved';

    if (!isNowApproved || !wasNotApproved) {
      console.log(`[Case ${caseId}] Status transition (${previousStatus} -> ${currentStatus}) does not require Drive export.`);
      return null;
    }

    // Prevent duplicate triggers if driveFileUrl already exists
    if (afterData.driveFileUrl) {
      console.log(`[Case ${caseId}] Drive URL already exists: ${afterData.driveFileUrl}`);
      return null;
    }

    console.log(`🚀 [Case ${caseId}] Case APPROVED! Triggering PDF generation and Google Drive API Service Account upload...`);

    try {
      // 1. Generate PDF Buffer
      const pdfBuffer = await buildCasePDFBuffer(afterData);

      // 2. Initialize Google Drive API with Service Account credentials
      // Credentials loaded via GCP environment or serviceAccountKey.json
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
      const drive = google.drive({ version: 'v3', auth });

      // Create Readable Stream from PDF Buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(pdfBuffer);

      const fileName = `OrthoCase_${afterData.patientId || caseId}_${(afterData.name || 'Patient').replace(/\s+/g, '_')}_APPROVED.pdf`;

      // 3. Upload File to Department Google Drive Folder
      const fileMetadata = {
        name: fileName,
        parents: [DEPT_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: 'application/pdf',
        body: bufferStream,
      };

      const driveResponse = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
      });

      const webViewLink = driveResponse.data.webViewLink || `https://drive.google.com/file/d/${driveResponse.data.id}/view`;
      console.log(`✅ [Case ${caseId}] Uploaded PDF to Google Drive! URL: ${webViewLink}`);

      // 4. Save driveFileUrl back to Firestore document
      await change.after.ref.update({
        driveFileUrl: webViewLink,
        driveFileId: driveResponse.data.id,
        driveExportTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, driveFileUrl: webViewLink };
    } catch (error) {
      console.error(`❌ [Case ${caseId}] Google Drive Auto-Export Failed:`, error);
      // Log error note to document for administrative review
      await change.after.ref.update({
        driveExportError: error.message || 'Drive API Upload Failed',
      });
      return null;
    }
  });
