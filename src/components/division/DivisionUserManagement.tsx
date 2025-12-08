/**
 * DivisionUserManagement - Manage division users
 * 
 * Allows division admins to:
 * - View all division users
 * - Add new division users
 * - Edit existing users
 * - Deactivate/delete users
 * - Debounced search for better performance
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDivisionContext } from '../../contexts/DivisionContext';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  getDivisionUsers,
  createDivisionUser,
  updateDivisionUser,
  deleteDivisionUser,
  getDistrictsByDivision,
} from '../../services/divisionService';
import {
  logCreate,
  logUpdate,
  logDelete,
} from '../../services/divisionAuditService';
import type {
  DivisionUser,
  DivisionUserRole,
  District,
  CreateDivisionUserInput,
  UpdateDivisionUserInput,
  ModulePermissions,
} from '../../types/division';
import { DEFAULT_PERMISSIONS_BY_ROLE } from '../../types/division';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { TableSkeleton } from './common';

// =====================================================
// CONSTANTS
// =====================================================

const ROLE_OPTIONS: { value: DivisionUserRole; label: string; description: string }[] = [
  { value: 'division_admin', label: 'Division Admin', description: 'Full access to all division features' },
  { value: 'division_supervisor', label: 'Division Supervisor', description: 'View access + reports' },
  { value: 'division_data_manager', label: 'Data Manager', description: 'Manage data consolidation' },
  { value: 'psds', label: 'PSDS', description: 'Public Schools District Supervisor' },
  { value: 'eps', label: 'EPS', description: 'Education Program Supervisor' },
];

const ROLE_COLORS: Record<DivisionUserRole, string> = {
  division_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  division_supervisor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  division_data_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  psds: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  eps: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const DivisionUserManagement: React.FC = () => {
  const { division, divisionUser, hasPermission, loading: contextLoading } = useDivisionContext();

  // State
  const [users, setUsers] = useState<DivisionUser[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DivisionUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<DivisionUser | null>(null);

  const canManageUsers = hasPermission('users', 'write');
  const canDeleteUsers = hasPermission('users', 'delete');

  // Fetch users
  const fetchData = useCallback(async () => {
    if (!division?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [usersData, districtsData] = await Promise.all([
        getDivisionUsers(division.id),
        getDistrictsByDivision(division.id),
      ]);

      setUsers(usersData);
      setDistricts(districtsData);
    } catch (err) {
      console.error('[DivisionUserManagement] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [division?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users by search (debounced)
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) return users;
    const query = debouncedSearch.toLowerCase();
    return users.filter(
      user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.position_title?.toLowerCase().includes(query)
    );
  }, [users, debouncedSearch]);

  // Handle add user
  const handleAddUser = useCallback(() => {
    setEditingUser(null);
    setIsModalOpen(true);
  }, []);

  // Handle edit user
  const handleEditUser = useCallback((user: DivisionUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  // Handle save user
  const handleSaveUser = useCallback(
    async (data: CreateDivisionUserInput | UpdateDivisionUserInput) => {
      try {
        if (editingUser) {
          // Update existing user
          await updateDivisionUser({ id: editingUser.id, ...data } as UpdateDivisionUserInput);
          
          // Log audit event for update
          if (division?.id && divisionUser) {
            await logUpdate(
              division.id,
              divisionUser.id,
              divisionUser.name,
              'division_user',
              editingUser.id,
              (data as UpdateDivisionUserInput).name || editingUser.name,
              'user_management',
              { name: editingUser.name, email: editingUser.email, role: editingUser.role },
              { name: (data as UpdateDivisionUserInput).name, email: (data as UpdateDivisionUserInput).email, role: (data as UpdateDivisionUserInput).role }
            );
          }
        } else {
          // Create new user
          const newUser = await createDivisionUser(data as CreateDivisionUserInput);
          
          // Log audit event for create
          if (division?.id && divisionUser && newUser) {
            await logCreate(
              division.id,
              divisionUser.id,
              divisionUser.name,
              'division_user',
              newUser.id,
              newUser.name,
              'user_management',
              { name: newUser.name, email: newUser.email, role: newUser.role }
            );
          }
        }
        setIsModalOpen(false);
        setEditingUser(null);
        await fetchData();
      } catch (err) {
        console.error('[DivisionUserManagement] Error saving user:', err);
        throw err;
      }
    },
    [editingUser, fetchData, division?.id, divisionUser]
  );

  // Handle delete user
  const handleDeleteUser = useCallback(async () => {
    if (!deleteConfirmUser) return;

    try {
      // Log audit event for delete before actually deleting
      if (division?.id && divisionUser) {
        await logDelete(
          division.id,
          divisionUser.id,
          divisionUser.name,
          'division_user',
          deleteConfirmUser.id,
          deleteConfirmUser.name,
          'user_management',
          { name: deleteConfirmUser.name, email: deleteConfirmUser.email, role: deleteConfirmUser.role }
        );
      }
      
      await deleteDivisionUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      await fetchData();
    } catch (err) {
      console.error('[DivisionUserManagement] Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }, [deleteConfirmUser, fetchData, division?.id, divisionUser]);

  // Loading state - show skeleton instead of full page loader
  if (contextLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <TableSkeleton columns={5} rows={5} showHeader={true} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Error Loading Users</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage division office personnel accounts
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={handleAddUser}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="w-5 h-5 text-blue-600" />
            Division Users {!loading && `(${filteredUsers.length})`}
          </h3>
        </div>

        {loading ? (
          <TableSkeleton columns={canManageUsers ? 6 : 5} rows={5} showHeader={true} />
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-slate-600 dark:text-slate-400 font-medium">Position</th>
                  <th className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 font-medium">Status</th>
                  {canManageUsers && (
                    <th className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {user.position_title || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckIcon className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    {canManageUsers && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit user"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {canDeleteUsers && (
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete user"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          divisionId={division!.id}
          districts={districts}
          onSave={handleSaveUser}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <DeleteConfirmModal
          user={deleteConfirmUser}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteConfirmUser(null)}
        />
      )}
    </div>
  );
};

// =====================================================
// USER FORM MODAL
// =====================================================

interface UserFormModalProps {
  user: DivisionUser | null;
  divisionId: string;
  districts: District[];
  onSave: (data: CreateDivisionUserInput | UpdateDivisionUserInput) => Promise<void>;
  onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  divisionId,
  districts,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'division_supervisor' as DivisionUserRole,
    position_title: user?.position_title || '',
    contact_phone: user?.contact_phone || '',
    assigned_district_id: user?.assigned_district_id || '',
    is_active: user?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user;
  const showDistrictField = formData.role === 'psds';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data: CreateDivisionUserInput | UpdateDivisionUserInput = {
        division_id: divisionId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        position_title: formData.position_title.trim() || undefined,
        contact_phone: formData.contact_phone.trim() || undefined,
        assigned_district_id: showDistrictField && formData.assigned_district_id ? formData.assigned_district_id : undefined,
        is_active: formData.is_active,
      };

      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Juan Carlos M. Reyes"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., juan.reyes@deped.gov.ph"
              required
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed after creation</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as DivisionUserRole }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          {/* Position Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Position Title
            </label>
            <input
              type="text"
              value={formData.position_title}
              onChange={(e) => setFormData(prev => ({ ...prev, position_title: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Education Program Specialist"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., +63 912 345 6789"
            />
          </div>

          {/* District Assignment (for PSDS) */}
          {showDistrictField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assigned District
              </label>
              <select
                value={formData.assigned_district_id}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_district_id: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a district...</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700 dark:text-slate-300">
              User is active and can log in
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================
// DELETE CONFIRM MODAL
// =====================================================

interface DeleteConfirmModalProps {
  user: DivisionUser;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  user,
  onConfirm,
  onCancel,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Delete User?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-1">
            Are you sure you want to delete this user?
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {user.name} ({user.email})
          </p>
          <p className="text-xs text-slate-500 mt-2">
            This will deactivate the account. The user will no longer be able to log in.
          </p>
        </div>

        <div className="flex border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-l border-slate-200 dark:border-slate-700 disabled:opacity-50"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DivisionUserManagement;
