---
summary: "CLI reference for `matryoshka logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `matryoshka logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
matryoshka logs
matryoshka logs --follow
matryoshka logs --json
matryoshka logs --limit 500
matryoshka logs --local-time
matryoshka logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
