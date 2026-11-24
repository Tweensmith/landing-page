"use client";
import { forwardRef, Fragment, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Art } from "../_shared/art.jsx";
import { useDismiss, useScrollLock } from "../_shared/overlay.jsx";
import { PageFrame, DemoLanding, useWidth } from "../_shared/page.jsx";

// The named springs (tokens.json) sampled into CSS linear() curves for the narrow form's CSS moves: snappy for the
// menu button's lines, settle for the sheet's wipe and the rise of its lines (over .59s, where it has come to rest).
function curve(stiffness, damping, ms) {
  const w0 = Math.sqrt(stiffness), z = damping / (2 * w0), wd = w0 * Math.sqrt(1 - z * z);
  const x = (t) => 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  let end = ms / 1000;
  if (!ms) { end = 0.05; for (let t = 0; t < 2; t += 0.004) if (Math.abs(1 - x(t)) > 0.003) end = t + 0.004; }
  const n = 36, pts = [];
  for (let i = 0; i <= n; i++) pts.push(i === n ? 1 : Math.round(x((end * i) / n) * 10000) / 10000);
  return `${Math.round(end * 1000)}ms linear(${pts.join(",")})`;
}
const SNAPPY = curve(420, 34);
const SETTLE = curve(220, 24, 590);

const CSS = `
.ts-mm{position:relative;z-index:20;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-mm[data-sticky=true]{position:sticky;top:0}
.ts-mm__bar{position:relative;display:flex;align-items:center;gap:4px;height:60px;padding:0 var(--mm-pad-end,12px) 0 var(--mm-pad-start,18px);background:color-mix(in srgb,var(--ts-bg) 82%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--ts-line)}
.ts-mm__brand{display:flex;align-items:center;gap:9px;margin-right:18px;font-weight:680;font-size:15px}
.ts-mm__mark{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-mm__top{display:contents}
.ts-mm__trig,.ts-mm__link{all:unset;display:inline-flex;white-space:nowrap;align-items:center;gap:5px;height:34px;padding:0 11px;border-radius:99px;font-size:13.5px;font-weight:530;color:var(--ts-ink2);cursor:pointer;transition:color .15s,background-color .15s}
.ts-mm__trig:hover,.ts-mm__link:hover,.ts-mm__trig[aria-expanded=true],.ts-mm__link[aria-current=page]{color:var(--ts-ink)}
.ts-mm__trig[aria-expanded=true]{background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}
.ts-mm__trig:disabled,.ts-mm__link[aria-disabled=true],.ts-mm__item[aria-disabled=true],.ts-mm__plain[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.ts-mm__trig svg{transition:transform .25s cubic-bezier(.3,.7,.4,1)}
.ts-mm__trig[aria-expanded=true] svg{transform:rotate(180deg)}
.ts-mm__trig:focus-visible,.ts-mm__link:focus-visible,.ts-mm__cta:focus-visible,.ts-mm__burger:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-mm__actions{margin-left:auto;display:flex;align-items:center;gap:8px}
.ts-mm__cta{all:unset;display:inline-flex;white-space:nowrap;align-items:center;height:34px;padding:0 14px;border-radius:99px;font-size:13.5px;font-weight:620;cursor:pointer;background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-mm__panel{position:absolute;left:0;top:calc(100% + 8px);overflow:hidden;border-radius:calc(var(--ts-radius-lg) + 4px);background:var(--ts-surface);
  box-shadow:0 0 0 1px var(--ts-line),0 30px 70px -24px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);transform-origin:top center}
.ts-mm__caret{position:absolute;top:calc(100% + 3px);left:0;width:12px;height:12px;background:var(--ts-surface);box-shadow:-1px -1px 0 0 var(--ts-line);z-index:1}
.ts-mm__sec{position:absolute;left:0;top:0;padding:14px;box-sizing:border-box;width:min(var(--mm-w,520px),var(--mm-max))}
.ts-mm__cols{display:grid;gap:10px}
.ts-mm__col{display:grid;gap:4px;align-content:start}
.ts-mm__col[data-plain=true]{gap:0}
.ts-mm__split{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:10px}
.ts-mm__split[data-feat=false]{grid-template-columns:minmax(0,1fr)}
.ts-mm__item{all:unset;display:flex;gap:12px;padding:10px;border-radius:var(--ts-radius-md);cursor:pointer;transition:background-color .15s}
.ts-mm__item:hover{background:var(--ts-surface2)}
.ts-mm__item:focus-visible{box-shadow:inset 0 0 0 2px var(--ts-focus)}
.ts-mm__ico{display:grid;place-items:center;flex:none;width:34px;height:34px;border-radius:10px;background:var(--ts-surface2);color:var(--ts-accent)}
.ts-mm__item:hover .ts-mm__ico{background:var(--ts-bg)}
.ts-mm__item b{display:block;font-size:13.5px;font-weight:600}
.ts-mm__item b + span{display:block;margin-top:2px;font-size:12.5px;line-height:1.4;color:var(--ts-ink2)}
.ts-mm__feat{all:unset;position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:180px;padding:14px;border-radius:var(--ts-radius-md);overflow:hidden;cursor:pointer;color:var(--ts-ink)}
.ts-mm__feat:focus-visible{box-shadow:inset 0 0 0 2px var(--ts-focus)}
.ts-mm__feat > div{position:relative;padding:10px 12px;border-radius:var(--ts-radius-sm);background:color-mix(in srgb,var(--ts-surface) 86%,transparent);backdrop-filter:blur(8px)}
.ts-mm__feat b{display:block;font-size:13.5px}
.ts-mm__feat small{font-size:12px;color:var(--ts-ink2)}
.ts-mm__head{padding:6px 10px 6px;font-family:var(--ts-font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-mm__plain{all:unset;display:flex;align-items:center;height:34px;padding:0 10px;border-radius:var(--ts-radius-sm);font-size:13.5px;cursor:pointer}
.ts-mm__plain:hover{background:var(--ts-surface2)}
.ts-mm__plain:focus-visible{box-shadow:inset 0 0 0 2px var(--ts-focus)}
.ts-mm__foot{display:flex;align-items:center;gap:6px;margin-top:8px;padding:12px 10px 4px;border-top:1px solid var(--ts-line);font-size:13px;color:var(--ts-ink2)}
.ts-mm[data-tight=true] .ts-mm__word{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.ts-mm[data-tight=true] .ts-mm__brand{margin-right:8px}
.ts-mm__plain{box-sizing:border-box}
/* narrow: a menu button whose two lines come together and cross */
.ts-mm__burger{all:unset;margin-left:auto;flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:99px;cursor:pointer;color:var(--ts-ink);-webkit-tap-highlight-color:transparent;transition:background-color .15s ease,scale 90ms cubic-bezier(.2,.8,.2,1)}
.ts-mm__burger[aria-expanded=true]{background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}
@media (hover:hover){.ts-mm__burger:not(:disabled):hover{background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}}
.ts-mm__burger:not(:disabled):active{scale:.92}
.ts-mm__burger:disabled{opacity:.45;cursor:not-allowed}
.ts-mm__ln{grid-area:1/1;width:18px;height:1.75px;border-radius:2px;background:currentColor;translate:0 -3.5px;transition:rotate ${SNAPPY},translate ${SNAPPY} .1s}
.ts-mm__ln + .ts-mm__ln{translate:0 3.5px}
.ts-mm__burger[aria-expanded=true] .ts-mm__ln{translate:0 0;rotate:45deg;transition:translate .16s cubic-bezier(.2,.8,.2,1),rotate ${SNAPPY} 80ms}
.ts-mm__burger[aria-expanded=true] .ts-mm__ln + .ts-mm__ln{rotate:-45deg}
/* narrow: the sheet takes the screen under the bar and is an accordion, one section open at a time */
.ts-mm__sheet{position:absolute;left:0;right:0;top:100%;box-sizing:border-box;height:var(--mm-sheet-h,calc(100vh - var(--mm-top,60px)));display:flex;flex-direction:column;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;
  padding:8px calc(var(--mm-pad-start,18px) - 8px) max(18px,env(safe-area-inset-bottom));background:var(--ts-bg);color:var(--ts-ink);animation:ts-mm-wipe ${SETTLE} backwards}
@supports (height:100dvh){.ts-mm__sheet{height:var(--mm-sheet-h,calc(100dvh - var(--mm-top,60px)))}}
.ts-mm__sheet > *{flex:none;animation:ts-mm-rise ${SETTLE} backwards;animation-delay:calc(70ms + var(--n,0) * 40ms)}
@keyframes ts-mm-wipe{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes ts-mm-rise{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
.ts-mm__acc{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:58px;padding:0 8px;border-radius:16px;font-size:21px;font-weight:620;letter-spacing:-.025em;line-height:1.15;cursor:pointer;color:var(--ts-ink);-webkit-tap-highlight-color:transparent;transition:background-color .15s}
.ts-mm__sheet > .ts-mm__plain{justify-content:space-between;gap:12px;height:auto;min-height:58px;padding:0 8px;border-radius:16px;font-size:21px;font-weight:620;letter-spacing:-.025em;line-height:1.15;-webkit-tap-highlight-color:transparent}
.ts-mm__acc svg,.ts-mm__sheet > .ts-mm__plain svg{flex:none;color:var(--ts-ink2)}
.ts-mm__acc svg{transition:transform .25s cubic-bezier(.3,.7,.4,1)}
.ts-mm__acc[aria-expanded=true] svg{transform:rotate(180deg)}
@media (hover:hover){.ts-mm__acc:not(:disabled):hover{background:var(--ts-surface2)}}
.ts-mm__acc:disabled{opacity:.45;cursor:not-allowed}
.ts-mm__acc:focus-visible,.ts-mm__sheet .ts-mm__cta:focus-visible{outline:2px solid var(--ts-focus);outline-offset:-2px}
.ts-mm__accbody{overflow:hidden}
.ts-mm__accbody > div{padding:0 0 12px}
.ts-mm__sheet .ts-mm__item{gap:14px;padding:8px;border-radius:16px;align-items:center;-webkit-tap-highlight-color:transparent}
.ts-mm__sheet .ts-mm__ico{width:40px;height:40px;border-radius:12px;color:var(--ts-ink)}
.ts-mm__sheet .ts-mm__item b{font-size:15.5px;letter-spacing:-.01em}
.ts-mm__sheet .ts-mm__item b + span{margin-top:1px;font-size:13.5px}
.ts-mm__sheet .ts-mm__accbody .ts-mm__plain{height:46px;padding:0 8px;font-size:15.5px;border-radius:12px;-webkit-tap-highlight-color:transparent}
.ts-mm__sheet .ts-mm__solgrid{display:grid;grid-template-columns:1fr 1fr;column-gap:4px}
.ts-mm__sheet .ts-mm__head{padding:10px 8px 4px;font-size:11px}
.ts-mm__sheet .ts-mm__rule{height:1px;margin:0 8px;background:var(--ts-line)}
/* your actions stand at the foot, where a thumb is; :where keeps these easy to override */
.ts-mm__sheetact{display:flex;flex-direction:column;gap:8px;margin-top:auto;padding:18px 8px 0}
:where(.ts-mm__sheetact) > :where(*){box-sizing:border-box;width:100%;min-height:52px}
.ts-mm__sheet .ts-mm__cta{margin:0;justify-content:center;height:auto;min-height:52px;font-size:15px}
.ts-mm__scrim{display:none}
/* floating: a pill in the middle of a wide header that the pointer passes through; panels open under it */
.ts-mm[data-layout=floating]{isolation:isolate;pointer-events:none;margin:max(10px,env(safe-area-inset-top)) 12px 0}
.ts-mm[data-layout=floating][data-sticky=true]{top:max(10px,env(safe-area-inset-top))}
.ts-mm[data-layout=floating] :is(.ts-mm__bar,.ts-mm__panel,.ts-mm__sheet){pointer-events:auto}
.ts-mm[data-layout=floating] .ts-mm__bar{box-sizing:border-box;width:max-content;max-width:100%;margin:0 auto;padding:0 8px;border-bottom:0;border-radius:999px;
  box-shadow:0 0 0 1px var(--ts-line),0 18px 40px -20px color-mix(in srgb,var(--ts-black) 55%,transparent),0 4px 12px -6px color-mix(in srgb,var(--ts-black) 30%,transparent)}
.ts-mm[data-layout=floating] .ts-mm__brand{margin-right:4px}
/* floating, narrow: the sheet is a card that opens out of the pill, over the page blurred (the scrim) */
.ts-mm[data-layout=floating] .ts-mm__sheet{top:calc(100% + 10px);height:auto;max-height:calc(var(--mm-sheet-h,calc(100vh - var(--mm-top,70px))) - 32px);padding:6px 12px 12px;border-radius:28px;background:var(--ts-surface);
  box-shadow:0 0 0 1px var(--ts-line),0 30px 70px -24px color-mix(in srgb,var(--ts-black) 45%,transparent);animation-name:ts-mm-unfurl}
@supports (height:100dvh){.ts-mm[data-layout=floating] .ts-mm__sheet{max-height:calc(var(--mm-sheet-h,calc(100dvh - var(--mm-top,70px))) - 32px)}}
/* the end reaches past the card so its hairline and shadow are not cut as the move finishes */
@keyframes ts-mm-unfurl{from{clip-path:inset(-2px 34% 100% 34% round 28px)}to{clip-path:inset(-2px -60px -100px -60px round 28px)}}
.ts-mm[data-layout=floating] .ts-mm__sheetact{margin-top:14px;padding-top:0}
.ts-mm[data-layout=floating] .ts-mm__scrim{display:block;position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;background:color-mix(in srgb,var(--ts-bg) 64%,transparent);
  -webkit-backdrop-filter:blur(14px) saturate(1.15);backdrop-filter:blur(14px) saturate(1.15);opacity:0;visibility:hidden;transition:opacity .2s ease,visibility 0s .2s}
.ts-mm[data-layout=floating] .ts-mm__scrim[data-on=true]{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .28s ease}
.ts-mm[data-calm=true] .ts-mm__scrim,.ts-mm[data-calm=true] .ts-mm__scrim[data-on=true]{transition:none}
.ts-mm[data-calm=true] .ts-mm__ln{transition:none}
.ts-mm[data-calm=true] .ts-mm__burger:active{scale:none}
.ts-mm[data-calm=true] .ts-mm__sheet,.ts-mm[data-calm=true] .ts-mm__sheet > *{animation:none}
@media (prefers-reduced-motion:reduce){.ts-mm__acc svg,.ts-mm__trig svg{transition:none}}
@media (pointer:coarse){.ts-mm__trig,.ts-mm__link{height:44px}}
`;
registerStyles("ts-mega-menu", CSS);

