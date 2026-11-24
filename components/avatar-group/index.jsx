"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent, useSpring, useTransform, animate } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useLocale, useReducedMotion } from "../_shared/theme.jsx";
import { useMedia, PHONE, TOUCH } from "../_shared/media.js";
import { useWidth } from "../_shared/page.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Art } from "../_shared/art.jsx";
import { seriesColor } from "../_shared/chart.jsx";
import { useFloating, useDismiss, useFocusTrap, useScrollLock, originFor } from "../_shared/overlay.jsx";

const CSS = `
.ts-ag{position:relative;width:min(880px,100%);font-family:var(--ts-font);color:var(--ts-ink);background:var(--ts-surface);border-radius:var(--ts-radius-lg);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-ag-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;grid-template-areas:"icon titles presence share";align-items:center;gap:10px 14px;padding:12px 14px 12px 16px;border-bottom:1px solid var(--ts-line)}
.ts-ag-doci{grid-area:icon;display:grid;place-items:center;width:34px;height:34px;border-radius:var(--ts-radius-sm);background:var(--ts-surface2);color:var(--ts-ink2)}
.ts-ag-titles{grid-area:titles;min-width:0}
.ts-ag-crumb{margin:0;font-size:12px;color:var(--ts-ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-ag-crumb i{font-style:normal;margin:0 5px}
.ts-ag-title{margin:2px 0 0;font-size:15px;font-weight:620;letter-spacing:-0.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-ag-presence{grid-area:presence;display:flex;align-items:center;justify-content:flex-end;gap:14px;min-width:0}
.ts-ag-tick{display:grid;justify-items:end;font-size:12.5px;color:var(--ts-ink2);white-space:nowrap;transition:opacity .2s}
.ts-ag-tick>span{grid-area:1/1;display:inline-flex;align-items:center;gap:6px;line-height:1}
.ts-ag-tick b{font-weight:600;color:var(--ts-ink)}
.ts-ag-share{all:unset;box-sizing:border-box;grid-area:share;position:relative;display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px 0 12px;border-radius:var(--ts-radius-md);font-size:13.5px;font-weight:620;cursor:pointer;color:var(--ts-accent-ink);background:var(--ts-accent);-webkit-tap-highlight-color:transparent}
.ts-ag-share:hover{filter:brightness(1.06)}
.ts-ag-share:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

/* the stack */
.ts-ag-group{position:relative;flex:none;height:var(--ag-s);touch-action:pan-y;-webkit-tap-highlight-color:transparent}
.ts-ag-slot{position:absolute;left:0;top:0;width:var(--ag-s);height:var(--ag-s)}
.ts-ag-lift,.ts-ag-pres{position:absolute;inset:0}
.ts-ag-av{all:unset;box-sizing:border-box;position:absolute;inset:0;border-radius:50%;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-ag-av::before{content:"";position:absolute;inset:var(--ag-slop);border-radius:50%}
.ts-ag-face{position:absolute;inset:0;display:grid;place-items:center;border-radius:50%;overflow:hidden;font-size:var(--ag-fs);font-weight:650;letter-spacing:-0.01em;line-height:1;color:var(--ts-ink);
  background:color-mix(in srgb,var(--ag-id) 26%,var(--ts-surface));box-shadow:0 0 0 2px var(--ts-surface)}
.ts-ag-face::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 10%,transparent);pointer-events:none}
.ts-ag-face[data-ini=true]::after{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ag-id) 45%,transparent)}
.ts-ag-av:focus-visible .ts-ag-face,.ts-ag-chip:focus-visible{box-shadow:0 0 0 2px var(--ts-surface),0 0 0 4px var(--ts-focus)}
.ts-ag-av:focus-visible{outline:none}
.ts-ag-dot{position:absolute;right:-1px;bottom:-1px;width:var(--ag-d);height:var(--ag-d);border-radius:50%;overflow:hidden;background:var(--ts-success);box-shadow:0 0 0 2px var(--ts-surface);pointer-events:none}
.ts-ag[data-order=last-on-top] .ts-ag-group .ts-ag-dot{right:auto;left:-1px}
.ts-ag-dot[data-p=idle]{background:var(--ts-warning)}
.ts-ag-dot[data-p=idle]::after{content:"";position:absolute;width:68%;height:68%;left:-10%;top:-10%;border-radius:50%;background:var(--ts-surface)}
.ts-ag-dot[data-p=offline]{background:var(--ts-surface);box-shadow:0 0 0 2px var(--ts-surface),inset 0 0 0 1.5px var(--ts-ink3)}
.ts-ag-pulse{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--ts-success);pointer-events:none}
.ts-ag-fring{position:absolute;left:-5px;top:-5px;width:calc(100% + 10px);height:calc(100% + 10px);overflow:visible;pointer-events:none;animation:ts-ag-spin 9s linear infinite}
.ts-ag-fring circle{fill:none;stroke:var(--ag-id);stroke-width:2.2;stroke-dasharray:7 3.5;stroke-linecap:round}
@keyframes ts-ag-spin{to{transform:rotate(360deg)}}
.ts-ag-chip{all:unset;box-sizing:border-box;position:absolute;inset:0;display:grid;place-items:center;border-radius:99px;cursor:pointer;font-size:calc(var(--ag-fs) - 1px);font-weight:650;color:var(--ts-ink);
  background:var(--ts-surface2);box-shadow:0 0 0 2px var(--ts-surface);-webkit-tap-highlight-color:transparent;transition:background-color .2s}
.ts-ag-chip::before{content:"";position:absolute;inset:var(--ag-slop);border-radius:99px}
.ts-ag-chip:hover,.ts-ag-chip[aria-expanded=true]{background:color-mix(in srgb,var(--ts-ink) 14%,var(--ts-surface2))}
/* on touch the overlapped faces are too close for a thumb: the whole stack is one target that opens the people list */
/* the faces' stacking order stays inside the stack: nothing here paints over a menu or a sheet above the page */
.ts-ag-stack{position:relative;flex:none;isolation:isolate}
.ts-ag-all{all:unset;box-sizing:border-box;position:absolute;left:-4px;right:-4px;top:var(--ag-slop);bottom:var(--ag-slop);z-index:400;border-radius:99px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-ag-all:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

/* tooltip that follows the nearest avatar */
.ts-ag-tip{position:absolute;left:0;top:0;z-index:60;pointer-events:none;padding:7px 11px 8px;border-radius:var(--ts-radius-md);white-space:nowrap;
  background:color-mix(in srgb,var(--ts-surface) 94%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 0 0 1px var(--ts-line),0 14px 30px -14px color-mix(in srgb,var(--ts-bg) 50%,var(--ts-black) 50%)}
.ts-ag-tip__name{display:block;font-size:13px;font-weight:620}
.ts-ag-tip__row{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12px;color:var(--ts-ink2)}
.ts-ag-tip__row .ts-ag-sdot{position:relative}
.ts-ag-sdot{position:relative;flex:none;width:8px;height:8px;border-radius:50%;overflow:hidden;background:var(--ts-success)}
.ts-ag-sdot[data-p=idle]{background:var(--ts-warning)}
.ts-ag-sdot[data-p=idle]::after{content:"";position:absolute;width:68%;height:68%;left:-10%;top:-10%;border-radius:50%;background:var(--ts-surface)}
.ts-ag-sdot[data-p=offline]{background:transparent;box-shadow:inset 0 0 0 1.5px var(--ts-ink3)}
.ts-ag-sdot[data-p=follow]{background:var(--ag-id)}

/* the document the people are in */
.ts-ag-canvas{position:relative;margin:12px;padding:26px 20px 34px;border-radius:var(--ts-radius-md);background:var(--ts-bg);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .3s}
.ts-ag-canvas[data-f=true]{box-shadow:inset 0 0 0 2px var(--ag-f)}
.ts-ag-fbar{position:absolute;bottom:-1px;left:50%;z-index:5;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 4px 0 11px;border-radius:var(--ts-radius-md) var(--ts-radius-md) 0 0;font-size:12.5px;white-space:nowrap;
  color:var(--ts-ink);background:color-mix(in srgb,var(--ag-f) 20%,var(--ts-surface));box-shadow:inset 0 0 0 2px var(--ag-f)}
.ts-ag-fbar b{font-weight:640}
.ts-ag-fbar .ts-ag-sdot{background:var(--ag-f)}
.ts-ag-fstop{all:unset;position:relative;box-sizing:border-box;height:22px;padding:0 9px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer;background:var(--ts-surface);color:var(--ts-ink)}
.ts-ag-fstop::before{content:"";position:absolute;inset:-11px -6px}
.ts-ag-fstop:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-ag-page{max-width:600px;margin:0 auto;padding:26px 30px 24px;border-radius:var(--ts-radius-sm);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line),0 10px 30px -18px color-mix(in srgb,var(--ts-bg) 40%,var(--ts-black) 60%)}
.ts-ag-eyebrow{margin:0 0 10px;font-family:var(--ts-font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-ag-blk{position:relative;margin:0 -10px;padding:6px 10px;border-radius:var(--ts-radius-sm);transition:background-color .3s,box-shadow .3s}
.ts-ag-blk[data-hl=true]{background:color-mix(in srgb,var(--ag-f) 11%,transparent);box-shadow:inset 2px 0 0 var(--ag-f)}
.ts-ag-h{margin:0;font-size:21px;font-weight:650;letter-spacing:-0.02em;line-height:1.25}
.ts-ag-p{margin:0;font-size:13.5px;line-height:1.6;color:var(--ts-ink2)}
.ts-ag-p strong{color:var(--ts-ink);font-weight:600}
.ts-ag-dates{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0}
.ts-ag-dates div{padding-top:8px;border-top:1px solid var(--ts-line)}
.ts-ag-dates dt{font-size:12px;color:var(--ts-ink3)}
.ts-ag-dates dd{margin:2px 0 0;font-size:13.5px;font-weight:600;font-variant-numeric:tabular-nums}
.ts-ag-cur{position:absolute;z-index:3;display:flex;align-items:flex-start;pointer-events:none}
.ts-ag-cur svg{flex:none;overflow:visible}
.ts-ag-cur__tag{margin:12px 0 0 -2px;padding:2px 7px 3px;border-radius:99px;font-size:11px;font-weight:600;line-height:1.3;white-space:nowrap;color:var(--ts-ink);
  background:color-mix(in srgb,var(--ag-id) 24%,var(--ts-surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ag-id) 60%,transparent)}

/* people list: anchored popover on desktop, bottom sheet on phones */
.ts-ag-pop{position:fixed;z-index:130;width:344px;max-width:calc(100vw - 16px);display:flex;flex-direction:column;font-family:var(--ts-font);color:var(--ts-ink);outline:none;
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 4px);box-shadow:0 0 0 1px var(--ts-line),0 24px 56px -16px color-mix(in srgb,var(--ts-bg) 60%,var(--ts-black) 40%);overflow:hidden}
.ts-ag-scrim{position:fixed;inset:0;z-index:130;background:color-mix(in srgb,var(--ts-bg) 62%,transparent)}
.ts-ag-sheet{position:fixed;left:8px;right:8px;z-index:131;max-height:min(80dvh,640px);display:flex;flex-direction:column;font-family:var(--ts-font);color:var(--ts-ink);outline:none;
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-lg) + 4px);box-shadow:0 0 0 1px var(--ts-line),0 -20px 50px -20px color-mix(in srgb,var(--ts-bg) 60%,var(--ts-black) 40%);padding-bottom:env(safe-area-inset-bottom);overflow:hidden}
.ts-ag-grab{align-self:center;width:36px;height:4px;margin-top:8px;border-radius:99px;background:color-mix(in srgb,var(--ts-ink) 18%,transparent)}
.ts-ag-lh{display:flex;align-items:flex-start;gap:10px;padding:14px 16px 10px}
.ts-ag-lh>div{flex:1;min-width:0}
.ts-ag-lt{margin:0;font-size:15px;font-weight:640;letter-spacing:-0.01em;outline:none}
.ts-ag-ls{margin:2px 0 0;font-size:12.5px;color:var(--ts-ink2);display:flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums}
.ts-ag-x{all:unset;box-sizing:border-box;display:grid;place-items:center;width:44px;height:44px;margin:-8px -8px 0 0;border-radius:99px;cursor:pointer;color:var(--ts-ink2)}
.ts-ag-x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:-4px}
.ts-ag-search{display:flex;align-items:center;gap:8px;height:38px;margin:0 12px 6px;padding:0 12px;border-radius:var(--ts-radius-sm);background:var(--ts-surface2);color:var(--ts-ink3);box-shadow:inset 0 0 0 1px transparent;transition:box-shadow .15s}
.ts-ag-search:focus-within{box-shadow:inset 0 0 0 1.5px var(--ts-focus)}
.ts-ag-search input{all:unset;flex:1;align-self:stretch;min-width:0;font-size:13.5px;color:var(--ts-ink)}
.ts-ag-search input::placeholder{color:var(--ts-ink3)}
.ts-ag-scroll{position:relative;flex:1 1 auto;min-height:0;max-height:356px;overflow-y:auto;overscroll-behavior:contain;padding:0 0 8px}
.ts-ag-gh{display:flex;justify-content:space-between;padding:12px 16px 5px;font-family:var(--ts-font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-ag-row{position:relative;display:flex;align-items:center;gap:11px;min-height:48px;margin:0 6px;padding:6px 10px;border-radius:var(--ts-radius-sm);cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-ag-row[aria-selected=true]{background:var(--ts-surface2)}
.ts-ag-row[aria-disabled=true]{cursor:default}
.ts-ag-row[aria-disabled=true] .ts-ag-face{filter:grayscale(.85);opacity:.6}
.ts-ag-rface{position:relative;flex:none;width:32px;height:32px;--ag-fs:12px;--ag-d:9px}
.ts-ag-rtxt{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.ts-ag-rname{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-ag-rname mark{background:none;color:inherit;text-decoration:underline;text-decoration-color:var(--ts-accent);text-decoration-thickness:2px;text-underline-offset:2px}
.ts-ag-rsub{font-size:12px;color:var(--ts-ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-ag-row[aria-disabled=true] .ts-ag-rname{color:var(--ts-ink2)}
.ts-ag-rtag{flex:none;display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border-radius:99px;font-size:12px;font-weight:600;color:var(--ts-ink2);opacity:0;transition:opacity .15s}
.ts-ag-row[aria-selected=true] .ts-ag-rtag{opacity:1}
.ts-ag-rtag[data-on=true]{opacity:1;color:var(--ts-ink);background:color-mix(in srgb,var(--ag-id) 20%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ag-id) 55%,transparent)}
.ts-ag-empty{margin:0;padding:22px 18px 26px;font-size:13px;line-height:1.5;color:var(--ts-ink2);text-align:center}
.ts-ag-empty b{color:var(--ts-ink);font-weight:600}
.ts-ag-lf{display:flex;align-items:center;gap:7px;padding:10px 16px 12px;border-top:1px solid var(--ts-line);font-size:12px;color:var(--ts-ink2)}

@media (max-width:640px){
  .ts-ag-bar{grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"icon titles share" "presence presence presence";padding:10px 12px 12px 14px;row-gap:12px}
  .ts-ag-presence{position:relative;justify-content:flex-start;gap:10px}
  .ts-ag-tick{position:absolute;right:0;top:50%;transform:translateY(-50%);pointer-events:none}
  .ts-ag[data-spread=true] .ts-ag-tick{opacity:0}
  .ts-ag-share{width:44px;height:44px;padding:0;justify-content:center}
  .ts-ag-canvas{margin:10px;padding:12px 10px 36px}
  .ts-ag-page{padding:20px 16px 18px}
  .ts-ag-h{font-size:18px}
  .ts-ag-dates{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:8px}
  .ts-ag-gh{font-size:11px}
  .ts-ag-eyebrow{font-size:11px}
}
@media (max-width:640px),(pointer:coarse){
  .ts-ag-search{height:44px;margin:0 12px 8px}
  .ts-ag-search input{font-size:16px}
  .ts-ag-row{min-height:56px}
  .ts-ag-tip__row{font-size:12.5px}
}
@media (prefers-reduced-motion:reduce){.ts-ag-fring{animation:none}}

/* caller mode: a plain stack of the caller's people */
.ts-agc{position:relative;display:inline-flex;align-items:center;vertical-align:middle;font-family:var(--ts-font);color:var(--ts-ink);--ag-ring:var(--ts-bg)}
.ts-agc .ts-ag-group{touch-action:auto}
/* at rest the stacking order stays inside the group; while a face shows its name the group lets go, so the name is over what follows */
.ts-agc .ts-ag-group:not([data-tip]){isolation:isolate}
.ts-agc .ts-ag-face,.ts-agc .ts-ag-chip{box-shadow:0 0 0 2px var(--ag-ring)}
.ts-agc .ts-ag-dot{box-shadow:0 0 0 2px var(--ag-ring)}
.ts-agc .ts-ag-av:focus-visible .ts-ag-face,.ts-agc .ts-ag-chip:focus-visible{box-shadow:0 0 0 2px var(--ag-ring),0 0 0 4px var(--ts-focus);outline:none}
.ts-agc .ts-ag-av{cursor:default}
.ts-agc a.ts-ag-av,.ts-agc button.ts-ag-av{cursor:pointer}
.ts-agc .ts-ag-av[aria-disabled=true],.ts-agc .ts-ag-av:disabled{cursor:default;opacity:.5}
.ts-agc .ts-ag-chip{cursor:default}
.ts-agc button.ts-ag-chip{cursor:pointer}
.ts-agc .ts-ag-chip:disabled{opacity:.5;cursor:default}
.ts-agc .ts-ag-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:50%}
.ts-agc .ts-ag-tip{left:50%;top:calc(100% + 8px);translate:-50% 0;max-width:min(280px,80vw);white-space:normal;width:max-content}
.ts-agc .ts-ag-tip__row{display:block}
@media (pointer:coarse){.ts-agc .ts-ag-av::before,.ts-agc .ts-ag-chip::before{inset:min(0px,calc((var(--ag-s) - 44px) / 2))}}
`;
registerStyles("ts-avatar-group", CSS);

