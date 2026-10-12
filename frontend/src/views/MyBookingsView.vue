<template>
  <div>
    <PageHero title="My bookings" subtitle="See whether your request is waiting, confirmed and ready, or cancelled. You can change dates or cancel before arrival." image="/images/image_5.jpg">
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
          :class="latestNotice.type === 'cancelled'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-green-200 bg-green-50 text-green-800'"
        >
          {{ latestNotice.message }}
        </div>
        <p v-if="actionSuccess" class="mb-4 text-sm text-green-700">{{ actionSuccess }}</p>
        <p v-if="actionError" class="mb-4 text-sm text-red-600">{{ actionError }}</p>

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
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-if="['confirmed', 'in_house', 'completed'].includes(b.status)"
                type="button"
                class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                @click="showInvoice(b)"
              >
                {{ invoice?.invoice_no && invoiceBookingId === b.id ? 'Hide invoice' : 'View invoice' }}
              </button>
              <button
                v-if="canEdit(b)"
                type="button"
                class="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                @click="toggleChange(b)"
              >
                {{ changingId === b.id ? 'Close' : 'Change dates' }}
              </button>
              <button
                v-if="canEdit(b)"
                type="button"
                class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                @click="askCancel(b)"
              >
                Cancel stay
              </button>
            </div>
            <form
              v-if="changingId === b.id"
              class="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-warm-50 p-4 sm:grid-cols-2"
              @submit.prevent="saveChange"
            >
              <div>
                <label class="block text-xs font-medium text-stone-700">Check-in</label>
                <input v-model="changeForm.check_in" type="date" :min="today" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-stone-700">Check-out</label>
                <input v-model="changeForm.check_out" type="date" :min="changeForm.check_in || today" required class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-stone-700">Guests</label>
                <select v-model.number="changeForm.guests" class="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option v-for="n in guestChoices" :key="n" :value="n">{{ n }}</option>
                </select>
              </div>
              <div class="flex items-end">
                <p v-if="changeQuote" class="text-sm font-medium text-stone-800">
                  New total {{ formatMoney(changeQuote.total) }}
                  <span class="font-normal text-stone-500">· {{ changeQuote.nights }} night{{ changeQuote.nights === 1 ? '' : 's' }}</span>
                </p>
                <p v-else-if="changeQuoteError" class="text-sm text-red-600">{{ changeQuoteError }}</p>
                <p v-else-if="changeQuoteLoading" class="text-sm text-stone-500">Checking those dates…</p>
              </div>
              <div class="sm:col-span-2">
                <button
                  type="submit"
                  :disabled="saving || !changeQuote || !!changeQuoteError"
                  class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {{ saving ? 'Saving…' : 'Save new dates' }}
                </button>
              </div>
            </form>
            <div v-if="invoice && invoiceBookingId === b.id" class="mt-4">
              <p v-if="invoiceError" class="text-sm text-red-600">{{ invoiceError }}</p>
              <StayInvoice v-else :invoice="invoice" />
            </div>
            <p v-if="b.status === 'pending'" class="mt-3 text-sm text-amber-700">
              Waiting for the hotel to confirm. You can change dates or cancel this request here.
            </p>
            <p v-else-if="b.status === 'confirmed'" class="mt-3 text-sm text-green-700">
              Your booking is confirmed and ready.
              <span v-if="canEdit(b)">You can still change dates or cancel before the check-in date.</span>
              <span v-else>Please arrive on your check-in date.</span>
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

    <ConfirmModal
      :open="!!cancelTarget"
      :title="cancelTarget?.status === 'confirmed' ? 'Cancel this stay?' : 'Withdraw this request?'"
      :message="cancelTarget
        ? `${cancelTarget.room_name} (${cancelTarget.check_in} → ${cancelTarget.check_out}) will be cancelled and those dates will open for sale.`
        : ''"
      confirm-text="Cancel stay"
      cancel-text="Keep stay"
      @confirm="confirmCancel"
      @cancel="cancelTarget = null"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { getBookingInvoice, getCrsQuote, getMyBookings, getNotifications, markNotificationsRead, updateBooking } from '../services/data'
