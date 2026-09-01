<template>
  <div>
    <PageHero title="Our services" subtitle="Everything you need for a comfortable stay." image="/images/services-2.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        Services
      </template>
    </PageHero>

    <section class="py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="s in services"
            :key="s.id"
            class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div
              class="h-44 bg-stone-200 bg-cover bg-center"
              :style="{ backgroundImage: `url(${s.image || '/images/services-1.jpg'})` }"
            />
            <div class="p-6">
              <h3 class="font-display text-xl font-semibold text-stone-800">{{ s.name }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-stone-600">{{ s.description }}</p>
            </div>
          </article>
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
import PageHero from '../components/PageHero.vue'

const services = ref([])
const loading = ref(true)

onMounted(async () => {
  services.value = await getServices()
  loading.value = false
})
</script>
