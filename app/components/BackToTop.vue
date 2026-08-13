<script setup lang="ts">
/**
 * Back to top — Inspira ScrollIsland / AnimatedCircularProgressBar 组合
 * UX：滚动过阈值后显示；设计：沿用站内 LiquidGlass + 玫瑰粉主色
 */
import { PhCaretUp } from '@phosphor-icons/vue'
import { useThrottleFn } from '@vueuse/core'
import { Motion, AnimatePresence } from 'motion-v'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: string
  /** 显示阈值：至少滚动这么多像素，或约 2 屏高度（取较大者） */
  thresholdPx?: number
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  thresholdPx: 1000,
})

const visible = ref(false)
const scrollPercentage = ref(0)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const reducedMotion = ref(false)

const primaryColor = computed(() => (isDark.value ? '#f9a8d4' : '#db2777'))
const secondaryColor = computed(() => (isDark.value ? '#6b728055' : '#6b728099'))

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const y = window.scrollY
  scrollPercentage.value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0

  const threshold = Math.max(props.thresholdPx, window.innerHeight * 2)
  visible.value = y >= threshold
}

const onScroll = useThrottleFn(updateScroll, 120)

function scrollToTop() {
  const behavior: ScrollBehavior = reducedMotion.value ? 'auto' : 'smooth'
  window.scrollTo({ top: 0, behavior })
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('scroll', onScroll, { passive: true })
  updateScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <ClientOnly>
    <AnimatePresence>
      <Motion
        v-if="visible"
        as="div"
        :initial="reducedMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.86, y: 16 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }"
        :transition="
          reducedMotion
            ? { duration: 0.12 }
            : { type: 'spring', stiffness: 320, damping: 24, mass: 0.7 }
        "
        :class="cn('pointer-events-none fixed right-5 bottom-6 z-50 sm:right-7 sm:bottom-8', props.class)"
      >
        <button
          type="button"
          class="pointer-events-auto group relative size-12 overflow-hidden rounded-full outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96]"
          aria-label="回到顶部"
          title="回到顶部"
          @click="scrollToTop"
        >
          <LiquidGlass :radius="24" :frost="0.22" :border="0.45" container-class="size-12 rounded-full">
            <span class="relative flex size-12 items-center justify-center text-foreground">
              <AnimatedCircularProgressBar
                :value="scrollPercentage * 100"
                :min="0"
                :max="100"
                :circle-stroke-width="8"
                class="!absolute inset-0 !size-12 !text-[0px]"
                :show-percentage="false"
                :duration="0.25"
                :gauge-primary-color="primaryColor"
                :gauge-secondary-color="secondaryColor"
              />
              <PhCaretUp
                :size="18"
                weight="bold"
                class="relative z-[1] transition duration-300 group-hover:-translate-y-0.5"
              />
            </span>
          </LiquidGlass>
        </button>
      </Motion>
    </AnimatePresence>
  </ClientOnly>
</template>
