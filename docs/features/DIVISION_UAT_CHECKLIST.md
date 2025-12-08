# Division-Level Access - User Acceptance Testing Checklist

> **Version**: 1.1.0  
> **Last Updated**: December 9, 2025  
> **Status**: Ready for UAT (Performance Optimized)

---

## Overview

This document provides a comprehensive User Acceptance Testing (UAT) checklist for the Division-Level Access feature. Each test case should be executed by QA or stakeholders before production deployment.

---

## Pre-requisites

### Environment Setup
- [ ] Staging environment is deployed with Division module
- [ ] Division database tables are populated with test data
- [ ] Test division users are created with different roles:
  - Superintendent (full access)
  - Supervisor (limited admin)
  - Analyst (read-only)
  - Viewer (basic access)

### Test Data Requirements
- [ ] At least 3 test schools assigned to the division
- [ ] Each school has student enrollment data
- [ ] Each school has personnel data
- [ ] Historical data for previous school years available

---

## Test Cases

### 1. Authentication & Access Control

#### TC-1.1: Division User Login
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to login page | Login form displays | ⬜ |
| 2 | Enter division user credentials | Credentials accepted | ⬜ |
| 3 | Submit login form | Redirected to Division Dashboard | ⬜ |
| 4 | Verify division context loaded | Division name shows in header | ⬜ |

#### TC-1.2: Role-Based Access
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login as Superintendent | All menu items visible | ⬜ |
| 2 | Login as Supervisor | Settings/Admin restricted | ⬜ |
| 3 | Login as Analyst | Data view only, no admin | ⬜ |
| 4 | Login as Viewer | Basic reports only | ⬜ |

#### TC-1.3: Session Management
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Close browser, reopen | Session persists if "Remember me" | ⬜ |
| 2 | Logout and try back button | Access denied, redirected to login | ⬜ |
| 3 | Open multiple tabs | Session consistent across tabs | ⬜ |

---

### 2. Division Dashboard

#### TC-2.1: Dashboard Loading
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division | Dashboard loads within 3 seconds | ⬜ |
| 2 | Verify summary cards | Total schools, students, personnel shown | ⬜ |
| 3 | Check data accuracy | Counts match database totals | ⬜ |

#### TC-2.2: Filter Scope (District & School Selector)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Locate "Filter Scope" in sidebar | District and School dropdowns visible | ⬜ |
| 2 | Click district dropdown | All districts listed with counts | ⬜ |
| 3 | Select specific district | School dropdown filters to that district | ⬜ |
| 4 | Verify school count updates | Shows "All in [District] (N)" | ⬜ |
| 5 | Click school dropdown | Only schools in selected district shown | ⬜ |
| 6 | Select specific school | Data filters to selected school | ⬜ |
| 7 | Click "Clear" button | Both filters reset to "All" | ⬜ |
| 8 | Search for school by name | Search works within current filter | ⬜ |
| 9 | Refresh page | Filter selections persist (localStorage) | ⬜ |

#### TC-2.3: Dashboard Metrics
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | View enrollment summary | Male/Female breakdown correct | ⬜ |
| 2 | View grade level distribution | All grade levels represented | ⬜ |
| 3 | View trends chart | Historical data displays | ⬜ |

---

### 3. Schools Management

#### TC-3.1: Schools Grid View
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/schools | Grid loads with all schools | ⬜ |
| 2 | Sort by school name | Alphabetical sort works | ⬜ |
| 3 | Sort by enrollment count | Numeric sort works | ⬜ |
| 4 | Filter by district | District filter works | ⬜ |

#### TC-3.2: School Details
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click on school card | School details modal opens | ⬜ |
| 2 | View school info | Name, address, contact shown | ⬜ |
| 3 | View school statistics | Enrollment, personnel counts | ⬜ |
| 4 | Navigate to school reports | Report links work | ⬜ |

---

### 4. DepEd Reports

