"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useMotionValueEvent, useTransform } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useWidth } from "../_shared/page.jsx";
import { useInView } from "../_shared/chart.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Button } from "../button/index.jsx";
import { CopyButton } from "../copy-button/index.jsx";

const CSS = `
.ts-cta{container:cta / inline-size;width:100%;font-family:var(--ts-font);color:var(--ts-ink);-webkit-font-smoothing:antialiased}
.ts-cta-band{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;max-width:1240px;margin:0 auto;padding:clamp(28px,5.2cqw,68px);
  border-radius:calc(var(--ts-radius-lg) + 10px);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-cta a:focus-visible,.ts-cta button:focus-visible,.ts-cta-textbtn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:3px}

/* ---------- grid: copy, panel, actions, reassurance */
.ts-cta-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);column-gap:clamp(36px,6cqw,88px);
  grid-template-areas:"copy panel" "actions panel" "assure panel";grid-template-rows:auto auto 1fr}
.ts-cta-copy{grid-area:copy;min-width:0}
.ts-cta-panel{grid-area:panel;min-width:0;align-self:center}
.ts-cta-actions{grid-area:actions;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px;margin-top:32px;min-width:0}
.ts-cta-assure{grid-area:assure;align-self:end;display:grid;grid-template-columns:repeat(2,max-content);gap:9px 22px;margin:30px 0 0;padding:16px 0 0;list-style:none;
  border-top:1px solid var(--ts-line);font-size:12.5px;line-height:1.3;color:var(--ts-ink2)}
.ts-cta-assure li{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.ts-cta-assure svg{color:var(--ts-ink)}
.ts-cta[data-kind=form] .ts-cta-grid{grid-template-areas:"copy panel" "assure panel";grid-template-rows:auto 1fr}
.ts-cta:not([data-kind=field]):not([data-panel]) .ts-cta-grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"copy" "actions" "assure";grid-template-rows:none}
.ts-cta[data-kind=field] .ts-cta-band{min-height:420px;display:flex;flex-direction:column;justify-content:center}
.ts-cta[data-kind=field] .ts-cta-grid{grid-template-columns:minmax(0,6fr) minmax(0,5fr);grid-template-areas:"copy actions" "copy assure";grid-template-rows:1fr 1fr;align-items:center}
.ts-cta[data-kind=field] .ts-cta-copy{align-self:center}
.ts-cta[data-kind=field] .ts-cta-actions{align-self:end;justify-self:center;justify-content:center;flex-direction:column;margin-top:0;gap:14px}
.ts-cta[data-kind=field]:not([data-assure]) .ts-cta-actions{grid-row:1 / span 2;align-self:center}
.ts-cta[data-kind=field] .ts-cta-assure{align-self:start;justify-self:center;justify-content:center;border-top:0;margin-top:22px;padding-top:0}

/* ---------- copy */
.ts-cta-eyebrow{display:flex;align-items:center;gap:9px;margin:0 0 20px;font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-cta-eyebrow svg{flex:none;color:var(--ts-ink)}
.ts-cta-h{margin:0;font-size:clamp(32px,5cqw,66px);line-height:1.02;letter-spacing:-0.035em;font-weight:680;text-wrap:balance}
.ts-cta-promise{position:relative;display:inline-block;white-space:nowrap;font-variant-numeric:tabular-nums}
.ts-cta-tide{position:absolute;left:0;bottom:calc(-.08em - 6px);width:100%;height:10px;overflow:visible;color:var(--ts-ink3);pointer-events:none}
.ts-cta-tide path{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ts-cta-sub{margin:20px 0 0;max-width:44ch;font-size:clamp(15px,1.5cqw,17.5px);line-height:1.55;color:var(--ts-ink2);text-wrap:pretty}
.ts-cta-link{position:relative;display:inline-flex;align-items:center;gap:7px;min-height:34px;font-size:14.5px;font-weight:560;color:var(--ts-ink);text-decoration:none;border-radius:6px;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.ts-cta-link::after{content:"";position:absolute;left:0;right:22px;bottom:5px;height:1px;background:currentColor;opacity:.28;transition:opacity .25s}
.ts-cta-link:hover::after{opacity:.9}
.ts-cta-link svg{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.ts-cta-link:hover svg{transform:translateX(4px)}
.ts-cta-link[aria-disabled=true]{opacity:.5;cursor:not-allowed}
.ts-cta-link[aria-disabled=true]:hover svg{transform:none}
.ts-cta-textbtn[data-off]{cursor:not-allowed;opacity:.5}
.ts-cta-input[data-disabled]{opacity:.5}

/* ---------- terminal */
.ts-cta-term{container:ctaterm / inline-size;position:relative;border-radius:calc(var(--ts-radius-lg) + 2px);background:var(--ts-bg);font-family:var(--ts-font-mono);
  box-shadow:inset 0 0 0 1px var(--ts-line),var(--cta-drop)}
.ts-cta-tbar{position:relative;display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-bottom:1px solid var(--ts-line);font-size:12px;color:var(--ts-ink2);white-space:nowrap}
.ts-cta-tpath{flex:none;display:inline-flex;align-items:center;gap:7px;color:var(--ts-ink);font-weight:550}
.ts-cta-branch{min-width:0;overflow:hidden;text-overflow:ellipsis;padding:3px 8px;border-radius:99px;color:color-mix(in srgb,var(--ts-ink2) 70%,var(--ts-ink));background:color-mix(in srgb,var(--ts-ink) 6%,transparent)}
.ts-cta-clock{flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:9px;font-variant-numeric:tabular-nums}
.ts-cta-clock b{font-weight:550;color:var(--ts-ink)}
.ts-cta-speed{display:inline-block;padding:2px 6px;border-radius:5px;font-size:11px;letter-spacing:.06em;box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-cta-budget{position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--ts-ink);transform-origin:0 50%;will-change:transform}
.ts-cta-cmd{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:14px 14px 6px}
.ts-cta-cmd .ts-copy{flex:1 1 210px;min-width:0}
.ts-cta-run{display:inline-grid;flex:none}
.ts-cta-run>*{grid-area:1/1}
.ts-cta-run-sz{display:grid;visibility:hidden;pointer-events:none}
.ts-cta-run-sz>span{grid-area:1/1;display:inline-flex;align-items:center;gap:8px;height:0;overflow:hidden;padding:0 14px;font-family:var(--ts-font);font-size:13px;font-weight:550;letter-spacing:-0.01em;white-space:nowrap}
.ts-cta-run-sz>span::before{content:"";width:15px;flex:none}
.ts-cta-steps{list-style:none;margin:0;padding:8px 14px 0;display:grid}
.ts-cta-step{display:grid;grid-template-columns:18px minmax(0,1fr) 4.4ch;column-gap:10px;align-items:center;min-height:32px;font-size:12.5px;line-height:1.35}
.ts-cta-mk{position:relative;display:grid;place-items:center;width:18px;height:18px}
.ts-cta-mk-in{display:grid;place-items:center;grid-area:1/1}
.ts-cta-step[data-s=done] .ts-cta-mk{color:var(--ts-success)}
.ts-cta-step[data-s=failed] .ts-cta-mk{color:var(--ts-danger)}
.ts-cta-dot{display:block;width:7px;height:7px;border-radius:99px;box-shadow:inset 0 0 0 1.5px var(--ts-ink3)}
.ts-cta-spin{display:block;width:12px;height:12px;border-radius:99px;border:1.75px solid color-mix(in srgb,var(--ts-ink) 22%,transparent);border-top-color:var(--ts-ink);animation:ts-cta-spin .8s linear infinite}
@keyframes ts-cta-spin{to{transform:rotate(360deg)}}
.ts-cta-st{display:flex;align-items:baseline;gap:10px;min-width:0;white-space:nowrap}
.ts-cta-st-l{position:relative;flex:none;max-width:100%;overflow:hidden;text-overflow:ellipsis;color:var(--ts-ink)}
.ts-cta-st-l>span{display:inline-block}
.ts-cta-step[data-s=pending] .ts-cta-st-l{color:var(--ts-ink3)}
.ts-cta-st-d{min-width:0;overflow:hidden;text-overflow:ellipsis;color:var(--ts-ink2)}
.ts-cta-st-d b{font-weight:500;color:var(--ts-ink);font-variant-numeric:tabular-nums}
.ts-cta-st-t{justify-self:end;color:var(--ts-ink3);font-variant-numeric:tabular-nums}
.ts-cta-bar{grid-column:2 / 4;height:2px;margin:1px 0 7px;border-radius:2px;background:var(--ts-line);overflow:hidden}
.ts-cta-bar i{display:block;height:100%;background:var(--ts-ink);transform-origin:0 50%;will-change:transform}
.ts-cta-bar[data-s=failed] i{background:var(--ts-danger)}
.ts-cta-url{display:grid;margin:10px 14px 14px}
.ts-cta-url>*{grid-area:1/1;min-width:0}
.ts-cta-ghost{display:flex;align-items:center;gap:14px;padding:12px;border-radius:var(--ts-radius-md);box-shadow:inset 0 0 0 1px var(--ts-line);
  background:repeating-linear-gradient(135deg,transparent 0 7px,color-mix(in srgb,var(--ts-ink) 3%,transparent) 7px 8px);font-family:var(--ts-font);font-size:13px;line-height:1.4;color:var(--ts-ink2)}
.ts-cta-ghost-qr{flex:none;border-radius:var(--ts-radius-sm);border:1.5px dashed color-mix(in srgb,var(--ts-ink) 20%,transparent)}
.ts-cta-urlcard{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;padding:12px 14px 12px 12px;border-radius:var(--ts-radius-md);
  background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line),var(--ts-shadow);color:var(--ts-ink);text-decoration:none;font-family:var(--ts-font);-webkit-tap-highlight-color:transparent}
.ts-cta-urlcard:hover .ts-cta-uc-go{transform:translateX(3px);color:var(--ts-ink)}
.ts-cta-qr{display:block;flex:none;padding:5px;border-radius:var(--ts-radius-sm);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);color:var(--ts-ink)}
.ts-cta-qr path{fill:currentColor}
.ts-cta-uc-main{display:flex;flex-direction:column;gap:4px;min-width:0}
.ts-cta-uc-status{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:560;color:var(--ts-ink2);font-variant-numeric:tabular-nums}
.ts-cta-uc-status i{display:grid;place-items:center;width:15px;height:15px;border-radius:99px;background:var(--ts-success);color:var(--ts-bg)}
.ts-cta-uc-url{font-family:var(--ts-font-mono);font-size:13.5px;font-weight:560;line-height:1.3;letter-spacing:-0.01em;overflow-wrap:anywhere}
.ts-cta-uc-note{font-size:12px;color:var(--ts-ink2)}
.ts-cta-uc-go{display:grid;place-items:center;width:30px;height:30px;border-radius:99px;color:var(--ts-ink2);box-shadow:inset 0 0 0 1px var(--ts-line);transition:transform .3s cubic-bezier(.2,.8,.2,1),color .2s}
.ts-cta-fail{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;padding:12px 14px 12px 12px;border-radius:var(--ts-radius-md);background:var(--ts-surface);
  box-shadow:0 0 0 1px color-mix(in srgb,var(--ts-danger) 45%,var(--ts-line));font-family:var(--ts-font);font-size:12.5px;line-height:1.4;color:var(--ts-ink2)}
.ts-cta-fail>svg{grid-row:span 3;color:var(--ts-danger);margin-top:1px}
.ts-cta-fail b{font-size:13.5px;font-weight:620;color:var(--ts-ink)}
.ts-cta-fail code{font-family:var(--ts-font-mono);font-size:12px;color:var(--ts-ink);overflow-wrap:anywhere}
@container ctaterm (max-width:400px){
  .ts-cta-step{grid-template-columns:18px minmax(0,1fr) 4.4ch;min-height:44px;align-items:start;padding-top:6px}
  .ts-cta-mk{margin-top:-1px}
  .ts-cta-st{flex-direction:column;align-items:flex-start;gap:2px}
  .ts-cta-st-d{max-width:100%}
  .ts-cta-st-d:empty::before{content:"\\00a0"}
  .ts-cta-bar{margin:7px 0 9px}
  .ts-cta-run{flex:1 1 100%}
}
@container ctaterm (max-width:350px){.ts-cta-branch{display:none}}

/* ---------- form */
.ts-cta-term,.ts-cta-form{--cta-drop:0 40px 70px -46px color-mix(in srgb,var(--ts-black) 70%,transparent)}
[data-ts-mode=light] .ts-cta-term,[data-ts-mode=light] .ts-cta-form{--cta-drop:0 26px 50px -38px color-mix(in srgb,var(--ts-ink) 28%,transparent)}
.ts-cta-form{position:relative;padding:22px;border-radius:calc(var(--ts-radius-lg) + 2px);background:var(--ts-bg);box-shadow:inset 0 0 0 1px var(--ts-line),var(--cta-drop)}
.ts-cta-ah{margin:-4px;padding:4px}
.ts-cta-ah-in{position:relative}
.ts-cta-label{display:block;margin:0 0 9px;font-size:13px;font-weight:600;color:var(--ts-ink)}
.ts-cta-row{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"in btn" "msg msg";column-gap:8px}
.ts-cta-row>.ts-btn{grid-area:btn}
.ts-cta-form[data-stack] .ts-cta-row{grid-template-columns:minmax(0,1fr);grid-template-areas:"in" "msg" "btn"}
.ts-cta-form[data-stack] .ts-cta-msg{margin:10px 0 14px}
.ts-cta-track{position:relative;display:flex;gap:6px 18px;flex-wrap:wrap;margin:-2px 0 18px;padding:0 0 12px;list-style:none;border-bottom:1px solid var(--ts-line);
  font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ts-ink3);white-space:nowrap}
.ts-cta-track li{display:inline-flex;align-items:center;gap:7px;transition:color .3s}
.ts-cta-track li[data-on]{color:var(--ts-ink2)}
.ts-cta-track li[aria-current=step]{color:var(--ts-ink)}
.ts-cta-track-n{font-variant-numeric:tabular-nums;opacity:.7}
.ts-cta-track-mk{position:absolute;left:0;top:0;height:1.5px;border-radius:2px;background:var(--ts-ink)}
.ts-cta-input{grid-area:in;position:relative;min-width:0;display:flex;align-items:center;gap:10px;height:52px;padding:0 14px;box-sizing:border-box;border-radius:var(--ts-radius-md);
  background:var(--ts-surface);color:var(--ts-ink2);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .2s,opacity .2s}
.ts-cta-input:focus-within{box-shadow:inset 0 0 0 1px var(--ts-ink3);outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-cta-input[data-invalid]{box-shadow:inset 0 0 0 1.5px var(--ts-danger)}
.ts-cta-input[data-busy]{opacity:.6}
.ts-cta-input input{all:unset;flex:1;min-width:0;height:100%;font-family:var(--ts-font);font-size:16px;color:var(--ts-ink)}
.ts-cta-input input::placeholder{color:var(--ts-ink3)}
.ts-cta-input>.ts-cta-warn{color:var(--ts-danger)}
.ts-cta-msg{grid-area:msg;display:flex;align-items:flex-start;gap:8px;min-height:20px;margin:11px 0 0;font-size:13px;line-height:1.45;color:var(--ts-ink2)}
.ts-cta-msg svg{flex:none;margin-top:2px}
.ts-cta-msg[data-err]{color:var(--ts-danger)}
.ts-cta-addr{font-family:var(--ts-font-mono);font-size:12.5px;color:var(--ts-ink3);overflow-wrap:anywhere}
.ts-cta-addr b{font-weight:560;color:var(--ts-ink)}
.ts-cta-addr b[data-empty]{font-weight:400;color:var(--ts-ink3);text-decoration:underline dashed;text-underline-offset:3px}
.ts-cta-sent{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 14px}
.ts-cta-sent-ic{grid-row:span 2;display:grid;place-items:center;width:38px;height:38px;border-radius:99px;background:color-mix(in srgb,var(--ts-success) 16%,transparent);color:var(--ts-success)}
.ts-cta-sent-t{margin:2px 0 0;font-size:18px;font-weight:650;letter-spacing:-0.02em;outline:none}
.ts-cta-sent-b{margin:0;font-size:14px;line-height:1.5;color:var(--ts-ink2);text-wrap:pretty}
.ts-cta-sent-b b{font-weight:600;color:var(--ts-ink);overflow-wrap:anywhere}
.ts-cta-mail{grid-column:1 / -1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;margin-top:14px;padding:11px 12px;border-radius:var(--ts-radius-md);
  background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line),var(--ts-shadow);font-size:13px}
.ts-cta-mail-av{display:grid;place-items:center;width:30px;height:30px;border-radius:99px;background:var(--ts-ink);color:var(--ts-surface)}
.ts-cta-mail-tx{display:flex;flex-direction:column;min-width:0}
.ts-cta-mail-tx b{font-weight:620}
.ts-cta-mail-tx span{color:var(--ts-ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-cta-mail time{align-self:start;font-size:12px;color:var(--ts-ink3)}
.ts-cta-sent-n{grid-column:1 / -1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin:12px 0 0;font-size:13px;color:var(--ts-ink2)}
.ts-cta-textbtn{all:unset;position:relative;cursor:pointer;font-weight:560;color:var(--ts-ink);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--ts-ink) 30%,transparent);text-underline-offset:3px;border-radius:4px}
.ts-cta-textbtn:hover{text-decoration-color:currentColor}
.ts-cta-callout{display:flex;flex-wrap:wrap;align-items:center;gap:2px 12px;margin-top:18px;padding-top:14px;border-top:1px solid var(--ts-line);font-size:13px;color:var(--ts-ink2)}
.ts-cta-callout .ts-cta-link{font-size:13.5px}

/* ---------- field */
.ts-cta-field{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;color:var(--ts-ink);transition:color 1ms}
.ts-cta-target{display:inline-flex;max-width:100%}

/* ---------- stage (640 to 1000) */
@container cta (max-width:1000px){
  .ts-cta-grid{grid-template-columns:minmax(0,1fr) minmax(0,1.22fr);column-gap:clamp(28px,4.4cqw,48px)}
  .ts-cta-actions{margin-top:28px;flex-direction:column;align-items:flex-start;gap:10px}
}
/* ---------- phone: stacked, the CTA at the bottom, full width */
@container cta (max-width:640px){
  .ts-cta-band{padding:30px 18px 22px;border-radius:calc(var(--ts-radius-lg) + 4px)}
  .ts-cta-grid,.ts-cta[data-kind=form] .ts-cta-grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"copy" "panel" "actions" "assure";grid-template-rows:none}
  .ts-cta[data-kind=form] .ts-cta-grid{grid-template-areas:"copy" "panel" "assure"}
  .ts-cta-h{font-size:clamp(32px,10.4cqw,44px)}
  .ts-cta-eyebrow{margin-bottom:16px}
  .ts-cta-sub{margin-top:14px;font-size:15px}
  .ts-cta-panel{margin-top:26px}
  .ts-cta-actions{flex-direction:column;align-items:stretch;gap:6px;margin-top:22px}
  .ts-cta-actions .ts-cta-link{align-self:center;min-height:44px}
  .ts-cta-assure{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px;margin-top:20px}
  .ts-cta-assure li{white-space:normal}
  .ts-cta-form{padding:16px}
  .ts-cta[data-kind=field] .ts-cta-band{min-height:560px;justify-content:flex-start}
  .ts-cta[data-kind=field] .ts-cta-grid{grid-template-columns:minmax(0,1fr);grid-template-areas:"copy" "actions" "assure";grid-template-rows:none}
  .ts-cta[data-kind=field] .ts-cta-actions,.ts-cta[data-kind=field]:not([data-assure]) .ts-cta-actions{grid-row:auto;align-self:stretch;justify-self:stretch;margin-top:150px}
  .ts-cta[data-kind=field] .ts-cta-assure{justify-self:stretch;max-width:none;margin-top:18px;padding-top:16px;border-top:1px solid var(--ts-line)}
}
@media (max-width:640px),(pointer:coarse){
  .ts-cta-link{min-height:44px}
  .ts-cta-link::after{bottom:10px}
  .ts-cta-textbtn::after{content:"";position:absolute;inset:-14px -8px}
  .ts-cta-uc-go{width:36px;height:36px}
}
@media (prefers-reduced-motion:reduce){.ts-cta-spin{animation-duration:2.4s}.ts-cta-link svg,.ts-cta-uc-go{transition:none}}
`;
registerStyles("ts-cta-band", CSS);

