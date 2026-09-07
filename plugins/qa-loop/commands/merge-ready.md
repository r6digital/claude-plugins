---
description: Clear the spec and plan from a branch, then confirm it is ready to merge
---

Prepare the branch named in `$ARGUMENTS` for merge. If `$ARGUMENTS` is empty,
use the branch that is checked out now.

Run this after `/qa-loop:qa-pass`. The reviewer reads the spec and the plan, so
this command must not run before the review.

## 1. Check that the review is complete

- Find the pull request for the branch with `gh pr view`.
- Read the review comments.
- If any `blocker` or `major` finding is still open, stop. Name the finding.
- If no review exists, stop. Say that `/qa-loop:qa-pass` must run first.

## 2. Check that the tests pass

- Run the test command recorded in the pull request body.
- If a test fails, stop and report the failure.

## 3. Remove the spec and the plan

The spec and the plan belong to the branch, not to the trunk. Both stay in the
branch history and in the pull request after you remove them.

- Read the spec path and the plan path from the pull request body.
  Use `docs/spec.md` and `docs/plan.md` if the body does not name them.
- Remove each tracked file with `git rm`.
- If neither file is tracked, go to step 4. This is not an error.
- Commit with the message `Remove the spec and plan from the merge`.
- Push the branch.

## 4. Report

Give this to the person who merges:

- The pull request number and its title.
- The review result: the count of findings at each severity.
- The test command and its result.
- The files you removed.
- The merge method: squash.

Squash merge keeps the spec and the plan out of the trunk completely. The two
files are added and removed inside the branch, so the squashed commit contains
neither. A merge commit puts every branch commit on the trunk instead, so the
trunk tree stays clean but the files stay in the log.

## 5. Stop

Do not merge. The owner of the pull request merges it.
