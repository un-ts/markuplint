import osLocale from 'os-locale'
import { I18n, LocaleSet } from '@markuplint/i18n'

import { tryRequirePkg } from './helper'

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
    localeSet = tryRequirePkg<LocaleSet>(
      `@markuplint/i18n/locales/${langCode}`,
    )!
  }
  return I18n.create(localeSet)
}
