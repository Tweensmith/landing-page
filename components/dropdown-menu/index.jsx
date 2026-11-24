"use client";
import { cloneElement, forwardRef, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { registerStyles, useStyles, refOf } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { useDismiss } from "../_shared/overlay.jsx";
import { MenuPanel, useMenuState, drillLevel } from "../_shared/menu.jsx";
import { useMedia, TOUCH } from "../_shared/media.js";

const CSS = `
.ts-dd-trigger{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 14px;border-radius:var(--ts-radius-md);
  font-family:var(--ts-font);font-size:14px;font-weight:550;cursor:pointer;color:var(--ts-ink);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-dd-trigger:hover,.ts-dd-trigger[aria-expanded=true]{background:var(--ts-surface2)}
.ts-dd-trigger:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-dd-trigger:disabled{opacity:.42;cursor:not-allowed;background:var(--ts-surface)}
.ts-dd-trigger svg{color:var(--ts-ink2);transition:transform .2s}
.ts-dd-trigger[aria-expanded=true] svg:last-child{transform:rotate(180deg)}
.ts-dd{display:contents}
/* reduced motion: the chevron flips without turning */
@media (prefers-reduced-motion:reduce){.ts-dd-trigger svg{transition:none}}
@media (max-width:640px),(pointer:coarse){
  .ts-dd-trigger{height:44px}
  .ts-dd .ts-menu{min-width:240px;padding:6px}
  .ts-dd .ts-menu__item{height:44px;gap:12px;font-size:15px}
  .ts-dd .ts-menu__label{padding:10px 10px 6px;font-size:11px}
}
`;
registerStyles("ts-dropdown-menu", CSS);

// phones (and touch screens) have no hover and no room to cascade: submenus drill in place instead


export const DEMO_MENU = [
  { type: "label", label: "Project" },
  { id: "rename", label: "Rename", icon: "edit", shortcut: "F2" },
  { id: "dup", label: "Duplicate", icon: "copy", shortcut: "⌘D" },
  { id: "share", label: "Share", icon: "share", items: [
    { id: "link", label: "Copy link", icon: "link", shortcut: "⌘L" },
    { id: "email", label: "Email", icon: "mail" },
    { id: "export", label: "Export as", icon: "doc", items: [
      { id: "png", label: "PNG" }, { id: "pdf", label: "PDF" }, { id: "svg", label: "SVG" },
    ] },
  ] },
  { id: "move", label: "Move to", icon: "bookmark", items: [
    { id: "inbox", label: "Inbox" }, { id: "archive", label: "Archive" }, { id: "clients", label: "Clients" }, { id: "personal", label: "Personal", disabled: true },
  ] },
  { separator: true },
  { type: "label", label: "View" },
  { id: "grid", label: "Show grid", type: "checkbox" },
  { id: "rulers", label: "Show rulers", type: "checkbox" },
  { separator: true },
  { id: "delete", label: "Delete", icon: "trash", shortcut: "⌫", danger: true },
];

const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };

/**
 * DropdownMenu — action menu from a button, with nested submenus.
 * Signature: a "safe triangle" from the pointer to the submenu keeps it open while the pointer
 * cuts diagonally across other items (turn on showSafeArea to see it). Type a letter to jump.
 * Keyboard: Enter/Space/↓ open on first item, ↑ on last; arrows, Home and End move, → opens a submenu, ← / Esc close it.
 * On phones and touch screens rows grow to 44px and submenus drill in place (with a Back row) instead of cascading.
 *
 * The menu renders through a portal into document.body (`portal`, default true) carrying the theme found at the
 * trigger, so an ancestor with overflow:hidden, transform or filter can't clip or move it; `portal={false}`
 * renders it in place, or pass an element / ref to portal into.
 *
 * `items` is an array of { id, label, icon, shortcut, disabled, danger, items (a submenu), type: "checkbox",
 * closeOnSelect }, plus { separator: true } (or { type: "separator" }) and { type: "label", label } for a group
 * heading. Labels must be strings (typeahead reads them). `onSelect(id, item)` fires for a chosen item; the menu
 * closes unless `closeOnSelect` is false (on the menu or the item). Checkbox items keep it open and report through
 * `onCheckedChange(id, checked, all)`; their state is `checked` (controlled, { [id]: boolean }) or `defaultChecked`.
 * Open state: `open` / `defaultOpen` / `onOpenChange(open, reason)`. `trigger` swaps the built-in button for your
 * element or a render function `(props) => <Button {...props} />`. With no items it shows only its button and
 * does not open; `demo` fills it with the gallery's sample menu.
 * The ref, `className`, `style` and other props go to the trigger button.
 */
