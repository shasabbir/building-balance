
'use client'

import * as React from 'react'
import { en } from '@/lib/locales/en'
import { bn } from '@/lib/locales/bn'

type Language = 'en' | 'bn'

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, options?: { [key: string]: string | number }) => string
}

const translations = { en, bn }

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>('en')
  
  React.useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language | null
    if (storedLang && (storedLang === 'en' || storedLang === 'bn')) {
      setLanguageState(storedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const langFile = translations[language]
    let text = getNestedValue(langFile, key)

    if (options) {
      Object.keys(options).forEach(k => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(options[k]))
      })
    }
    
    return text
  }

  const value = { language, setLanguage, t }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
