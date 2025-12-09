# generate-student-seeds.ps1
# Generates batched SQL files to seed 36k-39k students across all Mati schools

$outputDir = "c:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System\database\seeds\students"

# Create output directory
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# School data - Elementary (53) + Secondary (18) = 71 schools
$schools = @(
    # Elementary - Mati Central (14)
    @{id="129374"; name="Badas ES"; district="Central"; type="Elementary"}
    @{id="129375"; name="Baso ES"; district="Central"; type="Elementary"}
    @{id="129376"; name="Belsonda ES"; district="Central"; type="Elementary"}
    @{id="129377"; name="BLISS ES"; district="Central"; type="Elementary"}
    @{id="129380"; name="Rabat-Rocamora Mati Central ES I"; district="Central"; type="Elementary"}
    @{id="129381"; name="Rabat-Rocamora Mati Central ES II"; district="Central"; type="Elementary"}
    @{id="129382"; name="Mayor Luisito G. Rabat MS"; district="Central"; type="Elementary"}
    @{id="129383"; name="Mayor Santiago Garcia MS"; district="Central"; type="Elementary"}
    @{id="129384"; name="Sudlon ES"; district="Central"; type="Elementary"}
    @{id="129385"; name="Tagawisan ES"; district="Central"; type="Elementary"}
    @{id="129386"; name="Onotan Daganio Tagbobolo ES"; district="Central"; type="Elementary"}
    @{id="205504"; name="Rabat-Rocamora SPED"; district="Central"; type="Elementary"}
    @{id="500454"; name="Licop IS"; district="Central"; type="Integrated"}
    @{id="501424"; name="Culian IS"; district="Central"; type="Integrated"}
    
    # Elementary - Mati North (24)
    @{id="129387"; name="Alberto V. Ravelo ES"; district="North"; type="Elementary"}
    @{id="129388"; name="Antonino Vicentino ES"; district="North"; type="Elementary"}
    @{id="129389"; name="Benito G. Rabat Exec ES"; district="North"; type="Elementary"}
    @{id="129390"; name="Bobon ES"; district="North"; type="Elementary"}
    @{id="129391"; name="Buso ES"; district="North"; type="Elementary"}
    @{id="129392"; name="Cabubuanan ES"; district="North"; type="Elementary"}
    @{id="129393"; name="Cangusan ES"; district="North"; type="Elementary"}
    @{id="129394"; name="Serafin Vizconde Sr ES"; district="North"; type="Elementary"}
    @{id="129395"; name="Don Luis Rabat Sr MS"; district="North"; type="Elementary"}
    @{id="129396"; name="Don Salvador Lopez ES"; district="North"; type="Elementary"}
    @{id="129397"; name="Gavino Dawang ES"; district="North"; type="Elementary"}
    @{id="129398"; name="Gov Leopoldo Lopez Sr MS"; district="North"; type="Elementary"}
    @{id="129399"; name="Don Enrique Lopez ES"; district="North"; type="Elementary"}
    @{id="129400"; name="Paterno Madanlo Matiao Central ES"; district="North"; type="Elementary"}
    @{id="129401"; name="Pedro Malintad ES"; district="North"; type="Elementary"}
    @{id="129402"; name="Sta Cruz ES"; district="North"; type="Elementary"}
    @{id="129403"; name="Tagabakid ES"; district="North"; type="Elementary"}
    @{id="129405"; name="Taguibo ES"; district="North"; type="Elementary"}
    @{id="129406"; name="Tamia ES"; district="North"; type="Elementary"}
    @{id="129407"; name="Tamisan ES"; district="North"; type="Elementary"}
    @{id="129408"; name="Fausta Salazar Como MS"; district="North"; type="Elementary"}
    @{id="129409"; name="Vicente Almario Sr MS"; district="North"; type="Elementary"}
    @{id="502726"; name="Bugakan IS"; district="North"; type="Integrated"}
    @{id="502727"; name="Tagbinonga IS"; district="North"; type="Integrated"}
    
    # Elementary - Mati South (15)
    @{id="102157"; name="Catmonan ES"; district="South"; type="Elementary"}
    @{id="102164"; name="Talucanga ES"; district="South"; type="Elementary"}
    @{id="129410"; name="Brigido Rodriguez Sr ES"; district="South"; type="Elementary"}
    @{id="129412"; name="Asuncion Rondina Perez MS"; district="South"; type="Elementary"}
    @{id="129413"; name="Dawan CES"; district="South"; type="Elementary"}
    @{id="129414"; name="Francisco Hinayon ES"; district="South"; type="Elementary"}
    @{id="129417"; name="Macambol ES"; district="South"; type="Elementary"}
    @{id="129418"; name="Magum ES"; district="South"; type="Elementary"}
    @{id="129419"; name="Gelacio G Ytac ES"; district="South"; type="Elementary"}
    @{id="129420"; name="Sanghay ES"; district="South"; type="Elementary"}
    @{id="129421"; name="Paciano A Genon EMS"; district="South"; type="Elementary"}
    @{id="129422"; name="Wagon ES"; district="South"; type="Elementary"}
    @{id="501085"; name="Cabuaya IS"; district="South"; type="Integrated"}
    @{id="501086"; name="Lanca IS"; district="South"; type="Integrated"}
    @{id="501087"; name="Luban IS"; district="South"; type="Integrated"}
    
    # Secondary - Mati Central (5)
    @{id="325104"; name="Badas NHS"; district="Central"; type="Secondary"}
    @{id="305680"; name="City of Mati NHS"; district="Central"; type="Secondary"}
    @{id="304328"; name="DORSHS"; district="Central"; type="Secondary"}
    @{id="304325"; name="MNCHS"; district="Central"; type="Secondary"}
    @{id="304326"; name="MSAT"; district="Central"; type="Secondary"}
    
    # Secondary - Mati North (10)
    @{id="304303"; name="Bobon NHS"; district="North"; type="Secondary"}
    @{id="304305"; name="Buso NHS"; district="North"; type="Secondary"}
    @{id="304314"; name="Don Enrique Lopez NHS"; district="North"; type="Secondary"}
    @{id="316104"; name="Don Salvador Lopez NHS"; district="North"; type="Secondary"}
    @{id="325101"; name="Dona Rosa NHS"; district="North"; type="Secondary"}
    @{id="325102"; name="Lawigan NHS"; district="North"; type="Secondary"}
    @{id="304318"; name="Libudon NHS"; district="North"; type="Secondary"}
    @{id="304327"; name="Matiao NHS"; district="North"; type="Secondary"}
    @{id="325106"; name="Mayo NHS"; district="North"; type="Secondary"}
    @{id="304338"; name="Taguibo Agri Voc HS"; district="North"; type="Secondary"}
    
    # Secondary - Mati South (3)
    @{id="304313"; name="Dawan NHS"; district="South"; type="Secondary"}
    @{id="325105"; name="Macambol NHS"; district="South"; type="Secondary"}
    @{id="306039"; name="Sanghay NHS"; district="South"; type="Secondary"}
)

