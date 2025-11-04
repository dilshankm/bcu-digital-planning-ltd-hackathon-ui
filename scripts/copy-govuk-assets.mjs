import { cp, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')
const sourceDir = join(projectRoot, 'node_modules', 'govuk-frontend', 'dist', 'govuk', 'assets')
const destinationDir = join(projectRoot, 'public', 'assets')

try {
  await mkdir(destinationDir, { recursive: true })
  await cp(sourceDir, destinationDir, { recursive: true })
  console.log(`Copied GOV.UK assets to ${destinationDir}`)
} catch (error) {
  console.error('Failed to copy GOV.UK assets', error)
  process.exitCode = 1
}

