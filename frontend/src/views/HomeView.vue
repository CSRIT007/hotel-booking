<template>
  <div>
    <div class="relative">
      <HeroSlideshow :slides="slides" />
      <div class="relative z-20 px-4 py-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:translate-y-1/2 sm:py-0">
        <div class="mx-auto max-w-5xl">
          <AvailabilitySearch
            v-model:check-in="checkIn"
            v-model:check-out="checkOut"
            v-model:guests="guests"
            v-model:hotel-id="hotelId"
            :hotels="hotels"
            :min-date="today"
            :error="searchError"
            submit-label="Check availability"
            @submit="searchStay"
          />
        </div>
      </div>
    </div>

    <section class="py-16 sm:py-24 sm:pt-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Stay with us</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">Our properties</h2>
        </div>
        <div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="hotel in hotels"
            :key="hotel.id"
            class="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              class="h-52 bg-stone-200 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
              :style="{ backgroundImage: `url(${hotel.image || '/images/services-1.jpg'})` }"
            />
            <div class="p-6">
              <h3 class="font-display text-xl font-semibold text-stone-800">{{ hotel.name }}</h3>
              <p class="mt-1 text-sm text-stone-500">{{ hotel.location }}</p>
              <p class="mt-3 text-sm leading-relaxed text-stone-600">{{ hotel.description }}</p>
              <router-link
                :to="{ name: 'Rooms', query: stayQuery({ hotel: hotel.id }) }"
                class="mt-5 inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View rooms
                <span class="ml-1">→</span>
              </router-link>
            </div>
          </div>
        </div>
        <p v-if="hotels.length === 0" class="mt-10 text-center text-stone-500">No properties listed yet.</p>
      </div>
    </section>

    <section class="border-y border-stone-200 bg-white py-16 sm:py-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Guest favourites</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">Featured rooms</h2>
        </div>
        <div class="mt-12 grid gap-8 lg:grid-cols-2">
          <div
            v-for="room in featuredRooms"
            :key="room.id"
            class="flex overflow-hidden rounded-3xl border border-stone-200 bg-warm-50 shadow-sm"
          >
            <div class="relative w-2/5 min-h-[12rem] flex-shrink-0 bg-stone-200">
              <img
                :src="roomCover(room)"
                :alt="room.name"
                class="absolute inset-0 h-full w-full object-cover"
                @error="onRoomPhotoError"
              />
            </div>
            <div class="flex flex-1 flex-col justify-center p-6">
              <p class="text-sm font-medium text-brand-700">{{ formatMoney(room.price) }} <span class="font-normal text-stone-500">/ night</span></p>
              <h3 class="mt-1 font-display text-xl font-semibold text-stone-800">{{ room.name }}</h3>
              <p class="text-sm text-stone-500">{{ room.hotel_name }}</p>
              <p class="mt-2 text-sm text-stone-600">{{ room.max_persons }} guests · {{ room.size }} · {{ room.view_type }}</p>
              <router-link
                :to="{ name: 'RoomDetail', params: { id: room.id }, query: stayQuery() }"
                class="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View details →
              </router-link>
            </div>
          </div>
        </div>
        <p v-if="featuredRooms.length === 0" class="mt-10 text-center text-stone-500">No rooms to feature yet.</p>
      </div>
    </section>

    <section class="py-16 sm:py-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="text-center font-display text-3xl font-semibold text-stone-800">What our guests say</h2>
        <div class="mt-12 grid gap-8 sm:grid-cols-2">
          <div
            v-for="t in testimonials"
            :key="t.id"
            class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
          >
            <p class="text-amber-500">{{ '★'.repeat(t.rating || 5) }}</p>
            <p class="mt-4 text-lg leading-relaxed text-stone-600">“{{ t.message }}”</p>
            <p class="mt-6 font-semibold text-stone-800">{{ t.name }}</p>
            <p class="text-sm text-stone-500">{{ t.position }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HeroSlideshow from '../components/HeroSlideshow.vue'
import AvailabilitySearch from '../components/AvailabilitySearch.vue'
import { getHotels, getRooms, getSlides, getTestimonials } from '../services/data'
import { formatMoney } from '../utils/money'
import { roomCover, onRoomPhotoError } from '../constants/media'

const router = useRouter()
const hotels = ref([])
const rooms = ref([])
const testimonials = ref([])
const slides = ref([])
const searchError = ref('')

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return localYmd(dt)
}

const today = localYmd()
const checkIn = ref(today)
const checkOut = ref(addDays(today, 1))
const guests = ref(2)
const hotelId = ref('')

const featuredRooms = computed(() =>
  rooms.value.filter((r) => r.status !== 'maintenance').slice(0, 4)
)

function stayQuery(extra = {}) {
  const query = { ...extra }
  if (checkIn.value) query.check_in = checkIn.value
  if (checkOut.value) query.check_out = checkOut.value
  if (guests.value) query.guests = String(guests.value)
  if (hotelId.value && query.hotel == null) query.hotel = hotelId.value
  return query
}

function searchStay() {
  searchError.value = ''
  if (!checkIn.value || !checkOut.value) {
    searchError.value = 'Choose check-in and check-out dates.'
    return
  }
  if (checkOut.value <= checkIn.value) {
    searchError.value = 'Check-out must be after check-in.'
    return
  }
  router.push({ name: 'Rooms', query: stayQuery() })
}

onMounted(async () => {
  hotels.value = await getHotels()
  rooms.value = await getRooms()
  testimonials.value = await getTestimonials()
  slides.value = await getSlides()
})
</script>
