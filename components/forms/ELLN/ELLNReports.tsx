/**
 * ELLN Reports Dashboard
 * 
 * Generate section-level, grade-level, and school-wide ELLN assessment reports.
 * Includes summary statistics, proficiency distribution, and Excel export.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ELLNAssessment, ProficiencyLevel } from '../shared/FormTypes';
import { ELLNService } from '../../../services/formsService';
import { getCurrentSchoolYear } from '../../../services/dateHelpers';
import { useSchoolData } from '../../../hooks/useSchoolData.simplified';
import { exportELLNToExcel } from '../../../services/ellnExportService';
import StatisticalReports from './StatisticalReports';
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon,
  ChartBarIcon,
  UserGroupIcon,
  HomeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface ReportSummary {
  totalAssessments: number;
  avgLiteracy: number;
  avgNumeracy: number;
  avgOverall: number;
  proficiencyDistribution: Record<ProficiencyLevel, number>;
}

/**
 * Get proficiency level color
 */
function getProficiencyColor(level: ProficiencyLevel): string {
  switch (level) {
    case 'Advanced': return 'bg-purple-100 text-purple-700';
    case 'Proficient': return 'bg-green-100 text-green-700';
    case 'Approaching': return 'bg-blue-100 text-blue-700';
    case 'Developing': return 'bg-yellow-100 text-yellow-700';
    case 'Beginning': return 'bg-orange-100 text-orange-700';
  }
}

/**
 * Calculate summary statistics from assessments
 */
function calculateSummary(assessments: ELLNAssessment[]): ReportSummary {
  if (assessments.length === 0) {
    return {
      totalAssessments: 0,
      avgLiteracy: 0,
      avgNumeracy: 0,
      avgOverall: 0,
      proficiencyDistribution: {
        'Advanced': 0,
        'Proficient': 0,
        'Approaching': 0,
        'Developing': 0,
        'Beginning': 0
      }
    };
  }

  const totalLiteracy = assessments.reduce((sum, a) => sum + a.literacyScore, 0);
  const totalNumeracy = assessments.reduce((sum, a) => sum + a.numeracyScore, 0);
  const totalOverall = assessments.reduce((sum, a) => sum + a.overallScore, 0);

  const distribution: Record<ProficiencyLevel, number> = {
    'Advanced': 0,
    'Proficient': 0,
    'Approaching': 0,
    'Developing': 0,
    'Beginning': 0
  };

  assessments.forEach(a => {
    distribution[a.proficiencyLevel]++;
  });

  return {
    totalAssessments: assessments.length,
    avgLiteracy: Math.round((totalLiteracy / assessments.length) * 10) / 10,
    avgNumeracy: Math.round((totalNumeracy / assessments.length) * 10) / 10,
    avgOverall: Math.round((totalOverall / assessments.length) * 10) / 10,
    proficiencyDistribution: distribution
  };
}

// Available grades constant (outside component to avoid recreating on every render)
const AVAILABLE_GRADES = [0, 1, 2, 3, 7, 8]; // K-3 and Grade 7-8 for demo

