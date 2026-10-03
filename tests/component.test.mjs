import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createDotLayout } from '../alphabet.mjs';

// A deliberately small DOM/canvas harness. These tests exercise the custom
// element's public lifecycle, attributes, pointer events, and rendered circles;
// they do not substitute a fake physics engine or read component internals.
class EventSurface {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, properties = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener({ type, ...properties });
  }
  listenerCount(type) { return this.listeners.get(type)?.size ?? 0; }
  get totalListeners() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

class CanvasContext {
  rendered = [];
  links = [];
  fills = [];
  strokes = [];
  drawCount = 0;
  setTransform(...values) { this.transform = values; }
  clearRect() { this.rendered = []; this.links = []; this.fills = []; this.strokes = []; }
  beginPath() { this.path = []; this.segments = []; }
  moveTo(x, y) { this.cursor = { x, y }; }
  lineTo(x, y) { this.segments.push({ from: this.cursor, to: { x, y } }); this.cursor = { x, y }; }
  arc(x, y, radius) { this.path.push({ x, y, radius }); }
  fill() {
    this.rendered = this.path.map(circle => ({ ...circle }));
    this.fills.push({ circles: this.path.map(circle => ({ ...circle })), color: this.fillStyle });
    this.drawCount += 1;
  }
  stroke() {
    if (this.path.length) {
      // Capture the visible outer edge for the independent separation check.
      this.rendered = this.path.map(circle => ({ ...circle, radius: circle.radius + this.lineWidth / 2 }));
    }
    const stroke = { circles: this.path.map(circle => ({ ...circle })),
      lineWidth: this.lineWidth, color: this.strokeStyle, alpha: this.globalAlpha };
    this.strokes.push(stroke);
    this.links.push(...this.segments.map(segment => ({ ...segment, ...stroke, lineCap: this.lineCap })));
    this.drawCount += 1;
  }
}

class CanvasSurface extends EventSurface {
  constructor(host) {
    super();
    this.host = host;
    this.context = new CanvasContext();
    this.width = 300;
    this.height = 150;
    this.style = {
      color: '', backgroundColor: '', aspectRatio: '',
      removeProperty(property) {
        this[property === 'background-color' ? 'backgroundColor' : property] = '';
      },
    };
  }
  getContext(type) { assert.equal(type, '2d'); return this.context; }
  getBoundingClientRect() {
    const [columns, rows] = this.style.aspectRatio.split('/').map(Number);
    return { left: 80, top: 40, width: this.host.displayWidth,
      height: this.host.displayWidth * (rows / columns || 0.5) };
  }
}

class ElementSurface {
  attributes = new Map();
  displayWidth = 800;
  attachShadow() {
    const canvas = new CanvasSurface(this);
    const text = { textContent: '' };
    this.shadowRoot = {
      innerHTML: '',
      querySelector(selector) { return selector === 'canvas' ? canvas : text; },
    };
    return this.shadowRoot;
  }
  getBoundingClientRect() { return { width: this.displayWidth }; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) {
    const oldValue = this.getAttribute(name);
    const newValue = String(value);
    this.attributes.set(name, newValue);
    if (oldValue !== newValue && this.constructor.observedAttributes.includes(name)) {
      this.attributeChangedCallback(name, oldValue, newValue);
    }
  }
  removeAttribute(name) {
    const oldValue = this.getAttribute(name);
    this.attributes.delete(name);
    if (oldValue !== null && this.constructor.observedAttributes.includes(name)) {
      this.attributeChangedCallback(name, oldValue, null);
    }
  }
}

const registry = new Map();
globalThis.HTMLElement = ElementSurface;
globalThis.customElements = {
  get(name) { return registry.get(name); },
  define(name, constructor) { registry.set(name, constructor); },
};

