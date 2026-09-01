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
        <router-link to="/admin" class="admin-nav" :class="{ 'admin-nav-active': isActive('/admin') && !isActive('/admin/', true) }">
          <span class="w-6 text-center">▣</span> Dashboard
        </router-link>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('pms')">
            <span><span class="w-6 text-center inline-block">🏨</span> Property (PMS)</span>
            <span>{{ openGroup === 'pms' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'pms'" class="admin-sub">
            <router-link to="/admin/rooms" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/rooms') }">Rooms</router-link>
            <router-link to="/admin/bookings" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/bookings') }">Bookings</router-link>
            <router-link to="/admin/guests" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/guests') }">Guests</router-link>
            <router-link to="/admin/housekeeping" class="admin-sub-link" :class="{ 'admin-sub-active': isActive('/admin/housekeeping') }">Housekeeping</router-link>
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
            <router-link to="/admin/crs-rates" class="admin-sub-link">Rates</router-link>
            <router-link to="/admin/crs-channels" class="admin-sub-link">Channels</router-link>
            <router-link to="/admin/crs-availability" class="admin-sub-link">Availability</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('crm')">
            <span><span class="w-6 text-center inline-block">👥</span> CRM</span>
            <span>{{ openGroup === 'crm' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'crm'" class="admin-sub">
            <router-link to="/admin/crm-campaigns" class="admin-sub-link">Campaigns</router-link>
            <router-link to="/admin/crm-loyalty" class="admin-sub-link">Loyalty</router-link>
            <router-link to="/admin/crm-communications" class="admin-sub-link">Communications</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('finance')">
            <span><span class="w-6 text-center inline-block">💰</span> Finance</span>
            <span>{{ openGroup === 'finance' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'finance'" class="admin-sub">
            <router-link to="/admin/finance-revenue" class="admin-sub-link">Revenue</router-link>
            <router-link to="/admin/finance-expense" class="admin-sub-link">Expenses</router-link>
            <router-link to="/admin/finance-profit" class="admin-sub-link">Profit</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('hr')">
            <span><span class="w-6 text-center inline-block">👤</span> HR</span>
            <span>{{ openGroup === 'hr' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'hr'" class="admin-sub">
            <router-link to="/admin/hr-employees" class="admin-sub-link">Employees</router-link>
            <router-link to="/admin/hr-schedules" class="admin-sub-link">Schedules</router-link>
            <router-link to="/admin/hr-payroll" class="admin-sub-link">Payroll</router-link>
            <router-link to="/admin/hr-leaves" class="admin-sub-link">Leaves</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('maintenance')">
            <span><span class="w-6 text-center inline-block">🔧</span> Maintenance</span>
            <span>{{ openGroup === 'maintenance' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'maintenance'" class="admin-sub">
            <router-link to="/admin/maintenance-requests" class="admin-sub-link">Requests</router-link>
            <router-link to="/admin/maintenance-schedule" class="admin-sub-link">Schedule</router-link>
            <router-link to="/admin/maintenance-inventory" class="admin-sub-link">Inventory</router-link>
          </div>
        </div>

        <div class="admin-nav-group">
          <button type="button" class="admin-nav w-full justify-between" @click="toggle('analytics')">
            <span><span class="w-6 text-center inline-block">📊</span> Analytics</span>
            <span>{{ openGroup === 'analytics' ? '▼' : '▶' }}</span>
          </button>
          <div v-show="openGroup === 'analytics'" class="admin-sub">
            <router-link to="/admin/reports" class="admin-sub-link">Reports</router-link>
            <router-link to="/admin/analytics-kpi" class="admin-sub-link">KPIs</router-link>
          </div>
        </div>

        <router-link to="/admin/contacts" class="admin-nav" :class="{ 'admin-nav-active': isActive('/admin/contacts') }">
          <span class="w-6 text-center">✉</span> Messages
        </router-link>
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
        <h1 class="flex-1 text-lg font-semibold text-stone-800">Admin</h1>
        <ThemeToggle />
      </header>
      <main class="flex-1 p-4 md:p-6">
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
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import ThemeToggle from '../components/ThemeToggle.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const { logout: doLogout, currentUser } = useAuth()
const sidebarOpen = ref(true)
const openGroup = ref('pms')
const showLogoutConfirm = ref(false)

function isActive(path, exactOnly) {
  if (exactOnly) return route.path.startsWith(path) && route.path !== path
  return route.path === path || (path !== '/admin' && route.path.startsWith(path))
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

watch(() => route.path, (path) => {
  if (path.startsWith('/admin/bookings') || path.startsWith('/admin/rooms') || path.startsWith('/admin/guests') || path.startsWith('/admin/housekeeping')) openGroup.value = 'pms'
  else if (path.startsWith('/admin/pos')) openGroup.value = 'pos'
  else if (path.startsWith('/admin/crs')) openGroup.value = 'crs'
  else if (path.startsWith('/admin/crm')) openGroup.value = 'crm'
  else if (path.startsWith('/admin/finance')) openGroup.value = 'finance'
  else if (path.startsWith('/admin/hr')) openGroup.value = 'hr'
  else if (path.startsWith('/admin/maintenance')) openGroup.value = 'maintenance'
  else if (path.startsWith('/admin/reports') || path.startsWith('/admin/analytics')) openGroup.value = 'analytics'
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
  @apply block py-1.5 px-2 rounded text-stone-400 hover:text-white hover:bg-stone-700 text-sm;
}
.admin-sub-active {
  @apply text-blue-300 bg-stone-700;
}
</style>
