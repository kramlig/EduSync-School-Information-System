/**
 * SF2-SHS Dashboard - Daily Attendance Report for Senior High School
 * 
 * Official DepEd Form SF2-SHS for SHS daily attendance tracking:
 * - Semester-based attendance (not quarterly)
 * - Track/Strand attendance breakdown
 * - Monthly summary reports
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSHSStudents, SHS_TRACKS } from '../../../src/hooks/useSHSPostgreSQL';
import { useAttendancePostgreSQL } from '../../../src/hooks/useAttendancePostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';
import BackButton from '../../BackButton';
import {
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '../../icons';

interface SF2SHSDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser; type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

// CSV Export helper
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value ?? '';
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get month name
const getMonthName = (month: number) => {
  return new Date(2000, month, 1).toLocaleDateString('en-US', { month: 'long' });
};

const SF2SHSDashboard: React.FC<SF2SHSDashboardProps> = ({ session: _session, onBack: _onBack }) => {
  const { schoolId } = useSchoolContext();
  const currentSchoolYear = '2025-2026';

  // State
  const today = new Date();
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>(currentSchoolYear);
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, _setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<11 | 12 | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'summary'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);

  // Data hooks
  const { students, loading: studentsLoading } = useSHSStudents({
    schoolId: schoolId || undefined,
    gradeLevel: selectedGradeLevel || undefined,
    track: selectedTrack || undefined,
    sectionId: selectedSection || undefined,
  });

  const { attendanceRecords, loading: attendanceLoading } = useAttendancePostgreSQL({
    schoolId: schoolId || '',
  });

  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: schoolId || undefined });

  const loading = studentsLoading || attendanceLoading || sectionsLoading;

  // Filter SHS sections only
  const shsSections = useMemo(() => {
    let filtered = sections.filter(s => Number(s.gradeLevel) >= 11);
    if (selectedGradeLevel) {
      filtered = filtered.filter(s => Number(s.gradeLevel) === selectedGradeLevel);
    }
    return filtered;
  }, [sections, selectedGradeLevel]);

  // Reset section when grade changes
  useEffect(() => {
    setSelectedSection(null);
  }, [selectedGradeLevel]);

  // School year options
  const schoolYears = useMemo(() => {
    const years: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = -2; i <= 1; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }
    return years;
  }, []);

  // Month options
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: getMonthName(i),
    }));
  }, []);

  // Merge students with attendance for selected date
  const studentsWithAttendance = useMemo(() => {
    return students.map(student => {
      const record = attendanceRecords.find(
        a => a.studentId === student.id
      );
      const status = record?.dailyStatus[selectedDate] || 'No Record';
      return {
        ...student,
        status,
        remarks: '',
      };
    });
  }, [students, attendanceRecords, selectedDate]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const total = studentsWithAttendance.length;
    const present = studentsWithAttendance.filter(s => 
      s.status === 'Present' || s.status === 'P'
    ).length;
    const absent = studentsWithAttendance.filter(s => 
      s.status === 'Absent' || s.status === 'A'
    ).length;
    const late = studentsWithAttendance.filter(s => 
      s.status === 'Late' || s.status === 'L'
    ).length;
    const excused = studentsWithAttendance.filter(s => 
      s.status === 'Excused' || s.status === 'E'
    ).length;

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0,
    };
  }, [studentsWithAttendance]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const monthStart = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${daysInMonth}`;

    // Flatten attendance for month range
    const flatRecords: { studentId: string; date: string; status: string }[] = [];
    attendanceRecords.forEach(a => {
      Object.entries(a.dailyStatus).forEach(([date, status]) => {
        if (date >= monthStart && date <= monthEnd) {
          flatRecords.push({ studentId: a.studentId, date, status });
        }
      });
    });

    // Calculate per-student monthly attendance
    const studentMonthly = students.map(student => {
      const studentRecords = flatRecords.filter(a => a.studentId === student.id);
      const presentDays = studentRecords.filter(r => r.status === 'P').length;
      const absentDays = studentRecords.filter(r => r.status === 'A').length;
      const lateDays = studentRecords.filter(r => r.status === 'L').length;
      const totalDays = studentRecords.length;

      return {
        ...student,
        presentDays,
        absentDays,
        lateDays,
        totalDays,
        attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
      };
    });

    // Summary
    const totalPresent = flatRecords.filter(r => r.status === 'P').length;
    const totalAbsent = flatRecords.filter(r => r.status === 'A').length;
    const totalLate = flatRecords.filter(r => r.status === 'L').length;
    const totalRecords = flatRecords.length;

    return {
      students: studentMonthly,
      summary: {
        totalPresent,
        totalAbsent,
        totalLate,
        totalRecords,
        overallRate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 1000) / 10 : 0,
      },
      daysInMonth,
    };
  }, [students, attendanceRecords, selectedMonth, selectedYear]);

  // Export daily attendance
  const handleExportDaily = () => {
    const exportData = studentsWithAttendance.map((s, index) => ({
      'No.': index + 1,
      'LRN': s.lrn,
      'Name': s.name,
      'Grade': s.grade_level,
      'Section': s.section_name || '',
      'Track': s.shs_track || '',
      'Strand': s.shs_strand || '',
      'Status': s.status,
      'Remarks': s.remarks,
    }));

    const filename = `SF2-SHS_Daily_${selectedDate}.csv`;
    exportToCSV(exportData, filename);
  };

  // Export monthly summary
  const handleExportMonthly = () => {
    const exportData = monthlyStats.students.map((s, index) => ({
      'No.': index + 1,
      'LRN': s.lrn,
      'Name': s.name,
      'Grade': s.grade_level,
      'Section': s.section_name || '',
      'Track': s.shs_track || '',
      'Present': s.presentDays,
      'Absent': s.absentDays,
      'Late': s.lateDays,
      'Total Days': s.totalDays,
      'Attendance %': s.attendanceRate,
    }));

    const filename = `SF2-SHS_Monthly_${getMonthName(selectedMonth)}_${selectedYear}.csv`;
    exportToCSV(exportData, filename);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
      case 'P':
        return 'bg-green-100 text-green-800';
      case 'Absent':
      case 'A':
        return 'bg-red-100 text-red-800';
      case 'Late':
      case 'L':
        return 'bg-yellow-100 text-yellow-800';
      case 'Excused':
      case 'E':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">SF2-SHS</h1>
              <p className="text-sm text-slate-600">Daily Attendance Report - Senior High School</p>
            </div>
          </div>
          <button
            onClick={viewMode === 'daily' ? handleExportDaily : handleExportMonthly}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{dailyStats.total}</p>
                <p className="text-xs text-slate-500">Total SHS</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{dailyStats.present}</p>
                <p className="text-xs text-slate-500">Present</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{dailyStats.absent}</p>
                <p className="text-xs text-slate-500">Absent</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{dailyStats.late}</p>
                <p className="text-xs text-slate-500">Late</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{dailyStats.excused}</p>
                <p className="text-xs text-slate-500">Excused</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{dailyStats.attendanceRate}%</p>
              <p className="text-xs text-slate-500">Attendance Rate</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* School Year */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">School Year</label>
              <select
                title="School Year"
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                {schoolYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
              <select
                title="Semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1st Semester</option>
                <option value={2}>2nd Semester</option>
              </select>
            </div>

            {/* Date (for daily view) */}
            {viewMode === 'daily' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  title="Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Month (for monthly view) */}
            {viewMode === 'monthly' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Month</label>
                <select
                  title="Month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Grade Level</label>
              <select
                title="Grade Level"
                value={selectedGradeLevel ?? ''}
                onChange={(e) => setSelectedGradeLevel(e.target.value ? Number(e.target.value) as 11 | 12 : null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Grades</option>
                <option value={11}>Grade 11</option>
                <option value={12}>Grade 12</option>
              </select>
            </div>

            {/* Track */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Track</label>
              <select
                title="Track"
                value={selectedTrack ?? ''}
                onChange={(e) => setSelectedTrack(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tracks</option>
                {SHS_TRACKS.map(track => (
                  <option key={track.code} value={track.code}>{track.name}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
              <select
                title="Section"
                value={selectedSection ?? ''}
                onChange={(e) => setSelectedSection(e.target.value || null)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {shsSections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name} (G{section.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'daily'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Daily Attendance
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'monthly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
            Monthly Summary
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'daily' ? (
            /* Daily Attendance View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">
                  Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-500px)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">No.</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">LRN</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Name</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Grade</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Track</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Status</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentsWithAttendance.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                          No SHS students found.
                        </td>
                      </tr>
                    ) : (
                      studentsWithAttendance.map((student, index) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2 text-slate-600 font-mono text-xs">{student.lrn}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{student.grade_level}</td>
                          <td className="px-3 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{student.shs_track || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-500 text-xs">{student.remarks}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Monthly Summary View */
            <>
              <div className="px-3 py-2 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Monthly Summary for {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                  <span className="text-sm text-slate-500">
                    Overall Attendance: {monthlyStats.summary.overallRate}%
                  </span>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-500px)]">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">No.</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Name</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Grade</th>
                      <th className="px-3 py-2 text-left text-slate-600 font-medium">Section</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium text-green-600">Present</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium text-red-600">Absent</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium text-yellow-600">Late</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Total</th>
                      <th className="px-3 py-2 text-center text-slate-600 font-medium">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyStats.students.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-slate-500">
                          No attendance records found for this month.
                        </td>
                      </tr>
                    ) : (
                      monthlyStats.students.map((student, index) => (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">{student.name}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{student.grade_level}</td>
                          <td className="px-3 py-2 text-slate-600">{student.section_name || '-'}</td>
                          <td className="px-3 py-2 text-center text-green-600 font-medium">{student.presentDays}</td>
                          <td className="px-3 py-2 text-center text-red-600 font-medium">{student.absentDays}</td>
                          <td className="px-3 py-2 text-center text-yellow-600 font-medium">{student.lateDays}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{student.totalDays}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`font-medium ${
                              student.attendanceRate >= 90 ? 'text-green-600' :
                              student.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {student.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {monthlyStats.students.length > 0 && (
                      <tr className="bg-slate-100 font-semibold">
                        <td className="px-3 py-2" colSpan={4}>TOTAL</td>
                        <td className="px-3 py-2 text-center text-green-600">{monthlyStats.summary.totalPresent}</td>
                        <td className="px-3 py-2 text-center text-red-600">{monthlyStats.summary.totalAbsent}</td>
                        <td className="px-3 py-2 text-center text-yellow-600">{monthlyStats.summary.totalLate}</td>
                        <td className="px-3 py-2 text-center">{monthlyStats.summary.totalRecords}</td>
                        <td className="px-3 py-2 text-center">{monthlyStats.summary.overallRate}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SF2SHSDashboard;