function createEnvironment({ reducedMotion = false, dpr = 1 } = {}) {
  const media = new EventSurface();
  media.matches = reducedMotion;
  const document = new EventSurface();
  document.hidden = false;
  const frames = new Map();
  let sequence = 0;
  let timestamp = 0;
  const observers = { resize: [], intersection: [] };
  function observerClass(type) {
    return class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers[type].push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
      notify(entry = {}) { this.callback([{ target: this.target, ...entry }]); }
    };
  }
  globalThis.document = document;
  globalThis.window = {
    devicePixelRatio: dpr,
    matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media; },
  };
  globalThis.ResizeObserver = observerClass('resize');
  globalThis.IntersectionObserver = observerClass('intersection');
  globalThis.requestAnimationFrame = callback => {
    const id = ++sequence;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.getComputedStyle = canvas => ({ color: canvas.style.color || '#d3b638' });
  return {
    media, document, frames, observers,
    advance(count = 1, onFrame = () => {}) {
      for (let index = 0; index < count; index += 1) {
        timestamp += 1000 / 60;
        const scheduled = [...frames.entries()];
        frames.clear();
        scheduled.forEach(([, callback]) => callback(timestamp));
        onFrame();
      }
    },
    settle(limit = 900) {
      let count = 0;
      while (frames.size && count++ < limit) this.advance();
      assert.equal(frames.size, 0, `animation should sleep within ${limit} frames after pointer exit`);
    },
  };
}

let environment = createEnvironment();
const { DotLineElement } = await import('../dot-line.mjs');
beforeEach(() => { environment = createEnvironment(); });

function mount(attributes = {}, width = 800) {
  const element = new DotLineElement();
  element.displayWidth = width;
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.connectedCallback();
  return {
    element,
    canvas: element.shadowRoot.querySelector('canvas'),
    accessibleText: element.shadowRoot.querySelector('.text'),
  };
}

function pointEvent(canvas, type, { x, y } = {}, pointerType = 'mouse') {
  const rect = canvas.getBoundingClientRect();
  const [columns, rows] = canvas.style.aspectRatio.split('/').map(Number);
  canvas.emit(type, {
    pointerType,
    clientX: rect.left + (x ?? columns / 2) / columns * rect.width,
    clientY: rect.top + (y ?? rows / 2) / rows * rect.height,
  });
}

function greatestDisplacement(before, after) {
  assert.equal(before.length, after.length);
  return Math.max(...before.map((circle, index) => Math.hypot(
    circle.x - after[index].x, circle.y - after[index].y,
  )));
}

function assertSeparate(circles) {
  for (let i = 0; i < circles.length; i += 1) {
    assert.ok(Number.isFinite(circles[i].x) && Number.isFinite(circles[i].y));
    for (let j = i + 1; j < circles.length; j += 1) {
      assert.ok(Math.hypot(circles[i].x - circles[j].x, circles[i].y - circles[j].y)
        >= circles[i].radius + circles[j].radius - 1e-9,
      `rendered circles ${i} and ${j} intersect`);
    }
  }
}

test('registers once, draws accessible text, and cleans up on disconnect and reconnect', () => {
  assert.equal(customElements.get('dot-line'), DotLineElement);
  const { element, canvas, accessibleText } = mount();
  assert.equal(element.text, 'Robot');
  assert.equal(accessibleText.textContent, 'Robot');
  assert.ok(canvas.context.rendered.length > 0);
  assert.equal(environment.frames.size, 0, 'initial still image requires no animation loop');
  element.connectedCallback();
  assert.equal(canvas.listenerCount('pointermove'), 1);
  assert.equal(environment.document.totalListeners, 1);
  assert.equal(environment.media.totalListeners, 1);
  assert.equal(environment.observers.resize.length, 1);
  assert.equal(environment.observers.intersection.length, 1);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 1);
  element.disconnectedCallback();
  assert.equal(environment.frames.size, 0);
  assert.equal(canvas.totalListeners, 0);
  assert.equal(environment.document.totalListeners, 0);
  assert.equal(environment.media.totalListeners, 0);
  assert.ok(environment.observers.resize[0].disconnected);
  assert.ok(environment.observers.intersection[0].disconnected);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  element.connectedCallback();
  assert.equal(canvas.listenerCount('pointermove'), 1);
  assert.equal(environment.observers.resize.length, 2);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 1);
  element.disconnectedCallback();
});

