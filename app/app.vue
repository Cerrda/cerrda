<script setup lang="ts">
import { MotionConfig } from 'motion-v'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <MotionConfig reduced-motion="never">
    <AppBootLoader />
    <ClientOnly>
      <SilkBackground
        class="opacity-[0.36] dark:opacity-55"
        :hue="isDark ? 310 : 8"
        :saturation="isDark ? 0.45 : 0.4"
        :brightness="isDark ? 0.85 : 1.05"
        :speed="0.55"
      />
    </ClientOnly>
    <div class="app-shell relative z-10">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <ClientOnly>
        <BackToTop />
        <SmoothCursor />
      </ClientOnly>
    </div>
  </MotionConfig>
</template>
