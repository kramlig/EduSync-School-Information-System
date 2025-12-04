/**
 * SF5-K Dashboard - Kindergarten Proficiency Report
 * DepEd Form SF5-K for Kindergarten students
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  FunnelIcon, 
  StarIcon,
  ChevronRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../../src/hooks/useSchoolDataPostgreSQL';
import { useSectionsPostgreSQL } from '../../../src/hooks/useSectionsPostgreSQL';
import type {
  PromotionRecordWithStudent,
  PromotionRecordsFilter,
  ProficiencyLevel,
  GradingPeriod
} from '../../../src/types/promotionRecords';
import {
  getPromotionRecords,
  updatePromotionRecord
} from '../../../src/services/promotionRecordsService';
import { generateSF5KPDF } from '../../../src/utils/pdf/sf5kGenerator';
import type { AuthUser, StudentUser, ParentUser } from '../../../types';

interface SF5KDashboardProps {
  schoolYear: string;
  gradingPeriod: GradingPeriod;
  session?: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const proficiencyLevels: { value: ProficiencyLevel; label: string; color: string }[] = [
  { value: 'developing', label: 'Developing', color: 'bg-red-100 text-red-800' },
  { value: 'emerging', label: 'Emerging', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advancing', label: 'Advancing', color: 'bg-green-100 text-green-800' },
];

const SF5KDashboard: React.FC<SF5KDashboardProps> = ({ schoolYear, gradingPeriod, session }) => {
  const { schoolId } = useSchoolContext();
  const { settings } = useSchoolDataPostgreSQL({ schoolId: schoolId || null });
  const { sections, loading: sectionsLoading } = useSectionsPostgreSQL({ schoolId: schoolId || undefined });

  const [promotionRecords, setPromotionRecords] = useState<PromotionRecordWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Filters
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);

  // Memoize school ID to prevent unnecessary re-fetches
  const schoolIdMemo = useMemo(() => schoolId || '', [schoolId]);

  // Fetch promotion records for Kindergarten (grade level 0)
  useEffect(() => {
    if (!schoolIdMemo || sectionsLoading) return;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const filter: PromotionRecordsFilter = {
          school_id: schoolIdMemo,
          school_year: schoolYear,
          grading_period: gradingPeriod,
          grade_level: 0, // Kindergarten
          section_id: selectedSection,
        };

        const records = await getPromotionRecords(filter);
        setPromotionRecords(records);
      } catch (err) {
        console.error('Error fetching Kindergarten promotion records:', err);
        setError(err instanceof Error ? err.message : 'Failed to load records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [schoolIdMemo, schoolYear, gradingPeriod, selectedSection, sectionsLoading]);

  // Update proficiency level
  const handleUpdateProficiency = async (
    recordId: string,
    domain: 'socio_emotional_dev' | 'physical_motor_dev' | 'cognitive_dev' | 'language_literacy_dev',
    level: ProficiencyLevel
  ) => {
    try {
      const updates: any = {
        proficiency: {
          socio_emotional_dev: 'developing' as ProficiencyLevel,
          physical_motor_dev: 'developing' as ProficiencyLevel,
          cognitive_dev: 'developing' as ProficiencyLevel,
          language_literacy_dev: 'developing' as ProficiencyLevel,
        }
      };

      // Get current record to preserve other domains
      const currentRecord = promotionRecords.find(r => r.id === recordId);
      if (currentRecord) {
        updates.proficiency = {
          socio_emotional_dev: currentRecord.socio_emotional_dev || 'developing',
          physical_motor_dev: currentRecord.physical_motor_dev || 'developing',
          cognitive_dev: currentRecord.cognitive_dev || 'developing',
          language_literacy_dev: currentRecord.language_literacy_dev || 'developing',
        };
        updates.proficiency[domain] = level;
      }

      await updatePromotionRecord(recordId, updates);

      // Update local state
      setPromotionRecords(prev =>
        prev.map(r =>
          r.id === recordId
            ? { ...r, [domain]: level }
            : r
        )
      );

      setEditingRecord(null);
    } catch (err) {
      console.error('Error updating proficiency:', err);
      alert('Failed to update proficiency level');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    try {
      if (promotionRecords.length === 0) {
        alert('No records to export');
        return;
      }

      // Get selected section info if filtering by section
      const selectedSectionInfo = selectedSection
        ? kindergartenSections.find(s => s.id === selectedSection)
        : undefined;

      alert('Starting PDF generation...');

      await generateSF5KPDF({
        schoolInfo: {
          name: settings?.schoolName || 'School Name',
          schoolId: settings?.schoolIdNumber || schoolIdMemo,
          division: settings?.division || 'Division',
          region: settings?.region || 'Region',
          district: settings?.district || 'District',
        },
        schoolYear,
        section: selectedSectionInfo ? {
          name: selectedSectionInfo.name,
          grade_level: typeof selectedSectionInfo.gradeLevel === 'number' ? selectedSectionInfo.gradeLevel : parseInt(selectedSectionInfo.gradeLevel as string, 10)
        } : undefined,
        records: promotionRecords,
        preparedBy: session?.user.email || 'Unknown',
      });

      alert('PDF generated successfully! Check your downloads folder.');
    } catch (err) {
      const error = err as Error;
      alert(`Failed to generate PDF: ${error.message}\n\nStack: ${error.stack}`);
    }
  };

  // Filter Kindergarten sections
  const kindergartenSections = useMemo(() => {
    if (!sections) return [];
    return sections.filter((s: any) => s.grade_level === 0);
  }, [sections]);

  // Calculate stats per domain
  const domainStats = useMemo(() => {
    const domains = ['socio_emotional_dev', 'physical_motor_dev', 'cognitive_dev', 'language_literacy_dev'] as const;
    
    return domains.map(domain => {
      const counts = {
        developing: promotionRecords.filter(r => r[domain] === 'developing').length,
        emerging: promotionRecords.filter(r => r[domain] === 'emerging').length,
        advancing: promotionRecords.filter(r => r[domain] === 'advancing').length,
      };

      const total = counts.developing + counts.emerging + counts.advancing;
      
      return {
        domain,
        label: domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        counts,
        total,
        advancingPercentage: total > 0 ? ((counts.advancing / total) * 100).toFixed(1) : '0.0',
      };
    });
  }, [promotionRecords]);

  if (sectionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <a
                href="/reports/school-forms"
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
              >
                School Forms
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                SF5-K - Kindergarten Proficiency Report
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <StarIcon className="h-8 w-8 text-purple-600" />
              SF5-K - Kindergarten Proficiency Report
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Kindergarten Developmental Domains • {schoolYear} • {gradingPeriod.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={promotionRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards - Developmental Domains */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {domainStats.map(stat => (
          <div key={stat.domain} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">{stat.label}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Developing:</span>
                <span className="font-medium">{stat.counts.developing}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-yellow-600">Emerging:</span>
                <span className="font-medium">{stat.counts.emerging}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Advancing:</span>
                <span className="font-medium">{stat.counts.advancing}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Advancing Rate:</span>
                  <span className="font-bold text-green-600">{stat.advancingPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="kindergarten-section-filter">Section</label>
            <select
              id="kindergarten-section-filter"
              value={selectedSection || ''}
              onChange={(e) => setSelectedSection(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Kindergarten Sections</option>
              {kindergartenSections.map((section: any) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 w-full">
              <p className="text-xs text-purple-800">
                <strong>{promotionRecords.length}</strong> Kindergarten student(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Proficiency Records</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : promotionRecords.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">No Kindergarten students enrolled in selected section.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Student Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Socio-Emotional</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Physical-Motor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cognitive</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Language-Literacy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotionRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium sticky left-0 bg-white">
                      {record.student.first_name} {record.student.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.section?.name || '-'}</td>
                    
                    {/* Socio-Emotional */}
                    <td className="px-4 py-3 text-center">
                      {editingRecord === `${record.id}-socio` ? (
                        <select
                          value={record.socio_emotional_dev || 'developing'}
                          onChange={(e) => handleUpdateProficiency(record.id, 'socio_emotional_dev', e.target.value as ProficiencyLevel)}
                          onBlur={() => setEditingRecord(null)}
                          autoFocus
                          className="text-xs px-2 py-1 rounded-full border-2 border-blue-400"
                        >
                          {proficiencyLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRecord(`${record.id}-socio`)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            proficiencyLevels.find(l => l.value === record.socio_emotional_dev)?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.socio_emotional_dev?.toUpperCase() || 'NOT SET'}
                        </button>
                      )}
                    </td>

                    {/* Physical-Motor */}
                    <td className="px-4 py-3 text-center">
                      {editingRecord === `${record.id}-physical` ? (
                        <select
                          value={record.physical_motor_dev || 'developing'}
                          onChange={(e) => handleUpdateProficiency(record.id, 'physical_motor_dev', e.target.value as ProficiencyLevel)}
                          onBlur={() => setEditingRecord(null)}
                          autoFocus
                          className="text-xs px-2 py-1 rounded-full border-2 border-blue-400"
                        >
                          {proficiencyLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRecord(`${record.id}-physical`)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            proficiencyLevels.find(l => l.value === record.physical_motor_dev)?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.physical_motor_dev?.toUpperCase() || 'NOT SET'}
                        </button>
                      )}
                    </td>

                    {/* Cognitive */}
                    <td className="px-4 py-3 text-center">
                      {editingRecord === `${record.id}-cognitive` ? (
                        <select
                          value={record.cognitive_dev || 'developing'}
                          onChange={(e) => handleUpdateProficiency(record.id, 'cognitive_dev', e.target.value as ProficiencyLevel)}
                          onBlur={() => setEditingRecord(null)}
                          autoFocus
                          className="text-xs px-2 py-1 rounded-full border-2 border-blue-400"
                        >
                          {proficiencyLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRecord(`${record.id}-cognitive`)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            proficiencyLevels.find(l => l.value === record.cognitive_dev)?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.cognitive_dev?.toUpperCase() || 'NOT SET'}
                        </button>
                      )}
                    </td>

                    {/* Language-Literacy */}
                    <td className="px-4 py-3 text-center">
                      {editingRecord === `${record.id}-language` ? (
                        <select
                          value={record.language_literacy_dev || 'developing'}
                          onChange={(e) => handleUpdateProficiency(record.id, 'language_literacy_dev', e.target.value as ProficiencyLevel)}
                          onBlur={() => setEditingRecord(null)}
                          autoFocus
                          className="text-xs px-2 py-1 rounded-full border-2 border-blue-400"
                        >
                          {proficiencyLevels.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingRecord(`${record.id}-language`)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            proficiencyLevels.find(l => l.value === record.language_literacy_dev)?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.language_literacy_dev?.toUpperCase() || 'NOT SET'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Proficiency Levels</h3>
        <div className="flex flex-wrap gap-4">
          {proficiencyLevels.map(level => (
            <div key={level.value} className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${level.color}`}>
                {level.label}
              </span>
              <span className="text-xs text-gray-600">
                {level.value === 'developing' && 'Needs support and guidance'}
                {level.value === 'emerging' && 'Showing progress with assistance'}
                {level.value === 'advancing' && 'Demonstrates competence independently'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SF5KDashboard;
