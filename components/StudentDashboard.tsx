import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import { SchoolDataHook } from '../hooks/useSchoolData';
import { StarIcon, CheckBadgeIcon, XCircleIcon, CalendarDaysIcon, MegaphoneIcon } from './icons';
import type { AuthUser, StudentUser, Grade } from '../types';
import LineChart from './LineChart';
import AchievementBadges, { Badge } from './AchievementBadges';
import UpcomingEvents, { UpcomingEvent } from './UpcomingEvents';
import AlertBanner, { Alert } from './AlertBanner';
import ProgressRing from './ProgressRing';
import { useGradesPostgreSQL } from '../src/hooks/useGradesPostgreSQL';
import { useAttendancePostgreSQL } from '../src/hooks/useAttendancePostgreSQL';
import { useAssignmentsPostgreSQL } from '../src/hooks/useAssignmentsPostgreSQL';
import { useAnnouncementsPostgreSQL } from '../src/hooks/useAnnouncementsPostgreSQL';

interface StudentDashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ schoolData, session }) => {
  const { loading } = schoolData;
  const student = session.user as StudentUser;
  const navigate = useNavigate();

  // Fetch real data from PostgreSQL
  const { grades: pgGrades } = useGradesPostgreSQL({ studentId: student.id, schoolId: student.schoolId });
  const { attendanceRecords: pgAttendance } = useAttendancePostgreSQL({ schoolId: student.schoolId || '' });
  const { assignments, studentAssignmentGrades } = useAssignmentsPostgreSQL();
  const { announcements: pgAnnouncements } = useAnnouncementsPostgreSQL({ schoolId: student.schoolId || '' });

  // Filter announcements for students (target 'all' or 'students')
  const relevantAnnouncements = useMemo(() => {
    return (pgAnnouncements || [])
      .filter(a => a.target === 'all' || a.target === 'students')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Show latest 5
  }, [pgAnnouncements]);

  const studentGrades = useMemo(() => pgGrades || [], [pgGrades]);

  // Filter attendance records for current student
  const attendanceRecords = useMemo(() => 
    (pgAttendance || []).filter(r => r.studentId === student.id), 
    [pgAttendance, student.id]
  );

  const generalAverage = useMemo(() => {
    const finalGrades = studentGrades.map((g: Grade) => g.finalGrade).filter((g): g is number => typeof g === 'number');
    if (finalGrades.length === 0) return 'N/A';
    const total = finalGrades.reduce((sum: number, grade: number) => sum + grade, 0);
    return (total / finalGrades.length).toFixed(1);
  }, [studentGrades]);

  const attendanceTotal = useMemo(() => {
    if (attendanceRecords.length === 0) return { present: 0, absent: 0, total: 0 };

    const totals = attendanceRecords.reduce(
      (totals: { present: number; absent: number }, record: any) => {
        // Handle different attendance data structures
        const status = record.status || record.dailyStatus;
        if (status === 'present' || status === 'late') {
            totals.present++;
        } else if (status === 'absent') {
            totals.absent++;
        }
        return totals;
      },
      { present: 0, absent: 0 }
    );
    
    return { ...totals, total: totals.present + totals.absent };
  }, [attendanceRecords]);

  // Grade trend data - use actual quarterly grades
  const gradeTrend = useMemo(() => {
    if (studentGrades.length === 0) return [];
    
    // Calculate average for each quarter from actual grade data
    const quarterData: { [key: string]: number[] } = { Q1: [], Q2: [], Q3: [], Q4: [] };
    
    studentGrades.forEach((g: Grade) => {
      if (typeof g.q1 === 'number') quarterData.Q1.push(g.q1);
      if (typeof g.q2 === 'number') quarterData.Q2.push(g.q2);
      if (typeof g.q3 === 'number') quarterData.Q3.push(g.q3);
      if (typeof g.q4 === 'number') quarterData.Q4.push(g.q4);
    });
    
    const result = [];
    for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
      const grades = quarterData[quarter];
      if (grades.length > 0) {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        result.push({ label: quarter, value: Math.round(avg * 10) / 10 });
      }
    }
    
    return result;
  }, [studentGrades]);

  // Achievement badges
  const badges: Badge[] = useMemo(() => {
    const avg = parseFloat(generalAverage);
    const attendanceRate = attendanceTotal.total > 0 
      ? (attendanceTotal.present / attendanceTotal.total) * 100 
      : 0;
    
    // Must have data to earn badges
    const hasGrades = studentGrades.length > 0;
    const hasAttendance = attendanceTotal.total > 0;

    return [
      {
        id: 'honor',
        name: 'Honor Student',
        description: 'Maintain average of 90% or higher',
        type: 'gold',
        earned: hasGrades && !isNaN(avg) && avg >= 90,
      },
      {
        id: 'perfect-attendance',
        name: 'Perfect Attendance',
        description: '100% attendance rate',
        type: 'special',
        earned: hasAttendance && attendanceRate === 100,
      },
      {
        id: 'good-standing',
        name: 'Good Standing',
        description: 'Maintain average of 85% or higher',
        type: 'silver',
        earned: hasGrades && !isNaN(avg) && avg >= 85,
      },
      {
        id: 'consistent',
        name: 'Consistent Performer',
        description: 'All grades above 75%',
        type: 'bronze',
        // Must have grades AND all grades must be 75+
        earned: hasGrades && studentGrades.every(g => typeof g.finalGrade === 'number' && g.finalGrade >= 75),
      },
      {
        id: 'attentive',
        name: 'Attentive Student',
        description: '95% or higher attendance',
        type: 'bronze',
        earned: hasAttendance && attendanceRate >= 95,
      },
      {
        id: 'top-performer',
        name: 'Top Performer',
        description: 'Average in top 25% of class',
        type: 'gold',
        earned: hasGrades && !isNaN(avg) && avg >= 88, // Simplified check
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

  // Upcoming events from pending assignments
  const upcomingEvents: UpcomingEvent[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get assignments for student's section that are still pending
    const studentSectionAssignments = (assignments || []).filter(a => 
      a.sectionId === student.sectionId
    );
    
    // Find pending assignments (not yet graded for this student)
    const pendingAssignments = studentSectionAssignments.filter(assignment => {
      const studentGradeRecord = (studentAssignmentGrades || []).find(
        g => g.assignmentId === assignment.id && g.studentId === student.id
      );
      // Include if no grade record exists or score is not submitted
      return !studentGradeRecord || studentGradeRecord.score === null || studentGradeRecord.score === undefined;
    });
    
    // Sort by due date and take upcoming ones
    const sortedAssignments = pendingAssignments
      .filter(a => a.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5); // Show max 5 upcoming events
    
    return sortedAssignments.map((assignment): UpcomingEvent => ({
      id: assignment.id,
      title: assignment.title,
      date: assignment.dueDate || '',
      type: 'deadline',
    }));
  }, [assignments, studentAssignmentGrades, student.sectionId, student.id]);

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

      {/* Announcements */}
      <div className="mt-8 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MegaphoneIcon />
            <h2 className="text-xl font-semibold">Announcements</h2>
          </div>
          <button
            onClick={() => navigate('/announcements')}
            className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View All
          </button>
        </div>
        <div className="space-y-4">
          {relevantAnnouncements.length > 0 ? relevantAnnouncements.map(announcement => (
            <div key={announcement.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">{announcement.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Posted on {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {announcement.authorName && ` by ${announcement.authorName}`}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{announcement.content}</p>
            </div>
          )) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No announcements at this time.</p>
          )}
        </div>
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