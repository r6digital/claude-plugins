# claude-plugins

Our private Claude Code plugin marketplace.

It holds the skills and commands we want in every project. A project gets them
by committing one block to `.claude/settings.json`. Local sessions and cloud
sessions (`claude --cloud`) both read that file, so both get the same tools.

> Replace `{{ORG}}` with our GitHub organisation name everywhere in this
> repository before you publish it. The `.claude-plugin/marketplace.json` file
> and the snippets below all carry the placeholder.

## Contents

| Plugin | What it gives you |
| --- | --- |
| [`agent-skills`](./plugins/agent-skills) | 9 commands, 25 skills, and 4 agents for the full development cycle. Vendored from [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) under MIT. |
| [`qa-loop`](./plugins/qa-loop) | 2 commands that keep the builder session and the reviewer session apart. Written here. |

## How updates reach projects

```
this repository  ──►  marketplace cache on each machine  ──►  project session
```

1. You merge a change here and push it to the default branch.
2. Claude Code refreshes its copy of the marketplace in the background.
3. The next session in any project picks up the change.

Each plugin entry carries a `version` field. Claude Code offers an update only
when that string changes. **Bump the version in both places** — the plugin's
`.claude-plugin/plugin.json` and its entry in `.claude-plugin/marketplace.json`
— or nobody receives your change. CI fails when the two disagree.

## Install in a project

Commit this to the project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "{{ORG}}-plugins": {
      "source": {
        "source": "github",
        "repo": "{{ORG}}/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "agent-skills@{{ORG}}-plugins": true,
    "qa-loop@{{ORG}}-plugins": true
  }
}
```

This matches the shape in the current documentation. Claude Code reads it when
somebody trusts the folder, adds the marketplace, and enables both plugins.

`.claude/settings.json` is the shared, committed file. Do not put this in
`.claude/settings.local.json`, which is per-person and usually ignored by git.

### Manual fallback

The trust prompt does not always fire, so the automatic install does not always
happen. Install by hand on those machines:

```
/plugin marketplace add {{ORG}}/claude-plugins
/plugin install agent-skills@{{ORG}}-plugins
/plugin install qa-loop@{{ORG}}-plugins
```

The same steps work from a terminal:

```bash
claude plugin marketplace add {{ORG}}/claude-plugins
claude plugin install agent-skills@{{ORG}}-plugins
claude plugin install qa-loop@{{ORG}}-plugins
claude plugin list
```

## Command names

Claude Code puts every plugin command behind the plugin name. Short forms such
as `/spec` do not reach a plugin. Use these names:

| Command | Plugin |
| --- | --- |
| `/agent-skills:spec` | agent-skills |
| `/agent-skills:plan` | agent-skills |
| `/agent-skills:build` | agent-skills |
| `/agent-skills:test` | agent-skills |
| `/agent-skills:review` | agent-skills |
| `/agent-skills:ship` | agent-skills |
| `/agent-skills:constraints` | agent-skills |
| `/agent-skills:code-simplify` | agent-skills |
| `/agent-skills:webperf` | agent-skills |
| `/qa-loop:build-kickoff` | qa-loop |
| `/qa-loop:qa-pass` | qa-loop |

Run `/help` and open the **Custom commands** tab to see them in a session.

## The workflow loop

Keep the session that writes the code apart from the session that reviews it. A
session that built something will defend what it built.

```
1. LOCAL     /agent-skills:spec              →  docs/spec.md
2. LOCAL     /agent-skills:plan              →  docs/plan.md
3. LOCAL     git commit && git push
4. CLOUD     claude --cloud "/qa-loop:build-kickoff docs/plan.md"
                 builds, tests, opens the pull request, stops
5. CLOUD     claude --cloud "/qa-loop:qa-pass <branch>"
                 a second session reviews and comments, changes nothing
