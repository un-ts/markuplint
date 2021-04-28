import { tryRequirePkg } from './helper'
import { MLRules } from './types'

export function resolveRules(options: { rules?: MLRules }) {
  return options.rules || tryRequirePkg<MLRules>('../rules')!
}
