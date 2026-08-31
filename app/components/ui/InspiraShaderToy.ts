import { Camera, Geometry, Mesh, Program, Renderer, Transform } from 'ogl'

export interface ShaderConfig {
  source: string
}

export interface MouseState {
  x: number
  y: number
  clickX: number
  clickY: number
}

export interface HSVControls {
  hue: number // 0-360
  saturation: number // 0-1
  brightness: number // 0-1
}

export type MouseMode = 'click' | 'hover'

export class InspiraShaderToy {
  private renderer: Renderer
  private camera: Camera
  private scene: Transform
  private geometry: Geometry
  private program: Program | null = null
  private mesh: Mesh | null = null
  private resizeObserver?: ResizeObserver
  private animationFrameId = 0
  private resizeRaf = 0
  private removeEventListeners: (() => void)[] = []

  // Timing
  private isPlaying: boolean = false
  private firstDrawTime: number = 0
  private prevDrawTime: number = 0
  private targetFPS: number = 60
  private frameInterval: number = 1000 / 60
  private lastFrameTime: number = 0

  // Callback
  private onDrawCallback?: () => void

  // Uniforms (reused every frame to avoid GC)
  private iFrame: number = 0
  private iMouse: MouseState = { x: 0, y: 0, clickX: 0, clickY: 0 }
  private hsv: HSVControls = { hue: 0, saturation: 1, brightness: 1 }
  private readonly iResolutionValue: [number, number, number] = [1, 1, 1]
  private readonly iMouseValue: [number, number, number, number] = [0, 0, 0, 0]
  private readonly iDateValue: [number, number, number, number] = [0, 0, 0, 0]
  private readonly iHsvValue: [number, number, number] = [0, 1, 1]
  private lastResizeW = 0
  private lastResizeH = 0
  private lastResizeDpr = 0
  private _mouseMode: MouseMode = 'click'
  private _mouseSensitivity: number = 1.0
  private _mouseDamping: number = 0.9

  private _speed: number = 1
  private _pixelRatio: number = 1
  private _interactive: boolean = true

  // Shader source
  private shaderSource: string = ''

  private readonly vertexShader = `#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
  `

  private readonly fragmentShaderHeader = `#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif
    
    uniform vec3      iResolution;     // viewport resolution (in pixels)
    uniform float     iTime;           // shader playback time (in seconds)
    uniform float     iTimeDelta;      // render time (in seconds)
    uniform float     iFrameRate;      // shader frame rate
    uniform int       iFrame;          // shader playback frame
    uniform vec4      iMouse;          // mouse pixel coords. xy: current, zw: click
    uniform vec4      iDate;           // (year, month, day, unixtime in seconds)
    uniform vec3      iHSV;            // HSV controls (hue, saturation, brightness)
    uniform float     iSpeed;          // speed multiplier
    
    out vec4 fragColor;
    
    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    // Apply HSV adjustments
    vec3 applyHSV(vec3 color, vec3 hsvAdjust) {
        vec3 hsv = rgb2hsv(color);
        hsv.x = fract(hsv.x + hsvAdjust.x / 360.0);
        hsv.y = clamp(hsv.y * hsvAdjust.y, 0.0, 1.0);
        hsv.z = clamp(hsv.z * hsvAdjust.z, 0.0, 1.0);
        return hsv2rgb(hsv);
    }
    
    void mainImage(out vec4 c, in vec2 f);
    
    void main() {
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
        mainImage(color, gl_FragCoord.xy);
        
        // Apply HSV adjustments if not default
        if (iHSV.x != 0.0 || iHSV.y != 1.0 || iHSV.z != 1.0) {
            color.rgb = applyHSV(color.rgb, iHSV);
        }
        
        fragColor = color;
    }
  `

