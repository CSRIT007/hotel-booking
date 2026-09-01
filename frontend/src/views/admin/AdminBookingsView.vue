<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Bookings</h1>
    <p class="mt-1 text-stone-600">All booking requests. Confirm to notify the guest that their stay is ready.</p>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
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
              <th class="px-4 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in filteredBookings" :key="b.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ b.id }}</td>
              <td class="px-4 py-3">{{ b.username }} ({{ b.email }})</td>
              <td class="px-4 py-3">{{ b.room_name }} — {{ b.hotel_name }}</td>
              <td class="px-4 py-3">{{ b.check_in }} → {{ b.check_out }}</td>
              <td class="px-4 py-3">${{ Number(b.total_price).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-amber-100 text-amber-800': b.status === 'pending',
                    'bg-green-100 text-green-800': b.status === 'confirmed' || b.status === 'completed',
                    'bg-red-100 text-red-800': b.status === 'cancelled',
                  }"
                >
                  {{ b.status }}
                </span>
              </td>
              <td class="px-4 py-3">
                <template v-if="b.status === 'pending'">
                  <button
                    type="button"
                    class="mr-2 text-green-600 hover:underline"
                    @click="updateStatus(b.id, 'confirmed')"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:underline"
                    @click="updateStatus(b.id, 'cancelled')"
                  >
                    Cancel
                  </button>
                </template>
                <span v-else class="text-stone-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="filteredBookings.length === 0 && !loading" class="p-4 text-center text-stone-500">No bookings found.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBookings, updateBookingStatus } from '../../services/data'

const route = useRoute()
const bookings = ref([])
const loading = ref(true)

const statusFilter = computed(() => route.query.status || '')

const filteredBookings = computed(() => {
  if (!statusFilter.value) return bookings.value
  return bookings.value.filter((b) => b.status === statusFilter.value)
})

async function load() {
  loading.value = true
  try {
    bookings.value = await getBookings()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function updateStatus(id, status) {
  try {
    await updateBookingStatus(id, status)
    await load()
  } catch (e) {
    alert(e.message || 'Update failed')
  }
}

onMounted(load)
</script>
