<script setup lang="ts">
/**
 * 主题切换：View Transitions 圆形扩散 / 收拢
 * 浅色：新主题由内向外；切回暗色：旧主题由外向内
 * 参考 Element Plus / Magic UI
 */
import { PhMoon, PhSun } from '@phosphor-icons/vue'

const props = withDefaults(
  defineProps<{
    duration?: number
    /** 从视口中心扩散，而不是从按钮中心 */
    fromCenter?: boolean
  }>(),
  {
    duration: 400,
    fromCenter: false,
  },
)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const buttonRef = ref<HTMLButtonElement | null>(null)
const isTransitioning = ref(false)
let activeAnim: Animation | null = null

/** 百分比坐标：避免 Windows 缩放时 px 落点偏移 */
function getCircleClipPaths(
  cx: number,
  cy: number,
  maxRadius: number,
  viewportWidth: number,
  viewportHeight: number,
): [string, string] {
  const toX = (x: number) => `${(x / viewportWidth) * 100}%`
  const toY = (y: number) => `${(y / viewportHeight) * 100}%`
  const point = `${toX(cx)} ${toY(cy)}`
  // circle() 百分比半径相对 hypot(w,h)/√2
  const toRadius = (r: number) => `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`

  return [`circle(0% at ${point})`, `circle(${toRadius(maxRadius)} at ${point})`]
}

function cleanupTransition() {
  isTransitioning.value = false
  const root = document.documentElement
  delete root.dataset.themeVt
  root.style.removeProperty('--theme-toggle-vt-duration')
  root.style.removeProperty('--theme-vt-clip-from')
  activeAnim?.cancel()
  activeAnim = null
}

function toggle() {
  const button = buttonRef.value
  if (!button || isTransitioning.value || document.documentElement.dataset.themeVt) {
    return
  }

  const next = isDark.value ? 'light' : 'dark'
  // 切到浅色：由内向外；切回暗色：由外向内
  const direction: 'expand' | 'collapse' = next === 'light' ? 'expand' : 'collapse'

  const applyTheme = () => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    colorMode.preference = next
    try {
      localStorage.setItem('cerrda-color-mode', next)
    } catch {
      // private mode
    }
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    applyTheme()
    return
  }

  if (typeof document.startViewTransition !== 'function') {
    applyTheme()
    return
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x: number
  let y: number
  if (props.fromCenter) {
    x = viewportWidth / 2
    y = viewportHeight / 2
  } else {
    const { top, left, width, height } = button.getBoundingClientRect()
    x = left + width / 2
    y = top + height / 2
  }

  const maxRadius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y))
  const [clipFrom, clipTo] = getCircleClipPaths(x, y, maxRadius, viewportWidth, viewportHeight)
  // expand: 0 → R；collapse: R → 0
  const clipPath = direction === 'expand' ? [clipFrom, clipTo] : [clipTo, clipFrom]

  const root = document.documentElement
  root.dataset.themeVt = direction
  root.style.setProperty('--theme-toggle-vt-duration', `${props.duration}ms`)
  // expand 时钉住折叠态；collapse 时钉住展开态（旧帧盖住）
  root.style.setProperty('--theme-vt-clip-from', clipPath[0])

  isTransitioning.value = true
  const transition = document.startViewTransition(applyTheme)
  transition.finished.finally(cleanupTransition).catch(() => {})

  transition.ready
    .then(() => {
      const pseudo = direction === 'expand' ? '::view-transition-new(root)' : '::view-transition-old(root)'

      activeAnim = document.documentElement.animate(
        { clipPath },
        {
          duration: props.duration,
          easing: 'ease-in-out',
          fill: 'forwards',
          pseudoElement: pseudo,
        },
      )
    })
    .catch(() => {})
}

onUnmounted(() => {
  cleanupTransition()
})
</script>

<template>
  <button
    ref="buttonRef"
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent/70 hover:text-foreground disabled:opacity-60"
    :aria-label="isDark ? '切换浅色主题' : '切换暗色主题'"
    :disabled="isTransitioning"
    @click="toggle"
  >
    <PhSun v-if="isDark" :size="18" weight="duotone" />
    <PhMoon v-else :size="18" weight="duotone" />
  </button>
</template>
