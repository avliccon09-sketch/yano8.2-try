import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import {
  getAppointments,
  createAppointment,
} from '../../services/storage';
import { Calendar, Clock, Plus, CheckCircle2, AlertCircle, Star, Send, XCircle, RotateCcw, ExternalLink, ShieldCheck } from 'lucide-react';

const GOOGLE_FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScNdiXXAePbStheorox7q1WM1onz4TG7WY6UwMShfJ8OWzVRg/viewform?usp=header';

interface StudentAppointmentsModuleProps {
  user: User;
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

export const StudentAppointmentsModule: React.FC<StudentAppointmentsModuleProps> = ({ user }) => {
  const [appointments, setAppointments] = useState(() => getAppointments('STUDENT'));

  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const refreshList = () => {
    setAppointments(getAppointments('STUDENT'));
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
  }, []);

  const studentIdVal = user.studentId || user.id;
  const studentAppointments = appointments
    .filter((a) => a.studentId === studentIdVal || a.studentEmail === user.email)
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || a.date || a.preferredDate).getTime() || 0;
      const timeB = new Date(b.createdAt || b.date || b.preferredDate).getTime() || 0;
      return timeB - timeA;
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    if (!privacyConsent) {
      alert('Mangyaring basahin at lagyan ng tsek ang Data Privacy Consent bago magsumite ng student grievance.');
      return;
    }

    createAppointment(user, description, preferredDate, preferredTime);
    setDescription('');
    setPrivacyConsent(false);
    setSuccessMessage('Student grievance request successfully submitted to OSAS Admin!');
    setTimeout(() => setSuccessMessage(''), 5000);
    refreshList();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Book Appointment / Report Grievance Form (Col 5) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Report Grievance
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Submit a confidential student grievance or request a session with OSAS Admin & Guidance Counselors
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Concern / Purpose of Student Grievance *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the nature of your student grievance, inquiry, or incident details..."
              className="w-full p-3.5 text-xs border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Hearing / Consultation Date *
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Time *
              </label>
              <input
                type="time"
                required
                value={formatTime24h(preferredTime)}
                onChange={(e) => setPreferredTime(formatTime12h(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* Data Privacy & Confidentiality Consent (RA 10173) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Confidentiality & Privacy Notice (RA 10173)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Student grievance details and stated concerns are treated with utmost confidentiality by the OSAS and Guidance Counseling office. Personal records are processed strictly in accordance with Republic Act No. 10173 and Guidance Counselor professional ethics.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer shrink-0"
              />
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                I give consent to DCC OSAS & Guidance to process my student grievance and inquiry with strict confidentiality pursuant to RA 10173. *
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!privacyConsent}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-2xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-blue-500/20"
          >
            <Send className="w-4 h-4" /> Submit Student Grievance
          </button>
        </form>
      </div>

      {/* Student's Grievance List (Col 7) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              My Student Grievances History & Live Status
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Real-time updates, hearing schedule notices, and resolution status
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {studentAppointments.length} Student Grievances
          </span>
        </div>

        <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
          {studentAppointments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                You have not submitted any student grievances yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use the form on the left to submit a student grievance.</p>
            </div>
          ) : (
            studentAppointments.map((app) => {
              const isCompleted = app.status === 'COMPLETED';
              const isRejected = app.status === 'REJECTED';

              return (
                <div
                  key={app.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{app.description}</h4>
                      <p className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-bold">
                        Requested Hearing / Consultation: {app.preferredDate} @ {app.preferredTime}
                      </p>

                      {app.adminPreferredDate && (
                        <div className="mt-2 p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1">
                          <p className="text-[11px] font-mono text-purple-900 dark:text-purple-300 font-bold">
                            📅 OSAS Admin Scheduled / Rescheduled: {app.adminPreferredDate} @ {app.adminPreferredTime}
                          </p>
                          {(app.adminNotes || app.rescheduleReason) && (
                            <div className="text-[11px] text-purple-800 dark:text-purple-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-100 dark:border-purple-900/60">
                              <span className="font-black text-purple-900 dark:text-purple-300 block text-[10px] uppercase">
                                Reason for Schedule Change / Notice:
                              </span>
                              {app.adminNotes || app.rescheduleReason}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Referred to Guidance Banner */}
                      {app.status === 'REFERRED_TO_GUIDANCE' && (
                        <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1">
                          <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Referred to Guidance Office
                          </p>
                          <p className="text-[10px] text-indigo-800 dark:text-indigo-300">
                            {app.guidanceReferralNotes || 'Your student grievance has been referred to Guidance Counseling Office for specialized consultation.'}
                          </p>
                        </div>
                      )}

                      {/* Rejection Notice Banner */}
                      {isRejected && (
                        <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-1">
                          <p className="text-[11px] font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> Student Grievance Request Declined
                          </p>
                          {app.adminNotes && (
                            <p className="text-[10px] text-red-800 dark:text-red-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-red-100 dark:border-red-900/60">
                              OSAS Note: {app.adminNotes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 text-[10px] font-black rounded-full border shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                          : isRejected
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300'
                          : app.status === 'APPROVED'
                          ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300'
                          : app.status === 'RESCHEDULED'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300'
                          : app.status === 'REFERRED_TO_GUIDANCE'
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                      }`}
                    >
                      {app.status === 'REFERRED_TO_GUIDANCE' ? 'REFERRED TO GUIDANCE' : app.status}
                    </span>
                  </div>

                  {/* Status / Completion Info */}
                  {!isRejected && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                      {isCompleted ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Student grievance consultation / review session completed by OSAS Guidance Office</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Rating and evaluation will open once OSAS Admin completes your student grievance review.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback Section for COMPLETED appointments */}
                  {isCompleted && (
                    <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                          How was your student grievance consultation / session?
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              GOOGLE_FEEDBACK_FORM_URL,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Open Google Form Feedback"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Leave Feedback</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
