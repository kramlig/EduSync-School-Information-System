import React, { useMemo } from 'react';
import Card from './Card';
import { SchoolDataState } from '../hooks/useSchoolData';
import { AcademicCapIcon, BookOpenIcon, StarIcon } from './icons';
import type { AuthUser, StudentUser } from '../types';

interface DashboardProps {
  schoolData: SchoolDataState & { loading: boolean };
  session: { user: AuthUser | StudentUser, type: 'staff' | 'student' };
}

const Dashboard: React.FC<DashboardProps> = ({ schoolData, session }) => {
  const { students, learningAreas, grades, sections, substituteAssignments, classSchedules } = schoolData;
  
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Total Students" value={visibleStudents.length.toString()} icon={<AcademicCapIcon />} />
        <Card title="Total Learning Areas" value={learningAreas.length.toString()} icon={<BookOpenIcon />} />
        <Card title="Class Average Grade" value={`${averageGrade}%`} icon={<StarIcon />} />
      </div>
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