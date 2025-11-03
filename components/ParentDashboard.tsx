import React, { useMemo } from 'react';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { AcademicCapIcon, MegaphoneIcon, CalendarDaysIcon, StarIcon, CheckBadgeIcon } from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import UpcomingEvents, { UpcomingEvent } from './UpcomingEvents';
import ProgressRing from './ProgressRing';
import LineChart from './LineChart';
import Form138DownloadButtonV2 from './Form138DownloadButtonV2';

interface ParentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ schoolData, session }) => {
  const { students, announcements, teachers, grades, attendanceRecords, loading } = schoolData;
  const parent = session.user as ParentUser;

  const children = useMemo(() => {
    return students.filter(s => parent.studentIds.includes(s.id));
  }, [students, parent]);

  // Calculate children's performance
  const childrenStats = useMemo(() => {
    return children.map(child => {
      const childGrades = grades.filter(g => g.studentId === child.id);
      const finalGrades = childGrades
        .map(g => g.finalGrade)
        .filter((g): g is number => typeof g === 'number');
      
      const average = finalGrades.length > 0
        ? finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length
        : 0;

      const attendance = attendanceRecords.find(r => r.studentId === child.id);
      const attendanceData = attendance
        ? Object.values(attendance.dailyStatus).reduce(
            (acc, status) => {
              if (status === 'P' || status === 'L') acc.present++;
              else if (status === 'A') acc.absent++;
              return acc;
            },
            { present: 0, absent: 0 }
          )
        : { present: 0, absent: 0 };

      return {
        id: child.id,
        name: child.name,
        average: average.toFixed(1),
        attendance: attendanceData,
        attendanceRate: (attendanceData.present + attendanceData.absent) > 0
          ? ((attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100).toFixed(0)
          : '0',
      };
    });
  }, [children, grades, attendanceRecords]);

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

  const relevantAnnouncements = useMemo(() => {
    return announcements
        .filter(a => ['all', 'parents'].includes(a.target))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5); // Show latest 5
  }, [announcements]);

  const getAuthorName = (authorId: string) => {
    return teachers.find(t => t.id === authorId)?.name || 'School Admin';
  };

  // Upcoming events for parents
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 10);
    
    return [
      {
        id: '1',
        title: 'Parent-Teacher Conference',
        date: nextWeek.toISOString().split('T')[0],
        time: '2:00 PM',
        type: 'meeting',
      },
      {
        id: '2',
        title: 'Report Card Distribution',
        date: new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0],
        type: 'event',
      },
    ];
  }, []);

  // Comparison data for multi-child view
  const childrenComparisonData = useMemo(() => {
    return childrenStats.map(child => ({
      label: child.name.split(' ')[0], // First name only for space
      value: parseFloat(child.average) || 0,
    }));
  }, [childrenStats]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Parent Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          title="My Children" 
          value={children.length.toString()} 
          icon={<AcademicCapIcon />}
          loading={loading}
          color="indigo"
        />
        <Card 
          title="Family Average" 
          value={`${familyAverage}%`} 
          icon={<StarIcon />}
          loading={loading}
          color={parseFloat(familyAverage) >= 85 ? 'green' : parseFloat(familyAverage) >= 75 ? 'yellow' : 'red'}
        />
        <Card 
          title="Overall Attendance" 
          value={`${totalAttendanceRate}%`} 
          icon={<CheckBadgeIcon />}
          loading={loading}
          color={parseFloat(totalAttendanceRate) >= 95 ? 'green' : 'blue'}
        />
      </div>

      {/* Children Performance Comparison */}
      {children.length > 1 && (
        <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Children Performance Comparison</h2>
          <LineChart data={childrenComparisonData} color="indigo" />
        </div>
      )}

      {/* Individual Child Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenStats.map(child => {
          const student = children.find(s => s.id === child.id);
          if (!student) return null;

          return (
            <div key={child.id} className="space-y-4">
              {/* Performance Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  {child.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Average</span>
                    <span className={`text-lg font-bold ${
                      parseFloat(child.average) >= 85 
                        ? 'text-green-600 dark:text-green-400'
                        : parseFloat(child.average) >= 75
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {child.average}%
                    </span>
                  </div>
                  <div className="flex justify-center pt-2">
                    <ProgressRing 
                      value={child.attendance.present}
                      max={child.attendance.present + child.attendance.absent}
                      size={100}
                      strokeWidth={6}
                      color={parseFloat(child.attendanceRate) >= 95 ? 'green' : 'blue'}
                      label="Attendance"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Present: {child.attendance.present}</span>
                    <span>Absent: {child.attendance.absent}</span>
                  </div>
                </div>
              </div>

              {/* Form 138 Download Button - Official Format */}
              <Form138DownloadButtonV2
                student={student}
                schoolData={schoolData}
              />
            </div>
          );
        })}
      </div>

      {/* Announcements and Events */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center"><MegaphoneIcon/> <span className="ml-2">Recent Announcements</span></h2>
            <div className="space-y-4">
                {relevantAnnouncements.length > 0 ? relevantAnnouncements.map(an => (
                    <div key={an.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{an.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Posted on {an.date} by {getAuthorName(an.authorId)}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{an.content}</p>
                    </div>
                )) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No recent announcements.</p>
                )}
            </div>
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
        <h2 className="text-xl font-semibold mb-4">Welcome, {parent.name}!</h2>
        <p className="text-slate-600 dark:text-slate-300">
          This is your personal portal to stay updated on your children's academic progress.
          You can view their grades, attendance, and stay informed about school announcements and events.
          For any concerns, please don't hesitate to reach out to your children's teachers.
        </p>
      </div>
    </div>
  );
};

export default ParentDashboard;