# Filipino names data
$firstNamesMale = @('Juan','Jose','Pedro','Carlos','Miguel','Gabriel','Rafael','Antonio','Francisco','Manuel','Andres','Diego','Fernando','Ricardo','Eduardo','Roberto','Alejandro','Javier','Luis','Daniel','Marco','Adrian','Bryan','Kevin','Christian','Joshua','Mark','John','James','Michael','Kenneth','Raymond','Patrick','Vincent','Jerome','Reymart','Jayson','Aldrin','Arjay','Justine','Carlo','Angelo','Ariel','Benedict','Cedric','Darwin','Emmanuel','Frederick','Gerald','Harold','Ian','Jasper','Kyle','Lester','Neil','Oscar','Paul','Quincy','Rodel','Samuel','Timothy','Ulysses','Victor','Wilson','Xavier','Yohan','Zach')
$firstNamesFemale = @('Maria','Ana','Rosa','Elena','Sofia','Isabella','Camila','Valentina','Lucia','Carmen','Angela','Patricia','Teresa','Beatriz','Gloria','Cristina','Daniela','Andrea','Paula','Gabriela','Nicole','Jasmine','Kimberly','Ashley','Michelle','Samantha','Jennifer','Jessica','Sarah','Emily','Katherine','Stephanie','Christine','Melissa','Angelica','Jessa','Alyssa','Princess','Lovely','Angel','Althea','Bianca','Clarissa','Denise','Erica','Faith','Grace','Hannah','Irene','Joanne','Kristen','Lovely','Megan','Nina','Olivia','Patricia','Queen','Rachel','Sheena','Trisha','Una','Vanessa','Wendy','Xyza','Yvonne','Zenaida')
$lastNames = @('Santos','Reyes','Cruz','Garcia','Mendoza','Torres','Flores','Gonzales','Ramos','Bautista','Villanueva','Fernandez','Lopez','Martinez','Rodriguez','Hernandez','Perez','Sanchez','Ramirez','Morales','Castro','Dela Cruz','Rivera','Aquino','Navarro','Diaz','Pascual','Salazar','Valdez','Domingo','Aguilar','Soriano','Mercado','Del Rosario','Ocampo','Manalo','Castillo','Francisco','Tolentino','Salvador','Panganiban','Corpuz','Antonio','Ignacio','De Guzman','David','Jimenez','Padilla','Magno','Espinosa','Vizconde','Rabat','Almario','Dawang','Malintad','Genon','Ytac')
$middleNames = @('Aquino','Bautista','Corpuz','Delos Santos','Enriquez','Franco','Galang','Herrera','Ilagan','Javier','Kapunan','Lacson','Magpayo','Natividad','Ocampo','Ponce','Quizon','Reyes','Santiago','Tan','Velasco','Alba','Balao','Cabal','Dagsa','Estrada','Fajardo','Gomez','Hugo','Ibarra')
$barangays = @('Badas','Baso','Belsonda','BLISS','Bobon','Buso','Cabubuanan','Cangusan','Catmonan','Culian','Dahican','Dawan','Don Enrique Lopez','Don Martin Marundan','Langka','Lawigan','Libudon','Licop','Luban','Macambol','Magsaysay','Magum','Matiao','Mayo','Sainz','Sanghay','Sinayawan','Sudlon','Tagabakid','Tagawisan','Tagbinonga','Tagbobolo','Taguibo','Tamia','Tamisan','Tinagacan','Wagon','Cabuaya','Lanca','Talucanga','Sta. Cruz','Calapagan','Poblacion')

