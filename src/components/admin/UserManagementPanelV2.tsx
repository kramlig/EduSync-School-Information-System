/**
 * UserManagementPanel v2 - Admin User Management Interface
 * 
 * Uses Cloud Function for user creation (Admin SDK pattern).
 * Admin session is NEVER interrupted - no password re-entry needed!
 * 
 * Key Features:
 * - Create teacher, student, and registrar accounts
 * - Search, filter, and paginate users
 * - Clean error handling
 * - Admin stays logged in throughout
 * 
 * Data Source: PostgreSQL (teachers, students, parents tables)
 * Login requires firebase_uid in these tables - users without it show as "Pending Account"
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createTeacher, 
  createStudent,
  createRegistrar
} from '../../services/userManagementV2';
import { supabase } from '../../lib/supabase';
import { getAuth, onAuthStateChanged, User, sendPasswordResetEmail } from 'firebase/auth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserAccount {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  schoolId: string;
  createdAt: any;
  hasFirebaseAccount: boolean; // true = can login, false = pending account creation
  isDisabled: boolean; // true = account is disabled
  firebaseUid: string | null; // Firebase UID for auth operations
}

type CreationMode = 'teacher' | 'student' | 'registrar' | null;

interface TeacherForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName: string;
  contactNumber: string;
}

interface StudentForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName: string;
  lrn: string;
  gradeLevel: number;
  birthdate: string;
}

interface RegistrarForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_TEACHER_FORM: TeacherForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  middleName: '',
  contactNumber: ''
};

const INITIAL_STUDENT_FORM: StudentForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  middleName: '',
  lrn: '',
  gradeLevel: 7,
  birthdate: ''
};

const INITIAL_REGISTRAR_FORM: RegistrarForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: ''
};

const ITEMS_PER_PAGE = 10;

// Action modal types
type ActionType = 'reset-password' | 'disable' | 'enable' | null;

interface ActionModalState {
  isOpen: boolean;
  type: ActionType;
  user: UserAccount | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

const UserManagementPanel: React.FC = () => {
  const navigate = useNavigate();
  // ---------------------------------------------------------------------------
  // AUTH STATE
  // ---------------------------------------------------------------------------
  const auth = getAuth();
  const [_currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentSchoolId, setCurrentSchoolId] = useState<string>('default');
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // First check Firebase custom claims
          const idTokenResult = await user.getIdTokenResult(true);
          const claims = idTokenResult.claims;
          let role = (claims.role as string) || '';
          let schoolId = (claims.schoolId as string) || 'default';
          
          // Also check localStorage session for superadmin role (Option A architecture)
          const sessionStr = localStorage.getItem('edusync_session');
          if (sessionStr) {
            try {
              const session = JSON.parse(sessionStr);
              if (session?.user?.role === 'superadmin') {
                role = 'superadmin';
              }
              if (session?.user?.schoolId) {
                schoolId = session.user.schoolId;
              }
            } catch (e) {
              console.warn('[UserManagement] Error parsing session:', e);
            }
          }
          
          setCurrentRole(role);
          setCurrentSchoolId(schoolId);
        } catch (err) {
          console.error('[UserManagement] Error loading claims:', err);
        }
      } else {
        setCurrentRole('');
        setCurrentSchoolId('default');
      }
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth]);
  
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [creationLoading, setCreationLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  
  const [teacherForm, setTeacherForm] = useState<TeacherForm>(INITIAL_TEACHER_FORM);
  const [studentForm, setStudentForm] = useState<StudentForm>(INITIAL_STUDENT_FORM);
  const [registrarForm, setRegistrarForm] = useState<RegistrarForm>(INITIAL_REGISTRAR_FORM);
  
  // Action modal state
  const [actionModal, setActionModal] = useState<ActionModalState>({
    isOpen: false,
    type: null,
    user: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return user.email?.toLowerCase().includes(q) || 
               user.displayName?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);
  
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // ---------------------------------------------------------------------------
  // LOAD USERS FROM POSTGRESQL
  // ---------------------------------------------------------------------------
  
  const loadUsers = useCallback(async () => {
    if (!currentSchoolId || currentSchoolId === 'default') {
      console.warn('[UserManagement] No valid schoolId, skipping load');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const userList: UserAccount[] = [];
      
      // Fetch teachers from PostgreSQL
      const { data: teachers, error: teacherError } = await supabase
        .from('teachers')
        .select('id, name, email, firebase_uid, role, school_id, created_at, disabled_at')
        .eq('school_id', currentSchoolId)
        .is('deleted_at', null);
      
      if (teacherError) {
        console.error('[UserManagement] Error fetching teachers:', teacherError);
      } else if (teachers) {
        teachers.forEach(t => {
          userList.push({
            id: t.id,
            email: t.email || '',
            displayName: t.name || null,
            role: t.role || 'teacher',
            schoolId: t.school_id || '',
            createdAt: t.created_at,
            hasFirebaseAccount: !!t.firebase_uid,
            isDisabled: !!t.disabled_at,
            firebaseUid: t.firebase_uid || null
          });
        });
      }
      
      // Fetch students from PostgreSQL
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, email, firebase_uid, school_id, created_at, disabled_at')
        .eq('school_id', currentSchoolId);
      
      if (studentError) {
        console.error('[UserManagement] Error fetching students:', studentError);
      } else if (students) {
        students.forEach(s => {
          userList.push({
            id: s.id,
            email: s.email || '',
            displayName: s.name || null,
            role: 'student',
            schoolId: s.school_id || '',
            createdAt: s.created_at,
            hasFirebaseAccount: !!s.firebase_uid,
            isDisabled: !!s.disabled_at,
            firebaseUid: s.firebase_uid || null
          });
        });
      }
      
      // Sort by creation date (newest first)
      userList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setUsers(userList);
      setError(null);
    } catch (err: any) {
      console.error('[UserManagement] Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentSchoolId]);
  
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // ---------------------------------------------------------------------------
  // MODAL HELPERS
  // ---------------------------------------------------------------------------
  
  const closeModal = () => {
    if (creationLoading) return;
    setCreationMode(null);
    setModalError(null);
    setModalSuccess(null);
    setTeacherForm(INITIAL_TEACHER_FORM);
    setStudentForm(INITIAL_STUDENT_FORM);
    setRegistrarForm(INITIAL_REGISTRAR_FORM);
  };
  
  // ---------------------------------------------------------------------------
  // ACTION HANDLERS (Reset Password, Disable/Enable Account)
  // ---------------------------------------------------------------------------
  
  const openActionModal = (type: ActionType, user: UserAccount) => {
    setActionModal({ isOpen: true, type, user });
    setActionMessage(null);
  };
  
  const closeActionModal = () => {
    if (actionLoading) return;
    setActionModal({ isOpen: false, type: null, user: null });
    setActionMessage(null);
  };
  
  const handleResetPassword = async () => {
    if (!actionModal.user?.email) return;
    
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      await sendPasswordResetEmail(auth, actionModal.user.email);
      setActionMessage({ 
        type: 'success', 
        text: `Password reset email sent to ${actionModal.user.email}` 
      });
      
      setTimeout(() => {
        closeActionModal();
      }, 2000);
    } catch (err: any) {
      console.error('[UserManagement] Reset password error:', err);
      setActionMessage({ 
        type: 'error', 
        text: err.message || 'Failed to send password reset email' 
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleToggleDisable = async () => {
    if (!actionModal.user) return;
    
    setActionLoading(true);
    setActionMessage(null);
    
    const tableName = actionModal.user.role === 'student' ? 'students' : 'teachers';
    const newDisabledAt = actionModal.user.isDisabled ? null : new Date().toISOString();
    
    try {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ disabled_at: newDisabledAt })
        .eq('id', actionModal.user.id);
      
      if (updateError) throw updateError;
      
      const action = actionModal.user.isDisabled ? 'enabled' : 'disabled';
      setActionMessage({ 
        type: 'success', 
        text: `Account ${action} successfully` 
      });
      
      // Refresh the user list
      loadUsers();
      
      setTimeout(() => {
        closeActionModal();
      }, 1500);
    } catch (err: any) {
      console.error('[UserManagement] Toggle disable error:', err);
      setActionMessage({ 
        type: 'error', 
        text: err.message || 'Failed to update account status' 
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleEditProfile = (user: UserAccount) => {
    if (user.role === 'teacher' || user.role === 'admin' || user.role === 'registrar') {
      navigate('/teachers');
    } else if (user.role === 'student') {
      navigate('/students');
    } else if (user.role === 'parent') {
      navigate('/parents');
    }
  };
  
  // ---------------------------------------------------------------------------
  // CREATE HANDLERS (Using Cloud Function - No Password Required!)
  // ---------------------------------------------------------------------------
  
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    try {
      setCreationLoading(true);
      
      const result = await createTeacher({
        email: teacherForm.email,
        password: teacherForm.password,
        schoolId: currentSchoolId,
        displayName: `${teacherForm.firstName} ${teacherForm.lastName}`.trim(),
        firstName: teacherForm.firstName,
        lastName: teacherForm.lastName,
        middleName: teacherForm.middleName,
        contactNumber: teacherForm.contactNumber
      });
      
      if (result.success) {
        setModalSuccess(`✅ Teacher account created! Email: ${teacherForm.email}`);
        setTeacherForm(INITIAL_TEACHER_FORM);
        
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
        }, 2000);
      } else {
        setModalError(result.error || 'Failed to create teacher account');
      }
    } catch (err: any) {
      console.error('[UserManagement] Error creating teacher:', err);
      setModalError(err.message || 'An unexpected error occurred');
    } finally {
      setCreationLoading(false);
    }
  };
  
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    if (!/^\d{12}$/.test(studentForm.lrn)) {
      setModalError('LRN must be exactly 12 digits');
      return;
    }
    
    try {
      setCreationLoading(true);
      
      const result = await createStudent({
        email: studentForm.email,
        password: studentForm.password,
        schoolId: currentSchoolId,
        displayName: `${studentForm.firstName} ${studentForm.lastName}`.trim(),
        lrn: studentForm.lrn,
        gradeLevel: studentForm.gradeLevel,
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        middleName: studentForm.middleName,
        birthdate: studentForm.birthdate
      });
      
      if (result.success) {
        setModalSuccess(`✅ Student account created! LRN: ${studentForm.lrn}`);
        setStudentForm(INITIAL_STUDENT_FORM);
        
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
        }, 2000);
      } else {
        setModalError(result.error || 'Failed to create student account');
      }
    } catch (err: any) {
      console.error('[UserManagement] Error creating student:', err);
      setModalError(err.message || 'An unexpected error occurred');
    } finally {
      setCreationLoading(false);
    }
  };
  
  const handleCreateRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    try {
      setCreationLoading(true);
      
      const result = await createRegistrar({
        email: registrarForm.email,
        password: registrarForm.password,
        schoolId: currentSchoolId,
        displayName: `${registrarForm.firstName} ${registrarForm.lastName}`.trim(),
        firstName: registrarForm.firstName,
        lastName: registrarForm.lastName
      });
      
      if (result.success) {
        setModalSuccess(`✅ Registrar account created! Email: ${registrarForm.email}`);
        setRegistrarForm(INITIAL_REGISTRAR_FORM);
        
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
        }, 2000);
      } else {
        setModalError(result.error || 'Failed to create registrar account');
      }
    } catch (err: any) {
      console.error('[UserManagement] Error creating registrar:', err);
      setModalError(err.message || 'An unexpected error occurred');
    } finally {
      setCreationLoading(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // PERMISSION CHECK
  // ---------------------------------------------------------------------------
  
  if (authLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (currentRole !== 'admin' && currentRole !== 'superadmin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 flex items-center gap-2">
            <span>⚠️</span>
            <span>You don't have permission to access this page.</span>
          </p>
          <p className="text-sm text-red-600 mt-2">
            Only administrators can manage user accounts.
          </p>
        </div>
      </div>
    );
  }
  
  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage user accounts for your school
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCreationMode('teacher')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>👨‍🏫</span> Add Teacher
          </button>
          <button
            onClick={() => setCreationMode('student')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>🎓</span> Add Student
          </button>
          <button
            onClick={() => setCreationMode('registrar')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <span>📋</span> Add Registrar
          </button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="teacher">Teachers</option>
          <option value="student">Students</option>
          <option value="registrar">Registrars</option>
          <option value="parent">Parents</option>
        </select>
      </div>
      
      {/* User List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading users...</span>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${user.isDisabled ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email || <span className="text-gray-400 italic">No email</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.displayName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'student' ? 'bg-green-100 text-green-800' :
                          user.role === 'registrar' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isDisabled ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            🚫 Disabled
                          </span>
                        ) : user.hasFirebaseAccount ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            ✓ Can Login
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Reset Password - only if has Firebase account and email */}
                          {user.hasFirebaseAccount && user.email && (
                            <button
                              onClick={() => openActionModal('reset-password', user)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Send Password Reset Email"
                            >
                              🔑
                            </button>
                          )}
                          
                          {/* Disable/Enable Account */}
                          <button
                            onClick={() => openActionModal(user.isDisabled ? 'enable' : 'disable', user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isDisabled 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                            title={user.isDisabled ? 'Enable Account' : 'Disable Account'}
                          >
                            {user.isDisabled ? '✅' : '🚫'}
                          </button>
                          
                          {/* Edit Profile Link - Only for school admins, not superadmins */}
                          {currentRole !== 'superadmin' && (
                            <button
                              onClick={() => handleEditProfile(user)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Profile"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* ========================================================================= */}
      {/* CREATE TEACHER MODAL */}
      {/* ========================================================================= */}
      {creationMode === 'teacher' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Teacher Account</h2>
                <button onClick={closeModal} disabled={creationLoading} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm(f => ({...f, email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="teacher@school.edu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm(f => ({...f, password: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.firstName}
                      onChange={(e) => setTeacherForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={teacherForm.lastName}
                      onChange={(e) => setTeacherForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={teacherForm.middleName}
                    onChange={(e) => setTeacherForm(f => ({...f, middleName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={teacherForm.contactNumber}
                    onChange={(e) => setTeacherForm(f => ({...f, contactNumber: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="09171234567"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Teacher'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================================================= */}
      {/* CREATE STUDENT MODAL */}
      {/* ========================================================================= */}
      {creationMode === 'student' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Student Account</h2>
                <button onClick={closeModal} disabled={creationLoading} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LRN (Learner Reference Number) *</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{12}"
                    maxLength={12}
                    value={studentForm.lrn}
                    onChange={(e) => setStudentForm(f => ({...f, lrn: e.target.value.replace(/\D/g, '')}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="123456789012 (12 digits)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(f => ({...f, email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="student@school.edu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={studentForm.password}
                    onChange={(e) => setStudentForm(f => ({...f, password: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={studentForm.middleName}
                    onChange={(e) => setStudentForm(f => ({...f, middleName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                    <select
                      required
                      value={studentForm.gradeLevel}
                      onChange={(e) => setStudentForm(f => ({...f, gradeLevel: Number(e.target.value)}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {[7, 8, 9, 10, 11, 12].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate *</label>
                    <input
                      type="date"
                      required
                      value={studentForm.birthdate}
                      onChange={(e) => setStudentForm(f => ({...f, birthdate: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Student'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================================================= */}
      {/* CREATE REGISTRAR MODAL */}
      {/* ========================================================================= */}
      {creationMode === 'registrar' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Registrar Account</h2>
                <button onClick={closeModal} disabled={creationLoading} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateRegistrar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={registrarForm.email}
                    onChange={(e) => setRegistrarForm(f => ({...f, email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="registrar@school.edu"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registrarForm.password}
                    onChange={(e) => setRegistrarForm(f => ({...f, password: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={registrarForm.firstName}
                      onChange={(e) => setRegistrarForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={registrarForm.lastName}
                      onChange={(e) => setRegistrarForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Registrar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================================================= */}
      {/* ACTION CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {actionModal.isOpen && actionModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionModal.type === 'reset-password' && '🔑 Reset Password'}
                  {actionModal.type === 'disable' && '🚫 Disable Account'}
                  {actionModal.type === 'enable' && '✅ Enable Account'}
                </h2>
                <button 
                  onClick={closeActionModal} 
                  disabled={actionLoading} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* User Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{actionModal.user.displayName || 'Unknown'}</span>
                </p>
                <p className="text-sm text-gray-500">{actionModal.user.email}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Role: <span className="capitalize">{actionModal.user.role}</span>
                </p>
              </div>
              
              {/* Action Description */}
              <div className="mb-4">
                {actionModal.type === 'reset-password' && (
                  <p className="text-gray-600 text-sm">
                    This will send a password reset email to <strong>{actionModal.user.email}</strong>. 
                    The user will receive a link to create a new password.
                  </p>
                )}
                {actionModal.type === 'disable' && (
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">
                      Are you sure you want to disable this account?
                    </p>
                    <p className="text-orange-600 text-sm">
                      ⚠️ The user will not be able to log in until re-enabled.
                    </p>
                  </div>
                )}
                {actionModal.type === 'enable' && (
                  <p className="text-gray-600 text-sm">
                    This will re-enable the account, allowing the user to log in again.
                  </p>
                )}
              </div>
              
              {/* Messages */}
              {actionMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  actionMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    actionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {actionMessage.type === 'success' ? '✅' : '❌'} {actionMessage.text}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (actionModal.type === 'reset-password') {
                      handleResetPassword();
                    } else {
                      handleToggleDisable();
                    }
                  }}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                    actionModal.type === 'disable' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : actionModal.type === 'enable'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionModal.type === 'reset-password' && 'Send Reset Email'}
                      {actionModal.type === 'disable' && 'Disable Account'}
                      {actionModal.type === 'enable' && 'Enable Account'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
