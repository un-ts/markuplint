import osLocale from 'os-locale'

import { I18n, LocaleSet } from '@markuplint/i18n'

let cachedLocale: string | null = null

function getLocale() {
  if (!cachedLocale) {
    cachedLocale = osLocale.sync({ spawn: true })
  }
  return cachedLocale
}

export function i18n(locale?: string) {
  locale = locale || getLocale() || ''
  const langCode = locale.split('-')[0]
  let localeSet: LocaleSet | null = null
  if (langCode) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      localeSet = require(`@markuplint/i18n/locales/${langCode}`) as LocaleSet
    } catch {
      // ignore
    }
  }
  return I18n.create(localeSet)
}
