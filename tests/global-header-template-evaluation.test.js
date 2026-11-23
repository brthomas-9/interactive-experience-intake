/**
 * Global Header Template Evaluation Test
 * Verifies GlobalHeader scriptlets are evaluated, not emitted literally
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Global Header template evaluation test...\n');

const repoRoot = path.resolve(__dirname, '..');
const codeJs = fs.readFileSync(path.join(repoRoot, 'Code.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');
const headerHtml = fs.readFileSync(path.join(repoRoot, 'GlobalHeader.html'), 'utf8');

function testIncludeGlobalHeaderFunctionExists() {
  console.log('Test: includeGlobalHeader function exists in Code.js');

  // Should have includeGlobalHeader function
  assert.ok(/function includeGlobalHeader\(/.test(codeJs),
    'Code.js should define includeGlobalHeader function');

  // Should accept three parameters: hubBaseUrl, webAppBaseUrl, currentPage
  const funcPattern = /function includeGlobalHeader\((hubBaseUrl|[^,]+),\s*(webAppBaseUrl|[^,]+),\s*(currentPage|[^)]+)\)/;
  assert.ok(funcPattern.test(codeJs),
    'includeGlobalHeader should accept hubBaseUrl, webAppBaseUrl, currentPage parameters');

  // Should create template from GlobalHeader file
  assert.ok(/createTemplateFromFile\('GlobalHeader'\)/.test(codeJs),
    'includeGlobalHeader should use createTemplateFromFile for GlobalHeader');

  // Should pass template variables
  assert.ok(/template\.hubBaseUrl = hubBaseUrl/.test(codeJs),
    'includeGlobalHeader should set template.hubBaseUrl');
  assert.ok(/template\.webAppBaseUrl = webAppBaseUrl/.test(codeJs),
    'includeGlobalHeader should set template.webAppBaseUrl');
  assert.ok(/template\.currentPage = currentPage/.test(codeJs),
    'includeGlobalHeader should set template.currentPage');

  // Should evaluate and return content
  assert.ok(/template\.evaluate\(\)\.getContent\(\)/.test(codeJs),
    'includeGlobalHeader should call template.evaluate().getContent()');

  console.log('  ✓ includeGlobalHeader function correctly defined\n');
}

function testIndexUsesIncludeGlobalHeader() {
  console.log('Test: Index.html uses includeGlobalHeader, not raw include');

  // Should use includeGlobalHeader with parameters
  assert.ok(/includeGlobalHeader\(hubBaseUrl,\s*webAppBaseUrl,\s*currentPage\)/.test(indexHtml),
    'Index.html should call includeGlobalHeader(hubBaseUrl, webAppBaseUrl, currentPage)');

  // Should NOT use raw include("GlobalHeader")
  assert.ok(!/include\("GlobalHeader"\)/.test(indexHtml),
    'Index.html should NOT use include("GlobalHeader") which does not evaluate scriptlets');

  console.log('  ✓ Index.html uses evaluated template inclusion\n');
}

function testStatusTrackerUsesIncludeGlobalHeader() {
  console.log('Test: StatusTracker.html uses includeGlobalHeader, not raw include');

  // Should use includeGlobalHeader with parameters
  assert.ok(/includeGlobalHeader\(hubBaseUrl,\s*webAppBaseUrl,\s*currentPage\)/.test(trackerHtml),
    'StatusTracker.html should call includeGlobalHeader(hubBaseUrl, webAppBaseUrl, currentPage)');

  // Should NOT use raw include("GlobalHeader")
  assert.ok(!/include\("GlobalHeader"\)/.test(trackerHtml),
    'StatusTracker.html should NOT use include("GlobalHeader") which does not evaluate scriptlets');

  console.log('  ✓ StatusTracker.html uses evaluated template inclusion\n');
}

function testGlobalHeaderContainsScriptlets() {
  console.log('Test: GlobalHeader.html contains Apps Script scriptlets requiring evaluation');

  // Should contain hubBaseUrl scriptlet
  assert.ok(/<\?= hubBaseUrl \?>/.test(headerHtml),
    'GlobalHeader.html should contain <?= hubBaseUrl ?> scriptlet');

  // Should contain webAppBaseUrl scriptlet
  assert.ok(/<\?= webAppBaseUrl \?>/.test(headerHtml),
    'GlobalHeader.html should contain <?= webAppBaseUrl ?> scriptlet');

  // Should contain conditional currentPage scriptlet
  assert.ok(/<\? if \(currentPage === 'status'\) \{ \?>/.test(headerHtml),
    'GlobalHeader.html should contain conditional currentPage scriptlet');

  console.log('  ✓ GlobalHeader.html contains scriptlets that require evaluation\n');
}

function testNoLiteralScriptletsInOutput() {
  console.log('Test: Template variables are evaluated, not emitted literally');

  // Index and StatusTracker should NOT contain literal <?= ?> in final output
  // (This is a static check - actual evaluation happens at runtime in Apps Script)

  // Verify includeGlobalHeader returns evaluated content, not raw template
  const includePattern = /includeGlobalHeader\([^)]+\)/;
  assert.ok(includePattern.test(indexHtml),
    'Index.html should call includeGlobalHeader which evaluates scriptlets');
  assert.ok(includePattern.test(trackerHtml),
    'StatusTracker.html should call includeGlobalHeader which evaluates scriptlets');

  // Verify the helper uses template.evaluate().getContent() not raw .getContent()
  const evalPattern = /template\.evaluate\(\)\.getContent\(\)/;
  assert.ok(evalPattern.test(codeJs),
    'includeGlobalHeader should evaluate template before returning content');

  console.log('  ✓ Template evaluation logic prevents literal scriptlet emission\n');
}

function testPreserveExistingIncludeHelper() {
  console.log('Test: Existing include() helper preserved for CSS/JS files');

  // Should still have original include function for other files
  assert.ok(/function include\(filename\)/.test(codeJs),
    'Original include() function should be preserved');

  assert.ok(/createHtmlOutputFromFile\(filename\)\.getContent\(\)/.test(codeJs),
    'Original include() should still use createHtmlOutputFromFile for raw content');

  // Index should still use include() for CSS
  assert.ok(/include\("GlobalHeader_CSS"\)/.test(indexHtml),
    'Index.html should still use include() for GlobalHeader_CSS');

  console.log('  ✓ Original include() helper preserved for non-template files\n');
}

// Run all tests
try {
  testIncludeGlobalHeaderFunctionExists();
  testIndexUsesIncludeGlobalHeader();
  testStatusTrackerUsesIncludeGlobalHeader();
  testGlobalHeaderContainsScriptlets();
  testNoLiteralScriptletsInOutput();
  testPreserveExistingIncludeHelper();

  console.log('✅ All Global Header template evaluation tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