/* ------------------------------------------------------------------ the product world: Harbor, preview environments for frontend teams */
const DEFAULT_REASSURANCE = [
  { icon: "check", label: "No card required" },
  { icon: "check", label: "Free for 3 seats" },
  { icon: "check", label: "Cancel in two clicks" },
  { icon: "lock", label: "SOC 2 Type II" },
];
// one real run of `harbor init`, in simulated seconds (`at` = when the step finishes)
const DEFAULT_RUN = [
  { active: "Detecting framework", label: "Next.js 14.2", detail: "pnpm · app router · node 20", at: 3 },
  { active: "Linking repository", label: "Linked tidewater/storefront", detail: "feat/pricing-v2 · 3f9c2a1", at: 6 },
  { active: "Pulling environment", label: "14 variables pulled", detail: "from production, masked", at: 9 },
  { active: "Building", label: "Built 38 routes in 41s", detail: "1.9 MB first load", at: 50,
    build: ["installing 612 packages", "compiling 212 modules", "rendering 38 routes", "optimising 146 images"] },
  { active: "Deploying to the edge", label: "Live in 6 regions", detail: "fra · iad · sfo · +3", at: 56 },
];
const DEFAULT_PREVIEW = {
  path: "~/storefront",
  repo: "tidewater/storefront",
  branch: "feat/pricing-v2",
  url: "pricing-v2--storefront.harbor.page",
  href: "",
  ready: 58,
  budget: 90,
  note: "Comments on · expires when the PR merges",
  claim: "Claim this URL",
  placeholder: "Your preview URL lands here.",
  run: "Run it here",
  skip: "Skip to the end",
  again: "Run again",
  readyLabel: "Ready in",
  failure: { label: "Build stopped at 64%", detail: "NEXT_PUBLIC_MAPS_KEY is not set for previews", fix: "harbor env copy production --to preview" },
};
const DEFAULT_FORM = {
  steps: ["Email", "Repo", "Preview URL"],
  label: "Work email",
  placeholder: "you@yourteam.com",
  example: "ada@northwind.dev",
  domain: "harbor.page",
  addressLabel: "Your team gets",
  addressPlaceholder: "your-team",
  sentTitle: "Check your inbox",
  sentBody: "We sent a link to {email}. It opens Harbor with {address} held for you and your repos ready to pick.",
  sentNext: "The link works for 30 minutes, on any device.",
  mailFrom: "Harbor",
  mailSubject: "Your preview link is waiting",
  change: "Use a different address",
  failed: "We could not send the link. Try again in a moment.",
  callout: "Rather talk it through first?",
  required: "Enter your work email and we will send the link there.",
  formLabel: "Get a sign-in link",
};
const DEFAULT_HEADLINE = "Your first preview URL in 90 seconds.";
const DEFAULT_SUBLINE = "Point Harbor at one repo. Every pull request after that gets a live address of its own, and reviewers comment on the pixels they mean instead of on screenshots.";
const SAMPLE = {
  headline: DEFAULT_HEADLINE, subline: DEFAULT_SUBLINE, primaryLabel: "Get your preview URL", secondaryLabel: "Talk to an engineer",
  eyebrow: "Harbor · preview environments", reassurance: DEFAULT_REASSURANCE, command: "npx harbor init", run: DEFAULT_RUN,
};
const EMPTY = { headline: "", subline: "", primaryLabel: "", secondaryLabel: "", eyebrow: "", reassurance: [], command: "", run: [] };
// what a caller's partial `preview` and `form` merge over when demo is off: neutral control words, no sample copy
const NEUTRAL_PREVIEW = {
  path: "", repo: "", branch: "", url: "", href: "", ready: undefined, budget: undefined, note: "", claim: "", placeholder: "",
  run: "Run it here", skip: "Skip to the end", again: "Run again", readyLabel: "Ready in", failure: { label: "", detail: "", fix: "" },
};
const NEUTRAL_FORM = {
  steps: [], label: "Email", placeholder: "", example: "name@example.com", domain: "", addressLabel: "", addressPlaceholder: "", hint: "",
  required: "Enter your email address.", sentTitle: "Thanks. Check your inbox.", sentBody: "", sentNext: "", mailFrom: "", mailSubject: "",
  change: "Use a different address", failed: "We could not send that. Try again in a moment.", callout: "", formLabel: "", name: "email",
};
const PERSONAL = new Set(["gmail", "googlemail", "outlook", "hotmail", "live", "icloud", "me", "yahoo", "proton", "protonmail", "pm", "hey", "aol", "gmx", "fastmail", "mail"]);
const KINDS = ["terminal", "form", "field"];

