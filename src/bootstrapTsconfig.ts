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

const destPath = path.join(process.cwd(), args.folder, 'tsconfig.json')
if (fs.existsSync(destPath) && !args.force) {
  console.log(`${destPath} already exists, skipping (use --force to overwrite)`)
} else {
  const templatePath = path.join(import.meta.dirname, 'tsconfig.template.json')
  fs.copyFileSync(templatePath, destPath)
}
