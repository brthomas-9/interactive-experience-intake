/**
 * Tracker CSS Integration Test
 * Verifies StatusTracker webAppBaseUrl not redundantly assigned
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Tracker CSS integration test...\n');

const repoRoot = path.resolve(__dirname, '..');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');

function testWebAppBaseUrlNotDuplicated() {
  console.log('Test: webAppBaseUrl not redundantly assigned');

  // Find all webAppBaseUrl assignments
  const assignments = trackerHtml.match(/var webAppBaseUrl = [^;]+;/g);

  assert.ok(assignments && assignments.length === 1,
    `Should have exactly 1 webAppBaseUrl assignment, found ${assignments ? assignments.length : 0}`);

  // The single assignment should be the template injection from doGet
  const templateInjection = /var webAppBaseUrl = <\?!= JSON\.stringify\(webAppBaseUrl\) \?>;/;
  assert.ok(templateInjection.test(trackerHtml),
    'Should keep only the doGet template injection assignment');

  // Should NOT have ScriptApp.getService().getUrl() assignment
  const redundantAssignment = /var webAppBaseUrl = ['"]<\?= ScriptApp\.getService\(\)\.getUrl\(\) \?>['"]/;
  assert.ok(!redundantAssignment.test(trackerHtml),
    'Should not have redundant ScriptApp.getService() assignment');

  console.log('  ✓ Single webAppBaseUrl assignment from doGet template\n');
}

// Run all tests
try {
  testWebAppBaseUrlNotDuplicated();

  console.log('✅ All Tracker CSS integration tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
