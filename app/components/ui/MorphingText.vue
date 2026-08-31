<script lang="ts" setup>
import { cn } from '~/lib/utils'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  morphTime: 1.5,
  coolDownTime: 0.5,
})

const TEXT_CLASSES = 'absolute inset-x-0 top-0 m-auto inline-block w-full'

interface Props {
  class?: string
  texts: string[]
  morphTime?: number
  coolDownTime?: number
}
const textIndex = ref(0)
const morph = ref(0)
const coolDown = ref(0)
let lastTimeMs = 0
let cooldownStyled = false

const text1Ref = ref<HTMLSpanElement>()
const text2Ref = ref<HTMLSpanElement>()

function setStyles(fraction: number) {
  if (!text1Ref.value || !text2Ref.value) return

  text2Ref.value.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`
  text2Ref.value.style.opacity = `${fraction ** 0.4 * 100}%`

  const invertedFraction = 1 - fraction
  text1Ref.value.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`
  text1Ref.value.style.opacity = `${invertedFraction ** 0.4 * 100}%`

  text1Ref.value.textContent = props.texts[textIndex.value % props.texts.length]
  text2Ref.value.textContent = props.texts[(textIndex.value + 1) % props.texts.length]
}

function doMorph() {
  cooldownStyled = false
  morph.value -= coolDown.value
  coolDown.value = 0

  let fraction = morph.value / props.morphTime

  if (fraction > 1) {
    coolDown.value = props.coolDownTime
    fraction = 1
  }

  setStyles(fraction)

  if (fraction === 1) {
    textIndex.value++
  }
}

function doCoolDown() {
  morph.value = 0
  if (cooldownStyled) return
  cooldownStyled = true

  if (text1Ref.value && text2Ref.value) {
    text2Ref.value.style.filter = 'none'
    text2Ref.value.style.opacity = '100%'
    text1Ref.value.style.filter = 'none'
    text1Ref.value.style.opacity = '0%'
  }
}

function seedInitialText() {
  if (!text1Ref.value || !text2Ref.value) return
  text1Ref.value.textContent = props.texts[0] ?? ''
  text2Ref.value.textContent = props.texts[1] ?? props.texts[0] ?? ''
  text1Ref.value.style.filter = 'none'
  text1Ref.value.style.opacity = '100%'
  text2Ref.value.style.filter = 'none'
  text2Ref.value.style.opacity = '0%'
}

const { ready } = useAppBoot()
let animationFrameId: number = 0
let started = false
let inView = true
let pageVisible = true
let viewObserver: IntersectionObserver | undefined
const rootRef = useTemplateRef<HTMLElement>('rootRef')

function animate(now: number) {
  animationFrameId = 0
  if (!started) return

  if (!lastTimeMs) lastTimeMs = now
  const dt = Math.min(0.05, (now - lastTimeMs) / 1000)
  lastTimeMs = now

  coolDown.value -= dt

  if (coolDown.value <= 0) {
    doMorph()
  } else {
    doCoolDown()
  }

  if (inView && pageVisible) {
    animationFrameId = requestAnimationFrame(animate)
  }
}

function stopLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }
}

function syncLoop() {
  pageVisible = document.visibilityState === 'visible'
  if (started && inView && pageVisible) {
    if (!animationFrameId) {
      lastTimeMs = 0
      animationFrameId = requestAnimationFrame(animate)
    }
    return
  }
  stopLoop()
}

function start() {
  if (started) return
  started = true
  seedInitialText()
  lastTimeMs = 0
  syncLoop()
}

onMounted(() => {
  seedInitialText()

  if (rootRef.value) {
    viewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true
        syncLoop()
      },
      { rootMargin: '80px' },
    )
    viewObserver.observe(rootRef.value)
  }

  document.addEventListener('visibilitychange', syncLoop)

  if (ready.value) {
    start()
    return
  }

  const stop = watch(ready, (value) => {
    if (!value) return
    start()
    stop()
  })
})

onUnmounted(() => {
  started = false
  stopLoop()
  viewObserver?.disconnect()
  document.removeEventListener('visibilitychange', syncLoop)
})
</script>

<template>
  <div
    ref="rootRef"
    :class="
      cn(
        `relative mx-auto h-16 w-full max-w-(--breakpoint-md) overflow-hidden text-center font-sans text-[40pt] leading-none font-bold filter-[url(#threshold)_blur(0.6px)] md:h-24 lg:text-[6rem]`,
        props.class,
      )
    "
  >
    <span ref="text1Ref" :class="[TEXT_CLASSES]" />
    <span ref="text2Ref" :class="[TEXT_CLASSES]" />

    <svg id="filters" class="fixed size-0" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="threshold">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  </div>
</template>
