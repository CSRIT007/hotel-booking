<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Revenue</h1>
    <p class="mt-1 text-stone-600">
      Recognized income from confirmed/completed room bookings and paid POS sales.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Total revenue</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ formatMoney(summary.revenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">Rooms + POS (paid)</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Room revenue</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(summary.roomRevenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ summary.counts.room }} confirmed/completed</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">POS revenue</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ formatMoney(summary.posRevenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">{{ summary.counts.pos }} paid sales</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Pipeline</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ formatMoney(summary.pendingRevenue) }}</p>
        <p class="mt-1 text-xs text-stone-500">Pending bookings and POS (not counted yet)</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Revenue by source</h2>
        <div class="mt-4 space-y-3">
          <div v-for="row in sourceRows" :key="row.name">
            <div class="flex justify-between text-sm">
              <span class="text-stone-600">{{ row.name }}</span>
              <span class="font-medium text-stone-800">{{ formatMoney(row.total) }}</span>
            </div>
            <div class="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                class="h-full rounded-full bg-brand-600"
                :style="{ width: barWidth(row.total, summary.revenue) }"
              />
            </div>
          </div>
          <p v-if="summary.revenue === 0 && !loading" class="text-sm text-stone-500">No recognized revenue yet.</p>
        </div>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">By month</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-stone-700">Month</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">Rooms</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">POS</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="m in months" :key="m.month">
                <td class="px-3 py-2 text-stone-700">{{ m.month }}</td>
                <td class="px-3 py-2 text-right">{{ formatMoney(m.room) }}</td>
                <td class="px-3 py-2 text-right">{{ formatMoney(m.pos) }}</td>
                <td class="px-3 py-2 text-right font-medium">{{ formatMoney(m.revenue) }}</td>
              </tr>
              <tr v-if="months.length === 0 && !loading">
                <td colspan="4" class="px-3 py-6 text-center text-stone-500">No monthly data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 px-4 py-3">
        <h2 class="font-semibold text-stone-800">Room bookings counted as revenue</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="b in summary.roomItems" :key="'b-' + b.id" class="hover:bg-stone-50">
              <td class="px-4 py-3 text-stone-500">#{{ b.id }}</td>
              <td class="px-4 py-3">{{ b.username || b.email || '—' }}</td>
              <td class="px-4 py-3">{{ b.room_name || '—' }}</td>
              <td class="px-4 py-3 capitalize">{{ b.status }}</td>
              <td class="px-4 py-3 text-right font-medium">{{ formatMoney(b.total_price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="summary.roomItems.length === 0 && !loading" class="p-4 text-center text-stone-500">
        No confirmed or completed bookings.
      </p>
    </div>

    <p v-if="loading" class="mt-4 text-sm text-stone-500">Loading…</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getBookings, getPosTransactions } from '../../services/data'
import { formatMoney, monthlySeries, summarizeFinance } from '../../services/finance'

const bookings = ref([])
const transactions = ref([])
const loading = ref(true)

const summary = computed(() =>
  summarizeFinance({ bookings: bookings.value, transactions: transactions.value })
)
const months = computed(() =>
  monthlySeries({ bookings: bookings.value, transactions: transactions.value })
)
const sourceRows = computed(() => [
  { name: 'Room bookings', total: summary.value.roomRevenue },
  { name: 'POS sales', total: summary.value.posRevenue },
])

function barWidth(part, total) {
  if (!total) return '0%'
  return `${Math.max(0, Math.min(100, (part / total) * 100))}%`
}

onMounted(async () => {
  loading.value = true
  try {
    const [b, t] = await Promise.all([getBookings(), getPosTransactions()])
    bookings.value = b
    transactions.value = t
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
