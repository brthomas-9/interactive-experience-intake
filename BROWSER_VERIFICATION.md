# Browser Verification Checklist - Package 2B Phase 1

**Cannot be automated - requires Apps Script deployment to verify.**

## Deployment Sequence

1. **DEV HEAD verification first** - Deploy this branch to Apps Script DEV, test thoroughly
2. Team Testing remains unchanged until DEV verification passes
3. Production remains unchanged

## Prerequisites for DEV Testing

- Deploy Package 2B branch to Apps Script DEV environment only
- Test at three viewport sizes: 375px (mobile), 768px (tablet), 1440px (desktop)
- Test both authenticated user and account email fallback scenarios
- Do NOT deploy to Team Testing or Production yet

## Index.html (Intake Form)

### Global Header Display
- [ ] Header renders correctly at 375px mobile
- [ ] Header renders correctly at 768px tablet
- [ ] Header renders correctly at 1440px desktop
- [ ] Red Hat logo displays
- [ ] "Red Hat / The Interact Hub" branding correct
- [ ] Header remains sticky on scroll

### Account Email Population
- [ ] Account email populates from `getUserEmail()` success
- [ ] Account initial (first letter, uppercase) displays correctly
- [ ] Account shows "Account" fallback on `getUserEmail()` error
- [ ] Account avatar displays with purple background

### Navigation Functionality
- [ ] "Create & Submit" dropdown opens/closes
  - [ ] "Request a New Demo" opens Google Form in new tab
  - [ ] "Submit a Demo for Review" navigates to Index.html
  - [ ] "Check My Submissions" navigates to StatusTracker (`?page=status`)
- [ ] "AI Assistant" opens NotebookLM in new tab
- [ ] "Resources" dropdown opens/closes
  - [ ] "User Guide" opens GitHub in new tab
  - [ ] "Best Practices Guide" opens Google Doc in new tab
  - [ ] "The Source" opens Source page in new tab
  - [ ] "Public Interactive Experiences" opens redhat.com page in new tab
  - [ ] "Analytics Dashboard" opens Superset in new tab
  - [ ] "Ask in Slack" opens Slack channel in new tab
  - [ ] "Send Feedback" calls existing `promptFeedback()` modal
- [ ] "Account" dropdown opens/closes
  - [ ] "Saved Demos" navigates to Hub DEV `#saved-demos`
- [ ] Clicking outside dropdowns closes them

### Mobile Navigation (<=768px)
- [ ] Hamburger menu button displays
- [ ] Hamburger menu opens/closes on click
- [ ] Navigation drawer slides in from right
- [ ] All dropdown sections visible (always expanded, no toggle buttons)
- [ ] Mobile menu closes after navigation click

### Form Behavior Preservation
- [ ] Automatic creator email population still works
- [ ] Unsaved form warns before navigation (enter form data, then click a navigation destination like "Submit a Demo for Review" in Create & Submit dropdown)
- [ ] Pilot warning displays if present
- [ ] Gemini assistance unchanged
- [ ] Form submission workflow unchanged

## StatusTracker.html

### Global Header Display
- [ ] Header renders correctly at 375px mobile
- [ ] Header renders correctly at 768px tablet
- [ ] Header renders correctly at 1440px desktop
- [ ] Header remains sticky on scroll

### Account Email Population
- [ ] Account email from `getAllSubmissions()` `userEmail` displays
- [ ] Account initial displays correctly
- [ ] Token-only view: account uses `getUserEmail()` fallback
- [ ] Account shows neutral fallback when email unavailable

### Navigation Functionality
- [ ] All navigation items work (same checklist as Index.html above)
- [ ] "Send Feedback" calls existing `promptFeedback()` modal
- [ ] Mobile navigation functional (same checklist as Index.html above)

### Tab and Workflow Preservation
- [ ] "My Submissions" tab works
- [ ] "All Submissions" tab works
- [ ] "Reports" tab only visible to admin users
- [ ] Token-based single-submission view loads correctly
- [ ] Token parameter NEVER appears in navigation URLs
- [ ] Search and filter controls scroll normally (not sticky)
- [ ] Submission lifecycle permissions unchanged

### Admin Features
- [ ] Admin can see Reports tab
- [ ] Non-admin cannot see Reports tab
- [ ] Admin actions unchanged

## Cross-Page Consistency

- [ ] Header visual design matches between Index and StatusTracker
- [ ] Header visual design matches Hub Package 2A reference
- [ ] Typography uses Red Hat Display (headings) and Red Hat Text (body)
- [ ] Colors match spec: `--accent: #6d28d9`, `--border: #dadce0`, etc.
- [ ] Focus states use accent color with 2px outline
- [ ] Hover states use border color background

## Responsive Behavior

### Desktop (>1024px)
- [ ] Account email visible in header
- [ ] All navigation items in horizontal row

### Tablet (769px - 1024px)
- [ ] Account email hidden
- [ ] Account shows only avatar

### Mobile (<=768px)
- [ ] Hamburger menu visible
- [ ] Desktop nav hidden
- [ ] Drawer navigation functional
- [ ] Account email visible in mobile drawer

## Regressions to Check

- [ ] No existing shortcuts broken
- [ ] No broken links
- [ ] No console errors
- [ ] No visual layout breaks
- [ ] No data loss on navigation
- [ ] No authentication issues

---

## Notes

- **Pre-existing test failure**: `tests/admin-state-refresh.test.js` has one failing test (`adminRequestChanges refreshSubmissions call`) that existed before Package 2B changes. This is NOT a regression introduced by this work.

- **All new Package 2B tests pass**:
  - `tests/intake-header-integration.test.js` ✅
  - `tests/tracker-header-integration.test.js` ✅
  - `tests/mobile-navigation.test.js` ✅
  - `tests/navigation-destinations.test.js` ✅

- **No deployment, clasp push, or merge performed** - this checklist must be completed after Team Testing deployment.
