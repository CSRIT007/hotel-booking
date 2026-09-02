<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Campaigns</h1>
    <p class="mt-1 text-stone-600">
      Draft an offer, then send it to all guests, VIP members, or guests who have stayed. Sent messages appear under Communications.
    </p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">New campaign</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model="form.name" type="text" required class="field" placeholder="Summer staycation" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Audience</label>
            <select v-model="form.audience" class="field">
              <option value="all">All guests</option>
              <option value="vip">VIP (silver and above)</option>
              <option value="stayed">Guests who have stayed</option>
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
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save draft' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Campaign</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Audience</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in campaigns" :key="row.id" class="hover:bg-stone-50">
              <td class="px-4 py-3">
                <p class="font-semibold text-stone-900">{{ row.name }}</p>
                <p class="text-xs text-stone-500">{{ row.subject }}</p>
              </td>
              <td class="px-3 py-3 capitalize text-stone-600">{{ row.audience }}</td>
              <td class="px-3 py-3">
                <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="row.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">{{ row.status }}</span>
                <p v-if="row.status === 'sent'" class="text-xs text-stone-400">{{ row.sent_count }} guests · {{ row.sent_at }}</p>
              </td>
              <td class="whitespace-nowrap px-3 py-3">
                <button v-if="row.status === 'draft'" type="button" class="mr-2 text-brand-700 hover:underline" @click="send(row)">Send</button>
                <button v-if="row.status === 'draft'" type="button" class="text-red-600 hover:underline" @click="remove(row)">Remove</button>
                <span v-else class="text-stone-400">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="campaigns.length === 0 && !loading" class="p-4 text-center text-stone-500">No campaigns yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createCrmCampaign, deleteCrmCampaign, getCrmCampaigns, sendCrmCampaign } from '../../services/data'

const campaigns = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({ name: '', audience: 'all', subject: '', message: '' })

async function load() {
  loading.value = true
  try {
    campaigns.value = await getCrmCampaigns()
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
    await createCrmCampaign({ ...form })
    form.name = ''
    form.subject = ''
    form.message = ''
    success.value = 'Draft saved. Send it when the audience is ready.'
    await load()
  } catch (e) {
    error.value = e.message
  }
  saving.value = false
}

async function send(row) {
  error.value = ''
  success.value = ''
  try {
    const res = await sendCrmCampaign(row.id)
    success.value = `Sent to ${res.sent_count} guest${res.sent_count === 1 ? '' : 's'}.`
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function remove(row) {
  error.value = ''
  try {
    await deleteCrmCampaign(row.id)
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
