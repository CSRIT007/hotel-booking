<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Dashboard</h1>
    <p class="mt-1 text-stone-600">Summary of bookings, revenue and rooms.</p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <router-link to="/admin/properties" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Properties
        <span class="mt-1 block text-xs font-normal text-stone-500">Add or remove hotels</span>
      </router-link>
      <router-link to="/admin/rooms" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Rooms
        <span class="mt-1 block text-xs font-normal text-stone-500">Add or remove rooms</span>
      </router-link>
      <router-link to="/admin/contacts" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Messages
        <span class="mt-1 block text-xs font-normal text-stone-500">Guest contact inbox</span>
      </router-link>
      <router-link to="/admin/users" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Users
        <span class="mt-1 block text-xs font-normal text-stone-500">Staff and guest accounts</span>
      </router-link>
      <router-link to="/admin/audit-log" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Audit log
        <span class="mt-1 block text-xs font-normal text-stone-500">Who changed what</span>
      </router-link>
      <router-link to="/admin/security" class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-brand-400 hover:text-brand-700">
        Security
        <span class="mt-1 block text-xs font-normal text-stone-500">Locks and protections</span>
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
        <p class="mt-1 text-2xl font-bold text-green-600">${{ totalRevenue.toFixed(0) }}</p>
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

    <!-- Bookings by status (simple bar chart) -->
    <div class="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 class="font-semibold text-stone-800">Bookings by status</h2>
      <div class="mt-4 flex flex-wrap items-end gap-4">
        <div v-for="(n, status) in counts" :key="status" class="flex flex-col items-center">
          <div
            class="w-16 rounded-t bg-stone-200 transition-all"
            :class="{
              'bg-amber-400': status === 'pending',
              'bg-green-500': status === 'confirmed' || status === 'completed',
              'bg-red-400': status === 'cancelled',
            }"
            :style="{ height: totalBookings ? (n / totalBookings) * 120 + 24 : 24 }"
          />
          <span class="mt-2 text-xs font-medium text-stone-600">{{ status }}</span>
          <span class="text-sm font-semibold text-stone-800">{{ n }}</span>
        </div>
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
              <td class="px-4 py-3">${{ Number(b.total_price || 0).toFixed(2) }}</td>
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
      <ul class="mt-3 flex flex-wrap gap-4 text-sm">
        <li><router-link to="/admin/bookings" class="text-brand-600 hover:underline">Bookings</router-link></li>
        <li><router-link to="/admin/properties" class="text-brand-600 hover:underline">Properties</router-link></li>
        <li><router-link to="/admin/rooms" class="text-brand-600 hover:underline">Rooms</router-link></li>
        <li><router-link to="/admin/guests" class="text-brand-600 hover:underline">Guests</router-link></li>
        <li><router-link to="/admin/contacts" class="text-brand-600 hover:underline">Messages</router-link></li>
        <li><router-link to="/admin/audit-log" class="text-brand-600 hover:underline">Audit log</router-link></li>
        <li><router-link to="/admin/users" class="text-brand-600 hover:underline">Users</router-link></li>
        <li><router-link to="/admin/security" class="text-brand-600 hover:underline">Security</router-link></li>
        <li><router-link to="/admin/finance-revenue" class="text-brand-600 hover:underline">Revenue</router-link></li>
        <li><router-link to="/admin/finance-expense" class="text-brand-600 hover:underline">Expenses</router-link></li>
        <li><router-link to="/admin/finance-profit" class="text-brand-600 hover:underline">Profit</router-link></li>
        <li><router-link to="/admin/hr-employees" class="text-brand-600 hover:underline">Employees</router-link></li>
        <li><router-link to="/admin/hr-schedules" class="text-brand-600 hover:underline">Schedules</router-link></li>
        <li><router-link to="/admin/hr-payroll" class="text-brand-600 hover:underline">Payroll</router-link></li>
        <li><router-link to="/admin/hr-leaves" class="text-brand-600 hover:underline">Leaves</router-link></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBookings, getRooms } from '../../services/data'
import { useStaffAlerts } from '../../composables/useStaffAlerts'

const { newMessages } = useStaffAlerts()
const bookings = ref([])
const rooms = ref([])
const loading = ref(true)

const counts = computed(() => {
  const c = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  bookings.value.forEach((b) => {
    if (c[b.status] !== undefined) c[b.status]++
  })
  return c
})

const totalBookings = computed(() => bookings.value.length)

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

const recentBookings = computed(() => bookings.value.slice(0, 10))

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
