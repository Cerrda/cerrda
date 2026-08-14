<template>
  <BlurReveal
    class="hero-particle-wrap relative mx-auto w-full max-w-[22rem] lg:ml-auto lg:mr-0 lg:max-w-[26rem]"
    :delay="0.18"
    :duration="1.1"
    :y-offset="24"
  >
    <div class="hero-particle-field relative aspect-[3/4] w-full">
      <ClientOnly>
        <ParticleImage
          image-src="/hero/shoreline.png"
          alt="海边远眺"
          class="absolute inset-0"
          image-fit="cover"
          particle-gap="3"
          particle-size="2"
          gravity="0.08"
          mouse-force="36"
          init-position="misplaced"
          init-direction="none"
          :noise="2"
          :cover-focus-x="0.5"
          :cover-focus-y="0.55"
          :density-focus-x="0.52"
          :density-focus-y="0.5"
          :density-power="1.05"
          :density-edge-keep="0.58"
          :density-luma-weight="0.04"
          :density-top-boost="0"
          :density-bottom-taper="0"
          :accent-chance="0.4"
          :accent-palette="['#e8c4d4', '#f0d8e4', '#ddb4c8']"
        />
        <template #fallback>
          <img
            src="/hero/shoreline.png"
            alt="海边远眺"
            class="absolute inset-0 size-full object-cover object-[center_55%]"
          />
        </template>
      </ClientOnly>
    </div>
  </BlurReveal>
</template>
