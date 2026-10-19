# Project workflow

After each completed change or coherent milestone, follow [the commit-and-push skill](skills/commit-and-push/SKILL.md). Validate the work, commit it with a meaningful message, and push the current branch to its configured GitHub remote before reporting completion. This is the user's standing authorization; do not ask for conversational confirmation each time. Native sandbox/credential approvals still apply.

Do not commit every individual file write or intermediate broken state. Preserve unrelated user changes. If validation, authentication, or pushing is blocked, report the precise blocker and whether a local commit exists; do not claim the work was pushed.

This site runs on GitHub Pages. Keep runtime assets static and use relative paths. Run `npm test` when Node.js is available; otherwise perform available checks and clearly report the verification limit.
