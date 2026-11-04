---
name: cedrus-worktree
description: Prepare or reuse an isolated Git worktree for a Cedrus implementation task, and hand it over for integration. Use when starting changes or arranging parallel work; read-only inspection needs no new worktree.
---

# Work in an isolated checkout

Read the selected repository's [working guide](../../../AGENTS.md). Prefer a separate task worktree for new implementation. Preserve an explicitly selected checkout and work already in progress; do not relocate changes or switch another task's branch implicitly.

Inspect the source checkout's changes, branch/upstream and `git worktree list --porcelain`. Reuse a suitable worktree for this task. Otherwise select a known base revision and create a `codex/<task>` branch in a separate worktree. Cataloged Cedrus repositories use `main` as their integration branch. Record whether its remote-tracking revision was refreshed; local metadata alone does not establish remote freshness. Use managed worktree tools when the client provides them, otherwise Git's normal worktree commands.

Work from the returned worktree path and read its local instructions. A new worktree does not inherit ignored configuration, dependencies or build outputs. Obtain only the task's required local prerequisites through the owner's setup procedure; do not copy secrets or build caches indiscriminately. For Godot tooling, preserve the configured probe and engine/editor configuration in the original workspace and select an explicit owner-supported diagnostics root.

Verify the changed boundary in this worktree. Handover its path, branch, base and resulting revisions, checks and any integration conflicts. Keep the original checkout and other worktrees intact. Integration must preserve concurrent changes; do not force-push or reset a shared branch to make it match. Worktree removal is a separate cleanup decision after checking uncommitted/ignored files and unmerged or unpushed commits. Finishing a task does not automatically authorize deleting its worktree.