test('mouse and pen hover displace rendered circles, never intersect, and return to rest', () => {
  const { element, canvas } = mount();
  const home = canvas.context.rendered;
  const point = home.find(circle => circle.x > 5 && circle.y > 3);
  pointEvent(canvas, 'pointermove', point);
  pointEvent(canvas, 'pointermove', point);
  assert.equal(environment.frames.size, 1, 'multiple pointer events share one animation frame');
  environment.advance(45, () => assertSeparate(canvas.context.rendered));
  assert.ok(greatestDisplacement(home, canvas.context.rendered) > 0.05,
    'hover should produce visible movement rather than merely start an idle RAF');
  pointEvent(canvas, 'pointermove', { x: point.x + 3, y: point.y + 2 }, 'pen');
  environment.advance(20, () => assertSeparate(canvas.context.rendered));
  pointEvent(canvas, 'pointerleave');
  environment.settle();
  assert.ok(greatestDisplacement(home, canvas.context.rendered) < 1e-6,
    'dots should restore the letter shape after the pointer leaves');
  element.disconnectedCallback();
});

test('reduced motion stays still and changing the preference cancels and resets motion', () => {
  environment = createEnvironment({ reducedMotion: true });
  const { element, canvas } = mount();
  const home = canvas.context.rendered;
  pointEvent(canvas, 'pointermove');
  pointEvent(canvas, 'pointerdown', undefined, 'touch');
  pointEvent(canvas, 'pointerleave');
  assert.equal(environment.frames.size, 0);
  assert.deepEqual(canvas.context.rendered, home);
  environment.media.matches = false;
  environment.media.emit('change');
  pointEvent(canvas, 'pointermove', home.find(circle => circle.x > 5 && circle.y > 3));
  environment.advance(12);
  assert.ok(greatestDisplacement(home, canvas.context.rendered) > 0.01);
  environment.media.matches = true;
  environment.media.emit('change');
  assert.equal(environment.frames.size, 0);
  assert.deepEqual(canvas.context.rendered, home);
  element.disconnectedCallback();
});

test('static attribute cancels motion and supports opt-in motion after removal', () => {
  const { element, canvas } = mount({ static: '' });
  const home = canvas.context.rendered;
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  element.removeAttribute('static');
  pointEvent(canvas, 'pointermove', home.find(circle => circle.x > 5 && circle.y > 3));
  environment.advance(12);
  assert.ok(greatestDisplacement(home, canvas.context.rendered) > 0.01);
  element.setAttribute('static', '');
  assert.equal(environment.frames.size, 0);
  assert.deepEqual(canvas.context.rendered, home);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  element.disconnectedCallback();
});

test('offscreen and hidden documents cancel RAF and suppress new pointer animation', () => {
  const { element, canvas } = mount();
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 1);
  environment.observers.intersection[0].notify({ isIntersecting: false });
  assert.equal(environment.frames.size, 0);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  environment.document.hidden = true;
  environment.document.emit('visibilitychange');
  environment.observers.intersection[0].notify({ isIntersecting: true });
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  environment.document.hidden = false;
  environment.document.emit('visibilitychange');
  environment.advance();
  environment.settle();
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 1);
  environment.document.hidden = true;
  environment.document.emit('visibilitychange');
  assert.equal(environment.frames.size, 0);
  element.disconnectedCallback();
});

