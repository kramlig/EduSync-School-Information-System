/**
 * School Forms Dashboard - EBEIS Compliant Forms
 * 
 * Central hub for managing DepEd school forms required for government reporting:
 * - SF1 (School Form 1) - Enrollment Record  
 * - SF2 (School Form 2) - Daily Attendance Record
 * - SF9 (School Form 9) - Promotion/Retention Report
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useStudentsPostgreSQL } from '../../../src/hooks/useStudentsPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { 
  UsersIcon,
  CalendarDaysIcon,
  TrendingUpIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '../../icons';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';

interface SchoolFormsDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

interface FormCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  gradient: string;
  shadowColor: string;
  roles: string[];
  stats: {
    label: string;
    value: string | number;
  };
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
}

const SchoolFormsDashboard: React.FC<SchoolFormsDashboardProps> = ({ session }) => {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const { students, loading: studentsLoading } = useStudentsPostgreSQL({ schoolId });
  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({ schoolId });
  
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  // Calculate real-time stats from PostgreSQL data
  const stats = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'active' || !s.status);
    const totalEnrolled = activeStudents.length;
    
    // Calculate today's attendance rate
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.filter(r => r.date === today);
    const presentToday = todayAttendance.filter(r => r.status === 'Present' || r.status === 'P').length;
    const averageAttendance = todayAttendance.length > 0 
      ? Math.round((presentToday / todayAttendance.length) * 1000) / 10 
      : 0;
    
    return {
      totalEnrolled,
      averageAttendance,
      promotionRate: 89.5, // TODO: Calculate from grades
      formsGenerated: 24,
      pendingSubmissions: 3
    };
  }, [students, attendanceRecords]);

  const loading = studentsLoading || attendanceLoading;

  const schoolForms: FormCard[] = [
    {
      id: 'sf1-enrollment',
      title: 'SF1 - Enrollment Record',
      description: 'Student enrollment data by grade level and section. Required for EBEIS reporting.',
      icon: UsersIcon,
      route: '/reports/school-forms/sf1',
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      shadowColor: 'shadow-blue-500/25',
      roles: ['admin', 'registrar', 'principal'],
      stats: {
        label: 'Total Enrolled',
        value: stats.totalEnrolled
      },
      deadline: 'Due: First week of classes',
      priority: 'high'
    },
    {
      id: 'sf2-attendance',
      title: 'SF2 - Daily Attendance Record',
      description: 'Daily attendance tracking and monthly summaries for learners and teachers.',
      icon: CalendarDaysIcon,
      route: '/reports/school-forms/sf2',
      gradient: 'from-green-600 via-emerald-600 to-teal-600',
      shadowColor: 'shadow-green-500/25',
      roles: ['admin', 'teacher', 'registrar', 'principal'],
      stats: {
        label: 'Avg Attendance',
        value: `${stats.averageAttendance}%`
      },
      deadline: 'Due: Monthly',
      priority: 'high'
    },
    {
      id: 'sf9-promotion',
      title: 'SF9 - Promotion/Retention Report',
      description: 'End-of-year promotion status and retention statistics for performance tracking.',
      icon: TrendingUpIcon,
      route: '/reports/school-forms/sf9',
      gradient: 'from-orange-600 via-red-600 to-pink-600',
      shadowColor: 'shadow-orange-500/25',
      roles: ['admin', 'registrar', 'principal'],
      stats: {
        label: 'Promotion Rate',
        value: `${stats.promotionRate}%`
      },
      deadline: 'Due: End of school year',
      priority: 'medium'
    }
  ];

  const quickActions = [
    {
      title: 'Generate All Reports',
      description: 'Bulk generate SF1, SF2, and SF9 forms',
      icon: ClipboardDocumentListIcon,
      action: () => console.log('Bulk generate'),
      color: 'bg-gradient-to-r from-violet-600 to-purple-600'
    },
    {
      title: 'Export EBEIS Data',
      description: 'Download EBEIS-compliant data export',
      icon: ArrowDownTrayIcon,
      action: () => console.log('Export EBEIS'),
      color: 'bg-gradient-to-r from-blue-600 to-cyan-600'
    },
    {
      title: 'View Statistics',
      description: 'School-wide analytics and trends',
      icon: ChartBarIcon,
      action: () => navigate('/grades/analytics'),
      color: 'bg-gradient-to-r from-emerald-600 to-green-600'
    }
  ];

  const accessibleForms = schoolForms.filter(form => 
    form.roles.includes(userRole)
  );

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10"></div>
          <div className="relative px-6 pt-8 pb-6">
            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 bg-clip-text text-transparent mb-3">
                  School Forms (EBEIS)
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
                  Official DepEd forms for government reporting and compliance. Generate SF1, SF2, and SF9 forms with EBEIS standards.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => window.open('https://www.deped.gov.ph/ebeis', '_blank')}
                  className="px-6 py-3 bg-white text-slate-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 hover:border-slate-300"
                >
                  📖 EBEIS Guide
                </button>
                <button 
                  onClick={() => console.log('Export all forms - TODO: Implement bulk export')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  📊 Export All Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalEnrolled.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <UsersIcon />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Avg Attendance</p>
                <p className="text-2xl font-bold text-slate-900">{stats.averageAttendance}%</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CalendarDaysIcon />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Promotion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats.promotionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <TrendingUpIcon />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Forms Generated</p>
                <p className="text-2xl font-bold text-slate-900">{stats.formsGenerated}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <DocumentTextIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-4 rounded-xl hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-center gap-3">
                  <action.icon />
                  <div className="text-left">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* School Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {accessibleForms.map((form) => {
            const IconComponent = form.icon;
            const isHovered = hoveredCard === form.id;
            
            return (
              <div
                key={form.id}
                className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 rounded-2xl"
                onClick={() => handleCardClick(form.route)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(form.route);
                  }
                }}
                onMouseEnter={() => setHoveredCard(form.id)}
                onMouseLeave={() => setHoveredCard(null)}
                tabIndex={0}
                role="button"
                aria-label={`Open ${form.title}`}
              >
                <div className={`
                  relative overflow-hidden bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl
                  transition-all duration-500 transform hover:-translate-y-2
                  border border-slate-200 hover:border-slate-300
                  ${form.shadowColor}
                `}>
                  
                  {/* Background Gradient */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${form.gradient} opacity-0 
                    group-hover:opacity-5 transition-opacity duration-500
                  `}></div>
                  
                  {/* Priority Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${form.priority === 'high' ? 'bg-red-100 text-red-700' : 
                        form.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'}
                    `}>
                      {form.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-2xl bg-gradient-to-br ${form.gradient} 
                    flex items-center justify-center mb-6 shadow-lg
                    transform transition-all duration-500 
                    ${isHovered ? 'scale-110 rotate-3' : ''}
                  `}>
                    <IconComponent />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors">
                      {form.title}
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {form.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {form.stats.value}
                        </div>
                        <div className="text-sm text-slate-500">
                          {form.stats.label}
                        </div>
                      </div>
                      
                      {form.deadline && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900">
                            {form.deadline}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Indicator */}
                    <div className={`
                      w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
                      bg-gradient-to-r ${form.gradient} text-white text-center
                      group-hover:shadow-lg transform group-hover:scale-105
                    `}>
                      Manage Form →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">EBEIS Compliance Guide</h3>
              <p className="text-blue-800 mb-4">
                These forms must be submitted to the Division Office according to DepEd reporting schedules. 
                Ensure all data is accurate and complete before submission.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  📋 View Submission Calendar
                </button>
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors border border-blue-300">
                  📞 Contact Division Office
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SchoolFormsDashboard;