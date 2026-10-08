<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Housekeeping</h1>
    <p class="mt-1 text-stone-600">
      Today’s rooms{{ boardDateLabel ? ` — ${boardDateLabel}` : '' }}. Dirty rooms and arrivals that still need a clean show first.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <button type="button" class="rounded-xl border bg-white p-4 text-left shadow-sm" :class="cardClass('to_clean', 'border-red-200')" @click="boardFilter = 'to_clean'">
        <p class="text-xs font-medium uppercase text-stone-500">To clean</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ todayCounts.to_clean }}</p>
      </button>
      <button type="button" class="rounded-xl border bg-white p-4 text-left shadow-sm" :class="cardClass('arrivals', 'border-amber-200')" @click="boardFilter = 'arrivals'">
        <p class="text-xs font-medium uppercase text-stone-500">Arrivals</p>
        <p class="mt-1 text-2xl font-bold text-amber-700">{{ todayCounts.arrivals }}</p>
      </button>
      <button type="button" class="rounded-xl border bg-white p-4 text-left shadow-sm" :class="cardClass('departures', 'border-blue-200')" @click="boardFilter = 'departures'">
        <p class="text-xs font-medium uppercase text-stone-500">Departures</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ todayCounts.departures }}</p>
      </button>
      <button type="button" class="rounded-xl border bg-white p-4 text-left shadow-sm" :class="cardClass('stayover', 'border-stone-200')" @click="boardFilter = 'stayover'">
        <p class="text-xs font-medium uppercase text-stone-500">Stay-over</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ todayCounts.stayovers }}</p>
      </button>
      <button type="button" class="rounded-xl border bg-white p-4 text-left shadow-sm" :class="cardClass('ready', 'border-green-200')" @click="boardFilter = 'ready'">
        <p class="text-xs font-medium uppercase text-stone-500">Ready for arrival</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ todayCounts.ready }}</p>
      </button>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Open a task</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Type</label>
            <select v-model="form.task_type" required class="field">
              <option disabled value="">________Selection________</option>
              <option value="checkout">Checkout clean</option>
              <option value="stayover">Stay-over</option>
              <option value="deep_clean">Deep clean</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Room</label>
            <select v-model.number="form.room_id" required class="field" :disabled="!form.task_type">
              <option disabled value="0">________Selection________</option>
              <option v-for="r in openableRooms" :key="r.room_id" :value="r.room_id">
                {{ r.room_name }} — {{ r.hotel_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Assign to</label>
            <select v-model.number="form.assigned_to" class="field">
              <option :value="0">Unassigned</option>
              <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.full_name }} — {{ s.position }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Due</label>
            <input v-model="form.due_date" type="date" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Notes</label>
            <input v-model="form.notes" type="text" class="field" placeholder="Optional" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !form.room_id || !form.task_type">
          {{ saving ? 'Saving…' : 'Open task' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <p class="text-sm font-medium text-stone-700">{{ boardTitle }}</p>
          <select v-model="boardFilter" class="rounded-md border border-stone-300 px-2 py-1 text-xs">
            <option value="today">Today</option>
            <option value="to_clean">To clean</option>
            <option value="arrivals">Arrivals</option>
            <option value="departures">Departures</option>
            <option value="stayover">Stay-over</option>
            <option value="dirty">Dirty</option>
            <option value="cleaning">Cleaning</option>
            <option value="occupied">Occupied</option>
            <option value="clean">Clean</option>
            <option value="out_of_order">Out of order</option>
            <option value="all">All rooms</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Today</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Task</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Assigned</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="row in filteredRooms" :key="row.room_id" class="hover:bg-stone-50">
                <td class="whitespace-nowrap px-4 py-3">
                  <p class="font-semibold text-stone-900">{{ row.room_name }}</p>
                  <p class="text-xs text-stone-500">{{ row.hotel_name }}</p>
                  <p v-if="row.today_guest" class="text-xs text-stone-500">{{ row.today_guest }}</p>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span v-if="row.arriving_today" class="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Arrival</span>
                    <span v-if="row.departing_today" class="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Departs</span>
                    <span v-if="row.stayover_today" class="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">Stay-over</span>
                    <span v-if="row.overdue" class="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Overdue</span>
                    <span v-if="row.arriving_today && (row.hk_status === 'dirty' || row.hk_status === 'cleaning')" class="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Clean first</span>
                    <span v-if="!row.arriving_today && !row.departing_today && !row.stayover_today && !row.overdue" class="text-stone-400">—</span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="boardClass(row.hk_status)">
                    {{ statusLabel(row.hk_status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-stone-600">
                  <template v-if="row.task_id">
                    {{ taskLabel(row.task_type) }}
                    <p v-if="row.due_date" class="text-xs text-stone-400">Due {{ row.due_date }}</p>
                  </template>
                  <span v-else class="text-stone-400">—</span>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <select
                    v-if="row.task_id"
                    class="rounded-md border border-stone-300 px-2 py-1 text-xs"
                    :value="Number(row.assigned_to) || 0"
                    @change="assign(row, $event.target.value)"
                  >
                    <option :value="0">Unassigned</option>
                    <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.full_name }}</option>
                  </select>
                  <span v-else class="text-stone-400">—</span>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <template v-if="row.task_id && row.hk_status !== 'out_of_order'">
                    <button
                      v-if="row.task_status === 'dirty'"
                      type="button"
                      class="mr-2 text-amber-700 hover:underline"
                      @click="setTask(row, 'in_progress')"
                    >Start</button>
                    <button
                      v-if="row.task_status === 'dirty' || row.task_status === 'in_progress'"
                      type="button"
                      class="text-green-700 hover:underline"
                      @click="setTask(row, 'clean')"
                    >Mark clean</button>
                  </template>
                  <button
                    v-else-if="row.hk_status === 'occupied' && !row.task_id"
                    type="button"
                    class="text-brand-600 hover:underline"
                    @click="openStayover(row)"
                  >Stay-over</button>
                  <span v-else class="text-stone-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="filteredRooms.length === 0 && !loading" class="p-4 text-center text-stone-500">No rooms in this list.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createHousekeepingTask, getHousekeeping, updateHousekeepingTask } from '../../services/data'
import { todayKey } from '../../services/hr'

const rooms = ref([])
const staff = ref([])
const boardDate = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const boardFilter = ref('today')
const form = reactive({
  room_id: 0,
  task_type: '',
  assigned_to: 0,
  due_date: todayKey(),
  notes: '',
})

const todayCounts = computed(() => ({
  to_clean: rooms.value.filter((r) => r.hk_status === 'dirty' || r.hk_status === 'cleaning').length,
  arrivals: rooms.value.filter((r) => r.arriving_today).length,
  departures: rooms.value.filter((r) => r.departing_today).length,
  stayovers: rooms.value.filter((r) => r.stayover_today).length,
  ready: rooms.value.filter((r) => r.arriving_today && r.hk_status === 'clean').length,
}))

const boardDateLabel = computed(() => formatBoardDate(boardDate.value))

const boardTitle = computed(() => {
  const map = {
    today: 'Today’s rooms',
    to_clean: 'To clean',
    arrivals: 'Arrivals',
    departures: 'Departures',
    stayover: 'Stay-over',
    ready: 'Ready for arrival',
    dirty: 'Dirty',
    cleaning: 'Cleaning',
    occupied: 'Occupied',
    clean: 'Clean',
    out_of_order: 'Out of order',
    all: 'All rooms',
  }
  return map[boardFilter.value] || 'Room board'
})

const openableRooms = computed(() => {
  if (form.task_type === 'stayover') {
    return rooms.value.filter((r) => r.hk_status === 'occupied' && !r.task_id)
  }
  if (form.task_type === 'checkout' || form.task_type === 'deep_clean') {
    return rooms.value.filter((r) => r.hk_status === 'clean')
  }
  return []
})

watch(
  () => form.task_type,
  () => {
    form.room_id = 0
  }
)

const filteredRooms = computed(() => {
  let list = rooms.value
  const filter = boardFilter.value
  if (filter === 'today') list = list.filter((r) => r.today)
  else if (filter === 'to_clean') list = list.filter((r) => r.hk_status === 'dirty' || r.hk_status === 'cleaning')
  else if (filter === 'arrivals') list = list.filter((r) => r.arriving_today)
  else if (filter === 'departures') list = list.filter((r) => r.departing_today)
  else if (filter === 'stayover') list = list.filter((r) => r.stayover_today)
  else if (filter === 'ready') list = list.filter((r) => r.arriving_today && r.hk_status === 'clean')
  else if (filter && filter !== 'all') list = list.filter((r) => r.hk_status === filter)
  return [...list].sort((a, b) => todayRank(a) - todayRank(b) || String(a.room_name).localeCompare(String(b.room_name)))
})

function todayRank(row) {
  if (row.hk_status === 'dirty') return 1
  if (row.hk_status === 'cleaning') return 2
  if (row.arriving_today && row.hk_status !== 'clean') return 3
  if (row.departing_today) return 4
  if (row.arriving_today) return 5
  if (row.stayover_today) return 6
  return 9
}

function cardClass(filter, border) {
  return boardFilter.value === filter ? `${border} ring-1 ring-brand-400` : border
}

function formatBoardDate(value) {
  if (!value) return ''
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusLabel(status) {
  const map = {
    dirty: 'Dirty',
    cleaning: 'Cleaning',
    occupied: 'Occupied',
    clean: 'Clean',
    out_of_order: 'Out of order',
  }
  return map[status] || status
}

function taskLabel(type) {
  const map = { checkout: 'Checkout', stayover: 'Stay-over', deep_clean: 'Deep clean' }
  return map[type] || type
}

function boardClass(status) {
  const map = {
    dirty: 'bg-red-100 text-red-800',
    cleaning: 'bg-amber-100 text-amber-800',
    occupied: 'bg-blue-100 text-blue-800',
    clean: 'bg-green-100 text-green-800',
    out_of_order: 'bg-stone-200 text-stone-700',
  }
  return map[status] || 'bg-stone-100 text-stone-700'
}

async function load() {
  loading.value = true
  try {
    const data = await getHousekeeping()
    rooms.value = data.rooms || []
    staff.value = data.staff || []
    boardDate.value = data.date || todayKey()
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function create() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createHousekeepingTask({
      room_id: form.room_id,
      task_type: form.task_type,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date,
      notes: form.notes || null,
    })
    form.room_id = 0
    form.task_type = ''
    form.notes = ''
    success.value = 'Task opened.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function assign(row, value) {
  error.value = ''
  try {
    await updateHousekeepingTask(row.task_id, { assigned_to: Number(value) || null })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function setTask(row, status) {
  error.value = ''
  try {
    await updateHousekeepingTask(row.task_id, { status })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function openStayover(row) {
  error.value = ''
  success.value = ''
  try {
    await createHousekeepingTask({
      room_id: row.room_id,
      task_type: 'stayover',
      due_date: boardDate.value || todayKey(),
    })
    success.value = `Stay-over opened for ${row.room_name}.`
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
