"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  discoverFlags,
  validateFlags,
  resolveCliEntry
} = require("../skills/flag-debt-manager/scripts/discover-flags");

const sampleFlags = [
  {
    id: 305177,
    name: "show_demo_button",
    type: "multivariate",
    default_value: "control",
    enabled: false
  }
];

test("validates and normalizes Flagsmith feature data", () => {
  assert.deepEqual(validateFlags(sampleFlags), sampleFlags);
});

test("rejects a non-array Flagsmith response", () => {
  assert.throws(
    () => validateFlags({ name: "checkout_v2" }),
    /must be a JSON array/
  );
});

test("rejects malformed feature records", () => {
  assert.throws(
    () => validateFlags([{ id: 1, name: "checkout_v2" }]),
    /invalid structure/
  );
});

test("rejects duplicate feature names", () => {
  assert.throws(
    () => validateFlags([
      ...sampleFlags,
      { ...sampleFlags[0], id: 305178 }
    ]),
    /duplicate feature name/
  );
});

test("resolves the CLI entry point from APPDATA", () => {
  const original = process.env.APPDATA;

  try {
    process.env.APPDATA = "C:\\TestUser\\AppData\\Roaming";

    assert.match(
      resolveCliEntry(),
      /TestUser.*npm.*node_modules.*@flagsmith.*cli.*index\.js/
    );
  } finally {
    if (original === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = original;
    }
  }
});

test("discovers flags using only the read-only feature list command", () => {
  let receivedArguments;

  const result = discoverFlags({
    cliEntry: __filename,
    executable: "test-node",
    organisation: "Test Org",
    project: "Test Project",
    execFileSync: (executable, args, options) => {
      receivedArguments = { executable, args, options };
      return JSON.stringify(sampleFlags);
    }
  });

  assert.deepEqual(result, sampleFlags);
  assert.equal(receivedArguments.executable, "test-node");

  assert.deepEqual(receivedArguments.args, [
    __filename,
    "feature",
    "list",
    "--organisation",
    "Test Org",
    "--project",
    "Test Project",
    "--json"
  ]);

  assert.equal(receivedArguments.options.shell, undefined);
});

test("rejects invalid JSON from the CLI", () => {
  assert.throws(
    () => discoverFlags({
      cliEntry: __filename,
      execFileSync: () => "not-json"
    }),
    /valid JSON/
  );
});

test("reports CLI execution failures without exposing command output", () => {
  assert.throws(
    () => discoverFlags({
      cliEntry: __filename,
      execFileSync: () => {
        throw new Error("sensitive diagnostic detail");
      }
    }),
    (error) => {
      assert.match(error.message, /CLI command failed/);
      assert.doesNotMatch(error.message, /sensitive diagnostic detail/);
      return true;
    }
  );
});