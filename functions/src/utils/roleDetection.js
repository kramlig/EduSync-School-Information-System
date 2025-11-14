/**
 * Role Detection Utility
 * 
 * Determines user role based on email domain and patterns.
 * Used by auto-onboarding Cloud Function.
 */

/**
 * Determine role from email address
 * 
 * @param {string} email - User's email address
 * @returns {string} - Role: 'admin', 'principal', 'registrar', 'teacher', or 'parent'
 */
function determineRole(email) {
  if (!email || typeof email !== 'string') {
    return 'parent'; // Default fallback
  }

  const emailLower = email.toLowerCase();
  
  // Special case: Developer/Owner accounts
  // Add your own email here for testing
  if (emailLower === 'kramlig.dotillos@gmail.com') {
    return 'admin'; // Set to 'admin' or 'teacher' as needed
  }
  
  // Admin Detection
  // Pattern: admin@*, admin-*, *admin@*, *-admin@*
  if (
    emailLower.startsWith('admin@') ||
    emailLower.startsWith('admin-') ||   // NEW: Matches admin-test@*
    emailLower.includes('.admin@') ||
    emailLower.includes('-admin@') ||
    emailLower.match(/^admin\d+@/)       // Matches admin1@, admin123@
  ) {
    return 'admin';
  }

  // Principal Detection
  // Pattern: principal@*, head@*, director@*
  if (
    emailLower.startsWith('principal@') ||
    emailLower.startsWith('head@') ||
    emailLower.startsWith('director@') ||
    emailLower.includes('.principal@') ||
    emailLower.includes('.head@')
  ) {
    return 'principal';
  }

  // Registrar Detection
  // Pattern: registrar@*, enrollment@*, admissions@*
  if (
    emailLower.startsWith('registrar@') ||
    emailLower.startsWith('enrollment@') ||
    emailLower.startsWith('admissions@') ||
    emailLower.includes('.registrar@')
  ) {
    return 'registrar';
  }

  // Teacher Detection
  // Pattern: teacher@*, teacher-*, faculty@*, *.teacher@*, staff@*, *@teacher.local, *@teacher.*
  if (
    emailLower.startsWith('teacher@') ||
    emailLower.startsWith('teacher-') ||  // NEW: Matches teacher-test@*, teacher-john@*
    emailLower.startsWith('faculty@') ||
    emailLower.startsWith('faculty-') ||  // NEW: Matches faculty-test@*
    emailLower.startsWith('staff@') ||
    emailLower.includes('.teacher@') ||
    emailLower.includes('-teacher@') ||
    emailLower.includes('.faculty@') ||
    emailLower.includes('@teacher.') ||   // NEW: Matches *@teacher.local, *@teacher.com
    emailLower.match(/^teacher\d+@/) ||    // Matches teacher1@, teacher123@
    emailLower.match(/^faculty\d+@/)
  ) {
    return 'teacher';
  }

  // Student Detection
  // Pattern: student@*, *@student.local, *@student.*, student-*
  if (
    emailLower.startsWith('student@') ||
    emailLower.startsWith('student-') ||
    emailLower.includes('@student.') ||  // Matches *@student.local, *@student.com
    emailLower.match(/^student\d+@/)     // Matches student1@, student123@
  ) {
    return 'student';
  }

  // Parent Detection (default)
  // Pattern: parent@*, guardian@*, or any other email
  // This is the default fallback for public registrations
  return 'parent';
}

/**
 * Validate if a role is valid
 * 
 * @param {string} role - Role to validate
 * @returns {boolean} - True if valid
 */
function isValidRole(role) {
  const validRoles = ['admin', 'principal', 'registrar', 'teacher', 'student', 'parent'];
  return validRoles.includes(role);
}

/**
 * Get role priority (for conflict resolution)
 * Higher number = higher priority
 * 
 * @param {string} role - Role name
 * @returns {number} - Priority level
 */
function getRolePriority(role) {
  const priorities = {
    'admin': 5,
    'principal': 4,
    'registrar': 3,
    'teacher': 2,
    'parent': 1
  };
  return priorities[role] || 0;
}

module.exports = {
  determineRole,
  isValidRole,
  getRolePriority
};
