---
summary: "CLI reference for `matryoshka config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `matryoshka config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `matryoshka configure`).

## Examples

```bash
matryoshka config file
matryoshka config get browser.executablePath
matryoshka config set browser.executablePath "/usr/bin/google-chrome"
matryoshka config set agents.defaults.heartbeat.every "2h"
matryoshka config set agents.list[0].tools.exec.node "node-id-or-name"
matryoshka config unset tools.web.search.apiKey
matryoshka config validate
matryoshka config validate --json
```

## Paths

Paths use dot or bracket notation:

```bash
matryoshka config get agents.defaults.workspace
matryoshka config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
matryoshka config get agents.list
matryoshka config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
matryoshka config set agents.defaults.heartbeat.every "0m"
matryoshka config set gateway.port 19001 --strict-json
matryoshka config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `OPENCLAW_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
matryoshka config validate
matryoshka config validate --json
```
