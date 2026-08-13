/**
 * WebGL paper-burn reveal — from https://codepen.io/Nidal95/pen/ByjKzbE
 */

const VERT = `
precision mediump float;
varying vec2 vUv;
attribute vec2 a_position;
void main() {
  vUv = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;
uniform sampler2D u_text;

float rand(vec2 n) {
  return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 n) {
  const vec2 d = vec2(0., 1.);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
  return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float fbm(vec2 n) {
  float total = 0.0, amplitude = .4;
  for (int i = 0; i < 4; i++) {
    total += noise(n) * amplitude;
    n += n;
    amplitude *= 0.6;
  }
  return total;
}

void main() {
  vec2 uv = vUv;
  uv.x *= min(1., u_resolution.x / u_resolution.y);
  uv.y *= min(1., u_resolution.y / u_resolution.x);

  vec2 screenUv = vUv * 0.5 + 0.5;
  screenUv.y = 1.0 - screenUv.y;

  float t = u_progress;
  vec4 textColor = texture2D(u_text, screenUv);
  vec3 color = textColor.rgb;

  float main_noise = 1. - fbm(.75 * uv + 10. - vec2(.3, .9 * t));

  float paper_darkness = smoothstep(main_noise - .1, main_noise, t);
  color -= vec3(.99, .95, .99) * paper_darkness;

  vec3 fire_color = fbm(6. * uv - vec2(0., .005 * u_time)) * vec3(6., 1.4, .0);
  float show_fire = smoothstep(.4, .9, fbm(10. * uv + 2. - vec2(0., .005 * u_time)));
  show_fire += smoothstep(.7, .8, fbm(.5 * uv + 5. - vec2(0., .001 * u_time)));

  float fire_border = .02 * show_fire;
  float fire_edge = smoothstep(main_noise - fire_border, main_noise - .5 * fire_border, t);
  fire_edge *= (1. - smoothstep(main_noise - .5 * fire_border, main_noise, t));
  color += fire_color * fire_edge;

  float opacity = 1. - smoothstep(main_noise - .0005, main_noise, t);
  gl_FragColor = vec4(color, opacity * textColor.a);
}
`

function createShader(gl: WebGLRenderingContext, source: string, type: number) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export class ThemeBurnOverlay {
  readonly canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private uniforms: Record<string, WebGLUniformLocation | null> = {}
  private texture: WebGLTexture | null = null
  private raf = 0
  private disposed = false

  constructor(canvas: HTMLCanvasElement) {
    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
      }) || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)

    if (!gl) throw new Error('WebGL unavailable')

    this.canvas = canvas
    this.gl = gl

    const vs = createShader(gl, VERT, gl.VERTEX_SHADER)
    const fs = createShader(gl, FRAG, gl.FRAGMENT_SHADER)
    if (!vs || !fs) throw new Error('Shader compile failed')

    const program = gl.createProgram()
    if (!program) throw new Error('Program create failed')
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Link failed')
    }

    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i)
      if (!info) continue
      this.uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
    gl.useProgram(program)

    const position = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
  }

  setTexture(source: CanvasImageSource) {
    const { gl } = this
    if (this.texture) gl.deleteTexture(this.texture)
    const texture = gl.createTexture()
    if (!texture) return
    this.texture = texture
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  resize(cssWidth = document.documentElement.clientWidth, cssHeight = window.innerHeight) {
    const w = Math.max(1, Math.floor(cssWidth))
    const h = Math.max(1, Math.floor(cssHeight))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = `${w}px`
    this.canvas.style.height = `${h}px`
    this.gl.viewport(0, 0, w, h)
    this.gl.uniform2f(this.uniforms.u_resolution, w, h)
  }

  private draw(progress: number, time: number) {
    const { gl } = this
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(this.uniforms.u_time, time)
    gl.uniform1f(this.uniforms.u_progress, progress)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(this.uniforms.u_text, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  /** 切主题前先盖住一帧完整旧画面 */
  prime(progress = 0.22, cssWidth?: number, cssHeight?: number) {
    this.resize(cssWidth, cssHeight)
    this.draw(progress, performance.now())
  }

  play(durationMs = 1400, from = 0.22, to = 1) {
    return new Promise<void>((resolve) => {
      if (this.disposed) {
        resolve()
        return
      }
      const start = performance.now()

      const tick = (now: number) => {
        if (this.disposed) {
          resolve()
          return
        }
        const elapsed = (now - start) / durationMs
        if (elapsed >= 1) {
          this.draw(to, now)
          resolve()
          return
        }
        this.draw(from + (to - from) * easeInOut(elapsed), now)
        this.raf = requestAnimationFrame(tick)
      }

      this.raf = requestAnimationFrame(tick)
    })
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    if (this.texture) this.gl.deleteTexture(this.texture)
    this.texture = null
  }
}

export function mountBurnCanvas(cssWidth = document.documentElement.clientWidth, cssHeight = window.innerHeight) {
  const canvas = document.createElement('canvas')
  canvas.dataset.themeBurn = 'overlay'
  canvas.setAttribute('aria-hidden', 'true')
  const w = Math.max(1, Math.floor(cssWidth))
  const h = Math.max(1, Math.floor(cssHeight))
  canvas.width = w
  canvas.height = h
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${w}px`,
    height: `${h}px`,
    pointerEvents: 'none',
    zIndex: '2147483646',
  } as CSSStyleDeclaration)
  document.documentElement.appendChild(canvas)
  return canvas
}
