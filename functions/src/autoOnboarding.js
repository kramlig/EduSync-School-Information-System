/**
 * Auto-Onboarding Cloud Functions
 * 
 * Automatically assigns roles to new users based on email patterns.
 * Creates audit trail for all role assignments.
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
 * Triggered when a new user is created in Firebase Auth.
 * Automatically assigns a role based on email pattern.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const startTime = Date.now();
  
  try {
    // Extract user info
    const { uid, email, displayName } = user;
    
    if (!email) {
      console.warn(`User ${uid} created without email. Cannot auto-assign role.`);
      return null;
    }

    console.log(`Auto-onboarding triggered for user: ${email} (${uid})`);

    // Determine role based on email
    const role = determineRole(email);
    
    if (!isValidRole(role)) {
      console.error(`Invalid role determined: ${role} for user ${email}`);
      return null;
    }

    console.log(`Determined role: ${role} for user ${email}`);

    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role: role,
      schoolId: 'default', // TODO: Make this configurable per school
      assignedAt: Date.now(),
      assignedBy: 'system-auto'
    });

    console.log(`Custom claims set for ${email}: role=${role}`);

    // Create audit trail in Firestore
    await db.collection('userRoles').doc(uid).set({
      userId: uid,
      email: email,
      displayName: displayName || null,
      role: role,
      schoolId: 'default',
      assignedBy: 'system-auto',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      method: 'auto-onboarding',
      emailPattern: getEmailPattern(email),
      processingTimeMs: Date.now() - startTime
    });

    console.log(`Audit trail created for ${email}`);

    // Create notification for admins (optional)
    try {
      await db.collection('notifications').add({
        type: 'user_onboarded',
        recipientRole: 'admin',
        title: 'New User Onboarded',
        message: `${email} was automatically assigned role: ${role}`,
        data: {
          userId: uid,
          email: email,
          role: role,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (notifError) {
      // Non-critical error, log and continue
      console.warn(`Failed to create notification: ${notifError.message}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`Auto-onboarding completed for ${email} in ${totalTime}ms`);

    return {
      success: true,
      userId: uid,
      email: email,
      role: role,
      processingTimeMs: totalTime
    };

  } catch (error) {
    console.error('Auto-onboarding error:', error);
    
    // Log error to Firestore for debugging
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

    // Don't throw - we don't want to block user creation
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
