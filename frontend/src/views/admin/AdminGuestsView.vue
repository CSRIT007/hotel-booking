<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Guests</h1>
    <p class="mt-1 text-stone-600">Name, phone, ID, and stay history for front desk.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="save">
        <h2 class="text-sm font-semibold text-stone-800">{{ editingId ? 'Edit guest' : 'Add guest' }}</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Name</label>
            <input v-model="form.full_name" type="text" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Phone</label>
            <input v-model="form.phone" type="tel" class="field" placeholder="+855 …" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Email</label>
            <input v-model="form.email" type="email" class="field" placeholder="Optional" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-stone-700">ID type</label>
              <select v-model="form.id_type" class="field">
                <option value="">________Selection________</option>
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-700">ID number</label>
              <input v-model="form.id_number" type="text" class="field" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Notes</label>
            <textarea v-model="form.notes" rows="2" class="field" />
          </div>
        </div>
        <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
        <p v-if="formSuccess" class="mt-3 text-sm text-green-600">{{ formSuccess }}</p>
        <div class="mt-4 flex gap-2">
          <button type="submit" class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50" :disabled="saving">
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Add guest' }}
          </button>
          <button v-if="editingId" type="button" class="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50" @click="resetForm">
            Cancel
          </button>
        </div>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center gap-3 border-b border-stone-200 px-4 py-3">
          <input v-model="query" type="search" class="min-w-[12rem] flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm" placeholder="Search name, phone, email, or ID" @keyup.enter="load" />
          <ReportExportButton
            report-id="guests"
            filename="guests"
            :rows="guests"
            :columns="guestExportColumns"
            :disabled="loading"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Guest</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Phone</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">ID</th>
                <th class="px-3 py-3 text-left font-medium text-stone-700">Stays</th>
                <th class="px-3 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="g in guests" :key="g.id" class="hover:bg-stone-50" :class="selectedId === g.id ? 'bg-brand-50' : ''">
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ g.full_name || g.username }}</p>
                  <p class="text-xs text-stone-500">{{ g.email }}</p>
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-stone-600">{{ g.phone || '—' }}</td>
                <td class="whitespace-nowrap px-3 py-3 text-stone-600">{{ idLabel(g) }}</td>
                <td class="px-3 py-3 text-stone-600">{{ g.stayed || 0 }}</td>
                <td class="whitespace-nowrap px-3 py-3 text-right">
                  <button type="button" class="mr-3 text-brand-600 hover:underline" @click="open(g)">History</button>
                  <button type="button" class="text-stone-600 hover:underline" @click="edit(g)">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="guests.length === 0 && !loading" class="p-4 text-center text-stone-500">No guests.</p>
        <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
      </div>
    </div>

    <div v-if="detail" class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
        <div>
          <h2 class="font-semibold text-stone-800">{{ detail.full_name }} — stay history</h2>
          <p class="text-xs text-stone-500">
            {{ detail.phone || 'No phone' }}
            <span v-if="detail.id_number"> · {{ idLabel(detail) }}</span>
          </p>
        </div>
        <button type="button" class="text-sm text-stone-600 hover:underline" @click="detail = null; selectedId = null">Close</button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Dates</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Room</th>
              <th class="px-3 py-3 text-left font-medium text-stone-700">Status</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Quoted</th>
              <th class="px-3 py-3 text-right font-medium text-stone-700">Collected</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="s in detail.stays" :key="s.id" class="hover:bg-stone-50">
              <td class="whitespace-nowrap px-4 py-3">
                <router-link :to="{ path: '/admin/bookings', query: { stay: s.id } }" class="text-brand-600 hover:underline">
                  {{ s.check_in }} → {{ s.check_out }}
                </router-link>
              </td>
              <td class="px-3 py-3">{{ s.room_name }} <span class="text-xs text-stone-400">{{ s.hotel_name }}</span></td>
              <td class="px-3 py-3 capitalize">{{ String(s.status || '').replace('_', ' ') }}</td>
              <td class="px-3 py-3 text-right">{{ formatMoney(s.total_price) }}</td>
              <td class="px-3 py-3 text-right">{{ formatMoney(s.folio_payments) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="(detail.stays || []).length === 0" class="p-4 text-center text-stone-500">No stays yet.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import ReportExportButton from '../../components/ReportExportButton.vue'
import { createGuest, getGuest, getGuests, updateGuest } from '../../services/data'
import { formatMoney } from '../../utils/money'

const guestExportColumns = [
  { label: 'Name', value: (row) => row.full_name || row.username },
  { label: 'Phone', key: 'phone' },
  { label: 'Email', key: 'email' },
  { label: 'ID type', key: 'id_type' },
  { label: 'ID number', key: 'id_number' },
  { label: 'Stays', key: 'stayed' },
  { label: 'Notes', key: 'notes' },
]

const guests = ref([])
const detail = ref(null)
const selectedId = ref(null)
const loading = ref(true)
const saving = ref(false)
const query = ref('')
const editingId = ref(null)
const formError = ref('')
const formSuccess = ref('')
const form = reactive({
  full_name: '',
  phone: '',
  email: '',
  id_type: '',
  id_number: '',
  notes: '',
})

function idLabel(g) {
  if (!g?.id_number) return '—'
  const type = { national_id: 'National ID', passport: 'Passport', other: 'ID' }[g.id_type] || 'ID'
  return `${type} ${g.id_number}`
}

function resetForm() {
  editingId.value = null
  form.full_name = ''
  form.phone = ''
  form.email = ''
  form.id_type = ''
  form.id_number = ''
  form.notes = ''
  formError.value = ''
}

function edit(g) {
  editingId.value = g.id
  form.full_name = g.full_name || g.username || ''
  form.phone = g.phone || ''
  form.email = g.email || ''
  form.id_type = g.id_type || ''
  form.id_number = g.id_number || ''
  form.notes = g.notes || ''
  formError.value = ''
  formSuccess.value = ''
}

async function load() {
  loading.value = true
  try {
    guests.value = await getGuests(query.value.trim() ? { q: query.value.trim() } : {})
  } catch (e) {
    formError.value = e.message
  }
  loading.value = false
}

async function save() {
  formError.value = ''
  formSuccess.value = ''
  saving.value = true
  try {
    const payload = { ...form, full_name: form.full_name.trim() }
    if (editingId.value) await updateGuest(editingId.value, payload)
    else await createGuest(payload)
    formSuccess.value = editingId.value ? 'Guest updated.' : 'Guest added.'
    resetForm()
    await load()
    if (selectedId.value) await open({ id: selectedId.value })
  } catch (e) {
    formError.value = e.message || 'Could not save guest.'
  }
  saving.value = false
}

async function open(g) {
  selectedId.value = g.id
  try {
    detail.value = await getGuest(g.id)
  } catch (e) {
    formError.value = e.message
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  @apply mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500;
}
</style>
