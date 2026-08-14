import type { Ref } from 'vue'

const IDLE_MS = 140

let installed = false

/**
 * Shared "user is scrolling" flag. One window listener for the whole app.
 * Used to pause WebGL and swap expensive SVG backdrop filters for CSS blur
 * while the viewport is moving.
 */
export function usePageScrolling() {
  const scrolling = useState('app-page-scrolling', () => false)

  if (import.meta.client) {
    installPageScrolling(scrolling)
  }

  return scrolling
}

function installPageScrolling(scrolling: Ref<boolean>) {
  if (installed) return
  installed = true

  let timer = 0

  const markScrolling = () => {
    if (!scrolling.value) scrolling.value = true
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      scrolling.value = false
    }, IDLE_MS)
  }

  const markIdle = () => {
    window.clearTimeout(timer)
    if (scrolling.value) scrolling.value = false
  }

  window.addEventListener('scroll', markScrolling, { passive: true })
  window.addEventListener('scrollend', markIdle)
}
