/**
 * DivisionLayout - Layout component for Division-level users
 * 
 * This layout provides:
 * - Global filter bar in header (District, School, SY, Quarter, Level)
 * - Clean sidebar navigation
 * - Division header with user info
 * - Breadcrumb navigation
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useDivisionContext } from '../../contexts/DivisionContext';

interface DivisionLayoutProps {
  onLogout: () => void;
}

// Icon wrapper for nav items - simple inline SVGs for consistency
const NavIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-5 h-5" }) => {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    school: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      </svg>
    ),
    users: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    document: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    chart: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    settings: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    logout: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
      </svg>
    ),
    chevronDown: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    ),
    mapPin: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    building: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    search: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    x: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    check: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    clipboard: (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  };
  return <>{icons[name] || null}</>;
};

const DivisionLayout: React.FC<DivisionLayoutProps> = ({ onLogout }) => {
  const {
    divisionUser,
    division,
    accessibleSchools,
    availableDistricts,
    selectedDistrict,
    selectedSchoolId,
    filteredSchools,
    selectDistrict,
    selectSchool,
    schoolYear,
    availableSchoolYears,
    setSchoolYear,
    quarter,
    setQuarter,
    schoolLevel,
    setSchoolLevel,
    hasPermission,
    loading,
  } = useDivisionContext();

  // School selector state
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
        setSchoolSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isSchoolDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSchoolDropdownOpen]);

  // Filter schools by search query (uses filteredSchools which already considers district filter)
  const searchFilteredSchools = useMemo(() => {
    const query = schoolSearchQuery.toLowerCase().trim();
    if (!query) return filteredSchools;
    return filteredSchools.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.district?.toLowerCase().includes(query)
    );
  }, [filteredSchools, schoolSearchQuery]);

  // Group schools by district for display
  const groupedSchools = useMemo(() => {
    // If a district is selected, don't group - just show as flat list
    if (selectedDistrict) {
      return [{
        district: selectedDistrict,
        schools: searchFilteredSchools.sort((a, b) => a.name.localeCompare(b.name)),
      }];
    }
    
    // Group by district
    const groups: Record<string, typeof filteredSchools> = {};
    searchFilteredSchools.forEach(school => {
      const district = school.district || 'No District Assigned';
      if (!groups[district]) {
        groups[district] = [];
      }
      groups[district].push(school);
    });
    
    // Sort districts and schools within each district
    const sortedDistricts = Object.keys(groups).sort((a, b) => {
      if (a === 'No District Assigned') return 1;
      if (b === 'No District Assigned') return -1;
      return a.localeCompare(b);
    });
    
    return sortedDistricts.map(district => ({
      district,
      schools: groups[district].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [searchFilteredSchools, selectedDistrict]);

  // Total filtered count
  const filteredCount = useMemo(() => 
    groupedSchools.reduce((sum, g) => sum + g.schools.length, 0),
    [groupedSchools]
  );

  // Get enabled modules from division settings
  const enabledModules = useMemo(() => {
    return division?.settings?.enabledModules || [];
  }, [division?.settings?.enabledModules]);

  // Helper to check if a module is enabled
  const isModuleEnabled = (moduleKey: string): boolean => {
    // If no modules are configured, show all (default behavior)
    if (!enabledModules || enabledModules.length === 0) return true;
    return enabledModules.includes(moduleKey as typeof enabledModules[number]);
  };

  // Navigation items based on permissions AND enabled modules
  const navItems = useMemo(() => {
    const items = [
      {
        path: '/division',
        iconName: 'dashboard',
        label: 'Dashboard',
        show: true, // Dashboard always visible
        end: true, // Exact match only
        moduleKey: null, // No module restriction
      },
      {
        path: '/division/schools',
        iconName: 'school',
        label: 'Schools',
        show: hasPermission('schools', 'read') && isModuleEnabled('school_management'),
        end: false,
        moduleKey: 'school_management',
      },
      {
        path: '/division/enrollment',
        iconName: 'document',
        label: 'Enrollment (SF1)',
        show: hasPermission('enrollment', 'read') && isModuleEnabled('sf1_enrollment'),
        end: false,
        moduleKey: 'sf1_enrollment',
      },
      {
        path: '/division/sf1-import',
        iconName: 'document',
        label: 'SF1 Import',
        show: true, // Always visible for division users
        end: true,
        moduleKey: null,
      },
      {
        path: '/division/sf5-import',
        iconName: 'chart',
        label: 'SF5 Import',
        show: true, // Always visible for division users
        end: true,
        moduleKey: null,
      },
      {
        path: '/division/sf7-import',
        iconName: 'users',
        label: 'SF7 Import',
        show: true, // Always visible for division users
        end: true,
        moduleKey: null,
      },
      {
        path: '/division/reports/sf5',
        iconName: 'chart',
        label: 'SF5 - Promotion',
        show: hasPermission('reports', 'read') && isModuleEnabled('sf5_promotion'),
        end: true, // Exact match to avoid conflict with /division/reports
        moduleKey: 'sf5_promotion',
      },
      {
        path: '/division/reports/sf6',
        iconName: 'chart',
        label: 'SF6 - Enrollment Summary',
        show: hasPermission('reports', 'read') && isModuleEnabled('sf6_summary'),
        end: true, // Exact match to avoid conflict with /division/reports
        moduleKey: 'sf6_summary',
      },
      {
        path: '/division/reports/sf7',
        iconName: 'users',
        label: 'SF7 - Personnel',
        show: hasPermission('personnel', 'read') && isModuleEnabled('sf7_personnel'),
        end: true, // Exact match to avoid conflict with /division/reports
        moduleKey: 'sf7_personnel',
      },
      {
        path: '/division/reports/proficiency',
        iconName: 'chart',
        label: 'Proficiency Level',
        show: hasPermission('reports', 'read'),
        end: true, // Exact match to avoid conflict with /division/reports
        moduleKey: null, // No module restriction - new feature
      },
      {
        path: '/division/reports',
        iconName: 'chart',
        label: 'More Reports',
        show: hasPermission('reports', 'read') && isModuleEnabled('reports_consolidated'),
        end: true, // Exact match only - don't highlight for SF5/SF6/SF7
        moduleKey: 'reports_consolidated',
      },
      {
        path: '/division/users',
        iconName: 'users',
        label: 'User Management',
        show: hasPermission('users', 'read'), // User management always enabled for admins
        end: true,
        moduleKey: null, // No module restriction
      },
      {
        path: '/division/audit-log',
        iconName: 'clipboard',
        label: 'Audit Log',
        show: hasPermission('settings', 'read'), // Audit log always enabled for admins
        end: true,
        moduleKey: null, // No module restriction
      },
      {
        path: '/division/settings',
        iconName: 'settings',
        label: 'Settings',
        show: hasPermission('settings', 'read'), // Settings always enabled for admins
        end: false,
        moduleKey: null, // No module restriction
      },
    ];

    return items.filter(item => item.show);
  }, [hasPermission, enabledModules, isModuleEnabled]);

  // Get selected school name
  const selectedSchool = useMemo(() => {
    if (!selectedSchoolId) return null;
    return accessibleSchools.find(s => s.id === selectedSchoolId);
  }, [selectedSchoolId, accessibleSchools]);

  // Determine available school levels based on selected school
  const availableSchoolLevels: string[] = useMemo(() => {
    // If no school selected, all levels are available
    if (!selectedSchool) {
      return ['ALL', 'ELEMENTARY', 'JUNIOR HIGH SCHOOL', 'SENIOR HIGH SCHOOL'];
    }
    
    const schoolType = selectedSchool.school_type?.toLowerCase();
    
    // Map school_type to available levels
    if (schoolType === 'elementary') {
      return ['ELEMENTARY'];
    } else if (schoolType === 'high_school' || schoolType === 'secondary') {
      return ['JUNIOR HIGH SCHOOL'];
    } else if (schoolType === 'senior_high') {
      return ['SENIOR HIGH SCHOOL'];
    } else if (schoolType === 'integrated') {
      // Integrated schools have all levels
      return ['ALL', 'ELEMENTARY', 'JUNIOR HIGH SCHOOL', 'SENIOR HIGH SCHOOL'];
    }
    
    // Default: all levels
    return ['ALL', 'ELEMENTARY', 'JUNIOR HIGH SCHOOL', 'SENIOR HIGH SCHOOL'];
  }, [selectedSchool]);

  // Auto-adjust school level when school selection changes
  useEffect(() => {
    if (selectedSchool && !availableSchoolLevels.includes(schoolLevel)) {
      // Auto-select the first available level for this school
      setSchoolLevel(availableSchoolLevels[0] as any);
    }
  }, [selectedSchool, availableSchoolLevels, schoolLevel, setSchoolLevel]);

  // Role badge color
  const roleBadgeColor = useMemo(() => {
    switch (divisionUser?.role) {
      case 'division_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'division_supervisor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'psds':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'eps':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'division_data_manager':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }, [divisionUser?.role]);

  // Format role for display
  const formatRole = (role: string): string => {
    return role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading division data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900">
      {/* Global Header - Single Row with Division Info + Filters + User */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-20 px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Division Logo & Name */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <NavIcon name="building" className="w-4 h-4" />
            </div>
            <div className="hidden lg:block">
              <h1 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
                {division?.name || 'Division'}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {division?.region || 'DepEd'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden md:block" />

          {/* Filters - Center */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* District Filter */}
            <select
              value={selectedDistrict || ''}
              onChange={(e) => selectDistrict(e.target.value || null)}
              title="District"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-500 transition-colors max-w-[130px]"
            >
              <option value="">All Districts</option>
              {availableDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            {/* School Filter with Search */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-500 transition-colors max-w-[150px]"
              >
                <span className="truncate">
                  {selectedSchoolId 
                    ? (selectedSchool?.name || 'School')
                    : `All Schools (${filteredSchools.length})`
                  }
                </span>
                <NavIcon 
                  name="chevronDown" 
                  className={`w-3 h-3 text-slate-400 flex-shrink-0 transition-transform ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* School Dropdown Panel */}
              {isSchoolDropdownOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden">
                  {/* Search Input */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                      <NavIcon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search schools..."
                        value={schoolSearchQuery}
                        onChange={(e) => setSchoolSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-8 py-1.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
                      />
                      {schoolSearchQuery && (
                        <button
                          type="button"
                          aria-label="Clear search"
                          onClick={() => setSchoolSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <NavIcon name="x" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-64 overflow-y-auto">
                    {/* All Schools Option */}
                    <button
                      type="button"
                      onClick={() => {
                        selectSchool(null);
                        setIsSchoolDropdownOpen(false);
                        setSchoolSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                        !selectedSchoolId ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>All Schools ({filteredCount})</span>
                      {!selectedSchoolId && <NavIcon name="check" className="w-4 h-4 text-blue-600" />}
                    </button>

                    {/* Grouped Schools */}
                    {groupedSchools.map(group => (
                      <div key={group.district}>
                        {!selectedDistrict && (
                          <div className="sticky top-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {group.district} ({group.schools.length})
                          </div>
                        )}
                        {group.schools.map(school => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => {
                              selectSchool(school.id);
                              setIsSchoolDropdownOpen(false);
                              setSchoolSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 ${!selectedDistrict ? 'pl-5' : ''} text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                              selectedSchoolId === school.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{school.name}</span>
                            {selectedSchoolId === school.id && <NavIcon name="check" className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    ))}

                    {groupedSchools.length === 0 && schoolSearchQuery && (
                      <div className="px-3 py-4 text-sm text-slate-500 text-center">
                        No schools match "{schoolSearchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* School Level - right after School filter */}
            <select
              value={schoolLevel}
              onChange={(e) => setSchoolLevel(e.target.value as 'ALL' | 'ELEMENTARY' | 'JUNIOR HIGH SCHOOL' | 'SENIOR HIGH SCHOOL')}
              title="School Level"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
            >
              {availableSchoolLevels.includes('ALL') && <option value="ALL">All Levels</option>}
              {availableSchoolLevels.includes('ELEMENTARY') && <option value="ELEMENTARY">Elem</option>}
              {availableSchoolLevels.includes('JUNIOR HIGH SCHOOL') && <option value="JUNIOR HIGH SCHOOL">JHS</option>}
              {availableSchoolLevels.includes('SENIOR HIGH SCHOOL') && <option value="SENIOR HIGH SCHOOL">SHS</option>}
            </select>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden md:block" />

            {/* School Year */}
            <select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              title="School Year"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
            >
              {availableSchoolYears.map(sy => (
                <option key={sy} value={sy}>{sy}</option>
              ))}
            </select>

            {/* Quarter */}
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4')}
              title="Quarter"
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-300 dark:hover:border-slate-500 transition-colors w-14"
            >
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>

            {/* Clear Filters */}
            {(selectedDistrict || selectedSchoolId) && (
              <button
                type="button"
                onClick={() => {
                  selectDistrict(null);
                  selectSchool(null);
                }}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium px-1.5 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right: User Info & Logout */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto pl-4 border-l border-slate-200 dark:border-slate-600">
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                {divisionUser?.name}
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium ${roleBadgeColor}`}>
                {formatRole(divisionUser?.role || '')}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <NavIcon name="logout" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Navigation Only */}
        <aside className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0">
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }`
                }
              >
                <NavIcon name={item.iconName} className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer - User on Mobile */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 sm:hidden">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {divisionUser?.name}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${roleBadgeColor}`}>
                {formatRole(divisionUser?.role || '')}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DivisionLayout;
