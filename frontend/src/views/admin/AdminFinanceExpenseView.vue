<template>
  <div class="finance-root">
    <h1 class="text-2xl font-semibold text-stone-800">Expenses</h1>
    <p class="mt-1 text-stone-600">Record operating costs. Paid payroll is added here automatically as Salaries and cannot be deleted from this page.</p>

    <FinanceDateFilter v-model:from="from" v-model:to="to" />

    <div class="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Add expense</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitExpense">
          <div>
            <label class="block text-xs font-medium text-stone-700">Description</label>
            <input
              v-model="form.description"
              type="text"
              required
              class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              :disabled="submitting"
            >
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium text-stone-700">Category</label>
              <select
                v-model="form.category"
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
              >
                <option v-for="c in EXPENSE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Amount</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="0.01"
                required
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
              >
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium text-stone-700">Date</label>
              <input
                v-model="form.expense_date"
                type="date"
                required
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Payment method</label>
              <select
                v-model="form.payment_method"
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2">
            <div class="text-xs">
              <p v-if="formError" class="text-red-600">{{ formError }}</p>
              <p v-if="formSuccess" class="text-green-600">{{ formSuccess }}</p>
            </div>
            <button
              type="submit"
              class="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              :disabled="submitting || !form.description || form.amount < 0"
            >
              {{ submitting ? 'Saving…' : 'Save expense' }}
            </button>
          </div>
        </form>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Totals</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Total expenses</p>
            <p class="mt-2 text-xl font-semibold text-stone-900">{{ formatMoney(totalAmount) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Records</p>
            <p class="mt-2 text-xl font-semibold text-stone-900">{{ visibleExpenses.length }}</p>
          </div>
        </div>
        <div class="mt-5 space-y-2">
          <div
            v-for="row in byCategory"
            :key="row.name"
            class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
          >
            <span class="font-medium text-stone-700">{{ row.name }}</span>
            <span class="text-stone-600">{{ formatMoney(row.total) }}</span>
          </div>
          <p v-if="byCategory.length === 0 && !loading" class="text-sm text-stone-500">No expenses yet.</p>
        </div>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Description</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Category</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Payment</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Amount</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="e in visibleExpenses" :key="e.id" class="hover:bg-stone-50">
              <td class="px-4 py-3 text-stone-600">{{ formatDate(e.expense_date) }}</td>
              <td class="px-4 py-3 font-medium text-stone-800">
                {{ e.description }}
                <p v-if="e.payroll_id" class="text-xs font-normal text-brand-700">From payroll #{{ e.payroll_id }}</p>
              </td>
              <td class="px-4 py-3 text-stone-600">{{ e.category }}</td>
              <td class="px-4 py-3 capitalize text-stone-600">{{ String(e.payment_method || '').replace('_', ' ') }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(e.amount) }}</td>
              <td class="px-4 py-3 text-right">
                <button v-if="!e.payroll_id" type="button" class="text-red-600 hover:underline" @click="removeExpense(e)">Delete</button>
                <router-link v-else to="/admin/hr-payroll" class="text-brand-600 hover:underline">Payroll</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="visibleExpenses.length === 0 && !loading" class="p-4 text-center text-stone-500">No expenses in this date range.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import FinanceDateFilter from '../../components/FinanceDateFilter.vue'
import { createExpense, deleteExpense, getExpenses } from '../../services/data'
import {
  EXPENSE_CATEGORIES,
  dateRangePresets,
  expenseFinanceDate,
  filterByDateRange,
  formatDate,
  formatMoney,
  groupSum,
  localDateKey,
  toMoney,
} from '../../services/finance'

const expenses = ref([])
const loading = ref(true)
const submitting = ref(false)
const formError = ref('')
const formSuccess = ref('')
const monthRange = dateRangePresets().month
const from = ref(monthRange.from)
const to = ref(monthRange.to)

const form = reactive({
  description: '',
  category: 'Utilities',
  amount: 0,
  expense_date: localDateKey(),
  payment_method: 'cash',
})

const visibleExpenses = computed(() =>
  filterByDateRange(expenses.value, from.value, to.value, expenseFinanceDate)
)
const totalAmount = computed(() => visibleExpenses.value.reduce((sum, e) => sum + toMoney(e.amount), 0))
const byCategory = computed(() => groupSum(visibleExpenses.value, (e) => e.category, (e) => e.amount))

async function load() {
  loading.value = true
  try {
    expenses.value = await getExpenses()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function submitExpense() {
  formError.value = ''
  formSuccess.value = ''
  submitting.value = true
  try {
    await createExpense({
      description: form.description.trim(),
      category: form.category,
      amount: toMoney(form.amount),
      expense_date: form.expense_date,
      payment_method: form.payment_method,
    })
    form.description = ''
    form.amount = 0
    formSuccess.value = 'Expense saved.'
    await load()
  } catch (e) {
    formError.value = e.message || 'Failed to save expense.'
  }
  submitting.value = false
}

async function removeExpense(row) {
  if (!window.confirm(`Delete “${row.description}”?`)) return
  try {
    await deleteExpense(row.id)
    await load()
  } catch (e) {
    formError.value = e.message || 'Failed to delete expense.'
  }
}

onMounted(load)
</script>

<style scoped>
.finance-root {
  overflow-anchor: none;
}
</style>
