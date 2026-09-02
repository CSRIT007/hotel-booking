<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Login activity</h1>
    <p class="mt-1 text-stone-600">Successful sign-ins, failed attempts, and blocked logins.</p>

    <div class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-stone-700">When</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Who</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">IP address</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Result</th>
              <th class="px-4 py-3 text-left font-medium text-stone-700">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-200">
            <tr v-for="row in logs" :key="row.id" class="hover:bg-stone-50">
              <td class="whitespace-nowrap px-4 py-3 text-stone-500">{{ formatWhen(row.created_at) }}</td>
              <td class="px-4 py-3 font-medium text-stone-800">{{ row.actor_name }}</td>
              <td class="px-4 py-3">
                <p class="font-mono text-xs text-stone-800">{{ formatIp(row.ip_address) }}</p>
                <p class="mt-0.5 text-xs text-stone-500">{{ row.device || 'Unknown device' }}</p>
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': row.action === 'login',
                    'bg-red-100 text-red-800': row.action === 'login_failed' || row.action === 'login_blocked',
                    'bg-stone-100 text-stone-600': row.action === 'register',
                  }"
                >{{ row.action.replace('_', ' ') }}</span>
              </td>
              <td class="px-4 py-3 text-stone-700">{{ row.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="logs.length === 0 && !loading" class="p-4 text-center text-stone-500">No login activity yet.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getAuditLogs } from '../../services/data'

const logs = ref([])
const loading = ref(true)

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

onMounted(async () => {
  loading.value = true
  try {
    const all = await getAuditLogs({ entity: 'user' })
    logs.value = all.filter((row) => ['login', 'login_failed', 'login_blocked', 'register'].includes(row.action))
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
})
</script>
