<script lang="ts" setup>
import { cn } from '~/lib/utils'
import { Motion } from 'motion-v'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSpring } from 'vue-use-spring'

defineProps({
  class: String,
})

const tracingBeamRef = ref<HTMLDivElement>()
const tracingBeamContentRef = ref<HTMLDivElement>()

const scrollYProgress = ref(0)
const svgHeight = ref(0)
const scrollPercentage = ref(0)

const computedY1 = computed(() => Math.max(0, scrollYProgress.value * svgHeight.value * 0.15))
const computedY2 = computed(() => Math.max(24, scrollYProgress.value * svgHeight.value))

const spring = useSpring({ y1: 0, y2: 24 }, { tension: 120, friction: 24, precision: 0.01 })

watch(computedY1, (newY1) => {
  spring.y1 = newY1
})

watch(computedY2, (newY2) => {
  spring.y2 = newY2
})

let ticking = false
let inView = true
let resizeObserver: ResizeObserver | undefined
let intersectionObserver: IntersectionObserver | undefined

function updateScrollYProgress() {
  if (!tracingBeamRef.value) return

  const rect = tracingBeamRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight || 1
  const elementHeight = Math.max(rect.height, 1)
  const visible = Math.min(windowHeight, Math.max(0, windowHeight - rect.top))
  const progress = Math.min(1, Math.max(0, visible / (windowHeight + elementHeight * 0.35)))

  scrollPercentage.value = progress
  scrollYProgress.value = progress
}

function onScroll() {
  if (!inView || ticking) return
  ticking = true
  requestAnimationFrame(() => {
    updateScrollYProgress()
    ticking = false
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  updateScrollYProgress()

  resizeObserver = new ResizeObserver(() => {
    updateSVGHeight()
  })

  if (tracingBeamContentRef.value) {
    resizeObserver.observe(tracingBeamContentRef.value)
  }

  if (tracingBeamRef.value) {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true
        if (inView) updateScrollYProgress()
      },
      { rootMargin: '160px' },
    )
    intersectionObserver.observe(tracingBeamRef.value)
  }

  updateSVGHeight()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
})

function updateSVGHeight() {
  if (!tracingBeamContentRef.value) return

  svgHeight.value = tracingBeamContentRef.value.offsetHeight
}
</script>

<template>
  <div ref="tracingBeamRef" :class="cn(`relative mx-auto h-full w-full max-w-4xl`, $props.class)">
    <div class="absolute top-3 left-0 z-10">
      <div
        :style="{
          boxShadow: scrollYProgress > 0 ? 'none' : 'oklch(0.45 0.1 350 / 0.28) 0px 3px 8px',
        }"
        class="ml-[27px] flex size-4 items-center justify-center rounded-full border border-border shadow-sm bg-card"
      >
        <Motion
          :animate="{
            backgroundColor: scrollYProgress > 0 ? 'oklch(0.985 0.018 350)' : '#f472b6',
            borderColor: scrollYProgress > 0 ? 'oklch(0.985 0.018 350)' : '#db2777',
          }"
          class="size-2 rounded-full border border-border bg-card"
        />
      </div>
      <svg
        :viewBox="`0 0 20 ${Math.max(svgHeight, 1)}`"
        width="20"
        :height="Math.max(svgHeight, 1)"
        class="ml-4 block"
        aria-hidden="true"
      >
        <path
          :d="`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`"
          fill="none"
          stroke="currentColor"
          class="text-foreground/20"
          stroke-opacity="0.35"
        />
        <path
          :d="`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`"
          fill="none"
          stroke="url(#tracing-beam-gradient)"
          stroke-width="1.25"
          class="motion-reduce:hidden"
        />
        <defs>
          <linearGradient
            id="tracing-beam-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            :y1="spring.y1"
            :y2="spring.y2"
          >
            <stop stop-color="#fb7185" stop-opacity="0" />
            <stop stop-color="#fb7185" />
            <stop offset="0.325" stop-color="#f472b6" />
            <stop offset="1" stop-color="#c084fc" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div ref="tracingBeamContentRef" class="relative">
      <slot />
    </div>
  </div>
</template>
