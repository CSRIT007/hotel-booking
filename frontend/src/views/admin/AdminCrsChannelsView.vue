<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Channels</h1>
    <p class="mt-1 text-stone-600">
      Distribution sources for reservations. Website bookings go to Direct. Commission is recorded for OTA channels.
    </p>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Channels</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ channels.length }}</p>
      </div>
      <div class="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Active</p>
        <p class="mt-1 text-2xl font-bold text-green-600">{{ channels.filter((c) => c.status === 'active').length }}</p>
      </div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add channel</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model="form.name" type="text" required class="field" placeholder="e.g. Hotelbeds" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Code</label>
            <input v-model="form.code" type="text" class="field" placeholder="Optional short code" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Commission %</label>
            <input v-model.number="form.commission_pct" type="number" min="0" max="100" step="0.01" class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Add channel' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Channel</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Commission</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Bookings</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in channels" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ row.name }}</p>
                <p class="text-xs uppercase text-stone-400">{{ row.code }}</p>
              </td>
              <td class="px-3 py-3 text-right">{{ Number(row.commission_pct).toFixed(2) }}%</td>
              <td class="px-3 py-3 text-right">{{ row.booking_count }}</td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="row.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'">{{ row.status }}</span>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <button v-if="row.code !== 'direct'" type="button" class="mr-2 text-brand-700 hover:underline" @click="toggle(row)">
                  {{ row.status === 'active' ? 'Pause' : 'Activate' }}
                </button>
                <button v-if="row.code !== 'direct'" type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
                <span v-else class="text-stone-400">Default</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createCrsChannel, deleteCrsChannel, getCrsChannels, updateCrsChannel } from '../../services/data'

const channels = ref([])
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({ name: '', code: '', commission_pct: 0 })

async function load() {
  try {
    channels.value = await getCrsChannels()
  } catch (e) {
    error.value = e.message
  }
}

async function create() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createCrsChannel({ ...form })
    form.name = ''
    form.code = ''
    form.commission_pct = 0
    success.value = 'Channel added.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function toggle(row) {
  error.value = ''
  try {
    await updateCrsChannel(row.id, { status: row.status === 'active' ? 'paused' : 'active' })
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteCrsChannel(row.id)
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
