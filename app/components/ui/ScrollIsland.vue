<script lang="ts" setup>
import { cn } from '~/lib/utils'
import NumberFlow from '@number-flow/vue'
import { Motion, MotionConfig } from 'motion-v'
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  class?: string
  title?: string
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  title: 'Progress',
  height: 44,
})

const scrollPercentage = ref(0)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function updatePageScroll() {
  const max = document.body.scrollHeight - window.innerHeight
  scrollPercentage.value = max > 0 ? window.scrollY / max : 0
}

onMounted(() => {
  window.addEventListener('scroll', updatePageScroll, { passive: true })
  updatePageScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updatePageScroll)
})
</script>

<template>
  <MotionConfig
    :transition="{
      duration: 0.7,
      type: 'spring',
      bounce: 0.35,
    }"
  >
    <div
      :class="
        cn('pointer-events-auto fixed top-20 left-1/2 z-40 hidden w-[220px] -translate-x-1/2 md:block', props.class)
      "
    >
      <LiquidGlass :radius="props.height / 2" :frost="0.16" :border="0.4" container-class="h-11">
        <Motion as="div" layout class="flex h-11 items-center gap-3 overflow-hidden px-4 text-foreground">
          <AnimatedCircularProgressBar
            :value="scrollPercentage * 100"
            :min="0"
            :max="100"
            :circle-stroke-width="10"
            class="!size-6 !text-[0px]"
            :show-percentage="false"
            :duration="0.3"
            :gauge-secondary-color="isDark ? '#6b728055' : '#6b728099'"
            :gauge-primary-color="isDark ? '#f9a8d4' : '#db2777'"
          />
          <span class="grow text-center text-sm font-semibold">{{ title }}</span>
          <NumberFlow
            :value="scrollPercentage"
            :format="{ style: 'percent' }"
            locales="en-US"
            class="text-xs text-muted-foreground"
          />
        </Motion>
      </LiquidGlass>
    </div>
  </MotionConfig>
</template>
