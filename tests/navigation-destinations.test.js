/**
 * Navigation Destinations Test
 * Verifies all navigation URLs match specification
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running navigation destinations test...\n');

const repoRoot = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(repoRoot, 'GlobalHeader.html'), 'utf8');
const headerJS = fs.readFileSync(path.join(repoRoot, 'GlobalHeader_JS.html'), 'utf8');
const indexHTML = fs.readFileSync(path.join(repoRoot, 'Index.html'), 'utf8');

function testResourcesDestinations() {
  console.log('Test: Resources dropdown URLs');

  // User Guide - should NOT be in GlobalHeader
  assert.ok(!/github.com\/rubyyyyang\/interactive-experience-intake\/blob\/main\/docs\/user-guide.md/.test(header), 'User Guide should NOT be in GlobalHeader Resources');

  // Best Practices
  assert.ok(/docs.google.com\/document\/d\/13njLj4SYUbvaUwd0zoyt1Racpz8vR4Zz8H43IqkalLU/.test(header), 'Best Practices URL correct');

  // The Source
  assert.ok(/source.redhat.com\/groups\/private\/arcade_demo_platform/.test(header), 'The Source URL correct');

  // Public Interactive Experiences
  assert.ok(/redhat.com\/en\/interactive-experiences/.test(header), 'Public Experiences URL correct');

  // Analytics Dashboard
  assert.ok(/analytics.infra.demo.redhat.com\/superset\/dashboard\/144/.test(header), 'Analytics Dashboard URL correct');

  // Slack
  assert.ok(/redhat.enterprise.slack.com\/archives\/C07HQMHFWQG/.test(header), 'Slack channel URL correct');

  console.log('  ✓ All Resources URLs match spec\n');
}

function testCreateSubmitDestinations() {
  console.log('Test: Create & Submit dropdown URLs');

  // Request New Demo - should use Google Form
  assert.ok(/forms\/d\/e\/1FAIpQLSeT5z2JaseXC54hLtlhbJ4ONw6PPEXzsQwoko4ExKkCYR6fhA/.test(header), 'Request New Demo Google Form URL correct');

  // Submit Demo - should use globalHeaderNavigateToIntake function, not hardcoded URL
  assert.ok(/globalHeaderNavigateToIntake/.test(header), 'Submit Demo should call globalHeaderNavigateToIntake()');
  assert.ok(!/script.google.com[\s\S]{0,100}Submit a Demo/.test(header), 'Submit Demo should not hardcode script.google.com URL');

  // Check My Submissions - should use globalHeaderNavigateToTracker function
  assert.ok(/globalHeaderNavigateToTracker/.test(header), 'Check My Submissions should call globalHeaderNavigateToTracker()');

  console.log('  ✓ Create & Submit URLs use correct functions\n');
}

function testAIAssistant() {
  console.log('Test: AI Assistant URL');

  assert.ok(/notebooklm.google.com\/notebook\/26663614-ab4e-4ae0-ae75-1360c149438f/.test(header), 'AI Assistant URL correct');

  console.log('  ✓ AI Assistant URL correct\n');
}

function testSavedDemosNavigation() {
  console.log('Test: Saved Demos navigation');

  // Should use globalHeaderNavigateToSavedDemos function
  assert.ok(/globalHeaderNavigateToSavedDemos/.test(header), 'Saved Demos should call globalHeaderNavigateToSavedDemos()');

  // globalHeaderNavigateToSavedDemos should use hubBaseUrl + #saved-demos
  assert.ok(/hubBaseUrl \+ '#saved-demos'/.test(headerJS), 'globalHeaderNavigateToSavedDemos should use hubBaseUrl + #saved-demos');

  // goHome should use hubBaseUrl
  assert.ok(/function goHome[\s\S]*hubBaseUrl/.test(headerJS), 'goHome should use hubBaseUrl');

  console.log('  ✓ Saved Demos and Home navigation use dynamic hubBaseUrl\n');
}

function testFeedbackIntegration() {
  console.log('Test: Feedback uses page-specific promptFeedback()');

  // Should call promptFeedback(), not a new function
  assert.ok(/promptFeedback\(\)/.test(header), 'Send Feedback should call promptFeedback()');

  console.log('  ✓ Feedback integration correct\n');
}

function testIndexPageLinks() {
  console.log('Test: Index.html page-level links');

  // Index.html should still contain its own User Guide link
  assert.ok(/github.com\/rubyyyyang\/interactive-experience-intake\/blob\/main\/docs\/user-guide.md/.test(indexHTML), 'Index.html should contain User Guide link');

  // Index.html should NOT contain "Need help?" link
  assert.ok(!/Need help\?/.test(indexHTML), 'Index.html should NOT contain "Need help?" link');

  console.log('  ✓ Index.html page-level links correct\n');
}

// Run all tests
try {
  testResourcesDestinations();
  testCreateSubmitDestinations();
  testAIAssistant();
  testSavedDemosNavigation();
  testFeedbackIntegration();
  testIndexPageLinks();

  console.log('✅ All navigation destination tests passed');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
