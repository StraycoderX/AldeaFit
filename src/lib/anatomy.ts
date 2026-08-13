/**
 * Body surface.
 *
 * `technique.ts` gives joint positions. This turns them into an actual surface:
 * a mesh of quads wrapped around the skeleton, which the renderer lights and
 * depth-sorts. That is the difference between a silhouette and a body — a flat
 * shape with a gradient painted on reads as a cut-out from any angle, whereas a
 * lit surface has a near side, a far side and a terminator between them, and it
 * keeps having them when the figure is rotated.
 *
 * Everything is one primitive: a loft. A list of cross-sections — each an
 * ellipse with its own centre, width and depth — swept into a closed tube. A
 * limb is a loft, the torso is a loft, the head is a loft whose radii follow a
 * half-circle, and so is the barbell. Rings of zero radius close the ends, so
 * caps need no special case.
 *
 * Cross-sections are ellipses rather than circles because almost nothing on a
 * body is round: a ribcage is half again as wide as it is deep, and a foot is
 * twice as wide as it is thick. Measurements are centimetres on a ~175 cm
 * trained adult.
 */

import type { Pose, Vec3 } from './technique';

/** What a surface is made of. Only affects colour, not geometry. */
export type Material = 'skin' | 'accent' | 'equipment';

/** One elliptical cross-section, with the plane it lies in. */
export interface Ring {
  centre: Vec3;
  /** Unit vector along the ellipse's width. */
  right: Vec3;
  /** Unit vector along the ellipse's depth. `right × forward` points along the sweep. */
  forward: Vec3;
  halfWidth: number;
  halfDepth: number;
}

export interface Surface {
  rings: readonly Ring[];
  /** Points sampled around each ring. More is smoother and slower. */
  segments: number;
  material: Material;
}

/** A cross-section before it is given an orientation. */
interface Section {
  centre: Vec3;
  halfWidth: number;
  halfDepth: number;
}

/** A radius at a fraction along a bone. `at` may fall outside 0..1 to overhang. */
interface Stop {
  at: number;
  radius: number;
}

