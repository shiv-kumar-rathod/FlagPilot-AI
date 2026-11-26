"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  scanReferences
} = require("../skills/flag-debt-manager/scripts/scan-references");

function createTempSource(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "flagpilot-test-"));

  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(root, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  }

  return root;
}

test("scanner finds exact string literals and ignores comments", () => {
  const root = createTempSource({
    "src/app.js": [
      "// checkout_v2",
      '/* flags.isEnabled("checkout_v2") */',
      'if (flags.isEnabled("checkout_v2")) {}'
    ].join("\n")
  });

  try {
    const results = scanReferences(
      [{ name: "checkout_v2" }],
      root
    );

    assert.equal(results[0].referenceCount, 1);
    assert.equal(results[0].references[0].line, 3);
    assert.equal(results[0].references[0].matchType, "string_literal");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner finds static template literals", () => {
  const root = createTempSource({
    "src/app.js": 'flags.isEnabled(`checkout_v2`);'
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 1);
    assert.equal(
      results[0].references[0].matchType,
      "static_template_literal"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner finds static member access", () => {
  const root = createTempSource({
    "src/app.js": "if (flags.checkout_v2) {}"
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 1);
    assert.equal(
      results[0].references[0].matchType,
      "static_member_access"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner finds computed string properties", () => {
  const root = createTempSource({
    "src/app.js": 'if (flags["checkout_v2"]) {}'
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 1);
    assert.equal(
      results[0].references[0].matchType,
      "string_literal"
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner ignores dynamic template literals", () => {
  const root = createTempSource({
    "src/app.js": 'flags.isEnabled(`checkout_${version}`);'
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 0);
    assert.equal(results[0].status, "no_static_reference");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner does not match partial flag names", () => {
  const root = createTempSource({
    "src/app.js": 'flags.isEnabled("checkout_v2_old");'
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner searches nested JavaScript directories", () => {
  const root = createTempSource({
    "src/components/checkout.js": 'useFlag("checkout_v2");'
  });

  try {
    const results = scanReferences([{ name: "checkout_v2" }], root);

    assert.equal(results[0].referenceCount, 1);
    assert.match(results[0].references[0].file, /checkout\.js$/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner rejects invalid JavaScript with a useful error", () => {
  const root = createTempSource({
    "src/broken.js": "function broken( {"
  });

  try {
    assert.throws(
      () => scanReferences([{ name: "checkout_v2" }], root),
      /Cannot parse/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("scanner rejects a missing source directory", () => {
  assert.throws(
    () => scanReferences([{ name: "checkout_v2" }], "missing-source-folder"),
    /Source directory does not exist/
  );
});

test("scanner rejects invalid flag input", () => {
  assert.throws(
    () => scanReferences("not-an-array", "sample-app/src"),
    /Flags input must be an array/
  );
});

test("scanner rejects duplicate flag names", () => {
  assert.throws(
    () => scanReferences(
      [{ name: "checkout_v2" }, { name: "checkout_v2" }],
      "sample-app/src"
    ),
    /Duplicate flag name/
  );
});