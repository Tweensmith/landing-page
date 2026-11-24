import { useEffect, useRef } from "react";
import { motionTokens } from "virtual:catalogue";

/**
 * A ring that trails the pointer and comes to rest on it. It moves on the kit's `snappy` spring (tokens.json),
 * integrated here so it carries the hand's speed; it widens over anything that can be pressed and tightens on a press.
 * Over an element with `data-cursor="word"` it opens and carries that word (the hero's words say "throw", the free set's row says "drag").
 * The system cursor stays as it is: this is a companion, not a replacement. It only exists for a mouse or trackpad,
 * and not under reduced motion. No frame is requested once the ring is on the pointer.
 */
const STEP = 1 / 240;
const PRESSABLE = "a, button, [role=button], input, textarea, select, label, summary";

export function Cursor() {
  const el = useRef(null);
  const label = useRef(null);
  useEffect(() => {
    const node = el.current;
    if (!node || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sp = motionTokens.springs.snappy ?? { stiffness: 420, damping: 34 };
    const p = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, raf: 0, last: 0, acc: 0, seen: false };
    const paint = () => { node.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`; };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - p.last) / 1000); p.last = now; p.acc += dt;
      while (p.acc >= STEP) {
        p.acc -= STEP;
        p.vx += (-sp.stiffness * (p.x - p.tx) - sp.damping * p.vx) * STEP; p.vy += (-sp.stiffness * (p.y - p.ty) - sp.damping * p.vy) * STEP;
        p.x += p.vx * STEP; p.y += p.vy * STEP;
      }
      if (Math.hypot(p.x - p.tx, p.y - p.ty) < 0.3 && Math.hypot(p.vx, p.vy) < 5) { p.x = p.tx; p.y = p.ty; p.vx = p.vy = 0; p.raf = 0; paint(); return; }
      paint();
      p.raf = requestAnimationFrame(tick);
    };
    // What is under the pointer decides the ring's look: a word to carry, something pressable, or nothing.
    const look = (target) => {
      const say = target?.closest?.("[data-cursor]")?.dataset.cursor || "";
      if (label.current && label.current.textContent !== say) label.current.textContent = say;
      node.toggleAttribute("data-say", !!say);
      node.toggleAttribute("data-over", !say && !!target?.closest?.(PRESSABLE));
    };
    const move = (e) => {
      if (e.pointerType !== "mouse") return;
      p.tx = e.clientX; p.ty = e.clientY;
      if (!p.seen) { p.seen = true; p.x = p.tx; p.y = p.ty; paint(); }
      node.toggleAttribute("data-on", true);
      look(e.target);
      if (!p.raf) { p.last = performance.now(); p.acc = 0; p.raf = requestAnimationFrame(tick); }
    };
    const down = (e) => { if (e.pointerType === "mouse") node.toggleAttribute("data-down", true); };
    // Things move under a still pointer: a dragged word flies home after release, and the page scrolls. So look again
    // at what is really underneath on release, a little after it, and after a scroll.
    let later = [];
    const again = () => { if (p.seen) look(document.elementFromPoint(p.tx, p.ty)); };
    const up = (e) => {
      node.toggleAttribute("data-down", false);
      if (e?.pointerType !== "mouse") return;
      later.forEach(clearTimeout);
      later = [0, 250, 700, 1400].map((ms) => setTimeout(again, ms));
    };
    let scrolled = 0;
    const scroll = () => { if (!scrolled) scrolled = requestAnimationFrame(() => { scrolled = 0; again(); }); };
    const gone = () => { node.toggleAttribute("data-on", false); p.seen = false; };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("pointerup", up, { passive: true });
    addEventListener("pointercancel", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", gone);
    addEventListener("scroll", scroll, { passive: true });
    return () => {
      removeEventListener("scroll", scroll); later.forEach(clearTimeout); cancelAnimationFrame(scrolled);
      removeEventListener("pointermove", move); removeEventListener("pointerdown", down); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      document.documentElement.removeEventListener("mouseleave", gone);
      cancelAnimationFrame(p.raf);
    };
  }, []);
  return <div className="cursor" ref={el} aria-hidden><i /><b ref={label} /></div>;
}
