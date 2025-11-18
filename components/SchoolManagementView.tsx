import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  query, 
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestoreInstance } from '../src/services/firestoreService';
import { createUserWithRole } from '../services/userManagement';
import Spinner from './Spinner';
import Modal from './Modal';

interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  logo?: string;
  status: 'active' | 'inactive';
  createdAt: any;
  studentCount?: number;
  teacherCount?: number;
  adminEmail?: string;
}

interface SchoolFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  adminEmail: string;
  adminPassword: string;
}

/**
 * SchoolManagementView - Super Admin Interface for Managing Multiple Schools
 * 
 * Features:
 * - View all schools with statistics
 * - Create new schools
 * - Edit school settings
 * - Assign school admins
 * - View school-specific data summaries
 */
const SchoolManagementView: React.FC = () => {
  const db = getFirestoreInstance();
  const auth = getAuth();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      
      // Get all schools
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      const schoolsList: School[] = [];

      // PERFORMANCE OPTIMIZATION: Use count aggregation instead of fetching all docs
      const { getCountFromServer } = await import('firebase/firestore');

      for (const schoolDoc of schoolsSnap.docs) {
        const schoolData = schoolDoc.data();
        
        // Use count aggregation queries (much faster than getDocs)
        const [studentCountSnap, teacherCountSnap, adminsSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'students'), where('schoolId', '==', schoolDoc.id))),
          getCountFromServer(query(collection(db, 'teachers'), where('schoolId', '==', schoolDoc.id))),
          getDocs(
            query(
              collection(db, 'teachers'),
              where('schoolId', '==', schoolDoc.id),
              where('role', '==', 'admin'),
              limit(1)
            )
          )
        ]);

        const admin = adminsSnap.docs[0]?.data();

        schoolsList.push({
          id: schoolDoc.id,
          ...schoolData,
          studentCount: studentCountSnap.data().count,
          teacherCount: teacherCountSnap.data().count,
          adminEmail: admin?.email || 'Not assigned',
        } as School);
      }

      setSchools(schoolsList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      console.error('[SchoolManagement] Error loading schools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      // 1. Create school document with embedded settings
      const schoolRef = await addDoc(collection(db, 'schools'), {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        principalName: formData.principalName,
        status: 'active',
        currentSchoolYear: '2024-2025',
        features: {
          enrollment: true,
          financial: true,
          parentPortal: true,
          aiAssistant: true,
        },
        createdAt: serverTimestamp(),
      });

      // NOTE: Settings are now embedded in the school document
      // No separate settings collection needed

      // 2. Create admin user with proper role assignment
      const userResult = await createUserWithRole({
        email: formData.adminEmail,
        password: formData.adminPassword,
        role: 'admin',
        schoolId: schoolRef.id,
        displayName: `${formData.name} Admin`,
        additionalData: {
          firstName: 'Admin',
          lastName: formData.name,
          schoolName: formData.name
        }
      });

      if (!userResult.success) {
        throw new Error(userResult.error || 'Failed to create admin user');
      }

      const userId = userResult.userId!;

      // 3. Create admin teacher document
      await addDoc(collection(db, 'teachers'), {
        uid: userId,
        schoolId: schoolRef.id,
        email: formData.adminEmail,
        firstName: 'Admin',
        lastName: formData.name,
        role: 'admin',
        status: 'active',
        createdAt: serverTimestamp(),
      });

      // Note: userRoles document is automatically created by createUserWithRole
      // No need to manually create it here

      // Success - reset form and reload schools
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        principalName: '',
        adminEmail: '',
        adminPassword: ''
      });
      setShowCreateModal(false);
      await loadSchools();
      
    } catch (err: any) {
      console.error('Error creating school:', err);
      setError(err.message || 'Failed to create school');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;
    
    setUpdating(true);
    setError(null);

    try {
      // Update school document
      const schoolsSnapshot = await getDocs(
        query(collection(db, 'schools'), where('code', '==', selectedSchool.code))
      );
      
      if (schoolsSnapshot.empty) {
        throw new Error('School not found');
      }

      const schoolDoc = schoolsSnapshot.docs[0];
      await updateDoc(doc(db, 'schools', schoolDoc.id), {
        name: editFormData.name,
        code: editFormData.code,
        address: editFormData.address,
        phone: editFormData.phone,
        email: editFormData.email,
        principalName: editFormData.principalName,
        status: editFormData.status,
        updatedAt: serverTimestamp(),
      });

      // NOTE: Settings are now stored in the schools document itself
      // No separate settings collection to update

      // Success - close modal and reload
      setShowEditModal(false);
      setSelectedSchool(null);
      await loadSchools();
      
    } catch (err: any) {
      console.error('Error updating school:', err);
      setError(err.message || 'Failed to update school');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all schools in the EduSync platform
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create New School
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div key={school.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="space-y-4">
              {/* School Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {school.name}
                  </h3>
                  <p className="text-sm text-gray-500">Code: {school.code}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    school.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {school.status}
                </span>
              </div>

              {/* School Info */}
              <div className="space-y-2 text-sm text-gray-600">
                {school.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400">📍</span>
                    <span className="flex-1">{school.address}</span>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📞</span>
                    <span>{school.phone}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">✉️</span>
                    <span>{school.email}</span>
                  </div>
                )}
                {school.principalName && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">👤</span>
                    <span>{school.principalName}</span>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {school.studentCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {school.teacherCount || 0}
                    </div>
                    <div className="text-xs text-gray-500">Teachers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {school.status === 'active' ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">School Admin</p>
                <p className="text-sm font-medium text-gray-900">
                  {school.adminEmail}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setSelectedSchool(school);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => {
                    setSelectedSchool(school);
                    setEditFormData({
                      name: school.name,
                      code: school.code,
                      address: school.address || '',
                      phone: school.phone || '',
                      email: school.email || '',
                      principalName: school.principalName || '',
                      status: school.status as 'active' | 'inactive'
                    });
                    setShowEditModal(true);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create School Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New School"
        >
          <form onSubmit={handleCreateSchool} className="space-y-4">
            {/* School Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">School Information</h3>
              
              <div>
                <label htmlFor="create-school-name" className="block text-sm font-medium text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  id="create-school-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., San Miguel Elementary School"
                />
              </div>

              <div>
                <label htmlFor="create-school-code" className="block text-sm font-medium text-gray-700 mb-1">
                  School Code *
                </label>
                <input
                  id="create-school-code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SMES-001"
                />
              </div>

              <div>
                <label htmlFor="create-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="create-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street, Barangay, City, Province"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="create-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(123) 456-7890"
                  />
                </div>

                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="school@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="create-principal-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Principal Name
                </label>
                <input
                  id="create-principal-name"
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name of school principal"
                />
              </div>
            </div>

            {/* Admin Account */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900">School Admin Account</h3>
              
              <div>
                <label htmlFor="create-admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <input
                  id="create-admin-email"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@school.com"
                />
              </div>

              <div>
                <label htmlFor="create-admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Password *
                </label>
                <input
                  id="create-admin-password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The admin can change this password after first login
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create School'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedSchool && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSchool(null);
          }}
          title={`School Details - ${selectedSchool.name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">School Code</p>
                <p className="font-medium">{selectedSchool.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedSchool.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{selectedSchool.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{selectedSchool.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedSchool.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Principal</p>
                <p className="font-medium">{selectedSchool.principalName || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedSchool.studentCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Teachers</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedSchool.teacherCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">School Admin</h4>
              <p className="text-sm text-gray-600">{selectedSchool.adminEmail}</p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedSchool(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchool && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSchool(null);
            setError(null);
          }}
          title={`Edit School - ${selectedSchool.name}`}
        >
          <form onSubmit={handleEditSchool} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-school-name" className="block text-sm font-medium text-gray-700 mb-1">
                  School Name *
                </label>
                <input
                  id="edit-school-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-school-code" className="block text-sm font-medium text-gray-700 mb-1">
                  School Code *
                </label>
                <input
                  id="edit-school-code"
                  type="text"
                  value={editFormData.code}
                  onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                id="edit-address"
                type="text"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="edit-principal-name" className="block text-sm font-medium text-gray-700 mb-1">
                Principal Name
              </label>
              <input
                id="edit-principal-name"
                type="text"
                value={editFormData.principalName}
                onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="edit-status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'inactive' })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSchool(null);
                  setError(null);
                }}
                disabled={updating}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <Spinner />
                    Updating...
                  </>
                ) : (
                  'Update School'
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SchoolManagementView;
