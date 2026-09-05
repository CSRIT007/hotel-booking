<template>
  <div class="flex min-h-screen bg-stone-100 dark:bg-stone-950">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-stone-200 bg-stone-800 text-white transition-transform lg:translate-x-0 dark:border-stone-800 dark:bg-stone-950"
      :class="{ '-translate-x-full': !sidebarOpen }"
    >
      <div class="flex h-14 items-center justify-between border-b border-stone-700 px-4">
        <router-link to="/admin" class="font-semibold text-white">Smile Hotel</router-link>
        <button type="button" class="lg:hidden rounded p-2 hover:bg-stone-700" @click="sidebarOpen = false" aria-label="Close menu">
          <span class="text-lg">×</span>
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto py-4 text-sm">
        <router-link :to="{ name: 'AdminDashboard' }" class="admin-nav" :class="{ 'admin-nav-active': isDashboard }">
          <span class="w-6 text-center">▣</span> Dashboard
        </router-link>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('pms')">
            <span><span class="w-6 text-center inline-block">🏨</span> Property (PMS)</span>
            <span>{{ openGroup === 'pms' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'pms'" class="admin-sub">
            <router-link to="/admin/properties" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/properties') }">Properties</router-link>
            <router-link to="/admin/rooms" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/rooms') }">Rooms</router-link>
            <router-link to="/admin/bookings" class="admin-sub-link flex items-center justify-between" :class="{ 'admin-sub-active': isActive('/admin/bookings') }">
              <span>Bookings</span>
              <span v-if="pendingBookings > 0" class="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-semibold text-stone-900">{{ pendingBookings }}</span>
            </router-link>
            <router-link to="/admin/guests" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/guests') }">Guests</router-link>
            <router-link to="/admin/housekeeping" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/housekeeping') }">Housekeeping</router-link>
            <router-link to="/admin/slides" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/slides') }">Slideshow</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('pos')">
            <span><span class="w-6 text-center inline-block">🛒</span> POS System</span>
            <span>{{ openGroup === 'pos' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'pos'" class="admin-sub">
            <router-link to="/admin/pos-sales" class="admin-sub-link">Sales</router-link>
            <router-link to="/admin/pos-products" class="admin-sub-link">Products</router-link>
            <router-link to="/admin/pos-transactions" class="admin-sub-link">Transactions</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('crs')">
            <span><span class="w-6 text-center inline-block">🌐</span> Reservations (CRS)</span>
            <span>{{ openGroup === 'crs' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'crs'" class="admin-sub">
            <router-link to="/admin/crs-rates" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crs-rates') }">Rates</router-link>
            <router-link to="/admin/crs-channels" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crs-channels') }">Channels</router-link>
            <router-link to="/admin/crs-availability" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crs-availability') }">Availability</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('crm')">
            <span><span class="w-6 text-center inline-block">👥</span> CRM</span>
            <span>{{ openGroup === 'crm' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'crm'" class="admin-sub">
            <router-link to="/admin/crm-campaigns" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crm-campaigns') }">Campaigns</router-link>
            <router-link to="/admin/crm-loyalty" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crm-loyalty') }">Loyalty</router-link>
            <router-link to="/admin/crm-communications" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/crm-communications') }">Communications</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('finance')">
            <span><span class="w-6 text-center inline-block">💰</span> Finance</span>
            <span>{{ openGroup === 'finance' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'finance'" class="admin-sub">
            <router-link to="/admin/finance-revenue" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/finance-revenue') }">Revenue</router-link>
            <router-link to="/admin/finance-expense" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/finance-expense') }">Expenses</router-link>
            <router-link to="/admin/finance-profit" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/finance-profit') }">Profit</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('hr')">
            <span><span class="w-6 text-center inline-block">👤</span> HR</span>
            <span>{{ openGroup === 'hr' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'hr'" class="admin-sub">
            <router-link to="/admin/hr-employees" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/hr-employees') }">Employee information</router-link>
            <router-link to="/admin/hr-org" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/hr-org') }">Departments</router-link>
            <router-link to="/admin/hr-schedules" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/hr-schedules') }">Schedules</router-link>
            <router-link to="/admin/hr-payroll" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/hr-payroll') }">Payroll</router-link>
            <router-link to="/admin/hr-leaves" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/hr-leaves') }">Leaves</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('maintenance')">
            <span><span class="w-6 text-center inline-block">🔧</span> Maintenance</span>
            <span>{{ openGroup === 'maintenance' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'maintenance'" class="admin-sub">
            <router-link to="/admin/maintenance-requests" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/maintenance-requests') }">Requests</router-link>
            <router-link to="/admin/maintenance-schedule" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/maintenance-schedule') }">Schedule</router-link>
            <router-link to="/admin/maintenance-inventory" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/maintenance-inventory') }">Inventory</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('analytics')">
            <span><span class="w-6 text-center inline-block">📊</span> Analytics</span>
            <span>{{ openGroup === 'analytics' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'analytics'" class="admin-sub">
            <router-link to="/admin/reports" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/reports') }">Reports</router-link>
            <router-link to="/admin/analytics-kpi" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/analytics-kpi') }">KPIs</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('admin')">
            <span><span class="w-6 text-center inline-block">🛡</span> Admin</span>
            <span>{{ openGroup === 'admin' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'admin'" class="admin-sub">
            <router-link to="/admin/users" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/users') }">User management</router-link>
            <router-link to="/admin/audit-log" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/audit-log') }">Audit log</router-link>
            <router-link to="/admin/login-activity" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/login-activity') }">Login activity</router-link>
            <router-link to="/admin/security" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/security') }">Security</router-link>
          </div>
        </div>
      </nav>
      <div class="border-t border-stone-700 p-3 space-y-1">
        <p class="px-4 py-1 text-xs text-stone-400">Signed in as {{ currentUser?.username }}</p>
        <a href="/" target="_blank" class="admin-nav block">↗ View site</a>
        <button type="button" class="admin-nav w-full text-left" @click="requestLogout">Logout</button>
      </div>
    </aside>

    <div class="flex flex-1 flex-col lg:ml-64">
      <header class="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-900">
        <button type="button" class="rounded p-2 lg:hidden hover:bg-stone-100 dark:hover:bg-stone-800" @click="sidebarOpen = true" aria-label="Open menu">☰</button>
        <h1 class="text-lg font-semibold text-stone-800">{{ route.meta.title || 'Admin' }}</h1>
        <div class="ml-auto flex items-center gap-3">
          <router-link
            v-if="pendingBookings > 0"
            to="/admin/bookings?status=pending"
            class="hidden rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 sm:inline-flex"
          >
            {{ pendingBookings }} booking request{{ pendingBookings === 1 ? '' : 's' }}
          </router-link>
          <router-link
            to="/admin/contacts"
            class="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            :class="{ 'bg-stone-100 dark:bg-stone-800': isActive('/admin/contacts') }"
          >
            Messages
            <span
              v-if="newMessages > 0"
              class="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
            >{{ newMessages }}</span>
          </router-link>
          <ThemeToggle />
        </div>
      </header>
      <main class="relative flex-1 p-4 md:p-6">
        <div
          v-if="toast"
          class="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-red-200 bg-white px-4 py-3 text-sm shadow-lg"
        >
          <p class="font-semibold text-stone-800">{{ toast }}</p>
          <p v-if="latestMessage" class="mt-1 text-stone-600">{{ latestMessage.subject || 'Open Messages to read it.' }}</p>
          <div class="mt-2 flex gap-3">
            <router-link to="/admin/contacts" class="font-medium text-red-700 hover:underline" @click="dismissToast">Open</router-link>
            <button type="button" class="text-stone-500 hover:underline" @click="dismissToast">Dismiss</button>
          </div>
        </div>
        <router-view />
      </main>
    </div>
  </div>
  <ConfirmModal
    :open="showLogoutConfirm"
    title="Log out?"
    message="Are you sure you want to log out?"
    confirm-text="Log out"
    cancel-text="Cancel"
    @confirm="confirmLogout"
    @cancel="showLogoutConfirm = false"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useStaffAlerts } from '../composables/useStaffAlerts'
import ThemeToggle from '../components/ThemeToggle.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const { logout: doLogout, currentUser } = useAuth()
const { newMessages, pendingBookings, latestMessage, toast, refresh, dismissToast } = useStaffAlerts()
const sidebarOpen = ref(true)
const openGroup = ref('')
const showLogoutConfirm = ref(false)
const isDashboard = computed(() => route.name === 'AdminDashboard')

function isActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function groupForPath(path) {
  if (path === '/admin' || path === '/admin/') return ''
  if (
    path.startsWith('/admin/bookings') ||
    path.startsWith('/admin/rooms') ||
    path.startsWith('/admin/properties') ||
    path.startsWith('/admin/guests') ||
    path.startsWith('/admin/housekeeping') ||
    path.startsWith('/admin/slides')
  ) return 'pms'
  if (path.startsWith('/admin/pos')) return 'pos'
  if (path.startsWith('/admin/crs')) return 'crs'
  if (path.startsWith('/admin/crm')) return 'crm'
  if (path.startsWith('/admin/finance')) return 'finance'
  if (path.startsWith('/admin/hr')) return 'hr'
  if (path.startsWith('/admin/maintenance')) return 'maintenance'
  if (path.startsWith('/admin/reports') || path.startsWith('/admin/analytics')) return 'analytics'
  if (
    path.startsWith('/admin/audit-log') ||
    path.startsWith('/admin/users') ||
    path.startsWith('/admin/login-activity') ||
    path.startsWith('/admin/security')
  ) return 'admin'
  return null
}
function toggle(group) {
  openGroup.value = openGroup.value === group ? '' : group
}
function requestLogout() {
  showLogoutConfirm.value = true
}
function confirmLogout() {
  showLogoutConfirm.value = false
  doLogout()
  router.push({ name: 'AdminLogin' })
}

watch([newMessages, () => route.meta.title], () => {
  const base = route.meta.title ? `${route.meta.title} — Smile Hotel` : 'Smile Hotel'
  document.title = newMessages.value > 0 ? `(${newMessages.value}) ${base}` : base
})

watch(() => route.path, (path) => {
  refresh()
  const group = groupForPath(path)
  if (group !== null) openGroup.value = group
}, { immediate: true })
</script>

<style scoped>
.admin-nav {
  @apply flex items-center gap-2 px-4 py-2.5 text-stone-300 hover:bg-stone-700 hover:text-white transition;
}
.admin-nav-active {
  @apply bg-blue-900/30 text-blue-200;
}
.admin-sub {
  @apply border-l-2 border-stone-600 ml-4 pl-2 space-y-0.5;
}
.admin-sub-link {
  @apply flex items-center justify-between py-1.5 px-2 rounded text-stone-400 hover:text-white hover:bg-stone-700 text-sm;
}
.admin-sub-active {
  @apply text-blue-300 bg-stone-700;
}
</style>
