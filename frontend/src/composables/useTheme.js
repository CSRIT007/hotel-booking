import { ref, computed } from 'vue'

export const THEME_STORAGE_KEY = 'hotel_theme'

const theme = ref('light')
let initialized = false
let animating = false

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

export function initTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  theme.value = readStoredTheme() || 'light'
  applyTheme(theme.value)
}

initTheme()

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

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme(event) {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    if (!event || typeof window === 'undefined') {
      setTheme(next)
      return
    }
    revealThemeFromPoint(next, event)
  }

  return { theme, isDark, setTheme, toggleTheme }
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function revealRadius(x, y) {
  return Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
}

function setRevealOrigin(x, y) {
  const root = document.documentElement
  const r = revealRadius(x, y)
  root.style.setProperty('--theme-x', `${x}px`)
  root.style.setProperty('--theme-y', `${y}px`)
  root.style.setProperty('--theme-r', `${Math.ceil(r)}px`)
}

function revealThemeFromPoint(next, event) {
  if (animating) return
  const x = event.clientX ?? window.innerWidth / 2
  const y = event.clientY ?? 24
  setRevealOrigin(x, y)

  if (prefersReducedMotion()) {
    setTheme(next)
    return
  }

  const apply = () => setTheme(next)

  if (typeof document.startViewTransition === 'function') {
    animating = true
    document.documentElement.classList.add('theme-switching')
    const transition = document.startViewTransition(apply)
    transition.finished.finally(() => {
      animating = false
      document.documentElement.classList.remove('theme-switching')
    })
    return
  }

  const root = document.documentElement
  animating = true
  root.classList.add('theme-zoom-prep')
  apply()
  requestAnimationFrame(() => {
    root.classList.add('theme-zoom-run')
    const finish = () => {
      root.classList.remove('theme-zoom-prep', 'theme-zoom-run')
      animating = false
    }
    window.setTimeout(finish, 1650)
  })
}
