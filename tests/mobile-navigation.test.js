/**
 * Mobile Navigation Test
 * Verifies mobile viewport and navigation behavior
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running mobile navigation test...\n');

const repoRoot = path.resolve(__dirname, '..');
const globalHeaderCSS = fs.readFileSync(path.join(repoRoot, 'GlobalHeader_CSS.html'), 'utf8');
const globalHeaderJS = fs.readFileSync(path.join(repoRoot, 'GlobalHeader_JS.html'), 'utf8');

function testMobileMenuToggle() {
  console.log('Test: Mobile menu toggle button and function');

  const hasToggleButton = /\.mobileMenuToggle/.test(globalHeaderCSS);
  const hasToggleFunction = /function toggleMobileMenu/.test(globalHeaderJS);

  assert.ok(hasToggleButton, 'Should have mobile menu toggle button in CSS');
  assert.ok(hasToggleFunction, 'Should have toggleMobileMenu function in JS');

  console.log('  ✓ Mobile toggle button and function present\n');
}

function testMobileBreakpoint() {
  console.log('Test: 768px mobile breakpoint');

  const has768Breakpoint = /@media \(max-width: 768px\)/.test(globalHeaderCSS);

  assert.ok(has768Breakpoint, 'Should have 768px mobile breakpoint');

  console.log('  ✓ 768px breakpoint found\n');
}

function testDropdownsAlwaysExpanded() {
  console.log('Test: Dropdowns always expanded on mobile');

  // Mobile should hide dropdown toggle buttons
  const hidesToggleButtons = /navItem\.navDropdown > \.navButton[\s\S]{0,200}display: none/.test(globalHeaderCSS);

  assert.ok(hidesToggleButtons, 'Mobile should hide dropdown toggle buttons and show sections directly');

  console.log('  ✓ Dropdown toggle buttons hidden on mobile\n');
}

function testMobileMenuSlide() {
  console.log('Test: Mobile menu slides in from right');

  const slidesBehavior = /right: -100%/.test(globalHeaderCSS) && /mobileMenuOpen/.test(globalHeaderCSS);

  assert.ok(slidesBehavior, 'Mobile menu should slide in from right (-100% to 0)');

  console.log('  ✓ Mobile menu slide behavior configured\n');
}

// Run all tests
try {
  testMobileMenuToggle();
  testMobileBreakpoint();
  testDropdownsAlwaysExpanded();
  testMobileMenuSlide();

  console.log('✅ All mobile navigation tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
