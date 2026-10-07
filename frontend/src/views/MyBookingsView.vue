<template>
  <div>
    <PageHero title="My bookings" subtitle="See whether your request is waiting, confirmed and ready, or cancelled." image="/images/image_5.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        My bookings
      </template>
    </PageHero>

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
              <li>Total: {{ formatMoney(b.total_price) }}</li>
              <li v-if="b.invoice_no">Invoice: {{ b.invoice_no }}</li>
            </ul>
            <button
              v-if="['confirmed', 'in_house', 'completed'].includes(b.status)"
              type="button"
              class="mt-3 text-sm font-medium text-brand-700 hover:underline"
              @click="showInvoice(b)"
            >
              {{ invoice?.invoice_no && invoiceBookingId === b.id ? 'Hide invoice' : 'View invoice' }}
            </button>
            <div v-if="invoice && invoiceBookingId === b.id" class="mt-4">
              <p v-if="invoiceError" class="text-sm text-red-600">{{ invoiceError }}</p>
              <StayInvoice v-else :invoice="invoice" />
            </div>
            <p v-if="b.status === 'pending'" class="mt-3 text-sm text-amber-700">
              Waiting for the hotel to confirm. We will update this page when it is ready.
            </p>
            <p v-else-if="b.status === 'confirmed'" class="mt-3 text-sm text-green-700">
              Your booking is confirmed and ready. Please arrive on your check-in date.
            </p>
            <p v-else-if="b.status === 'in_house'" class="mt-3 text-sm text-sky-700">
              You are checked in. Enjoy your stay.
            </p>
            <p v-else-if="b.status === 'cancelled'" class="mt-3 text-sm text-red-700">
              This booking was cancelled. You can request another room anytime.
            </p>
            <p v-else-if="b.status === 'no_show'" class="mt-3 text-sm text-red-700">
              Marked as no-show. The hotel released those dates.
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
import { getBookingInvoice, getMyBookings, getNotifications, markNotificationsRead } from '../services/data'
import { formatMoney } from '../utils/money'
import PageHero from '../components/PageHero.vue'
import StayInvoice from '../components/StayInvoice.vue'

const { currentUser } = useAuth()
const bookings = ref([])
const notices = ref([])
const loading = ref(true)
const invoice = ref(null)
const invoiceBookingId = ref(null)
const invoiceError = ref('')
let pollTimer = null

const latestNotice = computed(() => notices.value.find((n) => Number(n.is_read) === 0) || notices.value[0] || null)

function statusLabel(status) {
  if (status === 'pending') return 'Waiting for confirmation'
  if (status === 'confirmed') return 'Confirmed — ready'
  if (status === 'in_house') return 'Checked in'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'no_show') return 'No-show'
  if (status === 'completed') return 'Completed'
  return status
}

async function showInvoice(b) {
  if (invoiceBookingId.value === b.id && invoice.value) {
    invoice.value = null
    invoiceBookingId.value = null
    invoiceError.value = ''
    return
  }
  invoiceError.value = ''
  invoiceBookingId.value = b.id
  invoice.value = null
  try {
    invoice.value = await getBookingInvoice(b.id)
  } catch (e) {
    invoiceError.value = e.message || 'Failed to load invoice'
  }
}

function statusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800'
  if (status === 'in_house') return 'bg-sky-100 text-sky-800'
  if (status === 'confirmed' || status === 'completed') return 'bg-green-100 text-green-800'
  if (status === 'cancelled' || status === 'no_show') return 'bg-red-100 text-red-800'
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
