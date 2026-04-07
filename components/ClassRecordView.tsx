/**
 * ClassRecordView - Electronic Class Record (ECR) Component
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * This component provides:
 * - Spreadsheet-style score entry for Written Work, Performance Task, and Quarterly Assessment
 * - Activity management (add, edit, delete)
 * - Real-time grade computation with DepEd transmutation
 * - Class statistics and insights
 * - CSV and PDF export (Division format with DepEd logos)
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useECR, useECRActivityModal, useQuarterSelector } from '../src/hooks/useECR';
import { downloadECRCSV, generateECRPDF, type ECRExportData } from '../src/utils/ecr/ecrExportService';
import type {
  ECRActivity,
  ECRActivityType,
  ECRQuarter,
  ECRStudentRow
} from '../src/types/ecr.types';

// ============================================
// Types
// ============================================

interface ClassRecordViewProps {
  sectionId: string;
  learningAreaId: string;
  schoolYear: string;
  teacherId: string;
  schoolId: string;
  // School info for export headers
  schoolName?: string;
  schoolIdNumber?: string; // Official DepEd school ID number
  region?: string;
  division?: string;
  district?: string;
  gradeLevel?: number;
  learningAreaCode?: string; // Short code for learning area
}

// ============================================
// Sub-Components
// ============================================

/**
 * Quarter Selector Tabs
 */
