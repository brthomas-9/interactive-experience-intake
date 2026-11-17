/**
 * Intake CSS Integration Test
 * Verifies Global Header button styles protected from Intake form button rules
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Intake CSS integration test...\n');

const repoRoot = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');

function testButtonRuleScoping() {
  console.log('Test: Global Header buttons excluded from Intake button styles');

  // Intake button rule should use :not() selectors to exclude Global Header
  const buttonRulePattern = /button:not\(\.navButton\):not\(\.mobileMenuToggle\)/;

  assert.ok(buttonRulePattern.test(indexHtml),
    'Intake button rule should exclude .navButton and .mobileMenuToggle');

  // Should apply the scoped rule to both base and hover states
  const scopedRules = indexHtml.match(/button:not\([^)]+\):not\([^)]+\)/g);
  assert.ok(scopedRules && scopedRules.length >= 2,
    'Should have scoped button rules for both base and hover states');

  console.log('  ✓ Global Header buttons protected from Intake form styles\n');
}

function testMobileBodyLayout() {
  console.log('Test: Mobile breakpoint preserves full-width header');

  // Should NOT restore body margin/padding at mobile breakpoint
  const mobileMediaQuery = /@media \(max-width: 720px\)[^}]*{[^}]*}/gs;
  const mobileBlock = indexHtml.match(mobileMediaQuery);

  assert.ok(mobileBlock, 'Should have mobile media query');

  const mobileContent = mobileBlock[0];

  // Should NOT have "body { margin:" in mobile block
  assert.ok(!/body\s*{[^}]*margin:/.test(mobileContent),
    'Mobile breakpoint should not restore body margin');

  // Should adjust .contentWrapper padding instead
  assert.ok(/\.contentWrapper\s*{[^}]*padding:/.test(mobileContent),
    'Mobile breakpoint should adjust .contentWrapper padding');

  console.log('  ✓ Mobile layout keeps body full-width for Global Header\n');
}

function testWebAppBaseUrlNotDuplicated() {
  console.log('Test: webAppBaseUrl not redundantly assigned');

  // Find all webAppBaseUrl assignments
  const assignments = indexHtml.match(/var webAppBaseUrl = [^;]+;/g);

  assert.ok(assignments && assignments.length === 1,
    `Should have exactly 1 webAppBaseUrl assignment, found ${assignments ? assignments.length : 0}`);

  // The single assignment should be the template injection from doGet
  const templateInjection = /var webAppBaseUrl = <\?!= JSON\.stringify\(webAppBaseUrl\) \?>;/;
  assert.ok(templateInjection.test(indexHtml),
    'Should keep only the doGet template injection assignment');

  // Should NOT have ScriptApp.getService().getUrl() assignment
  const redundantAssignment = /var webAppBaseUrl = ['"]<\?= ScriptApp\.getService\(\)\.getUrl\(\) \?>['"]/;
  assert.ok(!redundantAssignment.test(indexHtml),
    'Should not have redundant ScriptApp.getService() assignment');

  console.log('  ✓ Single webAppBaseUrl assignment from doGet template\n');
}

// Run all tests
try {
  testButtonRuleScoping();
  testMobileBodyLayout();
  testWebAppBaseUrlNotDuplicated();

  console.log('✅ All Intake CSS integration tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
