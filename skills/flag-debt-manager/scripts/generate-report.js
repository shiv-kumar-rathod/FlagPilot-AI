"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { scanReferences } = require("./scan-references");
const { classifyFlags } = require("./classify-risks");
const { discoverFlags } = require("./discover-flags");

function generateMarkdownReport(results, generatedAt = new Date(), metadata = {}) {
  if (!Array.isArray(results)) {
    throw new TypeError("Report results must be an array.");
  }

  const counts = {
    static_reference_detected: 0,
    review_candidate: 0,
    insufficient_evidence: 0
  };

  for (const result of results) {
    if (!result || !Object.hasOwn(counts, result.classification)) {
      throw new Error("Report contains an invalid classification.");
    }

    if (!Array.isArray(result.references)) {
      throw new Error(`Invalid references for flag: ${result.name}`);
    }

    counts[result.classification]++;
  }

  const dataSource = metadata.dataSource || "Unspecified";
  const project = metadata.project || "Not specified";
  const organisation = metadata.organisation || "Not specified";
  const sourceDirectory = metadata.sourceDirectory || "Not specified";

  const lines = [
    "# FlagPilot AI - Feature Flag Debt Report",
    "",
    `**Generated:** ${generatedAt.toISOString()}`,
    `**Data source:** ${dataSource}`,
    `**Organisation:** ${organisation}`,
    `**Project:** ${project}`,
    `**Source directory scanned:** ${sourceDirectory}`,
    `**Flags inspected:** ${results.length}`,
    "",
    "## Summary",
    "",
    "| Classification | Count |",
    "|---|---:|",
    `| Static reference detected (not proof of runtime use) | ${counts.static_reference_detected} |`,
    `| Review candidates | ${counts.review_candidate} |`,
    `| Insufficient evidence | ${counts.insufficient_evidence} |`,
    "",
    "## Findings",
    ""
  ];

  for (const result of results) {
    lines.push(
      `### ${result.name}`,
      "",
      `- **Classification:** ${result.classification}`,
      `- **Enabled:** ${result.enabled === null ? "Unknown" : result.enabled}`,
      `- **Confidence:** ${result.confidence}`,
      `- **Risk:** ${result.risk}`,
      `- **Static references:** ${result.referenceCount === null ? "Unknown" : result.referenceCount}`,
      "",
      `**Evidence:** ${result.explanation}`,
      "",
      `**Recommended action:** ${result.recommendedAction}`,
      "",
      "**Reference locations:**"
    );

    if (result.references.length === 0) {
      lines.push("- No static references detected.");
    } else {
      for (const reference of result.references) {
        const column = Number.isInteger(reference.column)
          ? `:${reference.column}`
          : "";

        const matchType = reference.matchType
          ? ` - ${reference.matchType}`
          : "";

        lines.push(
          `- \`${reference.file}:${reference.line}${column}\`${matchType}`
        );
      }
    }

    lines.push("");
  }

  lines.push(
    "## Scope and limitations",
    "",
    "- This report reflects only the source files included in this scan.",
    "- The scanner currently parses JavaScript files (.js) only.",
    "- Static syntax matches may include string literals or property accesses that are not actual runtime Flagsmith evaluations.",
    "- Dynamic flag names, imported constants, aliases, runtime evaluation, other repositories, generated code, and references in unsupported languages may not be detected.",
    "- A missing static reference does not prove that a flag is unused.",
    "- A static reference does not prove that a code path executes at runtime.",
    "- Enabled state alone does not establish whether a flag is safe to remove.",
    "",
    "## Safety policy",
    "",
    "**No flags were changed, archived, or deleted by generating this report.**",
    "",
    "Static matches and review candidates require human investigation before cleanup. Verify runtime usage, all relevant repositories, environments, identities, segments, and dynamic references before making a change.",
    "",
    "**This report does not declare any flag safe to delete.**",
    ""
  );

  return lines.join("\n");
}

function main(args = process.argv.slice(2), dependencies = {}) {
  const root = process.cwd();
  const discover = dependencies.discoverFlags || discoverFlags;

  let offline = false;
  let live = false;
  let sourceArgument = null;
  let organisation = null;
  let project = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--offline") {
      if (offline) throw new Error("--offline was supplied more than once.");
      offline = true;
    } else if (arg === "--live") {
      if (live) throw new Error("--live was supplied more than once.");
      live = true;
    } else if (
      arg === "--source" ||
      arg === "--organisation" ||
      arg === "--project"
    ) {
      const value = args[index + 1];

      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value.`);
      }

      if (arg === "--source") {
        if (sourceArgument !== null) throw new Error("--source was supplied more than once.");
        sourceArgument = value;
      } else if (arg === "--organisation") {
        if (organisation !== null) throw new Error("--organisation was supplied more than once.");
        organisation = value;
      } else {
        if (project !== null) throw new Error("--project was supplied more than once.");
        project = value;
      }

      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (offline && live) {
    throw new Error("Choose either --offline or --live, not both.");
  }

  if (offline && sourceArgument) {
    throw new Error("--source is only supported in live mode.");
  }

  if (offline && (organisation !== null || project !== null)) {
    throw new Error("--organisation and --project are only supported in live mode.");
  }

  if (!offline && !sourceArgument) {
    throw new Error(
      'Live mode requires a source directory. Example: npm run report -- --source "C:\\path\\to\\your\\app" --organisation "Your Organisation" --project "Your Project"'
    );
  }

  if (!offline && (!organisation || !organisation.trim() || !project || !project.trim())) {
    throw new Error(
      'Live mode requires non-empty --organisation and --project values. Example: npm run report -- --source "C:\\path\\to\\your\\app" --organisation "Your Organisation" --project "Your Project"'
    );
  }

  const sampleSourceDirectory = path.join(root, "sample-app", "src");

  const sourceDirectory = offline
    ? sampleSourceDirectory
    : path.resolve(root, sourceArgument);

  if (!fs.existsSync(sourceDirectory) || !fs.statSync(sourceDirectory).isDirectory()) {
    throw new Error(`Source directory does not exist or is not a directory: ${sourceDirectory}`);
  }

  const flags = offline
    ? JSON.parse(
        fs.readFileSync(
          path.join(root, "tests", "fixtures", "sample-flags.json"),
          "utf8"
        )
      )
    : discover({
        organisation: organisation.trim(),
        project: project.trim()
      });

  const scanResults = scanReferences(flags, sourceDirectory);
  const classifications = classifyFlags(flags, scanResults);

  const metadata = {
    dataSource: offline
      ? "Local sample fixture (offline)"
      : "Flagsmith CLI (live read-only discovery)",
    organisation: offline ? "Sample organisation" : organisation.trim(),
    project: offline ? "Sample project" : project.trim(),
    sourceDirectory: path.relative(root, sourceDirectory) || "."
  };

  const report = generateMarkdownReport(classifications, new Date(), metadata);

  const outputDirectory = path.join(root, "reports");
  const outputPath = path.join(outputDirectory, "flag-debt-report.md");

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(outputPath, report, "utf8");

  console.log("FlagPilot AI report generated successfully.");
  console.log(`Mode: ${offline ? "Offline sample" : "Live Flagsmith"}`);
  console.log(`Organisation: ${metadata.organisation}`);
  console.log(`Project: ${metadata.project}`);
  console.log(`Source directory: ${metadata.sourceDirectory}`);
  console.log(`Flags inspected: ${flags.length}`);
  console.log(`Report: ${path.relative(root, outputPath)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Report generation error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { generateMarkdownReport, main };
