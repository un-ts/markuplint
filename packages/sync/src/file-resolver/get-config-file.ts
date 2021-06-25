import { Config, ConfigSet, optimizePath } from '@markuplint/file-resolver'

import { recursiveLoad } from './helper'

/**
 * Asynchronously get configuration file.
 *
 * @param filePath A path of configuration file.
 * @param config Configure data.
 * @param recursiveExtends Recursive load by extends options.
 * @param cacheClear Clear cache when loading.
 */
export function getConfigFile(
  filePath: string,
  config: Config,
  recursiveExtends = true,
  cacheClear = false,
): ConfigSet {
  let files: Set<string> = new Set([filePath])
  const errs: Error[] = []

  if (config.excludeFiles) {
    config.excludeFiles = config.excludeFiles.map(globPath =>
      optimizePath(filePath, globPath),
    )
  }

  if (recursiveExtends) {
    const extendsResult = recursiveLoad(config, filePath, files, cacheClear)
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
