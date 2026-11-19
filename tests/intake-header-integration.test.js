/**
 * Intake Header Integration Test
 * Verifies Global Header is included in Index.html
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Intake header integration test...\n');

const repoRoot = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');

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

// Run tests
try {
  testHeaderIncluded();
  testHeaderCSSIncluded();
  testHeaderJSIncluded();

  console.log('✅ All Intake header integration tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
