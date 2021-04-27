import { recursiveLoad, search } from './helper'

import { ConfigSet } from '@markuplint/file-resolver'

/**
 * Asynchronously search configuration file from linting target file.
 *
 * @param baseDirOrTargetFilePath A path of linting target file. To be base directory for searching. (ex. `"path/to/target.html"`)
 * @param recursiveExtends Recursive load by extends options.
 * @param cacheClear Clear cache when loading.
 */
export function searchConfigFile(
  baseDirOrTargetFilePath: string,
  recursiveExtends = true,
  cacheClear = false,
): ConfigSet | void {
  const result = search(baseDirOrTargetFilePath, cacheClear)
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
