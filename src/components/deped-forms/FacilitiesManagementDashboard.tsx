/**
 * FacilitiesManagementDashboard - School Building and Facilities Inventory (Custom Management Tool)
 * 
 * NOTE: This is a custom school management tool, not an official DepEd form.
 * Official DepEd SF7 is "School Personnel Assignment List and Basic Profile"
 * 
 * IMPORTANT: Feature flag hooks are memoized to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 * 
 * Performance optimizations:
 * - useMemo for expensive filtering and calculations
 * - useCallback for event handlers to prevent child re-renders
 * - Optimized data loading with Promise.all
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSchoolContext } from '../../contexts/SchoolContext';
import { useSchoolDataPostgreSQL } from '../../hooks/useSchoolDataPostgreSQL';
import {
  getFacilities,
  getSF7Summary,
  getBuildingNames,
} from '../../services/facilitiesService';
import { downloadSF7PDF } from '../../utils/pdf/facilitiesInventoryGenerator';
import type {
  Facility,
  SF7Summary,
  FacilityType,
  FacilityCondition,
  FacilityStatus,
} from '../../types/facilities';
import {
  BuildingOffice2Icon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const FacilitiesManagementDashboard: React.FC = () => {
  const { schoolId } = useSchoolContext();
  const { settings, loading: schoolDataLoading } = useSchoolDataPostgreSQL({ schoolId });

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [summary, setSummary] = useState<SF7Summary | null>(null);
  const [buildings, setBuildings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<FacilityType | ''>('');
  const [selectedCondition, setSelectedCondition] = useState<FacilityCondition | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<FacilityStatus | ''>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Load data
  useEffect(() => {
    if (!schoolId || schoolDataLoading) {
      console.log('[SF7] Waiting for data:', { schoolId, schoolDataLoading });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[SF7] Loading all data for school:', schoolId);

        const [facilitiesData, summaryData, buildingsData] = await Promise.all([
          getFacilities({ school_id: schoolId }).catch((err) => {
            console.warn('[SF7] Failed to load facilities:', err);
            return [];
          }),
          getSF7Summary(schoolId).catch((err) => {
            console.warn('[SF7] Failed to load summary:', err);
            return {
              total_facilities: 0,
              total_classrooms: 0,
              total_laboratories: 0,
              total_capacity: 0,
              total_area_sqm: 0,
              total_value: 0,
              by_condition: [],
              by_type: [],
              by_status: [],
              maintenance_stats: {
                total_maintenance: 0,
                pending: 0,
                in_progress: 0,
                completed: 0,
                total_cost: 0,
              },
              safety_stats: {
                with_fire_exit: 0,
                accessible_facilities: 0,
                with_hazards: 0,
              },
            };
          }),
          getBuildingNames(schoolId).catch((err) => {
            console.warn('[SF7] Failed to load buildings:', err);
            return [];
          }),
        ]);

        console.log('[SF7] Data received:', {
          facilities: facilitiesData.length,
          summary: summaryData,
          buildings: buildingsData.length,
        });

        setFacilities(facilitiesData);
        setSummary(summaryData);
        setBuildings(buildingsData);
      } catch (err) {
        console.error('[SF7] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [schoolId, schoolDataLoading]);

  // Client-side filtering - memoized for performance
  const filteredFacilities = useMemo(() => {
    return facilities.filter(facility => {
      if (selectedType && facility.facility_type !== selectedType) return false;
      if (selectedCondition && facility.condition !== selectedCondition) return false;
      if (selectedStatus && facility.status !== selectedStatus) return false;
      if (selectedBuilding && facility.building_name !== selectedBuilding) return false;

      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          facility.name.toLowerCase().includes(searchLower) ||
          (facility.room_number?.toLowerCase() || '').includes(searchLower) ||
          (facility.primary_use?.toLowerCase() || '').includes(searchLower) ||
          (facility.building_name?.toLowerCase() || '').includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [facilities, selectedType, selectedCondition, selectedStatus, selectedBuilding, searchTerm]);

  // Pagination calculations - memoized
  const { totalPages, paginatedFacilities, startIndex, endIndex } = useMemo(() => {
    const total = Math.ceil(filteredFacilities.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filteredFacilities.slice(start, end);

    return {
      totalPages: total,
      paginatedFacilities: paginated,
      startIndex: start,
      endIndex: end
    };
  }, [filteredFacilities, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedCondition, selectedStatus, selectedBuilding, searchTerm]);

  // Handle download PDF - memoized to prevent recreation on every render
  const handleDownloadPDF = useCallback(async () => {
    if (!schoolId || !settings || !summary) return;

    try {
      await downloadSF7PDF({
        schoolInfo: {
          name: (settings as any)?.schoolName || '',
          schoolId: (settings as any)?.schoolIdNumber || '',
          division: (settings as any)?.division || '',
          region: (settings as any)?.region || '',
          district: (settings as any)?.district || '',
        },
        reportDate: new Date().toLocaleDateString('en-PH'),
        filters: {
          facility_type: selectedType || undefined,
          condition: selectedCondition || undefined,
          status: selectedStatus || undefined,
        },
        facilities: filteredFacilities, // Use all filtered data, not just current page
        summary,
        preparedBy: (settings as any)?.schoolName || 'Property Custodian',
        certifiedBy: (settings as any)?.principalName || 'School Principal',
      });
    } catch (error) {
      console.error('[SF7] Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  }, [schoolId, settings, summary, selectedType, selectedCondition, selectedStatus, filteredFacilities]);

  if (schoolDataLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading facilities inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <a href="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
              Dashboard
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <a href="/reports/school-forms" className="text-gray-500 hover:text-gray-700 transition-colors">
              School Forms
            </a>
          </li>
          <li>
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </li>
          <li>
            <span className="font-medium text-gray-900">Facilities Management</span>
          </li>
        </ol>
      </nav>

      {/* Header with gradient and icons */}
      <div className="mb-8 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/50 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative p-4 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl shadow-lg">
                <BuildingOffice2Icon className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Facilities Management System
              </h1>
              <p className="text-gray-600 mt-1">School Building and Facilities Inventory</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={filteredFacilities.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white rounded-2xl p-6 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600">Total Facilities</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_facilities}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_capacity.toLocaleString()}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600">Total Area</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_area_sqm.toFixed(0)} m²</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-6 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600">Need Repair</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary.by_condition.find(c => c.condition === 'needs_repair')?.count || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/50 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Facility Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facility Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as FacilityType | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Filter by facility type"
            >
              <option value="">All Types</option>
              <option value="building">Building</option>
              <option value="classroom">Classroom</option>
              <option value="laboratory">Laboratory</option>
              <option value="library">Library</option>
              <option value="office">Office</option>
              <option value="sports">Sports</option>
              <option value="restroom">Restroom</option>
              <option value="cafeteria">Cafeteria</option>
              <option value="auditorium">Auditorium</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as FacilityCondition | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Filter by condition"
            >
              <option value="">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="needs_repair">Needs Repair</option>
              <option value="condemned">Condemned</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FacilityStatus | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="operational">Operational</option>
              <option value="under_repair">Under Repair</option>
              <option value="under_construction">Under Construction</option>
              <option value="closed">Closed</option>
              <option value="demolished">Demolished</option>
            </select>
          </div>

          {/* Building */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              aria-label="Filter by building"
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, room, use..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search facilities"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Facility Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Building
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Area (m²)
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFacilities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No facilities found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                paginatedFacilities.map((facility, index) => (
                  <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {facility.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                      {facility.facility_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {facility.building_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {facility.room_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {facility.capacity || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {facility.area_sqm ? facility.area_sqm.toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          facility.condition === 'excellent'
                            ? 'bg-green-100 text-green-800'
                            : facility.condition === 'good'
                            ? 'bg-blue-100 text-blue-800'
                            : facility.condition === 'fair'
                            ? 'bg-yellow-100 text-yellow-800'
                            : facility.condition === 'poor'
                            ? 'bg-orange-100 text-orange-800'
                            : facility.condition === 'needs_repair'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {facility.condition.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          facility.status === 'operational'
                            ? 'bg-green-100 text-green-800'
                            : facility.status === 'under_repair'
                            ? 'bg-yellow-100 text-yellow-800'
                            : facility.status === 'under_construction'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {facility.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredFacilities.length)} of{' '}
                  {filteredFacilities.length} facilities
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Items per page"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesManagementDashboard;
