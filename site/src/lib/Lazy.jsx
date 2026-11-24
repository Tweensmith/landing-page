import { Suspense, useEffect, useRef, useState } from "react";

/**
 * Mounts its children only once the box comes within `margin` of the viewport, so the first paint loads the
 * hero and nothing else. `minHeight` holds the space so the page does not jump when the component arrives.
 */
export function Lazy({ children, minHeight = 120, margin = "600px 0px", fallback = null, className, style, id }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on) return;
    if (typeof IntersectionObserver === "undefined") { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [on, margin]);
  return (
    <div ref={ref} id={id} className={className} style={{ minHeight, ...style }}>
      {on ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}

/** true while the element is on screen (for pausing anything that would otherwise keep running). */
export function useOnScreen(ref, margin = "0px") {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return on;
}
