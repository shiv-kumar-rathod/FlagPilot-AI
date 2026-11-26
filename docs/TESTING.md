
# FlagPilot AI — Testing Guide

## 1. Purpose

This document describes how to install, execute, and validate FlagPilot AI.

The automated tests use Node.js's built-in test runner and do not require a live Flagsmith account.

## 2. Prerequisites

- Node.js 20 or newer.
- npm.
- Flagsmith CLI for live discovery tests.
- An authenticated Flagsmith account for live reporting.

## 3. Install dependencies

From the project root:

```powershell
npm install
```

## 4. Run automated tests

```powershell
npm test
```

The test suite covers:

- Flagsmith feature input validation.
- CLI discovery and error handling.
- JavaScript AST scanning.
- Nested source directories.
- Static reference detection.
- Conservative evidence classification.
- Report content and safety wording.
- Live-mode source-directory validation.
- Invalid and conflicting command-line arguments.

The automated test suite mocks CLI execution where necessary and does not modify Flagsmith configuration.

## 5. Offline report test

Run:

```powershell
npm run report:offline
```

Expected behavior:

- Reads the bundled sample flag fixture.
- Scans `sample-app/src`.
- Classifies sample flags.
- Generates `reports/flag-debt-report.md`.
- Does not contact Flagsmith.

## 6. Live discovery test

Verify the CLI:

```powershell
flagsmith version
flagsmith auth status
```

Discover flags:

```powershell
npm run scan
```

This performs read-only feature discovery using the configured organisation and project.

## 7. Live report test

Select an existing JavaScript source directory:

```powershell
npm run report -- --source ".\sample-app\src"
```

Expected behavior:

- Retrieves live Flagsmith feature data.
- Scans the explicitly selected source directory.
- Classifies available evidence.
- Generates a Markdown report.

## 8. Safety checks

Confirm that live mode refuses to run without an explicit source directory:

```powershell
npm run report
```

Confirm that invalid source directories are rejected.

Confirm that offline and live modes cannot be selected simultaneously.

No test should archive, delete, enable, disable, or otherwise modify a feature flag.

## 9. Report verification

Check:

```text
reports/flag-debt-report.md
```

Verify:

- Data source.
- Organisation and project.
- Source directory scanned.
- Number of flags inspected.
- Evidence classifications.
- Reference locations.
- Scope and limitations.
- Human approval and safety wording.

## 10. Test result recording

Record the actual test count and result when running the suite.

Do not publish expected test counts as actual results without executing the tests.

## 11. Known limitations

- JavaScript `.js` scanning only.
- Static syntax matches do not establish runtime usage.
- Dynamic references may be missed.
- Runtime telemetry is not integrated.
- Cross-repository coverage is not automatic.
