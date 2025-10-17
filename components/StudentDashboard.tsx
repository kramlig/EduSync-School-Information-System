import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { StarIcon, CheckBadgeIcon, XCircleIcon, CalendarDaysIcon } from './icons';
import type { AuthUser, StudentUser, Grade, AttendanceStatus } from '../types';
import LineChart from './LineChart';
import AchievementBadges, { Badge } from './AchievementBadges';
import UpcomingEvents, { UpcomingEvent } from './UpcomingEvents';
import AlertBanner, { Alert } from './AlertBanner';
import ProgressRing from './ProgressRing';

interface StudentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ schoolData, session }) => {
  const { grades, attendanceRecords, loading } = schoolData;
  const student = session.user as StudentUser;
  const navigate = useNavigate();

  const studentGrades = useMemo(() => grades.filter(g => g.studentId === student.id), [grades, student.id]);

  const generalAverage = useMemo(() => {
    const finalGrades = studentGrades.map((g: Grade) => g.finalGrade).filter((g): g is number => typeof g === 'number');
    if (finalGrades.length === 0) return 'N/A';
    const total = finalGrades.reduce((sum: number, grade: number) => sum + grade, 0);
    return (total / finalGrades.length).toFixed(1);
  }, [studentGrades]);

  const attendanceTotal = useMemo(() => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    if (!record) return { present: 0, absent: 0, total: 0 };

    const totals = Object.values(record.dailyStatus).reduce(
      (totals: { present: number; absent: number }, status: AttendanceStatus) => {
        if (status === 'P' || status === 'L') {
            totals.present++;
        } else if (status === 'A') {
            totals.absent++;
        }
        return totals;
      },
      { present: 0, absent: 0 }
    );
    
    return { ...totals, total: totals.present + totals.absent };
  }, [attendanceRecords, student.id]);

  // Grade trend data (sample - would track actual grade history)
  const gradeTrend = useMemo(() => {
    if (studentGrades.length === 0) return [];
    
    // Simulate quarterly grades
    const avg = parseFloat(generalAverage);
    if (isNaN(avg)) return [];
    
    return [
      { label: 'Q1', value: Math.max(70, avg - 5) },
      { label: 'Q2', value: Math.max(70, avg - 2) },
      { label: 'Q3', value: avg },
      { label: 'Q4', value: avg },
    ];
  }, [studentGrades, generalAverage]);

  // Achievement badges
  const badges: Badge[] = useMemo(() => {
    const avg = parseFloat(generalAverage);
    const attendanceRate = attendanceTotal.total > 0 
      ? (attendanceTotal.present / attendanceTotal.total) * 100 
      : 0;

    return [
      {
        id: 'honor',
        name: 'Honor Student',
        description: 'Maintain average of 90% or higher',
        type: 'gold',
        earned: !isNaN(avg) && avg >= 90,
      },
      {
        id: 'perfect-attendance',
        name: 'Perfect Attendance',
        description: '100% attendance rate',
        type: 'special',
        earned: attendanceRate === 100 && attendanceTotal.total > 0,
      },
      {
        id: 'good-standing',
        name: 'Good Standing',
        description: 'Maintain average of 85% or higher',
        type: 'silver',
        earned: !isNaN(avg) && avg >= 85,
      },
      {
        id: 'consistent',
        name: 'Consistent Performer',
        description: 'All grades above 75%',
        type: 'bronze',
        earned: studentGrades.every(g => typeof g.finalGrade === 'number' && g.finalGrade >= 75),
      },
      {
        id: 'attentive',
        name: 'Attentive Student',
        description: '95% or higher attendance',
        type: 'bronze',
        earned: attendanceRate >= 95,
      },
      {
        id: 'top-performer',
        name: 'Top Performer',
        description: 'Average in top 25% of class',
        type: 'gold',
        earned: !isNaN(avg) && avg >= 88, // Simplified check
      },
    ];
  }, [generalAverage, attendanceTotal, studentGrades]);

  // Alerts for students
  const alerts: Alert[] = useMemo(() => {
    const alertList: Alert[] = [];
    const avg = parseFloat(generalAverage);
    const attendanceRate = attendanceTotal.total > 0 
      ? (attendanceTotal.present / attendanceTotal.total) * 100 
      : 0;

    if (!isNaN(avg) && avg < 75) {
      alertList.push({
        id: 'low-grade',
        title: 'Grade Alert',
        message: 'Your average is below 75%. Consider talking to your teacher for support.',
        type: 'warning',
      });
    }

    if (attendanceRate < 85 && attendanceTotal.total > 0) {
      alertList.push({
        id: 'low-attendance',
        title: 'Attendance Reminder',
        message: `Your attendance rate is ${attendanceRate.toFixed(0)}%. Regular attendance is important for success.`,
        type: 'info',
      });
    }

    if (!isNaN(avg) && avg >= 90) {
      alertList.push({
        id: 'great-work',
        title: 'Excellent Work!',
        message: `You're doing great with a ${avg}% average. Keep it up!`,
        type: 'success',
      });
    }

    return alertList;
  }, [generalAverage, attendanceTotal]);

  // Upcoming events for students
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return [
      {
        id: '1',
        title: 'Science Quiz',
        date: nextWeek.toISOString().split('T')[0],
        time: '10:00 AM',
        type: 'exam',
      },
      {
        id: '2',
        title: 'Math Assignment Due',
        date: new Date(today.setDate(today.getDate() + 3)).toISOString().split('T')[0],
        type: 'deadline',
      },
    ];
  }, []);

  // Comparison metrics
  const classComparison = useMemo(() => {
    const avg = parseFloat(generalAverage);
    if (isNaN(avg)) return 'N/A';
    
    // Simplified - in reality would compare to actual class average
    if (avg >= 90) return 'Top 10%';
    if (avg >= 85) return 'Top 25%';
    if (avg >= 80) return 'Top 50%';
    return 'Keep improving!';
  }, [generalAverage]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Dashboard</h1>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Class Rank: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{classComparison}</span>
        </div>
      </div>

      <AlertBanner alerts={alerts} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card 
          title="General Average" 
          value={`${generalAverage}%`} 
          icon={<StarIcon />}
          loading={loading}
          color={parseFloat(generalAverage) >= 85 ? 'green' : parseFloat(generalAverage) >= 75 ? 'yellow' : 'red'}
          trend={parseFloat(generalAverage) >= 85 ? 'up' : parseFloat(generalAverage) >= 75 ? 'neutral' : 'down'}
          trendValue={classComparison}
          onClick={() => navigate('/grades')}
        />
        <Card 
          title="Days Present" 
          value={attendanceTotal.present.toString()} 
          icon={<CheckBadgeIcon />}
          loading={loading}
          color="green"
          onClick={() => navigate('/attendance')}
        />
        <Card 
          title="Days Absent" 
          value={attendanceTotal.absent.toString()} 
          icon={<XCircleIcon />}
          loading={loading}
          color={attendanceTotal.absent > 5 ? 'red' : 'yellow'}
          onClick={() => navigate('/attendance')}
        />
      </div>

      {/* Grade Trend and Attendance Progress */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Grade Trend</h2>
          <LineChart data={gradeTrend} color="indigo" />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Attendance Rate</h2>
          <div className="flex justify-center">
            <ProgressRing 
              value={attendanceTotal.present} 
              max={attendanceTotal.total}
              color={attendanceTotal.total > 0 && (attendanceTotal.present / attendanceTotal.total) >= 0.95 ? 'green' : 'blue'}
              label={`${attendanceTotal.total > 0 ? ((attendanceTotal.present / attendanceTotal.total) * 100).toFixed(0) : 0}% attendance`}
            />
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <AchievementBadges badges={badges} />
      </div>

      {/* Upcoming Events */}
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDaysIcon />
          <h2 className="text-xl font-semibold">Upcoming</h2>
        </div>
        <UpcomingEvents events={upcomingEvents} />
      </div>

      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {student.name}!</h2>
        <p className="text-slate-600 dark:text-slate-300">
          This is your personal portal to view your academic progress. Use the sidebar to navigate to your grades, core values, attendance records, and class schedule.
          If you have any questions, please reach out to your class adviser.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;