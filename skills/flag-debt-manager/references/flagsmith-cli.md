
# Flagsmith CLI Reference for FlagPilot AI

## Purpose

This reference documents the Flagsmith CLI operations used by FlagPilot AI.

The installed CLI's `--help` output is the authority for the user's installed version. Do not assume every CLI version exposes identical commands or options.

## Prerequisites

- Flagsmith CLI installed and available in PATH.
- User authenticated through the CLI.
- Access to the intended organisation and project.
- Node.js 20 or newer for the FlagPilot scripts.

Check the CLI installation:

```powershell
flagsmith --version
```

Check available commands:

```powershell
flagsmith --help
```

Check authentication status:

```powershell
flagsmith auth status
```

Never request that users paste access tokens or API keys into chat.

## Verified discovery command

The FlagPilot discovery script uses this read-only command:

```powershell
flagsmith feature list --organisation "<organisation>" --project "<project>" --jq '[.[] | {id, name, type, default_value, enabled}]'
```

The command lists feature flags in the selected project.

For the current FlagPilot implementation, discovery is performed through:

```powershell
npm run scan -- --organisation "<organisation>" --project "<project>"
```

Both organisation and project must be supplied explicitly. The script invokes the Flagsmith CLI, parses JSON output, validates feature records, and returns normalized flag data.

The current implementation expects each feature record to contain:

- `id`
- `name`
- `type`
- `enabled`

It also preserves `default_value` when available.

If the CLI command fails, FlagPilot must stop and report the failure. Do not silently substitute sample data.

## Report generation

### Offline sample report

```powershell
npm run report:offline
```

This uses the bundled sample fixture and sample JavaScript application. It does not query Flagsmith.

### Live report

```powershell
npm run report -- --source "<application-source-directory>" --organisation "<organisation>" --project "<project>"
```

This discovers flags from the explicitly supplied Flagsmith organisation and project, then scans the explicitly selected source directory. Both scope arguments are required.

The source directory must exist.

The current scanner supports JavaScript `.js` files only.

### Report output

```text
reports/flag-debt-report.md
```

Generated reports are local output and are excluded from Git by `.gitignore`.

## Other CLI commands

The installed CLI help also documents feature management operations.

Examples include:

```powershell
flagsmith feature list --help
flagsmith feature update --help
flagsmith environment list --help
flagsmith segment list --help
```

The installed version exposes feature update options including:

- `--description`
- `--archive`
- `--unarchive`

These operations can change Flagsmith configuration. They are not part of FlagPilot's automated discovery or reporting workflow.

Do not execute them as part of an audit.

## Version and compatibility policy

Before relying on an additional command:

1. Inspect the installed CLI version.
2. Run the command's `--help`.
3. Confirm the required options exist.
4. Test with a read-only operation where possible.
5. Update this reference and the automated tests.

Do not invent command names or flags.

## Security

- Never print or commit access tokens.
- Never include environment SDK keys in reports.
- Never store credentials in source files.
- Keep `.env`, `flagsmith.json`, and local credential files out of Git.
- Do not switch organisations or projects without user direction.

## References

Official CLI repository and documentation:

https://github.com/Flagsmith/flagsmith-cli

CLI command reference:

https://flagsmith.github.io/flagsmith-cli/
