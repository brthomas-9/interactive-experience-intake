/**
 * Navigation Destinations Test
 * Verifies all navigation URLs match specification
 */

const assert = require('assert');
const fs = require('fs');

console.log('Running navigation destinations test...\n');

const header = fs.readFileSync('/Users/rubyyang/arcade-intake-package2b-phase1/GlobalHeader.html', 'utf8');
const headerJS = fs.readFileSync('/Users/rubyyang/arcade-intake-package2b-phase1/GlobalHeader_JS.html', 'utf8');

function testResourcesDestinations() {
  console.log('Test: Resources dropdown URLs');

  // User Guide
  assert.ok(/github\.com\/rubyyyyang\/interactive-experience-intake\/blob\/main\/docs\/user-guide\.md/.test(header), 'User Guide URL correct');

  // Best Practices
  assert.ok(/docs\.google\.com\/document\/d\/13njLj4SYUbvaUwd0zoyt1Racpz8vR4Zz8H43IqkalLU/.test(header), 'Best Practices URL correct');

  // The Source
  assert.ok(/source\.redhat\.com\/groups\/private\/arcade_demo_platform/.test(header), 'The Source URL correct');

  // Public Interactive Experiences
  assert.ok(/redhat\.com\/en\/interactive-experiences/.test(header), 'Public Experiences URL correct');

  // Analytics Dashboard
  assert.ok(/analytics\.infra\.demo\.redhat\.com\/superset\/dashboard\/101/.test(header), 'Analytics Dashboard URL correct');

  // Slack
  assert.ok(/redhat\.enterprise\.slack\.com\/archives\/C07HQMHFWQG/.test(header), 'Slack channel URL correct');

  console.log('  ✓ All Resources URLs match spec\n');
}

function testCreateSubmitDestinations() {
  console.log('Test: Create & Submit dropdown URLs');

  // Request New Demo - should use Google Form
  assert.ok(/forms\/d\/e\/1FAIpQLSeT5z2JaseXC54hLtlhbJ4ONw6PPEXzsQwoko4ExKkCYR6fhA/.test(header), 'Request New Demo Google Form URL correct');

  // Submit Demo - should use navigateToIntake function, not hardcoded URL
  assert.ok(/navigateToIntake/.test(header), 'Submit Demo should call navigateToIntake()');
  assert.ok(!/script\.google\.com[\s\S]{0,100}Submit a Demo/.test(header), 'Submit Demo should not hardcode script.google.com URL');

  // Check My Submissions - should use navigateToTracker function
  assert.ok(/navigateToTracker/.test(header), 'Check My Submissions should call navigateToTracker()');

  console.log('  ✓ Create & Submit URLs use correct functions\n');
}

function testAIAssistant() {
  console.log('Test: AI Assistant URL');

  assert.ok(/notebooklm\.google\.com\/notebook\/26663614-ab4e-4ae0-ae75-1360c149438f/.test(header), 'AI Assistant URL correct');

  console.log('  ✓ AI Assistant URL correct\n');
}

function testSavedDemosNavigation() {
  console.log('Test: Saved Demos navigation');

  // Should use navigateToSavedDemos function
  assert.ok(/navigateToSavedDemos/.test(header), 'Saved Demos should call navigateToSavedDemos()');

  // navigateToSavedDemos should point to Hub DEV with #saved-demos
  assert.ok(/AKfycbxvHiD1Xab3gsf0pYA-k5ZejnRyabPupv6gULcY4m21\/dev#saved-demos/.test(headerJS), 'navigateToSavedDemos should point to Hub DEV with #saved-demos fragment');

  console.log('  ✓ Saved Demos navigation correct\n');
}

function testFeedbackIntegration() {
  console.log('Test: Feedback uses page-specific promptFeedback()');

  // Should call promptFeedback(), not a new function
  assert.ok(/promptFeedback\(\)/.test(header), 'Send Feedback should call promptFeedback()');

  console.log('  ✓ Feedback integration correct\n');
}

// Run all tests
try {
  testResourcesDestinations();
  testCreateSubmitDestinations();
  testAIAssistant();
  testSavedDemosNavigation();
  testFeedbackIntegration();

  console.log('✅ All navigation destination tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
