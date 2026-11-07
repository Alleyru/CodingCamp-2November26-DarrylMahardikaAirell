import { defineConfig } from 'vitest/config'

// Vitest configuration for the To-Do List Life Dashboard.
//
// Testing strategy (see design.md "Testing Strategy"):
//   - Pure logic tests (tests/unit/**) run in the default Node environment.
//   - DOM-related tests (tests/integration/**, tests/smoke/**) run in the
//     jsdom environment so they have access to a simulated DOM.
//
// Property-based tests use fast-check with a minimum of 100 iterations each.
export default defineConfig({
  test: {
    // Default environment: Node — used for pure logic tests that have no DOM
    // dependencies (validation, formatting, serialization, state transitions,
    // sorting, theme logic, duplicate detection).
    environment: 'node',

    // Override the environment per test directory:
    //   tests/integration/** -> jsdom (DOM rendering + localStorage I/O tests)
    //   tests/smoke/**       -> jsdom (structural DOM assertions such as the
    //                          theme toggle button, sort control, font-size,
    //                          and contrast checks)
    environmentMatchGlobs: [
      ['tests/integration/**', 'jsdom'],
      ['tests/smoke/**', 'jsdom'],
    ],

    // Only collect test files from the tests/ directory tree.
    include: ['tests/**/*.test.js'],

    // Make describe/test/expect/etc. available globally so test files don't
    // need an explicit import line for the Vitest globals.
    globals: true,
  },
})
