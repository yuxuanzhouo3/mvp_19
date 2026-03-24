import { existsSync, rmSync } from "node:fs"
import { join } from "node:path"

const projectRoot = process.cwd()
const candidates = ["pages", join("src", "pages")]

for (const relPath of candidates) {
  const absPath = join(projectRoot, relPath)
  if (existsSync(absPath)) {
    rmSync(absPath, { recursive: true, force: true })
    console.log(`[prebuild-cleanup] Removed unexpected directory: ${relPath}`)
  }
}
