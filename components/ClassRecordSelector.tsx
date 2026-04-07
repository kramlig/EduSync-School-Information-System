/**
 * ClassRecordSelector - Section/Subject Selection for ECR
 * 
 * This component allows teachers to select a section and subject
 * before opening the Electronic Class Record for score entry.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSectionsPostgreSQL } from '../src/hooks/useSectionsPostgreSQL';
import { useLearningAreasPostgreSQL } from '../src/hooks/useLearningAreasPostgreSQL';
import type { AuthUser } from '../types';

interface ClassRecordSelectorProps {
  session: { user: AuthUser; type: 'staff' };
  schoolYear: string;
}

const ClassRecordSelector: React.FC<ClassRecordSelectorProps> = ({ session, schoolYear }) => {
  const navigate = useNavigate();
  const authUser = session.user;
  const schoolId = authUser.schoolId || '';
  const teacherId = (authUser as any).postgresqlId || authUser.id;

  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Load sections and learning areas
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ 
    schoolId, 
    schoolYear 
  });
  
  const { learningAreas, loading: areasLoading } = useLearningAreasPostgreSQL({ 
    schoolId 
  });

  // Filter sections for teacher (adviser or assigned via schedules)
  const teacherSections = useMemo(() => {
    if (['admin', 'principal', 'registrar'].includes(authUser.role)) {
      return sections;
    }
    
    // For teachers, show sections they advise or are assigned to
    return sections.filter(s => 
      s.adviserId === teacherId || 
      s.teacherIds?.includes(teacherId)
    );
  }, [sections, authUser.role, teacherId]);

  // Filter learning areas by selected section's grade level
  const filteredLearningAreas = useMemo(() => {
    if (!selectedSection) return [];
    
    const section = sections.find(s => s.id === selectedSection);
    if (!section) return learningAreas;
    
    // Debug logging
    console.log('[ClassRecordSelector] Filtering learning areas:', {
      sectionGradeLevel: section.gradeLevel,
      totalLearningAreas: learningAreas.length,
      learningAreaSample: learningAreas.slice(0, 3).map(la => ({
        name: la.name,
        gradeLevel: la.gradeLevel
      }))
    });
    
    // If no learning areas have grade levels defined, show all
    const areasWithGrades = learningAreas.filter(la => la.gradeLevel && la.gradeLevel.length > 0);
    if (areasWithGrades.length === 0) {
      console.log('[ClassRecordSelector] No grade levels defined, showing all learning areas');
      return learningAreas;
    }
    
    return learningAreas
      .filter(la => la.isActive !== false) // Exclude deactivated subjects (e.g., MTB after MATATAG)
      .filter(la => {
      // gradeLevel is an array in LearningArea type
      if (Array.isArray(la.gradeLevel)) {
        const sectionGrade = typeof section.gradeLevel === 'number' 
          ? section.gradeLevel 
          : parseInt(String(section.gradeLevel));
        return la.gradeLevel.includes(sectionGrade);
      }
      // Fallback for legacy data where gradeLevel might be a single value
      if (typeof la.gradeLevel === 'number') {
        const sectionGrade = typeof section.gradeLevel === 'number' 
          ? section.gradeLevel 
          : parseInt(String(section.gradeLevel));
        return la.gradeLevel === sectionGrade;
      }
      // If no grade level specified, include it (universal subject)
      return true;
    });
  }, [selectedSection, sections, learningAreas]);

  const handleOpenClassRecord = () => {
    if (selectedSection && selectedSubject) {
      navigate(`/grades/class-record/${selectedSection}/${selectedSubject}`);
    }
  };

  const loading = sectionsLoading || areasLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading sections and subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/grades')}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center"
        >
          ← Back to Grade Entry
        </button>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          📋 Electronic Class Record
        </h1>
        <p className="text-slate-600">
          Select a section and subject to open the class record for score entry
        </p>
      </div>

      {/* Selection Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedSubject(''); // Reset subject when section changes
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            >
              <option value="">Choose a section...</option>
              {teacherSections.map(section => (
                <option key={section.id} value={section.id}>
                  Grade {section.gradeLevel} - {section.name}
                  {section.adviserId === teacherId ? ' (Adviser)' : ''}
                </option>
              ))}
            </select>
            {teacherSections.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No sections assigned. Contact your administrator.
              </p>
            )}
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedSection}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedSection ? 'Choose a subject...' : 'Select section first'}
              </option>
              {filteredLearningAreas.map(la => (
                <option key={la.id} value={la.id}>
                  {la.name}
                </option>
              ))}
            </select>
            {selectedSection && filteredLearningAreas.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No subjects found for this grade level.
              </p>
            )}
          </div>
        </div>

        {/* Open Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleOpenClassRecord}
            disabled={!selectedSection || !selectedSubject}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            Open Class Record →
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-100">
        <h3 className="font-semibold text-rose-800 mb-3">
          📖 About Electronic Class Record
        </h3>
        <ul className="space-y-2 text-sm text-rose-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Enter individual scores for Written Works (WW), Performance Tasks (PT), and Quarterly Assessments (QA)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Grades are automatically computed using DepEd's official transmutation formula</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Default component weights: WW 30%, PT 50%, QA 20%</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Quarterly grades sync to SF10 and SF9 automatically</span>
          </li>
        </ul>
      </div>

      {/* Quick Access - Recent Records */}
      {teacherSections.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Quick Access - Your Sections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherSections.slice(0, 6).map(section => (
              <div
                key={section.id}
                className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedSection(section.id)}
              >
                <div className="font-medium text-slate-800">
                  {section.name}
                </div>
                <div className="text-sm text-slate-500">
                  Grade {section.gradeLevel}
                  {section.adviserId === teacherId && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                      Adviser
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassRecordSelector;
