<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Rooms</h1>
    <p class="mt-1 text-stone-600">Room inventory. View on site: <router-link to="/rooms" class="text-brand-600 hover:underline">Public rooms</router-link></p>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Hotel</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Price</th>
              <th class="px-4 py-3 text-center font-medium text-stone-700">Guests</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="r in rooms" :key="r.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ r.id }}</td>
              <td class="px-4 py-3 font-medium text-stone-800">{{ r.name }}</td>
              <td class="px-4 py-3 text-stone-600">{{ r.hotel_name || '—' }}</td>
              <td class="px-4 py-3 text-right">${{ Number(r.price || 0).toFixed(2) }}</td>
              <td class="px-4 py-3 text-center">{{ r.max_persons || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': r.status === 'available',
                    'bg-amber-100 text-amber-800': r.status === 'booked',
                    'bg-stone-100 text-stone-600': r.status === 'maintenance',
                  }"
                >{{ r.status || 'available' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="rooms.length === 0 && !loading" class="p-4 text-center text-stone-500">No rooms.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getRooms } from '../../services/data'

const rooms = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    rooms.value = await getRooms()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
