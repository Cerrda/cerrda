<script setup lang="ts">
const fps = ref(0)

const toneClass = computed(() => {
  if (fps.value >= 55) return 'text-emerald-400'
  if (fps.value >= 30) return 'text-amber-400'
  return 'text-red-400'
})

let raf = 0
let frames = 0
let last = 0

function tick(now: number) {
  if (!last) last = now
  frames += 1
  const elapsed = now - last
  if (elapsed >= 500) {
    fps.value = Math.round((frames * 1000) / elapsed)
    frames = 0
    last = now
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  raf = requestAnimationFrame(tick)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    class="pointer-events-none fixed left-3 top-3 z-[80] rounded-md border border-border/50 bg-background/70 px-2 py-1 font-mono text-[11px] leading-none tabular-nums backdrop-blur-sm"
    aria-hidden="true"
  >
    <span :class="toneClass">{{ fps }}</span>
    <span class="ml-1 text-muted-foreground">FPS</span>
  </div>
</template>
