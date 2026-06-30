import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Coverage focuses on the pure business-logic modules that the test
    // suite actually targets — utils and the testable service helpers.
    // Controllers/routes/models need an integration harness (DB + HTTP)
    // and are covered by the boot check in CI instead, so including them
    // here would report misleadingly low numbers for untested-by-design
    // glue code rather than the core logic we care about.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: [
        'utils/**/*.js',
        'services/aiSearchService.js',
      ],
    },
  },
})