const ENTRANCE = { type: "spring", stiffness: 90, damping: 16 };
const SNAPPY = { type: "spring", stiffness: 420, damping: 34 };
const SETTLE = { type: "spring", stiffness: 220, damping: 24 };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (v, a, b) => (b > a ? clamp((v - a) / (b - a)) : v >= b ? 1 : 0);
const smooth = (t) => t * t * (3 - 2 * t);
const clock = (s) => { const n = Math.max(0, Math.floor(s)); return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); };
// a build never runs at one speed: quick install, slow compile, quick finish (monotonic)
const buildCurve = (p) => clamp(p + 0.07 * Math.sin(p * Math.PI * 2));

function rng(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
/** A QR-like 21x21 mark generated from the URL: three finder squares, timing lines, seeded modules. One path per row. */
function qrRows(seed) {
  const N = 21, r = rng(seed), g = Array.from({ length: N }, () => Array(N).fill(0));
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inFinder(x, y)) continue;
    g[y][x] = x === 6 || y === 6 ? ((x + y) % 2 === 0 ? 1 : 0) : r() < 0.46 ? 1 : 0;
  }
  for (const [ox, oy] of [[0, 0], [N - 7, 0], [0, N - 7]])
    for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < 7; dx++) {
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      g[oy + dy][ox + dx] = ring === 3 || ring <= 1 ? 1 : 0;
    }
  return g.map((row, y) => {
    let d = "";
    for (let x = 0; x < N; x++) {
      if (!row[x]) continue;
      let e = x;
      while (e + 1 < N && row[e + 1]) e++;
      d += `M${x} ${y}h${e - x + 1}v1h${-(e - x + 1)}z`;
      x = e;
    }
    return d;
  });
}
function checkEmail(v, F) {
  const s = v.trim();
  const ex = F?.example || "name@example.com", exDomain = ex.split("@")[1] || "example.com";
  if (!s) return F?.required || "Enter your email address.";
  if (/\s/.test(s)) return "Email addresses can't contain spaces.";
  const parts = s.split("@");
  if (parts.length === 1) return `An email needs an @, like ${ex}.`;
  if (parts.length > 2) return "Only one @, please.";
  const [local, domain] = parts;
  if (!local) return "Add the part before the @.";
  if (!domain) return `Add your domain after the @, like ${exDomain}.`;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(domain)) return "Add the domain ending, like .dev or .com.";
  return null;
}
/** The workspace address an email implies: the company domain, or the name for personal mail. */
function slugOf(v) {
  const s = v.trim().toLowerCase(), at = s.indexOf("@");
  if (at < 1) return "";
  const local = s.slice(0, at), host = s.slice(at + 1).split(".")[0];
  const base = !host || PERSONAL.has(host) ? local : host;
  return base.replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
}
function fillTokens(text, tokens) {
  return String(text).split(/(\{\w+\})/).map((part, i) => {
    const k = part.match(/^\{(\w+)\}$/)?.[1];
    return k && k in tokens ? <b key={i}>{tokens[k]}</b> : part;
  });
}

