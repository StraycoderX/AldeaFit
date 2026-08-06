/**
 * Lift technique: 3D skeleton, keyframed poses, and coaching cues.
 *
 * The figure is a real 3D articulated skeleton — joints carry x/y/z coordinates
 * and are projected with perspective at render time, so the view can be rotated
 * and the movement genuinely reads in depth. It is hand-built rather than
 * imported: a WebGL library plus a rigged model would be an order of magnitude
 * larger than this entire app, would need a CDN or a bundled binary asset, and
 * the strict `default-src 'none'` CSP exists precisely to keep those out.
 *
 * Coordinate system, in centimetres on a ~175 cm figure:
 *   x  left (−) to right (+), from the lifter's own point of view
 *   y  floor (0) upward
 *   z  behind (−) to in front (+)
 *
 * Poses are keyframes; the renderer interpolates between them and back again so
 * the movement loops through its real path rather than teleporting between
 * positions. Cue text lives here too, so the figure and the words describing it
 * cannot drift apart.
 */

import type { LiftId } from './standards';

export type JointName =
  | 'head'
  | 'neck'
  | 'chest'
  | 'hip'
  | 'shoulderL'
  | 'shoulderR'
  | 'elbowL'
  | 'elbowR'
  | 'handL'
  | 'handR'
  | 'kneeL'
  | 'kneeR'
  | 'ankleL'
  | 'ankleR'
  | 'toeL'
  | 'toeR';

export type Vec3 = readonly [x: number, y: number, z: number];
export type Pose = Record<JointName, Vec3>;

/** Bones drawn between joints. Order only affects draw order, not geometry. */
export const BONES: readonly (readonly [JointName, JointName])[] = [
  ['head', 'neck'],
  ['neck', 'chest'],
  ['chest', 'hip'],
  ['neck', 'shoulderL'],
  ['neck', 'shoulderR'],
  ['shoulderL', 'elbowL'],
  ['shoulderR', 'elbowR'],
  ['elbowL', 'handL'],
  ['elbowR', 'handR'],
  ['hip', 'kneeL'],
  ['hip', 'kneeR'],
  ['kneeL', 'ankleL'],
  ['kneeR', 'ankleR'],
  ['ankleL', 'toeL'],
  ['ankleR', 'toeR'],
] as const;

/** Anatomical standing reference every pose is written as a variation of. */
const STANDING: Pose = {
  head: [0, 170, 0],
  neck: [0, 150, 0],
  chest: [0, 132, 0],
  hip: [0, 95, 0],
  shoulderL: [-19, 146, 0],
  shoulderR: [19, 146, 0],
  elbowL: [-22, 118, 0],
  elbowR: [22, 118, 0],
  handL: [-24, 90, 0],
  handR: [24, 90, 0],
  kneeL: [-11, 51, 0],
  kneeR: [11, 51, 0],
  ankleL: [-11, 8, 0],
  ankleR: [11, 8, 0],
  toeL: [-11, 2, 14],
  toeR: [11, 2, 14],
};

function pose(overrides: Partial<Pose>): Pose {
  return { ...STANDING, ...overrides };
}

/** Whether a barbell is drawn through the hands. */
export type BarAnchor = 'hands' | 'none';

/** Equipment drawn under the figure, so a lying pose has something to lie on. */
export type Prop = 'bench' | 'none';

export interface TechniqueStep {
  /** Translation key suffix under `tech.<lift>.cue<N>`. */
  cue: number;
}

