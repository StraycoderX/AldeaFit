/**
 * 3D technique figure.
 *
 * A hand-written renderer: joints are real 3D points, rotated about the vertical
 * axis and projected with perspective onto a canvas. Body parts are depth-sorted
 * so the near arm draws over the far one.
 *
 * Volume, not sticks. Each limb is filled as a tapered tube with a muscle belly
 * (see `anatomy.ts`) and shaded with a gradient running across the limb, dark at
 * the silhouette edges and light along a consistent light direction — the cue
 * that makes a flat shape read as a cylinder. The torso is a filled polygon with
 * real shoulder, waist and pelvis width, and the legs hang from the sides of the
 * pelvis rather than from a single central point.
 *
 * No 3D library. A WebGL engine plus a rigged model would dwarf the app and
 * would need either a CDN — which the CSP forbids — or a large binary asset.
 */

import { useEffect, useRef } from 'react';
import { poseAtPhase, type Technique, type Vec3 } from '@/lib/technique';
import {
  HEAD_RADIUS,
  LIMBS,
  TORSO_OUTLINE,
  buildBody,
  type FullJoint,
} from '@/lib/anatomy';

interface Figure3DProps {
  technique: Technique;
  /** Holds the mid-rep pose instead of animating. */
  paused?: boolean;
  className?: string;
  label: string;
}

const CAMERA_DISTANCE = 900;
const FOCAL = 940;

/** Screen-space point plus the depth and scale it was projected with. */
interface Projected {
  x: number;
  y: number;
  depth: number;
  k: number;
}

/** Anything drawable, tagged with the depth it sorts at. */
interface Drawable {
  depth: number;
  draw: () => void;
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
    const start = performance.now();

    const read = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const draw = (now: number) => {
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

      const accent = read('--accent') || '#caf53a';
      const skin = read('--text-secondary') || '#9ba3ae';
      const dim = read('--border-strong') || '#333941';

      const elapsed = paused ? 0 : (now - start) / 1000;
      const phase = technique.cycleSeconds > 0 ? (elapsed / technique.cycleSeconds) % 1 : 0;
      const body = buildBody(poseAtPhase(technique, paused ? 0.5 : phase));

      const rotation = rotationRef.current;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const cosPitch = Math.cos(technique.cameraPitch);
      const sinPitch = Math.sin(technique.cameraPitch);

      /* ---------------- projection with fit-to-content ---------------- */

      const raw = ([x, y, z]: Vec3) => {
        // Yaw about the vertical axis, then pitch the camera up above the
        // figure: what is high in the world swings toward the viewer and what
        // is low swings away, which is what looking down at something means.
        const rx = x * cos - z * sin;
        const level = x * sin + z * cos;
        const ry = y * cosPitch - level * sinPitch;
        const rz = y * sinPitch + level * cosPitch;
        const k = FOCAL / (rz + CAMERA_DISTANCE);
        return { x: rx * k, y: -ry * k, depth: rz, k };
      };

      const measured = (Object.entries(body) as [FullJoint, Vec3][]).map(
        ([name, position]) => [name, raw(position)] as const,
      );

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [, point] of measured) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      // Padding leaves room for the bar overhang and the body's own thickness,
      // which the joint positions alone do not account for.
      const spanX = Math.max(maxX - minX + 96, 1);
      const spanY = Math.max(maxY - minY + 58, 1);
      const scale = Math.min(width / spanX, height / spanY);

      const originX = width / 2 - ((minX + maxX) / 2) * scale;
      const originY = height / 2 - ((minY + maxY) / 2) * scale;
      const floorY = originY + maxY * scale;

      const points = {} as Record<FullJoint, Projected>;
      for (const [name, point] of measured) {
        points[name] = {
          x: originX + point.x * scale,
          y: originY + point.y * scale,
          depth: point.depth,
          k: point.k,
        };
      }

      /* ---------------- shading helpers ---------------- */

      /**
       * Cylindrical shading across a limb. The gradient runs perpendicular to
       * the segment, so the highlight follows the limb whatever angle it is at.
       */
      const tubeGradient = (a: Projected, b: Projected, px: number, py: number, radius: number) => {
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const gradient = ctx.createLinearGradient(
          midX - px * radius,
          midY - py * radius,
          midX + px * radius,
          midY + py * radius,
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0.34)');
        gradient.addColorStop(0.32, 'rgba(255,255,255,0.16)');
        gradient.addColorStop(0.6, 'rgba(255,255,255,0.03)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.38)');
        return gradient;
      };

      const drawables: Drawable[] = [];

      /* ---------------- torso ---------------- */

      const torso = TORSO_OUTLINE.map((name) => points[name]);
      drawables.push({
        depth: (points.chest.depth + points.hip.depth) / 2,
        draw: () => {
          // A closed smooth curve, so the torso reads as a ribcage tapering to
          // a waist rather than as a cut polygon.
          //
          // Each outline point is used as a *control* point and the curve is
          // anchored at the midpoints between them. Anchoring at the points
          // themselves with midpoint controls — the obvious way round — draws a
          // quadratic whose control point lies on its own chord, which is
          // exactly a straight line: all the cost of a curve and none of it.
          ctx.beginPath();
          const last = torso[torso.length - 1]!;
          ctx.moveTo((last.x + torso[0]!.x) / 2, (last.y + torso[0]!.y) / 2);
          for (let i = 0; i < torso.length; i += 1) {
            const current = torso[i]!;
            const next = torso[(i + 1) % torso.length]!;
            ctx.quadraticCurveTo(
              current.x,
              current.y,
              (current.x + next.x) / 2,
              (current.y + next.y) / 2,
            );
          }
          ctx.closePath();

          ctx.fillStyle = skin;
          ctx.fill();

          // Shade across the shoulder axis.
          const dx = points.shoulderR.x - points.shoulderL.x;
          const dy = points.shoulderR.y - points.shoulderL.y;
          const length = Math.hypot(dx, dy) || 1;
          const gradient = ctx.createLinearGradient(
            points.shoulderL.x,
            points.shoulderL.y,
            points.shoulderL.x + (dx / length) * length,
            points.shoulderL.y + (dy / length) * length,
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0.40)');
          gradient.addColorStop(0.36, 'rgba(255,255,255,0.16)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.44)');
          ctx.fillStyle = gradient;
          ctx.fill();
        },
      });

