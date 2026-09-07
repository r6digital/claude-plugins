# qa-loop

Two session openers that keep the builder and the reviewer apart.

One session writes the code. A different session reviews it. The reviewer has
no memory of the build, so it cannot agree with its own earlier decisions.

## Commands

| Command | Purpose |
| --- | --- |
| `/qa-loop:build-kickoff [plan-path]` | Implement a plan, test it, open a pull request. Defaults to `docs/plan.md`. |
| `/qa-loop:qa-pass <branch>` | Review a branch against its spec. Post findings. Change nothing. |

Claude Code puts every plugin command behind the plugin name. The short forms
`/build-kickoff` and `/qa-pass` do not work.

## What each command needs

`build-kickoff` needs:

- A plan file in the repository.
- The `gh` command, authenticated, to push the branch and open the pull request.

`qa-pass` needs:

- A branch that exists on the remote.
- The `gh` command, authenticated, to post review comments.
- `docs/spec.md` and `docs/plan.md`, or a pull request description that gives
  the intent.

Both commands call `/agent-skills:build`, `/agent-skills:test`, and
`/agent-skills:review`. Enable the `agent-skills` plugin as well.

## Severity ratings

`qa-pass` marks each finding with one of these:

| Severity | Meaning |
| --- | --- |
| `blocker` | Do not merge. The code is incorrect, unsafe, or loses data. |
| `major` | Merge only after a fix. The code does not agree with the spec. |
| `minor` | Fix soon. The code is correct but is difficult to keep. |
| `nit` | Optional. Style or wording. |
