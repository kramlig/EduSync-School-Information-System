import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { AcademicCapIcon, BookOpenIcon, StarIcon, PlusIcon, ClipboardDocumentListIcon, ChartBarIcon, CalendarDaysIcon } from './icons';
import type { AuthUser, StudentUser } from '../types';
import QuickActionButton from './QuickActionButton';
import BarChart from './BarChart';
import ActivityFeed, { Activity } from './ActivityFeed';
import AlertBanner, { Alert } from './AlertBanner';
import UpcomingEvents, { UpcomingEvent } from './UpcomingEvents';
import ProgressRing from './ProgressRing';

interface DashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const Dashboard: React.FC<DashboardProps> = ({ schoolData, session }) => {
  const { 
    students, learningAreas, 
    grades = [], sections = [], substituteAssignments = [], classSchedules = [] 
  } = schoolData;
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  const authUser = session.user as AuthUser;

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


  const visibleStudentIds = useMemo(() => new Set(visibleStudents.map(s => s.id)), [visibleStudents]);

  const filteredGrades = useMemo(() => grades.filter(g => visibleStudentIds.has(g.studentId)), [grades, visibleStudentIds]);

  const gradesWithFinal = filteredGrades.filter(g => typeof g.finalGrade === 'number');
  const averageGrade = gradesWithFinal.length > 0
    ? (gradesWithFinal.reduce((acc, g) => acc + g.finalGrade!, 0) / gradesWithFinal.length).toFixed(1)
    : 'N/A';

  // Grade distribution for chart
  const gradeDistribution = useMemo(() => {
    const ranges = [
      { label: '90-100', min: 90, max: 100, color: 'bg-green-500' },
      { label: '80-89', min: 80, max: 89, color: 'bg-blue-500' },
      { label: '75-79', min: 75, max: 79, color: 'bg-yellow-500' },
      { label: 'Below 75', min: 0, max: 74, color: 'bg-red-500' },
    ];

    return ranges.map(range => ({
      label: range.label,
      value: gradesWithFinal.filter(g => g.finalGrade! >= range.min && g.finalGrade! <= range.max).length,
      color: range.color
    }));
  }, [gradesWithFinal]);

  // Alerts
  const alerts: Alert[] = useMemo(() => {
    const alertList: Alert[] = [];
    
    // Missing grades alert
    const studentsWithoutGrades = visibleStudents.filter(s => 
      !grades.some(g => g.studentId === s.id && typeof g.finalGrade === 'number')
    );
    if (studentsWithoutGrades.length > 0 && !dismissedAlerts.has('missing-grades')) {
      alertList.push({
        id: 'missing-grades',
        title: 'Missing Grades',
        message: `${studentsWithoutGrades.length} student(s) have no final grades recorded.`,
        type: 'warning',
      });
    }

    // Low performers alert
    const lowPerformers = gradesWithFinal.filter(g => g.finalGrade! < 75).length;
    if (lowPerformers > 0 && !dismissedAlerts.has('low-performers')) {
      alertList.push({
        id: 'low-performers',
        title: 'Students Need Support',
        message: `${lowPerformers} student(s) have grades below 75%.`,
        type: 'info',
      });
    }

    return alertList;
  }, [visibleStudents, grades, gradesWithFinal, dismissedAlerts]);

  // Recent activity
  const recentActivity: Activity[] = useMemo(() => {
    const activities: Activity[] = [];
    
    // This would be dynamically generated based on real activity logs
    // For now, sample data
    if (gradesWithFinal.length > 0) {
      activities.push({
        id: '1',
        title: 'Grades Updated',
        description: `${gradesWithFinal.length} final grades have been recorded`,
        timestamp: 'Today',
        type: 'success',
      });
    }

    if (visibleStudents.length > 0) {
      activities.push({
        id: '2',
        title: 'Students Enrolled',
        description: `Managing ${visibleStudents.length} students across sections`,
        timestamp: 'This week',
        type: 'info',
      });
    }

    return activities;
  }, [gradesWithFinal, visibleStudents]);

  // Upcoming events
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const today = new Date();
    const events: UpcomingEvent[] = [];

    // Sample events - would be from database
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    events.push({
      id: '1',
      title: 'Grade Submission Deadline',
      date: nextWeek.toISOString().split('T')[0],
      type: 'deadline',
    });

    return events;
  }, []);

  // Quick actions
  const handleQuickAction = (action: string) => {
    if (action === 'add-student') {
      navigate('/students');
    } else if (action === 'record-grade') {
      navigate('/gradebook');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          {/* Move Refresh Data button to the first position, no sync button present */}
          {schoolData.refresh && (
            <QuickActionButton
              label="Refresh Data"
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>}
              onClick={() => schoolData.refresh?.()}
              color="blue"
            />
          )}
          <QuickActionButton
            label="Add Student"
            icon={<PlusIcon />}
            onClick={() => handleQuickAction('add-student')}
            color="indigo"
          />
          <QuickActionButton
            label="Record Grade"
            icon={<ClipboardDocumentListIcon />}
            onClick={() => handleQuickAction('record-grade')}
            color="green"
          />
        </div>
      </div>

      <AlertBanner alerts={alerts} onDismiss={(id) => setDismissedAlerts(prev => new Set(prev).add(id))} />

      {/* Stats Cards with Loading State */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          title="Total Students" 
          value={visibleStudents.length.toString()} 
          icon={<AcademicCapIcon />}
          loading={schoolData.loading}
          color="indigo"
          trend="up"
          trendValue="+5"
          onClick={() => navigate('/students')}
        />
        <Card 
          title="Total Learning Areas" 
          value={learningAreas.length.toString()} 
          icon={<BookOpenIcon />}
          loading={schoolData.loading}
          color="blue"
          onClick={() => navigate('/learning-areas')}
        />
        <Card 
          title="Class Average Grade" 
          value={`${averageGrade}%`} 
          icon={<StarIcon />}
          loading={schoolData.loading}
          color={parseFloat(averageGrade) >= 85 ? 'green' : parseFloat(averageGrade) >= 75 ? 'yellow' : 'red'}
          trend={parseFloat(averageGrade) >= 85 ? 'up' : parseFloat(averageGrade) >= 75 ? 'neutral' : 'down'}
          trendValue={parseFloat(averageGrade) >= 85 ? '+2%' : ''}
          onClick={() => navigate('/gradebook')}
        />
      </div>

      {/* Charts and Activity Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon />
            <h2 className="text-xl font-semibold">Grade Distribution</h2>
          </div>
          <BarChart data={gradeDistribution} />
        </div>

        {/* Grading Progress */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Grading Progress</h2>
          <div className="flex justify-center">
            <ProgressRing 
              value={gradesWithFinal.length} 
              max={visibleStudents.length}
              color="indigo"
              label={`${gradesWithFinal.length} of ${visibleStudents.length} graded`}
            />
          </div>
        </div>
      </div>

      {/* Activity Feed and Events */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed activities={recentActivity} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon />
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
          </div>
          <UpcomingEvents events={upcomingEvents} />
        </div>
      </div>

      {/* Welcome Section */}
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome to EduSync</h2>
        <p className="text-slate-600 dark:text-slate-300">
          This is your central hub for managing school information. You can navigate using the sidebar to view students, manage learning areas, and record grades.
          The system is designed to work even when you're offline. Any changes you make will be saved locally and synced automatically when you reconnect.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
