<template>
  <div>
    <h1 class="text-2xl font-semibold text-stone-800">User management</h1>
    <p class="mt-1 text-stone-600">Create staff, change roles, disable accounts, and reset passwords. At least one active staff account must remain.</p>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <form class="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" @submit.prevent="create">
        <h2 class="text-sm font-semibold text-stone-800">Add account</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-700">Username</label>
            <input v-model="form.username" type="text" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Email</label>
            <input v-model="form.email" type="email" required class="field" />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Password</label>
            <input v-model="form.password" type="password" required minlength="8" class="field" />
            <p class="mt-1 text-xs text-stone-500">At least 8 characters</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-700">Role</label>
            <select v-model="form.role" class="field">
              <option value="staff">Staff</option>
              <option value="guest">Guest</option>
            </select>
          </div>
        </div>
        <p v-if="formError" class="mt-3 text-sm text-red-600">{{ formError }}</p>
        <p v-if="formSuccess" class="mt-3 text-sm text-green-600">{{ formSuccess }}</p>
        <button type="submit" class="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700" :disabled="saving">
          {{ saving ? 'Saving…' : 'Create account' }}
        </button>
      </form>

      <div class="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div class="flex items-center gap-3 border-b border-stone-200 px-4 py-3">
          <select v-model="roleFilter" class="rounded-md border border-stone-300 px-2 py-1 text-sm" @change="load">
            <option value="">All roles</option>
            <option value="staff">Staff</option>
            <option value="guest">Guest</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 text-sm">
            <thead class="bg-stone-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-stone-700">User</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Role</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Status</th>
                <th class="px-4 py-3 text-left font-medium text-stone-700">Last login</th>
                <th class="px-4 py-3 text-right font-medium text-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200">
              <tr v-for="u in users" :key="u.id" class="hover:bg-stone-50">
                <td class="px-4 py-3">
                  <p class="font-medium text-stone-800">{{ u.username }}</p>
                  <p class="text-xs text-stone-500">{{ u.email }}</p>
                </td>
                <td class="px-4 py-3 capitalize">{{ u.role }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="statusClass(u)">{{ statusLabel(u) }}</span>
                </td>
                <td class="px-4 py-3 text-stone-500">{{ formatWhen(u.last_login_at) || 'Never' }}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="u.role !== 'staff'" type="button" class="mr-2 text-brand-600 hover:underline" @click="setRole(u, 'staff')">Make staff</button>
                  <button v-else-if="!isSelf(u)" type="button" class="mr-2 text-stone-600 hover:underline" @click="setRole(u, 'guest')">Make guest</button>
                  <button v-if="isLocked(u)" type="button" class="mr-2 text-amber-700 hover:underline" @click="unlock(u)">Unlock</button>
                  <button v-if="u.status !== 'disabled' && !isSelf(u)" type="button" class="mr-2 text-red-600 hover:underline" @click="askDisable(u)">Disable</button>
                  <button v-else-if="u.status === 'disabled'" type="button" class="mr-2 text-green-600 hover:underline" @click="setStatus(u, 'active')">Enable</button>
                  <button type="button" class="text-stone-600 hover:underline" @click="askPassword(u)">Reset password</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="users.length === 0 && !loading" class="p-4 text-center text-stone-500">No users.</p>
      </div>
    </div>

    <ConfirmModal
      :open="!!pendingDisable"
      title="Disable this account?"
      :message="pendingDisable ? `${pendingDisable.username} will not be able to sign in until you enable the account again.` : ''"
      confirm-text="Disable"
      @confirm="disable"
      @cancel="pendingDisable = null"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { createUser, getUsers, resetUserPassword, unlockUser, updateUser } from '../../services/data'
import { useAuth } from '../../composables/useAuth'
import ConfirmModal from '../../components/ConfirmModal.vue'

const { currentUser } = useAuth()
const users = ref([])
const loading = ref(true)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const roleFilter = ref('')
const pendingDisable = ref(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  role: 'staff',
})

function isSelf(u) {
  return Number(currentUser.value?.id) === Number(u.id)
}

function isLocked(u) {
  return u.locked_until && new Date(u.locked_until) > new Date()
}

function statusLabel(u) {
  if (u.status === 'disabled') return 'Disabled'
  if (isLocked(u)) return 'Locked'
  return 'Active'
}

function statusClass(u) {
  if (u.status === 'disabled') return 'bg-red-100 text-red-800'
  if (isLocked(u)) return 'bg-amber-100 text-amber-800'
  return 'bg-green-100 text-green-800'
}

function formatWhen(val) {
  if (!val) return ''
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString()
}

async function load() {
  loading.value = true
  try {
    users.value = await getUsers(roleFilter.value ? { role: roleFilter.value } : {})
  } catch (e) {
    console.warn(e)
  }
  loading.value = false
}

async function create() {
  formError.value = ''
  formSuccess.value = ''
  saving.value = true
  try {
    await createUser({ ...form, username: form.username.trim(), email: form.email.trim() })
    form.username = ''
    form.email = ''
    form.password = ''
    formSuccess.value = 'Account created.'
    await load()
  } catch (e) {
    formError.value = e.message || 'Could not create account.'
  }
  saving.value = false
}

async function setRole(u, role) {
  try {
    await updateUser(u.id, { role, status: u.status || 'active' })
    await load()
  } catch (e) {
    formError.value = e.message
  }
}

async function setStatus(u, status) {
  try {
    await updateUser(u.id, { role: u.role, status })
    await load()
  } catch (e) {
    formError.value = e.message
  }
}

function askDisable(u) {
  pendingDisable.value = u
}

async function disable() {
  const u = pendingDisable.value
  pendingDisable.value = null
  if (u) await setStatus(u, 'disabled')
}

async function unlock(u) {
  try {
    await unlockUser(u.id)
    await load()
  } catch (e) {
    formError.value = e.message
  }
}

async function askPassword(u) {
  const password = window.prompt(`New password for ${u.username} (min 8 characters)`)
  if (!password) return
  try {
    await resetUserPassword(u.id, password)
    formSuccess.value = `Password updated for ${u.username}.`
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
