#!/usr/bin/env node

/**
 * Submit New Button Test
 *
 * Verifies the "Submit new" button on Status Tracker page:
 * - Present in page header
 * - Uses navigateToIntake() function
 * - Reuses existing navigation logic (no hardcoded URLs)
 */

const fs = require('fs');
const path = require('path');

console.log('Running Submit new button test...\n');

const statusTrackerPath = path.join(__dirname, '..', 'StatusTracker.html');
const statusTrackerContent = fs.readFileSync(statusTrackerPath, 'utf8');

let passed = 0;
let failed = 0;

// Test 1: Submit new button exists in header
console.log('Test: Submit new button in header');
const headerMatch = statusTrackerContent.match(/<div class="header"[^>]*>[\s\S]*?<\/div>/);
if (!headerMatch) {
  console.log('  ✗ Header div not found');
  failed++;
} else {
  const headerContent = headerMatch[0];
  if (headerContent.includes('Submit new')) {
    console.log('  ✓ Submit new button found in header');
    passed++;
  } else {
    console.log('  ✗ Submit new button not found in header');
    failed++;
  }
}

// Test 2: Submit new uses navigateToIntake()
console.log('\nTest: Submit new uses navigateToIntake()');
const submitNewLine = statusTrackerContent.split('\n').find(line =>
  line.includes('Submit new')
);
if (!submitNewLine) {
  console.log('  ✗ Submit new text not found');
  failed++;
} else if (submitNewLine.includes('navigateToIntake()')) {
  console.log('  ✓ Submit new calls navigateToIntake()');
  passed++;
} else {
  console.log('  ✗ Submit new does not call navigateToIntake()');
  failed++;
}

// Test 3: navigateToIntake function exists and uses webAppBaseUrl
console.log('\nTest: navigateToIntake uses webAppBaseUrl');
const navigateMatch = statusTrackerContent.match(/function navigateToIntake\(\)[^}]*\{[^}]*\}/);
if (!navigateMatch) {
  console.log('  ✗ navigateToIntake function not found');
  failed++;
} else {
  const funcContent = navigateMatch[0];
  if (funcContent.includes('webAppBaseUrl')) {
    console.log('  ✓ navigateToIntake uses webAppBaseUrl (environment-aware)');
    passed++;
  } else {
    console.log('  ✗ navigateToIntake does not use webAppBaseUrl');
    failed++;
  }
}

// Test 4: No hardcoded Intake URLs in Submit new context
console.log('\nTest: No hardcoded URLs in Submit new');
const submitNewContext = statusTrackerContent.split('\n').find(line =>
  line.includes('Submit new')
);
const hardcodedUrlPattern = /https?:\/\/[^'"]+/;
if (submitNewContext && hardcodedUrlPattern.test(submitNewContext)) {
  console.log('  ✗ Submit new has hardcoded URL');
  failed++;
} else {
  console.log('  ✓ Submit new has no hardcoded URLs');
  passed++;
}

// Test 5: Page title still exists
console.log('\nTest: Page title preserved');
if (statusTrackerContent.includes('id="pageTitle"') &&
    statusTrackerContent.includes('Interactive Experience Status Tracker')) {
  console.log('  ✓ Page title preserved');
  passed++;
} else {
  console.log('  ✗ Page title missing or changed');
  failed++;
}

console.log('\n' + '='.repeat(50));
if (failed === 0) {
  console.log('✅ All Submit new button tests passed');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed, ${passed} passed`);
  process.exit(1);
}
