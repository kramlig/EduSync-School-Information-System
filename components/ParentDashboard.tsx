/**
 * ParentDashboard - Enhanced Parent Portal
 * 
 * A comprehensive dashboard for parents to monitor their children's
 * academic progress, attendance, and school communications.
 * 
 * Features:
 * - Personalized greeting with time-based message
 * - Quick action buttons for common tasks
 * - At-a-glance performance overview
 * - Individual child performance cards with detailed metrics
 * - Smart alerts for items needing attention
 * - Recent announcements and upcoming events
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { 
  AcademicCapIcon, MegaphoneIcon, CalendarDaysIcon, 
  CheckBadgeIcon, CreditCardIcon, ChevronRightIcon, ClipboardDocumentListIcon
} from './icons';
import type { AuthUser, StudentUser, ParentUser, Student } from '../types';
import UpcomingEvents, { UpcomingEvent } from './UpcomingEvents';
import ProgressRing from './ProgressRing';
import Form138DownloadButtonV2 from './Form138DownloadButtonV2';
import { useStudentsPostgreSQL } from '../src/hooks/useStudentsPostgreSQL';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useAttendancePostgreSQL } from '../src/hooks/useAttendancePostgreSQL';
import { useAnnouncementsPostgreSQL } from '../src/hooks/useAnnouncementsPostgreSQL';
import { useAssignmentsPostgreSQL } from '../src/hooks/useAssignmentsPostgreSQL';
import { useParentsPostgreSQL } from '../src/hooks/useParentsPostgreSQL';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';

interface ParentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ schoolData, session }) => {
  const { loading } = schoolData;
  const parent = session.user as ParentUser;
  const navigate = useNavigate();
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  // Fetch fresh parent data from PostgreSQL to get updated studentIds
  const { parents: pgParents } = useParentsPostgreSQL({ schoolId: parent.schoolId || '' });
  
  // Get the current parent's fresh data (with updated studentIds)
  const currentParent = useMemo(() => {
    const freshParent = (pgParents || []).find(p => p.id === parent.id);
    return freshParent || parent;
  }, [pgParents, parent]);

  // Fetch real data from PostgreSQL
  const { students: pgStudents } = useStudentsPostgreSQL({ schoolId: parent.schoolId || '' });
  const { grades: pgGrades } = useGradesPostgreSQL({ schoolId: parent.schoolId });
  const { attendanceRecords: pgAttendance } = useAttendancePostgreSQL({ schoolId: parent.schoolId || '' });
  const { announcements: pgAnnouncements } = useAnnouncementsPostgreSQL({ schoolId: parent.schoolId || '' });
  const { assignments: pgAssignments, studentAssignmentGrades } = useAssignmentsPostgreSQL();
  const { sections: pgSections } = useSectionsPostgreSQL({ schoolId: parent.schoolId || '' });

  // Use fresh studentIds from PostgreSQL
  const children = useMemo(() => {
    const studentIds = currentParent.studentIds || [];
    return (pgStudents || []).filter(s => studentIds.includes(s.id));
  }, [pgStudents, currentParent.studentIds]);

  // Calculate children's performance with enhanced metrics
  const childrenStats = useMemo(() => {
    return children.map(child => {
      const childGrades = (pgGrades || []).filter(g => g.studentId === child.id);
      const finalGrades = childGrades
        .map(g => g.finalGrade)
        .filter((g): g is number => typeof g === 'number');
      
      const average = finalGrades.length > 0
        ? finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length
        : 0;

      // Get quarterly averages
      const q1Grades = childGrades.map(g => g.q1).filter((g): g is number => typeof g === 'number');
      const q2Grades = childGrades.map(g => g.q2).filter((g): g is number => typeof g === 'number');
      const q3Grades = childGrades.map(g => g.q3).filter((g): g is number => typeof g === 'number');
      const q4Grades = childGrades.map(g => g.q4).filter((g): g is number => typeof g === 'number');

      const q1Avg = q1Grades.length > 0 ? q1Grades.reduce((a, b) => a + b, 0) / q1Grades.length : null;
      const q2Avg = q2Grades.length > 0 ? q2Grades.reduce((a, b) => a + b, 0) / q2Grades.length : null;
      const q3Avg = q3Grades.length > 0 ? q3Grades.reduce((a, b) => a + b, 0) / q3Grades.length : null;
      const q4Avg = q4Grades.length > 0 ? q4Grades.reduce((a, b) => a + b, 0) / q4Grades.length : null;

      // Get attendance records for this child
      const childAttendanceRecords = (pgAttendance || []).filter(r => r.studentId === child.id);
      const attendanceData = childAttendanceRecords.length > 0
        ? childAttendanceRecords.reduce(
            (acc, record: any) => {
              const status = record.status || record.dailyStatus;
              if (status === 'present' || status === 'late') acc.present++;
              else if (status === 'absent') acc.absent++;
              if (status === 'late') acc.late++;
              return acc;
            },
            { present: 0, absent: 0, late: 0 }
          )
        : { present: 0, absent: 0, late: 0 };

      // Get section info
      const childSection = (pgSections || []).find(s => s.id === child.sectionId);
      
      // Get pending assignments count
      const childAssignments = (pgAssignments || []).filter(a => a.sectionId === child.sectionId);
      const pendingAssignments = childAssignments.filter(assignment => {
        const gradeRecord = (studentAssignmentGrades || []).find(
          g => g.assignmentId === assignment.id && g.studentId === child.id
        );
        return !gradeRecord || gradeRecord.score === null || gradeRecord.score === undefined;
      });

      // Determine status
      let status: 'excellent' | 'good' | 'needsAttention' | 'noData' = 'noData';
      if (average > 0) {
        if (average >= 90) status = 'excellent';
        else if (average >= 75) status = 'good';
        else status = 'needsAttention';
      }

      return {
        id: child.id,
        name: child.name,
        lrn: child.lrn,
        gradeLevel: childSection?.gradeLevel || 'N/A',
        section: childSection?.name || 'N/A',
        average: average.toFixed(1),
        subjectCount: childGrades.length,
        quarterlyAverages: { q1: q1Avg, q2: q2Avg, q3: q3Avg, q4: q4Avg },
        attendance: attendanceData,
        attendanceRate: (attendanceData.present + attendanceData.absent) > 0
          ? ((attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100).toFixed(0)
          : '0',
        pendingAssignments: pendingAssignments.length,
        status,
      };
    });
  }, [children, pgGrades, pgAttendance, pgSections, pgAssignments, studentAssignmentGrades]);

  // Overall family performance
  const familyAverage = useMemo(() => {
    const averages = childrenStats
      .map(c => parseFloat(c.average))
      .filter(a => !isNaN(a) && a > 0);
    
    return averages.length > 0
      ? (averages.reduce((sum, a) => sum + a, 0) / averages.length).toFixed(1)
      : 'N/A';
  }, [childrenStats]);

  const totalAttendanceRate = useMemo(() => {
    const rates = childrenStats
      .map(c => parseFloat(c.attendanceRate))
      .filter(r => !isNaN(r));
    
    return rates.length > 0
      ? (rates.reduce((sum, r) => sum + r, 0) / rates.length).toFixed(0)
      : '0';
  }, [childrenStats]);

  const totalPendingAssignments = useMemo(() => {
    return childrenStats.reduce((sum, c) => sum + c.pendingAssignments, 0);
  }, [childrenStats]);

  const relevantAnnouncements = useMemo(() => {
    return (pgAnnouncements || [])
        .filter(a => ['all', 'parents'].includes(a.target))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
  }, [pgAnnouncements]);

  // Upcoming events for parents - based on children's pending assignments
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const childSectionIds = children.map(c => c.sectionId).filter(Boolean);
    
    if (childSectionIds.length === 0) return [];
    
    const childrenAssignments = (pgAssignments || []).filter(a => 
      childSectionIds.includes(a.sectionId)
    );
    
    const pendingAssignments = childrenAssignments.filter(assignment => {
      const childIds = children.map(c => c.id);
      const isCompleted = childIds.every(childId => {
        const gradeRecord = (studentAssignmentGrades || []).find(
          g => g.assignmentId === assignment.id && g.studentId === childId
        );
        return gradeRecord && gradeRecord.score !== null && gradeRecord.score !== undefined;
      });
      return !isCompleted;
    });
    
    const sortedAssignments = pendingAssignments
      .filter(a => a.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
    
    return sortedAssignments.map((assignment): UpcomingEvent => ({
      id: assignment.id,
      title: assignment.title,
      date: assignment.dueDate || '',
      type: 'deadline',
    }));
  }, [children, pgAssignments, studentAssignmentGrades]);

  // Alerts for parents
  const alerts = useMemo(() => {
    const alertList: { type: 'warning' | 'info' | 'success'; title: string; message: string }[] = [];
    
    childrenStats.forEach(child => {
      if (child.status === 'needsAttention') {
        alertList.push({
          type: 'warning',
          title: `${child.name.split(' ')[0]}'s Grade Alert`,
          message: `Average grade is ${child.average}%. Consider scheduling a teacher conference.`
        });
      }
      if (parseFloat(child.attendanceRate) < 85 && parseFloat(child.attendanceRate) > 0) {
        alertList.push({
          type: 'warning',
          title: `${child.name.split(' ')[0]}'s Attendance`,
          message: `Attendance rate is ${child.attendanceRate}%. Regular attendance is important.`
        });
      }
      if (child.pendingAssignments > 3) {
        alertList.push({
          type: 'info',
          title: `${child.name.split(' ')[0]}'s Assignments`,
          message: `${child.pendingAssignments} pending assignments. Please follow up.`
        });
      }
      if (child.status === 'excellent') {
        alertList.push({
          type: 'success',
          title: `${child.name.split(' ')[0]} is Excelling!`,
          message: `Maintaining a ${child.average}% average. Great work!`
        });
      }
    });
    
    return alertList.slice(0, 3);
  }, [childrenStats]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'good': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'needsAttention': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good Standing';
      case 'needsAttention': return 'Needs Attention';
      default: return 'No Data';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Hero Section with Greeting */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {greeting}, {parent.name?.split(' ')[0] || 'Parent'}! 👋
            </h1>
            <p className="text-indigo-100 text-sm md:text-base">
              {children.length > 0 
                ? `Stay updated on ${children.length === 1 ? 'your child\'s' : 'your children\'s'} academic journey`
                : 'Welcome to your parent portal'}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{children.length}</div>
              <div className="text-xs md:text-sm text-indigo-200">{children.length === 1 ? 'Child' : 'Children'}</div>
            </div>
            {familyAverage !== 'N/A' && (
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{familyAverage}%</div>
                <div className="text-xs md:text-sm text-indigo-200">Family Avg</div>
              </div>
            )}
            {totalPendingAssignments > 0 && (
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{totalPendingAssignments}</div>
                <div className="text-xs md:text-sm text-indigo-200">Pending Tasks</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button 
          onClick={() => navigate('/grades')}
          className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
            <ClipboardDocumentListIcon />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Grades</span>
        </button>
        
        <button 
          onClick={() => navigate('/attendance')}
          className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
        >
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
            <CheckBadgeIcon />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Attendance</span>
        </button>
        
        <button 
          onClick={() => navigate('/billing')}
          className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
        >
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
            <CreditCardIcon />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing</span>
        </button>
        
        <button 
          onClick={() => navigate('/announcements')}
          className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] border border-slate-200 dark:border-slate-700"
        >
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
            <MegaphoneIcon />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Announcements</span>
        </button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'warning' 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-800 dark:text-amber-200'
                  : alert.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200'
              }`}
            >
              <div className="font-semibold text-sm">{alert.title}</div>
              <div className="text-sm opacity-80">{alert.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Children Overview Cards */}
      {children.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <AcademicCapIcon />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Children Linked</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Please contact the school administrator to link your children to your account.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <AcademicCapIcon />
            <span>My Children</span>
          </h2>
          
          <div className={`grid gap-4 ${children.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {childrenStats.map(child => {
              const studentData = children.find(s => s.id === child.id);
              const isExpanded = expandedChild === child.id;
              const isSingleChild = children.length === 1;
              
              return (
                <div 
                  key={child.id} 
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Child Header */}
                  <div 
                    className={`p-5 ${!isSingleChild ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''} transition-colors`}
                    onClick={() => !isSingleChild && setExpandedChild(isExpanded ? null : child.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`${isSingleChild ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg'} rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold`}>
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className={`font-semibold text-slate-800 dark:text-white ${isSingleChild ? 'text-xl' : ''}`}>{child.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Grade {child.gradeLevel} • {child.section}
                          </p>
                          {isSingleChild && child.lrn && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">LRN: {child.lrn}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(child.status)}`}>
                          {getStatusLabel(child.status)}
                        </span>
                        {!isSingleChild && <ChevronRightIcon />}
                      </div>
                    </div>
                    
                    {/* Quick Metrics - Enhanced for single child */}
                    <div className={`grid ${isSingleChild ? 'grid-cols-4 md:grid-cols-4' : 'grid-cols-3'} gap-3 mt-5`}>
                      <div className={`text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${isSingleChild ? 'p-4' : ''}`}>
                        <div className={`${isSingleChild ? 'text-2xl' : 'text-xl'} font-bold ${
                          parseFloat(child.average) >= 85 
                            ? 'text-green-600 dark:text-green-400'
                            : parseFloat(child.average) >= 75
                            ? 'text-amber-600 dark:text-amber-400'
                            : parseFloat(child.average) > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400'
                        }`}>
                          {parseFloat(child.average) > 0 ? `${child.average}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Average</div>
                      </div>
                      <div className={`text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${isSingleChild ? 'p-4' : ''}`}>
                        <div className={`${isSingleChild ? 'text-2xl' : 'text-xl'} font-bold ${
                          parseFloat(child.attendanceRate) >= 95 
                            ? 'text-green-600 dark:text-green-400'
                            : parseFloat(child.attendanceRate) >= 85
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}>
                          {child.attendanceRate}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Attendance</div>
                      </div>
                      <div className={`text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg ${isSingleChild ? 'p-4' : ''}`}>
                        <div className={`${isSingleChild ? 'text-2xl' : 'text-xl'} font-bold ${
                          child.pendingAssignments > 3 
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {child.pendingAssignments}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pending</div>
                      </div>
                      {isSingleChild && (
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {child.subjectCount}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Subjects</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Details - Always show for single child, toggle for multiple */}
                  {(isSingleChild || isExpanded) && studentData && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-700/30">
                      <div className={`${isSingleChild ? 'grid md:grid-cols-2 gap-6' : 'space-y-4'}`}>
                        {/* Quarterly Progress */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quarterly Progress</h4>
                          <div className="grid grid-cols-4 gap-2">
                            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, idx) => {
                              const qKey = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
                              const value = child.quarterlyAverages[qKey];
                              return (
                                <div key={quarter} className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{quarter}</div>
                                  <div className={`text-lg font-bold ${
                                    value && value >= 75 
                                      ? 'text-green-600 dark:text-green-400'
                                      : value 
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-400'
                                  }`}>
                                    {value ? value.toFixed(0) : '-'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Attendance Breakdown */}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Attendance Details</h4>
                          <div className="flex items-center gap-4">
                            <ProgressRing 
                              value={child.attendance.present}
                              max={child.attendance.present + child.attendance.absent}
                              size={70}
                              strokeWidth={5}
                              color={parseFloat(child.attendanceRate) >= 95 ? 'green' : 'blue'}
                            />
                            <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center">
                                <div className="font-bold text-green-700 dark:text-green-300">{child.attendance.present}</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Present</div>
                              </div>
                              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center">
                                <div className="font-bold text-red-700 dark:text-red-300">{child.attendance.absent}</div>
                                <div className="text-xs text-red-600 dark:text-red-400">Absent</div>
                              </div>
                              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg text-center">
                                <div className="font-bold text-amber-700 dark:text-amber-300">{child.attendance.late}</div>
                                <div className="text-xs text-amber-600 dark:text-amber-400">Late</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Form 138 Download */}
                      <div className={`${isSingleChild ? 'mt-4' : ''}`}>
                        <Form138DownloadButtonV2
                          student={studentData as unknown as Student}
                          schoolData={schoolData}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Announcements and Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <MegaphoneIcon />
              <span>Recent Announcements</span>
            </h2>
            <button 
              onClick={() => navigate('/announcements')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-4">
            {relevantAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {relevantAnnouncements.map(announcement => (
                  <div key={announcement.id} className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-800 dark:text-white text-sm">{announcement.title}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(announcement.date)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <MegaphoneIcon />
                <p className="mt-2 text-sm">No recent announcements</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarDaysIcon />
              <span>Upcoming Deadlines</span>
            </h2>
            <button 
              onClick={() => navigate('/assignments')}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-4">
            {upcomingEvents.length > 0 ? (
              <UpcomingEvents events={upcomingEvents} />
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <CalendarDaysIcon />
                <p className="mt-2 text-sm">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Need Help?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          If you have questions about your child's progress or need assistance, don't hesitate to reach out.
        </p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
          >
            Update Profile
          </button>
          <button 
            onClick={() => navigate('/schedule')}
            className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
          >
            View Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;