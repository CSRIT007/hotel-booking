<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Employees</h1>
    <p class="mt-1 text-stone-600">
      Staff directory for Smile Hotel: department, role, hire date, pay, and employment status.
      Use this list before assigning shifts, payroll, or leave.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Headcount</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ employees.length }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Active</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ counts.active }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">On leave</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ counts.on_leave }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Departments</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ departmentsUsed }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add employee</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Full name</label>
            <input v-model="form.full_name" type="text" required class="field" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Department</label>
              <select v-model="form.department" class="field">
                <option v-for="d in HR_DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Position</label>
              <input v-model="form.position" type="text" required class="field" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Phone</label>
              <input v-model="form.phone" type="text" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Hire date</label>
              <input v-model="form.hire_date" type="date" required class="field" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Salary</label>
              <input v-model.number="form.salary" type="number" min="0" step="0.01" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Pay type</label>
              <select v-model="form.salary_type" class="field">
                <option v-for="t in HR_SALARY_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save employee' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Employee</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Department</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Hire date</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Salary</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="e in employees" :key="e.id" class="hover:bg-stone-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ e.full_name }}</p>
                  <p class="text-xs text-stone-500">{{ e.employee_code }} · {{ e.position }}</p>
                </td>
                <td class="px-4 py-3">{{ e.department }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-stone-600">{{ e.hire_date }}</td>
                <td class="px-4 py-3 text-right">{{ formatMoney(e.salary) }} / {{ e.salary_type }}</td>
                <td class="px-4 py-3">
                  <select class="rounded-md border border-stone-300 px-2 py-1 text-xs" :value="e.status" @change="setStatus(e, $event.target.value)">
                    <option value="active">active</option>
                    <option value="on_leave">on leave</option>
                    <option value="terminated">terminated</option>
                  </select>
                </td>
                <td class="px-4 py-3 text-right">
                  <button type="button" class="text-red-600 hover:underline" @click="remove(e)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="employees.length === 0 && !loading" class="p-4 text-center text-stone-500">No employees yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createHrEmployee, deleteHrEmployee, getHrEmployees, updateHrEmployee } from '../../services/data'
import { HR_DEPARTMENTS, HR_SALARY_TYPES, formatMoney, todayKey } from '../../services/hr'

const employees = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  full_name: '',
  department: 'Front desk',
  position: '',
  phone: '',
  hire_date: todayKey(),
  salary: 0,
  salary_type: 'monthly',
})

const counts = computed(() => ({
  active: employees.value.filter((e) => e.status === 'active').length,
  on_leave: employees.value.filter((e) => e.status === 'on_leave').length,
}))
const departmentsUsed = computed(() => new Set(employees.value.map((e) => e.department)).size)

async function load() {
  loading.value = true
  employees.value = await getHrEmployees()
  loading.value = false
}

async function create() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createHrEmployee({ ...form })
    form.full_name = ''
    form.position = ''
    form.phone = ''
    form.salary = 0
    success.value = 'Employee added.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function setStatus(row, status) {
  try {
    await updateHrEmployee(row.id, { status })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  if (!window.confirm(`Remove ${row.full_name}? Payroll records must be deleted first.`)) return
  try {
    await deleteHrEmployee(row.id)
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
