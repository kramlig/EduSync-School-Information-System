#!/usr/bin/env node
/**
 * Fix existing fee structures that might be missing totalRequired/totalOptional
 */

const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

function calculateRequiredFees(fees) {
  let total = fees.tuitionFee || 0;
  
  // Add required miscellaneous fees
  if (fees.miscFees) {
    fees.miscFees.forEach(fee => {
      if (fee.required) {
        total += fee.amount || 0;
      }
    });
  }
  
  // Add other required fees
  total += fees.registrationFee || 0;
  total += fees.idFee || 0;
  total += fees.insuranceFee || 0;
  
  return total;
}

function calculateOptionalFees(fees) {
  let total = 0;
  
  // Add optional miscellaneous fees
  if (fees.miscFees) {
    fees.miscFees.forEach(fee => {
      if (!fee.required) {
        total += fee.amount || 0;
      }
    });
  }
  
  // Add lab fees (usually optional)
  if (fees.labFees) {
    fees.labFees.forEach(fee => {
      total += fee.amount || 0;
    });
  }
  
  return total;
}

async function fixFeeStructures() {
  console.log('🔧 Fixing fee structures...\n');

  try {
    // Get all fee structures
    const snapshot = await db.collection('feeStructures').get();
    
    if (snapshot.empty) {
      console.log('⚠️  No fee structures found');
      process.exit(0);
    }

    console.log(`Found ${snapshot.size} fee structure(s)\n`);

    let fixed = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      
      // Skip if no fees object (invalid structure)
      if (!data.fees) {
        console.log(`⚠️  ${doc.id}: Missing fees object - skipping\n`);
        continue;
      }
      
      // Check if totalRequired is missing or 0
      if (!data.totalRequired || data.totalRequired === 0) {
        const totalRequired = calculateRequiredFees(data.fees);
        updates.totalRequired = totalRequired;
        console.log(`📊 ${doc.id}: totalRequired = ₱${totalRequired.toFixed(2)}`);
      }
      
      // Check if totalOptional is missing
      if (data.totalOptional === undefined) {
        const totalOptional = calculateOptionalFees(data.fees);
        updates.totalOptional = totalOptional;
        console.log(`📊 ${doc.id}: totalOptional = ₱${totalOptional.toFixed(2)}`);
      }
      
      // Check if paymentOptions is missing
      if (!data.paymentOptions) {
        updates.paymentOptions = {
          fullPayment: {
            enabled: true,
            discount: 0.05
          },
          quarterly: {
            enabled: true,
            numberOfPayments: 4
          },
          monthly: {
            enabled: true,
            numberOfPayments: 10
          }
        };
        console.log(`💳 ${doc.id}: Added default payment options`);
      }
      
      // Update if needed
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await db.collection('feeStructures').doc(doc.id).update(updates);
        fixed++;
        console.log(`✅ Fixed: ${doc.id}\n`);
      } else {
        console.log(`✓ OK: ${doc.id}\n`);
      }
    }

    console.log(`\n✨ Done! Fixed ${fixed} fee structure(s)`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFeeStructures()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
