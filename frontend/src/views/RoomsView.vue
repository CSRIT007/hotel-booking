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
        <div class="grid gap-8 md:grid-cols-2">
          <article
            v-for="room in rooms"
            :key="room.id"
            class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <router-link
              :to="{ name: 'RoomDetail', params: { id: room.id } }"
              class="block h-56 bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
            />
            <div class="p-6">
              <p class="text-sm font-medium text-brand-700">{{ formatMoney(room.price) }} <span class="font-normal text-stone-500">per night</span></p>
              <h2 class="mt-1 font-display text-2xl font-semibold text-stone-800">
                <router-link :to="{ name: 'RoomDetail', params: { id: room.id } }" class="hover:text-brand-700">
                  {{ room.name }}
                </router-link>
              </h2>
              <p class="mt-1 text-sm text-stone-500">{{ room.hotel_name }}</p>
              <p class="mt-3 text-sm text-stone-600">{{ room.max_persons }} guests · {{ room.size }} · {{ room.view_type }} · {{ room.beds }} bed(s)</p>
              <router-link
                :to="{ name: 'RoomDetail', params: { id: room.id } }"
                class="mt-5 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View room details →
              </router-link>
            </div>
          </article>
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
import { formatMoney } from '../utils/money'
import PageHero from '../components/PageHero.vue'

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
