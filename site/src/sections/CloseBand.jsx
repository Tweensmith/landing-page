import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Lazy, useOnScreen } from "../lib/Lazy.jsx";
import { counts } from "../lib/counts.js";
import { links } from "../links.js";
import "./close/close.css";

const CtaBand = lazy(() => import("../../../components/cta-band/index.jsx").then((m) => ({ default: m.CtaBand })));
// The brand's outline mark with its rings (brand/outline/README.md, "On a page"). It is the brand session's
// component: the page places it and asks it for a pulse, and changes nothing inside it.
const OutlineRings = lazy(() => import("../../../brand/outline/react/OutlineRings.jsx").then((m) => ({ default: m.OutlineRings })));

// The closing band is the kit's CTA Band, kept by the owner on 2026-11-23 over three other options ("I love the
// previous one more"), with its second key taken out ("Remove it instead"). CTA Band is a Pro component (its
// meta.json, `tier`); the owner has been told. The options not chosen are parked in sections/parked/Closing*.jsx.
//
// Under the band stands the brand's outline logo, large, with its rings always moving, leading into the footer
// (owner, 2026-11-23: "Always moving but bigger and under the CTA card introducing the Footer"). Its rings run
// up under the band and down to the footer's edge. It had a pause key; the owner had it removed (2026-11-23).
// It still stops by itself while it is off screen and under reduced motion (the component does both). Touching
// the band's key sends one extra pulse out through the rings.
// What the page may and may not do with the outline is the brand session's to say (brand/outline/README.md):
// the mark is never cropped or covered, nothing follows the pointer, one colour.
// The two other ways shown to the owner were the same picture above the band, at rest (pulsing only on arrival
// and on the key) and always moving: `loop={false} lights={false}` and the space placed before the band.
//
// The logo answers the pointer (owner, 2026-11-24: "Let this animated outline logo react when hovered upon, by
// allowing it to reveal subtle animated gradient bleed beneath it or let it glow subtle green on hover in dark
// mode and another visible color in light mode"). Both halves of that are one thing here: while the pointer is
// on the mark, a soft coloured light in the mark's own shape comes up beneath the hairlines and turns slowly,
// green on both pages (the light page's was orange at first; see close.css), and one pulse goes out through the rings. The light is
// the page's own layer, under the brand's component, which is not changed and keeps drawing in one colour. It
// answers that the pointer is on the mark, not where on it. A touch lights it for a moment, since a finger does
// not hover. Under reduced motion the light comes up and stays still.
const TOUCH_MS = 2400; // how long a touch keeps the light up
const go = (hash) => { location.hash = hash; };
const onKey = (el) => !!el?.closest?.(".ts-cta-target");

export function CloseBand({ mode }) {
  const section = useRef(null), rings = useRef(null);
  const near = useOnScreen(section, "700px 0px");
  const [load, setLoad] = useState(false);
  useEffect(() => { if (near) setLoad(true); }, [near]);

  const pulse = () => { rings.current?.pulse(); };
  const [lit, setLit] = useState(false);
  const off = useRef(0);
  useEffect(() => () => clearTimeout(off.current), []);
  const light = (e) => {
    clearTimeout(off.current);
    setLit(true); pulse();
    if (e.pointerType === "touch") off.current = setTimeout(() => setLit(false), TOUCH_MS);
  };
  const dim = (e) => { if (e.pointerType !== "touch") setLit(false); };
  const repoLive = links.repo.live && links.repo.href;
  return (
    <section className="clr" id="close" ref={section} aria-labelledby="cta-wrap-h" data-mode={mode === "dark" ? "dark" : "light"}>
      {/* the light beneath the mark: a wide soft patch, and the mark's own shape filled with a turning gradient */}
      {load && (
        <span className="clr__bleed" data-lit={lit ? "" : undefined} aria-hidden>
          <span className="clr__halo" />
          <span className="clr__fill"><i /></span>
        </span>
      )}
      {load && (
        <Suspense fallback={null}>
          {/* `ground` draws the rings stronger on the light page (the brand's setting; owner, 2026-11-23: "Yes, strengthen") */}
          <OutlineRings ref={rings} className="clr__rings" ground={mode === "dark" ? "dark" : "light"} glow={mode === "dark"} />
        </Suspense>
      )}
      <div
        className="clr__in"
        // touching the band's one key sends a pulse too: pointer, press or keyboard focus
        onPointerOver={(e) => { if (onKey(e.target) && !onKey(e.relatedTarget)) pulse(); }}
        onPointerDown={(e) => { if (onKey(e.target)) pulse(); }}
        onFocus={(e) => { if (onKey(e.target)) pulse(); }}
      >
        <h2 id="cta-wrap-h" className="sr">Get the free components</h2>
        <Lazy minHeight={360}>
          <CtaBand
            kind="field"
            eyebrow="Tweensmith"
            headline="Grab something. Throw it. Then read its spec."
            subline={`${counts.freeWeb} free components, each with the metadata your agent needs to tune it.`}
            primaryLabel={repoLive ? "Open the repository" : "Where to get it"}
            onPrimary={() => (repoLive ? window.open(links.repo.href, "_self") : go("#get"))}
            headingLevel={3}
            reassurance={[
              { icon: "check", label: `${counts.freeWeb} web components, free` },
              { icon: "check", label: "Open source, MIT licence" },
              { icon: "check", label: "Works with or without an agent" },
            ]}
          />
        </Lazy>
        {/* the space the logo stands in, clear of the band */}
        <div className="clr__zone" aria-hidden />
      </div>
      {/* where the pointer has to be: the mark's own square. It is not a control and does nothing when pressed. */}
      <span className="clr__mark" aria-hidden onPointerEnter={light} onPointerLeave={dim} />
    </section>
  );
}
