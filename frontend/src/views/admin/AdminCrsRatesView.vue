<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Rates</h1>
    <p class="mt-1 text-stone-600">
      Set nightly prices by property or room and date range. Direct bookings use these rates; if none apply, the room’s base price is used.
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add rate plan</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Property</label>
            <select v-model.number="form.hotel_id" required class="field" @change="form.room_id = 0">
              <option disabled :value="0">________Selection________</option>
              <option v-for="h in hotels" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Room</label>
            <select v-model.number="form.room_id" class="field" :disabled="!form.hotel_id">
              <option :value="0">All rooms at this property</option>
              <option v-for="r in roomsForHotel" :key="r.id" :value="r.id">{{ r.name }} — {{ formatMoney(r.price) }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Plan name</label>
            <input v-model="form.name" type="text" required class="field" placeholder="Standard, Weekend, Promo" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Nightly rate</label>
            <input v-model.number="form.price" type="number" min="0" step="0.01" required class="field" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">From</label>
              <input v-model="form.start_date" type="date" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">To</label>
              <input v-model="form.end_date" type="date" required class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Min nights</label>
            <input v-model.number="form.min_nights" type="number" min="1" class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !form.hotel_id">
          {{ saving ? 'Saving…' : 'Save plan' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Plan</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Applies to</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Dates</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Nightly</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in rates" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ row.name }}</p>
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'">{{ row.status }}</span>
              </td>
              <td class="px-3 py-3 text-stone-600">
                {{ row.hotel_name }}
                <p class="text-xs text-stone-400">{{ row.room_name || 'All rooms' }}</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3 text-stone-600">{{ row.start_date }} → {{ row.end_date }}</td>
              <td class="px-3 py-3 text-right font-medium">{{ formatMoney(row.price) }}</td>
              <td class="whitespace-nowrap px-3 py-3">
                <button type="button" class="mr-2 text-brand-700 hover:underline" @click="toggle(row)">
                  {{ row.status === 'active' ? 'Pause' : 'Activate' }}
                </button>
                <button type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="rates.length === 0 && !loading" class="p-4 text-center text-stone-500">No rate plans yet. Add one to override room prices on Direct bookings.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createCrsRate, deleteCrsRate, getCrsRates, getHotels, getRooms, updateCrsRate } from '../../services/data'
import { formatMoney } from '../../utils/money'
import { todayKey } from '../../services/hr'

const hotels = ref([])
const rooms = ref([])
const rates = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  hotel_id: 0,
  room_id: 0,
  name: '',
  price: 100,
  start_date: todayKey(),
  end_date: todayKey(),
  min_nights: 1,
})

const roomsForHotel = computed(() => rooms.value.filter((r) => Number(r.hotel_id) === Number(form.hotel_id)))

async function load() {
  loading.value = true
  try {
    const [h, r, plans] = await Promise.all([getHotels(), getRooms(), getCrsRates()])
    hotels.value = h
    rooms.value = r
    rates.value = plans
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function create() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createCrsRate({
      hotel_id: form.hotel_id,
      room_id: form.room_id || null,
      name: form.name.trim(),
      price: form.price,
      start_date: form.start_date,
      end_date: form.end_date,
      min_nights: form.min_nights,
    })
    form.name = ''
    success.value = 'Rate plan saved. Direct bookings in this range use it.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function toggle(row) {
  error.value = ''
  try {
    await updateCrsRate(row.id, { status: row.status === 'active' ? 'paused' : 'active' })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteCrsRate(row.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
