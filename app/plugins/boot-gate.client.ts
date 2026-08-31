import { startPreloadBundle } from '~/lib/boot/preload'

export default defineNuxtPlugin({
  name: 'boot-gate',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) return
    const { ready, gpuProfile } = useAppBoot()
    gpuProfile.value = detectGpuProfile()
    startPreloadBundle()

    if (ready.value || readBootSession()) {
      ready.value = true
      ;(window as Window & { __cerrdaBootShown?: boolean }).__cerrdaBootShown = true
      document.documentElement.classList.add('booted')
      document.documentElement.classList.remove('booting')
      return
    }

    document.documentElement.classList.add('booting')
  },
})
