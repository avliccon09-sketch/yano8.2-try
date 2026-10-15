import React, { useState, useEffect } from 'react';
import {
  getDisciplinaryReports,
  updateDisciplinaryReportStatus,
  updateDisciplinaryReportReview,
  createDisciplinaryRecordFromReport,
  archiveDisciplinaryReport,
} from '../../services/storage';
import {
  DisciplinaryReport,
  DisciplinaryReportStatus,
  ReportClassificationCategory,
  IncidentType,
  DisciplinaryReporterRole,
  DisciplinaryActionTaken,
} from '../../types';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Search,
  Archive,
  Eye,
  X,
  FileText,
  AlertOctagon,
  Tag,
  MapPin,
  Calendar,
  User,
  Shield,
  Paperclip,
  MessageSquare,
  Sparkles,
  Layers,
  FileCheck,
  Scale,
  Send,
  Printer,
} from 'lucide-react';
import { CollegeLogo } from '../common/CollegeLogo';

const INCIDENT_TYPES: IncidentType[] = [
  'Tobacco/Nicotine use',
  'Vaping',
  'Possession of Prohibited Items',
  'Discipline',
  'Others',
];

const REPORTER_ROLES: DisciplinaryReporterRole[] = [
  'Security Personnel',
  'Faculty/Staff',
  'OSAS Officer',
  'Student',
  'Anonymous Reporter',
];

const ACTION_TAKEN_OPTIONS: DisciplinaryActionTaken[] = [
  'Verbal Warning Issued',
  'Written Warning Issued',
  'Others',
];

