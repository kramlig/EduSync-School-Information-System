/**
 * PersonalStudentListWrapper — Wraps institutional StudentList for personal workspace.
 *
 * StudentList internally uses its own PostgreSQL hooks (useStudentsPostgreSQL,
 * useSectionsPostgreSQL, etc.) keyed by authUser.schoolId. This wrapper just
 * provides the minimal schoolData stub and a synthetic AuthUser session so
 * StudentList can drive its own queries.
 */

import React, { useCallback, useMemo } from 'react';
import StudentList from '../../../components/StudentList';
import { useSchoolSettingsPostgreSQL } from '../../hooks/useSchoolSettingsPostgreSQL';
import { supabase } from '../../lib/supabase';
import type { Student, AuthUser, SchoolSettings } from '../../../types';
import type { SchoolDataState } from '../../../hooks/useSchoolData';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
  userName: string;
}

const FALLBACK_SETTINGS: SchoolSettings = {
  schoolName: 'My School',
  region: '',
  division: '',
  district: '',
  schoolYear: '2024-2025',
};

const PersonalStudentListWrapper: React.FC<Props> = ({
  schoolId,
  teacherId,
  tier: _tier,
  userName,
}) => {
  const { settings: realSettings } = useSchoolSettingsPostgreSQL({ schoolId });
  const settings = realSettings || FALLBACK_SETTINGS;

  // addStudent: insert into Supabase students table
  const addStudent = useCallback(
    async (
      student: Omit<Student, 'id' | 'enrollmentDate'>
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        // Parse name into first/last if not explicitly provided
        let firstName = student.firstName || '';
        let lastName = student.lastName || '';
        const fullName = student.name || '';
        if (!firstName && !lastName && fullName) {
          const parts = fullName.trim().split(/\s+/);
          if (parts.length === 1) {
            firstName = parts[0];
          } else {
            lastName = parts[parts.length - 1];
            firstName = parts.slice(0, -1).join(' ');
          }
        }
        const { error } = await supabase.from('students').insert({
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          middle_name: student.middleName || null,
          name: fullName || `${firstName} ${lastName}`.trim(),
          lrn: student.lrn || null,
          gender: student.sex || null,
          email: student.email || null,
          section_id: student.sectionId || null,
          grade_level: 6,
          enrollment_status: 'enrolled',
        });
        if (error) return { success: false, message: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, message: err?.message || 'Unknown error' };
      }
    },
    [schoolId]
  );

  // Stub schoolData — StudentList fetches its own data via PostgreSQL hooks
  const schoolData = useMemo(
    () =>
      ({
        students: [],
        learningAreas: [],
        grades: [],
        coreValues: [],
        coreValueGrades: [],
        attendanceRecords: [],
        teachers: [],
        parents: [],
        sections: [],
        settings,
        substituteAssignments: [],
        classSchedules: [],
        assignments: [],
        studentAssignmentGrades: [],
        lessonPlans: [],
        announcements: [],
        monthlySchoolDaysConfig: {},
        loading: false,
        error: null,
        refresh: () => {},
        addStudent,
        updateStudent: () => {},
        deleteStudent: () => {},
        fetchMoreStudents: async () => {},
        hasMoreStudents: false,
        isFetchingStudents: false,
        searchStudents: async () => [] as Student[],
        isSearching: false,
      } satisfies SchoolDataState & {
        loading: boolean;
        error: string | null;
        refresh: () => void;
        addStudent: (s: Omit<Student, 'id' | 'enrollmentDate'>) => Promise<{ success: boolean; message?: string }>;
        updateStudent: (s: Student) => void;
        deleteStudent: (id: string) => void;
        fetchMoreStudents: () => Promise<void>;
        hasMoreStudents: boolean;
        isFetchingStudents: boolean;
        searchStudents: (q: string) => Promise<Student[]>;
        isSearching: boolean;
      }),
    [settings, addStudent]
  );

  // Synthetic AuthUser — role 'admin' gives full access inside StudentList
  const session = useMemo(
    () => ({
      user: {
        id: teacherId,
        schoolId,
        name: userName,
        email: '',
        role: 'admin' as const,
        assignments: [],
      } as AuthUser,
      type: 'staff' as const,
    }),
    [teacherId, schoolId, userName]
  );

  const pMaxStudents = _tier === 'free' ? 50 : 99999;

  return <StudentList schoolData={schoolData} session={session} isPersonalWorkspace={true} tier={_tier} maxStudents={pMaxStudents} />;
};

export default PersonalStudentListWrapper;
