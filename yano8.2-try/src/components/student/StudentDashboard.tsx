import React, { useState, useEffect } from 'react';
import { User, AnnouncementCategory, Announcement, Scholarship } from '../../types';
import {
  getAnnouncements,
  applyScholarship,
  applyDorm,
  getScholarships,
  getScholarshipApplications,
  getDormApplicants,
  toggleAnnouncementHeart,
} from '../../services/storage';
import { Modal } from '../common/Modal';
import {
  Megaphone,
  Award,
  Home,
  Calendar,
  ExternalLink,
  FileText,
  Upload,
  Heart,
  CheckCircle2,
  Image as ImageIcon,
  X,
  User as UserIcon,
  Mail,
  MapPin,
  Phone,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';

interface StudentDashboardProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [rawAnnouncements, setRawAnnouncements] = useState<Announcement[]>(getAnnouncements());
  const [scholarships, setScholarships] = useState<Scholarship[]>(getScholarships());
  const [filterCategory, setFilterCategory] = useState<'ALL' | AnnouncementCategory>(() => {
    const saved = sessionStorage.getItem('osas_student_announcement_tab');
    if (saved === 'SCHOOL' || saved === 'SCHOLARSHIP' || saved === 'DORMITORY' || saved === 'GUIDANCE' || saved === 'ALL') {
      sessionStorage.removeItem('osas_student_announcement_tab');
      return saved as 'ALL' | AnnouncementCategory;
    }
    return 'ALL';
  });

  const refreshData = () => {
    setRawAnnouncements(getAnnouncements());
    setScholarships(getScholarships());
  };

  useEffect(() => {
    window.addEventListener('osas_storage_updated', refreshData);
    window.addEventListener('storage', refreshData);

    const handleSelectTab = (e: CustomEvent) => {
      const tab = e.detail;
      if (tab === 'SCHOOL' || tab === 'SCHOLARSHIP' || tab === 'DORMITORY' || tab === 'GUIDANCE' || tab === 'ALL') {
        setFilterCategory(tab);
      }
    };

    window.addEventListener('osas_select_announcement_tab', handleSelectTab as EventListener);

    return () => {
      window.removeEventListener('osas_storage_updated', refreshData);
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('osas_select_announcement_tab', handleSelectTab as EventListener);
    };
  }, []);

  // Check Application Statuses
  const studentIdVal = user.studentId || user.id;
  const scholarshipApps = getScholarshipApplications();
  const dormApps = getDormApplicants();

  const hasAppliedDorm = dormApps.some(
    (a) =>
      a.studentId === studentIdVal ||
      (user.studentId && a.studentId === user.studentId) ||
      (user.email && a.studentEmail === user.email)
  );

  // Dorm Application Modal State
  const [dormApplyingAnc, setDormApplyingAnc] = useState<any | null>(null);
  const [dormAddress, setDormAddress] = useState(user.permanentAddress || user.address || '');
  const [dormContact, setDormContact] = useState(user.contactNumber || '');
  const [dormReason, setDormReason] = useState('');

  // Scholarship Application Modal State
  const [scholarshipApplyingAnc, setScholarshipApplyingAnc] = useState<any | null>(null);
  const [scholarshipAttachmentUrl, setScholarshipAttachmentUrl] = useState<string>('');
  const [scholarshipAttachmentName, setScholarshipAttachmentName] = useState<string>('');
  const [scholarshipPrivacyConsent, setScholarshipPrivacyConsent] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Active / Open scholarships guaranteed to show up in Student Dashboard scholarship announcements
  const activeScholarships = scholarships.filter((s) => {
    if (s.isArchived) return false;
    if (s.status === 'CLOSED') return false;
    if (s.deadline) {
      const cleanExp = s.deadline.includes('T') ? s.deadline.split('T')[0] : s.deadline.trim();
      if (cleanExp && /^\d{4}-\d{2}-\d{2}$/.test(cleanExp) && cleanExp < todayStr) return false;
    }
    return true;
  });

  // Synthesize announcements list: Include all active scholarships and filter out closed/expired ones
  const combinedAnnouncements: Announcement[] = (() => {
    // 1. School & Dormitory announcements from raw announcements
    const schoolAndDormAncs = rawAnnouncements.filter((anc) => anc.category !== 'SCHOLARSHIP');

    // 2. Ensure every active scholarship from OSAS Admin is displayed
    const activeSchAncs: Announcement[] = activeScholarships.map((sch) => {
      const matchingRaw = rawAnnouncements.find(
        (anc) =>
          anc.category === 'SCHOLARSHIP' &&
          (anc.scholarshipId === sch.id || anc.title.toLowerCase().trim() === sch.title.toLowerCase().trim())
      );

      return {
        id: matchingRaw?.id || `anc-sch-${sch.id}`,
        title: sch.title,
        content: sch.description
          ? `${sch.description}\n\nRequirements:\n${sch.requirements || 'Contact OSAS for requirements'}`
          : (sch.requirements || 'Open scholarship program.'),
        category: 'SCHOLARSHIP' as const,
        expirationDate: sch.deadline || 'Ongoing',
        imageUrl: sch.imageUrl || matchingRaw?.imageUrl,
        scholarshipId: sch.id,
        createdAt: sch.createdAt || matchingRaw?.createdAt || new Date().toISOString(),
        heartReacts: matchingRaw?.heartReacts || [],
      };
    });

    // 3. Standalone scholarship announcements (if any) not already covered
    const standaloneSchAncs = rawAnnouncements.filter(
      (anc) =>
        anc.category === 'SCHOLARSHIP' &&
        !anc.scholarshipId &&
        !activeScholarships.some(
          (sch) => anc.title.toLowerCase().trim() === sch.title.toLowerCase().trim()
        )
    );

    return [...activeSchAncs, ...standaloneSchAncs, ...schoolAndDormAncs];
  })();

  const handleHeartReact = (ancId: string) => {
    const updated = toggleAnnouncementHeart(ancId, user.fullName);
    setRawAnnouncements(updated);
  };

  const handleScholarshipFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScholarshipAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawUrl = event.target?.result as string;
      if (rawUrl && rawUrl.startsWith('data:image')) {
        try {
          const compressed = await compressImage(rawUrl, 800, 800, 0.7);
          setScholarshipAttachmentUrl(compressed);
        } catch {
          setScholarshipAttachmentUrl(rawUrl);
        }
      } else {
        setScholarshipAttachmentUrl(rawUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dormReason.trim()) {
      alert('Please provide a reason for your dormitory application.');
      return;
    }

    const studentAddress = user.permanentAddress || user.address || 'Dingalan, Aurora';
    applyDorm(user, studentAddress, dormReason.trim());
    alert('Dormitory application successfully submitted to OSAS Admin (Dormitory > Applications tab)!');
    setDormApplyingAnc(null);
    setDormReason('');
    refreshData();
  };

  const handleScholarshipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scholarshipPrivacyConsent) {
      alert('Please check and accept the Data Privacy Notice consent.');
      return;
    }

    const linkedScholarship =
      scholarships.find((s) => s.id === scholarshipApplyingAnc?.scholarshipId) ||
      scholarships.find((s) => s.title.toLowerCase().trim() === scholarshipApplyingAnc?.title?.toLowerCase().trim()) ||
      activeScholarships.find((s) => s.id === scholarshipApplyingAnc?.scholarshipId) ||
      activeScholarships.find((s) => scholarshipApplyingAnc?.title?.toLowerCase().includes(s.title.toLowerCase())) ||
      activeScholarships[0];

    if (!linkedScholarship) {
      alert('Scholarship program is no longer active.');
      return;
    }

    applyScholarship(
      linkedScholarship.id,
      linkedScholarship.title,
      user,
      scholarshipAttachmentUrl || undefined,
      scholarshipAttachmentName || undefined
    );

    alert(`Application for "${linkedScholarship.title}" successfully submitted to OSAS Admin!`);
    setScholarshipApplyingAnc(null);
    setScholarshipAttachmentUrl('');
    setScholarshipAttachmentName('');
    setScholarshipPrivacyConsent(false);
    refreshData();
  };

  const displayedAnnouncements = combinedAnnouncements.filter((a) => {
    if (filterCategory === 'ALL') return true;
    return a.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Student Welcome Card */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Enrolled Student Portal
            </span>
            <h2 className="text-2xl font-black tracking-tight">Welcome, {user.fullName}!</h2>
            <p className="text-xs text-blue-200">
              {user.course} • {user.yearLevel} {user.section ? `(${user.section})` : ''} | Student ID: {user.studentId}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Announcements
          </button>
          <button
            onClick={() => setFilterCategory('SCHOOL')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterCategory === 'SCHOOL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            School Announcements
          </button>
          <button
            onClick={() => setFilterCategory('SCHOLARSHIP')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'SCHOLARSHIP'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Scholarship Announcement
          </button>
          <button
            onClick={() => setFilterCategory('DORMITORY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'DORMITORY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5" /> Dormitory Announcements
          </button>
          <button
            onClick={() => setFilterCategory('GUIDANCE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterCategory === 'GUIDANCE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" /> Guidance Announcements
          </button>
        </div>
      </div>

      {/* Announcements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedAnnouncements.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-500 font-medium">No announcements found in this category.</p>
          </div>
        ) : (
          displayedAnnouncements.map((anc) => {
            const linkedSch = scholarships.find((s) => s.id === anc.scholarshipId);
            const isUserAppliedForSch = scholarshipApps.some(
              (a) =>
                (a.studentId === studentIdVal || (user.email && a.studentEmail === user.email)) &&
                (anc.scholarshipId ? a.scholarshipId === anc.scholarshipId : a.scholarshipTitle === anc.title)
            );

            return (
              <div
                key={anc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                        anc.category === 'SCHOLARSHIP'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : anc.category === 'DORMITORY'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : anc.category === 'GUIDANCE'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {anc.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expiration: {anc.expirationDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{anc.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 whitespace-pre-line">
                    {anc.content}
                  </p>

                  {anc.imageUrl && (
                    <img
                      src={anc.imageUrl}
                      alt={anc.title}
                      className="w-full h-36 rounded-xl object-cover border border-slate-200 dark:border-slate-700 mt-2"
                    />
                  )}
                </div>

                {/* Apply Now Buttons for Scholarship & Dormitory & Heart reaction */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Heart reaction button */}
                  {(() => {
                    const reacts = anc.heartReacts || [];
                    const hasHearted = reacts.includes(user.fullName);
                    return (
                      <button
                        type="button"
                        onClick={() => handleHeartReact(anc.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          hasHearted
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title={hasHearted ? 'Unlike' : 'Heart react'}
                      >
                        <Heart className={`w-4 h-4 ${hasHearted ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{reacts.length}</span>
                      </button>
                    );
                  })()}

                  <div className="flex-1 min-w-0">
                    {anc.category === 'SCHOLARSHIP' && (() => {
                      if (linkedSch?.status === 'CLOSED') {
                        return (
                          <span className="block w-full py-2 bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 font-extrabold text-xs rounded-xl text-center uppercase tracking-wider">
                            Scholarships are now closed
                          </span>
                        );
                      }
                      if (isUserAppliedForSch) {
                        return (
                          <button
                            disabled
                            className="w-full py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Applied
                          </button>
                        );
                      }
                      return (
                        <button
                          onClick={() => {
                            setScholarshipApplyingAnc(anc);
                            setScholarshipPrivacyConsent(false);
                          }}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-4 h-4" /> Apply Now!
                        </button>
                      );
                    })()}

                    {anc.category === 'DORMITORY' && (
                      hasAppliedDorm ? (
                        <button
                          disabled
                          className="w-full py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => setDormApplyingAnc(anc)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Home className="w-4 h-4" /> Apply Now!
                        </button>
                      )
                    )}

                    {(anc.category === 'SCHOOL' || anc.category === 'GUIDANCE') && anc.externalLink && (
                      <a
                        href={anc.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" /> View Details
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dormitory Application Form Modal (Requirement 6) */}
      {dormApplyingAnc && (
        <Modal
          isOpen={true}
          onClose={() => setDormApplyingAnc(null)}
          title={`Dormitory Residence Application`}
          subtitle={`Applying for: ${dormApplyingAnc.title}`}
          maxWidth="lg"
        >
          <form onSubmit={handleDormSubmit} className="space-y-4">
            {/* Student Profile Info Grid (Read-Only) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                Applicant Information (Read-Only)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Student ID</label>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">{user.studentId || user.id}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Full Name</label>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Course / Program</label>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">{user.course || 'BS Entrepreneurship'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Year Level & Section</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.yearLevel || '1st Year'} {user.section ? `• Section ${user.section}` : ''}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Email Address</label>
                  <p className="font-mono text-slate-700 dark:text-slate-300">{user.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-500" /> Permanent Address
                  </label>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {user.permanentAddress || user.address || 'Barangay Poblacion, Dingalan, Aurora'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" /> Contact Number
                  </label>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {user.contactNumber || '09123456789'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason for Application */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Application *
              </label>
              <textarea
                rows={4}
                required
                value={dormReason}
                onChange={(e) => setDormReason(e.target.value)}
                placeholder="Explain why you need campus dormitory accommodation (e.g., remote province residence, financial hardship, accessibility)..."
                className="w-full p-3 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider cursor-pointer"
            >
              Submit Application
            </button>
          </form>
        </Modal>
      )}

      {/* Scholarship Details & Application Modal (Requirement 2 & 7) */}
      {scholarshipApplyingAnc && (() => {
        const schInfo =
          scholarships.find((s) => s.id === scholarshipApplyingAnc.scholarshipId) ||
          scholarships.find((s) => s.title.toLowerCase().trim() === scholarshipApplyingAnc.title.toLowerCase().trim()) ||
          activeScholarships.find((s) => s.id === scholarshipApplyingAnc.scholarshipId) ||
          activeScholarships.find((s) => scholarshipApplyingAnc.title.toLowerCase().includes(s.title.toLowerCase()));

        const modalImageUrl = scholarshipApplyingAnc.imageUrl || schInfo?.imageUrl;

        return (
          <Modal
            isOpen={true}
            onClose={() => setScholarshipApplyingAnc(null)}
            title={`Scholarship Application`}
            subtitle={scholarshipApplyingAnc.title}
            maxWidth="md"
          >
            <form onSubmit={handleScholarshipSubmit} className="space-y-4">
              {modalImageUrl && (
                <div className="rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800/80 max-h-40 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                  <img
                    src={modalImageUrl}
                    alt={scholarshipApplyingAnc.title}
                    className="max-h-36 w-full object-contain"
                  />
                </div>
              )}

              <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800/80 text-xs space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-200">{scholarshipApplyingAnc.title}</h4>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">
                  {scholarshipApplyingAnc.content}
                </p>

                {/* Show Requirements entered by OSAS Admin */}
                {schInfo?.requirements && (
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-1">
                    <span className="font-black uppercase text-[10px] tracking-wider text-amber-900 dark:text-amber-200 block">
                      Requirements & Qualifications (Set by OSAS Admin):
                    </span>
                    <p className="text-amber-800 dark:text-amber-300 font-medium text-xs whitespace-pre-line">
                      {schInfo.requirements}
                    </p>
                  </div>
                )}

                {schInfo?.amount && (
                  <div className="pt-1 text-amber-900 dark:text-amber-200 font-bold">
                    Grant Value: {schInfo.amount}
                  </div>
                )}
              </div>

              {/* Supporting Document / Image Attachment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supporting Documents / Valid ID / Certificate (Optional)
                </label>
                <p className="text-[11px] text-slate-500">
                  You can attach an image or document (e.g. Certificate of Registration, Grade Slip, ID, or Proof of Indigency)
                </p>

                {scholarshipAttachmentUrl ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <ImageIcon className="w-4 h-4 text-amber-600" />
                        <span className="truncate max-w-[200px]">{scholarshipAttachmentName || 'Attached Document'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScholarshipAttachmentUrl('');
                          setScholarshipAttachmentName('');
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-40 flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-2">
                      {scholarshipAttachmentUrl.startsWith('data:image/') ? (
                        <img
                          src={scholarshipAttachmentUrl}
                          alt="Attachment Preview"
                          className="max-h-36 object-contain mx-auto"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-slate-700 dark:text-slate-300">
                          <FileText className="w-8 h-8 text-amber-600 mb-1" />
                          <span className="text-xs font-bold">{scholarshipAttachmentName}</span>
                          <span className="text-[10px] text-slate-500">Document ready to submit</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-400 p-4 rounded-xl text-center cursor-pointer transition-colors relative bg-slate-50/50 dark:bg-slate-800/50 hover:bg-amber-50/30">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleScholarshipFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Upload className="w-5 h-5 text-amber-600 mb-0.5" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">Click or drag file / image here</span>
                      <span className="text-[10px] text-slate-400">Supports PNG, JPG, PDF, Documents</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Privacy Act of 2012 (RA 10173) Notice & Mandatory Consent */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Data Privacy Notice (RA 10173)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Personal information, academic records, and attached supporting documents provided in this application are collected and processed by Dingalan Community College OSAS solely for verifying scholarship qualifications and processing financial assistance grants in accordance with Republic Act No. 10173.
                </p>
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={scholarshipPrivacyConsent}
                    onChange={(e) => setScholarshipPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-amber-600 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    I understand and give consent to DCC OSAS to collect and process my personal data and documents for this scholarship application pursuant to RA 10173. *
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!scholarshipPrivacyConsent}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-colors uppercase tracking-wider cursor-pointer"
              >
                Submit Scholarship Application
              </button>
            </form>
          </Modal>
        );
      })()}
    </div>
  );
};
