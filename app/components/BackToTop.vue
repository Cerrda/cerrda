<script setup lang="ts">
/**
 * Back to top — Inspira Scroll Island
 * 滚动超过页面 20% 后出现；液态玻璃岛 + 环形进度 + NumberFlow。
 * 贴齐内容栏（max-w-6xl）右侧，而不是视口最右侧。
 */
import { PhCaretUp } from '@phosphor-icons/vue'
import NumberFlow from '@number-flow/vue'
import { useThrottleFn } from '@vueuse/core'
import { AnimatePresence, Motion } from 'motion-v'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  class?: string
  /** 显示阈值，相对整页滚动进度 */
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  threshold: 0.2,
})

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const reducedMotion = ref(false)
const scrollPercentage = ref(0)

const visible = computed(() => scrollPercentage.value >= props.threshold)
const scrollPercentInt = computed(() => Math.min(100, Math.round(scrollPercentage.value * 100)))
const primaryColor = computed(() => (isDark.value ? '#f9a8d4' : '#db2777'))
const secondaryColor = computed(() => (isDark.value ? '#6b728055' : '#6b728099'))

function updateScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  const y = window.scrollY
  scrollPercentage.value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
}

const onScroll = useThrottleFn(updateScroll, 120)

function onActivate() {
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
        :initial="reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18, scale: 0.94 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :exit="reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }"
        :transition="reducedMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 280, damping: 22, mass: 0.72 }"
        :class="cn('pointer-events-none fixed inset-x-0 bottom-6 z-40 sm:bottom-8', props.class)"
      >
        <div class="section-pad !py-0">
          <div class="mx-auto flex max-w-6xl justify-end">
            <button
              type="button"
              class="pointer-events-auto group outline-none"
              aria-label="回到顶部"
              title="回到顶部"
              @click="onActivate"
            >
              <span
                class="block rounded-full p-[3px] ring-1 ring-foreground/8 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:ring-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:scale-[0.98]"
              >
                <LiquidGlass
                  :radius="999"
                  :frost="0.3"
                  :border="0.4"
                  :scale="-48"
                  :blur="6"
                  container-class="h-11 overflow-hidden rounded-full"
                >
                  <span class="relative flex h-11 items-center gap-2 pr-3.5 pl-1 text-foreground">
                    <span class="relative flex size-9 shrink-0 items-center justify-center">
                      <AnimatedCircularProgressBar
                        :value="scrollPercentage * 100"
                        :min="0"
                        :max="100"
                        :circle-stroke-width="8"
                        class="!absolute inset-0.5 !size-8 !text-[0px]"
                        :show-percentage="false"
                        :duration="0.22"
                        :gauge-primary-color="primaryColor"
                        :gauge-secondary-color="secondaryColor"
                      />
                      <span
                        class="relative z-[1] flex size-6 items-center justify-center rounded-full bg-primary/12 text-foreground transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:bg-primary/20"
                      >
                        <PhCaretUp :size="14" weight="bold" />
                      </span>
                    </span>
                    <span class="text-sm font-semibold tracking-tight">Top</span>
                    <span class="inline-flex shrink-0 items-baseline text-xs tabular-nums text-muted-foreground">
                      <span class="inline-flex w-[3ch] justify-end overflow-hidden">
                        <NumberFlow
                          :value="scrollPercentInt"
                          :format="{ maximumFractionDigits: 0, useGrouping: false }"
                          locales="en-US"
                          class="[--number-flow-mask-width:0em]"
                        />
                      </span>
                      <span>%</span>
                    </span>
                  </span>
                </LiquidGlass>
              </span>
            </button>
          </div>
        </div>
      </Motion>
    </AnimatePresence>
  </ClientOnly>
</template>
