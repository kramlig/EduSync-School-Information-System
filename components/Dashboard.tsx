import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolDataHook } from '../hooks/useSchoolData';
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { AuthUser, StudentUser } from '../types';
import SupabaseTest from './SupabaseTest';

interface DashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser; type: 'staff' | 'student' };
}

const Dashboard: React.FC<DashboardProps> = ({ schoolData, session }) => {
  const {
    students,
    learningAreas,
    grades = [],
    sections = [],
    substituteAssignments = [],
    classSchedules = [],
    settings,
  } = schoolData;
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const authUser = session.user as AuthUser;
  const currentDate = new Date();
  const greeting = useMemo(() => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentDate]);

  const visibleStudents = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }
    
    const authorizedSectionIds = new Set<string>();

    // 1. Sections where the user is the adviser
    const teacherAdviserSection = sections.find(s => s.adviserId === authUser.id);
    if (teacherAdviserSection) {
        authorizedSectionIds.add(teacherAdviserSection.id);
    }
    
    // 2. Sections where the user is a substitute
    const today = new Date().toISOString().split('T')[0];
    const activeSubAssignments = substituteAssignments.filter(sub => 
      sub.teacherId === authUser.id &&
      today >= sub.startDate &&
      today <= sub.endDate
    );

    if (activeSubAssignments.length > 0) {
        const originalTeacherIds = activeSubAssignments.map(sub => sub.originalTeacherId);
        
        // Find sections where original teachers are advisers
        sections.forEach(s => {
            if (s.adviserId && originalTeacherIds.includes(s.adviserId)) {
                authorizedSectionIds.add(s.id);
            }
        });

        // Find sections where original teachers have classes scheduled
        classSchedules.forEach(schedule => {
            if (schedule.teacherId && schedule.sectionId && originalTeacherIds.includes(schedule.teacherId)) {
                authorizedSectionIds.add(schedule.sectionId);
            }
        });
    }

    // 3. Sections where the user is assigned as a subject teacher
    classSchedules.forEach(schedule => {
      if (schedule.teacherId === authUser.id && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });
    
    if (authorizedSectionIds.size === 0) return [];
    
    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [students, sections, substituteAssignments, classSchedules, authUser]);


  const visibleStudentIds = useMemo(() => new Set(visibleStudents.map((s) => s.id)), [visibleStudents]);
  const filteredGrades = useMemo(() => grades.filter((g) => visibleStudentIds.has(g.studentId)), [grades, visibleStudentIds]);

  // Calculate metrics - Group by student to avoid counting multiple subjects
  const studentAverages = useMemo(() => {
    const studentGradeMap = new Map<string, number[]>();
    
    filteredGrades.forEach((g) => {
      if (typeof g.finalGrade === 'number') {
        if (!studentGradeMap.has(g.studentId)) {
          studentGradeMap.set(g.studentId, []);
        }
        studentGradeMap.get(g.studentId)!.push(g.finalGrade);
      }
    });

    // Calculate average for each student
    const averages: { studentId: string; average: number }[] = [];
    studentGradeMap.forEach((grades, studentId) => {
      const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      averages.push({ studentId, average: avg });
    });

    return averages;
  }, [filteredGrades]);

  const averageGrade = studentAverages.length > 0
    ? studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length
    : 0;

  const gradeProgress = visibleStudents.length > 0 
    ? (studentAverages.length / visibleStudents.length) * 100 
    : 0;

  // Grade distribution - Based on student averages, not individual grades
  const gradeDistribution = useMemo(() => {
    const ranges = [
      { label: '90-100', min: 90, max: 100, count: 0, color: 'from-green-500 to-emerald-600', icon: '🏆' },
      { label: '80-89', min: 80, max: 89, count: 0, color: 'from-blue-500 to-indigo-600', icon: '⭐' },
      { label: '75-79', min: 75, max: 79, count: 0, color: 'from-yellow-500 to-orange-500', icon: '📈' },
      { label: 'Below 75', min: 0, max: 74, count: 0, color: 'from-red-500 to-pink-600', icon: '⚠️' },
    ];

    studentAverages.forEach((s) => {
      const avg = s.average;
      if (avg >= 90) ranges[0].count++;
      else if (avg >= 80) ranges[1].count++;
      else if (avg >= 75) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }, [studentAverages]);

  // At-risk and honor students - Based on averages
  const atRiskStudents = studentAverages.filter((s) => s.average < 75).length;
  const honorStudents = studentAverages.filter((s) => s.average >= 90).length;

  // Alerts
  const studentsWithoutGrades = visibleStudents.filter(
    (s) => !grades.some((g) => g.studentId === s.id && typeof g.finalGrade === 'number')
  );

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
    trend,
    trendValue,
    onClick,
  }: any) => (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1`}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-7 h-7 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-white/90 text-sm font-semibold">
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-4 h-4" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4" />
              )}
              {trendValue}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
          <p className="text-white text-4xl font-bold mb-1">{value}</p>
          {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            {greeting}, {authUser.name}! 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {settings.schoolName} • {settings.schoolYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/announcements')}
            className="relative p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="View announcements"
          >
            <BellAlertIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {(studentsWithoutGrades.length > 0 || atRiskStudents > 0) && (
        <div className="space-y-3">
          {studentsWithoutGrades.length > 0 && !dismissedAlerts.has('missing-grades') && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-yellow-900 dark:text-yellow-100">Missing Grades</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {studentsWithoutGrades.length} student(s) have no final grades recorded.
                </p>
              </div>
              <button
                onClick={() => setDismissedAlerts((prev) => new Set(prev).add('missing-grades'))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          )}
          {atRiskStudents > 0 && !dismissedAlerts.has('at-risk') && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1 text-red-900 dark:text-red-100">Students Need Support</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {atRiskStudents} student(s) have grades below 75 and may need intervention.
                </p>
              </div>
              <button
                onClick={() => setDismissedAlerts((prev) => new Set(prev).add('at-risk'))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={visibleStudents.length}
          subtitle="Active enrollment"
          icon={UserGroupIcon}
          gradient="from-indigo-500 to-purple-600"
          trend="up"
          trendValue="+5"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Average Grade"
          value={`${averageGrade.toFixed(1)}%`}
          subtitle="Class performance"
          icon={AcademicCapIcon}
          gradient={averageGrade >= 85 ? 'from-green-500 to-emerald-600' : averageGrade >= 75 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-pink-600'}
          trend={averageGrade >= 85 ? 'up' : averageGrade >= 75 ? undefined : 'down'}
          trendValue={averageGrade >= 85 ? '+2%' : ''}
          onClick={() => navigate('/gradebook')}
        />
        <StatCard
          title="Honor Students"
          value={honorStudents}
          subtitle="90% and above"
          icon={SparklesIcon}
          gradient="from-yellow-500 to-orange-500"
          onClick={() => navigate('/grades')}
        />
        <StatCard
          title="At-Risk Students"
          value={atRiskStudents}
          subtitle="Need intervention"
          icon={ExclamationTriangleIcon}
          gradient="from-red-500 to-pink-600"
          onClick={() => navigate('/grades')}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Add Student', icon: UserGroupIcon, color: 'from-indigo-500 to-purple-600', action: '/students' },
            { label: 'Record Grades', icon: ClipboardDocumentListIcon, color: 'from-green-500 to-emerald-600', action: '/gradebook' },
            { label: 'DepEd Forms', icon: BookOpenIcon, color: 'from-blue-500 to-cyan-600', action: '/forms' },
            { label: 'Analytics', icon: ChartBarIcon, color: 'from-orange-500 to-red-600', action: '/grades' },
          ].map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.action)}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <action.icon className="w-8 h-8 text-white mb-3" />
              <p className="text-white font-semibold text-sm">{action.label}</p>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution - Spans 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Grade Distribution</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">Student performance breakdown</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-indigo-500" />
          </div>

          <div className="space-y-4">
            {gradeDistribution.map((range, index) => {
              const maxCount = Math.max(...gradeDistribution.map((r) => r.count));
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{range.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{range.label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {range.count} student{range.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">{range.count}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${range.color} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`}
                      style={{ width: `${maxCount > 0 ? (range.count / maxCount) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grading Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Grading Progress</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Completion status</p>
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-36">
                <svg className="transform -rotate-90 w-36 h-36">
                  <circle cx="72" cy="72" r="54" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-200 dark:text-slate-700" />
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 - (gradeProgress / 100) * 2 * Math.PI * 54}
                    className="text-indigo-600 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800 dark:text-white">{Math.round(gradeProgress)}%</span>
                </div>
              </div>
              <p className="mt-4 text-center font-semibold text-slate-700 dark:text-slate-300">Completed</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{studentAverages.length} of {visibleStudents.length} graded</p>
            </div>
          </div>
          {gradeProgress < 100 && (
            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">
                {visibleStudents.length - studentAverages.length} student{(visibleStudents.length - studentAverages.length) !== 1 ? 's' : ''} remaining
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Section - Modern */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <CheckCircleIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome to EduSync</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Your central hub for managing school information. Navigate using the sidebar to view students, manage learning areas, 
              and record grades. The system works offline—any changes sync automatically when you reconnect.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Migration Test - TEMPORARY */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            🚀 PostgreSQL Migration Test
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Testing Supabase connection alongside Firestore. This will be removed after migration is complete.
          </p>
        </div>
        <SupabaseTest />
      </div>
    </div>
  );
};

export default Dashboard;