export interface Technique {
  lift: LiftId;
  /** Keyframes, start → end. The renderer plays them forward then back. */
  frames: readonly Pose[];
  bar: BarAnchor;
  prop: Prop;
  /**
   * Starting camera angle in radians about the vertical axis.
   *
   * A standing figure reads best from three-quarters, but a figure lying along
   * the depth axis collapses at that angle — the bench press needs a squarer
   * side-on view to be legible at all.
   */
  defaultRotation: number;
  /**
   * Camera elevation in radians: how far above the figure the view sits.
   *
   * A standing lift barely needs any, because gravity already separates the
   * joints vertically on screen. A lying lift needs a lot: flat on a bench,
   * head, hips and feet are all at the same height, so a level camera stacks
   * the whole body into one horizontal pile of overlapping limbs. Looking down
   * on it spreads the body along the screen's vertical axis and the pose
   * becomes readable.
   */
  cameraPitch: number;
  /** How many coaching cues exist for this lift, as `tech.<lift>.cue1..N`. */
  cueCount: number;
  /** Seconds for one full out-and-back cycle. */
  cycleSeconds: number;
}

/* ------------------------------------------------------------------ */
/* Back squat                                                          */
/* ------------------------------------------------------------------ */

const SQUAT_TOP = pose({
  shoulderL: [-20, 145, -2],
  shoulderR: [20, 145, -2],
  elbowL: [-36, 128, -14],
  elbowR: [36, 128, -14],
  handL: [-42, 147, -12],
  handR: [42, 147, -12],
  kneeL: [-13, 51, 2],
  kneeR: [13, 51, 2],
});

/**
 * Bottom position: hip crease below the knee, torso inclined but braced, knees
 * tracking out over the toes, bar still stacked over mid-foot.
 */
const SQUAT_BOTTOM = pose({
  head: [0, 118, 16],
  neck: [0, 100, 12],
  chest: [0, 86, 14],
  hip: [0, 48, -12],
  shoulderL: [-20, 96, 10],
  shoulderR: [20, 96, 10],
  elbowL: [-36, 78, -2],
  elbowR: [36, 78, -2],
  handL: [-42, 97, -2],
  handR: [42, 97, -2],
  kneeL: [-17, 44, 14],
  kneeR: [17, 44, 14],
  ankleL: [-13, 8, 0],
  ankleR: [13, 8, 0],
  toeL: [-13, 2, 14],
  toeR: [13, 2, 14],
});

/* ------------------------------------------------------------------ */
/* Bench press — lying, so the whole figure is rotated onto its back    */
/* ------------------------------------------------------------------ */

const BENCH_BOTTOM: Pose = {
  head: [0, 42, -34],
  neck: [0, 42, -18],
  chest: [0, 44, -2],
  hip: [0, 40, 30],
  shoulderL: [-19, 42, -8],
  shoulderR: [19, 42, -8],
  elbowL: [-34, 30, -4],
  elbowR: [34, 30, -4],
  handL: [-24, 52, -4],
  handR: [24, 52, -4],
  kneeL: [-13, 26, 56],
  kneeR: [13, 26, 56],
  ankleL: [-14, 2, 44],
  ankleR: [14, 2, 44],
  toeL: [-14, 2, 56],
  toeR: [14, 2, 56],
};

const BENCH_TOP: Pose = {
  ...BENCH_BOTTOM,
  elbowL: [-24, 62, -6],
  elbowR: [24, 62, -6],
  handL: [-22, 88, -4],
  handR: [22, 88, -4],
};

/* ------------------------------------------------------------------ */
/* Deadlift                                                            */
/* ------------------------------------------------------------------ */

const DEADLIFT_BOTTOM = pose({
  head: [0, 112, 30],
  neck: [0, 104, 20],
  chest: [0, 96, 14],
  hip: [0, 66, -18],
  shoulderL: [-19, 100, 12],
  shoulderR: [19, 100, 12],
  elbowL: [-20, 66, 14],
  elbowR: [20, 66, 14],
  handL: [-20, 24, 14],
  handR: [20, 24, 14],
  kneeL: [-13, 44, 8],
  kneeR: [13, 44, 8],
});

const DEADLIFT_TOP = pose({
  handL: [-20, 88, 6],
  handR: [20, 88, 6],
  elbowL: [-21, 118, 2],
  elbowR: [21, 118, 2],
});

/* ------------------------------------------------------------------ */
/* Overhead press                                                      */
/* ------------------------------------------------------------------ */

