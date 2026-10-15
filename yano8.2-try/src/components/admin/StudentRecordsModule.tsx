import React, { useState } from 'react';
import {
  getUsers,
  getScholarshipApplications,
  getDormRooms,
  getDisciplinaryRecords,
  getAppointments,
  getInterventionRecords,
  deleteStudentRecord,
} from '../../services/storage';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { CollegeLogo } from '../common/CollegeLogo';
import { Users, Eye, Search, Award, Home, AlertOctagon, Calendar, Printer, Trash2, MapPin, X, Phone, HeartHandshake } from 'lucide-react';

interface StudentRecordsModuleProps {
  role?: UserRole;
  currentUser?: User;
}

export const StudentRecordsModule: React.FC<StudentRecordsModuleProps> = ({
  role = 'ADMIN',
  currentUser,
}) => {
  const [students, setStudents] = useState(() => getUsers().filter((u) => u.role === 'STUDENT'));
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [printStudent, setPrintStudent] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showRosterPrintModal, setShowRosterPrintModal] = useState(false);

  const refreshStudents = () => {
    setStudents(getUsers().filter((u) => u.role === 'STUDENT'));
  };

  React.useEffect(() => {
    window.addEventListener('osas_storage_updated', refreshStudents);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshStudents);
    };
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.course?.toLowerCase().includes(search.toLowerCase())
  );

  const getStudentHistory = (sId: string) => {
    const scholarships = getScholarshipApplications().filter((a) => a.studentId === sId);
    const dormRooms = getDormRooms().filter((r) => r.residents.some((res) => res.studentId === sId));
    const offenses = getDisciplinaryRecords().filter((d) => d.studentId === sId);
    const appointments = getAppointments().filter((a) => a.studentId === sId);
    const interventions = getInterventionRecords().filter((i) => i.studentId === sId);

    return { scholarships, dormRooms, offenses, appointments, interventions };
  };

  return (
    <div className="space-y-6">
      {/* Background content (hidden during print when print preview modal is open) */}
      <div className={`space-y-6 ${printStudent || showRosterPrintModal ? 'print:hidden' : ''}`}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Comprehensive Student Directory</h3>
              <p className="text-[11px] text-slate-500">Master roster of enrolled students & OSAS history</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Mobile Row: Total Students badge and Print Records button side-by-side */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto order-1">
              <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0">
                <span className="text-slate-500 font-medium">Total Students:</span>
                <span className="font-black text-blue-900">{students.length}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRosterPrintModal(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer sm:hidden"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>

            {/* Search Bar: displayed below them on mobile, positioned between badge and print on desktop */}
            <div className="relative w-full sm:w-64 order-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student ID, name, course..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Desktop Print Records button: order-3 on desktop, hidden on mobile */}
            <button
              type="button"
              onClick={() => setShowRosterPrintModal(true)}
              className="hidden sm:inline-flex px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors items-center gap-1.5 shrink-0 cursor-pointer order-3"
            >
              <Printer className="w-4 h-4" /> Print Records
            </button>
          </div>
        </div>

        {/* Student List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="p-3">Student Name</th>
                <th className="p-3">Student ID</th>
                <th className="p-3">Course / Program</th>
                <th className="p-3">Year Level</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 flex items-center gap-2.5">
                    <img src={s.avatarUrl} alt={s.fullName} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                    <span className="font-bold text-slate-900">{s.fullName}</span>
                  </td>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-500">{s.studentId}</td>
                  <td className="p-3 text-slate-800 font-medium">{s.course}</td>
                  <td className="p-3 text-slate-600">{s.yearLevel}</td>
                  <td className="p-3 text-slate-700 font-mono text-[11px]">{s.contactNumber || 'N/A'}</td>
                  <td className="p-3 text-slate-500 font-mono text-[11px]">{s.email}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(s)}
                      className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Student Profile Detailed Modal */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title=""
          hideHeader={true}
          maxWidth="2xl"
        >
          {(() => {
            const history = getStudentHistory(selectedStudent.studentId || selectedStudent.id);
            return (
              <div className="space-y-4 text-xs">
                {/* Print Action & Official Letterhead Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <CollegeLogo size="lg" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Dingalan Community College</h4>
                      <p className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">Office of Student Affairs & Services</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pr-8">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedStudent;
                        setSelectedStudent(null);
                        setPrintStudent(target);
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Profile Record
                    </button>
                    {role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmDelete(true)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Record
                      </button>
                    )}
                  </div>
                </div>

                {/* Header info with Address displayed beside Email */}
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.fullName}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-500/30 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-slate-900">{selectedStudent.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600 mt-1">
                      <span className="font-mono text-slate-500">ID: {selectedStudent.studentId}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-700">{selectedStudent.email}</span>
                      <span>•</span>
                      <span className="text-slate-800 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Address:</span> {selectedStudent.address || selectedStudent.permanentAddress || 'Dingalan, Aurora'}
                      </span>
                    </div>
                    {/* Course, Year Level, and Contact Number */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs text-indigo-700 font-bold">
                        {selectedStudent.course} ({selectedStudent.yearLevel})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-800 font-medium flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-500 uppercase text-[10px]">Contact:</span>
                        <span className="font-mono text-slate-900 font-semibold">{selectedStudent.contactNumber || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* For OSAS Admin: Show Scholarships */}
                {role !== 'GUIDANCE_ADMIN' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Award className="w-4 h-4 text-amber-600" /> Scholarship Applications & Grants
                    </div>
                    {history.scholarships.length === 0 ? (
                      <p className="text-slate-400 text-[11px] italic">No scholarship applications recorded.</p>
                    ) : (
                      history.scholarships.map((sch) => (
                        <div key={sch.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{sch.scholarshipTitle}</span>
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                            {sch.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* For OSAS Admin: Show Dormitory */}
                {role !== 'GUIDANCE_ADMIN' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Home className="w-4 h-4 text-emerald-600" /> Dormitory Residence Assignment
                    </div>
                    {history.dormRooms.length === 0 ? (
                      <p className="text-slate-400 text-[11px] italic">Not residing in university dormitory.</p>
                    ) : (
                      history.dormRooms.map((room) => (
                        <div key={room.id} className="p-2.5 bg-white rounded-lg border border-slate-200 font-medium text-xs text-slate-800">
                          Assigned to: <span className="font-bold text-emerald-700">{room.roomNumber}</span> ({room.floor})
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* For OSAS Admin: Show Disciplinary */}
                {role !== 'GUIDANCE_ADMIN' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <AlertOctagon className="w-4 h-4 text-red-600" /> Disciplinary Records & Sanctions
                    </div>
                    {history.offenses.length === 0 ? (
                      <p className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">✓</span> Clean record. No disciplinary violations.
                      </p>
                    ) : (
                      history.offenses.map((off) => (
                        <div key={off.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{off.offenseType}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">
                              Sanction: {off.sanction}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{off.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Appointments & Counseling History: Shown for both Guidance Admin & OSAS Admin */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar className="w-4 h-4 text-blue-600" /> Appointments & Counseling History
                  </div>
                  {history.appointments.length === 0 ? (
                    <p className="text-slate-400 text-[11px] italic">No appointment history.</p>
                  ) : (
                    history.appointments.map((app) => (
                      <div key={app.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{app.description} ({app.preferredDate})</span>
                        <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                          {app.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Intervention Records: Shown for both OSAS Admin and Guidance Admin */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-red-600" /> Intervention Records & Referrals
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">({history.interventions.length} records)</span>
                  </div>
                  {history.interventions.length === 0 ? (
                    <p className="text-slate-400 text-[11px] italic">No intervention records recorded.</p>
                  ) : (
                    history.interventions.map((inv) => (
                      <div key={inv.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Case #{inv.id} • {inv.reasons?.join(', ') || 'General Concern'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            inv.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'REFERRED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : inv.status === 'FOLLOW_UP_REQUIRED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2">
                          <span><strong>Referred by:</strong> {inv.referredBy === 'Others' ? (inv.referredByOther || 'Others') : inv.referredBy}</span>
                          <span>•</span>
                          <span><strong>Date:</strong> {inv.dateOfReferral || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A')}</span>
                          {inv.urgencyLevel && (
                            <>
                              <span>•</span>
                              <span><strong>Urgency:</strong> {inv.urgencyLevel}</span>
                            </>
                          )}
                        </div>
                        {inv.descriptionOfConcerns && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                            "{inv.descriptionOfConcerns}"
                          </p>
                        )}
                        {inv.actionTakenSummary && (
                          <p className="text-[11px] text-slate-600">
                            <strong>Action Taken:</strong> {inv.actionTakenSummary}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Confirm Student Record Deletion Modal */}
      {selectedStudent && (
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={() => {
            deleteStudentRecord(selectedStudent.id, 'Princess Ann T. Ruzol (Admin)');
            setShowConfirmDelete(false);
            setSelectedStudent(null);
            refreshStudents();
          }}
          title="Are you sure you want to delete this?"
          message={`Are you sure you want to delete this student record for ${selectedStudent.fullName} (${selectedStudent.studentId})? Deleting this record will move it to System Settings > System Archive.`}
          confirmText="Yes"
          cancelText="No"
          type="danger"
        />
      )}
      </div>

      {/* Official Student Cumulative Record Print Slip Preview Modal */}
      {printStudent && (
        <Modal
          isOpen={true}
          onClose={() => setPrintStudent(null)}
          title={`Student Record Slip - ${printStudent.fullName}`}
          subtitle={`Student ID: ${printStudent.studentId} • ${printStudent.course} (${printStudent.yearLevel})`}
          maxWidth="2xl"
        >
          {(() => {
            const history = getStudentHistory(printStudent.studentId || printStudent.id);
            return (
              <div className="space-y-4 print:p-0">
                {/* Printable Header Bar (Hidden in Print) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Official Student Profile & Record Slip</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Record Slip
                  </button>
                </div>

                {/* Printable Document Body */}
                <div id="printable-student-slip" className="printable-document flex flex-col justify-between min-h-0 bg-white text-slate-900 p-2 sm:p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                  <div className="printable-body flex-1 space-y-4">
                    {/* Institutional Header */}
                    <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                      <div className="flex items-center justify-center gap-3 mb-1.5">
                        <CollegeLogo className="w-12 h-12" />
                        <div>
                          <h2 className="text-base font-black tracking-wide uppercase text-slate-900 leading-tight">
                            Dingalan Community College
                          </h2>
                          <p className="text-xs font-bold text-slate-700">Office of Student Affairs and Services (OSAS)</p>
                          <p className="text-[11px] text-slate-500 font-medium">Student Records, Welfare & Development Center</p>
                        </div>
                      </div>
                      <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider text-slate-800">
                        Official Student Cumulative Profile & Services Record
                      </div>
                    </div>

                    {/* Summary Metadata Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Student Name</span>
                        <span className="font-bold text-slate-900 truncate block">{printStudent.fullName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Student ID Number</span>
                        <span className="font-mono font-bold text-slate-900">{printStudent.studentId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Course & Year</span>
                        <span className="font-bold text-indigo-700 truncate block">{printStudent.course} ({printStudent.yearLevel})</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Academic Year</span>
                        <span className="font-bold text-slate-900">A.Y. 2025-2026</span>
                      </div>
                    </div>

                    {/* Student Personal & Academic Details */}
                    <div className="border border-slate-300 rounded-lg p-3 space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                        1. Student Identification & Academic Profile
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Full Name</span>
                          <span className="font-bold text-slate-900 text-sm">{printStudent.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Student ID Number</span>
                          <span className="font-mono font-bold text-slate-900">{printStudent.studentId}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Course & Year</span>
                          <span className="font-bold text-slate-800">{printStudent.course} ({printStudent.yearLevel})</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Number</span>
                          <span className="font-mono text-slate-800">{printStudent.contactNumber || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Email Address</span>
                          <span className="font-mono text-slate-800">{printStudent.email}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Residential Address</span>
                          <span className="font-medium text-slate-900">
                            {printStudent.address || printStudent.permanentAddress || 'Dingalan, Aurora'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scholarships Summary (OSAS Admin) */}
                    {role !== 'GUIDANCE_ADMIN' && (
                      <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>2. Scholarship & Educational Grants</span>
                          <span className="text-[10px] text-slate-500 font-normal">({history.scholarships.length} recorded)</span>
                        </h4>
                        {history.scholarships.length === 0 ? (
                          <p className="text-slate-500 text-xs italic">No scholarship records on file.</p>
                        ) : (
                          <div className="space-y-1">
                            {history.scholarships.map((sch) => (
                              <div key={sch.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                                <span className="font-bold text-slate-800">{sch.scholarshipTitle}</span>
                                <span className="font-mono font-bold uppercase text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                                  Status: {sch.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dormitory Assignment (OSAS Admin) */}
                    {role !== 'GUIDANCE_ADMIN' && (
                      <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                          3. Dormitory Residence History
                        </h4>
                        {history.dormRooms.length === 0 ? (
                          <p className="text-slate-500 text-xs italic">Non-resident / Not assigned to university dormitory.</p>
                        ) : (
                          history.dormRooms.map((room) => (
                            <p key={room.id} className="text-xs text-slate-800">
                              Assigned to <strong>Room {room.roomNumber}</strong> ({room.floor} Floor) - Capacity: {room.capacity}
                            </p>
                          ))
                        )}
                      </div>
                    )}

                    {/* Disciplinary Standing (OSAS Admin) */}
                    {role !== 'GUIDANCE_ADMIN' && (
                      <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                          <span>4. Disciplinary & Student Conduct Record</span>
                          <span className="text-[10px] text-slate-500 font-normal">({history.offenses.length} incidents)</span>
                        </h4>
                        {history.offenses.length === 0 ? (
                          <p className="text-emerald-700 text-xs font-bold">
                            ✓ In Good Moral Standing. No disciplinary violations or sanctions recorded.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {history.offenses.map((off) => (
                              <div key={off.id} className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-slate-900">{off.offenseType}</span>
                                  <span className="text-red-700">Sanction: {off.sanction}</span>
                                </div>
                                <p className="text-slate-600 text-[11px] mt-0.5">{off.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Consultations & Guidance */}
                    <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                        <span>{role === 'GUIDANCE_ADMIN' ? '2. Guidance & Counseling Consultations' : '5. Guidance & Counseling Consultations'}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({history.appointments.length} appointments)</span>
                      </h4>
                      {history.appointments.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No guidance consultations recorded.</p>
                      ) : (
                        <div className="space-y-1">
                          {history.appointments.map((app) => (
                            <div key={app.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-none">
                              <span className="text-slate-800">{app.description} ({app.preferredDate})</span>
                              <span className="font-bold text-[10px] uppercase text-slate-700">{app.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Intervention Records */}
                    <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                        <span>{role === 'GUIDANCE_ADMIN' ? '3. Intervention Records & Case Referrals' : '6. Intervention Records & Case Referrals'}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({history.interventions.length} records)</span>
                      </h4>
                      {history.interventions.length === 0 ? (
                        <p className="text-slate-500 text-xs italic">No intervention records recorded.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {history.interventions.map((inv) => (
                            <div key={inv.id} className="text-xs bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-900">Case #{inv.id} • {inv.reasons?.join(', ') || 'General Concern'}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-700">Status: {inv.status}</span>
                              </div>
                              <p className="text-[11px] text-slate-600">
                                Referred By: {inv.referredBy === 'Others' ? (inv.referredByOther || 'Others') : inv.referredBy} • Date: {inv.dateOfReferral || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signatures & Footer in printable-footer-block */}
                  <div className="printable-footer-block mt-auto shrink-0 space-y-4 pt-6">
                    <div className="grid grid-cols-2 gap-8 text-center text-xs items-end">
                      <div className="flex flex-col items-center justify-end text-center">
                        <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                        <p className="font-bold text-slate-900 leading-tight">Student Records Officer / Admin</p>
                        <p className="text-[10px] text-slate-500 leading-tight">Prepared & Verified Official Record</p>
                      </div>
                      <div className="flex flex-col items-center justify-end text-center">
                        <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                        <p className="font-bold text-slate-900 leading-tight">
                          {role === 'GUIDANCE_ADMIN' ? 'Registered Guidance Counselor (RGC)' : 'OSAS Director / Head'}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {role === 'GUIDANCE_ADMIN' ? 'Guidance and Counseling Services' : 'Office of Student Affairs & Services'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Notice */}
                    <div className="text-center pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-200">
                      Dingalan Community College • OSAS Student Records Module • Official Certified Student Profile Slip
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Official Master Student Directory & OSAS Records Print Roster Preview Modal */}
      {showRosterPrintModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRosterPrintModal(false)}
          title="Official Student Directory & Cumulative Master Roster"
          subtitle={`Enrolled Roster • ${filteredStudents.length} student record(s) listed`}
          maxWidth="4xl"
        >
          <div className="space-y-4 print:p-0">
            {/* Action Bar (Hidden in Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Official Student Master Directory & Records Roster
                </h3>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Master Directory Roster
              </button>
            </div>

            {/* Printable Document Body */}
            <div id="printable-master-roster" className="printable-document space-y-4 bg-white text-slate-900 p-2 sm:p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
              {/* Institutional Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <div className="flex items-center justify-center gap-3 mb-1.5">
                  <CollegeLogo className="w-12 h-12" />
                  <div>
                    <h2 className="text-base font-black tracking-wide uppercase text-slate-900 leading-tight">
                      Dingalan Community College
                    </h2>
                    <p className="text-xs font-bold text-slate-700">Office of Student Affairs and Services (OSAS)</p>
                    <p className="text-[11px] text-slate-500 font-medium">Student Records, Welfare & Development Center</p>
                  </div>
                </div>
                <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Official Enrolled Student Directory & OSAS Master Roster
                </div>
              </div>

              {/* Roster Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Students Listed</span>
                  <span className="font-bold text-slate-900">{filteredStudents.length} Students</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Date Generated</span>
                  <span className="font-semibold text-slate-800">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Scope / Query</span>
                  <span className="font-bold text-indigo-700">{search ? `Search: "${search}"` : 'All Enrolled'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Academic Year</span>
                  <span className="font-bold text-slate-900">A.Y. 2025-2026</span>
                </div>
              </div>

              {/* Master Roster Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">#</th>
                      <th className="p-2 border-r border-slate-300">Student Name</th>
                      <th className="p-2 border-r border-slate-300">Student ID</th>
                      <th className="p-2 border-r border-slate-300">Course & Year</th>
                      <th className="p-2 border-r border-slate-300">Institutional Email</th>
                      <th className="p-2">Address / Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-800">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-slate-400">
                          No student records match the search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500 border-r border-slate-300">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-300">{s.fullName}</td>
                          <td className="p-2 font-mono font-bold text-slate-700 border-r border-slate-300">{s.studentId}</td>
                          <td className="p-2 border-r border-slate-300">{s.course} ({s.yearLevel})</td>
                          <td className="p-2 font-mono text-[11px] border-r border-slate-300">{s.email}</td>
                          <td className="p-2 text-slate-700">{s.address || s.permanentAddress || 'Dingalan, Aurora'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures Section */}
              <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs items-end">
                <div className="flex flex-col items-center justify-end text-center">
                  <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                  <p className="font-bold text-slate-900 leading-tight">Student Records Officer</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Custodian of Records</p>
                </div>
                <div className="flex flex-col items-center justify-end text-center">
                  <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                  <p className="font-bold text-slate-900 leading-tight">College Registrar / OSAS</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Verified & Certified</p>
                </div>
                <div className="flex flex-col items-center justify-end text-center">
                  <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                  <p className="font-bold text-slate-900 leading-tight">OSAS Director / Head</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Office of Student Affairs & Services</p>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-200">
                Dingalan Community College • OSAS Student Records Module • Official Master Directory Document
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

