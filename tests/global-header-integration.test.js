/**
 * Global Header Integration Test
 * Verifies direct navigation links, active states, branding, and dropdown behavior
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Global Header integration test...\n');

const repoRoot = path.resolve(__dirname, '..');
const headerHtml = fs.readFileSync(path.join(repoRoot, 'GlobalHeader.html'), 'utf8');
const codeJs = fs.readFileSync(path.join(repoRoot, 'Code.js'), 'utf8');

function testExploreDemosNavigation() {
  console.log('Test: Explore Demos links to hubBaseUrl using top-level navigation');

  // Should have Explore Demos link using hubBaseUrl
  assert.ok(/<!-- Explore Demos Link -->/.test(headerHtml), 'Should have Explore Demos link comment');
  assert.ok(/href="<\?= hubBaseUrl \?>"/.test(headerHtml), 'Should use hubBaseUrl template variable');

  // Should use window.top.location.href for iframe navigation
  const exploreDemosPattern = /href="<\?= hubBaseUrl \?>".*?onclick=".*?window\.top\.location\.href.*?hubBaseUrl/s;
  assert.ok(exploreDemosPattern.test(headerHtml), 'Should use window.top.location.href for Explore Demos navigation');

  console.log('  ✓ Explore Demos uses hubBaseUrl with top-level navigation\n');
}

function testStatusTrackerNavigation() {
  console.log('Test: Status Tracker links to webAppBaseUrl?page=status using top-level navigation');

  // Should have Status Tracker link using webAppBaseUrl
  assert.ok(/<!-- Status Tracker Link -->/.test(headerHtml), 'Should have Status Tracker link comment');
  assert.ok(/href="<\?= webAppBaseUrl \?>\?page=status"/.test(headerHtml), 'Should use webAppBaseUrl?page=status');

  // Should use window.top.location.href for iframe navigation
  const statusTrackerPattern = /href="<\?= webAppBaseUrl \?>\?page=status".*?onclick=".*?window\.top\.location\.href.*?webAppBaseUrl/s;
  assert.ok(statusTrackerPattern.test(headerHtml), 'Should use window.top.location.href for Status Tracker navigation');

  console.log('  ✓ Status Tracker uses webAppBaseUrl?page=status with top-level navigation\n');
}

function testAriaCurrentConditional() {
  console.log('Test: aria-current="page" applied only when currentPage === status');

  // Should have conditional aria-current on Status Tracker link
  const ariaCurrentPattern = /<\? if \(currentPage === 'status'\) \{ \?>aria-current="page"<\? } \?>/;
  assert.ok(ariaCurrentPattern.test(headerHtml), 'Should have conditional aria-current for Status Tracker');

  // Explore Demos should NOT have aria-current
  const exploreDemosSection = headerHtml.match(/<!-- Explore Demos Link -->[\s\S]*?<\/a>/);
  assert.ok(exploreDemosSection && !/aria-current/.test(exploreDemosSection[0]),
    'Explore Demos should not have aria-current');

  console.log('  ✓ aria-current applied conditionally only for Status Tracker\n');
}

function testCurrentPageDetection() {
  console.log('Test: Code.js passes correct currentPage to both page templates');

  // Should detect currentPage based on page parameter
  assert.ok(/const currentPage = \(page === 'status'\) \? 'status' : 'intake'/.test(codeJs),
    'Should set currentPage to "status" when page === "status", otherwise "intake"');

  // Should pass currentPage to StatusTracker template
  const statusTrackerSection = codeJs.match(/if \(page === 'status'\) \{[\s\S]*?\}/);
  assert.ok(statusTrackerSection && /template\.currentPage = currentPage/.test(statusTrackerSection[0]),
    'Should pass currentPage to StatusTracker template');

  // Should pass currentPage to Index template
  const indexSection = codeJs.match(/const template = HtmlService\.createTemplateFromFile\('Index'\);[\s\S]*?return template\.evaluate/);
  assert.ok(indexSection && /template\.currentPage = currentPage/.test(indexSection[0]),
    'Should pass currentPage to Index template');

  console.log('  ✓ Code.js correctly detects and passes currentPage to both templates\n');
}

function testBrandingNonClickable() {
  console.log('Test: Branding is non-clickable');

  // Should use <div> for branding, not <a>
  const brandingPattern = /<div class="brandLink">[\s\S]*?<\/div>/;
  assert.ok(brandingPattern.test(headerHtml), 'Branding should use <div class="brandLink">');

  // Should NOT have <a> tag with brandLink class
  assert.ok(!/<a [^>]*class="brandLink"/.test(headerHtml), 'Branding should not use <a> tag');

  console.log('  ✓ Branding is non-clickable (uses <div>, not <a>)\n');
}

function testCheckMySubmissionsAbsent() {
  console.log('Test: Check My Submissions is absent from Create & Submit dropdown');

  // Should NOT have Check My Submissions text in dropdown
  assert.ok(!/Check My Submissions/.test(headerHtml), 'Should not contain "Check My Submissions" text');

  // Should NOT call globalHeaderNavigateToTracker in Create & Submit dropdown
  const createSubmitDropdown = headerHtml.match(/<!-- Create & Submit Dropdown -->[\s\S]*?<\/div>/);
  assert.ok(createSubmitDropdown && !/globalHeaderNavigateToTracker/.test(createSubmitDropdown[0]),
    'Create & Submit dropdown should not call globalHeaderNavigateToTracker');

  console.log('  ✓ Check My Submissions is absent from dropdown\n');
}

function testCreateSubmitActiveState() {
  console.log('Test: Create & Submit has active state when currentPage === intake');

  // Should have conditional active class on Create & Submit button
  const activeClassPattern = /<button class="navButton<\? if \(currentPage === 'intake'\) \{ \?> navButton-active<\? } \?>"/;
  assert.ok(activeClassPattern.test(headerHtml),
    'Create & Submit button should have conditional navButton-active class when currentPage === intake');

  // Should have conditional aria-current attribute (appears before closing >)
  const ariaCurrentPattern = /onclick="toggleDropdown\('createDropdown'\)"<\? if \(currentPage === 'intake'\) \{ \?> aria-current="page"<\? } \?>>/;
  assert.ok(ariaCurrentPattern.test(headerHtml),
    'Create & Submit button should have conditional aria-current="page" when currentPage === intake');

  console.log('  ✓ Create & Submit has active state for intake page\n');
}

// Run all tests
try {
  testExploreDemosNavigation();
  testStatusTrackerNavigation();
  testAriaCurrentConditional();
  testCurrentPageDetection();
  testBrandingNonClickable();
  testCheckMySubmissionsAbsent();
  testCreateSubmitActiveState();

  console.log('✅ All Global Header integration tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