6. LOCAL     fix the blockers, push, merge
```

Steps 4 and 5 must be separate sessions. Step 4 ends when the pull request
opens. It does not review itself.

### About `/autofix-pr`

The original plan for this repository ended the loop with `/autofix-pr` on the
pull request branch. **No plugin we can find supplies that command.** It is not
in `addyosmani/agent-skills`, and it is not in the official Anthropic
marketplace. The word "autofix" appears only as a keyword on the
`claude-security` plugin, which exposes `/claude-security:claude-security`
instead.

Until somebody identifies the real source, close the loop with step 6 above, or
add the security plugin and use its own command:

```json
"enabledPlugins": {
  "claude-security@claude-plugins-official": true
}
```

## Cloud sessions

A cloud session gets only three things:

1. What is in the project repository clone.
2. What the project's `.claude/settings.json` declares.
3. What claude.ai organisation settings push out.

It does **not** read `~/.claude`. That is why the settings file above is the
whole install.

### Private marketplace access

This repository is private, so a cloud session must authenticate to clone it.
Give the cloud environment a fine-grained personal access token with read-only
`Contents` access to `{{ORG}}/claude-plugins`, exposed as `GITHUB_TOKEN` in the
cloud environment settings.

Background marketplace refreshes turn off git credential helpers by default. If
a refresh fails on a private repository, set this so the cached copy survives
the failure:

```bash
CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1
```

## Troubleshooting

### The plugins are absent in the first cloud session

A known race: a session can start before the declared plugins finish loading.
Run `/reload-plugins`, or start a second session. The second session always has
them.

`/reload-skills` also appears in older notes for this problem.
`/reload-plugins` is the command the current documentation gives; it reloads
plugins, skills, agents, hooks, and plugin MCP servers.

### The trust prompt never appeared

The automatic install runs when somebody trusts the folder. Use the manual
fallback above.

### A private marketplace fails to refresh

Set up the credential helper on the machine:

```bash
gh auth setup-git
```

Or rewrite the URL with a token:

```bash
git config --global \
  url."https://x-access-token:YOUR_TOKEN@github.com/{{ORG}}/claude-plugins".insteadOf \
  "https://github.com/{{ORG}}/claude-plugins"
```

### `/agent-skills:spec` is ambiguous or reaches the wrong copy

The public marketplace `addy-agent-skills` ships a plugin with the same name,
`agent-skills`. If somebody installed that one already, two plugins compete for
the namespace. Remove the public copy:

```bash
claude plugin uninstall agent-skills@addy-agent-skills
```

We keep the name `agent-skills` on purpose. Every command in that plugin calls
its skills by the `agent-skills:` prefix, and the prefix comes from the plugin
name. A rename would break every one of those calls.

### The session-start notice mentions `jq`

The `agent-skills` plugin runs a `SessionStart` hook that needs `jq`. Without
`jq` it prints a notice and continues. Install `jq` in the cloud image to
silence it. The skills work either way.

## Develop and test

Load a plugin without installing it:

```bash
claude --plugin-dir ./plugins/qa-loop
```

Run `/reload-plugins` after each edit.

Validate before you push:

```bash
node scripts/validate-manifests-test.mjs
node scripts/validate-manifests.mjs
claude plugin validate .
claude plugin validate ./plugins/agent-skills
claude plugin validate ./plugins/qa-loop
```

CI runs the same checks on every push and pull request. See
[.github/workflows/validate.yml](./.github/workflows/validate.yml).

## Update the vendored copy

`plugins/agent-skills` is a copy of an upstream repository, pinned to a commit.
[ATTRIBUTION.md](./plugins/agent-skills/ATTRIBUTION.md) records the commit and
gives the command that diffs our copy against upstream.

## Where the documentation differed from our plan

| Our plan said | The documentation says |
| --- | --- |
| Put the vendored commands in `skills/` or `commands/`, matching upstream. | Upstream keeps them in `.claude/commands/`. The documented default for flat command files is `commands/` at the plugin root, so they moved there. Contents are unchanged. |
| `/spec`, `/plan`, `/build`, `/test`, `/review`. | Plugin commands are always behind the plugin name: `/agent-skills:spec`, and so on. The table above lists the real names. |
| Close the loop with `/autofix-pr`. | No plugin supplies that command. See the section above. |
| `/reload-skills` fixes the first-session race. | The current command is `/reload-plugins`. Both are listed under Troubleshooting. |

The `.claude/settings.json` shape in this README matches the current
documentation exactly. It needed no correction.
