/**
 * Status Tracker Header Integration Test
 * Verifies Global Header is included in StatusTracker.html
 */

const assert = require('assert');
const fs = require('fs');

console.log('Running Status Tracker header integration test...\n');

const html = fs.readFileSync('/Users/rubyyang/arcade-intake-package2b-phase1/StatusTracker.html', 'utf8');

function testHeaderIncluded() {
  console.log('Test: Global Header included');

  const hasHeaderInclude = /include\("GlobalHeader"\)/.test(html);
  assert.ok(hasHeaderInclude, 'Should include GlobalHeader component');

  console.log('  ✓ GlobalHeader include found\n');
}

function testHeaderCSSIncluded() {
  console.log('Test: Global Header CSS included');

  const hasHeaderCSSInclude = /include\("GlobalHeader_CSS"\)/.test(html);
  assert.ok(hasHeaderCSSInclude, 'Should include GlobalHeader_CSS component');

  console.log('  ✓ GlobalHeader_CSS include found\n');
}

function testHeaderJSIncluded() {
  console.log('Test: Global Header JS included');

  const hasHeaderJSInclude = /include\("GlobalHeader_JS"\)/.test(html);
  assert.ok(hasHeaderJSInclude, 'Should include GlobalHeader_JS component');

  console.log('  ✓ GlobalHeader_JS include found\n');
}

function testWebAppBaseUrlDefined() {
  console.log('Test: webAppBaseUrl defined for navigation');

  const hasWebAppBaseUrl = /var webAppBaseUrl/.test(html);
  assert.ok(hasWebAppBaseUrl, 'Should define webAppBaseUrl');

  console.log('  ✓ webAppBaseUrl defined\n');
}

// Run tests
try {
  testHeaderIncluded();
  testHeaderCSSIncluded();
  testHeaderJSIncluded();
  testWebAppBaseUrlDefined();

  console.log('✅ All Status Tracker header integration tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
