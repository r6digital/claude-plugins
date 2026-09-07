// ABOUTME: Validates marketplace.json and every plugin.json in this repository.
// ABOUTME: Checks JSON syntax, required fields, and that each plugin source directory exists.

import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const checked = []

function fail(file, message) {
  errors.push(`${file}: ${message}`)
}

function readJson(absPath, relPath) {
  try {
    return JSON.parse(readFileSync(absPath, 'utf8'))
  } catch (err) {
    fail(relPath, `invalid JSON — ${err.message}`)
    return null
  }
}

const marketplaceRel = '.claude-plugin/marketplace.json'
// True when child is repoRoot itself or sits beneath it.
function inside(child, root) {
  return child === root || child.startsWith(root + sep)
}

const marketplaceAbs = join(repoRoot, marketplaceRel)

if (!existsSync(marketplaceAbs)) {
  fail(marketplaceRel, 'file is missing')
} else {
  checked.push(marketplaceRel)
  const marketplace = readJson(marketplaceAbs, marketplaceRel)
  if (marketplace) {
    for (const field of ['name', 'owner', 'plugins']) {
      if (marketplace[field] === undefined) fail(marketplaceRel, `missing required field "${field}"`)
    }
    if (marketplace.owner && typeof marketplace.owner.name !== 'string') {
      fail(marketplaceRel, 'owner.name is required and must be a string')
    }
    if (!Array.isArray(marketplace.plugins)) {
      fail(marketplaceRel, '"plugins" must be an array')
    } else {
      const seen = new Set()
      marketplace.plugins.forEach((entry, index) => {
        const where = `${marketplaceRel} plugins[${index}]`
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
          fail(where, 'entry must be an object')
          return
        }
        if (typeof entry.name !== 'string' || entry.name.length === 0) {
          fail(where, 'missing required field "name"')
          return
        }
        if (seen.has(entry.name)) fail(where, `duplicate plugin name "${entry.name}"`)
        seen.add(entry.name)

        if (entry.source === undefined) {
          fail(where, `plugin "${entry.name}" is missing required field "source"`)
          return
        }
        // Only relative-path sources point at directories in this repository.
        if (typeof entry.source !== 'string') return
        if (!entry.source.startsWith('./')) {
          fail(where, `relative source "${entry.source}" must start with "./"`)
          return
        }
        const pluginDirAbs = join(repoRoot, entry.source)
        // A "./" prefix does not stop "./../elsewhere" from leaving the tree.
        // This catches it before the path reaches the file system.
        if (!inside(pluginDirAbs, repoRoot)) {
          fail(where, `source "${entry.source}" must stay inside the repository`)
          return
        }
        if (!existsSync(pluginDirAbs) || !statSync(pluginDirAbs).isDirectory()) {
          fail(where, `source directory "${entry.source}" does not exist`)
          return
        }
        // A symlink keeps a repository-relative path, so the check above passes.
        // Compare the resolved paths as well. Resolve both sides: on macOS the
        // repository root can itself sit under a symlinked prefix.
        if (!inside(realpathSync(pluginDirAbs), realpathSync(repoRoot))) {
          fail(where, `source "${entry.source}" must stay inside the repository`)
          return
        }

        const pluginRel = `${entry.source.replace(/^\.\//, '')}/.claude-plugin/plugin.json`
        const pluginAbs = join(pluginDirAbs, '.claude-plugin/plugin.json')
        if (!existsSync(pluginAbs)) {
          fail(pluginRel, 'file is missing')
          return
        }
        checked.push(pluginRel)
        const plugin = readJson(pluginAbs, pluginRel)
        if (!plugin) return
        if (typeof plugin.name !== 'string' || plugin.name.length === 0) {
          fail(pluginRel, 'missing required field "name"')
        } else if (plugin.name !== entry.name) {
          fail(pluginRel, `name "${plugin.name}" does not match marketplace entry "${entry.name}"`)
        }
        // Claude Code offers an update only when the version string changes, so both
        // manifests must carry it and the two must agree.
        if (entry.version === undefined) {
          fail(where, `plugin "${entry.name}" is missing required field "version"`)
        }
        if (plugin.version === undefined) {
          fail(pluginRel, 'missing required field "version"')
        }
        if (entry.version !== undefined && plugin.version !== undefined && entry.version !== plugin.version) {
          fail(pluginRel, `version "${plugin.version}" does not match marketplace entry "${entry.version}"`)
        }
        // Component directories belong at the plugin root, never inside .claude-plugin/.
        for (const componentDir of ['commands', 'skills', 'agents', 'hooks']) {
          if (existsSync(join(pluginDirAbs, '.claude-plugin', componentDir))) {
            fail(pluginRel, `"${componentDir}/" must sit at the plugin root, not inside .claude-plugin/`)
          }
        }
      })
    }
  }
}

for (const file of checked) console.log(`checked ${file}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) found:`)
  for (const error of errors) console.error(`  ${error}`)
  process.exit(1)
}

console.log(`\nAll ${checked.length} manifest(s) passed.`)
