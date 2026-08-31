import { brandEditorial } from '~/data/editorial'
import type { GpuProfile } from '~/composables/useAppBoot'

function waitFrames(count = 2) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(() => step(left - 1))
    }
    requestAnimationFrame(() => step(count))
  })
}

function decodeImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      const decoded = img.decode?.()
      if (decoded) {
        void decoded.then(() => resolve()).catch(() => resolve())
        return
      }
      resolve()
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

export async function preloadFonts() {
  if (!document.fonts) return
  try {
    await Promise.all([
      document.fonts.load('600 48px Fraunces'),
      document.fonts.load('700 72px Fraunces'),
      document.fonts.load('500 16px Sora'),
      document.fonts.load('600 16px Sora'),
      document.fonts.load('400 14px "JetBrains Mono"'),
      document.fonts.ready,
    ])
  } catch {
    /* continue even if a face is missing */
  }
}

export async function warmupSilkShader(_profile: GpuProfile) {
  await Promise.all([import('~/components/ui/InspiraShaderToy'), import('~/lib/inspira/silk/shader')])
}

export async function warmupLightSpeed(_profile: GpuProfile) {
  const [{ SMAAEffect }] = await Promise.all([
    import('postprocessing'),
    import('three'),
    import('~/lib/inspira/light-speed/LightSpeedApp'),
  ])

  await Promise.all([decodeImage(SMAAEffect.searchImageDataURL), decodeImage(SMAAEffect.areaImageDataURL)])
}

export async function preloadImages() {
  const baseURL = useRuntimeConfig().app.baseURL
  const sources = [
    brandEditorial.src,
    '/editorial/sheer-descent.png',
    '/editorial/sheer-descent-abstract.png',
    '/favicon.png',
    '/favicon-light-32x32.png',
    '/apple-touch-icon.png',
    '/apple-touch-icon-light.png',
  ]

  await Promise.all(sources.map((src) => decodeImage(withAppBase(src, baseURL))))
}

export async function preloadPageModules() {
  await Promise.all([
    import('~/components/ui/SilkBackground.vue'),
    import('~/components/ui/particle-image/ParticleImage.vue'),
    import('~/components/ui/LightSpeed.vue'),
    import('~/components/ui/LiquidGlass.vue'),
    import('~/components/ui/SmoothCursor.vue'),
    import('motion-v'),
    import('ogl'),
  ])
}

export type PreloadBundle = {
  profile: GpuProfile
  fonts: Promise<void>
  silk: Promise<void>
  engine: Promise<void>
  assets: Promise<void>
  modules: Promise<void>
  all: Promise<void>
}

let bundle: PreloadBundle | null = null

export function startPreloadBundle(): PreloadBundle {
  if (bundle) return bundle

  const { gpuProfile } = useAppBoot()
  const profile = gpuProfile.value
  const fonts = preloadFonts().catch(() => {})
  const silk = warmupSilkShader(profile).catch(() => {})
  const engine = warmupLightSpeed(profile).catch(() => {})
  const assets = preloadImages().catch(() => {})
  const modules = preloadPageModules().catch(() => {})
  const all = Promise.all([fonts, silk, engine, assets, modules]).then(() => undefined)

  bundle = { profile, fonts, silk, engine, assets, modules, all }
  return bundle
}

export async function settleFirstPaint() {
  await waitFrames(2)
}
