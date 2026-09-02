import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './useAuth'

export const IDLE_LIMIT_MS = 5 * 60 * 1000
export const IDLE_WARN_MS = 30 * 1000
const ACTIVITY_KEY = 'hotel_last_activity'
const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove']

export function useIdleLogout() {
  const router = useRouter()
  const { isLoggedIn, isStaff, logout } = useAuth()
  const now = ref(Date.now())
  const showIdleWarning = ref(false)

  let intervalId = 0
  let lastBump = 0

  const remainingMs = computed(() => {
    if (!isLoggedIn.value) return IDLE_LIMIT_MS
    const last = Number(localStorage.getItem(ACTIVITY_KEY) || Date.now())
    return Math.max(0, last + IDLE_LIMIT_MS - now.value)
  })

  const secondsLeft = computed(() => Math.ceil(remainingMs.value / 1000))

  function bump() {
    if (!isLoggedIn.value) return
    const t = Date.now()
    if (t - lastBump < 800) return
    lastBump = t
    localStorage.setItem(ACTIVITY_KEY, String(t))
    showIdleWarning.value = false
    now.value = t
  }

  function expireSession() {
    if (!isLoggedIn.value) return
    const path = router.currentRoute.value.fullPath
    const staff = isStaff.value
    const onAdmin = path.startsWith('/admin')
    logout()
    localStorage.removeItem(ACTIVITY_KEY)
    showIdleWarning.value = false
    const loginName = staff || onAdmin ? 'AdminLogin' : 'Login'
    router.replace({ name: loginName, query: { idle: '1', redirect: path } })
  }

  function staySignedIn() {
    lastBump = 0
    bump()
  }

  function tick() {
    now.value = Date.now()
    if (!isLoggedIn.value) {
      showIdleWarning.value = false
      return
    }
    const last = Number(localStorage.getItem(ACTIVITY_KEY) || 0)
    if (!last) {
      bump()
      return
    }
    const idleFor = now.value - last
    if (idleFor >= IDLE_LIMIT_MS) {
      expireSession()
      return
    }
    showIdleWarning.value = idleFor >= IDLE_LIMIT_MS - IDLE_WARN_MS
  }

  function onStorage(e) {
    if (e.key === 'hotel_user' && !e.newValue && isLoggedIn.value) {
      logout()
      showIdleWarning.value = false
    }
    if (e.key === ACTIVITY_KEY) {
      now.value = Date.now()
      showIdleWarning.value = false
    }
  }

  onMounted(() => {
    EVENTS.forEach((name) => window.addEventListener(name, bump, { passive: true }))
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', tick)
    intervalId = window.setInterval(tick, 1000)
    if (isLoggedIn.value) {
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || 0)
      if (last && Date.now() - last >= IDLE_LIMIT_MS) expireSession()
      else bump()
    }
  })

  onUnmounted(() => {
    EVENTS.forEach((name) => window.removeEventListener(name, bump))
    window.removeEventListener('storage', onStorage)
    document.removeEventListener('visibilitychange', tick)
    window.clearInterval(intervalId)
  })

  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) staySignedIn()
    else {
      localStorage.removeItem(ACTIVITY_KEY)
      showIdleWarning.value = false
    }
  })

  return { showIdleWarning, secondsLeft, staySignedIn }
}
