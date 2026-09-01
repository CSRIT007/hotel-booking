<template>
  <div>
    <section class="bg-stone-800 py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="text-brand-300 text-sm">
          <router-link to="/" class="hover:text-brand-200">Home</router-link>
          <span class="mx-2">/</span>
          Services
        </p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white">Our services</h1>
      </div>
    </section>

    <section class="py-12">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="s in services"
            :key="s.id"
            class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div
              class="h-40 bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${s.image || '/images/services-1.jpg'})` }"
            />
            <div class="p-5">
              <h3 class="font-display text-lg font-semibold text-stone-800">{{ s.name }}</h3>
              <p class="mt-2 text-sm text-stone-600">{{ s.description }}</p>
            </div>
          </div>
        </div>
        <p v-if="services.length === 0 && !loading" class="text-center text-stone-500">No services listed.</p>
        <p v-if="loading" class="text-center text-stone-500">Loading…</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getServices } from '../services/data'

const services = ref([])
const loading = ref(true)

onMounted(async () => {
  services.value = await getServices()
  loading.value = false
})
</script>
