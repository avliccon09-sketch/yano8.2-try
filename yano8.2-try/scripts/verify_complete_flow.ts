(global as any).localStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };
})();
(global as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../src/services/firebase';
import {
  registerStudentAccount,
  findUserAsync,
  applyScholarship,
  updateScholarshipAppStatus,
  getScholarshipApplications,
  submitDisciplinaryReport,
  getDisciplinaryReports,
  updateDisciplinaryReportStatus,
  toggleAnnouncementHeart,
} from '../src/services/storage';
import { verifyUserCredentials } from '../src/utils/security';

async function runVerification() {
  console.log('=== STU-SERVE COMPLETE E2E VERIFICATION ===\n');

  // 1. TEST REGISTRATION OF A NEW STUDENT
  const testStudentId = `2026-99${Math.floor(1000 + Math.random() * 9000)}`;
  const testEmail = `student.test.${Date.now()}@ineust.ph.education`;
  const testOtp = '778899';
  console.log(`[1] Registering student: ID=${testStudentId}, Email=${testEmail}, OTP=${testOtp}`);

  const registeredStudent = await registerStudentAccount(
    {
      studentId: testStudentId,
      fullName: 'Juanita Dela Test',
      surname: 'Test',
      firstName: 'Juanita',
      middleName: 'Dela',
      email: testEmail,
      contactNumber: '09171234567',
      yearLevel: '1A',
      course: 'BS Entrepreneurship',
      oneTimePassword: testOtp,
    },
    'Princess Ann T. Ruzol (Admin)'
  );
  console.log('Registered student result:', registeredStudent.id, registeredStudent.studentId);

  // 2. VERIFY FIRESTORE USER DOCUMENTS
  console.log('\n[2] Checking Firestore documents for registered student...');
  const directIdDoc = await getDoc(doc(db, 'users', testStudentId.toLowerCase()));
  console.log(`- users/${testStudentId.toLowerCase()} exists?`, directIdDoc.exists());
  if (directIdDoc.exists()) {
    console.log('  Data stored:', {
      studentId: directIdDoc.data()?.studentId,
      otp: directIdDoc.data()?.oneTimePassword,
      mustChange: directIdDoc.data()?.mustChangePassword,
    });
  }

  // 3. TEST LOGIN USING STUDENT ID + OTP
  console.log('\n[3] Testing login via Student ID + OTP...');
  const userById = await findUserAsync(testStudentId, testOtp);
  if (!userById) {
    throw new Error('FAILED to find user by student ID and OTP!');
  }
  const isOtpValidById = await verifyUserCredentials(testOtp, userById);
  console.log('User found by studentId:', userById.fullName, '| Valid OTP?', isOtpValidById);
  if (!isOtpValidById) throw new Error('OTP validation failed for Student ID login!');

  // 4. TEST LOGIN USING EMAIL + OTP
  console.log('\n[4] Testing login via Email + OTP...');
  const userByEmail = await findUserAsync(testEmail, testOtp);
  if (!userByEmail) {
    throw new Error('FAILED to find user by email and OTP!');
  }
  const isOtpValidByEmail = await verifyUserCredentials(testOtp, userByEmail);
  console.log('User found by email:', userByEmail.fullName, '| Valid OTP?', isOtpValidByEmail);
  if (!isOtpValidByEmail) throw new Error('OTP validation failed for Email login!');

  // 5. TEST ADMIN LOGIN
  console.log('\n[5] Testing OSAS Admin login...');
  const adminUser = await findUserAsync('arnoldviena@gmail.com', 'admin123');
  console.log('Admin found?', !!adminUser, '| Role:', adminUser?.role);
  if (adminUser) {
    const adminValid = await verifyUserCredentials('admin123', adminUser);
    console.log('Admin credentials valid?', adminValid);
    if (!adminValid) throw new Error('Admin login failed!');
  }

  // 6. TEST SCHOLARSHIP APPLICATION & CROSS-DEVICE STATUS SYNC
  console.log('\n[6] Testing Scholarship Application flow...');
  const appResult = applyScholarship(
    'schol-1',
    'CHED Merit & Excellence Scholarship Program',
    userById,
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
    'grades_transcript.jpg'
  );
  console.log('Scholarship application created:', appResult.id, 'Status:', appResult.status);

  // Admin updates status to ACCEPTED
  updateScholarshipAppStatus(appResult.id, 'ACCEPTED', 'Approved by Committee', 'Princess Ann T. Ruzol');
  const allScholarshipApps = getScholarshipApplications();
  const updatedApp = allScholarshipApps.find((a) => a.id === appResult.id);
  console.log('After Admin review, status is:', updatedApp?.status, '| Notes:', updatedApp?.adminNotes);
  if (updatedApp?.status !== 'ACCEPTED') throw new Error('Scholarship status update failed!');

  // 7. TEST REPORTS AND CONCERNS SUBMISSION & STATUS SYNC
  console.log('\n[7] Testing Reports & Concerns submission and status sync...');
  const repResult = submitDisciplinaryReport(
    {
      reportedStudentName: 'Sample Violator Student',
      reportedStudentId: '2026-009999',
      incidentType: 'Tobacco/Nicotine use',
      location: 'Science Building Corridor',
      description: 'Observed smoking nicotine pod near stairway',
      declarationAccepted: true,
      evidenceFileName: 'photo_evidence.jpg',
      evidenceUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    },
    userById
  );
  console.log('Disciplinary report submitted:', repResult.id, 'Status:', repResult.status);

  // Admin updates report status
  updateDisciplinaryReportStatus(repResult.id, 'UNDER_INVESTIGATION', 'Investigating officer assigned', 'Princess Ann T. Ruzol');
  const allReports = getDisciplinaryReports();
  const updatedReport = allReports.find((r) => r.id === repResult.id);
  console.log('After Admin review, report status is:', updatedReport?.status, '| Notes:', updatedReport?.investigationNotes);
  if (updatedReport?.status !== 'UNDER_INVESTIGATION') throw new Error('Report status update failed!');

  // 8. TEST SCHOLARSHIP ANNOUNCEMENT HEART / FAVORITE
  console.log('\n[8] Testing Scholarship Announcement Heart function...');
  const updatedAncs = toggleAnnouncementHeart('anc-sch-schol-1', userById.fullName);
  const schAnc = updatedAncs.find((a) => a.id === 'anc-sch-schol-1' || a.scholarshipId === 'schol-1');
  console.log('Scholarship Announcement Heart count:', (schAnc?.heartReacts || []).length);
  const hasHeart = (schAnc?.heartReacts || []).includes(userById.fullName);
  console.log('Did user successfully heart the scholarship announcement?', hasHeart);
  if (!hasHeart) throw new Error('Heart functionality for scholarship failed!');

  console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runVerification()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('VERIFICATION ERROR:', e);
    process.exit(1);
  });
