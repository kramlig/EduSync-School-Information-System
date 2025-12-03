# Safe Console Log Removal Script
# This script removes console.log/warn/error/info/debug statements
# while preserving code structure and avoiding syntax errors

$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" -File

$totalRemoved = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Pattern 1: Single-line console statements (most common)
    # console.log('something');
    # console.error('error', error);
    $content = $content -replace "^\s*console\.(log|warn|error|info|debug)\([^;]*\);\s*$", "" -split "`n" -join "`n"
    
    # Pattern 2: Console statements at end of line with semicolon
    # const x = 5; console.log(x);
    $content = $content -replace ";\s*console\.(log|warn|error|info|debug)\([^;]*\);", ";"
    
    # Pattern 3: Standalone console statements with various formatting
    $lines = $content -split "`n"
    $newLines = @()
    $skipNext = $false
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        
        # Skip if we're in a multi-line console statement continuation
        if ($skipNext) {
            if ($line -match '^\s*\);?\s*$') {
                $skipNext = $false
            }
            continue
        }
        
        # Check if this line starts a console statement
        if ($line -match '^\s*console\.(log|warn|error|info|debug)\(') {
            # Check if it's complete on one line
            if ($line -match '\);?\s*$') {
                # Complete single line - skip it
                continue
            } else {
                # Multi-line console statement - skip this and following lines
                $skipNext = $true
                continue
            }
        }
        
        $newLines += $line
    }
    
    $content = $newLines -join "`n"
    
    # Count changes
    if ($content -ne $originalContent) {
        $removed = ([regex]::Matches($originalContent, "console\.(log|warn|error|info|debug)")).Count
        $totalRemoved += $removed
        $filesModified++
        
        # Save the file
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ $($file.Name): Removed $removed console statements" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "Files Modified: $filesModified" -ForegroundColor Yellow
Write-Host "Console Statements Removed: $totalRemoved" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
