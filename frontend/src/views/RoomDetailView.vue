<template>
  <div v-if="loading" class="flex min-h-[40vh] items-center justify-center">
    <p class="text-stone-500">Loading room…</p>
  </div>
  <div v-else-if="room">
    <section class="relative overflow-hidden bg-stone-900 py-16">
      <div
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/65 to-stone-900/25" />
      <div class="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p class="text-sm text-brand-200">
          <router-link to="/" class="hover:text-white">Home</router-link>
          <span class="mx-2 text-white/40">/</span>
          <router-link to="/rooms" class="hover:text-white">Rooms</router-link>
          <span class="mx-2 text-white/40">/</span>
          {{ room.name }}
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{{ room.name }}</h1>
        <p class="mt-1 text-stone-200">{{ room.hotel_name }}</p>
      </div>
    </section>

    <section class="py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-10 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <div
              class="aspect-[4/3] rounded-2xl bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${room.image || '/images/room-1.jpg'})` }"
            />
            <p class="mt-4 text-stone-600">{{ room.description }}</p>
            <ul class="mt-4 space-y-2 text-stone-600">
              <li><span class="font-medium text-stone-800">Max guests:</span> {{ room.max_persons }}</li>
              <li><span class="font-medium text-stone-800">Size:</span> {{ room.size }}</li>
              <li><span class="font-medium text-stone-800">View:</span> {{ room.view_type }}</li>
              <li><span class="font-medium text-stone-800">Beds:</span> {{ room.beds }}</li>
            </ul>
          </div>
          <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p class="text-2xl font-semibold text-stone-800">${{ Number(room.price).toFixed(2) }} <span class="text-base font-normal text-stone-500">per night</span></p>
            <form v-if="isLoggedIn" class="mt-6 space-y-4" @submit.prevent="submitBooking">
              <div>
                <label class="block text-sm font-medium text-stone-700">Check-in</label>
                <input
                  v-model="form.check_in"
                  type="date"
                  required
                  class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-stone-700">Check-out</label>
                <input
                  v-model="form.check_out"
                  type="date"
                  required
                  class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-stone-700">Guests</label>
                <select
                  v-model.number="form.guests"
                  class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option v-for="n in room.max_persons" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
              <p v-if="totalPrice" class="text-lg font-medium text-stone-800">Total: ${{ totalPrice.toFixed(2) }}</p>
              <p v-if="bookingError" class="text-sm text-red-600">{{ bookingError }}</p>
              <p v-if="bookingSuccess" class="text-sm text-green-600">{{ bookingSuccess }}</p>
              <router-link
                v-if="bookingSuccess"
                to="/my-bookings"
                class="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                View my bookings
              </router-link>
              <button
                type="submit"
                :disabled="bookingLoading"
                class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {{ bookingLoading ? 'Booking…' : 'Request booking' }}
              </button>
            </form>
            <div v-else class="mt-6 rounded-lg bg-stone-100 p-4 text-center text-stone-600">
              <p>Please <router-link to="/login" class="text-brand-600 hover:underline">log in</router-link> to book this room.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="mx-auto max-w-6xl px-4 py-24 text-center">
    <p class="text-stone-500">Room not found.</p>
    <router-link to="/rooms" class="mt-4 inline-block text-brand-600 hover:underline">Back to rooms</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { getRoom, createBooking } from '../services/data'

const route = useRoute()
const { isLoggedIn, currentUser } = useAuth()
const loading = ref(true)
const room = ref(null)
const form = ref({
  check_in: '',
  check_out: '',
  guests: 1,
})
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingLoading = ref(false)

const totalPrice = computed(() => {
  if (!room.value || !form.value.check_in || !form.value.check_out) return 0
  const a = new Date(form.value.check_in)
  const b = new Date(form.value.check_out)
  const nights = Math.max(0, Math.ceil((b - a) / (24 * 60 * 60 * 1000)))
  return nights * Number(room.value.price)
})

async function loadRoom() {
  loading.value = true
  room.value = null
  room.value = await getRoom(route.params.id)
  if (room.value) form.value.guests = Math.min(form.value.guests, room.value.max_persons)
  loading.value = false
}

async function submitBooking() {
  bookingError.value = ''
  bookingSuccess.value = ''
  const checkIn = form.value.check_in
  const checkOut = form.value.check_out
  const today = new Date().toISOString().slice(0, 10)
  if (!checkIn || !checkOut) {
    bookingError.value = 'Please select check-in and check-out dates.'
    return
  }
  if (checkIn < today) {
    bookingError.value = 'Check-in must be today or later.'
    return
  }
  if (checkOut <= checkIn) {
    bookingError.value = 'Check-out must be after check-in.'
    return
  }
  if (form.value.guests > room.value.max_persons) {
    bookingError.value = 'Guests exceed room capacity.'
    return
  }
  bookingLoading.value = true
  try {
    await createBooking({
      user_id: currentUser.value.id,
      room_id: room.value.id,
      check_in: checkIn,
      check_out: checkOut,
      guests: form.value.guests,
      total_price: totalPrice.value,
      status: 'pending',
    })
    bookingSuccess.value = 'Booking request sent. Check My bookings for status — we will update it when it is confirmed and ready.'
  } catch (e) {
    bookingError.value = e.message || 'Booking failed.'
  }
  bookingLoading.value = false
}

onMounted(loadRoom)
watch(() => route.params.id, loadRoom)
</script>
