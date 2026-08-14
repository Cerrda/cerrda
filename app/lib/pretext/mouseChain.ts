import type { CircleExclusion } from './types'

export type MouseHead = {
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
  segments: MouseHead[]
  ink: InkParticle[]
  lastStepTime: number
  inkLastStep: number
  scale: number
}

export const HEAD_RADIUS = 16
export const STEP_INTERVAL = 16
export const INK_STEP_INTERVAL = 32
export const IDLE_TIMEOUT = 720

export function createMouseChain(x: number, y: number, scale = 1): MouseChain {
  return {
    segments: [
      {
        x,
        y,
        angle: 0,
        radius: 0,
        targetRadius: HEAD_RADIUS,
      },
    ],
    ink: [],
    lastStepTime: 0,
    inkLastStep: 0,
    scale,
  }
}

export function resizeMouseChain(chain: MouseChain, _scale: number) {
  chain.scale = _scale
  const head = chain.segments[0]
  if (head) head.targetRadius = HEAD_RADIUS
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

  const head = chain.segments[0]
  if (!head) return false

  const prevX = head.x
  const prevY = head.y
  const prevR = head.radius
  const prevA = head.angle

  const target = idle || !inside ? 0 : head.targetRadius
  head.radius += (target - head.radius) * (idle || !inside ? 0.28 : 0.55)
  if (head.radius < 0.4) head.radius = 0

  head.x = mouseX
  head.y = mouseY
  if (inside) {
    const dx = mouseX - prevX
    const dy = mouseY - prevY
    if (dx !== 0 || dy !== 0) head.angle = Math.atan2(dy, dx) + Math.PI / 2
  }

  return head.x !== prevX || head.y !== prevY || head.radius !== prevR || head.angle !== prevA
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
  const head = chain.segments[0]
  if (!head || head.radius < 0.4) return []
  if (head.y + head.radius < top || head.y - head.radius > bottom) return []
  return [{ x: head.x, y: head.y, radius: head.radius }]
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
  const head = chain.segments[0]
  return Boolean(head && head.radius > 0.4)
}