/* ------------------------------------------------------------------ */
/* Vectors                                                             */
/* ------------------------------------------------------------------ */

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(v: Vec3, k: number): Vec3 {
  return [v[0] * k, v[1] * k, v[2] * k];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function magnitude(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function normalise(v: Vec3): Vec3 {
  const length = magnitude(v) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

export function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/* ------------------------------------------------------------------ */
/* Lofting                                                             */
/* ------------------------------------------------------------------ */

/**
 * Sweep cross-sections into a closed surface.
 *
 * Each ring is squared up against the local direction of travel, using
 * `reference` to decide which way round the ellipse sits. Taking the reference
 * from the body rather than from the world keeps a limb's cross-section
 * oriented with the torso even when the limb itself is at an odd angle.
 *
 * The axes are built so that `right × forward` points along the sweep, which is
 * what lets the renderer take an outward normal from the winding alone.
 */
function loft(
  sections: readonly Section[],
  reference: Vec3,
  segments: number,
  material: Material,
): Surface {
  const rings: Ring[] = [];

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i]!;
    // Central difference in the middle, one-sided at the ends: a ring should
    // face the average of the directions on either side of it, or a bend puts
    // a visible crease in the surface.
    const before = sections[Math.max(0, i - 1)]!;
    const after = sections[Math.min(sections.length - 1, i + 1)]!;
    let tangent = subtract(after.centre, before.centre);
    if (magnitude(tangent) < 1e-6) tangent = subtract(sections[sections.length - 1]!.centre, sections[0]!.centre);
    const direction = normalise(tangent);

    // A reference parallel to the sweep leaves the cross-section undefined;
    // any other axis will do, since a circle looks the same however it is spun.
    let forward = cross(direction, reference);
    if (magnitude(forward) < 1e-3) forward = cross(direction, [0, 1, 0]);
    if (magnitude(forward) < 1e-3) forward = cross(direction, [0, 0, 1]);
    forward = normalise(forward);

    rings.push({
      centre: section.centre,
      right: cross(forward, direction),
      forward,
      halfWidth: section.halfWidth,
      halfDepth: section.halfDepth,
    });
  }

  return { rings, segments, material };
}

/** A loft along a bone, with radii given as fractions of the bone's length. */
function bone(
  from: Vec3,
  to: Vec3,
  stops: readonly Stop[],
  reference: Vec3,
  detail: Detail,
  options: { widthScale?: number; depthScale?: number; segments?: number } = {},
): Surface {
  const { widthScale = 1, depthScale = 1, segments = LIMB_SEGMENTS } = options;

  // Both ends get a disc closing them off.
  //
  // A tube left open is not merely unfinished: back-face culling removes its
  // inner wall, so the opening is a hole straight through the figure to the
  // background. Where a limb is buried in another one it never shows, but a
  // knee — where a thigh ends at almost exactly the radius the shin begins —
  // opens a black slit that follows the joint round as the figure turns.
  //
  // The cap sits a fraction of the bone's length beyond the end, which makes
  // its cone shallow enough to read as flat.
  const CAP_INSET = 0.006;
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  const sections = [
    { at: first.at - CAP_INSET, radius: 0.01 },
    ...stops,
    { at: last.at + CAP_INSET, radius: 0.01 },
  ].map(({ at, radius }) => ({
    centre: mix(from, to, at),
    halfWidth: radius * widthScale,
    halfDepth: radius * depthScale,
  }));

  return loft(sections, reference, sampled(segments, detail), 'skin');
}

/* ------------------------------------------------------------------ */
/* Proportions                                                         */
/* ------------------------------------------------------------------ */

/*
 * How finely each surface is sampled. Shading is smoothed across polygons, so
 * these only have to be high enough that the *silhouette* looks round — the
 * outline is the one place a facet cannot be hidden by interpolation.
 *
 * They are scaled by a detail factor at build time. A figure drawn 340 px wide
 * on a phone cannot show the difference between twelve sides and eight, but the
 * phone is exactly where the polygon count is worth having back.
 */
const LIMB_SEGMENTS = 14;
const TORSO_SEGMENTS = 22;
const HEAD_SEGMENTS = 16;

/** Never drop below this, or a limb's outline turns visibly into a prism. */
const MIN_SEGMENTS = 7;

/**
 * How finely to sample, as a multiple of the counts above. 1 is full detail.
 */
export type Detail = number;

function sampled(segments: number, detail: Detail): number {
  return Math.max(MIN_SEGMENTS, Math.round(segments * detail));
}

/** Half the distance between the hip sockets: where the legs actually hang from. */
const HIP_SPACING = 9.5;

const HEAD_HALF_HEIGHT = 11;
const HEAD_HALF_WIDTH = 8.2;
const HEAD_HALF_DEPTH = 9.4;
/** How far the lower face juts forward of the cranium. */
const JAW_REACH = 2.2;
/** Rings from crown to chin. Both ends close to a point. */
const HEAD_RINGS = 10;

/** Upper arm: deltoid, biceps belly, narrow elbow. */
const UPPER_ARM: readonly Stop[] = [
  { at: -0.06, radius: 5.6 },
  { at: 0.04, radius: 7.1 },
  { at: 0.26, radius: 6.4 },
  { at: 0.68, radius: 5.2 },
  { at: 1, radius: 4.4 },
];

/**
 * Forearm: thick under the elbow, tapering to a wrist and closing in a fist.
 *
 * The hand is a rounded knuckle that shuts quickly, not a long taper. A gentle
 * run-out to a point looks like a spear rather than a hand, and on a lift where
 * the hands are the highest thing on screen that is the first thing anyone sees.
 */
const FOREARM: readonly Stop[] = [
  { at: -0.14, radius: 3.5 },
  { at: 0.02, radius: 4.9 },
  { at: 0.24, radius: 5.2 },
  { at: 0.74, radius: 3.2 },
  { at: 0.98, radius: 3.7 },
  { at: 1.12, radius: 3.1 },
  { at: 1.18, radius: 0.8 },
];

/** Thigh: the heaviest segment on the body. */
const THIGH: readonly Stop[] = [
  { at: -0.05, radius: 9.4 },
  { at: 0.06, radius: 10.6 },
  { at: 0.34, radius: 9.9 },
  { at: 0.56, radius: 8.9 },
  { at: 0.76, radius: 7.5 },
  { at: 1, radius: 6.4 },
];

/**
 * Shin: calf belly high, ankle narrow.
 *
 * It starts above the knee and ends inside the foot. Each segment has to be
 * wide enough where it meets the next to swallow that segment's closing disc,
 * or the disc shows as a dark plate across the joint — the cap solves the hole
 * and then becomes visible itself.
 */
const SHIN: readonly Stop[] = [
  { at: -0.16, radius: 5.4 },
  { at: -0.02, radius: 6.9 },
  { at: 0.22, radius: 6.9 },
  { at: 0.62, radius: 4.6 },
  { at: 0.9, radius: 3.4 },
  { at: 1.03, radius: 2.3 },
];

/** Foot, including a heel behind the ankle. Flattened by the scales at the call site. */
const FOOT: readonly Stop[] = [
  { at: -0.42, radius: 2.6 },
  { at: -0.25, radius: 3.8 },
  { at: 0.15, radius: 4.3 },
  { at: 0.7, radius: 3.6 },
  { at: 1, radius: 2.2 },
];

const NECK: readonly Stop[] = [
  { at: 0, radius: 6.4 },
  { at: 0.5, radius: 5.9 },
  { at: 1, radius: 5.7 },
];

/* ------------------------------------------------------------------ */
/* The figure                                                          */
/* ------------------------------------------------------------------ */

/** The body's own axes, so nothing has to assume the figure is upright. */
export interface BodyFrame {
  right: Vec3;
  up: Vec3;
  forward: Vec3;
}

export function bodyFrame(pose: Pose): BodyFrame {
  const right = normalise(subtract(pose.shoulderR, pose.shoulderL));
  const spine = normalise(subtract(pose.chest, pose.hip));
  const forward = normalise(cross(right, spine));
  // Re-square the spine against the other two, so a shrugged or twisted pose
  // cannot leave the frame skewed.
  return { right, forward, up: normalise(cross(forward, right)) };
}

/**
 * Build the whole body as a list of surfaces.
 *
 * Parts are allowed to interpenetrate — the deltoid sinks into the shoulder,
 * the thigh into the pelvis. Solving the intersections properly would need a
 * real modeller; with opaque surfaces and per-polygon depth sorting the joint
 * simply reads as continuous, which is all it has to do.
 */
export function buildFigure(pose: Pose, detail: Detail = 1): Surface[] {
  const frame = bodyFrame(pose);
  const { right, up, forward } = frame;

  const hipL = add(pose.hip, scale(right, -HIP_SPACING));
  const hipR = add(pose.hip, scale(right, HIP_SPACING));

  /* ---- torso: neck, traps, ribcage, waist, pelvis, seat ---- */

  const torso = loft(
    [
      { centre: mix(pose.neck, pose.chest, 0.02), halfWidth: 0.01, halfDepth: 0.01 },
      { centre: mix(pose.neck, pose.chest, 0.04), halfWidth: 7.2, halfDepth: 7 },
      { centre: mix(pose.neck, pose.chest, 0.26), halfWidth: 15.5, halfDepth: 10.2 },
      { centre: mix(pose.neck, pose.chest, 0.62), halfWidth: 17, halfDepth: 11.4 },
      { centre: pose.chest, halfWidth: 15.6, halfDepth: 11.2 },
      { centre: mix(pose.chest, pose.hip, 0.58), halfWidth: 12.4, halfDepth: 9.4 },
      // The pelvis sits back a little from the line of the spine, which is what
      // gives a body a seat instead of a straight drop from waist to legs.
      //
      // Both of these carry on down the torso's own axis rather than reaching
      // toward the knees. Aiming them at the knees looks equivalent standing up
      // and is not: at the bottom of a squat the spine travels down and back
      // while the thighs go forward, so the section line doubles back on itself
      // and the loft creases straight through the hip.
      { centre: add(pose.hip, scale(forward, -1.2)), halfWidth: 13.8, halfDepth: 10.8 },
      {
        centre: add(add(pose.hip, scale(up, -5.5)), scale(forward, -2.2)),
        halfWidth: 12.4,
        halfDepth: 10.2,
      },
      {
        centre: add(add(pose.hip, scale(up, -9.5)), scale(forward, -1.6)),
        halfWidth: 10.2,
        halfDepth: 8.8,
      },
      {
        centre: add(add(pose.hip, scale(up, -10)), scale(forward, -1.6)),
        halfWidth: 0.01,
        halfDepth: 0.01,
      },
    ],
    right,
    sampled(TORSO_SEGMENTS, detail),
    'skin',
  );

  /* ---- head ---- */

  const headUp = normalise(subtract(pose.head, pose.neck));
  const headForward = normalise(cross(right, headUp));
  const headSections: Section[] = [];
  for (let i = 0; i < HEAD_RINGS; i += 1) {
    // Sweep from chin to crown as an ellipsoid.
    //
    // The rings are spaced by angle rather than by height, which bunches them
    // toward the poles. Even spacing puts a single ring between the widest part
    // of the skull and a point, so the crown comes to a ragged spike; by angle,
    // the cap gets the rings it needs and the head closes smoothly.
    const angle = (Math.PI * i) / (HEAD_RINGS - 1);
    const u = -Math.cos(angle);
    const profile = Math.sin(angle);
    // The jaw and cheeks carry forward of the cranium; the crown does not.
    const jut = Math.max(0, 1 - Math.abs(u + 0.45) * 2.1) * JAW_REACH;
    headSections.push({
      centre: add(
        add(pose.head, scale(headUp, u * HEAD_HALF_HEIGHT)),
        scale(headForward, jut),
      ),
      halfWidth: Math.max(0.01, profile * HEAD_HALF_WIDTH),
      halfDepth: Math.max(0.01, profile * HEAD_HALF_DEPTH),
    });
  }
  const head = loft(headSections, right, sampled(HEAD_SEGMENTS, detail), 'skin');

  const neckBase = add(pose.head, scale(headUp, -HEAD_HALF_HEIGHT * 0.62));
  const neck = loft(
    NECK.map(({ at, radius }) => ({
      centre: mix(pose.neck, neckBase, at),
      halfWidth: radius,
      halfDepth: radius * 0.94,
    })),
    right,
    sampled(LIMB_SEGMENTS, detail),
    'skin',
  );

  /* ---- limbs ---- */

  const limbs = [
    bone(pose.shoulderL, pose.elbowL, UPPER_ARM, up, detail),
    bone(pose.shoulderR, pose.elbowR, UPPER_ARM, up, detail),
    bone(pose.elbowL, pose.handL, FOREARM, up, detail),
    bone(pose.elbowR, pose.handR, FOREARM, up, detail),
    bone(hipL, pose.kneeL, THIGH, right, detail, { depthScale: 1.04 }),
    bone(hipR, pose.kneeR, THIGH, right, detail, { depthScale: 1.04 }),
    bone(pose.kneeL, pose.ankleL, SHIN, right, detail),
    bone(pose.kneeR, pose.ankleR, SHIN, right, detail),
    // A foot is wide and flat: `forward` here comes out along the body's up
    // axis, so squashing the depth is what flattens the sole.
    bone(pose.ankleL, pose.toeL, FOOT, right, detail, { widthScale: 1.15, depthScale: 0.68 }),
    bone(pose.ankleR, pose.toeR, FOOT, right, detail, { widthScale: 1.15, depthScale: 0.68 }),
  ];

  return [torso, neck, head, ...limbs];
}

/* ------------------------------------------------------------------ */
/* Barbell                                                             */
/* ------------------------------------------------------------------ */

/** Half the length of the sleeve-to-sleeve shaft, in cm. */
const BAR_HALF_LENGTH = 76;
const BAR_RADIUS = 1.5;
/** Where the plates sit, measured out from the middle of the bar. */
const PLATE_OFFSET = 54;
const PLATE_RADIUS = 22;
const PLATE_HALF_THICKNESS = 3.6;
const PLATE_SEGMENTS = 24;

/**
 * The bar as real geometry rather than a line drawn over the top.
 *
 * It has to be a solid for the same reason the body does: a squat puts the bar
 * behind the neck and a bench press puts it in front of the chest, and only
 * something that sorts by depth alongside the body can show both.
 */
export function buildBarbell(pose: Pose, detail: Detail = 1): Surface[] {
  const axis = normalise(subtract(pose.handR, pose.handL));
  const centre = mix(pose.handL, pose.handR, 0.5);
  const along = (distance: number) => add(centre, scale(axis, distance));

  const shaft = loft(
    [
      { centre: along(-BAR_HALF_LENGTH), halfWidth: 0.01, halfDepth: 0.01 },
      { centre: along(-BAR_HALF_LENGTH + 1.4), halfWidth: BAR_RADIUS, halfDepth: BAR_RADIUS },
      { centre: along(BAR_HALF_LENGTH - 1.4), halfWidth: BAR_RADIUS, halfDepth: BAR_RADIUS },
      { centre: along(BAR_HALF_LENGTH), halfWidth: 0.01, halfDepth: 0.01 },
    ],
    [0, 1, 0],
    8,
    'accent',
  );

  // Both faces close to a point at the centre, which fills them as flat discs.
  // Ending a plate on a wide ring instead leaves the cylinder open, and back
  // face culling then looks straight through it — the plates read as hoops.
  const plates = [-PLATE_OFFSET, PLATE_OFFSET].map((offset) =>
    loft(
      [
        { centre: along(offset - PLATE_HALF_THICKNESS), halfWidth: 0.01, halfDepth: 0.01 },
        { centre: along(offset - PLATE_HALF_THICKNESS * 0.86), halfWidth: PLATE_RADIUS * 0.94, halfDepth: PLATE_RADIUS * 0.94 },
        { centre: along(offset), halfWidth: PLATE_RADIUS, halfDepth: PLATE_RADIUS },
        { centre: along(offset + PLATE_HALF_THICKNESS * 0.86), halfWidth: PLATE_RADIUS * 0.94, halfDepth: PLATE_RADIUS * 0.94 },
        { centre: along(offset + PLATE_HALF_THICKNESS), halfWidth: 0.01, halfDepth: 0.01 },
      ],
      [0, 1, 0],
      sampled(PLATE_SEGMENTS, detail),
      'accent',
    ),
  );

  return [shaft, ...plates];
}

/* ------------------------------------------------------------------ */
/* Bench                                                               */
/* ------------------------------------------------------------------ */

/** Half the pad's width and thickness, and how far it runs each way. */
const PAD_HALF_WIDTH = 15;
const PAD_HALF_THICKNESS = 5;
const PAD_TOWARD_HEAD = 34;
const PAD_TOWARD_FEET = 42;
/** Clearance between the lifter's back and the middle of the pad. */
const PAD_STANDOFF = 16.5;
const POST_RADIUS = 3.2;

/**
 * The bench, built from the lifter rather than from the world.
 *
 * It has to be real geometry for the same reason the barbell does: drawn as a
 * flat shape behind everything, it does not sit under the lifter at any angle
 * except the one it was tuned for. Deriving it from the body's own frame means
 * it stays underneath through the whole rotation.
 */
export function buildBench(pose: Pose, detail: Detail = 1): Surface[] {
  const { right, up, forward } = bodyFrame(pose);
  const spine = mix(pose.chest, pose.hip, 0.5);
  const centre = add(spine, scale(forward, -PAD_STANDOFF));

  const along = (distance: number) => add(centre, scale(up, distance));
  const section = (distance: number, halfWidth: number) => ({
    centre: along(distance),
    halfWidth,
    halfDepth: PAD_HALF_THICKNESS,
  });

  const pad = loft(
    [
      section(PAD_TOWARD_HEAD, 0.01),
      section(PAD_TOWARD_HEAD - 3, PAD_HALF_WIDTH * 0.86),
      section(PAD_TOWARD_HEAD - 9, PAD_HALF_WIDTH),
      section(-PAD_TOWARD_FEET + 9, PAD_HALF_WIDTH * 0.88),
      section(-PAD_TOWARD_FEET + 3, PAD_HALF_WIDTH * 0.74),
      section(-PAD_TOWARD_FEET, 0.01),
    ],
    right,
    sampled(10, detail),
    'equipment',
  );

  // Posts drop straight to the floor in world space, because a bench stands on
  // the ground whatever the lifter on it is doing.
  const posts = [PAD_TOWARD_HEAD - 10, -PAD_TOWARD_FEET + 8].map((distance) => {
    const top = along(distance);
    const foot: Vec3 = [top[0], 0, top[2]];
    return loft(
      [
        { centre: top, halfWidth: POST_RADIUS, halfDepth: POST_RADIUS },
        { centre: mix(top, foot, 0.5), halfWidth: POST_RADIUS * 0.9, halfDepth: POST_RADIUS * 0.9 },
        { centre: foot, halfWidth: POST_RADIUS * 1.5, halfDepth: POST_RADIUS * 1.5 },
      ],
      right,
      sampled(8, detail),
      'equipment',
    );
  });

  return [pad, ...posts];
}

/** A point on a ring, `turn` running 0 → 1 the whole way round. */
export function ringPoint(ring: Ring, turn: number): Vec3 {
  const angle = turn * Math.PI * 2;
  return add(
    add(ring.centre, scale(ring.right, Math.cos(angle) * ring.halfWidth)),
    scale(ring.forward, Math.sin(angle) * ring.halfDepth),
  );
}
