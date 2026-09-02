<template>
  <div>
    <section class="relative min-h-[78vh] overflow-hidden bg-stone-900">
      <div
        class="absolute inset-0 scale-105 bg-cover bg-center"
        style="background-image: url('/images/image_2.jpg');"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-900/55 to-stone-900/20" />
      <div class="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6">
        <p class="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">Phnom Penh, Cambodia</p>
        <h1 class="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
          A calm stay in the heart of the city
        </h1>
        <p class="mt-4 max-w-xl text-lg text-stone-200">
          Boutique rooms, thoughtful service, and easy booking for your next trip.
        </p>
        <div class="mt-10 flex flex-wrap gap-3">
          <router-link to="/rooms" class="rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-900/30 hover:bg-brand-700">
            Browse rooms
          </router-link>
          <router-link to="/contact" class="rounded-full border border-white/70 px-6 py-3 font-medium text-white hover:bg-white/10">
            Contact us
          </router-link>
        </div>
      </div>
    </section>

    <section class="py-16 sm:py-24">
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
                :to="{ name: 'Rooms', query: { hotel: hotel.id } }"
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
                :to="{ name: 'RoomDetail', params: { id: room.id } }"
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
import { getHotels, getRooms, getTestimonials } from '../services/data'
import { formatMoney } from '../utils/money'
import { roomCover, onRoomPhotoError } from '../constants/media'

const hotels = ref([])
const rooms = ref([])
const testimonials = ref([])

const featuredRooms = computed(() =>
  rooms.value.filter((r) => r.status !== 'maintenance').slice(0, 4)
)

onMounted(async () => {
  hotels.value = await getHotels()
  rooms.value = await getRooms()
  testimonials.value = await getTestimonials()
})
</script>
