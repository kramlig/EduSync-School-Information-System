/**
 * PersonalSections — Section management for personal workspace.
 *
 * Lets a teacher create sections, choose whether they are the adviser,
 * and pick which subjects they teach in each section.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
}

interface SectionRow {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  studentCount: number;
  subjectCount: number;
  isAdviser: boolean;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

const TIER_LIMITS: Record<string, { sections: number; advisory: number }> = {
  free: { sections: 1, advisory: 1 },
  pro: { sections: Infinity, advisory: 2 },
  school: { sections: Infinity, advisory: Infinity },
};

function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
}

const PersonalSections: React.FC<Props> = ({ schoolId, teacherId, tier }) => {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [editSection, setEditSection] = useState<SectionRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState(7);
  const [editIsAdviser, setEditIsAdviser] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  const advisorySections = sections.filter(s => s.isAdviser).length;
  const atSectionLimit = sections.length >= limits.sections;
  const atAdvisoryLimit = advisorySections >= limits.advisory;

  // Form state
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(7);
  const [schoolYear] = useState(getCurrentSchoolYear());
  const [isAdviser, setIsAdviser] = useState(true);

  // Subject picker state
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Fetch available subjects when grade level changes
  const fetchSubjectsForGrade = useCallback(async (gl: number) => {
    setLoadingSubjects(true);
    const { data } = await supabase
      .from('learning_areas')
      .select('id, name, code')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .contains('grade_levels', [gl])
      .order('display_order');

    const subjects: SubjectOption[] = (data || []).map((la: any) => ({
      id: la.id,
      name: la.name,
      code: la.code,
    }));
    setAvailableSubjects(subjects);
    // Select all by default
    setSelectedSubjectIds(new Set(subjects.map(s => s.id)));
    setLoadingSubjects(false);
  }, [schoolId]);

  // Load subjects when form opens or grade changes
  useEffect(() => {
    if (showForm) {
      fetchSubjectsForGrade(gradeLevel);
    }
  }, [showForm, gradeLevel, fetchSubjectsForGrade]);

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedSubjectIds(new Set(availableSubjects.map(s => s.id)));
  const selectNone = () => setSelectedSubjectIds(new Set());

  const fetchSections = useCallback(async () => {
    setLoading(true);
    const { data: secData, error: secErr } = await supabase
      .from('sections')
      .select('id, name, grade_level, school_year, adviser_id')
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('grade_level')
      .order('name');

    if (secErr || !secData) {
      setLoading(false);
      return;
    }

    const sectionIds = secData.map((s: any) => s.id);

    const [studentsRes, assignmentsRes] = await Promise.all([
      supabase
        .from('students')
        .select('section_id')
        .in('section_id', sectionIds.length ? sectionIds : ['__none__'])
        .eq('school_id', schoolId),
      supabase
        .from('teaching_assignments')
        .select('section_id')
        .in('section_id', sectionIds.length ? sectionIds : ['__none__'])
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .eq('is_advisory', false),
    ]);

    const studentCounts: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};
    (studentsRes.data || []).forEach((r: any) => {
      studentCounts[r.section_id] = (studentCounts[r.section_id] || 0) + 1;
    });
    (assignmentsRes.data || []).forEach((r: any) => {
      subjectCounts[r.section_id] = (subjectCounts[r.section_id] || 0) + 1;
    });

    setSections(
      secData.map((s: any) => ({
        id: s.id,
        name: s.name,
        gradeLevel: s.grade_level,
        schoolYear: s.school_year,
        studentCount: studentCounts[s.id] || 0,
        subjectCount: subjectCounts[s.id] || 0,
        isAdviser: s.adviser_id === teacherId,
      }))
    );
    setLoading(false);
  }, [schoolId, teacherId]);

  useEffect(() => {
    if (schoolId) fetchSections();
  }, [schoolId, fetchSections]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selectedSubjectIds.size === 0) {
      setError('Select at least one subject.');
      return;
    }

    if (atSectionLimit) {
      setError(
        tier === 'free'
          ? 'Free tier allows 1 section. Upgrade to Pro for unlimited.'
          : `You've reached the section limit for your ${tier} plan.`
      );
      return;
    }
    if (isAdviser && atAdvisoryLimit) {
      setError(
        tier === 'free'
          ? 'Free tier allows 1 advisory section. Upgrade to Pro for more.'
          : tier === 'pro'
            ? 'Pro tier allows up to 2 advisory sections. Upgrade to School for unlimited.'
            : `You've reached the advisory limit for your plan.`
      );
      return;
    }

    setError('');
    setSaving(true);

    try {
      // 1. Create section
      const { data: newSec, error: insertErr } = await supabase
        .from('sections')
        .insert({
          school_id: schoolId,
          name: trimmed,
          grade_level: gradeLevel,
          school_year: schoolYear,
          adviser_id: isAdviser ? teacherId : null,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Build teaching assignment rows for selected subjects
      const selectedSubjects = availableSubjects.filter(s => selectedSubjectIds.has(s.id));
      const assignmentRows = selectedSubjects.map(subj => ({
        school_id: schoolId,
        teacher_id: teacherId,
        section_id: newSec.id,
        learning_area_id: subj.id,
        subject: subj.name,
        grade_level: gradeLevel,
        is_advisory: false,
        is_active: true,
        school_year: schoolYear,
      }));

      // Add advisory row if adviser
      if (isAdviser) {
        assignmentRows.push({
          school_id: schoolId,
          teacher_id: teacherId,
          section_id: newSec.id,
          learning_area_id: null as any,
          subject: 'Advisory',
          grade_level: gradeLevel,
          is_advisory: true,
          is_active: true,
          school_year: schoolYear,
        });
      }

      const { error: assignErr } = await supabase
        .from('teaching_assignments')
        .insert(assignmentRows);

      if (assignErr) throw assignErr;

      console.log(`[PersonalSections] Created "${trimmed}" — ${selectedSubjects.length} subject(s), adviser: ${isAdviser}`);

      setName('');
      setShowForm(false);
      setIsAdviser(true);
      fetchSections();
    } catch (err: any) {
      setError(err?.message || 'Failed to create section');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (sec: SectionRow) => {
    setEditSection(sec);
    setEditName(sec.name);
    setEditGradeLevel(sec.gradeLevel);
    setEditIsAdviser(sec.isAdviser);
    setError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSection) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    // Advisory limit check: adding adviser on a non-adviser section
    if (editIsAdviser && !editSection.isAdviser && atAdvisoryLimit) {
      setError(
        tier === 'free'
          ? 'Free tier allows 1 advisory section. Remove adviser from another section first.'
          : tier === 'pro'
            ? 'Pro tier allows 2 advisory sections. Remove adviser from another section first.'
            : 'Advisory limit reached.'
      );
      return;
    }

    setError('');
    setEditSaving(true);

    try {
      // Update section record
      const { error: updateErr } = await supabase
        .from('sections')
        .update({
          name: trimmed,
          grade_level: editGradeLevel,
          adviser_id: editIsAdviser ? teacherId : null,
        })
        .eq('id', editSection.id);

      if (updateErr) throw updateErr;

      // Handle advisory teaching_assignment row
      if (editIsAdviser && !editSection.isAdviser) {
        // Becoming adviser — upsert advisory assignment
        await supabase.from('teaching_assignments').upsert({
          school_id: schoolId,
          teacher_id: teacherId,
          section_id: editSection.id,
          subject: 'Advisory',
          grade_level: editGradeLevel,
          is_advisory: true,
          is_active: true,
          school_year: editSection.schoolYear,
        }, { onConflict: 'school_id,teacher_id,section_id,subject' });
      } else if (!editIsAdviser && editSection.isAdviser) {
        // Removing adviser — deactivate advisory assignment
        await supabase
          .from('teaching_assignments')
          .update({ is_active: false })
          .eq('section_id', editSection.id)
          .eq('teacher_id', teacherId)
          .eq('is_advisory', true);
      }

      setEditSection(null);
      fetchSections();
    } catch (err: any) {
      setError(err?.message || 'Failed to update section');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (sec: SectionRow) => {
    if (sec.studentCount > 0) {
      setError(`Cannot delete "${sec.name}" — it has ${sec.studentCount} enrolled student(s). Remove them first.`);
      return;
    }
    if (!confirm(`Delete "${sec.name}"? This will also remove its teaching assignments.`)) return;

    setError('');
    const { error: delErr } = await supabase
      .from('sections')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sec.id);

    if (delErr) {
      setError(delErr.message);
      return;
    }

    await supabase
      .from('teaching_assignments')
      .update({ is_active: false })
      .eq('section_id', sec.id);

    fetchSections();
  };

  const inputClass =
    'block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white';

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
            My Sections
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {sections.length}{limits.sections !== Infinity ? ` / ${limits.sections}` : ''} section{sections.length !== 1 ? 's' : ''}
            {limits.advisory !== Infinity && (
              <span className="ml-2">
                · {advisorySections} / {limits.advisory} advisory
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          disabled={atSectionLimit}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Add Section Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
            New Section
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Grade Level
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(Number(e.target.value))}
                  className={inputClass}
                >
                  {GRADE_LEVELS.map((gl) => (
                    <option key={gl} value={gl}>
                      Grade {gl}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Section A, Rizal, Faith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Adviser toggle */}
            <div>
              <label className={`flex items-center gap-2 ${atAdvisoryLimit && !isAdviser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={isAdviser}
                  onChange={(e) => {
                    if (e.target.checked && atAdvisoryLimit) {
                      setError(
                        tier === 'pro'
                          ? 'Pro tier allows up to 2 advisory sections. Upgrade to School for unlimited.'
                          : `Advisory limit reached for ${tier} tier.`
                      );
                      return;
                    }
                    setError('');
                    setIsAdviser(e.target.checked);
                  }}
                  disabled={atAdvisoryLimit && !isAdviser}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  I'm the adviser of this section
                </span>
              </label>
              {atAdvisoryLimit && !isAdviser && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
                  Advisory limit reached ({advisorySections}/{limits.advisory}).
                  {tier !== 'school' && ' Upgrade for more.'}
                </p>
              )}
            </div>

            {/* Subject picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Subjects I teach in this section
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    Select all
                  </button>
                  <span className="text-xs text-slate-300">|</span>
                  <button type="button" onClick={selectNone} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    None
                  </button>
                </div>
              </div>
              {loadingSubjects ? (
                <div className="text-xs text-slate-400 py-2">Loading subjects...</div>
              ) : availableSubjects.length === 0 ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 py-2">
                  No subjects found for Grade {gradeLevel}. Add learning areas in school settings first.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {availableSubjects.map(subj => (
                    <label
                      key={subj.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                        selectedSubjectIds.has(subj.id)
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.has(subj.id)}
                        onChange={() => toggleSubject(subj.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="truncate">{subj.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                {selectedSubjectIds.size} of {availableSubjects.length} subject{availableSubjects.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving || selectedSubjectIds.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Section'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading sections...</div>
      ) : sections.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <AcademicCapIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No sections yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Create your first section to start entering grades.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  G{sec.gradeLevel}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                    Grade {sec.gradeLevel} - {sec.name}
                    {sec.isAdviser && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                        ADVISER
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <UserGroupIcon className="w-3.5 h-3.5" />
                      {sec.studentCount} student{sec.studentCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <BookOpenIcon className="w-3.5 h-3.5" />
                      {sec.subjectCount} subject{sec.subjectCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      SY {sec.schoolYear}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditClick(sec)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Edit section"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sec)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete section"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Section Modal */}
      {editSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Section</h2>
              <button
                onClick={() => setEditSection(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Grade Level</label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(Number(e.target.value))}
                    className={inputClass}
                  >
                    {GRADE_LEVELS.map((gl) => (
                      <option key={gl} value={gl}>Grade {gl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Section Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsAdviser}
                  onChange={(e) => {
                    if (e.target.checked && !editSection.isAdviser && atAdvisoryLimit) {
                      setError('Advisory limit reached. Remove adviser from another section first.');
                      return;
                    }
                    setError('');
                    setEditIsAdviser(e.target.checked);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">I'm the adviser of this section</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditSection(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">How it works</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
          <li>Create a section and pick only the subjects you teach</li>
          <li>Check "I'm the adviser" if you handle the section's advisory class</li>
          <li>You can teach Math in Section A and English in Section B — any combo is fine</li>
          <li>Go to <strong>Grade Entry</strong> to select any section + subject to grade</li>
        </ul>
      </div>
    </div>
  );
};

export default PersonalSections;
