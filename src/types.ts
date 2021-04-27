import { exec } from 'markuplint'

// eslint-disable-next-line @typescript-eslint/no-type-alias
export type MarkupLintOptions = Parameters<typeof exec>[0]
