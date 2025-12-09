# parse-personnel-batched.ps1
# Parses SF7 personnel data and generates SMALLER batch SQL files

$csvPath = "d:\Edusync\Forms\elementary.csv"
$outputDir = "c:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System\database\seeds\personnel"

# Create output directory
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Read CSV
$lines = Get-Content $csvPath -Encoding UTF8

$personnel = @()
$currentDistrict = ""

foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    if ($line -match "^District:\s*(MATI CENTRAL|Mati North|Mati South)") {
        $currentDistrict = $matches[1]
        continue
    }
    
    if ($line -match "^ID NO\.|^,,,SURNAME|CONSOLIDATED MASTERLIST") { continue }
    
    $fields = $line -split ","
    
    if ($fields[0] -match '^\d{6}$') {
        $schoolId = $fields[0]
        $seq = $fields[2]
        $surname = if ($fields[3]) { $fields[3].Trim() } else { "" }
        $mi = if ($fields[4]) { $fields[4].Trim() } else { "" }
        $middleName = if ($fields[5]) { $fields[5].Trim() } else { "" }
        $firstName = if ($fields[6]) { $fields[6].Trim() } else { "" }
        $position = if ($fields[7]) { $fields[7].Trim() } else { "" }
        $major = if ($fields[8]) { $fields[8].Trim() } else { "" }
        
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
                }
            }
        }
    }
}

Write-Host "Parsed $($personnel.Count) teaching personnel"

# Group by district
$districtGroups = $personnel | Group-Object district

$batchNum = 0
foreach ($districtGroup in $districtGroups) {
    $districtName = $districtGroup.Name
    $districtPersonnel = $districtGroup.Group
    $safeDistrictName = $districtName -replace " ", "_"
    
    $batchNum++
    $outputPath = "$outputDir\batch_${batchNum}_${safeDistrictName}.sql"
    
    $sql = @"
-- ============================================================================
-- BATCH ${batchNum} - $districtName District
-- Personnel Count: $($districtPersonnel.Count)
-- ============================================================================

DO `$`$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing $districtName District ($($districtPersonnel.Count) personnel)...';

"@

    # Group by school within district
    $schoolGroups = $districtPersonnel | Group-Object schoolId
    
    foreach ($school in $schoolGroups) {
        $schoolId = $school.Name
        $teachers = $school.Group
        
        $sql += @"

  -- School: $schoolId ($($teachers.Count) personnel)
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '$schoolId' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN

"@

        foreach ($teacher in $teachers) {
            $fullName = "$($teacher.firstName) $($teacher.mi). $($teacher.surname)".Trim() -replace "\s+", " "
            $email = "$($teacher.firstName.ToLower()).$($teacher.surname.ToLower())@mati.edu.ph" -replace "[^a-z0-9@.]", ""
            $firebaseUid = "mati_$($schoolId)_$($teacher.surname.ToLower())_$($teacher.firstName.ToLower())" -replace "[^a-z0-9_]", ""
            
            $positionNormalized = switch -Regex ($teacher.position) {
                "^T-?I$|^Teacher I$" { "teacher_i" }
                "^T-?II$|^Teacher II$" { "teacher_ii" }
                "^T-?III$|^Teacher III$" { "teacher_iii" }
                "^MT-?I$|^Master Teacher I$" { "master_teacher_i" }
                "^MT-?II$|^Master Teacher II$" { "master_teacher_ii" }
                "^HT-?I$|^Head Teacher I$" { "head_teacher_i" }
                "^HT-?II$|^Head Teacher II$" { "head_teacher_ii" }
                "^HT-?III$|^Head Teacher III$" { "head_teacher_iii" }
                "^Principal|^P-?I|^ESP|^SP" { "principal_i" }
                default { "teacher_i" }
            }
            
            $sql += @"
    -- $fullName
    INSERT INTO users (id, school_id, firebase_uid, email, name, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, '$firebaseUid', '$email', '$fullName', 'teacher', true, NOW(), NOW())
    ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    INSERT INTO teachers (id, school_id, user_id, name, first_name, middle_name, last_name, position, major_specialization, employment_status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_school_id, v_user_id, '$fullName', '$($teacher.firstName)', '$($teacher.middleName)', '$($teacher.surname)', '$positionNormalized', '$($teacher.major)', 'permanent', NOW(), NOW())
    ON CONFLICT (school_id, user_id) DO UPDATE SET name = EXCLUDED.name, position = EXCLUDED.position, major_specialization = EXCLUDED.major_specialization, updated_at = NOW();

"@
        }
        
        $sql += @"
  END IF;

"@
    }

    # Normalize district name for database (proper case)
    $districtDbName = switch ($districtName) {
        "MATI CENTRAL" { "Mati Central" }
        "Mati North" { "Mati North" }
        "Mati South" { "Mati South" }
        default { $districtName }
    }
    
    $sql += @"

  RAISE NOTICE '$districtName District complete!';
END `$`$;

-- Verify
SELECT COUNT(*) as "${districtDbName} Personnel" FROM teachers t 
JOIN schools s ON t.school_id = s.id 
WHERE s.district ILIKE '%${districtDbName}%';
"@

    $sql | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "Created: batch_${batchNum}_${safeDistrictName}.sql ($($districtPersonnel.Count) personnel)"
}

Write-Host ""
Write-Host "=== BATCHES CREATED ==="
Write-Host "Run in order:"
Get-ChildItem $outputDir -Filter "*.sql" | ForEach-Object { Write-Host "  - $($_.Name)" }
