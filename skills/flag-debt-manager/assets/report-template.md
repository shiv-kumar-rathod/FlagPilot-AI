
# FlagPilot AI — Feature Flag Debt Report

**Generated:** {{generated_at}}

**Data source:** {{data_source}}

**Organisation:** {{organisation}}

**Project:** {{project}}

**Source directory scanned:** {{source_directory}}

**Flags inspected:** {{flags_inspected}}

## 1. Executive summary

| Classification | Count |
|---|---:|
| Static reference detected | {{static_reference_detected}} |
| Review candidates | {{review_candidates}} |
| Insufficient evidence | {{insufficient_evidence}} |

## 2. Flag findings

{{flag_findings}}

For each flag, include:

- Flag name and identifier.
- Enabled state.
- Evidence classification.
- Confidence and risk.
- Static reference count.
- Exact reference locations.
- Explanation of evidence.
- Recommended investigation.

## 3. Investigation priorities

{{investigation_priorities}}

## 4. Scope and limitations

- Only the selected source directory was scanned.
- The current scanner supports JavaScript `.js` files.
- Static syntax matches do not prove runtime Flagsmith evaluation.
- Dynamic references and unsupported languages may not be detected.
- A missing static reference does not prove that a flag is unused.
- Other repositories and runtime telemetry may require separate investigation.

## 5. Safety policy

No flags were changed, archived, or deleted during report generation.

All potential cleanup candidates require human investigation and approval.

**This report does not declare any flag safe to delete.**
