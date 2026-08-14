<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import Ripple from '~/components/ui/Ripple.vue'
import { cn } from '~/lib/utils'

const RIPPLE_CIRCLES = 12
const { width, height } = useWindowSize({ initialWidth: 1920, initialHeight: 1080 })
const rippleLayout = computed(() => {
  const w = Number.isFinite(width.value) && width.value > 0 ? width.value : 1920
  const h = Number.isFinite(height.value) && height.value > 0 ? height.value : 1080
  const inner = Math.min(w, h) * 0.28
  const outer = Math.hypot(w, h) * 1.12
  const space = (outer - inner) / (RIPPLE_CIRCLES - 1)
  return {
    base: inner - space,
    space,
    opacityStep: (0.24 - 0.025) / RIPPLE_CIRCLES,
  }
})

export interface MultiStepLoaderStep {
  text: string
  afterText?: string
  async?: boolean
  duration?: number
  action?: () => void | Promise<void>
}

const props = withDefaults(
  defineProps<{
    steps: MultiStepLoaderStep[]
    loading?: boolean
    defaultDuration?: number
    preventClose?: boolean
  }>(),
  {
    loading: false,
    defaultDuration: 1500,
    preventClose: false,
  },
)

const emit = defineEmits<{
  'state-change': [number]
  'complete': []
  'close': []
}>()

const currentState = ref(0)
const isLastStepComplete = ref(false)
const ranAction = new Set<number>()
let currentTimer: ReturnType<typeof setTimeout> | null = null
let runId = 0

async function executeStepAction(index: number) {
  if (ranAction.has(index)) return
  ranAction.add(index)
  const step = props.steps[index]
  try {
    if (typeof step?.action === 'function') {
      await step.action()
    }
  } catch {
    /* 预加载失败也不要卡住开机流程 */
  }
}

async function advance() {
  if (!props.loading) return
  if (currentState.value < props.steps.length - 1) {
    currentState.value++
    emit('state-change', currentState.value)
    await processCurrentStep()
  } else {
    isLastStepComplete.value = true
    await new Promise<void>((resolve) => {
      currentTimer = setTimeout(resolve, 520)
    })
    if (!props.loading) return
    emit('complete')
  }
}

async function processCurrentStep() {
  if (!props.loading) return
  const id = ++runId
  if (currentTimer) {
    clearTimeout(currentTimer)
    currentTimer = null
  }

  const index = currentState.value
  const currentStep = props.steps[index]
  if (!currentStep) return

  const duration = currentStep.duration ?? props.defaultDuration
  const work = executeStepAction(index)

  if (currentStep.async) {
    await work
    return
  }

  if (duration > 0) {
    const minTime = new Promise<void>((resolve) => {
      currentTimer = setTimeout(resolve, duration)
    })
    await Promise.all([minTime, work])
  } else {
    await work
  }

  if (id !== runId) return
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await advance()
}

function close() {
  emit('close')
}

watch(
  () => props.steps[currentState.value]?.async,
  (isAsync, oldIsAsync) => {
    if (isAsync === false && oldIsAsync === true) {
      const currentStep = props.steps[currentState.value]
      if (!currentStep) return
      const duration = currentStep.duration ?? props.defaultDuration
      currentTimer = setTimeout(() => {
        void advance()
      }, duration)
    }
  },
)

watch(
  () => props.loading,
  (newLoading) => {
    if (newLoading) {
      currentState.value = 0
      isLastStepComplete.value = false
      ranAction.clear()
      if (import.meta.client) {
        void processCurrentStep()
      }
    } else if (currentTimer) {
      clearTimeout(currentTimer)
      currentTimer = null
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (currentTimer) clearTimeout(currentTimer)
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-500"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="loading && steps.length > 0"
      class="fixed inset-0 z-[200] flex size-full items-center justify-center overflow-hidden bg-background"
      style="background-color: var(--background, #1a1520)"
      data-theme-burn="loader"
    >
      <Ripple
        :base-circle-size="rippleLayout.base"
        :base-circle-opacity="0.24"
        :circle-opacity-downgrade-ratio="rippleLayout.opacityStep"
        :space-between-circle="rippleLayout.space"
        :number-of-circles="RIPPLE_CIRCLES"
        :wave-speed="90"
      />

      <button
        v-show="!preventClose"
        type="button"
        class="absolute top-4 right-4 z-[101] inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-primary-foreground transition-colors hover:bg-primary/90"
        @click="close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="relative z-10 h-96">
        <div class="relative mx-auto mt-40 flex max-w-xl flex-col justify-start">
          <div v-for="(step, index) in steps" :key="index">
            <div
              v-if="step"
              class="mb-4 flex items-center gap-2 text-left transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              :style="{
                opacity: index === currentState ? 1 : Math.max(1 - Math.abs(index - currentState) * 0.2, 0),
                transform: `translateY(${-(currentState * 40)}px)`,
              }"
            >
              <svg
                v-if="
                  index < currentState || (index === steps.length - 1 && index === currentState && isLastStepComplete)
                "
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-6 shrink-0 text-primary"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else-if="index === currentState && (!isLastStepComplete || index !== steps.length - 1)"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-6 shrink-0 animate-spin text-primary"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
                  clip-rule="evenodd"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6 shrink-0 text-foreground/50"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>

              <span :class="cn('text-lg text-foreground', index > currentState && 'opacity-50')">
                {{ step.text }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
