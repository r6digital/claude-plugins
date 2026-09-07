// ABOUTME: Tests for validate-manifests.mjs — builds broken manifest trees and asserts the errors.
// ABOUTME: Run with `node scripts/validate-manifests-test.mjs`.

import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, symlinkSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const validator = join(repoRoot, 'scripts/validate-manifests.mjs')

let passed = 0
const failures = []

function buildRepo(marketplace, plugins) {
  const dir = mkdtempSync(join(tmpdir(), 'manifest-test-'))
  mkdirSync(join(dir, '.claude-plugin'), { recursive: true })
  mkdirSync(join(dir, 'scripts'), { recursive: true })
  cpSync(validator, join(dir, 'scripts/validate-manifests.mjs'))
  writeFileSync(join(dir, '.claude-plugin/marketplace.json'), JSON.stringify(marketplace, null, 2))
  for (const [name, manifest] of Object.entries(plugins)) {
    const pluginDir = join(dir, 'plugins', name, '.claude-plugin')
    mkdirSync(pluginDir, { recursive: true })
    if (manifest !== null) {
      writeFileSync(join(pluginDir, 'plugin.json'), JSON.stringify(manifest, null, 2))
    }
  }
  return dir
}

function run(dir) {
  try {
    const stdout = execFileSync('node', [join(dir, 'scripts/validate-manifests.mjs')], {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { code: 0, output: stdout }
  } catch (err) {
    return { code: err.status ?? 1, output: `${err.stdout ?? ''}${err.stderr ?? ''}` }
  }
}

function test(label, marketplace, plugins, expect) {
  const dir = buildRepo(marketplace, plugins)
  try {
    const result = run(dir)
    expect(result)
    passed += 1
    console.log(`ok   ${label}`)
  } catch (err) {
    failures.push(`${label}: ${err.message}`)
    console.log(`FAIL ${label} — ${err.message}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function expectFailure(fragment) {
  return ({ code, output }) => {
    if (code === 0) throw new Error(`expected a non-zero exit, got 0. Output:\n${output}`)
    if (!output.includes(fragment)) throw new Error(`expected "${fragment}" in output:\n${output}`)
  }
}

function expectSuccess() {
  return ({ code, output }) => {
    if (code !== 0) throw new Error(`expected exit 0, got ${code}. Output:\n${output}`)
  }
}

const owner = { name: 'acmeco' }
const entry = (over = {}) => ({ name: 'alpha', source: './plugins/alpha', version: '1.0.0', ...over })
const manifest = (over = {}) => ({ name: 'alpha', version: '1.0.0', ...over })

test(
  'a well-formed marketplace passes',
  { name: 'acmeco-plugins', owner, plugins: [entry()] },
  { alpha: manifest() },
  expectSuccess()
)

test(
  'a missing owner is reported',
  { name: 'acmeco-plugins', plugins: [entry()] },
  { alpha: manifest() },
  expectFailure('missing required field "owner"')
)

test(
  'a missing source directory is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry({ source: './plugins/absent' })] },
  { alpha: manifest() },
  expectFailure('does not exist')
)

test(
  'a source that is not relative is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry({ source: 'plugins/alpha' })] },
  { alpha: manifest() },
  expectFailure('must start with "./"')
)

test(
  'a duplicate plugin name is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry(), entry()] },
  { alpha: manifest() },
  expectFailure('duplicate plugin name')
)

test(
  'a name that disagrees with the manifest is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry()] },
  { alpha: manifest({ name: 'beta' }) },
  expectFailure('does not match marketplace entry')
)

test(
  'a version that disagrees with the manifest is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry({ version: '9.9.9' })] },
  { alpha: manifest() },
  expectFailure('does not match marketplace entry')
)

test(
  'a version missing from the marketplace entry is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry({ version: undefined })] },
  { alpha: manifest() },
  expectFailure('missing required field "version"')
)

test(
  'a version missing from the plugin manifest is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry()] },
  { alpha: manifest({ version: undefined }) },
  expectFailure('missing required field "version"')
)

test(
  'a null entry is reported, not thrown',
  { name: 'acmeco-plugins', owner, plugins: [null] },
  { alpha: manifest() },
  ({ code, output }) => {
    if (code === 0) throw new Error(`expected a non-zero exit, got 0. Output:\n${output}`)
    if (/TypeError|Cannot read propert/.test(output)) {
      throw new Error(`expected a reported error, got a crash:\n${output}`)
    }
    if (!output.includes('must be an object')) {
      throw new Error(`expected "must be an object" in output:\n${output}`)
    }
  }
)

test(
  'a missing plugin manifest is reported',
  { name: 'acmeco-plugins', owner, plugins: [entry()] },
  { alpha: null },
  expectFailure('file is missing')
)

// A traversal source is only interesting when the target exists — otherwise the
// "does not exist" check hides the defect. This builds a real plugin outside the
// repository and points the marketplace at it.
{
  const label = 'a source that climbs out of the repository is reported'
  const parent = mkdtempSync(join(tmpdir(), 'manifest-escape-'))
  try {
    const repo = join(parent, 'repo')
    mkdirSync(join(repo, '.claude-plugin'), { recursive: true })
    mkdirSync(join(repo, 'scripts'), { recursive: true })
    cpSync(validator, join(repo, 'scripts/validate-manifests.mjs'))
    mkdirSync(join(parent, 'outside/alpha/.claude-plugin'), { recursive: true })
    writeFileSync(
      join(parent, 'outside/alpha/.claude-plugin/plugin.json'),
      JSON.stringify(manifest(), null, 2)
    )
    writeFileSync(
      join(repo, '.claude-plugin/marketplace.json'),
      JSON.stringify(
        { name: 'acmeco-plugins', owner, plugins: [entry({ source: './../outside/alpha' })] },
        null,
        2
      )
    )
    const { code, output } = run(repo)
    if (code === 0) throw new Error(`expected a non-zero exit, got 0. Output:\n${output}`)
    if (!output.includes('must stay inside the repository')) {
      throw new Error(`expected "must stay inside the repository" in output:\n${output}`)
    }
    passed += 1
    console.log(`ok   ${label}`)
  } catch (err) {
    failures.push(`${label}: ${err.message}`)
    console.log(`FAIL ${label} — ${err.message}`)
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}

// A symlinked source keeps a repository-relative path, so the lexical check
// passes. Only the resolved path shows that it leaves the tree.
{
  const label = 'a source symlinked out of the repository is reported'
  const parent = mkdtempSync(join(tmpdir(), 'manifest-symlink-'))
  try {
    const repo = join(parent, 'repo')
    mkdirSync(join(repo, '.claude-plugin'), { recursive: true })
    mkdirSync(join(repo, 'scripts'), { recursive: true })
    mkdirSync(join(repo, 'plugins'), { recursive: true })
    cpSync(validator, join(repo, 'scripts/validate-manifests.mjs'))
    mkdirSync(join(parent, 'outside/alpha/.claude-plugin'), { recursive: true })
    writeFileSync(
      join(parent, 'outside/alpha/.claude-plugin/plugin.json'),
      JSON.stringify(manifest(), null, 2)
    )
    symlinkSync(join(parent, 'outside/alpha'), join(repo, 'plugins/alpha'), 'dir')
    writeFileSync(
      join(repo, '.claude-plugin/marketplace.json'),
      JSON.stringify(
        { name: 'acmeco-plugins', owner, plugins: [entry({ source: './plugins/alpha' })] },
        null,
        2
      )
    )
    const { code, output } = run(repo)
    if (code === 0) throw new Error(`expected a non-zero exit, got 0. Output:\n${output}`)
    if (!output.includes('must stay inside the repository')) {
      throw new Error(`expected "must stay inside the repository" in output:\n${output}`)
    }
    passed += 1
    console.log(`ok   ${label}`)
  } catch (err) {
    failures.push(`${label}: ${err.message}`)
    console.log(`FAIL ${label} — ${err.message}`)
  } finally {
    rmSync(parent, { recursive: true, force: true })
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exit(1)
