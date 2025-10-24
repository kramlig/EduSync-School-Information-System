# Teacher UAT - Quick Test Script
# Run automated tests for teacher assignment filtering

Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host "TEACHER UAT - AUTOMATED TEST RUNNER"
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host ""

Write-Host "📋 Test Configuration:" -ForegroundColor Cyan
Write-Host "   Target: https://edusync-sis.web.app" -ForegroundColor Gray
Write-Host "   Account: pedro.reyes@edusync.edu" -ForegroundColor Gray
Write-Host "   Expected: Grade 4 sections only, ~18-20 students" -ForegroundColor Gray
Write-Host ""

# Check if Playwright is installed
Write-Host "🔍 Checking test dependencies..." -ForegroundColor Yellow
$playwrightInstalled = $false

try {
    $npmList = npm list @playwright/test 2>&1
    if ($LASTEXITCODE -eq 0) {
        $playwrightInstalled = $true
        Write-Host "   ✅ Playwright is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Playwright not found" -ForegroundColor Red
}

if (-not $playwrightInstalled) {
    Write-Host ""
    Write-Host "⚠️  Playwright not installed. Installing now..." -ForegroundColor Yellow
    npm install -D @playwright/test
    npx playwright install chromium
    Write-Host ""
}

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host "RUNNING AUTOMATED TESTS"
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host ""

# Run the tests
Write-Host "🧪 Executing test suite..." -ForegroundColor Cyan
Write-Host ""

npx playwright test tests/teacher-uat-script.spec.ts --reporter=list --headed

Write-Host ""
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host "TEST EXECUTION COMPLETE"
Write-Host "=" -NoNewline; Write-Host ("=" * 79)
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Review test output above" -ForegroundColor Gray
    Write-Host "   2. Perform manual testing using docs/TEACHER_UAT_GUIDE.md" -ForegroundColor Gray
    Write-Host "   3. Document any issues found" -ForegroundColor Gray
    Write-Host "   4. Sign off on UAT if all tests pass" -ForegroundColor Gray
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Review failed test details above" -ForegroundColor Gray
    Write-Host "   2. Check browser screenshots in test-results folder" -ForegroundColor Gray
    Write-Host "   3. Verify expected behavior in docs/TEACHER_UAT_GUIDE.md" -ForegroundColor Gray
    Write-Host "   4. Report issues to development team" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📁 Test Reports Location:" -ForegroundColor Cyan
Write-Host "   • Automated Results: test-results/" -ForegroundColor Gray
Write-Host "   • Manual Checklist: docs/TEACHER_UAT_GUIDE.md" -ForegroundColor Gray
Write-Host "   • Screenshots: test-results/[test-name]/" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
