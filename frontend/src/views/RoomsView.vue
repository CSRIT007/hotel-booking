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
        <form class="mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm" @submit.prevent="applyDates">
          <div>
            <label class="block text-xs font-medium text-stone-700">Check-in</label>
            <input v-model="checkIn" type="date" class="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Check-out</label>
            <input v-model="checkOut" type="date" class="mt-1 rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Show open rooms
          </button>
          <button v-if="checkIn || checkOut" type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700" @click="clearDates">
            Clear dates
          </button>
        </form>
        <p v-if="dateError" class="mb-4 text-sm text-red-600">{{ dateError }}</p>
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
          {{ checkIn && checkOut ? 'No rooms are open for those dates.' : 'No rooms found.' }}
        </p>
        <p v-if="loading" class="text-center text-stone-500">Loading rooms…</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getRooms } from '../services/data'
import { formatMoney } from '../utils/money'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
const rooms = ref([])
const loading = ref(true)
const checkIn = ref(typeof route.query.check_in === 'string' ? route.query.check_in : '')
const checkOut = ref(typeof route.query.check_out === 'string' ? route.query.check_out : '')
const dateError = ref('')

function stayQuery() {
  const query = {}
  if (route.query.hotel) query.hotel = route.query.hotel
  if (checkIn.value) query.check_in = checkIn.value
  if (checkOut.value) query.check_out = checkOut.value
  return query
}

function roomLink(room) {
  return { name: 'RoomDetail', params: { id: room.id }, query: stayQuery() }
}

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
  rooms.value = await getRooms(params)
  rooms.value = rooms.value.filter((r) => r.status !== 'maintenance')
  loading.value = false
}

function applyDates() {
  load()
}

function clearDates() {
  checkIn.value = ''
  checkOut.value = ''
  load()
}

onMounted(load)
watch(() => route.query.hotel, load)
</script>
