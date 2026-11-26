
# FlagPilot AI — Safety and Risk Policy

## 1. Purpose

This policy defines how FlagPilot AI interprets feature-flag evidence and handles cleanup recommendations.

The objective is to reduce feature-flag debt without causing accidental feature removal, production incidents, or loss of configuration.

## 2. Evidence classifications

FlagPilot currently supports three classifications.

### static_reference_detected

Meaning:

- One or more static syntax matches were found in the selected source directory.
- The scanner recorded the matching file and location.

Interpretation:

- This is evidence of a static syntax match.
- It is not proof of a Flagsmith SDK evaluation.
- It is not proof that the code path executes at runtime.
- It is not proof that the feature is actively used.

Recommended action:

- Inspect every match.
- Verify the actual SDK evaluation.
- Check runtime usage and other repositories before proposing cleanup.

Confidence: low.

Risk: review.

### review_candidate

Meaning:

- No static reference was detected in the scanned source directory.

Interpretation:

- The flag may still be used through dynamic names, imported constants, other repositories, runtime-generated code, or unsupported languages.
- The scan may not cover every relevant application.

Recommended action:

- Investigate all relevant source repositories.
- Check runtime evaluation and telemetry.
- Review environment configuration and overrides.
- Do not archive or delete based on this result.

Confidence: low.

Risk: review.

### insufficient_evidence

Meaning:

- The scanner did not provide enough evidence to classify the flag.

Interpretation:

- The flag's usage status is unknown.
- Missing evidence must not be treated as evidence of non-use.

Recommended action:

- Obtain valid scanner evidence.
- Expand the audit scope.
- Re-run the audit when the source is available.

Confidence: none.

Risk: unknown.

## 3. Evidence limitations

The current scanner:

- Parses JavaScript `.js` files.
- Searches nested directories.
- Detects exact static strings, static template literals, and property-name matches.
- Records matching file paths and source locations.

It does not currently establish:

- Actual Flagsmith SDK evaluation.
- Runtime execution.
- Runtime flag evaluation frequency.
- Complete repository coverage.
- Dynamic or indirect flag usage.
- Usage in unsupported programming languages.
- Whether a feature is still required by the product.

All reports must communicate these limitations.

## 4. Additional investigation checklist

Before considering a flag for cleanup, investigate:

1. All relevant repositories.
2. Direct and indirect source references.
3. Dynamic flag names and imported constants.
4. Runtime evaluation and telemetry.
5. Development, staging, and production environments.
6. Segment and identity overrides.
7. Deployment configuration and release workflows.
8. Dependencies and integrations.
9. Product and operational ownership.
10. Rollback and recovery requirements.

A candidate remains unresolved if important evidence is missing.

## 5. Approval requirements

FlagPilot's current discovery and reporting workflow is read-only.

The following actions require explicit human approval:

- Enable or disable a feature flag.
- Change a flag's value.
- Modify environment configuration.
- Change segment or identity overrides.
- Archive a feature flag.
- Delete a feature flag.
- Modify production settings.

Before any such action, present:

- Exact organisation and project.
- Exact flag name and identifier.
- Target environment.
- Proposed operation.
- Evidence and uncertainty.
- Expected impact.
- Rollback procedure.

No action is authorized by a generated report alone.

## 6. Prohibited conclusions

FlagPilot must never claim:

- A flag is unused solely because no static reference was found.
- A disabled flag is automatically obsolete.
- A static match proves runtime usage.
- A flag is safe to delete based only on the current scanner.
- All repositories have been inspected when only one directory was scanned.

## 7. Safety invariants

- Discovery is read-only.
- Reporting is read-only.
- Credentials must never be exposed.
- Live and offline data must remain distinguishable.
- The selected source directory must be recorded.
- Missing evidence must remain unknown.
- Destructive operations must never happen automatically.
- Production changes require explicit human approval.

## 8. Final decision principle

A feature flag becomes a cleanup proposal only after sufficient investigation and human review.

A report is evidence for a decision, not the decision itself.
