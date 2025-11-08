/**
 * SchoolSwitcher - UI component for multi-school users
 * 
 * Displays a dropdown for users who have access to multiple schools,
 * allowing them to switch between schools. Hidden for single-school users.
 * 
 * Usage:
 * ```tsx
 * <SchoolSwitcher />
 * ```
 * 
 * The component automatically:
 * - Hides when user has only one school
 * - Shows dropdown with all available schools
 * - Updates context when user switches schools
 * - Displays current school name
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestoreInstance } from '../src/services/firestoreService';

interface School {
  id: string;
  name: string;
  shortName?: string;
}

/**
 * Icon for school/building
 */
const BuildingIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

/**
 * Icon for chevron down
 */
const ChevronDownIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const SchoolSwitcher: React.FC = () => {
  const { schoolId, schoolIds, setActiveSchool } = useSchoolContext();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load school details from Firestore
  useEffect(() => {
    const loadSchools = async () => {
      if (schoolIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestoreInstance();
        
        // Query schools collection for schools the user has access to
        // Note: Firestore 'in' queries are limited to 10 items, for more we'd need batching
        const schoolsQuery = query(
          collection(db, 'schools'),
          where('__name__', 'in', schoolIds.slice(0, 10)) // Limit to 10 for 'in' query
        );
        
        const snapshot = await getDocs(schoolsQuery);
        const schoolsData: School[] = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          shortName: doc.data().shortName
        }));

        // Sort alphabetically by name
        schoolsData.sort((a, b) => a.name.localeCompare(b.name));
        
        setSchools(schoolsData);
      } catch (error) {
        console.error('[SchoolSwitcher] Error loading schools:', error);
        // Fallback: use schoolIds as names
        setSchools(schoolIds.map(id => ({ id, name: id })));
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
  }, [schoolIds]);

  // Get current school name
  const currentSchool = useMemo(() => {
    return schools.find(s => s.id === schoolId) || { id: schoolId || '', name: schoolId || 'No School' };
  }, [schools, schoolId]);

  // Hide if user has only one school or no schools
  if (schoolIds.length <= 1) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
        <BuildingIcon className="w-4 h-4" />
        <span>Loading schools...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
        aria-label="Switch school"
      >
        <BuildingIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {currentSchool.shortName || currentSchool.name}
        </span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-10 md:hidden" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Switch School
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => {
                    setActiveSchool(school.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    school.id === schoolId
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {school.id === schoolId && (
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{school.name}</div>
                      {school.shortName && school.shortName !== school.name && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">{school.shortName}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              {schools.length} school{schools.length !== 1 ? 's' : ''} available
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolSwitcher;