test('touch requires a press, clears on release or cancellation, and does not linger as hover', () => {
  const { element, canvas } = mount();
  const home = canvas.context.rendered;
  const point = home.find(circle => circle.x > 5 && circle.y > 3);
  pointEvent(canvas, 'pointermove', point, 'touch');
  assert.equal(environment.frames.size, 0);
  pointEvent(canvas, 'pointerdown', point, 'touch');
  environment.advance(15, () => assertSeparate(canvas.context.rendered));
  assert.ok(greatestDisplacement(home, canvas.context.rendered) > 0.01);
  pointEvent(canvas, 'pointerup', point, 'touch');
  environment.settle();
  assert.deepEqual(canvas.context.rendered, home);
  pointEvent(canvas, 'pointermove', point, 'touch');
  assert.equal(environment.frames.size, 0);
  pointEvent(canvas, 'pointerdown', point, 'touch');
  environment.advance(5);
  pointEvent(canvas, 'pointercancel', point, 'touch');
  environment.settle();
  pointEvent(canvas, 'pointermove', point, 'touch');
  assert.equal(environment.frames.size, 0);
  element.disconnectedCallback();
});

test('text, styles, and resize update the rendered geometry with bounded pixel density', () => {
  environment = createEnvironment({ dpr: 4 });
  const { element, canvas, accessibleText } = mount();
  const initial = canvas.context.rendered;
  assert.equal(canvas.width, 1600, 'pixel density is capped at 2');
  element.text = 'Hello\nworld';
  assert.equal(element.getAttribute('text'), 'Hello\nworld');
  assert.equal(accessibleText.textContent, 'Hello\nworld');
  assert.notDeepEqual(canvas.context.rendered, initial);
  element.setAttribute('dot-color', '#ffcc00');
  element.setAttribute('background', '#120817');
  assert.equal(canvas.context.fillStyle, '#ffcc00');
  assert.equal(canvas.style.backgroundColor, '#120817');
  element.removeAttribute('dot-color');
  assert.equal(canvas.style.color, '');
  element.text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const largeRatio = canvas.style.aspectRatio;
  element.displayWidth = 320;
  environment.observers.resize[0].notify();
  assert.equal(canvas.width, 640);
  assert.notEqual(canvas.style.aspectRatio, largeRatio, 'small screens wrap into more lines');
  const [columns, rows] = canvas.style.aspectRatio.split('/').map(Number);
  assert.equal(canvas.height, Math.round(320 * rows / columns * 2));
  assertSeparate(canvas.context.rendered);
  assert.equal(environment.frames.size, 0);
  element.disconnectedCallback();
});

test('zero-width containers can be revealed and attribute numbers are normalized', () => {
  const { element, canvas, accessibleText } = mount({ 'max-columns': '34.5', radius: 'nonsense' }, 0);
  assert.equal(canvas.context.drawCount, 0);
  pointEvent(canvas, 'pointermove');
  assert.equal(environment.frames.size, 0);
  element.displayWidth = 640;
  assert.doesNotThrow(() => environment.observers.resize[0].notify());
  assert.equal(accessibleText.textContent, 'Robot');
  assert.ok(canvas.context.rendered.length > 0);
  assert.equal(canvas.context.rendered[0].radius, 0.45);
  assert.doesNotThrow(() => element.setAttribute('max-columns', '-100'));
  assert.doesNotThrow(() => element.setAttribute('radius', '999'));
  assert.equal(canvas.context.rendered[0].radius, 0.47);
  assertSeparate(canvas.context.rendered);
  element.disconnectedCallback();
});

test('empty and one-letter text retain a usable wide canvas on desktop and mobile', () => {
  for (const width of [800, 320]) {
    const { element, canvas, accessibleText } = mount({}, width);
    for (const text of ['', 'I', 'a']) {
      element.text = text;
      assert.equal(accessibleText.textContent, text);
      assert.ok(canvas.context.rendered.length > 0, 'the background field remains visible');
      assert.ok(canvas.height <= canvas.width / 2,
        'short or cleared input should preserve a wide field rather than become a tall narrow canvas');
      assert.equal(environment.frames.size, 0);
    }
    element.disconnectedCallback();
  }
});

