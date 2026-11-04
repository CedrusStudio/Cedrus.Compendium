---
name: cedrus-worktree
description: Prepare or reuse a dedicated Cedrus task branch in a separate worktree and open a pull request for review. Use for every versioned change, including documentation and configuration; read-only inspection needs no new worktree.
---

# Work in an isolated checkout

Read the selected repository's [working guide](../../../AGENTS.md). Every versioned change requires a dedicated non-main task branch in a separate Git worktree and a PR, including documentation, skills, configuration and generated assets. An explicitly selected checkout may be reused when it already meets those requirements. Preserve existing work; do not relocate changes or switch another task's branch implicitly. Read-only inspection and fast-forward synchronization of already accepted main require no new branch or PR.

Inspect the source checkout's changes, branch/upstream and `git worktree list --porcelain`. Reuse a suitable worktree for this task. Otherwise select a known base revision and create a `codex/<task>` branch in a separate worktree. Cataloged Cedrus repositories use `main` as their integration branch. Record whether its remote-tracking revision was refreshed; local metadata alone does not establish remote freshness. Use managed worktree tools when the client provides them, otherwise Git's normal worktree commands.

Work from the returned worktree path and read its local instructions. A new worktree does not inherit ignored configuration, dependencies or build outputs. Obtain only the task's required local prerequisites through the owner's setup procedure; do not copy secrets or build caches indiscriminately. For Godot tooling, preserve the configured probe and engine/editor configuration in the original workspace and select an explicit owner-supported diagnostics root.

Verify the changed boundary in this worktree. Commit and push only the task branch, then open a PR against the owner's integration branch. Describe the final change, actual checks, limitations and any dependencies for a reviewer who has not read the chat. Handover the PR URL, worktree path, branch, base and resulting revisions, checks and conflicts. Leave the PR pending review; implementation, commit, branch-push or PR authorization alone does not permit merging. Merge only when the user's explicit authorization covers that concrete PR/change and required review/checks are satisfied; do not request authorization again when it is already present.

For cross-repository adoption, keep consumer PRs as drafts until their exact pinned source commit is accepted and available from source main. If a squash/rebase changes its identity, prepare and review a new adoption preview against the accepted source before making consumers ready. Do not delete a candidate source branch while draft consumers still depend on it.

Keep the original checkout and other worktrees intact. Do not commit/push authored changes directly to main, force-push or reset a shared branch to make it match. Worktree removal is a separate cleanup decision after checking uncommitted/ignored files and unmerged or unpushed commits. Finishing implementation or opening a PR does not automatically authorize merging or deleting its worktree.
