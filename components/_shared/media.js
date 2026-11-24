"use client";
// Width / input media queries shared by components that re-compose on phones.
// PHONE: narrow screens. TOUCH: narrow screens or a coarse pointer (thumb-sized targets, no hover).
import { useEffect, useState } from "react";

export const PHONE = "(max-width: 640px)";
export const TOUCH = "(max-width: 640px), (pointer: coarse)";

/** True while the media query matches; updates live. */
export function useMedia(query) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
