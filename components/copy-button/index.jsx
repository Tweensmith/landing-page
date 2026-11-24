"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-copy{display:inline-flex;align-items:center;gap:4px;padding:4px 4px 4px 14px;font-family:var(--ts-font);max-width:100%;
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 2px);box-shadow:0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-copy__value{min-width:0;font-family:var(--ts-font-mono);font-size:13px;color:var(--ts-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;user-select:all;padding-right:6px}
.ts-copy__value[data-prompt]::before{content:attr(data-prompt);color:var(--ts-ink2);margin-right:8px}
.ts-copy__btn{all:unset;box-sizing:border-box;position:relative;display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 11px;
  border-radius:var(--ts-radius-sm);font-size:12.5px;font-weight:550;color:var(--ts-ink2);cursor:pointer;transition:background-color .15s,color .15s;overflow:hidden}
.ts-copy__btn:hover,.ts-copy__btn[data-force=hover]{background:var(--ts-surface2);color:var(--ts-ink)}
.ts-copy__btn:focus-visible,.ts-copy__btn[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-copy__btn.is-success{color:var(--ts-success)}
.ts-copy__btn.is-error{color:var(--ts-danger)}
.ts-copy__btn:disabled,.ts-copy__btn[aria-disabled=true]{opacity:.42;cursor:not-allowed}
.ts-copy__btn:disabled:hover{background:none;color:var(--ts-ink2)}
.ts-copy.is-compact{padding:0;background:none;box-shadow:none}
@media (max-width:640px),(pointer:coarse){.ts-copy__btn{height:44px;padding:0 14px;font-size:13.5px}.ts-copy__value{font-size:13.5px}}
`;
registerStyles("ts-copy", CSS);

const DEMO = { value: "npm i @tweensmith/ui", prompt: "$" };
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");

// the async Clipboard API, then the old execCommand path (works on http:// and in some embedded webviews)
async function writeClipboard(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    return null;
  } catch (err) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      const active = document.activeElement;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand && document.execCommand("copy");
      ta.remove();
      active?.focus?.({ preventScroll: true });
      return ok ? null : err;
    } catch {
      return err;
    }
  }
}

/**
 * CopyButton — a value (install command, API key, link) with a copy action.
 * The icon morphs to a check and the label to "Copied"; if the clipboard is
 * blocked it selects the text and says "Press ⌘C" (Ctrl+C off Apple devices) instead of failing silently,
 * and calls `onError`. `value` is what is shown; `text` is what is copied when it should differ (a masked key).
 * The ref goes to the copy <button>.
 */
export const CopyButton = forwardRef(function CopyButton({
  value = "",
  text,
  prompt = "",
  showValue = true,
  showLabel = true,
  label = "Copy",
  copiedLabel = "Copied",
  errorLabel,
  resetAfter = 1600,
  disabled = false,
  demo = false,
  onCopy,
  onError,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-copy", CSS);
  const reduce = useReducedMotion();
  const [status, setStatus] = useState("idle");
  const valueRef = useRef(null);
  const timer = useRef(null);
  const pending = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  const shown = value !== "" && value != null ? String(value) : demo ? DEMO.value : "";
  const toCopy = text != null && text !== "" ? String(text) : shown;
  const shownPrompt = prompt || (demo && !value ? DEMO.prompt : "");
  const isDisabled = disabled || forceState === "disabled" || !toCopy;
  const state = forceState === "success" ? "success" : forceState === "error" ? "error" : status;
  const force = forceState && ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const canSelect = showValue && toCopy === shown; // on failure the visible value is selected for a manual copy
  const failLabel = errorLabel ?? (canSelect ? (isMac() ? "Press ⌘C" : "Press Ctrl+C") : "Copy failed");

  const copy = async () => {
    if (isDisabled || pending.current) return;
    pending.current = true;
    clearTimeout(timer.current);
    const err = await writeClipboard(toCopy);
    pending.current = false;
    if (!err) {
      setStatus("success");
      onCopy?.(toCopy);
    } else {
      setStatus("error");
      // select the visible value so the person can copy it by hand
      const sel = window.getSelection();
      if (canSelect && valueRef.current && sel) { const r = document.createRange(); r.selectNodeContents(valueRef.current); sel.removeAllRanges(); sel.addRange(r); }
      onError?.(err, toCopy);
    }
    timer.current = setTimeout(() => setStatus("idle"), !err ? resetAfter : resetAfter * 2);
  };

  const btnLabel = state === "success" ? copiedLabel : state === "error" ? failLabel : label;
  const icon = state === "success" ? "check" : state === "error" ? "x" : "copy";
  const swap = reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 10, filter: "blur(3px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -10, filter: "blur(3px)" } };

  return (
    <>{sheetTag}<div className={"ts-copy" + (showValue ? "" : " is-compact") + (className ? " " + className : "")} style={style}>
      {showValue && shown && <code ref={valueRef} className="ts-copy__value" data-prompt={shownPrompt || undefined}>{shown}</code>}
      <motion.button
        ref={ref}
        type="button"
        className={`ts-copy__btn${state === "success" ? " is-success" : state === "error" ? " is-error" : ""}`}
        data-force={force}
        aria-label={showLabel ? undefined : `${label}${shown ? " " + shown : ""}`}
        disabled={isDisabled}
        onClick={copy}
        whileTap={reduce || isDisabled ? undefined : { scale: 0.92 }}
        {...rest}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={state} {...swap} transition={{ type: "spring", stiffness: 500, damping: 32 }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name={icon} size={15} stroke={2} />
            {showLabel && btnLabel}
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <span className="ts-sr" aria-live="polite">{state === "success" ? "Copied to clipboard" : state === "error" ? (canSelect ? `Copy failed. Text selected, press ${isMac() ? "Command" : "Control"} C.` : "Copy failed.") : ""}</span>
    </div></>
  );
});
