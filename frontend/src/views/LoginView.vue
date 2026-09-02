<template>
  <div class="flex min-h-[70vh] items-center py-16">
    <div class="mx-auto w-full max-w-md px-4">
      <div class="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <h1 class="font-display text-2xl font-semibold text-stone-800">Welcome back</h1>
      <p class="mt-1 text-sm text-stone-500">Guests: use email. Staff: use username.</p>
      <p v-if="route.query.idle === '1'" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        You were signed out after 5 minutes of inactivity.
      </p>
      <form class="mt-8 space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-stone-700">Email or username</label>
          <input
            v-model="loginId"
            type="text"
            required
            autocomplete="username"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="error && (error.includes('Database') || error.includes('500') || error.includes('Network'))" class="mt-1 text-xs text-stone-500">
          Start the backend: <code class="rounded bg-stone-200 px-1">cd backend && npm start</code>. Create admin with <code class="rounded bg-stone-200 px-1">npm run create-admin</code>.
        </p>
        <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {{ loading ? 'Logging in…' : 'Login' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-stone-600">
        Don't have an account?
        <router-link to="/register" class="text-brand-600 hover:underline">Register</router-link>
      </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthApi } from '../services/auth'

const router = useRouter()
const route = useRoute()
const { login } = useAuthApi()
const loginId = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

const successMsg = new URLSearchParams(window.location.search).get('removed')
if (successMsg) success.value = 'You have been removed from the employee list. You can still log in as a guest.'

async function handleLogin() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const res = await login(loginId.value, password.value)
    if (res?.user?.role === 'staff') {
      router.push({ name: 'AdminDashboard' })
    } else {
      router.push(route.query.redirect || { name: 'Home' })
    }
  } catch (e) {
    error.value = e.message || 'Login failed.'
  }
  loading.value = false
}
</script>
