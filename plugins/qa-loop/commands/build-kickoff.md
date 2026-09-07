---
description: 'Cloud builder kickoff: implement plan, test, open PR'
---

Implement the plan in the file named in `$ARGUMENTS`. If `$ARGUMENTS` is empty,
use `docs/plan.md`.

If the plan file does not exist, say so and stop. Do not write a plan yourself.

## 1. Build

Run `/agent-skills:build` and obey the plan exactly.

If the plan is wrong, incomplete, or impossible, do not change it quietly.
Write the deviation down and continue. You report every deviation in step 3.

## 2. Test

Run `/agent-skills:test`. Correct each failure until all tests pass.

If a test failure shows that the plan is wrong, record it as a deviation.

## 3. Open the pull request

- Push the branch.
- Open the pull request with `gh pr create`.
- Put this in the pull request body:
  - The path of the spec file and the path of the plan file.
  - A summary of what you built.
  - A list of every deviation from the plan, with the reason for each one.
  - The test command and its result.

## 4. Stop

Stop when the pull request is open.

Do not review your own code. An independent session reviews it with
`/qa-loop:qa-pass <branch>`.
