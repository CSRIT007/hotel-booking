import { ref, computed } from 'vue'

export const THEME_STORAGE_KEY = 'hotel_theme'

const theme = ref('light')
let mediaQuery
let initialized = false

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return null
}

function applyTheme(value) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', value === 'dark')
  document.documentElement.style.colorScheme = value
}

function onSystemChange(event) {
  if (readStoredTheme()) return
  theme.value = event.matches ? 'dark' : 'light'
  applyTheme(theme.value)
}

export function initTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  theme.value = readStoredTheme() || getSystemTheme()
  applyTheme(theme.value)
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', onSystemChange)
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(onSystemChange)
  }
}

initTheme()

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(value) {
    if (value !== 'light' && value !== 'dark') return
    theme.value = value
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, isDark, setTheme, toggleTheme }
}