/* ------------------------------------------------------------------ data
   Northwind's Trail Runner 3 launch brief, mid-afternoon. Twelve people are in the doc (eight active, four idle),
   four more have access but are away. Every person keeps one identity colour (their cursor colour) for good. */
const ROSTER = [
  { id: "maya", name: "Maya Chen", role: "Design lead", art: "night-bloom", hue: 0, presence: "active", sec: "hero", where: "Editing the hero copy", cx: 64, cy: 8 },
  { id: "tomas", name: "Tomás Reyes", role: "Product manager", hue: 1, presence: "active", sec: "pricing", where: "Commenting on pricing", cx: 36, cy: 30, idle: 2 },
  { id: "amara", name: "Amara Okafor", role: "Copywriter", art: "citrine", hue: 2, presence: "active", sec: "headline", where: "Editing the headline", cx: 72, cy: 2 },
  { id: "priya", name: "Priya Nair", role: "Brand designer", art: "orchid", hue: 3, presence: "active", sec: "hero", where: "Reviewing the hero", cx: 16, cy: 40 },
  { id: "jonas", name: "Jonas Weber", role: "Front-end engineer", hue: 4, presence: "idle", idle: 6, sec: "timeline", where: "Viewing the timeline", cx: 70, cy: 30 },
  { id: "daniel", name: "Daniel Kim", role: "Data analyst", art: "tidal", hue: 5, presence: "active", sec: "pricing", where: "Checking the forecast", cx: 78, cy: 4 },
  { id: "lea", name: "Léa Moreau", role: "Social lead", art: "glacier", hue: 6, presence: "active", sec: "timeline", where: "Editing launch dates", cx: 50, cy: 16 },
  { id: "marcus", name: "Marcus Hale", role: "Head of growth", hue: 7, presence: "idle", idle: 12, sec: "pricing", where: "Reading pricing", cx: 58, cy: 36 },
  { id: "hana", name: "Hana Sato", role: "Producer", hue: 0, presence: "active", sec: "timeline", where: "Viewing the timeline", cx: 18, cy: 34 },
  { id: "omar", name: "Omar Farouk", role: "Motion designer", art: "chrome", hue: 1, presence: "active", sec: "headline", where: "Suggesting a headline", cx: 28, cy: 30 },
  { id: "ruth", name: "Ruth Abebe", role: "Legal counsel", hue: 2, presence: "idle", idle: 3, sec: "pricing", where: "Reviewing the offer terms", cx: 20, cy: 6 },
  { id: "felix", name: "Felix Brandt", role: "Photographer", art: "ember-silk", hue: 3, presence: "idle", idle: 24, sec: "hero", where: "Adding shoot notes", cx: 42, cy: 44 },
  { id: "ines", name: "Inês Duarte", role: "Illustrator", art: "eclipse", hue: 4, presence: "offline", seen: "2 h ago", sec: "hero", where: "Viewing the hero", cx: 44, cy: 46 },
  { id: "kenji", name: "Kenji Watanabe", role: "Back-end engineer", hue: 5, presence: "offline", seen: "yesterday", sec: "timeline", where: "Viewing the timeline", cx: 84, cy: 34 },
  { id: "sofia", name: "Sofia Rossi", role: "Account director", hue: 6, presence: "offline", seen: "35 min ago", sec: "pricing", where: "Commenting on pricing", cx: 62, cy: 40 },
  { id: "noor", name: "Noor Haddad", role: "UX researcher", art: "tidal", seed: 5, hue: 7, presence: "offline", seen: "3 days ago", sec: "headline", where: "Reading the brief", cx: 52, cy: 22 },
];
const initialPeople = () => ROSTER.map((p, i) => ({ ...p, joinedAt: p.presence === "offline" ? 0 : 100 - i }));