/* ------------------------------------------------------------------ sample content (demo only) */
const stop = (e) => e.preventDefault();
const DEMO_ITEMS = [
  { id: "products", label: "Products" },
  { id: "solutions", label: "Solutions" },
  { id: "resources", label: "Resources" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
];
const DEMO_PANELS = {
  products: {
    width: 600,
    columns: [{ links: [
      { icon: "doc", label: "Docs", description: "Pages that stay current on their own.", href: "#product" },
      { icon: "grid", label: "Boards", description: "Plan work in lists, boards or timelines.", href: "#product" },
      { icon: "folder", label: "Files", description: "Every asset, versioned and searchable.", href: "#product" },
      { icon: "zap", label: "Automations", description: "Rules that do the follow-up for you.", href: "#product" },
    ] }],
    featured: (
      <a href="#ai" onClick={stop} className="ts-mm__feat">
        <Art art="orchid" lite style={{ position: "absolute", inset: 0 }} />
        <div><b>New: Northwind AI</b><small>Draft, summarise and tidy any page.</small></div>
      </a>
    ),
  },
  solutions: {
    width: 440,
    columns: [
      { heading: "By team", links: ["Design", "Engineering", "Marketing", "Operations"].map((l) => ({ label: l, href: "#solution" })) },
      { heading: "By size", links: ["Startups", "Scale-ups", "Enterprise"].map((l) => ({ label: l, href: "#solution" })) },
    ],
    footer: <><Icon name="star" size={14} />Read customer stories<Icon name="arrowRight" size={13} /></>,
  },
  resources: {
    width: 520,
    columns: [{ links: [
      { icon: "book", label: "Guides", description: "Step-by-step playbooks.", href: "#resource" },
      { icon: "code", label: "API reference", description: "Build on Northwind.", href: "#resource" },
      { icon: "users", label: "Community", description: "Ask, share, meet up.", href: "#resource" },
      { icon: "help", label: "Help centre", description: "Answers in minutes.", href: "#resource" },
    ] }],
    featured: (
      <a href="#post" onClick={stop} className="ts-mm__feat">
        <Art art="eclipse" lite style={{ position: "absolute", inset: 0 }} />
        <div><b>How we cut load time in half</b><small>Engineering blog · 6 min</small></div>
      </a>
    ),
  },
};
const DEMO_BRAND = <><span className="ts-mm__mark"><Icon name="zap" size={15} stroke={2.2} /></span><span className="ts-mm__word">Northwind</span></>;
const DEMO_ACTIONS = <button type="button" className="ts-mm__cta">Get started</button>;

const LABELS = { openMenu: "Open menu", closeMenu: "Close menu" };
const keyOf = (it) => it.id ?? it.href ?? it.label;
const isRich = (l) => l.description != null || l.icon != null;
const iconOf = (icon) => (icon == null ? null : typeof icon === "string" ? <Icon name={icon} size={17} /> : icon);

/**
 * MegaMenu — site navigation with large dropdown panels. Signature: moving between top-level items
 * doesn't close and reopen the panel; one panel stays up and morphs its width, height and position
 * to fit the next section while the content slides in from the side you moved toward, and the caret
 * glides to the new trigger. Hover intent delays avoid accidental opens. Keyboard: Enter/Space toggle,
 * ← → move between top-level items, ↓ opens and moves into the panel, ↑ ↓ move between its links, Esc
 * closes and returns focus to the trigger. Triggers are disclosure buttons (aria-expanded,
 * aria-controls) over regions of links, not ARIA menus.
 *
 * Narrow form (below `compactBelow` px of its own width): a 44px round menu button whose two lines come
 * together and turn into a cross (and straighten, then part, on the way back). The sheet takes the screen
 * under the bar, from its bottom edge to the bottom of the screen (with `demo`, of the frame), on the page's
 * ground; it wipes down from the bar on the settle spring, solid from its first frame, and then its lines
 * rise in one after another. It is an accordion, one section open at a time (none to begin with, each time it opens), with
 * 58px section lines in a large type, links that are not sections marked with an arrow, and your actions
 * pinned full width at the foot. While it is open the page behind does not scroll and is inert; Escape,
 * a link or the button closes it with a quick fade. Reduced motion: the cross and the sheet simply appear.
 *
 * Content: `items` ([{ id, label, href }]: an item with an entry in `panels` is a trigger, one with an href is a
 * plain link), `panels` ({ [id]: { columns: [{ heading, links: [{ label, description, href, icon }] }], featured,
 * footer, width } }), `brand` and `actions` (nodes). Open panel: `open` / `defaultOpen` / `onOpenChange(id | null)`.
 * Phone sheet: `menuOpen` / `defaultMenuOpen` / `onMenuOpenChange`. Links: `renderLink(props, link)`, `onNavigate(link, event)`.
 * With `demo` it renders the sample site in a browser frame, as in the gallery.
 *
 * Layout: `layout="bar"` (the default) is a full-width bar with a rule under it. Its side padding comes from two CSS
 * variables you can set on the menu, `--mm-pad-start` (18px) and `--mm-pad-end` (12px); the narrow sheet's lines start
 * where the brand does, whatever `--mm-pad-start` is. `layout="floating"` lifts the bar off the page into a pill as wide
 * as what is in it, centred, max(10px, safe area) from the top and 12px in from the sides, with a hairline all round
 * and a soft shadow. The header keeps its wide box (panels open under the pill inside it, and `compactBelow` still
 * measures it) but the pointer passes through it beside the pill. Narrow, the sheet is a card under the pill rather
 * than the screen: it opens out of the pill on the settle spring, solid from its first frame, its lines then rise in
 * turn, it stops 22px short of the bottom of the screen (with `demo`, of the frame) and scrolls inside itself, and
 * your actions come at its end. Behind it the page is blurred by a scrim that a press on closes (reason "outside").
 */
export const MegaMenu = forwardRef(function MegaMenu({
  items,
  panels,
  brand,
  actions,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  menuOpen: menuOpenProp,
  defaultMenuOpen = false,
  onMenuOpenChange,
  current,
  renderLink,
  onNavigate,
  openOn = "hover",
  openDelay = 80,
  closeDelay = 220,
  morph = true,
  showCaret = true,
  compactBelow = 600,
  sticky = true,
  layout = "bar",
  disabled = false,
  ariaLabel = "Main",
  labels: labelsProp,
  demo = false,
  frameHeight = 540,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-mega-menu", CSS);
  const reduce = useReducedMotion();
  const L = { ...LABELS, ...labelsProp };
  const uid = useId().replace(/:/g, "");
  const header = useRef(null);
  const panelRef = useRef(null);
  const trig = useRef({});
  const content = useRef(null);
  const timer = useRef(null);
  const burger = useRef(null);
  const sheetEl = useRef(null);
  const scrimEl = useRef(null);
  const setHeader = (el) => { header.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

  // content: the caller's always wins; demo fills only what was left out
  const ITEMS = items ?? (demo ? DEMO_ITEMS : []);
  const PANELS = panels ?? (demo && items === undefined ? DEMO_PANELS : {});
  const TRIGS = ITEMS.filter((it) => PANELS[keyOf(it)]);
  const brandNode = brand !== undefined ? brand : demo ? DEMO_BRAND : null;
  const actionsNode = actions !== undefined ? actions : demo ? DEMO_ACTIONS : null;

  const frameW = useWidth(header);
  const compact = frameW > 0 && frameW < compactBelow;
  const floating = layout === "floating";

  // open panel: controlled (an id or null) or not; defaultOpen true opens the first panel
  const first = TRIGS[0] ? keyOf(TRIGS[0]) : null;
  const [openInner, setOpenInner] = useState(() => (defaultOpen === true ? first : defaultOpen || null));
  const openVal = openProp !== undefined ? (openProp === true ? first : openProp || null) : openInner;
  const open = openVal && PANELS[openVal] ? openVal : null;
  const lastOpen = useRef(open);
  lastOpen.current = open;
  const setOpen = (next, reason) => {
    const id = typeof next === "function" ? next(lastOpen.current) : next;
    if (id === lastOpen.current) return;
    lastOpen.current = id;
    if (openProp === undefined) setOpenInner(id);
    onOpenChange?.(id, reason);
  };
  const [sheetInner, setSheetInner] = useState(defaultMenuOpen);
  const sheet = menuOpenProp !== undefined ? !!menuOpenProp : sheetInner;
  const setSheet = (v, reason) => { if (menuOpenProp === undefined) setSheetInner(v); if (v !== sheet) onMenuOpenChange?.(v, reason); };

  const [dir, setDir] = useState(0);
  const [size, setSize] = useState(null);
  const [anchor, setAnchor] = useState(0);
  const [acc, setAcc] = useState(null); // narrow sheet: the open section; none to begin with, so it opens as plain lines
  const focusIn = useRef(false);
  const cur = compact ? null : open ?? (forceState === "open" ? first : null);
  const sheetOpen = compact && (sheet || forceState === "open");

  const idx = (id) => TRIGS.findIndex((s) => keyOf(s) === id);
  const show = (id, reason = "hover") => {
    clearTimeout(timer.current);
    const o = lastOpen.current;
    if (o && id && o !== id) setDir(idx(id) > idx(o) ? 1 : -1);
    else if (!o) setDir(0);
    setOpen(id, reason);
  };
  const later = (fn, ms) => { clearTimeout(timer.current); timer.current = setTimeout(fn, ms); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (compact) { if (lastOpen.current) setOpen(null, "resize"); } else if (sheet) setSheet(false, "resize"); }, [compact]);

  // measure the entering section; the panel springs to its size
  useIsoLayoutEffect(() => {
    if (!cur) return;
    const el = content.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const t = trig.current[cur]?.getBoundingClientRect(), h = header.current.getBoundingClientRect();
    if (t) setAnchor(t.left - h.left + t.width / 2);
    return () => ro.disconnect();
  }, [cur, frameW]);

  const hw = header.current?.offsetWidth ?? frameW;
  const x = size ? Math.max(8, Math.min(hw - size.w - 8, anchor - size.w / 2)) : 0;

  // narrow sheet: it runs from the bar's bottom edge to the bottom of the screen (with `demo`, of the frame), measured at
  // open and on resize, before the first frame is painted. Floating, the same numbers cap the card, and the scrim is
  // placed over the screen (or the frame's scroller) from the header's own box: absolute, not fixed, so a transformed
  // ancestor cannot pull it off the screen.
  useIsoLayoutEffect(() => {
    const h = header.current;
    if (!sheetOpen || !h) return;
    const scroller = demo ? h.closest(".ts-page__scroll") : null;
    h.style.removeProperty(scroller ? "--mm-top" : "--mm-sheet-h");
    // a bar that is not sticky can be part-way off the top of the screen: bring it fully in first, since the page
    // is held where it is for as long as the sheet is open
    const off = h.getBoundingClientRect().top - (scroller ? scroller.getBoundingClientRect().top : 0);
    if (off < 0) { if (scroller) scroller.scrollTop += off; else scrollBy({ top: off, behavior: "instant" }); }
    const fit = () => {
      const bottom = h.getBoundingClientRect().bottom;
      if (scroller) h.style.setProperty("--mm-sheet-h", Math.max(0, scroller.getBoundingClientRect().bottom - bottom) + "px");
      else h.style.setProperty("--mm-top", Math.max(0, bottom) + "px");
      const s = scrimEl.current;
      if (s) {
        const r = h.getBoundingClientRect();
        const v = scroller ? scroller.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
        Object.assign(s.style, { left: v.left - r.left + "px", top: v.top - r.top + "px", width: v.width + "px", height: v.height + "px" });
      }
    };
    fit();
    addEventListener("resize", fit);
    const ro = scroller && typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(scroller);
    return () => { removeEventListener("resize", fit); ro?.disconnect(); };
  }, [sheetOpen, demo, floating]);

  // while the sheet is open the page behind it holds still and is out of reach (inert), and comes back exactly as it
  // was on close. With `demo` that page is the frame's scroller, never the document.
  useScrollLock(sheetOpen && !demo);
  useEffect(() => {
    const h = header.current;
    if (!sheetOpen || !h) return;
    const scroller = demo ? h.closest(".ts-page__scroll") : null;
    if (demo && !scroller) return;
    const stop = scroller ?? document.body;
    const held = [];
    for (let node = h; node.parentElement && node !== stop; node = node.parentElement) {
      for (const el of node.parentElement.children) {
        if (el === node || el.hasAttribute("inert") || el.hasAttribute("aria-live") || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName)) continue;
        el.setAttribute("inert", "");
        held.push(el);
      }
      if (node.parentElement === stop) break;
    }
    let undo = null;
    if (scroller) {
      const prev = { overflow: scroller.style.overflowY, pad: scroller.style.paddingRight };
      const gap = scroller.offsetWidth - scroller.clientWidth;
      scroller.style.overflowY = "hidden";
      if (gap > 0) scroller.style.paddingRight = gap + "px";
      undo = () => { scroller.style.overflowY = prev.overflow; scroller.style.paddingRight = prev.pad; };
    }
    return () => { held.forEach((el) => el.removeAttribute("inert")); undo?.(); };
  }, [sheetOpen, demo]);

  const close = (restore, reason = "close") => { clearTimeout(timer.current); const id = lastOpen.current; setOpen(null, reason); if (restore && id) trig.current[id]?.focus(); };
  useDismiss(!!open && openOn === "click", () => close(false, "outside"), [header], { escape: false });
  useDismiss(sheetOpen, (why) => { setSheet(false, why); if (why === "escape") burger.current?.focus(); }, [header]);

  // links: a real <a> (or the caller's router link); disabled ones lose their href
  const nav = (link, e, then) => {
    if (disabled || link.disabled) { e.preventDefault(); return; }
    if (demo && (!link.href || link.href.startsWith("#"))) e.preventDefault();   // the demo page has nowhere to go
    link.onClick?.(e);
    onNavigate?.(link, e);
    then?.();
  };
  const linkEl = (link, className, children, extra = {}) => {
    const dis = disabled || !!link.disabled;
    const props = { className, onClick: (e) => nav(link, e, () => { close(false, "navigate"); if (sheet) setSheet(false, "navigate"); }), "aria-disabled": dis || undefined, ...extra };
    if (dis || !link.href) return <a {...props} role="link" tabIndex={dis ? -1 : 0}>{children}</a>;
    return renderLink ? renderLink({ ...props, href: link.href, children }, link) : <a {...props} href={link.href}>{children}</a>;
  };
  const richLink = (l, i) => <Fragment key={(l.id ?? l.label) + i}>{linkEl(l, "ts-mm__item", <><span className="ts-mm__ico">{iconOf(l.icon)}</span><div><b>{l.label}</b>{l.description && <span>{l.description}</span>}</div></>)}</Fragment>;
  const plainLink = (l, i) => <Fragment key={(l.id ?? l.label) + i}>{linkEl(l, "ts-mm__plain", l.label)}</Fragment>;
  const column = (col, k) => {
    const plain = !(col.links ?? []).some(isRich);
    return (
      <div key={k} className="ts-mm__col" data-plain={plain}>
        {col.heading && <div className="ts-mm__head">{col.heading}</div>}
        {(col.links ?? []).map((l, i) => (isRich(l) ? richLink(l, i) : plainLink(l, i)))}
      </div>
    );
  };
  const panelBody = (p) => (
    <>
      <div className="ts-mm__split" data-feat={!!p.featured}>
        <div className="ts-mm__cols" style={{ gridTemplateColumns: `repeat(${Math.max(1, (p.columns ?? []).length)}, minmax(0,1fr))` }}>{(p.columns ?? []).map(column)}</div>
        {p.featured && <div style={{ display: "grid" }}>{p.featured}</div>}
      </div>
      {p.footer && <div className="ts-mm__foot">{p.footer}</div>}
    </>
  );
  const sheetBody = (p) => {
    const cols = p.columns ?? [];
    const allPlain = cols.length > 1 && cols.every((c) => !(c.links ?? []).some(isRich));
    if (allPlain) return <div className="ts-mm__solgrid">{cols.map((c, k) => <div key={k}>{c.heading && <div className="ts-mm__head">{c.heading}</div>}{(c.links ?? []).map(plainLink)}</div>)}</div>;
    return cols.map((c, k) => <div key={k}>{c.heading && <div className="ts-mm__head">{c.heading}</div>}{(c.links ?? []).map((l, i) => (isRich(l) ? richLink(l, i) : plainLink(l, i)))}</div>);
  };

  // keys on the bar: ← → Home End between top-level items; a panel that is open follows focus
  const onBarKey = (e) => {
    const tops = [...header.current.querySelectorAll(".ts-mm__bar .ts-mm__trig:not(:disabled), .ts-mm__bar .ts-mm__link:not([aria-disabled=true])")];
    const i = tops.indexOf(document.activeElement);
    if (i < 0) return;
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % tops.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tops.length) % tops.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tops.length - 1;
    if (n == null) return;
    e.preventDefault();
    const el = tops[n];
    el.focus();
    if (lastOpen.current) { const id = el.dataset.mmId; if (id && PANELS[id]) show(id, "keyboard"); else close(false, "keyboard"); }
  };
  // keys in the panel: ↑ ↓ between its links
  const onPanelKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const list = [...panelRef.current.querySelectorAll("a[href], a[tabindex='0'], button:not(:disabled)")];
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === "ArrowUp" && i === 0) { trig.current[cur]?.focus(); return; }
    list[Math.min(list.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  const spring = reduce || !morph ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };
  const slide = {
    enter: (d) => ({ opacity: 0, x: reduce || !morph ? 0 : d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce || !morph ? 0 : d * -48 }),
  };
  const panelId = "ts-mm-panel-" + uid;
  const trigId = (id) => "ts-mm-t-" + uid + "-" + String(id).replace(/[^\w-]/g, "");
  const curPanel = cur ? PANELS[cur] : null;
  // narrow sheet, scrolled: when a section opens and the one above it closes, the opened section's own line would
  // ride up out of sight with it. While the heights settle, the sheet follows so that line stays at its top.
  useEffect(() => {
    const el = sheetEl.current;
    const line = sheetOpen && acc && el ? el.querySelector(".ts-mm__acc[aria-expanded=true]") : null;
    if (!line) return;
    const t0 = performance.now();
    let raf = requestAnimationFrame(function keep(now) {
      const over = line.getBoundingClientRect().top - el.getBoundingClientRect().top - 8;
      if (over < 0) el.scrollTop += over;
      if (now - t0 < 500) raf = requestAnimationFrame(keep);
    });
    return () => cancelAnimationFrame(raf);
  }, [acc, sheetOpen]);

  // narrow sheet: every opening starts with no section open
  useEffect(() => { if (!sheetOpen) setAcc(null); }, [sheetOpen]);

  const LINKS = ITEMS.filter((it) => !PANELS[keyOf(it)]);   // narrow sheet: top-level links that are not sections
  const beat = (n) => Math.min(n, 8);                        // narrow sheet: each line rises 40ms after the one above

  const menu = (
    <header
      ref={setHeader}
      className={"ts-mm" + (className ? " " + className : "")}
      data-sticky={sticky}
      data-layout={layout}
      data-tight={frameW > 0 && frameW < 760 && !compact}
      data-calm={compact && reduce ? true : undefined}
      style={{ "--mm-max": Math.max(260, (frameW || 600) - 16) + "px", ...style }}
      onPointerEnter={() => clearTimeout(timer.current)}
      onPointerLeave={() => { if (openOn === "hover" && lastOpen.current) later(() => setOpen(null, "hover"), closeDelay); }}
      onKeyDown={(e) => { if (e.key === "Escape" && (lastOpen.current || sheetOpen)) { e.stopPropagation(); if (sheetOpen) { setSheet(false, "escape"); burger.current?.focus(); } close(true, "escape"); } }}
      onBlur={(e) => { if (!header.current.contains(e.relatedTarget)) { if (openOn === "hover" || focusIn.current) { if (lastOpen.current) setOpen(null, "blur"); } focusIn.current = false; } }}
      {...rest}
    >
      {floating && compact && <div ref={scrimEl} className="ts-mm__scrim" data-on={sheetOpen} aria-hidden="true" onClick={() => setSheet(false, "outside")} />}
      <nav className="ts-mm__bar" aria-label={ariaLabel} onKeyDown={onBarKey}>
        {brandNode && <span className="ts-mm__brand">{brandNode}</span>}
        {!compact && ITEMS.map((it) => {
          const id = keyOf(it);
          if (PANELS[id]) return (
            <button
              key={id}
              id={trigId(id)}
              data-mm-id={id}
              ref={(el) => (trig.current[id] = el)}
              type="button"
              className="ts-mm__trig"
              disabled={disabled || it.disabled}
              aria-expanded={cur === id}
              aria-controls={cur === id ? panelId : undefined}
              onPointerEnter={(e) => { if (openOn !== "hover" || e.pointerType === "touch") return; lastOpen.current ? show(id) : later(() => show(id), openDelay); }}
              onClick={() => (cur === id ? close(false, "toggle") : show(id, "click"))}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault(); focusIn.current = true; show(id, "keyboard");
                  requestAnimationFrame(() => requestAnimationFrame(() => panelRef.current?.querySelector("a[href], a[tabindex='0'], button:not(:disabled)")?.focus()));
                }
              }}
            >
              {it.label}<Icon name="chevronDown" size={13} stroke={2.2} />
            </button>
          );
          return <Fragment key={id}>{linkEl(it, "ts-mm__link", it.label, {
            "data-mm-id": id,
            "aria-current": current != null && (current === id || current === it.href) ? "page" : undefined,
            onPointerEnter: () => { if (openOn === "hover" && lastOpen.current) later(() => setOpen(null, "hover"), 90); },
          })}</Fragment>;
        })}
        {!compact && actionsNode && <span className="ts-mm__actions">{actionsNode}</span>}
        {compact && (ITEMS.length > 0 || actionsNode) && (
          <button ref={burger} type="button" className="ts-mm__burger" disabled={disabled} aria-label={sheetOpen ? L.closeMenu : L.openMenu} aria-expanded={sheetOpen} aria-controls={sheetOpen ? panelId + "-sheet" : undefined} onClick={() => setSheet(!sheet, "toggle")}>
            <span className="ts-mm__ln" aria-hidden /><span className="ts-mm__ln" aria-hidden />
          </button>
        )}
      </nav>

      <AnimatePresence>
        {curPanel && (
          <motion.div key="panelwrap" initial={{ opacity: 0, y: reduce ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -4, transition: { duration: 0.14 } }} transition={{ duration: reduce ? 0.1 : 0.18 }}>
            {showCaret && <motion.span className="ts-mm__caret" aria-hidden style={{ rotate: 45 }} initial={false} animate={{ x: anchor - 6 }} transition={spring} />}
            <motion.div
              ref={panelRef}
              id={panelId}
              role="region"
              aria-labelledby={trigId(cur)}
              className="ts-mm__panel"
              initial={false}
              animate={size ? { x, width: size.w, height: size.h } : { x }}
              transition={spring}
              onPointerEnter={() => clearTimeout(timer.current)}
              onKeyDown={onPanelKey}
            >
              <AnimatePresence initial={false} custom={dir}>
                <motion.div
                  key={cur}
                  ref={(el) => { if (el) content.current = el; }}
                  className="ts-mm__sec"
                  style={{ "--mm-w": (curPanel.width ?? 520) + "px" }}
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={reduce || !morph ? { duration: 0.12 } : { x: { type: "spring", stiffness: 380, damping: 36 }, opacity: { duration: 0.16 } }}
                >
                  {panelBody(curPanel)}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheetOpen && (
          // solid from its first frame: the CSS wipes it down from the bar, then its lines rise one after another (--n)
          <motion.div ref={sheetEl} id={panelId + "-sheet"} className="ts-mm__sheet" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.14 } }}>
            {TRIGS.map((s, k) => {
              const id = keyOf(s);
              const hid = "ts-mm-acc-" + uid + "-" + String(id).replace(/[^\w-]/g, "");
              return (
                <div key={id} style={{ "--n": beat(k) }}>
                  {k > 0 && <div className="ts-mm__rule" />}
                  <button type="button" className="ts-mm__acc" id={hid} disabled={disabled || s.disabled} aria-expanded={acc === id} aria-controls={acc === id ? hid + "-p" : undefined}
                    onClick={() => setAcc((a) => (a === id ? null : id))}>
                    {s.label}<Icon name="chevronDown" size={18} stroke={2.2} />
                  </button>
                  <AnimatePresence initial={false}>
                    {acc === id && (
                      <motion.div key="b" className="ts-mm__accbody" id={hid + "-p"} role="region" aria-labelledby={hid}
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={reduce ? { duration: 0 } : { height: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.16 } }}>
                        <div>{sheetBody(PANELS[id])}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {LINKS.length > 0 && TRIGS.length > 0 && <div className="ts-mm__rule" style={{ "--n": beat(TRIGS.length) }} />}
            {LINKS.map((it, j) => <Fragment key={keyOf(it)}>{linkEl(it, "ts-mm__plain", <>{it.label}<Icon name="arrowRight" size={18} stroke={2.2} /></>, { style: { "--n": beat(TRIGS.length + 1 + j) } })}</Fragment>)}
            {actionsNode && <div className="ts-mm__sheetact" style={{ "--n": beat(TRIGS.length + 1 + LINKS.length) }}>{actionsNode}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
  if (!demo) return <>{sheetTag}{menu}</>;
  return (
    <>{sheetTag}<PageFrame height={frameHeight} label="Demo page with a mega menu">
      {menu}
      <DemoLanding top={0} long={false} />
    </PageFrame></>
  );
});
