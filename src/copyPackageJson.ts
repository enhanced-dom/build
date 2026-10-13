#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import yargs from 'yargs'

const args = yargs(process.argv)
  .usage('$0 -folder <folder> -file <source package.json path> [-omit <dotted.key.path> ...]')
  .nargs('folder', 1)
  .describe('folder', 'Destination folder. Default: ./dist')
  .default('folder', 'dist')
  .nargs('file', 1)
  .describe('file', 'Source package.json file path. Default: ./package.json')
  .default('file', 'package.json')
  .array('omit')
  .describe('omit', 'Dot-notation key path(s) to remove, e.g. scripts or publishConfig.registry. Repeatable.')
  .default('omit', ['scripts']).argv as {folder: string; file: string; omit: string[]}

const omitPath = (obj: Record<string, any>, dottedPath: string) => {
  const keys = dottedPath.split('.')
  const lastKey = keys.pop() as string
  const parent = keys.reduce((acc, key) => acc?.[key], obj)
  delete parent?.[lastKey]
}

const packageJSONContents = JSON.parse(fs.readFileSync(path.join(process.cwd(), args.file), 'utf8'))
args.omit.forEach((dottedPath) => omitPath(packageJSONContents, dottedPath))
fs.writeFileSync(path.join(process.cwd(), args.folder, 'package.json'), JSON.stringify(packageJSONContents, null, 2))
