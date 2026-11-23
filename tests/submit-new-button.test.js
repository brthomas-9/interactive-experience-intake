#!/usr/bin/env node

/**
 * Status Tracker Header Test
 *
 * Verifies Status Tracker page header after UI cleanup:
 * - Page title preserved
 * - Redundant "Submit new" button removed (available via Global Header)
 * - navigateToIntake() function removed (no longer used)
 */

const fs = require('fs');
const path = require('path');

console.log('Running Status Tracker header test...\n');

const statusTrackerPath = path.join(__dirname, '..', 'StatusTracker.html');
const statusTrackerContent = fs.readFileSync(statusTrackerPath, 'utf8');

let passed = 0;
let failed = 0;

// Test 1: Page title exists and is correct
console.log('Test: Page title preserved');
if (statusTrackerContent.includes('id="pageTitle"') &&
    statusTrackerContent.includes('Interactive Experience Status Tracker')) {
  console.log('  ✓ Page title preserved');
  passed++;
} else {
  console.log('  ✗ Page title missing or changed');
  failed++;
}

// Test 2: Submit new button removed (redundant with Global Header)
console.log('\nTest: Submit new button removed from page header');
const headerMatch = statusTrackerContent.match(/<div class="header"[^>]*>[\s\S]*?<\/div>/);
if (!headerMatch) {
  console.log('  ✗ Header div not found');
  failed++;
} else {
  const headerContent = headerMatch[0];
  if (!headerContent.includes('Submit new')) {
    console.log('  ✓ Submit new button removed (available in Global Header)');
    passed++;
  } else {
    console.log('  ✗ Submit new button still present (should be removed)');
    failed++;
  }
}

// Test 3: navigateToIntake function removed (no longer used)
console.log('\nTest: navigateToIntake function removed');
const navigateMatch = statusTrackerContent.match(/function navigateToIntake\(\)/);
if (!navigateMatch) {
  console.log('  ✓ navigateToIntake function removed (no longer needed)');
  passed++;
} else {
  console.log('  ✗ navigateToIntake function still exists (should be removed)');
  failed++;
}

// Test 4: Global Header provides Submit a Demo navigation
console.log('\nTest: Global Header provides submit navigation');
if (statusTrackerContent.includes('includeGlobalHeader')) {
  console.log('  ✓ Global Header included (provides Create & Submit navigation)');
  passed++;
} else {
  console.log('  ✗ Global Header not included');
  failed++;
}

console.log('\n' + '='.repeat(50));
if (failed === 0) {
  console.log('✅ All Status Tracker header tests passed');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed, ${passed} passed`);
  process.exit(1);
}
