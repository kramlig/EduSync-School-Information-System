# Setup GitHub Project Board for Multi-Tenant Migration
# This script creates labels, milestones, and prepares for issue import

Write-Host "Setting up GitHub Project Board..." -ForegroundColor Cyan

# Repository info
$repo = "kramlig/EduSync-School-Information-System"

# Step 1: Create Labels
Write-Host "`nCreating labels..." -ForegroundColor Yellow

$labels = @(
    # Priority Labels
    @{name="p0-critical"; color="b60205"; description="Blocking issue, must fix immediately"},
    @{name="p1-high"; color="d93f0b"; description="High priority, fix soon"},
    @{name="p2-medium"; color="fbca04"; description="Medium priority, normal timeline"},
    @{name="p3-low"; color="0e8a16"; description="Low priority, future work"},
    
    # Phase Labels
    @{name="phase-1"; color="1d76db"; description="Phase 1: Foundation & Prototype (Weeks 1-2)"},
    @{name="phase-2"; color="1d76db"; description="Phase 2: Schema & Types (Weeks 3-4)"},
    @{name="phase-3"; color="1d76db"; description="Phase 3: Data Layer (Weeks 5-8)"},
    @{name="phase-4"; color="1d76db"; description="Phase 4: Security & Auth (Weeks 9-10)"},
    @{name="phase-5"; color="1d76db"; description="Phase 5: UI & UX (Weeks 11-12)"},
    @{name="phase-6"; color="1d76db"; description="Phase 6: Testing (Weeks 13-14)"},
    @{name="phase-7"; color="1d76db"; description="Phase 7: Deployment (Weeks 15-16)"},
    
    # Type Labels
    @{name="documentation"; color="0075ca"; description="Documentation updates"},
    @{name="feature"; color="a2eeef"; description="New feature or enhancement"},
    @{name="bug"; color="d73a4a"; description="Bug fix"},
    @{name="testing"; color="7057ff"; description="Testing related"},
    @{name="security"; color="ee0701"; description="Security related"},
    
    # Component Labels
    @{name="hooks"; color="c5def5"; description="React hooks changes"},
    @{name="components"; color="c5def5"; description="React components changes"},
    @{name="services"; color="c5def5"; description="Service layer changes"},
    @{name="firestore"; color="f9d0c4"; description="Firestore/database changes"},
    @{name="types"; color="e4e669"; description="TypeScript type definitions"},
    @{name="scripts"; color="d4c5f9"; description="Scripts and automation"}
)

foreach ($label in $labels) {
    Write-Host "  Creating label: $($label.name)" -ForegroundColor Gray
    
    # Check if label exists
    $exists = gh label list --repo $repo --limit 1000 --json name | ConvertFrom-Json | Where-Object { $_.name -eq $label.name }
    
    if ($exists) {
        Write-Host "    Label already exists, updating..." -ForegroundColor DarkGray
        gh label edit $label.name --repo $repo --color $label.color --description $label.description 2>$null
    } else {
        gh label create $label.name --repo $repo --color $label.color --description $label.description
    }
}

Write-Host "✓ Labels created" -ForegroundColor Green

# Step 2: Create Milestones
Write-Host "`nCreating milestones..." -ForegroundColor Yellow

$milestones = @(
    @{title="Phase 1: Foundation and Prototype"; due="2025-11-22"; description="Week 1-2: Documentation + POC"},
    @{title="Phase 2: Schema and Types"; due="2025-12-06"; description="Week 3-4: Update all TypeScript interfaces"},
    @{title="Phase 3: Data Layer Migration"; due="2026-01-03"; description="Week 5-8: Update hooks, services, components"},
    @{title="Phase 4: Security and Auth"; due="2026-01-17"; description="Week 9-10: Firestore rules, custom claims"},
    @{title="Phase 5: UI and UX Updates"; due="2026-01-31"; description="Week 11-12: Multi-school UI, settings migration"},
    @{title="Phase 6: Testing and Validation"; due="2026-02-14"; description="Week 13-14: Comprehensive testing"},
    @{title="Phase 7: Data Migration and Deployment"; due="2026-02-28"; description="Week 15-16: Production migration"}
)

foreach ($milestone in $milestones) {
    Write-Host "  Creating milestone: $($milestone.title)" -ForegroundColor Gray
    
    # Check if milestone exists
    $exists = gh milestone list --repo $repo --json title | ConvertFrom-Json | Where-Object { $_.title -eq $milestone.title }
    
    if (-not $exists) {
        gh api repos/$repo/milestones -f title="$($milestone.title)" -f description="$($milestone.description)" -f due_on="$($milestone.due)T23:59:59Z" -f state="open"
    } else {
        Write-Host "    Milestone already exists" -ForegroundColor DarkGray
    }
}

Write-Host "✓ Milestones created" -ForegroundColor Green

Write-Host "`n✓ GitHub Project setup complete!" -ForegroundColor Green
Write-Host "  Project URL: https://github.com/users/kramlig/projects/1" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Visit the project board and customize column names" -ForegroundColor Gray
Write-Host "  2. Import issues from GITHUB_ISSUES_TRACKER.md manually or via script" -ForegroundColor Gray
Write-Host "  3. Configure project automation settings" -ForegroundColor Gray
