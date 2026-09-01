<template>
  <div class="finance-root">
    <h1 class="text-2xl font-semibold text-stone-800">Profit</h1>
    <p class="mt-1 text-stone-600">
      Profit = recognized revenue (rooms + paid POS) − recorded expenses, including salaries from paid payroll.
    </p>

    <FinanceDateFilter v-model:from="from" v-model:to="to" />

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Revenue</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(summary.revenue) }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Expenses</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ formatMoney(summary.expenseTotal) }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Net profit</p>
        <p
          class="mt-1 text-2xl font-bold"
          :class="summary.profit >= 0 ? 'text-green-600' : 'text-red-600'"
        >
          {{ formatMoney(summary.profit) }}
        </p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Margin</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ summary.marginPercent.toFixed(1) }}%</p>
        <p class="mt-1 text-xs text-stone-500">Profit ÷ revenue</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">How profit is calculated</h2>
        <ul class="mt-4 space-y-2 text-sm text-stone-600">
          <li class="flex justify-between"><span>Room bookings (confirmed + completed)</span><span class="font-medium text-stone-800">{{ formatMoney(summary.roomRevenue) }}</span></li>
          <li class="flex justify-between"><span>+ POS sales (paid)</span><span class="font-medium text-stone-800">{{ formatMoney(summary.posRevenue) }}</span></li>
          <li class="flex justify-between border-t border-stone-200 pt-2"><span>Recognized revenue</span><span class="font-semibold text-green-600">{{ formatMoney(summary.revenue) }}</span></li>
          <li class="flex justify-between"><span>− Expenses</span><span class="font-medium text-red-600">{{ formatMoney(summary.expenseTotal) }}</span></li>
          <li class="flex justify-between border-t border-stone-200 pt-2"><span>Net profit</span><span class="font-semibold" :class="summary.profit >= 0 ? 'text-green-600' : 'text-red-600'">{{ formatMoney(summary.profit) }}</span></li>
        </ul>
        <p class="mt-4 text-xs text-stone-500">
          Pending bookings/POS ({{ formatMoney(summary.pendingRevenue) }}) are not included until they are confirmed or paid.
          Refunded POS ({{ formatMoney(summary.refundedPosTotal) }}) is excluded.
        </p>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Expenses by category</h2>
        <div class="mt-4 space-y-2">
          <div
            v-for="row in expenseCategories"
            :key="row.name"
            class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
          >
            <span class="font-medium text-stone-700">{{ row.name }}</span>
            <span class="text-stone-600">{{ formatMoney(row.total) }}</span>
          </div>
          <p v-if="expenseCategories.length === 0 && !loading" class="text-sm text-stone-500">No expenses recorded.</p>
        </div>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 px-4 py-3">
        <h2 class="font-semibold text-stone-800">Monthly profit</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Month</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Revenue</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Expenses</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="m in months" :key="m.month" class="hover:bg-stone-50">
              <td class="px-4 py-3 text-stone-700">{{ m.month }}</td>
              <td class="px-4 py-3 text-right text-green-700">{{ formatMoney(m.revenue) }}</td>
              <td class="px-4 py-3 text-right text-red-600">{{ formatMoney(m.expenses) }}</td>
              <td class="px-4 py-3 text-right font-semibold" :class="m.profit >= 0 ? 'text-green-700' : 'text-red-600'">
                {{ formatMoney(m.profit) }}
              </td>
            </tr>
            <tr v-if="months.length === 0 && !loading">
              <td colspan="4" class="px-4 py-8 text-center text-stone-500">No monthly data in this date range.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceDateFilter from '../../components/FinanceDateFilter.vue'
import { getBookings, getExpenses, getPosTransactions } from '../../services/data'
import {
  bookingFinanceDate,
  dateRangePresets,
  expenseFinanceDate,
  filterByDateRange,
  formatMoney,
  groupSum,
  monthlySeries,
  posFinanceDate,
  summarizeFinance,
} from '../../services/finance'

const bookings = ref([])
const transactions = ref([])
const expenses = ref([])
const loading = ref(true)
const monthRange = dateRangePresets().month
const from = ref(monthRange.from)
const to = ref(monthRange.to)

const rangedBookings = computed(() =>
  filterByDateRange(bookings.value, from.value, to.value, bookingFinanceDate)
)
const rangedTransactions = computed(() =>
  filterByDateRange(transactions.value, from.value, to.value, posFinanceDate)
)
const rangedExpenses = computed(() =>
  filterByDateRange(expenses.value, from.value, to.value, expenseFinanceDate)
)

const summary = computed(() =>
  summarizeFinance({
    bookings: rangedBookings.value,
    transactions: rangedTransactions.value,
    expenses: rangedExpenses.value,
  })
)
const months = computed(() =>
  monthlySeries({
    bookings: rangedBookings.value,
    transactions: rangedTransactions.value,
    expenses: rangedExpenses.value,
  })
)
const expenseCategories = computed(() => groupSum(rangedExpenses.value, (e) => e.category, (e) => e.amount))

onMounted(async () => {
  loading.value = true
  try {
    const [b, t, e] = await Promise.all([getBookings(), getPosTransactions(), getExpenses()])
    bookings.value = b
    transactions.value = t
    expenses.value = e
  } catch (err) {
    console.warn(err)
  }
  loading.value = false
})
</script>

<style scoped>
.finance-root {
  overflow-anchor: none;
}
</style>
