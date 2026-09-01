<template>
  <header class="sticky top-0 z-50 border-b border-stone-200/80 bg-warm-50/95 backdrop-blur-sm">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <router-link to="/" class="font-display text-xl font-semibold text-brand-700">
        Smile Hotel
      </router-link>
      <nav class="flex items-center gap-6">
        <router-link to="/" class="text-stone-600 hover:text-brand-600 transition">Home</router-link>
        <router-link to="/rooms" class="text-stone-600 hover:text-brand-600 transition">Rooms</router-link>
        <router-link to="/services" class="text-stone-600 hover:text-brand-600 transition">Services</router-link>
        <router-link to="/about" class="text-stone-600 hover:text-brand-600 transition">About</router-link>
        <router-link to="/contact" class="text-stone-600 hover:text-brand-600 transition">Contact</router-link>
        <template v-if="isLoggedIn">
          <span class="text-sm text-stone-500">{{ currentUser?.username }}</span>
          <router-link
            v-if="isStaff"
            to="/admin"
            class="text-stone-600 hover:text-brand-600 transition"
          >
            Admin
          </router-link>
          <button
            type="button"
            class="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300"
            @click="handleLogout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <router-link
            to="/login"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Login
          </router-link>
          <router-link
            to="/register"
            class="rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Register
          </router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

const { isLoggedIn, currentUser, isStaff, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push({ name: 'Home' })
}
</script>
