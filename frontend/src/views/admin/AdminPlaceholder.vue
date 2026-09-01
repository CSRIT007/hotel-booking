<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">{{ pageTitle }}</h1>
    <p class="mt-1 text-stone-600">Data for this section can be added when the corresponding backend and tables are set up.</p>

    <div class="mt-6 rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="border-b border-stone-200 px-4 py-3">
        <h2 class="font-semibold text-stone-800">Data table</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">#</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Name</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr>
              <td colspan="4" class="px-4 py-8 text-center text-stone-500">
                No data yet. Configure the backend and database for this section to see records here.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'Section')
</script>
