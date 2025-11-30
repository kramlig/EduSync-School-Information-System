/**
 * SchoolSettingsPostgreSQL - PostgreSQL-based School Profile Management
 * 
 * Features:
 * - Edit school basic information (name, region, division, district)
 * - Manage school year and contact details
 * - Configure principal information
 * - Set BIR compliance fields (TIN)
 * - Real-time validation and auto-save
 * 
 * IMPORTANT: Admin only. Direct PostgreSQL schools table editing.
 * 
 * PostgreSQL Migration: ✅ COMPLETE (Nov 27, 2025)
 * - Reads from PostgreSQL schools table
 * - Updates PostgreSQL schools table directly
 * - No Firestore dependency
 * 
 * Performance: ✅ OPTIMIZED
 * - useCallback for all handlers
 * - Debounced auto-save
 * - Loading states for UX
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { supabase } from '../src/lib/supabase';
import { CheckCircleIcon, ExclamationTriangleIcon } from './icons';

interface SchoolProfile {
  id: string;
  name: string;
  school_id_number?: string;
  region: string;
  division: string;
  district?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  principal_name?: string;
  tin?: string;
  current_school_year: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const SchoolSettingsPostgreSQL: React.FC = () => {
  const { schoolId } = useSchoolContext();

  // State
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Load school profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!schoolId || schoolId === 'default') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();

        if (error) throw error;

        const profileData = {
          id: data.id,
          name: data.name,
          school_id_number: data.school_id_number,
          region: data.region,
          division: data.division,
          district: data.district,
          address: data.address,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          principal_name: data.principal_name,
          tin: data.tin,
          current_school_year: data.current_school_year
        };

        setProfile(profileData);
        setOriginalProfile(profileData); // Store original for change detection
      } catch (err) {
        console.error('[SchoolSettings] Error loading profile:', err);
        setSaveStatus('error');
        setSaveMessage('Failed to load school profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [schoolId]);

  // Validate fields
  const validate = useCallback((field: string, value: string): string | null => {
    switch (field) {
      case 'name':
        return value.trim() ? null : 'School name is required';
      case 'region':
        return value.trim() ? null : 'Region is required';
      case 'division':
        return value.trim() ? null : 'Division is required';
      case 'current_school_year':
        if (!value.trim()) return 'School year is required';
        if (!/^\d{4}-\d{4}$/.test(value)) return 'Format: YYYY-YYYY (e.g., 2024-2025)';
        return null;
      case 'contact_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        return null;
      case 'tin':
        if (value && !/^\d{3}-\d{3}-\d{3}-\d{3}$/.test(value) && value.length > 0) {
          return 'Format: XXX-XXX-XXX-XXX';
        }
        return null;
      default:
        return null;
    }
  }, []);

  // Handle input change with validation
  const handleChange = useCallback((field: keyof SchoolProfile, value: string) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);

    // Validate
    const error = validate(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  }, [validate]);

  // Save to database
  const saveProfile = useCallback(async () => {
    if (!profile || Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setSaveMessage('Saving...');

    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: profile.name,
          school_id_number: profile.school_id_number || null,
          region: profile.region,
          division: profile.division,
          district: profile.district || null,
          address: profile.address || null,
          contact_email: profile.contact_email || null,
          contact_phone: profile.contact_phone || null,
          principal_name: profile.principal_name || null,
          tin: profile.tin || null,
          current_school_year: profile.current_school_year,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update originalProfile to current state
      setOriginalProfile({ ...profile });

      setSaveStatus('saved');
      setSaveMessage('Changes saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (err) {
      console.error('[SchoolSettings] Error saving:', err);
      setSaveStatus('error');
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [profile, errors]);

  // Debounced auto-save (only if there are changes)
  useEffect(() => {
    if (!profile || !originalProfile || saveStatus === 'saving') return;

    // Check if there are actual changes
    const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      if (Object.keys(errors).length === 0) {
        saveProfile();
      }
    }, 1500); // Auto-save 1.5 seconds after last change

    return () => clearTimeout(timer);
  }, [profile, originalProfile, errors, saveStatus, saveProfile]);

  // Check if has unsaved changes
  const hasChanges = useMemo(() => {
    if (!profile || !originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            School profile not found. Please contact system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            School Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage school profile and configuration
          </p>
        </div>

        {/* Save Status Indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="Enter school name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              DepEd School ID
            </label>
            <input
              type="text"
              value={profile.school_id_number || ''}
              onChange={(e) => handleChange('school_id_number', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="e.g., 301234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current School Year <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.current_school_year}
              onChange={(e) => handleChange('current_school_year', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.current_school_year ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="2024-2025"
            />
            {errors.current_school_year && (
              <p className="text-red-500 text-sm mt-1">{errors.current_school_year}</p>
            )}
          </div>
        </div>
      </div>

      {/* DepEd Hierarchy */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          DepEd Organizational Structure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.region}
              onChange={(e) => handleChange('region', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.region ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="e.g., Region XI"
            />
            {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Division <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={profile.division}
              onChange={(e) => handleChange('division', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.division ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="e.g., Division of Mati"
            />
            {errors.division && <p className="text-red-500 text-sm mt-1">{errors.division}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              District
            </label>
            <input
              type="text"
              value={profile.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Governor Generoso North"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <textarea
              value={profile.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="Complete school address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={profile.contact_email || ''}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.contact_email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="school@example.com"
            />
            {errors.contact_email && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={profile.contact_phone || ''}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="+63 XX XXX XXXX"
            />
          </div>
        </div>
      </div>

      {/* Administrative Information */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Administrative Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Principal Name
            </label>
            <input
              type="text"
              value={profile.principal_name || ''}
              onChange={(e) => handleChange('principal_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              placeholder="Principal's full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              TIN (Tax Identification Number)
            </label>
            <input
              type="text"
              value={profile.tin || ''}
              onChange={(e) => handleChange('tin', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:text-white ${
                errors.tin ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="XXX-XXX-XXX-XXX"
            />
            {errors.tin && <p className="text-red-500 text-sm mt-1">{errors.tin}</p>}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Required for BIR-compliant receipts
            </p>
          </div>
        </div>
      </div>

      {/* Manual Save Button */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {hasErrors ? (
            <span className="text-red-600 dark:text-red-400">
              ⚠️ Please fix errors before saving
            </span>
          ) : hasChanges ? (
            <span className="text-amber-600 dark:text-amber-400">
              📝 Unsaved changes - will auto-save in 1.5s
            </span>
          ) : (
            <span className="text-green-600 dark:text-green-400">
              ✅ All changes saved
            </span>
          )}
        </p>
        <button
          onClick={saveProfile}
          disabled={saving || hasErrors || !hasChanges}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            saving || hasErrors || !hasChanges
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? 'Saving...' : 'Save Now'}
        </button>
      </div>
    </div>
  );
};

export default SchoolSettingsPostgreSQL;