import { formatMoney } from '../utils/money'
import PageHero from '../components/PageHero.vue'
import StayInvoice from '../components/StayInvoice.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const { currentUser } = useAuth()
const bookings = ref([])
const notices = ref([])
const loading = ref(true)
const invoice = ref(null)
const invoiceBookingId = ref(null)
const invoiceError = ref('')
const changingId = ref(null)
const changeForm = ref({ check_in: '', check_out: '', guests: 1, max_persons: 4, room_id: 0 })
const changeQuote = ref(null)
const changeQuoteError = ref('')
const changeQuoteLoading = ref(false)
const saving = ref(false)
const actionError = ref('')
const actionSuccess = ref('')
const cancelTarget = ref(null)
let pollTimer = null

function localYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const today = localYmd()
const latestNotice = computed(() => notices.value.find((n) => Number(n.is_read) === 0) || notices.value[0] || null)
const guestChoices = computed(() => {
  const max = Math.max(1, Number(changeForm.value.max_persons) || 4)
  return Array.from({ length: max }, (_, i) => i + 1)
})

function canEdit(b) {
  if (b.status === 'pending') return true
  if (b.status === 'confirmed' && b.check_in > today) return true
  return false
}

function statusLabel(status) {
  if (status === 'pending') return 'Waiting for confirmation'
  if (status === 'confirmed') return 'Confirmed — ready'
  if (status === 'in_house') return 'Checked in'
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'no_show') return 'No-show'
  if (status === 'completed') return 'Completed'
  return status
}

function statusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-800'
  if (status === 'in_house') return 'bg-sky-100 text-sky-800'
  if (status === 'confirmed' || status === 'completed') return 'bg-green-100 text-green-800'
  if (status === 'cancelled' || status === 'no_show') return 'bg-red-100 text-red-800'
  return 'bg-stone-100 text-stone-600'
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

function toggleChange(b) {
  actionError.value = ''
  actionSuccess.value = ''
  if (changingId.value === b.id) {
    changingId.value = null
    changeQuote.value = null
    return
  }
  changingId.value = b.id
  changeForm.value = {
    check_in: b.check_in,
    check_out: b.check_out,
    guests: Number(b.guests || 1),
    max_persons: Number(b.max_persons || 4),
    room_id: b.room_id,
  }
}

function askCancel(b) {
  actionError.value = ''
  actionSuccess.value = ''
  cancelTarget.value = b
}

async function confirmCancel() {
  const b = cancelTarget.value
  cancelTarget.value = null
  if (!b) return
  saving.value = true
  try {
    await updateBooking(b.id, { status: 'cancelled' })
    changingId.value = null
    actionSuccess.value = 'Stay cancelled. Those dates are open again.'
    await load(false)
  } catch (e) {
    actionError.value = e.message || 'Could not cancel this stay.'
  }
  saving.value = false
}

async function refreshChangeQuote() {
  changeQuote.value = null
  changeQuoteError.value = ''
  const { check_in, check_out, room_id } = changeForm.value
  if (!changingId.value || !room_id || !check_in || !check_out) return
  if (check_out <= check_in) {
    changeQuoteError.value = 'Check-out must be after check-in.'
    return
  }
  changeQuoteLoading.value = true
  try {
    changeQuote.value = await getCrsQuote({
      room_id,
      check_in,
      check_out,
      exclude_id: changingId.value,
    })
  } catch (e) {
    changeQuoteError.value = e.message || 'Those dates are not available.'
  }
  changeQuoteLoading.value = false
}

async function saveChange() {
  actionError.value = ''
  actionSuccess.value = ''
  if (!changingId.value || !changeQuote.value) return
  saving.value = true
  try {
    await updateBooking(changingId.value, {
      check_in: changeForm.value.check_in,
      check_out: changeForm.value.check_out,
      guests: changeForm.value.guests,
    })
    actionSuccess.value = `Dates updated. New stay total ${formatMoney(changeQuote.value.total)}.`
    changingId.value = null
    changeQuote.value = null
    await load(false)
  } catch (e) {
    actionError.value = e.message || 'Could not change those dates.'
  }
  saving.value = false
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

watch(
  () => [changeForm.value.check_in, changeForm.value.check_out, changeForm.value.guests, changingId.value],
  () => {
    if (changingId.value) refreshChangeQuote()
  }
)

onMounted(async () => {
  loading.value = true
  await load(true)
  pollTimer = setInterval(() => load(false), 12000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