// a scripted afternoon: joins, leaves and naps, looping. Invalid steps (already here, already gone) are skipped.
const SCRIPT = [
  ["join", "ines"], ["idle", "tomas"], ["leave", "felix"], ["join", "kenji"], ["active", "tomas"], ["leave", "jonas"],
  ["join", "sofia"], ["leave", "ines"], ["join", "felix"], ["leave", "kenji"], ["join", "jonas"], ["idle", "jonas"],
  ["leave", "sofia"], ["active", "marcus"], ["join", "noor"], ["leave", "noor"], ["idle", "marcus"],
];
const validStep = (people, [type, id]) => {
  const p = people.find((x) => x.id === id);
  if (!p) return false;
  return type === "join" ? p.presence === "offline" : type === "leave" ? p.presence !== "offline" : type === "idle" ? p.presence === "active" : p.presence === "idle";
};

const SIZES = { sm: { s: 28, fs: 11, d: 8, gap: 6 }, md: { s: 36, fs: 13, d: 10, gap: 8 }, lg: { s: 44, fs: 15, d: 12, gap: 8 } };
const SLIDE = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 };
const SPREAD = { type: "spring", stiffness: 340, damping: 30 };
const first = (n) => n.split(" ")[0];
const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
const status = (p) => (p.presence === "active" ? p.where : p.presence === "idle" ? `Idle ${p.idle} min` : `Last seen ${p.seen}`);
const presenceWord = (p) => (p.presence === "active" ? "active now" : p.presence === "idle" ? `idle for ${p.idle} minutes` : `offline, last seen ${p.seen}`);
const byJoin = (a, b) => b.joinedAt - a.joinedAt;
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const hashHue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 8; };
const listNames = (ps) => (ps.length <= 1 ? ps.map((p) => p.name).join("") : ps.slice(0, -1).map((p) => p.name).join(", ") + " and " + ps[ps.length - 1].name);
const PRESENCE_WORD = { active: "active", idle: "idle", offline: "offline" };

/**
 * AvatarGroup: an overlapping stack of the caller's people with a "+N" overflow chip.
 * Signature: hover or keyboard focus fans the stack apart on a spring, the face under the pointer lifts, and a name
 * tooltip appears; the chip's tooltip (and accessible name) lists everyone it hides. One person (or max 1) is a
 * single avatar, since the kit has no separate Avatar. Broken photos fall back to initials.
 * `demo` shows the gallery's live collaboration header (presence, follow mode, people list).
 */
export const AvatarGroup = forwardRef(function AvatarGroup({
  people,
  max = 5,
  size = "md",
  overlap = 30,
  stackOrder = "first-on-top",
  lift = 10,
  showPresence = true,
  label,
  onSelect,
  onOverflowClick,
  disabled = false,
  live = true,
  interval = 3000,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  if (demo && !people) return <AvatarDemo size={size} max={max} overlap={overlap} live={live} interval={interval} showPresence={showPresence} stackOrder={stackOrder} lift={lift} forceState={forceState} fwdRef={ref} className={className} style={style} rest={rest} />;
  return <PeopleStack fwdRef={ref} people={people ?? []} max={max} size={size} overlap={overlap} stackOrder={stackOrder} lift={lift} showPresence={showPresence} label={label}
    onSelect={onSelect} onOverflowClick={onOverflowClick} disabled={disabled} forceState={forceState} className={className} style={style} rest={rest} />;
});

function PersonFace({ p }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [p.src]);
  const ini = p.initials ?? initials(p.name || "?");
  const img = p.src && !broken;
  return (
    <span className="ts-ag-face" data-ini={!img} style={{ "--ag-id": p.color ?? seriesColor(hashHue(p.id ?? p.name)) }}>
      {img ? <img src={p.src} alt="" draggable={false} onError={() => setBroken(true)} /> : ini.toUpperCase()}
    </span>
  );
}

