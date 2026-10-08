import { ref, computed } from 'vue'
import { canAccessAdminPath, isHotelStaff, staffLevel } from '../utils/roles'
import { canExportReport, canViewReport, reportGroupsForRole } from '../utils/reports'

const user = ref(JSON.parse(localStorage.getItem('hotel_user') || 'null'))

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const isStaff = computed(() => isHotelStaff(user.value?.role))
  const roleLevel = computed(() => staffLevel(user.value?.role))
  const canAccess = (path) => canAccessAdminPath(user.value?.role, path)
  const canView = (reportId) => canViewReport(user.value?.role, reportId)
  const canExport = (reportId) => canExportReport(user.value?.role, reportId)
  const reportGroups = computed(() => reportGroupsForRole(user.value?.role))

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

  return { user, isLoggedIn, currentUser, isStaff, roleLevel, canAccess, canView, canExport, reportGroups, setUser, logout }
}
