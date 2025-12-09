# parse-secondary-personnel.ps1
# Parses SF7 secondary personnel data from Secondary.csv

$csvPath = "d:\Edusync\Forms\Secondary.csv"
$outputDir = "c:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System\database\seeds\personnel"

# School ID mapping from enrollment report
$schoolIdMap = @{
    "BADAS NHS" = "325104"
    "BOBON NHS" = "304303"
    "BUSO NHS" = "304305"
    "CABUAYA IS" = "501085"
    "CITY OF MATI NATIONAL HIGH SCHOOL" = "305680"
    "CULIAN IS" = "501424"
    "DAWAN NHS" = "304313"
    "DAVAO ORIENTAL REGIONAL SCIENCE HS" = "304328"
    "DON ENRIQUE LOPEZ NHS" = "304314"
    "DON SALVADOR LOPEZ NHS" = "316104"
    "DOÑA ROSA G. RABAT MEMORIAL SCHOOL" = "325101"
    "DONA ROSA G. RABAT MEMORIAL SCHOOL" = "325101"
    "LANCA IS" = "501086"
    "LAWIGAN NHS" = "325102"
    "LIBUDON NHS" = "304318"
    "LICOP IS" = "500454"
    "LUBAN IS" = "501087"
    "MACAMBOL NHS" = "325105"
    "MATI NATIONAL COMP. HS" = "304325"
    "MATI SCHOOL OF ARTS & TRADES" = "304326"
    "MATIAO NHS" = "304327"
    "MAYO NHS" = "325106"
    "SANGHAY NHS" = "306039"
    "TAGUIBO AGRI. VOC. HS" = "304338"
}

$lines = Get-Content $csvPath -Encoding UTF8
$personnel = @()
$currentSchool = ""
$currentSchoolId = ""
$counter = 0

foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $fields = $line -split ","
    
    # Detect school header (has "SCHOOL NAME" or school name in column 2)
    if ($fields[1] -eq "SCHOOL NAME" -and $fields[0] -match '^\d{6}$') {
        $currentSchoolId = $fields[0]
        $currentSchool = $fields[2]
        continue
    }
    
    # Get school name from column 2 if it's a personnel row
    if ($fields[1] -and $fields[1] -ne "SCHOOL NAME") {
        $schoolName = $fields[1].Trim().ToUpper()
        if ($schoolIdMap.ContainsKey($schoolName)) {
            $currentSchool = $schoolName
            $currentSchoolId = $schoolIdMap[$schoolName]
        }
    }
    
    # Skip header rows, non-teaching staff, School Head line without number
    if ($fields[0] -eq "" -or $fields[0] -match "^,|SCHOOL NAME") { continue }
    if ($fields[2] -eq "NT-JHS" -or $fields[2] -eq "NT-SHS") { continue }
    if ($fields[2] -eq "School Head" -and $fields[0] -eq "") { continue }
    
    # Parse teaching personnel
    $seq = $fields[0]
    $level = $fields[2]  # JHS, SHS, School Head
    $surname = if ($fields[3]) { $fields[3].Trim() -replace "'", "''" } else { "" }
    $mi = if ($fields[4]) { $fields[4].Trim() -replace "'", "''" } else { "" }
    $middleName = if ($fields[5]) { $fields[5].Trim() -replace "'", "''" } else { "" }
    $firstName = if ($fields[6]) { $fields[6].Trim() -replace "'", "''" } else { "" }
    $position = if ($fields[7]) { $fields[7].Trim() -replace "'", "''" } else { "" }
    $major = if ($fields[8]) { $fields[8].Trim() -replace "'", "''" } else { "" }
    
    # Only include teaching personnel with valid names
    if ($seq -match '^\d+$|^School Head$|^Assistant School Head$') {
        if ($firstName -ne '' -and $surname -ne '' -and $currentSchoolId -ne '') {
            $personnel += [PSCustomObject]@{
                schoolId = $currentSchoolId
                schoolName = $currentSchool
                level = $level
                surname = $surname
                mi = $mi
                middleName = $middleName
                firstName = $firstName
                position = $position
                major = $major
                isSchoolHead = ($seq -eq 'School Head' -or $level -eq 'School Head')
            }
            $counter++
        }
    }
}

