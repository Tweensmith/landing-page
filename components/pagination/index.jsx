"use client";
import { forwardRef, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";
import { useWidth } from "../_shared/page.jsx";
import { useMedia, TOUCH } from "../_shared/media.js";

const CSS = `
.ts-pg-demo{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;font-family:var(--ts-font);color:var(--ts-ink);max-width:100%}
.ts-pg{position:relative;display:flex;align-items:center;gap:4px;margin:0;padding:4px;list-style:none;border-radius:calc(var(--ts-radius-md) + 4px);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);max-width:100%}
.ts-pg__pill{position:absolute;left:0;top:4px;height:var(--pg-s);border-radius:var(--ts-radius-md);background:var(--ts-accent);box-shadow:0 6px 16px -8px var(--ts-accent);pointer-events:none}
.ts-pg__btn{all:unset;position:relative;box-sizing:border-box;display:grid;place-items:center;min-width:var(--pg-s);height:var(--pg-s);padding:0 6px;border-radius:var(--ts-radius-md);
  font-size:13.5px;font-weight:560;font-variant-numeric:tabular-nums;color:var(--ts-ink2);cursor:pointer;transition:color .18s,background-color .15s;user-select:none}
.ts-pg__btn:hover:not([aria-current=page]):not(:disabled):not([aria-disabled=true]){color:var(--ts-ink);background:var(--ts-surface2)}
.ts-pg__btn[aria-current=page]{color:var(--ts-accent-ink);font-weight:680}
.ts-pg__btn:disabled,.ts-pg__btn[aria-disabled=true]{opacity:.35;cursor:default}
.ts-pg[aria-busy=true] .ts-pg__btn:not([aria-current=page]){opacity:.55;cursor:progress}
.ts-pg[data-off=true]{opacity:.55}
.ts-pg[data-off=true] .ts-pg__btn{opacity:1}
.ts-pg__btn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-pg__gap .ts-pg__dots,.ts-pg__gap .ts-pg__jump{grid-area:1/1;transition:opacity .15s,transform .2s}
.ts-pg__gap .ts-pg__jump{opacity:0;transform:translateX(-3px)}
.ts-pg__gap:hover .ts-pg__dots,.ts-pg__gap:focus-visible .ts-pg__dots{opacity:0}
.ts-pg__gap:hover .ts-pg__jump,.ts-pg__gap:focus-visible .ts-pg__jump{opacity:1;transform:none}
.ts-pg__gap[data-dir=back] .ts-pg__jump{transform:translateX(3px) scaleX(-1)}
.ts-pg__gap[data-dir=back]:hover .ts-pg__jump,.ts-pg__gap[data-dir=back]:focus-visible .ts-pg__jump{transform:scaleX(-1)}
.ts-pg__cmp{display:flex;align-items:center;gap:8px;padding:0 10px;font-size:13.5px;color:var(--ts-ink2);white-space:nowrap}
.ts-pg__cmp b{display:inline-grid;place-items:center;min-width:34px;height:30px;padding:0 6px;border-radius:var(--ts-radius-sm);background:var(--ts-surface2);color:var(--ts-ink);font-variant-numeric:tabular-nums}
.ts-pg-cap{font-size:12.5px;color:var(--ts-ink2)}
.ts-pg-cap b{color:var(--ts-ink);font-weight:600}
@media (max-width:640px),(pointer:coarse){.ts-pg-cap{font-size:13px}}
`;
registerStyles("ts-pagination", CSS);


/** Page list with gaps: always the first/last `boundaries` pages and `siblings` either side of the current one. */
export function pageRange(page, total, siblings = 1, boundaries = 1) {
  const slots = siblings * 2 + 3 + boundaries * 2;
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(page - siblings, boundaries + 2);
  const right = Math.min(page + siblings, total - boundaries - 1);
  const head = Array.from({ length: boundaries }, (_, i) => i + 1);
  const tail = Array.from({ length: boundaries }, (_, i) => total - boundaries + i + 1);
  const showL = left > boundaries + 2, showR = right < total - boundaries - 1;
  const mid = [];
  const from = showL ? left : boundaries + 1, to = showR ? right : total - boundaries;
  // keep the count steady so the control doesn't change width as you page
  const lo = showL ? (showR ? from : total - boundaries - (siblings * 2 + 1)) : from;
  const hi = showR ? (showL ? to : boundaries + siblings * 2 + 2) : to;
  for (let i = lo; i <= hi; i++) mid.push(i);
  return [...head, ...(showL ? ["gap-back"] : []), ...mid, ...(showR ? ["gap-fwd"] : []), ...tail];
}

// one page button in px (the bar adds 4px each side, so the bar is 38, 44 or 52px tall): sm under a dense table, lg beside 52px buttons
const SIZES = { sm: 30, md: 36, lg: 44 };

const LABELS = {
  previous: "Previous page",
  next: "Next page",
  first: "First page",
  last: "Last page",
  page: (p) => `Page ${p}`,
  jumpBack: (n) => `Jump back ${n} pages`,
  jumpForward: (n) => `Jump forward ${n} pages`,
  compact: "Page",
  of: "of",
};

/**
 * Pagination — page numbers with gaps that stay readable. Signature: the current page sits on a pill
 * that slides to the new page while the numbers glide into their new slots, and the control keeps a
 * constant width so nothing jumps under your pointer. Hover a "…" to turn it into a jump of several pages.
 * Keyboard: ← → move between pages, Home / End jump to the ends. The compact layout rolls the number.
 * On touch screens pages are 44px; on a phone the neighbours fold into the gaps so the row still fits.
 *
 * Content: the number of pages is `count`, or `total` items with `pageSize` (or, without pageSize, `total`
 * pages as before). The page is `page` + `onPageChange(page, event)`, or `defaultPage` uncontrolled. With
 * `getHref(page)` every page is a real link. `busy` holds the control while your request runs; `caption`
 * renders a line under it (a node, or ({ page, count, from, to, total }) => node). `demo` adds the sample
 * results line.
 */
export const Pagination = forwardRef(function Pagination({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  count,
  total = 1,
  pageSize,
  siblings = 1,
  boundaries = 1,
  layout = "numbers",
  showEdges = false,
  size = "md",
  getHref,
  disabled: disabledProp = false,
  busy: busyProp = false,
  caption,
  labels: labelsProp,
  ariaLabel = "Pagination",
  demo = false,
  forceState,
  className,
  style,
  "aria-label": ariaLabelAttr,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-pagination", CSS);
  const reduce = useReducedMotion();
  const L = { ...LABELS, ...labelsProp };
  const disabled = disabledProp || forceState === "disabled";
  const busy = busyProp || forceState === "loading";
  const list = useRef(null);
  const demoRef = useRef(null);
  const btns = useRef({});
  const pages = Math.max(1, Math.floor(Number(count ?? (pageSize ? Math.ceil((Number(total) || 0) / pageSize) : total)) || 1));
  const clamp = (p) => Math.min(pages, Math.max(1, Math.round(Number(p)) || 1));
  // controlled when `page` is passed; otherwise the component keeps its own, seeded by defaultPage
  const controlled = pageProp !== undefined;
  const [inner, setInner] = useState(() => clamp(defaultPage));
  const page = clamp(controlled ? pageProp : inner);
  const [pill, setPill] = useState(null);
  const refocus = useRef(false);
  useEffect(() => { setInner((p) => clamp(p)); }, [pages]);
  const setRoot = (el) => { demoRef.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

  const held = disabled || busy;
  const go = (p, focus = false, e) => {
    const next = clamp(p);
    if (held || next === page) return;
    refocus.current = focus;
    if (!controlled) setInner(next);
    onPageChange?.(next, e);
  };
  // on narrow screens drop neighbours (never the current page or the ends) until the row fits
  const room = useWidth(demoRef);
  const touch = useMedia(TOUCH);
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const target = touch ? Math.max(px, 44) : px; // fingers get 44px pages; neighbours drop first to make room
  const minBtn = touch ? 40 : 28;
  const slotsOf = (sib, edges) => Math.min(pages, sib * 2 + 3 + boundaries * 2) + 2 + (edges ? 2 : 0);
  const fits = (sib) => slotsOf(sib, showEdges) * (target + 4) + 8 <= room;
  let sib = siblings;
  while (room && sib > 0 && !fits(sib)) sib--;
  // still too wide at the smallest buttons: the first / last buttons go (Home / End still jump to the ends)
  const edges = showEdges && (!room || slotsOf(sib, true) * (minBtn + 4) + 8 <= room);
  const slots = slotsOf(sib, edges);
  const btn = room ? Math.max(minBtn, Math.min(target, Math.floor((room - 8) / slots) - 4)) : target; // then shrink buttons
  const range = pageRange(page, pages, sib, boundaries);
  const jump = sib * 2 + 3;

  // pill follows the current page's final layout slot (offsetLeft ignores in-flight transforms)
  useIsoLayoutEffect(() => {
    const el = btns.current[page];
    if (layout !== "numbers" || !el) {
      // compact layout: no page button to land on, so the arrow that is still enabled takes focus
      const ae = document.activeElement;
      if (refocus.current && list.current && (!list.current.contains(ae) || ae.disabled)) list.current.querySelector(".ts-pg__btn:not(:disabled)")?.focus();
      refocus.current = false;
      return setPill(null);
    }
    setPill({ x: el.offsetLeft, w: el.offsetWidth });
    if (refocus.current) { el.focus(); refocus.current = false; }
  }, [page, pages, sib, boundaries, layout, btn, edges]);

  const onKey = (e) => {
    const k = { ArrowLeft: page - 1, ArrowRight: page + 1, Home: 1, End: pages }[e.key];
    if (k == null) return;
    e.preventDefault();
    go(k, true, e);
  };
  const t = reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 };
  // one control: a button, or a real link when getHref is given (an unavailable link has no href and is aria-disabled)
  // `refocus`: the control pressed may go away (a … that folds) or turn disabled (Next on the last page), and
  // focus would fall to the page; it moves to the new current page instead
  const ctl = ({ to, off, refocus = false, children, className: cls = "ts-pg__btn", btnRef, ...p }) => {
    const inert = off || disabled;
    const onClick = (e) => { if (inert || busy) { e.preventDefault(); return; } go(to, refocus, e); };
    if (getHref)
      return <a ref={btnRef} className={cls} href={inert ? undefined : getHref(clamp(to))} aria-disabled={inert || busy || undefined} tabIndex={disabled ? -1 : undefined} role={inert ? "link" : undefined} onClick={onClick} {...p}>{children}</a>;
    return <button ref={btnRef} type="button" className={cls} disabled={inert} aria-disabled={busy || undefined} onClick={onClick} {...p}>{children}</button>;
  };
  const edge = (label, icon, to, off) => <li>{ctl({ to, off, refocus: clamp(to) === 1 || clamp(to) === pages, "aria-label": label, children: <Icon name={icon} size={16} stroke={2} /> })}</li>;

  const from = pageSize ? (page - 1) * pageSize + 1 : undefined;
  const to = pageSize ? Math.min(page * pageSize, Number(total) || 0) : undefined;
  const capNode = typeof caption === "function" ? caption({ page, count: pages, from, to, total: pageSize ? Number(total) : undefined }) : caption;

  return (
    <>{sheetTag}<div ref={setRoot} className={"ts-pg-demo" + (className ? " " + className : "")} style={style} {...rest}>
      <nav aria-label={ariaLabelAttr ?? ariaLabel} aria-busy={busy || undefined}>
        <ul ref={list} className="ts-pg" style={{ "--pg-s": btn + "px" }} onKeyDown={onKey} aria-busy={busy || undefined} data-off={disabled || undefined}>
          {pill && <motion.span className="ts-pg__pill" aria-hidden initial={false} animate={{ x: pill.x, width: pill.w }} transition={t} />}
          {edges && edge(L.first, "chevronLeft", 1, page === 1)}
          {edge(L.previous, "arrowLeft", page - 1, page === 1)}
          {layout === "numbers" ? (
            <AnimatePresence mode="popLayout" initial={false}>
              {range.map((p) =>
                typeof p === "number" ? (
                  <motion.li key={p} layout="position" transition={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                    {ctl({ to: p, btnRef: (el) => (btns.current[p] = el), "aria-current": p === page ? "page" : undefined, "aria-label": L.page(p), children: p })}
                  </motion.li>
                ) : (
                  <motion.li key={p} layout="position" transition={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                    {ctl({
                      to: p === "gap-back" ? page - jump : page + jump,
                      refocus: true,
                      className: "ts-pg__btn ts-pg__gap",
                      "data-dir": p === "gap-back" ? "back" : "fwd",
                      "aria-label": p === "gap-back" ? L.jumpBack(jump) : L.jumpForward(jump),
                      title: p === "gap-back" ? `Back ${jump}` : `Forward ${jump}`,
                      children: (
                        <>
                          <span className="ts-pg__dots" aria-hidden>…</span>
                          <span className="ts-pg__jump" aria-hidden style={{ display: "grid" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l6 6-6 6M13 6l6 6-6 6" /></svg></span>
                        </>
                      ),
                    })}
                  </motion.li>
                )
              )}
            </AnimatePresence>
          ) : (
            <li className="ts-pg__cmp" aria-live="polite">
              {/* the rolling digits are decoration; a screen reader reads the plain number beside them */}
              {L.compact} <b aria-hidden><RollingNumber value={page} /></b><span className="ts-sr">{page}</span> {L.of} {pages}
            </li>
          )}
          {edge(L.next, "arrowRight", page + 1, page === pages)}
          {edges && edge(L.last, "chevronRight", pages, page === pages)}
        </ul>
      </nav>
      {capNode != null && capNode !== false ? (
        <div className="ts-pg-cap" aria-live="polite">{capNode}</div>
      ) : demo ? (
        <div className="ts-pg-cap" aria-live="polite">Showing <b>{(page - 1) * 12 + 1}–{Math.min(page * 12, pages * 12 - 5)}</b> of {pages * 12 - 5} results</div>
      ) : null}
    </div></>
  );
});