/* ------------------------------------------------------------------ shared pieces */
const Mark = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M5 2.5v10M15 2.5v10M5 7.5h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M2.5 16.4c1.25 0 1.25-1.1 2.5-1.1s1.25 1.1 2.5 1.1 1.25-1.1 2.5-1.1 1.25 1.1 2.5 1.1 1.25-1.1 2.5-1.1 1.25 1.1 2.5 1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Rise({ as = "div", i = 0, seen, reduce, className, children, ...rest }) {
  const M = motion[as];
  return (
    <M className={className} initial={reduce ? false : { opacity: 0, y: 18 }} animate={seen || reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...ENTRANCE, delay: 0.04 + i * 0.06 }} {...rest}>
      {children}
    </M>
  );
}

// the first number with its unit ("90 seconds", "3 minutes", "40%") is the promise: it gets a tide line under it
const PROMISE = /\d[\d.,:]*(?:\s?(?:seconds?|secs?|minutes?|mins?|hours?|days?|ms|s|%|×))?(?=[\s.,!?;:]|$)/i;
/** A tide line under the promise, drawn in real pixels for the measured width (so the draw-on stays exact). */
function Tide({ seen, reduce }) {
  const ref = useRef(null);
  const w = useWidth(ref);
  const d = useMemo(() => {
    if (w < 8) return "";
    const n = Math.max(2, Math.round((w - 4) / 22)), step = (w - 4) / n;
    let p = "M2 5";
    for (let i = 0; i < n; i++) { const x = 2 + i * step; p += `Q${(x + step / 4).toFixed(1)} 1.6 ${(x + step / 2).toFixed(1)} 5T${(x + step).toFixed(1)} 5`; }
    return p;
  }, [w]);
  return (
    <svg ref={ref} className="ts-cta-tide" viewBox={`0 0 ${Math.max(1, w)} 10`} aria-hidden>
      {d ? <motion.path d={d} initial={reduce ? false : { pathLength: 0 }} animate={seen || reduce ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.65, 0, 0.35, 1] }} /> : null}
    </svg>
  );
}
function Headline({ Tag, id, text, seen, reduce }) {
  const m = String(text).match(PROMISE);
  if (!m) return <Tag id={id} className="ts-cta-h">{text}</Tag>;
  const a = text.slice(0, m.index), b = m[0], c = text.slice(m.index + b.length);
  return (
    <Tag id={id} className="ts-cta-h">
      {a}
      <span className="ts-cta-promise">
        {b}
        <Tide seen={seen} reduce={reduce} />
      </span>
      {c}
    </Tag>
  );
}

/** The brand mark slot: your node; with demo the sample mark when left alone; nothing when null. */
const logoOr = (logo, size) => (logo === SAMPLE_LOGO ? <Mark size={size} /> : logo ?? null);
const SAMPLE_LOGO = { sample: "harbor" };

function Copy({ Tag, hid, eyebrow, logo, headline, subline, seen, reduce }) {
  return (
    <div className="ts-cta-copy">
      {eyebrow ? <Rise as="p" i={0} seen={seen} reduce={reduce} className="ts-cta-eyebrow">{logoOr(logo, 15)}{eyebrow}</Rise> : null}
      {headline ? <Rise i={1} seen={seen} reduce={reduce}><Headline Tag={Tag} id={hid} text={headline} seen={seen} reduce={reduce} /></Rise> : null}
      {subline ? <Rise as="p" i={2} seen={seen} reduce={reduce} className="ts-cta-sub">{subline}</Rise> : null}
    </div>
  );
}

function SecondaryLink({ label, href, onSecondary, disabled }) {
  if (!label) return null;
  if (disabled) {
    return (
      <a className="ts-cta-link" role="link" aria-disabled="true" onClick={(e) => e.preventDefault()}>
        {label}<Icon name="arrowRight" size={15} stroke={2} />
      </a>
    );
  }
  return (
    <a className="ts-cta-link" href={href || "#"} onClick={(e) => { if (onSecondary) { e.preventDefault(); onSecondary(e); } else if (!href) e.preventDefault(); }}>
      {label}<Icon name="arrowRight" size={15} stroke={2} />
    </a>
  );
}

function Assure({ items, show, seen, reduce, i = 5 }) {
  if (!show || !items?.length) return null;
  return (
    <Rise as="ul" i={i} seen={seen} reduce={reduce} className="ts-cta-assure" aria-label="What you get">
      {items.map((it, k) => <li key={k}><Icon name={it.icon || "check"} size={14} stroke={2.2} />{it.label}</li>)}
    </Rise>
  );
}

/** Height follows the content on a spring (the form morphs between entry and confirmation without a jump). */
function AutoHeight({ reduce, children }) {
  const inner = useRef(null);
  const [h, setH] = useState("auto");
  const [moving, setMoving] = useState(false); // clip only while the height moves, so shadows and focus rings are never cut
  useIsoLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <motion.div className="ts-cta-ah" initial={false} animate={{ height: h }} transition={reduce ? { duration: 0 } : SETTLE}
      onAnimationStart={() => setMoving(true)} onAnimationComplete={() => setMoving(false)} style={{ overflow: moving ? "hidden" : "visible" }}>
      <div ref={inner} className="ts-cta-ah-in">{children}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ terminal: the CTA runs `harbor init` */
function QrMark({ seed, size, reveal, reduce }) {
  const rows = useMemo(() => qrRows(seed), [seed]);
  return (
    <svg className="ts-cta-qr" viewBox="0 0 21 21" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      {rows.map((d, r) => d && (
        <motion.path key={r} d={d} initial={reveal && !reduce ? { opacity: 0 } : false} animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.12 + r * 0.02 }} />
      ))}
    </svg>
  );
}

function UrlBody({ P, size, reveal, reduce }) {
  if (!P.url) return null;
  const dot = P.url.indexOf(".");
  const head = dot > 0 ? P.url.slice(0, dot) : P.url, tail = dot > 0 ? P.url.slice(dot) : "";
  return (
    <>
      <QrMark seed={P.url} size={size} reveal={reveal} reduce={reduce} />
      <span className="ts-cta-uc-main">
        <span className="ts-cta-uc-status"><i><Icon name="check" size={10} stroke={3.4} /></i>{P.readyLabel} {clock(P.ready)}</span>
        <span className="ts-cta-uc-url">{head}<wbr />{tail}</span>
        {P.note ? <span className="ts-cta-uc-note">{P.note}</span> : null}
      </span>
      <span className="ts-cta-uc-go"><Icon name="arrowRight" size={16} stroke={2} /></span>
    </>
  );
}

