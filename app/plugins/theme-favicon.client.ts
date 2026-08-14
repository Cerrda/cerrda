import { applyThemeFavicon } from '~/data/favicon'

export default defineNuxtPlugin(() => {
  const colorMode = useColorMode()
  const { app } = useRuntimeConfig()

  watch(
    () => colorMode.value,
    (mode) => {
      if (mode === 'dark' || mode === 'light') {
        applyThemeFavicon(mode, app.baseURL)
      }
    },
    { immediate: true, flush: 'sync' },
  )
})
