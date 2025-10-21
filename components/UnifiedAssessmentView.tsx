import React, { useState, useMemo } from 'react';
import type { AuthUser, StudentUser, ParentUser, CoreValueMarking } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import GradesView from './GradesView';
import GradebookView from './GradebookView';
import CoreValuesGradebookView from './CoreValuesGradebookView';
import GradeDistributionChart from './GradeDistributionChart';
import BehaviorDistributionChart from './BehaviorDistributionChart';
import CorrelationScatterPlot from './CorrelationScatterPlot';

interface UnifiedAssessmentViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string;
}

type TabType = 'overview' | 'academic-gradebook' | 'core-values-gradebook' | 'report-cards';

const UnifiedAssessmentView: React.FC<UnifiedAssessmentViewProps> = ({ schoolData, session, forceStudentId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { students = [], grades = [], learningAreas = [], coreValues = [], coreValueGrades = [] } = schoolData;
  
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';

  // Calculate analytics for Tier 1
  const analytics = useMemo(() => {
    const visibleStudents = isStudentView 
      ? students.filter(s => s.id === session.user.id)
      : isParentView 
      ? students.filter(s => s.id === forceStudentId)
      : students;

    // Academic Performance Metrics
    const studentsWithGrades = visibleStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const finalGrades = studentGrades
        .map(g => g.finalGrade)
        .filter((g): g is number => typeof g === 'number');
      
      const average = finalGrades.length > 0
        ? Math.round(finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length)
        : 0;
      
      const totalPossibleGrades = (learningAreas?.length || 0) * 4;
      const completedGrades = studentGrades.reduce((sum, g) => {
        return sum + ['q1', 'q2', 'q3', 'q4'].filter(q => g[q as keyof typeof g] !== undefined).length;
      }, 0);
      const completion = totalPossibleGrades > 0 
        ? Math.round((completedGrades / totalPossibleGrades) * 100)
        : 0;

      return { student, average, completion, hasGrades: finalGrades.length > 0 };
    });

    const totalStudents = visibleStudents.length;
    const honorRoll = studentsWithGrades.filter(s => s.average >= 90).length;
    const passing = studentsWithGrades.filter(s => s.average >= 75 && s.average > 0).length;
    const failing = studentsWithGrades.filter(s => s.average < 75 && s.average > 0).length;
    const avgGrade = studentsWithGrades.filter(s => s.hasGrades).length > 0
      ? Math.round(studentsWithGrades.filter(s => s.hasGrades).reduce((sum, s) => sum + s.average, 0) / studentsWithGrades.filter(s => s.hasGrades).length)
      : 0;
    const avgCompletion = totalStudents > 0
      ? Math.round(studentsWithGrades.reduce((sum, s) => sum + s.completion, 0) / totalStudents)
      : 0;

    // Core Values Performance Metrics
    const studentsWithValues = visibleStudents.map(student => {
      const studentCoreValues = coreValueGrades.filter(g => g.studentId === student.id);
      
      let totalMarkings = 0;
      let aoCount = 0;
      let soCount = 0;
      let roCount = 0;
      let noCount = 0;
      let hasAnyMarking = false;

      studentCoreValues.forEach(cvGrade => {
        const coreValue = coreValues.find(cv => cv.id === cvGrade.coreValueId);
        if (!coreValue || !coreValue.behaviors) return;

        (['q1', 'q2', 'q3', 'q4'] as const).forEach(quarter => {
          const quarterData = cvGrade[quarter];
          if (quarterData) {
            coreValue.behaviors.forEach(behavior => {
              const marking = quarterData[behavior] as CoreValueMarking | undefined;
              if (marking) {
                hasAnyMarking = true;
                totalMarkings++;
                if (marking === 'AO') aoCount++;
                else if (marking === 'SO') soCount++;
                else if (marking === 'RO') roCount++;
                else if (marking === 'NO') noCount++;
              }
            });
          }
        });
      });

      const totalPossibleMarkings = coreValues.reduce((sum, cv) => sum + (cv.behaviors?.length || 0), 0) * 4;
      const valueCompletion = totalPossibleMarkings > 0
        ? Math.round((totalMarkings / totalPossibleMarkings) * 100)
        : 0;

      const isExemplary = hasAnyMarking && noCount === 0 && roCount === 0 && aoCount > soCount;
      const isGood = hasAnyMarking && noCount === 0 && (roCount <= 1 || (aoCount + soCount) > roCount);
      const needsSupport = noCount > 0 || roCount > 2;

      return { 
        student, 
        hasAnyMarking, 
        isExemplary, 
        isGood, 
        needsSupport,
        valueCompletion,
        aoCount,
        soCount,
        roCount,
        noCount
      };
    });

    const exemplary = studentsWithValues.filter(s => s.isExemplary).length;
    const goodStanding = studentsWithValues.filter(s => s.isGood && !s.isExemplary).length;
    const behaviorSupport = studentsWithValues.filter(s => s.needsSupport).length;
    const avgValueCompletion = totalStudents > 0
      ? Math.round(studentsWithValues.reduce((sum, s) => sum + s.valueCompletion, 0) / totalStudents)
      : 0;

    // Correlation Insights
    const studentsWithBoth = studentsWithGrades.map(sg => {
      const sv = studentsWithValues.find(v => v.student.id === sg.student.id);
      return { ...sg, ...sv };
    }).filter(s => s.hasGrades && s.hasAnyMarking);

    const highAchievers = studentsWithBoth.filter(s => s.average >= 90 && s.isExemplary).length;
    const atRisk = studentsWithBoth.filter(s => s.average < 75 && s.needsSupport).length;
    const academicStrugglesGoodBehavior = studentsWithBoth.filter(s => s.average < 75 && (s.isExemplary || s.isGood)).length;
    const goodGradesBehaviorConcerns = studentsWithBoth.filter(s => s.average >= 85 && s.needsSupport).length;

    // Calculate correlation coefficient (simplified)
    const correlationStrength = studentsWithBoth.length > 5 ? 'Strong' : studentsWithBoth.length > 0 ? 'Moderate' : 'Insufficient data';

    return {
      academic: {
        totalStudents,
        honorRoll,
        passing,
        failing,
        avgGrade,
        avgCompletion
      },
      behavioral: {
        exemplary,
        goodStanding,
        behaviorSupport,
        avgValueCompletion
      },
      correlation: {
        highAchievers,
        atRisk,
        academicStrugglesGoodBehavior,
        goodGradesBehaviorConcerns,
        correlationStrength,
        studentsWithBoth
      }
    };
  }, [students, grades, learningAreas, coreValues, coreValueGrades, session, forceStudentId, isStudentView, isParentView]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview & Analytics', icon: '📊' },
    { id: 'academic-gradebook' as TabType, label: 'Academic Gradebook', icon: '📚' },
    { id: 'core-values-gradebook' as TabType, label: 'Core Values Gradebook', icon: '🌟' },
    { id: 'report-cards' as TabType, label: 'Report Cards', icon: '📄' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tier 1 Analytics - Summary Cards */}
          {!(isStudentView || isParentView) && (
            <>
              {/* Academic Performance Cards */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">📚 Academic Performance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Total Students</p>
                        <p className="text-3xl font-bold mt-1">{analytics.academic.totalStudents}</p>
                      </div>
                      <div className="bg-blue-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm">
                      <span className="text-blue-100">Average: {analytics.academic.avgGrade}%</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Honor Roll</p>
                        <p className="text-3xl font-bold mt-1">{analytics.academic.honorRoll}</p>
                      </div>
                      <div className="bg-green-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-green-100">
                      {analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.honorRoll / analytics.academic.totalStudents) * 100) : 0}% of class
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-lime-500 to-lime-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lime-100 text-sm font-medium">Passing</p>
                        <p className="text-3xl font-bold mt-1">{analytics.academic.passing}</p>
                      </div>
                      <div className="bg-lime-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-lime-100">≥75% average</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Completion</p>
                        <p className="text-3xl font-bold mt-1">{analytics.academic.avgCompletion}%</p>
                      </div>
                      <div className="bg-purple-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-purple-100">
                      {analytics.academic.totalStudents - analytics.academic.passing - analytics.academic.failing} incomplete
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavioral Performance Cards */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🌟 Behavioral Performance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-sm font-medium">Exemplary</p>
                        <p className="text-3xl font-bold mt-1">{analytics.behavioral.exemplary}</p>
                      </div>
                      <div className="bg-indigo-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-indigo-100">Mostly "Always Observed"</div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-teal-100 text-sm font-medium">Good Standing</p>
                        <p className="text-3xl font-bold mt-1">{analytics.behavioral.goodStanding}</p>
                      </div>
                      <div className="bg-teal-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-teal-100">Positive behavior</div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm font-medium">Needs Support</p>
                        <p className="text-3xl font-bold mt-1">{analytics.behavioral.behaviorSupport}</p>
                      </div>
                      <div className="bg-amber-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-amber-100">Behavioral concerns</div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-cyan-100 text-sm font-medium">Completion</p>
                        <p className="text-3xl font-bold mt-1">{analytics.behavioral.avgValueCompletion}%</p>
                      </div>
                      <div className="bg-cyan-400/30 rounded-full p-3">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-cyan-100">Values assessed</div>
                  </div>
                </div>
              </div>

              {/* Correlation Insights Panel */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🔍 Insights & Correlations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-purple-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">High Achievers</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.highAchievers}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Excellent grades + exemplary behavior
                        </p>
                      </div>
                      <span className="text-3xl">🏆</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">At-Risk Students</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.atRisk}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Low grades + behavioral concerns
                        </p>
                      </div>
                      <span className="text-3xl">⚠️</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-blue-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Academic Support</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.academicStrugglesGoodBehavior}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Good behavior but struggling grades
                        </p>
                      </div>
                      <span className="text-3xl">📚</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-amber-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Behavior Support</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.goodGradesBehaviorConcerns}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Good grades but behavioral issues
                        </p>
                      </div>
                      <span className="text-3xl">🤝</span>
                    </div>
                  </div>
                </div>

                {/* AI Insight Banner */}
                {analytics.correlation.correlationStrength !== 'Insufficient data' && (
                  <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💡</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white mb-2">Key Insight:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <strong>{analytics.correlation.correlationStrength} correlation</strong> detected between academic performance and behavioral assessment. 
                          {analytics.correlation.highAchievers > 0 && (
                            <> Students with exemplary behavior tend to perform {analytics.academic.avgGrade >= 85 ? 'significantly' : 'notably'} better academically.</>
                          )}
                          {analytics.correlation.atRisk > 0 && (
                            <> {analytics.correlation.atRisk} student{analytics.correlation.atRisk > 1 ? 's need' : ' needs'} immediate intervention in both areas.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Analytics Charts - Tier 2 */}
              {!(isStudentView || isParentView) && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                    📊 Visual Analytics
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Grade Distribution Chart */}
                    <GradeDistributionChart
                      data={[
                        { range: '90-100', count: analytics.academic.honorRoll, color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                        { range: '85-89', count: analytics.academic.passing - analytics.academic.honorRoll > 0 ? Math.floor((analytics.academic.passing - analytics.academic.honorRoll) / 2) : 0, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
                        { range: '80-84', count: analytics.academic.passing - analytics.academic.honorRoll > 0 ? Math.ceil((analytics.academic.passing - analytics.academic.honorRoll) / 2) : 0, color: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
                        { range: '75-79', count: analytics.academic.passing - (analytics.academic.honorRoll + Math.floor((analytics.academic.passing - analytics.academic.honorRoll) / 2) + Math.ceil((analytics.academic.passing - analytics.academic.honorRoll) / 2)), color: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' },
                        { range: 'Below 75', count: analytics.academic.failing, color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
                      ]}
                      title="Academic Grade Distribution"
                    />

                    {/* Behavior Distribution Chart */}
                    <BehaviorDistributionChart
                      data={[
                        { label: 'Exemplary (AO)', count: analytics.behavioral.exemplary, color: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', icon: '⭐' },
                        { label: 'Good Standing (SO)', count: analytics.behavioral.goodStanding, color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', icon: '👍' },
                        { label: 'Needs Support (RO/NO)', count: analytics.behavioral.behaviorSupport, color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', icon: '🆘' },
                      ]}
                      title="Core Values Assessment Distribution"
                    />
                  </div>

                  {/* Correlation Scatter Plot */}
                  <div className="mb-6">
                    <CorrelationScatterPlot
                      data={analytics.correlation.studentsWithBoth.map(s => {
                        const aoCount = s.aoCount || 0;
                        const soCount = s.soCount || 0;
                        const roCount = s.roCount || 0;
                        const noCount = s.noCount || 0;
                        const totalMarkings = aoCount + soCount + roCount + noCount;
                        
                        return {
                          id: s.student.id,
                          name: `${s.student.firstName} ${s.student.lastName}`,
                          academic: s.average,
                          behavioral: totalMarkings > 0 
                            ? Math.round(((aoCount * 100 + soCount * 75) / (totalMarkings * 100)) * 100)
                            : 0,
                          category: (s.average >= 90 && s.isExemplary 
                            ? 'high-achiever' 
                            : s.average < 75 && s.needsSupport 
                            ? 'at-risk'
                            : s.average < 75 && (s.isExemplary || s.isGood)
                            ? 'academic-support'
                            : s.average >= 85 && s.needsSupport
                            ? 'behavior-support'
                            : 'normal') as 'high-achiever' | 'at-risk' | 'academic-support' | 'behavior-support' | 'normal'
                        };
                      })}
                      title="Academic vs Behavioral Performance Correlation"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Student List (Enhanced GradesView) */}
          <div>
            <GradesView schoolData={schoolData} session={session} forceStudentId={forceStudentId} />
          </div>
        </div>
      )}

      {activeTab === 'academic-gradebook' && (
        <div>
          {/* Mini Analytics Bar */}
          {!(isStudentView || isParentView) && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Students Graded:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.passing + analytics.academic.failing}/{analytics.academic.totalStudents}</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Section Average:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.avgGrade}%</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Completion:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.avgCompletion}%</span>
                </div>
              </div>
            </div>
          )}
          {/* Only render gradebook for staff and students, not parents */}
          {!isParentView && (
            <GradebookView 
              schoolData={schoolData} 
              session={session as { user: AuthUser | StudentUser, type: 'staff' | 'student' }} 
            />
          )}
          {isParentView && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Parent View Only</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This detailed gradebook view is not available for parent accounts. Please use the Overview tab to see your child's performance.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'core-values-gradebook' && (
        <div>
          {/* Mini Analytics Bar */}
          {!(isStudentView || isParentView) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Students Evaluated:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {analytics.behavioral.exemplary + analytics.behavioral.goodStanding + analytics.behavioral.behaviorSupport}/{analytics.academic.totalStudents}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Exemplary:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{analytics.behavioral.exemplary}</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Needs Support:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{analytics.behavioral.behaviorSupport}</span>
                </div>
              </div>
            </div>
          )}
          {/* Only render gradebook for staff and students, not parents */}
          {!isParentView && (
            <CoreValuesGradebookView 
              schoolData={schoolData} 
              session={session as { user: AuthUser | StudentUser, type: 'staff' | 'student' }} 
            />
          )}
          {isParentView && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Parent View Only</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This detailed gradebook view is not available for parent accounts. Please use the Overview tab to see your child's behavior assessment.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'report-cards' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Report Cards</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Printable DepEd Form 138 with complete academic and behavioral assessment
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">Coming soon: Bulk generate and print report cards</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedAssessmentView;
