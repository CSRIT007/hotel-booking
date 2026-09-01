<template>
  <div>
    <section class="bg-stone-800 py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="text-brand-300 text-sm">
          <router-link to="/" class="hover:text-brand-200">Home</router-link>
          <span class="mx-2">/</span>
          My bookings
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white">My bookings</h1>
        <p class="mt-1 text-stone-300">See whether your request is waiting, confirmed and ready, or cancelled.</p>
      </div>
    </section>

    <section class="py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          v-if="latestNotice"
          class="mb-6 rounded-xl border px-4 py-3 text-sm"
          :class="latestNotice.type === 'confirmed'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'"
        >
          {{ latestNotice.message }}
        </div>

        <div class="space-y-4">
          <div
            v-for="b in bookings"
            :key="b.id"
            class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-display text-lg font-semibold text-stone-800">{{ b.room_name || 'Room' }}</h2>
                <p class="text-sm text-stone-500">{{ b.hotel_name }}</p>
              </div>
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                :class="statusClass(b.status)"
              >
                {{ statusLabel(b.status) }}
              </span>
            </div>
            <ul class="mt-3 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
              <li>Check-in: {{ b.check_in }}</li>
              <li>Check-out: {{ b.check_out }}</li>
              <li>Guests: {{ b.guests }}</li>
              <li>Total: ${{ Number(b.total_price || 0).toFixed(2) }}</li>
            </ul>
            <p v-if="b.status === 'pending'" class="mt-3 text-sm text-amber-700">
              Waiting for the hotel to confirm. We will update this page when it is ready.
            </p>
            <p v-else-if="b.status === 'confirmed'" class="mt-3 text-sm text-green-700">
              Your booking is confirmed and ready. Please arrive on your check-in date.
            </p>
            <p v-else-if="b.status === 'cancelled'" class="mt-3 text-sm text-red-700">
              This booking was cancelled. You can request another room anytime.
            </p>
          </div>
        </div>

        <p v-if="!loading && bookings.length === 0" class="text-center text-stone-500">
          You have no bookings yet.
          <router-link to="/rooms" class="text-brand-600 hover:underline">Browse rooms</router-link>
        </p>
        <p v-if="loading" class="text-center text-stone-500">Loading…</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { getMyBookings, getNotifications, markNotificationsRead } from '../services/data'

const { currentUser } = useAuth()
const bookings = ref([])
const notices = ref([])
const loading = ref(true)
let pollTimer = null

const latestNotice = computed(() => notices.value.find((n) => Number(n.is_read) === 0) || notices.value[0] || null)

function statusLabel(status) {
  if (status === 'pending') return 'Waiting for confirmation'
  if (status === 'confirmed') return 'Confirmed — ready'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'
  return status
}

function statusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800'
  if (status === 'confirmed' || status === 'completed') return 'bg-green-100 text-green-800'
  if (status === 'cancelled') return 'bg-red-100 text-red-800'
  return 'bg-stone-100 text-stone-600'
}

async function load(markRead = false) {
  const userId = currentUser.value?.id
  if (!userId) {
    loading.value = false
    return
  }
  try {
    const [list, notes] = await Promise.all([getMyBookings(userId), getNotifications(userId)])
    bookings.value = list
    notices.value = notes
    if (markRead) await markNotificationsRead(userId)
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

onMounted(async () => {
  loading.value = true
  await load(true)
  pollTimer = setInterval(() => load(false), 12000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
