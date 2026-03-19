---
summary: "CLI reference for `matryoshka uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "uninstall"
---

# `matryoshka uninstall`

Uninstall the gateway service + local data (CLI remains).

```bash
matryoshka backup create
matryoshka uninstall
matryoshka uninstall --all --yes
matryoshka uninstall --dry-run
```

Run `matryoshka backup create` first if you want a restorable snapshot before removing state or workspaces.
