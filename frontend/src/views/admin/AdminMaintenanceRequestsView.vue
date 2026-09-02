<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Requests</h1>
    <p class="mt-1 text-stone-600">
      Open a work order to take a room off sale. Completing or cancelling it returns the room if no other jobs are open. Costs over $0 post to Finance as Maintenance.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Open</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ countBy(['open', 'assigned']) }}</p>
      </div>
      <div class="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">In progress</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ countBy(['in_progress']) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">On hold</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ countBy(['on_hold']) }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Completed</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ countBy(['completed']) }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">New work order</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Type</label>
            <select v-model="form.request_type" class="field">
              <option value="repair">Repair</option>
              <option value="emergency">Emergency</option>
              <option value="preventive">Preventive</option>
              <option value="inspection">Inspection</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Room</label>
            <select v-model.number="form.room_id" class="field">
              <option :value="0">________Selection________</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} — {{ r.hotel_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Location (if not a room)</label>
            <input v-model="form.location" type="text" class="field" placeholder="Lobby, plant room, pool" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Category</label>
              <select v-model="form.category" class="field">
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
                <option>Furniture</option>
                <option>Appliance</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Priority</label>
              <select v-model="form.priority" class="field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Assign to</label>
            <select v-model.number="form.assigned_to" class="field">
              <option :value="0">Unassigned</option>
              <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.full_name }} — {{ s.position }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Issue</label>
            <textarea v-model="form.description" rows="3" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Estimated cost</label>
            <input v-model.number="form.estimated_cost" type="number" min="0" step="0.01" class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Open work order' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Work order</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Priority</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Technician</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in requests" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">#{{ row.id }} {{ row.room_name || row.location }}</p>
                <p class="text-xs capitalize text-stone-500">{{ row.request_type }} · {{ row.category }}</p>
                <p class="line-clamp-2 text-xs text-stone-500">{{ row.description }}</p>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="priorityClass(row.priority)">{{ row.priority }}</span>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="statusClass(row.status)">{{ labelStatus(row.status) }}</span>
              </td>
              <td class="px-3 py-3">
                <select
                  class="w-full rounded-md border border-stone-300 px-2 py-1 text-xs"
                  :value="row.assigned_to || 0"
                  :disabled="isClosed(row)"
                  @change="assign(row, $event)"
                >
                  <option :value="0">Unassigned</option>
                  <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.full_name }}</option>
                </select>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <template v-if="!isClosed(row)">
                  <button v-if="row.status !== 'in_progress'" type="button" class="mr-2 text-brand-700 hover:underline" @click="setStatus(row, 'in_progress')">Start</button>
                  <button v-if="row.status === 'in_progress'" type="button" class="mr-2 text-green-700 hover:underline" @click="complete(row)">Complete</button>
                  <button v-if="row.status !== 'on_hold'" type="button" class="mr-2 text-stone-600 hover:underline" @click="setStatus(row, 'on_hold')">Hold</button>
                  <button type="button" class="mr-2 text-red-600 hover:underline" @click="setStatus(row, 'cancelled')">Cancel</button>
                  <button v-if="row.status === 'open'" type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
                </template>
                <span v-else class="text-stone-400">{{ row.completed_at || '—' }}</span>
                <div v-if="row.status === 'in_progress'" class="mt-1">
                  <input v-model.number="costs[row.id]" type="number" min="0" step="0.01" class="w-24 rounded border border-stone-300 px-2 py-0.5 text-xs" placeholder="Cost" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="requests.length === 0 && !loading" class="p-4 text-center text-stone-500">No work orders yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createMaintenanceRequest, deleteMaintenanceRequest, getMaintenanceRequests, updateMaintenanceRequest } from '../../services/data'

const requests = ref([])
const rooms = ref([])
const staff = ref([])
const costs = reactive({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  request_type: 'repair',
  room_id: 0,
  location: '',
  category: 'Plumbing',
  priority: 'medium',
  assigned_to: 0,
  description: '',
  estimated_cost: 0,
})

function countBy(statuses) {
  return requests.value.filter((r) => statuses.includes(r.status)).length
}

function isClosed(row) {
  return row.status === 'completed' || row.status === 'cancelled'
}

function labelStatus(status) {
  return status.replace('_', ' ')
}

function priorityClass(priority) {
  const map = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-stone-100 text-stone-600',
  }
  return map[priority] || map.medium
}

function statusClass(status) {
  const map = {
    open: 'bg-amber-100 text-amber-800',
    assigned: 'bg-sky-100 text-sky-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-stone-200 text-stone-700',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-700',
  }
  return map[status] || map.open
}

async function load() {
  loading.value = true
  try {
    const data = await getMaintenanceRequests()
    requests.value = data.requests || []
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
    await createMaintenanceRequest({
      ...form,
      room_id: form.room_id || null,
      assigned_to: form.assigned_to || null,
    })
    form.description = ''
    form.location = ''
    form.room_id = 0
    form.assigned_to = 0
    form.estimated_cost = 0
    success.value = 'Work order opened. A room on this ticket is off sale until it is completed.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function assign(row, event) {
  error.value = ''
  try {
    const value = Number(event.target.value) || null
    await updateMaintenanceRequest(row.id, { assigned_to: value })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function setStatus(row, status) {
  error.value = ''
  try {
    await updateMaintenanceRequest(row.id, { status })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function complete(row) {
  error.value = ''
  try {
    await updateMaintenanceRequest(row.id, { status: 'completed', actual_cost: costs[row.id] || 0 })
    success.value = 'Work order completed.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteMaintenanceRequest(row.id)
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
