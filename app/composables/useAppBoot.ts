import { watch } from 'vue'

export type GpuProfile = {
  /** Internal silk render scale. CSS still fills the viewport. */
  silkPixelRatio: number
  lightSpeedPixelRatio: number
}

export const defaultGpuProfile: GpuProfile = {
  silkPixelRatio: 0.75,
  lightSpeedPixelRatio: 1.25,
}

/**
 * Document-lifetime boot gate. False until the Multi Step Loader finishes
 * preloading fonts, shaders, and engine chunks. Survives SPA navigation.
 */
export function useAppBoot() {
  const ready = useState('app-boot-ready', () => false)
  const gpuProfile = useState<GpuProfile>('app-gpu-profile', () => ({ ...defaultGpuProfile }))
  const silkCompiled = useState('app-silk-compiled', () => false)

  return { ready, gpuProfile, silkCompiled }
}

/** Wait until the live silk WebGL program has compiled, so the loader covers real GPU work. */
export function waitForSilkCompiled(timeoutMs = 5000) {
  const { silkCompiled } = useAppBoot()
  if (silkCompiled.value) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      stop()
      clearTimeout(timer)
      resolve()
    }
    const stop = watch(silkCompiled, (value) => {
      if (value) finish()
    })
    const timer = setTimeout(finish, timeoutMs)
  })
}

export function detectGpuProfile(): GpuProfile {
  if (!import.meta.client) return { ...defaultGpuProfile }

  const dpr = window.devicePixelRatio || 1
  const cores = navigator.hardwareConcurrency || 4
  let renderer = ''

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance' })
    const info = gl?.getExtension('WEBGL_debug_renderer_info')
    if (gl && info) {
      renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || '')
    }
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    canvas.remove()
  } catch {
    /* ignore */
  }

  const integrated = /intel|uhd|iris|hd graphics|adreno [1-6]|mali|swiftshader|llvmpipe/i.test(renderer)
  const constrained = integrated || cores <= 4 || dpr >= 3

  if (constrained) {
    return {
      silkPixelRatio: 0.55,
      lightSpeedPixelRatio: 1,
    }
  }

  return {
    silkPixelRatio: 0.75,
    lightSpeedPixelRatio: Math.min(1.25, dpr),
  }
}

export function prefersReducedMotion() {
  if (!import.meta.client) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
