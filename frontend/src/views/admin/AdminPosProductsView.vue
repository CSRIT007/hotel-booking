<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">POS Products</h1>
    <p class="mt-1 text-stone-600">Add products and stock. Active items appear in Sales under Select product.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="text-sm font-semibold text-stone-800">{{ editingId ? 'Edit product' : 'Add product' }}</h2>
        <p class="mt-1 text-xs text-stone-500">
          {{ editingId ? 'Update name, price, stock or status.' : 'Create a product with opening stock so staff can sell it.' }}
        </p>

        <form class="mt-4 space-y-3" @submit.prevent="submitProduct">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model.trim="form.name" type="text" class="field" required :disabled="submitting" placeholder="Mineral Water">
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Category</label>
            <input v-model.trim="form.category" type="text" class="field" list="pos-categories" :disabled="submitting" placeholder="Drink">
            <datalist id="pos-categories">
              <option v-for="c in categories" :key="c" :value="c" />
            </datalist>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium text-stone-700">Price</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" class="field" required :disabled="submitting">
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">Stock</label>
              <input v-model.number="form.stock" type="number" min="0" step="1" class="field" required :disabled="submitting">
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Status</label>
            <select v-model="form.status" class="field" :disabled="submitting">
              <option value="active">Active (shown in Sales)</option>
              <option value="inactive">Inactive (hidden from Sales)</option>
            </select>
          </div>

          <div class="flex items-center justify-between pt-1">
            <div class="text-xs">
              <p v-if="formError" class="text-red-600">{{ formError }}</p>
              <p v-if="formSuccess" class="text-green-600">{{ formSuccess }}</p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="editingId"
                type="button"
                class="rounded-md border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
                :disabled="submitting"
                @click="resetForm"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                :disabled="submitting || !form.name"
              >
                <span v-if="submitting">Saving…</span>
                <span v-else-if="editingId">Save changes</span>
                <span v-else>Add product</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-stone-700">Name</th>
              <th class="px-4 py-2 text-left font-medium text-stone-700">Category</th>
              <th class="px-4 py-2 text-right font-medium text-stone-700">Price</th>
              <th class="px-4 py-2 text-right font-medium text-stone-700">Stock</th>
              <th class="px-4 py-2 text-left font-medium text-stone-700">Status</th>
              <th class="px-4 py-2 text-right font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="p in products" :key="p.id" class="hover:bg-stone-50">
              <td class="px-4 py-2 font-medium text-stone-800">{{ p.name }}</td>
              <td class="px-4 py-2 text-stone-600">{{ p.category || '—' }}</td>
              <td class="px-4 py-2 text-right">{{ formatMoney(p.price) }}</td>
              <td class="px-4 py-2 text-right tabular-nums">{{ p.stock ?? '—' }}</td>
              <td class="px-4 py-2">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'"
                >
                  {{ p.status }}
                </span>
              </td>
              <td class="px-4 py-2 text-right">
                <button type="button" class="text-xs font-medium text-brand-700 hover:underline" @click="startEdit(p)">
                  Edit / stock
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="loading" class="p-4 text-center text-sm text-stone-500">Loading…</p>
        <p v-else-if="products.length === 0" class="p-4 text-center text-sm text-stone-500">
          No products yet. Add one on the left.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPosProducts, createPosProduct, updatePosProduct } from '../../services/data'
import { formatMoney } from '../../utils/money'

const products = ref([])
const loading = ref(true)
const submitting = ref(false)
const editingId = ref(null)
const formError = ref('')
const formSuccess = ref('')
const form = ref(emptyForm())

const categories = computed(() => {
  const set = new Set(products.value.map((p) => String(p.category || '').trim()).filter(Boolean))
  return Array.from(set).sort()
})

function emptyForm() {
  return {
    name: '',
    category: '',
    price: 0,
    stock: 0,
    status: 'active',
  }
}

function resetForm() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
}

function startEdit(product) {
  editingId.value = product.id
  form.value = {
    name: product.name || '',
    category: product.category || '',
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    status: product.status === 'inactive' ? 'inactive' : 'active',
  }
  formError.value = ''
  formSuccess.value = ''
}

async function load() {
  loading.value = true
  try {
    products.value = await getPosProducts()
  } catch (e) {
    formError.value = e.message || 'Could not load products.'
  }
  loading.value = false
}

async function submitProduct() {
  formError.value = ''
  formSuccess.value = ''
  if (!form.value.name) {
    formError.value = 'Product name is required.'
    return
  }
  if (form.value.price == null || Number(form.value.price) < 0) {
    formError.value = 'Price must be 0 or more.'
    return
  }
  if (form.value.stock == null || Number(form.value.stock) < 0) {
    formError.value = 'Stock must be 0 or more.'
    return
  }
  submitting.value = true
  const payload = {
    name: form.value.name,
    category: form.value.category,
    price: Number(form.value.price),
    stock: parseInt(form.value.stock, 10),
    status: form.value.status,
  }
  try {
    if (editingId.value) {
      const updated = await updatePosProduct(editingId.value, payload)
      products.value = products.value.map((p) => (String(p.id) === String(updated.id) ? updated : p))
      formSuccess.value = 'Product updated. Active items show in Sales.'
    } else {
      const created = await createPosProduct(payload)
      products.value = [created, ...products.value]
      formSuccess.value = 'Product added. It now appears in Sales under Select product.'
    }
    resetForm()
  } catch (e) {
    formError.value = e.message || 'Could not save product.'
  }
  submitting.value = false
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
