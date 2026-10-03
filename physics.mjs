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
