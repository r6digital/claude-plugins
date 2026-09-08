// ABOUTME: Tests for check-removals.mjs — restores a removed path and asserts the check reports it.
// ABOUTME: Run with `node scripts/check-removals-test.mjs`.

import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const checker = join(repoRoot, 'scripts/check-removals.mjs')

let passed = 0
const failures = []

// The check resolves the repository from its own location, so each test copies
// it into a throwaway tree and runs it there.
function buildRepo(restored = []) {
  const dir = mkdtempSync(join(tmpdir(), 'removal-test-'))
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  cpSync(checker, join(dir, 'scripts/check-removals.mjs'))
  for (const rel of restored) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), 'restored by a re-sync\n')
  }
  return dir
}

function run(dir) {
  try {
    const stdout = execFileSync('node', [join(dir, 'scripts/check-removals.mjs')], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, output: stdout }
  } catch (err) {
    return { code: err.status ?? 1, output: `${err.stdout ?? ''}${err.stderr ?? ''}` }
  }
}

function test(label, restored, expect) {
  const dir = buildRepo(restored)
  try {
    expect(run(dir))
    passed += 1
    console.log(`ok   ${label}`)
  } catch (err) {
    failures.push(`${label}: ${err.message}`)
    console.log(`FAIL ${label} — ${err.message}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function expectFailure(...fragments) {
  return ({ code, output }) => {
    if (code === 0) throw new Error(`expected a non-zero exit, got 0. Output:\n${output}`)
    for (const fragment of fragments) {
      if (!output.includes(fragment)) throw new Error(`expected "${fragment}" in output:\n${output}`)
    }
  }
}

function expectSuccess() {
  return ({ code, output }) => {
    if (code !== 0) throw new Error(`expected exit 0, got ${code}. Output:\n${output}`)
  }
}

test('a repository with no restored file passes', [], expectSuccess())

test(
  'a restored sdd-cache script is reported with the reason',
  ['plugins/agent-skills/hooks/sdd-cache-pre.sh'],
  expectFailure('plugins/agent-skills/hooks/sdd-cache-pre.sh', 'never checks the cached body')
)

test(
  'a restored simplify-ignore script is reported with the reason',
  ['plugins/agent-skills/hooks/simplify-ignore.sh'],
  expectFailure('plugins/agent-skills/hooks/simplify-ignore.sh', 'overwrites any file')
)

test(
  'a restored guide is reported',
  ['plugins/agent-skills/hooks/SIMPLIFY-IGNORE.md'],
  expectFailure('plugins/agent-skills/hooks/SIMPLIFY-IGNORE.md')
)

test(
  'every removed path is reported when a whole set comes back',
  [
    'plugins/agent-skills/hooks/sdd-cache-pre.sh',
    'plugins/agent-skills/hooks/sdd-cache-post.sh',
    'plugins/agent-skills/hooks/SDD-CACHE.md',
  ],
  expectFailure('sdd-cache-pre.sh', 'sdd-cache-post.sh', 'SDD-CACHE.md')
)

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exit(1)
