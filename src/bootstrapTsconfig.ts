#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'

const args = yargs(process.argv)
  .usage('$0 -folder <destination folder> [-force]')
  .nargs('folder', 1)
  .describe('folder', 'Destination folder. Default: ./')
  .default('folder', './')
  .boolean('force')
  .describe('force', 'Overwrite an existing tsconfig.json. Default: false')
  .default('force', false).argv as {folder: string; force: boolean}

const destFolder = path.join(process.cwd(), args.folder)
const destPath = path.join(destFolder, 'tsconfig.json')
if (fs.existsSync(destPath) && !args.force) {
  console.log(`${destPath} already exists, skipping (use --force to overwrite)`)
} else {
  const templatePath = path.join(import.meta.dirname, 'tsconfig.template.json')
  let template = fs.readFileSync(templatePath, 'utf-8')

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

  fs.writeFileSync(destPath, template)
}
