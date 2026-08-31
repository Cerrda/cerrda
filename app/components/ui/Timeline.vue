<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { Motion, useScroll, useTransform } from 'motion-v'

interface Props {
  containerClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
  items?: {
    id: string
    label: string
  }[]
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const timelineContainerRef = ref<HTMLElement | null>(null)
const timelineRef = ref<HTMLElement | null>(null)
const height = ref(0)

onMounted(async () => {
  await nextTick()
  if (timelineRef.value) {
    const rect = timelineRef.value.getBoundingClientRect()
    height.value = rect.height
  }
})

const { scrollYProgress } = useScroll({
  target: timelineContainerRef,
  offset: ['start end', 'end 40%'],
})

const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])
const heightTransform = ref(useTransform(scrollYProgress, [0, 1], [0, 0]))

watch(height, (newHeight) => {
  heightTransform.value = useTransform(scrollYProgress, [0, 1], [0, newHeight])
})
</script>

<template>
  <div ref="timelineContainerRef" class="w-full bg-transparent font-sans md:px-10">
    <div class="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-10">
      <h2 class="mb-4 max-w-4xl font-display text-lg text-foreground md:text-4xl">
        {{ title }}
      </h2>
      <p class="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
        {{ description }}
      </p>
    </div>

    <div ref="timelineRef" class="relative z-0 mx-auto max-w-7xl pb-20">
      <div
        v-for="(item, index) in props.items"
        :key="item.id + index"
        class="flex justify-start pt-10 md:gap-10 md:pt-40"
      >
        <div
          class="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm"
        >
          <div
            class="absolute left-3 flex size-10 items-center justify-center rounded-full bg-card md:left-3 dark:bg-background"
          >
            <div class="size-4 rounded-full border border-border bg-secondary p-2 dark:border-border dark:bg-muted" />
          </div>
          <h3 class="hidden text-xl font-bold text-muted-foreground md:block md:pl-20 md:text-5xl">
            {{ item.label }}
          </h3>
        </div>
        <slot :name="item.id" />
      </div>
      <div
        :style="{
          height: `${height}px`,
        }"
        class="absolute top-0 left-8 w-[2px] overflow-hidden bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-0% via-border to-transparent to-99% mask-[linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
      >
        <Motion
          as="div"
          :style="{
            height: heightTransform,
            opacity: opacityTransform,
          }"
          class="absolute inset-x-0 top-0 w-[2px] rounded-full bg-linear-to-t from-pink-500 from-0% via-rose-400 via-10% to-transparent"
        />
      </div>
    </div>
  </div>
</template>