function PeopleStack({ fwdRef, people, max, size, overlap, stackOrder, lift, showPresence, label, onSelect, onOverflowClick, disabled, forceState, className, style, rest }) {
  const sheetTag = useStyles("ts-avatar-group", CSS);
  const reduce = useReducedMotion();
  const touch = useMedia(TOUCH);
  const Z = typeof size === "number" ? { s: size, fs: Math.round(size * 0.36), d: Math.max(6, Math.round(size * 0.27)), gap: Math.round(size * 0.2) } : SIZES[size] ?? SIZES.md;
  const S = Z.s;
  const list = people.filter(Boolean).map((p, i) => ({ ...p, key: p.id ?? p.name + "|" + i }));
  const cap = Math.max(1, Math.floor(Number(max) || 1));
  const shown = list.length > cap ? list.slice(0, cap) : list;
  const hidden = list.slice(shown.length);
  const extra = hidden.length;
  const n = shown.length + (extra > 0 ? 1 : 0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hot, setHot] = useState(null);
  // on a touch screen a stack you can tap stays fanned out, so every face is a full-size target
  const tappable = !disabled && (!!onSelect || !!onOverflowClick || list.some((p) => p.href || p.onClick));
  const on = n > 1 && (hover || focus || forceState === "hover" || (touch && tappable));
  const stackStep = Math.round(S * (1 - clamp(overlap, 0, 70) / 100) * 10) / 10;
  const spreadStep = touch ? Math.max(S + Z.gap, 50) : S + Z.gap;
  const step = on ? spreadStep : stackStep;
  const spring = reduce ? { duration: 0 } : SPREAD;
  const hiddenNames = listNames(hidden);
  const groupName = label ?? (list.length ? (extra ? `${shown.map((p) => p.name).join(", ")} and ${extra} more` : listNames(shown)) : undefined);
  const zFor = (i, key) => (key === hot ? 300 : stackOrder === "last-on-top" ? 10 + i : 100 - i);
  const tipFor = (key) => key === hot && (on || n === 1);
  const single = n === 1;
  // first-on-top puts the chip under its neighbour: keep "+N" centred in the part you can see
  const chipPad = stackOrder === "first-on-top" ? { paddingLeft: Math.max(0, S - step), transition: reduce ? "none" : "padding-left .25s" } : undefined;
  if (!list.length) return <>{sheetTag}<div ref={fwdRef} {...rest} className={"ts-agc" + (className ? " " + className : "")} style={style} /></>;

  const faceEl = (p, i) => {
    const pres = showPresence && p.presence ? p.presence : null;
    const name = p.name + (pres ? `, ${PRESENCE_WORD[pres] ?? pres}` : "");
    const act = !disabled && (p.href || p.onClick || onSelect);
    const click = (e) => { p.onClick?.(e, p); onSelect?.(p, i, e); };
    const inner = (
      <>
        <PersonFace p={p} />
        {pres && <span className="ts-ag-dot" data-p={pres} aria-hidden />}
      </>
    );
    const common = { className: "ts-ag-av", onFocus: () => setHot(p.key), onBlur: () => setHot((h) => (h === p.key ? null : h)) };
    if (p.href && !disabled) return <a {...common} href={p.href} target={p.target} rel={p.target === "_blank" ? "noopener noreferrer" : undefined} aria-label={p.alt ?? name} onClick={click}>{inner}</a>;
    if (act) return <button {...common} type="button" aria-label={p.alt ?? name} onClick={click}>{inner}</button>;
    return <span className="ts-ag-av" role="img" aria-label={p.alt ?? name} aria-disabled={disabled && (p.href || p.onClick || onSelect) ? true : undefined}>{inner}</span>;
  };

  const tip = (title, sub) => (
    <motion.span className="ts-ag-tip" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.14 }}>
      <span className="ts-ag-tip__name">{title}</span>
      {sub && <span className="ts-ag-tip__row">{sub}</span>}
    </motion.span>
  );

  return (
    <>{sheetTag}<div
      ref={fwdRef}
      {...rest}
      role={single ? undefined : "group"}
      aria-label={single ? undefined : groupName}
      className={"ts-agc" + (className ? " " + className : "")}
      data-order={stackOrder}
      style={{ "--ag-s": S + "px", "--ag-fs": Z.fs + "px", "--ag-d": Z.d + "px", "--ag-slop": `${Math.min(0, (S - 44) / 2)}px`, ...style }}
    >
      <motion.div
        className="ts-ag-group"
        data-tip={hot != null && (on || single) ? "" : undefined}
        initial={false}
        animate={{ width: Math.max(0, n - 1) * step + S }}
        transition={spring}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") setHover(true); }}
        onPointerLeave={(e) => { if (e.pointerType !== "touch") { setHover(false); setHot(null); } }}
        onFocus={() => setFocus(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
      >
        {shown.map((p, i) => (
          <motion.div key={p.key} className="ts-ag-slot" data-k={p.key} style={{ zIndex: zFor(i, p.key) }} initial={false} animate={{ x: i * step }} transition={spring}
            onPointerEnter={() => setHot(p.key)}>
            <motion.div className="ts-ag-lift" initial={false} animate={{ y: !reduce && on && hot === p.key ? -lift : 0, scale: !reduce && on && hot === p.key && lift ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 520, damping: 30 }}>
              {faceEl(p, i)}
            </motion.div>
            {tipFor(p.key) && tip(p.name, p.description ?? (showPresence && p.presence ? PRESENCE_WORD[p.presence] ?? p.presence : null))}
          </motion.div>
        ))}
        {extra > 0 && (
          <motion.div key="chip" className="ts-ag-slot" data-k="chip" style={{ zIndex: zFor(shown.length, "chip") }} initial={false} animate={{ x: shown.length * step }} transition={spring}
            onPointerEnter={() => setHot("chip")}>
            {onOverflowClick ? (
              <button type="button" className="ts-ag-chip" style={chipPad} disabled={disabled} aria-label={`${extra} more: ${hiddenNames}`} onClick={(e) => onOverflowClick(hidden, e)}
                onFocus={() => setHot("chip")} onBlur={() => setHot((h) => (h === "chip" ? null : h))}>
                +{extra}
              </button>
            ) : (
              <span className="ts-ag-chip" style={chipPad} role="img" tabIndex={disabled ? undefined : 0} aria-label={`${extra} more: ${hiddenNames}`}
                onFocus={() => setHot("chip")} onBlur={() => setHot((h) => (h === "chip" ? null : h))}>
                +{extra}
              </span>
            )}
            {hot === "chip" && tip(`${extra} more`, hiddenNames)}
          </motion.div>
        )}
      </motion.div>
    </div></>
  );
}

/**
 * AvatarGroup: who is in this document right now.
 * Signature: hover (or focus, or tap on a phone) fans the overlapping stack apart on a spring, and the avatar
 * nearest the pointer lifts and grows like a magnet while a name tooltip glides along. Presence is live:
 * a joiner pops in at the front with a ring pulse and pushes the last face into the "+N" chip (its number
 * rolls); a leaver shrinks out and the stack closes up. The chip opens a searchable people list (anchored
 * popover on desktop, bottom sheet on phones). Click a person to follow them: a dashed ring in their colour
 * turns around their avatar and the document gets their outline.
 */
function AvatarDemo({
  size = "md",
  max = 5,
  overlap = 30,
  live = true,
  interval = 3000,
  showPresence = true,
  stackOrder = "first-on-top",
  lift = 10,
  forceState,
  fwdRef,
  className,
  style,
  rest,
}) {
  const sheetTag = useStyles("ts-avatar-group", CSS);
  const reduce = useReducedMotion();
  const phone = useMedia(PHONE);
  const touch = useMedia(TOUCH);
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const groupRef = useRef(null);
  const chipRef = useRef(null);
  const allRef = useRef(null);
  const panelRef = useRef(null);
  const sheetRef = useRef(null);
  const tipRef = useRef(null);
  const slotRefs = useRef({});
  const rootW = useWidth(rootRef);

  const [people, setPeople] = useState(initialPeople);
  const [following, setFollowing] = useState(null);
  const [hover, setHover] = useState(false);
  const [kbd, setKbd] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [hot, setHot] = useState(null);
  const [focusKey, setFocusKey] = useState(null);
  const [open, setOpen] = useState(forceState === "open");
  const [focusList, setFocusList] = useState(false);
  const [event, setEvent] = useState(null);
  const [announce, setAnnounce] = useState("");

  const peopleRef = useRef(people); peopleRef.current = people;
  const followRef = useRef(following); followRef.current = following;

  /* ---------- geometry */
  const Z = SIZES[size] ?? SIZES.md;
  const S = Z.s;
  const stackStep = Math.round(S * (1 - clamp(overlap, 0, 70) / 100) * 10) / 10;
  const spreadStep = touch ? Math.max(S + Z.gap, 50) : S + Z.gap;
  const avail = rootW ? (phone ? rootW - 28 : Math.min(rootW * 0.55, 520)) : 9999;
  const slotCap = Math.max(2, Math.floor((avail - S) / spreadStep) + 1);
  const maxV = clamp(Math.min(max, slotCap - 1), 1, 12);

  let present = people.filter((p) => p.presence !== "offline").sort(byJoin);
  if (following) {
    // the person you follow always stays in view: pulled out of the overflow to the front
    const i = present.findIndex((p) => p.id === following);
    if (i >= maxV) present = [present[i], ...present.slice(0, i), ...present.slice(i + 1)];
  }
  const visible = present.length > maxV ? present.slice(0, maxV) : present;
  const extra = present.length - visible.length;
  const slotKeys = [...visible.map((p) => p.id), ...(extra > 0 ? ["chip"] : [])];
  const slots = slotKeys.length;
  const activeN = present.filter((p) => p.presence === "active").length;
  const fp = people.find((p) => p.id === following && p.presence !== "offline") ?? null;

  // why did each face enter or leave the visible set? (join / release from the chip / absorb into it / leave)
  const visKey = visible.map((p) => p.id).join(","), presKey = present.map((p) => p.id).join(",");
  const prev = useRef({ vis: visible.map((p) => p.id), pres: present.map((p) => p.id), mounted: false });
  const reasons = useMemo(() => {
    const r = {}, pv = prev.current;
    const vis = visKey ? visKey.split(",") : [], pres = presKey ? presKey.split(",") : [];
    for (const id of vis) if (!pv.vis.includes(id)) r[id] = pv.pres.includes(id) ? "release" : "join";
    for (const id of pv.vis) if (!vis.includes(id)) r[id] = pres.includes(id) ? "absorb" : "leave";
    return r;
  }, [visKey, presKey]);
  useEffect(() => { prev.current = { vis: visKey ? visKey.split(",") : [], pres: presKey ? presKey.split(",") : [] }; }, [visKey, presKey]);

  const spreadOn = !open && (forceState === "hover" || hover || kbd || pinned);

  const spread = useMotionValue(spreadOn ? 1 : 0);
  const stackMv = useMotionValue(stackStep);
  const spreadMv = useMotionValue(spreadStep);
  const countMv = useMotionValue(slots);
  const px = useMotionValue(-999);
  const magnet = useMotionValue(0);
  const step = useTransform([spread, stackMv, spreadMv], ([s, a, b]) => a + (b - a) * s);
  const groupW = useTransform([countMv, step], ([c, s]) => Math.max(0, c - 1) * s + S);
  // the chip sits under its neighbour when first-on-top: keep "+N" centred in the part you can see
  const chipPad = useTransform(step, (s) => Math.max(0, S - s));
  const geoRef = useRef({}); geoRef.current = { chipIdx: visible.length, step: step.get(), reasons };

  useEffect(() => { animate(spread, spreadOn ? 1 : 0, reduce ? { duration: 0 } : SPREAD); }, [spreadOn, reduce]);
  useEffect(() => {
    const t = reduce ? { duration: 0 } : SLIDE;
    animate(stackMv, stackStep, t); animate(spreadMv, spreadStep, t);
  }, [stackStep, spreadStep, reduce]);
  useEffect(() => { animate(countMv, slots, reduce ? { duration: 0 } : SLIDE); }, [slots, reduce]);

  /* ---------- live presence */
  const stepIdx = useRef(0);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      const cur = peopleRef.current;
      let ev = null;
      for (let g = 0; g < SCRIPT.length; g++) {
        const cand = SCRIPT[stepIdx.current % SCRIPT.length];
        stepIdx.current++;
        if (validStep(cur, cand)) { ev = cand; break; }
      }
      if (!ev) return;
      const [type, id] = ev;
      const p = cur.find((x) => x.id === id);
      const clock = Math.max(...cur.map((x) => x.joinedAt)) + 1;
      setPeople((ps) => ps.map((x) => x.id !== id ? x
        : type === "join" ? { ...x, presence: "active", joinedAt: clock }
        : type === "leave" ? { ...x, presence: "offline", seen: "just now" }
        : type === "idle" ? { ...x, presence: "idle", idle: 1 }
        : { ...x, presence: "active" }));
      let text = type === "join" ? `${p.name} joined` : type === "leave" ? `${p.name} left` : type === "idle" ? `${first(p.name)} went idle` : `${first(p.name)} is back`;
      if (type === "leave" && followRef.current === id) { setFollowing(null); text += ". Stopped following"; }
      setEvent({ key: clock + type + id, type, text: type === "join" ? `${first(p.name)} joined` : type === "leave" ? `${first(p.name)} left` : text });
      setAnnounce(text);
    }, clamp(interval, 1000, 20000));
    return () => clearInterval(t);
  }, [live, interval]);
  useEffect(() => { if (!event) return; const t = setTimeout(() => setEvent(null), 3200); return () => clearTimeout(t); }, [event]);

  /* ---------- follow */
  const toggleFollow = (id) => {
    const p = peopleRef.current.find((x) => x.id === id);
    if (!p || p.presence === "offline") return;
    const on = followRef.current !== id;
    setFollowing(on ? id : null);
    setAnnounce(on ? `Following ${p.name}` : `Stopped following ${p.name}`);
  };

  /* ---------- magnet + hot avatar */
  const lastX = useRef(null);
  const nearest = (clientX) => {
    const g = groupRef.current;
    if (!g || !slots) return;
    const r = g.getBoundingClientRect();
    const lx = clientX - r.left;
    px.set(lx);
    const s = step.get();
    setHot(slotKeys[clamp(Math.round((lx - S / 2) / s), 0, slots - 1)]);
  };
  // the stack keeps moving under a still pointer while it spreads: re-pick the nearest face as it does
  useMotionValueEvent(step, "change", () => { if (lastX.current != null) nearest(lastX.current); });
  const magnetOn = (v) => animate(magnet, v, { duration: v ? 0.16 : 0.28 });
  const magnetTo = (key) => {
    const i = slotKeys.indexOf(key);
    if (i < 0) return;
    lastX.current = null;
    animate(px, i * spreadStep + S / 2, reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 });
    magnetOn(1);
    setHot(key);
  };

  const leaveT = useRef(0);
  const touchRef = useRef(null);
  const onEnter = (e) => { if (e.pointerType === "touch") return; clearTimeout(leaveT.current); setHover(true); magnetOn(1); };
  const onLeave = (e) => {
    if (e.pointerType === "touch") return;
    lastX.current = null;
    leaveT.current = setTimeout(() => {
      setHover(false);
      if (!kbdRef.current) { magnetOn(0); setHot(null); }
    }, 120);
  };
  const onMove = (e) => {
    if (e.pointerType === "touch") {
      const t = touchRef.current;
      if (!t || !t.wasSpread) return;
      if (!t.moved && Math.abs(e.clientX - t.x) < 8) return;
      t.moved = true;
      magnetOn(1);
    }
    lastX.current = e.clientX;
    nearest(e.clientX);
  };
  const onDown = (e) => {
    if (e.pointerType === "touch") touchRef.current = { x: e.clientX, moved: false, wasSpread: spreadOn };
    else touchRef.current = null;
  };
  const onUp = (e) => { if (e.pointerType === "touch") lastX.current = null; };
  const kbdRef = useRef(false); kbdRef.current = kbd;

  const onAvatarClick = (id, e) => {
    const t = touchRef.current;
    if (e.detail !== 0 && t) {
      touchRef.current = null;
      if (!t.wasSpread) { setPinned(true); magnetOn(1); setHot(null); return; } // first tap only fans the stack out
      if (t.moved) return;
      magnetTo(id);
    }
    toggleFollow(id);
    setHot(id);
  };

  useDismiss(pinned, () => { setPinned(false); magnetOn(0); setHot(null); }, [groupRef]);

  /* ---------- keyboard: roving focus across faces and the chip */
  const activeKey = slotKeys.includes(focusKey) ? focusKey : slotKeys[0];
  const hadFocus = useRef(false);
  const focusSlot = (key) => { const el = slotRefs.current[key]?.querySelector("button"); el?.focus({ preventScroll: true }); };
  const onKeyDown = (e) => {
    const i = slotKeys.indexOf(activeKey);
    const go = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: slots - 1 }[e.key];
    if (go != null) {
      e.preventDefault();
      const k = slotKeys[clamp(go, 0, slots - 1)];
      setFocusKey(k);
      focusSlot(k);
      return;
    }
    if (e.key === "Escape") {
      if (pinned) { e.stopPropagation(); setPinned(false); }
      else if (following) { e.stopPropagation(); toggleFollow(following); }
    }
  };
  const onFocus = (e) => {
    hadFocus.current = true;
    const k = e.target.closest("[data-k]")?.dataset.k;
    if (!k) return;
    setFocusKey(k);
    if (e.target.matches(":focus-visible")) { setKbd(true); magnetTo(k); }
  };
  const onBlur = (e) => {
    if (groupRef.current?.contains(e.relatedTarget)) return;
    hadFocus.current = false;
    setKbd(false);
    if (!hover && !pinned) { magnetOn(0); setHot(null); }
  };
  // a focused face that leaves hands focus to whoever takes its place
  const lastIdx = useRef(0);
  useEffect(() => {
    if (focusKey && slotKeys.includes(focusKey)) { lastIdx.current = slotKeys.indexOf(focusKey); return; }
    if (!hadFocus.current || !slots) return;
    const k = slotKeys[clamp(lastIdx.current, 0, slots - 1)];
    setFocusKey(k);
    requestAnimationFrame(() => focusSlot(k));
    if (kbdRef.current) magnetTo(k);
  }, [visKey, extra > 0]);
  // keyboard magnet tracks its face as faces shift around it
  useEffect(() => { if (kbd && hot && slotKeys.includes(hot)) magnetTo(hot); }, [visKey]);

  /* ---------- forced states for the gallery */
  useEffect(() => {
    if (forceState === "open") setOpen(true);
    if (forceState === "hover") {
      const k = slotKeys[Math.min(1, slots - 1)];
      lastX.current = null;
      px.set(Math.min(1, slots - 1) * spreadStep + S / 2);
      magnet.set(1);
      setHot(k);
    } else if (!hover && !kbd && !pinned) { magnet.set(0); setHot(null); }
  }, [forceState]);

  /* ---------- people list */
  const anchorRef = touch ? allRef : extra > 0 ? chipRef : groupRef;
  const pos = useFloating(anchorRef, panelRef, open && !phone, { placement: "bottom-end", offset: 10, padding: 8 });
  const closeList = (why) => {
    setOpen(false);
    if (why !== "outside" && !phone) requestAnimationFrame(() => (touch ? allRef.current : chipRef.current ?? groupRef.current?.querySelector("button"))?.focus({ preventScroll: true }));
  };
  useDismiss(open, closeList, [panelRef, sheetRef, chipRef, allRef]);
  useFocusTrap(sheetRef, open && phone, { initial: ".ts-ag-lt", returnTo: touch ? allRef : chipRef });
  useScrollLock(open && phone);
  const openList = () => { setPinned(false); setHot(null); setFocusList(true); setOpen((o) => !o); };
  const pick = (id) => { toggleFollow(id); closeList("pick"); };
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!(open && phone) || !vv) return;
    const on = () => setKb(Math.max(0, innerHeight - vv.height - vv.offsetTop));
    on();
    vv.addEventListener("resize", on); vv.addEventListener("scroll", on);
    return () => { vv.removeEventListener("resize", on); vv.removeEventListener("scroll", on); };
  }, [open, phone]);

  // the Stop button leaves with the follow bar: focus goes back to that person in the stack (or the stack's one
  // target on touch), so it is not dropped on the page
  const stopFollow = () => {
    if (!fp) return;
    const id = fp.id;
    const fromBar = !!document.activeElement?.closest(".ts-ag-fbar");
    toggleFollow(id);
    if (!fromBar) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (touch) { allRef.current?.focus({ preventScroll: true }); return; }
      const own = slotRefs.current[id]?.querySelector("button");
      const el = own && document.contains(own) ? own : groupRef.current?.querySelector('button[tabindex="0"]');
      el?.focus({ preventScroll: true });
    }));
  };

  /* ---------- tooltip placement: follows the hot face's real (lifted, sliding) position, kept inside the card */
  const tipOn = spreadOn && hot != null && slotKeys.includes(hot);
  const tipTX = useMotionValue(0), tipTY = useMotionValue(0);
  const tipX = useSpring(tipTX, { stiffness: 520, damping: 40 });
  const tipY = useSpring(tipTY, { stiffness: 520, damping: 40 });
  const tipFresh = useRef(true);
  useIsoLayoutEffect(() => {
    if (!tipOn) { tipFresh.current = true; return; }
    let raf;
    const tick = () => {
      const el = slotRefs.current[hot]?.querySelector(".ts-ag-face, .ts-ag-chip"), root = rootRef.current, tip = tipRef.current;
      if (el && root && tip) {
        const a = el.getBoundingClientRect(), r = root.getBoundingClientRect();
        const w = tip.offsetWidth;
        const x = clamp(a.left + a.width / 2 - r.left - w / 2, 8, r.width - w - 8);
        const y = a.bottom - r.top + 10;
        tipTX.set(x); tipTY.set(y);
        if (tipFresh.current || reduce) { tipX.jump(x); tipY.jump(y); tipFresh.current = false; }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [tipOn, hot, reduce]);
  const hotP = present.find((p) => p.id === hot);

  /* ---------- render */
  const zFor = (i, key) => {
    if (spreadOn && key === hot) return 300;
    if (key === following) return 250;
    return stackOrder === "last-on-top" ? 10 + i : 100 - i;
  };
  const tickText = event ? (
    <motion.span key={event.key} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: 0.1 } }} exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.1 } }}>
      <span className="ts-ag-sdot" data-p={event.type === "join" || event.type === "active" ? "active" : event.type === "idle" ? "idle" : "offline"} aria-hidden />
      {event.text}
    </motion.span>
  ) : (
    <motion.span key="count" initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.22, delay: 0.1 } }} exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.1 } }}>
      <b><RollingNumber value={present.length} /></b> here<span aria-hidden>·</span><RollingNumber value={activeN} /> active
    </motion.span>
  );

  return (
    <>{sheetTag}<div
      ref={(el) => { rootRef.current = el; if (typeof fwdRef === "function") fwdRef(el); else if (fwdRef) fwdRef.current = el; }}
      {...rest}
      className={"ts-ag" + (className ? " " + className : "")}
      data-spread={spreadOn}
      data-order={stackOrder}
      style={{ "--ag-s": S + "px", "--ag-fs": Z.fs + "px", "--ag-d": Z.d + "px", "--ag-slop": `${Math.min(0, (S - 44) / 2)}px`, ...style }}
    >
      <header className="ts-ag-bar">
        <span className="ts-ag-doci" aria-hidden><Icon name="doc" size={18} /></span>
        <div className="ts-ag-titles">
          <p className="ts-ag-crumb">Northwind<i aria-hidden>/</i><span className="ts-sr">, </span>Campaigns<i aria-hidden>/</i><span className="ts-sr">, </span>Spring 2027</p>
          <h3 className="ts-ag-title">Trail Runner 3 launch brief</h3>
        </div>
        <div className="ts-ag-presence">
          <span className="ts-ag-tick"><AnimatePresence initial={false}>{tickText}</AnimatePresence></span>
          <div className="ts-ag-stack">
          <motion.div
            ref={groupRef}
            className="ts-ag-group"
            inert={touch || undefined}
            role="toolbar"
            aria-label={`${present.length} people in this doc: ${activeN} active, ${present.length - activeN} idle`}
            style={{ width: groupW }}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            onPointerMove={onMove}
            onPointerDown={onDown}
            onPointerUp={onUp}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <AnimatePresence initial={false}>
              {visible.map((p, i) => (
                <Slot
                  key={p.id}
                  k={p.id}
                  idx={i}
                  z={zFor(i, p.id)}
                  step={step}
                  spread={spread}
                  spreadMv={spreadMv}
                  px={px}
                  magnet={magnet}
                  size={S}
                  lift={lift}
                  reduce={reduce}
                  enter={reasons[p.id]}
                  geoRef={geoRef}
                  slotRef={(el) => { if (el) slotRefs.current[p.id] = el; }}
                >
                  <button
                    type="button"
                    className="ts-ag-av"
                    tabIndex={activeKey === p.id ? 0 : -1}
                    aria-pressed={following === p.id}
                    aria-label={`${p.name}, ${p.role}, ${presenceWord(p)}${p.presence === "active" ? `, ${p.where.toLowerCase()}` : ""}. ${following === p.id ? "Following" : "Follow"}`}
                    onClick={(e) => onAvatarClick(p.id, e)}
                  >
                    <Face p={p} full />
                    <AnimatePresence initial={false}>
                      {following === p.id && (
                        <motion.svg key="ring" className="ts-ag-fring" viewBox="0 0 48 48" aria-hidden style={{ "--ag-id": seriesColor(p.hue) }}
                          initial={{ opacity: 0, scale: reduce ? 1 : 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.85 }} transition={{ type: "spring", stiffness: 420, damping: 26 }}>
                          <circle cx="24" cy="24" r="23" pathLength="100" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                    <AnimatePresence initial={false}>
                      {showPresence && (
                        <motion.span key={p.presence} className="ts-ag-dot" data-p={p.presence} aria-hidden
                          initial={{ scale: reduce ? 1 : 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: reduce ? 1 : 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 28 }} />
                      )}
                    </AnimatePresence>
                  </button>
                  {reasons[p.id] === "join" && !reduce && <JoinPulse />}
                </Slot>
              ))}
              {extra > 0 && (
                <Slot
                  key="chip"
                  k="chip"
                  idx={visible.length}
                  z={zFor(visible.length, "chip")}
                  step={step}
                  spread={spread}
                  spreadMv={spreadMv}
                  px={px}
                  magnet={magnet}
                  size={S}
                  lift={lift}
                  reduce={reduce}
                  enter="chip"
                  geoRef={geoRef}
                  slotRef={(el) => { if (el) slotRefs.current.chip = el; }}
                >
                  <motion.button
                    ref={(el) => { if (el) chipRef.current = el; }}
                    style={stackOrder === "first-on-top" ? { paddingLeft: chipPad } : undefined}
                    type="button"
                    className="ts-ag-chip"
                    tabIndex={activeKey === "chip" ? 0 : -1}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls={open ? uid + "-people" : undefined}
                    aria-label={`${extra} more in this doc. Show all ${people.length} people`}
                    onClick={openList}
                  >
                    <RollingNumber value={extra} format={(n) => "+" + n} />
                  </motion.button>
                </Slot>
              )}
            </AnimatePresence>
          </motion.div>
          {touch && (
            <button
              ref={allRef}
              type="button"
              className="ts-ag-all"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? uid + "-people" : undefined}
              aria-label={`${present.length} people in this doc: ${activeN} active, ${present.length - activeN} idle${fp ? `. Following ${fp.name}` : ""}. Show all ${people.length} people`}
              onClick={openList}
            />
          )}
          </div>
        </div>
        <button type="button" className="ts-ag-share" aria-label={phone ? "Share" : undefined}><Icon name="share" size={16} stroke={2} />{!phone && <span>Share</span>}</button>
      </header>

      <Doc people={present} fp={fp} reduce={reduce} onStop={stopFollow} />

      <AnimatePresence>
        {tipOn && (
          <motion.div ref={tipRef} key="tip" className="ts-ag-tip" aria-hidden style={{ x: tipX, y: tipY }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.14 }}>
            {hot === "chip" ? (
              <>
                <span className="ts-ag-tip__name">{extra} more here</span>
                <span className="ts-ag-tip__row">{touch ? "Tap" : "Click"} to see all {people.length} people</span>
              </>
            ) : hotP ? (
              <>
                <span className="ts-ag-tip__name">{hotP.name}</span>
                <span className="ts-ag-tip__row" style={{ "--ag-id": seriesColor(hotP.hue) }}>
                  {following === hotP.id ? (
                    <><span className="ts-ag-sdot" data-p="follow" />Following · {touch ? "tap" : "click"} to stop</>
                  ) : (
                    <><span className="ts-ag-sdot" data-p={hotP.presence} />{hotP.presence === "active" ? "Active" : "Idle"} · {hotP.presence === "active" ? hotP.where : `${hotP.idle} min`}</>
                  )}
                </span>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && !phone && (
          <motion.div
            ref={panelRef}
            key="pop"
            id={uid + "-people"}
            className="ts-ag-pop"
            role="dialog"
            aria-label="People in this doc"
            style={{ left: pos?.x ?? -9999, top: pos?.y ?? 0, maxHeight: pos?.maxHeight, visibility: pos ? "visible" : "hidden", transformOrigin: originFor(pos) }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 560, damping: 36 }}
          >
            <PeopleList people={people} presentN={present.length} following={following} onPick={pick} uid={uid} reduce={reduce}
              autoFocus={focusList && !!pos} onFocused={() => setFocusList(false)} />
          </motion.div>
        )}
        {open && phone && (
          <motion.div key="scrim" className="ts-ag-scrim" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
        )}
        {open && phone && (
          <motion.div
            ref={sheetRef}
            key="sheet"
            id={uid + "-people"}
            className="ts-ag-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="People in this doc"
            style={{ bottom: 8 + kb }}
            initial={reduce ? { opacity: 0 } : { y: "105%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "105%", transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <span className="ts-ag-grab" aria-hidden />
            <PeopleList people={people} presentN={present.length} following={following} onPick={pick} uid={uid} reduce={reduce} sheet onClose={() => closeList("close")} />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="ts-sr" role="status" aria-live="polite">{announce}</p>
    </div></>
  );
}

/* One position in the stack. Its x comes from a sprung index times the (stacked ↔ spread) step, so joins, leaves
   and size changes all slide; the lift wrapper rises and grows with the magnet; the presence wrapper handles
   pop-in, absorb-into-chip, release-from-chip and shrink-out. */
function Slot({ k, idx, z, step, spread, spreadMv, px, magnet, size, lift, reduce, enter, geoRef, slotRef, children }) {
  const idxMv = useMotionValue(idx);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (reduce) idxMv.set(idx); else animate(idxMv, idx, SLIDE);
  }, [idx, reduce]);
  const x = useTransform([idxMv, step], ([i, s]) => i * s);
  const near = useTransform([px, magnet, x, spreadMv, spread], ([p, m, xx, ss, s]) => {
    if (!m || reduce) return 0;
    const d = (p - xx - size / 2) / (ss * 0.95);
    return m * s * Math.exp(-d * d);
  });
  const y = useSpring(useTransform(near, (n) => -n * lift), { stiffness: 520, damping: 30 });
  const scale = useSpring(useTransform(near, (n) => 1 + n * (lift ? 0.15 : 0)), { stiffness: 520, damping: 30 });

  const chipOffset = () => (geoRef.current.chipIdx - idx) * geoRef.current.step;
  const variants = {
    from: () => {
      if (reduce) return { opacity: 0 };
      if (enter === "release") return { x: chipOffset(), scale: 0.55, opacity: 0 };
      return { scale: 0.25, opacity: 0, x: 0 };
    },
    in: { x: 0, scale: 1, opacity: 1, transition: reduce ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 24 } },
    out: () => {
      const why = geoRef.current.reasons[k];
      if (reduce) return { opacity: 0, transition: { duration: 0.15 } };
      if (why === "absorb") return { x: chipOffset(), scale: 0.55, opacity: 0, transition: { ...SLIDE, opacity: { duration: 0.3, delay: 0.08 } } };
      return { scale: 0.2, opacity: 0, y: 4, transition: { duration: 0.28, ease: [0.4, 0, 0.7, 0.2] } };
    },
  };
  return (
    <motion.div ref={slotRef} className="ts-ag-slot" data-k={k} style={{ x, zIndex: z }} initial="from" animate="in" exit="out">
      <motion.div className="ts-ag-lift" style={{ y, scale }}>
        <motion.div className="ts-ag-pres" variants={variants}>{children}</motion.div>
      </motion.div>
    </motion.div>
  );
}

function JoinPulse() {
  return (
    <motion.span className="ts-ag-pulse" aria-hidden initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: [1, 1.75], opacity: [0.9, 0] }}
      transition={{ duration: 0.9, repeat: 1, ease: "easeOut", delay: 0.12 }} />
  );
}

