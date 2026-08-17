<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, useSlots } from 'vue'
import { cn } from '~/lib/utils'

interface Props {
  radius?: number
  class?: HTMLAttributes['class']
  containerClass?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  radius: 28,
})

const slots = useSlots()
const hasMedia = computed(() => Boolean(slots.media))

const rootStyle = computed(() => ({
  '--lg-r': `${props.radius}px`,
}))
</script>

<template>
  <div :style="rootStyle" :class="cn('css-liquid-glass', hasMedia && 'css-liquid-glass--media', props.containerClass)">
    <div v-if="hasMedia" class="css-liquid-glass__media">
      <slot name="media" />
    </div>
    <div class="css-liquid-glass__frost" aria-hidden="true" />
    <div class="css-liquid-glass__chrome" aria-hidden="true">
      <div class="css-liquid-glass__rim" />
    </div>
    <div :class="cn('css-liquid-glass__slot', props.class)">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* 原子软糖At 纯 CSS 液态玻璃（Gitee greyd097/yzrt）的卡片适配。
   frost 只做 backdrop-filter；chrome 承担 contrast / 高光 / 内折射，避免 filter 祖先打断磨砂。 */
.css-liquid-glass {
  --lg-tr: 30%;
  --lg-tint: color-mix(in oklch, var(--card) 58%, transparent);
  --lg-border: rgb(255 255 255 / 0.08);
  --lg-highlight: rgb(255 255 255 / 0.14);
  --lg-highlight-soft: rgb(255 255 255 / 0.05);
  --lg-inset-dark: rgb(0 0 0 / 0.42);
  --lg-inner-edge: rgb(0 0 0 / 0.48);
  --lg-specular: rgb(255 255 255 / 0.07);
  --lg-rim: rgb(255 255 255 / 0.08);
  --lg-brightness: 0.84;
  --lg-contrast: 1.06;
  --lg-blur: 4px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--lg-r);
  box-shadow: 0 4px 8px var(--shadow-bloom);
}

html.light .css-liquid-glass {
  --lg-tr: 26%;
  --lg-tint: color-mix(in oklch, var(--card) 42%, transparent);
  --lg-border: rgb(51 51 51 / 0.08);
  --lg-highlight: rgb(255 255 255 / 0.42);
  --lg-highlight-soft: rgb(255 255 255 / 0.18);
  --lg-inset-dark: rgb(0 0 0 / 0.28);
  --lg-inner-edge: rgb(0 0 0 / 0.32);
  --lg-specular: rgb(255 255 255 / 0.22);
  --lg-rim: rgb(255 255 255 / 0.12);
  --lg-brightness: 0.94;
  --lg-contrast: 1.12;
  --lg-blur: 2px;
}

.css-liquid-glass__media {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
}

/* 媒体卡与 packages 共用同一套 frost/chrome；只关掉会让 WebGL 合成出黑幕的属性。 */
.css-liquid-glass--media {
  isolation: auto;
}

.css-liquid-glass--media .css-liquid-glass__frost {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.css-liquid-glass--media .css-liquid-glass__chrome,
.css-liquid-glass--media .css-liquid-glass__chrome::before,
.css-liquid-glass--media .css-liquid-glass__chrome::after,
.css-liquid-glass--media .css-liquid-glass__rim {
  filter: none;
}

/* 媒体卡关掉未 blur 的黑色内圈，否则会露出硬黑边 */
.css-liquid-glass--media {
  --lg-inset-dark: transparent;
  --lg-inner-edge: transparent;
}

.css-liquid-glass--media .css-liquid-glass__chrome::before {
  content: none;
}

.css-liquid-glass__frost,
.css-liquid-glass__chrome {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
}

.css-liquid-glass__frost {
  background: var(--lg-tint);
  backdrop-filter: blur(var(--lg-blur));
  -webkit-backdrop-filter: blur(var(--lg-blur));
}

.css-liquid-glass__chrome {
  overflow: hidden;
  border: 1px double var(--lg-border);
  filter: brightness(var(--lg-brightness)) contrast(var(--lg-contrast));
  box-shadow:
    inset 2px -2px 1px -1px var(--lg-highlight),
    inset -2px 2px 1px -1px var(--lg-highlight),
    inset 6px -6px 1px -6px var(--lg-highlight-soft),
    inset -6px 6px 1px -6px var(--lg-highlight-soft),
    inset 0 0 2px var(--lg-inset-dark);
}

.css-liquid-glass__chrome::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: 35%;
  left: 50%;
  width: calc(100% - 16px);
  height: calc(100% - 16px);
  transform: translateX(-50%);
  border: 1px solid var(--lg-inner-edge);
  border-radius: inherit;
  filter: blur(8px);
}

.css-liquid-glass__chrome::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  filter: blur(3px);
  background: linear-gradient(
    45deg,
    var(--lg-specular) 0%,
    transparent var(--lg-tr),
    transparent calc(100% - var(--lg-tr)),
    var(--lg-specular) 100%
  );
}

.css-liquid-glass__rim {
  position: absolute;
  inset: 4.5px;
  z-index: 3;
  border: 1px solid var(--lg-rim);
  border-radius: inherit;
  filter: blur(1px);
}

.css-liquid-glass__slot {
  position: relative;
  z-index: 2;
  overflow: hidden;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  clip-path: inset(0 round var(--lg-r));
}

.css-liquid-glass--media .css-liquid-glass__slot {
  position: absolute;
  inset: 0;
  overflow: visible;
  height: auto;
  clip-path: none;
}

@media (prefers-reduced-transparency: reduce) {
  .css-liquid-glass__frost {
    background: var(--card);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .css-liquid-glass__chrome {
    filter: none;
  }
}
</style>
