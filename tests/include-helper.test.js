/**
 * Apps Script Include Helper Test
 * Verifies include() function exists and component files are referenced
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running Apps Script include helper test...\n');

const repoRoot = path.resolve(__dirname, '..');
const codeJs = fs.readFileSync(path.join(repoRoot, 'Code.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');

function testIncludeHelperExists() {
  console.log('Test: include() helper function defined in Code.js');

  const hasIncludeFunction = /function include\s*\(/.test(codeJs);
  assert.ok(hasIncludeFunction, 'Code.js should define include() function');

  const usesHtmlService = /HtmlService\.createHtmlOutputFromFile/.test(codeJs);
  assert.ok(usesHtmlService, 'include() should use HtmlService.createHtmlOutputFromFile()');

  console.log('  ✓ include() function defined correctly\n');
}

function testComponentFilesExist() {
  console.log('Test: Global Header component files exist');

  const globalHeaderExists = fs.existsSync(path.join(repoRoot, 'GlobalHeader.html'));
  const globalHeaderCSSExists = fs.existsSync(path.join(repoRoot, 'GlobalHeader_CSS.html'));
  const globalHeaderJSExists = fs.existsSync(path.join(repoRoot, 'GlobalHeader_JS.html'));

  assert.ok(globalHeaderExists, 'GlobalHeader.html should exist');
  assert.ok(globalHeaderCSSExists, 'GlobalHeader_CSS.html should exist');
  assert.ok(globalHeaderJSExists, 'GlobalHeader_JS.html should exist');

  console.log('  ✓ All component files present\n');
}

function testIndexReferencesComponents() {
  console.log('Test: Index.html references component files');

  const referencesCSS = /include\("GlobalHeader_CSS"\)/.test(indexHtml);
  const referencesHTML = /include\("GlobalHeader"\)/.test(indexHtml);
  const referencesJS = /include\("GlobalHeader_JS"\)/.test(indexHtml);

  assert.ok(referencesCSS, 'Index.html should include GlobalHeader_CSS');
  assert.ok(referencesHTML, 'Index.html should include GlobalHeader');
  assert.ok(referencesJS, 'Index.html should include GlobalHeader_JS');

  console.log('  ✓ Index.html includes all components\n');
}

function testTrackerReferencesComponents() {
  console.log('Test: StatusTracker.html references component files');

  const referencesCSS = /include\("GlobalHeader_CSS"\)/.test(trackerHtml);
  const referencesHTML = /include\("GlobalHeader"\)/.test(trackerHtml);
  const referencesJS = /include\("GlobalHeader_JS"\)/.test(trackerHtml);

  assert.ok(referencesCSS, 'StatusTracker.html should include GlobalHeader_CSS');
  assert.ok(referencesHTML, 'StatusTracker.html should include GlobalHeader');
  assert.ok(referencesJS, 'StatusTracker.html should include GlobalHeader_JS');

  console.log('  ✓ StatusTracker.html includes all components\n');
}

// Run all tests
try {
  testIncludeHelperExists();
  testComponentFilesExist();
  testIndexReferencesComponents();
  testTrackerReferencesComponents();

  console.log('✅ All include helper tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
