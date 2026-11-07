#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import yargs from 'yargs'

import { generateNotice } from './generateNotice.js'

const args = yargs(process.argv)
  .usage('$0 [-folder <folder>]')
  .nargs('folder', 1)
  .describe('folder', 'Destination folder containing the built output. Default: ./dist')
  .default('folder', 'dist').argv as {folder: string}

const srcDir = path.join(process.cwd(), 'src')
const outputFile = path.join(process.cwd(), args.folder, 'NOTICE.md')
const wrote = generateNotice({ fs, srcDir, outputFile })
if (wrote) {
  console.log(`generated ${path.relative(process.cwd(), outputFile)}`)
}
