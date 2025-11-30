/**
 * Seed Financial Data for Testing
 * 
 * This script:
 * 1. Creates realistic fee structures for all grade levels
 * 2. Initializes student ledgers with balances
 * 3. Records sample payments for testing
 * 
 * Usage: npx tsx scripts/seed-financial-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🌱 Starting financial data seeding...\n');

  // Step 1: Get school ID and students
  console.log('📋 Fetching school and students...');
  const { data: schools } = await supabase.from('schools').select('id').limit(1);
  if (!schools || schools.length === 0) {
    console.error('❌ No schools found! Please run student seeding first.');
    process.exit(1);
  }
  const schoolId = schools[0].id;
  console.log(`✅ School ID: ${schoolId}`);

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_level')
    .eq('school_id', schoolId)
    .limit(20);

  if (!students || students.length === 0) {
    console.error('❌ No students found! Please run student seeding first.');
    process.exit(1);
  }
  console.log(`✅ Found ${students.length} students\n`);

  // Step 2: Create fee structures
  console.log('💰 Creating fee structures for all grade levels...');
  const currentYear = '2023-2024';
  const feeStructures = [
    // Elementary (K-6)
    { gradeLevel: 0, name: 'Kindergarten', tuition: 15000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 1, name: 'Grade 1', tuition: 18000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 2, name: 'Grade 2', tuition: 18000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 3, name: 'Grade 3', tuition: 20000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 4, name: 'Grade 4', tuition: 20000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 5, name: 'Grade 5', tuition: 22000, registration: 800, id: 200, insurance: 500 },
    { gradeLevel: 6, name: 'Grade 6', tuition: 22000, registration: 800, id: 200, insurance: 500 },
    // Junior High (7-10)
    { gradeLevel: 7, name: 'Grade 7', tuition: 25000, registration: 1000, id: 250, insurance: 600 },
    { gradeLevel: 8, name: 'Grade 8', tuition: 25000, registration: 1000, id: 250, insurance: 600 },
    { gradeLevel: 9, name: 'Grade 9', tuition: 27000, registration: 1000, id: 250, insurance: 600 },
    { gradeLevel: 10, name: 'Grade 10', tuition: 27000, registration: 1000, id: 250, insurance: 600 },
    // Senior High (11-12)
    { gradeLevel: 11, name: 'Grade 11', tuition: 30000, registration: 1200, id: 300, insurance: 700 },
    { gradeLevel: 12, name: 'Grade 12', tuition: 30000, registration: 1200, id: 300, insurance: 700 },
  ];

  for (const fs of feeStructures) {
    const miscFees = [
      { id: `misc-${fs.gradeLevel}-1`, name: 'Books & Materials', amount: fs.gradeLevel >= 11 ? 5000 : 3500, required: true },
      { id: `misc-${fs.gradeLevel}-2`, name: 'School Events', amount: 1200, required: true },
      { id: `misc-${fs.gradeLevel}-3`, name: 'Technology Fee', amount: fs.gradeLevel >= 7 ? 1500 : 1000, required: true },
      { id: `misc-${fs.gradeLevel}-4`, name: 'Athletic Fee', amount: 500, required: false },
    ];

    const labFees = fs.gradeLevel >= 7 ? [
      { subject: 'Science', amount: 800 },
      { subject: 'Computer', amount: 1000 },
    ] : [];

    const { error } = await supabase.from('fee_structures').insert({
      school_id: schoolId,
      grade_level: fs.gradeLevel,
      school_year: currentYear,
      tuition_amount: fs.tuition,
      registration_fee: fs.registration,
      id_fee: fs.id,
      insurance_fee: fs.insurance,
      misc_fees: miscFees,
      lab_fees: labFees,
      full_payment_discount: 0.10, // 10% discount for full payment
      quarterly_discount: 0.05, // 5% for quarterly
      monthly_discount: 0,
      allow_installments: true,
      is_active: true,
    });

    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Error creating fee structure for ${fs.name}:`, error);
    } else if (!error) {
      console.log(`✅ Created fee structure for ${fs.name}`);
    }
  }

  console.log('\n💼 Initializing student ledgers...');
  
  // Step 3: Create student ledgers with balances
  for (const student of students) {
    const feeStructure = feeStructures.find(fs => fs.gradeLevel === student.grade_level);
    if (!feeStructure) continue;

    // Calculate total charges
    const miscRequired = feeStructure.gradeLevel >= 11 ? 5000 + 1200 + 1500 : 3500 + 1200 + 1000;
    const labTotal = feeStructure.gradeLevel >= 7 ? 1800 : 0;
    const totalCharges = feeStructure.tuition + feeStructure.registration + feeStructure.id + feeStructure.insurance + miscRequired + labTotal;

    // Random payment status (some paid partially, some fully, some unpaid)
    const rand = Math.random();
    let totalPayments = 0;
    let paymentStatus = 'pending';

    if (rand < 0.3) {
      // 30% fully paid
      totalPayments = totalCharges;
      paymentStatus = 'paid';
    } else if (rand < 0.7) {
      // 40% partially paid
      totalPayments = Math.floor(totalCharges * (0.3 + Math.random() * 0.6));
      paymentStatus = 'partial';
    }
    // 30% pending (unpaid)

    const balance = totalCharges - totalPayments;

    const charges = [
      {
        id: `charge-tuition-${student.id}`,
        date: '2024-06-01',
        description: 'Tuition Fee',
        amount: feeStructure.tuition,
        category: 'tuition'
      },
      {
        id: `charge-misc-${student.id}`,
        date: '2024-06-01',
        description: 'Miscellaneous Fees',
        amount: miscRequired,
        category: 'miscellaneous'
      },
      {
        id: `charge-fixed-${student.id}`,
        date: '2024-06-01',
        description: 'Registration, ID, Insurance',
        amount: feeStructure.registration + feeStructure.id + feeStructure.insurance,
        category: 'fixed'
      }
    ];

    if (labTotal > 0) {
      charges.push({
        id: `charge-lab-${student.id}`,
        date: '2024-06-01',
        description: 'Laboratory Fees',
        amount: labTotal,
        category: 'laboratory'
      });
    }

    const payments = [];
    if (totalPayments > 0) {
      payments.push({
        id: `payment-${student.id}-1`,
        date: '2024-06-15',
        amount: totalPayments,
        receiptNumber: `OR-2024-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        paymentMethod: ['cash', 'bank_transfer', 'gcash'][Math.floor(Math.random() * 3)]
      });
    }

    const { error } = await supabase.from('student_ledgers').insert({
      school_id: schoolId,
      student_id: student.id,
      school_year: currentYear,
      total_charges: totalCharges,
      total_payments: totalPayments,
      balance: balance,
      charges: charges,
      payments: payments,
      payment_status: paymentStatus,
    });

    if (error && !error.message.includes('duplicate')) {
      console.error(`❌ Error creating ledger for ${student.first_name} ${student.last_name}:`, error);
    } else if (!error) {
      const statusEmoji = paymentStatus === 'paid' ? '✅' : paymentStatus === 'partial' ? '⚠️' : '❌';
      console.log(`${statusEmoji} ${student.first_name} ${student.last_name} (Grade ${student.grade_level}): ₱${totalCharges.toLocaleString()} charged, ₱${totalPayments.toLocaleString()} paid, ₱${balance.toLocaleString()} balance`);
    }
  }

  console.log('\n✅ Financial data seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Fee structures: ${feeStructures.length} grade levels`);
  console.log(`   - Student ledgers: ${students.length} students`);
  console.log(`   - Ready for payment recording testing!`);
}

main().catch(console.error);