export default function ELLNReports() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  
  // Use PostgreSQL hooks
  const { students } = useStudentsPostgreSQL({ schoolId });
  const { sections } = useSectionsPostgreSQL({ schoolId });

  // State
  const [reportType, setReportType] = useState<'section' | 'grade' | 'school'>('section');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | ''>(''); // '' for "All Grades"
  const [quarter, setQuarter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [assessments, setAssessments] = useState<ELLNAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  // Filter sections based on available grades
  const filteredSections = sections.filter(s => AVAILABLE_GRADES.includes(s.gradeLevel));

  /**
   * Load assessments based on report type
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let data: ELLNAssessment[] = [];
        const schoolYear = getCurrentSchoolYear();

        if (reportType === 'section' && selectedSection) {
          // Get students in the section
          const sectionStudents = students.filter(s => s.sectionId === selectedSection);
          const studentIds = sectionStudents.map(s => s.id);
          
          // Load assessments for all students in section
          const promises = studentIds.map(id => ELLNService.getByStudentId(id));
          const results = await Promise.all(promises);
          data = results.flat();
          
        } else if (reportType === 'grade') {
          // Load assessments for selected grade(s)
          if (selectedGrade === '') {
            // Load all grades
            const promises = AVAILABLE_GRADES.map((grade: number) => 
              ELLNService.getByGradeAndYear(grade, schoolYear)
            );
            const results = await Promise.all(promises);
            data = results.flat();
          } else {
            // Load specific grade
            data = await ELLNService.getByGradeAndYear(selectedGrade, schoolYear);
          }
          
        } else if (reportType === 'school') {
          // Load all available grades
          const promises = AVAILABLE_GRADES.map((grade: number) => 
            ELLNService.getByGradeAndYear(grade, schoolYear)
          );
          const results = await Promise.all(promises);
          data = results.flat();
        }

        // Filter by quarter if not 'all'
        if (quarter !== 'all') {
          data = data.filter(a => a.quarter === quarter);
        }

        setAssessments(data);
        setSummary(calculateSummary(data));
        
      } catch (err) {
        console.error('Error loading report data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reportType, selectedSection, selectedGrade, quarter, students]);

  /**
   * Export to Excel
   */
  const handleExport = () => {
    if (!summary || assessments.length === 0) return;

    // Build students map
    const studentsMap = new Map();
    assessments.forEach(assessment => {
      if (!studentsMap.has(assessment.studentId)) {
        const student = students.find(s => s.id === assessment.studentId);
        const section = sections.find(sec => sec.id === student?.sectionId);
        if (student) {
          studentsMap.set(assessment.studentId, {
            id: student.id,
            name: student.name || `${student.lastName}, ${student.firstName} ${student.middleName || ''}`.trim(),
            lrn: student.lrn || 'N/A',
            gradeLevel: section?.gradeLevel || 0,
            sectionName: section?.name || 'N/A'
          });
        }
      }
    });

    // Determine report name
    let reportName = '';
    if (reportType === 'section' && selectedSection) {
      const section = sections.find(s => s.id === selectedSection);
      reportName = section ? `${section.name}_Grade${section.gradeLevel}` : 'Section';
    } else if (reportType === 'grade') {
      reportName = selectedGrade === '' ? 'All_Grades' : `Grade_${selectedGrade}`;
    } else {
      reportName = 'School_Wide';
    }

    // Export
    exportELLNToExcel(assessments, studentsMap, {
      reportType,
      reportName,
      quarter,
      schoolYear: getCurrentSchoolYear()
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
                title="Home"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => navigate('/grades')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Grades & Reports
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => navigate('/forms/elln')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ELLN Assessment
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-gray-900 font-medium">Reports & Analytics</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ELLN Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Generate comprehensive reports for sections, grade levels, or school-wide data
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={!summary || summary.totalAssessments === 0}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="section">Section Level</option>
                <option value="grade">Grade Level</option>
                <option value="school">School-Wide</option>
              </select>
            </div>

            {/* Section Selector (if section report) */}
            {reportType === 'section' && (
              <div>
                <label htmlFor="section-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section
                </label>
                <select
                  id="section-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a section...</option>
                  {filteredSections.map(s => (
                    <option key={s.id} value={s.id}>
                      Grade {s.gradeLevel === 0 ? 'K' : s.gradeLevel} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grade Selector (if grade report) */}
            {reportType === 'grade' && (
              <div>
                <label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Grade Level
                </label>
                <select
                  id="grade-select"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Grades</option>
                  <option value={0}>Kindergarten</option>
                  <option value={1}>Grade 1</option>
                  <option value={2}>Grade 2</option>
                  <option value={3}>Grade 3</option>
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                </select>
              </div>
            )}

            {/* Quarter Filter */}
            <div>
              <label htmlFor="quarter-select" className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <select
                id="quarter-select"
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Quarters</option>
                <option value="q1">Quarter 1</option>
                <option value="q2">Quarter 2</option>
                <option value="q3">Quarter 3</option>
                <option value="q4">Quarter 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading report data...</p>
          </div>
        )}

        {/* Report Results */}
        {!loading && summary && (
          <>
            {/* No Data State */}
            {summary.totalAssessments === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessment data found</h3>
                <p className="text-gray-600">
                  No assessments have been conducted for the selected criteria. Try adjusting your filters or conduct assessments first.
                </p>
              </div>
            )}

            {/* Summary Cards */}
            {summary.totalAssessments > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* Total Assessments */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Assessments</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                          {summary.totalAssessments}
                        </p>
                      </div>
                      <UserGroupIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  {/* Average Overall Score */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Overall</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">
                          {summary.avgOverall}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>

                  {/* Average Literacy */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Literacy</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">
                          {summary.avgLiteracy}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-blue-400" />
                    </div>
                  </div>

                  {/* Average Numeracy */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Numeracy</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          {summary.avgNumeracy}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                </div>

                {/* Proficiency Distribution */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Proficiency Level Distribution</h3>
                  
                  <div className="space-y-4">
                    {(Object.keys(summary.proficiencyDistribution) as ProficiencyLevel[]).map(level => {
                      const count = summary.proficiencyDistribution[level];
                      const percentage = summary.totalAssessments > 0 
                        ? Math.round((count / summary.totalAssessments) * 100) 
                        : 0;

                      return (
                        <div key={level}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getProficiencyColor(level)}`}>
                                {level}
                              </span>
                              <span className="text-sm text-gray-600">
                                {count} student{count !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all ${
                                level === 'Advanced' ? 'bg-purple-500' :
                                level === 'Proficient' ? 'bg-green-500' :
                                level === 'Approaching' ? 'bg-blue-500' :
                                level === 'Developing' ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Average Scores Comparison */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Comparison</h3>
                  
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Overall Score</span>
                        <span className="text-purple-600 font-semibold">{summary.avgOverall}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-purple-500 h-4 rounded-full"
                          style={{ width: `${summary.avgOverall}%` }}
                        />
                      </div>
                    </div>

                    {/* Literacy */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Literacy</span>
                        <span className="text-blue-600 font-semibold">{summary.avgLiteracy}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ width: `${summary.avgLiteracy}%` }}
                        />
                      </div>
                    </div>

                    {/* Numeracy */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">Numeracy</span>
                        <span className="text-green-600 font-semibold">{summary.avgNumeracy}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-green-500 h-4 rounded-full"
                          style={{ width: `${summary.avgNumeracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Statistical Reports Section */}
            {summary && summary.totalAssessments > 0 && (
              <div className="mt-8">
                <StatisticalReports 
                  assessments={assessments}
                  title={
                    reportType === 'section' && selectedSection
                      ? `Section: ${sections.find(s => s.id === selectedSection)?.name || 'Unknown'}`
                      : reportType === 'grade'
                      ? `Grade ${selectedGrade === '' ? 'All Levels' : selectedGrade}`
                      : 'School-Wide Report'
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
