<template>
  <div class="min-h-[60vh] bg-stone-50 py-12">
    <div class="mx-auto max-w-4xl px-4 sm:px-6">
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="font-display text-2xl font-semibold text-stone-800">Admin dashboard</h1>
          <p class="mt-1 text-stone-600">Welcome, {{ currentUser?.username || 'Admin' }}.</p>
        </div>
        <div class="flex gap-3">
          <router-link
            to="/"
            class="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            View site
          </router-link>
          <button
            type="button"
            class="rounded-lg bg-stone-700 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            @click="requestLogout"
          >
            Logout
          </button>
        </div>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-stone-800">Quick links</h2>
          <ul class="mt-3 space-y-2 text-sm text-stone-600">
            <li><router-link to="/rooms" class="text-brand-600 hover:underline">Manage rooms (public list)</router-link></li>
            <li><router-link to="/contact" class="text-brand-600 hover:underline">Contact form (public)</router-link></li>
          </ul>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 class="font-semibold text-stone-800">Staff area</h2>
          <p class="mt-2 text-sm text-stone-600">You are logged in as staff. Bookings and other admin features can be added here.</p>
        </div>
      </div>
    </div>
  </div>
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
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import ConfirmModal from '../components/ConfirmModal.vue'

const router = useRouter()
const { currentUser, logout } = useAuth()
const showLogoutConfirm = ref(false)

function requestLogout() {
  showLogoutConfirm.value = true
}

function confirmLogout() {
  showLogoutConfirm.value = false
  logout()
  router.push({ name: 'AdminLogin' })
}
</script>