function FailBody({ f }) {
  return (
    <>
      <Icon name="alert" size={18} stroke={2} />
      <b>{f.label}</b>
      <span>{f.detail}</span>
      {f.fix ? <code>$ {f.fix}</code> : null}
    </>
  );
}

function TerminalCta({ s, logo, command, run, preview, speed, primaryLabel, secondaryLabel, secondaryHref, onPrimary, onSecondary, onReady }) {
  const { reduce, force, phone, seen, Tag, hid, copy, assure, demo, disabled, loading } = s;
  const base = demo ? DEFAULT_PREVIEW : NEUTRAL_PREVIEW;
  const P0 = { ...base, ...preview, failure: { ...base.failure, ...preview?.failure } };
  const steps = Array.isArray(run) ? run : [];
  const lastAt = steps.length ? steps[steps.length - 1].at : 0;
  const P = { ...P0, ready: P0.ready ?? lastAt };
  const total = Math.max(P.ready ?? 0, lastAt);
  const budget = Math.max(P.budget ?? (demo ? 90 : total), total);
  const hasPanel = !!command || steps.length > 0;
  const bi = steps.findIndex((x) => x.build?.length);
  const bStart = bi > 0 ? steps[bi - 1].at : 0, bEnd = bi >= 0 ? steps[bi].at : 0;

  const t = useMotionValue(0);
  const raf = useRef(0), timer = useRef(null);
  const stopRun = () => { cancelAnimationFrame(raf.current); raf.current = 0; };
  const [phase, setPhase] = useState("idle"); // idle | running | done | failed
  const [flash, setFlash] = useState(false);
  const [k, setK] = useState(0);
  const [sub, setSub] = useState(0);
  const kRef = useRef(0), subRef = useRef(0), clockRef = useRef(null), pctRef = useRef(null);

  const doneCount = (v) => { let n = 0; for (const x of steps) { if (v >= x.at) n++; else break; } return n; };
  const buildP = (v) => (bi < 0 ? 0 : buildCurve(ramp(v, bStart, bEnd)));
  const pct = (v) => Math.round(buildP(v) * 100) + "%";
  const sync = (v) => {
    const n = doneCount(v);
    if (n !== kRef.current) { kRef.current = n; setK(n); }
    if (bi >= 0) {
      const list = steps[bi].build, si = Math.min(list.length - 1, Math.floor(buildP(v) * list.length));
      if (si !== subRef.current) { subRef.current = si; setSub(si); }
      if (pctRef.current) pctRef.current.textContent = pct(v);
    }
    if (clockRef.current) clockRef.current.textContent = clock(v);
  };
  useMotionValueEvent(t, "change", sync);
  const budgetX = useTransform(t, (v) => clamp(v / budget));
  const barX = useTransform(t, buildP);

  const finish = () => {
    setPhase("done");
    setFlash(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFlash(false), 950);
    onReady?.({ url: P.url || undefined });
  };
  // the run is its own clock (not a Motion tween), so it plays even where Motion animations are globally skipped
  const start = () => {
    if (force) return;
    stopRun();
    clearTimeout(timer.current);
    setFlash(false);
    if (reduce) { t.set(total); sync(total); setPhase("done"); return; }
    t.set(0); sync(0);
    setPhase("running");
    const t0 = performance.now(), ms = (total / Math.max(1, speed)) * 1000;
    const step = (now) => {
      const v = Math.min(total, ((now - t0) / ms) * total);
      t.set(v);
      if (v < total) raf.current = requestAnimationFrame(step);
      else { raf.current = 0; finish(); }
    };
    raf.current = requestAnimationFrame(step);
  };
  const skip = () => { stopRun(); t.set(total); sync(total); finish(); };

  // forced states freeze a believable moment; reduced motion shows the finished run
  useEffect(() => {
    stopRun();
    clearTimeout(timer.current);
    setFlash(false);
    let v = 0, ph = "idle";
    if (force === "loading") { v = bi >= 0 ? bStart + 0.56 * (bEnd - bStart) : total * 0.5; ph = "running"; }
    else if (force === "success" || (!force && reduce)) { v = total; ph = "done"; }
    else if (force === "error") { v = bi >= 0 ? bStart + 0.64 * (bEnd - bStart) : total * 0.5; ph = "failed"; }
    t.set(v); sync(v); setPhase(ph);
  }, [force, reduce]);
  useEffect(() => () => { stopRun(); clearTimeout(timer.current); }, []);

  const running = phase === "running", ready = phase === "done", failed = phase === "failed";
  const ctl = running ? ["skip", P.skip, "skipForward"] : ready || failed ? ["again", P.again, "refresh"] : ["run", P.run, "play"];
  const qr = phone ? 58 : 66;
  const sr = running ? (P.repo ? `Deploying ${P.repo} to a preview` : "Running") : ready && !reduce && !force ? (P.url ? `Preview ready at ${P.url}, ${clock(P.ready)}` : "Done") : failed ? `${P.failure.label}. ${P.failure.detail}` : "";

  const panel = !hasPanel ? null : (
    <Rise i={3} seen={seen} reduce={reduce} className="ts-cta-panel">
      <div className="ts-cta-term" role="group" aria-label={P.repo ? `Try it: deploy ${P.repo} to a preview URL` : "Try it"}>
        <div className="ts-cta-tbar">
          <span className="ts-cta-tpath">{logoOr(logo, 14)}{P.path}</span>
          {P.branch ? <span className="ts-cta-branch">{P.branch}</span> : null}
          <span className="ts-cta-clock">
            <AnimatePresence initial={false}>
              {running && <motion.span key="spd" className="ts-cta-speed" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                title={`Replaying a real run at ${speed} times speed`}>{speed}×</motion.span>}
            </AnimatePresence>
            <span aria-label={`Elapsed time against the ${Math.round(budget)} second budget`}><b ref={clockRef}>{clock(t.get())}</b> / {clock(budget)}</span>
          </span>
          <motion.span className="ts-cta-budget" style={{ scaleX: budgetX }} aria-hidden />
        </div>

        <div className="ts-cta-cmd">
          {command ? <CopyButton value={command} prompt="$" disabled={disabled} /> : null}
          {!reduce && steps.length > 0 && (
            <span className="ts-cta-run">
              <span className="ts-cta-run-sz" aria-hidden><span>{P.run}</span><span>{P.skip}</span><span>{P.again}</span></span>
              <Button label={ctl[1]} variant="secondary" size="sm" fullWidth simulate={false} icon={<Icon name={ctl[2]} size={15} stroke={2} />}
                onClick={running ? skip : start} disabled={!!force || disabled} />
            </span>
          )}
        </div>

        <ol className="ts-cta-steps" aria-label="Deploy steps">
          {steps.map((x, i) => {
            const st = i < k ? "done" : i === k && running ? "active" : i === k && failed ? "failed" : "pending";
            const isBuild = i === bi;
            const text = st === "done" ? x.label : x.active;
            const detail = st === "done" ? x.detail : st === "failed" ? P.failure.detail : st === "active" && isBuild ? x.build[sub] : "";
            return (
              <li key={i} className="ts-cta-step" data-s={st}>
                <span className="ts-cta-mk" aria-hidden>
                  <AnimatePresence initial={false}>
                    <motion.span key={st} className="ts-cta-mk-in" initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3 }} transition={SNAPPY}>
                      {st === "done" ? <Icon name="check" size={14} stroke={2.8} /> : st === "failed" ? <Icon name="x" size={14} stroke={2.8} />
                        : st === "active" ? <i className="ts-cta-spin" /> : <i className="ts-cta-dot" />}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="ts-cta-st">
                  <span className="ts-cta-st-l">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={text} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -9 }} transition={SNAPPY}>{text}</motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="ts-cta-st-d">{st === "active" && isBuild ? <>{detail} <b ref={pctRef}>{pct(t.get())}</b></> : detail}</span>
                </span>
                <time className="ts-cta-st-t">{st === "done" ? clock(x.at) : ""}</time>
                {isBuild && <span className="ts-cta-bar" data-s={st} aria-hidden><motion.i style={{ scaleX: barX }} /></span>}
              </li>
            );
          })}
        </ol>

        {steps.length > 0 && (P.url || P.placeholder || P.failure.label) ? <div className="ts-cta-url">
          {P.url ? <div className="ts-cta-urlcard" aria-hidden style={{ visibility: "hidden" }}><UrlBody P={P} size={qr} /></div> : null}
          {P.failure.label ? <div className="ts-cta-fail" aria-hidden style={{ visibility: "hidden" }}><FailBody f={P.failure} /></div> : null}
          <AnimatePresence initial={false}>
            {ready && P.url ? (
              <motion.a key="card" className="ts-cta-urlcard" href={P.href || "#"} aria-label={`Open the preview at ${P.url}`}
                onClick={(e) => { if (!P.href) e.preventDefault(); }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={SETTLE}>
                <UrlBody P={P} size={qr} reveal reduce={reduce} />
              </motion.a>
            ) : failed && P.failure.label ? (
              <motion.div key="fail" className="ts-cta-fail" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SETTLE}>
                <FailBody f={P.failure} />
              </motion.div>
            ) : !ready && !failed && P.placeholder ? (
              <motion.div key="ghost" className="ts-cta-ghost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <span className="ts-cta-ghost-qr" style={{ width: qr, height: qr }} aria-hidden />
                <span>{P.placeholder}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div> : null}
        <span className="ts-sr" aria-live="polite">{sr}</span>
      </div>
    </Rise>
  );

  return (
    <div className="ts-cta-grid">
      {copy}
      {panel}
      {primaryLabel || secondaryLabel || (ready && P.claim) ? (
        <Rise i={4} seen={seen} reduce={reduce} className="ts-cta-actions">
          {primaryLabel || (ready && P.claim) ? (
            <Button label={ready && P.claim ? P.claim : primaryLabel} size="lg" fullWidth={phone} loading={running || loading} success={flash} simulate={false} disabled={disabled}
              onClick={() => { if (disabled || loading) return; if (onPrimary) onPrimary(ready ? { url: P.url || undefined } : {}); else if (phase === "idle" && steps.length) start(); }} />
          ) : null}
          <SecondaryLink label={secondaryLabel} href={secondaryHref} onSecondary={onSecondary} disabled={disabled} />
        </Rise>
      ) : null}
      {assure}
    </div>
  );
}