export const SafetyReportsModule: React.FC = () => {
  const [reports, setReports] = useState<DisciplinaryReport[]>(() => getDisciplinaryReports());

  const refreshData = () => {
    setReports(getDisciplinaryReports());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('osas_storage_updated', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Review Modal state
  const [selectedReport, setSelectedReport] = useState<DisciplinaryReport | null>(null);
  const [reviewCategory, setReviewCategory] = useState<ReportClassificationCategory>('Incident');
  const [grievanceNotes, setGrievanceNotes] = useState('');
  const [grievanceStatus, setGrievanceStatus] = useState<DisciplinaryReportStatus>('UNDER_INVESTIGATION');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [incidentStatus, setIncidentStatus] = useState<DisciplinaryReportStatus>('UNDER_INVESTIGATION');
  const [disciplinaryNotes, setDisciplinaryNotes] = useState('');

  // Create Disciplinary Record Modal State
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [recordTargetReport, setRecordTargetReport] = useState<DisciplinaryReport | null>(null);
  const [recordStudentName, setRecordStudentName] = useState('');
  const [recordStudentId, setRecordStudentId] = useState('');
  const [recordStudentCourse, setRecordStudentCourse] = useState('');
  const [recordStudentYearLevel, setRecordStudentYearLevel] = useState('');
  const [recordOffenseType, setRecordOffenseType] = useState<string>('Tobacco/Nicotine use');
  const [recordDescription, setRecordDescription] = useState('');
  const [recordSanction, setRecordSanction] = useState('');
  const [recordReportedBy, setRecordReportedBy] = useState<DisciplinaryReporterRole>('Student');
  const [recordActionTaken, setRecordActionTaken] = useState<DisciplinaryActionTaken>('Verbal Warning Issued');
  const [recordActionTakenOther, setRecordActionTakenOther] = useState('');
  const [recordStartDate, setRecordStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordEndDate, setRecordEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [recordInitialStatus, setRecordInitialStatus] = useState<'SANCTIONED' | 'COMPLETED'>('SANCTIONED');
  const [recordRemarks, setRecordRemarks] = useState('');

  // Confirm Archive Report Modal State
  const [confirmArchiveReport, setConfirmArchiveReport] = useState<DisciplinaryReport | null>(null);

  // Evidence Preview Lightbox
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Official Incident Report & Proof Photo Print State
  const [printReport, setPrintReport] = useState<DisciplinaryReport | null>(null);

  // Filter reports
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.reportedStudentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.reportedStudentId && rep.reportedStudentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rep.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!rep.isAnonymousReporter && rep.reporterName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || rep.incidentType === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleOpenReportReview = (rep: DisciplinaryReport) => {
    setSelectedReport(rep);
    const initialCategory: ReportClassificationCategory =
      rep.classificationCategory || (rep.incidentType === 'Discipline' ? 'Disciplinary' : 'Incident');
    setReviewCategory(initialCategory);
    setGrievanceNotes(rep.grievanceResolutionNotes || rep.investigationNotes || '');
    setGrievanceStatus(rep.status || 'UNDER_INVESTIGATION');
    setIncidentNotes(rep.incidentDocumentationNotes || rep.investigationNotes || '');
    setIncidentStatus(rep.status || 'UNDER_INVESTIGATION');
    setDisciplinaryNotes(rep.disciplinaryEvaluationNotes || rep.investigationNotes || '');
  };

  const handleSaveGrievanceReview = () => {
    if (!selectedReport) return;
    updateDisciplinaryReportReview(
      selectedReport.id,
      {
        classificationCategory: 'Grievance',
        status: grievanceStatus,
        grievanceResolutionNotes: grievanceNotes,
        investigationNotes: grievanceNotes,
      },
      'Princess Ann T. Ruzol (Admin)'
    );
    setSelectedReport(null);
    refreshData();
  };

  const handleResolveGrievance = () => {
    if (!selectedReport) return;
    updateDisciplinaryReportReview(
      selectedReport.id,
      {
        classificationCategory: 'Grievance',
        status: 'RESOLVED',
        grievanceResolutionNotes:
          grievanceNotes || 'Grievance amicably resolved and settled under OSAS guidance and conciliation.',
        investigationNotes:
          grievanceNotes || 'Grievance amicably resolved and settled under OSAS guidance and conciliation.',
      },
      'Princess Ann T. Ruzol (Admin)'
    );
    setSelectedReport(null);
    refreshData();
  };

  const handleSaveIncidentDocumentation = () => {
    if (!selectedReport) return;
    updateDisciplinaryReportReview(
      selectedReport.id,
      {
        classificationCategory: 'Incident',
        status: incidentStatus,
        incidentDocumentationNotes: incidentNotes,
        investigationNotes: incidentNotes,
      },
      'Princess Ann T. Ruzol (Admin)'
    );
    setSelectedReport(null);
    refreshData();
  };

  const handleResolveIncident = () => {
    if (!selectedReport) return;
    updateDisciplinaryReportReview(
      selectedReport.id,
      {
        classificationCategory: 'Incident',
        status: 'RESOLVED',
        incidentDocumentationNotes:
          incidentNotes || 'Incident facts verified, documented, and officially concluded by OSAS.',
        investigationNotes:
          incidentNotes || 'Incident facts verified, documented, and officially concluded by OSAS.',
      },
      'Princess Ann T. Ruzol (Admin)'
    );
    setSelectedReport(null);
    refreshData();
  };

  const handleOpenCreateRecordModal = (rep: DisciplinaryReport) => {
    setRecordTargetReport(rep);
    setRecordStudentName(rep.reportedStudentName);
    setRecordStudentId(rep.reportedStudentId || '');
    setRecordStudentCourse(rep.reportedStudentCourse || '');
    setRecordStudentYearLevel(rep.reportedStudentYearLevel || '');
    setRecordOffenseType(rep.incidentType);
    setRecordDescription(rep.description);
    setRecordSanction('Campus Service & Conduct Counseling with OSAS');
    setRecordReportedBy(
      (rep.reporterRole as DisciplinaryReporterRole) ||
        (rep.isAnonymousReporter ? 'Anonymous Reporter' : 'Student')
    );
    setRecordActionTaken((rep.actionTaken as DisciplinaryActionTaken) || 'Verbal Warning Issued');
    setRecordActionTakenOther(rep.actionTakenOther || '');
    setRecordInitialStatus('SANCTIONED');
    setRecordRemarks(
      `Formally created from Incident Report #${rep.id}. Findings: ${disciplinaryNotes || 'Violation confirmed upon administrative review.'}`
    );
    setIsCreatingRecord(true);
  };

  const handleSaveDisciplinaryRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTargetReport) return;

    createDisciplinaryRecordFromReport(
      recordTargetReport.id,
      {
        studentName: recordStudentName,
        studentId: recordStudentId,
        course: recordStudentCourse || undefined,
        yearLevel: recordStudentYearLevel || undefined,
        offenseType: recordOffenseType,
        description: recordDescription,
        sanction: recordSanction,
        reportedBy: recordReportedBy,
        actionTaken: recordActionTaken,
        actionTakenOther: recordActionTaken === 'Others' ? recordActionTakenOther : undefined,
        status: recordInitialStatus,
        startDate: recordStartDate,
        completionDate: recordEndDate,
        remarks: recordRemarks,
      },
      'Princess Ann T. Ruzol (Admin)'
    );

    setIsCreatingRecord(false);
    setSelectedReport(null);
    refreshData();
  };

  return (
    <div className={`space-y-6 ${printReport ? 'print:hidden' : ''}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-800 rounded-3xl p-6 text-white shadow-xl relative border-2 border-red-400/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <ShieldAlert className="w-4 h-4 text-yellow-300 animate-pulse" /> Student Reports & Incident Intake Center
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">OSAS Reports/Concerns Management</h2>
            <p className="text-xs text-red-100 max-w-2xl leading-relaxed">
              Primary intake and receiving hub for all student incident reports and concerns. Review submitted reports, classify into Grievance, Incident, or Disciplinary, and process appropriate resolution or official disciplinary actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
              <span className="text-2xl font-black text-yellow-300 block">{reports.length}</span>
              <span className="text-[10px] text-red-100 font-bold uppercase tracking-wider">Total Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reports Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, ID, reporter, location, description..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Incident Types</option>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
              <option value="UNDER_INVESTIGATION">Under Investigation</option>
              <option value="SANCTIONED">Sanctioned</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Reports Grid/List */}
        {filteredReports.length === 0 ? (
          <div className="py-14 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No incident reports or concerns found.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {reports.length === 0
                ? 'All student reports from Report/Concern will automatically appear here for intake.'
                : 'Adjust your search query or status filter to locate reports.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((rep) => {
              const isUnderInvest = rep.status === 'UNDER_INVESTIGATION';
              const isSanctioned = rep.status === 'SANCTIONED';
              const isSubmitted = rep.status === 'SUBMITTED';

              return (
                <div
                  key={rep.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between gap-3 hover:border-red-300 dark:hover:border-red-700 transition-all shadow-2xs"
                >
                  <div className="space-y-3">
                    {/* Badge & Status Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                          {rep.incidentType}
                        </span>
                        {rep.classificationCategory && (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {rep.classificationCategory}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border ${
                          isSanctioned
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300'
                            : isUnderInvest
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 animate-pulse'
                            : isSubmitted
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300'
                            : rep.status === 'RESOLVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300'
                        }`}
                      >
                        {rep.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Reported Student Details */}
                    <div>
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase">
                        Reported Student / Person:
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {rep.reportedStudentName}
                        {rep.reportedStudentId ? ` (${rep.reportedStudentId})` : ''}
                      </h4>
                      {(rep.reportedStudentCourse || rep.reportedStudentYearLevel) && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {rep.reportedStudentCourse} {rep.reportedStudentYearLevel ? `• ${rep.reportedStudentYearLevel}` : ''}
                        </p>
                      )}
                    </div>

                    {/* Location & Time */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        {rep.location}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {new Date(rep.submittedAt).toLocaleDateString()} @{' '}
                        {new Date(rep.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 line-clamp-2 leading-relaxed">
                      {rep.description}
                    </p>

                    {/* Reported By & Action Taken Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported By</span>
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {rep.isAnonymousReporter || rep.reporterRole === 'Anonymous Reporter' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                              <Shield className="w-3 h-3 text-emerald-600" />
                              Anonymous Reporter
                            </span>
                          ) : (
                            <>
                              <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold">
                                {rep.reporterRole || 'Student'}
                              </span>
                              <span className="truncate">{rep.reporterName}</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Action Taken</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800 mt-0.5">
                          <Tag className="w-3 h-3 text-amber-600" />
                          {rep.actionTaken === 'Others' && rep.actionTakenOther
                            ? rep.actionTakenOther
                            : rep.actionTaken || 'Verbal Warning Issued'}
                        </span>
                      </div>
                    </div>

                    {rep.evidenceFileName && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                        <Paperclip className="w-3 h-3" /> Evidence Attached: {rep.evidenceFileName}
                      </div>
                    )}

                    {/* Investigation Note Preview if any */}
                    {rep.investigationNotes && (
                      <div className="p-2 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[10px] text-amber-900 dark:text-amber-200">
                        <span className="font-black block uppercase">Admin Note:</span>
                        <span className="line-clamp-1">{rep.investigationNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleOpenReportReview(rep)}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review & Investigate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: REVIEW & INVESTIGATE REPORT MODAL WITH CATEGORY WORKFLOW */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Review Student Report & Concern - #${selectedReport.id}`}
          subtitle={`Submitted on ${new Date(selectedReport.submittedAt).toLocaleString()}`}
          maxWidth="xl"
        >
          <div className={`space-y-4 p-2 text-xs ${printReport ? 'print:hidden' : ''}`}>
            {/* Header Status & Origin Information */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">Incident Type:</span>
                <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {selectedReport.incidentType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">Current Status:</span>
                <span className="px-2.5 py-1 text-[10px] font-black rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {selectedReport.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* PART 1: FULL SUBMITTED REPORT DETAILS */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" /> Submitted Student Report Details
              </h4>

              {/* Two-Column Information Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Reported Student Details */}
                <div className="p-3.5 bg-red-50/60 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60 space-y-1">
                  <span className="text-[10px] font-black text-red-900 dark:text-red-300 uppercase tracking-wider block">
                    Reported Student (Subject)
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedReport.reportedStudentName}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Student ID: <strong>{selectedReport.reportedStudentId || 'Not provided'}</strong>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Course & Year: <strong>{selectedReport.reportedStudentCourse || 'N/A'} - {selectedReport.reportedStudentYearLevel || 'N/A'}</strong>
                  </p>
                </div>

                {/* Reporter Details */}
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-1">
                  <span className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    Reported By (Complainant / Reporter)
                  </span>
                  {selectedReport.isAnonymousReporter || selectedReport.reporterRole === 'Anonymous Reporter' ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-lg border border-emerald-300 dark:border-emerald-800">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        Anonymous Reporter (Protected Identity)
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reporter identity is confidential under OSAS Student Protection policy.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {selectedReport.reporterName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Role: <strong>{selectedReport.reporterRole || 'Student'}</strong>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        ID Number: <strong>{selectedReport.reporterStudentId}</strong>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Course & Year: <strong>{selectedReport.reporterCourse} - {selectedReport.reporterYearLevel}</strong>
                      </p>
                      {selectedReport.reporterContactNumber && (
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Contact: <strong>{selectedReport.reporterContactNumber}</strong>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action Taken & Location Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Action Taken</span>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800">
                    <Tag className="w-3 h-3 text-amber-600" />
                    {selectedReport.actionTaken === 'Others' && selectedReport.actionTakenOther
                      ? selectedReport.actionTakenOther
                      : selectedReport.actionTaken || 'Verbal Warning Issued'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Campus Location</span>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {selectedReport.location}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Auto-Generated Timestamp</span>
                  <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {new Date(selectedReport.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Incident Description Narrative */}
              <div>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-1">
                  Incident Narrative & Description
                </span>
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                  {selectedReport.description}
                </div>
              </div>

              {/* Evidence details if any */}
              {selectedReport.evidenceFileName && (
                <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-xs">
                        Attached Evidence: {selectedReport.evidenceFileName}
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300">
                        Uploaded by reporter during submission
                      </span>
                    </div>
                  </div>
                  {selectedReport.evidenceUrl && selectedReport.evidenceUrl.startsWith('data:image/') ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewImage(selectedReport.evidenceUrl || null)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      View Image
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold rounded-md">
                      Verified File
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* PART 2: CATEGORY DROPDOWN SELECTOR */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-red-200 dark:border-red-900/60 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  Select Report Category / Review Path *
                </label>
                <select
                  value={reviewCategory}
                  onChange={(e) => setReviewCategory(e.target.value as ReportClassificationCategory)}
                  className="w-full px-3.5 py-2.5 text-xs font-black border-2 border-red-400 dark:border-red-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs cursor-pointer"
                >
                  <option value="Grievance">Grievance (Student Grievance Review & Resolution Process)</option>
                  <option value="Incident">Incident (Campus Incident Review, Documentation & Resolution)</option>
                  <option value="Disciplinary">Disciplinary (Disciplinary Action & Conduct Enforcement)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Choose the appropriate administrative path to handle this report according to institutional guidelines.
                </p>
              </div>

              {/* CONDITIONAL WORKFLOW: 1. GRIEVANCE */}
              {reviewCategory === 'Grievance' && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Scale className="w-4 h-4" />
                    <h5 className="font-black text-xs uppercase tracking-wider">
                      Student Grievance Review & Resolution Process
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Facilitate grievance conciliation, dialogue, or amicable settlement between involved parties. Record mediation findings and resolution agreements below.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Grievance Status *
                      </label>
                      <select
                        value={grievanceStatus}
                        onChange={(e) => setGrievanceStatus(e.target.value as DisciplinaryReportStatus)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION (Under Mediation / Dialogue)</option>
                        <option value="RESOLVED">RESOLVED (Grievance Settled / Mediated)</option>
                        <option value="DISMISSED">DISMISSED (Dismissed - Unsubstantiated)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Grievance Mediation & Resolution Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={grievanceNotes}
                      onChange={(e) => setGrievanceNotes(e.target.value)}
                      placeholder="Document mediation conference dates, agreements reached, counseling referrals, or terms of reconciliation..."
                      className="w-full p-3 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveGrievanceReview}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Grievance Review
                      </button>

                      <button
                        type="button"
                        onClick={handleResolveGrievance}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Settle Grievance
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintReport(selectedReport)}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Print report summary and attached proof photo"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Print Photo
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmArchiveReport(selectedReport)}
                        className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONDITIONAL WORKFLOW: 2. INCIDENT */}
              {reviewCategory === 'Incident' && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <FileCheck className="w-4 h-4" />
                    <h5 className="font-black text-xs uppercase tracking-wider">
                      Campus Incident Review, Documentation & Resolution
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Verify factual occurrences, campus security findings, property/safety measures, and log comprehensive documentation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Incident Status *
                      </label>
                      <select
                        value={incidentStatus}
                        onChange={(e) => setIncidentStatus(e.target.value as DisciplinaryReportStatus)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                      >
                        <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION (Under Incident Review)</option>
                        <option value="RESOLVED">RESOLVED (Documented & Concluded)</option>
                        <option value="DISMISSED">DISMISSED (Dismissed / Inconclusive)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Incident Documentation & Factual Findings:
                    </label>
                    <textarea
                      rows={3}
                      value={incidentNotes}
                      onChange={(e) => setIncidentNotes(e.target.value)}
                      placeholder="Record CCTV findings, witness statements, safety interventions made, campus security reports..."
                      className="w-full p-3 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveIncidentDocumentation}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Incident Documentation
                      </button>

                      <button
                        type="button"
                        onClick={handleResolveIncident}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conclude & Resolve Incident
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintReport(selectedReport)}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Print report summary and attached proof photo"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Print Photo
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmArchiveReport(selectedReport)}
                        className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CONDITIONAL WORKFLOW: 3. DISCIPLINARY */}
              {reviewCategory === 'Disciplinary' && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-800 space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertOctagon className="w-4 h-4" />
                    <h5 className="font-black text-xs uppercase tracking-wider">
                      Disciplinary Violation Assessment & Sanction Enforcement
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    If this incident constitutes an actionable violation of the Student Code of Conduct, you can proceed to create a formal Disciplinary Action. Saving the Disciplinary Action will automatically remove this report from Reports/Concerns and transfer it to <strong>OSAS Admin &gt; Disciplinary Records &gt; Official Records</strong> and update the student&apos;s disciplinary history.
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Disciplinary Assessment / Hearing Findings:
                    </label>
                    <textarea
                      rows={2}
                      value={disciplinaryNotes}
                      onChange={(e) => setDisciplinaryNotes(e.target.value)}
                      placeholder="Violation established, handbook clause reference, or committee remarks..."
                      className="w-full p-3 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateRecordModal(selectedReport)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider"
                    >
                      <AlertOctagon className="w-4 h-4" /> Create Disciplinary Action
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintReport(selectedReport)}
                        className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Print report summary and attached proof photo"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Print Photo
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmArchiveReport(selectedReport)}
                        className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" /> Archive Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: PRINT INCIDENT REPORT & PROOF PHOTO PREVIEW */}
      {printReport && (
        <Modal
          isOpen={true}
          onClose={() => setPrintReport(null)}
          title={`Print Preview - Incident Report & Proof Photo #${printReport.id}`}
          subtitle={`${printReport.incidentType} • Submitted on ${new Date(printReport.submittedAt).toLocaleDateString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 print:p-0">
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    Incident Report & Photo Evidence Slip
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Review the document layout and proof photo below, then proceed with the final print.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintReport(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300 dark:border-slate-600 shadow-2xs"
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Photo Slip
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div
              id="printable-report-photo-slip"
              className="printable-document flex flex-col justify-between min-h-0 bg-white text-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 print:border-none print:p-0"
            >
              <div className="printable-body flex-1 space-y-4">
                {/* 1. Institutional Header */}
                <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                  <div className="flex items-center justify-center gap-3 mb-1.5">
                    <CollegeLogo className="w-12 h-12" />
                    <div>
                      <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                        Dingalan Community College
                      </h1>
                      <p className="text-xs font-bold text-slate-700 uppercase">
                        Office of Student Affairs and Services (OSAS)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Campus Safety, Incident Review & Student Protection Records
                      </p>
                    </div>
                  </div>
                  <div className="inline-block bg-red-800 text-white py-1 px-4 rounded text-xs font-black uppercase tracking-widest">
                    Official Incident Report & Photo Evidence Slip
                  </div>
                </div>

                {/* 2. Metadata Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Report ID</span>
                    <span className="font-mono font-bold text-slate-900">#{printReport.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Incident Type</span>
                    <span className="font-bold text-red-700 block truncate">{printReport.incidentType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Status</span>
                    <span className="font-bold text-slate-800 uppercase">{printReport.status.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Date Submitted</span>
                    <span className="font-bold text-slate-900">{new Date(printReport.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 3. Subject and Reporter Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-1">
                    <p className="font-black text-[10px] uppercase text-red-800 tracking-wider border-b border-slate-200 pb-1">
                      Subject: Reported Student Information
                    </p>
                    <p><strong>Full Name:</strong> {printReport.reportedStudentName}</p>
                    <p><strong>Student ID:</strong> {printReport.reportedStudentId || 'N/A'}</p>
                    <p><strong>Course & Year:</strong> {printReport.reportedStudentCourse || 'N/A'} - {printReport.reportedStudentYearLevel || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-300 space-y-1">
                    <p className="font-black text-[10px] uppercase text-blue-800 tracking-wider border-b border-slate-200 pb-1">
                      Reporter / Complainant Details
                    </p>
                    {printReport.isAnonymousReporter || printReport.reporterRole === 'Anonymous Reporter' ? (
                      <>
                        <p><strong>Reporter Identity:</strong> Confidential (Protected Identity)</p>
                        <p><strong>Role:</strong> Student Reporter</p>
                        <p className="text-[10px] text-slate-500 italic">Protected under OSAS Student Protection Policy.</p>
                      </>
                    ) : (
                      <>
                        <p><strong>Full Name:</strong> {printReport.reporterName}</p>
                        <p><strong>Role:</strong> {printReport.reporterRole || 'Student'}</p>
                        <p><strong>Student ID / Course:</strong> {printReport.reporterStudentId || 'N/A'} ({printReport.reporterCourse || 'N/A'})</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 4. Incident Narrative & Occurrence */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <p className="font-black text-[10px] uppercase text-slate-700 tracking-wider">
                      Incident Occurrence & Narrative Details
                    </p>
                    <span className="text-[10px] text-slate-600">
                      <strong>Location:</strong> {printReport.location} • <strong>Action Taken:</strong> {printReport.actionTaken === 'Others' && printReport.actionTakenOther ? printReport.actionTakenOther : printReport.actionTaken || 'Verbal Warning Issued'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                    {printReport.description}
                  </div>
                </div>

                {/* 5. Administrative Notes (if any) */}
                {(printReport.incidentDocumentationNotes || printReport.investigationNotes || printReport.grievanceResolutionNotes || printReport.disciplinaryEvaluationNotes) && (
                  <div className="border border-slate-300 rounded-lg p-3 space-y-1 text-xs">
                    <p className="font-black text-[10px] uppercase text-slate-700 tracking-wider border-b border-slate-200 pb-1">
                      Administrative Findings & Documentation Notes
                    </p>
                    <p className="text-slate-800 leading-relaxed text-xs">
                      {printReport.incidentDocumentationNotes || printReport.investigationNotes || printReport.grievanceResolutionNotes || printReport.disciplinaryEvaluationNotes}
                    </p>
                  </div>
                )}

                {/* 6. Proof Photos & Attached Evidence (At the bottom of the document) */}
                <div className="border border-slate-300 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <p className="font-black text-[10px] uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                      Attached Proof Photo & Incident Evidence
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {printReport.evidenceFileName ? `File: ${printReport.evidenceFileName}` : 'Photographic Record'}
                    </span>
                  </div>

                  {printReport.evidenceUrl ? (
                    <div className="space-y-2">
                      <div className="flex flex-col items-center justify-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <img
                          src={printReport.evidenceUrl}
                          alt={printReport.evidenceFileName || 'Incident Evidence Photo'}
                          className="max-h-72 max-w-full object-contain rounded-md shadow-2xs border border-slate-300 bg-white"
                        />
                        <p className="text-[10px] text-slate-600 font-semibold mt-1.5 text-center">
                          Figure 1: {printReport.evidenceFileName || 'Official Photo Evidence'} — Submitted by Reporter for Case #{printReport.id}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700">
                        {printReport.evidenceFileName ? `Attached File: ${printReport.evidenceFileName}` : 'No Photographic Image Attached'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        This report was filed as a physical or verbal incident complaint. All factual findings documented above serve as the verified case record.
                      </p>
                    </div>
                  )}
                </div>

                {/* 7. Institutional Signatures */}
                <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-center">
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Reviewed & Documented By:</p>
                    <div className="border-b border-slate-800 mx-6" />
                    <div>
                      <p className="font-black text-slate-900 text-xs">Princess Ann T. Ruzol</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">OSAS Administrator</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Official Institutional Endorsement:</p>
                    <div className="border-b border-slate-800 mx-6" />
                    <div>
                      <p className="font-black text-slate-900 text-xs">Dingalan Community College</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">Office of Student Affairs and Services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CREATE OFFICIAL DISCIPLINARY RECORD FROM REPORT */}
      {isCreatingRecord && recordTargetReport && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreatingRecord(false)}
          title={`Disciplinary Action Form - ${recordStudentName}`}
          subtitle={`Officially recording from Report #${recordTargetReport.id}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveDisciplinaryRecord} className="space-y-4 p-2 text-xs">
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-2xl text-red-900 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="font-semibold text-xs leading-relaxed">
                Saving this will officially record this disciplinary action under <strong>Disciplinary Records &gt; Official Records</strong>, create a record on the student&apos;s official profile, and automatically remove this report from Reports/Concerns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={recordStudentName}
                  onChange={(e) => setRecordStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student ID Number *
                </label>
                <input
                  type="text"
                  required
                  value={recordStudentId}
                  onChange={(e) => setRecordStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Offense Type / Category *
                </label>
                <select
                  value={recordOffenseType}
                  onChange={(e) => setRecordOffenseType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="Minor Offense - ID Tag Violation">Minor Offense - ID Tag Violation</option>
                  <option value="Minor Offense - Class Disruption">Minor Offense - Class Disruption</option>
                  <option value="Major Offense - Academic Dishonesty">Major Offense - Academic Dishonesty</option>
                  <option value="Major Offense - Physical Altercation">Major Offense - Physical Altercation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Status *
                </label>
                <select
                  value={recordInitialStatus}
                  onChange={(e) => setRecordInitialStatus(e.target.value as 'SANCTIONED' | 'COMPLETED')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="SANCTIONED">SANCTIONED (Active / Pending Sanction)</option>
                  <option value="COMPLETED">COMPLETED (Sanction Served)</option>
                </select>
              </div>
            </div>

            {/* Reported By & Action Taken Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reported By *
                </label>
                <select
                  value={recordReportedBy}
                  onChange={(e) => setRecordReportedBy(e.target.value as DisciplinaryReporterRole)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {REPORTER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {recordReportedBy === 'Anonymous Reporter' && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Anonymous Reporter identity is protected.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Action Taken *
                </label>
                <select
                  value={recordActionTaken}
                  onChange={(e) => setRecordActionTaken(e.target.value as DisciplinaryActionTaken)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  {ACTION_TAKEN_OPTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
                {recordActionTaken === 'Others' && (
                  <input
                    type="text"
                    required
                    value={recordActionTakenOther}
                    onChange={(e) => setRecordActionTakenOther(e.target.value)}
                    placeholder="Specify action taken..."
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Violation Details & Incident Summary *
              </label>
              <textarea
                rows={2}
                required
                value={recordDescription}
                onChange={(e) => setRecordDescription(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Imposed Sanction / Disciplinary Action *
              </label>
              <input
                type="text"
                required
                value={recordSanction}
                onChange={(e) => setRecordSanction(e.target.value)}
                placeholder="e.g. 15 Hours Campus Service + Guidance Counseling"
                className="w-full px-3.5 py-2 text-xs border border-red-300 dark:border-red-700 rounded-xl bg-white dark:bg-slate-800 text-red-700 dark:text-red-400 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={recordStartDate}
                  onChange={(e) => setRecordStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End / Completion Date *
                </label>
                <input
                  type="date"
                  required
                  value={recordEndDate}
                  onChange={(e) => setRecordEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Remarks & Administrative Notes
              </label>
              <textarea
                rows={2}
                value={recordRemarks}
                onChange={(e) => setRecordRemarks(e.target.value)}
                placeholder="Additional stipulations, hearing details, or conditions..."
                className="w-full p-3 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsCreatingRecord(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
              >
                <CheckCircle2 className="w-4 h-4" /> Save & Issue Disciplinary Record
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: CONFIRM ARCHIVE REPORT MODAL */}
      {confirmArchiveReport && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setConfirmArchiveReport(null)}
          onConfirm={() => {
            archiveDisciplinaryReport(confirmArchiveReport.id, 'Princess Ann T. Ruzol (Admin)');
            setConfirmArchiveReport(null);
            if (selectedReport?.id === confirmArchiveReport.id) {
              setSelectedReport(null);
            }
            refreshData();
          }}
          title="Are you sure you want to delete this?"
          message={`Are you sure you want to delete/archive grievance report #${confirmArchiveReport.id} (${confirmArchiveReport.reportedStudentName})? It will be moved to System Settings > System Archive.`}
          confirmText="Yes"
          cancelText="No"
          type="danger"
        />
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
            <img src={selectedPreviewImage} alt="Evidence Preview" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
