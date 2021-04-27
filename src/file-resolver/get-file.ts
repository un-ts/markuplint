import { MLFile } from './ml-file'

export function getFile(filePath: string) {
  return new MLFile(filePath)
}
