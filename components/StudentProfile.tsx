import React, { useState, useMemo } from 'react';
import type { Student, Grade, Section, Teacher, AttendanceRecord, CoreValueGrade, AttendanceStatus } from '../types';
import { 
  StarIcon, 
  CheckBadgeIcon, 
  AcademicCapIcon,
  CalendarDaysIcon,
  HeartIcon,
  ClipboardDocumentIcon,
  UsersIcon,
  ChevronRightIcon,
  TrophyIcon,
  FireIcon,
  InformationCircleIcon,
  ClockIcon
} from './icons';
import BarChart from './BarChart';
import ProgressRing from './ProgressRing';
import Card from './Card';

interface StudentProfileProps {
  student: Student;
  grades: Grade[];
  attendanceRecords: AttendanceRecord[];
  coreValueGrades: CoreValueGrade[];
  sections: Section[];
  teachers: Teacher[];
  schoolYear: string;
  onClose: () => void;
}

type TabType = 'overview' | 'academic' | 'attendance' | 'behavior' | 'documents' | 'family';

const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  grades,
  attendanceRecords,
  coreValueGrades,
  sections,
  teachers,
  schoolYear,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Calculate student section and adviser
  const section = sections.find(s => s.id === student.sectionId);
  const adviser = teachers.find(t => t.id === section?.adviserId);

  // Calculate age
  const calculateAge = (dateOfBirth?: string): number | string => {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate academic metrics
  const academicMetrics = useMemo(() => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    const finalGrades = studentGrades
      .map(g => g.finalGrade)
      .filter((g): g is number => typeof g === 'number');

    const average = finalGrades.length > 0
      ? finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length
      : 0;

    // Simulate rank (would need class comparison in real scenario)
    const totalStudents = 40; // Would get from actual class size
    const rank = Math.floor(Math.random() * totalStudents) + 1;
    const percentile = 100 - ((rank / totalStudents) * 100);

    return {
      average: average.toFixed(1),
      rank,
      totalStudents,
      percentile: percentile.toFixed(0),
      trend: average >= 85 ? 'up' : average >= 75 ? 'neutral' : 'down',
      gradesCount: finalGrades.length,
    };
  }, [grades, student.id]);

  // Calculate attendance metrics
  const attendanceMetrics = useMemo(() => {
    const record = attendanceRecords.find(r => r.studentId === student.id);
    if (!record) return { present: 0, absent: 0, tardy: 0, excused: 0, rate: 0 };

    const counts = Object.values(record.dailyStatus).reduce(
      (acc, status: AttendanceStatus) => {
        if (status === 'P') acc.present++;
        else if (status === 'A') acc.absent++;
        else if (status === 'L') acc.tardy++;
        else if (status === 'E') acc.excused++;
        return acc;
      },
      { present: 0, absent: 0, tardy: 0, excused: 0 }
    );

    const total = counts.present + counts.absent + counts.tardy + counts.excused;
    const rate = total > 0 ? ((counts.present + counts.tardy) / total) * 100 : 0;

    return { ...counts, total, rate: rate.toFixed(0) };
  }, [attendanceRecords, student.id]);

  // Calculate core values average
  const coreValuesAverage = useMemo(() => {
    const studentCoreValues = coreValueGrades.filter(cv => cv.studentId === student.id);
    if (studentCoreValues.length === 0) return 'N/A';

    // Core values use markings (AO, SO, RO, NO), not numeric grades
    // For now, return a placeholder or count of records
    return `${studentCoreValues.length} recorded`;
  }, [coreValueGrades, student.id]);

  // Subject-wise performance
  const subjectPerformance = useMemo(() => {
    const studentGrades = grades.filter(g => g.studentId === student.id);
    return studentGrades
      .filter(g => typeof g.finalGrade === 'number' && g.learningAreaId)
      .map(g => ({
        subject: g.learningAreaId!, // Would map to actual learning area name
        grade: g.finalGrade!,
        color: g.finalGrade! >= 90 ? 'bg-green-500' : g.finalGrade! >= 80 ? 'bg-blue-500' : g.finalGrade! >= 75 ? 'bg-yellow-500' : 'bg-red-500'
      }));
  }, [grades, student.id]);

  // Get status badge
  const getStatusBadge = () => {
    const avg = parseFloat(academicMetrics.average);
    if (isNaN(avg)) return { label: 'Active', color: 'bg-blue-500' };
    if (avg >= 90) return { label: 'Honor Roll', color: 'bg-yellow-500' };
    if (avg >= 85) return { label: 'High Achiever', color: 'bg-green-500' };
    if (avg < 75) return { label: 'Needs Support', color: 'bg-red-500' };
    return { label: 'Active', color: 'bg-blue-500' };
  };

  const statusBadge = getStatusBadge();

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <InformationCircleIcon /> },
    { id: 'academic', label: 'Academic', icon: <AcademicCapIcon /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarDaysIcon /> },
    { id: 'behavior', label: 'Core Values', icon: <HeartIcon /> },
    { id: 'documents', label: 'Documents', icon: <ClipboardDocumentIcon /> },
    { id: 'family', label: 'Family', icon: <UsersIcon /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30">
                {student.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Student Info */}
              <div>
                <h2 className="text-3xl font-bold">{student.name}</h2>
                <p className="text-indigo-100">LRN: {student.lrn || 'N/A'}</p>
                <p className="text-indigo-100">
                  {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'No Section Assigned'}
                </p>
                <div className="mt-2 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color} text-white`}>
                    {statusBadge.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
                    SY {schoolYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-indigo-100">Average</div>
              <div className="text-2xl font-bold">{academicMetrics.average}%</div>
              <div className="text-xs text-indigo-200">
                {academicMetrics.trend === 'up' ? '↑' : academicMetrics.trend === 'down' ? '↓' : '→'} Trending
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-indigo-100">Attendance</div>
              <div className="text-2xl font-bold">{attendanceMetrics.rate}%</div>
              <div className="text-xs text-indigo-200">{attendanceMetrics.present} days</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-indigo-100">Class Rank</div>
              <div className="text-2xl font-bold">#{academicMetrics.rank}</div>
              <div className="text-xs text-indigo-200">of {academicMetrics.totalStudents}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-xs text-indigo-100">Percentile</div>
              <div className="text-2xl font-bold">Top {100 - parseFloat(academicMetrics.percentile)}%</div>
              <div className="text-xs text-indigo-200">Core Values: {coreValuesAverage}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              student={student}
              section={section}
              adviser={adviser}
              academicMetrics={academicMetrics}
              attendanceMetrics={attendanceMetrics}
              coreValuesAverage={coreValuesAverage}
              calculateAge={calculateAge}
              subjectPerformance={subjectPerformance}
            />
          )}

          {activeTab === 'academic' && (
            <AcademicTab
              student={student}
              grades={grades}
              subjectPerformance={subjectPerformance}
              academicMetrics={academicMetrics}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTab
              student={student}
              attendanceRecords={attendanceRecords}
              attendanceMetrics={attendanceMetrics}
            />
          )}

          {activeTab === 'behavior' && (
            <BehaviorTab
              student={student}
              coreValueGrades={coreValueGrades}
              coreValuesAverage={coreValuesAverage}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab student={student} schoolYear={schoolYear} />
          )}

          {activeTab === 'family' && (
            <FamilyTab student={student} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 flex justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => alert(`Email functionality would send message to parent of ${student.name}`)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              📧 Email Parent
            </button>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              🖨️ Print Profile
            </button>
            <button 
              onClick={() => {
                console.log('Exporting student data:', student);
                alert(`Exporting data for ${student.name}. Check console for data.`);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              📊 Export Data
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  student: Student;
  section?: Section;
  adviser?: Teacher;
  academicMetrics: any;
  attendanceMetrics: any;
  coreValuesAverage: string;
  calculateAge: (date?: string) => string | number;
  subjectPerformance: any[];
}> = ({ student, section, adviser, academicMetrics, attendanceMetrics, coreValuesAverage, calculateAge, subjectPerformance }) => (
  <div className="space-y-6">
    {/* Quick Info Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        title="Academic Average"
        value={`${academicMetrics.average}%`}
        icon={<StarIcon />}
        color={parseFloat(academicMetrics.average) >= 85 ? 'green' : parseFloat(academicMetrics.average) >= 75 ? 'yellow' : 'red'}
        trend={academicMetrics.trend}
      />
      <Card
        title="Attendance Rate"
        value={`${attendanceMetrics.rate}%`}
        icon={<CheckBadgeIcon />}
        color={parseFloat(attendanceMetrics.rate) >= 95 ? 'green' : 'blue'}
      />
      <Card
        title="Core Values"
        value={coreValuesAverage}
        icon={<HeartIcon />}
        color="indigo"
      />
    </div>

    {/* Student Information */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Student Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow label="Full Name" value={student.name} />
        <InfoRow label="Email" value={student.email} />
        <InfoRow label="LRN" value={student.lrn || 'N/A'} />
        <InfoRow label="Age" value={calculateAge(student.dateOfBirth).toString()} />
        <InfoRow label="Date of Birth" value={student.dateOfBirth || 'N/A'} />
        <InfoRow label="Sex" value={student.sex || 'N/A'} />
        <InfoRow label="Class" value={section ? `Grade ${section.gradeLevel} - ${section.name}` : 'N/A'} />
        <InfoRow label="Class Adviser" value={adviser?.name || 'N/A'} />
        <InfoRow label="Enrollment Date" value={student.enrollmentDate} />
      </div>
    </div>

    {/* Top Subjects */}
    {subjectPerformance.length > 0 && (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Subject Performance</h3>
        <BarChart
          data={subjectPerformance.map(s => ({
            label: `Subject ${s.subject.substring(0, 8)}`,
            value: s.grade,
            color: s.color
          }))}
          maxValue={100}
        />
      </div>
    )}

    {/* Recent Activity */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Recent Activity</h3>
      <div className="space-y-3">
        <ActivityItem
          title="Grade Posted"
          description="Math Quiz - 92%"
          time="2 hours ago"
          type="success"
        />
        <ActivityItem
          title="Attendance Marked"
          description="Present in all classes"
          time="Today"
          type="info"
        />
        <ActivityItem
          title="Achievement Unlocked"
          description="Perfect Attendance - Week 5"
          time="2 days ago"
          type="success"
        />
      </div>
    </div>
  </div>
);

// Academic Tab Component
const AcademicTab: React.FC<{
  student: Student;
  grades: Grade[];
  subjectPerformance: any[];
  academicMetrics: any;
}> = ({ student, grades, subjectPerformance, academicMetrics }) => {
  const studentGrades = grades.filter(g => g.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Grade Distribution</h3>
          {subjectPerformance.length > 0 ? (
            <BarChart
              data={subjectPerformance.map(s => ({
                label: `Subj ${s.subject.substring(0, 6)}`,
                value: s.grade,
                color: s.color
              }))}
              maxValue={100}
            />
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No grades recorded yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Overall Performance</h3>
          <div className="flex justify-center">
            <ProgressRing
              value={parseFloat(academicMetrics.average)}
              max={100}
              size={150}
              strokeWidth={10}
              color={parseFloat(academicMetrics.average) >= 85 ? 'green' : parseFloat(academicMetrics.average) >= 75 ? 'yellow' : 'red'}
              label={`${academicMetrics.average}% Average`}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">Class Rank: #{academicMetrics.rank} of {academicMetrics.totalStudents}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Top {100 - parseFloat(academicMetrics.percentile)}% Percentile</p>
          </div>
        </div>
      </div>

      {/* Detailed Grades */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Detailed Grades</h3>
        {studentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-400">Subject</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Q1</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Q2</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Q3</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Q4</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">Final</th>
                </tr>
              </thead>
              <tbody>
                {studentGrades.map((grade, index) => {
                  // Helper to display grade value (handle SubGradeRecord)
                  const displayQuarter = (q?: number | Record<string, number>): string => {
                    if (typeof q === 'number') return q.toString();
                    if (typeof q === 'object' && q !== null) return 'Composite';
                    return '-';
                  };

                  return (
                    <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="px-4 py-2 text-sm text-slate-800 dark:text-slate-200">
                        Subject {grade.learningAreaId?.substring(0, 10) || 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-slate-800 dark:text-slate-200">{displayQuarter(grade.q1)}</td>
                      <td className="px-4 py-2 text-center text-sm text-slate-800 dark:text-slate-200">{displayQuarter(grade.q2)}</td>
                      <td className="px-4 py-2 text-center text-sm text-slate-800 dark:text-slate-200">{displayQuarter(grade.q3)}</td>
                      <td className="px-4 py-2 text-center text-sm text-slate-800 dark:text-slate-200">{displayQuarter(grade.q4)}</td>
                      <td className="px-4 py-2 text-center text-sm font-semibold">
                        <span className={`px-2 py-1 rounded ${
                          typeof grade.finalGrade === 'number'
                            ? grade.finalGrade >= 90
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : grade.finalGrade >= 75
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : ''
                        }`}>
                          {grade.finalGrade || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No grades recorded yet</p>
        )}
      </div>
    </div>
  );
};

// Attendance Tab Component
const AttendanceTab: React.FC<{
  student: Student;
  attendanceRecords: AttendanceRecord[];
  attendanceMetrics: any;
}> = ({ student, attendanceRecords, attendanceMetrics }) => {
  const record = attendanceRecords.find(r => r.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Attendance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present" value={attendanceMetrics.present} color="text-green-600 dark:text-green-400" />
        <StatCard label="Absent" value={attendanceMetrics.absent} color="text-red-600 dark:text-red-400" />
        <StatCard label="Tardy" value={attendanceMetrics.tardy} color="text-yellow-600 dark:text-yellow-400" />
        <StatCard label="Excused" value={attendanceMetrics.excused} color="text-blue-600 dark:text-blue-400" />
      </div>

      {/* Attendance Rate */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Attendance Rate</h3>
        <div className="flex justify-center">
          <ProgressRing
            value={attendanceMetrics.present + attendanceMetrics.tardy}
            max={attendanceMetrics.total}
            size={150}
            strokeWidth={10}
            color={parseFloat(attendanceMetrics.rate) >= 95 ? 'green' : 'blue'}
            label={`${attendanceMetrics.rate}% Rate`}
          />
        </div>
        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
          {attendanceMetrics.present + attendanceMetrics.tardy} present out of {attendanceMetrics.total} days
        </p>
      </div>

      {/* Calendar Heatmap would go here - simplified version */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Attendance History</h3>
        {record ? (
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(record.dailyStatus).slice(0, 28).map(([date, status]) => (
              <div
                key={date}
                className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                  status === 'P'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : status === 'A'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : status === 'L'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}
                title={`${date}: ${status}`}
              >
                {status}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No attendance records</p>
        )}
      </div>
    </div>
  );
};

// Behavior Tab Component
const BehaviorTab: React.FC<{
  student: Student;
  coreValueGrades: CoreValueGrade[];
  coreValuesAverage: string;
}> = ({ student, coreValueGrades, coreValuesAverage }) => {
  const studentCoreValues = coreValueGrades.filter(cv => cv.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Core Values Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Core Values Overview</h3>
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">
          {coreValuesAverage}
        </p>
      </div>

      {/* Individual Core Values */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Core Values Breakdown</h3>
        {studentCoreValues.length > 0 ? (
          <div className="space-y-4">
            {studentCoreValues.map((cv, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Core Value {cv.coreValueId?.substring(0, 10) || 'Unknown'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Q1: {cv.q1 ? 'Recorded' : '-'} | Q2: {cv.q2 ? 'Recorded' : '-'} | Q3: {cv.q3 ? 'Recorded' : '-'} | Q4: {cv.q4 ? 'Recorded' : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No core values recorded yet</p>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Achievements & Recognition</h3>
        <div className="space-y-3">
          <AchievementItem
            title="Respectful Student"
            description="Consistently demonstrates respect to peers and teachers"
            icon={<TrophyIcon />}
          />
          <AchievementItem
            title="Excellent Teamwork"
            description="Outstanding collaboration in group activities"
            icon={<FireIcon />}
          />
        </div>
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab: React.FC<{
  student: Student;
  schoolYear: string;
}> = ({ student, schoolYear }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Student Documents</h3>
      <div className="space-y-3">
        <DocumentItem
          title="Report Card - Q1"
          description="First Quarter Report Card"
          date="2025-09-15"
        />
        <DocumentItem
          title="Report Card - Q2"
          description="Second Quarter Report Card"
          date="2025-11-15"
        />
        <DocumentItem
          title="Enrollment Form"
          description={`SY ${schoolYear} Enrollment`}
          date={student.enrollmentDate}
        />
        <DocumentItem
          title="Student Profile"
          description="Complete student information"
          date="2025-06-01"
        />
      </div>
    </div>

    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => alert(`Generating Report Card for ${student.name}`)}
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          📄 Generate Report Card
        </button>
        <button 
          onClick={() => alert(`Exporting Transcript for ${student.name}`)}
          className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          🎓 Export Transcript
        </button>
        <button 
          onClick={() => window.print()}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          🪪 Print Student ID
        </button>
        <button 
          onClick={() => alert(`Sending email summary for ${student.name}`)}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          📧 Email Summary
        </button>
      </div>
    </div>
  </div>
);

// Family Tab Component
const FamilyTab: React.FC<{
  student: Student;
}> = () => (
  <div className="space-y-6">
    {/* Parent/Guardian Information */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Parent/Guardian Information</h3>
      <div className="space-y-4">
        <div className="border-l-4 border-indigo-500 pl-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">Primary Guardian</h4>
          <InfoRow label="Name" value="Juan Dela Cruz Sr." />
          <InfoRow label="Relationship" value="Father" />
          <InfoRow label="Phone" value="+63 912 345 6789" />
          <InfoRow label="Email" value="juan.delacruz@email.com" />
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">Secondary Guardian</h4>
          <InfoRow label="Name" value="Maria Dela Cruz" />
          <InfoRow label="Relationship" value="Mother" />
          <InfoRow label="Phone" value="+63 917 654 3210" />
          <InfoRow label="Email" value="maria.delacruz@email.com" />
        </div>
      </div>
    </div>

    {/* Emergency Contact */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Emergency Contact</h3>
      <InfoRow label="Name" value="Rosa Dela Cruz" />
      <InfoRow label="Relationship" value="Grandmother" />
      <InfoRow label="Phone" value="+63 915 111 2222" />
    </div>

    {/* Additional Information */}
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Additional Information</h3>
      <InfoRow label="Home Address" value="123 Main Street, Barangay 1, City, Province" />
      <InfoRow label="Blood Type" value="O+" />
      <InfoRow label="Medical Conditions" value="None reported" />
      <InfoRow label="Allergies" value="None reported" />
    </div>
  </div>
);

// Helper Components
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}:</span>
    <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
  </div>
);

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 text-center">
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{label}</div>
  </div>
);

const ActivityItem: React.FC<{
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}> = ({ title, description, time, type }) => {
  const colors = {
    success: 'border-green-500',
    info: 'border-blue-500',
    warning: 'border-yellow-500',
  };

  return (
    <div className={`border-l-4 ${colors[type]} pl-4 py-2`}>
      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{description}</div>
      <div className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
        <ClockIcon />
        {time}
      </div>
    </div>
  );
};

const AchievementItem: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ title, description, icon }) => (
  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
    <div className="text-yellow-600 dark:text-yellow-400">{icon}</div>
    <div>
      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{description}</div>
    </div>
  </div>
);

const DocumentItem: React.FC<{
  title: string;
  description: string;
  date: string;
}> = ({ title, description, date }) => (
  <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
    <div className="flex items-center gap-3">
      <ClipboardDocumentIcon />
      <div>
        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{title}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">{description}</div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-500">{date}</span>
      <ChevronRightIcon />
    </div>
  </div>
);

export default StudentProfile;
