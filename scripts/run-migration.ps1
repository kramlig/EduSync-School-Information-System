# Run SQL migration on Supabase using REST API
# Usage: .\scripts\run-migration.ps1 -migrationFile "009_create_schools_table.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$migrationFile
)

$migrationPath = Join-Path $PSScriptRoot "..\database\migrations\$migrationFile"
if (-not (Test-Path $migrationPath)) {
    Write-Error "Migration file not found: $migrationPath"
    exit 1
}

$sqlContent = Get-Content $migrationPath -Raw

# Supabase connection details
$supabaseUrl = "https://zjuxulhxxeeupcskkcok.supabase.co"
$supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqdXh1bGh4eGVldXBjc2trY29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjUzNjQ1MCwiZXhwIjoyMDQ4MTEyNDUwfQ.pKqXRGTgBJMOPMPpuHU0xOqFTB0x_a1KU7R9yG0dShs"

Write-Host "Running migration: $migrationFile" -ForegroundColor Cyan

# Execute SQL via Supabase REST API
$body = @{
    query = $sqlContent
} | ConvertTo-Json

$headers = @{
    "apikey" = $supabaseServiceKey
    "Authorization" = "Bearer $supabaseServiceKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host $response
} catch {
    Write-Error "❌ Migration failed: $_"
    Write-Error $_.Exception.Message
    exit 1
}
