---
summary: "CLI reference for `matryoshka reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `matryoshka reset`

Reset local config/state (keeps the CLI installed).

```bash
matryoshka backup create
matryoshka reset
matryoshka reset --dry-run
matryoshka reset --scope config+creds+sessions --yes --non-interactive
```

Run `matryoshka backup create` first if you want a restorable snapshot before removing local state.
