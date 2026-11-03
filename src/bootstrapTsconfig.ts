#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'

const args = yargs(process.argv)
  .usage('$0 -folder <destination folder> [-type isomorphic|node|browser] [-react] [-force]')
  .nargs('folder', 1)
  .describe('folder', 'Destination folder. Default: ./')
  .default('folder', './')
  .choices('type', ['isomorphic', 'node', 'browser'] as const)
  .describe(
    'type',
    '"isomorphic" (default): bundler resolution, no DOM/node globals. "browser": adds DOM via esnext module. "node": nodenext when the destination package.json has "type": "module", bundler otherwise.',
  )
  .default('type', 'isomorphic' as const)
  .boolean('react')
  .describe('react', 'Include .tsx sources and set "jsx": "react". Default: false')
  .default('react', false)
  .boolean('force')
  .describe('force', 'Overwrite an existing tsconfig.json. Default: false')
  .default('force', false).argv as {
  folder: string
  type: 'isomorphic' | 'node' | 'browser'
  react: boolean
  force: boolean
}

const destFolder = path.join(process.cwd(), args.folder)
const destPath = path.join(destFolder, 'tsconfig.json')
if (fs.existsSync(destPath) && !args.force) {
  console.log(`${destPath} already exists, skipping (use --force to overwrite)`)
} else {
  const templatePath = path.join(import.meta.dirname, 'tsconfig.template.json')
  let template = fs.readFileSync(templatePath, 'utf-8')

  if (args.type === 'isomorphic') {
    // ponytail: bundler resolution works under both node and browser bundlers; "lib": ["es2025"] (no dom) + no node types keeps shared code honest
    template = template
      .replace('"moduleResolution": "nodenext"', '"moduleResolution": "bundler"')
      .replace('"module": "nodenext"', '"module": "preserve"')
      .replace('"target": "es2025",\n    "types": ["node"],', '"target": "es2025",\n    "lib": ["es2025"],')
  } else if (args.type === 'browser') {
    // ponytail: browser bundles aren't run by node's strict ESM resolver; explicit dom lib replaces node globals rather than relying on tsc's implicit default
    template = template
      .replace('"moduleResolution": "nodenext"', '"moduleResolution": "bundler"')
      .replace('"module": "nodenext"', '"module": "esnext"')
      .replace('"target": "es2025",\n    "types": ["node"],', '"target": "es2025",\n    "lib": ["dom", "es2025"],')
  } else {
    const destPackageJsonPath = path.join(destFolder, 'package.json')
    const isEsm =
      fs.existsSync(destPackageJsonPath) &&
      JSON.parse(fs.readFileSync(destPackageJsonPath, 'utf-8')).type === 'module'
    if (!isEsm) {
      // ponytail: bundler resolution/module fit non-ESM (bundled) consumers; nodenext needs "type": "module" to run under node
      template = template
        .replace('"moduleResolution": "nodenext"', '"moduleResolution": "bundler"')
        .replace('"module": "nodenext"', '"module": "preserve"')
    }
  }

  template = args.react
    ? template.replace('"strict": true,', '"jsx": "react",\n    "strict": true,')
    : template.replace('    "src/**/*.tsx",\n', '')

  fs.writeFileSync(destPath, template)
}
