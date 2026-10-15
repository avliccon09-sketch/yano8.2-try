import React, { useState, useEffect } from 'react';
import {
  getAppointments,
  getReferredDisciplinaryRecords,
  getUsers,
  updateAppointmentStatus,
  checkAppointmentConflict,
} from '../../services/storage';
import { Appointment, SystemModule, DisciplinaryRecord, User } from '../../types';
import { Modal } from '../common/Modal';
import {
  Calendar,
  AlertOctagon,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Megaphone,
  UserCheck,
  ExternalLink,
  AlertCircle,
  HeartHandshake,
} from 'lucide-react';

interface GuidanceDashboardProps {
  onNavigate: (module: SystemModule) => void;
  currentUser?: User;
}

export const GuidanceDashboard: React.FC<GuidanceDashboardProps> = ({ onNavigate, currentUser }) => {
  const [activeModal, setActiveModal] = useState<
    'APPOINTMENTS' | 'STUDENTS' | 'DISCIPLINARY' | null
  >(null);
  const [appointments, setAppointments] = useState<Appointment[]>(() => getAppointments('GUIDANCE_ADMIN'));
  const [referredDisciplinary, setReferredDisciplinary] = useState<DisciplinaryRecord[]>(() =>
    getReferredDisciplinaryRecords()
  );
  const [students, setStudents] = useState(() => getUsers().filter((u) => u.role === 'STUDENT'));

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Strict Conflict Modal State
  const [conflictModalData, setConflictModalData] = useState<{
    isOpen: boolean;
    candidateStudent: string;
    conflictStudent: string;
    conflictStudentId?: string;
    date: string;
    time: string;
    message: string;
  } | null>(null);

  const refreshData = () => {
    setAppointments(getAppointments('GUIDANCE_ADMIN'));
    setReferredDisciplinary(getReferredDisciplinaryRecords());
    setStudents(getUsers().filter((u) => u.role === 'STUDENT'));
  };

  useEffect(() => {
    window.addEventListener('osas_storage_updated', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Metrics
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING');
  const approvedAppointments = appointments.filter(
    (a) => a.status === 'APPROVED' || a.status === 'DONE_ADMIN' || a.status === 'DONE_STUDENT'
  );
  const pendingDisciplinaryReferrals = referredDisciplinary.filter((r) => r.guidanceStatus !== 'COMPLETED');

  const handleApproveAppointment = (app: Appointment) => {
    const conflict = checkAppointmentConflict(app.id);
    if (conflict.hasConflict) {
      setConflictModalData({
        isOpen: true,
        candidateStudent: app.studentName,
        conflictStudent: conflict.conflictingAppointment?.studentName || 'Existing Student',
        conflictStudentId: conflict.conflictingAppointment?.studentId || conflict.conflictingAppointment?.id,
        date: conflict.formattedConflictDate || app.preferredDate || app.date || '',
        time: conflict.formattedConflictTime || app.preferredTime || app.time || '',
        message:
          conflict.message ||
          'Mayroon nang kasalukuyang aprubadong appointment sa petsa at oras na ito. Bawal ang duplicate approval.',
      });
      return;
    }

    try {
      updateAppointmentStatus(app.id, 'APPROVED', `Approved by ${currentUser?.fullName || 'Guidance Counselor'}`);
      refreshData();
      setSelectedAppointment(null);
    } catch (err: any) {
      setConflictModalData({
        isOpen: true,
        candidateStudent: app.studentName,
        conflictStudent: 'Existing Approved Appointment',
        date: app.preferredDate || app.date || '',
        time: app.preferredTime || app.time || '',
        message: err.message || 'Hindi maaprubahan ang appointment dahil sa schedule conflict.',
      });
    }
  };

  const handleReschedule = (app: Appointment) => {
    if (!rescheduleDate || !rescheduleTime) return;
    updateAppointmentStatus(
      app.id,
      'RESCHEDULED',
      rescheduleDate,
      rescheduleTime,
      `Rescheduled by Guidance Office to ${rescheduleDate} at ${rescheduleTime}`
    );
    refreshData();
    setSelectedAppointment(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleModuleRedirect = (mod: SystemModule) => {
    setActiveModal(null);
    onNavigate(mod);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-1">
            <HeartHandshake className="w-3.5 h-3.5" /> Guidance & Counseling Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {currentUser?.fullName || 'Guidance Counselor'}
          </h1>
          <p className="text-sm text-indigo-100/80 leading-relaxed">
            Manage student counseling appointments, psychosocial interventions, referred disciplinary infractions, and student welfare cases from Dingalan Community College.
          </p>
        </div>
      </div>

      {/* Urgent Referral Banner if any pending referrals */}
      {pendingDisciplinaryReferrals.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-l-4 border-amber-600 dark:border-amber-500 p-4 rounded-r-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center shrink-0 text-white font-bold animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-100">
                PENDING GUIDANCE REFERRALS FROM OSAS
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {pendingDisciplinaryReferrals.length} Intervention Case(s) require counseling evaluation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('referred_disciplinary')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Review Intervention Cases
            </button>
          </div>
        </div>
      )}

      {/* SUMMARY STAT CARDS (CLICKABLE WITH POPUPS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Appointments Card */}
        <div
          onClick={() => setActiveModal('APPOINTMENTS')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Appointments
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-blue-600 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{appointments.length}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold pb-1">
              {pendingAppointments.length} Pending
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              {approvedAppointments.length} Confirmed
            </span>
          </div>
        </div>

        {/* Registered Students Card */}
        <div
          onClick={() => setActiveModal('STUDENTS')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Records
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-indigo-600 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{students.length}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold pb-1">
              Active Enrolled
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
              DCC Master Roster
            </span>
          </div>
        </div>

        {/* Referred Intervention Card */}
        <div
          onClick={() => setActiveModal('DISCIPLINARY')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Intervention Referrals
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-amber-600 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{referredDisciplinary.length}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold pb-1">
              {pendingDisciplinaryReferrals.length} For Action
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800">
              OSAS Referrals
            </span>
          </div>
        </div>
      </div>

      {/* PENDING COUNSELING APPOINTMENTS SECTION (FULL WIDTH) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Pending Counseling Appointments
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Awaiting counselor confirmation ({pendingAppointments.length} pending)
            </p>
          </div>
          <button
            onClick={() => onNavigate('appointments')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All appointments are up to date!</p>
            <p className="text-[11px] text-slate-400 mt-1">No pending student counseling appointments at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
            {pendingAppointments.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{app.studentName}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Student ID: {app.studentId} • {app.department || 'DCC Student'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    PENDING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{app.preferredDate || app.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested Time</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{app.preferredTime || app.time}</span>
                  </div>
                </div>

                {app.reason && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Purpose:</span>
                    {app.reason}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedAppointment(app)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleApproveAppointment(app)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* POP-UP MODAL: APPOINTMENTS OVERVIEW */}
      <Modal
        isOpen={activeModal === 'APPOINTMENTS'}
        onClose={() => setActiveModal(null)}
        title="Guidance Counseling Appointments Overview"
        subtitle="Recent student counseling bookings and schedule status"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No counseling appointments on record.</p>
            ) : (
              appointments.map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{app.studentName}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        ID: {app.studentId} • Schedule: {app.adminPreferredDate || app.preferredDate || app.date} ({app.adminPreferredTime || app.preferredTime || app.time})
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED' || app.status === 'DONE_ADMIN' || app.status === 'DONE_STUDENT'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : app.status === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : app.status === 'REJECTED'
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                  {app.reason && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      {app.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('appointments')}
              className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              View Full Appointments Module <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* POP-UP MODAL: STUDENT RECORDS OVERVIEW */}
      <Modal
        isOpen={activeModal === 'STUDENTS'}
        onClose={() => setActiveModal(null)}
        title="DCC Master Student Directory"
        subtitle="Active enrolled students and profile master records"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {students.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No enrolled student records found.</p>
            ) : (
              students.map((stud) => (
                <div
                  key={stud.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={stud.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stud.fullName}`}
                      alt={stud.fullName}
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {stud.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {stud.studentId} • {stud.yearLevel} • {stud.course}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Active
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('student_records')}
              className="py-2.5 px-5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Open Comprehensive Student Records <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* POP-UP MODAL: INTERVENTION REFERRALS */}
      <Modal
        isOpen={activeModal === 'DISCIPLINARY'}
        onClose={() => setActiveModal(null)}
        title="Referred Intervention Cases (From OSAS)"
        subtitle="Student intervention cases referred to Guidance for counseling, rehabilitation, and behavioral support"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {referredDisciplinary.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No intervention referrals from OSAS.</p>
            ) : (
              referredDisciplinary.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {rec.studentName} ({rec.studentId})
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Category: {rec.offenseType} • Date: {rec.date}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.guidanceStatus === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {rec.guidanceStatus || 'PENDING EVALUATION'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    {rec.description}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('referred_disciplinary')}
              className="py-2.5 px-5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              View Full Referred Intervention Cases <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* STRICT APPOINTMENT SCHEDULE CONFLICT MODAL */}
      {conflictModalData?.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setConflictModalData(null)}
          title="Schedule Conflict Detected"
          subtitle="Strict Guidance Counseling Conflict Rule Enforced"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                  Hindi Maaaring I-approve ang Counseling Appointment
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                  {conflictModalData.message}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Petsa at Oras:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {conflictModalData.date} ({conflictModalData.time})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Kasalukuyang Naka-schedule:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {conflictModalData.conflictStudent} {conflictModalData.conflictStudentId ? `(${conflictModalData.conflictStudentId})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bagong Aplikante:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {conflictModalData.candidateStudent}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              Paunawa: Bawal i-approve ang dalawang appointment na parehong date at oras hangga't hindi pa completed ang nauna. Gamitin ang Reschedule upang magtakda ng ibang petsa o oras.
            </p>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Naiintindihan (Isara)
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAppointment(null)}
          title="Reschedule Appointment"
          subtitle={`Student: ${selectedAppointment.studentName} (${selectedAppointment.studentId})`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-900/60">
              <span className="font-bold text-blue-900 dark:text-blue-300 block mb-1">Current Appointment Time:</span>
              <p className="text-blue-800 dark:text-blue-200 font-semibold">
                {selectedAppointment.preferredDate || selectedAppointment.date} at {selectedAppointment.preferredTime || selectedAppointment.time}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Date *</label>
              <input
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Time *</label>
              <input
                type="time"
                required
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-3 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rescheduleDate || !rescheduleTime}
                onClick={() => handleReschedule(selectedAppointment)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
