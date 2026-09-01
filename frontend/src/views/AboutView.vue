<template>
  <div>
    <PageHero title="About us" subtitle="Hospitality in Phnom Penh — comfortable rooms and a team that looks after every stay." image="/images/image_4.jpg">
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        About
      </template>
    </PageHero>

    <section class="py-16">
      <div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div
          class="h-80 rounded-3xl bg-stone-200 bg-cover bg-center shadow-sm"
          style="background-image: url('/images/image_5.jpg')"
        />
        <div>
          <p class="text-sm font-medium uppercase tracking-widest text-brand-600">Our story</p>
          <h2 class="mt-2 font-display text-3xl font-semibold text-stone-800">Welcome to Smile Hotel</h2>
          <p class="mt-4 text-lg leading-relaxed text-stone-600">
            Smile Hotel offers comfortable accommodation in the heart of the city.
            Whether you are here for business or a short holiday, we aim to make your stay easy and memorable.
          </p>
          <p class="mt-4 leading-relaxed text-stone-600">
            Our team is dedicated to warm service, clean rooms, and a calm place to rest after a day in Phnom Penh.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import PageHero from '../components/PageHero.vue'
</script>
