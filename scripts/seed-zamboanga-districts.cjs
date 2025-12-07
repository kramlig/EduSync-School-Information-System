/**
 * Seed realistic Zamboanga City districts and schools
 * 
 * Run with: node scripts/seed-zamboanga-districts.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Use anon key for now - if RLS blocks, run SQL directly
const supabase = createClient(
  'https://zjuxulhxxeeupcskkcok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzExNDAsImV4cCI6MjA3OTAwNzE0MH0.rwRzqcxVIjPZ0-qmOvEzFkpeEoIRfnyYCWVRP9m1hX0'
);

// Division ID for Zamboanga City
const ZAMBOANGA_DIVISION_ID = '00e59346-6eb1-4184-8215-d8f05118987e';

// Realistic Zamboanga City districts
// Schema: id, division_id, code, name, psds_name, psds_contact, barangays, is_active, created_at, updated_at, deleted_at
const DISTRICTS = [
  {
    code: 'ZC-WEST',
    name: 'Zamboanga City West District',
    psds_name: 'Dr. Esperanza Santos',
    psds_contact: '0917-123-4567',
    barangays: ['Canelar', 'Sta. Maria', 'San Jose Cawa-Cawa', 'Rio Hondo'],
  },
  {
    code: 'ZC-EAST',
    name: 'Zamboanga City East District',
    psds_name: 'Dr. Ricardo Maglasang',
    psds_contact: '0918-234-5678',
    barangays: ['Tetuan', 'Divisoria', 'Tumaga', 'Pasonanca'],
  },
  {
    code: 'ZC-NORTH',
    name: 'Zamboanga City North District',
    psds_name: 'Dr. Maria Luz Gonzales',
    psds_contact: '0919-345-6789',
    barangays: ['Culianan', 'Sinunuc', 'Limpapa', 'Mercedes'],
  },
  {
    code: 'ZC-SOUTH',
    name: 'Zamboanga City South District',
    psds_name: 'Dr. Fernando Reyes',
    psds_contact: '0920-456-7890',
    barangays: ['Ayala', 'San Roque', 'Taluksangay', 'Sta. Catalina'],
  },
  {
    code: 'ZC-CENTRAL',
    name: 'Zamboanga City Central District',
    psds_name: 'Dr. Josephine dela Cruz',
    psds_contact: '0921-567-8901',
    barangays: ['Zone I', 'Zone II', 'Zone III', 'Zone IV'],
  },
];

// Sample schools in Zamboanga City
// Schema: id, school_name, school_code, address, barangay, city, province, region, zip_code, 
//         contact_email, contact_phone, principal_name, school_type, is_active, settings, 
//         division_id (added later), district_id (added later)
const SCHOOLS = [
  {
    school_name: 'Zamboanga City National High School',
    school_code: '317267',
    district_code: 'ZC-WEST',
    address: 'Gov. Camins Ave.',
    barangay: 'Sta. Maria',
    region: 'Region IX',
    principal_name: 'Dr. Juan Carlos M. Reyes',
    contact_phone: '(062) 991-1234',
    contact_email: 'zcnhs@deped.gov.ph',
    school_type: 'high_school',
  },
  {
    school_name: 'Zamboanga City Central Elementary School',
    school_code: '317001',
    district_code: 'ZC-CENTRAL',
    address: 'Pilar St.',
    barangay: 'Zone II',
    region: 'Region IX',
    principal_name: 'Mrs. Rosalinda Santos',
    contact_phone: '(062) 991-2345',
    contact_email: 'zcces@deped.gov.ph',
    school_type: 'elementary',
  },
  {
    school_name: 'Tetuan Central School',
    school_code: '317045',
    district_code: 'ZC-EAST',
    address: 'Tetuan Road',
    barangay: 'Tetuan',
    region: 'Region IX',
    principal_name: 'Mr. Roberto Hernandez',
    contact_phone: '(062) 991-3456',
    contact_email: 'tetuan.cs@deped.gov.ph',
    school_type: 'elementary',
  },
  {
    school_name: 'Sta. Maria Elementary School',
    school_code: '317089',
    district_code: 'ZC-NORTH',
    address: 'Sta. Maria Road',
    barangay: 'Sta. Maria',
    region: 'Region IX',
    principal_name: 'Mrs. Elena Garcia',
    contact_phone: '(062) 991-4567',
    contact_email: 'stamaria.es@deped.gov.ph',
    school_type: 'elementary',
  },
  {
    school_name: 'Ayala National High School',
    school_code: '317112',
    district_code: 'ZC-SOUTH',
    address: 'Ayala Road',
    barangay: 'Ayala',
    region: 'Region IX',
    principal_name: 'Dr. Antonio Martinez',
    contact_phone: '(062) 991-5678',
    contact_email: 'ayala.nhs@deped.gov.ph',
    school_type: 'high_school',
  },
];

async function seedData() {
  console.log('🌱 Seeding Zamboanga City Districts and Schools...\n');
  
  // Insert districts
  console.log('📍 Inserting districts...');
  for (const district of DISTRICTS) {
    // Check if exists first
    const { data: existing } = await supabase
      .from('districts')
      .select('id')
      .eq('code', district.code)
      .single();
    
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('districts')
        .update({
          name: district.name,
          psds_name: district.psds_name,
          psds_contact: district.psds_contact,
          barangays: district.barangays,
          is_active: true,
        })
        .eq('id', existing.id);
      
      if (error) {
        console.log(`   ⚠️ ${district.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${district.name} (updated)`);
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('districts')
        .insert({
          ...district,
          division_id: ZAMBOANGA_DIVISION_ID,
          is_active: true,
        });
      
      if (error) {
        console.log(`   ⚠️ ${district.name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${district.name} (inserted)`);
      }
    }
  }
  
  // Get district IDs
  const { data: dbDistricts } = await supabase
    .from('districts')
    .select('id, code');
  
  const districtMap = {};
  (dbDistricts || []).forEach(d => {
    districtMap[d.code] = d.id;
  });
  
  // Insert schools
  console.log('\n🏫 Inserting schools...');
  for (const school of SCHOOLS) {
    const districtId = districtMap[school.district_code];
    
    // Use insert with select to check for existing records first
    const { data: existing } = await supabase
      .from('schools')
      .select('id')
      .eq('school_code', school.school_code)
      .single();
    
    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('schools')
        .update({
          school_name: school.school_name,
          division_id: ZAMBOANGA_DIVISION_ID,
          district_id: districtId,
          address: school.address,
          region: school.region,
          principal_name: school.principal_name,
          contact_phone: school.contact_phone,
          contact_email: school.contact_email,
          school_type: school.school_type,
          is_active: true,
        })
        .eq('id', existing.id);
      
      if (error) {
        console.log(`   ⚠️ ${school.school_name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${school.school_name} (updated)`);
      }
    } else {
      // Insert new record (only basic columns that definitely exist)
      const { error } = await supabase
        .from('schools')
        .insert({
          school_name: school.school_name,
          school_code: school.school_code,
          address: school.address,
          region: school.region,
          principal_name: school.principal_name,
          contact_phone: school.contact_phone,
          contact_email: school.contact_email,
          school_type: school.school_type,
          is_active: true,
        });
      
      if (error) {
        console.log(`   ⚠️ ${school.school_name}: ${error.message}`);
      } else {
        console.log(`   ✅ ${school.school_name} (inserted)`);
      }
    }
  }
  
  console.log('\n✅ Seeding complete!');
}

seedData().catch(console.error);
