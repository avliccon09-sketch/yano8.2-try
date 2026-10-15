import React, { useState, useEffect } from 'react';
import {
  User,
  DisciplinaryReport,
  DisciplinaryRecord,
} from '../../types';
import {
  getDisciplinaryRecords,
  getDisciplinaryReports,
} from '../../services/storage';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface StudentDisciplinaryModuleProps {
  user: User;
}

export const StudentDisciplinaryModule: React.FC<StudentDisciplinaryModuleProps> = ({ user }) => {
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

  // Check if a report was filed AGAINST this logged-in student
  const isFiledAgainstMe = (rep: DisciplinaryReport): boolean => {
    if (isFiledByMe(rep)) return false;

    if (user.studentId && rep.reportedStudentId && rep.reportedStudentId.trim().toLowerCase() === user.studentId.trim().toLowerCase()) {
      return true;
    }
    if (rep.reportedStudentId && rep.reportedStudentId.trim().toLowerCase() === user.id.trim().toLowerCase()) {
      return true;
    }
    if (rep.reportedStudentName && rep.reportedStudentName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) {
      return true;
    }
    return false;
  };

  // Check if an official disciplinary sanction record is against this student
  const isMyDisciplinaryRecord = (rec: DisciplinaryRecord): boolean => {
    if (rec.isArchived || rec.isArchivedByAdmin) return false;
    const uStudId = (user.studentId || '').trim().toLowerCase();
    const uId = (user.id || '').trim().toLowerCase();
    const uName = (user.fullName || '').trim().toLowerCase();
    const recStudId = (rec.studentId || '').trim().toLowerCase();
    const recName = (rec.studentName || '').trim().toLowerCase();

    if (uStudId && recStudId === uStudId) return true;
    if (uId && recStudId === uId) return true;
    if (uName && recName === uName) return true;
    return false;
  };

  // Official disciplinary sanction records issued against this student
  const [myOfficialRecords, setMyOfficialRecords] = useState<DisciplinaryRecord[]>(() =>
    getDisciplinaryRecords('STUDENT').filter(isMyDisciplinaryRecord)
  );

  // Reports filed against this student by other individuals
  const [reportsAgainstMe, setReportsAgainstMe] = useState<DisciplinaryReport[]>(() =>
    getDisciplinaryReports().filter(isFiledAgainstMe)
  );

  const myRecordsTotal = myOfficialRecords.length + reportsAgainstMe.length;

  const refreshAllData = () => {
    const allReports = getDisciplinaryReports();
    const allRecords = getDisciplinaryRecords('STUDENT');
    setMyOfficialRecords(allRecords.filter(isMyDisciplinaryRecord));
    setReportsAgainstMe(allReports.filter(isFiledAgainstMe));
  };

  useEffect(() => {
    window.addEventListener('osas_storage_updated', refreshAllData);
    window.addEventListener('storage', refreshAllData);
    return () => {
      window.removeEventListener('osas_storage_updated', refreshAllData);
      window.removeEventListener('storage', refreshAllData);
    };
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 rounded-2xl">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                My Disciplinary Records
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official institutional conduct records and conduct status issued by the Office of Student Affairs and Services (Read-Only)
              </p>
            </div>
          </div>

          <span
            className={`px-3.5 py-1.5 text-xs font-black rounded-full border self-center md:self-auto text-center inline-flex items-center justify-center shrink-0 ${
              myRecordsTotal > 0
                ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {myRecordsTotal > 0 ? `${myRecordsTotal} Active Records/Cases` : '✓ Clean Conduct Record'}
          </span>
        </div>
      </div>

      {/* Main Content Area: My Disciplinary Records */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
        {myRecordsTotal === 0 ? (
          <div className="p-10 text-center bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">Good Standing Record</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
              You have zero disciplinary violations, sanctions, or incident reports filed against your student profile. Your conduct record is in good standing with DCC OSAS.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Part A: Official OSAS Disciplinary Records & Sanctions */}
            {myOfficialRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Official Disciplinary Sanctions ({myOfficialRecords.length})
                  </h4>
                </div>
                <div className="space-y-4">
                  {myOfficialRecords.map((rec) => {
                    const isCompleted = rec.status === 'COMPLETED';

                    return (
                      <div
                        key={rec.id}
                        className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-black rounded uppercase bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {rec.offenseType}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase border ${
                                isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                  : 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300'
                              }`}
                            >
                              {isCompleted ? 'Sanction Completed' : 'SANCTIONED (ACTIVE)'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Date Logged: {rec.dateLogged}</span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          {rec.description}
                        </p>

                        <div className="p-3 bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl space-y-0.5">
                          <span className="text-[10px] font-black text-red-900 dark:text-red-300 uppercase block">
                            Assigned Sanction / Required Action:
                          </span>
                          <p className="text-xs font-black text-red-700 dark:text-red-400">{rec.sanction}</p>
                        </div>

                        {rec.remarks && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            OSAS Remarks: {rec.remarks}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Part B: Incident Reports Filed Involving This Student By Others */}
            {reportsAgainstMe.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Incident Reports Involving You ({reportsAgainstMe.length})
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  The following reports involve your conduct and are currently undergoing OSAS administrative review.
                </p>

                <div className="space-y-3">
                  {reportsAgainstMe.map((rep) => {
                    const isUnderInvest = rep.status === 'UNDER_INVESTIGATION';
                    const isSanctioned = rep.status === 'SANCTIONED';
                    const isSubmitted = rep.status === 'SUBMITTED';

                    return (
                      <div
                        key={rep.id}
                        className="p-5 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-lg uppercase bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {rep.incidentType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">Report #{rep.id}</span>
                          </div>

                          <span
                            className={`px-2.5 py-1 text-[10px] font-black rounded-full border ${
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported By</span>
                            <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                              {rep.isAnonymousReporter ? 'Anonymous Complainant' : rep.reporterName || rep.reporterRole || 'Student'}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Location & Date</span>
                            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                              {rep.location} • {new Date(rep.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/70 dark:border-amber-800/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Incident Allegation:</span>
                          {rep.description}
                        </div>

                        {rep.investigationNotes && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-black text-blue-900 dark:text-blue-200 uppercase text-[10px]">
                              <Info className="w-3.5 h-3.5 text-blue-600" /> OSAS Administrative Directive / Notes
                            </div>
                            <p className="text-blue-800 dark:text-blue-300 whitespace-pre-line text-xs font-medium">
                              {rep.investigationNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
