<template>
  <div>
    <p class="text-sm text-stone-600">
      Create a stay, check the guest in with ID and a room, post charges to the folio, then collect the balance at check-out.
    </p>

    <form class="mt-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-sm font-semibold text-stone-800">
          {{ editingId ? `Change dates — booking #${editingId}` : 'New booking' }}
        </h2>
        <p v-if="quote" class="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
          {{ quote.nights }} night{{ quote.nights === 1 ? '' : 's' }} · {{ formatMoney(quote.total) }}
        </p>
      </div>

      <div v-if="editingId" class="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
        {{ editingGuest }}
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <template v-if="!editingId">
          <div>
            <label class="block text-xs font-medium text-stone-700">Guest type</label>
            <select v-model="guestMode" class="field">
              <option value="existing">Existing guest</option>
              <option value="walkin">Walk-in (new)</option>
            </select>
          </div>
          <div v-if="guestMode === 'existing'">
            <label class="block text-xs font-medium text-stone-700">Guest</label>
            <select v-model.number="form.user_id" required class="field">
              <option disabled value="0">Select guest</option>
              <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.username }} — {{ g.email }}</option>
            </select>
          </div>
          <template v-else>
            <div>
              <label class="block text-xs font-medium text-stone-700">Walk-in name</label>
              <input v-model="form.walk_in_name" type="text" required class="field" placeholder="Guest name" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Email (optional)</label>
              <input v-model="form.walk_in_email" type="email" class="field" placeholder="If they have one" />
            </div>
          </template>
        </template>
        <div>
          <label class="block text-xs font-medium text-stone-700">Check-in</label>
          <input v-model="form.check_in" type="date" required class="field" />
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-700">Check-out</label>
          <input v-model="form.check_out" type="date" required class="field" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-stone-700">Room</label>
          <select v-model.number="form.room_id" required class="field">
            <option disabled value="0">Select room</option>
            <option v-for="r in bookableRooms" :key="r.id" :value="r.id">
              {{ r.name }} — {{ r.hotel_name }} ({{ formatMoney(r.price) }}/night)
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-700">Guests</label>
          <select v-model.number="form.guests" class="field">
            <option v-for="n in guestChoices" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div v-if="!editingId">
          <label class="block text-xs font-medium text-stone-700">Status</label>
          <select v-model="form.status" class="field">
            <option value="pending">Pending (request)</option>
            <option value="confirmed">Confirmed (walk-in / phone)</option>
          </select>
        </div>
      </div>

      <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
      <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          :disabled="saving || !form.room_id || !quote"
        >
          {{ saving ? 'Saving…' : editingId ? 'Save dates' : 'Create booking' }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          @click="resetForm"
        >
          Cancel edit
        </button>
      </div>
    </form>

    <section v-if="stay" ref="stayPanel" class="mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 class="text-sm font-semibold text-stone-800">Stay #{{ stay.id }} — {{ stay.username }}</h2>
          <p class="mt-1 text-sm text-stone-600">
            {{ stay.room_name }} · {{ stay.check_in }} → {{ stay.check_out }}
            <span
              class="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              :class="statusClass(stay.status)"
            >{{ statusLabel(stay.status) }}</span>
          </p>
          <p v-if="stay.guest_id_number" class="mt-1 text-xs text-stone-500">
            ID: {{ idTypeLabel(stay.guest_id_type) }} {{ stay.guest_id_number }}
          </p>
        </div>
        <button type="button" class="action-btn" @click="stay = null">Close</button>
      </div>

      <form v-if="stay.status === 'confirmed'" class="mt-4 border-t border-stone-100 pt-4" @submit.prevent="submitCheckIn">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-stone-500">Check in</h3>
        <div class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label class="block text-xs font-medium text-stone-700">ID type</label>
            <select v-model="checkInForm.guest_id_type" class="field">
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">ID number</label>
            <input v-model="checkInForm.guest_id_number" type="text" required class="field" placeholder="Document number" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Room assigned</label>
            <select v-model.number="checkInForm.room_id" class="field">
              <option v-for="r in bookableRooms" :key="r.id" :value="r.id">
                {{ r.name }} — {{ r.hotel_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Deposit</label>
            <input v-model.number="checkInForm.deposit_amount" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Deposit method</label>
            <select v-model="checkInForm.deposit_method" class="field">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
        <p v-if="stayError" class="mt-3 text-sm text-red-600">{{ stayError }}</p>
        <button
          type="submit"
          class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          :disabled="staySaving"
        >
          {{ staySaving ? 'Checking in…' : 'Check in guest' }}
        </button>
      </form>

      <div v-else class="mt-4 border-t border-stone-100 pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-stone-500">Folio</h3>
          <p class="text-sm font-semibold" :class="Number(stay.folio_balance) > 0.009 ? 'text-amber-700' : 'text-green-700'">
            Balance {{ formatMoney(stay.folio_balance) }}
          </p>
        </div>
        <div class="mt-3 overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-stone-700">When</th>
                <th class="px-3 py-2 text-left font-medium text-stone-700">Line</th>
                <th class="px-3 py-2 text-left font-medium text-stone-700">Type</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">Amount</th>
                <th class="px-3 py-2" />
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="item in stay.folio || []" :key="item.id">
                <td class="whitespace-nowrap px-3 py-2 text-xs text-stone-500">{{ item.created_at }}</td>
                <td class="px-3 py-2 text-stone-800">
                  {{ item.description }}
                  <span v-if="item.method" class="text-xs text-stone-500"> · {{ item.method }}</span>
                </td>
                <td class="px-3 py-2 capitalize text-stone-600">{{ folioCategoryLabel(item.category) }}</td>
                <td
                  class="whitespace-nowrap px-3 py-2 text-right font-medium"
                  :class="item.kind === 'payment' ? 'text-green-700' : 'text-stone-800'"
                >
                  {{ item.kind === 'payment' ? '−' : '' }}{{ formatMoney(item.amount) }}
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                    v-if="stay.status === 'in_house' && item.category !== 'room'"
                    type="button"
                    class="action-btn text-red-700 ring-red-200 hover:bg-red-50"
                    @click="removeFolioLine(item)"
                  >Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-stone-500">
          Charges {{ formatMoney(stay.folio_charges) }} · Payments {{ formatMoney(stay.folio_payments) }}
        </p>

        <form v-if="stay.status === 'in_house'" class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="submitCharge">
          <div class="xl:col-span-2">
            <label class="block text-xs font-medium text-stone-700">Extra charge</label>
            <input v-model="chargeForm.description" type="text" required class="field" placeholder="Minibar, laundry…" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Category</label>
            <select v-model="chargeForm.category" class="field">
              <option value="minibar">Mini-bar</option>
              <option value="laundry">Laundry</option>
              <option value="fnb">Food & beverage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Amount</label>
            <div class="flex gap-2">
              <input v-model.number="chargeForm.amount" type="number" min="0.01" step="0.01" required class="field" />
              <button type="submit" class="mt-1 rounded-md bg-stone-800 px-3 text-xs font-medium text-white hover:bg-stone-900" :disabled="staySaving">Add</button>
            </div>
          </div>
        </form>

        <form v-if="stay.status === 'in_house'" class="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="submitPayment">
          <div class="xl:col-span-2">
            <label class="block text-xs font-medium text-stone-700">Payment note</label>
            <input v-model="payForm.description" type="text" required class="field" placeholder="Deposit / extra payment" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Method</label>
            <select v-model="payForm.method" class="field">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Amount</label>
            <div class="flex gap-2">
              <input v-model.number="payForm.amount" type="number" min="0.01" step="0.01" required class="field" />
              <button type="submit" class="mt-1 rounded-md bg-stone-800 px-3 text-xs font-medium text-white hover:bg-stone-900" :disabled="staySaving">Take</button>
            </div>
          </div>
        </form>

        <form v-if="stay.status === 'in_house'" class="mt-5 flex flex-wrap items-end gap-3 rounded-lg bg-stone-50 p-3" @submit.prevent="submitCheckOut">
          <div>
            <label class="block text-xs font-medium text-stone-700">Settle remaining</label>
            <input v-model.number="checkoutForm.payment_amount" type="number" min="0" step="0.01" class="field w-40" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Method</label>
            <select v-model="checkoutForm.payment_method" class="field w-36">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
            </select>
          </div>
          <button
            type="submit"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            :disabled="staySaving"
          >
            {{ staySaving ? 'Checking out…' : 'Check out' }}
          </button>
        </form>
        <p v-if="stayError" class="mt-3 text-sm text-red-600">{{ stayError }}</p>
        <p v-if="staySuccess" class="mt-3 text-sm text-green-600">{{ staySuccess }}</p>
      </div>
    </section>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-stone-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm font-medium text-stone-700">All bookings</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="tab in filterTabs"
            :key="tab.value || 'all'"
            type="button"
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="statusFilter === tab.value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
            @click="statusFilter = tab.value"
          >
            {{ tab.label }} <span class="opacity-70">{{ tab.n }}</span>
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-[56rem] w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Dates</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Total</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="sticky right-0 bg-stone-50 px-4 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in filteredBookings" :key="b.id" class="group hover:bg-stone-50">
              <td class="px-4 py-3 font-medium text-stone-500">{{ b.id }}</td>
              <td class="px-4 py-3">
                <p class="font-medium text-stone-800">{{ b.username }}</p>
                <p class="text-xs text-stone-500">{{ b.email }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-stone-800">{{ b.room_name }}</p>
                <p class="text-xs text-stone-500">{{ b.hotel_name }}</p>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-stone-700">
                {{ b.check_in }} → {{ b.check_out }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-medium text-stone-800">{{ formatMoney(b.total_price) }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(b.status)">
                  {{ statusLabel(b.status) }}
                </span>
              </td>
              <td class="sticky right-0 bg-white px-4 py-3 group-hover:bg-stone-50">
                <div v-if="canAct(b)" class="flex flex-wrap gap-1.5">
                  <button
                    v-if="b.status === 'pending'"
                    type="button"
                    class="action-btn text-green-700 ring-green-200 hover:bg-green-50"
                    @click="updateStatus(b.id, 'confirmed')"
                  >Confirm</button>
                  <button
                    v-if="b.status === 'confirmed'"
                    type="button"
                    class="action-btn text-brand-800 ring-brand-200 hover:bg-brand-50"
                    @click="openStay(b)"
                  >Check in</button>
                  <button
                    v-if="b.status === 'in_house' || b.status === 'completed'"
                    type="button"
                    class="action-btn text-brand-800 ring-brand-200 hover:bg-brand-50"
                    @click="openStay(b)"
                  >Folio</button>
                  <button
                    v-if="b.status === 'pending' || b.status === 'confirmed' || b.status === 'in_house'"
                    type="button"
                    class="action-btn"
                    @click="startEdit(b)"
                  >Dates</button>
                  <button
                    v-if="b.status === 'confirmed'"
                    type="button"
                    class="action-btn"
                    @click="askNoShow(b)"
                  >No-show</button>
                  <button
                    v-if="b.status === 'pending' || b.status === 'confirmed'"
                    type="button"
                    class="action-btn text-red-700 ring-red-200 hover:bg-red-50"
                    @click="askCancel(b)"
                  >Cancel</button>
                </div>
                <span v-else class="text-stone-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="filteredBookings.length === 0 && !loading" class="p-4 text-center text-stone-500">No bookings found.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>

    <ConfirmModal
      :open="!!confirmAction"
      :title="confirmAction?.title"
      :message="confirmAction?.message"
      :confirm-text="confirmAction?.confirmText"
      @confirm="runConfirm"
      @cancel="confirmAction = null"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmModal from '../../components/ConfirmModal.vue'
import {
  addFolioItem,
  checkInBooking,
  checkOutBooking,
  createBooking,
  deleteFolioItem,
  getBooking,
  getBookings,
  getCrsQuote,
  getRooms,
  getUsers,
  updateBooking,
} from '../../services/data'
import { formatMoney } from '../../utils/money'

const emptyForm = () => ({
  user_id: 0,
  walk_in_name: '',
  walk_in_email: '',
  room_id: 0,
  check_in: '',
  check_out: '',
  guests: 1,
  status: 'confirmed',
})

const route = useRoute()
const router = useRouter()
const bookings = ref([])
const rooms = ref([])
const users = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const quote = ref(null)
const guestMode = ref('existing')
const editingId = ref(null)
const editingGuest = ref('')
const form = reactive(emptyForm())
const confirmAction = ref(null)
const statusFilter = ref(route.query.status || '')
const stay = ref(null)
const stayPanel = ref(null)
const staySaving = ref(false)
const stayError = ref('')
const staySuccess = ref('')
const checkInForm = reactive({
  guest_id_type: 'national_id',
  guest_id_number: '',
  room_id: 0,
  deposit_amount: 0,
  deposit_method: 'cash',
})
const chargeForm = reactive({ description: '', category: 'other', amount: null })
const payForm = reactive({ description: 'Payment', method: 'cash', amount: null })
const checkoutForm = reactive({ payment_amount: 0, payment_method: 'cash' })

const guests = computed(() => users.value.filter((u) => (u.role || '').toLowerCase() === 'guest'))
const bookableRooms = computed(() => rooms.value.filter((r) => r.status !== 'maintenance'))
const selectedRoom = computed(() => bookableRooms.value.find((r) => r.id === form.room_id))
const guestChoices = computed(() => {
  const max = Number(selectedRoom.value?.max_persons || 4)
  return Array.from({ length: max }, (_, i) => i + 1)
})

const filteredBookings = computed(() => {
  if (!statusFilter.value) return bookings.value
  return bookings.value.filter((b) => b.status === statusFilter.value)
})

const filterTabs = computed(() => {
  const all = bookings.value
  const count = (status) => all.filter((b) => b.status === status).length
  return [
    { value: '', label: 'All', n: all.length },
    { value: 'pending', label: 'Pending', n: count('pending') },
    { value: 'confirmed', label: 'Confirmed', n: count('confirmed') },
    { value: 'in_house', label: 'In-house', n: count('in_house') },
    { value: 'no_show', label: 'No-show', n: count('no_show') },
    { value: 'cancelled', label: 'Cancelled', n: count('cancelled') },
    { value: 'completed', label: 'Completed', n: count('completed') },
  ]
})

watch(statusFilter, (value) => {
  const current = route.query.status || ''
  if (value === current) return
  router.replace({ query: value ? { status: value } : {} })
})

watch(
  () => route.query.status,
  (value) => {
    statusFilter.value = value || ''
  }
)

watch(
  () => [form.room_id, form.check_in, form.check_out, editingId.value],
  () => {
    refreshQuote()
  }
)

function canAct(b) {
  return ['pending', 'confirmed', 'in_house', 'completed'].includes(b.status)
}

function statusLabel(status) {
  if (status === 'no_show') return 'No-show'
  if (status === 'pending') return 'Pending'
  if (status === 'confirmed') return 'Confirmed'
  if (status === 'in_house') return 'In-house'
  if (status === 'cancelled') return 'Cancelled'
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

function idTypeLabel(type) {
  if (type === 'passport') return 'Passport'
  if (type === 'other') return 'Other'
  return 'National ID'
}

function folioCategoryLabel(category) {
  if (category === 'fnb') return 'F&B'
  if (category === 'minibar') return 'Mini-bar'
  if (category === 'room') return 'Room'
  if (category === 'deposit') return 'Deposit'
  return category || 'Other'
}

function resetForm() {
  editingId.value = null
  editingGuest.value = ''
  guestMode.value = 'existing'
  Object.assign(form, emptyForm())
  quote.value = null
  error.value = ''
}

function startEdit(b) {
  editingId.value = b.id
  editingGuest.value = `${b.username} (${b.email})`
  form.user_id = b.user_id
  form.room_id = b.room_id
  form.check_in = b.check_in
  form.check_out = b.check_out
  form.guests = Number(b.guests || 1)
  error.value = ''
  success.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function applyStay(data) {
  stay.value = data
  stayError.value = ''
  checkInForm.guest_id_type = data.guest_id_type || 'national_id'
  checkInForm.guest_id_number = data.guest_id_number || ''
  checkInForm.room_id = Number(data.room_id)
  checkInForm.deposit_amount = 0
  checkInForm.deposit_method = 'cash'
  chargeForm.description = ''
  chargeForm.category = 'other'
  chargeForm.amount = null
  payForm.description = 'Payment'
  payForm.method = 'cash'
  payForm.amount = null
  checkoutForm.payment_amount = Number(data.folio_balance || 0)
  checkoutForm.payment_method = 'cash'
}

async function openStay(b) {
  stayError.value = ''
  staySuccess.value = ''
  try {
    applyStay(await getBooking(b.id))
    await nextTick()
    stayPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (e) {
    alert(e.message || 'Failed to open stay')
  }
}

async function submitCheckIn() {
  stayError.value = ''
  staySuccess.value = ''
  staySaving.value = true
  try {
    applyStay(
      await checkInBooking(stay.value.id, {
        guest_id_type: checkInForm.guest_id_type,
        guest_id_number: checkInForm.guest_id_number,
        room_id: checkInForm.room_id,
        deposit_amount: checkInForm.deposit_amount || 0,
        deposit_method: checkInForm.deposit_method,
      })
    )
    staySuccess.value = 'Guest is in-house. Room stay is on the folio.'
    await load()
  } catch (e) {
    stayError.value = e.message || 'Check-in failed'
  }
  staySaving.value = false
}

async function submitCharge() {
  stayError.value = ''
  staySuccess.value = ''
  staySaving.value = true
  try {
    applyStay(
      await addFolioItem(stay.value.id, {
        kind: 'charge',
        category: chargeForm.category,
        description: chargeForm.description,
        amount: chargeForm.amount,
      })
    )
    staySuccess.value = 'Charge posted.'
    await load()
  } catch (e) {
    stayError.value = e.message || 'Failed to add charge'
  }
  staySaving.value = false
}

async function submitPayment() {
  stayError.value = ''
  staySuccess.value = ''
  staySaving.value = true
  try {
    applyStay(
      await addFolioItem(stay.value.id, {
        kind: 'payment',
        description: payForm.description,
        amount: payForm.amount,
        method: payForm.method,
      })
    )
    staySuccess.value = 'Payment posted.'
    await load()
  } catch (e) {
    stayError.value = e.message || 'Failed to take payment'
  }
  staySaving.value = false
}

async function removeFolioLine(item) {
  stayError.value = ''
  staySaving.value = true
  try {
    applyStay(await deleteFolioItem(stay.value.id, item.id))
    staySuccess.value = 'Line removed.'
    await load()
  } catch (e) {
    stayError.value = e.message || 'Failed to remove line'
  }
  staySaving.value = false
}

async function submitCheckOut() {
  stayError.value = ''
  staySuccess.value = ''
  staySaving.value = true
  try {
    applyStay(
      await checkOutBooking(stay.value.id, {
        payment_amount: checkoutForm.payment_amount || 0,
        payment_method: checkoutForm.payment_method,
      })
    )
    staySuccess.value = 'Guest checked out. Housekeeping will be notified.'
    await load()
  } catch (e) {
    stayError.value = e.message || 'Check-out failed'
  }
  staySaving.value = false
}

async function refreshQuote() {
  quote.value = null
  if (!form.room_id || !form.check_in || !form.check_out) return
  try {
    const params = { room_id: form.room_id, check_in: form.check_in, check_out: form.check_out }
    if (editingId.value) params.exclude_id = editingId.value
    quote.value = await getCrsQuote(params)
    error.value = ''
  } catch (e) {
    quote.value = null
    error.value = e.message || 'Those dates are not available.'
  }
}

async function load() {
  loading.value = true
  try {
    const [b, r, u] = await Promise.all([getBookings(), getRooms(), getUsers({ role: 'guest' })])
    bookings.value = b
    rooms.value = r
    users.value = u
    if (guests.value.length === 0) users.value = await getUsers()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function save() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await updateBooking(editingId.value, {
        room_id: form.room_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: form.guests,
      })
      success.value = 'Dates updated. Those nights stay blocked for this room.'
      if (stay.value?.id === editingId.value) {
        applyStay(await getBooking(editingId.value))
      }
      resetForm()
    } else {
      const payload = {
        room_id: form.room_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: form.guests,
        status: form.status,
      }
      if (guestMode.value === 'walkin') {
        payload.walk_in_name = form.walk_in_name
        payload.walk_in_email = form.walk_in_email
      } else {
        payload.user_id = form.user_id
      }
      await createBooking(payload)
      success.value = 'Booking saved. Those dates cannot be sold again.'
      resetForm()
    }
    await load()
  } catch (e) {
    error.value = e.message || 'Save failed'
  }
  saving.value = false
}

async function updateStatus(id, status) {
  try {
    await updateBooking(id, { status })
    await load()
  } catch (e) {
    alert(e.message || 'Update failed')
  }
}

function askCancel(b) {
  confirmAction.value = {
    title: 'Cancel this booking?',
    message: `Booking #${b.id} will be cancelled and those dates will open for sale.`,
    confirmText: 'Cancel booking',
    run: () => updateStatus(b.id, 'cancelled'),
  }
}

function askNoShow(b) {
  confirmAction.value = {
    title: 'Mark no-show?',
    message: `Guest did not arrive for booking #${b.id}. The room dates will open for sale.`,
    confirmText: 'Mark no-show',
    run: () => updateStatus(b.id, 'no_show'),
  }
}

async function runConfirm() {
  const action = confirmAction.value
  confirmAction.value = null
  if (action?.run) await action.run()
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
.action-btn {
  @apply rounded-md px-2 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50;
}
</style>
