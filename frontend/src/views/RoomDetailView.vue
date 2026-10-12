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
              :style="{ backgroundImage: `url(${gallery[activePhoto] || '/images/room-1.jpg'})` }"
            />
            <div v-if="gallery.length > 1" class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              <button
                v-for="(src, i) in gallery"
                :key="src + i"
                type="button"
                class="aspect-[4/3] rounded-lg bg-stone-200 bg-cover bg-center ring-2 ring-offset-1"
                :class="i === activePhoto ? 'ring-brand-600' : 'ring-transparent'"
                :style="{ backgroundImage: `url(${src})` }"
                @click="activePhoto = i"
              />
            </div>
            <p class="mt-4 text-stone-600">{{ room.description }}</p>
            <ul class="mt-4 space-y-2 text-stone-600">
              <li><span class="font-medium text-stone-800">Max guests:</span> {{ room.max_persons }}</li>
              <li><span class="font-medium text-stone-800">Size:</span> {{ room.size }}</li>
              <li><span class="font-medium text-stone-800">View:</span> {{ room.view_type }}</li>
              <li><span class="font-medium text-stone-800">Beds:</span> {{ room.beds }}</li>
            </ul>
          </div>
          <div class="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <p class="text-2xl font-semibold text-stone-800">
              {{ formatMoney(room.from_price ?? room.price) }}
              <span class="text-base font-normal text-stone-500">per night</span>
            </p>
            <form class="mt-6 space-y-4" @submit.prevent="submitBooking">
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
              <template v-if="!isLoggedIn">
                <div>
                  <label class="block text-sm font-medium text-stone-700">Full name</label>
                  <input
                    v-model="guest.name"
                    type="text"
                    required
                    autocomplete="name"
                    class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700">Email</label>
                  <input
                    v-model="guest.email"
                    type="email"
                    required
                    autocomplete="email"
                    class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700">Phone</label>
                  <input
                    v-model="guest.phone"
                    type="tel"
                    required
                    autocomplete="tel"
                    class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700">Password <span class="font-normal text-stone-500">(optional)</span></label>
                  <input
                    v-model="guest.password"
                    type="password"
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <p class="mt-0.5 text-xs text-stone-500">
                    Set one to track this booking, or enter your existing password if you already have an account.
                  </p>
                </div>
                <div v-if="guest.password">
                  <label class="block text-sm font-medium text-stone-700">Confirm password</label>
                  <input
                    v-model="guest.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <p class="text-xs text-stone-500">
                  Already have an account?
                  <router-link :to="{ name: 'Login', query: { redirect: route.fullPath } }" class="text-brand-600 hover:underline">Log in</router-link>
                </p>
              </template>
              <p v-if="quoteError" class="text-sm text-red-600">{{ quoteError }}</p>
              <p v-else-if="quoteLoading" class="text-sm text-stone-500">Checking rates and availability…</p>
              <div v-else-if="quote" class="space-y-1">
                <p class="text-lg font-medium text-stone-800">
                  Total: {{ formatMoney(quote.total) }}
                  <span class="text-sm font-normal text-stone-500">· {{ quote.nights }} night{{ quote.nights === 1 ? '' : 's' }}</span>
                </p>
                <p v-if="quote.rate_name" class="text-xs text-stone-500">{{ quote.rate_name }}{{ quote.min_nights > 1 ? ` · min ${quote.min_nights} nights` : '' }}</p>
                <ul v-if="quote.nightly?.length" class="max-h-28 overflow-auto text-xs text-stone-500">
                  <li v-for="n in quote.nightly" :key="n.date">{{ n.date }} · {{ formatMoney(n.price) }}</li>
                </ul>
              </div>
              <p v-if="bookingError" class="text-sm text-red-600">{{ bookingError }}</p>
              <p v-if="bookingSuccess" class="text-sm text-green-600">{{ bookingSuccess }}</p>
              <router-link
                v-if="bookingSuccess && isLoggedIn"
                to="/my-bookings"
                class="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
              >
                View my bookings
              </router-link>
              <button
                type="submit"
                :disabled="bookingLoading || quoteLoading || !quote || !!quoteError"
                class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {{ bookingLoading ? 'Booking…' : 'Request booking' }}
              </button>
              <p class="text-xs leading-relaxed text-stone-500">
                This request stays pending until the desk confirms.
                Check-in from 2:00 pm, check-out until 12:00 pm.
                <router-link to="/policies" class="text-brand-600 hover:underline">Stay policies</router-link>
              </p>
            </form>
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
import { getRoom, createBooking, getCrsQuote } from '../services/data'
import { formatMoney } from '../utils/money'