#### TC-4.1: SF5 (Enrollment Report)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/reports/sf5 | SF5 dashboard loads | ⬜ |
| 2 | Select school year | Data updates accordingly | ⬜ |
| 3 | View all schools data | Aggregated totals correct | ⬜ |
| 4 | View single school | Single school data correct | ⬜ |
| 5 | Export to CSV | CSV downloads correctly | ⬜ |
| 6 | Verify CSV data | Data matches displayed values | ⬜ |

#### TC-4.2: SF6 (Summarized Enrollment)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/reports/sf6 | SF6 dashboard loads | ⬜ |
| 2 | View by grade level | Breakdown displays correctly | ⬜ |
| 3 | View by district | District totals correct | ⬜ |
| 4 | Export to CSV | CSV downloads correctly | ⬜ |

#### TC-4.3: SF7 (Personnel Assignment)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/reports/sf7 | SF7 dashboard loads | ⬜ |
| 2 | View all personnel | All teachers listed | ⬜ |
| 3 | Filter by school | Filter works correctly | ⬜ |
| 4 | Filter by position | Filter works correctly | ⬜ |
| 5 | Export to CSV | CSV downloads correctly | ⬜ |

---

### 5. User Management

#### TC-5.1: View Users (Superintendent/Supervisor only)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/users | User list loads | ⬜ |
| 2 | View user details | Name, email, role visible | ⬜ |
| 3 | Search for user | Search works correctly | ⬜ |
| 4 | Filter by role | Role filter works | ⬜ |

#### TC-5.2: Create User (Superintendent only)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "Add User" | Create user form opens | ⬜ |
| 2 | Fill required fields | Form validation works | ⬜ |
| 3 | Select role | Role dropdown works | ⬜ |
| 4 | Submit form | User created, appears in list | ⬜ |

#### TC-5.3: Edit User
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click edit on user row | Edit form opens with data | ⬜ |
| 2 | Modify user details | Form allows changes | ⬜ |
| 3 | Change role | Role updates correctly | ⬜ |
| 4 | Save changes | Changes persist | ⬜ |

#### TC-5.4: Deactivate User
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click deactivate on user | Confirmation dialog shows | ⬜ |
| 2 | Confirm deactivation | User status changes to inactive | ⬜ |
| 3 | Verify login blocked | Deactivated user cannot login | ⬜ |

---

### 6. Audit Logging

#### TC-6.1: View Audit Logs
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/audit-log | Audit log loads | ⬜ |
| 2 | View recent actions | Actions listed chronologically | ⬜ |
| 3 | Filter by date range | Date filter works | ⬜ |
| 4 | Filter by action type | Action filter works | ⬜ |
| 5 | Search by user | User search works | ⬜ |

#### TC-6.2: Audit Log Content
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Perform login action | Login recorded in audit log | ⬜ |
| 2 | View a report | Report view recorded | ⬜ |
| 3 | Export data | Export action recorded | ⬜ |
| 4 | Change settings | Settings change recorded | ⬜ |

#### TC-6.3: Export Audit Logs
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Apply date filter | Filtered results shown | ⬜ |
| 2 | Click export | CSV downloads | ⬜ |
| 3 | Verify CSV content | All filtered records included | ⬜ |

---

### 7. Settings

#### TC-7.1: View Division Settings
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division/settings | Settings page loads | ⬜ |
| 2 | View division info | Division name, code visible | ⬜ |
| 3 | View notification preferences | Current settings displayed | ⬜ |

#### TC-7.2: Edit Settings (Superintendent only)
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click edit settings | Form becomes editable | ⬜ |
| 2 | Change notification setting | Toggle works | ⬜ |
| 3 | Save changes | Changes persist | ⬜ |
| 4 | Refresh page | Settings still saved | ⬜ |

---

### 8. Onboarding Flow

#### TC-8.1: First-time User Experience
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Login as new division user | Onboarding wizard shows | ⬜ |
| 2 | Progress through steps | Each step displays correctly | ⬜ |
| 3 | Complete onboarding | Dashboard shown | ⬜ |
| 4 | Login again | Onboarding does not repeat | ⬜ |

