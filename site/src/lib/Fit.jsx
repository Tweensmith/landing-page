import { useLayoutEffect, useRef, useState } from "react";

/**
 * Lays its child out at up to 560px wide and, if that is bigger than the box, scales it down to fit, so a button and
 * a whole demo board can be shown in the same space. It never shrinks a tall one below 70%, where its text stops
 * being readable: a taller one is shown from its top at 70% and fades out at the bottom of the box.
 */
const SMALLEST = 0.7;
export function Fit({ children }) {
  const box = useRef(null), inner = useRef(null);
  const [fit, setFit] = useState({ scale: 1, crop: false });
  useLayoutEffect(() => {
    const b = box.current, i = inner.current;
    if (!b || !i || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = Math.max(i.offsetWidth, i.scrollWidth), h = i.offsetHeight;
      if (!w || !h) return;
      const scale = Math.min(1, b.clientWidth / w, Math.max(SMALLEST, b.clientHeight / h));
      const crop = h * scale > b.clientHeight + 1;
      setFit((f) => (Math.abs(f.scale - scale) < 0.004 && f.crop === crop ? f : { scale, crop }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(b); ro.observe(i); measure();
    return () => ro.disconnect();
  }, []);
  return (
    <div className="fit" ref={box} data-crop={fit.crop || undefined}>
      <div className="fit__in" ref={inner} style={{ transform: fit.scale < 1 ? `scale(${fit.scale.toFixed(3)})` : undefined }}>{children}</div>
    </div>
  );
}
