"use client";
// A mock browser window with its own scroller, for components that react to page scroll (navbar,
// scroll progress, table of contents). In a real app they take your page's scroller instead.
import { forwardRef, useEffect, useState } from "react";
import { registerStyles, useStyles } from "./theme.jsx";
import { Icon } from "./icons.jsx";
import { Art } from "./art.jsx";

const CSS = `
.ts-page{position:relative;width:min(var(--pg-w,900px),100%);height:var(--pg-h,540px);display:flex;flex-direction:column;border-radius:calc(var(--ts-radius-lg) + 4px);overflow:hidden;
  background:var(--ts-bg);box-shadow:0 0 0 1px var(--ts-line),0 30px 80px -40px color-mix(in srgb,var(--ts-bg) 60%,var(--ts-black) 40%);font-family:var(--ts-font);color:var(--ts-ink);isolation:isolate}
.ts-page__chrome{flex:none;display:flex;align-items:center;gap:12px;height:36px;padding:0 14px;background:var(--ts-surface);border-bottom:1px solid var(--ts-line)}
.ts-page__dots{display:flex;gap:6px}
.ts-page__dots i{width:10px;height:10px;border-radius:99px;background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-page__url{flex:1;max-width:340px;margin:0 auto;height:22px;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:7px;font-size:11.5px;color:var(--ts-ink2);background:var(--ts-surface2);overflow:hidden;white-space:nowrap;padding:0 8px;box-sizing:border-box}
.ts-page__url svg{flex:none}
.ts-page__url span{min-width:0;overflow:hidden;text-overflow:ellipsis}
.ts-page__end{width:46px}
.ts-page__scroll{position:relative;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain}
.ts-page__scroll:focus-visible{outline:2px solid var(--ts-focus);outline-offset:-2px}
.ts-land{display:flex;flex-direction:column;gap:56px;padding:0 clamp(16px,5%,48px) 64px}
.ts-land__hero{display:grid;gap:18px;justify-items:center;text-align:center;padding-top:calc(var(--land-top,64px) + 56px)}
.ts-land__eyebrow{font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-land__h1{margin:0;max-width:16ch;font-size:clamp(30px,6vw,52px);line-height:1.02;letter-spacing:-0.035em;font-weight:680}
.ts-land__lede{margin:0;max-width:46ch;font-size:15px;line-height:1.55;color:var(--ts-ink2)}
.ts-land__art{width:100%;aspect-ratio:16/7;border-radius:calc(var(--ts-radius-lg) + 2px);overflow:hidden}
.ts-land__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
.ts-land__card{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-land__card b{font-size:15px;font-weight:620}
.ts-land__card p{margin:0;font-size:13px;line-height:1.5;color:var(--ts-ink2)}
.ts-land__ico{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--ts-surface2);color:var(--ts-accent)}
.ts-land__row{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;align-items:center}
.ts-land__row h2{margin:0 0 10px;font-size:26px;letter-spacing:-0.025em;line-height:1.1}
.ts-land__row p{margin:0;font-size:14px;line-height:1.6;color:var(--ts-ink2)}
.ts-land__tile{aspect-ratio:4/3;border-radius:var(--ts-radius-lg);overflow:hidden}
`;
registerStyles("ts-page", CSS);

export const usePageStyles = () => useStyles("ts-page", CSS);

/** Browser-window frame. The ref points at the scrolling element. */
export const PageFrame = forwardRef(function PageFrame({ url = "northwind.app", width, height, children, label = "Demo page", onScroll }, ref) {
  const sheetTag = usePageStyles();
  return (
    <>{sheetTag}<div className="ts-page" style={{ "--pg-w": width ? width + "px" : undefined, "--pg-h": height ? height + "px" : undefined }}>
      <div className="ts-page__chrome" aria-hidden>
        <span className="ts-page__dots"><i /><i /><i /></span>
        <span className="ts-page__url"><Icon name="lock" size={11} /><span>{url}</span></span>
        <span className="ts-page__end" />
      </div>
      <div ref={ref} className="ts-page__scroll" tabIndex={0} role="region" aria-label={label} onScroll={onScroll}>{children}</div>
    </div></>
  );
});

const FEATURES = [
  { icon: "zap", title: "Instant sync", text: "Edits land on every device before you lift your finger." },
  { icon: "layers", title: "Versions", text: "Every change is kept. Scrub back through a file like a timeline." },
  { icon: "users", title: "Multiplayer", text: "See cursors, comments and selections from the whole team." },
  { icon: "lock", title: "Private by default", text: "End-to-end encryption on every plan, including free." },
];

/** Filler landing page so scroll-driven components have something to scroll. */
export function DemoLanding({ top = 64, long = true }) {
  const sheetTag = usePageStyles();
  return (
    <>{sheetTag}<div className="ts-land" style={{ "--land-top": top + "px" }}>
      <section className="ts-land__hero">
        <span className="ts-land__eyebrow">Northwind 4.0</span>
        <h1 className="ts-land__h1">The workspace that keeps up with you</h1>
        <p className="ts-land__lede">Docs, boards and files in one calm place. Scroll down and watch the navigation respond.</p>
        <Art art="glacier" lite className="ts-land__art" />
      </section>
      <section className="ts-land__cards">
        {FEATURES.map((f) => (
          <div key={f.title} className="ts-land__card">
            <span className="ts-land__ico"><Icon name={f.icon} size={18} /></span>
            <b>{f.title}</b>
            <p>{f.text}</p>
          </div>
        ))}
      </section>
      {long && ["night-bloom", "citrine", "orchid"].map((a, i) => (
        <section key={a} className="ts-land__row">
          <div>
            <h2>{["Write with the whole team", "Plan without the busywork", "Ship what you planned"][i]}</h2>
            <p>{[
              "Comments sit next to the sentence they are about, and resolve themselves when the sentence changes.",
              "Boards update from the docs that describe the work, so nobody copies status by hand on a Friday.",
              "Releases collect the finished cards, write the changelog draft, and tell the people who asked.",
            ][i]}</p>
          </div>
          <Art art={a} lite className="ts-land__tile" />
        </section>
      ))}
    </div></>
  );
}

/** Width of an element, kept current. */
export function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return w;
}
