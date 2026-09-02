<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Schedules</h1>
    <p class="mt-1 text-stone-600">
      Daily shift roster by department. Mark a shift completed, absent, or cancelled after the day runs.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Today</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ todayShifts.length }}</p>
        <p class="mt-1 text-xs text-stone-500">shifts on {{ today }}</p>
      </div>
      <div class="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Scheduled</p>
        <p class="mt-1 text-2xl font-bold text-blue-600">{{ statusCount('scheduled') }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Absent</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ statusCount('absent') }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add shift</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Employee</label>
            <select v-model.number="form.employee_id" required class="field">
              <option disabled value="0">Select staff</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.full_name }} — {{ e.department }} / {{ e.position }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Date</label>
            <input v-model="form.shift_date" type="date" required class="field" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Start</label>
              <input v-model="form.shift_start" type="time" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">End</label>
              <input v-model="form.shift_end" type="time" required class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Shift type</label>
            <select v-model="form.shift_type" class="field">
              <option v-for="t in HR_SHIFT_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save shift' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Employee</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Hours</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Type</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="s in schedules" :key="s.id" class="hover:bg-stone-50">
                <td class="whitespace-nowrap px-4 py-3 text-stone-600">{{ s.shift_date }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ s.full_name }}</p>
                  <p class="text-xs text-stone-500">{{ s.department }} · {{ s.position }}</p>
                </td>
                <td class="whitespace-nowrap px-4 py-3">{{ s.shift_start }} – {{ s.shift_end }}</td>
                <td class="px-4 py-3 capitalize">{{ s.shift_type }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize" :class="statusClass(s.status)">{{ s.status }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="s.status === 'scheduled'" type="button" class="mr-2 text-green-700 hover:underline" @click="setStatus(s, 'completed')">Done</button>
                  <button v-if="s.status === 'scheduled'" type="button" class="mr-2 text-red-600 hover:underline" @click="setStatus(s, 'absent')">Absent</button>
                  <button type="button" class="text-stone-600 hover:underline" @click="remove(s)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="schedules.length === 0 && !loading" class="p-4 text-center text-stone-500">No shifts yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createHrSchedule, deleteHrSchedule, getHrEmployees, getHrSchedules, updateHrSchedule } from '../../services/data'
import { HR_SHIFT_TYPES, statusClass, todayKey } from '../../services/hr'

const employees = ref([])
const schedules = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const today = todayKey()
const form = reactive({
  employee_id: 0,
  shift_date: today,
  shift_start: '07:00',
  shift_end: '15:00',
  shift_type: 'morning',
})

const todayShifts = computed(() => schedules.value.filter((s) => s.shift_date === today))
function statusCount(status) {
  return schedules.value.filter((s) => s.status === status).length
}

async function load() {
  loading.value = true
  const [e, s] = await Promise.all([getHrEmployees(), getHrSchedules()])
  employees.value = e.filter((row) => row.status !== 'terminated')
  schedules.value = s
  if (!form.employee_id && employees.value[0]) form.employee_id = employees.value[0].id
  loading.value = false
}

async function create() {
  error.value = ''
  saving.value = true
  try {
    await createHrSchedule({ ...form })
    await load()
  } catch (err) {
    error.value = err.message
  }
  saving.value = false
}

async function setStatus(row, status) {
  try {
    await updateHrSchedule(row.id, { status })
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(row) {
  if (!window.confirm('Delete this shift?')) return
  try {
    await deleteHrSchedule(row.id)
    await load()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
