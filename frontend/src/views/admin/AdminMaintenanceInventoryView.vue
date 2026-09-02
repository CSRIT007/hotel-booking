<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Inventory</h1>
    <p class="mt-1 text-stone-600">
      Track spare parts. Stock is low when quantity reaches the minimum, and out when it hits zero. You cannot use more than you have on hand.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">In stock</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ parts.filter((p) => p.stock_status === 'in_stock').length }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Low stock</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">{{ parts.filter((p) => p.stock_status === 'low_stock').length }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Out</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ parts.filter((p) => p.stock_status === 'out_of_stock').length }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add part</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model="form.part_name" type="text" required class="field" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">Part number</label>
              <input v-model="form.part_number" type="text" class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Category</label>
              <select v-model="form.category" class="field">
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
                <option>Furniture</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">On hand</label>
              <input v-model.number="form.quantity" type="number" min="0" required class="field" />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Minimum</label>
              <input v-model.number="form.min_quantity" type="number" min="0" required class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Unit cost</label>
            <input v-model.number="form.unit_cost" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Supplier</label>
            <input v-model="form.supplier" type="text" class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Bin / location</label>
            <input v-model="form.location" type="text" class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Add part' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Part</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Qty</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in parts" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ row.part_name }}</p>
                <p class="text-xs text-stone-500">{{ row.part_number || '—' }} · {{ row.category }}</p>
                <p class="text-xs text-stone-400">{{ row.location || '—' }} · {{ formatMoney(row.unit_cost) }}</p>
              </td>
              <td class="px-3 py-3 text-right font-medium">
                {{ row.quantity }}
                <p class="text-xs font-normal text-stone-400">min {{ row.min_quantity }}</p>
              </td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="stockClass(row.stock_status)">{{ stockLabel(row.stock_status) }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <input v-model.number="qty[row.id]" type="number" min="1" class="mr-2 w-16 rounded border border-stone-300 px-2 py-0.5 text-xs" />
                <button type="button" class="mr-2 text-brand-700 hover:underline" @click="move(row, 'restock')">Restock</button>
                <button type="button" class="mr-2 text-stone-700 hover:underline" @click="move(row, 'use')">Use</button>
                <button type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="parts.length === 0 && !loading" class="p-4 text-center text-stone-500">No spare parts yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createMaintenancePart, deleteMaintenancePart, getMaintenanceInventory, updateMaintenancePart } from '../../services/data'
import { formatMoney } from '../../utils/money'

const parts = ref([])
const qty = reactive({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({
  part_name: '',
  part_number: '',
  category: 'Plumbing',
  quantity: 1,
  min_quantity: 1,
  unit_cost: 0,
  supplier: '',
  location: '',
})

function stockLabel(status) {
  const map = { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' }
  return map[status] || status
}

function stockClass(status) {
  const map = {
    in_stock: 'bg-green-100 text-green-800',
    low_stock: 'bg-amber-100 text-amber-800',
    out_of_stock: 'bg-red-100 text-red-800',
  }
  return map[status] || map.in_stock
}

async function load() {
  loading.value = true
  try {
    parts.value = await getMaintenanceInventory()
    parts.value.forEach((p) => {
      if (qty[p.id] == null) qty[p.id] = 1
    })
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function create() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createMaintenancePart({ ...form })
    form.part_name = ''
    form.part_number = ''
    form.quantity = 1
    success.value = 'Part added.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function move(row, kind) {
  error.value = ''
  success.value = ''
  try {
    const n = qty[row.id] || 1
    await updateMaintenancePart(row.id, { [kind]: n })
    success.value = kind === 'restock' ? 'Stock added.' : 'Stock used.'
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteMaintenancePart(row.id)
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
