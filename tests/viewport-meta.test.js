/**
 * Viewport Meta Tag Test
 * Verifies both pages include viewport meta tag for mobile browser rendering
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running viewport meta tag test...\n');

const repoRoot = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');
const trackerHtml = fs.readFileSync(path.join(repoRoot, 'StatusTracker.html'), 'utf8');

function testIndexViewportMeta() {
  console.log('Test: Index.html has viewport meta tag');

  // Should have viewport meta with width=device-width, initial-scale=1
  const viewportMetaPattern = /<meta name="viewport" content="width=device-width, initial-scale=1">/;

  assert.ok(viewportMetaPattern.test(indexHtml),
    'Index.html should have <meta name="viewport" content="width=device-width, initial-scale=1">');

  // Should be in <head> section
  const headSection = indexHtml.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(headSection && viewportMetaPattern.test(headSection[0]),
    'Viewport meta tag should be in <head> section');

  console.log('  ✓ Index.html has viewport meta tag\n');
}

function testTrackerViewportMeta() {
  console.log('Test: StatusTracker.html has viewport meta tag');

  // Should have viewport meta with width=device-width, initial-scale=1
  const viewportMetaPattern = /<meta name="viewport" content="width=device-width, initial-scale=1">/;

  assert.ok(viewportMetaPattern.test(trackerHtml),
    'StatusTracker.html should have <meta name="viewport" content="width=device-width, initial-scale=1">');

  // Should be in <head> section
  const headSection = trackerHtml.match(/<head>([\s\S]*?)<\/head>/);
  assert.ok(headSection && viewportMetaPattern.test(headSection[0]),
    'Viewport meta tag should be in <head> section');

  console.log('  ✓ StatusTracker.html has viewport meta tag\n');
}

function testViewportPlacement() {
  console.log('Test: Viewport meta tag placement');

  // Should come after charset but before title (standard placement)
  const indexHeadStart = indexHtml.match(/<head>([\s\S]{0,500})/);
  const trackerHeadStart = trackerHtml.match(/<head>([\s\S]{0,500})/);

  // Check Index.html placement
  const indexCharsetPos = indexHeadStart[0].indexOf('charset="UTF-8"');
  const indexViewportPos = indexHeadStart[0].indexOf('name="viewport"');
  const indexTitlePos = indexHeadStart[0].indexOf('<title>');

  assert.ok(indexCharsetPos < indexViewportPos && indexViewportPos < indexTitlePos,
    'Index.html: viewport meta should be after charset, before title');

  // Check StatusTracker.html placement
  const trackerCharsetPos = trackerHeadStart[0].indexOf('charset="UTF-8"');
  const trackerViewportPos = trackerHeadStart[0].indexOf('name="viewport"');
  const trackerTitlePos = trackerHeadStart[0].indexOf('<title>');

  assert.ok(trackerCharsetPos < trackerViewportPos && trackerViewportPos < trackerTitlePos,
    'StatusTracker.html: viewport meta should be after charset, before title');

  console.log('  ✓ Viewport meta tag correctly placed in both pages\n');
}

// Run all tests
try {
  testIndexViewportMeta();
  testTrackerViewportMeta();
  testViewportPlacement();

  console.log('✅ All viewport meta tag tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
