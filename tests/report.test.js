
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  generateMarkdownReport,
  main
} = require("../skills/flag-debt-manager/scripts/generate-report");

const sampleResults = [
  {
    name: "checkout_v2",
    enabled: true,
    classification: "static_reference_detected",
    confidence: "low",
    risk: "review",
    referenceCount: 1,
    references: [{ file: "src/checkout.js", line: 2 }],
    explanation: "Static syntax matches were detected, but runtime use is unproven.",
    recommendedAction: "Investigate before considering cleanup."
  },
  {
    name: "legacy_banner",
    enabled: false,
    classification: "review_candidate",
    confidence: "low",
    risk: "review",
    referenceCount: 0,
    references: [],
    explanation: "No static reference was found.",
    recommendedAction: "Investigate before cleanup."
  },
  {
    name: "unknown_flag",
    enabled: null,
    classification: "insufficient_evidence",
    confidence: "none",
    risk: "unknown",
    referenceCount: null,
    references: [],
    explanation: "No scanner result is available.",
    recommendedAction: "Run the source scanner."
  }
];

test("report includes correct summary counts", () => {
  const report = generateMarkdownReport(
    sampleResults,
    new Date("2026-11-26T10:00:00.000Z")
  );

  assert.match(report, /\*\*Flags inspected:\*\* 3/);
  assert.match(report, /Static reference detected.*\| 1 \|/);
  assert.match(report, /Review candidates \| 1 \|/);
  assert.match(report, /Insufficient evidence \| 1 \|/);
});

test("report includes source reference locations", () => {
  const report = generateMarkdownReport(sampleResults);

  assert.match(report, /src\/checkout\.js:2/);
});

test("report explains that static matches do not prove runtime use", () => {
  const report = generateMarkdownReport(sampleResults);

  assert.match(report, /not proof of runtime use/);
  assert.match(report, /runtime Flagsmith evaluations/);
  assert.match(report, /does not prove that a code path executes at runtime/);
});

test("report includes limitations and safety wording", () => {
  const report = generateMarkdownReport(sampleResults);

  assert.match(report, /A missing static reference does not prove that a flag is unused/);
  assert.match(report, /No flags were changed, archived, or deleted/);
  assert.match(report, /human investigation before cleanup/);
  assert.match(report, /does not declare any flag safe to delete/);
});

test("report rejects invalid input", () => {
  assert.throws(
    () => generateMarkdownReport("invalid"),
    /Report results must be an array/
  );
});

test("report rejects unknown classifications", () => {
  assert.throws(
    () => generateMarkdownReport([{ classification: "safe_to_delete" }]),
    /invalid classification/
  );
});

test("live mode rejects a missing source directory", () => {
  assert.throws(
    () => main(["--live"]),
    /Live mode requires a source directory/
  );
});

test("live mode rejects a nonexistent source directory", () => {
  assert.throws(
    () => main(["--live", "--source", "this-directory-does-not-exist"]),
    /Source directory does not exist/
  );
});

test("offline mode rejects the source argument", () => {
  assert.throws(
    () => main(["--offline", "--source", "sample-app/src"]),
    /--source is only supported in live mode/
  );
});

test("report rejects conflicting offline and live modes", () => {
  assert.throws(
    () => main(["--offline", "--live"]),
    /Choose either --offline or --live/
  );
});

test("report rejects unknown command-line arguments", () => {
  assert.throws(
    () => main(["--unexpected"]),
    /Unknown argument/
  );
});
