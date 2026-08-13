<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { brandEditorial } from '~/data/editorial'
import { navItems, siteProfile } from '~/data/site'

const route = useRoute()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const scrollPercentage = ref(0)

const links = computed(() =>
  navItems.map((item) => ({
    ...item,
    href: route.path === '/' ? `#${item.id}` : `/#${item.id}`,
  })),
)

function updatePageScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) {
    scrollPercentage.value = 0
    return
  }
  // Clamp so elastic/subpixel scroll near the bottom cannot overshoot and re-animate the gauge.
  scrollPercentage.value = Math.min(1, Math.max(0, window.scrollY / max))
}

onMounted(() => {
  window.addEventListener('scroll', updatePageScroll, { passive: true })
  updatePageScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updatePageScroll)
})
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-50">
    <div class="section-pad !py-4 md:!py-5">
      <LiquidGlass
        :radius="999"
        :frost="0.4"
        :border="0.08"
        :scale="-42"
        :blur="6"
        :g-offset="2"
        :b-offset="4"
        container-class="pointer-events-auto mx-auto max-w-6xl"
      >
        <div class="relative flex items-center justify-between gap-3 px-4 py-2.5 md:px-6 md:py-3">
          <NuxtLink
            to="/"
            class="group inline-flex items-center rounded-full outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:ring-2 focus-visible:ring-primary/40"
            :aria-label="`${siteProfile.name} home`"
          >
            <PhotoAbstractEditorial :artwork="brandEditorial" :name="siteProfile.name" />
          </NuxtLink>

          <nav class="hidden items-center gap-1.5 md:flex">
            <a
              v-for="item in links"
              :key="item.id"
              :href="item.href"
              class="rounded-full px-3.5 py-2 text-[15px] text-muted-foreground transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent/70 hover:text-foreground"
            >
              {{ item.label }}
            </a>
          </nav>

          <div class="flex items-center gap-1">
            <div
              class="flex shrink-0 items-center gap-2 pr-1"
              role="meter"
              aria-label="页面阅读进度"
              :aria-valuenow="Math.round(scrollPercentage * 100)"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <AnimatedCircularProgressBar
                :value="scrollPercentage * 100"
                :min="0"
                :max="100"
                :circle-stroke-width="10"
                class="!size-5 !text-[0px]"
                :show-percentage="false"
                :duration="0.3"
                :gauge-secondary-color="isDark ? 'oklch(0.45 0.04 350 / 0.35)' : 'oklch(0.75 0.06 350 / 0.45)'"
                :gauge-primary-color="isDark ? '#f9a8d4' : '#db2777'"
              />
              <NumberFlow
                :value="scrollPercentage"
                :format="{ style: 'percent' }"
                locales="en-US"
                class="hidden w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block"
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </LiquidGlass>
    </div>
  </header>
</template>
