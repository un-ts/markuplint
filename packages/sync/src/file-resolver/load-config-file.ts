import path from 'path'

import { ConfigSet } from '@markuplint/file-resolver'

import { load, recursiveLoad } from './helper'

/**
 * Asynchronously get configuration file.
 *
 * @param filePath A path of configuration file. (ex. `"path/to/markuplintrc.json"`)
 * @param recursiveExtends Recursive load by extends options.
 * @param cacheClear Clear cache when loading.
 */
export function loadConfigFile(
  filePath: string,
  recursiveExtends = true,
  cacheClear = false,
): ConfigSet | void {
  const result = load(path.resolve(filePath), cacheClear)
  if (!result) {
    return
  }
  let files: Set<string> = new Set([result.filePath])
  let config = result.config
  const errs: Error[] = []
  if (recursiveExtends) {
    const extendsResult = recursiveLoad(
      config,
      result.filePath,
      files,
      cacheClear,
    )
    files = extendsResult.files
    config = extendsResult.config
    errs.push(...extendsResult.errs)
  }
  return {
    files,
    config,
    errs,
  }
}
