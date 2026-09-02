<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Payroll</h1>
    <p class="mt-1 text-stone-600">
      Net pay = base + overtime + bonuses − deductions. New records save as <strong>draft</strong>, then <strong>approve</strong>, then <strong>mark paid</strong>. Paid payroll is posted to Finance → Expenses as Salaries.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Paid</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(sumBy('paid')) }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Approved (unpaid)</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ formatMoney(sumBy('approved')) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Draft</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(sumBy('draft')) }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">New pay record</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Employee</label>
            <select v-model.number="form.employee_id" required class="field">
              <option disabled value="0">Select staff</option>
              <option v-for="e in payableEmployees" :key="e.id" :value="e.id">{{ e.full_name }} — {{ e.department }} / {{ e.position }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Period start</label>
              <input v-model="form.period_start" type="date" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Period end</label>
              <input v-model="form.period_end" type="date" required class="field" />
            </div>
          </div>
          <p class="text-xs text-stone-500">{{ baseHint }}</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Base</label>
              <input v-model.number="form.base_salary" type="number" min="0" step="0.01" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Overtime</label>
              <input v-model.number="form.overtime_pay" type="number" min="0" step="0.01" class="field" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Bonuses</label>
              <input v-model.number="form.bonuses" type="number" min="0" step="0.01" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Deductions</label>
              <input v-model.number="form.deductions" type="number" min="0" step="0.01" class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Payment method</label>
            <select v-model="form.payment_method" class="field">
              <option v-for="m in HR_PAY_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <p class="text-sm text-stone-600">
            Gross {{ formatMoney(grossPreview) }} − deductions {{ formatMoney(form.deductions) }}
            = <span class="font-semibold" :class="netPreview < 0 ? 'text-red-600' : 'text-stone-800'">{{ formatMoney(netPreview) }}</span>
          </p>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <button
          type="submit"
          class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          :disabled="saving || !canSave"
        >
          {{ saving ? 'Saving…' : 'Save draft' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Employee</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Period</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Gross</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Net</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="p in payroll" :key="p.id" class="hover:bg-stone-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ p.full_name }}</p>
                  <p class="text-xs text-stone-500">{{ p.department }} · {{ p.position }} · {{ p.employee_code }}</p>
                </td>
                <td class="px-4 py-3 text-stone-600">
                  {{ p.period_start }} → {{ p.period_end }}
                  <p v-if="p.payment_date" class="text-xs text-stone-400">Paid {{ p.payment_date }}</p>
                  <router-link v-if="p.expense_id" to="/admin/finance-expense" class="block text-xs text-brand-600 hover:underline">Expense #{{ p.expense_id }}</router-link>
                </td>
                <td class="px-4 py-3 text-right text-stone-600">{{ formatMoney(p.base_salary + p.overtime_pay + p.bonuses) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatMoney(p.net_pay) }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize" :class="statusClass(p.status)">{{ p.status }}</span>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="p.status === 'draft'" type="button" class="mr-2 text-brand-600 hover:underline" @click="setStatus(p, 'approved')">Approve</button>
                  <button v-if="p.status === 'approved'" type="button" class="mr-2 text-green-700 hover:underline" @click="setStatus(p, 'paid')">Mark paid</button>
                  <button v-if="p.status !== 'paid'" type="button" class="text-red-600 hover:underline" @click="remove(p)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="payroll.length === 0 && !loading" class="p-4 text-center text-stone-500">No payroll records yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { createHrPayroll, deleteHrPayroll, getHrEmployees, getHrPayroll, getHrSchedules, updateHrPayroll } from '../../services/data'
import {
  HR_PAY_METHODS,
  formatMoney,
  hoursInPeriod,
  lastMonthRange,
  payrollNet,
  statusClass,
  suggestedBasePay,
} from '../../services/hr'

const employees = ref([])
const schedules = ref([])
const payroll = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const last = lastMonthRange()
const form = reactive({
  employee_id: 0,
  period_start: last.start,
  period_end: last.end,
  base_salary: 0,
  overtime_pay: 0,
  bonuses: 0,
  deductions: 0,
  payment_method: 'bank_transfer',
})

const payableEmployees = computed(() => employees.value.filter((e) => e.status !== 'terminated'))
const selectedEmployee = computed(() => payableEmployees.value.find((e) => e.id === form.employee_id) || null)
const workedHours = computed(() =>
  hoursInPeriod(schedules.value, form.employee_id, form.period_start, form.period_end)
)
const grossPreview = computed(() => Number(form.base_salary || 0) + Number(form.overtime_pay || 0) + Number(form.bonuses || 0))
const netPreview = computed(() => payrollNet(form.base_salary, form.overtime_pay, form.bonuses, form.deductions))
const canSave = computed(() =>
  form.employee_id
  && form.period_start
  && form.period_end
  && form.period_end >= form.period_start
  && netPreview.value >= 0
  && Number(form.deductions || 0) <= grossPreview.value
)

const baseHint = computed(() => {
  const emp = selectedEmployee.value
  if (!emp) return 'Select an employee to fill base pay.'
  if (emp.salary_type === 'hourly') {
    return `Hourly rate ${formatMoney(emp.salary)} × ${workedHours.value.toFixed(1)} scheduled hours in this period.`
  }
  if (emp.salary_type === 'annual') return `Annual salary prorated across the selected dates (${formatMoney(emp.salary)} / year).`
  return `Monthly salary ${formatMoney(emp.salary)} used as base. Change it if this period is a partial month.`
})

function sumBy(status) {
  return payroll.value.filter((p) => p.status === status).reduce((sum, p) => sum + Number(p.net_pay || 0), 0)
}

function fillBase() {
  form.base_salary = suggestedBasePay(selectedEmployee.value, form.period_start, form.period_end, schedules.value)
}

watch(
  () => [form.employee_id, form.period_start, form.period_end],
  () => {
    if (selectedEmployee.value) fillBase()
  }
)

async function load() {
  loading.value = true
  const [e, p, s] = await Promise.all([getHrEmployees(), getHrPayroll(), getHrSchedules()])
  employees.value = e
  payroll.value = p
  schedules.value = s
  if (!form.employee_id && payableEmployees.value[0]) {
    form.employee_id = payableEmployees.value[0].id
  }
  fillBase()
  loading.value = false
}

async function create() {
  error.value = ''
  if (!canSave.value) {
    error.value = form.period_end < form.period_start
      ? 'Period end must be on or after period start.'
      : 'Deductions cannot be greater than gross pay.'
    return
  }
  saving.value = true
  try {
    await createHrPayroll({ ...form })
    form.overtime_pay = 0
    form.bonuses = 0
    form.deductions = 0
    await load()
  } catch (err) {
    error.value = err.message
  }
  saving.value = false
}

async function setStatus(row, status) {
  const label = status === 'paid' ? `Mark ${row.full_name} as paid ${formatMoney(row.net_pay)}?` : `Approve payroll for ${row.full_name}?`
  if (!window.confirm(label)) return
  try {
    await updateHrPayroll(row.id, { status })
    await load()
  } catch (err) {
    error.value = err.message
  }
}

async function remove(row) {
  if (row.status === 'paid') return
  if (!window.confirm(`Delete draft/approved payroll for ${row.full_name}?`)) return
  try {
    await deleteHrPayroll(row.id)
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
