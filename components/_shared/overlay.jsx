"use client";
// Shared overlay behaviour: focus trap, dismiss (Escape / outside press), scroll lock,
// anchored positioning with flip, shift and an arrow, and <Layer>: the portal that anchored popups render
// through so no ancestor's overflow can clip them and no ancestor's transform / filter can re-anchor them.
// The layer carries the theme tokens that apply at the anchor, so a portaled popup looks as it did in place.
import { useEffect, useRef, useState } from "react";
import { useIsoLayoutEffect } from "./theme.jsx";
import { createPortal } from "react-dom";
import { themeVars } from "./themes.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export const focusables = (root) => [...(root?.querySelectorAll(FOCUSABLE) ?? [])].filter((el) => el.offsetParent !== null || el === document.activeElement);

// ---- layers -------------------------------------------------------------------------------------------
// Every layer wrapper remembers the element that owns it (the popup's in-place parent), so a popup that lives
// at the end of <body> still counts as "inside" whatever contains its owner: a Modal's focus trap and outside
// press, a Popover holding a Dropdown Menu, and so on, through any number of nested layers.
const owners = new WeakMap();
const elOf = (x) => (!x ? null : typeof Element !== "undefined" && x instanceof Element ? x : typeof x === "object" && "current" in x ? x.current : null);

/** True when `node` is inside `root`, or inside a layer whose owner is (recursively) inside `root`. */
export function within(root, node) {
  if (!root || !node) return false;
  let n = node.nodeType === 1 ? node : node.parentElement;
  for (let guard = 0; n && guard < 32; guard++) {
    if (root.contains(n)) return true;
    const layer = n.closest?.("[data-ts-layer]");
    if (!layer) return false;
    n = owners.get(layer) ?? null;
  }
  return false;
}

// every token the kit defines (taken from themes.js, so a new token travels without touching this file)
const TOKEN_NAMES = Object.keys(themeVars()).filter((k) => k.startsWith("--ts-"));

/** The inherited look at `src`: every --ts-* token, color, font, color-scheme and data-ts-mode. */
function readTheme(src) {
  const cs = getComputedStyle(src);
  const vars = {};
  for (const k of TOKEN_NAMES) { const v = cs.getPropertyValue(k).trim(); if (v) vars[k] = v; }
  vars.color = cs.color;
  vars.fontFamily = cs.fontFamily;
  vars.colorScheme = cs.colorScheme;
  const mode = src.closest?.("[data-ts-mode]")?.getAttribute("data-ts-mode") ?? undefined;
  return { vars, mode, key: JSON.stringify(vars) + mode };
}

/** Taken once per opening: the ts-* classes of the in-place parent and its ancestors (so descendant rules
 *  such as `.ts-dd .ts-menu` keep matching) and the z-index of the stacking context the anchor sits in. */
function readPlace(src, z) {
  const cls = new Set();
  let top = 0;
  for (let n = src; n && n !== document.documentElement; n = n.parentElement) {
    if (n !== document.body) for (const c of n.classList) if (c.startsWith("ts-")) cls.add(c);
    const s = getComputedStyle(n);
    const pd = n.parentElement && getComputedStyle(n.parentElement).display;
    if (s.zIndex !== "auto" && (s.position !== "static" || /flex|grid/.test(pd ?? ""))) top = parseInt(s.zIndex, 10) || 0;
  }
  return { cls: [...cls].join(" "), z: Math.max(z, top + 1) };
}

/** Ancestors that clip `el` (overflow other than visible), nearest first. */
function clippers(el) {
  const out = [];
  for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.overflowX !== "visible" || s.overflowY !== "visible") out.push(n);
    if (s.position === "fixed") break;
  }
  return out;
}

const tabbable = (root) => focusables(root).filter((el) => el.tabIndex >= 0 && !el.closest("[inert]"));

