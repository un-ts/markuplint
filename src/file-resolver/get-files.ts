import glob from 'glob'

import { getFile } from './get-file'
import { MLFile } from './ml-file'

/**
 * Get files
 *
 * Supported glob patterns
 *
 * @param filePathOrGlob
 */
export function getFiles(filePathOrGlob: string): MLFile[] {
  try {
    const fileList = glob.sync(filePathOrGlob)
    return fileList.map(getFile)
  } catch {
    return []
  }
}
