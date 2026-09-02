<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">POS Transactions</h1>
    <p class="mt-1 text-stone-600">History of POS transactions from PostgreSQL or Tadabase.</p>

    <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-600">
      <span>Total: <span class="font-semibold text-stone-800">{{ transactions.length }}</span> transactions</span>
      <span>Paid: <span class="font-semibold text-green-700">{{ statusCounts.paid }}</span></span>
      <span>Pending: <span class="font-semibold text-amber-700">{{ statusCounts.pending }}</span></span>
      <span>Refunded: <span class="font-semibold text-sky-700">{{ statusCounts.refunded }}</span></span>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">#</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Product</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Category</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Quantity</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Total</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Payment</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="t in transactions" :key="t.id" class="hover:bg-stone-50">
              <td class="px-4 py-3 text-stone-500">#{{ t.id }}</td>
              <td class="px-4 py-3 font-medium text-stone-800">
                {{ t.product_name || t.product_name_text || ('Product #' + (t.product_id || t.product)) }}
              </td>
              <td class="px-4 py-3 text-stone-600">{{ t.category || '—' }}</td>
              <td class="px-4 py-3 text-right">{{ t.quantity ?? 1 }}</td>
              <td class="px-4 py-3 text-right">{{ formatMoney(t.total_amount) }}</td>
              <td class="px-4 py-3 text-stone-700 capitalize">{{ (t.payment_method || 'other').replace('_', ' ') }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="statusClass(t.status)"
                >
                  {{ t.status || 'paid' }}
                </span>
              </td>
              <td class="px-4 py-3 text-stone-500">{{ formatDate(t.created_at || t.transaction_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="transactions.length === 0 && !loading" class="p-4 text-center text-stone-500">
        No POS transactions yet. Use the POS system to record sales.
      </p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPosTransactions } from '../../services/data'
import { formatMoney } from '../../utils/money'

const transactions = ref([])
const loading = ref(true)

const statusCounts = computed(() => {
  const c = { paid: 0, pending: 0, refunded: 0 }
  transactions.value.forEach((t) => {
    const s = (t.status || 'paid').toLowerCase()
    if (c[s] !== undefined) c[s]++
  })
  return c
})

function statusClass(status) {
  const s = (status || 'paid').toLowerCase()
  if (s === 'paid') return 'bg-green-100 text-green-800'
  if (s === 'pending') return 'bg-amber-100 text-amber-800'
  if (s === 'refunded') return 'bg-sky-100 text-sky-800'
  return 'bg-stone-100 text-stone-700'
}

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? val : d.toLocaleString()
}

onMounted(async () => {
  loading.value = true
  try {
    transactions.value = await getPosTransactions()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>

