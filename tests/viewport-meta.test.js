/**
 * Viewport Meta Tag Test
 * Verifies both doGet() paths add viewport meta tag via .addMetaTag()
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running viewport meta tag test...\n');

const repoRoot = path.resolve(__dirname, '..');
const codeJs = fs.readFileSync(path.join(repoRoot, 'Code.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');

function testDoGetIndexViewport() {
  console.log('Test: doGet() Index path adds viewport meta tag');

  // Find the Index return statement in doGet()
  const indexReturnPattern = /template\.evaluate\(\)[^;]*\.setTitle\('Interactive Experience Intake'\)[^;]*\.addMetaTag\('viewport',\s*'width=device-width,\s*initial-scale=1'\)/;

  assert.ok(indexReturnPattern.test(codeJs),
    'doGet() Index path should call .addMetaTag(\'viewport\', \'width=device-width, initial-scale=1\')');

  console.log('  ✓ doGet() Index path adds viewport meta tag\n');
}

function testDoGetTrackerViewport() {
  console.log('Test: doGet() StatusTracker path adds viewport meta tag');

  // Find the StatusTracker return statement in doGet()
  const trackerReturnPattern = /template\.evaluate\(\)[^;]*\.setTitle\('Interactive Experience Status Tracker'\)[^;]*\.addMetaTag\('viewport',\s*'width=device-width,\s*initial-scale=1'\)/;

  assert.ok(trackerReturnPattern.test(codeJs),
    'doGet() StatusTracker path should call .addMetaTag(\'viewport\', \'width=device-width, initial-scale=1\')');

  console.log('  ✓ doGet() StatusTracker path adds viewport meta tag\n');
}

function testNoInlineViewportMeta() {
  console.log('Test: HTML files do not contain ineffective inline viewport meta tags');

  // Apps Script ignores inline meta tags - should not have them in HTML
  const inlineViewportPattern = /<meta name="viewport"/;

  assert.ok(!inlineViewportPattern.test(indexHtml),
    'Index.html should not have inline viewport meta tag (Apps Script ignores it)');

  assert.ok(!inlineViewportPattern.test(trackerHtml),
    'StatusTracker.html should not have inline viewport meta tag (Apps Script ignores it)');

  console.log('  ✓ No ineffective inline viewport meta tags\n');
}

function testDoGetStructure() {
  console.log('Test: doGet() structure preserves routing and titles');

  // Should have page=status routing
  assert.ok(/if \(page === 'status'\)/.test(codeJs),
    'doGet() should have page=status routing');

  // Should set correct titles
  assert.ok(/\.setTitle\('Interactive Experience Intake'\)/.test(codeJs),
    'doGet() should set Index title');

  assert.ok(/\.setTitle\('Interactive Experience Status Tracker'\)/.test(codeJs),
    'doGet() should set Tracker title');

  // Should preserve XFrameOptionsMode
  assert.ok(/\.setXFrameOptionsMode\(HtmlService\.XFrameOptionsMode\.ALLOWALL\)/.test(codeJs),
    'doGet() should preserve XFrameOptionsMode');

  console.log('  ✓ doGet() structure preserved\n');
}

// Run all tests
try {
  testDoGetIndexViewport();
  testDoGetTrackerViewport();
  testNoInlineViewportMeta();
  testDoGetStructure();

  console.log('✅ All viewport meta tag tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
