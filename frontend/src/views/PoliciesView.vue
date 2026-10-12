<template>
  <div>
    <PageHero
      title="Stay policies"
      subtitle="How booking, arrival, cancellation, house rules, payment, and your details work at Smile Hotel MS."
      image="/images/image_2.jpg"
    >
      <template #crumbs>
        <router-link to="/" class="hover:text-white">Home</router-link>
        <span class="mx-2 text-white/40">/</span>
        Policies
      </template>
    </PageHero>

    <section class="py-14 sm:py-20">
      <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside class="lg:sticky lg:top-24 lg:self-start">
          <p class="text-xs font-semibold uppercase tracking-wider text-stone-500">On this page</p>
          <nav class="mt-3 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            <a
              v-for="section in policySections"
              :key="section.id"
              :href="'#' + section.id"
              class="shrink-0 rounded-full border px-3 py-1.5 text-sm lg:rounded-lg lg:border-transparent lg:px-3 lg:py-2"
              :class="activeId === section.id
                ? 'border-brand-600 bg-brand-50 font-medium text-brand-800 lg:bg-brand-50'
                : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-800 lg:hover:bg-stone-50'"
              @click.prevent="goTo(section.id)"
            >
              {{ section.title }}
            </a>
          </nav>
        </aside>

        <div class="space-y-8">
          <article
            v-for="section in policySections"
            :id="section.id"
            :key="section.id"
            class="scroll-mt-24 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-600">{{ section.short }}</p>
            <h2 class="mt-1 font-display text-2xl font-semibold text-stone-800">{{ section.title }}</h2>
            <p v-for="(p, i) in section.paragraphs" :key="i" class="mt-4 leading-relaxed text-stone-600">
              {{ p }}
            </p>
            <ul v-if="section.bullets?.length" class="mt-4 space-y-2 text-stone-600">
              <li v-for="item in section.bullets" :key="item" class="flex gap-2">
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </article>

          <div class="rounded-3xl border border-stone-200 bg-warm-50 p-6 sm:p-8">
            <h2 class="font-display text-xl font-semibold text-stone-800">Questions</h2>
            <p class="mt-2 text-sm leading-relaxed text-stone-600">
              If something is unclear before you book, write to the desk. Include dates, guest count, and the room you have in mind.
            </p>
            <div class="mt-5 flex flex-wrap gap-3">
              <router-link to="/contact" class="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Contact the desk
              </router-link>
              <router-link to="/rooms" class="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-white">
                Browse rooms
              </router-link>
            </div>
            <p class="mt-4 text-xs text-stone-500">
              Last updated 12 October 2026. House times: check-in from 2:00 pm, check-out until 12:00 pm. Desk +855 98 944 686.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHero from '../components/PageHero.vue'
import { policySections } from '../constants/policies'

const route = useRoute()
const router = useRouter()
const activeId = ref(policySections[0].id)

function setActiveFromHash() {
  const id = (route.hash || '').replace(/^#/, '')
  if (id && policySections.some((s) => s.id === id)) activeId.value = id
}

function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function goTo(id) {
  activeId.value = id
  router.replace({ name: 'Policies', hash: '#' + id })
  nextTick(() => scrollToId(id))
}

onMounted(() => {
  setActiveFromHash()
  if (route.hash) {
    const id = route.hash.replace(/^#/, '')
    nextTick(() => setTimeout(() => scrollToId(id), 80))
  }
})

watch(
  () => route.hash,
  () => {
    setActiveFromHash()
    if (route.hash) nextTick(() => scrollToId(route.hash.replace(/^#/, '')))
  },
)
</script>
