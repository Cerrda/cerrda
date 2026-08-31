<script setup lang="ts">
import { brandEditorial } from '~/data/editorial'
import { navItems, siteProfile } from '~/data/site'

const route = useRoute()

const brandAriaLabel = computed(() => (route.path === '/' ? '回到顶部' : `${siteProfile.name} 首页`))

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function onBrandClick(event: MouseEvent) {
  if (isModifiedClick(event)) return
  if (route.path !== '/') return

  event.preventDefault()
  if (route.hash) {
    history.replaceState(history.state, '', route.path)
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onNavClick(event: MouseEvent, id: string) {
  if (isModifiedClick(event)) return
  if (route.path !== '/') return

  event.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  history.replaceState(history.state, '', `${route.path}#${id}`)
}
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-50">
    <div class="section-pad !py-4 md:!py-5">
      <LiquidGlass
        :radius="999"
        :frost="0.1"
        :border="0.35"
        :scale="-80"
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
            <NuxtLink
              v-for="item in navItems"
              :key="item.id"
              :to="{ path: '/', hash: `#${item.id}` }"
              class="rounded-full px-3.5 py-2 text-[15px] text-muted-foreground transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent/70 hover:text-foreground"
              @click="onNavClick($event, item.id)"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div class="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </LiquidGlass>
    </div>
  </header>
</template>