function Face({ p, full = false }) {
  return (
    <span className="ts-ag-face" data-ini={!p.art} style={{ "--ag-id": seriesColor(p.hue) }}>
      {p.art ? <Art art={p.art} seed={p.seed ?? 0} grain={0} lite={!full} style={{ position: "absolute", inset: 0 }} /> : initials(p.name)}
    </span>
  );
}

/* ---------------------------------------------------------------- the people list (combobox + listbox) */
function PeopleList({ people, presentN, following, onPick, uid, reduce, sheet, onClose, autoFocus, onFocused }) {
  const loc = useLocale();
  const [q, setQ] = useState("");
  const [act, setAct] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!autoFocus) return;
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    onFocused?.();
  }, [autoFocus]);

  const nq = norm(q.trim());
  const match = (p) => !nq || norm(p.name).includes(nq) || norm(p.role).includes(nq);
  const rank = (p) => (p.presence === "idle" ? 0 : 1);
  const activeNow = people.filter((p) => p.presence === "active" && match(p)).sort(byJoin);
  const others = people.filter((p) => p.presence !== "active" && match(p)).sort((a, b) => rank(a) - rank(b) || byJoin(a, b) || a.name.localeCompare(b.name, loc));
  const enabled = [...activeNow, ...others].filter((p) => p.presence !== "offline").map((p) => p.id);
  const cur = enabled.includes(act) ? act : null;

  const move = (d) => {
    if (!enabled.length) return;
    const i = enabled.indexOf(cur);
    const n = i < 0 ? (d > 0 ? 0 : enabled.length - 1) : clamp(i + d, 0, enabled.length - 1);
    setAct(enabled[n]);
    requestAnimationFrame(() => document.getElementById(`${uid}-o-${enabled[n]}`)?.scrollIntoView({ block: "nearest" }));
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const id = cur ?? (enabled.length === 1 ? enabled[0] : null);
      if (id) onPick(id);
    }
  };
  const hl = (name) => {
    if (!nq) return name;
    const i = norm(name).indexOf(nq);
    if (i < 0) return name;
    return <>{name.slice(0, i)}<mark>{name.slice(i, i + nq.length)}</mark>{name.slice(i + nq.length)}</>;
  };
  const row = (p) => {
    const off = p.presence === "offline", on = following === p.id;
    return (
      <motion.div
        key={p.id}
        layout={reduce ? false : "position"}
        id={`${uid}-o-${p.id}`}
        role="option"
        aria-selected={cur === p.id}
        aria-disabled={off || undefined}
        aria-label={`${p.name}, ${p.role}, ${presenceWord(p)}${on ? ", following" : ""}`}
        className="ts-ag-row"
        style={{ "--ag-id": seriesColor(p.hue) }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
        transition={{ layout: { type: "spring", stiffness: 420, damping: 36 }, opacity: { duration: 0.18 } }}
        onPointerMove={() => !off && cur !== p.id && setAct(p.id)}
        onClick={() => !off && onPick(p.id)}
      >
        <span className="ts-ag-rface">
          <Face p={p} />
          <span className="ts-ag-dot" data-p={p.presence} />
        </span>
        <span className="ts-ag-rtxt">
          <span className="ts-ag-rname">{hl(p.name)}</span>
          <span className="ts-ag-rsub">{p.role} · {status(p)}</span>
        </span>
        {!off && <span className="ts-ag-rtag" data-on={on}>{on ? <><span className="ts-ag-sdot" data-p="follow" />Following</> : "Follow"}</span>}
      </motion.div>
    );
  };
  const head = (key, label, n) => (
    <motion.div key={"h-" + key} layout={reduce ? false : "position"} className="ts-ag-gh" role="presentation" transition={{ layout: { type: "spring", stiffness: 420, damping: 36 } }}>
      <span>{label}</span><span>{n}</span>
    </motion.div>
  );

  return (
    <>
      <div className="ts-ag-lh">
        <div>
          <h2 className="ts-ag-lt" tabIndex={-1}>People</h2>
          <p className="ts-ag-ls"><RollingNumber value={presentN} /> here now · {people.length} with access</p>
        </div>
        {sheet && <button type="button" className="ts-ag-x" aria-label="Close" onClick={onClose}><Icon name="x" size={18} /></button>}
      </div>
      <label className="ts-ag-search">
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search people"
          aria-expanded="true"
          aria-controls={`${uid}-lb`}
          aria-autocomplete="list"
          aria-activedescendant={cur ? `${uid}-o-${cur}` : undefined}
          placeholder="Search by name or role"
          autoComplete="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
        />
      </label>
      <motion.div ref={scrollRef} layoutScroll className="ts-ag-scroll" role="listbox" id={`${uid}-lb`} aria-label="People">
        <AnimatePresence initial={false} mode="popLayout">
          {activeNow.length > 0 && head("a", "Active now", activeNow.length)}
          {activeNow.map(row)}
          {others.length > 0 && head("o", "Others", others.length)}
          {others.map(row)}
        </AnimatePresence>
        {!activeNow.length && !others.length && (
          <p className="ts-ag-empty">No one matches <b>“{q.trim()}”</b>.<br />Try a first name or a role, like “designer”.</p>
        )}
      </motion.div>
      {/* the listbox is not read while typing, so the result count is said here */}
      <p className="ts-sr" role="status" aria-live="polite">{nq ? (activeNow.length + others.length ? `${activeNow.length + others.length} ${activeNow.length + others.length === 1 ? "person" : "people"} found` : `No one matches ${q.trim()}`) : ""}</p>
      <div className="ts-ag-lf"><Icon name="lock" size={14} />Northwind marketing · everyone can edit</div>
    </>
  );
}

