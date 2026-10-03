import { createDotLayout } from './alphabet.mjs';
import { DotPhysics } from './physics.mjs';

/** Responsive, dependency-free cutout or dotted lettering. */
export class DotLineElement extends HTMLElement {
  static observedAttributes = ['text', 'dot-color', 'background', 'radius', 'strength', 'static', 'max-columns', 'connect', 'dot-style', 'mode'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; }
        canvas { display: block; width: 100%; height: auto; background: var(--dot-background, #241329); color: var(--dot-color, #d3b638); }
        .text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: pre; }
      </style>
      <canvas aria-hidden="true"></canvas><span class="text"></span>`;
    this._canvas = this.shadowRoot.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._textNode = this.shadowRoot.querySelector('.text');
    this._frame = 0;
    this._visible = true;
    this._connected = false;
    this._lastTime = 0;
    this._width = 0;
    this._touching = false;
    this._motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._onPointer = (event) => {
      if (!this._connected || !this._visible || document.hidden || this._motion.matches || this.hasAttribute('static') || !this._physics) return;
      if (event.pointerType === 'touch' && !this._touching) return;
      const rect = this._canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this._physics.setPointer(
        (event.clientX - rect.left) * this._layout.width / rect.width,
        (event.clientY - rect.top) * this._layout.height / rect.height,
      );
      this._start();
    };
    this._onDown = (event) => { this._touching = event.pointerType === 'touch'; this._onPointer(event); };
    this._onLeave = () => { this._touching = false; this._physics?.clearPointer(); this._start(); };
    this._onMotion = () => {
      this._stop();
      this._physics?.reset();
      this._physics?.clearPointer();
      this._draw();
    };
    this._onVisibility = () => {
      if (document.hidden) { this._physics?.clearPointer(); this._stop(); }
      else this._start();
    };
    this._tick = (time) => {
      this._frame = 0;
      if (!this._connected || !this._visible || document.hidden) return;
      const dt = this._lastTime ? Math.min((time - this._lastTime) / 1000, 1 / 30) : 1 / 60;
      this._lastTime = time;
      const moving = this._physics.step(dt);
      this._draw();
      if (moving) this._frame = requestAnimationFrame(this._tick);
      else this._lastTime = 0;
    };
  }

  connectedCallback() {
    if (this._connected) return;
    this._connected = true;
    this._canvas.addEventListener('pointermove', this._onPointer);
    this._canvas.addEventListener('pointerdown', this._onDown);
    this._canvas.addEventListener('pointerleave', this._onLeave);
    this._canvas.addEventListener('pointerup', this._onLeave);
    this._canvas.addEventListener('pointercancel', this._onLeave);
    this._motion.addEventListener('change', this._onMotion);
    document.addEventListener('visibilitychange', this._onVisibility);
    this._resize = new ResizeObserver(() => {
      const width = this.getBoundingClientRect().width;
      if (Math.abs(width - this._width) > 0.5) this._build();
    });
    this._resize.observe(this);
    if (typeof IntersectionObserver !== 'undefined') {
      this._intersection = new IntersectionObserver(([entry]) => {
        this._visible = entry.isIntersecting;
        if (!this._visible) { this._physics?.clearPointer(); this._stop(); }
        else this._start();
      });
      this._intersection.observe(this);
    }
    this._build();
  }

  disconnectedCallback() {
    this._connected = false;
    this._stop();
    this._resize?.disconnect();
    this._intersection?.disconnect();
    this._canvas.removeEventListener('pointermove', this._onPointer);
    this._canvas.removeEventListener('pointerdown', this._onDown);
    this._canvas.removeEventListener('pointerleave', this._onLeave);
    this._canvas.removeEventListener('pointerup', this._onLeave);
    this._canvas.removeEventListener('pointercancel', this._onLeave);
    this._motion.removeEventListener('change', this._onMotion);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._physics?.clearPointer();
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue && this._connected) this._build();
  }

  get text() { return this.getAttribute('text') ?? 'Robot'; }
  set text(value) { this.setAttribute('text', String(value)); }

  /** Call after changing CSS custom properties or revealing a hidden container. */
  refresh() { if (this._connected) this._build(); }

  _number(name, fallback, min, max) {
    const raw = this.getAttribute(name);
    const value = raw === null || raw.trim() === '' ? fallback : Number(raw);
    return Math.min(max, Math.max(min, Number.isFinite(value) ? value : fallback));
  }

  _choice(name, choices, fallback) {
    const value = this.getAttribute(name);
    return choices.includes(value) ? value : fallback;
  }

  _build() {
    this._stop();
    this._width = this.getBoundingClientRect().width;
    if (this._width <= 0 || !this._ctx) return;
    const maxColumns = Math.round(this._number('max-columns', this._width < 500 ? 35 : 70, 12, 180));
    const mode = this._choice('mode', ['cutout', 'letters'], 'cutout');
    const connect = this._choice('connect', ['none', 'vertical', 'horizontal'], 'none');
    this._dotStyle = this._choice('dot-style', ['solid', 'outline'], 'solid');
    this._layout = createDotLayout(this.text, { pitch: 1, margin: 2, letterSpacing: 1, lineSpacing: 3, minColumns: Math.min(maxColumns, 32), maxColumns, align: 'center', mode, connect });
    this._textNode.textContent = this.text;
    const radius = this._number('radius', 0.45, 0.12, 0.47);
    const strength = this._number('strength', 70, 0, 120);
    this._physics = new DotPhysics(this._layout.points, radius, {
      width: this._layout.width,
      height: this._layout.height,
      gap: 0.025,
      pointerRadius: 3,
      pointerStrength: strength,
      spring: 28,
      damping: 11,
      maxSpeed: 7,
    });
    const height = this._width * this._layout.height / this._layout.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._canvas.width = Math.max(1, Math.round(this._width * dpr));
    this._canvas.height = Math.max(1, Math.round(height * dpr));
    this._canvas.style.aspectRatio = `${this._layout.width} / ${this._layout.height}`;
    const foreground = this.getAttribute('dot-color');
    const background = this.getAttribute('background');
    if (foreground) this._canvas.style.color = foreground;
    else this._canvas.style.removeProperty('color');
    if (background) this._canvas.style.backgroundColor = background;
    else this._canvas.style.removeProperty('background-color');
    this._draw();
  }

  _draw() {
    if (!this._physics || !this._ctx) return;
    const context = this._ctx;
    context.setTransform(this._canvas.width / this._layout.width, 0, 0, this._canvas.height / this._layout.height, 0, 0);
    context.clearRect(0, 0, this._layout.width, this._layout.height);
    context.fillStyle = context.strokeStyle = getComputedStyle(this._canvas).color;
    const radius = this._physics.radius;
    const outline = this._dotStyle === 'outline';
    const strokeWidth = radius * 0.24;
    context.lineCap = outline ? 'butt' : 'round';
    context.lineWidth = outline ? strokeWidth : radius * 2;
    for (const { from, to } of this._layout.connections) {
      const start = this._physics.particles[from];
      const end = this._physics.particles[to];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy);
      // Keep the original topology as particles move. A highly stretched link
      // fades out instead of drawing a long strand across neighboring letters.
      const stretch = distance / this._layout.pitch;
      if (stretch >= 1.9 || distance <= 0) continue;
      context.globalAlpha = Math.min(1, Math.max(0, (1.9 - stretch) / 0.55));
      const inset = outline ? radius : 0;
      context.beginPath();
      context.moveTo(start.x + dx / distance * inset, start.y + dy / distance * inset);
      context.lineTo(end.x - dx / distance * inset, end.y - dy / distance * inset);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.lineWidth = strokeWidth;
    const arcRadius = outline ? radius - strokeWidth / 2 : radius;
    context.beginPath();
    for (const point of this._physics.particles) {
      context.moveTo(point.x + arcRadius, point.y);
      context.arc(point.x, point.y, arcRadius, 0, Math.PI * 2);
    }
    if (outline) context.stroke();
    else context.fill();
  }

  _start() {
    if (this._frame || !this._connected || !this._visible || document.hidden || this._motion.matches || this.hasAttribute('static') || !this._physics) return;
    this._lastTime = 0;
    this._frame = requestAnimationFrame(this._tick);
  }

  _stop() {
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = 0;
    this._lastTime = 0;
  }
}

if (!customElements.get('dot-line')) customElements.define('dot-line', DotLineElement);
