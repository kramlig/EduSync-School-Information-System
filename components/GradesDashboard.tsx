import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthUser, StudentUser, ParentUser } from '../types';
import type { SchoolDataHook } from '../hooks/useSchoolData';

interface GradesDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  schoolData: SchoolDataHook;
}

const GradesDashboard: React.FC<GradesDashboardProps> = ({ session, schoolData }) => {
  const navigate = useNavigate();
  const { students = [], grades = [], coreValueGrades = [], sections = [], classSchedules = [] } = schoolData;
  const authUser = session.user as AuthUser;
  const isTeacherView = session.type === 'staff' && authUser.role === 'teacher';
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';

  // Calculate visible students based on role
  const visibleStudents = useMemo(() => {
    if (isStudentView) {
      return students.filter(s => s.id === session.user.id);
    }
    
    if (isParentView) {
      // Parents see their own children only
      return students.filter(s => s.id === (session.user as ParentUser).children?.[0]);
    }
    
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return students;
    }

    // Teacher: filter by assigned sections
    const authorizedSectionIds = new Set<string>();

    // Check class schedules
    classSchedules.forEach(schedule => {
      if (schedule.teacherId === authUser.id && schedule.sectionId) {
        authorizedSectionIds.add(schedule.sectionId);
      }
    });

    // Check adviser status
    sections.forEach(section => {
      if (section.adviserId === authUser.id) {
        authorizedSectionIds.add(section.id);
      }
    });

    // Check assignments
    if (authUser.assignments && authUser.assignments.length > 0) {
      authUser.assignments.forEach(assignment => {
        if (assignment.sectionId) {
          authorizedSectionIds.add(assignment.sectionId);
        }
      });
    }

    if (authorizedSectionIds.size === 0) return [];

    return students.filter(s => s.sectionId && authorizedSectionIds.has(s.sectionId));
  }, [authUser, students, classSchedules, sections, isStudentView, isParentView, session.user]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalStudents = visibleStudents.length;
    const studentIds = new Set(visibleStudents.map(s => s.id));
    
    // Filter grades for visible students
    const visibleGrades = grades.filter(g => studentIds.has(g.studentId));
    
    // Calculate average grade
    const gradeValues = visibleGrades
      .map(g => g.finalGrade)
      .filter((grade): grade is number => typeof grade === 'number' && grade > 0);
    const avgGrade = gradeValues.length > 0 
      ? gradeValues.reduce((sum, g) => sum + g, 0) / gradeValues.length 
      : 0;

    // Calculate completion rate (students with grades)
    const studentsWithGrades = new Set(visibleGrades.map(g => g.studentId)).size;
    const completionRate = totalStudents > 0 ? (studentsWithGrades / totalStudents) * 100 : 0;

    // Calculate excellence rate (grades >= 90)
    const excellentGrades = gradeValues.filter(g => g >= 90).length;
    const excellenceRate = gradeValues.length > 0 ? (excellentGrades / gradeValues.length) * 100 : 0;

    // Core values statistics
    const visibleCoreValueGrades = coreValueGrades.filter(cvg => studentIds.has(cvg.studentId));
    const studentsWithCoreValues = new Set(visibleCoreValueGrades.map(cvg => cvg.studentId)).size;
    const coreValuesCompletion = totalStudents > 0 ? (studentsWithCoreValues / totalStudents) * 100 : 0;

    return {
      totalStudents,
      avgGrade: avgGrade.toFixed(1),
      completionRate: completionRate.toFixed(1),
      excellenceRate: excellenceRate.toFixed(1),
      coreValuesCompletion: coreValuesCompletion.toFixed(1),
      gradesCount: visibleGrades.length,
      coreValuesCount: visibleCoreValueGrades.length
    };
  }, [visibleStudents, grades, coreValueGrades]);

  const navigationCards = [
    {
      id: 'overview',
      title: 'Overview & Analytics',
      icon: '📊',
      description: 'View student performance summaries and quick insights',
      route: '/grades/overview',
      gradient: 'from-blue-500 to-indigo-600',
      stats: { label: 'Students', value: stats.totalStudents },
      visible: true
    },
    {
      id: 'academic',
      title: 'Academic Gradebook',
      icon: '📝',
      description: 'Enter and manage academic grades by quarter',
      route: '/grades/academic',
      gradient: 'from-violet-500 to-purple-600',
      stats: { label: 'Grades', value: stats.gradesCount },
      visible: !isParentView // Parents can't edit grades
    },
    {
      id: 'core-values',
      title: 'Core Values Gradebook',
      icon: '💎',
      description: 'Record and track behavioral assessments',
      route: '/grades/core-values',
      gradient: 'from-emerald-500 to-teal-600',
      stats: { label: 'Assessments', value: stats.coreValuesCount },
      visible: !isParentView // Parents can't edit core values
    },
    {
      id: 'analytics',
      title: 'Deep Analytics',
      icon: '🔬',
      description: 'View detailed charts, trends, and insights',
      route: '/grades/analytics',
      gradient: 'from-amber-500 to-orange-600',
      stats: { label: 'Avg Grade', value: `${stats.avgGrade}%` },
      visible: true
    }
  ];

  const visibleCards = navigationCards.filter(card => card.visible);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Grades & Reports
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {isStudentView 
            ? 'View your academic performance and grades'
            : isParentView
            ? "View your child's academic performance"
            : isTeacherView
            ? 'Manage grades and assessments for your students'
            : 'Comprehensive grade management and analytics'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">
                {isStudentView ? 'Your Grades' : 'Total Students'}
              </p>
              <p className="text-4xl font-bold mt-2">{stats.totalStudents}</p>
            </div>
            <div className="bg-blue-400/30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Average Grade</p>
              <p className="text-4xl font-bold mt-2">{stats.avgGrade}%</p>
            </div>
            <div className="bg-green-400/30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
              <p className="text-4xl font-bold mt-2">{stats.completionRate}%</p>
            </div>
            <div className="bg-purple-400/30 rounded-full p-3">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Excellence Rate</p>
              <p className="text-4xl font-bold mt-2">{stats.excellenceRate}%</p>
            </div>
            <div className="bg-amber-400/30 rounded-full p-3">
              <span className="text-4xl">🌟</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleCards.map((card) => (
          <button
            key={card.id}
            onClick={() => navigate(card.route)}
            className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden text-left p-6 border-2 border-transparent hover:border-indigo-500"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
            
            {/* Content */}
            <div className="relative">
              {/* Icon & Title */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-5xl bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {card.title}
                    </h3>
                  </div>
                </div>
                
                {/* Arrow Icon */}
                <svg 
                  className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                {card.description}
              </p>

              {/* Stats Badge */}
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${card.gradient} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md`}>
                  <span>{card.stats.label}:</span>
                  <span className="font-bold">{card.stats.value}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              💡 Quick Navigation Tip
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click any card above to access that specific view. Each view maintains its own filters and settings for a cleaner experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesDashboard;
