/**
 * PersonalStudents — Student management for personal workspace.
 *
 * Wrapper around existing student management with tier enforcement:
 *  - Shows student count vs limit
 *  - Blocks adding beyond free-tier limit
 *  - Add via form or CSV import
 *
 * Phase 2 MVP: Simple table with add/edit/delete.
 * Full integration with existing StudentList component deferred to after wiring.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import UpgradeModal from './UpgradeModal';

interface Props {
  schoolId: string;
  maxStudents: number;
  tier: string;
}

interface SimpleStudent {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  lrn?: string;
  sex?: string;
  sectionId?: string;
}

const PersonalStudents: React.FC<Props> = ({ schoolId, maxStudents, tier }) => {
  const [students, setStudents] = useState<SimpleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  // Add form state
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newMiddle, setNewMiddle] = useState('');
  const [newLrn, setNewLrn] = useState('');
  const [newSex, setNewSex] = useState('Male');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('students')
      .select('id, first_name, last_name, middle_name, lrn, gender, section_id')
      .eq('school_id', schoolId)
      .order('last_name');

    if (!err && data) {
      setStudents(
        data.map((s: any) => ({
          id: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          middleName: s.middle_name,
          lrn: s.lrn,
          sex: s.gender,
          sectionId: s.section_id,
        }))
      );
    }
    setLoading(false);
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) fetchStudents();
  }, [schoolId, fetchStudents]);

  const isAtLimit = tier === 'free' && students.length >= maxStudents;

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.lrn?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit) {
      setError('Student limit reached. Upgrade to add more.');
      return;
    }
    setError('');
    setSaving(true);

    const firstName = newFirst.trim();
    const lastName = newLast.trim();
    const { error: insertErr } = await supabase.from('students').insert({
      school_id: schoolId,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      middle_name: newMiddle.trim() || null,
      lrn: newLrn.trim() || null,
      gender: newSex as any,
      grade_level: 6,
      date_of_birth: '2010-01-01',
      enrollment_status: 'enrolled',
    });

    if (insertErr) {
      setError(insertErr.message);
    } else {
      setNewFirst('');
      setNewLast('');
      setNewMiddle('');
      setNewLrn('');
      setNewSex('Male');
      setShowAddForm(false);
      fetchStudents();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student? This cannot be undone.')) return;
    await supabase.from('students').delete().eq('id', id);
    fetchStudents();
  };

  const inputClass =
    'block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:text-white';

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6 text-blue-600" />
            My Students
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {students.length} student{students.length !== 1 ? 's' : ''}
            {tier === 'free' && ` / ${maxStudents} max`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isAtLimit}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
          You've reached the free tier limit of {maxStudents} students.{' '}
          <button className="font-semibold underline" onClick={() => setShowUpgrade(true)}>Upgrade to Pro</button> for unlimited students.
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Add student form (inline) */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Add New Student</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input
              type="text" required placeholder="First Name"
              value={newFirst} onChange={(e) => setNewFirst(e.target.value)}
              className={inputClass}
            />
            <input
              type="text" required placeholder="Last Name"
              value={newLast} onChange={(e) => setNewLast(e.target.value)}
              className={inputClass}
            />
            <input
              type="text" placeholder="Middle Name"
              value={newMiddle} onChange={(e) => setNewMiddle(e.target.value)}
              className={inputClass}
            />
            <input
              type="text" placeholder="LRN"
              value={newLrn} onChange={(e) => setNewLrn(e.target.value)}
              className={inputClass}
            />
            <select
              value={newSex} onChange={(e) => setNewSex(e.target.value)}
              className={inputClass}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="submit" disabled={saving}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Student table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading students...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <UserGroupIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {students.length === 0 ? 'No students yet. Add your first student above.' : 'No students match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">LRN</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Sex</th>
                <th className="text-right px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-white">
                    {s.lastName}, {s.firstName} {s.middleName || ''}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                    {s.lrn || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                    {s.sex || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Delete student"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} currentTier={tier} />
    </div>
  );
};

export default PersonalStudents;
