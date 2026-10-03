/*! Dot Line v1.1.1
MIT License

Copyright (c) 2026 kraft contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/**
 * A small bitmap alphabet for letters in a regular field of circles.
 * A 1 is a letter stroke; a 0 is background. Cutout mode occupies the 0 cells,
 * while letters mode occupies the 1 cells.
 * Each glyph shares baseline row 6. Lowercase descenders extend to row 8.
 * No font files, canvas rasterization, or browser APIs are required.
 */

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export const FONT_METRICS = Object.freeze({
  capHeight: 7,
  xHeight: 5,
  baseline: 6,
  descenderHeight: 2,
});

const patterns = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['1000001', '1100011', '1010101', '1001001', '1000001', '1000001', '1000001'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['1000001', '1000001', '1000001', '1001001', '1010101', '1100011', '1000001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],

  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  b: ['10000', '10000', '10110', '11001', '10001', '10001', '11110'],
  c: ['00000', '00000', '01111', '10000', '10000', '10000', '01111'],
  d: ['00001', '00001', '01101', '10011', '10001', '10001', '01111'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111'],
  f: ['00110', '01001', '01000', '11100', '01000', '01000', '01000'],
  g: ['00000', '00000', '01111', '10001', '10001', '10001', '01111', '00001', '01110'],
  h: ['10000', '10000', '10110', '11001', '10001', '10001', '10001'],
  i: ['010', '000', '110', '010', '010', '010', '111'],
  j: ['001', '000', '011', '001', '001', '001', '001', '101', '010'],
  k: ['10000', '10000', '10001', '10010', '11100', '10010', '10001'],
  l: ['110', '010', '010', '010', '010', '010', '011'],
  m: ['0000000', '0000000', '1101100', '1010010', '1010010', '1010010', '1010010'],
  n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  p: ['00000', '00000', '11110', '10001', '10001', '10001', '11110', '10000', '10000'],
  q: ['00000', '00000', '01111', '10001', '10001', '10001', '01111', '00001', '00001'],
  r: ['0000', '0000', '1011', '1100', '1000', '1000', '1000'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  t: ['0100', '0100', '1111', '0100', '0100', '0100', '0011'],
  u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
  v: ['00000', '00000', '10001', '10001', '10001', '01010', '00100'],
  w: ['0000000', '0000000', '1000001', '1001001', '1010101', '1010101', '0100010'],
  x: ['00000', '00000', '10001', '01010', '00100', '01010', '10001'],
  y: ['00000', '00000', '10001', '10001', '10001', '10001', '01111', '00001', '01110'],
  z: ['00000', '00000', '11111', '00010', '00100', '01000', '11111'],

  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['010', '110', '010', '010', '010', '010', '111'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  '.': ['0', '0', '0', '0', '0', '0', '1'],
  ',': ['00', '00', '00', '00', '00', '00', '01', '01', '10'],
  ':': ['0', '0', '1', '0', '0', '1', '0'],
  ';': ['00', '00', '01', '00', '00', '00', '01', '01', '10'],
  '!': ['1', '1', '1', '1', '1', '0', '1'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '-': ['000', '000', '000', '111', '000', '000', '000'],
  '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
  '(': ['001', '010', '100', '100', '100', '010', '001'],
  ')': ['100', '010', '001', '001', '001', '010', '100'],
  "'": ['1', '1', '0', '0', '0', '0', '0'],
  '"': ['101', '101', '000', '000', '000', '000', '000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '@': ['01110', '10001', '10111', '10101', '10111', '10000', '01111'],
};

/** Read-only glyph records. rows is a read-only array of binary strings. */
export const GLYPHS = Object.freeze(Object.fromEntries(
  Object.entries(patterns).map(([character, rows]) => [character, Object.freeze({
    rows: Object.freeze(rows),
    width: rows[0].length,
    height: rows.length,
  })]),
));

function integerOption(value, name, fallback, minimum = 0) {
  const result = value ?? fallback;
  if (!Number.isInteger(result) || result < minimum) {
    throw new RangeError(`${name} must be an integer of at least ${minimum}.`);
  }
  return result;
}

function glyphFor(character) {
  return GLYPHS[character] ?? GLYPHS['?'];
}

function lineWidth(characters, letterSpacing) {
  return characters.reduce((sum, character) => sum + glyphFor(character).width, 0)
    + Math.max(0, characters.length - 1) * letterSpacing;
}

function trimEndSpaces(characters) {
  let end = characters.length;
  while (end > 0 && characters[end - 1] === ' ') end -= 1;
  return characters.slice(0, end);
}

function wrapLine(characters, limit, letterSpacing) {
  if (lineWidth(characters, letterSpacing) <= limit) return [characters];
  const result = [];
  let current = [];
  for (const character of characters) {
    if (glyphFor(character).width > limit) {
      throw new RangeError('maxColumns is too small to fit a glyph and the margins.');
    }
    if (lineWidth([...current, character], letterSpacing) > limit && current.length) {
      const lastSpace = current.lastIndexOf(' ');
      if (lastSpace > 0) {
        result.push(trimEndSpaces(current.slice(0, lastSpace)));
        current = current.slice(lastSpace + 1);
      } else {
        result.push(trimEndSpaces(current));
        current = [];
      }
      if (lineWidth([...current, character], letterSpacing) > limit && current.length) {
        result.push(trimEndSpaces(current));
        current = [];
      }
      if (character === ' ' && current.length === 0) continue;
    }
    current.push(character);
  }
  result.push(current);
  return result;
}

/**
 * Build a rectangular circle field with cutout or dotted lettering.
 *
 * @param {string} text Case-sensitive text. Newlines make new lines; unsupported
 * characters use ?. Tabs become two spaces and CRLF becomes a single newline.
 * @param {object} [options]
 * @param {number} [options.pitch=1] Distance between neighboring circle centers.
 * @param {number} [options.margin=2] Whole grid cells surrounding the text.
 * `padding` is an alias for margin; margin takes precedence if both are supplied.
 * @param {number} [options.letterSpacing=1] Empty grid columns between glyphs.
 * @param {number} [options.lineSpacing=3] Empty grid rows between text lines.
 * @param {number} [options.maxColumns] Optional total column limit, including
 * margins. Wrapping prefers spaces; words wider than the limit split by glyph.
 * @param {number} [options.minColumns] Optional minimum field width, including
 * margins. Extra background columns follow align; maxColumns caps this minimum.
 * @param {'left'|'center'|'right'} [options.align='left'] Line alignment.
 * @param {'cutout'|'letters'} [options.mode='cutout'] Which cells contain dots.
 * @param {'none'|'vertical'|'horizontal'} [options.connect='none'] Link original
 * neighboring occupied cells on one axis. Links never jump empty cells or cross
 * from one text line to another, even when lineSpacing is zero.
 * @returns {{points: Array<{x:number,y:number,column:number,row:number}>,
 * width:number,height:number,columns:number,rows:number,pitch:number,
 * aspectRatio:number,text:string,glyphCount:number,lineCount:number,
 * mask:string[],lines:Array<{text:string,width:number,height:number,
 * startColumn:number,startRow:number}>,connections:Array<{from:number,to:number}>}}
 * Coordinates are cell centers, so radius <= pitch / 2 starts without overlaps.
 * width / height describe the field edges, rather than the outermost centers.
 */
export function createDotLayout(text = 'Robot', options = {}) {
  const pitch = options.pitch ?? 1;
  if (!Number.isFinite(pitch) || pitch <= 0) {
    throw new RangeError('pitch must be a finite positive number.');
  }
  const margin = integerOption(options.margin ?? options.padding, 'margin', 2);
  const letterSpacing = integerOption(options.letterSpacing, 'letterSpacing', 1);
  const lineSpacing = integerOption(options.lineSpacing, 'lineSpacing', 3);
  const align = options.align ?? 'left';
  if (!['left', 'center', 'right'].includes(align)) {
    throw new RangeError('align must be left, center, or right.');
  }
  const mode = options.mode ?? 'cutout';
  if (!['cutout', 'letters'].includes(mode)) {
    throw new RangeError('mode must be cutout or letters.');
  }
  const connect = options.connect ?? 'none';
  if (!['none', 'vertical', 'horizontal'].includes(connect)) {
    throw new RangeError('connect must be none, vertical, or horizontal.');
  }
  const maxColumns = options.maxColumns === undefined
    ? Infinity
    : integerOption(options.maxColumns, 'maxColumns', 1, margin * 2 + 1);
  const minColumns = Math.min(maxColumns, integerOption(
    options.minColumns, 'minColumns', margin * 2 + 1, margin * 2 + 1,
  ));
  const normalizedText = String(text ?? '').replace(/\r\n?/g, '\n').replace(/\t/g, '  ');
  const characterLines = normalizedText.split('\n').flatMap((line) => (
    wrapLine(Array.from(line), maxColumns - margin * 2, letterSpacing)
  ));
  const lines = characterLines.map((characters) => ({
    characters,
    text: characters.join(''),
    width: lineWidth(characters, letterSpacing),
    height: Math.max(FONT_METRICS.capHeight, ...characters.map((c) => glyphFor(c).height)),
  }));
  const contentWidth = Math.max(1, minColumns - margin * 2, ...lines.map((line) => line.width));
  const columns = contentWidth + margin * 2;
  const rows = lines.reduce((sum, line) => sum + line.height, 0)
    + (lines.length - 1) * lineSpacing + margin * 2;
  const mask = Array.from({ length: rows }, () => Array(columns).fill('0'));
  let top = margin;
  for (const line of lines) {
    const spareColumns = contentWidth - line.width;
    const offset = align === 'right' ? spareColumns
      : align === 'center' ? Math.floor(spareColumns / 2) : 0;
    let left = margin + offset;
    line.startColumn = left;
    line.startRow = top;
    for (const character of line.characters) {
      const glyph = glyphFor(character);
      for (let row = 0; row < glyph.height; row += 1) {
        for (let column = 0; column < glyph.width; column += 1) {
          if (glyph.rows[row][column] === '1') mask[top + row][left + column] = '1';
        }
      }
      left += glyph.width + letterSpacing;
    }
    top += line.height + lineSpacing;
  }
  const points = [];
  const occupiedCell = mode === 'letters' ? '1' : '0';
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (mask[row][column] === occupiedCell) {
        points.push({ x: (column + 0.5) * pitch, y: (row + 0.5) * pitch, column, row });
      }
    }
  }
  const connections = [];
  if (connect !== 'none') {
    const cells = new Map(points.map((point, index) => [point.row * columns + point.column, index]));
    const rowLines = Array(rows).fill(-1);
    lines.forEach((line, index) => {
      // Include exterior margins in the first/last band, but keep dots in the
      // spacing between text lines unlinked. A zero spacing still has a seam.
      const start = index === 0 ? 0 : line.startRow;
      const end = index === lines.length - 1 ? rows : line.startRow + line.height;
      for (let row = start; row < end; row += 1) rowLines[row] = index;
    });
    points.forEach((point, from) => {
      const column = point.column + (connect === 'horizontal' ? 1 : 0);
      const row = point.row + (connect === 'vertical' ? 1 : 0);
      if (column >= columns || row >= rows || rowLines[point.row] < 0
        || rowLines[point.row] !== rowLines[row]) return;
      const to = cells.get(row * columns + column);
      if (to !== undefined) connections.push({ from, to });
    });
  }
  return {
    points,
    connections,
    width: columns * pitch,
    height: rows * pitch,
    columns,
    rows,
    pitch,
    aspectRatio: columns / rows,
    text: normalizedText,
    glyphCount: characterLines.reduce((count, line) => count + line.filter((c) => c !== ' ').length, 0),
    lineCount: lines.length,
    mask: mask.map((row) => row.join('')),
    lines: lines.map(({ characters, ...line }) => line),
  };
}


/**
 * Small, dependency-free circle simulation. Coordinates, radius and pointer use
 * the same unit (CSS pixels in the website component).
 *
 * The home arrangement must fit the bounds and contain no overlapping circles.
 * Consumers should read `particles`, and use the methods to change the state.
 */
export class DotPhysics {
  constructor(points, radius, options = {}) {
    if (!Array.isArray(points)) throw new TypeError('points must be an array');
    this.radius = positive(radius, 'radius');
    this.gap = nonnegative(options.gap ?? radius * 0.06, 'gap');
    this.minimumDistance = radius * 2 + this.gap;
    if (!Number.isFinite(this.minimumDistance ** 2)) {
      throw new RangeError('radius and gap are too large');
    }
    this.pointerRadius = positive(options.pointerRadius ?? radius * 6, 'pointerRadius');
    this.pointerStrength = nonnegative(options.pointerStrength ?? radius * 180, 'pointerStrength');
    this.spring = positive(options.spring ?? 45, 'spring');
    this.damping = nonnegative(options.damping ?? 13, 'damping');
    this.maxSpeed = positive(options.maxSpeed ?? radius * 18, 'maxSpeed');
    this.solverIterations = Math.max(1, Math.min(40, Math.round(
      positive(options.solverIterations ?? 10, 'solverIterations'),
    )));
    this.particles = points.map((point, index) => {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw new TypeError(`point ${index} must have finite x and y coordinates`);
      }
      return { x: point.x, y: point.y, homeX: point.x, homeY: point.y, vx: 0, vy: 0 };
    });
    this.width = positive(options.width ?? points.reduce((width, point) => Math.max(width, point.x + radius), radius * 2), 'width');
    this.height = positive(options.height ?? points.reduce((height, point) => Math.max(height, point.y + radius), radius * 2), 'height');
    this.pointer = { x: 0, y: 0, active: false };
    this.stats = { steps: 0, fallbacks: 0, lastIterations: 0 };
    this._cellSize = this.minimumDistance;
    this._columns = Math.floor(this.width / this._cellSize) + 3;
    this._separationSquared = this.minimumDistance ** 2;
    this._padding = Math.max(1e-7, radius * 1e-5);
    this._previous = new Float64Array(points.length * 2);
    this._targets = new Float64Array(points.length * 2);
    this._frame = 0;
    if (!this._validBounds(this.width, this.height) || !this._isValid()) {
      throw new RangeError('home circles must fit within the bounds and be separated by 2 * radius + gap');
    }
  }

  setPointer(x, y, active = true) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      this.clearPointer();
      return this;
    }
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.active = Boolean(active);
    return this;
  }

  clearPointer() {
    this.pointer.active = false;
    return this;
  }

  reset() {
    for (const particle of this.particles) {
      particle.x = particle.homeX;
      particle.y = particle.homeY;
      particle.vx = 0;
      particle.vy = 0;
    }
    this.clearPointer();
    return this;
  }

  /** Change the simulation bounds without scaling the home layout. */
  setBounds(width, height) {
    positive(width, 'width');
    positive(height, 'height');
    if (!this._validBounds(width, height)) {
      throw new RangeError('new bounds must contain every home circle');
    }
    this.width = width;
    this.height = height;
    this._columns = Math.floor(width / this._cellSize) + 3;
    this.reset();
    return this;
  }

  /**
   * Advance by seconds; returns whether another animation frame is useful.
   * Long gaps (for example, an inactive tab) are capped at 50ms. Substeps and
   * displacement limits prevent dots jumping through one another.
   */
  step(deltaSeconds) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0 || !this.particles.length) {
      return this._hasMotion();
    }
    const seconds = Math.min(deltaSeconds, 0.05);
    const count = Math.ceil(seconds / (1 / 120));
    const dt = seconds / count;
    let affectedByPointer = false;
    for (let substep = 0; substep < count; substep += 1) {
      affectedByPointer = this._advance(dt) || affectedByPointer;
    }
    if (!affectedByPointer && this._canSleep()) {
      // The validated home layout makes this final tiny settling step safe.
      for (const particle of this.particles) {
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.vx = 0;
        particle.vy = 0;
      }
      return false;
    }
    return this._hasMotion();
  }

  _advance(dt) {
    const damping = Math.exp(-this.damping * dt);
    const maxMovement = this.radius * 0.35;
    const maxAcceleration = this.radius * 100000;
    let affectedByPointer = false;
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      this._previous[index * 2] = particle.x;
      this._previous[index * 2 + 1] = particle.y;
      let ax = (particle.homeX - particle.x) * this.spring;
      let ay = (particle.homeY - particle.y) * this.spring;
      if (this.pointer.active && this.pointerStrength > 0) {
        let dx = particle.x - this.pointer.x;
        let dy = particle.y - this.pointer.y;
        let distance = Math.hypot(dx, dy);
        const pointerDistance = distance;
        if (pointerDistance < this.pointerRadius) {
          affectedByPointer = true;
          if (distance < 1e-9) {
            // Deterministic direction for a pointer exactly on a dot's center.
            const angle = index * 2.399963229728653 + 0.7;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const falloff = Math.max(0, 1 - pointerDistance / this.pointerRadius);
          const force = this.pointerStrength * falloff * falloff;
          ax += dx / distance * force;
          ay += dy / distance * force;
        }
      }
      particle.vx = (particle.vx + bounded(ax, maxAcceleration) * dt) * damping;
      particle.vy = (particle.vy + bounded(ay, maxAcceleration) * dt) * damping;
      limitVelocity(particle, Math.min(this.maxSpeed, maxMovement / dt));
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      this._clamp(particle);
    }

    this._projectCollisions();
    if (!this._isValid()) {
      // A crowded layout can defeat a fixed number of projection iterations.
      // Start from the previous valid state, then clip each proposed movement
      // against swept circle contacts. An unsolved overlap is never rendered.
      this.stats.fallbacks += 1;
      this._safeFallback(maxMovement);
    }

    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      particle.vx = (particle.x - this._previous[index * 2]) / dt;
      particle.vy = (particle.y - this._previous[index * 2 + 1]) / dt;
      limitVelocity(particle, this.maxSpeed);
    }
    this.stats.steps += 1;
    this._frame += 1;
    return affectedByPointer;
  }

  _projectCollisions() {
    const targetDistance = this.minimumDistance + this._padding;
    const targetSquared = targetDistance * targetDistance;
    this.stats.lastIterations = 0;
    for (let iteration = 0; iteration < this.solverIterations; iteration += 1) {
      const grid = this._makeGrid();
      let corrected = false;
      for (let index = 0; index < this.particles.length; index += 1) {
        const particle = this.particles[index];
        const cellX = Math.floor(particle.x / this._cellSize);
        const cellY = Math.floor(particle.y / this._cellSize);
        for (let ox = -1; ox <= 1; ox += 1) {
          for (let oy = -1; oy <= 1; oy += 1) {
            const bucket = grid.get(this._key(cellX + ox, cellY + oy));
            if (!bucket) continue;
            for (const neighbourIndex of bucket) {
              if (neighbourIndex <= index) continue;
              const neighbour = this.particles[neighbourIndex];
              let dx = neighbour.x - particle.x;
              let dy = neighbour.y - particle.y;
              const squared = dx * dx + dy * dy;
              if (squared >= targetSquared) continue;
              let distance = Math.sqrt(squared);
              if (distance < 1e-9) {
                const angle = (index + neighbourIndex) * 2.399963229728653;
                dx = Math.cos(angle);
                dy = Math.sin(angle);
                distance = 1;
              }
              const correction = (targetDistance - Math.sqrt(squared)) * 0.5;
              const moveX = dx / distance * correction;
              const moveY = dy / distance * correction;
              particle.x -= moveX;
              particle.y -= moveY;
              neighbour.x += moveX;
              neighbour.y += moveY;
              this._clamp(particle);
              this._clamp(neighbour);
              corrected = true;
            }
          }
        }
      }
      this.stats.lastIterations = iteration + 1;
      if (!corrected) break;
    }
  }

  _safeFallback(maxMovement) {
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      this._targets[index * 2] = particle.x;
      this._targets[index * 2 + 1] = particle.y;
      particle.x = this._previous[index * 2];
      particle.y = this._previous[index * 2 + 1];
    }
    const grid = this._makeGrid(true);
    const reverse = this._frame % 2;
    for (let order = 0; order < this.particles.length; order += 1) {
      const index = reverse ? this.particles.length - order - 1 : order;
      const particle = this.particles[index];
      const startX = particle.x;
      const startY = particle.y;
      let dx = this._targets[index * 2] - startX;
      let dy = this._targets[index * 2 + 1] - startY;
      const movement = Math.hypot(dx, dy);
      if (movement <= 1e-12) continue;
      if (movement > maxMovement) {
        dx *= maxMovement / movement;
        dy *= maxMovement / movement;
      }
      const neighbours = this._segmentNeighbours(grid, startX, startY, startX + dx, startY + dy);
      let fraction = 1;
      const a = dx * dx + dy * dy;
      for (const neighbourIndex of neighbours) {
        if (neighbourIndex === index) continue;
        const neighbour = this.particles[neighbourIndex];
        const px = startX - neighbour.x;
        const py = startY - neighbour.y;
        const b = 2 * (px * dx + py * dy);
        if (b >= 0) continue;
        const c = Math.max(0, px * px + py * py - this._separationSquared);
        const discriminant = b * b - 4 * a * c;
        if (discriminant <= 0) continue;
        const contact = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (contact >= 0 && contact < fraction) {
          fraction = Math.max(0, contact * (1 - 1e-6));
        }
      }
      particle.x = startX + dx * fraction;
      particle.y = startY + dy * fraction;
      this._clamp(particle);
      // Independently check the clipped endpoint to account for floating-point
      // cancellation near contacts. Keeping the old position is always safe.
      for (const neighbourIndex of neighbours) {
        if (neighbourIndex === index) continue;
        const neighbour = this.particles[neighbourIndex];
        const nx = particle.x - neighbour.x;
        const ny = particle.y - neighbour.y;
        if (nx * nx + ny * ny < this._separationSquared) {
          particle.x = startX;
          particle.y = startY;
          break;
        }
      }
      const oldKey = this._key(Math.floor(startX / this._cellSize), Math.floor(startY / this._cellSize));
      const newKey = this._key(Math.floor(particle.x / this._cellSize), Math.floor(particle.y / this._cellSize));
      if (oldKey !== newKey) {
        grid.get(oldKey).delete(index);
        if (!grid.has(newKey)) grid.set(newKey, new Set());
        grid.get(newKey).add(index);
      }
    }
  }

  _segmentNeighbours(grid, x1, y1, x2, y2) {
    const result = [];
    const radius = this.minimumDistance;
    const minX = Math.floor((Math.min(x1, x2) - radius) / this._cellSize);
    const maxX = Math.floor((Math.max(x1, x2) + radius) / this._cellSize);
    const minY = Math.floor((Math.min(y1, y2) - radius) / this._cellSize);
    const maxY = Math.floor((Math.max(y1, y2) + radius) / this._cellSize);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const bucket = grid.get(this._key(x, y));
        if (bucket) result.push(...bucket);
      }
    }
    return result;
  }

  _makeGrid(useSets = false) {
    const grid = new Map();
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      const cell = this._key(Math.floor(particle.x / this._cellSize), Math.floor(particle.y / this._cellSize));
      let bucket = grid.get(cell);
      if (!bucket) {
        bucket = useSets ? new Set() : [];
        grid.set(cell, bucket);
      }
      if (useSets) bucket.add(index);
      else bucket.push(index);
    }
    return grid;
  }

  _isValid() {
    const grid = this._makeGrid();
    for (let index = 0; index < this.particles.length; index += 1) {
      const particle = this.particles[index];
      if (!Number.isFinite(particle.x) || !Number.isFinite(particle.y)
        || particle.x < this.radius || particle.y < this.radius
        || particle.x > this.width - this.radius || particle.y > this.height - this.radius) return false;
      const cellX = Math.floor(particle.x / this._cellSize);
      const cellY = Math.floor(particle.y / this._cellSize);
      for (let ox = -1; ox <= 1; ox += 1) {
        for (let oy = -1; oy <= 1; oy += 1) {
          const bucket = grid.get(this._key(cellX + ox, cellY + oy));
          if (!bucket) continue;
          for (const neighbourIndex of bucket) {
            if (neighbourIndex <= index) continue;
            const neighbour = this.particles[neighbourIndex];
            const dx = particle.x - neighbour.x;
            const dy = particle.y - neighbour.y;
            if (dx * dx + dy * dy < this._separationSquared) return false;
          }
        }
      }
    }
    return true;
  }

  _validBounds(width, height) {
    return width >= this.radius * 2 && height >= this.radius * 2
      && this.particles.every(particle => particle.homeX >= this.radius
        && particle.homeY >= this.radius && particle.homeX <= width - this.radius
        && particle.homeY <= height - this.radius);
  }

  _key(x, y) {
    // Two unused columns distinguish cells just outside the bounded rectangle.
    return (y + 1) * this._columns + x + 1;
  }

  _clamp(particle) {
    particle.x = Math.max(this.radius, Math.min(this.width - this.radius, particle.x));
    particle.y = Math.max(this.radius, Math.min(this.height - this.radius, particle.y));
  }

  _canSleep() {
    const positionTolerance = this.radius * 0.002;
    const speedTolerance = this.radius * 0.04;
    return this.particles.every(particle => Math.hypot(particle.x - particle.homeX, particle.y - particle.homeY) <= positionTolerance
      && Math.hypot(particle.vx, particle.vy) <= speedTolerance);
  }

  _hasMotion() {
    const tolerance = this.radius * 1e-5;
    return this.particles.some(particle => Math.abs(particle.x - particle.homeX) > tolerance
      || Math.abs(particle.y - particle.homeY) > tolerance
      || Math.abs(particle.vx) > tolerance || Math.abs(particle.vy) > tolerance);
  }
}

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number`);
  return value;
}

function nonnegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be a nonnegative finite number`);
  return value;
}

function bounded(value, maximum) {
  if (Number.isNaN(value)) return 0;
  return Math.max(-maximum, Math.min(maximum, value));
}

function limitVelocity(particle, maximum) {
  const speed = Math.hypot(particle.vx, particle.vy);
  if (speed > maximum) {
    particle.vx *= maximum / speed;
    particle.vy *= maximum / speed;
  }
}


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
