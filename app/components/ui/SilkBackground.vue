<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { silkShaderCode } from '~/lib/inspira/silk/shader'
import { cn } from '~/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  hue?: number
  saturation?: number
  brightness?: number
  speed?: number
}

const props = withDefaults(defineProps<Props>(), {
  hue: 300,
  saturation: 0.5,
  brightness: 1,
  speed: 1,
})

const { gpuProfile, silkCompiled } = useAppBoot()

function onShaderReady() {
  silkCompiled.value = true
}
</script>

<template>
  <div :class="cn('pointer-events-none fixed inset-0 z-0', props.class)">
    <ShaderToy
      :shader-code="silkShaderCode"
      :hue="props.hue"
      :saturation="props.saturation"
      :brightness="props.brightness"
      :speed="props.speed"
      mouse-mode="hover"
      :pixel-ratio="gpuProfile.silkPixelRatio"
      :frame-rate="60"
      :auto-pause="false"
      :interactive="false"
      @ready="onShaderReady"
    />
  </div>
</template>
