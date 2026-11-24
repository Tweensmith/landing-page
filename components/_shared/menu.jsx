"use client";
// Menu engine shared by DropdownMenu and ContextMenu: roving focus, typeahead, nested submenus
// with a "safe triangle" so the pointer can travel diagonally to a submenu, checkbox items,
// and edge-aware placement through useFloating. The top level renders through <Layer> (a portal into
// document.body by default) so no ancestor's overflow, transform or filter can clip or move it.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "./theme.jsx";
import { Icon } from "./icons.jsx";
import { useFloating, originFor, Layer } from "./overlay.jsx";

export const MENU_CSS = `
.ts-menu{position:fixed;z-index:130;overflow-y:auto;overscroll-behavior:contain;min-width:220px;max-width:min(320px,calc(100vw - 16px));padding:5px;margin:0;list-style:none;font-family:var(--ts-font);color:var(--ts-ink);
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 2px);box-shadow:0 0 0 1px var(--ts-line),0 18px 44px -12px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);outline:none}
.ts-menu__item{position:relative;display:flex;align-items:center;gap:10px;height:34px;padding:0 10px;border-radius:var(--ts-radius-sm);font-size:13.5px;cursor:default;outline:none;user-select:none}
.ts-menu__item svg{color:var(--ts-ink2);flex:none}
.ts-menu__item[data-active=true]{background:var(--ts-surface2)}
.ts-menu__item:focus-visible{box-shadow:inset 0 0 0 1.5px var(--ts-focus)}
.ts-menu__item[aria-disabled=true]{opacity:.42}
.ts-menu__item.is-danger{color:var(--ts-danger)}
.ts-menu__item.is-danger svg{color:var(--ts-danger)}
.ts-menu__kbd{margin-left:auto;font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2);letter-spacing:.04em}
.ts-menu__chev{margin-left:auto;display:grid}
.ts-menu__check{width:16px;display:grid;place-items:center;flex:none;color:var(--ts-accent)}
.ts-menu__sep{height:1px;margin:5px 6px;background:var(--ts-line)}
.ts-menu__label{padding:8px 10px 4px;font-family:var(--ts-font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-menu__safe{position:fixed;inset:0;z-index:129;pointer-events:none;width:100vw;height:100vh}
`;
registerStyles("ts-menu", MENU_CSS);

export const useMenuStyles = () => useStyles("ts-menu", MENU_CSS);

const isItem = (it) => it && !it.separator && it.type !== "label";
const usable = (it) => isItem(it) && !it.disabled;

