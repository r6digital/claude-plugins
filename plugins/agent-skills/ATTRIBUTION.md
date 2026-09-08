# Attribution

This plugin is a curated copy of a third-party project. We started from an
upstream commit. We then removed some files and corrected one. This file records
every difference.

| Field | Value |
| --- | --- |
| Upstream project | `addyosmani/agent-skills` |
| Source URL | https://github.com/addyosmani/agent-skills |
| Upstream commit SHA | `48cb1168aeaaa70dfc2bbf709eddfa2a8ed8129a` |
| Upstream commit date | 2026-09-06 |
| Upstream version | 0.6.9 |
| Our version | 0.6.9+r6.2 |
| Date vendored | 2026-09-08 |
| Licence | MIT — see [LICENSE](./LICENSE) |

Copyright (c) 2025 Addy Osmani. The MIT licence permits use, copying,
modification, and distribution. The licence text stays in `LICENSE` next to this
file, as the licence requires.

## How we version this copy

The version has two parts. `0.6.9` is the upstream version we started from.
`+r6.2` is our revision of that base. The revision increases when we change this
copy. The base changes only when we take a newer upstream commit.

Both `.claude-plugin/plugin.json` and the repository marketplace file must show
the same version.

## What we copied

| Upstream path | Path here |
| --- | --- |
| `.claude/commands/` | `commands/` |
| `skills/` | `skills/` |
| `agents/` | `agents/` |
| `references/` | `references/` |
| `hooks/` | `hooks/` (see [What we removed](#what-we-removed)) |
| `docs/agents.md` | `docs/agents.md` |
| `LICENSE` | `LICENSE` |

Each copied file is byte-identical to the upstream commit, except the one file
listed in [What we changed](#what-we-changed).

### Why the commands moved

Upstream keeps the Claude Code command files in `.claude/commands/` and points
at them with a `commands` field in `plugin.json`. The Claude Code plugin schema
reads flat command files from `commands/` at the plugin root by default. We put
them at the documented default location, so our `plugin.json` needs no
`commands` field. The file contents are unchanged.

## What we did not copy

| Upstream path | Reason |
| --- | --- |
| `commands/*.toml` | Command files for Codex and Gemini. Claude Code cannot read them. |
| `.agents/`, `.codex-plugin/`, `.gemini/`, `.opencode/` | Manifests for other agent hosts. |
| `.claude-plugin/marketplace.json` | Upstream's own marketplace. Our marketplace replaces it. |
| `plugin.json` (repository root) | Duplicate of the manifest. We write our own. |
| `docs/` (except `agents.md`) | Upstream project documentation. `agents.md` stays because `agents/*.md` link to it. |
| `evals/`, `scripts/` | Upstream test and validation tooling. It has no effect at runtime. |
| `.github/`, `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`, `README.md` | Upstream repository files, not plugin components. |
| `.claude/rules/` | Upstream contribution rules, not a plugin component. |

No file we copied needs a package manager. The plugin adds no dependencies.

## What we removed

We removed two optional hooks. We use neither. Each one has a defect that makes
it unsafe to wire.

| Path | Reason |
| --- | --- |
| `hooks/sdd-cache-pre.sh` | The cache revalidates the URL and never checks the cached body. |
| `hooks/sdd-cache-post.sh` | The cache revalidates the URL and never checks the cached body. |
| `hooks/SDD-CACHE.md` | It tells the reader to wire that cache. |
| `hooks/simplify-ignore.sh` | The session-end restore overwrites any file named in its cache directory. |
| `hooks/simplify-ignore-test.sh` | It tests that hook. |
| `hooks/SIMPLIFY-IGNORE.md` | It tells the reader to wire that hook. |

**The `simplify-ignore` defect is the more serious of the two.** The restore step
reads a target path from a file in `.claude/.simplify-ignore-cache/`, then
overwrites whatever sits at that path. It checks nothing. The guide tells you to
put that directory in `.gitignore`, so the write is also quiet.

We did not repair either hook. We removed them, because we do not use them.

`hooks/hooks.json` registers only the `SessionStart` hook. It never referred to
the removed files, so it needs no change.

### The removal is enforced

`scripts/check-removals.mjs` at the repository root fails the build if any
removed path comes back. A bulk re-sync restores deleted files by default. The
check catches that and prints the reason.

If you decide a removed file should return, change the list in that script and
change this section in the same commit.

## What we changed

| Path | Change |
| --- | --- |
| `hooks/session-start-test.sh` | The assertions now read `hookSpecificOutput.additionalContext`. |

The test asserted `priority` and `message`. `hooks/session-start.sh` emits
neither, so the test failed every time you ran it. The hook was correct. The test
was stale.

`session-start.sh` is the only file in this plugin that runs by itself. We
corrected its test instead of deleting it, and the repository workflow now runs
that test on every pull request.

`.claude-plugin/plugin.json` is our own file, not a copy, so the table above
omits it. Its `author` field reads `Addy Osmani (curated by r6digital)`. The
skills are his work. The changes recorded in this file are ours. The field says
both, so nobody reads this copy as his release.

## Known upstream defects we did not correct

- `skills/idea-refine/SKILL.md` — a project-relative script path. It does not
  resolve in a plugin install.

The plugin [README](./README.md) gives the correction to apply by hand.

If you correct this here, record the change in [What we
changed](#what-we-changed) and raise the revision in the version.

## How to diff against upstream

```bash
git clone https://github.com/addyosmani/agent-skills /tmp/agent-skills-upstream
cd /tmp/agent-skills-upstream
git diff 48cb1168aeaaa70dfc2bbf709eddfa2a8ed8129a..HEAD -- \
  .claude/commands skills agents references hooks docs/agents.md LICENSE
```

The diff shows upstream changes only. It does not show ours. Read [What we
removed](#what-we-removed) and [What we changed](#what-we-changed) first, so you
know which upstream changes to leave out.

Then apply the changes you want, update the SHA, the date, and the version in
this file and in `.claude-plugin/plugin.json`, and run
`node scripts/check-removals.mjs` before you commit.
