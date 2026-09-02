<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Housekeeping</h1>
    <p class="mt-1 text-stone-600">
      After checkout a room stays dirty until staff clean it. Stay-over cleans a room while the guest is still in-house. Marked clean rooms go back on sale.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Dirty</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ countBy('dirty') }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Cleaning</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ countBy('cleaning') }}</p>
      </div>
      <div class="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Occupied</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ countBy('occupied') }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Ready</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ countBy('ready') }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Maintenance</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ countBy('maintenance') }}</p>
      </div>
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
          <p class="text-sm font-medium text-stone-700">Room board</p>
          <select v-model="statusFilter" class="rounded-md border border-stone-300 px-2 py-1 text-xs">
            <option value="">All rooms</option>
            <option value="dirty">Dirty</option>
            <option value="cleaning">Cleaning</option>
            <option value="occupied">Occupied</option>
            <option value="ready">Ready</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
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
                  <template v-if="row.task_id && row.hk_status !== 'maintenance'">
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
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const statusFilter = ref('')
const form = reactive({
  room_id: 0,
  task_type: '',
  assigned_to: 0,
  due_date: todayKey(),
  notes: '',
})

const openableRooms = computed(() => {
  if (form.task_type === 'stayover') {
    return rooms.value.filter((r) => r.hk_status === 'occupied' && !r.task_id)
  }
  if (form.task_type === 'checkout' || form.task_type === 'deep_clean') {
    return rooms.value.filter((r) => r.hk_status === 'ready')
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
  if (!statusFilter.value) return rooms.value
  return rooms.value.filter((r) => r.hk_status === statusFilter.value)
})

function countBy(status) {
  return rooms.value.filter((r) => r.hk_status === status).length
}

function statusLabel(status) {
  const map = { dirty: 'Dirty', cleaning: 'Cleaning', occupied: 'Occupied', ready: 'Ready', maintenance: 'Maintenance' }
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
    ready: 'bg-green-100 text-green-800',
    maintenance: 'bg-stone-200 text-stone-700',
  }
  return map[status] || 'bg-stone-100 text-stone-700'
}

async function load() {
  loading.value = true
  try {
    const data = await getHousekeeping()
    rooms.value = data.rooms || []
    staff.value = data.staff || []
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

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
