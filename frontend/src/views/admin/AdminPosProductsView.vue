<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">POS Products</h1>
    <p class="mt-1 text-stone-600">Products from PostgreSQL. Add more in the database or via API.</p>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Name</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Category</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Price</th>
              <th class="px-4 py-3 text-right font-medium text-stone-700">Stock</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="p in products" :key="p.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">{{ p.id }}</td>
              <td class="px-4 py-3 font-medium text-stone-800">{{ p.name }}</td>
              <td class="px-4 py-3 text-stone-600">{{ p.category || '—' }}</td>
              <td class="px-4 py-3 text-right">${{ Number(p.price || 0).toFixed(2) }}</td>
              <td class="px-4 py-3 text-right">{{ p.stock ?? '—' }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'"
                >{{ p.status || 'active' }}</span>
              </td>
              <td class="px-4 py-3 text-stone-500">{{ formatDate(p.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="products.length === 0 && !loading" class="p-4 text-center text-stone-500">No products. Run the database schema to create the pos_products table and sample data.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPosProducts } from '../../services/data'

const products = ref([])
const loading = ref(true)

function formatDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? val : d.toLocaleDateString()
}

onMounted(async () => {
  loading.value = true
  try {
    products.value = await getPosProducts()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
