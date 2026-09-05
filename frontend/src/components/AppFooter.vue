<template>
  <footer class="border-t border-stone-200 bg-stone-900 py-14 text-stone-300">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div class="lg:col-span-2">
          <h3 class="font-display text-xl font-semibold text-white">Smile Hotel</h3>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-stone-400">
            Comfortable rooms and warm hospitality in Phnom Penh.
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
          <ul class="mt-3 space-y-2 text-sm">
            <li><router-link to="/rooms" class="hover:text-white">Rooms</router-link></li>
            <li><router-link to="/services" class="hover:text-white">Services</router-link></li>
            <li><router-link to="/about" class="hover:text-white">About</router-link></li>
            <li><router-link to="/contact" class="hover:text-white">Contact</router-link></li>
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
          <p class="mt-3 text-sm">Sangkat Tul Kok, Khan Tul Kok, Phnom Penh</p>
          <p class="text-sm">+855 98 944 686</p>
          <p class="text-sm">noreply@smilerental.com</p>
        </div>
      </div>
      <p class="mt-10 border-t border-white/10 pt-6 text-center text-sm text-stone-500">
        © {{ new Date().getFullYear() }} Smile Hotel. All rights reserved.
      </p>
    </div>
  </footer>
</template>

