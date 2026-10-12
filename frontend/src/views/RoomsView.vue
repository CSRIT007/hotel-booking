<template>
  <div>
    <PageHero title="Rooms" subtitle="Choose a room that fits your trip. Request a stay and the hotel will confirm." image="/images/room-4.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        Rooms
      </template>
    </PageHero>

    <section class="py-14 sm:py-20">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <AvailabilitySearch
          class="mb-8"
          variant="page"
          v-model:check-in="checkIn"
          v-model:check-out="checkOut"
          v-model:guests="guests"
          :min-date="today"
          :error="dateError"
          submit-label="Show open rooms"
          show-clear
          @submit="applyDates"
          @clear="clearDates"
        />
        <div class="grid gap-8 md:grid-cols-2">
          <article
            v-for="room in rooms"
            :key="room.id"
            class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <router-link
              :to="roomLink(room)"
              class="block h-56 bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
            />
            <div class="p-6">
              <p class="text-sm font-medium text-brand-700">
                {{ formatMoney(room.from_price ?? room.price) }}
                <span class="font-normal text-stone-500">per night</span>
                <span v-if="room.quote_total" class="ml-2 text-stone-500">· stay {{ formatMoney(room.quote_total) }}</span>
              </p>
              <h2 class="mt-1 font-display text-2xl font-semibold text-stone-800">
                <router-link :to="roomLink(room)" class="hover:text-brand-700">
                  {{ room.name }}
                </router-link>
              </h2>
              <p class="mt-1 text-sm text-stone-500">{{ room.hotel_name }}</p>
              <p class="mt-3 text-sm text-stone-600">{{ room.max_persons }} guests · {{ room.size }} · {{ room.view_type }} · {{ room.beds }} bed(s)</p>
              <router-link
                :to="roomLink(room)"
                class="mt-5 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View room details →
              </router-link>
            </div>
          </article>
        </div>
        <p v-if="rooms.length === 0 && !loading" class="text-center text-stone-500">
          {{ emptyMessage }}
        </p>
        <p v-if="loading" class="text-center text-stone-500">Loading rooms…</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRooms } from '../services/data'
import { formatMoney } from '../utils/money'
import PageHero from '../components/PageHero.vue'
import AvailabilitySearch from '../components/AvailabilitySearch.vue'

const route = useRoute()
const router = useRouter()
const rooms = ref([])
const loading = ref(true)
const dateError = ref('')

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const today = localYmd()
const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)

function queryGuests() {
  const n = Number(route.query.guests)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function syncFromRoute() {
  checkIn.value = typeof route.query.check_in === 'string' ? route.query.check_in : ''
  checkOut.value = typeof route.query.check_out === 'string' ? route.query.check_out : ''
  guests.value = queryGuests() || 2
}

function stayQuery() {
  const query = {}
  if (route.query.hotel) query.hotel = route.query.hotel
  if (checkIn.value) query.check_in = checkIn.value
  if (checkOut.value) query.check_out = checkOut.value
  if (guests.value) query.guests = String(guests.value)
  return query
}

function roomLink(room) {
  return { name: 'RoomDetail', params: { id: room.id }, query: stayQuery() }
}

const emptyMessage = computed(() => {
  if (checkIn.value && checkOut.value) return 'No rooms are open for those dates and guest count.'
  return 'No rooms found.'
})

async function load() {
  loading.value = true
  dateError.value = ''
  const hotelId = route.query.hotel
  const params = hotelId ? { hotel_id: hotelId } : {}
  if (checkIn.value && checkOut.value) {
    if (checkOut.value <= checkIn.value) {
      dateError.value = 'Check-out must be after check-in.'
      rooms.value = []
      loading.value = false
      return
    }
    params.check_in = checkIn.value
    params.check_out = checkOut.value
  }
  let list = await getRooms(params)
  list = list.filter((r) => r.status !== 'maintenance')
  const party = queryGuests()
  if (party > 0) {
    list = list.filter((r) => Number(r.max_persons || 0) >= party)
  }
  rooms.value = list
  loading.value = false
}

function applyDates() {
  if (checkIn.value && checkOut.value && checkOut.value <= checkIn.value) {
    dateError.value = 'Check-out must be after check-in.'
    return
  }
  router.replace({ name: 'Rooms', query: stayQuery() })
}

function clearDates() {
  const query = {}
  if (route.query.hotel) query.hotel = route.query.hotel
  router.replace({ name: 'Rooms', query })
}

watch(
  () => [route.query.check_in, route.query.check_out, route.query.guests, route.query.hotel],
  () => {
    syncFromRoute()
    load()
  },
  { immediate: true }
)
</script>
