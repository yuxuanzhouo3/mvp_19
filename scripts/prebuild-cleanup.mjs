import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const candidates = ["pages", join("src", "pages")]
const ignoredDirs = new Set(["node_modules", ".next", ".git"])

for (const relPath of candidates) {
  const absPath = join(projectRoot, relPath)
  if (existsSync(absPath)) {
    rmSync(absPath, { recursive: true, force: true })
    console.log(`[prebuild-cleanup] Removed unexpected directory: ${relPath}`)
  }
}

function walk(dir) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const absPath = join(dir, entry)
    const stats = statSync(absPath)
    if (stats.isDirectory()) {
      if (ignoredDirs.has(entry)) continue
      walk(absPath)
      continue
    }

    if (!/\.(js|jsx|ts|tsx)$/.test(entry)) continue

    const content = readFileSync(absPath, "utf8")
    if (!content.includes("next/document")) continue

    const normalized = absPath.replace(/\\/g, "/")
    const isValidDocument = /\/pages\/_document\.(js|jsx|ts|tsx)$/.test(normalized)
    if (!isValidDocument) {
      rmSync(absPath, { force: true })
      console.log(`[prebuild-cleanup] Removed invalid next/document usage file: ${normalized}`)
    }
  }
}

walk(projectRoot)
