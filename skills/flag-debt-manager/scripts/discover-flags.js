"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CLI_TIMEOUT_MS = 15000;
const MAX_BUFFER_BYTES = 1024 * 1024;

function resolveCliEntry() {
  const appData = process.env.APPDATA;

  if (!appData) {
    throw new Error("Cannot resolve npm global directory: APPDATA is unavailable.");
  }

  return path.join(
    appData,
    "npm",
    "node_modules",
    "@flagsmith",
    "cli",
    "index.js"
  );
}

function validateFlags(data) {
  if (!Array.isArray(data)) {
    throw new Error("Flagsmith CLI response must be a JSON array.");
  }

  const seenNames = new Set();

  return data.map((flag) => {
    if (
      !flag ||
      !Number.isInteger(flag.id) ||
      typeof flag.name !== "string" ||
      !flag.name.trim() ||
      typeof flag.type !== "string" ||
      typeof flag.enabled !== "boolean"
    ) {
      throw new Error("Flagsmith returned a feature with an invalid structure.");
    }

    if (seenNames.has(flag.name)) {
      throw new Error(`Flagsmith returned a duplicate feature name: ${flag.name}`);
    }

    seenNames.add(flag.name);

    return {
      id: flag.id,
      name: flag.name,
      type: flag.type,
      default_value: flag.default_value ?? null,
      enabled: flag.enabled
    };
  });
}

function parseCliArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument !== "--organisation" && argument !== "--project") {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const key = argument.slice(2);

    if (Object.hasOwn(options, key)) {
      throw new Error(`Argument supplied more than once: ${argument}`);
    }

    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }

    options[key] = value;
    index += 1;
  }

  if (!options.organisation || !options.project) {
    throw new Error(
      'Both --organisation and --project are required. Example: npm run scan -- --organisation "Your Organisation" --project "Your Project"'
    );
  }

  return options;
}

function discoverFlags(options = {}) {
  const { organisation, project } = options;
  const executable = options.executable || process.execPath;
  const cliEntry = options.cliEntry || resolveCliEntry();
  const runCommand = options.execFileSync || execFileSync;

  if (
    typeof organisation !== "string" ||
    !organisation.trim() ||
    typeof project !== "string" ||
    !project.trim()
  ) {
    throw new Error("Organisation and project must be non-empty strings.");
  }

  if (!fs.existsSync(cliEntry)) {
    throw new Error("Flagsmith CLI JavaScript entry point was not found.");
  }

  let stdout;

  try {
    stdout = runCommand(
      executable,
      [
        cliEntry,
        "feature",
        "list",
        "--organisation",
        organisation.trim(),
        "--project",
        project.trim(),
        "--json"
      ],
      {
        encoding: "utf8",
        timeout: CLI_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER_BYTES,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
  } catch {
    throw new Error(
      "Flagsmith CLI command failed. Check authentication, project access, and CLI installation."
    );
  }

  let parsed;

  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error("Flagsmith CLI did not return valid JSON.");
  }

  return validateFlags(parsed);
}

if (require.main === module) {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    const flags = discoverFlags(options);

    console.log(JSON.stringify(flags, null, 2));
    console.log(`\nDiscovered ${flags.length} feature flag(s).`);
  } catch (error) {
    console.error(`Flag discovery error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  discoverFlags,
  validateFlags,
  resolveCliEntry,
  parseCliArgs
};
