import test from 'node:test';
import assert from 'node:assert/strict';
import { DotPhysics } from '../physics.mjs';

function layout(columns, rows, radius, spacing, padding = radius + 2) {
  const points = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      points.push({ x: padding + column * spacing, y: padding + row * spacing });
    }
  }
  return {
    points,
    width: padding * 2 + (columns - 1) * spacing,
    height: padding * 2 + (rows - 1) * spacing,
  };
}

// Deliberately independent of the engine's spatial hash and projection solver.
function assertSafe(engine) {
  const minimumSquared = engine.minimumDistance ** 2;
  for (let index = 0; index < engine.particles.length; index += 1) {
    const particle = engine.particles[index];
    for (const property of ['x', 'y', 'vx', 'vy']) {
      assert.ok(Number.isFinite(particle[property]), `${index}.${property} is finite`);
    }
    assert.ok(particle.x >= engine.radius && particle.x <= engine.width - engine.radius, 'inside horizontal bounds');
    assert.ok(particle.y >= engine.radius && particle.y <= engine.height - engine.radius, 'inside vertical bounds');
    for (let otherIndex = index + 1; otherIndex < engine.particles.length; otherIndex += 1) {
      const other = engine.particles[otherIndex];
      const dx = other.x - particle.x;
      const dy = other.y - particle.y;
      assert.ok(dx * dx + dy * dy >= minimumSquared, `dots ${index} and ${otherIndex} keep their separation`);
    }
  }
}

function displacedCount(engine, threshold = 0.2) {
  return engine.particles.filter(particle => Math.hypot(particle.x - particle.homeX, particle.y - particle.homeY) > threshold).length;
}

test('rejects impossible home layouts and invalid options before any frame can be drawn', () => {
  assert.throws(() => new DotPhysics([{ x: 10, y: 10 }, { x: 11, y: 10 }], 5, { width: 40, height: 40 }), /home circles/);
  assert.throws(() => new DotPhysics([{ x: 0, y: 0 }], 5, { width: 40, height: 40 }), /home circles/);
  assert.throws(() => new DotPhysics([{ x: NaN, y: 10 }], 5), /finite/);
  assert.throws(() => new DotPhysics([], 0), /radius/);
  assert.throws(() => new DotPhysics([], 5, { gap: -1 }), /gap/);
  const empty = new DotPhysics([], 5, { width: 20, height: 20 });
  assert.equal(empty.step(1 / 60), false);
});

test('hover sweeps produce local motion and keep every circle separate on every frame', () => {
  const initial = layout(22, 13, 5, 11.2);
  const engine = new DotPhysics(initial.points, 5, initial);
  let maximumDisplaced = 0;
  for (let frame = 0; frame < 260; frame += 1) {
    const progress = frame / 259;
    engine.setPointer(15 + progress * (initial.width - 30), initial.height / 2 + Math.sin(progress * Math.PI * 4) * 22);
    engine.step([1 / 60, 1 / 120, 1 / 30][frame % 3]);
    assertSafe(engine);
    maximumDisplaced = Math.max(maximumDisplaced, displacedCount(engine));
  }
  assert.ok(maximumDisplaced > 6, 'hover visibly moves multiple dots');
  assert.ok(maximumDisplaced < engine.particles.length, 'motion remains local');
});

test('over one thousand dots remain safe with large forces, direct hits and long frame gaps', () => {
  const initial = layout(41, 27, 3, 6.8);
  const engine = new DotPhysics(initial.points, 3, {
    ...initial,
    pointerStrength: 1e12,
    maxSpeed: 1e9,
    solverIterations: 2,
  });
  for (let frame = 0; frame < 80; frame += 1) {
    const target = engine.particles[(frame * 97) % engine.particles.length];
    engine.setPointer(target.x, target.y);
    engine.step(frame % 9 === 0 ? 300 : 1 / 60);
    assertSafe(engine);
  }
  assert.ok(engine.stats.fallbacks > 0, 'stress exercised the swept collision fallback');
  engine.step(NaN);
  engine.step(Infinity);
  engine.setPointer(NaN, Infinity);
  assert.equal(engine.pointer.active, false);
  assertSafe(engine);
});

test('a tightly packed bounded grid never overlaps even when the projection solver cannot finish', () => {
  const initial = layout(18, 12, 4, 8, 4);
  const engine = new DotPhysics(initial.points, 4, {
    ...initial, gap: 0, pointerStrength: 1e8, solverIterations: 1,
  });
  for (let frame = 0; frame < 100; frame += 1) {
    engine.setPointer((frame * 31) % initial.width, (frame * 19) % initial.height);
    engine.step(1 / 60);
    assertSafe(engine);
  }
  assert.ok(engine.stats.fallbacks > 0);
});

test('dots return exactly to their homes and sleep after pointer exit', () => {
  const initial = layout(17, 10, 5, 11.7);
  const engine = new DotPhysics(initial.points, 5, initial);
  engine.setPointer(initial.width / 2, initial.height / 2);
  for (let frame = 0; frame < 90; frame += 1) engine.step(1 / 60);
  assert.ok(displacedCount(engine) > 6);
  engine.clearPointer();
  let moving = true;
  for (let frame = 0; frame < 1200 && moving; frame += 1) {
    moving = engine.step(1 / 60);
    assertSafe(engine);
  }
  assert.equal(moving, false, 'eventually stops requesting animation frames');
  for (const particle of engine.particles) {
    assert.equal(particle.x, particle.homeX);
    assert.equal(particle.y, particle.homeY);
    assert.equal(particle.vx, 0);
    assert.equal(particle.vy, 0);
  }
});

test('reset and changing bounds preserve a valid layout, and shrinking is atomic', () => {
  const initial = layout(9, 6, 5, 12);
  const engine = new DotPhysics(initial.points, 5, initial);
  engine.setPointer(35, 35);
  for (let frame = 0; frame < 25; frame += 1) engine.step(1 / 60);
  assert.ok(displacedCount(engine) > 0);
  assert.throws(() => engine.setBounds(15, 15), /home circle/);
  assert.equal(engine.width, initial.width);
  assertSafe(engine);
  engine.setBounds(initial.width + 100, initial.height + 100);
  assertSafe(engine);
  assert.equal(engine.step(1 / 60), false);
  assert.equal(engine.pointer.active, false);
});
