<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Dashboard</h1>
    <p class="mt-1 text-stone-600">Summary of bookings, revenue and rooms.</p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style="perspective: 1100px">
      <div class="dash-box rounded-xl border border-blue-200 bg-white p-4" @mousemove="tiltBox" @mouseleave="untiltBox">
        <p class="text-xs font-medium uppercase text-stone-500">Pending requests</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ counts.pending }}</p>
        <router-link to="/admin/bookings?status=pending" class="relative z-10 mt-2 text-sm text-blue-600 hover:underline">View</router-link>
      </div>
      <div class="dash-box rounded-xl border border-green-200 bg-white p-4" @mousemove="tiltBox" @mouseleave="untiltBox">
        <p class="text-xs font-medium uppercase text-stone-500">Collected</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(totalRevenue) }}</p>
        <router-link to="/admin/bookings" class="relative z-10 mt-2 text-sm text-green-600 hover:underline">Folio payments</router-link>
      </div>
      <div class="dash-box rounded-xl border border-stone-200 bg-white p-4" @mousemove="tiltBox" @mouseleave="untiltBox">
        <p class="text-xs font-medium uppercase text-stone-500">Rooms</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ roomCounts.clean }} clean</p>
        <p class="mt-1 text-xs text-stone-500">
          {{ roomCounts.dirty }} dirty · {{ roomCounts.occupied }} occupied · {{ roomCounts.out_of_order }} out of order
        </p>
        <router-link to="/admin/housekeeping" class="relative z-10 mt-2 text-sm text-stone-600 hover:underline">Room status</router-link>
      </div>
      <div
        class="dash-box rounded-xl border bg-white p-4"
        :class="newMessages > 0 ? 'border-red-200' : 'border-stone-200'"
        @mousemove="tiltBox"
        @mouseleave="untiltBox"
      >
        <p class="text-xs font-medium uppercase text-stone-500">New messages</p>
        <p class="mt-1 text-2xl font-bold" :class="newMessages > 0 ? 'text-red-600' : 'text-stone-800'">{{ newMessages }}</p>
        <router-link to="/admin/contacts" class="relative z-10 mt-2 text-sm hover:underline" :class="newMessages > 0 ? 'text-red-600' : 'text-stone-600'">Open inbox</router-link>
      </div>
    </div>

    <!-- Bookings by status -->
    <div class="dash-box mt-8 rounded-xl border border-stone-200 bg-white p-6" @mousemove="tiltBox" @mouseleave="untiltBox">
      <h2 class="font-semibold text-stone-800">Bookings by status</h2>
      <div class="mt-5 space-y-4">
        <router-link
          v-for="row in statusBars"
          :key="row.key"
          :to="`/admin/bookings?status=${row.key}`"
          class="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)_3rem]"
        >
          <span class="text-sm font-medium capitalize text-stone-700">{{ row.label }}</span>
          <div class="h-8 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              class="h-full rounded-full transition-all"
              :class="row.bar"
              :style="{ width: row.pct + '%' }"
            />
          </div>
          <span class="text-right text-sm font-semibold text-stone-800">{{ row.count }}</span>
        </router-link>
      </div>
    </div>

    <!-- Recent bookings table -->
    <div class="dash-box mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white" @mousemove="tiltBox" @mouseleave="untiltBox">
      <div class="border-b border-stone-200 px-4 py-3 flex justify-between items-center">
        <h2 class="font-semibold text-stone-800">Recent bookings</h2>
        <router-link to="/admin/bookings" class="text-sm text-brand-600 hover:underline">View all</router-link>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Check-in / Check-out</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Total</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in recentBookings" :key="b.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ b.id }}</td>
              <td class="px-4 py-3">{{ b.username || b.email || '—' }}</td>
              <td class="px-4 py-3">{{ b.room_name || '—' }} <span v-if="b.hotel_name" class="text-stone-500">({{ b.hotel_name }})</span></td>
              <td class="px-4 py-3">{{ b.check_in }} → {{ b.check_out }}</td>
              <td class="px-4 py-3">{{ formatMoney(b.total_price) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-amber-100 text-amber-800': b.status === 'pending',
                    'bg-green-100 text-green-800': b.status === 'confirmed' || b.status === 'completed',
                    'bg-sky-100 text-sky-800': b.status === 'in_house',
                    'bg-red-100 text-red-800': b.status === 'cancelled' || b.status === 'no_show',
                  }"
                >{{ b.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="bookings.length === 0 && !loading" class="p-4 text-center text-stone-500">No bookings yet.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>

    <div v-if="visibleQuickLinks.length" class="mt-8">
      <h2 class="font-semibold text-stone-800">Quick links</h2>
      <div
        v-if="compactQuickLinks"
        class="dash-box mt-4 rounded-xl border border-stone-200 bg-white p-5"
        @mousemove="tiltBox"
        @mouseleave="untiltBox"
      >
        <div class="relative z-10 flex flex-wrap gap-2">
          <router-link
            v-for="link in visibleQuickLinks"
            :key="link.to"
            :to="link.to"
            class="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-700 hover:border-brand-400 hover:bg-stone-100 hover:text-brand-700"
          >{{ link.label }}</router-link>
        </div>
      </div>
      <div v-else class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" style="perspective: 1100px">
        <section
          v-for="group in quickLinkGroups"
          :key="group.name"
          class="dash-box rounded-xl border border-stone-200 p-4"
          @mousemove="tiltBox"
          @mouseleave="untiltBox"
        >
          <h3 class="relative z-10 text-sm font-semibold text-stone-800">{{ group.name }}</h3>
          <p v-if="group.hint" class="relative z-10 mt-0.5 text-xs text-stone-500">{{ group.hint }}</p>
          <div class="relative z-10 mt-3 grid grid-cols-2 gap-2">
            <router-link
              v-for="link in group.links"
              :key="link.to"
              :to="link.to"
              class="rounded-lg border border-stone-200 bg-white/80 px-3 py-2 text-sm font-medium text-stone-700 hover:border-brand-400 hover:bg-stone-100 hover:text-brand-700"
            >{{ link.label }}</router-link>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBookings, getRooms } from '../../services/data'
import { useStaffAlerts } from '../../composables/useStaffAlerts'
import { useAuth } from '../../composables/useAuth'
import { formatMoney } from '../../utils/money'
import { roomCollected } from '../../services/finance'

const { newMessages } = useStaffAlerts()
const { canAccess, roleLevel } = useAuth()
const bookings = ref([])
const rooms = ref([])
const loading = ref(true)

const GROUP_HINTS = {
  Property: 'Hotels, rooms, stays, and housekeeping',
  POS: 'Sales, products, and transactions',
  Reservations: 'Rates, channels, and availability',
  CRM: 'Campaigns, loyalty, and messages',
  Finance: 'Revenue, expenses, and profit',
  HR: 'Staff, schedules, and payroll',
  Maintenance: 'Requests, schedule, and inventory',
  Analytics: 'Reports and performance',
  Admin: 'Users and activity logs',
}

const quickLinks = [
  { to: '/admin/properties', label: 'Properties', group: 'Property' },
  { to: '/admin/rooms', label: 'Rooms', group: 'Property' },
  { to: '/admin/bookings', label: 'Bookings', group: 'Property' },
  { to: '/admin/guests', label: 'Guests', group: 'Property' },
  { to: '/admin/housekeeping', label: 'Housekeeping', group: 'Property' },
  { to: '/admin/slides', label: 'Slideshow', group: 'Property' },
  { to: '/admin/pos-sales', label: 'Sales', group: 'POS' },
  { to: '/admin/pos-products', label: 'Products', group: 'POS' },
  { to: '/admin/pos-transactions', label: 'Transactions', group: 'POS' },
  { to: '/admin/crs-rates', label: 'Rates', group: 'Reservations' },
  { to: '/admin/crs-channels', label: 'Channels', group: 'Reservations' },
  { to: '/admin/crs-availability', label: 'Availability', group: 'Reservations' },
  { to: '/admin/crm-campaigns', label: 'Campaigns', group: 'CRM' },
  { to: '/admin/crm-loyalty', label: 'Loyalty', group: 'CRM' },
  { to: '/admin/crm-communications', label: 'Communications', group: 'CRM' },
  { to: '/admin/contacts', label: 'Messages', group: 'CRM' },
  { to: '/admin/finance-revenue', label: 'Revenue', group: 'Finance' },
  { to: '/admin/finance-expense', label: 'Expenses', group: 'Finance' },
  { to: '/admin/finance-profit', label: 'Profit', group: 'Finance' },
  { to: '/admin/hr-employees', label: 'Employee information', group: 'HR' },
  { to: '/admin/hr-org', label: 'Departments', group: 'HR' },
  { to: '/admin/hr-schedules', label: 'Schedules', group: 'HR' },
  { to: '/admin/hr-payroll', label: 'Payroll', group: 'HR' },
  { to: '/admin/hr-leaves', label: 'Leaves', group: 'HR' },
  { to: '/admin/maintenance-requests', label: 'Requests', group: 'Maintenance' },
  { to: '/admin/maintenance-schedule', label: 'Schedule', group: 'Maintenance' },
  { to: '/admin/maintenance-inventory', label: 'Inventory', group: 'Maintenance' },
  { to: '/admin/reports', label: 'Reports', group: 'Analytics' },
  { to: '/admin/analytics-kpi', label: 'KPIs', group: 'Analytics' },
  { to: '/admin/users', label: 'Users', group: 'Admin' },
  { to: '/admin/audit-log', label: 'Audit log', group: 'Admin' },
  { to: '/admin/login-activity', label: 'Login activity', group: 'Admin' },
]

const visibleQuickLinks = computed(() => quickLinks.filter((item) => canAccess(item.to)))
const compactQuickLinks = computed(() => roleLevel.value < 2)
const quickLinkGroups = computed(() => {
  const groups = []
  const index = new Map()
  for (const link of visibleQuickLinks.value) {
    const name = link.group || 'More'
    if (!index.has(name)) {
      index.set(name, groups.length)
      groups.push({ name, hint: GROUP_HINTS[name] || '', links: [] })
    }
    groups[index.get(name)].links.push(link)
  }
  for (const group of groups) {
    if (group.name === 'Admin' && !group.links.some((link) => link.to === '/admin/users')) {
      group.hint = 'Activity logs'
    }
  }
  return groups
})

const counts = computed(() => {
  const c = { pending: 0, confirmed: 0, in_house: 0, cancelled: 0, completed: 0, no_show: 0 }
  bookings.value.forEach((b) => {
    if (c[b.status] !== undefined) c[b.status]++
  })
  return c
})

const statusBars = computed(() => {
  const max = Math.max(
    counts.value.pending,
    counts.value.confirmed,
    counts.value.in_house,
    counts.value.cancelled,
    counts.value.completed,
    counts.value.no_show,
    1
  )
  return [
    { key: 'pending', label: 'Pending', bar: 'bg-amber-400' },
    { key: 'confirmed', label: 'Confirmed', bar: 'bg-green-500' },
    { key: 'in_house', label: 'In-house', bar: 'bg-sky-500' },
    { key: 'cancelled', label: 'Cancelled', bar: 'bg-red-400' },
    { key: 'no_show', label: 'No-show', bar: 'bg-stone-400' },
    { key: 'completed', label: 'Completed', bar: 'bg-emerald-600' },
  ].map((row) => {
    const count = counts.value[row.key]
    return { ...row, count, pct: Math.round((count / max) * 100) }
  })
})

const totalRevenue = computed(() => {
  return bookings.value
    .filter((b) => b.status === 'confirmed' || b.status === 'in_house' || b.status === 'completed')
    .reduce((sum, b) => sum + roomCollected(b), 0)
})

const roomCounts = computed(() => {
  const count = (status) => rooms.value.filter((r) => r.ops_status === status).length
  return {
    total: rooms.value.length,
    clean: count('clean'),
    dirty: count('dirty'),
    occupied: count('occupied'),
    out_of_order: count('out_of_order'),
  }
})

const recentBookings = computed(() => bookings.value.slice(0, 5))

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function tiltBox(e) {
  if (reduceMotion) return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width
  const py = (e.clientY - r.top) / r.height
  el.style.setProperty('--rx', `${((0.5 - py) * 10).toFixed(2)}deg`)
  el.style.setProperty('--ry', `${((px - 0.5) * 12).toFixed(2)}deg`)
}

function untiltBox(e) {
  e.currentTarget.style.setProperty('--rx', '0deg')
  e.currentTarget.style.setProperty('--ry', '0deg')
}

onMounted(async () => {
  loading.value = true
  try {
    bookings.value = await getBookings()
    rooms.value = await getRooms()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
