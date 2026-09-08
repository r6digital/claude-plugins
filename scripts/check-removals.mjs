// ABOUTME: Fails when a file we deliberately removed from a vendored copy comes back.
// ABOUTME: A bulk re-sync restores deleted files by default. This check catches that.

import { existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Each entry records a file we took out and the reason we took it out. The
// reason prints at the moment the file returns, so the person doing the
// re-sync reads the decision when it matters.
// See plugins/agent-skills/ATTRIBUTION.md for the full record.
const removed = [
  {
    path: 'plugins/agent-skills/hooks/sdd-cache-pre.sh',
    reason: 'the cache revalidates the URL and never checks the cached body',
  },
  {
    path: 'plugins/agent-skills/hooks/sdd-cache-post.sh',
    reason: 'the cache revalidates the URL and never checks the cached body',
  },
  {
    path: 'plugins/agent-skills/hooks/SDD-CACHE.md',
    reason: 'it tells the reader to wire a cache that never checks the cached body',
  },
  {
    path: 'plugins/agent-skills/hooks/simplify-ignore.sh',
    reason: 'the session-end restore overwrites any file named in its cache directory',
  },
  {
    path: 'plugins/agent-skills/hooks/simplify-ignore-test.sh',
    reason: 'it tests a hook that overwrites any file named in its cache directory',
  },
  {
    path: 'plugins/agent-skills/hooks/SIMPLIFY-IGNORE.md',
    reason: 'it tells the reader to wire a hook that overwrites any file named in its cache directory',
  },
]

const restored = removed.filter((entry) => existsSync(join(repoRoot, entry.path)))

if (restored.length > 0) {
  console.error('Files we removed on purpose are back:\n')
  for (const entry of restored) {
    console.error(`  ${entry.path}`)
    console.error(`    removed because ${entry.reason}\n`)
  }
  console.error('Delete them again, or record a new decision in')
  console.error('plugins/agent-skills/ATTRIBUTION.md and in this list.')
  process.exit(1)
}

console.log(`No removed file has come back. Checked ${removed.length} path(s).`)
