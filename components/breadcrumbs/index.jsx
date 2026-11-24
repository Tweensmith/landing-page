"use client";
import { forwardRef, isValidElement, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { useDismiss } from "../_shared/overlay.jsx";
import { MenuPanel, useMenuState } from "../_shared/menu.jsx";
import { useWidth } from "../_shared/page.jsx";

const CSS = `
.ts-bc-demo{display:flex;flex-direction:column;align-items:flex-start;gap:10px;width:max-content;max-width:100%;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-bc-root{min-width:0;max-width:100%;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-bc-fit{position:relative;min-width:0;max-width:100%;overflow:hidden}
.ts-bc-box{position:relative;box-sizing:border-box;width:var(--bc-w);min-width:180px;max-width:100%;padding:14px 26px 14px 16px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);resize:horizontal;overflow:hidden}
.ts-bc-grip{position:absolute;right:5px;bottom:5px;width:10px;height:10px;pointer-events:none;color:var(--ts-ink2);opacity:.6}
.ts-bc-cap{display:flex;gap:12px;align-items:center;font-size:12px;color:var(--ts-ink2)}
.ts-bc-cap b{font-family:var(--ts-font-mono);font-weight:500;color:var(--ts-ink)}
.ts-bc-reset{all:unset;cursor:pointer;color:var(--ts-accent);font-weight:600}
.ts-bc-reset:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px;border-radius:4px}
.ts-bc{display:flex;align-items:center;flex-wrap:nowrap;gap:0;margin:0;padding:0;list-style:none;min-width:0;font-size:13.5px}
.ts-bc__li{display:flex;align-items:center;min-width:0;flex:none}
.ts-bc__li:last-child{flex:0 1 auto}
.ts-bc__crumb{all:unset;display:flex;align-items:center;gap:7px;height:30px;padding:0 8px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);white-space:nowrap;cursor:pointer;transition:color .15s,background-color .15s}
.ts-bc__crumb:hover{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-bc__crumb[aria-disabled=true]{cursor:default;opacity:.5}
.ts-bc__crumb[aria-disabled=true]:hover{color:var(--ts-ink2);background:none}
.ts-bc__crumb:focus-visible,.ts-bc__more:focus-visible{outline:2px solid var(--ts-focus);outline-offset:-2px}
.ts-bc__here:focus{outline:none}
.ts-bc__here:focus-visible{outline:2px solid var(--ts-focus);outline-offset:-2px;border-radius:var(--ts-radius-sm)}
.ts-bc__here{display:block;padding:0 8px;font-weight:600;color:var(--ts-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ts-bc__sep{display:grid;place-items:center;width:16px;flex:none;color:var(--ts-ink2);opacity:.55;font-size:13px;pointer-events:none}
.ts-bc__more{all:unset;display:grid;place-items:center;width:30px;height:30px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);cursor:pointer}
.ts-bc__more:hover,.ts-bc__more[aria-expanded=true]{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-bc-measure{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;display:flex;white-space:nowrap}
.ts-bc-handle{display:none}
@media (max-width:640px),(pointer:coarse){
  .ts-bc-box{padding-top:7px;padding-bottom:7px}
  .ts-bc__crumb{height:44px}
  .ts-bc__more{width:44px;height:44px}
  .ts-bc-reset{padding:12px 4px;margin:-12px -4px}
  .ts-bc-root .ts-menu{min-width:240px;padding:6px}
  .ts-bc-root .ts-menu__item{height:44px;gap:12px;font-size:15px}
}
@media (pointer:coarse){
  /* the native resize corner can't be dragged by a finger: a 44px handle does the same job */
  .ts-bc-box{resize:none}
  .ts-bc-handle{display:block;position:absolute;right:0;bottom:0;width:44px;height:44px;touch-action:none;cursor:ew-resize}
}
`;
registerStyles("ts-breadcrumbs", CSS);

export const DEMO_PATH = [
  { label: "Northwind", icon: "home" },
  { label: "Finance", icon: "folder" },
  { label: "Reports", icon: "folder" },
  { label: "2026", icon: "folder" },
  { label: "Quarterly", icon: "folder" },
  { label: "Q4 board pack", icon: "folder" },
  { label: "Revenue by region.pdf", icon: "doc" },
];

const iconOf = (icon, size) => (typeof icon === "string" ? <Icon name={icon} size={size} /> : icon ?? null);

/**
 * Breadcrumbs — a path that truncates by meaning, not by characters. Signature: as space runs out,
 * the middle of the trail folds into a "…" menu one level at a time, always keeping the root and the
 * levels nearest you; the current page gets an ellipsis only as a last resort. Crumbs slide into their
 * new places instead of jumping. On touch screens every crumb is a 44px target.
 *
 * Content: `items` are { label, href?, onClick?, icon?, disabled? }; the last one is the current page
 * (aria-current="page", not a link). Links are plain <a href> unless you pass `linkAs` (a component such as
 * your router's Link, given href, to, className, onClick and children) or `renderLink(item, props)`.
 * `maxItems` caps how many crumbs show before the middle folds; folded levels are reachable from the … menu,
 * which calls `onNavigate(item, index)` (or the item's onClick, or follows its href). `demo` shows a sample
 * path in a resizable box with a width readout, where clicking a crumb walks up the path.
 */
export const Breadcrumbs = forwardRef(function Breadcrumbs({
  items: itemsProp,
  separator = "chevron",
  showIcons = true,
  maxItems = 0,
  linkAs,
  renderLink,
  onNavigate,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ariaLabel = "Breadcrumb",
  width = 640,
  demo = false,
  forceState,
  className,
  style,
  "aria-label": ariaLabelAttr,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-breadcrumbs", CSS);
  const reduce = useReducedMotion();
  const items = itemsProp?.length ? itemsProp : demo ? DEMO_PATH : [];
  const box = useRef(null);
  const measure = useRef(null);
  const moreBtn = useRef(null);
  const boxW = useWidth(box);
  const [depth, setDepth] = useState(items.length);
  useEffect(() => { setDepth(items.length); }, [items.length]);
  const [keep, setKeep] = useState(items.length); // trailing crumbs kept when folded (all = not folded)
  // the … menu: `open` when controlled, else its own state seeded by defaultOpen; onOpenChange hears every change
  const [menuInner, setMenuInner] = useState(defaultOpen);
  const menuOpen = openProp !== undefined ? !!openProp : menuInner;
  const menuRef = useRef(menuOpen);
  menuRef.current = menuOpen;
  const setMenuOpen = (v) => {
    const next = typeof v === "function" ? v(menuRef.current) : v;
    if (next === menuRef.current) return;
    menuRef.current = next;
    if (openProp === undefined) setMenuInner(next);
    onOpenChange?.(next);
  };
  const menu = useMenuState({});
  // only the demo walks up its own path; with your items the trail is exactly what you pass
  const path = demo ? items.slice(0, Math.max(1, Math.min(depth, items.length))) : items;
  const n = path.length;
  // touch: drag the corner handle to narrow the box, like the desktop resize corner
  const dragFrom = useRef(null);
  const onHandleDown = (e) => {
    const el = box.current;
    if (!el) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragFrom.current = { x: e.clientX, w: el.offsetWidth };
  };
  const onHandleMove = (e) => {
    const d = dragFrom.current, el = box.current;
    if (!d || !el) return;
    el.style.width = Math.round(Math.max(180, d.w + e.clientX - d.x)) + "px";
  };
  const onHandleUp = () => { dragFrom.current = null; };
  const cap = maxItems >= 2 && n > maxItems ? maxItems - 1 : n; // most trailing crumbs `maxItems` allows

  // fold from the middle until the trail fits (and never show more than maxItems crumbs)
  useIsoLayoutEffect(() => {
    const m = measure.current;
    if (!m || !boxW || !n) return;
    const ws = [...m.querySelectorAll("[data-crumb]")].map((el) => el.offsetWidth);
    const ell = m.querySelector("[data-more]").offsetWidth;
    const avail = boxW - 2; // content box, minus a hair for rounding
    const total = ws.slice(0, n).reduce((a, b) => a + b, 0);
    if (total <= avail && cap >= n) return setKeep(n);
    let k = Math.min(n - 2, cap);
    while (k > 1 && ws[0] + ell + ws.slice(n - k, n).reduce((a, b) => a + b, 0) > avail) k--;
    setKeep(Math.max(1, k));
  }, [boxW, n, separator, showIcons, items, cap]);

  const folded = keep < n - 1;
  const open = (menuOpen && folded) || (forceState === "open" && folded);
  const hidden = folded ? path.slice(1, n - keep) : [];
  const shown = folded ? [0, ...path.map((_, i) => i).slice(n - keep)] : path.map((_, i) => i);

  const here = useRef(null);
  const focusHere = useRef(false);
  // after picking from the … menu the button may fold away, so focus lands on the new current page
  const closeAll = (restore) => { setMenuOpen(false); if (restore && !focusHere.current) moreBtn.current?.focus(); };
  useIsoLayoutEffect(() => {
    if (!focusHere.current) return;
    focusHere.current = false;
    here.current?.focus();
  }, [depth]);
  useDismiss(open, () => closeAll(false), [moreBtn, (t) => !!t.closest?.("[data-ts-menu]")], { escape: false });
  const ctx = { closeAll, checks: menu.checks, toggle: menu.toggle, announce: menu.announce };

  // a level picked from the … menu: your router (onNavigate), else the item's onClick, else its href
  const pickHidden = (it, i) => {
    if (demo && !it.href && !it.onClick && !onNavigate) { focusHere.current = true; setDepth(i + 1); return; }
    if (onNavigate) onNavigate(it, i, null);
    else if (it.onClick) it.onClick(null, it, i);
    else if (it.href) location.assign(it.href);
  };

  const sep = (
    <span className="ts-bc__sep" aria-hidden>
      {isValidElement(separator) ? separator : separator === "chevron" ? <Icon name="chevronRight" size={13} stroke={2} /> : separator === "slash" ? "/" : separator === "dot" ? "·" : separator}
    </span>
  );
  const crumb = (it, i, last) => {
    if (last)
      return <span ref={(el) => { if (el) here.current = el; }} className="ts-bc__here" aria-current="page" title={typeof it.label === "string" ? it.label : undefined} tabIndex={-1}>{it.label}</span>;
    const children = <>{showIcons && iconOf(it.icon, 15)}{it.label}</>;
    if (it.disabled) return <span className="ts-bc__crumb" aria-disabled="true">{children}</span>;
    const href = it.href ?? (demo ? "#" + i : undefined);
    const onClick = (e) => {
      it.onClick?.(e, it, i);
      onNavigate?.(it, i, e);
      if (demo && !it.href) { e.preventDefault(); focusHere.current = true; setDepth(i + 1); } // the link becomes the current page: focus follows it
    };
    const props = { href, className: "ts-bc__crumb", onClick, children };
    if (renderLink) return renderLink(it, props, i);
    if (linkAs && href !== undefined) { const L = linkAs; return <L {...props} to={href} />; }
    if (href === undefined) return <button type="button" className="ts-bc__crumb" onClick={onClick}>{children}</button>;
    return <a {...props} />;
  };
  const t = reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 };
  const label = ariaLabelAttr ?? ariaLabel;

  return (
    <>{sheetTag}<div ref={ref} className={"ts-bc-root" + (demo ? " ts-bc-demo" : "") + (className ? " " + className : "")} style={style} {...rest}>
      <div ref={box} className={demo ? "ts-bc-box" : "ts-bc-fit"} style={demo ? { "--bc-w": width + "px" } : undefined}>
        {n > 0 && (
        <nav aria-label={label}>
          <ol className="ts-bc">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.flatMap((i, idx) => {
                const out = [];
                out.push(
                  <motion.li key={"c" + i} className="ts-bc__li" layout="position" transition={t}
                    initial={{ opacity: 0, scale: reduce ? 1 : 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.9, transition: { duration: 0.12 } }}>
                    {crumb(path[i], i, i === n - 1)}
                    {i !== n - 1 && sep}
                  </motion.li>
                );
                if (idx === 0 && folded)
                  out.push(
                    <motion.li key="more" className="ts-bc__li" layout="position" transition={t}
                      initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: { duration: 0.12 } }}>
                      <button ref={moreBtn} type="button" className="ts-bc__more" aria-haspopup="menu" aria-expanded={open}
                        aria-label={`Show ${hidden.length} hidden ${hidden.length === 1 ? "level" : "levels"}`} onClick={() => setMenuOpen((o) => !o)}>
                        <Icon name="more" size={16} />
                      </button>
                      {sep}
                    </motion.li>
                  );
                return out;
              })}
            </AnimatePresence>
          </ol>
        </nav>
        )}
        {demo && <span className="ts-bc-handle" aria-hidden onPointerDown={onHandleDown} onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp} />}
        {demo && <svg className="ts-bc-grip" viewBox="0 0 10 10" aria-hidden><path d="M9 3L3 9M9 7L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>}
        <div ref={measure} className="ts-bc-measure" aria-hidden>
          {path.map((it, i) => (
            <span key={i} data-crumb style={{ display: "flex", alignItems: "center", fontWeight: i === n - 1 ? 600 : 400, fontSize: 13.5 }}>
              <span className="ts-bc__crumb" style={{ display: "flex" }}>{showIcons && i !== n - 1 && iconOf(it.icon, 15)}{it.label}</span>
              {i !== n - 1 && sep}
            </span>
          ))}
          <span data-more style={{ display: "flex" }}><span className="ts-bc__more" />{sep}</span>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <MenuPanel
            items={hidden.map((it, k) => ({ id: "h" + k, label: it.label, icon: showIcons && typeof it.icon === "string" ? it.icon : undefined, disabled: it.disabled, onSelect: () => pickHidden(it, k + 1) }))}
            anchor={moreBtn}
            placement="bottom-start"
            ctx={ctx}
            label="Hidden levels"
          />
        )}
      </AnimatePresence>
      {demo && (
        <div className="ts-bc-cap">
          <span>Width <b>{Math.round(boxW + 42)} px</b></span>
          <span>{folded ? `${hidden.length} folded` : "Nothing folded"}</span>
          {depth < items.length && <button type="button" className="ts-bc-reset" onClick={() => setDepth(items.length)}>Reset path</button>}
        </div>
      )}
      <span className="ts-sr" aria-live="polite">{menu.said}</span>
    </div></>
  );
});