function inTriangle(p, a, b, c) {
  const s = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/**
 * One level of menu. Renders its own submenu (recursively) for the item that's open.
 * ctx: { closeAll, checks, toggle, showSafeArea, announce }
 * portal (top level only): true (default) portals into document.body, false renders in place, or an element / ref.
 * owner: the menu's in-place parent (a ref), where the theme is read; defaults to the anchor's parent.
 * id: the menu element's id, for the trigger's aria-controls.
 */
export function MenuPanel({ items, anchor, placement = "bottom-start", offset = 6, ctx, focusFirst = "first", onCloseLevel, level = 0, label, portal = true, owner, id }) {
  const sheetTag = useMenuStyles();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const itemRefs = useRef([]);
  const [active, setActive] = useState(-1);
  const [sub, setSub] = useState(-1);
  const [subFocus, setSubFocus] = useState(null);
  const [safe, setSafe] = useState(null); // {a,b,c} triangle while travelling to a submenu
  const pointer = useRef({ x: 0, y: 0 });
  const timer = useRef(null);
  const typed = useRef({ s: "", t: 0 });
  const pos = useFloating(anchor, ref, true, { placement, offset, padding: 8 });
  const subAnchor = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const focusAt = (i) => { setActive(i); itemRefs.current[i]?.focus({ preventScroll: true }); };
  const step = (from, d) => {
    for (let k = 1; k <= items.length; k++) { const i = (from + d * k + items.length * 2) % items.length; if (usable(items[i])) return i; }
    return from;
  };
  useEffect(() => {
    if (!pos) return;
    if (focusFirst === "first") focusAt(step(-1, 1));
    else if (focusFirst === "last") focusAt(step(items.length, -1));
    else if (level === 0) ref.current?.focus({ preventScroll: true });
    // a submenu opened by hover leaves focus on its parent item
  }, [!!pos]);

  const openSub = (i, focus = null) => { clearTimeout(timer.current); setSub(i); setSubFocus(focus); };
  const choose = (i) => {
    const it = items[i];
    if (!usable(it)) return;
    if (it.items) return openSub(i, "first");
    if (it.type === "checkbox") { ctx.toggle(it.id); return; }
    it.onSelect?.();
    ctx.announce?.(it.label);
    ctx.closeAll(true); // focus goes back to whatever opened the menu
  };

  const onKey = (e) => {
    const k = e.key;
    if (k === "ArrowDown") { e.preventDefault(); focusAt(step(active, 1)); }
    else if (k === "ArrowUp") { e.preventDefault(); focusAt(step(active < 0 ? items.length : active, -1)); }
    else if (k === "Home") { e.preventDefault(); focusAt(step(-1, 1)); }
    else if (k === "End") { e.preventDefault(); focusAt(step(items.length, -1)); }
    else if (k === "Enter" || k === " ") { e.preventDefault(); if (active >= 0) choose(active); }
    else if (k === "ArrowRight" && items[active]?.items) { e.preventDefault(); openSub(active, "first"); }
    else if ((k === "ArrowLeft" && level > 0) || (k === "Escape" && level > 0)) { e.preventDefault(); e.stopPropagation(); onCloseLevel?.(); }
    else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); ctx.closeAll(true); }
    else if (k === "Tab") { e.preventDefault(); ctx.closeAll(true); }
    else if (k.length === 1 && /\S/.test(k) && !e.metaKey && !e.ctrlKey) {
      // typeahead: letters typed within 600 ms build a prefix
      const now = Date.now();
      typed.current = { s: (now - typed.current.t < 600 ? typed.current.s : "") + k.toLowerCase(), t: now };
      const q = typed.current.s;
      // a single letter cycles to the next match; a longer prefix keeps the current item if it still matches
      const from = q.length > 1 ? Math.max(0, active) : active + 1;
      const order = [...items.keys()].map((n) => (from + n) % items.length);
      const hit = order.find((i) => usable(items[i]) && items[i].label.toLowerCase().startsWith(q));
      if (hit !== undefined) focusAt(hit);
    }
  };

  const subRect = () => document.querySelector(`[data-ts-menu-level="${level + 1}"]`)?.getBoundingClientRect();
  const onItemEnter = (i, settled = false) => {
    clearTimeout(timer.current);
    // travelling toward an open submenu? keep it open while the pointer stays inside the triangle;
    // if the pointer rests on another item for 240 ms, the user meant that item after all
    if (!settled && sub >= 0 && sub !== i && safe) {
      const r = subRect();
      if (r && inTriangle(pointer.current, safe.a, safe.b, safe.c)) {
        timer.current = setTimeout(() => onItemEnter(i, true), 240);
        return;
      }
    }
    focusAt(i);
    if (items[i]?.items) timer.current = setTimeout(() => openSub(i), 90);
    else if (sub >= 0) timer.current = setTimeout(() => { setSub(-1); setSafe(null); }, 60);
  };
  const onMove = (e) => {
    pointer.current = { x: e.clientX, y: e.clientY };
    if (sub >= 0 && items[active]?.items && active === sub) {
      const r = subRect();
      if (r) {
        const leftSide = r.left < e.clientX;
        const edge = leftSide ? r.right : r.left;
        setSafe({ a: { x: e.clientX + (leftSide ? 2 : -2), y: e.clientY }, b: { x: edge, y: r.top - 4 }, c: { x: edge, y: r.bottom + 4 } });
      }
    }
  };

  subAnchor.current = sub >= 0 ? itemRefs.current[sub] : null;
  const style = pos ? { left: pos.x, top: pos.y, maxHeight: pos.maxHeight, transformOrigin: originFor(pos) } : { left: -9999, top: 0, visibility: "hidden" };
  const tree = (
    <>
      <motion.ul
        ref={ref}
        id={id}
        className="ts-menu"
        role="menu"
        aria-label={label}
        tabIndex={-1}
        data-ts-menu=""
        data-ts-menu-level={level}
        style={style}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={pos ? { opacity: 1, scale: 1 } : { opacity: 0 }}
        exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.1 } }}
        transition={{ type: "spring", stiffness: 700, damping: 40 }}
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerLeave={() => { clearTimeout(timer.current); if (sub < 0) setActive(-1); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((it, i) => {
          if (it.separator) return <li key={"s" + i} role="separator" className="ts-menu__sep" />;
          if (it.type === "label") return <li key={"l" + i} role="presentation" className="ts-menu__label">{it.label}</li>;
          const checked = it.type === "checkbox" ? !!ctx.checks[it.id] : undefined;
          return (
            <li
              key={it.id ?? it.label}
              ref={(el) => (itemRefs.current[i] = el)}
              role={it.type === "checkbox" ? "menuitemcheckbox" : "menuitem"}
              aria-checked={checked}
              aria-haspopup={it.items || it.opens ? "menu" : undefined}
              aria-expanded={it.items ? sub === i : undefined}
              aria-disabled={it.disabled || undefined}
              tabIndex={-1}
              data-active={active === i || sub === i}
              className={"ts-menu__item" + (it.danger ? " is-danger" : "")}
              onPointerEnter={() => onItemEnter(i)}
              onClick={() => choose(i)}
            >
              {it.type === "checkbox" ? (
                <span className="ts-menu__check" aria-hidden>{checked && <Icon name="check" size={14} stroke={2.6} />}</span>
              ) : it.icon ? <Icon name={it.icon} size={16} /> : null}
              <span>{it.label}</span>
              {it.items ? <span className="ts-menu__chev" aria-hidden><Icon name="chevronRight" size={14} /></span> : it.shortcut ? <span className="ts-menu__kbd" aria-hidden>{it.shortcut}</span> : null}
            </li>
          );
        })}
      </motion.ul>
      {sub >= 0 && items[sub]?.items && (
        <MenuPanel
          key={sub}
          items={items[sub].items}
          anchor={subAnchor}
          placement="right-start"
          offset={4}
          ctx={ctx}
          level={level + 1}
          label={items[sub].label}
          focusFirst={subFocus}
          onCloseLevel={() => { setSub(-1); setSafe(null); focusAt(sub); }}
        />
      )}
      {ctx.showSafeArea && safe && sub >= 0 && (
        <svg className="ts-menu__safe" aria-hidden>
          <polygon points={`${safe.a.x},${safe.a.y} ${safe.b.x},${safe.b.y} ${safe.c.x},${safe.c.y}`} fill="color-mix(in srgb,var(--ts-accent) 18%,transparent)" stroke="var(--ts-accent)" strokeDasharray="3 3" />
        </svg>
      )}
    </>
  );
  // submenus render inside their parent's layer, so they share its stacking and sit above it
  return <>{sheetTag}{level === 0 ? <Layer portal={portal} anchor={anchor} owner={owner} z={130}>{tree}</Layer> : tree}</>;
}

/** Root-level state for a menu tree: checkbox values and a live announcement. */
export function useMenuState(initialChecks = {}) {
  const [checks, setChecks] = useState(initialChecks);
  const [said, setSaid] = useState("");
  return { checks, toggle: (id) => setChecks((c) => ({ ...c, [id]: !c[id] })), said, announce: (s) => setSaid(s) };
}

/** One level of a menu tree for a drill-in menu: a Back row and the level's name on top, submenu rows
 *  turned into plain rows that push the level (no hover-open) and still say they open one, keyboard shortcuts
 *  dropped (no keyboard). */
export function drillLevel(items, trail, push, pop) {
  let list = items;
  const crumbs = [];
  for (const i of trail) { crumbs.push(list[i]); list = list[i]?.items ?? []; }
  const rows = list.map((it, i) => (it.separator || it.type === "label" ? it : it.items
    ? { ...it, items: undefined, opens: true, shortcut: <Icon name="chevronRight" size={15} />, onSelect: () => push(i) }
    : { ...it, shortcut: undefined }));
  if (!crumbs.length) return rows;
  return [{ id: "__back", label: "Back", icon: "chevronLeft", onSelect: pop }, { type: "label", label: crumbs[crumbs.length - 1].label }, ...rows];
}
