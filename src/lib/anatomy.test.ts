import { describe, expect, it } from 'vitest';
import {
  bodyFrame,
  buildBarbell,
  buildBench,
  buildFigure,
  ringPoint,
  type Surface,
} from './anatomy';
import { TECHNIQUES, poseAtPhase, type Pose, type Vec3 } from './technique';

const STANDING = poseAtPhase(TECHNIQUES.other, 0);

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Every pose the app can actually show, so a broken lift cannot hide. */
const EVERY_POSE: Pose[] = Object.values(TECHNIQUES).flatMap((technique) =>
  [0, 0.25, 0.5, 0.75].map((phase) => poseAtPhase(technique, phase)),
);

const quads = (surfaces: Surface[]) =>
  surfaces.reduce((total, s) => total + (s.rings.length - 1) * s.segments, 0);

describe('buildFigure', () => {
  it('gives every surface enough geometry to sweep', () => {
    for (const surface of buildFigure(STANDING)) {
      expect(surface.rings.length).toBeGreaterThanOrEqual(2);
      expect(surface.segments).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps every ring frame orthonormal', () => {
    // The renderer takes its lighting normals from these axes; a skewed or
    // unnormalised frame would shade the body wrongly rather than fail.
    for (const pose of EVERY_POSE) {
      for (const surface of buildFigure(pose)) {
        for (const ring of surface.rings) {
          expect(length(ring.right)).toBeCloseTo(1, 6);
          expect(length(ring.forward)).toBeCloseTo(1, 6);
          expect(dot(ring.right, ring.forward)).toBeCloseTo(0, 6);
        }
      }
    }
  });

  it('winds every ring so the outward normal points outward', () => {
    // `right × forward` must run along the sweep. If it ran against it, every
    // polygon's normal would point into the body, back-face culling would throw
    // away the near side and keep the far one, and the figure would render
    // inside out — visibly wrong, but not an error anyone would catch in a type.
    for (const pose of EVERY_POSE) {
      for (const surface of buildFigure(pose)) {
        for (let i = 0; i < surface.rings.length - 1; i += 1) {
          const ring = surface.rings[i]!;
          const sweep = subtract(surface.rings[i + 1]!.centre, ring.centre);
          if (length(sweep) < 1e-6) continue;
          expect(dot(cross(ring.right, ring.forward), sweep)).toBeGreaterThan(0);
        }
      }
    }
  });

  it('closes the hands, feet and head to a point', () => {
    // An open tube shows its hollow inside once back faces are culled.
    const surfaces = buildFigure(STANDING);
    const openEnds = surfaces.filter((surface) => {
      const first = surface.rings[0]!;
      const last = surface.rings[surface.rings.length - 1]!;
      return Math.max(first.halfWidth, last.halfWidth) > 12;
    });
    // Only the torso is allowed a wide end, and both of its ends are buried.
    expect(openEnds.length).toBeLessThanOrEqual(1);
  });

  it('produces no NaN anywhere in the mesh', () => {
    for (const pose of EVERY_POSE) {
      for (const surface of buildFigure(pose)) {
        for (const ring of surface.rings) {
          for (const value of [...ring.centre, ...ring.right, ...ring.forward]) {
            expect(Number.isFinite(value)).toBe(true);
          }
        }
      }
    }
  });

  it('stays inside the polygon budget the frame rate was measured against', () => {
    // The heaviest scene is the bench press, which draws the body, the bar and
    // the bench. ~1620 quads at full detail held a steady 30 draws a second on
    // a desktop canvas throttled to a quarter speed, so this leaves some room
    // and then stops.
    const scene = (detail: number) =>
      quads(buildFigure(STANDING, detail)) +
      quads(buildBarbell(STANDING, detail)) +
      quads(buildBench(STANDING, detail));
    expect(scene(1)).toBeLessThan(1900);
  });

  it('sheds a third of its polygons at phone detail', () => {
    // What buys back the frame rate on a phone, where the extra sides are too
    // small to see anyway.
    const scene = (detail: number) =>
      quads(buildFigure(STANDING, detail)) + quads(buildBarbell(STANDING, detail));
    expect(scene(0.63)).toBeLessThan(scene(1) * 0.72);
  });

  it('never samples a ring so coarsely that it reads as a prism', () => {
    for (const surface of buildFigure(STANDING, 0.05)) {
      expect(surface.segments).toBeGreaterThanOrEqual(7);
    }
  });
});

describe('bodyFrame', () => {
  it('is an orthonormal right-handed frame', () => {
    const { right, up, forward } = bodyFrame(STANDING);
    expect(length(right)).toBeCloseTo(1, 6);
    expect(length(up)).toBeCloseTo(1, 6);
    expect(dot(right, up)).toBeCloseTo(0, 6);
    // right × up must be forward, or the pelvis and glutes would be built onto
    // the front of the body.
    const handed = cross(right, up);
    expect(dot(handed, forward)).toBeCloseTo(1, 6);
  });

  it('follows the torso rather than the world grid', () => {
    // A figure lying on a bench has its shoulders along the depth axis; the
    // pelvis has to follow, or the legs sprout sideways out of a body facing
    // the ceiling.
    const lying: Pose = { ...STANDING, shoulderL: [0, 40, -20], shoulderR: [0, 40, 20] };
    const { right } = bodyFrame(lying);
    expect(Math.abs(right[2])).toBeGreaterThan(Math.abs(right[0]));
  });
});

describe('ringPoint', () => {
  it('walks the ellipse the ring describes', () => {
    const ring = {
      centre: [0, 0, 0] as Vec3,
      right: [1, 0, 0] as Vec3,
      forward: [0, 0, 1] as Vec3,
      halfWidth: 10,
      halfDepth: 4,
    };
    expect(ringPoint(ring, 0)).toEqual([10, 0, 0]);
    expect(ringPoint(ring, 0.25)[2]).toBeCloseTo(4, 6);
    expect(ringPoint(ring, 0.5)[0]).toBeCloseTo(-10, 6);
  });

  it('returns to the start after a full turn', () => {
    const surface = buildFigure(STANDING)[0]!;
    const ring = surface.rings[2]!;
    const start = ringPoint(ring, 0);
    const round = ringPoint(ring, 1);
    for (let i = 0; i < 3; i += 1) expect(round[i]).toBeCloseTo(start[i]!, 6);
  });
});

describe('buildBarbell', () => {
  it('runs the bar along the hands', () => {
    const [shaft] = buildBarbell(STANDING);
    const span = subtract(
      shaft!.rings[shaft!.rings.length - 1]!.centre,
      shaft!.rings[0]!.centre,
    );
    const grip = subtract(STANDING.handR, STANDING.handL);
    // Parallel to the grip, and reaching well beyond it — a bar the width of
    // the hands would have nowhere to put plates.
    expect(dot(span, grip)).toBeGreaterThan(0);
    expect(length(span)).toBeGreaterThan(length(grip) * 2);
  });

  it('puts the plates outboard of both hands', () => {
    const [, left, rightPlate] = buildBarbell(STANDING);
    const centre = (surface: Surface) => surface.rings[0]!.centre[0];
    expect(centre(left!)).toBeLessThan(STANDING.handL[0]);
    expect(centre(rightPlate!)).toBeGreaterThan(STANDING.handR[0]);
  });

  it('is drawn in the brand colour, and nothing else is', () => {
    for (const surface of buildBarbell(STANDING)) {
      expect(surface.material).toBe('accent');
    }
    for (const surface of buildFigure(STANDING)) {
      expect(surface.material).toBe('skin');
    }
    for (const surface of buildBench(STANDING)) {
      expect(surface.material).toBe('equipment');
    }
  });
});

describe('buildBench', () => {
  it('puts the pad under the lifter, not through them', () => {
    // The bench is derived from the body's own frame, so it has to end up
    // behind the lifter's back whichever way the lifter is facing.
    const lying: Pose = {
      ...STANDING,
      chest: [0, 44, -2],
      hip: [0, 40, 30],
      shoulderL: [-19, 42, -8],
      shoulderR: [19, 42, -8],
    };
    const { forward } = bodyFrame(lying);
    const [pad] = buildBench(lying);
    const spine: Vec3 = [
      (lying.chest[0] + lying.hip[0]) / 2,
      (lying.chest[1] + lying.hip[1]) / 2,
      (lying.chest[2] + lying.hip[2]) / 2,
    ];
    for (const ring of pad!.rings) {
      expect(dot(subtract(ring.centre, spine), forward)).toBeLessThan(0);
    }
  });

  it('stands its posts on the floor', () => {
    const [, ...posts] = buildBench(STANDING);
    for (const post of posts) {
      const foot = post.rings[post.rings.length - 1]!;
      expect(foot.centre[1]).toBeCloseTo(0, 6);
    }
  });
});

describe('proportions', () => {
  it('sizes the head against the shoulders like a real figure', () => {
    // The check that catches a bobblehead: a head is clearly narrower than the
    // shoulders and a small fraction of standing height.
    const surfaces = buildFigure(STANDING);
    const head = surfaces[2]!;
    const widest = Math.max(...head.rings.map((ring) => ring.halfWidth));
    const shoulders = (STANDING.shoulderR[0] - STANDING.shoulderL[0]) / 2;
    expect(widest).toBeLessThan(shoulders);
    expect(widest * 2).toBeLessThan(STANDING.head[1] / 5);
  });

  it('makes the ribcage wider than the waist and the thigh thicker than the shin', () => {
    const [torso, , , , , , , thigh, , shin] = buildFigure(STANDING);
    const ribcage = Math.max(...torso!.rings.slice(1, 4).map((r) => r.halfWidth));
    const waist = torso!.rings[4]!.halfWidth;
    expect(ribcage).toBeGreaterThan(waist);
    const thickest = (surface: Surface) => Math.max(...surface.rings.map((r) => r.halfWidth));
    expect(thickest(thigh!)).toBeGreaterThan(thickest(shin!));
  });
});

describe('camera framing', () => {
  it('looks down on the bench press far more than on standing lifts', () => {
    // Flat on a bench, head, hips and feet share a height; only elevation
    // separates them on screen.
    expect(TECHNIQUES.bench.cameraPitch).toBeGreaterThan(TECHNIQUES.squat.cameraPitch * 3);
  });

  it('gives every lift a plausible camera', () => {
    for (const technique of Object.values(TECHNIQUES)) {
      expect(technique.cameraPitch).toBeGreaterThanOrEqual(0);
      expect(technique.cameraPitch).toBeLessThan(Math.PI / 2);
      expect(technique.cycleSeconds).toBeGreaterThan(0);
      expect(technique.frames.length).toBeGreaterThan(0);
    }
  });
});
