<template>
  <div class="min-h-[70vh] flex items-center justify-center bg-stone-100 py-16">
    <div class="mx-auto w-full max-w-md px-4">
      <div class="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 class="font-display text-2xl font-semibold text-stone-800">Admin login</h1>
        <p class="mt-1 text-sm text-stone-500">Staff only. Use your username and password.</p>
        <form class="mt-8 space-y-4" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-medium text-stone-700">Username</label>
            <input
              v-model="loginId"
              type="text"
              required
              autocomplete="username"
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Admin"
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
          <p v-if="error" class="mt-2 text-xs text-stone-500">
            Ensure the backend is running (<code class="rounded bg-stone-200 px-1">cd backend && npm start</code>) and you have run <code class="rounded bg-stone-200 px-1">npm run create-admin</code> (default: Admin / admin123).
          </p>
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-stone-800 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-stone-500">
          <router-link to="/" class="text-brand-600 hover:underline">Back to site</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthApi } from '../services/auth'

const router = useRouter()
const route = useRoute()
const { login } = useAuthApi()
const loginId = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const redirectTo = computed(() => route.query.redirect || '/admin')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    const res = await login(loginId.value, password.value)
    if (res?.user?.role === 'staff') {
      router.push(redirectTo.value)
    } else {
      error.value = 'Access denied. Staff account required.'
    }
  } catch (e) {
    error.value = e.message || 'Login failed.'
  }
  loading.value = false
}
</script>
