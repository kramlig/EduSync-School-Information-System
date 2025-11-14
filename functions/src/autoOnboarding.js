/**
 * Auto-Onboarding Cloud Functions
 * 
 * HYBRID APPROACH (Re-enabled Nov 12, 2025):
 * 
 * 1. FIRST: Check userRoles collection for explicit role assignment
 * 2. FALLBACK: Use email pattern detection only if no userRoles doc exists
 * 3. DEFAULT: Assign 'parent' role if all detection methods fail
 * 
 * This ensures:
 * - UI-based user creation can pre-create userRoles doc with intended role
 * - Backward compatibility for self-registration (parent default)
 * - No role overwriting when scripts/UI explicitly set roles
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { determineRole, isValidRole } = require('./utils/roleDetection');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

/**
 * Auto role assignment on user creation
 * 
 * PRIORITY ORDER:
 * 1. Check userRoles collection (highest priority - explicit assignment)
 * 2. Check teachers/students/parents collections by email/uid
 * 3. Email pattern detection (fallback for legacy compatibility)
 * 4. Default to 'parent' (safest default with least permissions)
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const startTime = Date.now();
  
  try {
    const { uid, email, displayName } = user;
    
    if (!email) {
      console.warn(`User ${uid} created without email. Cannot auto-assign role.`);
      return null;
    }

    console.log(`Auto-onboarding triggered for user: ${email} (${uid})`);

    // PRIORITY 1: Check if userRoles document already exists (explicit assignment)
    let role = null;
    let schoolId = 'default';
    let assignmentMethod = 'auto-detection';
    
    try {
      const userRoleDoc = await db.collection('userRoles').doc(uid).get();
      
      if (userRoleDoc.exists) {
        const roleData = userRoleDoc.data();
        if (roleData.role && isValidRole(roleData.role)) {
          role = roleData.role;
          schoolId = roleData.schoolId || 'default';
          assignmentMethod = 'pre-assigned-userRoles';
          console.log(`✅ Found pre-assigned role in userRoles: ${role} (schoolId: ${schoolId})`);
        }
      }
    } catch (userRoleError) {
      console.warn(`Error checking userRoles: ${userRoleError.message}`);
    }

    // PRIORITY 2: Check teachers/students/parents collections if no userRoles found
    if (!role) {
      try {
        // Check teachers collection by UID
        const teacherSnapshot = await db.collection('teachers')
          .where('uid', '==', uid)
          .limit(1)
          .get();
        
        if (!teacherSnapshot.empty) {
          const teacherData = teacherSnapshot.docs[0].data();
          role = teacherData.role || 'teacher';
          schoolId = teacherData.schoolId || 'default';
          assignmentMethod = 'teachers-collection-uid';
          console.log(`✅ Found teacher document by UID: role=${role}, schoolId=${schoolId}`);
        }
        
        // Check teachers by email if not found by UID
        if (!role) {
          const teacherByEmailSnapshot = await db.collection('teachers')
            .where('email', '==', email)
            .limit(1)
            .get();
          
          if (!teacherByEmailSnapshot.empty) {
            const teacherData = teacherByEmailSnapshot.docs[0].data();
            role = teacherData.role || 'teacher';
            schoolId = teacherData.schoolId || 'default';
            assignmentMethod = 'teachers-collection-email';
            console.log(`✅ Found teacher document by email: role=${role}, schoolId=${schoolId}`);
          }
        }

        // Check students collection
        if (!role) {
          const studentSnapshot = await db.collection('students')
            .where('email', '==', email)
            .limit(1)
            .get();
          
          if (!studentSnapshot.empty) {
            const studentData = studentSnapshot.docs[0].data();
            role = 'student';
            schoolId = studentData.schoolId || 'default';
            assignmentMethod = 'students-collection';
            console.log(`✅ Found student document: schoolId=${schoolId}`);
          }
        }

        // Check parents collection
        if (!role) {
          const parentSnapshot = await db.collection('parents')
            .where('email', '==', email)
            .limit(1)
            .get();
          
          if (!parentSnapshot.empty) {
            const parentData = parentSnapshot.docs[0].data();
            role = 'parent';
            schoolId = parentData.schoolId || 'default';
            assignmentMethod = 'parents-collection';
            console.log(`✅ Found parent document: schoolId=${schoolId}`);
          }
        }
      } catch (lookupError) {
        console.warn(`Error looking up user in collections: ${lookupError.message}`);
      }
    }

    // PRIORITY 3: Email pattern detection (fallback)
    if (!role) {
      role = determineRole(email);
      assignmentMethod = 'email-pattern';
      console.log(`⚠️ Using email pattern detection: ${role} for ${email}`);
    }
    
    // SAFETY: Default to 'parent' if still no valid role
    if (!isValidRole(role)) {
      console.warn(`Invalid role determined: ${role}, defaulting to 'parent'`);
      role = 'parent';
      assignmentMethod = 'default-fallback';
    }

    console.log(`Final role assignment: ${role} via ${assignmentMethod} for user ${email}`);

    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role: role,
      schoolId: schoolId,
      assignedAt: Date.now(),
      assignedBy: 'system-auto',
      method: assignmentMethod
    });

    console.log(`Custom claims set for ${email}: role=${role}, schoolId=${schoolId}`);

    // Create or update userRoles document (only if it doesn't exist or wasn't pre-assigned)
    if (assignmentMethod !== 'pre-assigned-userRoles') {
      await db.collection('userRoles').doc(uid).set({
        userId: uid,
        email: email,
        displayName: displayName || null,
        role: role,
        schoolId: schoolId,
        assignedBy: 'system-auto',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        method: assignmentMethod,
        emailPattern: getEmailPattern(email),
        documentFound: assignmentMethod.includes('collection'),
        processingTimeMs: Date.now() - startTime
      });
    } else {
      // Update timestamp for pre-assigned roles
      await db.collection('userRoles').doc(uid).update({
        claimsSetAt: admin.firestore.FieldValue.serverTimestamp(),
        processingTimeMs: Date.now() - startTime
      });
    }

    console.log(`Audit trail created/updated for ${email}`);

    try {
      await db.collection('notifications').add({
        type: 'user_onboarded',
        recipientRole: 'admin',
        title: 'New User Onboarded',
        message: `${email} was assigned role: ${role} via ${assignmentMethod}`,
        data: {
          userId: uid,
          email: email,
          role: role,
          method: assignmentMethod,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (notifError) {
      console.warn(`Failed to create notification: ${notifError.message}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ Auto-onboarding completed for ${email} in ${totalTime}ms via ${assignmentMethod}`);

    return {
      success: true,
      userId: uid,
      email: email,
      role: role,
      method: assignmentMethod,
      processingTimeMs: totalTime
    };

  } catch (error) {
    console.error('Auto-onboarding error:', error);
    
    try {
      await db.collection('notificationErrors').add({
        type: 'auto-onboarding-error',
        userId: user.uid,
        email: user.email,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * Extract email pattern for audit trail
 * @param {string} email 
 * @returns {string} Pattern description
 */
