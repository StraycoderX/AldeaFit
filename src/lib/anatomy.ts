/**
 * Body volume.
 *
 * The skeleton in `technique.ts` gives joint positions; this gives the flesh
 * around them. Every limb is a tapered tube with a mid-segment bulge, because
 * the single strongest cue that a drawing is a body rather than a diagram is
 * that an upper arm is thick at the shoulder, thicker again at the biceps, and
 * narrow at the elbow. Constant-width strokes read as a stick figure no matter
 * how correct the joint angles are.
 *
 * Radii are in the same centimetre space as the skeleton, sized for a roughly
 * 175 cm trained adult.
 */

import type { JointName, Pose, Vec3 } from './technique';

/**
 * Joints that only exist to give the body width — the skeleton stores one
 * central hip, but legs hang from the sides of a pelvis and a torso needs two
 * shoulders and two hip points to be a shape rather than a line.
 */
export type DerivedJoint = 'hipL' | 'hipR' | 'waistL' | 'waistR' | 'chestL' | 'chestR';
export type FullJoint = JointName | DerivedJoint;
export type FullPose = Record<FullJoint, Vec3>;

export interface LimbSpec {
  from: FullJoint;
  to: FullJoint;
  /** Radius at the `from` end, in cm. */
  startRadius: number;
  /** Radius at the `to` end, in cm. */
  endRadius: number;
  /**
   * Radius at the midpoint. Larger than both ends gives a muscle belly —
   * biceps, quadriceps, calf. Equal to the average gives a plain taper.
   */
  midRadius: number;
  /** Where along the segment the belly sits, 0 → 1. */
  midAt: number;
}

/**
 * Limbs, drawn as volumes. The torso and head are handled separately because
 * they are not tubes.
 */
export const LIMBS: readonly LimbSpec[] = [
  // Upper arms: deltoid into biceps into a narrow elbow.
  { from: 'shoulderL', to: 'elbowL', startRadius: 7.5, midRadius: 7.2, endRadius: 4.8, midAt: 0.35 },
  { from: 'shoulderR', to: 'elbowR', startRadius: 7.5, midRadius: 7.2, endRadius: 4.8, midAt: 0.35 },
  // Forearms: thick just below the elbow, tapering hard into the wrist.
  { from: 'elbowL', to: 'handL', startRadius: 4.8, midRadius: 5.2, endRadius: 3.2, midAt: 0.28 },
  { from: 'elbowR', to: 'handR', startRadius: 4.8, midRadius: 5.2, endRadius: 3.2, midAt: 0.28 },
  // Thighs: the heaviest segment on the body.
  { from: 'hipL', to: 'kneeL', startRadius: 11.5, midRadius: 11, endRadius: 7, midAt: 0.4 },
  { from: 'hipR', to: 'kneeR', startRadius: 11.5, midRadius: 11, endRadius: 7, midAt: 0.4 },
  // Shins: calf belly high, ankle narrow.
  { from: 'kneeL', to: 'ankleL', startRadius: 7, midRadius: 7.4, endRadius: 3.6, midAt: 0.3 },
  { from: 'kneeR', to: 'ankleR', startRadius: 7, midRadius: 7.4, endRadius: 3.6, midAt: 0.3 },
  // Feet.
  { from: 'ankleL', to: 'toeL', startRadius: 4, midRadius: 4, endRadius: 2.6, midAt: 0.5 },
  { from: 'ankleR', to: 'toeR', startRadius: 4, midRadius: 4, endRadius: 2.6, midAt: 0.5 },
  // Neck.
  { from: 'neck', to: 'head', startRadius: 5.6, midRadius: 5.4, endRadius: 5, midAt: 0.5 },
];

/*
 * Half-widths are set a little wider than the finished silhouette: the torso is
 * drawn as a smooth curve controlled by these points, and such a curve passes
 * inside its control hull rather than through it.
 */
const PELVIS_HALF_WIDTH = 13;
const WAIST_HALF_WIDTH = 13;
const CHEST_HALF_WIDTH = 18.5;

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalise(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function offset(origin: Vec3, axis: Vec3, distance: number): Vec3 {
  return [
    origin[0] + axis[0] * distance,
    origin[1] + axis[1] * distance,
    origin[2] + axis[2] * distance,
  ];
}

/**
 * Widen a skeletal pose into a body.
 *
 * The left-right axis is taken from the shoulders rather than assumed to be the
 * world x axis, so a twisted or lying pose still gets a pelvis oriented with
 * the torso instead of one stuck to the global grid.
 */
export function buildBody(pose: Pose): FullPose {
  const axis = normalise(subtract(pose.shoulderR, pose.shoulderL));

  // Waist sits between chest and hip, which is where a torso actually narrows.
  const waist: Vec3 = [
    (pose.chest[0] + pose.hip[0]) / 2,
    (pose.chest[1] + pose.hip[1]) / 2,
    (pose.chest[2] + pose.hip[2]) / 2,
  ];

  return {
    ...pose,
    hipL: offset(pose.hip, axis, -PELVIS_HALF_WIDTH),
    hipR: offset(pose.hip, axis, PELVIS_HALF_WIDTH),
    waistL: offset(waist, axis, -WAIST_HALF_WIDTH),
    waistR: offset(waist, axis, WAIST_HALF_WIDTH),
    chestL: offset(pose.chest, axis, -CHEST_HALF_WIDTH),
    chestR: offset(pose.chest, axis, CHEST_HALF_WIDTH),
  };
}

/**
 * Torso outline, ordered as a closed loop: down the left side from the
 * shoulder, across the pelvis, up the right, and over the trapezius to the
 * neck.
 *
 * The neck is part of the loop rather than left to the closing edge because
 * without it the torso is cut off by a flat line straight across both
 * shoulders, which reads as a shirt collar sitting on top of the body.
 */
export const TORSO_OUTLINE: readonly FullJoint[] = [
  'shoulderL',
  'chestL',
  'waistL',
  'hipL',
  'hipR',
  'waistR',
  'chestR',
  'shoulderR',
  'neck',
];

/** Head radius in cm; drawn as a slightly tall ellipsoid. */
export const HEAD_RADIUS = 10;
