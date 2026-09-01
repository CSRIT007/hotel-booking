<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Guests</h1>
    <p class="mt-1 text-stone-600">Guest accounts (users with role guest).</p>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-stone-200 text-sm">
        <thead class="bg-stone-50">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-stone-700">ID</th>
            <th class="px-4 py-3 text-left font-medium text-stone-700">Username</th>
            <th class="px-4 py-3 text-left font-medium text-stone-700">Email</th>
            <th class="px-4 py-3 text-left font-medium text-stone-700">Joined</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-200">
          <tr v-for="u in guests" :key="u.id" class="hover:bg-stone-50">
            <td class="px-4 py-3">{{ u.id }}</td>
            <td class="px-4 py-3">{{ u.username }}</td>
            <td class="px-4 py-3">{{ u.email }}</td>
            <td class="px-4 py-3">{{ u.created_at }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="guests.length === 0 && !loading" class="p-4 text-center text-stone-500">No guests.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsers } from '../../services/data'

const users = ref([])
const loading = ref(true)
const guests = computed(() => users.value.filter((u) => (u.role || '').toLowerCase() === 'guest'))

onMounted(async () => {
  loading.value = true
  try {
    users.value = await getUsers({ role: 'guest' })
    if (guests.value.length === 0) users.value = await getUsers()
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
