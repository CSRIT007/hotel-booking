<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Audit log</h1>
    <p class="mt-1 text-stone-600">Who did what, from which IP and device. Logins, bookings, properties, rooms, messages, POS, and expenses.</p>

    <div class="mt-6 flex flex-wrap gap-3">
      <select v-model="entity" class="rounded-md border border-stone-300 px-3 py-2 text-sm" @change="load">
        <option value="">All types</option>
        <option value="user">Accounts</option>
        <option value="booking">Bookings</option>
        <option value="property">Properties</option>
        <option value="room">Rooms</option>
        <option value="message">Messages</option>
        <option value="pos">POS</option>
        <option value="expense">Expenses</option>
      </select>
      <select v-model="action" class="rounded-md border border-stone-300 px-3 py-2 text-sm" @change="load">
        <option value="">All actions</option>
        <option value="create">Create</option>
        <option value="update">Update</option>
        <option value="delete">Delete</option>
        <option value="confirmed">Confirm booking</option>
        <option value="cancelled">Cancel booking</option>
        <option value="login">Login</option>
        <option value="login_failed">Failed login</option>
        <option value="register">Register</option>
      </select>
    </div>

    <div class="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">When</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Who</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Action</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">IP address</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">What happened</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in logs" :key="row.id" class="hover:bg-stone-50">
              <td class="whitespace-nowrap px-4 py-3 text-stone-500">{{ formatWhen(row.created_at) }}</td>
              <td class="px-4 py-3">
                <span class="font-medium text-stone-800">{{ row.actor_name || 'Guest' }}</span>
                <span class="ml-1 text-xs text-stone-400">{{ row.actor_role }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="actionClass(row.action)"
                >{{ row.action.replace('_', ' ') }}</span>
              </td>
              <td class="px-4 py-3">
                <p class="font-mono text-xs text-stone-800">{{ formatIp(row.ip_address) }}</p>
                <p class="mt-0.5 text-xs text-stone-500">{{ row.device || 'Unknown device' }}</p>
              </td>
              <td class="px-4 py-3 text-stone-800">{{ row.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="logs.length === 0 && !loading" class="p-4 text-center text-stone-500">No audit entries yet. Staff actions will appear here.</p>
      <p v-if="loading" class="p-4 text-center text-stone-500">Loading…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getAuditLogs } from '../../services/data'

const logs = ref([])
const loading = ref(true)
const entity = ref('')
const action = ref('')

function formatWhen(val) {
  if (!val) return ''
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? val : d.toLocaleString()
}

function formatIp(ip) {
  if (!ip) return '—'
  let value = String(ip)
  if (value.startsWith('::ffff:')) value = value.slice(7)
  if (value === '::1') value = '127.0.0.1'
  return value
}

function actionClass(value) {
  if (value === 'delete' || value === 'cancelled' || value === 'login_failed') return 'bg-red-100 text-red-800'
  if (value === 'create' || value === 'confirmed' || value === 'register') return 'bg-green-100 text-green-800'
  if (value === 'update' || value === 'login') return 'bg-sky-100 text-sky-800'
  return 'bg-stone-100 text-stone-600'
}

async function load() {
  loading.value = true
  try {
    const params = {}
    if (entity.value) params.entity = entity.value
    if (action.value) params.action = action.value
    logs.value = await getAuditLogs(params)
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

onMounted(load)
</script>