export const DropdownMenu = forwardRef(function DropdownMenu({
  label = "Options",
  items,
  trigger: triggerProp,
  icon = "more",
  placement = "bottom-start",
  showSafeArea = false,
  checked,
  defaultChecked,
  defaultChecks,
  onCheckedChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  closeOnSelect = true,
  closeOnEscape = true,
  closeOnOutside = true,
  disabled = false,
  demo = false,
  forceState,
  portal = true,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-dropdown-menu", CSS);
  const trigger = useRef(null);
  const root = useRef(null);
  const menuId = useId();
  const [openState, setOpenState] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const list = items ?? (demo ? DEMO_MENU : []);
  const empty = !list.length;
  const isOpen = !empty && ((controlled ? !!openProp : openState) || forceState === "open");
  const setOpen = (v, why) => { if (v && (disabled || empty)) return; if (v === isOpen) return; if (!controlled) setOpenState(v); onOpenChange?.(v, why); };
  const [focus, setFocus] = useState("first");
  const menu = useMenuState(defaultChecked ?? defaultChecks ?? (demo && !items ? { grid: true } : {}));
  const checks = checked ?? menu.checks;
  const phone = useMedia(TOUCH);
  const [trail, setTrail] = useState([]);   // drill-in path on phones
  const drilled = useRef(false);            // the last "selection" moved a level, so don't close
  const picked = useRef(null);              // the item a selection just chose (set before the engine closes)
  useEffect(() => { if (!isOpen) setTrail([]); }, [isOpen]);
  const push = (i) => { drilled.current = true; setTrail((t) => [...t, i]); };
  const pop = () => { drilled.current = true; setTrail((t) => t.slice(0, -1)); };
  const setTrigger = useCallback((el) => { trigger.current = el; setRef(ref, el); }, [ref]);

  // plain item objects in; each leaf item is wrapped so a choice records which item it was (the engine only reports labels)
  const norm = useMemo(() => {
    const walk = (arr) => arr.map((it) => {
      if (!it) return { separator: true };
      if (it.separator || it.type === "separator") return { separator: true };
      if (it.type === "label" || it.type === "group") return { type: "label", label: it.label };
      const item = { ...it, id: it.id ?? it.label };
      if (it.items) return { ...item, items: walk(it.items) };
      if (it.type !== "checkbox") item.onSelect = () => { picked.current = it; it.onSelect?.(); };
      return item;
    });
    return walk(list);
  }, [list]);

  const closeAll = (restore, why = "select") => {
    if (drilled.current) { drilled.current = false; return; }
    const p = picked.current;
    picked.current = null;
    if (p && (p.closeOnSelect ?? closeOnSelect) === false) return;
    setOpen(false, p ? "select" : why); if (restore) trigger.current?.focus();
  };
  useDismiss(isOpen, (why) => { if (closeOnOutside) closeAll(false, why); }, [trigger, (t) => !!t.closest?.("[data-ts-menu]")], { escape: false });
  const toggle = (id) => {
    const next = !checks[id];
    if (checked === undefined) menu.toggle(id);
    onCheckedChange?.(id, next, { ...checks, [id]: next });
  };
  const ctx = {
    closeAll: (restore) => closeAll(restore, picked.current ? "select" : "escape"),
    checks, toggle, showSafeArea,
    announce: (s) => { if (drilled.current) return; menu.announce(s); const p = picked.current; if (p) onSelect?.(p.id ?? p.label, p); },
  };
  const shown = phone ? drillLevel(norm, trail, push, pop) : norm;

  const openWith = (f) => { setFocus(f); setOpen(true, "trigger"); };
  const onClick = () => { if (isOpen) setOpen(false, "trigger"); else openWith("first"); };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); openWith("first"); }
    if (e.key === "ArrowUp") { e.preventDefault(); openWith("last"); }
    // a menu opened by the caller leaves focus on the button: Escape there closes it too
    if (e.key === "Escape" && isOpen && closeOnEscape) { e.preventDefault(); setOpen(false, "escape"); }
  };
  const aria = { "aria-haspopup": "menu", "aria-expanded": isOpen, "aria-controls": isOpen ? menuId : undefined };
  let triggerEl;
  if (typeof triggerProp === "function") triggerEl = triggerProp({ ref: setTrigger, onClick, onKeyDown, disabled: disabled || undefined, open: isOpen, ...aria });
  else if (isValidElement(triggerProp)) {
    const p = triggerProp.props;
    triggerEl = cloneElement(triggerProp, {
      ref: (el) => { setTrigger(el); setRef(refOf(triggerProp), el); },
      onClick: (e) => { p.onClick?.(e); if (!e?.defaultPrevented) onClick(); },
      onKeyDown: (e) => { p.onKeyDown?.(e); if (!e?.defaultPrevented) onKeyDown(e); },
      ...aria,
      ...(disabled ? { disabled: true } : null),
    });
  } else {
    triggerEl = (
      <button {...rest} ref={setTrigger} type="button" className={"ts-dd-trigger" + (className ? " " + className : "")} style={style}
        disabled={disabled} {...aria} onClick={onClick} onKeyDown={(e) => { rest.onKeyDown?.(e); onKeyDown(e); }}>
        {icon && icon !== "none" && <Icon name={icon} size={18} />}{label}<Icon name="chevronDown" size={14} stroke={2.2} />
      </button>
    );
  }

  return (
    <>{sheetTag}<span ref={root} className="ts-dd"
      onKeyDownCapture={(e) => {
        // closeOnEscape={false}: Escape still closes a submenu, but not the menu itself
        if (e.key === "Escape" && !closeOnEscape && e.target.closest?.('[data-ts-menu-level="0"]')) { e.preventDefault(); e.stopPropagation(); }
      }}>
      {triggerEl}
      <AnimatePresence>
        {isOpen && <MenuPanel key={"m" + trail.join("-")} id={menuId} items={shown} anchor={trigger} owner={root} portal={portal} placement={placement} ctx={ctx} focusFirst={trail.length || phone ? "first" : focus} label={label} />}
      </AnimatePresence>
      <span className="ts-sr" aria-live="polite">{menu.said}</span>
    </span></>
  );
});