# Calculate students per school (~550 average for 71 schools = ~39k)
$totalTarget = 38500
$studentsPerSchool = [math]::Floor($totalTarget / $schools.Count)

Write-Host "Generating student seeds..."
Write-Host "Schools: $($schools.Count)"
Write-Host "Target students per school: $studentsPerSchool"
Write-Host "Total target: ~$totalTarget students"
Write-Host ""

# First create the cleanup file
$cleanupSql = @"
-- ============================================================================
-- BATCH 0: CLEANUP - Delete all existing students
-- Run this FIRST before any student batches
-- ============================================================================

-- Delete all students for Mati Division schools
DELETE FROM students WHERE school_id IN (
  SELECT id FROM schools WHERE division = 'Division of City of Mati'
);

-- Verify cleanup
SELECT COUNT(*) as remaining_students FROM students 
WHERE school_id IN (SELECT id FROM schools WHERE division = 'Division of City of Mati');

SELECT 'Cleanup complete. Ready for student seeding.' as status;
"@

$cleanupSql | Out-File -FilePath "$outputDir\batch_0_cleanup.sql" -Encoding UTF8
Write-Host "Created: batch_0_cleanup.sql"

# Generate batches (each batch = ~5000 students for manageable file size)
$batchSize = 5000
$lrnCounter = 100000000001
$totalStudents = 0
$batchNum = 0
$currentBatchStudents = 0
$sql = ""

function Start-NewBatch {
    param($num)
    return @"
-- ============================================================================
-- BATCH ${num} - Student Seed (~5000 students)
-- Division of City of Mati
-- ============================================================================

INSERT INTO students (id, school_id, lrn, name, first_name, middle_name, last_name, gender, date_of_birth, grade_level, address, enrollment_status, created_at, updated_at)
VALUES

"@
}