test('multiple elements animate independently and refresh redraws the public component', () => {
  const first = mount();
  const second = mount({ text: 'Play' });
  const still = second.canvas.context.rendered;
  const secondDrawCount = second.canvas.context.drawCount;
  pointEvent(first.canvas, 'pointermove');
  environment.advance(10);
  assert.equal(second.canvas.context.drawCount, secondDrawCount);
  assert.deepEqual(second.canvas.context.rendered, still);
  second.element.displayWidth = 600;
  second.element.refresh();
  assert.equal(second.canvas.width, 600);
  assert.ok(second.canvas.context.drawCount > secondDrawCount);
  first.element.disconnectedCallback();
  second.element.disconnectedCallback();
  assert.equal(environment.frames.size, 0);
});

test('mode switches between the cutout field and glyph dots, including an empty letter mode', () => {
  const { element, canvas, accessibleText } = mount();
  const cutout = canvas.context.rendered;
  const layout = createDotLayout('Robot', { minColumns: 32, align: 'center', mode: 'letters' });
  element.setAttribute('mode', 'letters');
  assert.equal(canvas.context.rendered.length, 69);
  assert.deepEqual(canvas.context.rendered.map(({ x, y }) => ({ x, y })), layout.points.map(({ x, y }) => ({ x, y })));
  assert.equal(accessibleText.textContent, 'Robot');
  element.text = '';
  assert.deepEqual(canvas.context.rendered, []);
  pointEvent(canvas, 'pointermove');
  environment.advance();
  assert.equal(environment.frames.size, 0, 'empty letter mode sleeps immediately');
  element.text = 'Robot';
  element.removeAttribute('mode');
  assert.deepEqual(canvas.context.rendered, cutout);
  element.setAttribute('mode', 'unrecognized');
  assert.deepEqual(canvas.context.rendered, cutout);
  element.disconnectedCallback();
});

test('connection attributes render only original neighbors and follow the moving endpoints', () => {
  const { element, canvas } = mount({ text: 'A\nB', connect: 'vertical', radius: '0.12' });
  const layout = createDotLayout('A\nB', { minColumns: 32, align: 'center', connect: 'vertical' });
  assert.equal(canvas.context.links.length, layout.connections.length);
  layout.connections.forEach(({ from, to }, index) => {
    assert.deepEqual(canvas.context.links[index].from, { x: layout.points[from].x, y: layout.points[from].y });
    assert.deepEqual(canvas.context.links[index].to, { x: layout.points[to].x, y: layout.points[to].y });
    assert.equal(canvas.context.links[index].lineWidth, 0.24);
    assert.equal(canvas.context.links[index].lineCap, 'round');
  });
  const home = canvas.context.rendered;
  pointEvent(canvas, 'pointermove', home.find(circle => circle.y > 3));
  environment.advance(30);
  assert.ok(greatestDisplacement(home, canvas.context.rendered) > 0.05);
  assert.ok(canvas.context.links.length < layout.connections.length,
    'the hover stretch breaks a long connection instead of spanning the field');
  let drawn = 0;
  layout.connections.forEach(({ from, to }) => {
    const start = canvas.context.rendered[from];
    const end = canvas.context.rendered[to];
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    if (distance >= 1.9) return;
    const link = canvas.context.links[drawn++];
    assert.deepEqual(link.from, { x: start.x, y: start.y });
    assert.deepEqual(link.to, { x: end.x, y: end.y });
    assert.ok(link.alpha > 0 && link.alpha <= 1);
    assert.equal(link.alpha, Math.min(1, Math.max(0, (1.9 - distance) / 0.55)));
  });
  assert.equal(drawn, canvas.context.links.length);
  element.setAttribute('connect', 'horizontal');
  assert.ok(canvas.context.links.length > 0);
  for (const link of canvas.context.links) {
    assert.equal(link.to.y, link.from.y);
    assert.equal(link.to.x - link.from.x, 1);
  }
  element.setAttribute('connect', 'diagonal');
  assert.deepEqual(canvas.context.links, []);
  element.removeAttribute('connect');
  assert.deepEqual(canvas.context.links, []);
  element.disconnectedCallback();
});