/** Tabbable elements after `from` in document order (outside every layer), then the rest from the top. */
function tabOrderAfter(from) {
  const all = tabbable(document.body).filter((el) => !el.closest("[data-ts-layer]"));
  const after = all.filter((el) => !from.contains(el) && from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  return [...after, ...all];
}
/** Focus the first tabbable element after `from` that takes focus. */
function focusAfter(from) {
  for (const el of tabOrderAfter(from)) { el.focus(); if (document.activeElement === el) return true; }
  return false;
}

/**
 * Layer — renders `children` through a portal (into document.body by default) inside a wrapper that carries the
 * theme as it applies at the popup's in-place parent, so no ancestor can clip or re-anchor the popup.
 *   portal  true (default) → document.body; false → render in place, unchanged; an element or ref → into it
 *   anchor  the element ref (or {x,y} point) the popup is placed against: when a scrolling ancestor scrolls it
 *           (for a point, the owner) fully out of view the layer hides (opacity 0, click-through) until it comes back
 *   owner   the popup's in-place parent (a ref); defaults to the anchor's parent. The theme is read there, its
 *           ts-* ancestry is mirrored, and `within()` treats the layer as part of it
 *   z       the popup's own z-index; the layer sits above the anchor's stacking context and never below this
 *   tabOut  a ref: Tab leaving the popup continues after this element, Shift+Tab lands on it (the order the
 *           popup had when it rendered right after its trigger)
 * Mount it only while the popup exists (inside AnimatePresence): it renders nothing on the server and before
 * mount, reads the theme when it mounts and again whenever it re-renders.
 */
export function Layer({ portal = true, anchor, owner, z = 130, tabOut, children }) {
  const inPlace = portal === false;
  const [state, setState] = useState(null);   // { host, cls, z, vars, mode, key }
  const wrap = useRef(null);
  const src = () => elOf(owner) ?? elOf(anchor)?.parentElement ?? null;

  useIsoLayoutEffect(() => {
    if (inPlace) return;
    const host = elOf(portal) ?? document.body;
    const s = src();
    setState({ host, ...(s ? readPlace(s, z) : { cls: "", z }), ...(s ? readTheme(s) : { vars: {}, mode: undefined, key: "" }) });
  }, [inPlace, portal]);

  // the theme again on every render while open (a preset or mode switch re-renders the tree)
  useIsoLayoutEffect(() => {
    if (wrap.current) owners.set(wrap.current, elOf(owner) ?? elOf(anchor) ?? src());
    if (!state) return;
    const s = src();
    if (!s) return;
    const t = readTheme(s);
    if (t.key !== state.key) setState((p) => ({ ...p, ...t }));
  });

  // the anchor scrolled out of a scrolling ancestor: hide rather than float over unrelated content
  useEffect(() => {
    if (!state) return;
    const el = elOf(anchor) ?? elOf(owner);   // a point anchor (Context Menu) follows its owner area
    if (!el) return;
    const clip = clippers(el);
    if (!clip.length) return;
    let raf;
    const tick = () => {
      const w = wrap.current;
      if (w && el.isConnected) {
        const r = el.getBoundingClientRect();
        let l = r.left, t = r.top, rt = r.right, b = r.bottom;
        for (const c of clip) { const q = c.getBoundingClientRect(); l = Math.max(l, q.left); t = Math.max(t, q.top); rt = Math.min(rt, q.right); b = Math.min(b, q.bottom); }
        const out = rt - l <= 0 || b - t <= 0;
        // faded and click-through rather than visibility:hidden, which would drop keyboard focus out of an open
        // menu (Escape and the arrows keep working while it is away; it reappears when the anchor comes back)
        if ((w.style.opacity === "0") !== out) { w.style.opacity = out ? "0" : ""; w.style.pointerEvents = out ? "none" : ""; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [!!state]);

  // the popup keeps the tab order it had right after its trigger: Tab on the trigger enters it, Shift+Tab on the
  // control after the trigger comes back into it (only when it holds tabbable controls, as a Popover does)
  useEffect(() => {
    const from = elOf(tabOut);
    if (!state || !from) return;
    const onKey = (e) => {
      const w = wrap.current;
      if (e.key !== "Tab" || e.defaultPrevented || !w) return;
      const list = tabbable(w);
      if (!list.length) return;
      const ae = document.activeElement;
      if (!e.shiftKey && ae === from) { e.preventDefault(); list[0].focus(); }
      else if (e.shiftKey && ae && ae !== from && !w.contains(ae) && tabOrderAfter(from)[0] === ae) { e.preventDefault(); list[list.length - 1].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [!!state]);

  if (inPlace) return children;
  if (!state) return null;
  const onKeyDown = (e) => {
    const from = elOf(tabOut);
    if (e.key !== "Tab" || e.defaultPrevented || !from || !wrap.current) return;
    const list = tabbable(wrap.current);
    const i = list.indexOf(document.activeElement);
    if (e.shiftKey ? i > 0 : i >= 0 && i < list.length - 1) return;
    e.preventDefault();
    if (e.shiftKey) from.focus({ preventScroll: true }); else focusAfter(from);
  };
  return createPortal(
    <div ref={wrap} data-ts-layer="" data-ts-mode={state.mode} onKeyDown={onKeyDown}
      style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, zIndex: state.z, ...state.vars }}>
      <div className={state.cls || undefined} style={{ display: "contents" }}>{children}</div>
    </div>,
    state.host,
  );
}

/**
 * LayerHost — a Layer whose only content is an empty element, handed back through `onHost` (a state setter).
 * For popups that a headless library portals by itself: give the element to that library's Portal as its
 * `container`, and the popup gets what any Layer child gets (the theme at the anchor, no clipping, and it counts
 * as inside its owner for a Modal's focus trap and outside press).
 *   const [host, setHost] = useState(null);
 *   {mounted && <LayerHost anchor={triggerRef} onHost={setHost} />}
 *   {host && <Lib.Portal container={host}>...</Lib.Portal>}
 * Mount it while the popup is open or closing, as with Layer. Takes Layer's other props (owner, z, tabOut, portal).
 */
export function LayerHost({ onHost, ...layer }) {
  return <Layer {...layer}><div ref={onHost} data-ts-layer-host="" style={{ display: "contents" }} /></Layer>;
}

/** Keep Tab inside `ref` while active; focus `initial` (selector or first focusable) on open; on close,
 *  return focus to `returnTo` (a ref; Safari doesn't focus buttons on click) or whatever had it before. */
export function useFocusTrap(ref, active, { initial, restore = true, returnTo } = {}) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement;
    const root = ref.current;
    const raf = requestAnimationFrame(() => {
      const target = (initial && root?.querySelector(initial)) || focusables(root)[0] || root;
      target?.focus({ preventScroll: true });
    });
    const onKey = (e) => {
      if (e.key !== "Tab" || !root) return;
      const list = focusables(root);
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0], last = list[list.length - 1];
      // focus in a popup layer owned by something inside the trap counts as inside (the popup handles its own Tab)
      const inside = within(root, document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey, true);
      const back = returnTo?.current ?? prev;
      if (restore && back && document.contains(back)) requestAnimationFrame(() => back.focus?.({ preventScroll: true }));
    };
  }, [active]);
}

/** Call onDismiss on Escape or a press outside every entry in `refs` (a ref, or a (target) => boolean).
 *  A ref's element counts the popup layers it owns (see Layer) as part of itself. */
export function useDismiss(active, onDismiss, refs, { escape = true, outside = true } = {}) {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (escape && e.key === "Escape") { e.stopPropagation(); cb.current("escape"); } };
    const onDown = (e) => {
      if (!outside) return;
      // a press in a popup layer owned by something inside a ref is inside it too (see Layer / within)
      if (refs.some((r) => (typeof r === "function" ? r(e.target) : within(r.current, e.target)))) return;
      cb.current("outside");
    };
    document.addEventListener("keydown", onKey);
    // capture so a press that opens another overlay still closes this one first
    document.addEventListener("pointerdown", onDown, true);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown, true); };
  }, [active]);
}

