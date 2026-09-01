<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Reports</h1>
    <p class="mt-1 text-stone-600">Booking and revenue summary.</p>

    <div class="mt-6 grid gap-6 sm:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-stone-800">Bookings by status</h2>
        <div class="mt-4 overflow-hidden rounded-lg border border-stone-200">
          <table class="min-w-full text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Count</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="(n, status) in statusCounts" :key="status" class="hover:bg-stone-50">
                <td class="px-4 py-3 capitalize">{{ status }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ n }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 class="font-semibold text-stone-800">Revenue summary</h2>
        <div class="mt-4 space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-stone-600">Confirmed + completed bookings</span>
            <span class="font-semibold text-green-600">${{ totalRevenue.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-stone-600">Total bookings</span>
            <span class="font-medium">{{ bookings.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
      <h2 class="border-b border-stone-200 px-4 py-3 font-semibold text-stone-800">All bookings (for export reference)</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Check-in</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Check-out</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Total</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in bookings" :key="b.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ b.id }}</td>
              <td class="px-4 py-3">{{ b.username || b.email || '—' }}</td>
              <td class="px-4 py-3">{{ b.room_name || '—' }}</td>
              <td class="px-4 py-3">{{ b.check_in }}</td>
              <td class="px-4 py-3">{{ b.check_out }}</td>
              <td class="px-4 py-3 text-right">${{ Number(b.total_price || 0).toFixed(2) }}</td>
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
      <p v-if="bookings.length === 0 && !loading" class="p-4 text-center text-stone-500">No bookings.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBookings } from '../../services/data'

const bookings = ref([])
const loading = ref(true)

const statusCounts = computed(() => {
  const c = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
  bookings.value.forEach((b) => {
    if (c[b.status] !== undefined) c[b.status]++
  })
  return c
})

const totalRevenue = computed(() => {
  return bookings.value
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0)
})

onMounted(async () => {
  loading.value = true
  try {
    bookings.value = await getBookings()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
