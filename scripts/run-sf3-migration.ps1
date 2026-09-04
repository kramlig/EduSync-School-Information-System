# Run SF3 Migration to Supabase
# This script executes the books tables migration

$SUPABASE_URL = "https://zjuxulhxxeeupcskkcok.supabase.co"
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_SERVICE_KEY) {
    Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'" -ForegroundColor Yellow
    exit 1
}

# Read the SQL file
$sqlContent = Get-Content "supabase\migrations\create_books_tables.sql" -Raw

# Execute via Supabase REST API
$headers = @{
    "apikey" = $SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    query = $sqlContent
} | ConvertTo-Json

try {
    Write-Host "Executing SF3 migration..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "✅ Migration executed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
