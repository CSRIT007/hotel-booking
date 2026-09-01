<template>
  <div>
    <section class="bg-stone-800 py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="text-brand-300 text-sm font-medium uppercase tracking-wider">
          <router-link to="/" class="hover:text-brand-200">Home</router-link>
          <span class="mx-2">/</span>
          Rooms
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Apartment rooms</h1>
      </div>
    </section>

    <section class="py-12 sm:py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-8 lg:grid-cols-2">
          <div
            v-for="(room, i) in rooms"
            :key="room.id"
            class="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:flex-row"
            :class="{ 'sm:flex-row-reverse': i % 2 === 1 }"
          >
            <router-link
              :to="{ name: 'RoomDetail', params: { id: room.id } }"
              class="h-56 flex-shrink-0 bg-stone-200 bg-cover bg-center sm:w-1/2"
              :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
            />
            <div class="flex flex-1 flex-col justify-center p-6">
              <p class="text-sm text-amber-600">${{ Number(room.price).toFixed(2) }} per night</p>
              <h2 class="mt-1 font-display text-xl font-semibold text-stone-800">
                <router-link :to="{ name: 'RoomDetail', params: { id: room.id } }" class="hover:text-brand-600">
                  {{ room.name }}
                </router-link>
              </h2>
              <ul class="mt-2 space-y-1 text-sm text-stone-600">
                <li><span class="font-medium">Max:</span> {{ room.max_persons }} persons</li>
                <li><span class="font-medium">Size:</span> {{ room.size }}</li>
                <li><span class="font-medium">View:</span> {{ room.view_type }}</li>
                <li><span class="font-medium">Bed:</span> {{ room.beds }}</li>
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
        <p v-if="rooms.length === 0 && !loading" class="text-center text-stone-500">No rooms found.</p>
        <p v-if="loading" class="text-center text-stone-500">Loading rooms…</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getRooms } from '../services/data'

const route = useRoute()
const rooms = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  const hotelId = route.query.hotel
  rooms.value = await getRooms(hotelId ? { hotel_id: hotelId, status: 'available' } : { status: 'available' })
  loading.value = false
}

onMounted(load)
watch(() => route.query.hotel, load)
</script>
