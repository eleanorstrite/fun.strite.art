---
name: commit-and-push
description: Commit and push completed code or repository changes with meaningful messages. Apply after each completed implementation, fix, or coherent milestone in a Git repository under the user's standing preference. Do not create empty commits for read-only tasks.
---

# Commit and push completed work

The user wants completed repository changes committed and pushed to GitHub automatically. Treat this as standing authorization for ordinary commits and pushes to the existing configured remote and current branch. Honor any later instruction to keep work local or skip a push. Native execution approvals and authentication requirements still apply.

1. Inspect the branch, working tree, diff, and configured remote. Identify task-related files and preserve unrelated user edits. Never stage secrets or generated local files.
2. Run checks appropriate to the changes and inspect `git diff --check`. Resolve failures caused by the work before committing. If a tool is unavailable, run suitable available checks and report the limitation honestly.
3. Stage the intended files explicitly and inspect the staged diff. Make a meaningful commit describing the resulting behavior, such as `Add knight maze with timed sword power-ups`. Commit at completed change boundaries, not on each file write. Do not create an empty commit if nothing changed.
4. Push the current branch to its existing upstream. If it has no upstream, use its existing GitHub remote and set upstream for that branch. Do not invent a repository, change remotes, force-push, amend published commits, or discard work.
5. Confirm the push succeeded. If rejected because the remote advanced, fetch and inspect the divergence; integrate without rewriting shared history when straightforward, rerun relevant checks, and retry. Stop and report if conflicts or credentials require user intervention. Do not repeatedly retry an unchanged failure.
6. In the final response, state the resulting change and whether it was pushed, including the short commit hash. If blocked, distinguish local changes, local commits, and remote state.

Keep related work in a cohesive commit when appropriate. This skill does not authorize unrelated deployments, repository creation, or changes to account settings. Existing repository CI may run as a consequence of a push.