function Get-RandomElement {
    param($arr)
    return $arr[(Get-Random -Maximum $arr.Count)]
}

$batchNum = 1
$sql = Start-NewBatch $batchNum
$isFirst = $true

foreach ($school in $schools) {
    # Vary students per school (±100)
    $schoolStudents = $studentsPerSchool + (Get-Random -Minimum -100 -Maximum 100)
    
    # Elementary: grades 1-6, Secondary: grades 7-12
    $gradeMin = if ($school.type -eq "Secondary") { 7 } else { 1 }
    $gradeMax = if ($school.type -eq "Secondary") { 12 } else { 6 }
    
    for ($i = 0; $i -lt $schoolStudents; $i++) {
        # Random student data
        $gender = if ((Get-Random -Maximum 2) -eq 0) { "male" } else { "female" }
        $firstName = if ($gender -eq "male") { Get-RandomElement $firstNamesMale } else { Get-RandomElement $firstNamesFemale }
        $lastName = Get-RandomElement $lastNames
        $middleName = Get-RandomElement $middleNames
        $mi = $middleName.Substring(0,1)
        $fullName = "$firstName $mi. $lastName"
        $grade = Get-Random -Minimum $gradeMin -Maximum ($gradeMax + 1)
        $birthYear = 2025 - ($grade + 5 + (Get-Random -Maximum 2))
        $birthMonth = Get-Random -Minimum 1 -Maximum 13
        $birthDay = Get-Random -Minimum 1 -Maximum 29
        $birthDate = "{0:D4}-{1:D2}-{2:D2}" -f $birthYear, $birthMonth, $birthDay
        $barangay = Get-RandomElement $barangays
        $address = "$barangay, City of Mati, Davao Oriental"
        
        # Escape single quotes
        $fullName = $fullName -replace "'", "''"
        $firstName = $firstName -replace "'", "''"
        $middleName = $middleName -replace "'", "''"
        $lastName = $lastName -replace "'", "''"
        $address = $address -replace "'", "''"
        
        $comma = if ($isFirst) { "" } else { "," }
        $isFirst = $false
        
        $sql += @"
$comma
  (gen_random_uuid(), (SELECT id FROM schools WHERE school_id_number = '$($school.id)' LIMIT 1), '$lrnCounter', '$fullName', '$firstName', '$middleName', '$lastName', '$gender', '$birthDate', $grade, '$address', 'enrolled', NOW(), NOW())
"@
        
        $lrnCounter++
        $totalStudents++
        $currentBatchStudents++
        
        # Start new batch if needed
        if ($currentBatchStudents -ge $batchSize) {
            $sql += ";" + "`n`n-- Batch $batchNum complete: $currentBatchStudents students"
            $sql | Out-File -FilePath "$outputDir\batch_${batchNum}_students.sql" -Encoding UTF8
            Write-Host "Created: batch_${batchNum}_students.sql ($currentBatchStudents students)"
            
            $batchNum++
            $currentBatchStudents = 0
            $sql = Start-NewBatch $batchNum
            $isFirst = $true
        }
    }
}

# Write final batch
if ($currentBatchStudents -gt 0) {
    $sql += ";" + "`n`n-- Batch $batchNum complete: $currentBatchStudents students"
    $sql | Out-File -FilePath "$outputDir\batch_${batchNum}_students.sql" -Encoding UTF8
    Write-Host "Created: batch_${batchNum}_students.sql ($currentBatchStudents students)"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "STUDENT SEED GENERATION COMPLETE"
Write-Host "=========================================="
Write-Host "Total batches: $batchNum"
Write-Host "Total students: $totalStudents"
Write-Host ""
Write-Host "Run in order in Supabase SQL Editor:"
Write-Host "  1. batch_0_cleanup.sql"
for ($i = 1; $i -le $batchNum; $i++) {
    Write-Host "  $($i+1). batch_${i}_students.sql"
}
