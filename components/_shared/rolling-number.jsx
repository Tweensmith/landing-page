"use client";
// RollingNumber: each digit is a 0–9 reel moved by a spring. Columns are keyed from the
// right, so a new leading digit slides in instead of the whole number re-rendering.
import { motion, AnimatePresence } from "motion/react";
import { useReducedMotion } from "./theme.jsx";

export function RollingNumber({ value, stiffness = 260, damping = 24, format = (n) => String(n), style }) {
  const reduce = useReducedMotion();
  const chars = format(value).split("");
  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness, damping };
  return (
    <span aria-label={format(value)} style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums", lineHeight: 1, ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        {chars.map((ch, i) => {
          const key = chars.length - i;
          if (!/\d/.test(ch))
            return <motion.span key={"s" + key} layout aria-hidden style={{ display: "inline-block" }}>{ch}</motion.span>;
          return (
            <motion.span key={key} layout aria-hidden initial={{ opacity: 0, y: "-0.6em" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "0.6em" }} transition={spring}
              style={{ display: "inline-block", height: "1em", overflow: "hidden" }}>
              <motion.span animate={{ y: `${-Number(ch)}em` }} transition={spring} style={{ display: "block" }}>
                {Array.from({ length: 10 }, (_, n) => <span key={n} style={{ display: "block", height: "1em" }}>{n}</span>)}
              </motion.span>
            </motion.span>
          );
        })}
      </AnimatePresence>
    </span>
  );
}
