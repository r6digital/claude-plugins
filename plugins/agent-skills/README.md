# agent-skills

A vendored copy of [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills).
It gives Claude Code a set of engineering skills for the full development
cycle: specify, plan, build, test, review, and ship.

Read [ATTRIBUTION.md](./ATTRIBUTION.md) for the upstream commit, the licence,
and the list of files we did and did not copy. The licence is MIT.

## Commands

Claude Code puts every plugin command behind the plugin name. Use the long
form. The short form `/spec` does not reach this plugin.

| Command | Purpose |
| --- | --- |
| `/agent-skills:spec` | Write a structured specification before you write code. |
| `/agent-skills:plan` | Break the work into small tasks with acceptance criteria. |
| `/agent-skills:build [auto]` | Implement the next task. Add `auto` to run every task in one pass. |
| `/agent-skills:test` | Run the test-driven loop. Write a failing test first. |
| `/agent-skills:review` | Review across correctness, readability, architecture, security, performance. |
| `/agent-skills:ship` | Run the pre-launch checklist. Return a go or no-go decision. |
| `/agent-skills:constraints` | Write this project's quality bar to `CONSTRAINTS.md`. |
| `/agent-skills:code-simplify` | Reduce complexity without changing behaviour. |
| `/agent-skills:webperf` | Audit web performance and Core Web Vitals. |

## Skills

The plugin also carries 25 model-invoked skills. Claude selects them by task,
without a command. Examples: `agent-skills:test-driven-development`,
`agent-skills:security-and-hardening`, `agent-skills:debugging-and-error-recovery`.

Run `claude plugin details agent-skills@{{ORG}}-plugins` for the full list and
the token cost of each one.

## Agents

Four subagents ship with the plugin. Address them by their scoped names:

- `agent-skills:code-reviewer`
- `agent-skills:security-auditor`
- `agent-skills:test-engineer`
- `agent-skills:web-performance-auditor`

## Session hook

The plugin registers one `SessionStart` hook. It reads the
`using-agent-skills` meta-skill into every new session so Claude can choose the
right skill.

The hook needs `jq` on `PATH`. Without `jq` the hook prints a notice and exits
without an error. The skills still work; only the discovery guide is absent.
Cloud session images do not always carry `jq`. Add it to the image, or accept
the notice.

To remove the hook, delete `hooks/hooks.json` from this directory. Record the
deletion in [ATTRIBUTION.md](./ATTRIBUTION.md), because it makes this copy
differ from upstream.

## Token cost

The plugin adds about 2,600 tokens to every session. That is the always-on cost
of 34 skill descriptions and 4 agent descriptions. Each skill costs more only
when it fires.

## Known upstream defects

We vendor this plugin byte-identical, so these upstream defects are still here.
Do not correct them in place. Report them upstream, then pull the fix in with a
new commit SHA.

### The optional hook guides give the wrong path

`hooks/SIMPLIFY-IGNORE.md` and `hooks/SDD-CACHE.md` describe two extra hooks you
can wire by hand. Both tell you to run
`bash "${CLAUDE_PROJECT_DIR}/hooks/<script>.sh"`. That path holds when the
upstream repository is your project. It is wrong for a plugin install, where the
scripts sit in the plugin directory instead. A hook wired that way exits 127 on
every matching tool call.

Use `"${CLAUDE_PLUGIN_ROOT}"/hooks/<script>.sh` instead. The `SessionStart` hook
in `hooks/hooks.json` already does this and works as shipped.

### `skills/idea-refine/SKILL.md` gives a relative script path

It calls `bash skills/idea-refine/scripts/idea-refine.sh`, which resolves
against your project, not the plugin. Use
`"${CLAUDE_PLUGIN_ROOT}"/skills/idea-refine/scripts/idea-refine.sh`.

### `hooks/session-start-test.sh` always fails

The test asserts `priority` and `message` fields. `hooks/session-start.sh` emits
only `hookSpecificOutput`. The hook is correct; the test is stale. Nothing runs
this file at session time, so it has no runtime effect. Our CI does not run it.
