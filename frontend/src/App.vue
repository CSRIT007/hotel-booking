<template>
  <div class="min-h-screen flex flex-col bg-warm-50 dark:bg-stone-950">
    <AppHeader v-if="showPublicChrome" />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter v-if="showPublicChrome" />

    <div
      v-if="showIdleWarning"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4"
    >
      <div class="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
        <p class="font-semibold text-stone-800">Still there?</p>
        <p class="mt-2 text-sm text-stone-600">
          You will be signed out in {{ secondsLeft }} second{{ secondsLeft === 1 ? '' : 's' }} due to inactivity.
        </p>
        <button
          type="button"
          class="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          @click="staySignedIn"
        >
          Stay signed in
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { useIdleLogout } from './composables/useIdleLogout'

const route = useRoute()
const { showIdleWarning, secondsLeft, staySignedIn } = useIdleLogout()
const showPublicChrome = computed(() => {
  const path = route.path
  return !(path.startsWith('/admin') && path !== '/admin/login')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
