import React, { useState, useEffect } from 'react';
import { UserRole, User, SystemModule } from '../../types';
import { CollegeLogo } from './CollegeLogo';
import { getSafetyReports } from '../../services/storage';
import {
  LayoutDashboard,
  ShieldAlert,
  UserPlus,
  Megaphone,
  Award,
  Calendar,
  AlertOctagon,
  HeartHandshake,
  Home,
  Users,
  Star,
  Activity,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  role?: UserRole;
  user?: User;
  activeTab?: string;
  activeModule?: SystemModule | string;
  onSelectTab?: (tabId: string) => void;
  onSelectModule?: (module: any) => void;
  isCollapsed?: boolean;
  isOpen?: boolean;
  mobileOpen?: boolean;
  onToggleCollapse?: () => void;
  onToggle?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  user,
  activeTab,
  activeModule,
  onSelectTab,
  onSelectModule,
  isCollapsed,
  isOpen,
  mobileOpen = false,
  onToggleCollapse,
  onToggle,
  onCloseMobile,
}) => {
  const currentRole = role || user?.role || 'STUDENT';
  const currentActive = activeModule || activeTab || 'dashboard';
  const collapsed = isCollapsed !== undefined ? isCollapsed : isOpen !== undefined ? !isOpen : false;

  const [pendingSafetyReportsCount, setPendingSafetyReportsCount] = useState<number>(0);

  useEffect(() => {
    const checkReports = () => {
      try {
        const reports = getSafetyReports();
        const pending = reports.filter(
          (r) => r.status === 'REPORTED' || r.status === 'ESCALATED'
        ).length;
        setPendingSafetyReportsCount(pending);
      } catch {
        setPendingSafetyReportsCount(0);
      }
    };
    checkReports();

    window.addEventListener('osas_storage_updated', checkReports);
    return () => window.removeEventListener('osas_storage_updated', checkReports);
  }, []);

  const handleToggle = () => {
    if (onToggleCollapse) onToggleCollapse();
    if (onToggle) onToggle();
  };

  const handleSelect = (id: string) => {
    const normalized = id.replace(/-/g, '_');
    if (onSelectModule) onSelectModule(normalized);
    if (onSelectTab) onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    highlight?: boolean;
  }

  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'safety_reports',
      label: 'Reports/Concerns',
      icon: ShieldAlert,
    },
    { id: 'register_student', label: 'Register Student', icon: UserPlus },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'scholarship', label: 'Scholarship', icon: Award },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'disciplinary', label: 'Disciplinary Records', icon: AlertOctagon },
    { id: 'intervention', label: 'Intervention', icon: HeartHandshake },
    { id: 'dormitory', label: 'Dormitory', icon: Home },
    { id: 'student_records', label: 'Student Record', icon: Users },
    { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'System Setting', icon: Settings },
  ];

  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scholarship', label: 'Scholarships', icon: Award },
    { id: 'dormitory', label: 'Dormitory', icon: Home },
    { id: 'safety_reports', label: 'Report/Concerns', icon: ShieldAlert },
    { id: 'appointments', label: 'Report Grievance', icon: Calendar },
    { id: 'disciplinary', label: 'Disciplinary Records', icon: AlertOctagon },
  ];

  const guidanceNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Referred Appointments', icon: Calendar },
    { id: 'referred_disciplinary', label: 'Referred Intervention Cases', icon: HeartHandshake },
    { id: 'student_records', label: 'Student Records', icon: Users },
    { id: 'announcements', label: 'Guidance Announcements', icon: Megaphone },
  ];

  const navItems: NavItem[] =
    currentRole === 'ADMIN'
      ? adminNav
      : currentRole === 'GUIDANCE_ADMIN'
      ? guidanceNav
      : studentNav;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-45 sm:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar (Desktop Sticky + Mobile Fixed Slide-Over) */}
      <aside
        className={`bg-slate-900 text-slate-300 h-screen flex flex-col transition-all duration-300 shrink-0 z-50 border-r border-slate-800 ${
          /* Desktop layout */
          'sm:sticky sm:top-0 ' + (collapsed ? 'sm:w-16' : 'sm:w-64') + ' ' +
          /* Mobile layout */
          'fixed inset-y-0 left-0 w-64 ' + (mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full sm:translate-x-0')
        }`}
      >
        {/* College Logo & Portal Header */}
        <div className="h-16 px-3.5 bg-gradient-to-r from-blue-800 to-indigo-900 text-white font-bold flex items-center justify-between border-b border-blue-900/80 shrink-0">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 truncate">
              <CollegeLogo size="md" />
              <div className="truncate">
                <h2 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1">
                  STU-SERVE PORTAL
                </h2>
                <p className="text-[10px] text-blue-200 font-semibold truncate">
                  Dingalan Community College
                </p>
              </div>
            </div>
          )}
          {collapsed && !mobileOpen && (
            <div className="mx-auto flex items-center justify-center">
              <CollegeLogo size="md" />
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg bg-blue-800/60 hover:bg-blue-800 text-blue-100 hover:text-white transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            title={collapsed ? 'Expand Menu' : 'Collapse Menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg bg-blue-800/60 hover:bg-blue-800 text-white sm:hidden flex items-center justify-center cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentActive === item.id ||
              currentActive === item.id.replace(/-/g, '_') ||
              currentActive === item.id.replace(/_/g, '-');
            const showLabel = !collapsed || mobileOpen;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-white/10 text-white border-l-4 border-white font-bold'
                    : item.highlight
                    ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                title={!showLabel ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : item.highlight ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {showLabel && (
                  <span className="truncate text-left flex-1">{item.label}</span>
                )}
                {showLabel && item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-600 text-white rounded-md uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Branding */}
        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-slate-800/80 text-[10px] uppercase tracking-widest text-slate-400/70 text-center">
            Office of Student Affairs v1.0
          </div>
        )}
      </aside>
    </>
  );
};

