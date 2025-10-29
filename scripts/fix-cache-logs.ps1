# PowerShell script to fix all cache logging statements in useSchoolData.ts
# Wraps all console.log(snapshot.metadata.fromCache...) with ENABLE_CACHE_LOGS flag

$filePath = "C:\Users\Mark Gil Dotillos\Workspaces\EduSyncSIS\EduSync-School-Information-System\hooks\useSchoolData.ts"

# Read the file content
$content = Get-Content $filePath -Raw

# Replace all cache logging patterns
# Pattern 1: console.log(snapshot.metadata.fromCache ? '📦 [collection] CACHE' : '📡 [collection] SERVER');
$content = $content -replace "console\.log\(snapshot\.metadata\.fromCache \? '📦 \[([^\]]+)\] CACHE' : '📡 \[([^\]]+)\] SERVER'\);", 'if (ENABLE_CACHE_LOGS) { console.log(snapshot.metadata.fromCache ? ''📦 [$1] CACHE'' : ''📡 [$2] SERVER''); }'

# Save the updated content
Set-Content -Path $filePath -Value $content -Encoding UTF8

Write-Host "✅ Fixed all cache logging statements in useSchoolData.ts"
Write-Host "All console.log(snapshot.metadata.fromCache...) statements are now wrapped with ENABLE_CACHE_LOGS flag"