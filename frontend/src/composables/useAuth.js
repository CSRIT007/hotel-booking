import { ref, computed } from 'vue'

const user = ref(JSON.parse(localStorage.getItem('hotel_user') || 'null'))

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isStaff = computed(() => user.value?.role === 'staff')

  function setUser(u) {
    user.value = u
    if (u) {
      localStorage.setItem('hotel_user', JSON.stringify(u))
    } else {
      localStorage.removeItem('hotel_user')
    }
  }

  function logout() {
    setUser(null)
  }

  return { user, isLoggedIn, currentUser, isStaff, setUser, logout }
}