/* ---------------------------------------------------------------- the document, with live cursors */
const BLOCKS = [
  { sec: "headline", el: (k) => <h4 key={k} className="ts-ag-h">Trail Runner 3: built for the first warm miles</h4> },
  { sec: "hero", el: (k) => <p key={k} className="ts-ag-p">Lead with the outsole. <strong>4 mm lugs</strong> that bite on wet spring trail, a rocker that rolls you through the climb, 268 g in a men’s 9. Shoot it muddy, never studio-clean.</p> },
  { sec: "pricing", el: (k) => <p key={k} className="ts-ag-p">Launch at <strong>$148</strong>. Members get a 48-hour early window and free returns through April; no discount codes in the first two weeks.</p> },
  { sec: "timeline", el: (k) => (
    <dl key={k} className="ts-ag-dates">
      <div><dt>Teaser</dt><dd>12 Feb</dd></div>
      <div><dt>Members drop</dt><dd>3 Mar</dd></div>
      <div><dt>Retail</dt><dd>17 Mar</dd></div>
    </dl>
  ) },
];

function Doc({ people, fp, reduce, onStop }) {
  const active = people.filter((p) => p.presence === "active");
  return (
    <div className="ts-ag-canvas" data-f={!!fp} style={{ "--ag-f": fp ? seriesColor(fp.hue) : "transparent" }}>
      <AnimatePresence>
        {fp && (
          <motion.div key="fbar" className="ts-ag-fbar" initial={{ opacity: 0, y: reduce ? 0 : 8, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: reduce ? 0 : 8, x: "-50%" }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
            <span className="ts-ag-sdot" aria-hidden />
            <span>Following <b>{fp.name}</b>{fp.presence === "idle" ? " · idle" : ""}</span>
            <button type="button" className="ts-ag-fstop" onClick={onStop}>Stop</button>
          </motion.div>
        )}
      </AnimatePresence>
      <article className="ts-ag-page">
        <p className="ts-ag-eyebrow">Brief · v12 · due Thu 4 Dec</p>
        {BLOCKS.map((b) => {
          const here = active.filter((p) => p.sec === b.sec);
          const shown = here.slice(0, 1);
          if (fp && fp.sec === b.sec && !shown.some((p) => p.id === fp.id)) shown.splice(0, 1, fp);
          return (
            <div key={b.sec} className="ts-ag-blk" data-hl={fp?.sec === b.sec}>
              {b.el(b.sec)}
              <AnimatePresence>
                {shown.map((p, i) => (
                  <Cursor key={p.id} p={p} dim={!!fp && fp.id !== p.id} emph={fp?.id === p.id} reduce={reduce} n={i} />
                ))}
              </AnimatePresence>
            </div>
          );
        })}
      </article>
    </div>
  );
}

// a name tag shows for a moment when a cursor arrives (or when you start following it), then folds away so the
// cursor never parks a label on top of the copy
function Cursor({ p, dim, emph, reduce, n }) {
  const d = 6 + ((p.hue * 7 + n * 3) % 5);
  const [tag, setTag] = useState(true);
  useEffect(() => {
    setTag(true);
    const t = setTimeout(() => setTag(false), 1600);
    return () => clearTimeout(t);
  }, [emph]);
  return (
    <motion.span
      className="ts-ag-cur"
      aria-hidden
      style={{ left: p.cx + "%", top: p.cy, "--ag-id": seriesColor(p.hue) }}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.6 }}
      animate={reduce ? { opacity: dim ? 0.3 : 1, scale: 1 } : { opacity: dim ? 0.3 : 1, scale: 1, x: [0, 16, 4, -8, 0], y: [0, 5, -4, 3, 0] }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.6, transition: { duration: 0.2 } }}
      transition={{ opacity: { duration: 0.3 }, scale: { type: "spring", stiffness: 420, damping: 26 }, x: { duration: d, repeat: Infinity, ease: "easeInOut" }, y: { duration: d * 0.8, repeat: Infinity, ease: "easeInOut" } }}
    >
      <svg width="14" height="16" viewBox="0 0 14 16"><path d="M1.5 1.5 12.5 7.6 7.3 8.7 4.6 14.2Z" fill="var(--ag-id)" stroke="var(--ts-surface)" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      <AnimatePresence initial={false}>
        {tag && (
          <motion.span key="tag" className="ts-ag-cur__tag" style={{ transformOrigin: "left top" }}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.4 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reduce ? 1 : 0.4 }}
            transition={{ duration: reduce ? 0.15 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}>
            {first(p.name)}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
}
