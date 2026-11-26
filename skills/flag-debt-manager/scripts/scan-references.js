"use strict";

const fs = require("node:fs");
const path = require("node:path");
const acorn = require("acorn");

function walkJavaScriptFiles(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Source directory does not exist: ${directory}`);
  }

  const results = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkJavaScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      results.push(fullPath);
    }
  }

  return results.sort();
}

function collectStaticReferences(ast, flagName, relativeFile) {
  const references = [];

  function visit(node) {
    if (!node || typeof node !== "object") return;

    let matchType = null;

    if (node.type === "Literal" && node.value === flagName) {
      matchType = "string_literal";
    } else if (
      node.type === "TemplateLiteral" &&
      node.expressions.length === 0 &&
      node.quasis[0].value.cooked === flagName
    ) {
      matchType = "static_template_literal";
    } else if (
      node.type === "MemberExpression" &&
      node.computed === false &&
      node.property.type === "Identifier" &&
      node.property.name === flagName
    ) {
      matchType = "static_member_access";
    }

    if (matchType) {
      references.push({
        file: relativeFile,
        line: node.loc.start.line,
        column: node.loc.start.column + 1,
        matchType
      });
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "start" || key === "end") continue;

      const value = node[key];

      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child.type === "string") {
            visit(child);
          }
        }
      } else if (value && typeof value.type === "string") {
        visit(value);
      }
    }
  }

  visit(ast);
  return references;
}

function scanReferences(flags, sourceDirectory) {
  if (!Array.isArray(flags)) {
    throw new TypeError("Flags input must be an array.");
  }

  const names = new Set();

  for (const flag of flags) {
    if (!flag || typeof flag.name !== "string" || !flag.name.trim()) {
      throw new Error("Every flag must have a non-empty name.");
    }

    if (names.has(flag.name)) {
      throw new Error(`Duplicate flag name: ${flag.name}`);
    }

    names.add(flag.name);
  }

  const files = walkJavaScriptFiles(sourceDirectory);
  const results = flags.map((flag) => ({
    id: flag.id ?? null,
    name: flag.name,
    referenceCount: 0,
    status: "no_static_reference",
    references: []
  }));

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const relativeFile = path.relative(process.cwd(), file)
      .split(path.sep)
      .join("/");

    let ast;

    try {
      ast = acorn.parse(source, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true,
        allowHashBang: true
      });
    } catch (error) {
      throw new Error(
        `Cannot parse ${relativeFile}: ${error.message}`,
        { cause: error }
      );
    }

    for (const result of results) {
      const references = collectStaticReferences(
        ast,
        result.name,
        relativeFile
      );

      result.references.push(...references);
    }
  }

  for (const result of results) {
    result.referenceCount = result.references.length;

    if (result.referenceCount > 0) {
      result.status = "static_reference_found";
    }
  }

  return results;
}

function main() {
  const root = process.cwd();

  const flagsPath = path.join(
    root,
    "tests",
    "fixtures",
    "sample-flags.json"
  );

  const sourceDirectory = path.join(root, "sample-app", "src");

  const flags = JSON.parse(fs.readFileSync(flagsPath, "utf8"));
  const results = scanReferences(flags, sourceDirectory);

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Scanner error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  scanReferences,
  walkJavaScriptFiles
};