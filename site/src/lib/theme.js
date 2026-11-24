import { useCallback, useEffect, useState } from "react";
import { themeVars } from "../../../components/_shared/themes.js";

// The page wears the brand: the kit's `porcelain` preset (brand/system: colours and radii; the raised material is switched off for the page in App.jsx),
// applied by <Theme preset="porcelain"> in App.jsx. These are the few tokens the page adds on top of it, each one
// made from a brand colour:
//   --site-rest   the brand's green (the switch-on colour, and the ball in the logo): a thing that is at rest
//   --site-ghost  the stroke of an in-between frame
//   --site-well   a recessed area inside a card
//   --site-glow   the pool of light behind the hero's sentence
//   --site-dot    the lines of the hero's field (the named springs at this strength, the others fainter)
export const SITE_PRESET = "porcelain";
const TOKENS = {
  light: { "--site-rest": "#22c55e", "--site-rest-ink": "#0e783c", "--site-ghost": "rgba(26,26,28,.34)", "--site-well": "#f1f1f3", "--site-edge": "inset 0 1px 0 rgba(255,255,255,.9)", "--site-glow": "rgba(255,255,255,.85)", "--site-dot": "rgba(26,26,28,.3)" },
  dark: { "--site-rest": "#22c55e", "--site-rest-ink": "#3dd68c", "--site-ghost": "rgba(245,245,247,.38)", "--site-well": "#1d1d1f", "--site-edge": "inset 0 1px 0 rgba(255,255,255,.07)", "--site-glow": "rgba(255,255,255,.075)", "--site-dot": "rgba(245,245,247,.26)" },
};
export const siteTokens = (mode) => TOKENS[mode];
export const siteVars = (mode) => ({ ...themeVars(SITE_PRESET, mode), ...TOKENS[mode] });

const KEY = "ts-site-mode";
const systemMode = () => (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

/** "light" | "dark", following the system until the visitor picks one; the choice is remembered. */
export function useSiteMode() {
  const [pref, setPref] = useState(() => {
    try { const s = localStorage.getItem(KEY); if (s === "light" || s === "dark") return s; } catch {}
    return "system";
  });
  const [sys, setSys] = useState(systemMode);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: light)");
    const on = () => setSys(mq.matches ? "light" : "dark");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const mode = pref === "system" ? sys : pref;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mode = mode;
    const v = siteVars(mode);
    root.style.background = v["--ts-bg"];
    root.style.colorScheme = mode;
  }, [mode]);
  const choose = useCallback((p) => {
    setPref(p);
    try { p === "system" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, p); } catch {}
  }, []);
  return { mode, pref, choose };
}
