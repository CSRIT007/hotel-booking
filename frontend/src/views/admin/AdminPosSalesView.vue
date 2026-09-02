<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">POS Sales</h1>
    <p class="mt-1 text-stone-600">Record new POS sales and see revenue and payment statistics.</p>

    <div class="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Record new sale</h2>
        <p class="mt-1 text-xs text-stone-500">Choose a product, quantity and payment method, then save.</p>

        <form class="mt-4 space-y-3" @submit.prevent="submitSale">
          <div>
            <label class="block text-xs font-medium text-stone-700">Product</label>
            <select
              v-model="form.product_id"
              class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              :disabled="submitting || products.length === 0"
              required
            >
              <option value="" disabled>Select product</option>
              <option v-for="p in products" :key="p.id" :value="p.id">
                {{ p.name }} — {{ formatMoney(p.price) }} (stock: {{ p.stock ?? '—' }})
              </option>
            </select>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium text-stone-700">Quantity</label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="1"
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
                required
              >
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Payment method</label>
              <select
                v-model="form.payment_method"
                class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                :disabled="submitting"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="room_charge">Room charge</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-700">Status</label>
            <select
              v-model="form.status"
              class="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              :disabled="submitting"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div class="flex items-center justify-between pt-2">
            <div class="text-xs">
              <p v-if="formTotal > 0" class="font-medium text-stone-800">
                Total: {{ formatMoney(formTotal) }}
              </p>
              <p v-if="formError" class="mt-1 text-xs text-red-600">{{ formError }}</p>
              <p v-if="formSuccess" class="mt-1 text-xs text-green-600">{{ formSuccess }}</p>
            </div>
            <button
              type="submit"
              class="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              :disabled="submitting || !form.product_id || form.quantity <= 0"
            >
              <span v-if="submitting">Saving…</span>
              <span v-else>Save sale</span>
            </button>
          </div>
        </form>

        <p v-if="products.length === 0 && !loading" class="mt-4 text-xs text-stone-500">
          No POS products found. Add products in the database to record sales.
        </p>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Key POS metrics</h2>
        <p class="mt-1 text-xs text-stone-500">Overview of POS revenue and payment methods.</p>

        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Total revenue</p>
            <p class="mt-2 text-xl font-semibold text-stone-900">{{ formatMoney(totalRevenue) }}</p>
            <p class="mt-1 text-[11px] text-stone-500">Paid + pending transactions.</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Total transactions</p>
            <p class="mt-2 text-xl font-semibold text-stone-900">{{ transactions.length }}</p>
            <p class="mt-1 text-[11px] text-stone-500">All POS transactions.</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Average ticket</p>
            <p class="mt-2 text-xl font-semibold text-stone-900">
              {{ formatMoney(averageTicket) }}
            </p>
            <p class="mt-1 text-[11px] text-stone-500">Average total per transaction.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-6 md:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Revenue by payment method</h2>
        <p class="mt-1 text-xs text-stone-500">Breakdown of total amount by method.</p>
        <div class="mt-4 space-y-2">
          <div
            v-for="m in paymentMethods"
            :key="m.method"
            class="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-sm"
          >
            <span class="font-medium text-stone-700 capitalize">{{ m.method.replace('_', ' ') }}</span>
            <span class="text-stone-600">
              {{ m.count }} × • {{ formatMoney(m.total) }}
            </span>
          </div>
          <p v-if="paymentMethods.length === 0 && !loading" class="text-sm text-stone-500">No POS transactions yet.</p>
          <p v-if="loading" class="text-sm text-stone-500">Loading…</p>
        </div>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">Top products</h2>
        <p class="mt-1 text-xs text-stone-500">Most frequently sold POS items.</p>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-stone-700">Product</th>
                <th class="px-3 py-2 text-left font-medium text-stone-700">Category</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">Qty sold</th>
                <th class="px-3 py-2 text-right font-medium text-stone-700">Revenue</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="p in topProducts" :key="p.product_id" class="hover:bg-stone-50">
                <td class="px-3 py-2 font-medium text-stone-800">{{ p.product_name || 'Product #' + p.product_id }}</td>
                <td class="px-3 py-2 text-stone-600">{{ p.category || '—' }}</td>
                <td class="px-3 py-2 text-right">{{ p.quantity }}</td>
                <td class="px-3 py-2 text-right">{{ formatMoney(p.revenue) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="topProducts.length === 0 && !loading" class="p-3 text-center text-sm text-stone-500">
            No POS transactions yet.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPosTransactions, getPosProducts, createPosTransaction } from '../../services/data'
import { formatMoney } from '../../utils/money'

const transactions = ref([])
const products = ref([])
const loading = ref(true)
const submitting = ref(false)
const form = ref({
  product_id: '',
  quantity: 1,
  payment_method: 'cash',
  status: 'paid',
})
const formError = ref('')
const formSuccess = ref('')

const totalRevenue = computed(() => {
  return transactions.value
    .filter((t) => t.status === 'paid' || t.status === 'pending')
    .reduce((sum, t) => sum + Number(t.total_amount || 0), 0)
})

const averageTicket = computed(() => {
  if (!transactions.value.length) return 0
  return totalRevenue.value / transactions.value.length
})

const formTotal = computed(() => {
  const product = products.value.find((p) => String(p.id) === String(form.value.product_id))
  if (!product) return 0
  const price = Number(product.price || 0)
  const qty = Number(form.value.quantity || 0)
  if (!qty || qty <= 0) return 0
  return price * qty
})

const paymentMethods = computed(() => {
  const map = new Map()
  transactions.value.forEach((t) => {
    const key = t.payment_method || 'other'
    const current = map.get(key) || { method: key, count: 0, total: 0 }
    current.count += 1
    current.total += Number(t.total_amount || 0)
    map.set(key, current)
  })
  return Array.from(map.values())
})

const topProducts = computed(() => {
  const map = new Map()
  transactions.value.forEach((t) => {
    const key = t.product_id || t.product || t.product_id_fk
    if (!key) return
    const current = map.get(key) || {
      product_id: key,
      product_name: t.product_name || t.product_name_text,
      category: t.category,
      quantity: 0,
      revenue: 0,
    }
    current.quantity += Number(t.quantity || 0)
    current.revenue += Number(t.total_amount || 0)
    map.set(key, current)
  })
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
})

async function submitSale() {
  formError.value = ''
  formSuccess.value = ''
  if (!form.value.product_id) {
    formError.value = 'Please select a product.'
    return
  }
  if (!form.value.quantity || form.value.quantity <= 0) {
    formError.value = 'Quantity must be at least 1.'
    return
  }
  submitting.value = true
  try {
    const created = await createPosTransaction({
      product_id: form.value.product_id,
      quantity: form.value.quantity,
      payment_method: form.value.payment_method,
      status: form.value.status,
    })
    transactions.value.unshift(created)
    // Update local stock for the selected product
    const p = products.value.find((x) => String(x.id) === String(form.value.product_id))
    if (p && typeof p.stock === 'number') {
      p.stock = Math.max(0, p.stock - Number(form.value.quantity || 0))
    }
    formSuccess.value = 'Sale recorded.'
    form.value.quantity = 1
  } catch (e) {
    formError.value = e.message || 'Failed to record sale.'
  }
  submitting.value = false
}

onMounted(async () => {
  loading.value = true
  try {
    const [tx, prods] = await Promise.all([getPosTransactions(), getPosProducts()])
    transactions.value = tx
    products.value = prods
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>

