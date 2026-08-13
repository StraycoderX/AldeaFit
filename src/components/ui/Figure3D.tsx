/**
 * 3D technique figure.
 *
 * A hand-written renderer. The body is a real surface (see `anatomy.ts`), and
 * this shades it: every quad is projected, back-face culled, lit, sorted by
 * depth and filled. That is a small software rasteriser rather than a drawing,
 * which is the point — a lit surface has a near side, a far side and a
 * terminator between them, and it keeps having them as the figure turns. A flat
 * shape with a gradient painted across it reads as a cut-out the moment it
 * moves.
 *
 * Sorting per polygon rather than per limb is what makes an arm pass correctly
 * in front of a chest, and lets the barbell be a solid that a squat can put
 * behind the neck and a bench press in front of it.
 *
 * No 3D library. A WebGL engine plus a rigged model would dwarf the app and
 * would need either a CDN — which the CSP forbids — or a large binary asset.
 */

import { useEffect, useRef } from 'react';
import { poseAtPhase, type Technique, type Vec3 } from '@/lib/technique';
import { buildBarbell, buildBench, buildFigure, ringPoint, type Material } from '@/lib/anatomy';

interface Figure3DProps {
  technique: Technique;
  /** Holds the mid-rep pose instead of animating. */
  paused?: boolean;
  className?: string;
  label: string;
}

/** Redraw budget, in milliseconds. See the note in `draw`. */
const FRAME_INTERVAL = 1000 / 30 - 2;

const CAMERA_DISTANCE = 900;
const FOCAL = 940;

/**
 * Distance from the camera to a point, given its depth in camera space.
 *
 * The camera sits out at `+CAMERA_DISTANCE` looking back at the origin, so a
 * larger `cz` is *nearer* and projects larger. Getting this the wrong way round
 * is not a subtle bug: perspective inverts, the far plate on a barbell swells
 * to twice the size of the near one, and the depth sort hides everything in
 * front behind everything behind it.
 */
function distanceFromCamera(cz: number): number {
  return Math.max(1, CAMERA_DISTANCE - cz);
}

/**
 * Lighting, in camera space.
 *
 * The lights ride with the camera rather than with the world, so dragging the
 * figure round never swings it into its own shadow — the pose stays readable at
 * every angle, which for a technique diagram matters more than a fixed sun.
 */
const KEY_LIGHT = unit([-0.42, 0.66, 0.62]);
const FILL_LIGHT = unit([0.68, -0.12, 0.32]);
const RIM_TIGHTNESS = 3.4;
const RIM_COLOUR = [198, 214, 236] as const;

interface Lighting {
  ambient: number;
  key: number;
  fill: number;
  /**
   * Rim light along the silhouette. On a dark background this is what separates
   * the figure from the panel and reads as roundness at the edges.
   */
  rim: number;
}

const LIGHTING: Record<Material, Lighting> = {
  /** Full modelling contrast: the body is what the panel is there to show. */
  skin: { ambient: 0.34, key: 0.72, fill: 0.18, rim: 0.42 },
  /**
   * The barbell is lit much more flatly. Shaded like skin, a plate turned
   * side-on to the key light falls to a dull olive, and the brand colour is not
   * something to let a lighting model take away.
   */
  accent: { ambient: 0.74, key: 0.3, fill: 0.1, rim: 0.24 },
  /** The bench is scenery. It should read as solid and then be ignored. */
  equipment: { ambient: 0.5, key: 0.5, fill: 0.12, rim: 0.2 },
};

function unit(v: readonly [number, number, number]): readonly [number, number, number] {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** A vertex, in camera space and on screen. */
interface Vertex {
  cx: number;
  cy: number;
  cz: number;
  sx: number;
  sy: number;
}

interface Facet {
  depth: number;
  points: readonly Vertex[];
  material: Material;
  /**
   * Smoothed normal at each of the four corners, in the same order as `points`.
   *
   * Corners are shared with the neighbouring polygons, so shading one from its
   * own corners rather than from a single face normal is what removes the
   * faceting — and, because neighbours agree on the values at a shared edge,
   * removes the banding at every ring boundary too.
   */
  normals: readonly Normal[];
}

interface Normal {
  x: number;
  y: number;
  z: number;
}

/** `#rgb` or `#rrggbb` to channels, falling back if the token is anything else. */
function parseColour(value: string, fallback: readonly [number, number, number]) {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return fallback;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ] as const;
}

