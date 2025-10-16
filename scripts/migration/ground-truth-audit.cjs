const admin = require('firebase-admin');

// This script directly connects to the specified Firebase project using an admin account
// to get the definitive count of documents, bypassing any client-side security rules.

async function getCloudCounts(projectId) {
  console.log(`Initializing Admin SDK for project: ${projectId}`);
  
  // Initialize the Admin SDK.
  // The SDK will automatically use the default service account credentials
  // available in the environment where the Firebase CLI is authenticated.
  try {
    admin.initializeApp({
      projectId: projectId,
    });
  } catch (e) {
    // This can happen if it's already initialized. We can ignore it.
    if (e.code !== 'app/duplicate-app') {
      throw e;
    }
  }

  const db = admin.firestore();
  console.log('Firestore Admin SDK initialized.');

  const collectionsToCount = ['users', 'students', 'grades'];
  const counts = {};

  console.log('Fetching document counts...');
  for (const collectionName of collectionsToCount) {
    try {
      const snapshot = await db.collection(collectionName).count().get();
      counts[collectionName] = snapshot.data().count;
      console.log(`  - Collection '${collectionName}': ${counts[collectionName]} documents.`);
    } catch (error) {
      console.error(`Error counting documents in collection '${collectionName}':`, error.message);
      counts[collectionName] = `Error: ${error.message}`;
    }
  }

  return counts;
}

async function main() {
  const projectId = 'edusync-sis'; // Hardcoding the project ID we need to verify.
  console.log(`--- Starting Ground Truth Audit for Project: ${projectId} ---`);
  
  const counts = await getCloudCounts(projectId);

  console.log('\n--- Audit Complete ---');
  console.log('Definitive Document Counts in the Cloud:');
  console.log(JSON.stringify(counts, null, 2));
  console.log('----------------------');

  // Compare with expected counts
  const expected = { users: 5000, students: 4500, grades: 9000 };
  let mismatch = false;
  for (const key in expected) {
    if (counts[key] !== expected[key]) {
      mismatch = true;
      console.warn(`WARNING: Mismatch for '${key}'. Expected: ${expected[key]}, Found: ${counts[key]}`);
    }
  }

  if (!mismatch) {
    console.log('\nConclusion: The data IS in the cloud database as expected.');
  } else {
    console.error('\nConclusion: The data IS NOT in the cloud database as expected. The migration failed to write to the cloud.');
  }
}

main().catch(error => {
  console.error('Critical error during audit:', error);
  process.exit(1);
});
