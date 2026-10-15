import React, { useState } from 'react';
import {
  getSafetyReports,
  getAppointments,
  getScholarships,
  getDormRooms,
  getUsers,
  getScholarshipApplications,
  getDormApplicants,
  updateAppointmentStatus,
  saveAppointment,
  checkAppointmentConflict,
} from '../../services/storage';
import { SystemModule, Appointment } from '../../types';
import { Modal } from '../common/Modal';
import {
  ShieldAlert,
  Calendar,
  Award,
  Home,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  ArrowUpRight,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate?: (module: SystemModule) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeModal, setActiveModal] = useState<
    'SAFETY' | 'APPOINTMENTS' | 'SCHOLARSHIPS' | 'DORM' | 'STUDENTS' | null
  >(null);
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

  const [appointmentsList, setAppointmentsList] = useState(() => getAppointments());
  const [safetyReportsList, setSafetyReportsList] = useState(() => getSafetyReports());
  const [scholarships, setScholarships] = useState(() => getScholarships());
  const [dormRooms, setDormRooms] = useState(() => getDormRooms());
  const [users, setUsers] = useState(() => getUsers().filter((u) => u.role === 'STUDENT'));
  const [scholarshipApps, setScholarshipApps] = useState(() => getScholarshipApplications());
  const [dormApplicants, setDormApplicants] = useState(() => getDormApplicants());

  const refreshDashboardData = () => {
    setAppointmentsList(getAppointments());
    setSafetyReportsList(getSafetyReports());
    setScholarships(getScholarships());
    setDormRooms(getDormRooms());
    setUsers(getUsers().filter((u) => u.role === 'STUDENT'));
    setScholarshipApps(getScholarshipApplications());
    setDormApplicants(getDormApplicants());
  };

  React.useEffect(() => {
    window.addEventListener('osas_storage_updated', refreshDashboardData);
    window.addEventListener('storage', refreshDashboardData);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshDashboardData);
      window.removeEventListener('storage', refreshDashboardData);
    };
  }, []);

  // Dynamic accuracy calculations for Dormitory slots
  const totalDormCapacity = dormRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalDormOccupants = dormRooms.reduce((acc, r) => acc + (r.residents?.length || 0), 0);
  const remainingDormSlots = Math.max(0, totalDormCapacity - totalDormOccupants);
  const dormOccupancyPct = totalDormCapacity > 0 ? Math.round((totalDormOccupants / totalDormCapacity) * 100) : 0;

  // Filter ONLY PENDING appointments for Dashboard view as requested
  const pendingAppointments = appointmentsList.filter((a) => a.status === 'PENDING');

  // Filter Safety Reports from past 1 month (30 days) for Urgent Review
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentSafetyReports = safetyReportsList.filter(
    (r) => new Date(r.reportedAt).getTime() >= oneMonthAgo
  );

  // Active pending safety reports (REPORTED or ESCALATED)
  const activePendingSafetyReports = recentSafetyReports.filter(
    (r) => r.status === 'REPORTED' || r.status === 'ESCALATED'
  );
  const urgentReportsCount = activePendingSafetyReports.length;
  const pendingScholApps = scholarshipApps.filter((a) => a.status === 'PENDING').length;

  const resolvedReportsCount = safetyReportsList.filter((r) => r.status === 'RESOLVED').length;
  const activeReportsCount = safetyReportsList.filter((r) => r.status === 'REPORTED').length;
  const pendingReportsCount = safetyReportsList.filter((r) => r.status === 'ESCALATED').length;

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
        message: conflict.message || 'Mayroon nang kasalukuyang aprubadong appointment sa petsa at oras na ito. Bawal ang duplicate approval.',
      });
      return;
    }

    try {
      updateAppointmentStatus(app.id, 'APPROVED', 'Approved by Admin on Dashboard');
      setAppointmentsList(getAppointments());
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

  const handleRejectAppointment = (app: Appointment) => {
    updateAppointmentStatus(app.id, 'REJECTED', 'Rejected by Admin on Dashboard');
    setAppointmentsList(getAppointments());
    setSelectedAppointment(null);
  };

  const handleRescheduleAppointment = (app: Appointment) => {
    if (!rescheduleDate || !rescheduleTime) return;
    updateAppointmentStatus(
      app.id,
      'RESCHEDULED',
      rescheduleDate,
      rescheduleTime,
      `Rescheduled by Admin to ${rescheduleDate} at ${rescheduleTime}`,
      'Princess Ann T. Ruzol (Admin)'
    );
    setAppointmentsList(getAppointments());
    setSelectedAppointment(null);
  };

  const handleModuleRedirect = (mod: SystemModule) => {
    setActiveModal(null);
    if (onNavigate) onNavigate(mod);
  };

  return (
    <div className="space-y-6">
      {/* URGENT SAFETY ALERT (Only shown when there are active pending safety reports) */}
      {activePendingSafetyReports.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/90 border-l-4 border-red-600 dark:border-red-400 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm rounded-r transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900 dark:text-red-100">
                REPORTS/CONCERNS: Last 30 Days Incident Logs
              </p>
              <p className="text-xs text-red-700 dark:text-red-200">
                Showing active reports/concerns reported within the past 1 month ({urgentReportsCount} Active Pending Action)
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('SAFETY')}
            className="bg-red-600 dark:bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-red-700 dark:hover:bg-red-400 transition-colors shrink-0 cursor-pointer shadow-xs border border-red-500 dark:border-red-400"
          >
            Review Report
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reports/Concerns Card */}
        <div
          id="summary-card-safety"
          onClick={() => setActiveModal('SAFETY')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-red-300 dark:hover:border-red-700/60 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reports/Concerns</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-red-600 dark:group-hover:text-red-400 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{safetyReportsList.length}</span>
            <span className="text-xs text-green-600 dark:text-green-400 font-bold pb-1">{resolvedReportsCount} Resolved</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 rounded text-[10px] font-bold border border-red-200 dark:border-red-800">{activeReportsCount} Active</span>
            </div>
          </div>
        </div>

        {/* Scholarship Applicants Card */}
        <div
          id="summary-card-scholarships"
          onClick={() => setActiveModal('SCHOLARSHIPS')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/60 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scholarship Applicants</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{scholarshipApps.length}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold pb-1">{pendingScholApps} Pending</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded border border-amber-200/60 dark:border-amber-800/60">
              {scholarships.length} Grants Active
            </span>
          </div>
        </div>

        {/* Dorm Occupancy Card */}
        <div
          id="summary-card-dorm"
          onClick={() => setActiveModal('DORM')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dorm Occupancy & Slots</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{dormOccupancyPct}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold pb-1">
              {totalDormOccupants} / {totalDormCapacity} Occupied
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300" style={{ width: `${dormOccupancyPct}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{remainingDormSlots} slots available</span>
            </div>
          </div>
        </div>

        {/* Pending Student Appointments Card */}
        <div
          id="summary-card-appointments"
          onClick={() => setActiveModal('APPOINTMENTS')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/60 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Appointments</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold transition-colors">
              <span>View</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingAppointments.length}</span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold pb-1">Awaiting Action</span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800">
              {appointmentsList.length} Total Sessions
            </span>
          </div>
        </div>
      </div>

      {/* PENDING STUDENT APPOINTMENTS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Pending Student Appointments ({pendingAppointments.length})
            </h3>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Action Required
            </span>
          </div>
          <button
            onClick={() => handleModuleRedirect('appointments')}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Appointments Module <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-2.5">Student Name</th>
                <th className="px-4 py-2.5">Purpose of Visit</th>
                <th className="px-4 py-2.5 text-center">Preferred Schedule</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pendingAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No pending student appointments right now.
                  </td>
                </tr>
              ) : (
                pendingAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{app.studentName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">ID: {app.studentId}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{app.description}</td>
                    <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-300 font-semibold">
                      {app.preferredDate} at {app.preferredTime}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        PENDING
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApproveAppointment(app)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg border border-emerald-500 transition-colors cursor-pointer"
                          title="Approve Appointment"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedAppointment(app)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg border border-blue-500 transition-colors cursor-pointer"
                          title="Reschedule Appointment"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleRejectAppointment(app)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg border border-red-500 transition-colors cursor-pointer"
                          title="Reject Appointment"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Dialog Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">
              Reschedule Appointment for {selectedAppointment.studentName}
            </h3>
            <p className="text-xs text-slate-500">
              Original request: {selectedAppointment.preferredDate} at {selectedAppointment.preferredTime}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">New Time</label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRescheduleAppointment(selectedAppointment)}
                className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary Popups with Module Redirect Buttons */}
      <Modal
        isOpen={activeModal === 'SAFETY'}
        onClose={() => setActiveModal(null)}
        title="Reports/Concerns (Past 30 Days)"
        subtitle="Recent incident reports and student concerns submitted by students"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {recentSafetyReports.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No reports or concerns recorded in the past 30 days.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {recentSafetyReports.map((r) => (
                <div key={r.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                        r.status === 'RESOLVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : r.isUrgent
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}>
                        {r.status}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{r.location}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{r.description}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                      Reported by: <span className="font-semibold text-slate-700 dark:text-slate-200">{r.studentName} ({r.studentId})</span> • Date: {new Date(r.reportedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('safety_reports')}
              className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Full Grievance Reports Module <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'APPOINTMENTS'}
        onClose={() => setActiveModal(null)}
        title="Appointments Summary Overview"
        subtitle="Student counseling and appointment requests"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          {appointmentsList.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No student appointments scheduled.</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
              {appointmentsList.map((a) => (
                <div key={a.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{a.studentName} ({a.studentId})</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{a.description}</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">Preferred: {a.preferredDate} at {a.preferredTime}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 rounded-full shrink-0 border border-blue-200 dark:border-blue-800">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}

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

      <Modal
        isOpen={activeModal === 'SCHOLARSHIPS'}
        onClose={() => setActiveModal(null)}
        title="Scholarship Programs & Applications Overview"
        subtitle="Active university scholarship grants and applicants"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-1">
              Active Programs ({scholarships.length})
            </div>
            {scholarships.map((s) => (
              <div key={s.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{s.title}</h4>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{s.amount || 'Subsidy'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{s.description}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                  <span>Deadline: {s.deadline}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('scholarship')}
              className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              View Full Scholarship Module <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'DORM'}
        onClose={() => setActiveModal(null)}
        title="Dormitory Facilities & Occupancy Overview"
        subtitle="Current state of university dorm rooms and occupancy"
        maxWidth="2xl"
      >
        <div className="space-y-3">
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {dormRooms.map((d) => (
              <div key={d.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{d.roomNumber} ({d.gender} Wing)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Floor: {d.floor} | Occupants: {d.occupiedCount}/{d.capacity}</p>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                  d.status === 'AVAILABLE'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                }`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('dormitory')}
              className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              View Full Dormitory Module <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'STUDENTS'}
        onClose={() => setActiveModal(null)}
        title="Registered Students Roster"
        subtitle="Active student accounts in the system"
        maxWidth="2xl"
      >
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{u.fullName} ({u.studentId})</h4>
                  <p className="text-[10px] text-slate-500">{u.email} | {u.course} ({u.yearLevel})</p>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => handleModuleRedirect('student_records')}
              className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              View Full Student Records Module <ExternalLink className="w-4 h-4" />
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
          subtitle="Strict Schedule Conflict Policy Enforced"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                  Hindi Maaaring I-approve ang Appointment
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
              Paunawa: Hangga't hindi pa nagiging "Completed" ang naunang appointment sa oras na ito, hindi puwedeng mag-apruba ng panibagong appointment sa parehong slot. Gamitin ang Reschedule upang magtakda ng ibang oras.
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
    </div>
  );
};

