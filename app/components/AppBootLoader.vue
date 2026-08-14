<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { MultiStepLoaderStep } from '~/components/ui/MultiStepLoader.vue'
import { prefersReducedMotion, useAppBoot, waitForSilkCompiled } from '~/composables/useAppBoot'
import { settleFirstPaint, startPreloadBundle, type PreloadBundle } from '~/lib/boot/preload'

const { ready } = useAppBoot()

const alreadyShown = import.meta.client && Boolean((window as Window & { __cerrdaBootShown?: boolean }).__cerrdaBootShown)
let finishing = false
let bundle: PreloadBundle | null = null

function stepDuration() {
  return prefersReducedMotion() ? 160 : 520
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
  }
  await nextTick()
  await settleFirstPaint()
  markDocumentBooted()
  loading.value = false
}

function makeSteps(activeBundle: PreloadBundle | null): MultiStepLoaderStep[] {
  const duration = stepDuration()
  return [
    {
      text: '载入字体与视觉系统',
      duration,
      action: activeBundle ? () => activeBundle.fonts : undefined,
    },
    {
      text: '预热 GPU 与丝绸着色器',
      duration,
      action: activeBundle
        ? async () => {
            await activeBundle.silk
            await waitForSilkCompiled()
            await settleFirstPaint()
          }
        : undefined,
    },
    {
      text: '编译三维光轨引擎',
      duration,
      action: activeBundle ? () => activeBundle.engine : undefined,
    },
    {
      text: '缓存图像与关键模块',
      duration,
      action: activeBundle
        ? async () => {
            await Promise.all([activeBundle.assets, activeBundle.modules])
          }
        : undefined,
    },
    {
      text: '同步交互层',
      duration: prefersReducedMotion() ? 120 : 400,
      action: activeBundle ? () => activeBundle.all.then(() => settleFirstPaint()) : undefined,
    },
  ]
}

const steps = ref<MultiStepLoaderStep[]>(alreadyShown ? [] : makeSteps(null))
const loading = ref(!alreadyShown)

if (import.meta.client && !alreadyShown) {
  bundle = startPreloadBundle()
  steps.value = makeSteps(bundle)
}

if (alreadyShown) {
  ready.value = true
  markDocumentBooted()
}

onMounted(() => {
  if (alreadyShown) return
  window.setTimeout(() => {
    if (!ready.value) void finishBoot()
  }, 12000)
})
</script>

<template>
  <MultiStepLoader :loading="loading" :steps="steps" prevent-close @complete="finishBoot" />
</template>