/** Where this form sits in sign-up: a marker slides to the next step when the link is sent. */
function Track({ steps, at, reduce }) {
  const refs = useRef([]);
  const [box, setBox] = useState(null);
  useIsoLayoutEffect(() => {
    const measure = () => { const el = refs.current[at]; if (el) setBox({ x: el.offsetLeft, y: el.offsetTop + el.offsetHeight + 12, w: el.offsetWidth }); };
    measure();
    const ro = new ResizeObserver(measure);
    refs.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [at, steps.length]);
  return (
    <ol className="ts-cta-track" aria-label="Sign-up steps">
      {steps.map((label, i) => (
        <li key={i} ref={(el) => { refs.current[i] = el; }} data-on={i <= at ? "" : undefined} aria-current={i === at ? "step" : undefined}>
          <span className="ts-cta-track-n">{String(i + 1).padStart(2, "0")}</span>{label}
        </li>
      ))}
      {box && <motion.span className="ts-cta-track-mk" aria-hidden initial={false} animate={{ x: box.x, y: box.y, width: box.w }} transition={reduce ? { duration: 0 } : SETTLE} />}
    </ol>
  );
}

/* ------------------------------------------------------------------ form: an email that turns into the next step */
function FormCta({ s, logo, form, primaryLabel, secondaryLabel, secondaryHref, onSecondary, onSubmit, email: emailProp, defaultEmail, onEmailChange, error: errorProp, sent: sentProp }) {
  const { reduce, force, phone, seen, copy, assure, demo, disabled, loading, hid } = s;
  const F = { ...(demo ? DEFAULT_FORM : NEUTRAL_FORM), ...form };
  const uid = useId().replace(/:/g, "");
  const inId = "cti" + uid, msgId = "ctm" + uid;
  const inputRef = useRef(null), sentRef = useRef(null), alive = useRef(true), timers = useRef([]), formRef = useRef(null);
  const formW = useWidth(formRef);
  const stack = phone || (formW > 0 && formW < 500);
  const [emailOwn, setEmailOwn] = useState(defaultEmail ?? "");
  const email = emailProp !== undefined ? emailProp ?? "" : emailOwn;
  const setEmail = (v) => { if (emailProp === undefined) setEmailOwn(v); onEmailChange?.(v); };
  const [status, setStatusOwn] = useState("idle"); // idle | submitting | done | sent
  const [error, setError] = useState(null);
  const owned = sentProp !== undefined;          // you own success: `sent` decides the confirmation
  const setStatus = (x) => setStatusOwn(owned && (x === "done" || x === "sent") ? "idle" : x);
  useEffect(() => () => { alive.current = false; timers.current.forEach(clearTimeout); }, []);

  const bad = F.example.split(".")[0];
  const fx = force === "loading" ? { email: F.example, status: "submitting", error: null }
    : force === "success" ? { email: F.example, status: "sent", error: null }
    : force === "error" ? { email: bad, status: "idle", error: checkEmail(bad, F) }
    : null;
  const live = owned ? (sentProp ? "sent" : loading || status === "submitting" ? "submitting" : "idle") : loading && status === "idle" ? "submitting" : status;
  const em = fx ? fx.email : email, st = fx ? fx.status : live, err = fx ? fx.error : errorProp || error;
  const busy = st === "submitting" || st === "done";
  const slug = slugOf(em);

  useEffect(() => { if (st === "sent" && !fx && (status === "sent" || owned)) sentRef.current?.focus({ preventScroll: true }); }, [st]);

  const submit = async (e) => {
    e.preventDefault();
    if (fx || st !== "idle" || status !== "idle" || disabled) return;
    const msg = checkEmail(email, F);
    if (msg) { setError(msg); inputRef.current?.focus(); return; }
    setError(null);
    if (!onSubmit && !demo) return;              // nowhere to send it: never claim success on our own
    setStatus("submitting");
    try {
      if (onSubmit) await onSubmit(email.trim());
      else await new Promise((r) => timers.current.push(setTimeout(r, 1300)));
      if (!alive.current) return;
      if (owned) { setStatusOwn("idle"); return; }
      setStatus("done");
      timers.current.push(setTimeout(() => alive.current && setStatus("sent"), reduce ? 350 : 800));
    } catch (x) {
      if (!alive.current) return;
      setStatus("idle");
      setError((onSubmit && x?.message) || F.failed);
    }
  };
  const reset = () => {
    setStatus("idle");
    setError(null);
    timers.current.push(setTimeout(() => { const el = inputRef.current; if (el) { el.focus(); el.select(); } }, 30));
  };
  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 12, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.98 } };

  const panel = (
    <Rise i={3} seen={seen} reduce={reduce} className="ts-cta-panel">
      <form ref={formRef} className="ts-cta-form" data-stack={stack ? "" : undefined} noValidate onSubmit={submit} aria-label={F.formLabel || undefined} aria-labelledby={F.formLabel ? undefined : s.hasHeadline ? hid : undefined}>
        {F.steps?.length ? <Track steps={F.steps} at={st === "sent" ? Math.min(1, F.steps.length - 1) : 0} reduce={reduce} /> : null}
        <AutoHeight reduce={reduce}>
          <AnimatePresence mode="popLayout" initial={false}>
            {st === "sent" ? (
              <motion.div key="sent" className="ts-cta-sent" {...swap} transition={SETTLE}>
                <motion.span className="ts-cta-sent-ic" initial={reduce ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.08 }}>
                  <Icon name="check" size={19} stroke={2.6} />
                </motion.span>
                <p className="ts-cta-sent-t" tabIndex={-1} ref={(el) => { if (el) sentRef.current = el; }}>{F.sentTitle}</p>
                {F.sentBody ? <p className="ts-cta-sent-b">{fillTokens(F.sentBody, { email: em, address: `${slug || F.addressPlaceholder}.${F.domain}` })}</p> : null}
                {F.mailFrom ? (
                  <motion.div className="ts-cta-mail" aria-hidden initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SETTLE, delay: 0.25 }}>
                    <span className="ts-cta-mail-av">{logoOr(logo, 16)}</span>
                    <span className="ts-cta-mail-tx"><b>{F.mailFrom}</b><span>{F.mailSubject}</span></span>
                    <time>now</time>
                  </motion.div>
                ) : null}
                <p className="ts-cta-sent-n">{F.sentNext}{owned ? null : <button type="button" className="ts-cta-textbtn" onClick={reset} disabled={!!fx || disabled} data-off={disabled ? "" : undefined}>{F.change}</button>}</p>
              </motion.div>
            ) : (
              <motion.div key="entry" {...swap} transition={SETTLE}>
                <label htmlFor={inId} className="ts-cta-label">{F.label}</label>
                <div className="ts-cta-row">
                  <span className="ts-cta-input" data-invalid={err ? "" : undefined} data-busy={busy ? "" : undefined} data-disabled={disabled ? "" : undefined}>
                    <Icon name="mail" size={17} />
                    <input ref={(el) => { if (el) inputRef.current = el; }} id={inId} name={F.name || "email"} type="email" autoComplete="email" inputMode="email" required
                      autoCapitalize="off" spellCheck={false} placeholder={F.placeholder} value={em} readOnly={busy || !!fx} disabled={disabled}
                      aria-invalid={err ? true : undefined} aria-describedby={msgId}
                      onChange={(e) => { const v = e.target.value; setEmail(v); if (error) setError(checkEmail(v, F)); }}
                      onBlur={(e) => { const v = e.target.value; if (v.trim() && status === "idle") setError(checkEmail(v, F)); }} />
                    {err ? <Icon name="alert" size={17} stroke={2} className="ts-cta-warn" /> : null}
                  </span>
                  <Button type="submit" label={primaryLabel || "Submit"} size="lg" fullWidth={stack} loading={st === "submitting"} success={st === "done"} simulate={false} disabled={disabled} />
                  <p className="ts-cta-msg" id={msgId} data-err={err ? "" : undefined}>
                    {err ? <><Icon name="alert" size={14} stroke={2.2} />{err}</>
                      : F.domain ? <><Icon name="globe" size={14} /><span>{F.addressLabel} <span className="ts-cta-addr"><b data-empty={slug ? undefined : ""}>{slug || F.addressPlaceholder}</b>.{F.domain}</span></span></>
                      : F.hint ? <span>{F.hint}</span> : null}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AutoHeight>
        <span className="ts-sr" aria-live="assertive">{err || ""}</span>
        {secondaryLabel ? (
          <div className="ts-cta-callout">{F.callout}<SecondaryLink label={secondaryLabel} href={secondaryHref} onSecondary={onSecondary} disabled={disabled} /></div>
        ) : null}
      </form>
    </Rise>
  );

  return (
    <div className="ts-cta-grid">
      {copy}
      {panel}
      {assure}
    </div>
  );
}

