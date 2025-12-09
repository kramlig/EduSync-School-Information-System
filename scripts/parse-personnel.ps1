# parse-personnel.ps1
# Parses SF7 personnel data from CSV and generates SQL seed file

$csvPath = "d:\Edusync\Forms\elementary.csv"
$outputPath = "c:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System\database\seeds\seed_mati_sf7_personnel.sql"

# Read CSV with proper encoding
$lines = Get-Content $csvPath -Encoding UTF8

$personnel = @()
$currentDistrict = ""
$counter = 0

foreach ($line in $lines) {
    # Skip empty lines
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    # Detect district markers
    if ($line -match "^District:\s*(MATI CENTRAL|Mati North|Mati South)") {
        $currentDistrict = $matches[1]
        continue
    }
    
    # Skip header rows
    if ($line -match "^ID NO\.|^,,,SURNAME|CONSOLIDATED MASTERLIST") { continue }
    
    # Parse CSV fields
    $fields = $line -split ","
    
    # Valid personnel row: starts with 6-digit school ID
    if ($fields[0] -match '^\d{6}$') {
        $schoolId = $fields[0]
        $schoolName = $fields[1]
        $seq = $fields[2]
        $surname = if ($fields[3]) { $fields[3].Trim() } else { "" }
        $mi = if ($fields[4]) { $fields[4].Trim() } else { "" }
        $middleName = if ($fields[5]) { $fields[5].Trim() } else { "" }
        $firstName = if ($fields[6]) { $fields[6].Trim() } else { "" }
        $position = if ($fields[7]) { $fields[7].Trim() } else { "" }
        $major = if ($fields[8]) { $fields[8].Trim() } else { "" }
        
        # Only include teaching personnel (skip AO, PDO, COS staff)
        if ($seq -match '^\d+$|^School Head$|^Assistant School Head$') {
            if ($position -notmatch '^AO|^PDO|^AOII$|^COS$' -and $firstName -ne '' -and $surname -ne '') {
                $personnel += [PSCustomObject]@{
                    district = $currentDistrict
                    schoolId = $schoolId
                    surname = $surname -replace "'", "''"
                    mi = $mi -replace "'", "''"
                    middleName = $middleName -replace "'", "''"
                    firstName = $firstName -replace "'", "''"
                    position = $position -replace "'", "''"
                    major = $major -replace "'", "''"
                    isSchoolHead = ($seq -eq 'School Head')
                }
                $counter++
            }
        }
    }
}

Write-Host "Parsed $counter teaching personnel"
Write-Host "Districts: $($personnel | Group-Object district | ForEach-Object { "$($_.Name): $($_.Count)" })"

# Generate SQL
$sql = @"
-- ============================================================================
-- MATI CITY DIVISION SF7 PERSONNEL SEED
-- Source: DepEd Division of City of Mati SF7 Masterlist (elementary.csv)
-- Generated: $(Get-Date -Format "MMMM d, yyyy")
-- Total Personnel: $counter
-- Mode: UPSERT (inserts new records, updates existing ones)
-- ============================================================================

DO `$`$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
  v_teacher_id UUID;
  v_counter INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting SF7 Personnel seeding for Division of City of Mati...';
  RAISE NOTICE 'Mode: UPSERT - existing records will be updated, new ones inserted';


"@

# Group by school
$schoolGroups = $personnel | Group-Object schoolId

foreach ($school in $schoolGroups) {
    $schoolId = $school.Name
    $teachers = $school.Group
    
    $sql += @"

  -- ========================================
  -- School ID: $schoolId ($($teachers.Count) personnel)
  -- ========================================
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '$schoolId' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN
    RAISE NOTICE 'Processing school $schoolId...';

"@

    foreach ($teacher in $teachers) {
        $fullName = "$($teacher.firstName) $($teacher.mi). $($teacher.surname)".Trim()
        $fullName = $fullName -replace "\s+", " "
        $email = "$($teacher.firstName.ToLower()).$($teacher.surname.ToLower())@mati.edu.ph" -replace "[^a-z0-9@.]", ""
        $firebaseUid = "mati_$($schoolId)_$($teacher.surname.ToLower())_$($teacher.firstName.ToLower())" -replace "[^a-z0-9_]", ""
        
        # Normalize position
        $positionNormalized = switch -Regex ($teacher.position) {
            "^T-?I$|^Teacher I$" { "teacher_i" }
            "^T-?II$|^Teacher II$" { "teacher_ii" }
            "^T-?III$|^Teacher III$" { "teacher_iii" }
            "^MT-?I$|^Master Teacher I$" { "master_teacher_i" }
            "^MT-?II$|^Master Teacher II$" { "master_teacher_ii" }
            "^HT-?I$|^Head Teacher I$" { "head_teacher_i" }
            "^HT-?II$|^Head Teacher II$" { "head_teacher_ii" }
            "^HT-?III$|^Head Teacher III$" { "head_teacher_iii" }
            "^Principal I$|^P-?I$" { "principal_i" }
            "^Principal II$|^P-?II$" { "principal_ii" }
            "^Principal III$|^P-?III$" { "principal_iii" }
            "^Principal IV$|^P-?IV$" { "principal_iv" }
            "^ESP-?I$|^ESP I$" { "principal_i" }
            "^ESP-?II$|^ESP II$" { "principal_ii" }
            "^ESHT-?I$|^ESHT I$" { "head_teacher_i" }
            "^ESHT-?II$|^ESHT II$" { "head_teacher_ii" }
            "^SP-?I$" { "principal_i" }
            default { "teacher_i" }
        }
        
        $sql += @"
    
    -- $fullName ($($teacher.position))
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, '$firebaseUid', '$email', '$fullName', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '$fullName', '$($teacher.firstName)', '$($teacher.middleName)', '$($teacher.surname)', '$positionNormalized', '$($teacher.major)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET 
      name = EXCLUDED.name,
      first_name = EXCLUDED.first_name,
      middle_name = EXCLUDED.middle_name,
      last_name = EXCLUDED.last_name,
      position = EXCLUDED.position,
      major_specialization = EXCLUDED.major_specialization,
      updated_at = NOW();
    
    v_counter := v_counter + 1;

"@
    }
    
    $sql += @"
  ELSE
    RAISE NOTICE 'School $schoolId not found, skipping...';
  END IF;

"@
}

$sql += @"

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SF7 PERSONNEL SEEDING COMPLETE!';
  RAISE NOTICE '📊 Total Personnel Inserted: %', v_counter;
  RAISE NOTICE '========================================';

END `$`$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count personnel by district
SELECT 
  s.district,
  COUNT(t.id) as teacher_count
FROM teachers t
JOIN schools s ON t.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY s.district
ORDER BY s.district;

-- Count personnel by position
SELECT 
  t.position,
  COUNT(*) as count
FROM teachers t
JOIN schools s ON t.school_id = s.id
WHERE s.division = 'Division of City of Mati'
GROUP BY t.position
ORDER BY count DESC;

-- Total personnel count
SELECT COUNT(*) as total_personnel
FROM teachers t
JOIN schools s ON t.school_id = s.id
WHERE s.division = 'Division of City of Mati';
"@

# Write SQL file
$sql | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host ""
Write-Host "✅ SQL file generated: $outputPath"
Write-Host "Total Personnel: $counter"
