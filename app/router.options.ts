import type { RouterConfig } from '@nuxt/schema'
import { navSectionFromPath } from '~/data/site'

const HEADER_OFFSET = 96

function waitForSection(id: string, attempt = 0): Promise<HTMLElement | null> {
  if (!import.meta.client) return Promise.resolve(null)
  const el = document.getElementById(id)
  if (el) return Promise.resolve(el)
  if (attempt > 24) return Promise.resolve(null)
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      void waitForSection(id, attempt + 1).then(resolve)
    })
  })
}

export default {
  async scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    const sectionId = navSectionFromPath(to.path)
    const isClientNav = from.matched.length > 0
    const behavior: ScrollBehavior = isClientNav ? 'smooth' : 'auto'

    if (sectionId) {
      const el = await waitForSection(sectionId)
      if (el) {
        return { el, top: HEADER_OFFSET, behavior }
      }
    }

    if (to.path === '/') {
      return { top: 0, left: 0, behavior }
    }

    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
