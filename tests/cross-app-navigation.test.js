/**
 * Cross-App Navigation Test
 * Verifies Hub DEV/Production URL selection logic in Code.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running cross-app navigation test...\n');

const repoRoot = path.resolve(__dirname, '..');
const codeJs = fs.readFileSync(path.join(repoRoot, 'Code.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');
const headerJS = fs.readFileSync(path.join(repoRoot, 'GlobalHeader_JS.html'), 'utf8');

function testHubUrlDetectionLogic() {
  console.log('Test: Hub URL detection logic in Code.js');

  // Should check if baseUrl contains '/dev'
  assert.ok(/isDev = baseUrl\.indexOf\('\/dev'\) > -1/.test(codeJs),
    'Should detect DEV environment by checking if baseUrl contains /dev');

  // Should set hubBaseUrl based on isDev
  assert.ok(/const hubBaseUrl = isDev/.test(codeJs),
    'Should set hubBaseUrl conditionally based on isDev');

  console.log('  ✓ Environment detection logic present\n');
}

function testHubDevUrl() {
  console.log('Test: Hub DEV URL configuration');

  // Should use current Hub DEV deployment ID (AKfycbzHPaaSJ-VEVQ6IG7eE4vdLoBBo5oAOlAcIZf4f8IEh)
  const hubDevPattern = /AKfycbzHPaaSJ-VEVQ6IG7eE4vdLoBBo5oAOlAcIZf4f8IEh\/dev/;
  assert.ok(hubDevPattern.test(codeJs),
    'Should use current Hub DEV deployment ID with /dev path');

  console.log('  ✓ Hub DEV URL correctly configured\n');
}

function testHubProductionUrl() {
  console.log('Test: Hub Production URL configuration');

  // Should use Hub Production deployment ID (AKfycbw-i5dNh9DOHOyGuo9-pbfrQCazwImd48wfxTDD8wecsg4tk5h6yXGy25OJFx1F5COgsw) with /exec
  const hubProdPattern = /AKfycbw-i5dNh9DOHOyGuo9-pbfrQCazwImd48wfxTDD8wecsg4tk5h6yXGy25OJFx1F5COgsw\/exec/;
  assert.ok(hubProdPattern.test(codeJs),
    'Should use Hub Production deployment @153 with /exec path');

  // Should NOT contain /dev in Production URL
  const prodUrlMatch = codeJs.match(/:\s*'https:\/\/script\.google\.com.*AKfycbw-i5dNh9DOHOyGuo9.*'/);
  assert.ok(prodUrlMatch && !prodUrlMatch[0].includes('/dev'),
    'Production URL should not contain /dev');

  console.log('  ✓ Hub Production URL correctly configured\n');
}

function testTemplateVariablePassing() {
  console.log('Test: hubBaseUrl passed to templates');

  // Should pass hubBaseUrl to both Index and StatusTracker templates
  assert.ok(/template\.hubBaseUrl = hubBaseUrl/.test(codeJs),
    'Should pass hubBaseUrl to templates');

  // Should set hubBaseUrl for both page types (status and default)
  const hubBaseUrlAssignments = codeJs.match(/template\.hubBaseUrl = hubBaseUrl/g);
  assert.ok(hubBaseUrlAssignments && hubBaseUrlAssignments.length >= 2,
    'Should set hubBaseUrl for both Index and StatusTracker templates');

  console.log('  ✓ hubBaseUrl passed to both templates\n');
}

function testHtmlTemplateVariables() {
  console.log('Test: HTML templates receive hubBaseUrl');

  // Index.html should have hubBaseUrl variable
  assert.ok(/var hubBaseUrl = <\?!= JSON\.stringify\(hubBaseUrl\) \?>/.test(indexHtml),
    'Index.html should receive hubBaseUrl from template');

  // StatusTracker.html should have hubBaseUrl variable
  assert.ok(/var hubBaseUrl = <\?!= JSON\.stringify\(hubBaseUrl\) \?>/.test(trackerHtml),
    'StatusTracker.html should receive hubBaseUrl from template');

  console.log('  ✓ Both HTML templates receive hubBaseUrl\n');
}

function testNavigationFunctionsUseHubBaseUrl() {
  console.log('Test: Navigation functions use hubBaseUrl');

  // goHome should use hubBaseUrl (not hardcoded URL)
  assert.ok(/function goHome[\s\S]{0,200}hubBaseUrl/.test(headerJS),
    'goHome should use hubBaseUrl variable');
  assert.ok(!/AKfycbxvHiD1Xab3gsf0pYA-k5ZejnRyabPupv6gULcY4m21/.test(headerJS),
    'Should not contain hardcoded old Hub DEV URL');

  // globalHeaderNavigateToSavedDemos should use hubBaseUrl + #saved-demos
  assert.ok(/hubBaseUrl \+ '#saved-demos'/.test(headerJS),
    'globalHeaderNavigateToSavedDemos should use hubBaseUrl + #saved-demos');

  console.log('  ✓ Navigation functions use dynamic hubBaseUrl\n');
}

function testNoHardcodedDevUrls() {
  console.log('Test: No hardcoded DEV URLs in navigation');

  // GlobalHeader_JS.html should NOT contain hardcoded /dev URLs
  const hardcodedDevPattern = /script\.google\.com.*\/dev(?!["']?\s*\+)/;
  assert.ok(!hardcodedDevPattern.test(headerJS),
    'Should not contain hardcoded /dev URLs (except in concatenation)');

  console.log('  ✓ No hardcoded DEV URLs in navigation functions\n');
}

// Run all tests
try {
  testHubUrlDetectionLogic();
  testHubDevUrl();
  testHubProductionUrl();
  testTemplateVariablePassing();
  testHtmlTemplateVariables();
  testNavigationFunctionsUseHubBaseUrl();
  testNoHardcodedDevUrls();

  console.log('✅ All cross-app navigation tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
