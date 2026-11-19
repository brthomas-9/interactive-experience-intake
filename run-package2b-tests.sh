#!/bin/bash
# Package 2B Phase 1 Test Runner
# Runs all static HTML structure tests for Global Header implementation

set -e

# Change to repository root if script run from elsewhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================"
echo "Package 2B Phase 1 Test Suite"
echo "================================"
echo ""

TESTS=(
  "tests/include-helper.test.js"
  "tests/intake-header-integration.test.js"
  "tests/tracker-header-integration.test.js"
  "tests/mobile-navigation.test.js"
  "tests/navigation-destinations.test.js"
  "tests/iframe-navigation.test.js"
  "tests/intake-css-integration.test.js"
  "tests/tracker-css-integration.test.js"
  "tests/viewport-meta.test.js"
  "tests/cross-app-navigation.test.js"
  "tests/submit-new-button.test.js"
)

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
  if node "$test"; then
    PASSED=$((PASSED + 1))
  else
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo "================================"
echo "Test Summary"
echo "================================"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "❌ Some tests failed"
  exit 1
else
  echo "✅ All Package 2B tests passed"
  exit 0
fi
