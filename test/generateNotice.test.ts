import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import MemoryFS from 'memory-fs'

import { generateNotice } from '../src/generateNotice'

describe('generateNotice', () => {
  it('groups attributions by type, includes package names, and dedupes repeated packages', () => {
    const fs = new MemoryFS()
    fs.mkdirpSync('/src')
    fs.mkdirpSync('/dist')
    fs.writeFileSync(
      '/src/a.ts',
      [
        '// ATTRIBUTION: COPY | fake-copied-pkg | Copyright (c) Fake Author. MIT Licensed.',
        'const a = 1',
        '// ATTRIBUTION: ADAPTATION | fake-adapted-pkg | Copyright (c) Another Author. MIT Licensed.',
        'const b = 2',
      ].join('\n'),
    )
    fs.writeFileSync(
      '/src/b.ts',
      // same package referenced again, from a different file - should not produce a duplicate entry
      '// ATTRIBUTION: COPY | fake-copied-pkg | Copyright (c) Fake Author. MIT Licensed.\nconst c = 3',
    )

    generateNotice({ fs, srcDir: '/src', outputFile: '/dist/NOTICE.md' })

    const notice = fs.readFileSync('/dist/NOTICE.md', 'utf-8')
    assert.ok(notice.includes('## Code copied verbatim from the following third-party sources'))
    assert.ok(notice.includes('- **fake-copied-pkg** — Copyright (c) Fake Author. MIT Licensed.'))
    assert.ok(notice.includes('## Code adapted from the following third-party sources'))
    assert.ok(notice.includes('- **fake-adapted-pkg** — Copyright (c) Another Author. MIT Licensed.'))
    assert.strictEqual(notice.match(/fake-copied-pkg/g)?.length, 1)
  })

  it('does not create a NOTICE.md when no attributions are found', () => {
    const fs = new MemoryFS()
    fs.mkdirpSync('/src')
    fs.mkdirpSync('/dist')
    fs.writeFileSync('/src/a.ts', 'const a = 1')

    generateNotice({ fs, srcDir: '/src', outputFile: '/dist/NOTICE.md' })

    assert.strictEqual(fs.existsSync('/dist/NOTICE.md'), false)
  })

  it('removes a stale NOTICE.md if attributions are removed from the source on a subsequent run', () => {
    const fs = new MemoryFS()
    fs.mkdirpSync('/src')
    fs.mkdirpSync('/dist')
    fs.writeFileSync('/src/a.ts', '// ATTRIBUTION: COPY | fake-pkg | Copyright (c) Fake Author. MIT Licensed.\nconst a = 1')
    generateNotice({ fs, srcDir: '/src', outputFile: '/dist/NOTICE.md' })
    assert.strictEqual(fs.existsSync('/dist/NOTICE.md'), true)

    fs.writeFileSync('/src/a.ts', 'const a = 1')
    generateNotice({ fs, srcDir: '/src', outputFile: '/dist/NOTICE.md' })

    assert.strictEqual(fs.existsSync('/dist/NOTICE.md'), false)
  })

  it('walks nested source directories', () => {
    const fs = new MemoryFS()
    fs.mkdirpSync('/src/nested')
    fs.mkdirpSync('/dist')
    fs.writeFileSync(
      '/src/nested/deep.ts',
      '// ATTRIBUTION: ADAPTATION | fake-nested-pkg | Copyright (c) Nested Author. MIT Licensed.\nconst a = 1',
    )

    generateNotice({ fs, srcDir: '/src', outputFile: '/dist/NOTICE.md' })

    const notice = fs.readFileSync('/dist/NOTICE.md', 'utf-8')
    assert.ok(notice.includes('- **fake-nested-pkg** — Copyright (c) Nested Author. MIT Licensed.'))
  })
})
