#!/usr/bin/env node
/**
 * Initialize billing ledger for Juan Garcia
 * This script creates a fee structure for Grade 7 and initializes Juan Garcia's billing ledger
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8086';

admin.initializeApp({
  projectId: 'edusync-local'
});

const db = admin.firestore();

async function initializeBillingLedger() {
  console.log('🔧 Initializing billing ledger for Juan Garcia...\n');

  try {
    // Step 1: Check if fee structure for Grade 7 exists
    console.log('Step 1: Checking for Grade 7 fee structure...');
    const feeStructuresSnapshot = await db.collection('feeStructures')
      .where('gradeLevel', '==', '7')
      .where('schoolYear', '==', '2024-2025')
      .get();

    let feeStructureId;

    if (feeStructuresSnapshot.empty) {
      console.log('No fee structure found. Creating one...');
      
      // Create fee structure for Grade 7
      const feeStructureRef = await db.collection('feeStructures').add({
        gradeLevel: '7',
        schoolYear: '2024-2025',
        tuitionFee: 15000,
        miscellaneousFees: [
          { name: 'General Fund', amount: 1500 },
          { name: 'Library Fee', amount: 500 },
          { name: 'Technology Fee', amount: 1000 }
        ],
        laboratoryFees: [
          { name: 'Computer Lab', amount: 800 },
          { name: 'Science Lab', amount: 700 }
        ],
        otherFees: [
          { name: 'ID Card', amount: 150 },
          { name: 'School Handbook', amount: 100 }
        ],
        paymentSchedule: [
          { 
            name: 'Upon Enrollment', 
            dueDate: '2024-08-15',
            percentage: 30
          },
          { 
            name: '1st Quarter', 
            dueDate: '2024-09-15',
            percentage: 20
          },
          { 
            name: '2nd Quarter', 
            dueDate: '2024-11-15',
            percentage: 20
          },
          { 
            name: '3rd Quarter', 
            dueDate: '2025-01-15',
            percentage: 15
          },
          { 
            name: '4th Quarter', 
            dueDate: '2025-03-15',
            percentage: 15
          }
        ],
        createdAt: new Date().toISOString(),
        createdBy: 'system-admin',
        isActive: true
      });

      feeStructureId = feeStructureRef.id;
      console.log(`✅ Created fee structure: ${feeStructureId}`);
    } else {
      feeStructureId = feeStructuresSnapshot.docs[0].id;
      console.log(`✅ Found existing fee structure: ${feeStructureId}`);
    }

    // Step 2: Find Juan Garcia's student record
    console.log('\nStep 2: Finding Juan Garcia...');
    const studentsSnapshot = await db.collection('students')
      .where('firstName', '==', 'Juan')
      .where('lastName', '==', 'Garcia')
      .get();

    if (studentsSnapshot.empty) {
      console.error('❌ Juan Garcia not found in students collection!');
      process.exit(1);
    }

    const studentDoc = studentsSnapshot.docs[0];
    const studentId = studentDoc.id;
    const studentData = studentDoc.data();
    
    console.log(`✅ Found student: ${studentData.firstName} ${studentData.lastName} (ID: ${studentId})`);
    console.log(`   LRN: ${studentData.lrn}`);
    console.log(`   Grade Level: ${studentData.gradeLevel}`);
    console.log(`   Section: ${studentData.sectionId}`);

    // Step 3: Check if ledger already exists (with correct ID)
    console.log('\nStep 3: Checking for existing ledger...');
    const correctLedgerId = `${studentId}_2024-2025`;
    const correctLedgerRef = db.collection('studentLedgers').doc(correctLedgerId);
    const correctLedgerDoc = await correctLedgerRef.get();

    if (correctLedgerDoc.exists) {
      const ledgerData = correctLedgerDoc.data();
      // Check if it has the required fields
      if (ledgerData.charges && ledgerData.payments) {
        console.log('✅ Ledger already exists with correct ID format and structure!');
        console.log(`   Ledger ID: ${correctLedgerId}`);
        console.log(`   Total Charges: ₱${ledgerData.totalCharges.toFixed(2)}`);
        console.log(`   Total Payments: ₱${ledgerData.totalPayments.toFixed(2)}`);
        console.log(`   Balance: ₱${ledgerData.balance.toFixed(2)}`);
        return;
      } else {
        console.log('⚠️  Ledger exists but has old structure. Updating...');
        await correctLedgerRef.delete();
      }
    }

    // Check for old ledgers with wrong ID format and delete them
    const oldLedgerSnapshot = await db.collection('studentLedgers')
      .where('studentId', '==', studentId)
      .where('schoolYear', '==', '2024-2025')
      .get();

    if (!oldLedgerSnapshot.empty) {
      console.log('⚠️  Found old ledger with incorrect ID format. Deleting...');
      for (const oldDoc of oldLedgerSnapshot.docs) {
        console.log(`   Deleting: ${oldDoc.id}`);
        await oldDoc.ref.delete();
      }
      console.log('✅ Old ledgers deleted');
    }

    // Step 4: Get fee structure details for calculations
    console.log('\nStep 4: Getting fee structure details...');
    const feeStructureDoc = await db.collection('feeStructures').doc(feeStructureId).get();
    const feeStructure = feeStructureDoc.data();

    // Calculate total amount
    const tuitionFee = feeStructure.tuitionFee || 0;
    const miscTotal = (feeStructure.miscellaneousFees || []).reduce((sum, fee) => sum + fee.amount, 0);
    const labTotal = (feeStructure.laboratoryFees || []).reduce((sum, fee) => sum + fee.amount, 0);
    const otherTotal = (feeStructure.otherFees || []).reduce((sum, fee) => sum + fee.amount, 0);
    const totalAmount = tuitionFee + miscTotal + labTotal + otherTotal;

    console.log(`   Tuition Fee: ₱${tuitionFee.toFixed(2)}`);
    console.log(`   Miscellaneous Fees: ₱${miscTotal.toFixed(2)}`);
    console.log(`   Laboratory Fees: ₱${labTotal.toFixed(2)}`);
    console.log(`   Other Fees: ₱${otherTotal.toFixed(2)}`);
    console.log(`   TOTAL: ₱${totalAmount.toFixed(2)}`);

    // Step 5: Create the ledger with correct ID format and required fields
    console.log('\nStep 5: Creating billing ledger...');
    const ledgerId = `${studentId}_2024-2025`;
    const ledgerRef = db.collection('studentLedgers').doc(ledgerId);
    
    // Build charges array from fee structure
    const charges = [];
    
    // Add tuition charge
    if (tuitionFee > 0) {
      charges.push({
        id: `charge-tuition-${Date.now()}`,
        type: 'tuition',
        description: 'Tuition Fee',
        amount: tuitionFee,
        dueDate: '2024-08-15',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }
    
    // Add misc fees as charges
    (feeStructure.miscellaneousFees || []).forEach((fee, index) => {
      charges.push({
        id: `charge-misc-${index}-${Date.now()}`,
        type: 'miscellaneous',
        description: fee.name,
        amount: fee.amount,
        dueDate: '2024-08-15',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });
    
    // Add lab fees as charges
    (feeStructure.laboratoryFees || []).forEach((fee, index) => {
      charges.push({
        id: `charge-lab-${index}-${Date.now()}`,
        type: 'laboratory',
        description: fee.name,
        amount: fee.amount,
        dueDate: '2024-08-15',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });
    
    // Add other fees as charges
    (feeStructure.otherFees || []).forEach((fee, index) => {
      charges.push({
        id: `charge-other-${index}-${Date.now()}`,
        type: 'other',
        description: fee.name,
        amount: fee.amount,
        dueDate: '2024-08-15',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    });
    
    await ledgerRef.set({
      studentId: studentId,
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      gradeLevel: parseInt(studentData.gradeLevel) || 7,
      section: studentData.sectionId || 'section-7-diamond',
      schoolYear: '2024-2025',
      feeStructureId: feeStructureId,
      
      // Payment Plan
      paymentPlan: 'full',
      
      // Charges array (REQUIRED)
      charges: charges,
      
      // Payments array (REQUIRED - empty initially)
      payments: [],
      
      // Discounts
      discounts: [],
      
      // Computed Totals
      totalCharges: totalAmount,
      totalDiscounts: 0,
      totalPayments: 0,
      balance: totalAmount,
      
      // Status
      status: 'partial',
      dueDate: '2024-08-15',
      lastPaymentDate: null,
      
      // Metadata
      createdAt: new Date().toISOString(),
      createdBy: 'system-admin',
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Created billing ledger: ${ledgerId}`);
    console.log('\n✨ SUCCESS! Juan Garcia billing ledger initialized.');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to Payment Recording page');
    console.log('   2. Search for "Juan Garcia"');
    console.log('   3. Record a payment');
    console.log('   4. Generate a receipt');
    console.log('   5. Check Financial Reports');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
initializeBillingLedger()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
