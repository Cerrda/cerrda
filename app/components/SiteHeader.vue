<script setup lang="ts">
import { brandEditorial } from '~/data/editorial'
import { navItems, siteProfile } from '~/data/site'

const route = useRoute()
const { app } = useRuntimeConfig()

const links = computed(() =>
  navItems.map((item) => ({
    ...item,
    href: route.path === '/' ? `#${item.id}` : withAppBase(`/#${item.id}`, app.baseURL),
  })),
)

const brandAriaLabel = computed(() => (route.path === '/' ? '回到顶部' : `${siteProfile.name} 首页`))

function onBrandClick(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (route.path !== '/') return

  event.preventDefault()
  if (route.hash) {
    history.replaceState(history.state, '', route.path)
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}
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
            :aria-label="brandAriaLabel"
            @click="onBrandClick"
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
            <ThemeToggle />
          </div>
        </div>
      </LiquidGlass>
    </div>
  </header>
</template>
