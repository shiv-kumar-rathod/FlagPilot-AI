"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  classifyFlags
} = require("../skills/flag-debt-manager/scripts/classify-risks");

test("classifies static matches as evidence, not proof of runtime use", () => {
  const flags = [{ id: 1, name: "checkout_v2", enabled: true }];
  const scans = [{
    name: "checkout_v2",
    referenceCount: 1,
    references: [{ file: "src/checkout.js", line: 4 }]
  }];

  const results = classifyFlags(flags, scans);

  assert.equal(results[0].classification, "static_reference_detected");
  assert.equal(results[0].confidence, "low");
  assert.equal(results[0].risk, "review");
  assert.equal(results[0].referenceCount, 1);
  assert.match(results[0].explanation, /do not prove/);
  assert.match(results[0].recommendedAction, /before considering cleanup/);
});

test("classifies zero-reference flags as review candidates", () => {
  const flags = [{ id: 2, name: "legacy_banner", enabled: false }];
  const scans = [{
    name: "legacy_banner",
    referenceCount: 0,
    references: []
  }];

  const results = classifyFlags(flags, scans);

  assert.equal(results[0].classification, "review_candidate");
  assert.equal(results[0].confidence, "low");
  assert.equal(results[0].risk, "review");
  assert.match(results[0].explanation, /Dynamic usage/);
  assert.match(results[0].recommendedAction, /before considering cleanup/);
});

test("missing scanner evidence is insufficient, not stale", () => {
  const flags = [{ id: 3, name: "unknown_flag", enabled: true }];

  const results = classifyFlags(flags, []);

  assert.equal(results[0].classification, "insufficient_evidence");
  assert.equal(results[0].confidence, "none");
  assert.equal(results[0].risk, "unknown");
  assert.equal(results[0].referenceCount, null);
});

test("rejects duplicate scanner results", () => {
  const flags = [{ name: "checkout_v2" }];
  const scans = [
    { name: "checkout_v2", referenceCount: 1, references: [{}] },
    { name: "checkout_v2", referenceCount: 0, references: [] }
  ];

  assert.throws(
    () => classifyFlags(flags, scans),
    /Duplicate scan result/
  );
});

test("rejects invalid scanner evidence", () => {
  const flags = [{ name: "checkout_v2" }];
  const scans = [{
    name: "checkout_v2",
    referenceCount: -1,
    references: []
  }];

  assert.throws(
    () => classifyFlags(flags, scans),
    /Invalid scanner evidence/
  );
});

test("rejects mismatched reference counts", () => {
  const flags = [{ name: "checkout_v2" }];
  const scans = [{
    name: "checkout_v2",
    referenceCount: 2,
    references: [{}]
  }];

  assert.throws(
    () => classifyFlags(flags, scans),
    /Invalid scanner evidence/
  );
});

test("rejects invalid flag input", () => {
  assert.throws(
    () => classifyFlags("not-an-array", []),
    /Flags input must be an array/
  );
});

test("rejects flags with empty names", () => {
  assert.throws(
    () => classifyFlags([{ name: " " }], []),
    /non-empty name/
  );
});