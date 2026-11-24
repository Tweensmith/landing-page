// Tweensmith's outline mark for a page: the mark in hairlines, rings of equal distance round it, a pulse of
// brightness moving out through the rings and a bright line lapping each piece (../README.md).
// It is a ground. Give it a box with a height and it fills the box: the rings are cropped at the box's edge,
// the mark is drawn whole, and nothing in it takes the pointer.
//
//   <OutlineRings />                                  the mark in the middle, 48% of the box's height
//   <OutlineRings size={140} x="72%" glow />           the mark 140px tall, 72% across; the soft patch for dark grounds
//   <OutlineRings ground={mode} glow={mode === "dark"} />   on a page with a light and dark switch
//   <OutlineRings loop={false} ref={rings} />          rings at rest; rings.current.pulse() sends one pulse outward
//
// It draws in the text colour around it, so it follows a light and dark switch. It stops while it is off screen
// or `paused`. Under reduced motion the rings rest, the bright lines are not drawn and pulse() does nothing.
// Every shape, strength and timing comes from ../src/picture.json, which ../build.mjs writes from the brand's
// one shape file (brand/system/mark.json). Nothing here is drawn by hand.
import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from "react";
import PIC from "../src/picture.json";

const { box: BOX, rings: RINGS, lights: LIGHTS, line: LINE, glow: GLOW, ring: RING, wave: WAVE } = PIC;
const css = (v) => (typeof v === "number" ? `${v}px` : v);
const n = (v) => +v.toFixed(4);
const MIN_GAP = 200; // ms: a second pulse asked for sooner than this after the last one is not sent

/**
 * @param {number|string} [size]   The mark's height: px as a number, or any CSS length. A percentage is of the
 *                                 box's height. Default 48%. The whole picture scales with it, lines included.
 * @param {number|string} [x]      Where the mark's middle sits across the box. Default 50%.
 * @param {number|string} [y]      Where the mark's middle sits down the box. Default 50%.
 * @param {number}  [rings]        How many rings to draw, from the mark outward, 1 to 80. Default 80, which reaches
 *                                 256/54 = 4.7 mark-heights from the mark's edge. The last ten drawn fade to nothing.
 * @param {boolean} [loop]         The pulse that keeps moving out through the rings. Default true. With false the
 *                                 rings rest until pulse() is called.
 * @param {boolean} [lights]       The bright line lapping each piece. Default true.
 * @param {"dark"|"light"} [ground] The ground it sits on. Default "dark". On "light" the rings are drawn 1.55 times
 *                                 stronger, which makes them read as they do on night; the outline and the lights
 *                                 stay as they are.
 * @param {boolean} [glow]         A soft lighter patch behind the mark. For dark grounds. Default false.
 * @param {boolean} [paused]       Holds every animation where it is. Default false.
 * @param {string}  [label]        Names the picture for assistive technology. Without it the picture is hidden from it.
 * The ref gives { pulse(), element }. size, x and y can also be set from CSS on the box, as --tsf-size, --tsf-x
 * and --tsf-y, when they should change at a breakpoint.
 */
export const OutlineRings = forwardRef(function OutlineRings(
  { size, x, y, rings = RINGS.length, loop = true, lights = true, ground = "dark", glow = false, paused = false, label, className = "", style, ...rest },
  ref,
) {
  const box = useRef(null), last = useRef(-Infinity);
  const gid = `tsf-g${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const count = Math.max(1, Math.min(RINGS.length, Math.round(rings) || 0));
  const strength = (i) => Math.min(1, (count - i) / RING.fade); // the last rings drawn fade out, so the field has no hard rim

  // Off screen, everything holds. The mark is a data attribute, not a class, so a re-render does not wipe it.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-away", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    /** Sends one pulse out from the mark, a ring every 30ms. Returns false when it was not sent. */
    pulse() {
      const el = box.current, now = performance.now();
      if (!el || paused || el.hasAttribute("data-away") || now - last.current < MIN_GAP) return false;
      if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      last.current = now;
      const duration = WAVE.rise + WAVE.fall, peak = WAVE.rise / duration;
      const ground = parseFloat(getComputedStyle(el).getPropertyValue("--tsf-strength")) || 1; // 1.55 on a light ground
      el.querySelectorAll(".rg").forEach((ring, i) => {
        if (typeof ring.animate !== "function") return;
        const lo = n(RINGS[i].lo * strength(i) * ground), hi = n(RINGS[i].hi * strength(i) * ground);
        // At rest the ring starts and ends on its resting strength. While the loop runs it starts and ends on
        // whatever the loop is showing at that moment, so the two never fight.
        // stroke-opacity, as in the CSS: an opacity animation would give every ring a compositor layer of its own.
        const frames = loop ? [{ strokeOpacity: hi, offset: peak, easing: WAVE.ease }] : [{ strokeOpacity: lo, easing: WAVE.ease }, { strokeOpacity: hi, offset: peak, easing: WAVE.ease }, { strokeOpacity: lo }];
        ring.animate(frames, { duration, delay: i * WAVE.step });
      });
      return true;
    },
    get element() { return box.current; },
  }), [paused, loop, count]);

  const vars = {};
  if (size != null) vars["--tsf-size"] = css(size);
  if (x != null) vars["--tsf-x"] = css(x);
  if (y != null) vars["--tsf-y"] = css(y);
  const names = ["tsf-box", ground === "light" && "tsf-light", !loop && "tsf-still", paused && "tsf-paused", className].filter(Boolean).join(" ");
  const named = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <div ref={box} className={names} style={{ ...vars, ...style }} {...named} {...rest}>
      <style>{PIC.css}</style>
      <svg className="tsf" viewBox={`${BOX.x} ${BOX.y} ${BOX.size} ${BOX.size}`} focusable="false">
        {glow && (
          <>
            <defs>
              <radialGradient id={gid}>
                <stop offset="0" stopColor="currentColor" stopOpacity={GLOW.opacity} />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={GLOW.cx} cy={GLOW.cy} rx={GLOW.rx} ry={GLOW.ry} fill={`url(#${gid})`} />
          </>
        )}
        <g fill="none" stroke="currentColor" strokeWidth={LINE.hair}>
          {RINGS.slice(0, count).map((r, i) => (
            <path key={i} className="rg" style={{ "--lo": n(r.lo * strength(i)), "--hi": n(r.hi * strength(i)), animationDelay: `${r.delay}ms` }} d={r.d} />
          ))}
        </g>
        <path fill="none" stroke="currentColor" strokeWidth={LINE.hair} opacity={LINE.edge} d={PIC.outline} />
        {lights && (
          <g fill="none" stroke="currentColor" strokeWidth={LINE.light} strokeLinecap="round">
            {LIGHTS.map((l, i) => (
              <path key={i} className="lt" pathLength="100" strokeDasharray={l.dash} style={{ animationDelay: `${l.delay}ms` }} d={l.d} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
});
