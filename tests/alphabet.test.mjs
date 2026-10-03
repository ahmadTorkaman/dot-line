import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, GLYPHS, FONT_METRICS, createDotLayout } from '../alphabet.mjs';

test('every upper/lowercase letter and digit has a valid, distinct glyph', () => {
  assert.equal(ALPHABET.length, 52);
  const masks = new Set();
  for (const character of ALPHABET + '0123456789') {
    const glyph = GLYPHS[character];
    assert.ok(glyph, `${character} exists`);
    assert.ok(glyph.height >= FONT_METRICS.capHeight);
    assert.ok(glyph.rows.every((row) => row.length === glyph.width && /^[01]+$/.test(row)));
    assert.ok(glyph.rows.some((row) => row.includes('1')));
    masks.add(glyph.rows.join('\n'));
    const layout = createDotLayout(character);
    assert.equal(layout.columns, glyph.width + 4);
    assert.equal(layout.rows, glyph.height + 4);
  }
  assert.equal(masks.size, 62, 'uppercase, lowercase, and digits have distinct patterns');
});

test('Robot keeps exact case, baseline, counters, and a complete grid of circles', () => {
  const layout = createDotLayout('Robot');
  assert.deepEqual(layout, createDotLayout('Robot'));
  assert.equal(layout.columns, 32);
  assert.equal(layout.rows, 11);
  assert.equal(layout.glyphCount, 5);
  assert.equal(layout.lineCount, 1);
  assert.equal(layout.points.length, 283);
  assert.deepEqual(layout.mask.slice(2, 9).map((row) => row.slice(2, -2)), [
    '1111000000001000000000000100',
    '1000100000001000000000000100',
    '1000100111001011000111001111',
    '1111001000101100101000100100',
    '1010001000101000101000100100',
    '1001001000101000101000100100',
    '1000100111001111000111000011',
  ]);
  const coordinates = new Set(layout.points.map(({ column, row }) => `${column},${row}`));
  assert.equal(coordinates.size, layout.points.length);
  // o's counter is occupied by background balls; its stroke is empty.
  assert.ok(coordinates.has('10,6'));
  assert.ok(!coordinates.has('8,6'));
  for (const point of layout.points) {
    assert.equal(layout.mask[point.row][point.column], '0');
    assert.equal(point.x, point.column + 0.5);
    assert.equal(point.y, point.row + 0.5);
  }
});

test('lowercase descenders extend below the shared baseline', () => {
  for (const character of 'gjpqy') {
    assert.equal(GLYPHS[character].height, 9);
    assert.ok(GLYPHS[character].rows[8].includes('1'));
  }
  for (const character of 'bdfhkl') {
    assert.ok(GLYPHS[character].rows[0].includes('1'));
  }
  assert.equal(createDotLayout('g\nA').rows, 23);
});

test('wrapping, alignment, and numeric pitch keep all circles on one grid', () => {
  const wrapped = createDotLayout('Robot Robot', { maxColumns: 36, pitch: 12, align: 'center' });
  assert.equal(wrapped.lineCount, 2);
  assert.deepEqual(wrapped.lines.map((line) => line.text), ['Robot', 'Robot']);
  assert.ok(wrapped.columns <= 36);
  assert.equal(wrapped.width, wrapped.columns * 12);
  assert.equal(wrapped.height, wrapped.rows * 12);
  assert.ok(wrapped.points.every((point) => point.x === (point.column + 0.5) * 12));
  const longWord = createDotLayout('ABCDEFG', { maxColumns: 16 });
  assert.deepEqual(longWord.lines.map((line) => line.text), ['AB', 'CD', 'EF', 'G']);
  assert.ok(longWord.columns <= 16);
  const centered = createDotLayout('ABCDE\nA', { align: 'center' });
  assert.equal(centered.lines[1].startColumn, 14);
});

test('whitespace, unknown characters, aliases, and invalid options are explicit', () => {
  assert.deepEqual(createDotLayout('🤖').mask, createDotLayout('?').mask);
  assert.equal(createDotLayout('A\r\nB\tC').text, 'A\nB  C');
  assert.deepEqual(createDotLayout('A', { margin: 3 }), createDotLayout('A', { padding: 3 }));
  const empty = createDotLayout('');
  assert.equal(empty.glyphCount, 0);
  assert.equal(empty.points.length, empty.columns * empty.rows);
  for (const options of [{ pitch: 0 }, { pitch: Infinity }, { margin: -1 }, { letterSpacing: 1.5 }, { align: 'top' }, { maxColumns: 5 }, { minColumns: 3 }, { minColumns: 7.5 }]) {
    assert.throws(() => createDotLayout('W', options), RangeError);
  }
});