  constructor(
    private container: HTMLElement,
    mouseMode?: MouseMode,
    fps?: number,
    pixelRatio = 1,
    interactive = true,
  ) {
    if (mouseMode) {
      this._mouseMode = mouseMode
    }
    if (fps) {
      this.setFrameRate(fps)
    }
    this.setPixelRatio(pixelRatio)
    this._interactive = interactive

    // Create renderer with WebGL 2 context.
    // Silk is fully opaque in the shader; page opacity lives on the CSS wrapper.
    // preserveDrawingBuffer is off: nothing reads the canvas after composite.
    this.renderer = new Renderer({
      width: this.getSafeWidth(),
      height: this.getSafeHeight(),
      dpr: this._pixelRatio,
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    })

    // Ensure WebGL 2 context
    if (!this.renderer.gl || !(this.renderer.gl instanceof WebGL2RenderingContext)) {
      throw new Error('WebGL 2 not supported')
    }

    // Append canvas to container
    this.container.appendChild(this.renderer.gl.canvas)

    // Setup camera (orthographic for full-screen quad)
    this.camera = new Camera(this.renderer.gl)
    this.camera.position.z = 1

    // Setup scene
    this.scene = new Transform()

    // Setup geometry (full-screen quad)
    this.geometry = new Geometry(this.renderer.gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1, -1, 1, 1, -1]),
      },
    })

    this.setup()
  }

  private setup(): void {
    if (this._interactive) {
      this.setupMouseEvents()
    }
    this.setupResizeHandler()
  }

  private getSafeWidth(): number {
    return Math.max(1, this.container.clientWidth)
  }

  private getSafeHeight(): number {
    return Math.max(1, this.container.clientHeight)
  }

  private syncResolution(width: number, height: number, dpr: number): void {
    this.iResolutionValue[0] = width * dpr
    this.iResolutionValue[1] = height * dpr
    this.iResolutionValue[2] = dpr
  }

  private updateProgramResolution(): void {
    if (this.program) {
      this.program.uniforms.iResolution.value = this.iResolutionValue
    }
  }

  private resize(): void {
    const width = this.getSafeWidth()
    const height = this.getSafeHeight()
    const dpr = this._pixelRatio

    if (width === this.lastResizeW && height === this.lastResizeH && dpr === this.lastResizeDpr) {
      return
    }

    this.lastResizeW = width
    this.lastResizeH = height
    this.lastResizeDpr = dpr
    this.syncResolution(width, height, dpr)
    this.renderer.dpr = dpr
    this.renderer.setSize(width, height)
    this.renderer.setViewport(width * dpr, height * dpr)
    this.updateProgramResolution()
  }

  private addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    target.addEventListener(type, listener, options)
    this.removeEventListeners.push(() => {
      target.removeEventListener(type, listener, options)
    })
  }

  private setupMouseEvents(): void {
    const canvas = this.renderer.gl.canvas
    let isMouseDown = false

    const getScaledMousePos = (event: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = this._pixelRatio

      // Get mouse position relative to canvas
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Scale by DPR, apply sensitivity, and flip Y-axis
      return {
        x: x * dpr * this._mouseSensitivity,
        y: (canvas.height - y * dpr) * this._mouseSensitivity, // Flip Y to match GLSL coordinates
      }
    }

    const onMouseMove = (event: Event) => {
      const mouseEvent = event as MouseEvent
      const { x: newX, y: newY } = getScaledMousePos(mouseEvent)

      // Apply damping with configurable factor
      this.iMouse.x = this.iMouse.x * this._mouseDamping + newX * (1 - this._mouseDamping)
      this.iMouse.y = this.iMouse.y * this._mouseDamping + newY * (1 - this._mouseDamping)

      // Handle click coordinates based on mode
      if (this._mouseMode === 'hover' && !isMouseDown) {
        this.iMouse.clickX = this.iMouse.x
        this.iMouse.clickY = this.iMouse.y
      } else if (isMouseDown) {
        this.iMouse.clickX = newX
        this.iMouse.clickY = newY
      }
    }

    const onMouseDown = (event: Event) => {
      const mouseEvent = event as MouseEvent
      isMouseDown = true
      const { x: clickX, y: clickY } = getScaledMousePos(mouseEvent)

      if (this._mouseMode === 'click') {
        this.iMouse.clickX = clickX
        this.iMouse.clickY = clickY
      }
    }

    const stopPress = () => {
      isMouseDown = false
    }

    // Handle touch events for mobile
    const onTouchMove = (event: Event) => {
      const touchEvent = event as TouchEvent
      const touch = touchEvent.touches[0]
      if (!touch) return
      const { x: newX, y: newY } = getScaledMousePos(touch)

      this.iMouse.x = newX
      this.iMouse.y = newY

      if (this._mouseMode === 'hover') {
        this.iMouse.clickX = newX
        this.iMouse.clickY = newY
      }
    }

    const onTouchStart = (event: Event) => {
      const touchEvent = event as TouchEvent
      isMouseDown = true
      const touch = touchEvent.touches[0]
      if (!touch) return
      const { x: clickX, y: clickY } = getScaledMousePos(touch)

      if (this._mouseMode === 'click') {
        this.iMouse.clickX = clickX
        this.iMouse.clickY = clickY
      }
    }

    // Listen on window so full-page backgrounds (often pointer-events-none / -z-10)
    // still track the cursor while page content remains interactive.
    this.addEventListener(window, 'mousemove', onMouseMove)
    this.addEventListener(window, 'mousedown', onMouseDown)
    this.addEventListener(window, 'mouseup', stopPress)
    this.addEventListener(window, 'touchmove', onTouchMove, { passive: true })
    this.addEventListener(window, 'touchstart', onTouchStart, { passive: true })
    this.addEventListener(window, 'touchend', stopPress)
    this.addEventListener(window, 'touchcancel', stopPress)
  }

  private setupResizeHandler(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeRaf) return
      this.resizeRaf = requestAnimationFrame(() => {
        this.resizeRaf = 0
        this.resize()
      })
    })

    this.resizeObserver.observe(this.container)
    this.resize()
  }

  private compileProgram(): boolean {
    if (!this.shaderSource) return false

    const fullFragmentShader = this.fragmentShaderHeader + this.shaderSource

    try {
      const program = new Program(this.renderer.gl, {
        vertex: this.vertexShader,
        fragment: fullFragmentShader,
        uniforms: {
          iResolution: {
            value: this.iResolutionValue,
          },
          iTime: { value: 0 },
          iTimeDelta: { value: 0 },
          iFrameRate: { value: this.targetFPS },
          iFrame: { value: 0 },
          iMouse: { value: this.iMouseValue },
          iDate: { value: this.iDateValue },
          iHSV: { value: this.iHsvValue },
          iSpeed: { value: this._speed },
        },
      })

      const mesh = new Mesh(this.renderer.gl, {
        geometry: this.geometry,
        program,
      })

      this.program?.remove()
      this.program = program
      this.mesh = mesh

      return true
    } catch (error) {
      console.error('Failed to compile shader:', error)
      return false
    }
  }

  private syncHsvUniform(): void {
    this.iHsvValue[0] = this.hsv.hue
    this.iHsvValue[1] = this.hsv.saturation
    this.iHsvValue[2] = this.hsv.brightness
  }

  private draw(): void {
    if (!this.program || !this.mesh) {
      console.warn('Program or mesh not initialized')
      return
    }

    const now = this.isPlaying ? performance.now() : this.prevDrawTime

    if (this.firstDrawTime === 0) {
      this.firstDrawTime = now
    }

    this.onDrawCallback?.()

    const iTimeDelta = (now - this.prevDrawTime) * 0.001 * this._speed
    const iTime = (now - this.firstDrawTime) * 0.001 * this._speed
    this.iDateValue[3] = now * 0.001

    if (this._interactive) {
      this.iMouseValue[0] = this.iMouse.x
      this.iMouseValue[1] = this.iMouse.y
      this.iMouseValue[2] = this.iMouse.clickX
      this.iMouseValue[3] = this.iMouse.clickY
    }

    this.program.uniforms.iTime.value = iTime
    this.program.uniforms.iTimeDelta.value = iTimeDelta
    this.program.uniforms.iFrame.value = this.iFrame

    this.renderer.render({ scene: this.mesh, camera: this.camera })

    this.prevDrawTime = now
    this.iFrame++
  }

  private animate = (): void => {
    this.animationFrameId = 0

    if (!this.isPlaying) return

    let shouldDraw = true

    if (this.targetFPS < 60) {
      const now = performance.now()
      const elapsed = now - this.lastFrameTime

      if (elapsed < this.frameInterval) {
        shouldDraw = false
      } else {
        this.lastFrameTime = now - (elapsed % this.frameInterval)
      }
    }

    if (shouldDraw) {
      this.draw()
    }

    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  // Public methods
  public setShader(config: ShaderConfig): boolean {
    this.shaderSource = config.source
    const success = this.compileProgram()

    // If playing, trigger a redraw
    if (success && this.isPlaying) {
      this.draw()
    }

    return success
  }

  public setHSV(hsv: Partial<HSVControls>): void {
    if (hsv.hue !== undefined) this.hsv.hue = hsv.hue
    if (hsv.saturation !== undefined) this.hsv.saturation = hsv.saturation
    if (hsv.brightness !== undefined) this.hsv.brightness = hsv.brightness
    this.syncHsvUniform()

    if (!this.isPlaying && this.program && this.mesh) {
      this.draw()
    }
  }

  public setHue(val: number) {
    this.hsv.hue = val
    this.syncHsvUniform()

    if (!this.isPlaying && this.program && this.mesh) {
      this.draw()
    }
  }

  public setSaturation(val: number) {
    this.hsv.saturation = val
    this.syncHsvUniform()

    if (!this.isPlaying && this.program && this.mesh) {
      this.draw()
    }
  }

  public setBrightness(val: number) {
    this.hsv.brightness = val
    this.syncHsvUniform()

    if (!this.isPlaying && this.program && this.mesh) {
      this.draw()
    }
  }

  public getHSV(): HSVControls {
    return { ...this.hsv }
  }
  // New speed methods
  public setSpeed(val: number): void {
    this._speed = Math.max(0, val)
    if (this.program) {
      this.program.uniforms.iSpeed.value = this._speed
    }

    if (!this.isPlaying && this.program && this.mesh) {
      this.draw()
    }
  }

  public getSpeed(): number {
    return this._speed
  }

  public setFrameRate(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(60, fps))
    this.frameInterval = 1000 / this.targetFPS
    if (this.program) {
      this.program.uniforms.iFrameRate.value = this.targetFPS
    }
  }

  public getFrameRate(): number {
    return this.targetFPS
  }

  public setPixelRatio(pixelRatio: number): void {
    this._pixelRatio = Math.max(0.25, Math.min(2, pixelRatio))

    if (this.renderer) {
      this.resize()
      if (!this.isPlaying && this.program && this.mesh) {
        this.draw()
      }
    }
  }

  public getPixelRatio(): number {
    return this._pixelRatio
  }

  public setOnDraw(callback: () => void): void {
    this.onDrawCallback = callback
  }

  public time(): number {
    return (this.prevDrawTime - this.firstDrawTime) * 0.001 * this._speed
  }

  public isPlayingState(): boolean {
    return this.isPlaying
  }

  public reset(): void {
    const now = performance.now()
    this.firstDrawTime = now
    this.prevDrawTime = now
    this.lastFrameTime = now
    this.iFrame = 0
    this.draw()
  }

  public pause(): void {
    this.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = 0
    }
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true
      const now = performance.now()
      const elapsed = this.prevDrawTime - this.firstDrawTime
      this.firstDrawTime = now - elapsed
      this.prevDrawTime = now
      this.lastFrameTime = now
      this.draw()
      this.animationFrameId = requestAnimationFrame(this.animate)
    }
  }

  public dispose(): void {
    this.pause()
    if (this.resizeRaf) {
      cancelAnimationFrame(this.resizeRaf)
      this.resizeRaf = 0
    }
    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined
    this.removeEventListeners.forEach((remove) => remove())
    this.removeEventListeners = []
    this.program?.remove()
    this.program = null
    this.mesh = null
    this.geometry.remove()

    if (this.renderer.gl.canvas.parentElement) {
      this.renderer.gl.canvas.parentElement.removeChild(this.renderer.gl.canvas)
    }
  }

  // Getters and Setters
  public get mouseMode(): MouseMode {
    return this._mouseMode
  }

  public set mouseMode(val: MouseMode) {
    this._mouseMode = val
  }
  public get speed(): number {
    return this._speed
  }

  public set speed(val: number) {
    this.setSpeed(val)
  }

  // New mouse sensitivity methods
  public setMouseSensitivity(sensitivity: number): void {
    this._mouseSensitivity = Math.max(0.1, Math.min(5.0, sensitivity)) // Clamp between 0.1 and 5.0
  }

  public getMouseSensitivity(): number {
    return this._mouseSensitivity
  }

  // New mouse damping methods
  public setMouseDamping(damping: number): void {
    this._mouseDamping = Math.max(0, Math.min(0.99, damping)) // Clamp between 0 and 0.99
  }

  public getMouseDamping(): number {
    return this._mouseDamping
  }
}
