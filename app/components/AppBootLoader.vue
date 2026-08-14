<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { MultiStepLoaderStep } from '~/components/ui/MultiStepLoader.vue'
import {
  prefersReducedMotion,
  useAppBoot,
  waitForFlag,
  waitForSilkCompiled,
  writeBootSession,
} from '~/composables/useAppBoot'
import { settleFirstPaint, startPreloadBundle, type PreloadBundle } from '~/lib/boot/preload'

const route = useRoute()
const { ready, lightSpeedCompiled, particlesReady } = useAppBoot()

const spaAlreadyShown =
  import.meta.client && Boolean((window as Window & { __cerrdaBootShown?: boolean }).__cerrdaBootShown)
const isHome = () => route.path === '/'

let finishing = false
let bundle: PreloadBundle | null = null

function stepDuration() {
  return prefersReducedMotion() ? 120 : 420
}

function markDocumentBooted() {
  if (!import.meta.client) return
  document.documentElement.classList.add('booted')
  document.documentElement.classList.remove('booting')
}

async function finishBoot() {
  if (finishing) {
    markDocumentBooted()
    loading.value = false
    return
  }
  finishing = true
  await settleFirstPaint()
  ready.value = true
  if (import.meta.client) {
    ;(window as Window & { __cerrdaBootShown?: boolean }).__cerrdaBootShown = true
    writeBootSession()
  }
  await nextTick()
  await settleFirstPaint()
  markDocumentBooted()
  loading.value = false
}

function makeSteps(activeBundle: PreloadBundle): MultiStepLoaderStep[] {
  const duration = stepDuration()
  return [
    {
      text: '载入字体与视觉系统',
      duration,
      action: () => activeBundle.fonts,
    },
    {
      text: '预热 GPU 与丝绸着色器',
      duration,
      action: async () => {
        await activeBundle.silk
        await waitForSilkCompiled()
      },
    },
    {
      text: '编译三维光轨引擎',
      duration,
      action: async () => {
        await activeBundle.engine
        if (isHome()) await waitForFlag(lightSpeedCompiled, 8000)
      },
    },
    {
      text: '缓存图像与粒子层',
      duration,
      action: async () => {
        await Promise.all([activeBundle.assets, activeBundle.modules])
        if (isHome()) await waitForFlag(particlesReady, 8000)
      },
    },
    {
      text: '同步交互层',
      duration,
      action: async () => {
        await activeBundle.all
        await settleFirstPaint()
      },
    },
  ]
}

const placeholderSteps: MultiStepLoaderStep[] = [
  { text: '载入字体与视觉系统', duration: 420 },
  { text: '预热 GPU 与丝绸着色器', duration: 420 },
  { text: '编译三维光轨引擎', duration: 420 },
  { text: '缓存图像与粒子层', duration: 420 },
  { text: '同步交互层', duration: 420 },
]

const steps = ref<MultiStepLoaderStep[]>(spaAlreadyShown ? [] : placeholderSteps)
const loading = ref(!spaAlreadyShown)

if (spaAlreadyShown) {
  ready.value = true
  markDocumentBooted()
} else if (import.meta.client) {
  bundle = startPreloadBundle()
  steps.value = makeSteps(bundle)
}

onMounted(() => {
  if (spaAlreadyShown) return
  window.setTimeout(() => {
    if (!ready.value) void finishBoot()
  }, 16000)
})
</script>

<template>
  <MultiStepLoader :loading="loading" :steps="steps" prevent-close @complete="finishBoot" />
</template>
