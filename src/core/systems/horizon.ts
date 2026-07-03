// Geometric horizon & line-of-sight maths.
//
// All heights and distances are in METRES (the world unit). The academic
// horizon formula is stated in kilometres — d = C * sqrt(h) — so we convert
// internally. Two constants are offered:
//   - GEOMETRIC (3.57): pure spherical geometry, no atmosphere.
//   - REFRACTED (3.86): standard-atmosphere refraction bends light over water,
//     extending the true horizon by ~8%. Use this over the river / open sea.
//
// Derivations used below:
//   Horizon distance for an eye at height h:      d(h)  = C * sqrt(h)      [km]
//   Max range a target of height h2 is visible:   D     = C*(sqrt(h1)+sqrt(h2))
//   Height of a target hidden below the curve at   h_hidden = ((D_obj - d(h1)) / C)^2
//   a given observer→target distance D_obj:        (0 when the target is nearer
//                                                   than the observer's horizon)

/** Pure spherical-geometry constant (km per √m). */
export const HORIZON_GEOMETRIC = 3.57;
/** Standard-atmosphere refraction constant (km per √m); ~8% further than geometric. */
export const HORIZON_REFRACTED = 3.86;
/**
 * Stylised gameplay constant. The real horizon (~5 km for a standing player) is
 * larger than this whole ~3 km map, so faithful curvature would never dip
 * anything. This compressed value shrinks the horizon to a few hundred metres
 * so distant ships visibly rise hull-first out of the river. Purely cosmetic —
 * pass it as the `constantOverride` to the functions below.
 */
export const HORIZON_GAME = 0.34;

const KM = 1000;

function constant(refracted: boolean, override?: number): number {
  if (override !== undefined) return override;
  return refracted ? HORIZON_REFRACTED : HORIZON_GEOMETRIC;
}

/**
 * Distance from an eye at {@link eyeHeightM} to the visible horizon, in metres.
 * Negative or zero heights clamp to 0.
 */
export function horizonDistance(eyeHeightM: number, refracted = true, constantOverride?: number): number {
  if (eyeHeightM <= 0) return 0;
  return constant(refracted, constantOverride) * Math.sqrt(eyeHeightM) * KM;
}

/**
 * Maximum distance (metres) at which a target of height {@link targetHeightM} is
 * geometrically visible to an observer whose eye is at {@link playerHeightM} —
 * the sum of both horizons. This is the `D` from the classic geographic-range
 * formula: `D = C * (√h1 + √h2)`.
 */
export function maxVisibleDistance(
  playerHeightM: number,
  targetHeightM: number,
  refracted = true,
  constantOverride?: number,
): number {
  const h1 = Math.max(0, playerHeightM);
  const h2 = Math.max(0, targetHeightM);
  return constant(refracted, constantOverride) * (Math.sqrt(h1) + Math.sqrt(h2)) * KM;
}

/**
 * How much of a sea-level-based target (metres) is hidden *below* the horizon
 * curve when viewed from {@link playerHeightM} at ground distance
 * {@link distanceM}. 0 while the target is nearer than the observer's own
 * horizon. Feed the result straight into a downward Y offset to physically dip
 * an asset behind the bulge of the Earth.
 */
export function hiddenHeight(
  distanceM: number,
  playerHeightM: number,
  refracted = true,
  constantOverride?: number,
): number {
  const c = constant(refracted, constantOverride);
  const eyeHorizon = horizonDistance(playerHeightM, refracted, constantOverride);
  const beyond = distanceM - eyeHorizon;
  if (beyond <= 0) return 0;
  // h_hidden = (beyond_km / C)^2 metres (C is km per √m, so the result is metres).
  const beyondKm = beyond / KM;
  return (beyondKm / c) ** 2;
}

/**
 * Convenience LOS test: is a target of {@link targetHeightM} entirely below the
 * horizon (i.e. beyond {@link maxVisibleDistance}) at ground distance
 * {@link distanceM}?
 */
export function isBeyondHorizon(
  distanceM: number,
  playerHeightM: number,
  targetHeightM: number,
  refracted = true,
  constantOverride?: number,
): boolean {
  return distanceM > maxVisibleDistance(playerHeightM, targetHeightM, refracted, constantOverride);
}

/**
 * Fraction (0..1) of a target's height still poking above the horizon at the
 * given distance — 1 fully visible, 0 fully occluded. Handy to drive a fade
 * (opacity) near the horizon instead of a hard pop.
 */
export function visibleFraction(
  distanceM: number,
  playerHeightM: number,
  targetHeightM: number,
  refracted = true,
  constantOverride?: number,
): number {
  if (targetHeightM <= 0) return 0;
  const hidden = hiddenHeight(distanceM, playerHeightM, refracted, constantOverride);
  return Math.max(0, Math.min(1, (targetHeightM - hidden) / targetHeightM));
}
