import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'ponto-facil.theme'

interface ThemeContextValue {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (value: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

function applyThemeClass(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredPreference(),
  )
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  const resolved: ResolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    applyThemeClass(resolved)
  }, [resolved])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value)
    window.localStorage.setItem(STORAGE_KEY, value)
  }, [])

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}
