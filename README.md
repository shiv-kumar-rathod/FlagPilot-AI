
# FlagPilot AI 🚩

### Your AI-powered feature flag debt manager for Flagsmith

**Track 4 — Flagsmith Agent Skills | Toggle Wars Hackathon**

FlagPilot AI helps developers discover, investigate, and manage potential feature-flag debt through a safety-first Agent Skill powered by the Flagsmith CLI.

It combines live Flagsmith feature discovery, JavaScript source-code scanning, conservative evidence classification, and actionable Markdown reports.

> Find potential flag debt. Understand the evidence. Prepare safer cleanup decisions. Keep humans in control.

## The problem

Feature flags help teams release software safely, but old flags can remain in applications long after their original purpose has passed.

This creates feature-flag debt:

- Harder-to-maintain code.
- Unnecessary conditional logic.
- Confusing release workflows.
- Increased investigation effort.
- Risk of accidentally removing functionality that is still needed.

Finding an old or disabled flag does not prove that it is safe to remove.

## Our solution

FlagPilot AI provides an AI-agent workflow for investigating feature-flag debt in Flagsmith projects.

### Core capabilities

- **Live flag discovery:** Retrieve feature flags using the Flagsmith CLI.
- **Source-code analysis:** Scan selected JavaScript source directories for static flag-name matches.
- **Evidence classification:** Distinguish static matches, review candidates, and insufficient evidence.
- **Reference locations:** Report matching files and line numbers.
- **Safety-first reporting:** Generate a Markdown report with evidence, limitations, and investigation recommendations.
- **Human-controlled cleanup:** Require human review and approval before any configuration-changing operation.

## How it works

```text
Flagsmith CLI
     |
     v
Feature flag discovery
     |
     v
Selected application source
     |
     v
JavaScript AST scanning
     |
     v
Evidence classification
     |
     v
Markdown debt report
     |
     v
Human investigation
     |
     v
Approved cleanup proposal
```

The current implementation performs discovery, scanning, classification, and reporting. Automated archiving and deletion are intentionally not implemented.

## Technology stack

| Technology | Purpose |
|---|---|
| Node.js | Core runtime |
| JavaScript | Application and scripts |
| Acorn | JavaScript AST parsing |
| Flagsmith CLI | Feature flag discovery |
| Node.js Test Runner | Automated tests |
| Markdown | Reports and Agent Skill documentation |

## Project structure

```text
FlagPilot-AI/
├── docs/
│   ├── ARCHITECTURE.md
│   └── TESTING.md
├── sample-app/
│   ├── feature-flags.json
│   └── src/
├── skills/
│   └── flag-debt-manager/
│       ├── SKILL.md
│       ├── assets/
│       │   └── report-template.md
│       ├── references/
│       │   ├── flagsmith-cli.md
│       │   └── safety-policy.md
│       └── scripts/
│           ├── classify-risks.js
│           ├── discover-flags.js
│           ├── generate-report.js
│           └── scan-references.js
├── tests/
│   ├── fixtures/
│   ├── classifier.test.js
│   ├── discovery.test.js
│   ├── report.test.js
│   └── scanner.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 20 or newer.
- npm.
- Flagsmith CLI.
- An authenticated Flagsmith account for live discovery.

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd FlagPilot-AI
```

Install dependencies:

```bash
npm install
```

Verify the installation:

```bash
node --version
npm --version
flagsmith version
```

Authenticate using the Flagsmith CLI's supported login flow:

```bash
flagsmith login
```

Never paste access tokens or API keys into source files or commit credentials.

## Usage

### 1. Run automated tests

```bash
npm test
```

### 2. Generate an offline demonstration report

```bash
npm run report:offline
```

This uses bundled sample flags and the sample application. It does not contact Flagsmith.

### 3. Discover live Flagsmith flags

```bash
npm run scan
```

This uses the configured organisation and project in the discovery script.

### 4. Generate a live feature-flag debt report

Select the source directory of the application you want to audit:

```bash
npm run report -- --source "./path/to/your/application/src"
```

On Windows PowerShell, for example:

```powershell
npm run report -- --source ".\sample-app\src"
```

Live mode requires an explicit source directory. It does not silently scan the bundled sample application.

### 5. Read the report

The report is generated at:

```text
reports/flag-debt-report.md
```

## Evidence classification

FlagPilot uses conservative classifications.

| Classification | Meaning |
|---|---|
| `static_reference_detected` | Static syntax matches were found. Runtime use is unproven. |
| `review_candidate` | No static reference was found in the selected source. Further investigation is required. |
| `insufficient_evidence` | Available scanner evidence is missing or inadequate. |

A missing source reference does not prove that a feature flag is unused.

## Safety and trust

FlagPilot follows a human-in-the-loop approach.

- Discovery and report generation are read-only.
- No flags are automatically enabled or disabled.
- No flags are automatically archived or deleted.
- Production changes require explicit human approval.
- Reports disclose their source directory and analysis limitations.
- Credentials must never be committed or exposed.

The current scanner supports JavaScript `.js` files and static syntax matching. It does not establish runtime SDK evaluation, telemetry, or complete cross-repository usage.

A generated report is evidence for a decision, not the decision itself.

## Current limitations

This is an active hackathon project.

Current implementation limitations:

- JavaScript `.js` scanning only.
- Static syntax matching rather than semantic proof of Flagsmith SDK evaluation.
- No runtime telemetry integration.
- No automatic cross-repository discovery.
- No automatic cleanup, archiving, or deletion.
- The bundled sample application is for demonstration and testing.

## Automated testing

Run:

```bash
npm test
```

The project includes tests for:

- Flag input validation.
- Flagsmith CLI discovery.
- JavaScript source scanning.
- Risk classification.
- Report generation.
- Live-mode source-directory validation.
- Invalid and conflicting command-line arguments.
- Safety and evidence wording.

## Agent Skill

The core Agent Skill is:

```text
skills/flag-debt-manager/SKILL.md
```

Supporting resources:

- `references/flagsmith-cli.md`
- `references/safety-policy.md`
- `assets/report-template.md`

The skill guides an AI coding agent through the Flagsmith feature-flag audit workflow.

## Team

**SSTECH**

Built for the WeMakeDevs × Flagsmith Toggle Wars Hackathon.

## Project status

The current implementation includes working CLI discovery, JavaScript scanning, risk classification, Markdown report generation, and automated tests.

Further development will focus on improving evidence quality, expanding language support, and preparing human-approved cleanup workflows.
