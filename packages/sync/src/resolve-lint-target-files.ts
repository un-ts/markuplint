import { MarkupLintOptions } from './types'
import { getAnonymousFile, getFiles, MLFile } from './file-resolver'

// eslint-disable-next-line sonarjs/cognitive-complexity
export function resolveLintTargetFiles(options: MarkupLintOptions) {
  // Resolve files
  const files: MLFile[] = []
  if (options.files) {
    const filePaths = Array.isArray(options.files)
      ? options.files
      : [options.files]
    for (const filePath of filePaths) {
      files.push(...getFiles(filePath))
      if (files.length === 0) {
        throw new Error(`"${String(options.files)}" is not found.`)
      }
    }
  } else if (options.sourceCodes) {
    const codes = Array.isArray(options.sourceCodes)
      ? options.sourceCodes
      : [options.sourceCodes]
    const names = Array.isArray(options.names)
      ? options.names
      : options.names
      ? [options.names]
      : []
    files.push(
      ...codes.map((code, i) =>
        getAnonymousFile(code, options.workspace, names[i]),
      ),
    )
  }

  return files
}
