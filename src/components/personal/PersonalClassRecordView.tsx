/**
 * PersonalClassRecordView — Wrapper that mounts the institutional ClassRecordView
 * within the personal workspace context.
 *
 * Reads sectionId and learningAreaId from URL params, then fetches the
 * personal workspace's school metadata to pass as props.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import ClassRecordView from '../../../components/ClassRecordView';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
}

interface SchoolMeta {
  name: string;
  school_id_number: string | null;
  region: string | null;
  division: string | null;
  district: string | null;
  current_school_year: string;
}

function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

export default function PersonalClassRecordView({ schoolId, teacherId, tier: _tier }: Props) {
  const { sectionId, learningAreaId } = useParams<{ sectionId: string; learningAreaId: string }>();
  const navigate = useNavigate();

  const [schoolMeta, setSchoolMeta] = useState<SchoolMeta | null>(null);
  const [sectionGradeLevel, setSectionGradeLevel] = useState<number | undefined>();
  const [learningAreaCode, setLearningAreaCode] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !sectionId || !learningAreaId) return;

    Promise.all([
      supabase.from('schools').select('name, school_id_number, region, division, district, current_school_year')
        .eq('id', schoolId).single(),
      supabase.from('sections').select('grade_level').eq('id', sectionId).single(),
      supabase.from('learning_areas').select('code').eq('id', learningAreaId).single(),
    ]).then(([schoolRes, sectionRes, laRes]) => {
      if (schoolRes.data) setSchoolMeta(schoolRes.data);
      if (sectionRes.data) setSectionGradeLevel(sectionRes.data.grade_level);
      if (laRes.data) setLearningAreaCode(laRes.data.code);
      setLoading(false);
    });
  }, [schoolId, sectionId, learningAreaId]);

  const schoolYear = useMemo(
    () => schoolMeta?.current_school_year || getCurrentSchoolYear(),
    [schoolMeta]
  );

  if (!sectionId || !learningAreaId) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Missing section or subject. Please go back and select again.</p>
        <button onClick={() => navigate('/personal/grades')} className="mt-4 text-indigo-600 hover:underline">
          ← Back to Grade Entry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading class record...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
        <button
          onClick={() => navigate('/personal/grades')}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 font-medium hover:underline transition-colors"
        >
          Grade Entry
        </button>
        <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">
          Class Record{learningAreaCode ? ` — ${learningAreaCode}` : ''}
        </span>
      </nav>

      {/* Mount the institutional ClassRecordView with personal workspace props */}
      <ClassRecordView
        sectionId={sectionId}
        learningAreaId={learningAreaId}
        schoolYear={schoolYear}
        teacherId={teacherId}
        schoolId={schoolId}
        schoolName={schoolMeta?.name}
        schoolIdNumber={schoolMeta?.school_id_number || undefined}
        region={schoolMeta?.region || undefined}
        division={schoolMeta?.division || undefined}
        district={schoolMeta?.district || undefined}
        gradeLevel={sectionGradeLevel}
        learningAreaCode={learningAreaCode}
      />
    </div>
  );
}
