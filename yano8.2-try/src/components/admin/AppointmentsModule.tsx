import React, { useState, useEffect } from 'react';
import {
  getAppointments,
  updateAppointmentByAdmin,
  markAppointmentDoneByAdmin,
  reApproveAppointment,
  archiveAppointment,
  checkAppointmentConflict,
  referAppointmentToGuidance,
} from '../../services/storage';
import { Appointment, User, UserRole, AppointmentStatus } from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import { CollegeLogo } from '../common/CollegeLogo';
import {
  Calendar,
  Clock,
  Check,
  X,
  RefreshCw,
  Eye,
  CheckCircle2,
  User as UserIcon,
  Printer,
  RotateCcw,
  AlertTriangle,
  Send,
  Search,
  Archive,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';

interface AppointmentsModuleProps {
  role?: UserRole;
  currentUser?: User;
}

const formatTime24h = (time12: string): string => {
  if (!time12) return '10:00';
  if (/^\d{2}:\d{2}$/.test(time12)) return time12;
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '10:00';
  let [_, hStr, mStr, ampm] = match;
  let h = parseInt(hStr, 10);
  if (ampm && ampm.toUpperCase() === 'PM' && h < 12) h += 12;
  if (ampm && ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${mStr}`;
};

const formatTime12h = (time24: string): string => {
  if (!time24) return '10:00 AM';
  if (time24.includes('AM') || time24.includes('PM')) return time24;
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

export const AppointmentsModule: React.FC<AppointmentsModuleProps> = ({ role = 'ADMIN', currentUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => getAppointments(role));
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [printApp, setPrintApp] = useState<Appointment | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [confirmArchiveApp, setConfirmArchiveApp] = useState<Appointment | null>(null);
  const [confirmReferId, setConfirmReferId] = useState<string | null>(null);

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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('02:00 PM');
  const [adminNotes, setAdminNotes] = useState('');

  const getRemainingExpirationText = (completedAt?: string) => {
    if (!completedAt) return '1 week expiration';
    const completedTime = new Date(completedAt).getTime();
    if (isNaN(completedTime)) return '1 week expiration';
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const msLeft = completedTime + oneWeek - Date.now();
    if (msLeft <= 0) return 'Expiring to Vault now';
    const daysLeft = Math.floor(msLeft / (24 * 60 * 60 * 1000));
    const hoursLeft = Math.floor((msLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (daysLeft > 0) {
      return `Expires in ${daysLeft}d ${hoursLeft}h (➔ Archive Vault)`;
    }
    return `Expires in ${hoursLeft}h (➔ Archive Vault)`;
  };

  const refreshList = () => {
    const fresh = getAppointments(role);
    setAppointments(fresh);
    setSelectedApp((prev) => {
      if (!prev) return null;
      const freshSelected = fresh.find((a) => a.id === prev.id);
      return freshSelected || prev;
    });
  };

  useEffect(() => {
    refreshList();
    const interval = setInterval(refreshList, 1000);
    window.addEventListener('osas_storage_updated', refreshList);
    window.addEventListener('storage', refreshList);
    return () => {
      clearInterval(interval);
      window.removeEventListener('osas_storage_updated', refreshList);
      window.removeEventListener('storage', refreshList);
    };
  }, [role]);

  const handlePrint = () => {
    window.print();
  };

  const handleApprove = (id: string) => {
    // 1. Strict Conflict Check before approval
    const conflict = checkAppointmentConflict(id);
    if (conflict.hasConflict) {
      const target = appointments.find((a) => a.id === id);
      setConflictModalData({
        isOpen: true,
        candidateStudent: target?.studentName || 'Student',
        conflictStudent: conflict.conflictingAppointment?.studentName || 'Ibang Estudyante',
        conflictStudentId: conflict.conflictingAppointment?.studentId || conflict.conflictingAppointment?.id,
        date: conflict.formattedConflictDate || target?.preferredDate || '',
        time: conflict.formattedConflictTime || target?.preferredTime || '',
        message:
          conflict.message ||
          `Mayroon nang aprubadong appointment sa parehong petsa at oras. Bawal ang duplicate approval.`,
      });
      return;
    }

    try {
      const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
      const note = role === 'GUIDANCE_ADMIN' ? 'Approved by Guidance Admin' : 'Approved by OSAS Admin';
      updateAppointmentByAdmin(id, 'APPROVED', undefined, undefined, note, actorName);
      const fresh = getAppointments(role);
      setAppointments(fresh);
      const updated = fresh.find((a) => a.id === id);
      if (updated) setSelectedApp(updated);
    } catch (err: any) {
      const target = appointments.find((a) => a.id === id);
      setConflictModalData({
        isOpen: true,
        candidateStudent: target?.studentName || 'Student',
        conflictStudent: 'Existing Approved Appointment',
        date: target?.preferredDate || '',
        time: target?.preferredTime || '',
        message: err.message || 'Hindi maaprubahan ang appointment dahil sa schedule conflict.',
      });
    }
  };

  const handleConfirmReject = () => {
    if (!confirmRejectId) return;
    const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
    const note = role === 'GUIDANCE_ADMIN'
      ? 'Appointment request declined by Guidance Admin.'
      : 'Appointment request declined by OSAS Admin. Please re-schedule or contact OSAS office.';
    updateAppointmentByAdmin(
      confirmRejectId,
      'REJECTED',
      undefined,
      undefined,
      note,
      actorName
    );
    const fresh = getAppointments(role);
    setAppointments(fresh);
    const updated = fresh.find((a) => a.id === confirmRejectId);
    if (updated) setSelectedApp(updated);
    setConfirmRejectId(null);
  };

  const handleConfirmRefer = () => {
    if (!confirmReferId) return;
    const actorName = currentUser?.fullName || 'Princess Ann T. Ruzol';
    referAppointmentToGuidance(
      confirmReferId,
      'Referred from OSAS Admin for guidance evaluation and counseling.',
      actorName
    );
    const fresh = getAppointments(role);
    setAppointments(fresh);
    const updated = fresh.find((a) => a.id === confirmReferId);
    if (updated) setSelectedApp(updated);
    setConfirmReferId(null);
  };

  const handleReApprove = (id: string) => {
    // Strict Conflict Check on re-approval
    const conflict = checkAppointmentConflict(id);
    if (conflict.hasConflict) {
      const target = appointments.find((a) => a.id === id);
      setConflictModalData({
        isOpen: true,
        candidateStudent: target?.studentName || 'Student',
        conflictStudent: conflict.conflictingAppointment?.studentName || 'Ibang Estudyante',
        conflictStudentId: conflict.conflictingAppointment?.studentId || conflict.conflictingAppointment?.id,
        date: conflict.formattedConflictDate || target?.preferredDate || '',
        time: conflict.formattedConflictTime || target?.preferredTime || '',
        message:
          conflict.message ||
          `Mayroon nang aprubadong appointment sa parehong petsa at oras. Bawal ang duplicate approval.`,
      });
      return;
    }

    try {
      const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
      reApproveAppointment(id, actorName);
      const fresh = getAppointments(role);
      setAppointments(fresh);
      const updated = fresh.find((a) => a.id === id);
      if (updated) setSelectedApp(updated);
    } catch (err: any) {
      const target = appointments.find((a) => a.id === id);
      setConflictModalData({
        isOpen: true,
        candidateStudent: target?.studentName || 'Student',
        conflictStudent: 'Existing Approved Appointment',
        date: target?.preferredDate || '',
        time: target?.preferredTime || '',
        message: err.message || 'Hindi maaprubahan ang appointment dahil sa schedule conflict.',
      });
    }
  };

  const handleConfirmArchive = () => {
    if (!confirmArchiveApp) return;
    const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
    archiveAppointment(confirmArchiveApp.id, actorName);
    const fresh = getAppointments(role);
    setAppointments(fresh);
    setConfirmArchiveApp(null);
    setSelectedApp(null);
  };

  const handleRescheduleSubmit = (id: string) => {
    if (role === 'ADMIN' && (selectedApp?.status === 'REFERRED_TO_GUIDANCE' || selectedApp?.referredToGuidance)) {
      alert('This appointment has been referred to the Guidance Admin. Only the Guidance Admin is authorized to reschedule it.');
      return;
    }

    if (!rescheduleDate) {
      alert('Please select a preferred date for rescheduling.');
      return;
    }

    // Check conflict against the new reschedule date/time
    const conflict = checkAppointmentConflict(id, rescheduleDate, rescheduleTime);
    if (conflict.hasConflict) {
      const target = appointments.find((a) => a.id === id);
      setConflictModalData({
        isOpen: true,
        candidateStudent: target?.studentName || 'Student',
        conflictStudent: conflict.conflictingAppointment?.studentName || 'Ibang Estudyante',
        conflictStudentId: conflict.conflictingAppointment?.studentId || conflict.conflictingAppointment?.id,
        date: rescheduleDate,
        time: rescheduleTime,
        message: `Hindi maaaring ilipat sa ${rescheduleDate} nang ${rescheduleTime} dahil mayroon nang kasalukuyang aprubadong appointment si ${conflict.conflictingAppointment?.studentName}. Mangyaring pumili ng ibang bakanteng petsa o oras.`,
      });
      return;
    }

    const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
    const actorRole = role === 'GUIDANCE_ADMIN' ? 'GUIDANCE_ADMIN' : 'ADMIN';
    updateAppointmentByAdmin(
      id,
      'RESCHEDULED',
      rescheduleDate,
      rescheduleTime,
      adminNotes || (role === 'GUIDANCE_ADMIN' ? 'Rescheduled by Guidance Admin.' : 'Rescheduled by OSAS Admin due to conflict/session availability.'),
      actorName,
      actorRole
    );
    const fresh = getAppointments(role);
    setAppointments(fresh);
    const updated = fresh.find((a) => a.id === id);
    if (updated) setSelectedApp(updated);
  };

  const handleMarkDone = (id: string) => {
    const actorName = currentUser?.fullName || (role === 'GUIDANCE_ADMIN' ? 'Maria Mel B. Glemao' : 'Princess Ann T. Ruzol');
    markAppointmentDoneByAdmin(id, actorName);
    const fresh = getAppointments(role);
    setAppointments(fresh);
    const updated = fresh.find((a) => a.id === id);
    if (updated) setSelectedApp(updated);
  };

  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      (a.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.studentEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const rejectTargetApp = confirmRejectId ? appointments.find((a) => a.id === confirmRejectId) : null;
  const referTargetApp = confirmReferId ? appointments.find((a) => a.id === confirmReferId) : null;

  return (
    <div className="space-y-6">
      {/* Background content (hidden during print when print preview modal is open) */}
      <div className={`space-y-6 ${printApp ? 'print:hidden' : ''}`}>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-2xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {role === 'GUIDANCE_ADMIN' ? 'Referred Appointments' : 'Student Appointments Management'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {role === 'GUIDANCE_ADMIN'
                  ? 'Review, approve, or reject student appointments referred from OSAS'
                  : 'Manage counseling sessions, appointment completions, and scheduling approvals'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search appointment..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="REFERRED_TO_GUIDANCE">Referred to Guidance</option>
              <option value="APPROVED">Approved</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5">Student Details</th>
                <th className="p-3.5">Concern / Purpose</th>
                <th className="p-3.5">Schedule</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No appointment requests found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((a) => {
                  const isCompleted = a.status === 'COMPLETED';
                  const isRejected = a.status === 'REJECTED';
                  const isReferred = a.status === 'REFERRED_TO_GUIDANCE' || a.referredToGuidance;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-black text-slate-900 dark:text-white block">{a.studentName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                          {a.studentId} • {a.studentEmail}
                        </span>
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-300">{a.description}</p>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-blue-700 dark:text-blue-400 font-bold">
                        <div>
                          {a.preferredDate} ({a.preferredTime})
                        </div>
                        {a.adminPreferredDate && (
                          <div className="text-purple-700 dark:text-purple-400 text-[10px] mt-0.5">
                            ↳ Resched: {a.adminPreferredDate} @ {a.adminPreferredTime}
                          </div>
                        )}
                        {/* Real-time Conflict Alert Badge in Table */}
                        {a.status !== 'APPROVED' && a.status !== 'COMPLETED' && (() => {
                          const conflictCheck = checkAppointmentConflict(a.id);
                          if (!conflictCheck.hasConflict || !conflictCheck.conflictingAppointment) return null;
                          return (
                            <div className="mt-1">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-md bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                title={`May conflict sa approved appointment ni ${conflictCheck.conflictingAppointment.studentName}`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                Conflict: {conflictCheck.conflictingAppointment.studentName}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2.5 py-1 text-[10px] font-black rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                : isRejected
                                ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300'
                                : a.status === 'APPROVED'
                                ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300'
                                : a.status === 'RESCHEDULED'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300'
                                : isReferred
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                            }`}
                          >
                            {a.status === 'REFERRED_TO_GUIDANCE' ? 'REFERRED TO GUIDANCE' : a.status}
                          </span>

                          {/* 1-Week Auto Expiration Indicator for Completed Appointments */}
                          {isCompleted && a.completedAt && (
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" /> {getRemainingExpirationText(a.completedAt)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(a);
                            setRescheduleDate(a.adminPreferredDate || a.preferredDate);
                            setRescheduleTime(a.adminPreferredTime || a.preferredTime);
                            setAdminNotes(a.adminNotes || '');
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-xs shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILED APPOINTMENT MODAL */}
      {selectedApp && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedApp(null)}
          title={`Appointment Review - ${selectedApp.studentName}`}
          subtitle={`Appointment ID: #${selectedApp.id}`}
          maxWidth="lg"
        >
          <div className="space-y-4 p-2 text-xs">
            {/* Header Action Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Consultation Case Review</span>
              <button
                type="button"
                onClick={() => {
                  const target = selectedApp;
                  setSelectedApp(null);
                  setPrintApp(target);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Official Slip
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Student Profile
                  </span>
                  <p className="font-black text-slate-900 dark:text-white text-sm">
                    {selectedApp.studentName}{' '}
                    <span className="text-slate-500 font-mono text-xs font-normal">({selectedApp.studentId})</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedApp.studentEmail}</p>
                </div>
                <span className={`px-3 py-1 text-[11px] font-black rounded-full border ${
                  selectedApp.status === 'COMPLETED'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                    : selectedApp.status === 'REJECTED'
                    ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300'
                    : selectedApp.status === 'APPROVED'
                    ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300'
                    : selectedApp.status === 'RESCHEDULED'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300'
                    : selectedApp.status === 'REFERRED_TO_GUIDANCE' || selectedApp.referredToGuidance
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                }`}>
                  Status: {selectedApp.status === 'REFERRED_TO_GUIDANCE' ? 'REFERRED TO GUIDANCE' : selectedApp.status}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                  Concern / Purpose of Counseling
                </span>
                <p className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mt-1 leading-relaxed">
                  {selectedApp.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block text-[10px]">
                    Student Preferred Schedule
                  </span>
                  <p className="font-mono text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                    {selectedApp.preferredDate} @ {selectedApp.preferredTime}
                  </p>
                </div>

                {selectedApp.adminPreferredDate && (
                  <div className="p-2.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <span className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider block text-[10px]">
                      Admin Rescheduled Schedule
                    </span>
                    <p className="font-mono text-purple-700 dark:text-purple-300 font-bold mt-0.5">
                      {selectedApp.adminPreferredDate} @ {selectedApp.adminPreferredTime}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Referred to Guidance Banner inside Modal */}
            {(selectedApp.status === 'REFERRED_TO_GUIDANCE' || selectedApp.referredToGuidance) && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-black text-indigo-900 dark:text-indigo-300 block text-[11px]">
                    Referred to Guidance Office
                  </span>
                  {selectedApp.guidanceReferralDate && (
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                      • {new Date(selectedApp.guidanceReferralDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-indigo-800 dark:text-indigo-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs">
                  {selectedApp.guidanceReferralNotes || 'Referred for specialized guidance counseling evaluation.'}
                </p>
                {role === 'ADMIN' && (
                  <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium pt-1">
                    ℹ️ Ang appointment na ito ay nasa ilalim na ng Guidance Admin para sa kanilang counseling review at aksyon (Approve / Reject).
                  </p>
                )}
              </div>
            )}

            {/* Live Conflict Warning Banner inside Modal */}
            {selectedApp.status !== 'APPROVED' && selectedApp.status !== 'COMPLETED' && (() => {
              const conflict = checkAppointmentConflict(selectedApp.id);
              if (!conflict.hasConflict || !conflict.conflictingAppointment) return null;
              return (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <strong className="block font-black text-rose-900 dark:text-rose-200 text-xs sm:text-sm">
                      ⚠️ Schedule Conflict: Duplicate Approval Blocked
                    </strong>
                    <p className="leading-relaxed">
                      Mayroon nang kasalukuyang <strong>APPROVED</strong> na appointment sa parehong petsa at oras:
                    </p>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900 font-mono text-[11px] text-rose-950 dark:text-rose-200 space-y-0.5">
                      <div><strong>Schedule:</strong> {conflict.formattedConflictDate} @ {conflict.formattedConflictTime}</div>
                      <div><strong>Naka-aprubang Estudyante:</strong> {conflict.conflictingAppointment.studentName} ({conflict.conflictingAppointment.studentId || '#' + conflict.conflictingAppointment.id})</div>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                      Hindi maaaring aprubahan ito habang may conflict. Mangyaring gamitin ang Reschedule sa ibaba upang magtakda ng bagong libreng oras.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Reschedule Notes if present */}
            {(selectedApp.adminNotes || selectedApp.rescheduleReason) && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-1">
                <span className="font-black text-purple-900 dark:text-purple-300 block text-[11px]">
                  Reschedule Reason & Admin Notes:
                </span>
                <p className="text-purple-800 dark:text-purple-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900 text-xs">
                  {selectedApp.adminNotes || selectedApp.rescheduleReason}
                </p>
              </div>
            )}

            {/* Reschedule Section (Only if not COMPLETED & not REJECTED) */}
            {selectedApp.status !== 'COMPLETED' && selectedApp.status !== 'REJECTED' && (() => {
              const isReferredToGuidance = selectedApp.status === 'REFERRED_TO_GUIDANCE' || !!selectedApp.referredToGuidance;
              const isRescheduleDisabled = role === 'ADMIN' && isReferredToGuidance;

              return (
                <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 dark:text-purple-300 block">
                      Reschedule Appointment (Set Date & Time)
                    </span>
                    <button
                      type="button"
                      disabled={isRescheduleDisabled}
                      onClick={() => !isRescheduleDisabled && handleRescheduleSubmit(selectedApp.id)}
                      title={
                        isRescheduleDisabled
                          ? 'This appointment has been referred to Guidance. Only the Guidance Admin can reschedule it.'
                          : 'Apply Reschedule'
                      }
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-xs transition-colors ${
                        isRescheduleDisabled
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                      }`}
                    >
                      Apply Reschedule
                    </button>
                  </div>

                  {isRescheduleDisabled && (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Appointment referred to Guidance Counselor. Only the Guidance Admin is authorized to reschedule this appointment.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300">Set Date</label>
                      <input
                        type="date"
                        disabled={isRescheduleDisabled}
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className={`w-full px-3 py-2 text-xs border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                          isRescheduleDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-purple-800 dark:text-purple-300">Set Time</label>
                      <input
                        type="time"
                        disabled={isRescheduleDisabled}
                        value={formatTime24h(rescheduleTime)}
                        onChange={(e) => setRescheduleTime(formatTime12h(e.target.value))}
                        className={`w-full px-3 py-2 text-xs border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono ${
                          isRescheduleDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    disabled={isRescheduleDisabled}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      isRescheduleDisabled
                        ? 'Rescheduling locked: Handled exclusively by Guidance Admin'
                        : 'Optional admin note / reason for reschedule...'
                    }
                    className={`w-full px-3 py-1.5 text-xs border border-purple-300 dark:border-purple-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                      isRescheduleDisabled ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              );
            })()}

            {selectedApp.status === 'COMPLETED' && (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Appointment Fully Completed & Verified
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mt-0.5">
                      Completed: {selectedApp.completedAt ? new Date(selectedApp.completedAt).toLocaleString() : 'Recently'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const target = selectedApp;
                      setSelectedApp(null);
                      setPrintApp(target);
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer w-fit"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Copy
                  </button>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-amber-900 dark:text-amber-200">
                    <span className="font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      1-Week Expiration Policy: {getRemainingExpirationText(selectedApp.completedAt)}
                    </span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Completed appointments automatically expire after 1 week and move to <strong>System Settings &gt; System Archive Vault</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmArchiveApp(selectedApp)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0 w-fit"
                  >
                    <Archive className="w-3.5 h-3.5" /> Move to Vault Now
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Mark Appointment Done: ONLY when APPROVED, RESCHEDULED, DONE_ADMIN, or DONE_STUDENT */}
                {(selectedApp.status === 'APPROVED' || selectedApp.status === 'RESCHEDULED' || selectedApp.status === 'DONE_ADMIN' || selectedApp.status === 'DONE_STUDENT') && (
                  !(role === 'ADMIN' && (selectedApp.status === 'REFERRED_TO_GUIDANCE' || selectedApp.referredToGuidance || selectedApp.rescheduledByRole === 'GUIDANCE_ADMIN')) ? (
                    <button
                      type="button"
                      onClick={() => handleMarkDone(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Appointment &quot;Done&quot;
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] font-bold text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1.5"
                      title="Nai-refer o nai-reschedule ng Guidance Admin. Ang Guidance Admin lamang ang may karapatang mag-mark done nito."
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Referred to Guidance (Disabled)
                    </button>
                  )
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {/* REJECTED actions */}
                {selectedApp.status === 'REJECTED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReApprove(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" /> Re-Approve Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmArchiveApp(selectedApp)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Archive className="w-4 h-4" /> Archive Appointment
                    </button>
                  </>
                )}

                {/* OSAS Admin viewing a REFERRED appointment: Disabled approve and reject */}
                {role === 'ADMIN' && (selectedApp.status === 'REFERRED_TO_GUIDANCE' || selectedApp.referredToGuidance) && selectedApp.status !== 'REJECTED' && selectedApp.status !== 'COMPLETED' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1"
                      title="Nai-refer na sa Guidance Admin. Ang pag-reject o pag-approve ay hawak ng Guidance Admin."
                    >
                      <X className="w-3.5 h-3.5" /> Reject (Disabled)
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1"
                      title="Nai-refer na sa Guidance Admin. Ang pag-reject o pag-approve ay hawak ng Guidance Admin."
                    >
                      <Check className="w-4 h-4" /> Approve (Disabled)
                    </button>
                  </div>
                )}

                {/* OSAS Admin viewing a PENDING appointment: Show Referred to Guidance, Reject, and Approve */}
                {role === 'ADMIN' && selectedApp.status === 'PENDING' && !selectedApp.referredToGuidance && (
                  <>
                    <button
                      type="button"
                      onClick={() => setConfirmReferId(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <HeartHandshake className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Referred to Guidance
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmRejectId(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Appointment
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Approve Appointment
                    </button>
                  </>
                )}

                {/* OSAS Admin viewing an APPROVED or RESCHEDULED appointment (not referred) */}
                {role === 'ADMIN' && (selectedApp.status === 'APPROVED' || selectedApp.status === 'RESCHEDULED') && !selectedApp.referredToGuidance && (
                  <button
                    type="button"
                    onClick={() => setConfirmRejectId(selectedApp.id)}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject Appointment
                  </button>
                )}

                {/* Guidance Admin viewing a REFERRED or PENDING or RESCHEDULED appointment: Can Approve/Accept and Reject */}
                {role === 'GUIDANCE_ADMIN' && (selectedApp.status === 'REFERRED_TO_GUIDANCE' || selectedApp.status === 'PENDING' || selectedApp.status === 'RESCHEDULED') && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setConfirmRejectId(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Appointment
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(selectedApp.id)}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Accept & Approve
                    </button>
                  </div>
                )}

                {/* Guidance Admin viewing an APPROVED appointment: Show Reject button */}
                {role === 'GUIDANCE_ADMIN' && selectedApp.status === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => setConfirmRejectId(selectedApp.id)}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMATION MODAL FOR REFERRING TO GUIDANCE */}
      <ConfirmModal
        isOpen={!!confirmReferId}
        onClose={() => setConfirmReferId(null)}
        onConfirm={handleConfirmRefer}
        title="Refer Appointment to Guidance"
        message={
          referTargetApp
            ? `Sigurado ka ba na gusto mong i-refer sa Guidance Admin ang appointment request ni "${referTargetApp.studentName}"? Ito ay mai-forward sa Guidance Admin → Referred Appointments para sa counseling review at evaluation.`
            : 'Sigurado ka ba na gusto mong i-refer ang appointment na ito sa Guidance Admin?'
        }
        confirmText="Oo, I-forward sa Guidance"
        cancelText="Kanselahin"
        type="info"
        icon="info"
      />

      {/* CONFIRMATION MODAL FOR REJECTING APPOINTMENT */}
      <ConfirmModal
        isOpen={!!confirmRejectId}
        onClose={() => setConfirmRejectId(null)}
        onConfirm={handleConfirmReject}
        title="Are you sure you want to reject this appointment?"
        message={
          rejectTargetApp
            ? `Sigurado ka ba na gusto mong i-reject ang appointment request na ito ni "${rejectTargetApp.studentName}"?`
            : 'Sigurado ka ba na gusto mong i-reject ang appointment request na ito?'
        }
        confirmText="Yes"
        cancelText="No"
        type="danger"
        icon="alert"
      />

      {/* CONFIRMATION MODAL FOR ARCHIVING REJECTED APPOINTMENT */}
      {confirmArchiveApp && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmArchiveApp(null)}
          onConfirm={handleConfirmArchive}
          title="Are you sure you want to delete this?"
          message={`Are you sure you want to delete/archive the rejected appointment record for "${confirmArchiveApp.studentName}" (${confirmArchiveApp.studentId})? It will be moved to System Settings > System Archive.`}
          confirmText="Yes"
          cancelText="No"
          type="danger"
          icon="trash"
        />
      )}
      </div>

      {/* Official Appointment Print Slip Preview Modal */}
      {printApp && (
        <Modal
          isOpen={true}
          onClose={() => setPrintApp(null)}
          title={`Appointment Slip - ${printApp.studentName}`}
          subtitle={`Appointment ID: #${printApp.id} • Schedule: ${printApp.adminPreferredDate || printApp.preferredDate}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 print:p-0">
            {/* Printable Header Bar (Hidden in Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Official Guidance & Appointment Slip</h3>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Appointment Slip
              </button>
            </div>

            {/* Printable Document Body */}
            <div id="printable-appointment-slip" className="printable-document flex flex-col justify-between min-h-[95vh] sm:min-h-[1020px] print:min-h-screen print:h-full p-4 sm:p-6 bg-white text-slate-900 rounded-xl border border-slate-200 print:border-none print:p-0">
              <div className="space-y-4 shrink-0">
                {/* Institutional Header */}
                <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                  <div className="flex items-center justify-center gap-3 mb-1.5">
                    <CollegeLogo className="w-12 h-12" />
                    <div>
                      <h2 className="text-base font-black tracking-wide uppercase text-slate-900 leading-tight">
                        Dingalan Community College
                      </h2>
                      <p className="text-xs font-bold text-slate-700">Office of Student Affairs and Services (OSAS)</p>
                      <p className="text-[11px] text-slate-500 font-medium">Guidance, Counseling & Student Welfare Unit</p>
                    </div>
                  </div>
                  <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider text-slate-800">
                    Official Guidance & Consultation Appointment Slip
                  </div>
                </div>

                {/* Slip Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Appointment ID</span>
                    <span className="font-mono font-bold text-slate-900">#{printApp.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Date Filed</span>
                    <span className="font-semibold text-slate-800">{new Date(printApp.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Case Status</span>
                    <span className="font-bold text-slate-800 uppercase">{printApp.status}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Academic Year</span>
                    <span className="font-bold text-slate-900">A.Y. 2025-2026</span>
                  </div>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="printable-body flex-1 space-y-3 my-3">
                {/* Student Information */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    1. Student Client Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Student Full Name</span>
                      <span className="font-bold text-slate-900">{printApp.studentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Student ID Number</span>
                      <span className="font-mono font-bold text-slate-900">{printApp.studentId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Email Address</span>
                      <span className="font-medium text-slate-800">{printApp.studentEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Consultation Schedule Information */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-2 bg-blue-50/20">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    2. Appointment Schedule Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Confirmed Date</span>
                      <span className="font-bold text-slate-900">{printApp.adminPreferredDate || printApp.preferredDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Confirmed Time Slot</span>
                      <span className="font-bold text-slate-900">{printApp.adminPreferredTime || printApp.preferredTime}</span>
                    </div>
                  </div>
                </div>

                {/* Purpose / Concern */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    3. Purpose of Appointment & Consultation Concern
                  </h4>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-200">
                    {printApp.description}
                  </p>
                </div>

                {/* Admin / Counselor Notes */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                    4. Guidance Counselor Findings & Action Remarks
                  </h4>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-200">
                    {printApp.adminNotes || 'Scheduled for in-person consultation session at the OSAS Guidance Office.'}
                  </p>
                </div>

                {/* Completion & Verification Details */}
                <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span><strong>OSAS Authority Status:</strong> {printApp.status === 'COMPLETED' ? 'Session Completed' : printApp.status}</span>
                    {printApp.completedAt && (
                      <span><strong>Completion Date:</strong> {new Date(printApp.completedAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures & Footer Block */}
              <div className="printable-footer-block mt-auto shrink-0 pt-6 space-y-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="grid grid-cols-3 gap-6 text-center text-xs items-end">
                  <div className="flex flex-col items-center justify-end text-center">
                    <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                    <p className="font-bold text-slate-900 leading-tight">{printApp.studentName}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Student Conforme</p>
                  </div>
                  <div className="flex flex-col items-center justify-end text-center">
                    <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                    <p className="font-bold text-slate-900 leading-tight">Guidance Counselor / Admin</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Attending Guidance Personnel</p>
                  </div>
                  <div className="flex flex-col items-center justify-end text-center">
                    <div className="w-full border-b border-slate-800 pb-8 mb-1" />
                    <p className="font-bold text-slate-900 leading-tight">OSAS Director / Head</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Office of Student Affairs & Services</p>
                  </div>
                </div>

                <div className="text-center pt-2 text-[10px] text-slate-400 font-mono border-t border-slate-200">
                  Dingalan Community College • OSAS Guidance & Consultation System • Official Transaction Slip
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* STRICT APPOINTMENT CONFLICT VALIDATION MODAL */}
      {conflictModalData && (
        <Modal
          isOpen={conflictModalData.isOpen}
          onClose={() => setConflictModalData(null)}
          title="Bawal ang Duplicate Approval: Schedule Conflict"
          subtitle="Strict Conflict Prevention Check"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-300 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-rose-900 dark:text-rose-100 text-sm">
                  Na-block ang Approval dahil sa Duplicate Schedule
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                  Mayroon nang kasalukuyang <strong>APPROVED</strong> na appointment sa eksaktong petsa at oras na ito. Upang maiwasan ang conflict at double-booking sa counseling session, hindi pinapayagan ang dalawang aprubadong appointment sa iisang slot.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Conflict Petsa at Oras:</span>
                <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                  {conflictModalData.date} @ {conflictModalData.time}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Kasalukuyang Naka-Apruba:</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400">
                  {conflictModalData.conflictStudent} {conflictModalData.conflictStudentId ? `(${conflictModalData.conflictStudentId})` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Hinihiling na Estudyante:</span>
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {conflictModalData.candidateStudent}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              💡 <strong>Rekomendasyon:</strong> Gamitin ang <strong>Reschedule</strong> tool sa appointment details upang bigyan ng ibang libreng petsa o oras ang estudyante bago ito aprubahan.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setConflictModalData(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Isara (Cancel Approval)
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

