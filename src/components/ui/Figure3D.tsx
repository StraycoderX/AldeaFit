/**
 * 3D technique figure.
 *
 * A hand-written renderer: joints are real 3D points, rotated about the Y axis
 * and projected with perspective onto a canvas. Bones are depth-sorted so the
 * near arm draws over the far one, which is what makes the pose read as a body
 * rather than a flat stick drawing.
 *
 * No 3D library. A WebGL engine plus a rigged model would dwarf the rest of the
 * app and would need either a CDN — which the CSP forbids — or a large binary
 * asset in the bundle. The whole renderer is about 150 lines and draws with the
 * 2D canvas context.
 *
 * The view can be dragged to rotate, and rotation is remembered while the
 * component is mounted so switching lifts keeps the angle the user chose.
 */

import { useEffect, useRef } from 'react';
import { BONES, poseAtPhase, type JointName, type Technique, type Vec3 } from '@/lib/technique';

interface Figure3DProps {
  technique: Technique;
  /** Pauses the animation and holds the pose, for reduced-motion users. */
  paused?: boolean;
  className?: string;
  label: string;
}

/** Joints that get a drawn sphere; the rest are implied by the bones. */
const NODES: readonly JointName[] = [
  'head',
  'chest',
  'hip',
  'shoulderL',
  'shoulderR',
  'elbowL',
  'elbowR',
  'handL',
  'handR',
  'kneeL',
  'kneeR',
  'ankleL',
  'ankleR',
];

const CAMERA_DISTANCE = 900;
const FOCAL = 940;

export function Figure3D({ technique, paused = false, className, label }: Figure3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(technique.defaultRotation);
  const draggedRef = useRef(false);
  const dragRef = useRef<{ x: number; rotation: number } | null>(null);

  // Adopt each lift's framing angle, unless the user has taken control of the
  // camera. Done in an effect because refs must not be read during render.
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

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const accent = read('--accent') || '#caf53a';
      const bone = read('--text-secondary') || '#9ba3ae';
      const dim = read('--border-strong') || '#333941';

      const elapsed = paused ? 0 : (now - start) / 1000;
      const phase = technique.cycleSeconds > 0 ? (elapsed / technique.cycleSeconds) % 1 : 0;
      const pose = poseAtPhase(technique, paused ? 0.5 : phase);

      const rotation = rotationRef.current;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      // Project once unscaled to measure the pose, then scale and centre to fit.
      // A fixed framing assumed a standing figure and cropped or shrank the
      // lying bench-press pose, whose bounding box is a completely different
      // shape. Measuring means every lift fills the canvas properly.
      const raw = ([x, y, z]: Vec3) => {
        const rx = x * cos - z * sin;
        const rz = x * sin + z * cos;
        const k = FOCAL / (rz + CAMERA_DISTANCE);
        return { x: rx * k, y: -y * k, depth: rz };
      };

      const measured = (Object.entries(pose) as [JointName, Vec3][]).map(
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

      // Padding leaves room for the bar, which overhangs the hands.
      const padX = 78;
      const padY = 34;
      const spanX = Math.max(maxX - minX + padX, 1);
      const spanY = Math.max(maxY - minY + padY, 1);
      const scale = Math.min(width / spanX, height / spanY);

      const originX = width / 2 - ((minX + maxX) / 2) * scale;
      const originY = height / 2 - ((minY + maxY) / 2) * scale;
      const floorY = originY + maxY * scale;

      const points = {} as Record<JointName, { x: number; y: number; depth: number }>;
      for (const [name, point] of measured) {
        points[name] = {
          x: originX + point.x * scale,
          y: originY + point.y * scale,
          depth: point.depth,
        };
      }

      // Ground shadow, which anchors the figure instead of leaving it floating.
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = dim;
      ctx.beginPath();
      ctx.ellipse(width / 2, floorY + 4, 52 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Bench, drawn behind the body so the lifter reads as lying on it rather
      // than floating in space.
      if (technique.prop === 'bench') {
        const pad = points.chest;
        const seat = points.hip;
        ctx.save();
        ctx.strokeStyle = dim;
        ctx.fillStyle = dim;
        ctx.globalAlpha = 0.5;

        const half = 15 * scale;
        ctx.beginPath();
        ctx.moveTo(pad.x - half, pad.y + half * 0.7);
        ctx.lineTo(seat.x - half, seat.y + half * 0.7);
        ctx.lineTo(seat.x + half, seat.y + half * 1.1);
        ctx.lineTo(pad.x + half, pad.y + half * 1.1);
        ctx.closePath();
        ctx.fill();

        // Two legs down to the floor.
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = Math.max(2, 5 * scale);
        ctx.lineCap = 'round';
        for (const anchor of [pad, seat]) {
          ctx.beginPath();
          ctx.moveTo(anchor.x, anchor.y + half);
          ctx.lineTo(anchor.x, floorY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Bones, far ones first.
      const segments = BONES.map(([a, b]) => ({
        a: points[a],
        b: points[b],
        depth: (points[a].depth + points[b].depth) / 2,
      })).sort((p, q) => p.depth - q.depth);

      for (const segment of segments) {
        // Depth cue: nearer bones are brighter and thicker.
        const near = (segment.depth + 60) / 120;
        ctx.globalAlpha = 0.45 + Math.max(0, Math.min(1, near)) * 0.55;
        ctx.strokeStyle = bone;
        ctx.lineWidth = Math.max(2, 7 * scale * 0.9);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(segment.a.x, segment.a.y);
        ctx.lineTo(segment.b.x, segment.b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Joints.
      for (const name of NODES) {
        const point = points[name];
        const radius = (name === 'head' ? 13 : name === 'chest' || name === 'hip' ? 7 : 5) * scale * 0.9;
        ctx.fillStyle = name === 'head' ? bone : dim;
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(2, radius), 0, Math.PI * 2);
        ctx.fill();
      }

      // Barbell, drawn through whichever anchor the lift uses.
      if (technique.bar !== 'none') {
        // Every lift here holds the bar in the hands; the poses put the hands
        // where the bar belongs (traps for a squat, over the chest for a
        // bench). Anchoring to the hands keeps bar and body from drifting apart.
        const anchorL = points.handL;
        const anchorR = points.handR;

        const dx = anchorR.x - anchorL.x;
        const dy = anchorR.y - anchorL.y;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const overhang = 34 * scale;

        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(3, 6 * scale * 0.9);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(anchorL.x - ux * overhang, anchorL.y - uy * overhang);
        ctx.lineTo(anchorR.x + ux * overhang, anchorR.y + uy * overhang);
        ctx.stroke();

        // Plates at both ends.
        for (const [point, direction] of [
          [anchorL, -1],
          [anchorR, 1],
        ] as const) {
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.ellipse(
            point.x + ux * overhang * direction * 0.72,
            point.y + uy * overhang * direction * 0.72,
            Math.max(3, 6 * scale),
            Math.max(7, 15 * scale),
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