/* ------------------------------------------------------------------ field: lines that lean toward the button */
function FieldCanvas({ bandRef, targetRef, focusRef, quietRefs, reduce, hold, apiRef }) {
  const ref = useRef(null);
  const S = useRef({ p: 0, v: 0, raf: 0, last: 0, visible: true, hover: 0, focus: false, scroll: 0, surge: -1e9, hold: false, lines: [], w: 0, h: 0, dpr: 1, B: null, ink: "", redraw: null, kick: null });
  S.current.hold = hold;

  useEffect(() => {
    const c = ref.current, band = bandRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !band || !ctx) return;
    const s = S.current;
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const REST = 0.42; // reduced motion: a still field that already leans toward the button
    const NB = 12, AMAX = 0.52, PI = Math.PI, HALF = PI / 2;

    const measureTarget = () => {
      const br = band.getBoundingClientRect(), tr = targetRef.current?.getBoundingClientRect();
      s.B = tr && tr.width ? { x: tr.left - br.left + tr.width / 2, y: tr.top - br.top + tr.height / 2, rw: tr.width / 2, rh: tr.height / 2 } : { x: br.width * 0.72, y: br.height / 2, rw: 80, rh: 26 };
    };
    const layout = () => {
      const br = band.getBoundingClientRect();
      const w = br.width, h = br.height;
      if (!w || !h) return;
      s.w = w; s.h = h; s.dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * s.dpr); c.height = Math.round(h * s.dpr);
      measureTarget();
      const boxOf = (el) => (el && getComputedStyle(el).display === "contents" ? el.firstElementChild : el);
      const rects = quietRefs.map((r) => boxOf(r.current)?.getBoundingClientRect()).filter((q) => q && q.width)
        .map((q) => ({ l: q.left - br.left, t: q.top - br.top, r: q.right - br.left, b: q.bottom - br.top }));
      const sp = clamp(w / 34, 19, 28);
      const lines = [];
      let row = 0;
      for (let y = sp * 0.55; y < h; y += sp * 0.8, row++) {
        for (let x = (row % 2 ? sp * 0.5 : 0) + sp * 0.4; x < w; x += sp) {
          const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
          const edge = smooth(clamp(Math.min(x, w - x, y, h - y) / 40));
          let q = 1;
          for (const R of rects) {
            const dx = Math.max(R.l - x, 0, x - R.r), dy = Math.max(R.t - y, 0, y - R.b);
            q = Math.min(q, 0.1 + 0.9 * smooth(clamp(Math.hypot(dx, dy) / 64)));
          }
          lines.push({ x, y, wy: Math.sin(x * 0.021 + row * 0.9) * 2.4, a0: Math.sin(x * 0.013 + y * 0.031) * 0.24, len: sp * (0.3 + 0.24 * Math.abs(n)), m: edge * q });
        }
      }
      s.lines = lines;
      s.ink = getComputedStyle(c).color;
      draw();
    };
    const draw = () => {
      const { w, h, dpr, B } = s;
      if (!w || !B) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = s.ink;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.5;
      const P = reduce ? REST : s.p;
      const sig = Math.max(w, h) * (0.26 + 0.2 * Math.min(1, P));
      const inv = 1 / (2 * sig * sig);
      const buckets = Array.from({ length: NB }, () => []);
      for (const L of s.lines) {
        if (L.m < 0.02) continue;
        const dx = B.x - L.x, dy = B.y - L.y, d = Math.hypot(dx, dy) || 1;
        const wgt = Math.min(1.3, P) * Math.exp(-d * d * inv), wc = Math.min(1, wgt);
        const mv = Math.min(d * 0.2, 30) * wgt;
        const x = L.x + (dx / d) * mv, y = L.y + L.wy * (1 - wc) + (dy / d) * mv;
        let th = Math.atan2(dy, dx);
        if (th > HALF) th -= PI; else if (th < -HALF) th += PI;
        const ang = L.a0 + (th - L.a0) * wc, len = L.len * (1 + 0.75 * wc);
        const ex = Math.max(0, Math.abs(x - B.x) - B.rw), ey = Math.max(0, Math.abs(y - B.y) - B.rh);
        const q = smooth(clamp((Math.hypot(ex, ey) - 10) / 48));
        const a = (0.13 + 0.39 * wc) * L.m * q;
        if (a < 0.015) continue;
        const hx = (Math.cos(ang) * len) / 2, hy = (Math.sin(ang) * len) / 2;
        buckets[Math.min(NB - 1, Math.floor((a / AMAX) * NB))].push(x - hx, y - hy, x + hx, y + hy);
      }
      for (let i = 0; i < NB; i++) {
        const b = buckets[i];
        if (!b.length) continue;
        ctx.globalAlpha = ((i + 0.5) / NB) * AMAX;
        ctx.beginPath();
        for (let j = 0; j < b.length; j += 4) { ctx.moveTo(b[j], b[j + 1]); ctx.lineTo(b[j + 2], b[j + 3]); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const target = (now) => (s.hold ? 1 : now - s.surge < 650 ? 1.3 : Math.max(s.focus ? 1 : 0, coarse ? s.scroll : s.hover));
    const tick = (now) => {
      s.raf = 0;
      const dt = Math.min(0.034, Math.max(0.001, (now - s.last) / 1000));
      s.last = now;
      const T = target(now);
      s.v += (60 * (T - s.p) - 13 * s.v) * dt;
      s.p += s.v * dt;
      if (now - s.surge >= 650 && Math.abs(T - s.p) < 0.002 && Math.abs(s.v) < 0.002) { s.p = T; s.v = 0; draw(); return; } // settled: the loop stops
      draw();
      if (s.visible) s.raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (reduce || s.raf || !s.visible) return; measureTarget(); s.last = performance.now(); s.raf = requestAnimationFrame(tick); };
    s.kick = kick;
    s.redraw = () => { s.ink = getComputedStyle(c).color; draw(); };
    apiRef.current = { surge: () => { s.surge = performance.now(); kick(); } };

    const ro = new ResizeObserver(() => layout());
    ro.observe(band);
    const rt = new ResizeObserver(() => { measureTarget(); draw(); kick(); });
    if (targetRef.current) rt.observe(targetRef.current);
    layout();
    if (reduce) return () => { ro.disconnect(); rt.disconnect(); };

    const onMove = (e) => {
      if (!s.visible || coarse || e.pointerType === "touch" || !s.B) return;
      const br = band.getBoundingClientRect();
      const x = e.clientX - br.left, y = e.clientY - br.top;
      const inside = x >= 0 && y >= 0 && x <= br.width && y <= br.height;
      const ex = Math.max(0, Math.abs(x - s.B.x) - s.B.rw), ey = Math.max(0, Math.abs(y - s.B.y) - s.B.rh);
      const next = inside ? smooth(clamp(1 - Math.hypot(ex, ey) / Math.max(240, br.width * 0.46))) : 0;
      if (Math.abs(next - s.hover) > 0.001) { s.hover = next; kick(); }
    };
    const onLeave = () => { s.hover = 0; kick(); };
    // touch: the band gathers as it scrolls toward the middle of the screen, and settles there
    let sraf = 0;
    const readScroll = () => {
      sraf = 0;
      const br = band.getBoundingClientRect(), vh = window.innerHeight || 800;
      s.scroll = smooth(clamp(1 - Math.abs(br.top + br.height * 0.55 - vh / 2) / (vh * 0.55)));
      kick();
    };
    const onScroll = () => { if (coarse && s.visible && !sraf) sraf = requestAnimationFrame(readScroll); };
    const fin = (e) => { if (e.target.matches?.(":focus-visible")) { s.focus = true; kick(); } };
    const fout = (e) => { if (!focusRef.current?.contains(e.relatedTarget)) { s.focus = false; kick(); } };
    const io = new IntersectionObserver(([en]) => {
      s.visible = en.isIntersecting;
      if (s.visible) { if (coarse) readScroll(); kick(); }
      else if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0; }
    }, { threshold: 0 });
    io.observe(band);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    const fe = focusRef.current;
    fe?.addEventListener("focusin", fin);
    fe?.addEventListener("focusout", fout);
    return () => {
      cancelAnimationFrame(s.raf); s.raf = 0; cancelAnimationFrame(sraf);
      ro.disconnect(); rt.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("scroll", onScroll, { capture: true });
      fe?.removeEventListener("focusin", fin);
      fe?.removeEventListener("focusout", fout);
    };
  }, [reduce]);
  useEffect(() => { S.current.kick?.(); }, [hold]);

  // theme changes re-colour the field: the canvas's own colour transitions for 1ms, which tells us to redraw
  return <canvas ref={ref} className="ts-cta-field" aria-hidden onTransitionEnd={() => S.current.redraw?.()} />;
}

