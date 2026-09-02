<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">Security</h1>
    <p class="mt-1 text-stone-600">Account protection in use on this system.</p>

    <div v-if="summary" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Staff accounts</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ summary.staff }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Disabled</p>
        <p class="mt-1 text-2xl font-bold text-stone-800">{{ summary.disabled }}</p>
      </div>
      <div class="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Locked now</p>
        <p class="mt-1 text-2xl font-bold text-amber-700">{{ summary.locked }}</p>
      </div>
      <div class="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase text-stone-500">Failed logins (24h)</p>
        <p class="mt-1 text-2xl font-bold text-red-600">{{ summary.failed_logins_24h }}</p>
      </div>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="font-semibold text-stone-800">Active protections</h2>
        <ul class="mt-4 space-y-3 text-sm text-stone-600">
          <li>Passwords stored with bcrypt (not plain text).</li>
          <li>Minimum password length: {{ summary?.password_min || 8 }} characters.</li>
          <li>Account locks after {{ summary?.login_fail_limit || 5 }} failed sign-ins for {{ summary?.lockout_minutes || 15 }} minutes.</li>
          <li>Disabled accounts cannot sign in.</li>
          <li>Staff cannot disable or demote the last remaining admin.</li>
          <li>Each login and staff action is recorded with IP address and device.</li>
          <li>Signed-in sessions end after 5 minutes with no mouse, keyboard, or touch activity.</li>
          <li>User management APIs require a staff session.</li>
        </ul>
        <div class="mt-4 flex flex-wrap gap-3 text-sm">
          <router-link to="/admin/users" class="font-medium text-brand-600 hover:underline">User management →</router-link>
          <router-link to="/admin/login-activity" class="font-medium text-brand-600 hover:underline">Login activity →</router-link>
          <router-link to="/admin/audit-log" class="font-medium text-brand-600 hover:underline">Full audit log →</router-link>
        </div>
      </div>

      <div class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 class="font-semibold text-stone-800">Locked accounts</h2>
        <div class="mt-4 space-y-3">
          <div v-for="u in summary?.locked_accounts || []" :key="u.id" class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm">
            <div>
              <p class="font-medium text-stone-800">{{ u.username }}</p>
              <p class="text-xs text-stone-500">Unlocks {{ formatWhen(u.locked_until) }}</p>
            </div>
            <button type="button" class="text-amber-800 hover:underline" @click="unlock(u)">Unlock now</button>
          </div>
          <p v-if="!summary?.locked_accounts?.length" class="text-sm text-stone-500">No accounts are locked right now.</p>
        </div>
        <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getSecuritySummary, unlockUser } from '../../services/data'

const summary = ref(null)
const error = ref('')

function formatWhen(val) {
  if (!val) return ''
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? val : d.toLocaleString()
}

async function load() {
  summary.value = await getSecuritySummary()
}

async function unlock(u) {
  error.value = ''
  try {
    await unlockUser(u.id)
    await load()
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>
