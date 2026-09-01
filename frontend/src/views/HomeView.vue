<template>
  <div>
    <section class="relative min-h-[70vh] bg-stone-800">
      <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style="background-image: url('/images/image_2.jpg');"
      />
      <div class="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <p class="text-brand-300 text-sm font-medium uppercase tracking-wider">Welcome to Phnom Penh, Cambodia</p>
        <h1 class="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">Rent an apartment for your vacation</h1>
        <div class="mt-8 flex gap-4">
          <router-link to="/rooms" class="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">
            View rooms
          </router-link>
          <router-link to="/contact" class="rounded-lg border border-white/80 px-5 py-2.5 font-medium text-white hover:bg-white/10">
            Contact us
          </router-link>
        </div>
      </div>
    </section>

    <section class="py-16 sm:py-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="font-display text-center text-2xl font-semibold text-stone-800 sm:text-3xl">Our properties</h2>
        <div class="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="hotel in hotels"
            :key="hotel.id"
            class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div
              class="h-48 bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${hotel.image || '/images/services-1.jpg'})` }"
            />
            <div class="p-5">
              <h3 class="font-display text-lg font-semibold text-stone-800">{{ hotel.name }}</h3>
              <p class="mt-1 text-sm text-stone-600">{{ hotel.description }}</p>
              <p class="mt-1 text-sm text-stone-500">Location: {{ hotel.location }}</p>
              <router-link
                :to="{ name: 'Rooms', query: { hotel: hotel.id } }"
                class="mt-4 inline-block text-brand-600 font-medium hover:text-brand-700"
              >
                View rooms →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-stone-200 bg-stone-50 py-16 sm:py-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="font-display text-center text-2xl font-semibold text-stone-800">Featured rooms</h2>
        <div class="mt-10 grid gap-8 lg:grid-cols-2">
          <div
            v-for="(room, i) in rooms.slice(0, 4)"
            :key="room.id"
            class="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:flex-row"
            :class="{ 'sm:flex-row-reverse': i % 2 === 1 }"
          >
            <div
              class="h-56 flex-shrink-0 bg-stone-200 bg-cover bg-center sm:w-1/2"
              :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
            />
            <div class="flex flex-1 flex-col justify-center p-6">
              <p class="text-sm text-amber-600">${{ Number(room.price).toFixed(2) }} per night</p>
              <h3 class="mt-1 font-display text-xl font-semibold text-stone-800">{{ room.name }}</h3>
              <ul class="mt-2 space-y-1 text-sm text-stone-600">
                <li>Max: {{ room.max_persons }} persons</li>
                <li>Size: {{ room.size }}</li>
                <li>View: {{ room.view_type }}</li>
                <li>Beds: {{ room.beds }}</li>
              </ul>
              <router-link
                :to="{ name: 'RoomDetail', params: { id: room.id } }"
                class="mt-4 inline-flex items-center text-brand-600 font-medium hover:text-brand-700"
              >
                View room details
                <span class="ml-1">→</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16 sm:py-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="font-display text-center text-2xl font-semibold text-stone-800">What our guests say</h2>
        <div class="mt-10 grid gap-8 sm:grid-cols-2">
          <div
            v-for="t in testimonials"
            :key="t.id"
            class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <p class="text-amber-500">{{ '★'.repeat(t.rating || 5) }}</p>
            <p class="mt-2 text-stone-600">{{ t.message }}</p>
            <p class="mt-4 font-medium text-stone-800">{{ t.name }}</p>
            <p class="text-sm text-stone-500">{{ t.position }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHotels, getRooms, getTestimonials } from '../services/data'

const hotels = ref([])
const rooms = ref([])
const testimonials = ref([])

onMounted(async () => {
  hotels.value = await getHotels()
  rooms.value = await getRooms({ status: 'available' })
  testimonials.value = await getTestimonials()
})
</script>
