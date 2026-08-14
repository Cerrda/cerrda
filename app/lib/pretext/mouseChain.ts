import type { CircleExclusion } from './types'

export type ChainSegment = {
  x: number
  y: number
  angle: number
  radius: number
  targetRadius: number
}

export type InkParticle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  frame: number
}

export type MouseChain = {
  segments: ChainSegment[]
  ink: InkParticle[]
  lastStepTime: number
  inkLastStep: number
  scale: number
}

export const CHAIN_COUNT = 16
export const CHAIN_SPACING = 18
export const HEAD_RADIUS = 34
export const TAIL_RADIUS = 9
export const STEP_INTERVAL = 16
export const INK_STEP_INTERVAL = 32
export const IDLE_TIMEOUT = 720
export const MAX_BEND = 0.3
export const EXCLUSION_PAD = 10

function segmentRadius(index: number, scale: number) {
  const t = index / Math.max(1, CHAIN_COUNT - 1)
  const eased = t * t
  return (HEAD_RADIUS + (TAIL_RADIUS - HEAD_RADIUS) * eased) * scale
}

export function createMouseChain(x: number, y: number, scale = 1): MouseChain {
  const segments: ChainSegment[] = []
  for (let i = 0; i < CHAIN_COUNT; i++) {
    const radius = segmentRadius(i, scale)
    segments.push({
      x,
      y: y + i * CHAIN_SPACING * scale,
      angle: -Math.PI / 2,
      radius: 0,
      targetRadius: radius,
    })
  }
  return {
    segments,
    ink: [],
    lastStepTime: 0,
    inkLastStep: 0,
    scale,
  }
}

export function resizeMouseChain(chain: MouseChain, scale: number) {
  chain.scale = scale
  for (let i = 0; i < chain.segments.length; i++) {
    chain.segments[i]!.targetRadius = segmentRadius(i, scale)
  }
}

export function updateMouseChain(
  chain: MouseChain,
  time: number,
  mouseX: number,
  mouseY: number,
  idle: boolean,
  inside: boolean,
): boolean {
  if (time - chain.lastStepTime < STEP_INTERVAL) return false
  chain.lastStepTime = time

  const segs = chain.segments
  const head = segs[0]
  if (!head) return false

  const radiusLerp = idle || !inside ? 0.18 : 0.28
  for (const seg of segs) {
    const target = idle || !inside ? 0 : seg.targetRadius
    seg.radius += (target - seg.radius) * radiusLerp
    if (seg.radius < 0.4) seg.radius = 0
  }

  if (!inside && chain.ink.length === 0) {
    for (const seg of segs) {
      seg.x += (mouseX - seg.x) * 0.12
      seg.y += (mouseY - seg.y) * 0.12
    }
    return true
  }

  const dx = mouseX - head.x
  const dy = mouseY - head.y
  const dist = Math.hypot(dx, dy)
  if (dist > 1.2) {
    const speed = idle ? Math.min(dist, 10) : Math.min(dist, Math.max(10, dist * 0.42))
    head.x += (dx / dist) * speed
    head.y += (dy / dist) * speed
    head.angle = Math.atan2(dy, dx)
  } else {
    head.x = mouseX
    head.y = mouseY
  }

  const spacing = CHAIN_SPACING * chain.scale
  for (let i = 1; i < segs.length; i++) {
    const prev = segs[i - 1]!
    const seg = segs[i]!
    let angle = Math.atan2(prev.y - seg.y, prev.x - seg.x)
    let diff = angle - prev.angle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    if (diff > MAX_BEND) angle = prev.angle + MAX_BEND
    else if (diff < -MAX_BEND) angle = prev.angle - MAX_BEND
    seg.angle = angle
    seg.x = prev.x - Math.cos(seg.angle) * spacing
    seg.y = prev.y - Math.sin(seg.angle) * spacing
  }

  return true
}

export function spawnInk(chain: MouseChain, x: number, y: number, angle: number) {
  const scale = chain.scale
  const count = 7 + Math.floor(Math.random() * 5)
  for (let i = 0; i < count; i++) {
    const spread = (Math.random() - 0.5) * 1.15
    const speed = (18 + Math.random() * 22) * scale
    const dir = angle + spread
    chain.ink.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      size: (10 + Math.random() * 14) * scale,
      life: 1,
      maxLife: 14 + Math.floor(Math.random() * 8),
      frame: 0,
    })
  }
}

export function updateInk(chain: MouseChain, time: number) {
  if (time - chain.inkLastStep < INK_STEP_INTERVAL) return
  chain.inkLastStep = time
  for (let i = chain.ink.length - 1; i >= 0; i--) {
    const particle = chain.ink[i]!
    particle.frame++
    particle.life = 1 - particle.frame / particle.maxLife
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vx *= 0.9
    particle.vy *= 0.9
    if (particle.life < 0.3) particle.size *= 0.82
    else if (particle.frame < 3) particle.size *= 1.08
    if (particle.life <= 0 || particle.size < 1.4) chain.ink.splice(i, 1)
  }
}

export function getChainExclusions(chain: MouseChain, top: number, bottom: number): CircleExclusion[] {
  const out: CircleExclusion[] = []
  for (const seg of chain.segments) {
    if (seg.radius < 0.8) continue
    if (seg.y + seg.radius + EXCLUSION_PAD < top || seg.y - seg.radius - EXCLUSION_PAD > bottom) continue
    out.push({ x: seg.x, y: seg.y, radius: seg.radius + EXCLUSION_PAD })
  }
  return out
}

export function getInkExclusions(chain: MouseChain, top: number, bottom: number): CircleExclusion[] {
  const out: CircleExclusion[] = []
  for (const particle of chain.ink) {
    const radius = particle.size / 2 + 6
    if (particle.y + radius < top || particle.y - radius > bottom) continue
    out.push({ x: particle.x, y: particle.y, radius })
  }
  return out
}

export function getInkInfluence(chain: MouseChain, x: number, y: number) {
  let dx = 0
  let dy = 0
  let total = 0
  for (const particle of chain.ink) {
    const ex = x - particle.x
    const ey = y - particle.y
    const dist = Math.hypot(ex, ey)
    if (dist > 70 || dist < 0.1) continue
    const falloff = 1 - dist / 70
    const weight = falloff * falloff * particle.life
    dx += (ex / dist) * weight
    dy += (ey / dist) * weight
    total += weight
  }
  if (total < 0.001) return { dx: 0, dy: 0, strength: 0 }
  const mag = Math.hypot(dx, dy)
  return {
    dx: mag > 0 ? dx / mag : 0,
    dy: mag > 0 ? dy / mag : 0,
    strength: Math.min(total, 1.4),
  }
}

export function chainHasPresence(chain: MouseChain) {
  if (chain.ink.length > 0) return true
  return chain.segments.some((seg) => seg.radius > 0.8)
}
