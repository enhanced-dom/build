#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
const args = yargs(process.argv)
  .usage('$0 -folder <folder> -file <source package.json path>')
  .nargs('folder', 1)
  .describe('folder', 'Destination folder. Default: ./dist')
  .default('folder', 'dist')
  .nargs('file', 1)
  .describe('file', 'Source package.json file path. Default: ./package.json')
  .default('file', 'package.json').argv as {folder: string; file: string}
const packageJSONContents = require(path.join(process.cwd(), args.file))
delete packageJSONContents.scripts
fs.writeFileSync(path.join(process.cwd(), args.folder, 'package.json'), JSON.stringify(packageJSONContents, null, 2))
