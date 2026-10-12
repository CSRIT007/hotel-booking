<template>
  <span class="inline-flex items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="Smile Hotel"
      :class="markClass"
    >
      <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="32" cy="32" r="29.5" stroke-width="2.2" />
        <g transform="translate(32 23.5) scale(0.5) translate(-32 -31)">
          <path d="M12 24 L32 7 L52 24" stroke-width="2.6" />
          <circle cx="22" cy="31" r="5.6" stroke-width="2.6" />
          <circle cx="42" cy="31" r="5.6" stroke-width="2.6" />
          <path d="M14 44 C18 44 22 56 32 56 C42 56 46 44 50 44" stroke-width="3.2" />
        </g>
      </g>
      <text
        v-if="wordmark"
        x="32"
        y="45.5"
        text-anchor="middle"
        fill="currentColor"
        font-family="Outfit, Montserrat, Arial, sans-serif"
        font-size="6.4"
        font-weight="500"
        letter-spacing="1.7"
      >SMILE</text>
      <g v-if="wordmark" fill="currentColor" stroke="currentColor" opacity="0.55">
        <line x1="16" y1="51.2" x2="21.5" y2="51.2" stroke-width="0.8" stroke-linecap="round" />
        <text
          x="32"
          y="53"
          text-anchor="middle"
          fill="currentColor"
          stroke="none"
          font-family="Outfit, Montserrat, Arial, sans-serif"
          font-size="3.6"
          font-weight="500"
          letter-spacing="1.35"
        >HOTEL</text>
        <line x1="42.5" y1="51.2" x2="48" y2="51.2" stroke-width="0.8" stroke-linecap="round" />
      </g>
    </svg>
  </span>
</template>

<script setup>
defineProps({
  wordmark: { type: Boolean, default: true },
  markClass: { type: String, default: 'h-14 w-14' },
})
</script>