test('minimum field width keeps empty and short text compact when scaled to a website', () => {
  const empty = createDotLayout('', { minColumns: 32 });
  assert.equal(empty.columns, 32);
  assert.equal(empty.rows, 11);
  assert.equal(empty.points.length, 32 * 11);
  const single = createDotLayout('A', { minColumns: 32, align: 'center' });
  assert.equal(single.columns, 32);
  assert.equal(single.rows, 11);
  assert.equal(single.lines[0].startColumn, 13);
  assert.equal(single.lines[0].startRow, 2);
  assert.ok(single.mask[2].slice(13, 18).includes('1'));
  assert.equal(createDotLayout('A', { minColumns: 32, maxColumns: 24 }).columns, 24);
  assert.equal(createDotLayout('A').columns, 9, 'natural width remains the default');
  const natural = createDotLayout('Robot Robot');
  assert.deepEqual(createDotLayout('Robot Robot', { minColumns: 32 }), natural);
});

test('letter and cutout modes occupy complementary cells without changing the glyph masks or bounds', () => {
  for (const text of ['Robot', 'gjpqy\nABC', 'ABC DEF', '']) {
    const cutout = createDotLayout(text, { maxColumns: 28, minColumns: 25, align: 'center' });
    const letters = createDotLayout(text, { maxColumns: 28, minColumns: 25, align: 'center', mode: 'letters' });
    assert.deepEqual(letters.mask, cutout.mask);
    assert.deepEqual(letters.lines, cutout.lines);
    assert.equal(letters.width, cutout.width);
    assert.equal(letters.height, cutout.height);
    assert.equal(letters.points.length + cutout.points.length, letters.rows * letters.columns);
    const cutoutCells = new Set(cutout.points.map(point => `${point.row},${point.column}`));
    for (const point of letters.points) {
      assert.equal(letters.mask[point.row][point.column], '1');
      assert.ok(!cutoutCells.has(`${point.row},${point.column}`));
    }
  }
  assert.throws(() => createDotLayout('A', { mode: 'inverse' }), /mode/);
});

test('vertical and horizontal connections use every eligible immediate neighbor and never jump a glyph gap', () => {
  for (const mode of ['cutout', 'letters']) {
    for (const connect of ['vertical', 'horizontal']) {
      const layout = createDotLayout('H H', { mode, connect, pitch: 2.5 });
      const cells = new Map(layout.points.map((point, index) => [`${point.row},${point.column}`, index]));
      const expected = [];
      layout.points.forEach((point, from) => {
        const row = point.row + (connect === 'vertical' ? 1 : 0);
        const column = point.column + (connect === 'horizontal' ? 1 : 0);
        const to = cells.get(`${row},${column}`);
        if (to !== undefined) expected.push({ from, to });
      });
      assert.deepEqual(layout.connections, expected);
      assert.ok(layout.connections.length > 0);
      for (const { from, to } of layout.connections) {
        const start = layout.points[from];
        const end = layout.points[to];
        assert.equal(Math.hypot(end.x - start.x, end.y - start.y), layout.pitch);
        assert.equal(layout.mask[start.row][start.column], layout.mask[end.row][end.column]);
      }
    }
  }
  assert.deepEqual(createDotLayout('Robot').connections, []);
  assert.throws(() => createDotLayout('Robot', { connect: 'diagonal' }), /connect/);
});

test('connection topology keeps separate text lines apart, including wrapped lines and zero row spacing', () => {
  for (const mode of ['cutout', 'letters']) {
    for (const lineSpacing of [0, 3]) {
      for (const connect of ['vertical', 'horizontal']) {
        const layout = createDotLayout('HHHH\nHH', { mode, connect, lineSpacing, maxColumns: 16 });
        assert.equal(layout.lineCount, 3);
        for (const { from, to } of layout.connections) {
          const start = layout.points[from];
          const end = layout.points[to];
          const band = point => layout.lines.findIndex((line, index) => {
            const first = index === 0 ? 0 : line.startRow;
            const last = index === layout.lines.length - 1 ? layout.rows : line.startRow + line.height;
            return point.row >= first && point.row < last;
          });
          assert.ok(band(start) >= 0);
          assert.equal(band(start), band(end));
        }
      }
    }
  }
});
