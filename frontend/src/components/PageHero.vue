<template>
  <section class="relative overflow-hidden bg-stone-900">
    <div
      class="absolute inset-0 scale-105 bg-cover bg-center"
      :style="{ backgroundImage: `url(${image})` }"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/65 to-stone-900/25" />
    <div class="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <p v-if="$slots.crumbs" class="text-sm text-brand-200">
        <slot name="crumbs" />
      </p>
      <h1 class="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-3 max-w-2xl text-base text-stone-200 sm:text-lg">{{ subtitle }}</p>
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  image: { type: String, default: '/images/image_2.jpg' },
})
</script>