const route = useRoute()
const { isLoggedIn, currentUser, setUser } = useAuth()
const loading = ref(true)
const room = ref(null)
const activePhoto = ref(0)
const form = ref({
  check_in: '',
  check_out: '',
  guests: 1,
})
const guest = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const bookingError = ref('')
const bookingSuccess = ref('')
const bookingLoading = ref(false)
const quote = ref(null)
const quoteLoading = ref(false)
const quoteError = ref('')

const gallery = computed(() => {
  if (!room.value) return []
  const cover = room.value.image || '/images/room-1.jpg'
  const extras = (room.value.images || []).filter((src) => src && src !== cover)
  return [cover, ...extras]
})

const totalPrice = computed(() => (quote.value ? Number(quote.value.total) : 0))

async function loadRoom() {
  loading.value = true
  room.value = null
  room.value = await getRoom(route.params.id)
  activePhoto.value = 0
  if (typeof route.query.check_in === 'string') form.value.check_in = route.query.check_in
  if (typeof route.query.check_out === 'string') form.value.check_out = route.query.check_out
  if (typeof route.query.guests === 'string') {
    const n = Number(route.query.guests)
    if (Number.isFinite(n) && n > 0) form.value.guests = n
  }
  if (room.value) form.value.guests = Math.min(Math.max(1, form.value.guests), room.value.max_persons)
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
  if (quoteError.value) {
    bookingError.value = quoteError.value
    return
  }
  if (!quote.value || quoteLoading.value) {
    bookingError.value = 'Wait for the rate and availability check before booking.'
    return
  }
  if (!isLoggedIn.value) {
    if (!guest.value.name.trim() || !guest.value.email.trim() || !guest.value.phone.trim()) {
      bookingError.value = 'Enter your name, email, and phone.'
      return
    }
    if (guest.value.password) {
      if (guest.value.password.length < 8) {
        bookingError.value = 'Password must be at least 8 characters.'
        return
      }
      if (guest.value.password !== guest.value.confirmPassword) {
        bookingError.value = 'Passwords do not match.'
        return
      }
    }
  }
  bookingLoading.value = true
  try {
    const payload = {
      room_id: room.value.id,
      check_in: checkIn,
      check_out: checkOut,
      guests: form.value.guests,
      total_price: totalPrice.value,
      status: 'pending',
    }
    if (isLoggedIn.value) {
      payload.user_id = currentUser.value.id
    } else {
      payload.guest_name = guest.value.name.trim()
      payload.guest_email = guest.value.email.trim()
      payload.guest_phone = guest.value.phone.trim()
      if (guest.value.password) payload.guest_password = guest.value.password
    }
    const created = await createBooking(payload)
    if (created?.user) {
      setUser({
        id: created.user.id,
        username: created.user.username,
        email: created.user.email,
        role: created.user.role || 'guest',
      })
    }
    if (created?.user || isLoggedIn.value) {
      bookingSuccess.value = `Booking request #${created.id} sent. Check My bookings — we will update it when it is confirmed.`
    } else {
      bookingSuccess.value = `Booking request #${created.id} sent. We will confirm by email at ${guest.value.email.trim()}.`
    }
  } catch (e) {
    bookingError.value = e.message || 'Booking failed.'
  }
  bookingLoading.value = false
}

async function refreshQuote() {
  quote.value = null
  quoteError.value = ''
  const checkIn = form.value.check_in
  const checkOut = form.value.check_out
  if (!room.value || !checkIn || !checkOut || checkOut <= checkIn) return
  quoteLoading.value = true
  try {
    quote.value = await getCrsQuote({ room_id: room.value.id, check_in: checkIn, check_out: checkOut })
  } catch (e) {
    quoteError.value = e.message
  }
  quoteLoading.value = false
}

watch(() => [form.value.check_in, form.value.check_out, room.value?.id], refreshQuote)
watch(() => route.params.id, loadRoom)
onMounted(loadRoom)
</script>