#### TC-8.2: Skip Onboarding
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Click "Skip" on onboarding | Confirmation shown | ⬜ |
| 2 | Confirm skip | Dashboard shown | ⬜ |
| 3 | Access onboarding manually | Can restart if needed | ⬜ |

---

### 9. Performance

#### TC-9.1: Page Load Times
| Page | Expected Load Time | Actual | Status |
|------|-------------------|--------|--------|
| Division Dashboard | < 3 seconds | | ⬜ |
| Schools Grid | < 3 seconds | | ⬜ |
| SF5 Report | < 5 seconds | | ⬜ |
| SF6 Report | < 5 seconds | | ⬜ |
| SF7 Report | < 5 seconds | | ⬜ |
| Audit Log | < 3 seconds | | ⬜ |

#### TC-9.2: Large Data Sets
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Load division with 50 schools | Page responsive | ⬜ |
| 2 | Load division with 10,000 students | Page responsive | ⬜ |
| 3 | Export large dataset | Export completes | ⬜ |

---

### 10. Mobile Responsiveness

#### TC-10.1: Mobile Layout
| Page | Mobile Display | Status |
|------|---------------|--------|
| Dashboard | Cards stack vertically | ⬜ |
| Schools Grid | Single column layout | ⬜ |
| Reports | Tables scroll horizontally | ⬜ |
| Navigation | Hamburger menu works | ⬜ |

---

### 11. Error Handling

#### TC-11.1: Network Errors
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Disconnect network, refresh | Error message displays | ⬜ |
| 2 | Reconnect network | Retry option works | ⬜ |

#### TC-11.2: Permission Errors
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Access admin page as Viewer | Access denied message | ⬜ |
| 2 | Try to edit as read-only user | Action blocked | ⬜ |

---

### 12. Performance & UX (New - Dec 9, 2025)

#### TC-12.1: Skeleton Loading
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Navigate to /division | Skeleton cards show during load | ⬜ |
| 2 | Navigate to /division/schools | Skeleton grid shows during load | ⬜ |
| 3 | Navigate to /division/enrollment | Skeleton summary shows during load | ⬜ |
| 4 | Navigate to /division/personnel | Skeleton cards show during load | ⬜ |
| 5 | Navigate to /division/reports/sf5 | Skeleton loader shows during load | ⬜ |
| 6 | Verify no layout shift | Content replaces skeleton smoothly | ⬜ |

#### TC-12.2: RPC Performance
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Load dashboard with 50+ schools | Loads in < 2 seconds | ⬜ |
| 2 | Load schools grid with 50+ schools | Loads in < 2 seconds | ⬜ |
| 3 | Load enrollment summary | Loads in < 1 second | ⬜ |
| 4 | Load personnel summary | Loads in < 1 second | ⬜ |
| 5 | Check console for RPC errors | No errors logged | ⬜ |

#### TC-12.3: PDF Export
| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Export SF5 report to PDF | PDF generates correctly | ⬜ |
| 2 | Verify division logo in PDF | Logo appears in header | ⬜ |
| 3 | Verify DepEd logo in PDF | Logo appears in header | ⬜ |
| 4 | Verify column headers | All columns have proper headers | ⬜ |
| 5 | Export SF6 report to PDF | PDF generates correctly | ⬜ |
| 6 | Export SF7 report to PDF | PDF generates correctly | ⬜ |

---

## Sign-off

### UAT Completion

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Division Representative | | | |
| Project Manager | | | |

### Issues Found

| Issue # | Description | Severity | Resolution | Status |
|---------|-------------|----------|------------|--------|
| | | | | |

### Final Approval

- [ ] All critical test cases passed
- [ ] No high-severity issues outstanding
- [ ] Performance requirements met
- [ ] Stakeholder approval obtained
- [ ] Ready for production deployment

---

## Notes

- All tests should be performed on staging environment first
- Document any deviations or unexpected behaviors
- Record exact error messages for any failures
- Take screenshots for any UI issues

---

*Generated: December 9, 2025*
