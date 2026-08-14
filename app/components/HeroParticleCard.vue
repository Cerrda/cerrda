<template>
  <BlurReveal
    class="hero-particle-wrap relative mx-auto flex w-full justify-center lg:ml-auto lg:mr-0 lg:w-auto lg:justify-end lg:self-center"
    :delay="0.18"
    :duration="1.1"
    :y-offset="24"
  >
    <div class="hero-particle-field relative aspect-[431/425] h-[20rem] w-auto sm:h-[24rem] lg:h-[28rem]">
      <ClientOnly>
        <ParticleImage
          v-if="!reduceMotion"
          :image-src="brandEditorial.src"
          :alt="brandEditorial.title"
          class="absolute inset-0"
          image-fit="contain"
          particle-gap="5"
          particle-size="2.5"
          gravity="0.06"
          mouse-force="32"
          init-position="misplaced"
          init-direction="none"
          :noise="1.5"
          :density-focus-x="0.5"
          :density-focus-y="0.48"
          :density-power="0"
          :density-edge-keep="1"
          :density-luma-weight="0"
          :density-top-boost="0"
          :density-bottom-taper="0"
          :accent-chance="0.18"
          :accent-palette="['#e8c4d4', '#f0d8e4', '#edd8c8']"
          :accent-palette-light="['#b44868', '#c45d78', '#a83d5c']"
        />
        <img
          v-else
          :src="brandEditorial.src"
          :alt="brandEditorial.title"
          class="absolute inset-0 size-full object-contain"
        />
        <template #fallback>
          <img
            :src="brandEditorial.src"
            :alt="brandEditorial.title"
            class="absolute inset-0 size-full object-contain"
          />
        </template>
      </ClientOnly>
    </div>
  </BlurReveal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { brandEditorial } from '~/data/editorial'
import { prefersReducedMotion, useAppBoot } from '~/composables/useAppBoot'
import ParticleImage from '~/components/ui/particle-image/ParticleImage.vue'

const { particlesReady } = useAppBoot()
const reduceMotion = ref(import.meta.client && prefersReducedMotion())

if (reduceMotion.value) {
  particlesReady.value = true
}
</script>
