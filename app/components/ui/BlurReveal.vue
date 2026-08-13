<script setup lang="ts">
import { Motion } from "motion-v";

interface Props {
  duration?: number;
  delay?: number;
  blur?: string;
  yOffset?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 0.8,
  delay: 0.05,
  blur: "12px",
  yOffset: 18,
});
</script>

<template>
  <Motion
    as="div"
    :class="props.class"
    :initial="{
      opacity: 0,
      filter: `blur(${props.blur})`,
      y: props.yOffset,
    }"
    :animate="{
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
    }"
    :transition="{
      duration: props.duration,
      delay: props.delay,
      ease: [0.32, 0.72, 0, 1],
    }"
  >
    <slot />
  </Motion>
</template>