function getEmailPattern(email) {
  if (!email) return 'none';
  
  const emailLower = email.toLowerCase();
  
  if (emailLower.startsWith('admin')) return 'admin-prefix';
  if (emailLower.startsWith('principal')) return 'principal-prefix';
  if (emailLower.startsWith('registrar')) return 'registrar-prefix';
  if (emailLower.startsWith('teacher') || emailLower.startsWith('faculty')) return 'teacher-prefix';
  if (emailLower.startsWith('parent')) return 'parent-prefix';
  
  if (emailLower.includes('.admin@')) return 'admin-subdomain';
  if (emailLower.includes('.teacher@')) return 'teacher-subdomain';
  
  return 'default-parent';
}

/**
 * HTTP endpoint to manually override a user's role
 * Requires admin authentication
 */
exports.assignUserRole = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated to assign roles'
    );
  }

  // Verify admin role
  const callerRole = context.auth.token.role;
  if (callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can manually assign roles'
    );
  }

  const { userId, role } = data;

  // Validate input
  if (!userId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and role are required'
    );
  }

  if (!isValidRole(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid role: ${role}. Must be one of: admin, principal, registrar, teacher, parent`
    );
  }

  try {
    // Get user info
    const user = await auth.getUser(userId);

    // Set custom claims
    await auth.setCustomUserClaims(userId, {
      role: role,
      schoolId: 'default',
      assignedAt: Date.now(),
      assignedBy: context.auth.uid
    });

    // Update audit trail
    await db.collection('userRoles').doc(userId).set({
      userId: userId,
      email: user.email,
      displayName: user.displayName || null,
      role: role,
      schoolId: 'default',
      assignedBy: context.auth.uid,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      method: 'manual-override',
      previousRole: user.customClaims?.role || null
    });

    console.log(`Manual role assignment: ${user.email} → ${role} by ${context.auth.uid}`);

    return {
      success: true,
      userId: userId,
      email: user.email,
      role: role,
      message: `Successfully assigned role ${role} to ${user.email}`
    };

  } catch (error) {
    console.error('Manual role assignment error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to assign role: ${error.message}`
    );
  }
});

/**
 * HTTP endpoint to get user role audit trail
 * Requires authentication (user can see their own, admin can see all)
 */
exports.getUserRoleHistory = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated'
    );
  }

  const { userId } = data;
  const callerRole = context.auth.token.role;
  const callerId = context.auth.uid;

  // Users can see their own history, admins can see anyone's
  if (userId !== callerId && callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Can only view your own role history unless you are an admin'
    );
  }

  try {
    const doc = await db.collection('userRoles').doc(userId).get();
    
    if (!doc.exists) {
      return {
        success: false,
        message: 'No role history found for this user'
      };
    }

    return {
      success: true,
      data: doc.data()
    };

  } catch (error) {
    console.error('Get role history error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to retrieve role history: ${error.message}`
    );
  }
});
