#!/usr/bin/env node
/**
 * Seed Division-Level Access Data
 * 
 * Creates sample divisions, districts, and division users for testing
 * the Division-Level Access feature.
 * 
 * Usage:
 *   node scripts/seed-divisions.cjs
 * 
 * Environment Variables:
 *   VITE_SUPABASE_URL - Supabase URL
 *   VITE_SUPABASE_ANON_KEY - Supabase Anon Key
 * 
 * @see docs/features/DIVISION_LEVEL_ACCESS.md
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zjuxulhxxeeupcskkcok.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0';

const supabase = createClient(supabaseUrl, supabaseKey);

// =====================================================
// SEED DATA
// =====================================================

const DIVISIONS = [
  {
    code: 'DIV-ZAMBOANGA-CITY',
    name: 'Division of Zamboanga City',
    region: 'Region IX - Zamboanga Peninsula',
    region_code: 'REG-IX',
    address: 'DepEd Division Office, Gov. Camins Ave.',
    city: 'Zamboanga City',
    province: 'Zamboanga del Sur',
    contact_email: 'zamboanga.city@deped.gov.ph',
    contact_phone: '+63-62-991-0871',
    superintendent_name: 'Dr. Ramon A. Guillen Jr.',
    asst_superintendent_name: 'Dr. Ma. Cristina S. Gonzales',
    settings: {
      schoolYearStart: 'June',
      enabledModules: ['sf1_enrollment', 'sf2_attendance', 'sf7_personnel', 'reports_consolidated'],
      reportingDeadlines: { sf1_monthly: 5, sf2_monthly: 10 }
    },
    is_active: true
  },
  {
    code: 'DIV-MANILA-CITY',
    name: 'Division of City of Manila',
    region: 'National Capital Region',
    region_code: 'NCR',
    address: 'Mehan Garden, Padre Burgos Ave.',
    city: 'Manila',
    province: 'Metro Manila',
    contact_email: 'manila.city@deped.gov.ph',
    contact_phone: '+63-2-8527-1836',
    superintendent_name: 'Dr. Romulo M. Natividad',
    asst_superintendent_name: 'Dr. Sofia R. Dela Cruz',
    settings: {
      schoolYearStart: 'August',
      enabledModules: ['sf1_enrollment', 'sf2_attendance', 'sf7_personnel', 'reports_consolidated', 'analytics_dashboard'],
      reportingDeadlines: { sf1_monthly: 7, sf2_monthly: 12 }
    },
    is_active: true
  }
];

const getDistricts = (zamboangaId, manilaId) => [
  {
    division_id: zamboangaId,
    code: 'DIST-ZC-WEST',
    name: 'Zamboanga City West District',
    psds_name: 'Dr. Ana Marie L. Fernandez',
    psds_contact: '+63-917-555-0001',
    barangays: ['Sta. Maria', 'Sta. Barbara', 'San Jose Gusu', 'Canelar', 'Baliwasan'],
    is_active: true
  },
  {
    division_id: zamboangaId,
    code: 'DIST-ZC-EAST',
    name: 'Zamboanga City East District',
    psds_name: 'Dr. Roberto C. Santos',
    psds_contact: '+63-917-555-0002',
    barangays: ['Tetuan', 'Pasonanca', 'San Roque', 'Tumaga', 'Culianan'],
    is_active: true
  },
  {
    division_id: manilaId,
    code: 'DIST-MNL-CENTRAL',
    name: 'Manila Central District',
    psds_name: 'Dr. Elena G. Reyes',
    psds_contact: '+63-917-555-0003',
    barangays: ['Ermita', 'Intramuros', 'Paco', 'Pandacan', 'Port Area'],
    is_active: true
  }
];

const getDivisionUsers = (divisionId, districtWestId) => [
  {
    division_id: divisionId,
    firebase_uid: 'div_admin_zamboanga_001',
    email: 'div.admin@zamboanga.deped.gov.ph',
    name: 'Juan Carlos M. Reyes',
    role: 'division_admin',
    permissions: {
      schools: ['read', 'write', 'delete'],
      personnel: ['read', 'write', 'export'],
      enrollment: ['read', 'write', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: ['read', 'write'],
      users: ['read', 'write', 'delete']
    },
    contact_phone: '+63-917-555-1001',
    position_title: 'Division ICT Coordinator',
    is_active: true
  },
  {
    division_id: divisionId,
    firebase_uid: 'div_supervisor_zamboanga_001',
    email: 'supervisor@zamboanga.deped.gov.ph',
    name: 'Maria Elena D. Aquino',
    role: 'division_supervisor',
    permissions: {
      schools: ['read'],
      personnel: ['read'],
      enrollment: ['read'],
      attendance: ['read'],
      grades: ['read'],
      reports: ['read', 'generate'],
      settings: [],
      users: []
    },
    contact_phone: '+63-917-555-1002',
    position_title: 'Division Education Supervisor',
    is_active: true
  },
  {
    division_id: divisionId,
    firebase_uid: 'psds_zamboanga_west_001',
    email: 'psds.west@zamboanga.deped.gov.ph',
    name: 'Roberto A. Garcia',
    role: 'psds',
    permissions: {
      schools: ['read'],
      personnel: ['read'],
      enrollment: ['read'],
      attendance: ['read'],
      grades: ['read'],
      reports: ['read'],
      settings: [],
      users: []
    },
    assigned_district_id: districtWestId,
    contact_phone: '+63-917-555-1003',
    position_title: 'Public Schools District Supervisor - West',
    is_active: true
  },
  {
    division_id: divisionId,
    firebase_uid: 'eps_zamboanga_math_001',
    email: 'eps.math@zamboanga.deped.gov.ph',
    name: 'Ana Sofia B. Cruz',
    role: 'eps',
    permissions: {
      schools: ['read'],
      personnel: ['read'],
      enrollment: ['read'],
      attendance: ['read'],
      grades: ['read'],
      reports: ['read'],
      settings: [],
      users: []
    },
    contact_phone: '+63-917-555-1004',
    position_title: 'Education Program Supervisor - Mathematics',
    is_active: true
  },
  {
    division_id: divisionId,
    firebase_uid: 'data_manager_zamboanga_001',
    email: 'data.manager@zamboanga.deped.gov.ph',
    name: 'Pedro J. Santos',
    role: 'division_data_manager',
    permissions: {
      schools: ['read'],
      personnel: ['read', 'export'],
      enrollment: ['read', 'write', 'export'],
      attendance: ['read', 'export'],
      grades: ['read', 'export'],
      reports: ['read', 'generate', 'export'],
      settings: [],
      users: []
    },
    contact_phone: '+63-917-555-1005',
    position_title: 'Division Planning Officer',
    is_active: true
  }
];

// =====================================================
// MAIN SEEDING FUNCTION
// =====================================================

async function seedDivisions() {
  console.log('🌱 Starting Division-Level Access seeding...\n');

  try {
    // =====================================================
    // STEP 1: Clear existing data (optional)
    // =====================================================
    console.log('🧹 Clearing existing division data...');
    
    // Delete in correct order (due to foreign keys)
    await supabase.from('division_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('districts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('divisions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Clear division references from schools
    await supabase.from('schools').update({ division_id: null, district_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Cleared existing data\n');

    // =====================================================
    // STEP 2: Create Divisions
    // =====================================================
    console.log('📍 Creating divisions...');
    
    const { data: createdDivisions, error: divisionsError } = await supabase
      .from('divisions')
      .insert(DIVISIONS)
      .select();

    if (divisionsError) {
      throw new Error(`Failed to create divisions: ${divisionsError.message}`);
    }

    const zamboangaDivision = createdDivisions.find(d => d.code === 'DIV-ZAMBOANGA-CITY');
    const manilaDivision = createdDivisions.find(d => d.code === 'DIV-MANILA-CITY');

    console.log(`✅ Created ${createdDivisions.length} divisions`);
    createdDivisions.forEach(d => console.log(`   - ${d.name} (${d.code})`));
    console.log('');

    // =====================================================
    // STEP 3: Create Districts
    // =====================================================
    console.log('📍 Creating districts...');
    
    const districtsData = getDistricts(zamboangaDivision.id, manilaDivision.id);
    
    const { data: createdDistricts, error: districtsError } = await supabase
      .from('districts')
      .insert(districtsData)
      .select();

    if (districtsError) {
      throw new Error(`Failed to create districts: ${districtsError.message}`);
    }

    const districtWest = createdDistricts.find(d => d.code === 'DIST-ZC-WEST');

    console.log(`✅ Created ${createdDistricts.length} districts`);
    createdDistricts.forEach(d => console.log(`   - ${d.name} (${d.code})`));
    console.log('');

    // =====================================================
    // STEP 4: Assign Schools to Divisions
    // =====================================================
    console.log('📍 Assigning schools to divisions...');
    
    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, school_id_number')
      .is('deleted_at', null)
      .limit(10);

    if (schoolsError) {
      console.warn('⚠️ Could not fetch schools:', schoolsError.message);
    } else if (schools && schools.length > 0) {
      // Assign first school to Zamboanga City West District
      const { error: updateError } = await supabase
        .from('schools')
        .update({ 
          division_id: zamboangaDivision.id,
          district_id: districtWest.id,
          region: 'Region IX - Zamboanga Peninsula',
          division: 'Division of Zamboanga City'
        })
        .eq('id', schools[0].id);

      if (updateError) {
        console.warn('⚠️ Could not assign school:', updateError.message);
      } else {
        console.log(`✅ Assigned "${schools[0].name}" (${schools[0].school_id_number || 'No ID'}) to Zamboanga City West District`);
      }

      // Assign remaining schools to East District
      const districtEast = createdDistricts.find(d => d.code === 'DIST-ZC-EAST');
      if (schools.length > 1 && districtEast) {
        for (let i = 1; i < schools.length; i++) {
          const { error: err } = await supabase
            .from('schools')
            .update({ 
              division_id: zamboangaDivision.id,
              district_id: districtEast.id,
              region: 'Region IX - Zamboanga Peninsula',
              division: 'Division of Zamboanga City'
            })
            .eq('id', schools[i].id);
          
          if (!err) {
            console.log(`   ✅ Assigned "${schools[i].name}" to East District`);
          }
        }
      }
    } else {
      console.log('⚠️ No schools found to assign');
    }
    console.log('');

    // =====================================================
    // STEP 5: Create Division Users
    // =====================================================
    console.log('📍 Creating division users...');
    
    const divisionUsersData = getDivisionUsers(zamboangaDivision.id, districtWest.id);
    
    const { data: createdUsers, error: usersError } = await supabase
      .from('division_users')
      .insert(divisionUsersData)
      .select();

    if (usersError) {
      throw new Error(`Failed to create division users: ${usersError.message}`);
    }

    console.log(`✅ Created ${createdUsers.length} division users`);
    createdUsers.forEach(u => console.log(`   - ${u.name} (${u.role})`));
    console.log('');

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log('🎉 Division-Level Access seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${createdDivisions.length} Divisions`);
    console.log(`   - ${createdDistricts.length} Districts`);
    console.log(`   - ${createdUsers.length} Division Users`);
    console.log('');
    console.log('🔐 Test Credentials:');
    console.log('   Division Admin: div.admin@zamboanga.deped.gov.ph');
    console.log('   Supervisor: supervisor@zamboanga.deped.gov.ph');
    console.log('   PSDS: psds.west@zamboanga.deped.gov.ph');
    console.log('   EPS: eps.math@zamboanga.deped.gov.ph');
    console.log('   Data Manager: data.manager@zamboanga.deped.gov.ph');
    console.log('');
    console.log('⚠️ Note: These accounts need to be created in Firebase Auth before login works.');

    return {
      divisions: createdDivisions,
      districts: createdDistricts,
      divisionUsers: createdUsers
    };

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

// =====================================================
// RUN SCRIPT
// =====================================================

if (require.main === module) {
  seedDivisions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDivisions };
