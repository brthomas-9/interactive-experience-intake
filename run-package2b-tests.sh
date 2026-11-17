#!/bin/bash
# Package 2B Phase 1 Test Runner
# Runs all static HTML structure tests for Global Header implementation

set -e

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
)

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
  if node "$test"; then
    ((PASSED++))
  else
    ((FAILED++))
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
