// Plays the logo's timelines. One clock (milliseconds since the animation started) goes in, and every part's
// position, rotation, scale and opacity comes out. The React component, the React Native component and the
// exporter all call these functions on the same data (timelines.json), so they cannot drift apart.
//
// Springs are the kit's own (tokens.json), solved exactly, not approximated by a curve.
// Every function is marked as a worklet, so Reanimated can run it on the UI thread. On the web the mark is a no-op.

/** A spring released at 0 toward 1 (mass 1, no starting speed), `t` seconds later. */
export function springAt(stiffness, damping, t) {
  "worklet";
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness), z = damping / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  }
  if (z === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wh = w0 * Math.sqrt(z * z - 1);
  return 1 - Math.exp(-z * w0 * t) * (Math.cosh(wh * t) + ((z * w0) / wh) * Math.sinh(wh * t));
}

/** A CSS cubic-bezier(x1, y1, x2, y2) easing at progress `p` (0 to 1). */
export function bezierAt(x1, y1, x2, y2, p) {
  "worklet";
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let u = p;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * u + bx) * u + cx) * u - p;
    if (Math.abs(x) < 1e-6) break;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(d) < 1e-6) break;
    u -= x / d;
  }
  if (u < 0 || u > 1) { // Newton left the range: fall back to halving
    let lo = 0, hi = 1;
    u = p;
    for (let i = 0; i < 24; i++) {
      const x = ((ax * u + bx) * u + cx) * u;
      if (x < p) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
  }
  return ((ay * u + by) * u + cy) * u;
}

/**
 * One part's values at time `t` (ms). `keys` is a list of [time, values, ease]:
 * the part holds the first values until the first key, moves from each key to the next with that key's ease,
 * and holds the last values afterwards. Ease is null (linear), [1, stiffness, damping, scale] (a spring that
 * lands exactly on the next key) or [2, x1, y1, x2, y2] (a cubic bezier).
 */
export function sampleTrack(keys, t) {
  "worklet";
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t >= keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], span = b[0] - a[0], e = a[2];
  let p = span > 0 ? (t - a[0]) / span : 1;
  if (e) p = e[0] === 1 ? springAt(e[1], e[2], (t - a[0]) / 1000) * e[3] : bezierAt(e[1], e[2], e[3], e[4], p);
  const out = [];
  for (let j = 0; j < a[1].length; j++) out.push(a[1][j] + (b[1][j] - a[1][j]) * p);
  return out;
}

/** One part of an animation at time `t`: its track if the animation moves it, its rest values if not. */
export function part(anim, rest, name, t) {
  "worklet";
  const keys = anim.parts[name];
  return keys ? sampleTrack(keys, t) : rest[name];
}

/** The clock for a frame: loops wrap, one-shots stop on their last frame. */
export function clockAt(anim, ms) {
  "worklet";
  if (anim.loop) return ((ms % anim.play) + anim.play) % anim.play;
  return ms < 0 ? 0 : ms > anim.play ? anim.play : ms;
}

/** Where an animation rests: a loop at its start, a one-shot on its last frame. Shown under reduced motion. */
export function restTime(anim) {
  "worklet";
  return anim.loop ? 0 : anim.play;
}

/** A point along a list of evenly spaced points, `d` from 0 (start) to 1 (end). Used by the line loader. */
export function pointAt(points, d) {
  "worklet";
  const f = (d <= 0 ? 0 : d >= 1 ? 1 : d) * (points.length - 1), i = Math.min(points.length - 2, Math.floor(f)), k = f - i;
  return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k];
}