const OHP_BOTTOM = pose({
  elbowL: [-26, 122, 12],
  elbowR: [26, 122, 12],
  handL: [-20, 142, 8],
  handR: [20, 142, 8],
});

const OHP_TOP = pose({
  elbowL: [-22, 168, 0],
  elbowR: [22, 168, 0],
  handL: [-20, 196, 0],
  handR: [20, 196, 0],
  head: [0, 170, -4],
});

/* ------------------------------------------------------------------ */
/* Barbell row                                                         */
/* ------------------------------------------------------------------ */

const ROW_BOTTOM = pose({
  head: [0, 122, 34],
  neck: [0, 116, 22],
  chest: [0, 110, 14],
  hip: [0, 92, -14],
  shoulderL: [-19, 112, 12],
  shoulderR: [19, 112, 12],
  elbowL: [-21, 80, 16],
  elbowR: [21, 80, 16],
  handL: [-20, 46, 18],
  handR: [20, 46, 18],
  kneeL: [-12, 50, 4],
  kneeR: [12, 50, 4],
});

const ROW_TOP: Pose = {
  ...ROW_BOTTOM,
  elbowL: [-30, 96, -12],
  elbowR: [30, 96, -12],
  handL: [-20, 84, 12],
  handR: [20, 84, 12],
};

export const TECHNIQUES: Record<LiftId, Technique> = {
  squat: { lift: 'squat', frames: [SQUAT_TOP, SQUAT_BOTTOM], bar: 'hands', prop: 'none', defaultRotation: 0.55, cameraPitch: 0.1, cueCount: 4, cycleSeconds: 4 },
  bench: { lift: 'bench', frames: [BENCH_TOP, BENCH_BOTTOM], bar: 'hands', prop: 'bench', defaultRotation: 1.02, cameraPitch: 0.5, cueCount: 4, cycleSeconds: 3.6 },
  deadlift: { lift: 'deadlift', frames: [DEADLIFT_BOTTOM, DEADLIFT_TOP], bar: 'hands', prop: 'none', defaultRotation: 0.6, cameraPitch: 0.1, cueCount: 4, cycleSeconds: 4 },
  ohp: { lift: 'ohp', frames: [OHP_BOTTOM, OHP_TOP], bar: 'hands', prop: 'none', defaultRotation: 0.5, cameraPitch: 0.08, cueCount: 4, cycleSeconds: 3.4 },
  row: { lift: 'row', frames: [ROW_BOTTOM, ROW_TOP], bar: 'hands', prop: 'none', defaultRotation: 0.75, cameraPitch: 0.12, cueCount: 4, cycleSeconds: 3.4 },
  other: { lift: 'other', frames: [STANDING], bar: 'none', prop: 'none', defaultRotation: 0.5, cameraPitch: 0.1, cueCount: 1, cycleSeconds: 3 },
};

/** Linear blend between two poses. `t` runs 0 → 1. */
export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Record<JointName, Vec3>;
  for (const key of Object.keys(a) as JointName[]) {
    const from = a[key];
    const to = b[key];
    out[key] = [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    ];
  }
  return out;
}

/**
 * Pose at a point in the cycle, `phase` running 0 → 1.
 *
 * The second half replays the first in reverse, so a two-keyframe lift
 * descends and ascends along the same path instead of snapping back. Easing is
 * a cosine so the figure slows at both end positions, which is where a real
 * rep pauses.
 */
export function poseAtPhase(technique: Technique, phase: number): Pose {
  const { frames } = technique;
  if (frames.length === 1) return frames[0] as Pose;

  // Triangle wave: 0 → 1 → 0 across the cycle.
  const bounced = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
  const eased = (1 - Math.cos(bounced * Math.PI)) / 2;

  const span = frames.length - 1;
  const scaled = eased * span;
  const index = Math.min(Math.floor(scaled), span - 1);
  return blendPose(frames[index] as Pose, frames[index + 1] as Pose, scaled - index);
}