function FieldCta({ s, bandRef, primaryLabel, secondaryLabel, secondaryHref, onPrimary, onSecondary }) {
  const { reduce, force, phone, seen, Tag, hid, copy, assure, demo, disabled, loading: busy } = s;
  const targetRef = useRef(null), actionsRef = useRef(null), copyRef = useRef(null), assureRef = useRef(null), linkRef = useRef(null), api = useRef(null), timers = useRef([]);
  const [phase, setPhase] = useState("idle");
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const loading = force === "loading" || (!force && (phase === "loading" || busy));
  const success = force === "success" || (!force && phase === "success");
  const click = () => {
    if (force || phase !== "idle" || busy || disabled) return;
    api.current?.surge();
    if (onPrimary) { onPrimary({}); return; }
    if (!demo) return;
    // no handler in the demo: show the button's own async cycle, with the field held on the button while it works
    setPhase("loading");
    timers.current.push(setTimeout(() => setPhase("success"), 1300), setTimeout(() => setPhase("idle"), 2600));
  };
  return (
    <>
      <FieldCanvas bandRef={bandRef} targetRef={targetRef} focusRef={actionsRef} quietRefs={[copyRef, assureRef, linkRef]} reduce={reduce} hold={loading} apiRef={api} />
      <div className="ts-cta-grid">
        <div ref={copyRef} style={{ gridArea: "copy", minWidth: 0, alignSelf: "center" }}>{copy}</div>
        <Rise i={3} seen={seen} reduce={reduce} className="ts-cta-actions">
          <div ref={actionsRef} style={{ display: "contents" }}>
            {primaryLabel ? (
              <span className="ts-cta-target" ref={targetRef} style={phone ? { width: "100%" } : undefined}>
                <Button label={primaryLabel} size="lg" fullWidth={phone} loading={loading} success={success} simulate={false} disabled={disabled} onClick={click} />
              </span>
            ) : null}
            <span ref={linkRef} style={{ display: "contents" }}><SecondaryLink label={secondaryLabel} href={secondaryHref} onSecondary={onSecondary} disabled={disabled} /></span>
          </div>
        </Rise>
        <div ref={assureRef} style={{ gridArea: "assure", minWidth: 0, display: "contents" }}>{assure}</div>
      </div>
    </>
  );
}

/**
 * CtaBand — the closing call to action before the footer. The CTA can do a small piece of the product in place, and `kind` picks which:
 *  terminal: a copyable command and a "Run it here" that replays your run step by step against a time budget, ending in
 *            a preview URL card with a generated QR-like mark; the primary becomes your `claim` label.
 *  form:     an email capture with real validation that can assemble the team's address as you type and morphs into
 *            your confirmation once your onSubmit resolves.
 *  field:    a calm band where a field of lines leans toward the primary button as the pointer (or focus, or scroll on
 *            touch) approaches it, settles at rest and stops off-screen.
 * Everything shown is yours; with no content it renders nothing. `demo` fills every blank with the sample product
 * (Harbor, preview environments for frontend teams). Sized by its container, not the window. Reduced motion: the
 * finished run, a still field, states without movement.
 */
export const CtaBand = forwardRef(function CtaBand({
  kind = "terminal",
  headline = undefined,
  subline = undefined,
  primaryLabel = undefined,
  secondaryLabel = undefined,
  showReassurance = true,
  demo = false,
  disabled = false,
  loading = false,
  eyebrow,
  logo,
  reassurance,
  command,
  run,
  preview,
  form,
  speed = 8,
  headingLevel = 2,
  secondaryHref,
  email,
  defaultEmail,
  onEmailChange,
  error,
  sent,
  onPrimary,
  onSecondary,
  onSubmit,
  onReady,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-cta-band", CSS);
  const reduce = !!useReducedMotion();
  const hid = "cta" + useId().replace(/:/g, "");
  const root = useRef(null), band = useRef(null);
  const width = useWidth(root);
  const phone = width > 0 && width < 640;
  const seen = useInView(root, { once: true, amount: 0.2 });
  const Tag = "h" + clamp(Math.round(headingLevel) || 2, 1, 6);
  const v = KINDS.includes(kind) ? kind : "terminal";
  const force = forceState && forceState !== "default" ? forceState : undefined;
  // the caller's content wins; a blank (undefined) falls back to the sample only with `demo`, to nothing otherwise
  const D = demo ? SAMPLE : EMPTY;
  const or = (val, key) => (val !== undefined ? val : D[key]);
  const c = {
    headline: or(headline, "headline"), subline: or(subline, "subline"), primaryLabel: or(primaryLabel, "primaryLabel"), secondaryLabel: or(secondaryLabel, "secondaryLabel"),
    eyebrow: or(eyebrow, "eyebrow"), reassurance: or(reassurance, "reassurance"), command: or(command, "command"), run: or(run, "run"),
  };
  const lg = logo !== undefined ? logo : demo ? SAMPLE_LOGO : null;
  const assureOn = showReassurance && !!c.reassurance?.length;
  const panelOn = v === "terminal" ? !!c.command || !!c.run?.length : v === "form" ? demo || form !== undefined || !!onSubmit : false;
  const content = !!(c.headline || c.subline || c.eyebrow || c.primaryLabel || c.secondaryLabel) || assureOn || panelOn;
  const setRefs = (el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

  const copy = c.headline || c.subline || c.eyebrow
    ? <Copy Tag={Tag} hid={hid} eyebrow={c.eyebrow} logo={lg} headline={c.headline} subline={c.subline} seen={seen} reduce={reduce} />
    : null;
  const assure = <Assure items={c.reassurance} show={showReassurance} seen={seen} reduce={reduce} />;
  const s = { reduce, force, phone, seen, Tag, hid, copy, assure, demo, disabled, loading, hasHeadline: !!c.headline };
  const shared = { s, logo: lg, primaryLabel: c.primaryLabel, secondaryLabel: c.secondaryLabel, secondaryHref, onSecondary };

  return (
    <>{sheetTag}<section ref={setRefs} {...rest} className={"ts-cta" + (className ? " " + className : "")} style={style} data-kind={v}
      data-assure={assureOn ? "" : undefined} data-panel={panelOn ? "" : undefined}
      aria-labelledby={c.headline ? hid : undefined} hidden={!content || undefined}>
      {content ? (
        <div ref={band} className="ts-cta-band">
          {v === "form" ? <FormCta key="form" {...shared} form={form} onSubmit={onSubmit} email={email} defaultEmail={defaultEmail} onEmailChange={onEmailChange} error={error} sent={sent} />
            : v === "field" ? <FieldCta key="field" {...shared} bandRef={band} onPrimary={onPrimary} />
            : <TerminalCta key="terminal" {...shared} command={c.command} run={c.run} preview={preview} speed={speed} onPrimary={onPrimary} onReady={onReady} />}
        </div>
      ) : null}
    </section></>
  );
});
