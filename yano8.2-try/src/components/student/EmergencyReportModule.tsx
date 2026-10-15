import React, { useState, useEffect } from 'react';
import {
  User,
  DisciplinaryReport,
  IncidentType,
  DisciplinaryReporterRole,
} from '../../types';
import {
  getDisciplinaryReports,
  submitDisciplinaryReport,
} from '../../services/storage';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  History,
  MapPin,
  Eye,
  X,
  FileText,
  AlertCircle,
  Shield,
  Send,
  User as UserIcon,
  AlertOctagon,
  Tag,
  Paperclip,
  Check,
  Search,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface EmergencyReportModuleProps {
  user: User;
}

const INCIDENT_TYPES: IncidentType[] = [
  'Incident',
  'Disciplinary',
];

const REPORTER_ROLES: DisciplinaryReporterRole[] = ['Student', 'Anonymous Reporter'];

export const EmergencyReportModule: React.FC<EmergencyReportModuleProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Check if a report was filed BY this logged-in student
  const isFiledByMe = (rep: DisciplinaryReport): boolean => {
    if (rep.reporterUserId && rep.reporterUserId === user.id) return true;
    if (user.studentId && rep.reporterStudentId && rep.reporterStudentId.trim().toLowerCase() === user.studentId.trim().toLowerCase()) return true;
    if (rep.reporterStudentId && rep.reporterStudentId.trim().toLowerCase() === user.id.trim().toLowerCase()) return true;
    if (!rep.isAnonymousReporter && rep.reporterName && rep.reporterName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) {
      return true;
    }
    return false;
  };

  // Form State
  const [reporterRole, setReporterRole] = useState<DisciplinaryReporterRole>('Student');
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');
  const [reportedStudentName, setReportedStudentName] = useState('');
  const [reportedStudentId, setReportedStudentId] = useState('');
  const [reportedStudentCourse, setReportedStudentCourse] = useState('');
  const [reportedStudentYearLevel, setReportedStudentYearLevel] = useState('');
  const [incidentType, setIncidentType] = useState<IncidentType>('Incident');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // History / View details modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportDetail, setSelectedReportDetail] = useState<DisciplinaryReport | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Auto-generated current date & time representation
  const [currentTimestamp, setCurrentTimestamp] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(new Date().toLocaleString());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [myReports, setMyReports] = useState<DisciplinaryReport[]>(() =>
    getDisciplinaryReports().filter(isFiledByMe)
  );

  const refreshReports = () => {
    setMyReports(getDisciplinaryReports().filter(isFiledByMe));
  };

  useEffect(() => {
    refreshReports();
    window.addEventListener('osas_storage_updated', refreshReports);
    window.addEventListener('storage', refreshReports);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshReports);
      window.removeEventListener('storage', refreshReports);
    };
  }, [user]);

  const isAnonymous = reporterRole === 'Anonymous Reporter';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawUrl = reader.result as string;
        if (rawUrl && rawUrl.startsWith('data:image')) {
          try {
            const compressed = await compressImage(rawUrl, 800, 800, 0.7);
            setEvidenceUrl(compressed);
          } catch {
            setEvidenceUrl(rawUrl);
          }
        } else {
          setEvidenceUrl(rawUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearFile = () => {
    setEvidenceFileName('');
    setEvidenceUrl('');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!reportedStudentName.trim()) {
      setFormError('Please enter the name of the reported student or group.');
      return;
    }

    if (!location.trim()) {
      setFormError('Please specify the campus location of the incident.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setFormError('Please provide a descriptive explanation of what occurred (minimum 10 characters).');
      return;
    }

    if (!declarationAccepted) {
      setFormError('You must check the declaration box confirming the accuracy and good faith of your report.');
      return;
    }

    setIsSubmitting(true);

    try {
      submitDisciplinaryReport(
        {
          reportedStudentName,
          reportedStudentId: reportedStudentId.trim() || undefined,
          reportedStudentCourse: reportedStudentCourse.trim() || undefined,
          reportedStudentYearLevel: reportedStudentYearLevel.trim() || undefined,
          incidentType,
          description,
          location,
          reporterRole,
          isAnonymousReporter: isAnonymous,
          evidenceFileName: evidenceFileName || undefined,
          evidenceUrl: evidenceUrl || undefined,
          contactNumber: isAnonymous ? undefined : contactNumber.trim() || undefined,
          declarationAccepted: true,
        },
        user
      );

      // Reset form
      setReportedStudentName('');
      setReportedStudentId('');
      setReportedStudentCourse('');
      setReportedStudentYearLevel('');
      setDescription('');
      setLocation('');
      setReporterRole('Student');
      setEvidenceFileName('');
      setEvidenceUrl('');
      setDeclarationAccepted(false);

      refreshReports();
      setSubmittedSuccess(true);
      setActiveTab('history');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
            RESOLVED
          </span>
        );
      case 'UNDER_INVESTIGATION':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 animate-pulse">
            UNDER INVESTIGATION
          </span>
        );
      case 'SANCTIONED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300">
            SANCTIONED
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300">
            DISMISSED
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300">
            PENDING REVIEW
          </span>
        );
    }
  };

  const filteredHistory = myReports.filter((rep) => {
    const q = searchQuery.toLowerCase();
    return (
      rep.id.toLowerCase().includes(q) ||
      rep.reportedStudentName.toLowerCase().includes(q) ||
      (rep.incidentType && rep.incidentType.toLowerCase().includes(q)) ||
      rep.location.toLowerCase().includes(q) ||
      rep.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Student Report and Concern Services
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official OSAS Incident & Violation Reporting System with Real-Time Investigation Tracking
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Report and Concern & Report History placed below the title */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              setActiveTab('submit');
              setSubmittedSuccess(false);
            }}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Report and Concern</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full sm:w-auto justify-center px-4 py-2.5 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Report History</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                activeTab === 'history' ? 'bg-white text-red-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {myReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submittedSuccess && (
        <div className="max-w-4xl mx-auto p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-black uppercase">Report Successfully Filed</h4>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Your incident report has been securely routed to the OSAS Admin. You can track investigation notes and status updates under Incident Report History below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSubmittedSuccess(false)}
            className="p-1 hover:bg-emerald-200/50 rounded-lg text-emerald-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: SUBMIT OSAAS INCIDENT AND VIOLATION REPORT FORM */}
      {activeTab === 'submit' && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                OSAS Incident and Violation Report Form
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official Incident Reporting & Grievance Concern Form
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-6">
            {/* Section 1: Reporter Information */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Report Information
                  </h4>
                </div>

                {/* Reported By Dropdown */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Reported By:
                  </label>
                  <select
                    value={reporterRole}
                    onChange={(e) => setReporterRole(e.target.value as DisciplinaryReporterRole)}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-red-500"
                  >
                    {REPORTER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAnonymous ? (
                <div className="p-4 bg-slate-900 text-white dark:bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white flex items-center gap-2">
                      <span>Anonymous Reporter Protected</span>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                        Identity Hidden
                      </span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Your name, student ID, and contact details are masked. This report will be tagged and filed as &quot;Anonymous Reporter&quot;.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Student ID Number
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.studentId || user.id}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.fullName}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Course & Year Level
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`${user.course || 'BSBA'} - ${user.yearLevel || '1st Year'}`}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. 09171234567"
                      className="w-full max-w-xs px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Type of Incident / Violation: Positioned below Report Information and above Reported Student/Person Information */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-red-600 dark:text-red-400" />
                Type of Incident / Violation *
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs cursor-pointer focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="Incident">Incident</option>
                <option value="Disciplinary">Disciplinary</option>
              </select>
            </div>

            {/* Section 2: Reported Student Information */}
            <div className="p-4 bg-red-50/40 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h4 className="text-xs font-black text-red-900 dark:text-red-200 uppercase tracking-wider">
                  Reported Student / Person Information *
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reported Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reportedStudentName}
                    onChange={(e) => setReportedStudentName(e.target.value)}
                    placeholder="Full name of student or group..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID Number (If Known)
                  </label>
                  <input
                    type="text"
                    value={reportedStudentId}
                    onChange={(e) => setReportedStudentId(e.target.value)}
                    placeholder="e.g. 2026-000001"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Course & Year (If Known)
                  </label>
                  <input
                    type="text"
                    value={reportedStudentCourse}
                    onChange={(e) => setReportedStudentCourse(e.target.value)}
                    placeholder="e.g. BSBA - 2nd Year"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Incident Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Campus Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Building A 2nd Floor, Restroom..."
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto-Generated Date & Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date & Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      disabled
                      value={currentTimestamp}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Description and Narrative */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description and Narrative *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a detailed narrative of the violation or concern observed (who, what, exact context, witnesses, or immediate circumstances)..."
                  className="w-full p-3.5 text-xs border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* File / Evidence Upload */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supporting Evidence (Photo, Screenshot, PDF, or Document - Optional)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 hover:border-red-500 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                    <Paperclip className="w-4 h-4 text-red-600" />
                    <span>Choose File...</span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {evidenceFileName ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-xs">{evidenceFileName}</span>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">No file chosen (optional)</span>
                  )}
                </div>

                {evidenceUrl && evidenceUrl.startsWith('data:image/') && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={evidenceUrl}
                      alt="Uploaded preview"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer"
                      onClick={() => setSelectedPreviewImage(evidenceUrl)}
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Click to view full size</span>
                  </div>
                )}
              </div>

              {/* Declaration & Data Privacy Checkbox */}
              <div className="p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-2">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-bold uppercase text-red-900 dark:text-red-300">
                  <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Data Privacy (RA 10173) & Good Faith Declaration</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Information submitted in this report is treated with strict confidentiality by the OSAS Office under Republic Act No. 10173. Identity details are protected in good faith to facilitate fair administrative inquiry.
                </p>
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    I certify that this report is true, accurate, and submitted in good faith, and I give consent to DCC OSAS to process these details for official incident review pursuant to RA 10173. *
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting || !declarationAccepted}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Incident Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: FUNCTIONAL INCIDENT REPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-red-600" />
                Incident Report History & Tracking ({myReports.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Monitor status updates, administrative investigations, and feedback on reports you submitted
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your reports..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No incident reports found.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {myReports.length === 0
                  ? 'You have not submitted any incident reports or concerns yet.'
                  : 'No reports match your search query.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((rep) => {
                return (
                  <div
                    key={rep.id}
                    className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 hover:border-red-300 dark:hover:border-red-800 transition-all shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg uppercase bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                          {rep.incidentType}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">Report #{rep.id}</span>
                      </div>
                      {getStatusBadge(rep.status)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Offender</span>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {rep.reportedStudentName} {rep.reportedStudentId ? `(${rep.reportedStudentId})` : ''}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Location & Date</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {rep.location} • {new Date(rep.submittedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Filing Mode</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {rep.isAnonymousReporter ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <Shield className="w-3 h-3" /> Anonymous
                            </span>
                          ) : (
                            'Standard (Identity Visible)'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Report Narrative:</span>
                      {rep.description}
                    </div>

                    {rep.evidenceFileName && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Attached Evidence: {rep.evidenceFileName}</span>
                      </div>
                    )}

                    {/* OSAS Admin Investigation Feedback / Directive */}
                    {rep.investigationNotes ? (
                      <div className="p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-blue-900 dark:text-blue-200 uppercase text-[10px]">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          OSAS Admin Investigation Feedback & Action
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed whitespace-pre-line">
                          {rep.investigationNotes}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Under initial OSAS intake and assessment. Feedback will appear here once reviewed.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Lightbox */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-800 text-white rounded-full hover:bg-slate-700 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={selectedPreviewImage} alt="Evidence Full Preview" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
