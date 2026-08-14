<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <AppBootLoader />
  <SilkBackground
    class="opacity-40 dark:opacity-55"
    :hue="isDark ? 310 : 350"
    :saturation="isDark ? 0.45 : 0.22"
    :brightness="isDark ? 0.85 : 0.98"
    :speed="0.55"
  />
  <div class="app-shell relative z-10">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <BackToTop />
    </ClientOnly>
  </div>
</template>