test('outline dots are hollow, strokes stay inside the collision radius, and links stop at circle edges', () => {
  const { element, canvas } = mount({ 'dot-style': 'outline', 'dot-color': '#ffcc00', connect: 'vertical', radius: '0.47' });
  assert.deepEqual(canvas.context.fills, [], 'outline mode never fills circle interiors');
  const circleStroke = canvas.context.strokes.at(-1);
  assert.equal(circleStroke.color, '#ffcc00');
  assert.equal(circleStroke.lineWidth, 0.47 * 0.24);
  for (const circle of circleStroke.circles) {
    assert.ok(Math.abs(circle.radius + circleStroke.lineWidth / 2 - 0.47) < 1e-12);
    assert.ok(circle.radius - circleStroke.lineWidth / 2 > 0, 'ring has an empty center');
  }
  const layout = createDotLayout('Robot', { minColumns: 32, align: 'center', connect: 'vertical' });
  layout.connections.forEach(({ from, to }, index) => {
    const start = layout.points[from];
    const end = layout.points[to];
    const link = canvas.context.links[index];
    assert.equal(link.lineCap, 'butt');
    assert.ok(Math.abs(Math.hypot(link.from.x - start.x, link.from.y - start.y) - 0.47) < 1e-12);
    assert.ok(Math.abs(Math.hypot(link.to.x - end.x, link.to.y - end.y) - 0.47) < 1e-12);
    assert.ok(Math.hypot(link.to.x - link.from.x, link.to.y - link.from.y) > 0);
  });
  assertSeparate(canvas.context.rendered);
  element.removeAttribute('dot-style');
  assert.equal(canvas.context.fills.length, 1);
  element.setAttribute('dot-style', 'unrecognized');
  assert.equal(canvas.context.fills.length, 1);
  element.disconnectedCallback();
});

test('size extremes keep solid and outline circles separate during hover in both lettering modes', () => {
  for (const mode of ['cutout', 'letters']) {
    for (const radius of [0.12, 0.47]) {
      for (const style of ['solid', 'outline']) {
        const { element, canvas } = mount({ mode, radius, 'dot-style': style,
          connect: style === 'solid' ? 'vertical' : 'horizontal', strength: '120' });
        const home = canvas.context.rendered;
        assert.ok(home.length > 0);
        assert.ok(home.every(circle => Math.abs(circle.radius - radius) < 1e-12));
        let displacement = 0;
        for (let frame = 0; frame < 45; frame += 1) {
          const target = home[(frame * 7) % home.length];
          pointEvent(canvas, 'pointermove', target);
          environment.advance(1);
          assertSeparate(canvas.context.rendered);
          displacement = Math.max(displacement, greatestDisplacement(home, canvas.context.rendered));
        }
        assert.ok(displacement > 0.01, `${mode}/${radius}/${style} moves visibly`);
        pointEvent(canvas, 'pointerleave');
        environment.settle();
        assert.ok(greatestDisplacement(home, canvas.context.rendered) < 1e-6);
        element.disconnectedCallback();
      }
    }
  }
  const { element, canvas } = mount({ radius: '-100' });
  assert.equal(canvas.context.rendered[0].radius, 0.12, 'values below the size range clamp');
  element.disconnectedCallback();
});

test('native same-value attribute callbacks keep the current drawing and running motion intact', () => {
  const { element, canvas } = mount({ connect: 'vertical', 'dot-style': 'outline', mode: 'letters' });
  const home = canvas.context.rendered;
  pointEvent(canvas, 'pointermove', home[0]);
  environment.advance(12);
  const moving = canvas.context.rendered;
  const draws = canvas.context.drawCount;
  assert.ok(greatestDisplacement(home, moving) > 0.01);
  for (const name of ['connect', 'dot-style', 'mode']) {
    element.attributeChangedCallback(name, element.getAttribute(name), element.getAttribute(name));
  }
  assert.equal(canvas.context.drawCount, draws, 'same-value callbacks do not redraw or reset particles');
  assert.deepEqual(canvas.context.rendered, moving);
  assert.equal(environment.frames.size, 1, 'current animation remains scheduled');
  element.disconnectedCallback();
});
