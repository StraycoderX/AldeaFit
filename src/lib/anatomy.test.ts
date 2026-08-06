import { describe, expect, it } from 'vitest';
import { HEAD_RADIUS, LIMBS, TORSO_OUTLINE, buildBody } from './anatomy';
import { TECHNIQUES, poseAtPhase, type Pose } from './technique';

const STANDING = poseAtPhase(TECHNIQUES.other, 0);

describe('buildBody', () => {
  it('resolves every joint the renderer asks for', () => {
    // The renderer skips a limb whose endpoints do not resolve, so a typo here
    // would silently delete a body part instead of failing.
    const body = buildBody(STANDING);
    for (const limb of LIMBS) {
      expect(body[limb.from], `limb from ${limb.from}`).toBeDefined();
      expect(body[limb.to], `limb to ${limb.to}`).toBeDefined();
    }
    for (const joint of TORSO_OUTLINE) {
      expect(body[joint], `torso outline ${joint}`).toBeDefined();
    }
  });

  it('puts the pelvis and ribcage either side of the spine', () => {
    const body = buildBody(STANDING);
    expect(body.hipL[0]).toBeLessThan(body.hip[0]);
    expect(body.hipR[0]).toBeGreaterThan(body.hip[0]);
    expect(body.chestL[0]).toBeLessThan(body.chest[0]);
    expect(body.chestR[0]).toBeGreaterThan(body.chest[0]);
  });

  it('makes the ribcage wider than the waist', () => {
    const body = buildBody(STANDING);
    const chest = body.chestR[0] - body.chestL[0];
    const waist = body.waistR[0] - body.waistL[0];
    expect(chest).toBeGreaterThan(waist);
  });

  it('puts the waist between chest and hip', () => {
    const body = buildBody(STANDING);
    expect(body.waistL[1]).toBeLessThan(body.chest[1]);
    expect(body.waistL[1]).toBeGreaterThan(body.hip[1]);
  });

  it('orients the pelvis with the torso, not with the world grid', () => {
    // A lying figure has its shoulders along the depth axis; the pelvis has to
    // follow, or the legs sprout sideways out of a body facing the ceiling.
    const lying: Pose = {
      ...STANDING,
      shoulderL: [0, 40, -20],
      shoulderR: [0, 40, 20],
    };
    const body = buildBody(lying);
    const spread = Math.abs(body.hipR[2] - body.hipL[2]);
    const sideways = Math.abs(body.hipR[0] - body.hipL[0]);
    expect(spread).toBeGreaterThan(sideways);
  });
});

describe('LIMBS', () => {
  it('tapers every limb toward its far end', () => {
    // Constant-width segments are what make a figure read as a stick drawing.
    for (const limb of LIMBS) {
      expect(limb.endRadius, `${limb.from}->${limb.to}`).toBeLessThan(limb.startRadius);
    }
  });

  it('keeps every belly inside the segment', () => {
    for (const limb of LIMBS) {
      expect(limb.midAt).toBeGreaterThan(0);
      expect(limb.midAt).toBeLessThan(1);
    }
  });

  it('uses positive radii throughout', () => {
    for (const limb of LIMBS) {
      expect(Math.min(limb.startRadius, limb.midRadius, limb.endRadius)).toBeGreaterThan(0);
    }
  });

  it('draws each limb once', () => {
    const seen = LIMBS.map((limb) => `${limb.from}->${limb.to}`);
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe('TORSO_OUTLINE', () => {
  it('is a closed loop with no repeated point', () => {
    // The fill closes the path itself; a duplicated first point would put a
    // zero-length segment in the smoothed curve.
    expect(new Set(TORSO_OUTLINE).size).toBe(TORSO_OUTLINE.length);
    expect(TORSO_OUTLINE.length).toBeGreaterThanOrEqual(6);
  });

  it('walks down one side and back up the other', () => {
    const body = buildBody(STANDING);
    const side = TORSO_OUTLINE.map((joint) => Math.sign(body[joint][0]));
    // Ignoring the joints on the midline, the sign must flip exactly once.
    const flips = side.filter((s) => s !== 0);
    const changes = flips.filter((s, i) => i > 0 && s !== flips[i - 1]).length;
    expect(changes).toBe(1);
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

describe('proportions', () => {
  it('sizes the head against the shoulders like a real figure', () => {
    // Head roughly a fifth to a ninth of standing height, and clearly narrower
    // than the shoulders — the check that catches a bobblehead.
    const body = buildBody(STANDING);
    const height = body.head[1] + HEAD_RADIUS;
    expect(HEAD_RADIUS * 2).toBeLessThan(height / 5);
    expect(HEAD_RADIUS * 2).toBeLessThan(body.shoulderR[0] - body.shoulderL[0]);
  });
});
