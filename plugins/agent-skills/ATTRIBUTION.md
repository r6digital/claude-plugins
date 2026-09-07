# Attribution

This plugin is a vendored copy of a third-party project.

| Field | Value |
| --- | --- |
| Upstream project | `addyosmani/agent-skills` |
| Source URL | https://github.com/addyosmani/agent-skills |
| Upstream commit SHA | `48cb1168aeaaa70dfc2bbf709eddfa2a8ed8129a` |
| Upstream commit date | 2026-09-06 |
| Upstream version | 0.6.9 |
| Date vendored | 2026-09-08 |
| Licence | MIT — see [LICENSE](./LICENSE) |

Copyright (c) 2025 Addy Osmani. The MIT licence permits use, copying, and
distribution. The licence text stays in `LICENSE` next to this file, as the
licence requires.

## What we copied

Every file is byte-identical to the upstream commit above. We changed no file
contents.

| Upstream path | Path here |
| --- | --- |
| `.claude/commands/` | `commands/` |
| `skills/` | `skills/` |
| `agents/` | `agents/` |
| `references/` | `references/` |
| `hooks/` | `hooks/` |
| `docs/agents.md` | `docs/agents.md` |
| `LICENSE` | `LICENSE` |

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

## How to diff against upstream

```bash
git clone https://github.com/addyosmani/agent-skills /tmp/agent-skills-upstream
cd /tmp/agent-skills-upstream
git diff 48cb1168aeaaa70dfc2bbf709eddfa2a8ed8129a..HEAD -- \
  .claude/commands skills agents references hooks docs/agents.md LICENSE
```

Read the diff, apply the changes you want, then update the SHA, the date, and
the version in this file and in `.claude-plugin/plugin.json`.
