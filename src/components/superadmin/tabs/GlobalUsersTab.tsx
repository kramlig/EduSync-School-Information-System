/**
 * GlobalUsersTab - Create users for any school or division
 * 
 * Features:
 * - Create school staff (admin, principal, registrar, teacher)
 * - Create division users (division_admin, psds, eps, etc.)
 * - Select target school or division
 * - Form validation
 */

import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  BuildingOffice2Icon,
  BuildingLibraryIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { School, Division, CreateUserInput } from '../types';
import { getAllSchools, getAllDivisions, createUser } from '../services/superAdminService';

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHOOL_ROLES = [
  { value: 'admin', label: 'School Admin', description: 'Full access to manage school' },
  { value: 'principal', label: 'Principal', description: 'School leadership access' },
  { value: 'registrar', label: 'Registrar', description: 'Student enrollment and records' },
  { value: 'teacher', label: 'Teacher', description: 'Class and grade management' },
];

const DIVISION_ROLES = [
  { value: 'division_admin', label: 'Division Admin', description: 'Full division access' },
  { value: 'division_supervisor', label: 'Division Supervisor', description: 'View and reports' },
  { value: 'division_data_manager', label: 'Data Manager', description: 'Data consolidation' },
  { value: 'psds', label: 'PSDS', description: 'Public Schools District Supervisor' },
  { value: 'eps', label: 'EPS', description: 'Education Program Supervisor' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GlobalUsersTab: React.FC = () => {
  // Data
  const [schools, setSchools] = useState<School[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [targetType, setTargetType] = useState<'school' | 'division'>('school');
  const [targetId, setTargetId] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [schoolsData, divisionsData] = await Promise.all([
          getAllSchools(),
          getAllDivisions(),
        ]);
        setSchools(schoolsData);
        setDivisions(divisionsData);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Reset role when target type changes
  useEffect(() => {
    setRole('');
    setTargetId('');
  }, [targetType]);

  // Filter options based on search
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.school_id_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDivisions = divisions.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected target name
  const getTargetName = () => {
    if (targetType === 'school') {
      return schools.find(s => s.id === targetId)?.name || 'Select a school';
    } else {
      return divisions.find(d => d.id === targetId)?.name || 'Select a division';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetId) {
      setError(`Please select a ${targetType}`);
      return;
    }

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const input: CreateUserInput = {
        target_type: targetType,
        target_id: targetId,
        email,
        password,
        name,
        role,
      };

      await createUser(input);
      
      setSuccess(`Successfully created ${role} account for ${email}`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      // Keep target and role for quick multiple creations
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const roles = targetType === 'school' ? SCHOOL_ROLES : DIVISION_ROLES;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <UserPlusIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create User Account</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create user accounts for any school or division in the platform
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Create user for:
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTargetType('school')}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  targetType === 'school'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <BuildingOffice2Icon className={`w-6 h-6 ${
                  targetType === 'school' ? 'text-blue-600' : 'text-slate-400'
                }`} />
                <div className="text-left">
                  <p className={`font-medium ${
                    targetType === 'school' ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'
                  }`}>School</p>
                  <p className="text-xs text-slate-500">Admin, Teacher, Registrar</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('division')}
                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  targetType === 'division'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <BuildingLibraryIcon className={`w-6 h-6 ${
                  targetType === 'division' ? 'text-purple-600' : 'text-slate-400'
                }`} />
                <div className="text-left">
                  <p className={`font-medium ${
                    targetType === 'division' ? 'text-purple-600' : 'text-slate-700 dark:text-slate-300'
                  }`}>Division</p>
                  <p className="text-xs text-slate-500">Division Admin, PSDS, EPS</p>
                </div>
              </button>
            </div>
          </div>

          {/* Target Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select {targetType === 'school' ? 'School' : 'Division'} *
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${targetType}s...`}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Options List */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Loading...</div>
              ) : targetType === 'school' ? (
                filteredSchools.length > 0 ? (
                  filteredSchools.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => setTargetId(school.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        targetId === school.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <p className="font-medium text-slate-900 dark:text-white">{school.name}</p>
                      <p className="text-xs text-slate-500">
                        {school.school_id_number || school.code || 'No ID'} • {school.division_name || 'No division'}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">No schools found</div>
                )
              ) : (
                filteredDivisions.length > 0 ? (
                  filteredDivisions.map((division) => (
                    <button
                      key={division.id}
                      type="button"
                      onClick={() => setTargetId(division.id)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        targetId === division.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <p className="font-medium text-slate-900 dark:text-white">{division.name}</p>
                      <p className="text-xs text-slate-500">
                        {division.region || 'No region'} • {division.school_count ?? 0} schools
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">No divisions found</div>
                )
              )}
            </div>

            {targetId && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Selected: <span className="font-medium">{getTargetName()}</span>
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    role === r.value
                      ? targetType === 'school'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className={`font-medium ${
                    role === r.value
                      ? targetType === 'school' ? 'text-blue-600' : 'text-purple-600'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>{r.label}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={creating || !targetId || !role || !email || !password}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Reference */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-medium text-slate-900 dark:text-white mb-4">Quick Reference</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">School Roles</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Admin</strong> - Full school management access</li>
              <li><strong>Principal</strong> - Leadership and oversight</li>
              <li><strong>Registrar</strong> - Student enrollment and records</li>
              <li><strong>Teacher</strong> - Classes and grades only</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Division Roles</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Division Admin</strong> - Full division access</li>
              <li><strong>Supervisor</strong> - View and reports</li>
              <li><strong>Data Manager</strong> - Data consolidation</li>
              <li><strong>PSDS/EPS</strong> - District/program supervision</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalUsersTab;
