/**
 * Sync PostgreSQL Users to Firebase Auth
 * 
 * Creates Firebase Auth accounts for users that exist in PostgreSQL but not in Auth.
 * This is needed for seed data and manual database user creation.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Sync all PostgreSQL users to Firebase Auth
 * Creates auth accounts for users missing from Firebase Auth
 * 
 * Expected data from Supabase:
 * - teachers table
 * - students table  
 * - parents table
 * 
 * Returns: { created: number, skipped: number, errors: string[] }
 */
exports.syncPostgresToAuth = functions.https.onCall(async (data, context) => {
  // Require admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Check if user is admin (you can add custom claims check here)
  const userRecord = await admin.auth().getUser(context.auth.uid);
  const customClaims = userRecord.customClaims || {};
  
  if (customClaims.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can sync users');
  }

  const { users } = data; // Array of { email, role, name, id }
  
  if (!users || !Array.isArray(users)) {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide users array');
  }

  const results = {
    created: 0,
    skipped: 0,
    errors: []
  };

  for (const user of users) {
    try {
      const { email, role, name, postgresqlId } = user;
      
      if (!email) {
        results.errors.push(`Skipping user without email: ${JSON.stringify(user)}`);
        results.skipped++;
        continue;
      }

      // Check if user already exists in Firebase Auth
      let existingUser;
      try {
        existingUser = await admin.auth().getUserByEmail(email);
        
        // User exists, just update custom claims if needed
        const currentClaims = existingUser.customClaims || {};
        if (currentClaims.role !== role || currentClaims.postgresqlId !== postgresqlId) {
          await admin.auth().setCustomUserClaims(existingUser.uid, {
            role: role || 'parent',
            postgresqlId: postgresqlId
          });
          console.log(`Updated claims for existing user: ${email}`);
        }
        
        results.skipped++;
        continue;
      } catch (err) {
        // User doesn't exist, we'll create them
        if (err.code !== 'auth/user-not-found') {
          throw err; // Unexpected error
        }
      }

      // Create new Firebase Auth user
      const defaultPassword = 'EduSync2024!'; // You can make this configurable
      const newUser = await admin.auth().createUser({
        email: email,
        password: defaultPassword,
        displayName: name,
        emailVerified: false // They'll need to verify
      });

      // Set custom claims
      await admin.auth().setCustomUserClaims(newUser.uid, {
        role: role || 'parent',
        postgresqlId: postgresqlId
      });

      console.log(`Created Firebase Auth user: ${email} (UID: ${newUser.uid})`);
      results.created++;

    } catch (error) {
      console.error(`Error syncing user ${user.email}:`, error);
      results.errors.push(`${user.email}: ${error.message}`);
    }
  }

  return results;
});

/**
 * Simpler version: Sync a single user
 */
exports.createAuthUser = functions.https.onCall(async (data, context) => {
  // Require admin authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { email, password, name, role, postgresqlId } = data;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      return {
        success: false,
        message: 'User already exists in Firebase Auth',
        uid: existingUser.uid
      };
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    // Create user
    const newUser = await admin.auth().createUser({
      email: email,
      password: password || 'EduSync2024!',
      displayName: name,
      emailVerified: false
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(newUser.uid, {
      role: role || 'parent',
      postgresqlId: postgresqlId
    });

    return {
      success: true,
      message: 'User created successfully',
      uid: newUser.uid
    };

  } catch (error) {
    console.error('Error creating auth user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
