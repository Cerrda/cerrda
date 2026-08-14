export default defineNuxtPlugin({
  name: 'boot-gate',
  enforce: 'pre',
  setup() {
    if (!import.meta.client) return
    const { ready, gpuProfile } = useAppBoot()
    gpuProfile.value = detectGpuProfile()
    if (!ready.value) {
      document.documentElement.classList.add('booting')
    }
  },
})