Write-Host "Parsed $counter secondary teaching personnel"
Write-Host "Schools: $($personnel | Group-Object schoolId | Measure-Object | Select-Object -ExpandProperty Count)"

# Generate SQL
$outputPath = "$outputDir\batch_4_secondary_personnel.sql"

$sql = @"
-- ============================================================================
-- BATCH 4 - SECONDARY SCHOOLS PERSONNEL
-- Source: DepEd Division of City of Mati SF7 Masterlist (Secondary.csv)
-- Personnel Count: $counter
-- ============================================================================

DO `$`$
DECLARE
  v_school_id UUID;
  v_user_id UUID;
BEGIN
  RAISE NOTICE 'Processing Secondary Schools Personnel ($counter teachers)...';

"@

# Group by school
$schoolGroups = $personnel | Group-Object schoolId

foreach ($school in $schoolGroups) {
    $schoolId = $school.Name
    $teachers = $school.Group
    $schoolName = $teachers[0].schoolName
    
    $sql += @"

  -- School: $schoolName ($schoolId) - $($teachers.Count) personnel
  SELECT id INTO v_school_id FROM schools WHERE school_id_number = '$schoolId' LIMIT 1;
  
  IF v_school_id IS NOT NULL THEN

"@

    foreach ($teacher in $teachers) {
        $fullName = "$($teacher.firstName) $($teacher.mi). $($teacher.surname)".Trim() -replace "\s+", " "
        $email = "$($teacher.firstName.ToLower()).$($teacher.surname.ToLower())@mati.edu.ph" -replace "[^a-z0-9@.]", ""
        $firebaseUid = "mati_sec_$($schoolId)_$($teacher.surname.ToLower())_$($teacher.firstName.ToLower())" -replace "[^a-z0-9_]", ""
        
        # Normalize position for secondary
        $positionNormalized = switch -Regex ($teacher.position) {
            "^T-?I$|^Teacher I$" { "teacher_i" }
            "^T-?II$|^Teacher II$" { "teacher_ii" }
            "^T-?III$|^Teacher III$" { "teacher_iii" }
            "^ST-?I$|^Special Teacher I$" { "teacher_i" }
            "^ST-?II$|^Special Teacher II$" { "teacher_ii" }
            "^ST-?III$|^Special Teacher III$" { "teacher_iii" }
            "^SST-?I$" { "teacher_i" }
            "^SST-?II$" { "teacher_ii" }
            "^MT-?I$|^Master Teacher I$" { "master_teacher_i" }
            "^MT-?II$|^Master Teacher II$" { "master_teacher_ii" }
            "^HT-?I$|^Head Teacher I$" { "head_teacher_i" }
            "^HT-?II$|^Head Teacher II$" { "head_teacher_ii" }
            "^HT-?III$|^Head Teacher III$" { "head_teacher_iii" }
            "^SP-?I$|^Principal I$" { "principal_i" }
            "^SP-?II$|^Principal II$" { "principal_ii" }
            "^SP-?III$|^Principal III$" { "principal_iii" }
            "^SP-?IV$|^Principal IV$" { "principal_iv" }
            "^ESP" { "principal_i" }
            default { "teacher_i" }
        }
        
        $sql += @"
    -- $fullName ($($teacher.position)) - $($teacher.level)
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
  ELSE
    RAISE NOTICE 'School $schoolId not found';
  END IF;

"@
}

$sql += @"

  RAISE NOTICE 'Secondary Personnel seeding complete!';
END `$`$;

-- Verify
SELECT 
  s.school_id_number,
  s.name,
  COUNT(t.id) as teachers
FROM schools s
LEFT JOIN teachers t ON t.school_id = s.id
WHERE s.division = 'Division of City of Mati'
  AND (s.name ILIKE '%NHS%' OR s.name ILIKE '%National High%' OR s.name ILIKE '%Integrated%')
GROUP BY s.id, s.school_id_number, s.name
ORDER BY s.school_id_number;
"@

$sql | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host ""
Write-Host "Created: $outputPath"
Write-Host "Personnel: $counter"
