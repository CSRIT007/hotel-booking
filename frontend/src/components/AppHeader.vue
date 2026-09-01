<template>
  <header class="sticky top-0 z-50 border-b border-stone-200/80 bg-warm-50/95 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-950/95">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <router-link to="/" class="font-display text-xl font-semibold text-brand-700 dark:text-brand-300">
        Smile Hotel
      </router-link>
      <nav class="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
        <router-link to="/" class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300">Home</router-link>
        <router-link to="/rooms" class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300">Rooms</router-link>
        <router-link to="/services" class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300">Services</router-link>
        <router-link to="/about" class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300">About</router-link>
        <router-link to="/contact" class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300">Contact</router-link>
        <template v-if="isLoggedIn">
          <span class="text-sm text-stone-500">Hi, {{ currentUser?.username }}</span>
          <router-link
            v-if="isStaff"
            to="/admin"
            class="text-stone-600 hover:text-brand-600 transition dark:text-stone-300 dark:hover:text-brand-300"
          >
            Dashboard
          </router-link>
          <button
            type="button"
            class="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600"
            @click="requestLogout"
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
            class="rounded-lg border border-brand-600 px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
          >
            Register
          </router-link>
        </template>
        <ThemeToggle />
      </nav>
    </div>
  </header>
  <ConfirmModal
    :open="showLogoutConfirm"
    title="Log out?"
    message="Are you sure you want to log out?"
    confirm-text="Log out"
    cancel-text="Cancel"
    @confirm="confirmLogout"
    @cancel="showLogoutConfirm = false"
  />
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import ConfirmModal from './ConfirmModal.vue'

const { isLoggedIn, currentUser, isStaff, logout } = useAuth()
const router = useRouter()
const showLogoutConfirm = ref(false)

function requestLogout() {
  showLogoutConfirm.value = true
}

function confirmLogout() {
  showLogoutConfirm.value = false
  logout()
  router.push({ name: 'Home' })
}
</script>
