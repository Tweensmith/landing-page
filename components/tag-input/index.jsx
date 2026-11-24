"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";
import { useFloating, Layer } from "../_shared/overlay.jsx";

const DEMO_SUGGESTIONS = ["Branding", "Motion", "Typography", "Illustration", "Product design", "Prototyping", "Research", "Design systems", "3D", "Copywriting", "Accessibility", "Photography"];
const DEMO_TAGS = ["Motion", "Typography"];
const NONE = [];
const DEFAULT_HINT = "Press Enter or comma to add. Backspace removes.";

const CSS = `
.ts-tags{max-width:440px}
.ts-tags .ts-box{flex-wrap:wrap;gap:6px;padding:7px 8px;min-height:48px;cursor:text;align-items:center}
.ts-tags__chip{display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 4px 0 10px;border-radius:99px;font-size:13px;font-weight:520;
  background:var(--ts-surface2);color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line);white-space:nowrap;user-select:none;max-width:100%}
.ts-tags__chip > span{overflow:hidden;text-overflow:ellipsis}
.ts-tags.is-ro .ts-tags__chip{padding-right:10px}
.ts-tags__chip.is-sel{background:color-mix(in srgb,var(--ts-danger) 16%,var(--ts-surface2));box-shadow:inset 0 0 0 1.5px var(--ts-danger)}
.ts-tags__chip.is-dupe{box-shadow:inset 0 0 0 1.5px var(--ts-accent)}
.ts-tags__x{all:unset;flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:99px;color:var(--ts-ink2);cursor:pointer}
.ts-tags__x:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 10%,transparent)}
.ts-tags__x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-tags .ts-input{min-width:110px;height:30px;padding:0 6px;font-size:14.5px}
.ts-tags__wrap{position:relative}
.ts-tags__menu{position:fixed;z-index:20;box-sizing:border-box;padding:5px;margin:0;list-style:none;border-radius:var(--ts-radius-md);font-family:var(--ts-font);
  background:var(--ts-surface);box-shadow:0 18px 40px -12px color-mix(in srgb,var(--ts-bg) 70%,transparent),0 0 0 1px var(--ts-line);max-height:220px;overflow:auto}
.ts-tags__opt{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--ts-radius-sm);font-size:14px;color:var(--ts-ink);cursor:pointer}
.ts-tags__opt[aria-selected=true]{background:var(--ts-surface2)}
.ts-tags__opt b{font-weight:650}
.ts-tags__opt svg{color:var(--ts-ink2)}
.ts-tags__count{font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2);margin-left:auto;white-space:nowrap}
.ts-tags__x{position:relative}
.ts-field.ts-tags.is-label-float .ts-box{padding-top:24px;padding-bottom:6px}
.ts-field.ts-tags.is-label-float .ts-input{padding-top:0}
.ts-tags__x::after{content:"";position:absolute;inset:-6px -4px}
@media (max-width:640px),(pointer:coarse){
  .ts-tags .ts-box{gap:8px;padding:6px 8px;min-height:52px}
  .ts-tags__chip{height:36px;padding:0 0 0 12px;font-size:14px;gap:0}
  .ts-tags.is-ro .ts-tags__chip{padding-right:12px}
  .ts-tags__x{width:44px;height:44px;margin:-4px -4px -4px -6px}
  .ts-tags__x::after{content:none}
  .ts-tags .ts-input{height:44px;margin:-4px 0;min-width:96px;font-size:16px}
  .ts-tags__opt{min-height:44px;padding:0 12px;font-size:15px}
}
`;
registerStyles("ts-tag-input", CSS);

/** Neutral copy. Override any key through `messages`. */
export const DEFAULT_MESSAGES = {
  max: (n) => `You can add up to ${n}`,
  notInList: "Pick one from the list",
  armed: "Press Backspace again to remove",
  remove: (tag) => `Remove ${tag}`,
  suggestions: (label) => (label ? `${label} suggestions` : "Suggestions"),
  summary: (tags) => `${tags.length} tags: ${tags.join(", ")}`,
  exists: (tag) => `${tag} is already added`,
};

const norm = (s) => s.trim().replace(/\s+/g, " ");
const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

