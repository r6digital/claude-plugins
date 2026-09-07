# qa-loop

Three commands that keep the builder and the reviewer apart.

One session writes the code. A different session reviews it. The reviewer has
no memory of the build, so it cannot agree with its own earlier decisions.

## Commands

| Command | Purpose |
| --- | --- |
| `/qa-loop:build-kickoff [plan-path]` | Implement a plan, test it, open a pull request. Defaults to `docs/plan.md`. |
| `/qa-loop:qa-pass <branch>` | Review a branch against its spec. Post findings. Change nothing. |
| `/qa-loop:merge-ready [branch]` | Confirm the review and the tests passed. Remove the spec and the plan. Defaults to the current branch. |

Claude Code puts every plugin command behind the plugin name. The short forms
`/build-kickoff`, `/qa-pass`, and `/merge-ready` do not work.

Run them in that order. `merge-ready` must run after `qa-pass`, because the
reviewer reads the files that `merge-ready` removes.

## Where the spec and the plan live

A cloud session reads only the repository clone. So the spec and the plan must
be committed to the feature branch. A cloud builder cannot read a file that git
does not track.

The trunk is different. It does not need them, and they collect there.

`merge-ready` solves both. It removes the two files in the last commit on the
branch, after the reviewer has used them. Merge the pull request with squash:
the files are added and removed inside the branch, so the squashed commit holds
neither, and the trunk never receives them. A merge commit also keeps the trunk
tree clean, but every branch commit goes on the trunk, so the files stay in the
log.

Both files stay in the branch history and in the pull request. You lose nothing.

## What each command needs

`build-kickoff` needs:

- A plan file in the repository.
- The `gh` command, authenticated, to push the branch and open the pull request.

`qa-pass` needs:

- A branch that exists on the remote.
- The `gh` command, authenticated, to post review comments.
- `docs/spec.md` and `docs/plan.md`, or a pull request description that gives
  the intent.

`merge-ready` needs:

- An open pull request for the branch.
- A completed review from `qa-pass`.
- The `gh` command, authenticated, to read the pull request and its comments.

`build-kickoff` and `qa-pass` call `/agent-skills:build`, `/agent-skills:test`,
and `/agent-skills:review`. Enable the `agent-skills` plugin as well.

## Severity ratings

`qa-pass` marks each finding with one of these:

| Severity | Meaning |
| --- | --- |
| `blocker` | Do not merge. The code is incorrect, unsafe, or loses data. |
| `major` | Merge only after a fix. The code does not agree with the spec. |
| `minor` | Fix soon. The code is correct but is difficult to keep. |
| `nit` | Optional. Style or wording. |

`merge-ready` stops if a `blocker` or a `major` finding is still open.
