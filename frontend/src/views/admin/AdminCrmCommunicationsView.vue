<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Communications</h1>
    <p class="mt-1 text-stone-600">
      Send a one-to-one note to a guest, or review messages from campaigns.
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="send">
        <h2 class="text-sm font-semibold text-stone-800">Message a guest</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Guest</label>
            <select v-model.number="form.user_id" required class="field">
              <option disabled :value="0">________Selection________</option>
              <option v-for="g in guests" :key="g.id" :value="g.id">{{ g.username }} ({{ g.email }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Subject</label>
            <input v-model="form.subject" type="text" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Message</label>
            <textarea v-model="form.message" rows="4" required class="field" />
          </div>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="mt-3 text-sm text-green-600">{{ success }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving || !form.user_id">
          {{ saving ? 'Sending…' : 'Send' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">When</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Guest</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Subject</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Source</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in messages" :key="row.id" class="hover:bg-stone-50">
              <td class="whitespace-nowrap px-4 py-3 text-stone-500">{{ row.created_at }}</td>
              <td class="px-3 py-3">
                <p class="font-medium text-stone-800">{{ row.username }}</p>
                <p class="text-xs text-stone-400">{{ row.email }}</p>
              </td>
              <td class="px-3 py-3">
                <p class="font-medium text-stone-800">{{ row.subject }}</p>
                <p class="line-clamp-2 text-xs text-stone-500">{{ row.message }}</p>
              </td>
              <td class="px-3 py-3 text-stone-600">{{ row.campaign_name || 'Direct' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="messages.length === 0 && !loading" class="p-4 text-center text-stone-500">No messages yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createCrmCommunication, getCrmCommunications, getCrmLoyalty } from '../../services/data'

const guests = ref([])
const messages = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({ user_id: 0, subject: '', message: '' })

async function load() {
  loading.value = true
  try {
    const [loyalty, comms] = await Promise.all([getCrmLoyalty(), getCrmCommunications()])
    guests.value = loyalty.guests || []
    messages.value = comms
  } catch (e) {
    error.value = e.message
  }
  loading.value = false
}

async function send() {
  error.value = ''
  success.value = ''
  saving.value = true
  try {
    await createCrmCommunication({ ...form })
    form.subject = ''
    form.message = ''
    success.value = 'Message recorded.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
