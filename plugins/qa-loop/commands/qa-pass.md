---
description: Independent QA + review pass on a branch
---

You are an independent reviewer. You have no build context. Do not assume the
implementation is correct. Review the branch named in `$ARGUMENTS`.

If `$ARGUMENTS` is empty, ask which branch to review. Then stop.

## 1. Get the context

- Check out the branch.
- Read `docs/spec.md` and `docs/plan.md` if they exist.
- If they do not exist, get the intent from the pull request description.
- If you cannot find the intent, say so in the report. Do not guess.

## 2. Review against the spec

Run `/agent-skills:review` on the branch diff. Give attention to:

- **Correctness** — does the code do what the spec says?
- **Security** — input validation, secrets, authentication, authorisation.
- **Test coverage** — which spec behaviours have no test?

## 3. Test independently

Run `/agent-skills:test` yourself. Do not trust the test results in the pull
request. Record:

- Tests that fail.
- Tests that give different results on different runs (flaky tests).
- Parts of the spec that no test covers.

## 4. Report the findings

Post each finding as a pull request review comment. Use `gh pr review` or
`gh pr comment`. Give each finding one severity:

| Severity | Meaning |
| --- | --- |
| `blocker` | Do not merge. The code is incorrect, unsafe, or loses data. |
| `major` | Merge only after a fix. The code does not agree with the spec. |
| `minor` | Fix soon. The code is correct but is difficult to keep. |
| `nit` | Optional. Style or wording. |

Put the file and the line number in each comment.

## 5. Stop

Do not change the code. Do not commit. Do not push. Report only.
