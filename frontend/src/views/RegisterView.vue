<template>
  <div class="min-h-[60vh] py-16">
    <div class="mx-auto max-w-md px-4">
      <h1 class="font-display text-2xl font-semibold text-stone-800">Register</h1>
      <form class="mt-8 space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="block text-sm font-medium text-stone-700">Username</label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            minlength="6"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p class="mt-0.5 text-xs text-stone-500">At least 6 characters</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-stone-700">Confirm password</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <p v-if="success" class="text-sm text-green-600">{{ success }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {{ loading ? 'Creating account…' : 'Register' }}
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-stone-600">
        Already have an account?
        <router-link to="/login" class="text-brand-600 hover:underline">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthApi } from '../services/auth'

const router = useRouter()
const { register } = useAuthApi()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  success.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  loading.value = true
  try {
    await register({ username: username.value, email: email.value, password: password.value })
    router.push({ name: 'Home' })
  } catch (e) {
    error.value = e.message || 'Registration failed.'
  }
  loading.value = false
}
</script>
