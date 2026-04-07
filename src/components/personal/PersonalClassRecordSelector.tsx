/**
 * PersonalClassRecordSelector — Section & Subject picker for personal workspace.
 *
 * Reuses the same data model as institutional ClassRecordSelector but:
 * - Uses personal workspace schoolId (all sections belong to the owner)
 * - Shows entry mode toggle (ECR vs Quick Grade)
 * - Enforces tier limits (free = Quick Grade only, pro = ECR)
 * - Self-assigns teaching_assignments automatically
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  BoltIcon,
  TableCellsIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import UpgradeModal from './UpgradeModal';

interface Props {
  schoolId: string;
  teacherId: string;
  tier: string;
  schoolYear?: string;
}

interface SectionRow {
  id: string;
  name: string;
  grade_level: number;
  school_year: string;
  adviser_id: string | null;
}

interface LearningAreaRow {
  id: string;
  code: string;
  name: string;
  grade_levels: number[] | null;
  is_active: boolean;
  display_order: number;
}

type EntryMode = 'ecr' | 'quick';

export default function PersonalClassRecordSelector({ schoolId, teacherId, tier }: Props) {
  const navigate = useNavigate();
  const isProOrSchool = tier === 'pro' || tier === 'school';

  const [sections, setSections] = useState<SectionRow[]>([]);
  const [learningAreas, setLearningAreas] = useState<LearningAreaRow[]>([]);
  const [assignments, setAssignments] = useState<{ section_id: string; learning_area_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [entryMode, setEntryMode] = useState<EntryMode>(isProOrSchool ? 'ecr' : 'quick');
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Fetch sections and learning areas
  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);

    Promise.all([
      supabase
        .from('sections')
        .select('id, name, grade_level, school_year, adviser_id')
        .eq('school_id', schoolId)
        .is('deleted_at', null)
        .order('grade_level')
        .order('name'),
      supabase
        .from('learning_areas')
        .select('id, code, name, grade_levels, is_active, display_order')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('display_order')
        .order('name'),
      supabase
        .from('teaching_assignments')
        .select('section_id, learning_area_id')
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .eq('is_advisory', false),
    ]).then(([secRes, laRes, taRes]) => {
      setSections(secRes.data || []);
      setLearningAreas(laRes.data || []);
      setAssignments(taRes.data || []);
      setLoading(false);
    });
  }, [schoolId]);

  // Filter learning areas by teaching_assignments for the selected section
  const filteredLearningAreas = useMemo(() => {
    if (!selectedSection) return [];
    // Get learning_area_ids assigned to teacher for this section
    const assignedIds = new Set(
      assignments
        .filter(a => a.section_id === selectedSection && a.learning_area_id)
        .map(a => a.learning_area_id)
    );
    if (assignedIds.size === 0) {
      // Fallback: no assignments found — filter by grade level
      const section = sections.find(s => s.id === selectedSection);
      if (!section) return learningAreas;
      return learningAreas.filter(la =>
        la.grade_levels && la.grade_levels.includes(section.grade_level)
      );
    }
    return learningAreas.filter(la => assignedIds.has(la.id));
  }, [selectedSection, sections, learningAreas, assignments]);

  // Navigate to the selected mode
  const handleOpen = useCallback(() => {
    if (!selectedSection || !selectedSubject) return;

    if (entryMode === 'ecr') {
      navigate(`/personal/class-record/${selectedSection}/${selectedSubject}`);
    } else {
      // Quick Grade mode — go to gradebook with pre-selected subject/section
      navigate(`/personal/grades/quick?section=${selectedSection}&subject=${selectedSubject}`);
    }
  }, [selectedSection, selectedSubject, entryMode, navigate]);

  const selectedSectionData = sections.find(s => s.id === selectedSection);
  const isAdviser = selectedSectionData?.adviser_id === teacherId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading sections and subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          <AcademicCapIcon className="inline w-8 h-8 mr-2 text-indigo-500" />
          Grade Entry
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Select a section and subject, then choose your preferred entry mode
        </p>
      </div>

      {/* Entry Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Entry Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ECR Mode */}
          <button
            onClick={() => {
              if (isProOrSchool) {
                setEntryMode('ecr');
              } else {
                setShowUpgrade(true);
              }
            }}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              entryMode === 'ecr'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-md'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            {!isProOrSchool && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <LockClosedIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Pro</span>
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${entryMode === 'ecr' ? 'bg-rose-100 dark:bg-rose-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <TableCellsIcon className={`w-6 h-6 ${entryMode === 'ecr' ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <div>
                <h3 className={`font-bold ${entryMode === 'ecr' ? 'text-rose-800 dark:text-rose-200' : 'text-slate-700 dark:text-slate-300'}`}>
                  Electronic Class Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">DepEd-compliant (DO 8 s. 2015)</p>
              </div>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-1">
              <li>• Enter WW, PT, QA scores individually</li>
              <li>• Auto-computes quarterly grades via transmutation</li>
              <li>• Full audit trail of component scores</li>
              <li>• Export to CSV/PDF (Division format)</li>
            </ul>
          </button>

          {/* Quick Grade Mode */}
          <button
            onClick={() => setEntryMode('quick')}
            className={`relative p-5 rounded-xl border-2 text-left transition-all ${
              entryMode === 'quick'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${entryMode === 'quick' ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <BoltIcon className={`w-6 h-6 ${entryMode === 'quick' ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
              </div>
              <div>
                <h3 className={`font-bold ${entryMode === 'quick' ? 'text-indigo-800 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                  Quick Grade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Direct quarterly input</p>
              </div>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-1">
              <li>• Enter Q1–Q4 grades directly</li>
              <li>• Auto-calculates final grade & remarks</li>
              <li>• Best when you already have computed grades</li>
              <li>• Available on all tiers</li>
            </ul>
          </button>
        </div>
      </div>

      {/* Section + Subject Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedSubject('');
              }}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              <option value="">Choose a section...</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>
                  Grade {section.grade_level} - {section.name}
                  {section.adviser_id === teacherId ? ' (Adviser)' : ''}
                </option>
              ))}
            </select>
            {sections.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                No sections yet. Add a section in Settings first.
              </p>
            )}
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedSection}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedSection ? 'Choose a subject...' : 'Select section first'}
              </option>
              {filteredLearningAreas.map(la => (
                <option key={la.id} value={la.id}>
                  {la.name} ({la.code})
                </option>
              ))}
            </select>
            {selectedSection && filteredLearningAreas.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                No subjects found for this grade level. Add learning areas in Settings.
              </p>
            )}
          </div>
        </div>

        {/* Advisory badge */}
        {selectedSection && isAdviser && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <ClipboardDocumentListIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
              You are the adviser for this section — Core Values and Attendance are available
            </span>
          </div>
        )}

        {/* Open Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleOpen}
            disabled={!selectedSection || !selectedSubject}
            className={`px-6 py-3 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white ${
              entryMode === 'ecr'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
            }`}
          >
            {entryMode === 'ecr' ? 'Open Class Record' : 'Open Quick Grade'} →
          </button>
        </div>
      </div>

      {/* Quick Access Cards */}
      {sections.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Your Sections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map(section => (
              <div
                key={section.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedSection(section.id);
                  setSelectedSubject('');
                }}
              >
                <div className="font-medium text-slate-800 dark:text-white">
                  {section.name}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  Grade {section.grade_level}
                  {section.adviser_id === teacherId && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                      Adviser
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ECR Info (when ECR mode selected) */}
      {entryMode === 'ecr' && isProOrSchool && (
        <div className="mt-6 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 rounded-xl p-6 border border-rose-100 dark:border-rose-800">
          <h3 className="font-semibold text-rose-800 dark:text-rose-200 mb-3">
            About Electronic Class Record
          </h3>
          <ul className="space-y-2 text-sm text-rose-700 dark:text-rose-300">
            <li>• Enter individual scores for Written Works (WW), Performance Tasks (PT), and Quarterly Assessments (QA)</li>
            <li>• Grades are automatically computed using DepEd's official transmutation formula</li>
            <li>• Default weights: WW 30%, PT 50%, QA 20%</li>
            <li>• Quarterly grades sync to SF10 and SF9 automatically</li>
          </ul>
        </div>
      )}

      {/* Upgrade prompt for free tier */}
      {!isProOrSchool && (
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Unlock Electronic Class Record
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Upgrade to Pro to use the full ECR with WW/PT/QA component entry, DepEd transmutation, and export capabilities.
                Quick Grade is available on all tiers.
              </p>
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
    </div>
  );
}
