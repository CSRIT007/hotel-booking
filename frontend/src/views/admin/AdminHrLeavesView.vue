<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Leaves</h1>
    <p class="mt-1 text-stone-600">
      Vacation, sick, personal, and unpaid time off. Approve or reject pending requests. Approved leave sets the employee status to on leave.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Pending</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ statusCount('pending') }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Approved</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ statusCount('approved') }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Days requested</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ totalDays }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">New leave request</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Employee</label>
            <select v-model.number="form.employee_id" required class="field">
              <option disabled value="0">Select staff</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.full_name }} — {{ e.department }} / {{ e.position }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Type</label>
            <select v-model="form.leave_type" class="field">
              <option v-for="t in HR_LEAVE_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Start</label>
              <input v-model="form.start_date" type="date" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">End</label>
              <input v-model="form.end_date" type="date" required class="field" />
            </div>
          </div>
          <p class="text-xs text-stone-500">{{ daysInclusive(form.start_date, form.end_date) || 0 }} day(s)</p>
          <div>
            <label class="block text-xs font-medium text-stone-700">Reason</label>
            <input v-model="form.reason" type="text" class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Submit request' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Employee</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Type</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Dates</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Days</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="l in leaves" :key="l.id" class="hover:bg-stone-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ l.full_name }}</p>
                  <p class="text-xs text-stone-500">{{ l.department }} · {{ l.position }}</p>
                  <p v-if="l.reason" class="text-xs text-stone-400">{{ l.reason }}</p>
                </td>
                <td class="px-4 py-3 capitalize">{{ l.leave_type }}</td>
                <td class="px-4 py-3 text-stone-600">{{ l.start_date }} → {{ l.end_date }}</td>
                <td class="px-4 py-3 text-right">{{ l.days_count }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize" :class="statusClass(l.status)">{{ l.status }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="l.status === 'pending'" type="button" class="mr-2 text-green-700 hover:underline" @click="setStatus(l, 'approved')">Approve</button>
                  <button v-if="l.status === 'pending'" type="button" class="mr-2 text-red-600 hover:underline" @click="setStatus(l, 'rejected')">Reject</button>
                  <button type="button" class="text-stone-600 hover:underline" @click="remove(l)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="leaves.length === 0 && !loading" class="p-4 text-center text-stone-500">No leave requests yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createHrLeave, deleteHrLeave, getHrEmployees, getHrLeaves, updateHrLeave } from '../../services/data'
import { HR_LEAVE_TYPES, daysInclusive, statusClass, todayKey } from '../../services/hr'

const employees = ref([])
const leaves = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const today = todayKey()
const form = reactive({
  employee_id: 0,
  leave_type: 'vacation',
  start_date: today,
  end_date: today,
  reason: '',
})

function statusCount(status) {
  return leaves.value.filter((l) => l.status === status).length
}
const totalDays = computed(() => leaves.value.reduce((sum, l) => sum + Number(l.days_count || 0), 0))

async function load() {
  loading.value = true
  const [e, l] = await Promise.all([getHrEmployees(), getHrLeaves()])
  employees.value = e
  leaves.value = l
  if (!form.employee_id && e[0]) form.employee_id = e[0].id
  loading.value = false
}

async function create() {
  error.value = ''
  saving.value = true
  try {
    await createHrLeave({ ...form })
    form.reason = ''
    await load()
  } catch (err) {
    error.value = err.message
  }
  saving.value = false
}

async function setStatus(row, status) {
  try {
    await updateHrLeave(row.id, { status })
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(row) {
  if (!window.confirm('Delete this leave request?')) return
  try {
    await deleteHrLeave(row.id)
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
