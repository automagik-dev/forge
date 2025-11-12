# QA Evidence Collection

This directory contains evidence and artifacts from implementation and testing phases.

## Directory Structure

- `screenshots/` - Visual evidence of implementation (mobile, desktop, native)
- `test-results/` - Test execution results (unit, integration, e2e)
- `metrics/` - Performance metrics (bundle size, load time, Lighthouse scores)
- `evidence/` - Implementation artifacts (code samples, configuration files)

## Evidence Requirements

### Implementation Phase
- Screenshots of each implemented feature
- Test results showing passing tests
- Performance metrics meeting targets
- Code samples demonstrating implementation

### Verification Phase
- Cross-platform screenshots (native app, mobile web, desktop)
- Side-by-side comparisons validating universality
- Lighthouse scores for mobile web (target: >90)
- User testing results and feedback

## Naming Conventions

- Screenshots: `YYYY-MM-DD-{feature}-{platform}-{viewport}.png`
- Test results: `YYYY-MM-DD-{test-suite}-results.txt`
- Metrics: `YYYY-MM-DD-{metric-type}.json`
- Evidence: `YYYY-MM-DD-{artifact-name}.{ext}`

## Review Integration

All evidence collected here will be referenced in the final review report to validate 100/100 completion score.