const QuarterTabs: React.FC<{
  quarter: ECRQuarter;
  onChange: (q: ECRQuarter) => void;
}> = ({ quarter, onChange }) => {
  const quarters: { value: ECRQuarter; label: string }[] = [
    { value: 'Q1', label: 'Quarter 1' },
    { value: 'Q2', label: 'Quarter 2' },
    { value: 'Q3', label: 'Quarter 3' },
    { value: 'Q4', label: 'Quarter 4' },
  ];
  
  return (
    <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
      {quarters.map(q => (
        <button
          key={q.value}
          onClick={() => onChange(q.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            quarter === q.value
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Activity Header Cell
 */
const ActivityHeader: React.FC<{
  activity: ECRActivity;
  onEdit: () => void;
}> = ({ activity, onEdit }) => {
  const tooltipLines = [
    `${activity.activityType.toUpperCase()} ${activity.activityNumber}`,
    activity.activityName ? `Name: ${activity.activityName}` : null,
    `Max Score: ${activity.maxScore}`,
    activity.activityDate
      ? `Date: ${new Date(activity.activityDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`
      : null,
  ].filter(Boolean).join('\n');

  return (
    <th
      className="px-1 py-1.5 text-center cursor-pointer hover:bg-indigo-50/50 transition-colors align-bottom group"
      onClick={onEdit}
      title={tooltipLines}
      style={{ minWidth: 48 }}
    >
      <div className="flex flex-col items-center gap-0.5">
        {/* Activity number */}
        <span className="text-xs font-semibold text-slate-700 leading-none group-hover:text-indigo-600 transition-colors">
          {activity.activityNumber}
        </span>
        {/* Truncated activity name */}
        {activity.activityName && (
          <span className="text-[9px] text-slate-400 font-normal leading-tight truncate max-w-[52px] block">
            {activity.activityName}
          </span>
        )}
        {/* Max score */}
        <span className="text-[10px] text-slate-400 font-normal leading-none">
          /{activity.maxScore}
        </span>
      </div>
    </th>
  );
};

/**
 * Score Input Cell
 */
const ScoreCell: React.FC<{
  activityId: string;
  studentId: string;
  currentScore: number | null;
  maxScore: number;
  onSave: (score: number | null) => void;
  disabled?: boolean;
  isActive?: boolean;
  onActivate?: () => void;
  onNav?: (dir: 'right' | 'left' | 'down' | 'up') => void;
}> = ({ activityId: _activityId, studentId: _studentId, currentScore, maxScore, onSave, disabled, isActive, onActivate, onNav }) => {
  // Note: activityId and studentId are passed for key/identification purposes but handled by parent
  void _activityId; void _studentId;
  const [value, setValue] = useState<string>(currentScore?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when currentScore changes externally
  useEffect(() => {
    if (!isActive) {
      setValue(currentScore?.toString() || '');
    }
  }, [currentScore, isActive]);

  // Focus input when cell becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  const commitValue = useCallback(() => {
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== currentScore) {
      if (numValue === null || (numValue >= 0 && numValue <= maxScore)) {
        onSave(numValue);
      } else {
        setValue(currentScore?.toString() || '');
      }
    }
  }, [value, currentScore, maxScore, onSave]);

  const handleBlur = useCallback(() => {
    commitValue();
  }, [commitValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      commitValue();
      onNav?.(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitValue();
      onNav?.('down');
    } else if (e.key === 'Escape') {
      setValue(currentScore?.toString() || '');
      onActivate?.(); // deactivate by letting parent handle
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitValue();
      onNav?.('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitValue();
      onNav?.('down');
    } else if (e.key === 'ArrowLeft' && inputRef.current?.selectionStart === 0) {
      e.preventDefault();
      commitValue();
      onNav?.('left');
    } else if (e.key === 'ArrowRight' && inputRef.current?.selectionStart === value.length) {
      e.preventDefault();
      commitValue();
      onNav?.('right');
    }
  }, [commitValue, currentScore, onNav, onActivate, value.length]);

  if (disabled) {
    return (
      <td className="px-2 py-1 text-center text-sm text-slate-400 border-b border-slate-100">
        -
      </td>
    );
  }

  if (isActive) {
    return (
      <td className="px-1 py-0.5 border-b border-slate-100 bg-indigo-50">
        <input
          ref={inputRef}
          type="number"
          min="0"
          max={maxScore}
          step="0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-12 px-1 py-0.5 text-center text-sm border border-indigo-400 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </td>
    );
  }

  return (
    <td
      className="px-2 py-1 text-center text-sm text-slate-700 border-b border-slate-100 cursor-pointer hover:bg-indigo-50"
      onClick={() => onActivate?.()}
    >
      {currentScore ?? '-'}
    </td>
  );
};

/**
 * Component Section (WW, PT, or QA)
 * Shows 10 activity columns by default (matching Division ECR format)
 */
const ComponentSection: React.FC<{
  type: ECRActivityType;
  label: string;
  activities: ECRActivity[];
  weight: number;
  students: ECRStudentRow[];
  onAddActivity: (activityNumber: number) => void;
  onEditActivity: (activity: ECRActivity) => void;
  onSaveScore: (activityId: string, studentId: string, score: number | null) => void;
  colorClass: string;
}> = ({ type, label, activities, weight, students, onAddActivity, onEditActivity, onSaveScore, colorClass }) => {
  const totalKey = `${type.toLowerCase()}Total` as keyof ECRStudentRow;
  const maxKey = `${type.toLowerCase()}Max` as keyof ECRStudentRow;
  const percentKey = `${type.toLowerCase()}Percentage` as keyof ECRStudentRow;
  const wsKey = `${type.toLowerCase()}Weighted` as keyof ECRStudentRow;

  // Active cell tracking: [activityIndex, studentIndex]
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);

  // Sort activities by number (stable reference)
  const sortedActivities = useMemo(
    () => activities.slice().sort((a, b) => a.activityNumber - b.activityNumber),
    [activities]
  );

  const nextNumber = activities.length > 0
    ? Math.max(...activities.map(a => a.activityNumber)) + 1
    : 1;

  const handleNav = useCallback((colIdx: number, rowIdx: number, dir: 'right' | 'left' | 'down' | 'up') => {
    const maxCol = sortedActivities.length - 1;
    const maxRow = students.length - 1;

    if (dir === 'right') {
      if (colIdx < maxCol) setActiveCell([colIdx + 1, rowIdx]);
      else if (rowIdx < maxRow) setActiveCell([0, rowIdx + 1]); // wrap to next row
      else setActiveCell(null);
    } else if (dir === 'left') {
      if (colIdx > 0) setActiveCell([colIdx - 1, rowIdx]);
      else if (rowIdx > 0) setActiveCell([maxCol, rowIdx - 1]); // wrap to prev row
      else setActiveCell(null);
    } else if (dir === 'down') {
      if (rowIdx < maxRow) setActiveCell([colIdx, rowIdx + 1]);
      else setActiveCell(null);
    } else if (dir === 'up') {
      if (rowIdx > 0) setActiveCell([colIdx, rowIdx - 1]);
      else setActiveCell(null);
    }
  }, [sortedActivities.length, students.length]);

  // Color mapping for the two-row header (top label + sub-header bg)
  const colorMap: Record<string, { top: string; sub: string; summaryBg: string }> = {
    'bg-blue-600': { top: 'bg-blue-600', sub: 'bg-blue-700', summaryBg: 'bg-blue-800' },
    'bg-green-600': { top: 'bg-green-600', sub: 'bg-green-700', summaryBg: 'bg-green-800' },
    'bg-purple-600': { top: 'bg-purple-600', sub: 'bg-purple-700', summaryBg: 'bg-purple-800' },
    'bg-blue-500': { top: 'bg-blue-500', sub: 'bg-blue-600', summaryBg: 'bg-blue-700' },
    'bg-green-500': { top: 'bg-green-500', sub: 'bg-green-600', summaryBg: 'bg-green-700' },
    'bg-purple-500': { top: 'bg-purple-500', sub: 'bg-purple-600', summaryBg: 'bg-purple-700' },
  };
  const colors = colorMap[colorClass] || { top: colorClass, sub: 'bg-slate-600', summaryBg: 'bg-slate-700' };

  // Total columns = activity slots + Add + Total + PS + WS
  const totalCols = sortedActivities.length + 4;

  return (
    <div className="flex-shrink-0">
      <table className="border-collapse">
        <thead className="sticky top-0 z-20">
          {/* Row 1: Component label spanning all columns — h-[42px] to match Learner's Name */}
          <tr className="h-[42px]">
            <th
              colSpan={totalCols}
              className={`${colors.top} text-white text-sm font-semibold px-3 text-left`}
            >
              <div className="flex items-center justify-between">
                <span>{label}</span>
                <span className="text-xs font-normal text-white/80">({weight}%)</span>
              </div>
            </th>
          </tr>
          {/* Row 2: Activity numbers + summary columns — h-[42px] to match sub-header */}
          <tr className={`${colors.sub} h-[42px]`}>
            {sortedActivities.map((activity) => {
              const tooltipLines = [
                `${activity.activityType.toUpperCase()} ${activity.activityNumber}`,
                activity.activityName ? `Name: ${activity.activityName}` : null,
                `Max Score: ${activity.maxScore}`,
                activity.activityDate
                  ? `Date: ${new Date(activity.activityDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : null,
              ].filter(Boolean).join('\n');

              return (
                <th
                  key={activity.id}
                  className="px-1 py-0 text-center cursor-pointer hover:brightness-110 transition-all align-middle"
                  onClick={() => onEditActivity(activity)}
                  title={tooltipLines}
                  style={{ minWidth: 48 }}
                >
                  <div className="flex flex-col items-center gap-0">
                    <span className="text-xs font-bold text-white leading-none">
                      {activity.activityNumber}
                    </span>
                    {activity.activityName && (
                      <span className="text-[8px] text-white/70 font-normal truncate max-w-[52px] block leading-tight">
                        {activity.activityName}
                      </span>
                    )}
                    <span className="text-[9px] text-white/60 font-normal leading-none">
                      /{activity.maxScore}
                    </span>
                  </div>
                </th>
              );
            })}
            {/* Add column */}
            <th
              className="px-2 py-0 text-white/60 cursor-pointer hover:text-white hover:brightness-110 transition-colors align-middle"
              onClick={() => onAddActivity(nextNumber)}
              title={`Add ${label} ${nextNumber}`}
              style={{ minWidth: 36 }}
            >
              <div className="flex flex-col items-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[8px]">Add</span>
              </div>
            </th>
            {/* Summary columns */}
            {['Total', 'PS', 'WS'].map(slabel => (
              <th key={slabel} className={`px-2 py-0 text-[10px] font-semibold text-white ${colors.summaryBg} align-middle`}>
                {slabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((student, rowIdx) => (
            <tr key={student.studentId} className="hover:bg-slate-50 h-[33px]">
              {sortedActivities.map((activity, colIdx) => (
                  <ScoreCell
                    key={activity.id}
                    activityId={activity.id}
                    studentId={student.studentId}
                    currentScore={student.scores[activity.id]?.rawScore ?? null}
                    maxScore={activity.maxScore}
                    onSave={(score) => onSaveScore(activity.id, student.studentId, score)}
                    isActive={activeCell?.[0] === colIdx && activeCell?.[1] === rowIdx}
                    onActivate={() => setActiveCell([colIdx, rowIdx])}
                    onNav={(dir) => handleNav(colIdx, rowIdx, dir)}
                  />
                ))}
              {/* Empty cell under add column */}
              <td className="px-2 py-1 text-center text-sm text-slate-200 border-b border-slate-100">
                &middot;
              </td>
              <td className="px-2 text-center text-sm font-medium text-slate-700 border-b border-slate-100 bg-slate-50">
                {student[totalKey] as number}/{student[maxKey] as number}
              </td>
              <td className="px-2 text-center text-sm font-medium text-slate-700 border-b border-slate-100 bg-slate-50">
                {(student[percentKey] as number).toFixed(0)}%
              </td>
              <td className="px-2 text-center text-sm font-medium text-slate-700 border-b border-slate-100 bg-slate-100">
                {(student[wsKey] as number).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Activity Modal for Create/Edit
 */
const ActivityModal: React.FC<{
  isOpen: boolean;
  isEditing: boolean;
  activityType: ECRActivityType;
  activity?: ECRActivity | null;
  nextNumber: number;
  onClose: () => void;
  onCreate: (data: { activityNumber: number; activityName?: string; maxScore: number; description?: string; activityDate?: string }) => void;
  onUpdate: (data: { activityName?: string; maxScore: number; description?: string; activityDate?: string }) => void;
  onDelete: () => void;
}> = ({ isOpen, isEditing, activityType, activity, nextNumber, onClose, onCreate, onUpdate, onDelete }) => {
  const [activityNumber, setActivityNumber] = useState(activity?.activityNumber || nextNumber);
  const [activityName, setActivityName] = useState(activity?.activityName || '');
  const [maxScore, setMaxScore] = useState(activity?.maxScore || 10);
  const [activityDate, setActivityDate] = useState(activity?.activityDate?.slice(0, 10) || '');
  const [description, setDescription] = useState(activity?.description || '');

  const typeLabels: Record<ECRActivityType, string> = {
    WW: 'Written Work',
    PT: 'Performance Task',
    QA: 'Quarterly Assessment'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate({ activityName: activityName || undefined, maxScore, description: description || undefined, activityDate: activityDate || undefined });
    } else {
      onCreate({ activityNumber, activityName: activityName || undefined, maxScore, description: description || undefined, activityDate: activityDate || undefined });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {isEditing ? 'Edit' : 'Add'} {typeLabels[activityType]}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Activity Number
              </label>
              <input
                type="number"
                min="1"
                value={activityNumber}
                onChange={(e) => setActivityNumber(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Activity Name <span className="text-slate-400 font-normal">(e.g. Summary Test, Unit Quiz 1)</span>
            </label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder={`${typeLabels[activityType]} ${activityNumber}`}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Given <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Maximum Score
            </label>
            <input
              type="number"
              min="1"
              value={maxScore}
              onChange={(e) => setMaxScore(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex justify-between pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={() => { onDelete(); onClose(); }}
                className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
              >
                Delete
              </button>
            )}
            <div className={`flex space-x-3 ${!isEditing ? 'ml-auto' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                {isEditing ? 'Save Changes' : 'Add Activity'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Class Statistics Card
 */
const ClassStats: React.FC<{
  stats: {
    totalStudents: number;
    gradedCount: number;
    classAverage: number;
    passingCount: number;
    passingRate: number;
    highestGrade: number;
    lowestGrade: number;
  };
}> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="text-xs text-slate-500">Students</div>
        <div className="text-xl font-bold text-slate-900">{stats.totalStudents}</div>
      </div>
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs text-blue-600">Graded</div>
        <div className="text-xl font-bold text-blue-900">{stats.gradedCount}</div>
      </div>
      <div className="bg-indigo-50 rounded-lg p-3">
        <div className="text-xs text-indigo-600">Class Average</div>
        <div className="text-xl font-bold text-indigo-900">{stats.classAverage || '-'}</div>
      </div>
      <div className="bg-green-50 rounded-lg p-3">
        <div className="text-xs text-green-600">Passing</div>
        <div className="text-xl font-bold text-green-900">{stats.passingCount}</div>
      </div>
      <div className="bg-emerald-50 rounded-lg p-3">
        <div className="text-xs text-emerald-600">Pass Rate</div>
        <div className="text-xl font-bold text-emerald-900">{stats.passingRate}%</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3">
        <div className="text-xs text-purple-600">Highest</div>
        <div className="text-xl font-bold text-purple-900">{stats.highestGrade || '-'}</div>
      </div>
      <div className="bg-amber-50 rounded-lg p-3">
        <div className="text-xs text-amber-600">Lowest</div>
        <div className="text-xl font-bold text-amber-900">{stats.lowestGrade || '-'}</div>
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

const ClassRecordView: React.FC<ClassRecordViewProps> = ({
  sectionId,
  learningAreaId,
  schoolYear,
  teacherId,
  schoolId,
  schoolName = '',
  schoolIdNumber = '',
  region = 'Region XI',
  division = 'Division of the City of Mati',
  district = '',
  gradeLevel = 0,
  learningAreaCode = ''
}) => {
  const { quarter, setQuarter } = useQuarterSelector('Q1');
  const activityModal = useECRActivityModal();
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  
  const {
    classRecord,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    saveScore,
    recomputeAllGrades,
    refresh
  } = useECR({
    sectionId,
    learningAreaId,
    schoolYear,
    quarter,
    teacherId,
    schoolId
  });

  // Memoize next activity numbers to prevent infinite loops
  const nextActivityNumbers = useMemo(() => ({
    WW: (classRecord?.activities.ww.length ?? 0) + 1,
    PT: (classRecord?.activities.pt.length ?? 0) + 1,
    QA: (classRecord?.activities.qa.length ?? 0) + 1
  }), [classRecord?.activities]);

  // Deduplicate students to prevent React key warnings
  const uniqueStudents = useMemo(() => {
    if (!classRecord?.students) return [];
    const seen = new Set<string>();
    return classRecord.students.filter(s => {
      if (seen.has(s.studentId)) return false;
      seen.add(s.studentId);
      return true;
    });
  }, [classRecord?.students]);

  // Export data builder - uses data from classRecord (fetched from database)
  const buildExportData = useCallback((): ECRExportData | null => {
    if (!classRecord) return null;
    return {
      schoolName: classRecord.schoolName || schoolName || 'School',
      schoolId: classRecord.schoolId || schoolId,
      schoolIdNumber: classRecord.schoolIdNumber || schoolIdNumber || '', // From schools.school_id_number
      region: classRecord.region || region,
      division: classRecord.division || division,
      district: classRecord.district || district,
      schoolYear,
      quarter,
      gradeLevel: classRecord.gradeLevel || gradeLevel || 0,
      sectionName: classRecord.sectionName,
      learningAreaName: classRecord.learningAreaName,
      learningAreaCode: classRecord.learningAreaCode || learningAreaCode || classRecord.learningAreaName, // From learning_areas.code
      teacherName: classRecord.teacherName,
      activities: classRecord.activities,
      weights: classRecord.weights,
      students: uniqueStudents
    };
  }, [classRecord, schoolName, schoolId, schoolIdNumber, region, division, district, schoolYear, quarter, gradeLevel, learningAreaCode, uniqueStudents]);

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    const data = buildExportData();
    if (!data) return;
    setExporting('csv');
    try {
      downloadECRCSV(data);
    } finally {
      setExporting(null);
    }
  }, [buildExportData]);

  const handleExportPDF = useCallback(async () => {
    const data = buildExportData();
    if (!data) return;
    setExporting('pdf');
    try {
      await generateECRPDF(data);
    } finally {
      setExporting(null);
    }
  }, [buildExportData]);

  // Handlers
  const handleCreateActivity = useCallback(
    async (data: { activityNumber: number; activityName?: string; maxScore: number; description?: string; activityDate?: string }) => {
      await createActivity({
        activityType: activityModal.activityType,
        activityNumber: data.activityNumber,
        activityName: data.activityName,
        maxScore: data.maxScore,
        description: data.description,
        activityDate: data.activityDate
      });
    },
    [createActivity, activityModal.activityType]
  );

  const handleUpdateActivity = useCallback(
    async (data: { activityName?: string; maxScore: number; description?: string; activityDate?: string }) => {
      if (activityModal.editingActivity) {
        await updateActivity(activityModal.editingActivity.id, data);
      }
    },
    [updateActivity, activityModal.editingActivity]
  );

  const handleDeleteActivity = useCallback(async () => {
    if (activityModal.editingActivity) {
      await deleteActivity(activityModal.editingActivity.id);
    }
  }, [deleteActivity, activityModal.editingActivity]);

  const handleSaveScore = useCallback(
    async (activityId: string, studentId: string, score: number | null) => {
      await saveScore(activityId, studentId, score);
    },
    [saveScore]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading class record...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!classRecord) {
    return (
      <div className="text-center py-12 text-slate-500">
        No class record data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              📋 Electronic Class Record
            </h2>
            <p className="text-indigo-100">
              {classRecord.sectionName} • {classRecord.learningAreaName}
            </p>
            <p className="text-sm text-indigo-200 mt-1">
              SY {classRecord.schoolYear} • {classRecord.teacherName}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <QuarterTabs quarter={quarter} onChange={setQuarter} />
            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleExportCSV}
                disabled={exporting !== null}
                className="flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                title="Export to CSV (Excel-compatible)"
              >
                {exporting === 'csv' ? (
                  <span className="animate-spin mr-1">⏳</span>
                ) : (
                  <span className="mr-1">📊</span>
                )}
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting !== null}
                className="flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                title="Export to PDF (Division format with DepEd logos)"
              >
                {exporting === 'pdf' ? (
                  <span className="animate-spin mr-1">⏳</span>
                ) : (
                  <span className="mr-1">📄</span>
                )}
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <ClassStats stats={classRecord.stats} />

      {/* Weight Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="text-sm text-slate-600">
              Component Weights:
            </span>
            <span className={`text-sm font-medium ${classRecord.weights.ww > 0 ? 'text-blue-600' : 'text-slate-400 line-through'}`}>
              Written Work: {classRecord.weights.ww}%
            </span>
            <span className={`text-sm font-medium ${classRecord.weights.pt > 0 ? 'text-green-600' : 'text-slate-400 line-through'}`}>
              Performance Task: {classRecord.weights.pt}%
            </span>
            <span className={`text-sm font-medium ${classRecord.weights.qa > 0 ? 'text-purple-600' : 'text-slate-400 line-through'}`}>
              Quarterly Assessment: {classRecord.weights.qa}%
              {classRecord.weights.qa === 0 && (
                <span className="ml-1 text-xs text-slate-400">(Skills-Based)</span>
              )}
            </span>
          </div>
          <button
            onClick={recomputeAllGrades}
            className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
          >
            Recompute All Grades
          </button>
        </div>
      </div>

      {/* Main Grade Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <div className="flex min-w-max">
            {/* Student Names Column (Fixed) */}
            <div className="flex-shrink-0 bg-white z-30 border-r border-slate-200 sticky left-0 shadow-md">
              {/* Header - matches component header height */}
              <div className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-tl-lg h-[42px] flex items-center sticky top-0 z-40">
                Learner's Name
              </div>
              {/* Sub-header row - matches activity header row */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-1 h-[42px] flex items-center sticky top-[42px] z-40">
                <span className="text-xs font-medium text-slate-600">#</span>
                <span className="text-xs font-medium text-slate-600 ml-4">Name (Last, First)</span>
              </div>
              {/* Student rows */}
              <div>
                {uniqueStudents.map((student, index) => (
                  <div 
                    key={student.studentId} 
                    className="flex items-center px-4 py-1 border-b border-slate-100 hover:bg-slate-50 h-[33px] bg-white"
                  >
                    <span className="text-xs text-slate-500 w-6">{index + 1}</span>
                    <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                      {student.studentName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Written Work Section - Hidden if weight = 0% */}
            {classRecord.weights.ww > 0 && (
              <ComponentSection
                type="WW"
                label="Written Work"
                activities={classRecord.activities.ww}
                weight={classRecord.weights.ww}
                students={uniqueStudents}
                onAddActivity={(actNum) => activityModal.openCreate('WW', actNum)}
                onEditActivity={activityModal.openEdit}
                onSaveScore={handleSaveScore}
                colorClass="bg-blue-600"
              />
            )}

            {/* Performance Task Section - Hidden if weight = 0% */}
            {classRecord.weights.pt > 0 && (
              <ComponentSection
                type="PT"
                label="Performance Task"
                activities={classRecord.activities.pt}
                weight={classRecord.weights.pt}
                students={uniqueStudents}
                onAddActivity={(actNum) => activityModal.openCreate('PT', actNum)}
                onEditActivity={activityModal.openEdit}
                onSaveScore={handleSaveScore}
                colorClass="bg-green-600"
              />
            )}

            {/* Quarterly Assessment Section - Hidden if weight = 0% (Skills-Based subjects) */}
            {classRecord.weights.qa > 0 && (
              <ComponentSection
                type="QA"
                label="Quarterly Assessment"
                activities={classRecord.activities.qa}
                weight={classRecord.weights.qa}
                students={uniqueStudents}
                onAddActivity={(actNum) => activityModal.openCreate('QA', actNum)}
                onEditActivity={activityModal.openEdit}
                onSaveScore={handleSaveScore}
                colorClass="bg-purple-600"
              />
            )}

            {/* Final Grade Column */}
            <div className="flex-shrink-0">
              <div className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-tr-lg h-[42px] flex items-center sticky top-0 z-20">
                Quarterly Grade
              </div>
              <table className="border-collapse">
                <thead className="sticky top-[42px] z-20">
                  <tr className="bg-slate-100 h-[42px]">
                    <th className="px-4 text-xs font-medium text-slate-700 border-b border-slate-200">
                      Grade
                    </th>
                    <th className="px-4 text-xs font-medium text-slate-700 border-b border-slate-200">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueStudents.map((student) => {
                    const isPassing = student.quarterlyGrade >= 75;
                    
                    return (
                      <tr key={student.studentId} className="hover:bg-slate-50 h-[33px]">
                        <td className={`px-4 text-center text-sm font-bold border-b border-slate-100 ${
                          student.quarterlyGrade >= 90 ? 'text-green-600' :
                          student.quarterlyGrade >= 80 ? 'text-blue-600' :
                          student.quarterlyGrade >= 75 ? 'text-slate-700' :
                          student.quarterlyGrade > 0 ? 'text-red-600' :
                          'text-slate-400'
                        }`}>
                          {student.quarterlyGrade > 0 ? student.quarterlyGrade : '-'}
                        </td>
                        <td className="px-4 text-center border-b border-slate-100">
                          {student.quarterlyGrade > 0 && (
                            <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                              isPassing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isPassing ? 'Passed' : 'Failed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={activityModal.isOpen}
        isEditing={activityModal.isEditing}
        activityType={activityModal.activityType}
        activity={activityModal.editingActivity}
        nextNumber={activityModal.presetActivityNumber ?? nextActivityNumbers[activityModal.activityType]}
        onClose={activityModal.close}
        onCreate={handleCreateActivity}
        onUpdate={handleUpdateActivity}
        onDelete={handleDeleteActivity}
      />

      {/* Instructions */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <h4 className="font-semibold text-slate-700 mb-2">💡 Quick Tips</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Click on a score cell to enter or edit a score</li>
          <li>Click on an activity header to edit or delete it</li>
          <li>Click the + button to add a new activity</li>
          <li>Grades are automatically computed using DepEd transmutation</li>
          <li>PS = Percentage Score, WS = Weighted Score</li>
        </ul>
      </div>
    </div>
  );
};

export default ClassRecordView;
