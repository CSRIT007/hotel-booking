<template>
  <header class="sticky top-0 z-50 border-b border-stone-200/80 bg-warm-50/95 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-950/95">
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
      <router-link to="/" class="font-display text-xl font-semibold text-brand-700 dark:text-brand-300">
        Smile Hotel
      </router-link>

      <nav class="hidden flex-1 items-center justify-center gap-6 text-sm font-medium lg:flex">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/rooms" class="nav-link">Rooms</router-link>
        <router-link to="/services" class="nav-link">Services</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link to="/contact" class="nav-link">Contact</router-link>
      </nav>

      <div class="ml-auto hidden items-center gap-3 lg:flex">
        <template v-if="isLoggedIn">
          <span class="hidden text-sm text-stone-500 xl:inline">Hi, {{ currentUser?.username }}</span>
          <router-link to="/my-bookings" class="relative nav-link">
            My bookings
            <span
              v-if="unreadCount > 0"
              class="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white"
            >
              {{ unreadCount }}
            </span>
          </router-link>
          <router-link v-if="isStaff" to="/admin" class="nav-link">Dashboard</router-link>
          <button type="button" class="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-100 dark:hover:bg-stone-600" @click="requestLogout">
            Logout
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="text-sm font-medium text-stone-600 hover:text-brand-600 dark:text-stone-300">Login</router-link>
          <router-link to="/register" class="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            Book a stay
          </router-link>
        </template>
        <ThemeToggle />
      </div>

      <div class="ml-auto flex items-center gap-2 lg:hidden">
        <ThemeToggle />
        <button type="button" class="rounded-lg border border-stone-200 p-2 text-stone-700 dark:border-stone-600 dark:text-stone-200" aria-label="Open menu" @click="menuOpen = !menuOpen">
          <span class="block h-0.5 w-5 bg-current" />
          <span class="mt-1 block h-0.5 w-5 bg-current" />
          <span class="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>
    </div>

    <div v-if="menuOpen" class="border-t border-stone-200 bg-warm-50 px-4 py-3 lg:hidden dark:border-stone-700 dark:bg-stone-950">
      <nav class="flex flex-col gap-2 text-sm font-medium">
        <router-link to="/" class="mobile-link" @click="menuOpen = false">Home</router-link>
        <router-link to="/rooms" class="mobile-link" @click="menuOpen = false">Rooms</router-link>
        <router-link to="/services" class="mobile-link" @click="menuOpen = false">Services</router-link>
        <router-link to="/about" class="mobile-link" @click="menuOpen = false">About</router-link>
        <router-link to="/contact" class="mobile-link" @click="menuOpen = false">Contact</router-link>
        <template v-if="isLoggedIn">
          <router-link to="/my-bookings" class="mobile-link" @click="menuOpen = false">My bookings</router-link>
          <router-link v-if="isStaff" to="/admin" class="mobile-link" @click="menuOpen = false">Dashboard</router-link>
          <button type="button" class="mobile-link text-left" @click="menuOpen = false; requestLogout()">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="menuOpen = false">Login</router-link>
          <router-link to="/register" class="mobile-link text-brand-700" @click="menuOpen = false">Register</router-link>
        </template>
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
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRouter, useRoute } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import ConfirmModal from './ConfirmModal.vue'
import { getNotifications } from '../services/data'

const { isLoggedIn, currentUser, isStaff, logout } = useAuth()
const router = useRouter()
const route = useRoute()
const showLogoutConfirm = ref(false)
const unreadCount = ref(0)
const menuOpen = ref(false)
let unreadTimer = null

async function loadUnread() {
  if (!isLoggedIn.value || !currentUser.value?.id) {
    unreadCount.value = 0
    return
  }
  try {
    const notes = await getNotifications(currentUser.value.id)
    unreadCount.value = notes.filter((n) => Number(n.is_read) === 0).length
  } catch {
    unreadCount.value = 0
  }
}

watch(isLoggedIn, loadUnread)
watch(() => route.fullPath, () => {
  menuOpen.value = false
  loadUnread()
})
onMounted(() => {
  loadUnread()
  unreadTimer = setInterval(loadUnread, 15000)
})
onUnmounted(() => {
  if (unreadTimer) clearInterval(unreadTimer)
})

function requestLogout() {
  showLogoutConfirm.value = true
}

function confirmLogout() {
  showLogoutConfirm.value = false
  logout()
  router.push({ name: 'Home' })
}
</script>

<style scoped>
.nav-link {
  @apply text-stone-600 transition hover:text-brand-600 dark:text-stone-300 dark:hover:text-brand-300;
}
.nav-link.router-link-exact-active {
  @apply text-brand-700 dark:text-brand-300;
}
.mobile-link {
  @apply rounded-lg px-2 py-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800;
}
</style>