/**
 * TagInput — type and press Enter (or comma) to add a tag; Backspace on an empty input
 * selects the last tag, a second Backspace removes it. Suggestions filter as you type.
 * Signature: adding a tag that already exists nudges the existing chip instead of duplicating it.
 * Text left in the box is added on blur (when it passes allowCustom / validate / maxTags; otherwise the
 * reason shows as the error and the text stays). The ref is the text input.
 * The suggestion list renders through a portal into document.body (`portal`, default true) carrying the theme found
 * at the field, so an ancestor with overflow:hidden, transform or filter can't clip or move it; it keeps the
 * field's width, follows it, and flips above it when there is no room below. Escape closes the list (focus stays
 * in the box); a second Escape leaves the box as before. `portal={false}` renders it in place, or pass an element / ref.
 */
export const TagInput = forwardRef(function TagInput({
  label = "Tags",
  labelPlacement = "above",
  placeholder = "Add a tag…",
  hint = "Press Enter or comma to add. Backspace removes.",
  value: valueProp,
  defaultValue,
  defaultTags = NONE,
  suggestions: suggestionsProp,
  maxTags = 0,
  allowCustom = true,
  showSuggestions = true,
  validate,
  error: errorProp,
  messages,
  onChange,
  onAdd,
  onRemove,
  id,
  name,
  autoComplete = "off",
  autoFocus = false,
  required = false,
  readOnly = false,
  disabled = false,
  demo = false,
  maxWidth = 440,
  portal = true,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useLabelStyles();
  const sheetTag3 = useStyles("ts-tag-input", CSS);
  const reduce = useReducedMotion();
  const uid = useId();
  const inputId = id || uid + "in";
  const input = useRef(null);
  const wrap = useRef(null);
  const list = useRef(null);
  const [hush, setHush] = useState(false);   // Escape closed the list; typing or the arrows bring it back
  const msg = { ...DEFAULT_MESSAGES, ...messages };
  const suggestions = suggestionsProp ?? (demo ? DEMO_SUGGESTIONS : NONE);
  const initial = defaultValue ?? (defaultTags !== NONE ? defaultTags : demo ? DEMO_TAGS : NONE);
  const [inner, setInner] = useState(initial);
  const controlled = valueProp !== undefined;
  const tags = controlled ? valueProp ?? NONE : inner;
  const [text, setText] = useState("");
  const [sel, setSel] = useState(false);       // last chip armed for deletion
  const [dupe, setDupe] = useState(null);       // { tag, n } to replay the nudge
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [nav, setNav] = useState(false); // highlight shows only after arrows or hover
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");          // read out instead of the summary when a typed tag already exists
  const isDisabled = disabled || forceState === "disabled";
  const locked = isDisabled || readOnly;
  const full = maxTags > 0 && tags.length >= maxTags;

  const lower = tags.map((t) => t.toLowerCase());
  const matches = useMemo(() => {
    if (!showSuggestions) return [];
    const q = text.trim().toLowerCase();
    return suggestions.filter((s) => !lower.includes(s.toLowerCase()) && (!q || s.toLowerCase().includes(q))).slice(0, 6);
  }, [text, suggestions, tags, showSuggestions]);
  const menuOpen = (focused || forceState === "open") && !hush && !full && matches.length > 0 && !locked;
  const pos = useFloating(wrap, list, menuOpen, { placement: "bottom-start", offset: 6, padding: 8, maxHeight: 220 });

  // the option the arrows reach stays in view when the list scrolls (on touch only four and a bit fit)
  useEffect(() => {
    if (!menuOpen || !nav) return;
    const el = document.getElementById(`${uid}o${active}`);
    if (el && list.current?.contains(el)) el.scrollIntoView({ block: "nearest" });
  }, [active, nav, menuOpen]);

  const update = (next) => { if (!controlled) setInner(next); onChange?.(next); setNote(""); };
  const add = (raw) => {
    const t = norm(raw);
    if (!t) return false;
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0) { setDupe((d) => ({ tag: tags[i], n: (d?.n ?? 0) + 1 })); setNote(msg.exists(tags[i])); setText(""); return true; }
    if (full) { setError(msg.max(maxTags)); return false; }
    if (!allowCustom && !suggestions.some((s) => s.toLowerCase() === t.toLowerCase())) { setError(msg.notInList); return false; }
    const bad = validate?.(t, tags);
    if (bad) { setError(bad); return false; }
    update([...tags, t]);
    onAdd?.(t);
    setText("");
    setError(null);
    setActive(0);
    setNav(false);
    return true;
  };
  const remove = (t) => {
    if (locked) return;
    update(tags.filter((x) => x !== t));
    onRemove?.(t);
    setSel(false); setError(null); input.current?.focus();
  };

  const onKey = (e) => {
    rest.onKeyDown?.(e);
    if (e.defaultPrevented || locked) return;
    if (e.key === "Enter" || (e.key === "," && text.trim())) {
      const picked = menuOpen && nav && matches[active];
      // Enter on an empty box submits the surrounding form as usual
      if (e.key === "Enter" && !text.trim() && !picked) return;
      e.preventDefault();
      // a suggestion wins only if the user picked it with the arrows, or typed it exactly
      const exact = suggestions.find((s) => s.toLowerCase() === norm(text).toLowerCase());
      add(picked || (exact ?? text));
    } else if (e.key === ",") e.preventDefault();
    else if (e.key === "Backspace" && !text && tags.length) {
      e.preventDefault();
      if (sel) remove(tags[tags.length - 1]); else setSel(true);
    } else if (e.key === "ArrowDown" && hush && !menuOpen) { e.preventDefault(); setHush(false); }
    else if (e.key === "ArrowDown" && menuOpen) { e.preventDefault(); setNav(true); setActive((a) => (nav ? Math.min(matches.length - 1, a + 1) : 0)); }
    else if (e.key === "ArrowUp" && menuOpen) { e.preventDefault(); setNav(true); setActive((a) => Math.max(0, a - 1)); }
    // Escape with the list open closes only the list (and, inside a Modal or Drawer, not the dialog)
    else if (e.key === "Escape" && menuOpen) { e.preventDefault(); e.stopPropagation(); setHush(true); setNav(false); setSel(false); }
    else if (e.key === "Escape") { setSel(false); input.current?.blur(); }
    else setSel(false);
  };

  // <form> reset: back to the initial tags, empty box
  const resetRef = useRef();
  resetRef.current = () => { setText(""); setError(null); setSel(false); if (tags.join("\n") !== initial.join("\n")) update(initial); };
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const h = () => resetRef.current();
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);   // once: a listener re-added mid-dispatch (another field's reset re-rendering the page) never runs

  const hl = (s) => {
    const q = text.trim();
    const i = q ? s.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return s;
    return <>{s.slice(0, i)}<b>{s.slice(i, i + q.length)}</b>{s.slice(i + q.length)}</>;
  };
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const shownError = errorProp || error || (forceState === "error" ? msg.max(maxTags || 6) : null);
  const hasLabel = label !== "" && label != null;
  const float = labelPlacement === "float";
  const up = !hasLabel || focused || tags.length > 0 || text.length > 0 || ["focus", "error", "open"].includes(forceState);
  const { onKeyDown: _k, onFocus: userFocus, onBlur: userBlur, "aria-describedby": userDesc, ...inputRest } = rest;

  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div className={"ts-field ts-tags" + (float ? " is-label-float" : " is-label-above") + (readOnly ? " is-ro" : "") + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || "none", "--fl-left": "14px", "--fl-top": "28px", "--fl-right": maxTags > 0 ? "44px" : "14px", ...style }}>
      {!float && hasLabel && <FieldLabel placement="above" htmlFor={inputId} required={required}>{label}</FieldLabel>}
      <div ref={wrap} className="ts-tags__wrap">
        <div className={"ts-box" + (shownError ? " is-error" : "") + (isDisabled ? " is-disabled" : "")} data-force={box} onMouseDown={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); input.current?.focus(); } }}>
          {float && hasLabel && <FieldLabel placement="float" htmlFor={inputId} up={up} required={required}>{label}</FieldLabel>}
          <LayoutGroup>
            <AnimatePresence initial={false} mode="popLayout">
              {tags.map((t, i) => {
                const isSel = sel && i === tags.length - 1;
                const isDupe = dupe?.tag === t;
                return (
                  <motion.span
                    key={t + (isDupe ? dupe.n : "")}
                    layout={!reduce}
                    className={"ts-tags__chip" + (isSel ? " is-sel" : "") + (isDupe ? " is-dupe" : "")}
                    initial={isDupe && !reduce ? { x: 0 } : reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                    animate={isDupe && !reduce ? { opacity: 1, scale: [1, 1.08, 1], x: [0, -5, 5, -3, 0] } : { opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: 0.14 } }}
                    transition={{ type: "spring", stiffness: 600, damping: 32, x: { duration: 0.36 }, scale: isDupe ? { duration: 0.36 } : undefined }}
                    onAnimationComplete={() => isDupe && setTimeout(() => setDupe((d) => (d?.tag === t ? null : d)), 600)}
                  >
                    <span>{t}</span>
                    {!readOnly && (
                      <button type="button" className="ts-tags__x" aria-label={msg.remove(t)} disabled={isDisabled} onClick={() => remove(t)}>
                        <Icon name="x" size={13} stroke={2.2} />
                      </button>
                    )}
                  </motion.span>
                );
              })}
            </AnimatePresence>
            <motion.input
              {...inputRest}
              layout={!reduce ? "position" : false}
              ref={(el) => { input.current = el; setRef(ref, el); }}
              id={inputId}
              className="ts-input"
              value={text}
              disabled={isDisabled}
              readOnly={readOnly}
              autoFocus={autoFocus}
              required={required && tags.length === 0}
              placeholder={full || readOnly || (float && !up) ? "" : tags.length ? "" : placeholder}
              aria-describedby={[uid + "msg", userDesc].filter(Boolean).join(" ")}
              aria-invalid={!!shownError || undefined}
              role="combobox"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? uid + "menu" : undefined}
              aria-autocomplete="list"
              aria-activedescendant={menuOpen && nav && matches[active] ? `${uid}o${active}` : undefined}
              autoComplete={autoComplete}
              onChange={(e) => { setText(e.target.value.replace(/,/g, "")); setNote(""); setActive(0); setNav(false); setSel(false); setError(null); setHush(false); }}
              onKeyDown={onKey}
              onFocus={(e) => { setFocused(true); setHush(false); userFocus?.(e); }}
              onClick={(e) => { setHush(false); inputRest.onClick?.(e); }}
              onBlur={(e) => { setFocused(false); setSel(false); if (text.trim() && !locked) add(text); userBlur?.(e); }}
              onPaste={(e) => {
                if (locked) return;
                const parts = e.clipboardData.getData("text").split(/[,\n]/).map(norm).filter(Boolean);
                if (parts.length > 1) {
                  e.preventDefault();
                  const next = [...tags];
                  const added = [];
                  for (const p of parts) {
                    if (next.some((x) => x.toLowerCase() === p.toLowerCase()) || (maxTags && next.length >= maxTags)) continue;
                    if (!allowCustom && !suggestions.some((s) => s.toLowerCase() === p.toLowerCase())) continue;
                    if (validate?.(p, next)) continue;
                    next.push(p); added.push(p);
                  }
                  if (added.length) { update(next); added.forEach((p) => onAdd?.(p)); }
                }
              }}
            />
          </LayoutGroup>
          {maxTags > 0 && <span className="ts-tags__count" aria-hidden>{tags.length}/{maxTags}</span>}
        </div>
        <AnimatePresence>
          {menuOpen && (
            <Layer key="list" portal={portal} anchor={wrap} z={20}>
            <motion.ul
              ref={list}
              id={uid + "menu"}
              role="listbox"
              aria-label={msg.suggestions(label)}
              className="ts-tags__menu"
              onMouseDown={(e) => e.preventDefault()}   // a press anywhere in the list keeps focus (and the list) in the box
              style={pos ? { left: pos.x, top: pos.y, width: pos.aw, maxHeight: Math.min(220, pos.maxHeight) } : { left: -9999, top: 0, width: wrap.current?.offsetWidth, visibility: "hidden" }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.16 }}
            >
              {matches.map((s, i) => (
                <li key={s} id={`${uid}o${i}`} role="option" aria-selected={nav && i === active} className="ts-tags__opt"
                  onMouseDown={(e) => { e.preventDefault(); add(s); }} onMouseMove={() => { setNav(true); setActive(i); }}>
                  <Icon name="plus" size={14} />
                  <span>{hl(s)}</span>
                </li>
              ))}
            </motion.ul>
            </Layer>
          )}
        </AnimatePresence>
      </div>
      {name && tags.map((t) => <input key={t} type="hidden" name={name} value={t} disabled={isDisabled} />)}
      <FieldMessage id={uid + "msg"} hint={sel ? msg.armed : readOnly && hint === DEFAULT_HINT ? "" : hint} error={shownError} />
      <span className="ts-sr" aria-live="polite">{note || msg.summary(tags)}</span>
    </div></>
  );
});
