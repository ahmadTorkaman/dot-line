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
