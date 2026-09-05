<template>
  <section class="relative min-h-[78vh] overflow-hidden bg-stone-900" @mouseenter="paused = true" @mouseleave="paused = false">
    <div
      v-for="(slide, i) in slides"
      :key="slide.id"
      class="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
      :class="i === index ? 'opacity-100' : 'opacity-0'"
      :style="{ backgroundImage: `url(${slide.image || fallbackImage})` }"
    />
    <div class="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-900/55 to-stone-900/20" />

    <div class="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24 sm:px-6">
      <div :key="current.id" class="max-w-3xl">
        <p v-if="current.eyebrow" class="overflow-hidden text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
          <span class="inline-block animate-run-line">{{ current.eyebrow }}</span>
        </p>
        <h1 class="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
          <span
            v-for="(word, i) in titleWords"
            :key="`${current.id}-${i}`"
            class="mr-[0.35em] inline-block animate-run-word"
            :style="{ animationDelay: `${i * 90}ms` }"
          >{{ word }}</span>
        </h1>
        <p v-if="current.subtitle" class="mt-4 max-w-xl text-lg text-stone-200 animate-run-word" style="animation-delay: 220ms">
          {{ current.subtitle }}
        </p>
        <div v-if="current.button_label" class="mt-10 flex flex-wrap gap-3 animate-run-word" style="animation-delay: 320ms">
          <a
            v-if="isExternal(current.button_link)"
            :href="current.button_link"
            class="rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-900/30 hover:bg-brand-700"
          >
            {{ current.button_label }}
          </a>
          <router-link
            v-else
            :to="current.button_link || '/rooms'"
            class="rounded-full bg-brand-600 px-6 py-3 font-medium text-white shadow-lg shadow-brand-900/30 hover:bg-brand-700"
          >
            {{ current.button_label }}
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="slides.length > 1" class="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-3">
      <button type="button" class="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25" aria-label="Previous slide" @click="prev">‹</button>
      <button
        v-for="(slide, i) in slides"
        :key="'dot-' + slide.id"
        type="button"
        class="h-2.5 rounded-full transition-all"
        :class="i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'"
        :aria-label="`Slide ${i + 1}`"
        @click="go(i)"
      />
      <button type="button" class="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/25" aria-label="Next slide" @click="next">›</button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  slides: { type: Array, default: () => [] },
})

const fallbackImage = '/images/image_2.jpg'
const index = ref(0)
const paused = ref(false)
let timer = null

function isExternal(link) {
  return /^https?:\/\//i.test(String(link || ''))
}

const current = computed(() => props.slides[index.value] || {
  id: 0,
  eyebrow: 'Phnom Penh, Cambodia',
  title: 'A calm stay in the heart of the city',
  subtitle: 'Boutique rooms, thoughtful service, and easy booking for your next trip.',
  image: fallbackImage,
  button_label: 'Browse rooms',
  button_link: '/rooms',
})

const titleWords = computed(() => String(current.value.title || '').split(/\s+/).filter(Boolean))

function go(i) {
  if (!props.slides.length) return
  index.value = ((i % props.slides.length) + props.slides.length) % props.slides.length
  restart()
}

function next() {
  go(index.value + 1)
}

function prev() {
  go(index.value - 1)
}

function restart() {
  if (timer) clearInterval(timer)
  if (props.slides.length > 1) {
    timer = setInterval(() => {
      if (!paused.value) index.value = (index.value + 1) % props.slides.length
    }, 6500)
  }
}

watch(() => props.slides.length, () => {
  if (index.value >= props.slides.length) index.value = 0
  restart()
})

onMounted(restart)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
@keyframes runWord {
  from {
    opacity: 0;
    transform: translateX(-2.25rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes runLine {
  from {
    opacity: 0;
    transform: translateX(-40%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-run-word {
  animation: runWord 0.7s ease-out both;
}

.animate-run-line {
  animation: runLine 1.1s ease-out both;
}
</style>
