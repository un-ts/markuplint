import path from 'path'

import { Config, ConfigSet, margeConfig } from '@markuplint/file-resolver'
import { cosmiconfigSync } from 'cosmiconfig'

import { tryRequirePkg } from '../helper'

import { loadConfigFile } from './load-config-file'

const explorer = cosmiconfigSync('markuplint')

export function search<T = Config>(dir: string, cacheClear: boolean) {
  if (!cacheClear) {
    explorer.clearCaches()
  }
  dir = path.dirname(dir)
  const result = explorer.search(dir)
  if (!result || result.isEmpty) {
    return null
  }
  return {
    filePath: result.filepath,
    config: result.config as T,
  }
}

export function load<T = Config>(filePath: string, cacheClear: boolean) {
  if (!cacheClear) {
    explorer.clearCaches()
  }
  const result = explorer.load(filePath)
  if (!result || result.isEmpty) {
    return null
  }
  return {
    filePath: result.filepath,
    config: result.config as T,
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function recursiveLoad(
  config: Config,
  filePath: string,
  files: Set<string>,
  cacheClear: boolean,
): ConfigSet {
  const errs: Error[] = []
  const baseDir = path.dirname(filePath)
  if (config.extends) {
    const extendFiles = Array.isArray(config.extends)
      ? config.extends
      : [config.extends]
    for (const _file of extendFiles) {
      if (/^\.+\//.test(_file)) {
        const file = path.resolve(path.join(baseDir, _file))
        if (files.has(file)) {
          continue
        }
        const extendFileResult = loadConfigFile(file, true, cacheClear)
        if (!extendFileResult) {
          continue
        }
        files = new Set(files).add(file)
        config = margeConfig(extendFileResult.config, config)
      } else {
        try {
          const mod = tryRequirePkg<Config>(_file, true)
          files.add(_file)
          config = margeConfig(mod, config)
        } catch (err) {
          errs.push(err as Error)
        }
      }
    }
  }
  delete config.extends
  return {
    files,
    config,
    errs,
  }
}
