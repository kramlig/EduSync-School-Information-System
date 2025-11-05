/**
 * FeeStructureManager - Admin interface for managing fee structures
 * 
 * IMPORTANT: Uses memoized hooks to prevent infinite render loops
 * caused by settings object reference changes from useSchoolData
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { FeeStructure } from '../types';
import { 
  saveFeeStructure,
  getFeeStructures
} from '../src/services/billingService';
import { useOnlineStatus, getOfflineMessage } from '../src/services/connectionService';
import { PencilIcon, TrashIcon } from './icons';

interface FeeStructureManagerProps {
  schoolData: SchoolDataHook;
}

interface MiscFee {
  id: string;
  name: string;
  amount: number;
  required: boolean;
  description?: string;
}

interface LabFee {
  subject: string;
  amount: number;
}

const FeeStructureManager: React.FC<FeeStructureManagerProps> = ({ schoolData }) => {
  const { loading } = schoolData;
  
  // Online status
  const isOnline = useOnlineStatus();
  
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [gradeLevel, setGradeLevel] = useState<number>(1);
  const [schoolYear, setSchoolYear] = useState<string>('2024-2025');
  const [track, setTrack] = useState<string>('');
  const [strand, setStrand] = useState<string>('');
  const [tuitionAmount, setTuitionAmount] = useState<number>(0);
  const [miscFees, setMiscFees] = useState<MiscFee[]>([]);
  const [labFees, setLabFees] = useState<LabFee[]>([]);
  const [registrationAmount, setRegistrationAmount] = useState<number>(500);
  const [idAmount, setIdAmount] = useState<number>(150);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(300);
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState<number>(0.05);
  const [quarterlyDiscount, setQuarterlyDiscount] = useState<number>(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState<number>(0);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'all'>('all');

  // Grade level options
  const gradeLevels = [
    { value: 0, label: 'Kindergarten' },
    { value: 1, label: 'Grade 1' },
    { value: 2, label: 'Grade 2' },
    { value: 3, label: 'Grade 3' },
    { value: 4, label: 'Grade 4' },
    { value: 5, label: 'Grade 5' },
    { value: 6, label: 'Grade 6' },
    { value: 7, label: 'Grade 7' },
    { value: 8, label: 'Grade 8' },
    { value: 9, label: 'Grade 9' },
    { value: 10, label: 'Grade 10' },
    { value: 11, label: 'Grade 11' },
    { value: 12, label: 'Grade 12' }
  ];

  // SHS tracks and strands
  const tracks = ['Academic', 'TVL', 'Sports', 'Arts & Design'];
  const strands: Record<string, string[]> = {
    'Academic': ['STEM', 'HUMSS', 'ABM', 'GAS'],
    'TVL': ['HE', 'ICT', 'IA', 'Agri-Fishery'],
    'Sports': ['Sports'],
    'Arts & Design': ['Arts & Design']
  };

  // Load existing fee structures
  useEffect(() => {
    loadFeeStructures();
  }, []);

  const loadFeeStructures = async () => {
    try {
      setLoadingStructures(true);
      const structures = await getFeeStructures();
      setFeeStructures(structures);
      console.log('✅ Loaded fee structures:', structures.length);
    } catch (err) {
      console.error('Error loading fee structures:', err);
      setError('Failed to load fee structures');
    } finally {
      setLoadingStructures(false);
    }
  };

  const resetForm = () => {
    setGradeLevel(1);
    setSchoolYear('2024-2025');
    setTrack('');
    setStrand('');
    setTuitionAmount(0);
    setMiscFees([]);
    setLabFees([]);
    setRegistrationAmount(500);
    setIdAmount(150);
    setInsuranceAmount(300);
    setFullPaymentDiscount(0.05);
    setQuarterlyDiscount(0);
    setMonthlyDiscount(0);
    setEditingStructure(null);
    setIsCreating(false);
  };

  const loadStructureForEdit = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setGradeLevel(structure.gradeLevel);
    setSchoolYear(structure.schoolYear);
    setTrack(structure.track || '');
    setStrand(structure.strand || '');
    setTuitionAmount(structure.fees.tuitionFee);
    setMiscFees(structure.fees.miscFees || []);
    setLabFees(structure.fees.labFees || []);
    setRegistrationAmount(structure.fees.registrationFee || 500);
    setIdAmount(structure.fees.idFee || 150);
    setInsuranceAmount(structure.fees.insuranceFee || 300);
    setFullPaymentDiscount(structure.paymentOptions.fullPayment.discount || 0.05);
    setQuarterlyDiscount(0); // Not stored in current structure
    setMonthlyDiscount(0); // Not stored in current structure
    setIsCreating(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate
      if (!schoolYear) {
        setError('School year is required');
        return;
      }

      if (gradeLevel >= 11 && !track) {
        setError('Track is required for SHS');
        return;
      }

      if (gradeLevel >= 11 && !strand) {
        setError('Strand is required for SHS');
        return;
      }

      // Calculate totals
      const totalRequired = tuitionAmount + 
        miscFees.filter(f => f.required).reduce((sum, f) => sum + f.amount, 0) +
        (registrationAmount || 0) +
        (idAmount || 0) +
        (insuranceAmount || 0);
      
      const totalOptional = miscFees.filter(f => !f.required).reduce((sum, f) => sum + f.amount, 0) +
        (labFees || []).reduce((sum, f) => sum + f.amount, 0);

      // Build fee structure
      const feeStructure: FeeStructure = {
        id: editingStructure?.id || `${gradeLevel}-${schoolYear}${track ? `-${track}` : ''}${strand ? `-${strand}` : ''}`,
        gradeLevel,
        schoolYear,
        ...(track && { track }),
        ...(strand && { strand }),
        fees: {
          tuitionFee: tuitionAmount,
          miscFees: miscFees,
          ...(labFees && labFees.length > 0 && { labFees }),
          ...(registrationAmount && { registrationFee: registrationAmount }),
          ...(idAmount && { idFee: idAmount }),
          ...(insuranceAmount && { insuranceFee: insuranceAmount })
        },
        totalRequired,
        totalOptional,
        paymentOptions: {
          fullPayment: {
            enabled: true,
            discount: fullPaymentDiscount
          },
          quarterly: {
            enabled: true,
            numberOfPayments: 4
          },
          monthly: {
            enabled: true,
            numberOfPayments: 10
          }
        },
        createdAt: editingStructure?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: editingStructure?.createdBy || 'system' // TODO: Get from session
      };

      await saveFeeStructure(feeStructure);
      
      setSuccess(`Fee structure ${editingStructure ? 'updated' : 'created'} successfully`);
      resetForm();
      loadFeeStructures();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving fee structure:', err);
      setError('Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const addMiscFee = () => {
    setMiscFees([...miscFees, { 
      id: `misc-${Date.now()}`,
      name: '', 
      amount: 0, 
      required: true, 
      description: '' 
    }]);
  };

  const updateMiscFee = (index: number, field: keyof MiscFee, value: string | number | boolean) => {
    const updated = [...miscFees];
    updated[index] = { ...updated[index], [field]: value };
    setMiscFees(updated);
  };

  const removeMiscFee = (index: number) => {
    setMiscFees(miscFees.filter((_, i) => i !== index));
  };

  const addLabFee = () => {
    setLabFees([...labFees, { subject: '', amount: 0 }]);
  };

  const updateLabFee = (index: number, field: 'subject' | 'amount', value: string | number) => {
    const updated = [...labFees];
    updated[index] = { ...updated[index], [field]: value };
    setLabFees(updated);
  };

  const removeLabFee = (index: number) => {
    setLabFees(labFees.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totalRequired = useMemo(() => {
    return tuitionAmount + 
      miscFees.filter(f => f.required).reduce((sum, f) => sum + f.amount, 0) +
      (registrationAmount || 0) +
      (idAmount || 0) +
      (insuranceAmount || 0);
  }, [tuitionAmount, miscFees, registrationAmount, idAmount, insuranceAmount]);

  const totalOptional = useMemo(() => {
    return miscFees.filter(f => !f.required).reduce((sum, f) => sum + f.amount, 0) +
      (labFees || []).reduce((sum, f) => sum + f.amount, 0);
  }, [miscFees, labFees]);

  const totalWithFullDiscount = useMemo(() => {
    return totalRequired * (1 - fullPaymentDiscount);
  }, [totalRequired, fullPaymentDiscount]);

  // Group fee structures by grade level
  const groupedStructures = useMemo(() => {
    const groups: Record<string, FeeStructure[]> = {};
    feeStructures.forEach(structure => {
      const key = `Grade ${structure.gradeLevel}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(structure);
    });
    return groups;
  }, [feeStructures]);
  
  // Filtered structures
  const filteredStructures = useMemo(() => {
    return feeStructures.filter(structure => {
      const matchesSearch = searchQuery === '' || 
        structure.schoolYear.includes(searchQuery) ||
        `Grade ${structure.gradeLevel}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (structure.track && structure.track.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (structure.strand && structure.strand.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGrade = selectedGradeFilter === 'all' || structure.gradeLevel === selectedGradeFilter;
      
      return matchesSearch && matchesGrade;
    });
  }, [feeStructures, searchQuery, selectedGradeFilter]);

  // Loading state - must come after all hooks
  if (loading || loadingStructures) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Fee Structure Management</h1>
        <p className="text-gray-600 mt-2">Define and manage fee structures for different grade levels</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">✕</button>
        </div>
      )}

      {/* Actions Bar - Only show when not creating */}
      {!isCreating && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Left side - Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by grade, year, track..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Grade Filter */}
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Grades</option>
                <optgroup label="Elementary">
                  <option value={0}>Kindergarten</option>
                  {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </optgroup>
                <optgroup label="Junior High School">
                  {[7, 8, 9, 10].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </optgroup>
                <optgroup label="Senior High School">
                  {[11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </optgroup>
              </select>
            </div>

            {/* Right side - Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(true)}
                disabled={!isOnline}
                className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Total Structures:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{feeStructures.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Filtered:</span>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{filteredStructures.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Grade Levels:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{Object.keys(groupedStructures).length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕ Cancel
            </button>
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong className="font-medium">Offline Mode</strong>
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    {getOfflineMessage('FEE_STRUCTURE')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {gradeLevels.map((gl) => (
                  <option key={gl.value} value={gl.value}>
                    {gl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Year *
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2024-2025"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {gradeLevel >= 11 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Track *
                  </label>
                  <select
                    value={track}
                    onChange={(e) => {
                      setTrack(e.target.value);
                      setStrand('');
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select Track</option>
                    {tracks.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Strand *
                  </label>
                  <select
                    value={strand}
                    onChange={(e) => setStrand(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    disabled={!track}
                  >
                    <option value="">Select Strand</option>
                    {track && strands[track]?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Tuition Fee */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tuition Fee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₱)
                </label>
                <input
                  type="number"
                  value={tuitionAmount}
                  onChange={(e) => setTuitionAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Miscellaneous Fees */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Miscellaneous Fees</h3>
              <button
                onClick={addMiscFee}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Add Fee
              </button>
            </div>
            {miscFees.map((fee, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={fee.name}
                    onChange={(e) => updateMiscFee(index, 'name', e.target.value)}
                    placeholder="Library Fee"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    value={fee.amount}
                    onChange={(e) => updateMiscFee(index, 'amount', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={fee.required}
                      onChange={(e) => updateMiscFee(index, 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeMiscFee(index)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <TrashIcon /> Remove
                  </button>
                </div>
              </div>
            ))}
            {miscFees.length === 0 && (
              <p className="text-gray-500 text-sm">No miscellaneous fees added yet.</p>
            )}
          </div>

          {/* Laboratory Fees */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Laboratory Fees</h3>
              <button
                onClick={addLabFee}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Add Lab Fee
              </button>
            </div>
            {labFees.map((fee, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={fee.subject}
                    onChange={(e) => updateLabFee(index, 'subject', e.target.value)}
                    placeholder="Science"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₱)</label>
                  <input
                    type="number"
                    value={fee.amount}
                    onChange={(e) => updateLabFee(index, 'amount', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removeLabFee(index)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <TrashIcon /> Remove
                  </button>
                </div>
              </div>
            ))}
            {labFees.length === 0 && (
              <p className="text-gray-500 text-sm">No laboratory fees added yet.</p>
            )}
          </div>

          {/* Other Fees */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Fees</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Fee (₱)
                </label>
                <input
                  type="number"
                  value={registrationAmount}
                  onChange={(e) => setRegistrationAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Fee (₱)
                </label>
                <input
                  type="number"
                  value={idAmount}
                  onChange={(e) => setIdAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Fee (₱)
                </label>
                <input
                  type="number"
                  value={insuranceAmount}
                  onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Options & Discounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Payment Discount (%)
                </label>
                <input
                  type="number"
                  value={fullPaymentDiscount * 100}
                  onChange={(e) => setFullPaymentDiscount(Number(e.target.value) / 100)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount after discount: ₱{totalWithFullDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quarterly Discount (%)
                </label>
                <input
                  type="number"
                  value={quarterlyDiscount * 100}
                  onChange={(e) => setQuarterlyDiscount(Number(e.target.value) / 100)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">4 installments</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Discount (%)
                </label>
                <input
                  type="number"
                  value={monthlyDiscount * 100}
                  onChange={(e) => setMonthlyDiscount(Number(e.target.value) / 100)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  max="100"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">10 installments</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Fee Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Required Fees</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{totalRequired.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Optional Fees</p>
                <p className="text-2xl font-bold text-green-600">
                  ₱{totalOptional.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">With Full Payment Discount</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₱{totalWithFullDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Save ₱{(totalRequired - totalWithFullDiscount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={!isOnline || saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editingStructure ? 'Update Fee Structure' : 'Create Fee Structure'}
            </button>
            <button
              onClick={resetForm}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fee Structures List - Grouped by Grade Level */}
      {!isCreating && (
        <>
          {feeStructures.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fee Structures Yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first fee structure for a grade level.</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-sm inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Your First Fee Structure
                </button>
              </div>
            </div>
          ) : filteredStructures.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedGradeFilter('all'); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped View */}
              {Object.keys(groupedStructures).length > 3 ? (
                // Compact grid view for many grade levels
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStructures.map((structure) => (
                    <div key={structure.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 overflow-hidden group">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">Grade {structure.gradeLevel}</h3>
                            <p className="text-blue-100 text-sm">{structure.schoolYear}</p>
                          </div>
                          <button
                            onClick={() => loadStructureForEdit(structure)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 p-2 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon />
                          </button>
                        </div>
                        {structure.track && (
                          <div className="mt-2 text-xs bg-white/20 inline-block px-2 py-1 rounded">
                            {structure.track} - {structure.strand}
                          </div>
                        )}
                      </div>
                      
                      {/* Body */}
                      <div className="p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Required:</span>
                            <span className="font-semibold text-gray-900">
                              ₱{(structure.totalRequired || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {structure.totalOptional > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Optional Fees:</span>
                              <span className="font-medium text-gray-700">
                                ₱{structure.totalOptional.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {structure.paymentOptions?.fullPayment?.discount && structure.paymentOptions.fullPayment.discount > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-gray-600">Full Payment Discount:</span>
                              <span className="font-medium text-green-600">
                                {(structure.paymentOptions.fullPayment.discount * 100).toFixed(0)}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <button
                          onClick={() => loadStructureForEdit(structure)}
                          className="mt-4 w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <PencilIcon />
                          Edit Fee Structure
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Detailed list view for fewer grade levels
                <div className="space-y-4">
                  {filteredStructures.map((structure) => (
                    <div key={structure.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                                Grade {structure.gradeLevel}
                              </div>
                              <div className="text-gray-600 font-medium">
                                {structure.schoolYear}
                              </div>
                              {structure.track && (
                                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-medium">
                                  {structure.track} - {structure.strand}
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-600 mb-1">Total Required</div>
                                <div className="text-lg font-bold text-gray-900">
                                  ₱{(structure.totalRequired || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              
                              {structure.totalOptional > 0 && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="text-xs text-gray-600 mb-1">Optional Fees</div>
                                  <div className="text-lg font-bold text-gray-900">
                                    ₱{structure.totalOptional.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              )}
                              
                              {structure.paymentOptions?.fullPayment?.discount && structure.paymentOptions.fullPayment.discount > 0 && (
                                <div className="bg-green-50 rounded-lg p-3">
                                  <div className="text-xs text-green-700 mb-1">Full Payment</div>
                                  <div className="text-lg font-bold text-green-700">
                                    {(structure.paymentOptions.fullPayment.discount * 100).toFixed(0)}% OFF
                                  </div>
                                </div>
                              )}
                              
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-xs text-blue-700 mb-1">After Discount</div>
                                <div className="text-lg font-bold text-blue-700">
                                  ₱{((structure.totalRequired || 0) * (1 - (structure.paymentOptions?.fullPayment?.discount || 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => loadStructureForEdit(structure)}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                          >
                            <PencilIcon />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeeStructureManager;
