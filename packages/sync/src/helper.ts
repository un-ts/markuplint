export function tryRequirePkg<T>(pkg: string): T | undefined
export function tryRequirePkg<T>(pkg: string, throwError: true): T
export function tryRequirePkg<T>(
  pkg: string,
  throwError?: boolean,
): T | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const result = require(pkg) as T | { default: T }
    return 'default' in result ? result.default : result
  } catch (err) {
    if (throwError) {
      throw err
    }
  }
}
