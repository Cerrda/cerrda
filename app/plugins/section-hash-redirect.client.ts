import { navItems } from '~/data/site'

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const route = useRoute()
  const ids = new Set(navItems.map((item) => item.id))

  const redirect = () => {
    const hash = (route.hash || window.location.hash).replace(/^#/, '')
    if (route.path === '/' && hash && ids.has(hash)) {
      return navigateTo(`/${hash}`, { replace: true })
    }
  }

  return router.isReady().then(redirect)
})
