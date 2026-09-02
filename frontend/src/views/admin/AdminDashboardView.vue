<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Dashboard</h1>
    <p class="mt-1 text-stone-600">Summary of bookings, revenue and rooms.</p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <router-link
        v-for="item in shortcutItems"
        :key="item.to"
        :to="item.to"
        class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700"
      >
        {{ item.label }}
        <span class="mt-1 block text-xs font-normal text-stone-500">{{ item.hint }}</span>
      </router-link>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Pending requests</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ counts.pending }}</p>
        <router-link to="/admin/bookings?status=pending" class="mt-2 text-sm text-blue-600 hover:underline">View</router-link>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Revenue</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(totalRevenue) }}</p>
        <router-link to="/admin/bookings" class="mt-2 text-sm text-green-600 hover:underline">Bookings</router-link>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Rooms</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ roomCounts.available }} / {{ roomCounts.total }}</p>
        <router-link to="/admin/rooms" class="mt-2 text-sm text-stone-600 hover:underline">Add / remove rooms</router-link>
      </div>
      <div
        class="rounded-xl border bg-white p-4 shadow-sm"
        :class="newMessages > 0 ? 'border-red-200' : 'border-stone-200'"
      >
        <p class="text-xs font-medium uppercase text-stone-500">New messages</p>
        <p class="mt-1 text-2xl font-bold" :class="newMessages > 0 ? 'text-red-600' : 'text-stone-800'">{{ newMessages }}</p>
        <router-link to="/admin/contacts" class="mt-2 text-sm hover:underline" :class="newMessages > 0 ? 'text-red-600' : 'text-stone-600'">Open inbox</router-link>
      </div>
    </div>

    <!-- Bookings by status -->
    <div class="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
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
    <div class="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
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
                    'bg-red-100 text-red-800': b.status === 'cancelled',
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

    <div class="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-stone-800">Quick links</h2>
      <div class="mt-3 space-y-3 text-sm">
        <div
          v-for="(row, i) in quickLinkRows"
          :key="i"
          class="flex justify-between gap-x-3"
        >
          <router-link
            v-for="link in row"
            :key="link.to"
            :to="link.to"
            class="shrink-0 whitespace-nowrap text-brand-600 hover:underline"
          >{{ link.label }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBookings, getRooms } from '../../services/data'
import { useStaffAlerts } from '../../composables/useStaffAlerts'
import { formatMoney } from '../../utils/money'

const { newMessages } = useStaffAlerts()
const bookings = ref([])
const rooms = ref([])
const loading = ref(true)

const shortcutItems = [
  { to: '/admin/properties', label: 'Properties', hint: 'Add or remove hotels' },
  { to: '/admin/bookings', label: 'Bookings', hint: 'Guest stays and requests' },
  { to: '/admin/hr-employees', label: 'Employee information', hint: 'Staff directory and positions' },
  { to: '/admin/maintenance-requests', label: 'Requests', hint: 'Repair and work orders' },
  { to: '/admin/analytics-kpi', label: 'KPI', hint: 'Performance indicators' },
  { to: '/admin/audit-log', label: 'Audit log', hint: 'Who changed what' },
  { to: '/admin/security', label: 'Security', hint: 'Locks and protections' },
  { to: '/admin/contacts', label: 'Messages', hint: 'Guest contact inbox' },
]

const quickLinks = [
  { to: '/admin/properties', label: 'Properties' },
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/guests', label: 'Guests' },
  { to: '/admin/housekeeping', label: 'Housekeeping' },
  { to: '/admin/pos-sales', label: 'Sales' },
  { to: '/admin/crs-rates', label: 'Rates' },
  { to: '/admin/crm-campaigns', label: 'Campaigns' },
  { to: '/admin/crm-loyalty', label: 'Loyalty' },
  { to: '/admin/crm-communications', label: 'Communications' },
  { to: '/admin/finance-revenue', label: 'Revenue' },
  { to: '/admin/finance-expense', label: 'Expenses' },
  { to: '/admin/finance-profit', label: 'Profit' },
  { to: '/admin/hr-employees', label: 'Employee information' },
  { to: '/admin/hr-org', label: 'Departments' },
  { to: '/admin/hr-schedules', label: 'Schedules' },
  { to: '/admin/hr-payroll', label: 'Payroll' },
  { to: '/admin/hr-leaves', label: 'Leaves' },
  { to: '/admin/maintenance-requests', label: 'Requests' },
  { to: '/admin/maintenance-schedule', label: 'Schedule' },
  { to: '/admin/maintenance-inventory', label: 'Inventory' },
  { to: '/admin/analytics-kpi', label: 'KPI' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/audit-log', label: 'Audit log' },
  { to: '/admin/security', label: 'Security' },
  { to: '/admin/contacts', label: 'Messages' },
]

const quickLinkRows = computed(() => {
  const mid = Math.ceil(quickLinks.length / 2)
  return [quickLinks.slice(0, mid), quickLinks.slice(mid)]
})

const counts = computed(() => {
  const c = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  bookings.value.forEach((b) => {
    if (c[b.status] !== undefined) c[b.status]++
  })
  return c
})

const statusBars = computed(() => {
  const max = Math.max(counts.value.pending, counts.value.confirmed, counts.value.cancelled, counts.value.completed, 1)
  return [
    { key: 'pending', label: 'Pending', bar: 'bg-amber-400' },
    { key: 'confirmed', label: 'Confirmed', bar: 'bg-green-500' },
    { key: 'cancelled', label: 'Cancelled', bar: 'bg-red-400' },
    { key: 'completed', label: 'Completed', bar: 'bg-emerald-600' },
  ].map((row) => {
    const count = counts.value[row.key]
    return { ...row, count, pct: Math.round((count / max) * 100) }
  })
})

const totalRevenue = computed(() => {
  return bookings.value
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0)
})

const roomCounts = computed(() => {
  const total = rooms.value.length
  const available = rooms.value.filter((r) => r.status === 'available').length
  return { total, available }
})

const recentBookings = computed(() => bookings.value.slice(0, 5))

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
