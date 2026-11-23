/**
 * Iframe Navigation Test
 * Verifies Global Header uses top-level navigation for Apps Script iframe sandbox
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running iframe navigation test...\n');

const repoRoot = path.resolve(__dirname, '..');
const headerJS = fs.readFileSync(path.join(repoRoot, 'GlobalHeader_JS.html'), 'utf8');

function testTopLevelNavigation() {
  console.log('Test: Navigation functions use window.top.location.href');

  // Navigation functions that still exist (goHome removed, branding is static)
  const navigationFunctions = [
    'globalHeaderNavigateToIntake',
    'globalHeaderNavigateToTracker',
    'globalHeaderNavigateToSavedDemos'
  ];

  navigationFunctions.forEach(funcName => {
    // Find function definition
    const funcPattern = new RegExp(`function ${funcName}\\([^)]*\\)[^{]*{([^}]+)}`, 's');
    const match = headerJS.match(funcPattern);

    assert.ok(match, `Should find ${funcName} function`);

    const funcBody = match[1];

    // Should use window.top.location.href, not window.location.href
    assert.ok(/window\.top\.location\.href/.test(funcBody),
      `${funcName} should use window.top.location.href for iframe sandbox`);

    assert.ok(!/(?<!\.top)\.location\.href\s*=/.test(funcBody),
      `${funcName} should not use window.location.href directly`);
  });

  console.log('  ✓ All navigation functions use top-level navigation\n');
}

function testEventHandlingPreserved() {
  console.log('Test: Event handling preserved');

  // Functions with event parameters should call preventDefault (goHome removed)
  const eventFunctions = [
    'globalHeaderNavigateToIntake',
    'globalHeaderNavigateToTracker'
  ];

  eventFunctions.forEach(funcName => {
    const funcPattern = new RegExp(`function ${funcName}\\(event\\)[^{]*{([^}]+)}`, 's');
    const match = headerJS.match(funcPattern);

    if (match) {
      const funcBody = match[1];
      assert.ok(/event\.preventDefault/.test(funcBody),
        `${funcName} should call event.preventDefault()`);
    }
  });

  console.log('  ✓ Event handling preserved\n');
}

// Run all tests
try {
  testTopLevelNavigation();
  testEventHandlingPreserved();

  console.log('✅ All iframe navigation tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