      /* ---------------- limbs ---------------- */

      for (const limb of LIMBS) {
        const a = points[limb.from];
        const b = points[limb.to];
        if (!a || !b) continue;

        drawables.push({
          depth: (a.depth + b.depth) / 2,
          draw: () => {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const length = Math.hypot(dx, dy) || 1;
            const ux = dx / length;
            const uy = dy / length;
            // Perpendicular in screen space, so the tube width is always across
            // the limb regardless of its orientation.
            const px = -uy;
            const py = ux;

            // Radii scale with each end's own projection factor, so a limb
            // pointing at the camera thickens correctly toward the near end.
            const r0 = limb.startRadius * scale * a.k;
            const r1 = limb.midRadius * scale * ((a.k + b.k) / 2);
            const r2 = limb.endRadius * scale * b.k;

            const mx = a.x + dx * limb.midAt;
            const my = a.y + dy * limb.midAt;

            // The tapered body and the two round joint caps are three separate
            // subpaths of one path, unioned by the nonzero fill rule.
            //
            // Two things have to hold for that to work. They must be separate
            // subpaths — continuing an arc from a curve's end point makes canvas
            // draw a straight line into the arc's start, which put a spike on
            // every hand, foot and shoulder. And they must wind the same way —
            // the quad is built as `+p` side, across, `−p` side, which always
            // runs anticlockwise on screen, so the caps are drawn anticlockwise
            // too. Clockwise caps cancel the quad where they overlap and punch a
            // hole clean through every joint.
            const TAU = Math.PI * 2;
            ctx.beginPath();

            ctx.moveTo(a.x + px * r0, a.y + py * r0);
            ctx.quadraticCurveTo(mx + px * r1, my + py * r1, b.x + px * r2, b.y + py * r2);
            ctx.lineTo(b.x - px * r2, b.y - py * r2);
            ctx.quadraticCurveTo(mx - px * r1, my - py * r1, a.x - px * r0, a.y - py * r0);
            ctx.closePath();

            ctx.moveTo(a.x + r0, a.y);
            ctx.arc(a.x, a.y, r0, 0, -TAU, true);
            ctx.moveTo(b.x + r2, b.y);
            ctx.arc(b.x, b.y, r2, 0, -TAU, true);

            ctx.fillStyle = skin;
            ctx.fill();
            ctx.fillStyle = tubeGradient(a, b, px, py, Math.max(r0, r1, r2));
            ctx.fill();
          },
        });
      }

      /* ---------------- head ---------------- */

      const head = points.head;
      drawables.push({
        depth: head.depth,
        draw: () => {
          const radius = HEAD_RADIUS * scale * head.k;
          // Tilt the skull along the neck axis so a bent-over pose does not
          // leave the head sitting bolt upright.
          const angle = Math.atan2(head.y - points.neck.y, head.x - points.neck.x) + Math.PI / 2;

          ctx.save();
          ctx.translate(head.x, head.y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 0.82, radius, 0, 0, Math.PI * 2);
          ctx.fillStyle = skin;
          ctx.fill();

          const gradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
          gradient.addColorStop(0, 'rgba(255,255,255,0.18)');
          gradient.addColorStop(0.55, 'rgba(255,255,255,0.02)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.45)');
          ctx.fillStyle = gradient;
          ctx.fill();
          ctx.restore();
        },
      });

      /* ---------------- ground and bench, always behind ---------------- */

      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = dim;
      ctx.beginPath();
      ctx.ellipse(width / 2, floorY + 4, 56 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (technique.prop === 'bench') {
        const pad = points.chest;
        const seat = points.hip;
        const half = 16 * scale;
        ctx.save();
        ctx.fillStyle = dim;
        ctx.strokeStyle = dim;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(pad.x - half, pad.y + half * 0.8);
        ctx.lineTo(seat.x - half, seat.y + half * 0.8);
        ctx.lineTo(seat.x + half, seat.y + half * 1.2);
        ctx.lineTo(pad.x + half, pad.y + half * 1.2);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 0.7;
        ctx.lineWidth = Math.max(3, 6 * scale);
        ctx.lineCap = 'round';
        for (const anchor of [pad, seat]) {
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y + half);
          ctx.lineTo(anchor.x, floorY);
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ---------------- body, back to front ---------------- */

      drawables.sort((p, q) => p.depth - q.depth);
      for (const item of drawables) item.draw();

      /* ---------------- barbell ---------------- */

      if (technique.bar !== 'none') {
        const a = points.handL;
        const b = points.handR;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const overhang = 36 * scale;

        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(3, 5 * scale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x - ux * overhang, a.y - uy * overhang);
        ctx.lineTo(b.x + ux * overhang, b.y + uy * overhang);
        ctx.stroke();

        for (const [point, direction] of [
          [a, -1],
          [b, 1],
        ] as const) {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.ellipse(
            point.x + ux * overhang * direction * 0.74,
            point.y + uy * overhang * direction * 0.74,
            Math.max(3, 6 * scale),
            Math.max(8, 16 * scale),
            Math.atan2(uy, ux),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
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
