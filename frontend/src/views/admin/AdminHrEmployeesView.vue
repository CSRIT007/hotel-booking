<template>
  <div>
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-stone-800">Employee information</h1>
        <p class="mt-1 text-stone-600">
          Staff directory by department and position. Assign people here before shifts, payroll, or leave.
        </p>
      </div>
      <router-link to="/admin/hr-org" class="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
        Add / edit departments
      </router-link>
    </div>

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
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ org.length }}</p>
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
          <div>
            <label class="block text-xs font-medium text-stone-700">Department</label>
            <select v-model="form.department" required class="field" @change="onDepartmentChange">
              <option disabled value="">________Selection________</option>
              <option v-for="d in org" :key="d.id" :value="d.name">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Position</label>
            <select v-model="form.position" required class="field" :disabled="!form.department">
              <option disabled value="">________Selection________</option>
              <option v-for="p in formPositions" :key="p.id" :value="p.name">{{ p.name }}</option>
            </select>
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
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !form.department || !form.position">
          {{ saving ? 'Saving…' : 'Save employee' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <p class="text-sm font-medium text-stone-700">Staff list</p>
          <select v-model="deptFilter" class="rounded-md border border-stone-300 px-2 py-1 text-xs">
            <option value="">All departments</option>
            <option v-for="d in org" :key="d.id" :value="d.name">{{ d.name }}</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Employee</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Department</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Position</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Salary</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="e in filteredEmployees" :key="e.id" class="hover:bg-stone-50">
                <td class="whitespace-nowrap px-4 py-3">
                  <p class="font-semibold tracking-tight text-stone-900">{{ e.full_name }}</p>
                  <p class="mt-0.5 text-xs text-stone-500">
                    <span class="font-mono">{{ e.employee_code }}</span>
                    <span class="mx-1">·</span>
                    <span>{{ e.hire_date }}</span>
                  </p>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <select class="rounded-md border border-stone-300 px-2 py-1 text-xs" :value="e.department" @change="changeDepartment(e, $event.target.value)">
                    <option v-for="d in org" :key="d.id" :value="d.name">{{ d.name }}</option>
                  </select>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <select class="rounded-md border border-stone-300 px-2 py-1 text-xs" :value="e.position" @change="setOrg(e, e.department, $event.target.value)">
                    <option v-for="p in positionsForDepartment(org, e.department)" :key="p.id" :value="p.name">{{ p.name }}</option>
                  </select>
                </td>
                <td class="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-stone-800">{{ salaryShortcut(e) }}</td>
                <td class="whitespace-nowrap px-3 py-3">
                  <label class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5" :class="statusClass(e.status)">
                    <span class="h-2 w-2 flex-shrink-0 rounded-full" :class="statusDot(e.status)"></span>
                    <select
                      class="status-chip cursor-pointer bg-transparent py-0 pl-0 text-xs font-medium leading-none"
                      :value="e.status"
                      @change="setStatus(e, $event.target.value)"
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </label>
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <button type="button" class="text-red-600 hover:underline" @click="remove(e)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="filteredEmployees.length === 0 && !loading" class="p-4 text-center text-stone-500">No employees in this list.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { createHrEmployee, deleteHrEmployee, getHrEmployees, getHrOrg, updateHrEmployee } from '../../services/data'
import { HR_SALARY_TYPES, formatMoney, positionsForDepartment, statusClass, todayKey } from '../../services/hr'

const org = ref([])
const employees = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const deptFilter = ref('')
const form = reactive({
  full_name: '',
  department: '',
  position: '',
  phone: '',
  hire_date: todayKey(),
  salary: 0,
  salary_type: 'monthly',
})

const formPositions = computed(() => positionsForDepartment(org.value, form.department))
const counts = computed(() => ({
  active: employees.value.filter((e) => e.status === 'active').length,
  on_leave: employees.value.filter((e) => e.status === 'on_leave').length,
}))
const filteredEmployees = computed(() => {
  if (!deptFilter.value) return employees.value
  return employees.value.filter((e) => e.department === deptFilter.value)
})

function salaryShortcut(row) {
  const suffix = row.salary_type === 'hourly' ? 'hr' : row.salary_type === 'annual' ? 'yr' : 'mon'
  return `${formatMoney(row.salary)}/${suffix}`
}

function statusDot(status) {
  if (status === 'active') return 'bg-green-600'
  if (status === 'on_leave') return 'bg-amber-600'
  return 'bg-stone-500'
}

function onDepartmentChange() {
  form.position = ''
}

async function load() {
  loading.value = true
  org.value = await getHrOrg()
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
    form.department = ''
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

async function setOrg(row, department, position) {
  error.value = ''
  try {
    await updateHrEmployee(row.id, { department, position })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function changeDepartment(row, department) {
  const next = positionsForDepartment(org.value, department)[0]?.name
  await setOrg(row, department, next || row.position)
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
.status-chip {
  appearance: none;
  border: 0;
  outline: none;
  width: 5.75rem;
  padding-right: 0.85rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%2357544e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.05rem center;
  background-size: 0.55rem;
}
</style>
