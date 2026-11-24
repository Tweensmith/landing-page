"use client";
// Shared form-field shell: label, input box, hint / error / success message, ids wired for a11y.
import { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "./theme.jsx";
import { Icon } from "./icons.jsx";

export const FIELD_CSS = `
.ts-field{display:flex;flex-direction:column;gap:7px;font-family:var(--ts-font);width:100%}
.ts-field__label{font-size:13px;font-weight:550;color:var(--ts-ink);letter-spacing:-0.005em}
.ts-field__label .req{color:var(--ts-ink2);font-weight:400;margin-left:4px}
.ts-box{position:relative;display:flex;align-items:center;gap:10px;min-height:48px;padding:0 14px;border-radius:var(--ts-radius-md);
  background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .18s,background-color .18s;color:var(--ts-ink)}
.ts-box:hover,.ts-box[data-force=hover]{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 22%,transparent)}
.ts-box:focus-within,.ts-box[data-force=focus]{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 16%,transparent)}
.ts-box.is-error{box-shadow:inset 0 0 0 1.5px var(--ts-danger),0 0 0 4px color-mix(in srgb,var(--ts-danger) 14%,transparent)}
.ts-box.is-success{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-success) 60%,transparent)}
.ts-box.is-disabled{opacity:.5;pointer-events:none}
.ts-box > svg{color:var(--ts-ink2)}
.ts-input{all:unset;flex:1;min-width:0;font-size:15px;color:var(--ts-ink);line-height:1.3}
.ts-input::placeholder{color:color-mix(in srgb,var(--ts-ink2) 75%,transparent)}
.ts-input:focus-visible{outline:none}
.ts-msg{display:flex;align-items:center;gap:6px;font-size:12.5px;min-height:18px;color:var(--ts-ink2)}
.ts-msg.is-error{color:var(--ts-danger)}
.ts-msg.is-success{color:var(--ts-success)}
.ts-iconbtn{all:unset;display:grid;place-items:center;width:30px;height:30px;margin-right:-6px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);cursor:pointer}
.ts-iconbtn:hover{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-iconbtn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
`;
registerStyles("ts-field", FIELD_CSS);

export const useFieldStyles = () => useStyles("ts-field", FIELD_CSS);

/* One label style for the whole field family (Text Field, Password Field, Textarea, Tag Input).
   Every field takes `labelPlacement`:
   - "above": the static .ts-field__label over the box (13px / 550 / ink, 7px gap), box 48px (52px on phones and touch).
   - "float": the label sits inside a 56px box at the first line and floats up (scaled to .78) on focus or once
     there is a value; it turns the focus colour while the box has focus and the danger colour on error.
   Both keep the message line (hint / error / success) under the box. Each field adds `is-label-above` or
   `is-label-float` to its .ts-field root; the float label is a .ts-flabel inside the .ts-box, and the box sets
   --fl-left (where the text starts: 14px, or 44px after an 18px icon), --fl-right (room kept on the right) and
   --fl-top (the label's resting centre: 50% for one-line boxes, 28px for boxes that grow). */
export const LABEL_CSS = `
.ts-flabel{position:absolute;left:var(--fl-left,14px);top:var(--fl-top,50%);transform:translateY(-50%);transform-origin:left center;pointer-events:none;
  color:var(--ts-ink2);font-size:15px;white-space:nowrap;max-width:calc(100% - var(--fl-left,14px) - var(--fl-right,14px));overflow:hidden;text-overflow:ellipsis;
  transition:transform .22s cubic-bezier(.2,.8,.2,1),color .18s}
.ts-flabel.is-up{transform:translateY(-118%) scale(.78)}
.ts-box:focus-within .ts-flabel{color:var(--ts-focus)}
.ts-box.is-error .ts-flabel{color:var(--ts-danger)}
.ts-field.is-label-float .ts-box,.ts-field.is-label-above .ts-box{box-sizing:border-box}
.ts-field.is-label-float .ts-box{min-height:56px;cursor:text}
.ts-field.is-label-float .ts-input{padding-top:16px}
.ts-field.is-label-above .ts-box{min-height:48px}
@media (prefers-reduced-motion:reduce){.ts-flabel{transition:none}}
@media (max-width:640px),(pointer:coarse){.ts-flabel{font-size:16px}}
@media (max-width:640px),(pointer:coarse){.ts-field.is-label-above .ts-box{min-height:52px}}
`;
registerStyles("ts-field-label", LABEL_CSS);

export const useLabelStyles = () => useStyles("ts-field-label", LABEL_CSS);

/** The two placements every field in the family accepts. */
export const LABEL_PLACEMENTS = ["float", "above"];

/**
 * The visible label in either placement. "above" renders the .ts-field__label (place it before the box);
 * "float" renders a .ts-flabel (place it inside the box). `up` floats it. `required` adds the mark.
 */
export function FieldLabel({ placement = "above", htmlFor, id, up = false, required = false, as: Tag = "label", children }) {
  if (placement === "float") {
    return (
      <Tag htmlFor={Tag === "label" ? htmlFor : undefined} id={id} className={"ts-flabel" + (up ? " is-up" : "")}>
        {children}{required && <span aria-hidden> *</span>}
      </Tag>
    );
  }
  return (
    <Tag htmlFor={Tag === "label" ? htmlFor : undefined} id={id} className="ts-field__label">
      {children}{required && <span className="req" aria-hidden>*</span>}
    </Tag>
  );
}

/**
 * The "person just submitted again" signal, shared by the family. A form bumps `revealErrors` (0 → 1 → 2…) on every
 * submit; this calls `onReveal` once per change to a non-zero value (a field mounted with a non-zero count reveals
 * at once), so a field can mark itself touched and shake even when its error message is the same as last time.
 */
export function useRevealErrors(revealErrors, onReveal) {
  const last = useRef(0);
  const cb = useRef(onReveal);
  cb.current = onReveal;
  useEffect(() => {
    if (last.current === revealErrors) return;
    last.current = revealErrors;
    if (revealErrors) cb.current();
  }, [revealErrors]);
}

/** Ids for label / input / message, so every field wires aria-describedby the same way. */
export function useFieldIds() {
  const id = useId();
  return { input: id + "in", label: id + "lb", msg: id + "msg" };
}

/** A horizontal shake for errors; a no-op under reduced motion. */
export function useShake() {
  const reduce = useReducedMotion();
  return reduce ? {} : { x: [0, -7, 6, -4, 3, 0], transition: { duration: 0.4, ease: "easeOut" } };
}

/** Hint / error / success line that swaps with a short vertical slide. */
export function FieldMessage({ id, hint, error, success }) {
  const reduce = useReducedMotion();
  const kind = error ? "error" : success ? "success" : "hint";
  const text = error || success || hint || "";
  return (
    <div id={id} className={"ts-msg" + (kind !== "hint" ? " is-" + kind : "")} aria-live={kind === "error" ? "assertive" : "polite"}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={kind + text} initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          {kind === "error" && <Icon name="alert" size={14} />}
          {kind === "success" && <Icon name="check" size={14} stroke={2.2} />}
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