/** Lock page scroll without layout shift (pads for the scrollbar). */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const el = document.documentElement;
    const gap = innerWidth - el.clientWidth;
    const prev = { overflow: el.style.overflow, pad: el.style.paddingRight };
    el.style.overflow = "hidden";
    if (gap > 0) el.style.paddingRight = gap + "px";
    return () => { el.style.overflow = prev.overflow; el.style.paddingRight = prev.pad; };
  }, [active]);
}

const OPP = { top: "bottom", bottom: "top", left: "right", right: "left" };

/**
 * Position a floating box of size {w,h} against anchor rect `a`.
 * placement: "bottom-start" | "top" | "right-end" ...; flips to the opposite side if it doesn't fit,
 * then shifts along the cross axis to stay `padding` px inside the viewport. Returns the arrow offset too.
 */
export function computePosition(a, { w, h: natural }, { placement = "bottom", offset = 8, padding = 8, bounds } = {}) {
  // bounds: the box to stay inside (default the viewport); internally shifted so it starts at 0,0
  const B = bounds ?? { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
  const ox = B.left, oy = B.top, vw = B.right - B.left, vh = B.bottom - B.top;
  a = { left: a.left - ox, right: a.right - ox, top: a.top - oy, bottom: a.bottom - oy, width: a.width, height: a.height };
  let h = natural;
  let [side, align = "center"] = placement.split("-");
  const fits = (s) => (s === "bottom" ? a.bottom + offset + h <= vh - padding : s === "top" ? a.top - offset - h >= padding : s === "right" ? a.right + offset + w <= vw - padding : a.left - offset - w >= padding);
  const room = (s) => (s === "bottom" ? vh - a.bottom : s === "top" ? a.top : s === "right" ? vw - a.right : a.left);
  const squeezed = !fits(side) && !fits(OPP[side]);
  if (!fits(side) && (fits(OPP[side]) || room(OPP[side]) > room(side))) side = OPP[side];
  const vertical = side === "top" || side === "bottom";
  // room left on the chosen side: if the box is taller than that, cap it (callers scroll the overflow)
  const avail = Math.max(0, room(side) - offset - padding);
  if (vertical && squeezed) h = Math.min(h, avail);
  let x, y;
  if (vertical) {
    y = side === "bottom" ? a.bottom + offset : a.top - offset - h;
    // start/end alignment flips before it shifts, so a menu at the right edge opens leftward
    if (align === "start" && a.left + w > vw - padding && a.right - w >= padding) align = "end";
    else if (align === "end" && a.right - w < padding && a.left + w <= vw - padding) align = "start";
    x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
    x = Math.max(padding, Math.min(x, vw - padding - w));
  } else {
    x = side === "right" ? a.right + offset : a.left - offset - w;
    if (align === "start" && a.top + h > vh - padding && a.bottom - h >= padding) align = "end";
    else if (align === "end" && a.bottom - h < padding && a.top + h <= vh - padding) align = "start";
    y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
    y = Math.max(padding, Math.min(y, vh - padding - h));
  }
  // neither side fits: keep it inside the box and let it overlap the anchor rather than spill out
  if (squeezed && !vertical) x = Math.max(padding, Math.min(x, vw - padding - w));
  // arrow points at the anchor's centre, clamped so it never leaves the rounded corners
  const arrow = vertical
    ? { left: Math.max(14, Math.min(a.left + a.width / 2 - x, w - 14)) }
    : { top: Math.max(14, Math.min(a.top + a.height / 2 - y, h - 14)) };
  return { x: Math.round(x + ox), y: Math.round(y + oy), side, align, arrow, maxHeight: vertical ? Math.round(avail) : Math.round(vh - padding * 2) };
}

/**
 * Track an anchor (element ref, or a {x,y} point for context menus) and keep the floating element placed.
 * Re-measures every frame while open, so it follows scrolling, resizing and moving anchors.
 */
export function useFloating(anchor, floatRef, open, opts = {}) {
  const [pos, setPos] = useState(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useIsoLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    let raf, last = "";
    const tick = () => {
      const el = floatRef.current;
      const a = anchor && "current" in anchor ? anchor.current?.getBoundingClientRect() : anchor ? { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y, width: 0, height: 0 } : null;
      if (el && a) {
        const o = optsRef.current;
        const bounds = o.boundary?.current?.getBoundingClientRect();
        // scrollHeight is the natural height even while a max-height is capping a scrolling panel
        const scrolls = /auto|scroll/.test(getComputedStyle(el).overflowY);
        // o.maxHeight: the popup's own height cap (e.g. a list that never grows past 220px), so it is placed at its real height
        const h = scrolls ? Math.min(el.scrollHeight, o.maxHeight ?? Infinity) : el.offsetHeight;
        const p = computePosition(a, { w: el.offsetWidth, h }, { ...o, bounds });
        p.aw = Math.round(a.width * 10) / 10;   // the anchor's width, for popups that match it (Tag Input's list)
        const key = `${p.x},${p.y},${p.side},${p.arrow.left ?? p.arrow.top},${p.maxHeight},${p.aw}`;
        if (key !== last) { last = key; setPos(p); }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [open, anchor && "current" in anchor ? anchor : anchor?.x + "," + anchor?.y]);
  return pos;
}

/** Transform-origin for a floating panel so it scales out of its anchor side. */
export const originFor = (p) =>
  !p ? "center" : p.side === "bottom" ? `${p.arrow.left ?? 0}px top` : p.side === "top" ? `${p.arrow.left ?? 0}px bottom` : p.side === "right" ? `left ${p.arrow.top ?? 0}px` : `right ${p.arrow.top ?? 0}px`;
