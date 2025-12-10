/**
 * Division Proficiency Dashboard - DepEd Format
 * 
 * Displays Q2 Proficiency Level Report matching the official DepEd format.
 * Shows schools grouped by district with subject-grade level breakdown.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import {
  fetchDivisionProficiency,
  getSubjectName,
  getMPSColor,
  transformToDepEdFormat,
  DEPED_SUBJECTS,
  type ProficiencyReport,
  type DepEdSchoolRow,
} from '../../services/divisionProficiencyService';
import {
  ChartBarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
  ComposedChart, Area, Line,
} from 'recharts';

type ViewMode = 'deped' | 'charts';

// Color palette for charts
const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
};

const SUBJECT_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#6366f1', '#f97316'
];

const DivisionProficiencyDashboard: React.FC = () => {
  const { division, loading: contextLoading, quarter, selectedDistrict, selectedSchoolId, schoolLevel } = useDivisionContext();

  // State
  const [report, setReport] = useState<ProficiencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('charts');

  // Fetch data
  useEffect(() => {
    if (!division?.id || contextLoading) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDivisionProficiency(division.id, quarter);
        setReport(data);
      } catch (err) {
        console.error('Failed to fetch proficiency:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [division?.id, quarter, contextLoading]);

  // Transform to DepEd format
  const depEdData = useMemo(() => {
    if (!report) return [];
    return transformToDepEdFormat(report);
  }, [report]);

  // Get unique districts from school_data (more reliable than depEdData)
  const districts = useMemo(() => {
    if (!report?.school_data) return [];
    const unique = [...new Set(report.school_data.map(s => s.district))];
    return unique.sort();
  }, [report?.school_data]);

  // Debug: Log district values
  useEffect(() => {
    if (report) {
      console.log('[ProficiencyDashboard] Report loaded:', {
        total_schools: report.total_schools,
        school_data_count: report.school_data?.length || 0,
        by_grade_level_count: report.by_grade_level?.length || 0,
        by_grade_level_sample: report.by_grade_level?.slice(0, 5),
        districts_in_school_data: districts,
        selectedDistrict,
      });
      // Log transformed depEdData structure
      if (depEdData.length > 0) {
        console.log('[ProficiencyDashboard] DepEd data sample:', {
          first_school: depEdData[0],
          subjects_keys: Object.keys(depEdData[0]?.subjects || {}),
          first_subject_keys: depEdData[0]?.subjects ? Object.keys(Object.values(depEdData[0].subjects)[0] || {}) : [],
        });
      }
    }
  }, [report, districts, selectedDistrict, depEdData]);

  // Helper to match district names (handles "Mati Central" vs "Mati Central District")
  const matchesDistrict = useCallback((dataDistrict: string, filterDistrict: string | null): boolean => {
    if (!filterDistrict) return true;
    if (!dataDistrict) return false;
    
    const normalizedData = dataDistrict.toLowerCase().trim();
    const normalizedFilter = filterDistrict.toLowerCase().trim();
    
    // Exact match
    if (normalizedData === normalizedFilter) return true;
    
    // Check if one contains the other (handles "Mati Central" vs "Mati Central District")
    if (normalizedFilter.includes(normalizedData) || normalizedData.includes(normalizedFilter)) return true;
    
    // Remove common suffixes and compare
    const stripSuffix = (s: string) => s.replace(/\s*(district|dist\.?|d)$/i, '').trim();
    return stripSuffix(normalizedData) === stripSuffix(normalizedFilter);
  }, []);

  // Filter report data by district and/or school
  const filteredReport = useMemo((): ProficiencyReport | null => {
    if (!report) return null;
    if (!selectedDistrict && !selectedSchoolId) return report;

    // Filter all arrays by district and/or school
    let filteredSchoolData = report.school_data;
    let filteredByGradeLevel = report.by_grade_level;
    let filteredKindergarten = report.kindergarten;
    
    // Apply district filter first
    if (selectedDistrict) {
      filteredSchoolData = filteredSchoolData.filter(s => matchesDistrict(s.district, selectedDistrict));
      filteredByGradeLevel = filteredByGradeLevel.filter(s => matchesDistrict(s.district, selectedDistrict));
      filteredKindergarten = filteredKindergarten.filter(s => matchesDistrict(s.district, selectedDistrict));
    }
    
    // Then apply school filter if a specific school is selected
    if (selectedSchoolId) {
      filteredSchoolData = filteredSchoolData.filter(s => s.school_id === selectedSchoolId);
      filteredByGradeLevel = filteredByGradeLevel.filter(s => s.school_id === selectedSchoolId);
      filteredKindergarten = filteredKindergarten.filter(s => s.school_id === selectedSchoolId);
    }
    
    // Get unique school IDs in filtered data
    const schoolIds = new Set(filteredSchoolData.map(s => s.school_id));
    
    // Recalculate subject totals for filtered schools
    const subjectMap = new Map<string, { mpsSum: number; passSum: number; students: number; schools: Set<string> }>();
    for (const row of filteredSchoolData) {
      if (!subjectMap.has(row.subject_code)) {
        subjectMap.set(row.subject_code, { mpsSum: 0, passSum: 0, students: 0, schools: new Set() });
      }
      const stat = subjectMap.get(row.subject_code)!;
      stat.mpsSum += row.mps * row.total_students;
      stat.passSum += row.passing;
      stat.students += row.total_students;
      stat.schools.add(row.school_id);
    }
    
    const filteredBySubject = Array.from(subjectMap.entries()).map(([code, stat]) => ({
      code,
      schools_with_data: stat.schools.size,
      total_students: stat.students,
      mps: stat.students > 0 ? Math.round((stat.mpsSum / stat.students) * 100) / 100 : 0,
      passing: stat.passSum,
      passing_rate: stat.students > 0 ? Math.round((stat.passSum / stat.students) * 10000) / 100 : 0,
    }));

    // Calculate overall MPS for filtered data
    const totalStudents = filteredBySubject.reduce((sum, s) => sum + s.total_students, 0);
    const weightedMPS = filteredBySubject.reduce((sum, s) => sum + s.mps * s.total_students, 0);
    const overallMPS = totalStudents > 0 ? Math.round((weightedMPS / totalStudents) * 100) / 100 : 0;

    return {
      ...report,
      total_schools: schoolIds.size,
      schools_checked: schoolIds.size,
      total_grades: totalStudents,
      overall_mps: overallMPS,
      by_subject: filteredBySubject,
      school_data: filteredSchoolData,
      by_grade_level: filteredByGradeLevel,
      kindergarten: filteredKindergarten,
    };
  }, [report, selectedDistrict, selectedSchoolId, matchesDistrict]);

  // Filter depEdData by district and/or school
  const filteredDepEdData = useMemo(() => {
    let filtered = depEdData;
    
    // Apply district filter
    if (selectedDistrict) {
      filtered = filtered.filter(s => matchesDistrict(s.district, selectedDistrict));
    }
    
    // Apply school filter if a specific school is selected
    if (selectedSchoolId) {
      filtered = filtered.filter(s => s.school_id === selectedSchoolId);
    }
    
    return filtered;
  }, [depEdData, selectedDistrict, selectedSchoolId, matchesDistrict]);

  // Group by district
  const dataByDistrict = useMemo(() => {
    const grouped: { [district: string]: DepEdSchoolRow[] } = {};
    for (const row of filteredDepEdData) {
      if (!grouped[row.district]) {
        grouped[row.district] = [];
      }
      grouped[row.district].push(row);
    }
    return grouped;
  }, [filteredDepEdData]);

  // Helper: Check if a school has data for specific grade levels
  const hasDataForLevel = useCallback((school: DepEdSchoolRow, level: 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' | 'ALL') => {
    if (level === 'ALL') return true;
    
    const relevantGrades = level === 'JUNIOR HIGH SCHOOL' ? [7, 8, 9, 10] : [1, 2, 3, 4, 5, 6];
    
    for (const [, gradeData] of Object.entries(school.subjects || {})) {
      for (const grade of relevantGrades) {
        const data = gradeData[grade] || gradeData[grade.toString()];
        if (data && (data.passing_rate > 0 || data.mps > 0)) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Count schools with data for the selected school level
  const schoolsWithDataForLevel = useMemo(() => {
    return filteredDepEdData.filter(school => hasDataForLevel(school, schoolLevel as 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' | 'ALL')).length;
  }, [filteredDepEdData, schoolLevel, hasDataForLevel]);

  // Export to CSV with totals
  const handleExportCSV = useCallback(() => {
    if (!report || depEdData.length === 0) return;

    // Get kindergarten data indexed by school_id for easy lookup
    const kinderBySchool: { [schoolId: string]: typeof report.kindergarten[0] } = {};
    for (const k of report.kindergarten || []) {
      kinderBySchool[k.school_id] = k;
    }

    const headers = ['District', 'School'];
    
    // Add Kindergarten columns first (A. Beginning, B. Developing, C. Consistent, Total)
    headers.push('K - A. Beginning', 'K - B. Developing', 'K - C. Consistent', 'K - Total %');
    
    // Build column structure for each subject and grade
    const columns: { subject: typeof DEPED_SUBJECTS[0]; grade: number; type: 'pass' | 'mps' }[] = [];
    for (const subject of DEPED_SUBJECTS) {
      for (const grade of subject.grades) {
        headers.push(`${subject.name} G${grade} %Pass`);
        columns.push({ subject, grade, type: 'pass' });
        headers.push(`${subject.name} G${grade} MPS`);
        columns.push({ subject, grade, type: 'mps' });
      }
    }

    const rows: string[][] = [headers];
    
    // Track totals and counts for averaging
    const totalsPass: number[] = new Array(columns.length).fill(0);
    const totalsMPS: number[] = new Array(columns.length).fill(0);
    const countsPass: number[] = new Array(columns.length).fill(0);
    const countsMPS: number[] = new Array(columns.length).fill(0);
    
    // Track kindergarten totals for averaging
    let kinderTotalBeginning = 0;
    let kinderTotalDeveloping = 0;
    let kinderTotalConsistent = 0;
    let kinderTotalPct = 0;
    let kinderSchoolCount = 0;

    // Group schools by district for district headers
    const schoolsByDistrict: { [district: string]: typeof depEdData } = {};
    for (const school of depEdData) {
      if (!schoolsByDistrict[school.district]) {
        schoolsByDistrict[school.district] = [];
      }
      schoolsByDistrict[school.district].push(school);
    }

    // Add schools grouped by district
    for (const [district, schools] of Object.entries(schoolsByDistrict).sort()) {
      // District header row
      rows.push([`ELEMENTARY (${district})`, '', '', '', '', '', ...new Array(columns.length).fill('')]);
      
      for (const school of schools) {
        const row: string[] = ['', school.school_name];
        
        // Add kindergarten data for this school
        const kinder = kinderBySchool[school.school_id];
        if (kinder && kinder.total_students > 0) {
          row.push(
            kinder.beginning_pct ? `${kinder.beginning_pct}%` : '',
            kinder.developing_pct ? `${kinder.developing_pct}%` : '',
            kinder.consistent_pct ? `${kinder.consistent_pct}%` : '',
            kinder.total_pct ? `${kinder.total_pct}%` : ''
          );
          kinderTotalBeginning += kinder.beginning_pct || 0;
          kinderTotalDeveloping += kinder.developing_pct || 0;
          kinderTotalConsistent += kinder.consistent_pct || 0;
          kinderTotalPct += kinder.total_pct || 0;
          kinderSchoolCount++;
        } else {
          row.push('', '', '', '');
        }
        
        columns.forEach((col, idx) => {
          const data = school.subjects[col.subject.code]?.[`Grade ${col.grade}`] || 
                      school.subjects[col.subject.code]?.[col.grade.toString()];
          if (data) {
            if (col.type === 'pass') {
              const val = data.passing_rate || 0;
              row.push(val ? `${val}%` : '');
              if (val > 0) {
                totalsPass[idx] += val;
                countsPass[idx]++;
              }
            } else {
              const val = data.mps || 0;
              row.push(val ? `${val}%` : '');
              if (val > 0) {
                totalsMPS[idx] += val;
                countsMPS[idx]++;
              }
            }
          } else {
            row.push('');
          }
        });
        
        rows.push(row);
      }
    }

    // Add empty row before totals
    rows.push(new Array(headers.length).fill(''));

    // TOTAL PERCENTAGE (K) row for Kindergarten - AVERAGE across schools
    const kinderRow: string[] = ['TOTAL PERCENTAGE (K)', ''];
    kinderRow.push(
      kinderSchoolCount > 0 ? `${(kinderTotalBeginning / kinderSchoolCount).toFixed(2)}%` : '',
      kinderSchoolCount > 0 ? `${(kinderTotalDeveloping / kinderSchoolCount).toFixed(2)}%` : '',
      kinderSchoolCount > 0 ? `${(kinderTotalConsistent / kinderSchoolCount).toFixed(2)}%` : '',
      kinderSchoolCount > 0 ? `${(kinderTotalPct / kinderSchoolCount).toFixed(2)}%` : ''
    );
    kinderRow.push(...new Array(columns.length).fill(''));
    rows.push(kinderRow);

    // TOTAL PERCENTAGE OF PASSERS row - AVERAGE across schools
    const passersRow: string[] = ['TOTAL PERCENTAGE OF PASSERS', '', '', '', '', ''];
    columns.forEach((col, idx) => {
      if (col.type === 'pass') {
        const avg = countsPass[idx] > 0 ? totalsPass[idx] / countsPass[idx] : 0;
        passersRow.push(avg > 0 ? `${avg.toFixed(2)}%` : '');
      } else {
        passersRow.push(''); // MPS columns empty for this row
      }
    });
    rows.push(passersRow);

    // TOTAL PERCENTAGE OF PL (MPS) row - AVERAGE across schools
    const plRow: string[] = ['TOTAL PERCENTAGE OF PL', '', '', '', '', ''];
    columns.forEach((col, idx) => {
      if (col.type === 'mps') {
        const avg = countsMPS[idx] > 0 ? totalsMPS[idx] / countsMPS[idx] : 0;
        plRow.push(avg > 0 ? `${avg.toFixed(2)}%` : '');
      } else {
        plRow.push(''); // Pass columns empty for this row
      }
    });
    rows.push(plRow);

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quarter}_Proficiency_Level_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, depEdData, quarter]);

  // Loading state
  if (contextLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400">Loading proficiency data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <ExclamationCircleIcon className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Failed to Load Report
          </h3>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Make sure the RPC function <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">get_division_proficiency_v2</code> is deployed to Supabase.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-100 rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {quarter} Proficiency Level Report
            {selectedDistrict && (
              <span className="text-lg font-normal text-slate-500 ml-2">— {selectedDistrict}</span>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredReport?.total_schools || 0} schools · {filteredReport?.schools_checked || 0} with data
            {selectedDistrict && ` · ${filteredReport?.overall_mps || 0}% MPS`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={!report || depEdData.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-medium"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setViewMode('charts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            viewMode === 'charts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setViewMode('deped')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            viewMode === 'deped'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          DepEd Format
        </button>
      </div>

      {/* Charts Dashboard View */}
      {viewMode === 'charts' && filteredReport && (
        <PremiumChartsView report={filteredReport} depEdData={filteredDepEdData} districts={districts} />
      )}

      {/* DepEd Format View */}
      {viewMode === 'deped' && (
        <div className="space-y-4">
          {/* Info bar showing current filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>
                {selectedSchoolId
                  ? `Showing 1 school`
                  : selectedDistrict 
                    ? `Showing ${schoolsWithDataForLevel} schools in ${selectedDistrict}`
                    : `Showing ${schoolsWithDataForLevel} of ${filteredDepEdData.length} schools`}
                {schoolLevel !== 'ALL' && ` with ${schoolLevel === 'JUNIOR HIGH SCHOOL' ? 'JHS' : 'Elementary'} data`}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                {schoolLevel === 'ALL' ? 'All Levels' : schoolLevel === 'ELEMENTARY' ? 'Elementary' : schoolLevel === 'JUNIOR HIGH SCHOOL' ? 'Junior High' : 'Senior High'}
              </span>
            </div>
            <span className="text-xs text-slate-400">(Use sidebar filters to change)</span>
          </div>

          {/* DepEd Format Table by District - ELEMENTARY */}
          {(schoolLevel === 'ALL' || schoolLevel === 'ELEMENTARY') && Object.entries(dataByDistrict).map(([district, schools]) => (
            <DepEdDistrictTable key={`elem-${district}`} district={district} schools={schools} level="ELEMENTARY" />
          ))}

          {/* DepEd Format Table by District - JUNIOR HIGH SCHOOL */}
          {(schoolLevel === 'ALL' || schoolLevel === 'JUNIOR HIGH SCHOOL') && Object.entries(dataByDistrict).map(([district, schools]) => (
            <DepEdDistrictTable key={`jhs-${district}`} district={district} schools={schools} level="JUNIOR HIGH SCHOOL" />
          ))}

          {filteredDepEdData.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No grade-level data available. Deploy the updated RPC function.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =====================================================
// PREMIUM CHARTS VIEW
// =====================================================

interface PremiumChartsViewProps {
  report: ProficiencyReport;
  depEdData: DepEdSchoolRow[];
  districts: string[];
}

const PremiumChartsView: React.FC<PremiumChartsViewProps> = ({ report, depEdData, districts }) => {
  // Prepare subject data for charts
  const subjectChartData = useMemo(() => {
    return (report.by_subject || []).map((s, idx) => ({
      name: getSubjectName(s.code),
      code: s.code,
      mps: s.mps,
      passingRate: s.passing_rate,
      students: s.total_students,
      fill: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
    }));
  }, [report.by_subject]);

  // Prepare district data for charts
  const districtChartData = useMemo(() => {
    const districtStats: { [key: string]: { mpsSum: number; passSum: number; count: number; students: number } } = {};
    
    for (const school of depEdData) {
      if (!districtStats[school.district]) {
        districtStats[school.district] = { mpsSum: 0, passSum: 0, count: 0, students: 0 };
      }
      
      // Calculate average MPS and passing rate for the school
      let schoolMpsSum = 0;
      let schoolPassSum = 0;
      let subjectCount = 0;
      
      for (const subjectCode of Object.keys(school.subjects)) {
        for (const gradeKey of Object.keys(school.subjects[subjectCode])) {
          const data = school.subjects[subjectCode][gradeKey];
          if (data.mps > 0) {
            schoolMpsSum += data.mps;
            schoolPassSum += data.passing_rate;
            subjectCount++;
          }
        }
      }
      
      if (subjectCount > 0) {
        districtStats[school.district].mpsSum += schoolMpsSum / subjectCount;
        districtStats[school.district].passSum += schoolPassSum / subjectCount;
        districtStats[school.district].count++;
      }
    }
    
    return Object.entries(districtStats)
      .map(([district, stats]) => ({
        name: district,
        mps: stats.count > 0 ? Math.round((stats.mpsSum / stats.count) * 100) / 100 : 0,
        passingRate: stats.count > 0 ? Math.round((stats.passSum / stats.count) * 100) / 100 : 0,
        schools: stats.count,
      }))
      .sort((a, b) => b.mps - a.mps);
  }, [depEdData]);

  // Grade level performance data
  const gradeLevelData = useMemo(() => {
    const gradeStats: { [key: string]: { mpsSum: number; passSum: number; count: number } } = {};
    
    for (const item of report.by_grade_level || []) {
      const grade = String(item.grade_level);
      if (!gradeStats[grade]) {
        gradeStats[grade] = { mpsSum: 0, passSum: 0, count: 0 };
      }
      gradeStats[grade].mpsSum += item.mps;
      gradeStats[grade].passSum += item.passing_rate;
      gradeStats[grade].count++;
    }
    
    return Object.entries(gradeStats)
      .map(([grade, stats]) => ({
        name: `Grade ${grade}`,
        grade: parseInt(grade),
        mps: stats.count > 0 ? Math.round((stats.mpsSum / stats.count) * 100) / 100 : 0,
        passingRate: stats.count > 0 ? Math.round((stats.passSum / stats.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.grade - b.grade);
  }, [report.by_grade_level]);

  // Performance distribution for pie chart
  const performanceDistribution = useMemo(() => {
    let excellent = 0, good = 0, fair = 0, poor = 0;
    
    for (const school of depEdData) {
      let avgMps = 0;
      let count = 0;
      
      for (const subjectCode of Object.keys(school.subjects)) {
        for (const gradeKey of Object.keys(school.subjects[subjectCode])) {
          const data = school.subjects[subjectCode][gradeKey];
          if (data.mps > 0) {
            avgMps += data.mps;
            count++;
          }
        }
      }
      
      if (count > 0) {
        const schoolAvg = avgMps / count;
        if (schoolAvg >= 85) excellent++;
        else if (schoolAvg >= 75) good++;
        else if (schoolAvg >= 65) fair++;
        else poor++;
      }
    }
    
    return [
      { name: 'Excellent (85%+)', value: excellent, color: CHART_COLORS.success },
      { name: 'Good (75-84%)', value: good, color: CHART_COLORS.primary },
      { name: 'Fair (65-74%)', value: fair, color: CHART_COLORS.warning },
      { name: 'Needs Improvement (<65%)', value: poor, color: CHART_COLORS.danger },
    ].filter(d => d.value > 0);
  }, [depEdData]);

  // Top/Bottom performing schools
  const schoolRankings = useMemo(() => {
    const schoolPerformance = depEdData.map(school => {
      let avgMps = 0;
      let count = 0;
      
      for (const subjectCode of Object.keys(school.subjects)) {
        for (const gradeKey of Object.keys(school.subjects[subjectCode])) {
          const data = school.subjects[subjectCode][gradeKey];
          if (data.mps > 0) {
            avgMps += data.mps;
            count++;
          }
        }
      }
      
      return {
        name: school.school_name.length > 25 ? school.school_name.substring(0, 25) + '...' : school.school_name,
        fullName: school.school_name,
        district: school.district,
        mps: count > 0 ? Math.round((avgMps / count) * 100) / 100 : 0,
      };
    }).filter(s => s.mps > 0).sort((a, b) => b.mps - a.mps);
    
    return {
      top: schoolPerformance.slice(0, 10),
      bottom: [...schoolPerformance].reverse().slice(0, 10).reverse(),
    };
  }, [depEdData]);

  return (
    <div className="space-y-6">
      {/* Row 1: Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Division MPS</p>
              <p className="text-3xl font-bold mt-1">{report.overall_mps}%</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ChartBarIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-3 text-blue-100 text-xs">
            Across {report.schools_checked} schools
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Grade Records</p>
              <p className="text-3xl font-bold mt-1">{report.total_grades.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <AcademicCapIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-3 text-green-100 text-xs">
            Quarterly grades recorded
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Schools</p>
              <p className="text-3xl font-bold mt-1">{report.total_schools}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <BuildingOfficeIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-3 text-purple-100 text-xs">
            {districts.length} districts
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Subjects</p>
              <p className="text-3xl font-bold mt-1">{report.by_subject?.length || 0}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <PresentationChartBarIcon className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-3 text-amber-100 text-xs">
            Learning areas tracked
          </div>
        </div>
      </div>

      {/* Row 2: Subject Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Performance Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Subject Performance (MPS & Passing Rate)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} width={75} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend />
                <Bar dataKey="mps" name="MPS" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="passingRate" name="Passing Rate" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Distribution Pie */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            School Performance Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                  labelLine={false}
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {performanceDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded ${
                  item.color === CHART_COLORS.success ? 'bg-green-500' :
                  item.color === CHART_COLORS.primary ? 'bg-blue-500' :
                  item.color === CHART_COLORS.warning ? 'bg-amber-500' :
                  'bg-red-500'
                }`}></div>
                <span className="text-slate-600 dark:text-slate-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Grade Level & District Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Level Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Performance by Grade Level
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={gradeLevelData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend />
                <Area type="monotone" dataKey="mps" name="MPS" fill={CHART_COLORS.primary} fillOpacity={0.3} stroke={CHART_COLORS.primary} />
                <Line type="monotone" dataKey="passingRate" name="Passing Rate" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ fill: CHART_COLORS.success }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            District Performance Comparison
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend />
                <Bar dataKey="mps" name="Avg MPS" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Top & Bottom Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Schools */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-green-500">🏆</span> Top 10 Performing Schools
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolRankings.top} layout="vertical" margin={{ left: 120, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={115} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Bar dataKey="mps" name="MPS" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Schools Needing Support */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-amber-500">📈</span> Schools Needing Support
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolRankings.bottom} layout="vertical" margin={{ left: 120, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} width={115} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Bar dataKey="mps" name="MPS" fill={CHART_COLORS.warning} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 5: Radar Chart for Subject Comparison */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Subject Proficiency Radar
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subjectChartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="MPS" dataKey="mps" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.5} />
              <Radar name="Passing Rate" dataKey="passingRate" stroke={CHART_COLORS.success} fill={CHART_COLORS.success} fillOpacity={0.3} />
              <Legend />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value}%`]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// SUB-COMPONENTS
// =====================================================

const DepEdDistrictTable: React.FC<{ district: string; schools: DepEdSchoolRow[]; level?: 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' }> = ({ district, schools, level = 'ELEMENTARY' }) => {
  // Subjects based on level
  const displaySubjects = level === 'JUNIOR HIGH SCHOOL' ? [
    { code: 'FIL', name: 'Filipino', grades: [7, 8, 9, 10] },
    { code: 'ENG', name: 'English', grades: [7, 8, 9, 10] },
    { code: 'MATH', name: 'Math', grades: [7, 8, 9, 10] },
    { code: 'SCI', name: 'Science', grades: [7, 8, 9, 10] },
    { code: 'AP', name: 'AP', grades: [7, 8, 9, 10] },
    { code: 'ESP', name: 'EsP', grades: [7, 8, 9, 10] },
    { code: 'TLE', name: 'TLE', grades: [7, 8, 9, 10] },
    { code: 'MAPEH', name: 'MAPEH', grades: [7, 8, 9, 10] },
  ] : [
    { code: 'LANG', name: 'Language', grades: [1, 2, 3] },
    { code: 'MTB', name: 'MTB', grades: [1, 2, 3] },
    { code: 'ENG', name: 'English', grades: [1, 2, 3, 4, 5, 6] },
    { code: 'MATH', name: 'Math', grades: [1, 2, 3, 4, 5, 6] },
    { code: 'SCI', name: 'Science', grades: [3, 4, 5, 6] },
    { code: 'FIL', name: 'Filipino', grades: [1, 2, 3, 4, 5, 6] },
    { code: 'AP', name: 'AP', grades: [1, 2, 3, 4, 5, 6] },
    { code: 'ESP', name: 'EsP', grades: [1, 2, 3, 4, 5, 6] },
    { code: 'MAPEH', name: 'MAPEH', grades: [1, 2, 3, 4, 5, 6] },
  ];

  // Helper to find data for a subject/grade - handles various code formats
  const findSubjectData = (school: DepEdSchoolRow, subjectCode: string, grade: number) => {
    // Direct match
    let data = school.subjects[subjectCode]?.[grade] ||
               school.subjects[subjectCode]?.[grade.toString()] ||
               school.subjects[subjectCode]?.[`Grade ${grade}`];
    if (data) return data;
    
    // Try finding by prefix (e.g., "FIL" matches "FIL-SEC", "FILIPINO")
    for (const [code, grades] of Object.entries(school.subjects || {})) {
      if (code.toUpperCase().startsWith(subjectCode) || 
          code.toUpperCase().includes(subjectCode) ||
          subjectCode.toUpperCase().startsWith(code.toUpperCase())) {
        data = grades[grade] || grades[grade.toString()] || grades[`Grade ${grade}`];
        if (data) return data;
      }
    }
    return null;
  };

  // Calculate averages for each subject-grade combination
  const averages: { [key: string]: { passSum: number; mpsSum: number; count: number } } = {};
  let hasAnyData = false;
  
  // Debug: Log first school's data
  if (schools.length > 0) {
    console.log(`[DepEdDistrictTable] ${level} - First school subjects:`, {
      school: schools[0].school_name,
      subjectKeys: Object.keys(schools[0].subjects || {}),
      sampleData: schools[0].subjects,
    });
  }
  
  for (const school of schools) {
    for (const subject of displaySubjects) {
      for (const grade of subject.grades) {
        const key = `${subject.code}-${grade}`;
        const data = findSubjectData(school, subject.code, grade);
        if (data) {
          hasAnyData = true;
          if (!averages[key]) {
            averages[key] = { passSum: 0, mpsSum: 0, count: 0 };
          }
          if (data.passing_rate > 0) {
            averages[key].passSum += data.passing_rate;
            averages[key].count++;
          }
          if (data.mps > 0) {
            averages[key].mpsSum += data.mps;
          }
        }
      }
    }
  }

  // Don't render if no data for this level
  if (!hasAnyData) {
    console.log(`[DepEdDistrictTable] ${level} - No data found for district: ${district}`);
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* District Header */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          {level} ({district})
        </h3>
        <p className="text-xs text-slate-500">{schools.length} schools</p>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
            <tr>
              <th className="text-left px-2 py-2 font-medium text-slate-500 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">
                School
              </th>
              {displaySubjects.map(subject => (
                <th 
                  key={subject.code} 
                  colSpan={subject.grades.length * 2}
                  className="text-center px-1 py-1 font-medium text-slate-500 border-r border-slate-200 dark:border-slate-700"
                >
                  {subject.name}
                </th>
              ))}
            </tr>
            <tr className="bg-slate-50 dark:bg-slate-900/30">
              <th className="border-r border-slate-200 dark:border-slate-700"></th>
              {displaySubjects.map(subject => 
                subject.grades.map(grade => (
                  <React.Fragment key={`${subject.code}-${grade}`}>
                    <th className="px-1 py-1 text-[10px] text-slate-400 border-r border-slate-100 dark:border-slate-800">
                      G{grade} %
                    </th>
                    <th className="px-1 py-1 text-[10px] text-slate-400 border-r border-slate-200 dark:border-slate-700">
                      MPS
                    </th>
                  </React.Fragment>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {schools.map((school) => (
              <tr key={school.school_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <td className="px-2 py-1.5 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700 truncate max-w-[180px]" title={school.school_name}>
                  {school.school_name}
                </td>
                {displaySubjects.map(subject =>
                  subject.grades.map(grade => {
                    const data = findSubjectData(school, subject.code, grade);
                    return (
                      <React.Fragment key={`${school.school_id}-${subject.code}-${grade}`}>
                        <td className={`px-1 py-1 text-center border-r border-slate-100 dark:border-slate-800 ${data ? getMPSColor(data.passing_rate) : 'text-slate-300'}`}>
                          {data?.passing_rate ? `${data.passing_rate}%` : '-'}
                        </td>
                        <td className={`px-1 py-1 text-center border-r border-slate-200 dark:border-slate-700 ${data ? getMPSColor(data.mps) : 'text-slate-300'}`}>
                          {data?.mps ? `${data.mps}` : '-'}
                        </td>
                      </React.Fragment>
                    );
                  })
                )}
              </tr>
            ))}
            {/* Average Passers Row */}
            <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold">
              <td className="px-2 py-1.5 text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700">
                AVG % PASSERS
              </td>
              {displaySubjects.map(subject =>
                subject.grades.map(grade => {
                  const key = `${subject.code}-${grade}`;
                  const avg = averages[key];
                  const passAvg = avg && avg.count > 0 ? (avg.passSum / avg.count).toFixed(2) : null;
                  return (
                    <React.Fragment key={`avg-pass-${subject.code}-${grade}`}>
                      <td className={`px-1 py-1 text-center border-r border-slate-100 dark:border-slate-800 ${passAvg ? getMPSColor(parseFloat(passAvg)) : 'text-slate-300'}`}>
                        {passAvg ? `${passAvg}%` : '-'}
                      </td>
                      <td className="px-1 py-1 text-center border-r border-slate-200 dark:border-slate-700 text-slate-300">
                        -
                      </td>
                    </React.Fragment>
                  );
                })
              )}
            </tr>
            {/* Average MPS Row */}
            <tr className="bg-green-50 dark:bg-green-900/20 font-semibold">
              <td className="px-2 py-1.5 text-green-700 dark:text-green-300 border-r border-slate-200 dark:border-slate-700">
                AVG MPS
              </td>
              {displaySubjects.map(subject =>
                subject.grades.map(grade => {
                  const key = `${subject.code}-${grade}`;
                  const avg = averages[key];
                  const mpsAvg = avg && avg.count > 0 ? (avg.mpsSum / avg.count).toFixed(2) : null;
                  return (
                    <React.Fragment key={`avg-mps-${subject.code}-${grade}`}>
                      <td className="px-1 py-1 text-center border-r border-slate-100 dark:border-slate-800 text-slate-300">
                        -
                      </td>
                      <td className={`px-1 py-1 text-center border-r border-slate-200 dark:border-slate-700 ${mpsAvg ? getMPSColor(parseFloat(mpsAvg)) : 'text-slate-300'}`}>
                        {mpsAvg ? `${mpsAvg}` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DivisionProficiencyDashboard;
