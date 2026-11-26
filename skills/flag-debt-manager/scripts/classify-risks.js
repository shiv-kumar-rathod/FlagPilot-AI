"use strict";

function classifyFlags(flags, scanResults) {
  if (!Array.isArray(flags)) {
    throw new TypeError("Flags input must be an array.");
  }

  if (!Array.isArray(scanResults)) {
    throw new TypeError("Scan results must be an array.");
  }

  const resultsByName = new Map();

  for (const result of scanResults) {
    if (!result || typeof result.name !== "string") {
      throw new Error("Every scan result must have a valid flag name.");
    }

    if (resultsByName.has(result.name)) {
      throw new Error(`Duplicate scan result for flag: ${result.name}`);
    }

    resultsByName.set(result.name, result);
  }

  return flags.map((flag) => {
    if (!flag || typeof flag.name !== "string" || !flag.name.trim()) {
      throw new Error("Every flag must have a non-empty name.");
    }

    const evidence = resultsByName.get(flag.name);

    if (!evidence) {
      return {
        id: flag.id ?? null,
        name: flag.name,
        enabled: flag.enabled ?? null,
        classification: "insufficient_evidence",
        confidence: "none",
        risk: "unknown",
        referenceCount: null,
        references: [],
        explanation: "No scanner result is available for this flag.",
        recommendedAction: "Run the source scanner before assessing this flag."
      };
    }

    if (
      !Number.isInteger(evidence.referenceCount) ||
      evidence.referenceCount < 0 ||
      !Array.isArray(evidence.references) ||
      evidence.references.length !== evidence.referenceCount
    ) {
      throw new Error(`Invalid scanner evidence for flag: ${flag.name}`);
    }

    if (evidence.referenceCount > 0) {
      return {
        id: flag.id ?? null,
        name: flag.name,
        enabled: flag.enabled ?? null,
        classification: "static_reference_detected",
        confidence: "low",
        risk: "review",
        referenceCount: evidence.referenceCount,
        references: evidence.references,
        explanation:
          "Exact static syntax matches were detected. These matches do not prove that the flag is evaluated or used at runtime.",
        recommendedAction:
          "Inspect each match and verify runtime usage, SDK evaluation context, and all relevant repositories before considering cleanup."
      };
    }

    return {
      id: flag.id ?? null,
      name: flag.name,
      enabled: flag.enabled ?? null,
      classification: "review_candidate",
      confidence: "low",
      risk: "review",
      referenceCount: 0,
      references: [],
      explanation:
        "No static reference was found in the scanned source files. Dynamic usage, other repositories, and runtime evaluation have not been checked.",
      recommendedAction:
        "Investigate runtime usage, other repositories, dynamic references, and environment-specific configuration before considering cleanup."
    };
  });
}

module.exports = { classifyFlags };