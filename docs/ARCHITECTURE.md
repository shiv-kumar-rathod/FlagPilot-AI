
# FlagPilot AI — System Architecture

## 1. Overview

FlagPilot AI is a safety-first Flagsmith feature-flag debt management Agent Skill.

It combines:

- Flagsmith CLI for live feature discovery.
- Node.js for workflow orchestration.
- Acorn for JavaScript AST parsing.
- A conservative classification engine.
- Markdown report generation.
- An Agent Skill instruction layer.

## 2. Architecture

```text
                 AI Coding Agent
                        |
                        v
                  SKILL.md
                        |
            +-----------+-----------+
            |                       |
            v                       v
      Flagsmith CLI            Source Directory
            |                       |
            v                       v
     discover-flags.js        scan-references.js
            |                       |
            +-----------+-----------+
                        |
                        v
                 classify-risks.js
                        |
                        v
                 generate-report.js
                        |
                        v
                Markdown Report
                        |
                        v
                Human Investigation
                        |
                        v
                Cleanup Proposal
```

## 3. Components

### Agent Skill

Location: `skills/flag-debt-manager/SKILL.md`

Defines the workflow, tool usage, evidence interpretation, safety rules, and human approval requirements.

### Discovery module

Location: `skills/flag-debt-manager/scripts/discover-flags.js`

Responsibilities:

- Resolve the installed Flagsmith CLI.
- Execute read-only feature discovery.
- Parse JSON output.
- Validate feature records.
- Avoid exposing sensitive command output.

### Source scanner

Location: `skills/flag-debt-manager/scripts/scan-references.js`

Responsibilities:

- Recursively locate JavaScript source files.
- Parse source using Acorn.
- Identify static syntax matches.
- Record file and line locations.
- Reject invalid JavaScript.

### Risk classifier

Location: `skills/flag-debt-manager/scripts/classify-risks.js`

Responsibilities:

- Validate scanner evidence.
- Classify static matches.
- Identify review candidates.
- Preserve insufficient evidence as unknown.
- Avoid unsupported safe-to-delete conclusions.

### Report generator

Location: `skills/flag-debt-manager/scripts/generate-report.js`

Responsibilities:

- Support offline sample reporting.
- Support live Flagsmith discovery.
- Require an explicit source directory in live mode.
- Combine discovery, scanning, and classification.
- Generate a Markdown report.
- Record the source directory scanned.

## 4. Data flow

1. The user chooses offline or live mode.
2. In live mode, the user explicitly selects a source directory.
3. The discovery module retrieves feature data.
4. The scanner examines the selected JavaScript source.
5. The classifier evaluates the available evidence.
6. The report generator creates the Markdown report.
7. The user reviews findings and investigates unresolved candidates.

## 5. Technology decisions

| Technology | Reason |
|---|---|
| Node.js | Cross-platform runtime |
| Acorn | JavaScript AST parsing |
| Flagsmith CLI | Native feature-flag discovery |
| Node.js test runner | Lightweight automated testing |
| Markdown | Portable reports and documentation |

## 6. Security boundaries

The current implementation:

- Uses read-only Flagsmith feature discovery.
- Does not change feature flags.
- Does not archive or delete features.
- Does not require credentials in source files.
- Keeps generated reports out of Git.
- Requires an explicit live source directory.

## 7. Current limitations

- JavaScript `.js` files only.
- Static syntax matches do not prove SDK evaluation.
- Runtime telemetry is not integrated.
- Cross-repository discovery is not automatic.
- Cleanup operations are not implemented.

These limitations are explicitly reflected in the generated report and safety policy.
