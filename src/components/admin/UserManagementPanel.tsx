/**
 * UserManagementPanel - Admin User Management Interface
 * 
 * A clean, robust implementation for creating and managing user accounts.
 * Uses Firebase Admin SDK pattern with proper session handling.
 * 
 * Key Features:
 * - Create teacher, student, and registrar accounts
 * - Search, filter, and paginate users
 * - Proper error handling with messages inside modals
 * - Session-safe user creation (admin stays logged in)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  createTeacherWithRole, 
  createStudentWithRole,
  createRegistrarWithRole,
  CreateUserWithRoleResult
} from '../../services/userManagement';
import { getFirestoreInstance } from '../../services/firestoreService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

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
}

type CreationMode = 'teacher' | 'student' | 'registrar' | null;

interface TeacherForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName: string;
  contactNumber: string;
  adminPassword: string;
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
  adminPassword: string;
}

interface RegistrarForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  adminPassword: string;
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
  contactNumber: '',
  adminPassword: ''
};

const INITIAL_STUDENT_FORM: StudentForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  middleName: '',
  lrn: '',
  gradeLevel: 7,
  birthdate: '',
  adminPassword: ''
};

const INITIAL_REGISTRAR_FORM: RegistrarForm = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  adminPassword: ''
};

const ITEMS_PER_PAGE = 10;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getRoleBadgeClasses = (role: string): string => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
  switch (role) {
    case 'admin':
    case 'superadmin':
      return `${baseClasses} bg-purple-100 text-purple-800`;
    case 'teacher':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'student':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'registrar':
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case 'parent':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserManagementPanel: React.FC = () => {
  // ---------------------------------------------------------------------------
  // AUTH STATE - Get role and schoolId from Firebase Auth
  // ---------------------------------------------------------------------------
  const auth = getAuth();
  
  // Track current user and admin email
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [adminEmail, setAdminEmail] = useState<string>(auth.currentUser?.email || '');
  
  // Get role from custom claims (set by Cloud Function)
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentSchoolId, setCurrentSchoolId] = useState<string>('default');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Session restoration state - prevents permission denied flash during user creation
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  
  // Store the expected admin email during session restoration
  const [expectedAdminEmail, setExpectedAdminEmail] = useState<string>('');
  
  // Track if session was lost (wrong admin password) - need user to re-login
  const [sessionLost, setSessionLost] = useState(false);
  
  // Listen to auth state changes - handles session restoration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[UserManagement] Auth state changed:', user?.email || 'null');
      setCurrentUser(user);
      
      if (user) {
        try {
          // Force refresh to get latest claims
          const idTokenResult = await user.getIdTokenResult(true);
          const claims = idTokenResult.claims;
          const role = (claims.role as string) || '';
          console.log('[UserManagement] Claims loaded:', { email: user.email, role, schoolId: claims.schoolId });
          
          setCurrentRole(role);
          setCurrentSchoolId((claims.schoolId as string) || 'default');
          
          // Update adminEmail only if this is an admin user
          if (role === 'admin' || role === 'superadmin') {
            setAdminEmail(user.email || '');
          }
          
          // If we're restoring session and admin is back, clear the flag
          if (isRestoringSession && expectedAdminEmail && user.email === expectedAdminEmail) {
            console.log('[UserManagement] ✅ Admin session restored successfully');
            setIsRestoringSession(false);
            setExpectedAdminEmail('');
          }
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
  }, [auth, isRestoringSession, expectedAdminEmail]);
  
  // Safety timeout: if session restoration takes too long, clear the flag
  // This prevents permanent lockout if session restoration fails silently
  useEffect(() => {
    if (!isRestoringSession) return;
    
    const timeoutId = setTimeout(() => {
      console.warn('[UserManagement] ⚠️ Session restoration timeout - clearing flag');
      setIsRestoringSession(false);
      setExpectedAdminEmail('');
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isRestoringSession]);
  
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  
  // User list state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Creation modal state
  const [creationMode, setCreationMode] = useState<CreationMode>(null);
  const [creationLoading, setCreationLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  
  // Form state
  const [teacherForm, setTeacherForm] = useState<TeacherForm>(INITIAL_TEACHER_FORM);
  const [studentForm, setStudentForm] = useState<StudentForm>(INITIAL_STUDENT_FORM);
  const [registrarForm, setRegistrarForm] = useState<RegistrarForm>(INITIAL_REGISTRAR_FORM);
  
  // ---------------------------------------------------------------------------
  // DERIVED STATE
  // ---------------------------------------------------------------------------
  
  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesName = user.displayName?.toLowerCase().includes(query);
        const matchesRole = user.role?.toLowerCase().includes(query);
        if (!matchesEmail && !matchesName && !matchesRole) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by creation date, newest first
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [users, roleFilter, searchQuery]);
  
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);
  
  // ---------------------------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------------------------
  
  const loadUsers = useCallback(async () => {
    if (!currentSchoolId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const db = getFirestoreInstance();
      const userRolesRef = collection(db, 'userRoles');
      const q = query(userRolesRef, where('schoolId', '==', currentSchoolId));
      const snapshot = await getDocs(q);
      
      const userList: UserAccount[] = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        displayName: doc.data().displayName || null,
        role: doc.data().role || 'unknown',
        schoolId: doc.data().schoolId || '',
        createdAt: doc.data().createdAt
      }));
      
      setUsers(userList);
    } catch (err: any) {
      console.error('[UserManagement] Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentSchoolId]);
  
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);
  
  // ---------------------------------------------------------------------------
  // MODAL HANDLERS
  // ---------------------------------------------------------------------------
  
  const openModal = (mode: CreationMode) => {
    setCreationMode(mode);
    setModalError(null);
    setModalSuccess(null);
    // Reset forms
    setTeacherForm(INITIAL_TEACHER_FORM);
    setStudentForm(INITIAL_STUDENT_FORM);
    setRegistrarForm(INITIAL_REGISTRAR_FORM);
  };
  
  const closeModal = () => {
    if (!creationLoading) {
      setCreationMode(null);
      setModalError(null);
      setModalSuccess(null);
    }
  };
  
  // ---------------------------------------------------------------------------
  // USER CREATION HANDLERS
  // ---------------------------------------------------------------------------
  
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    // Validate admin password
    if (!teacherForm.adminPassword) {
      setModalError('Please enter your admin password to create this account');
      return;
    }
    
    if (!adminEmail) {
      setModalError('Could not determine your admin email. Please refresh and try again.');
      return;
    }
    
    try {
      setCreationLoading(true);
      setExpectedAdminEmail(adminEmail); // Track expected admin for session restoration
      setIsRestoringSession(true);
      
      const result: CreateUserWithRoleResult = await createTeacherWithRole({
        email: teacherForm.email,
        password: teacherForm.password,
        schoolId: currentSchoolId,
        displayName: `${teacherForm.firstName} ${teacherForm.lastName}`.trim(),
        firstName: teacherForm.firstName,
        lastName: teacherForm.lastName,
        middleName: teacherForm.middleName,
        contactNumber: teacherForm.contactNumber
      }, { email: adminEmail, password: teacherForm.adminPassword });
      
      if (result.success) {
        // Check if session restoration failed (user created but admin locked out)
        if (result.requiresReauth || result.error) {
          setModalError(result.error || 'User created but could not restore your session. Please log in again.');
          // Keep isRestoringSession true so permission check doesn't block the modal
          setSessionLost(true);
          return;
        }
        
        setModalSuccess(`✅ Teacher account created! Email: ${teacherForm.email}`);
        setTeacherForm(INITIAL_TEACHER_FORM);
        
        // Reload users and close modal after delay
        // Note: isRestoringSession will be cleared by onAuthStateChanged when admin is back
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
          // Note: isRestoringSession cleared by onAuthStateChanged when admin restores
        }, 2000);
      } else {
        setModalError(result.error || 'Failed to create teacher account');
        setIsRestoringSession(false);
        setExpectedAdminEmail('');
      }
    } catch (err: any) {
      console.error('[UserManagement] Error creating teacher:', err);
      setModalError(err.message || 'An unexpected error occurred');
      setIsRestoringSession(false);
      setExpectedAdminEmail('');
    } finally {
      setCreationLoading(false);
    }
  };
  
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    if (!studentForm.adminPassword) {
      setModalError('Please enter your admin password to create this account');
      return;
    }
    
    if (!adminEmail) {
      setModalError('Could not determine your admin email. Please refresh and try again.');
      return;
    }
    
    // Validate LRN format
    if (!/^\d{12}$/.test(studentForm.lrn)) {
      setModalError('LRN must be exactly 12 digits');
      return;
    }
    
    try {
      setCreationLoading(true);
      setExpectedAdminEmail(adminEmail); // Track expected admin for session restoration
      setIsRestoringSession(true);
      
      console.log('[UserManagementPanel] Creating student with params:', {
        email: studentForm.email,
        schoolId: currentSchoolId,
        lrn: studentForm.lrn,
        gradeLevel: studentForm.gradeLevel,
        firstName: studentForm.firstName,
        lastName: studentForm.lastName
      });
      
      const result: CreateUserWithRoleResult = await createStudentWithRole({
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
      }, { email: adminEmail, password: studentForm.adminPassword });
      
      console.log('[UserManagementPanel] createStudentWithRole result:', result);
      
      if (result.success) {
        // Check if session restoration failed (user created but admin locked out)
        if (result.requiresReauth || result.error) {
          console.log('[UserManagementPanel] Session restoration issue:', result.error);
          setModalError(result.error || 'User created but could not restore your session. Please log in again.');
          // Keep isRestoringSession true so permission check doesn't block the modal
          // Set sessionLost to show the "Return to Login" button
          setSessionLost(true);
          return;
        }
        
        setModalSuccess(`✅ Student account created! LRN: ${studentForm.lrn}`);
        setStudentForm(INITIAL_STUDENT_FORM);
        
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
          // Note: isRestoringSession cleared by onAuthStateChanged when admin restores
        }, 2000);
      } else {
        console.log('[UserManagementPanel] Student creation failed:', result.error);
        setModalError(result.error || 'Failed to create student account');
        setIsRestoringSession(false);
        setExpectedAdminEmail('');
      }
    } catch (err: any) {
      console.error('[UserManagementPanel] Error creating student:', err);
      setModalError(err.message || 'An unexpected error occurred');
      setIsRestoringSession(false);
      setExpectedAdminEmail('');
    } finally {
      setCreationLoading(false);
    }
  };
  
  const handleCreateRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    
    if (!registrarForm.adminPassword) {
      setModalError('Please enter your admin password to create this account');
      return;
    }
    
    if (!adminEmail) {
      setModalError('Could not determine your admin email. Please refresh and try again.');
      return;
    }
    
    try {
      setCreationLoading(true);
      setExpectedAdminEmail(adminEmail); // Track expected admin for session restoration
      setIsRestoringSession(true);
      
      const result: CreateUserWithRoleResult = await createRegistrarWithRole({
        email: registrarForm.email,
        password: registrarForm.password,
        schoolId: currentSchoolId,
        displayName: `${registrarForm.firstName} ${registrarForm.lastName}`.trim(),
        firstName: registrarForm.firstName,
        lastName: registrarForm.lastName
      }, { email: adminEmail, password: registrarForm.adminPassword });
      
      if (result.success) {
        // Check if session restoration failed (user created but admin locked out)
        if (result.requiresReauth || result.error) {
          setModalError(result.error || 'User created but could not restore your session. Please log in again.');
          // Keep isRestoringSession true so permission check doesn't block the modal
          setSessionLost(true);
          return;
        }
        
        setModalSuccess(`✅ Registrar account created! Email: ${registrarForm.email}`);
        setRegistrarForm(INITIAL_REGISTRAR_FORM);
        
        setTimeout(() => {
          loadUsers();
          setCreationMode(null);
          setModalSuccess(null);
          // Note: isRestoringSession cleared by onAuthStateChanged when admin restores
        }, 2000);
      } else {
        setModalError(result.error || 'Failed to create registrar account');
        setIsRestoringSession(false);
        setExpectedAdminEmail('');
      }
    } catch (err: any) {
      console.error('[UserManagement] Error creating registrar:', err);
      setModalError(err.message || 'An unexpected error occurred');
      setIsRestoringSession(false);
      setExpectedAdminEmail('');
    } finally {
      setCreationLoading(false);
    }
  };
  
  // ---------------------------------------------------------------------------
  // PERMISSION CHECK
  // ---------------------------------------------------------------------------
  
  // Show loading while checking auth
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
  
  // Allow access during session restoration to prevent flash of error
  if (!isRestoringSession && currentRole !== 'admin' && currentRole !== 'superadmin') {
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
        
        {/* Create User Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openModal('teacher')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>👨‍🏫</span>
            <span>Add Teacher</span>
          </button>
          <button
            onClick={() => openModal('student')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <span>🎓</span>
            <span>Add Student</span>
          </button>
          <button
            onClick={() => openModal('registrar')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <span>📋</span>
            <span>Add Registrar</span>
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="registrar">Registrar</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {searchQuery || roleFilter !== 'all' 
                ? 'No users match your search criteria'
                : 'No users found. Start by creating a user account.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getRoleBadgeClasses(user.role)}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of{' '}
                  {filteredUsers.length} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* ========================================================================= */}
      {/* CREATE TEACHER MODAL */}
      {/* ========================================================================= */}
      {creationMode === 'teacher' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Teacher Account</h2>
                <button
                  onClick={closeModal}
                  disabled={creationLoading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Modal Messages */}
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                  {sessionLost && (
                    <button
                      onClick={() => {
                        getAuth().signOut().then(() => {
                          window.location.href = '/login';
                        });
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Return to Login
                    </button>
                  )}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={teacherForm.firstName}
                      onChange={(e) => setTeacherForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={teacherForm.lastName}
                      onChange={(e) => setTeacherForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Dela Cruz"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={teacherForm.middleName}
                    onChange={(e) => setTeacherForm(f => ({...f, middleName: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={teacherForm.contactNumber}
                    onChange={(e) => setTeacherForm(f => ({...f, contactNumber: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="09171234567"
                  />
                </div>
                
                {/* Admin Password Section */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={teacherForm.adminPassword}
                    onChange={(e) => setTeacherForm(f => ({...f, adminPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required to keep you logged in after creating the account
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creationLoading ? 'Creating...' : 'Create Teacher'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
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
                <button
                  onClick={closeModal}
                  disabled={creationLoading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Modal Messages */}
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                  {sessionLost && (
                    <button
                      onClick={() => {
                        // Sign out and redirect to login
                        getAuth().signOut().then(() => {
                          window.location.href = '/login';
                        });
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Return to Login
                    </button>
                  )}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LRN (Learner Reference Number) *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.firstName}
                      onChange={(e) => setStudentForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Maria"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.lastName}
                      onChange={(e) => setStudentForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Santos"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade Level *
                    </label>
                    <select
                      required
                      value={studentForm.gradeLevel}
                      onChange={(e) => setStudentForm(f => ({...f, gradeLevel: Number(e.target.value)}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      aria-label="Grade Level"
                    >
                      {[7, 8, 9, 10, 11, 12].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birthdate *
                    </label>
                    <input
                      type="date"
                      required
                      value={studentForm.birthdate}
                      onChange={(e) => setStudentForm(f => ({...f, birthdate: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                {/* Admin Password Section */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={studentForm.adminPassword}
                    onChange={(e) => setStudentForm(f => ({...f, adminPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required to keep you logged in after creating the account
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creationLoading ? 'Creating...' : 'Create Student'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
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
                <button
                  onClick={closeModal}
                  disabled={creationLoading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Modal Messages */}
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">❌ {modalError}</p>
                  {sessionLost && (
                    <button
                      onClick={() => {
                        getAuth().signOut().then(() => {
                          window.location.href = '/login';
                        });
                      }}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Return to Login
                    </button>
                  )}
                </div>
              )}
              {modalSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 text-sm">{modalSuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateRegistrar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registrarForm.firstName}
                      onChange={(e) => setRegistrarForm(f => ({...f, firstName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Ana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={registrarForm.lastName}
                      onChange={(e) => setRegistrarForm(f => ({...f, lastName: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Reyes"
                    />
                  </div>
                </div>
                
                {/* Admin Password Section */}
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={registrarForm.adminPassword}
                    onChange={(e) => setRegistrarForm(f => ({...f, adminPassword: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required to keep you logged in after creating the account
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creationLoading}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creationLoading ? 'Creating...' : 'Create Registrar'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={creationLoading}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