export function Figure3D({ technique, paused = false, className, label }: Figure3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(technique.defaultRotation);
  const draggedRef = useRef(false);
  const dragRef = useRef<{ x: number; rotation: number } | null>(null);

  // Adopt each lift's framing angle, unless the user has taken over the camera.
  useEffect(() => {
    if (!draggedRef.current) rotationRef.current = technique.defaultRotation;
  }, [technique.lift, technique.defaultRotation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let lastDrawn = -Infinity;
    const start = performance.now();

    const read = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const draw = (now: number) => {
      // A rep takes three and a half seconds. Nothing on screen moves fast
      // enough for the eye to tell 60 frames a second from 30, and rendering
      // the surface is the most expensive thing this app does — so it is drawn
      // at 30, which halves the work on every device and the battery cost on
      // the phone this is most likely to be running on, in a gym.
      if (now - lastDrawn < FRAME_INTERVAL) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDrawn = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) {
        frame = requestAnimationFrame(draw);
        return;
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const skin = parseColour(read('--text-secondary'), [155, 163, 174]);
      const accent = parseColour(read('--accent'), [202, 245, 58]);
      const dim = read('--border-strong') || '#333941';
      const equipment = parseColour(dim, [51, 57, 65]);

      const elapsed = paused ? 0 : (now - start) / 1000;
      const phase = technique.cycleSeconds > 0 ? (elapsed / technique.cycleSeconds) % 1 : 0;
      const pose = poseAtPhase(technique, paused ? 0.5 : phase);

      // Sample the surface in proportion to how big it is actually drawn. A
      // phone panel is a third the width of a desktop one and cannot resolve
      // the extra sides — and it is also the device that needs the polygons
      // back. Scaling with the panel rather than switching at a breakpoint
      // means a tablet, a split window and a full screen each get what they
      // can show.
      const detail = Math.min(1, Math.max(0.45, width / 620));
      const surfaces = buildFigure(pose, detail);
      if (technique.prop === 'bench') surfaces.push(...buildBench(pose, detail));
      if (technique.bar !== 'none') surfaces.push(...buildBarbell(pose, detail));

      const rotation = rotationRef.current;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const cosPitch = Math.cos(technique.cameraPitch);
      const sinPitch = Math.sin(technique.cameraPitch);

      /* ---------------- projection ---------------- */

      // Yaw about the vertical axis, then pitch the camera up above the figure:
      // what is high in the world swings toward the viewer and what is low
      // swings away, which is what looking down at something means.
      const toCamera = ([x, y, z]: Vec3) => {
        const cx = x * cos - z * sin;
        const level = x * sin + z * cos;
        return {
          cx,
          cy: y * cosPitch - level * sinPitch,
          cz: y * sinPitch + level * cosPitch,
        };
      };

      // Every ring of every surface, in camera space, laid out ring by ring.
      const rings: { cx: number; cy: number; cz: number }[][][] = surfaces.map((surface) =>
        surface.rings.map((ring) => {
          const points = [];
          for (let s = 0; s < surface.segments; s += 1) {
            points.push(toCamera(ringPoint(ring, s / surface.segments)));
          }
          return points;
        }),
      );

      /* ---------------- fit the figure to the panel ---------------- */

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const surface of rings) {
        for (const ring of surface) {
          for (const point of ring) {
            const k = FOCAL / distanceFromCamera(point.cz);
            const x = point.cx * k;
            const y = -point.cy * k;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // A little breathing room, and never so large that the figure touches the
      // panel edge on a narrow phone.
      const spanX = Math.max(maxX - minX + 34, 1);
      const spanY = Math.max(maxY - minY + 34, 1);
      const scale = Math.min(width / spanX, height / spanY);
      const originX = width / 2 - ((minX + maxX) / 2) * scale;
      const originY = height / 2 - ((minY + maxY) / 2) * scale;
      const floorY = originY + maxY * scale;

      /* ---------------- ground and bench, always behind ---------------- */

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = dim;
      ctx.beginPath();
      ctx.ellipse(width / 2, floorY + 4, Math.max(24, 58 * scale), Math.max(6, 12 * scale), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* ---------------- build, cull and light the polygons ---------------- */

      const facets: Facet[] = [];

      for (let i = 0; i < surfaces.length; i += 1) {
        const surface = surfaces[i]!;
        const surfaceRings = rings[i]!;
        const { segments, material } = surface;

        const project = (point: { cx: number; cy: number; cz: number }): Vertex => {
          const k = FOCAL / distanceFromCamera(point.cz);
          return {
            cx: point.cx,
            cy: point.cy,
            cz: point.cz,
            sx: originX + point.cx * k * scale,
            sy: originY - point.cy * k * scale,
          };
        };

        const projected = surfaceRings.map((ring) => ring.map(project));
        const bands = projected.length - 1;

        // Face normals first, then averaged into the corners they touch. The
        // normals are left unnormalised at this stage so that a large polygon
        // counts for more than a sliver at a pole, which is what stops the
        // crown of the head from breaking into a starburst.
        const faces = new Float64Array(bands * segments * 3);
        const corners = new Float64Array(projected.length * segments * 3);

        for (let b = 0; b < bands; b += 1) {
          const near = projected[b]!;
          const far = projected[b + 1]!;
          for (let s = 0; s < segments; s += 1) {
            const next = (s + 1) % segments;
            const p0 = near[s]!;
            const p1 = near[next]!;
            const p3 = far[s]!;

            // Outward normal, from the winding the loft guarantees.
            const ax = p1.cx - p0.cx;
            const ay = p1.cy - p0.cy;
            const az = p1.cz - p0.cz;
            const bx = p3.cx - p0.cx;
            const by = p3.cy - p0.cy;
            const bz = p3.cz - p0.cz;
            const nx = ay * bz - az * by;
            const ny = az * bx - ax * bz;
            const nz = ax * by - ay * bx;

            const face = (b * segments + s) * 3;
            faces[face] = nx;
            faces[face + 1] = ny;
            faces[face + 2] = nz;

            for (const corner of [
              (b * segments + s) * 3,
              (b * segments + next) * 3,
              ((b + 1) * segments + next) * 3,
              ((b + 1) * segments + s) * 3,
            ]) {
              corners[corner] = corners[corner]! + nx;
              corners[corner + 1] = corners[corner + 1]! + ny;
              corners[corner + 2] = corners[corner + 2]! + nz;
            }
          }
        }

        const cornerNormal = (ring: number, s: number): Normal => {
          const at = (ring * segments + s) * 3;
          const x = corners[at]!;
          const y = corners[at + 1]!;
          const z = corners[at + 2]!;
          const length = Math.hypot(x, y, z) || 1;
          return { x: x / length, y: y / length, z: z / length };
        };

        for (let b = 0; b < bands; b += 1) {
          const near = projected[b]!;
          const far = projected[b + 1]!;
          for (let s = 0; s < segments; s += 1) {
            const next = (s + 1) % segments;
            const p0 = near[s]!;
            const p1 = near[next]!;
            const p2 = far[next]!;
            const p3 = far[s]!;

            const face = (b * segments + s) * 3;
            const fx = faces[face]!;
            const fy = faces[face + 1]!;
            const fz = faces[face + 2]!;
            const length = Math.hypot(fx, fy, fz);
            if (length < 1e-9) continue;

            // The camera sits out along +z looking back at the origin, so a
            // polygon is visible only if its normal leans toward that point.
            const midX = (p0.cx + p1.cx + p2.cx + p3.cx) / 4;
            const midY = (p0.cy + p1.cy + p2.cy + p3.cy) / 4;
            const midZ = (p0.cz + p1.cz + p2.cz + p3.cz) / 4;
            const vx = -midX;
            const vy = -midY;
            const vz = CAMERA_DISTANCE - midZ;
            if ((fx * vx + fy * vy + fz * vz) / length <= 0) continue;

            facets.push({
              depth: midZ,
              points: [p0, p1, p2, p3],
              material,
              normals: [
                cornerNormal(b, s),
                cornerNormal(b, next),
                cornerNormal(b + 1, next),
                cornerNormal(b + 1, s),
              ],
            });
          }
        }
      }

      /* ---------------- painter's algorithm ---------------- */

      facets.sort((a, b) => a.depth - b.depth);

      const shadeOf = (normal: Normal, material: Material) => {
        const light = LIGHTING[material];
        const base = material === 'accent' ? accent : material === 'equipment' ? equipment : skin;
        const key = Math.max(
          0,
          normal.x * KEY_LIGHT[0] + normal.y * KEY_LIGHT[1] + normal.z * KEY_LIGHT[2],
        );
        const fill = Math.max(
          0,
          normal.x * FILL_LIGHT[0] + normal.y * FILL_LIGHT[1] + normal.z * FILL_LIGHT[2],
        );
        const level = light.ambient + light.key * key + light.fill * fill;
        // How edge-on the surface is. Near the silhouette it approaches 1,
        // which is exactly where a rim light belongs.
        const rim = Math.pow(1 - Math.min(1, Math.abs(normal.z)), RIM_TIGHTNESS) * light.rim;
        return [
          Math.min(255, base[0] * level + RIM_COLOUR[0] * rim),
          Math.min(255, base[1] * level + RIM_COLOUR[1] * rim),
          Math.min(255, base[2] * level + RIM_COLOUR[2] * rim),
        ] as const;
      };

      const css = (r: number, g: number, b: number) =>
        `rgb(${Math.max(0, Math.min(255, r)) | 0},${Math.max(0, Math.min(255, g)) | 0},${Math.max(0, Math.min(255, b)) | 0})`;

      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';

      for (const facet of facets) {
        const points = facet.points;
        const colours = facet.normals.map((normal) => shadeOf(normal, facet.material));

        /*
         * Canvas cannot interpolate a colour across four corners, so each
         * polygon gets the linear gradient that best fits its own corner
         * colours — a least-squares plane through them, laid along the
         * direction the brightness actually runs.
         *
         * Picking the axis this way is what stops the body looking quilted.
         * Corner colours are shared with the neighbouring polygons, so any
         * scheme agrees at the seams; it is the *interiors* that give the game
         * away, and two neighbours only agree there if they also agree about
         * which way the light is running. Fitting the same underlying field
         * gives them nearly the same answer.
         */
        let sumX = 0;
        let sumY = 0;
        for (const point of points) {
          sumX += point.sx;
          sumY += point.sy;
        }
        const meanX = sumX / points.length;
        const meanY = sumY / points.length;

        let xx = 0;
        let xy = 0;
        let yy = 0;
        const slopes = [0, 0, 0, 0, 0, 0];
        const means = [0, 0, 0];
        for (let i = 0; i < points.length; i += 1) {
          const dx = points[i]!.sx - meanX;
          const dy = points[i]!.sy - meanY;
          xx += dx * dx;
          xy += dx * dy;
          yy += dy * dy;
          for (let channel = 0; channel < 3; channel += 1) {
            const value = colours[i]![channel]!;
            means[channel] = means[channel]! + value / points.length;
            slopes[channel * 2] = slopes[channel * 2]! + dx * value;
            slopes[channel * 2 + 1] = slopes[channel * 2 + 1]! + dy * value;
          }
        }

        let paint: string | CanvasGradient = css(means[0]!, means[1]!, means[2]!);
        const determinant = xx * yy - xy * xy;
        if (Math.abs(determinant) > 1e-6) {
          // Per-channel gradient of the fitted plane. The cross terms need the
          // colours centred, but the offsets are already centred and therefore
          // sum to zero, so the mean cancels and the raw sums can be used.
          const gradients = [0, 0, 0, 0, 0, 0];
          for (let channel = 0; channel < 3; channel += 1) {
            const sx = slopes[channel * 2]!;
            const sy = slopes[channel * 2 + 1]!;
            gradients[channel * 2] = (yy * sx - xy * sy) / determinant;
            gradients[channel * 2 + 1] = (xx * sy - xy * sx) / determinant;
          }

          // The axis is taken from perceived brightness, so the one gradient
          // available is spent where the eye will notice it.
          const axisX = 0.3 * gradients[0]! + 0.59 * gradients[2]! + 0.11 * gradients[4]!;
          const axisY = 0.3 * gradients[1]! + 0.59 * gradients[3]! + 0.11 * gradients[5]!;
          const axisLength = Math.hypot(axisX, axisY);

          if (axisLength > 1e-9) {
            const ux = axisX / axisLength;
            const uy = axisY / axisLength;
            let low = Infinity;
            let high = -Infinity;
            for (const point of points) {
              const t = (point.sx - meanX) * ux + (point.sy - meanY) * uy;
              if (t < low) low = t;
              if (t > high) high = t;
            }
            if (high - low > 0.01) {
              const at = (t: number) =>
                css(
                  means[0]! + (gradients[0]! * ux + gradients[1]! * uy) * t,
                  means[1]! + (gradients[2]! * ux + gradients[3]! * uy) * t,
                  means[2]! + (gradients[4]! * ux + gradients[5]! * uy) * t,
                );
              const gradient = ctx.createLinearGradient(
                meanX + ux * low,
                meanY + uy * low,
                meanX + ux * high,
                meanY + uy * high,
              );
              gradient.addColorStop(0, at(low));
              gradient.addColorStop(1, at(high));
              paint = gradient;
            }
          }
        }

        ctx.beginPath();
        ctx.moveTo(points[0]!.sx, points[0]!.sy);
        for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i]!.sx, points[i]!.sy);
        ctx.closePath();

        ctx.fillStyle = paint;
        ctx.fill();
        // Canvas antialiases each polygon on its own, so abutting edges leave a
        // hairline of background between them. Stroking the same paint closes
        // the seams; without it the whole body is covered in a fine mesh.
        ctx.strokeStyle = paint;
        ctx.stroke();
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [technique, paused]);

  /* ---------------- drag to rotate ---------------- */

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, rotation: rotationRef.current };
    draggedRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    rotationRef.current = drag.rotation + (event.clientX - drag.x) * 0.012;
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ touchAction: 'pan-y', cursor: 'ew-resize' }}
    />
  );
}
