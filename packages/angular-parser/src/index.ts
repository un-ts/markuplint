import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type Parse } from '@markuplint/ml-ast'
import { createSyncFn } from 'synckit'

const _dirname =
  typeof __dirname === 'undefined'
    ? dirname(fileURLToPath(import.meta.url))
    : __dirname

export const parse: Parse = createSyncFn(path.resolve(_dirname, './worker.mjs'))
