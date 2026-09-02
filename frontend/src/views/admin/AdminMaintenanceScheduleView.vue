<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Schedule</h1>
    <p class="mt-1 text-stone-600">
      Plan preventive jobs. Logging service opens a work order and moves the next date forward.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Active assets</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ schedules.filter((s) => s.status === 'active').length }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Overdue</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ schedules.filter((s) => s.overdue).length }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add asset</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Asset</label>
            <input v-model="form.asset_name" type="text" required class="field" placeholder="HVAC Unit 1, Elevator A" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Location</label>
            <input v-model="form.asset_location" type="text" class="field" placeholder="Roof, plant room" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Linked room</label>
            <select v-model.number="form.room_id" class="field">
              <option :value="0">________Selection________</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} — {{ r.hotel_name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Service type</label>
            <input v-model="form.maintenance_type" type="text" required class="field" placeholder="Filter change, inspection" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Frequency</label>
              <select v-model="form.frequency" class="field">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Next service</label>
              <input v-model="form.next_service_date" type="date" required class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Assign to</label>
            <select v-model.number="form.assigned_to" class="field">
              <option :value="0">Unassigned</option>
              <option v-for="s in staff" :key="s.id" :value="s.id">{{ s.full_name }} — {{ s.position }}</option>
            </select>
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save schedule' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Asset</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Next</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in schedules" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ row.asset_name }}</p>
                <p class="text-xs text-stone-500">{{ row.maintenance_type }} · {{ row.frequency }}</p>
                <p class="text-xs text-stone-400">{{ row.asset_location || row.room_name || '—' }} · {{ row.assigned_name || 'Unassigned' }}</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <span :class="row.overdue ? 'font-semibold text-red-600' : 'text-stone-700'">{{ row.next_service_date }}</span>
                <p class="text-xs text-stone-400">Last {{ row.last_service_date || '—' }}</p>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'">{{ row.status }}</span>
                <p v-if="row.overdue" class="text-xs font-medium text-red-600">Overdue</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <button v-if="row.status === 'active'" type="button" class="mr-2 text-brand-700 hover:underline" @click="logService(row)">Log service</button>
                <button type="button" class="mr-2 text-stone-600 hover:underline" @click="toggle(row)">{{ row.status === 'active' ? 'Pause' : 'Activate' }}</button>
                <button type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="schedules.length === 0 && !loading" class="p-4 text-center text-stone-500">No preventive jobs yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createMaintenanceSchedule, deleteMaintenanceSchedule, getMaintenanceSchedule, logMaintenanceService, updateMaintenanceSchedule } from '../../services/data'

const schedules = ref([])
const rooms = ref([])
const staff = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  asset_name: '',
  asset_location: '',
  room_id: 0,
  maintenance_type: '',
  frequency: 'monthly',
  next_service_date: new Date().toISOString().slice(0, 10),
  assigned_to: 0,
})

async function load() {
  loading.value = true
  try {
    const data = await getMaintenanceSchedule()
    schedules.value = data.schedules || []
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
    await createMaintenanceSchedule({
      ...form,
      room_id: form.room_id || null,
      assigned_to: form.assigned_to || null,
    })
    form.asset_name = ''
    form.asset_location = ''
    form.maintenance_type = ''
    form.room_id = 0
    success.value = 'Schedule saved.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function logService(row) {
  error.value = ''
  success.value = ''
  try {
    const res = await logMaintenanceService(row.id)
    success.value = `Work order #${res.request_id} opened. Next service ${res.next_service_date}.`
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function toggle(row) {
  error.value = ''
  try {
    await updateMaintenanceSchedule(row.id, { status: row.status === 'active' ? 'inactive' : 'active' })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteMaintenanceSchedule(row.id)
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
