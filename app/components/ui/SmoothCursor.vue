<script lang="ts" setup>
import type { Component } from 'vue'
import { useEventListener, useTimeout } from '@vueuse/core'
import { Motion, useSpring } from 'motion-v'
import DefaultCursor from './DefaultCursor.vue'

interface Position {
  x: number
  y: number
}
interface SmoothCursorProps {
  cursor?: Component
  springConfig?: {
    damping: number
    stiffness: number
    mass: number
    restDelta: number
  }
}

const props = withDefaults(defineProps<SmoothCursorProps>(), {
  cursor: () => DefaultCursor,
  springConfig: () => ({
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
  }),
})

const { ready } = useAppBoot()
const isFinePointer = ref(false)
const isMoving = ref(false)
const lastMousePos = { x: 0, y: 0 }
const velocity = { x: 0, y: 0 }
let lastUpdateTime = 0
let previousAngle = 0
let accumulatedRotation = 0
let pointerMql: MediaQueryList | undefined

const cursorX = useSpring(0, props.springConfig)
const cursorY = useSpring(0, props.springConfig)
const rotation = useSpring(0, {
  ...props.springConfig,
  damping: 60,
  stiffness: 300,
})
const scale = useSpring(1, {
  ...props.springConfig,
  stiffness: 500,
  damping: 35,
})

function updateVelocity(currentPos: Position) {
  const currentTime = performance.now()
  const deltaTime = currentTime - lastUpdateTime

  if (deltaTime > 0) {
    velocity.x = (currentPos.x - lastMousePos.x) / deltaTime
    velocity.y = (currentPos.y - lastMousePos.y) / deltaTime
  }

  lastUpdateTime = currentTime
  lastMousePos.x = currentPos.x
  lastMousePos.y = currentPos.y
}

function smoothMouseMove(e: MouseEvent) {
  const currentPos = { x: e.clientX, y: e.clientY }
  updateVelocity(currentPos)

  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)

  cursorX.set(currentPos.x)
  cursorY.set(currentPos.y)

  if (speed > 0.1) {
    const currentAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI) + 90

    let angleDiff = currentAngle - previousAngle
    if (angleDiff > 180) angleDiff -= 360
    if (angleDiff < -180) angleDiff += 360
    accumulatedRotation += angleDiff
    rotation.set(accumulatedRotation)
    previousAngle = currentAngle

    scale.set(0.95)
    isMoving.value = true

    useTimeout(150, {
      callback: () => {
        scale.set(1)
        isMoving.value = false
      },
    })
  }
}

let rafId: number

function throttledMouseMove(e: MouseEvent) {
  if (!isFinePointer.value || !ready.value) return
  if (rafId) return

  rafId = requestAnimationFrame(() => {
    smoothMouseMove(e)
    rafId = 0
  })
}

if (import.meta.client) {
  pointerMql = window.matchMedia('(hover: hover) and (pointer: fine)')
  isFinePointer.value = pointerMql.matches
  pointerMql.addEventListener('change', (event) => {
    isFinePointer.value = event.matches
  })
}

if (ready.value && isFinePointer.value) {
  document.documentElement.classList.add('hide-native-cursor')
}
useEventListener(window, 'mousemove', throttledMouseMove, { passive: true })

watch([ready, isFinePointer], ([bootReady, fine]) => {
  if (bootReady && fine) document.documentElement.classList.add('hide-native-cursor')
  else document.documentElement.classList.remove('hide-native-cursor')
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  document.documentElement.classList.remove('hide-native-cursor')
})
</script>

<template>
  <!-- Teleport 到 body，避免被 app-shell / modal overlay 的 stacking context 盖住 -->
  <Teleport to="body">
    <Motion
      v-if="ready && isFinePointer"
      as="div"
      :style="{
        position: 'fixed',
        left: cursorX,
        top: cursorY,
        translateX: '-50%',
        translateY: '-50%',
        rotate: rotation,
        scale,
        zIndex: 10060,
        pointerEvents: 'none',
        willChange: 'transform',
      }"
      :initial="{ scale: 0 }"
      :animate="{ scale: 1 }"
      :transition="{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }"
    >
      <component :is="props.cursor" />
    </Motion>
  </Teleport>
</template>
<style scoped></style>
