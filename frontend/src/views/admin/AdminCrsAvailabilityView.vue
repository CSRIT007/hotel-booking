<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Availability</h1>
    <p class="mt-1 text-stone-600">
      Green is open for sale. Red is already reserved. Amber is closed (stop sell). Click a green cell to close that night, or an amber cell to open it again.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Open nights</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ board.counts?.available || 0 }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Reserved</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ board.counts?.booked || 0 }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Stop sell</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ board.counts?.blocked || 0 }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Maintenance</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ board.counts?.maintenance || 0 }}</p>
      </div>
    </div>

    <div class="mt-6 flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs font-medium text-stone-700">From</label>
        <input v-model="fromDate" type="date" class="field w-auto" @change="load" />
      </div>
      <div>
        <label class="block text-xs font-medium text-stone-700">Property</label>
        <select v-model="hotelId" class="field w-auto min-w-[12rem]" @change="load">
          <option value="">All properties</option>
          <option v-for="h in hotels" :key="h.id" :value="String(h.id)">{{ h.name }}</option>
        </select>
      </div>
    </div>
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>

    <div class="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table class="min-w-full border-collapse text-xs">
        <thead class="bg-stone-50">
          <tr>
            <th class="sticky left-0 z-10 bg-stone-50 px-3 py-2 text-left font-medium text-stone-700">Room</th>
            <th v-for="d in board.dates || []" :key="d" class="px-1 py-2 text-center font-medium text-stone-600">
              {{ d.slice(8) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in board.rooms || []" :key="room.room_id" class="border-t border-stone-100">
            <td class="sticky left-0 bg-white px-3 py-1 whitespace-nowrap">
              <p class="font-medium text-stone-800">{{ room.room_name }}</p>
              <p class="text-[10px] text-stone-400">{{ room.hotel_name }}</p>
            </td>
            <td v-for="d in board.dates || []" :key="room.room_id + d" class="p-0.5">
              <button
                type="button"
                class="block h-8 w-8 rounded mx-auto"
                :class="cellClass(room.cells[d]?.status)"
                :title="`${d} · ${room.cells[d]?.status}`"
                :disabled="busy || room.cells[d]?.status === 'booked' || room.cells[d]?.status === 'maintenance'"
                @click="toggle(room, d, room.cells[d])"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="(board.rooms || []).length === 0 && !loading" class="p-4 text-center text-sm text-stone-500">No rooms to show.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { closeCrsDates, getCrsAvailability, getHotels, openCrsDates } from '../../services/data'
import { todayKey } from '../../services/hr'

const hotels = ref([])
const board = ref({ dates: [], rooms: [], counts: {} })
const fromDate = ref(todayKey())
const hotelId = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref('')

function cellClass(status) {
  const map = {
    available: 'bg-green-400 hover:bg-green-500',
    booked: 'bg-red-400 cursor-default',
    blocked: 'bg-amber-400 hover:bg-amber-500',
    maintenance: 'bg-stone-300 cursor-default',
  }
  return map[status] || 'bg-stone-200'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    hotels.value = await getHotels()
    board.value = await getCrsAvailability({ from: fromDate.value, days: 14, hotel_id: hotelId.value || undefined })
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function toggle(room, date, cell) {
  if (!cell || busy.value) return
  error.value = ''
  busy.value = true
  try {
    if (cell.status === 'available') {
      await closeCrsDates({ room_id: room.room_id, start_date: date, end_date: date, reason: 'Stop sell' })
    } else if (cell.status === 'blocked' && cell.stop_id) {
      await openCrsDates(cell.stop_id)
    }
    await load()
  } catch (e) {
    error.value = e.message
  }
  busy.value = false
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
