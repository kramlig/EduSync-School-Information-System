import React from 'react';
import { useTeachingAssignments } from '../hooks/useTeachingAssignments';

interface TeacherAssignmentsBadgeProps {
  teacherId: string;
  maxDisplay?: number;
}

/**
 * Display teacher assignments as badges
 * Shows section adviser and subject teacher assignments from teaching_assignments table
 */
export const TeacherAssignmentsBadge: React.FC<TeacherAssignmentsBadgeProps> = ({
  teacherId,
  maxDisplay = 3
}) => {
  const { assignments, loading } = useTeachingAssignments(teacherId);

  if (loading) {
    return (
      <div className="flex gap-1">
        <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <span className="text-sm text-gray-400 italic">No assignments</span>
    );
  }

  const displayAssignments = assignments.slice(0, maxDisplay);
  const remainingCount = assignments.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayAssignments.map((assignment) => {
        if (assignment.is_advisory) {
          // Section Adviser Badge (purple)
          return (
            <span
              key={assignment.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
              title={`Section Adviser: Grade ${assignment.grade_level} ${assignment.section?.name || ''}`}
            >
              📚 Adviser: {assignment.section?.name || `Gr.${assignment.grade_level}`}
            </span>
          );
        } else {
          // Subject Teacher Badge (indigo)
          const subjectName = assignment.learning_area?.name || assignment.subject;
          return (
            <span
              key={assignment.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
              title={`Teaching: Grade ${assignment.grade_level} ${subjectName} (${assignment.hours_per_week}h/week)`}
            >
              Gr.{assignment.grade_level} {subjectName}
            </span>
          );
        }
      })}
      
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};
