"use client";
import { forwardRef, Fragment, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate, frame, cancelFrame } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";
import { useMedia, TOUCH } from "../_shared/media.js";

const CSS = `
.ts-faq{--faq-pad:28px;--faq-stage:var(--ts-surface);--faq-field:var(--ts-surface2);box-sizing:border-box;width:min(860px,100%);align-self:start;justify-self:center;container-type:inline-size;overflow-anchor:none;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-faq *{box-sizing:border-box}
.ts-faq[data-layout=plain]{padding:0 var(--faq-pad) 6px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-faq[data-layout=cards]{--faq-stage:var(--ts-bg);--faq-field:var(--ts-surface)}
.ts-faq[data-layout=columns]{--faq-stage:var(--ts-bg);--faq-field:var(--ts-surface);width:min(1120px,100%)}

/* head */
.ts-faq-head{display:flex;flex-wrap:wrap;align-items:flex-end;gap:14px 24px;padding:30px 0 4px}
.ts-faq[data-layout=cards] .ts-faq-head,.ts-faq[data-layout=columns] .ts-faq-head{padding-top:8px}
.ts-faq-titles{flex:1 1 320px;min-width:0}
.ts-faq-eyebrow{display:flex;align-items:center;gap:8px;margin:0 0 10px;font:600 10.5px/1 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-faq-eyebrow i{width:14px;height:1px;background:currentColor;opacity:.6}
.ts-faq-title{margin:0;font-size:32px;line-height:1.05;font-weight:650;letter-spacing:-0.035em;text-wrap:balance}
.ts-faq-sub{margin:10px 0 0;max-width:52ch;font-size:14.5px;line-height:1.55;color:var(--ts-ink2)}
.ts-faq-status{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px 0 9px;border-radius:99px;font-size:12.5px;font-weight:560;white-space:nowrap;color:var(--ts-ink);background:color-mix(in srgb,var(--ts-success) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-success) 26%,transparent)}
.ts-faq-status svg{color:var(--ts-success)}
.ts-faq-status span{color:var(--ts-ink2);font-weight:500}

/* sticky search */
.ts-faq-searchbar{position:sticky;top:0;z-index:5;margin:0 calc(1px - var(--faq-pad));padding:18px calc(var(--faq-pad) - 1px) 14px;background:var(--faq-stage);transition:box-shadow .25s}
.ts-faq[data-layout=cards] .ts-faq-searchbar{margin:0;padding:16px 0 12px}
.ts-faq-searchbar[data-stuck=true]{box-shadow:0 1px 0 var(--ts-line),0 10px 24px -18px color-mix(in srgb,var(--ts-ink) 40%,transparent)}
.ts-faq[data-layout=cards] .ts-faq-searchbar[data-stuck=true]{margin:0 -12px;padding:16px 12px 12px;border-radius:0 0 var(--ts-radius-md) var(--ts-radius-md)}
.ts-faq-search{position:relative;display:flex;align-items:center;height:50px;border-radius:var(--ts-radius-md);background:var(--faq-field);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .2s}
.ts-faq-search:hover{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 22%,transparent)}
.ts-faq-search:focus-within{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 18%,transparent)}
.ts-faq-search>svg{flex:none;margin:0 10px 0 16px;color:var(--ts-ink3)}
.ts-faq-input{all:unset;flex:1;min-width:0;height:100%;font-family:var(--ts-font);font-size:15px;color:var(--ts-ink)}
.ts-faq-input::placeholder{color:var(--ts-ink3);opacity:1}
.ts-faq-input::-webkit-search-cancel-button{display:none}
.ts-faq-kbd{flex:none;display:grid;place-items:center;min-width:24px;height:24px;margin-right:13px;padding:0 6px;border-radius:6px;font:600 11.5px/1 var(--ts-font-mono);color:var(--ts-ink3);box-shadow:inset 0 0 0 1px var(--ts-line),0 1px 0 var(--ts-line)}
.ts-faq-clear{all:unset;position:relative;flex:none;display:grid;place-items:center;width:28px;height:28px;margin-right:11px;border-radius:99px;cursor:pointer;color:var(--ts-ink2);background:color-mix(in srgb,var(--ts-ink) 8%,transparent)}
.ts-faq-clear::after{content:"";position:absolute;inset:-8px}
.ts-faq-clear:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 13%,transparent)}
.ts-faq-clear:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

/* category tabs: a horizontal chip rail, or a vertical list in the two-column layout */
.ts-faq-railbox{position:relative;margin:0 0 4px}
.ts-faq-rail{overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:none;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}
.ts-faq-rail::-webkit-scrollbar{display:none}
.ts-faq-tabs{position:relative;display:flex;gap:6px;width:max-content;padding:2px}
.ts-faq-tab{all:unset;position:relative;z-index:1;display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:99px;font-size:13.5px;font-weight:560;white-space:nowrap;cursor:pointer;color:var(--ts-ink2);scroll-snap-align:center;box-shadow:inset 0 0 0 1px var(--ts-line);transition:color .2s,box-shadow .2s;-webkit-tap-highlight-color:transparent}
.ts-faq-tab:hover{color:var(--ts-ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 26%,transparent)}
.ts-faq-tab[aria-selected=true]{color:var(--ts-surface);box-shadow:none}
.ts-faq-tab[data-zero=true]:not([aria-selected=true]){color:var(--ts-ink3)}
.ts-faq-tab:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-faq-tabn{font-size:12px;font-weight:600;color:var(--ts-ink3);transition:color .2s}
.ts-faq-tab[aria-selected=true] .ts-faq-tabn{color:color-mix(in srgb,var(--ts-surface) 66%,transparent)}
.ts-faq-ind{position:absolute;top:2px;left:0;height:38px;border-radius:99px;background:var(--ts-ink);pointer-events:none}
.ts-faq-tabs[aria-orientation=vertical]{flex-direction:column;gap:2px;width:100%;padding:0}
.ts-faq-tabs[aria-orientation=vertical] .ts-faq-tab{height:42px;justify-content:space-between;padding:0 12px 0 16px;border-radius:var(--ts-radius-md);box-shadow:none;font-size:14px}
.ts-faq-tabs[aria-orientation=vertical] .ts-faq-tab[aria-selected=true]{color:var(--ts-ink);font-weight:620}
.ts-faq-tabs[aria-orientation=vertical] .ts-faq-tab[aria-selected=true] .ts-faq-tabn{color:var(--ts-ink2)}
.ts-faq-tabs[aria-orientation=vertical] .ts-faq-ind{top:0;left:0;right:0;width:auto;height:42px;border-radius:var(--ts-radius-md);background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}
.ts-faq-tabs[aria-orientation=vertical] .ts-faq-ind::before{content:"";position:absolute;left:5px;top:12px;bottom:12px;width:3px;border-radius:3px;background:var(--ts-accent)}

/* results bar */
.ts-faq-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;margin-top:6px}
.ts-faq-count{margin:0;min-width:0;font-size:13px;color:var(--ts-ink3);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-faq-count b{color:var(--ts-ink);font-weight:620}
.ts-faq-count q{color:var(--ts-ink);quotes:"\\201C" "\\201D"}
.ts-faq-ghost{all:unset;position:relative;flex:none;display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 12px 0 9px;border-radius:99px;font-size:13px;font-weight:560;cursor:pointer;color:var(--ts-ink2);box-shadow:inset 0 0 0 1px var(--ts-line);transition:color .2s,background-color .2s}
.ts-faq-ghost:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 5%,transparent)}
.ts-faq-ghost:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-faq-ghost::after{content:"";position:absolute;inset:-5px -2px}

/* list */
.ts-faq-list{position:relative;padding-bottom:6px}
.ts-faq-gh{display:flex;align-items:baseline;gap:8px;margin:0;padding:22px 0 8px;font:600 10.5px/1.2 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-faq-gh:first-child{padding-top:8px}
.ts-faq-gh span{letter-spacing:.06em}
.ts-faq-item{position:relative;scroll-margin-top:96px;border-radius:var(--ts-radius-md)}
.ts-faq[data-layout=plain] .ts-faq-item::after,.ts-faq-main .ts-faq-item::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--ts-line)}
.ts-faq[data-layout=cards] .ts-faq-item{margin-bottom:10px;padding:0 20px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line),0 1px 2px color-mix(in srgb,var(--ts-ink) 5%,transparent);transition:box-shadow .35s}
.ts-faq[data-layout=cards] .ts-faq-item[data-open=true]{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 16%,transparent),var(--ts-shadow)}
.ts-faq-item[data-flash=true]{animation:ts-faq-flash 1.6s ease-out}
@keyframes ts-faq-flash{0%,30%{box-shadow:0 0 0 2px var(--ts-focus),0 0 0 8px color-mix(in srgb,var(--ts-focus) 22%,transparent)}100%{box-shadow:0 0 0 2px transparent,0 0 0 8px transparent}}
.ts-faq-h{margin:0;font:inherit}
.ts-faq-btn{all:unset;position:relative;box-sizing:border-box;display:flex;align-items:center;gap:16px;width:100%;min-height:62px;padding:16px 2px 16px 0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-faq-btn::before{content:"";position:absolute;inset:4px -12px;border-radius:var(--ts-radius-md);background:color-mix(in srgb,var(--ts-ink) 4%,transparent);opacity:0;transition:opacity .2s}
.ts-faq[data-layout=cards] .ts-faq-btn::before{inset:4px -14px}
@media (hover:hover){.ts-faq-btn:not([aria-disabled=true]):hover::before{opacity:1}}
.ts-faq-btn:focus-visible{outline:none}
.ts-faq-btn:focus-visible::before{opacity:1;background:transparent;box-shadow:0 0 0 2px var(--ts-focus)}
.ts-faq-qwrap{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.ts-faq-q{font-size:15.5px;font-weight:560;line-height:1.4;letter-spacing:-0.008em;color:var(--ts-ink);text-wrap:pretty}
.ts-faq-kw{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ts-ink3)}
.ts-faq-kw b{font-weight:600;color:var(--ts-ink2)}
.ts-faq-pm{position:relative;flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:99px;color:var(--ts-ink2);box-shadow:inset 0 0 0 1px var(--ts-line);transition:background-color .3s,color .3s,box-shadow .3s}
.ts-faq-btn:not([aria-disabled=true]):hover .ts-faq-pm{color:var(--ts-ink);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 30%,transparent)}
.ts-faq-item[data-open=true] .ts-faq-pm{color:var(--ts-accent-ink);background:var(--ts-accent);box-shadow:inset 0 0 0 1px var(--ts-accent)}
.ts-faq-pm svg{overflow:visible}
.ts-faq-btn[aria-disabled=true]{cursor:not-allowed}
.ts-faq-btn[aria-disabled=true] .ts-faq-q{color:var(--ts-ink3)}
.ts-faq-btn[aria-disabled=true] .ts-faq-pm{color:var(--ts-ink3);opacity:.5;box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq-off{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ts-ink3)}

/* panel */
.ts-faq-panel{overflow:hidden}
.ts-faq-in{padding:0 46px 20px 0}
.ts-faq-ans{max-width:66ch;font-size:14.5px;line-height:1.62;color:var(--ts-ink2)}
.ts-faq-p{margin:0 0 12px}
.ts-faq-b{font-weight:620;color:var(--ts-ink)}
.ts-faq-a{color:var(--ts-ink);font-weight:560;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:3px;text-decoration-color:color-mix(in srgb,var(--ts-accent) 70%,transparent);border-radius:3px}
.ts-faq-a:hover{text-decoration-color:var(--ts-accent)}
.ts-faq-a:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
/* touch: inline links get a 44px-tall hit area without moving text. Vertical padding on an inline box never changes
   the line box, and clone gives every wrapped line its own padding (a ::after on a link that wraps collapses to the
   gap between its first and last line). position:relative lifts it above the neighbouring lines for hit testing. */
@media (pointer:coarse){
  .ts-faq-a{position:relative;padding-block:14px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  .ts-faq-a:focus-visible{outline-offset:-12px}
}
.ts-faq-ol,.ts-faq-ul{list-style:none;margin:0 0 12px;padding:0}
.ts-faq-ol{counter-reset:faq}
.ts-faq-ol>li{position:relative;margin:0 0 9px;padding-left:34px;counter-increment:faq}
.ts-faq-ol>li::before{content:counter(faq);position:absolute;left:0;top:1px;display:grid;place-items:center;width:22px;height:22px;border-radius:99px;font:600 11.5px/1 var(--ts-font-mono);color:var(--ts-ink);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq-ul>li{position:relative;margin:0 0 7px;padding-left:20px}
.ts-faq-ul>li::before{content:"";position:absolute;left:2px;top:.8em;width:8px;height:1.5px;border-radius:2px;background:var(--ts-ink3)}
.ts-faq-tbl{width:100%;margin:2px 0 14px;border-collapse:collapse;font-size:13.5px;line-height:1.4;font-variant-numeric:tabular-nums}
.ts-faq-tbl th{padding:0 14px 8px 0;font-size:11.5px;font-weight:560;text-align:left;color:var(--ts-ink3);border-bottom:1px solid var(--ts-line)}
.ts-faq-tbl td{padding:10px 14px 10px 0;vertical-align:top;color:var(--ts-ink);border-bottom:1px solid var(--ts-line)}
.ts-faq-tbl tr:last-child td{border-bottom:0}
.ts-faq-tbl .num{text-align:right;padding-right:0;white-space:nowrap}
.ts-faq-tbl .lead{font-weight:520}
.ts-faq-tsub{display:block;margin-top:2px;font-size:12px;font-weight:450;color:var(--ts-ink3)}
.ts-faq-note{display:flex;gap:10px;align-items:flex-start;margin:0 0 12px;padding:10px 12px;border-radius:var(--ts-radius-md);font-size:13.5px;line-height:1.5;color:var(--ts-ink);background:color-mix(in srgb,var(--ts-warning) 11%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-warning) 26%,transparent)}
.ts-faq-note svg{margin-top:1px;color:var(--ts-warning)}
.ts-faq-note b{font-weight:640}
.ts-faq-mark{color:inherit;border-radius:3px;background:color-mix(in srgb,var(--ts-accent) 30%,transparent);box-shadow:0 0 0 1.5px color-mix(in srgb,var(--ts-accent) 30%,transparent);animation:ts-faq-mk .4s ease-out}
@keyframes ts-faq-mk{from{background-color:transparent;box-shadow:0 0 0 1.5px transparent}}

/* answer footer: feedback + copy link */
.ts-faq-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px 16px;margin-top:6px;padding-top:14px;border-top:1px dashed var(--ts-line)}
.ts-faq-fb{display:flex;align-items:center;gap:8px;min-height:34px;min-width:0;font-size:13px;color:var(--ts-ink3)}
.ts-faq-fbq{white-space:nowrap}
.ts-faq-pill{all:unset;position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 13px;border-radius:99px;font-size:13px;font-weight:560;white-space:nowrap;cursor:pointer;color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line);overflow:hidden}
.ts-faq-pill::after{content:"";position:absolute;inset:-6px -3px}
.ts-faq-pill:hover:not([aria-disabled=true]){background:color-mix(in srgb,var(--ts-ink) 5%,transparent)}
.ts-faq-pill:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-faq-pill[aria-disabled=true]{cursor:default;color:var(--ts-ink);background:color-mix(in srgb,var(--ts-success) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-success) 30%,transparent)}
.ts-faq-pill[data-v=no][aria-disabled=true]{background:color-mix(in srgb,var(--ts-ink) 6%,transparent);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq-pill svg{color:var(--ts-success)}
.ts-faq-pill[data-v=no] svg{color:var(--ts-ink2)}
.ts-faq-pilltx{display:inline-flex;align-items:center;gap:6px}
.ts-faq-link{all:unset;position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 8px;border-radius:99px;font-size:13px;font-weight:560;cursor:pointer;color:var(--ts-ink2);white-space:nowrap}
.ts-faq-link::after{content:"";position:absolute;inset:-6px -2px}
.ts-faq-link:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 5%,transparent)}
.ts-faq-link:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-faq-swap{display:inline-grid}
.ts-faq-swap>*{grid-area:1/1;display:inline-flex;align-items:center;gap:6px;transition:opacity .2s,transform .25s}
.ts-faq-swap>[data-on=false]{opacity:0;transform:translateY(5px);pointer-events:none}
.ts-faq-swap svg[data-ok]{color:var(--ts-success)}
.ts-faq-text{all:unset;position:relative;cursor:pointer;font-weight:600;color:var(--ts-ink);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--ts-accent) 70%,transparent);text-underline-offset:3px;text-decoration-thickness:1.5px;border-radius:3px}
.ts-faq-text::after{content:"";position:absolute;inset:-12px -6px}
.ts-faq-text:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

/* empty state */
.ts-faq-empty{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:26px 0 24px}
.ts-faq-empty-ic{display:grid;place-items:center;width:44px;height:44px;margin-bottom:8px;border-radius:14px;color:var(--ts-ink2);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq-empty-h{margin:0;font-size:18px;font-weight:620;letter-spacing:-0.015em;color:var(--ts-ink);overflow-wrap:anywhere}
.ts-faq-empty p{margin:0;max-width:52ch;font-size:14px;line-height:1.55;color:var(--ts-ink2)}
.ts-faq-sugg{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}
.ts-faq-chip{all:unset;position:relative;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 13px 0 10px;border-radius:99px;font-size:13px;font-weight:560;cursor:pointer;color:var(--ts-ink);background:var(--faq-field);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq-chip::after{content:"";position:absolute;inset:-5px -3px}
.ts-faq-chip svg{color:var(--ts-ink3)}
.ts-faq-chip:hover{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 26%,transparent)}
.ts-faq-chip:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

/* contact card */
.ts-faq-help{display:flex;align-items:center;gap:14px 16px;flex-wrap:wrap;margin:14px 0 20px;padding:16px 16px 16px 18px;border-radius:var(--ts-radius-lg);background:color-mix(in srgb,var(--ts-ink) 3.5%,transparent);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-faq[data-layout=cards] .ts-faq-help{background:var(--ts-surface)}
.ts-faq-help-ic{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:var(--ts-accent-ink);background:var(--ts-accent)}
.ts-faq-help-tx{flex:1 1 220px;min-width:0}
.ts-faq-help-tx b{display:block;font-size:14.5px;font-weight:620;color:var(--ts-ink)}
.ts-faq-help-tx span{display:block;margin-top:2px;font-size:13px;line-height:1.45;color:var(--ts-ink2)}
.ts-faq-empty .ts-faq-help{width:100%;margin:16px 0 0}
.ts-faq-cta{all:unset;position:relative;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:99px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;color:var(--ts-accent-ink);background:var(--ts-accent);transition:filter .2s}
.ts-faq-cta:hover{filter:brightness(1.07)}
.ts-faq-cta:focus-visible{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-faq-cta[data-st=open]{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-success) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-success) 30%,transparent)}
.ts-faq-cta[data-st=open] svg{color:var(--ts-success)}
.ts-faq-spin{width:14px;height:14px;border-radius:99px;border:2px solid color-mix(in srgb,currentColor 30%,transparent);border-top-color:currentColor;animation:ts-faq-spin .7s linear infinite}
@keyframes ts-faq-spin{to{transform:rotate(360deg)}}

/* two-column layout */
.ts-faq-cols{display:grid;grid-template-columns:288px minmax(0,1fr);gap:44px;align-items:start}
.ts-faq-side{position:sticky;top:0;display:flex;flex-direction:column;gap:16px;padding:12px 0 20px}
.ts-faq-side .ts-faq-head{padding:0}
.ts-faq-side .ts-faq-title{font-size:30px}
.ts-faq-side .ts-faq-help{margin:6px 0 0;flex-direction:column;align-items:flex-start}
.ts-faq-side .ts-faq-help-tx{flex:none}
.ts-faq-main{min-width:0;padding:4px 28px 6px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-faq-main .ts-faq-bar{margin-top:8px}

@container (max-width:560px){
  .ts-faq{--faq-pad:18px}
  .ts-faq-head{padding-top:24px}
  .ts-faq-title{font-size:27px}
  .ts-faq-sub{font-size:14px}
  .ts-faq-in{padding-right:0}
  .ts-faq[data-layout=cards] .ts-faq-item{padding:0 16px}
  .ts-faq-q{font-size:15px}
  .ts-faq-tbl th,.ts-faq-tbl td{padding-right:10px}
  .ts-faq-help{padding:16px}
  .ts-faq-help .ts-faq-cta{width:100%}
  .ts-faq-main{padding:4px 18px 6px}
  .ts-faq-railbox{margin:0 calc(-1 * var(--faq-pad)) 4px}
  .ts-faq-rail{padding:0 var(--faq-pad);scroll-padding:0 var(--faq-pad)}
}
@media (max-width:640px),(pointer:coarse){
  .ts-faq-tab{height:44px;padding:0 16px}
  .ts-faq-ind{height:44px}
  .ts-faq-btn{min-height:64px}
  .ts-faq-pill,.ts-faq-link,.ts-faq-ghost,.ts-faq-chip{height:40px}
  .ts-faq-cta{height:46px}
  .ts-faq-clear{width:32px;height:32px}
  .ts-faq-search{height:52px}
  .ts-faq-input{font-size:16px}
  .ts-faq-kbd{display:none}
  .ts-faq-eyebrow,.ts-faq-gh{font-size:11px}
}
@media (prefers-reduced-motion:reduce){
  .ts-faq-mark,.ts-faq-item[data-flash=true]{animation:none}
  .ts-faq-swap>*{transition:opacity .15s}
  .ts-faq-swap>[data-on=false]{transform:none}
  /* the connecting spinner stops turning and breathes instead */
  .ts-faq-spin{animation:ts-faq-breathe 1.6s ease-in-out infinite}
}
@keyframes ts-faq-breathe{0%,100%{opacity:.35}50%{opacity:1}}
`;
registerStyles("ts-accordion", CSS);

/* ------------------------------------------------------------------ content
   Tern: a travel eSIM app. The help centre a traveller opens at the gate, or on landing with no signal.
   Inline markup in answers: **bold** and [label](href). `kw` holds extra search words that never render. */

const CATS = [
  { id: "start", name: "Getting started" },
  { id: "plans", name: "Plans & data" },
  { id: "billing", name: "Billing & refunds" },
  { id: "fix", name: "Troubleshooting" },
];

const ITEMS = [
  {
    id: "phone-compatible", cat: "start", kw: "unlock unlocked device iphone pixel samsung eid supported",
    q: "Is my phone compatible with eSIM?",
    a: [
      { p: "Most phones made since 2019 are, as long as they're carrier-unlocked. The quickest check: dial *#06#. If a line labelled **EID** appears, your phone supports eSIM." },
      { ul: [
        "iPhone XR, XS and every model since (except mainland-China models with two physical SIM slots)",
        "Google Pixel 3a and later; Pixel 3a units sold in Japan need an update first",
        "Samsung Galaxy S20, Z Flip and Z Fold series and later, plus the A35 and A54",
        "iPad Pro, Air and mini (Wi-Fi + Cellular) from 2018 onwards",
      ] },
      { p: "Locked to your carrier? Ask them to unlock it before you travel; most do it free once the contract is paid off. [See every supported device](/help/devices)" },
    ],
  },
  {
    id: "when-to-install", cat: "start", kw: "setup set up qr code activate activation before trip",
    q: "When should I install my eSIM?",
    a: [
      { p: "At home, on Wi-Fi, any time up to 30 days before you fly. Your plan's validity only starts when the eSIM first connects to a network at your destination, so installing early costs you nothing." },
      { ol: [
        "Open Tern and tap **Install eSIM** on your plan.",
        "Confirm the prompt; your phone adds it as a second line.",
        "Name the line “Tern travel” so it's easy to find in Settings.",
        "Leave it switched off until you land.",
      ] },
      { note: "Don't delete the eSIM after installing it. Most eSIMs can only be installed once.", label: "Heads up" },
    ],
  },
  {
    id: "keep-number", cat: "start", kw: "dual sim calls sms texts whatsapp imessage two factor 2fa roaming charges",
    q: "Can I keep my own number for calls and texts?",
    a: [
      { p: "Yes. Your phone runs both lines side by side: your usual SIM keeps your number for calls, texts and two-factor codes, while Tern carries your mobile data. WhatsApp and iMessage keep working on your normal number." },
      { p: "One setting matters: turn **data roaming off on your home line**, or your carrier may bill roaming rates for background data. On iPhone: Settings → Mobile Service → your home line → Data Roaming." },
    ],
  },
  {
    id: "how-much-data", cat: "plans", kw: "gb gigabytes usage estimate size which plan",
    q: "How much data will I actually need?",
    a: [
      { p: "It depends on how you use your phone more than on how long you're away. Typical daily use across Tern travellers last year:" },
      { table: { head: ["How you travel", "Per day", "10-day trip"], num: [1, 2], rows: [
        ["Maps, messaging, booking apps", "0.4 GB", "5 GB plan"],
        ["Plus social media and photo uploads", "0.9 GB", "10 GB plan"],
        ["Plus video calls and streaming", "2.5 GB", "Unlimited"],
      ] } },
      { p: "Not sure? Start smaller. Top-ups take seconds and never need a new eSIM." },
    ],
  },
  {
    id: "data-runs-out", cat: "plans", kw: "top up topup add data more data used up price cost",
    q: "What happens when my data runs out?",
    a: [
      { p: "We'll notify you at 80% and again at 100%. Then your connection pauses; it never switches to pay-as-you-go, so there are no surprise charges." },
      { p: "Top up from the app in two taps: **1 GB for $4.50**, 3 GB for $11 or 5 GB for $16. Top-ups land on the same eSIM, last for the rest of your plan, and nothing needs reinstalling." },
    ],
  },
  {
    id: "hotspot", cat: "plans", kw: "tethering tether share laptop personal hotspot wifi",
    q: "Can I share my data as a hotspot?",
    a: [
      { p: "Yes. Hotspot works on every fixed-data plan, so you can share with a laptop or a travel companion's phone." },
      { p: "On Unlimited plans, sharing is included up to **1 GB a day**. After that, connected devices slow to 512 kbps until midnight local time; your own phone stays at full speed." },
    ],
  },
  {
    id: "multi-country", cat: "plans", kw: "regional region europe asia americas global several countries border price",
    q: "Is there one plan for several countries?",
    a: [
      { p: "Regional plans cover every country in the region on a single eSIM and switch networks for you at the border." },
      { table: { head: ["Plan", "Data", "Price"], num: [2], rows: [
        [{ v: "Europe", s: "39 countries" }, { v: "10 GB", s: "30 days" }, "$19"],
        [{ v: "Asia", s: "14 countries" }, { v: "10 GB", s: "30 days" }, "$24"],
        [{ v: "Americas", s: "21 countries" }, { v: "8 GB", s: "30 days" }, "$29"],
        [{ v: "Global", s: "120+ countries" }, { v: "20 GB", s: "60 days" }, "$49"],
      ] } },
      { p: "Crossing into a country outside the region (Serbia is the usual one on Balkan trips) pauses data until you're back in." },
    ],
  },
  {
    id: "refund", cat: "billing", kw: "money back cancel cancellation unused return",
    q: "Can I get a refund if I don't use my plan?",
    a: [
      { p: "Yes: a full refund within 30 days of purchase, as long as the eSIM hasn't been installed. Request it from Account → Orders → Refund; there's no form to fill in." },
      { p: "If it's installed but never worked because of a fault on our side, we refund that too. The money is back on your original payment method in 5–10 business days." },
    ],
  },
  {
    id: "auto-renew", cat: "billing", kw: "subscription recurring charged again currency conversion fee",
    q: "Will I be charged again automatically?",
    a: [
      { p: "No. Every plan is a one-off purchase with no subscription and no auto-renewal. You're only charged when you buy a top-up or a new plan yourself." },
      { p: "Prices are shown and charged in your local currency where we support it (USD, EUR, GBP, AUD, JPY and 11 others), so your bank adds no conversion fee." },
    ],
  },
  {
    id: "receipt", cat: "billing", kw: "invoice vat gst expenses company business pdf",
    q: "How do I get a receipt for expenses?",
    a: [
      { ol: [
        "Open Account → Billing details and add your company name and VAT or GST number.",
        "Go to Orders and pick the trip.",
        "Tap **Download receipt** for a PDF with the tax breakdown.",
      ] },
      { p: "Details you add later apply to new receipts and to any order from the last 90 days. [Open billing details](/account/billing)" },
    ],
  },
  {
    id: "no-signal", cat: "fix", kw: "no service not working no internet network landed connect connection",
    q: "I've landed and have no signal. What do I do?",
    a: [
      { p: "Nine times out of ten it's one of these, in this order:" },
      { ol: [
        "Check the Tern line is switched on and chosen for mobile data.",
        "Turn on **Data Roaming for the Tern line**. It's required, and free: on a Tern plan you're never billed for roaming.",
        "Switch Airplane mode on for 10 seconds, then off.",
        "Still nothing? Pick a network by hand: Settings → Network Selection → turn off Automatic.",
      ] },
      { p: "Our team is in the app 24/7, and the median first reply this month is 3 minutes." },
    ],
  },
  {
    id: "slow-data", cat: "fix", kw: "speed slow 3g 4g 5g lte throttled throttling fair use",
    q: "Why is my data slow?",
    a: [
      { p: "Look at the status bar first. If it shows 3G or E, your phone has dropped to an older network; toggling Airplane mode usually brings back 4G or 5G." },
      { ul: [
        "Low Data Mode or Data Saver can cap video and pause background sync.",
        "On Unlimited plans, speeds slow to 3 Mbps after 5 GB in a day and reset at midnight local time.",
        "Hotel and stadium cells get congested; speeds often double a street away.",
      ] },
    ],
  },
  {
    id: "deleted-esim", cat: "fix", kw: "removed delete reinstall replacement lost new phone",
    q: "I deleted my eSIM by accident. Can I get it back?",
    a: [
      { p: "An eSIM can usually be installed only once, so a deleted one can't be scanned again. Message us with your order number and we'll issue a **free replacement**, usually within 15 minutes, with your remaining data carried over." },
    ],
  },
];

const SUGGEST = ["hotspot", "refund", "no signal"];
const NONE = [];
const DEFAULT_STATUS = { label: "All networks normal", detail: "214 partners" };
/** The "Still stuck?" card. Give it an `href` or pass onContact; left as it is, the button plays a demo chat. */
const DEFAULT_HELP = { title: "Still stuck?", text: "A real person replies in about 3 minutes, 24/7, wherever you've landed.", cta: "Chat with support" };
const EMPTY_QUERY = "cruise ship wifi";

const slug = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60);
/**
 * Accept loose items: `a` may be plain text, blocks or a React node; `id` and `kw` are optional; `question` /
 * `answer` and `title` / `content` work as aliases. A title that is a node is shown as is (search reads `kw`).
 */
function normalise(items) {
  const seen = new Set();
  return (items ?? []).map((it, i) => {
    const qRaw = it.q ?? it.question ?? it.title ?? "";
    const q = typeof qRaw === "string" || typeof qRaw === "number" ? String(qRaw) : "";
    const a = it.a ?? it.answer ?? it.content ?? [];
    let id = String(it.id ?? (slug(q) || "q" + (i + 1)));
    while (seen.has(id)) id += "-" + (i + 1);
    seen.add(id);
    const blocks = typeof a === "string" ? [{ p: a }] : Array.isArray(a) ? a : [{ node: a }];
    return { ...it, id, q, qNode: q || qRaw === "" ? null : qRaw, kw: it.kw ?? "", a: blocks };
  });
}
/** forceState "disabled": one question that can't be opened yet, with the reason under it. */
const FORCED_OFF = { "multi-country": "Regional plans are back in March" };
const FORCED_OPEN = "how-much-data";

/* ------------------------------------------------------------------ search */

const INLINE = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
const strip = (s) => s.replace(INLINE, (_, b, l) => b ?? l);
const cellText = (c) => (c !== null && typeof c === "object" ? `${c.v ?? ""} ${c.s ?? ""}` : String(c ?? ""));
function answerText(a) {
  return a.filter((b) => b && typeof b === "object" && !isValidElement(b) && b.node === undefined).map((b) => b.p ?? b.note ?? (b.ul ?? b.ol)?.join(" ") ?? [...(b.table?.head ?? []), ...(b.table?.rows ?? []).flat().map(cellText)].join(" ")).map((s) => strip(String(s))).join(" ");
}
const indexOf = (items) => Object.fromEntries(items.map((it) => [it.id, { q: it.q.toLowerCase(), a: answerText(it.a).toLowerCase(), kw: it.kw.toLowerCase() }]));

const toTerms = (query) => [...new Set(query.toLowerCase().split(/\s+/).map((t) => t.replace(/^[^\p{L}\p{N}$*]+|[^\p{L}\p{N}]+$/gu, "")).filter((t) => t.length > 1 || /\d/.test(t)))];
const isWordChar = (c) => /[\p{L}\p{N}]/u.test(c);

/** [start, end) ranges where any term starts a word in `text` (case-insensitive), merged. */
function ranges(text, terms) {
  if (!terms.length) return [];
  const low = text.toLowerCase(), out = [];
  for (const t of terms) {
    for (let i = low.indexOf(t); i !== -1; i = low.indexOf(t, i + 1)) if (!i || !isWordChar(low[i - 1])) out.push([i, i + t.length]);
  }
  out.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of out) { const last = merged[merged.length - 1]; if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push([...r]); }
  return merged;
}
const has = (low, t) => ranges(low, [t]).length > 0;

/** match: every term found somewhere. answer: the question alone doesn't carry every term but the answer shows one. */
function matchInfo(ix, terms) {
  if (!terms.length) return { match: true, answer: false, kwOnly: [] };
  let match = true, qAll = true, aAny = false;
  const kwOnly = [];
  for (const t of terms) {
    const q = has(ix.q, t), a = has(ix.a, t), k = has(ix.kw, t);
    if (!q && !a && !k) { match = false; break; }
    if (!q) qAll = false;
    if (a) aAny = true;
    if (!q && !a) kwOnly.push(t);
  }
  return { match, answer: match && !qAll && aAny, kwOnly };
}

function Hl({ text, terms }) {
  const rs = ranges(text, terms);
  if (!rs.length) return text;
  const out = [];
  let at = 0;
  rs.forEach(([s, e], i) => {
    if (s > at) out.push(text.slice(at, s));
    out.push(<mark key={i} className="ts-faq-mark">{text.slice(s, e)}</mark>);
    at = e;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/** Inline markup with highlights applied to every text run. */
function Rich({ text, terms }) {
  const out = [];
  let at = 0, k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push(<Hl key={k++} text={text.slice(at, m.index)} terms={terms} />);
    if (m[1] != null) out.push(<strong key={k++} className="ts-faq-b"><Hl text={m[1]} terms={terms} /></strong>);
    else out.push(<a key={k++} className="ts-faq-a" href={m[3]} onClick={(e) => e.preventDefault()}><Hl text={m[2]} terms={terms} /></a>);
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(<Hl key={k++} text={text.slice(at)} terms={terms} />);
  return out;
}

/* ------------------------------------------------------------------ motion */

const OPEN_SPRING = { type: "spring", stiffness: 290, damping: 32, mass: 1 };
const CLOSE_SPRING = { type: "spring", stiffness: 420, damping: 44, mass: 1 };
const FLIP = { type: "spring", stiffness: 430, damping: 40 };
const IND_SPRING = { type: "spring", stiffness: 520, damping: 42 };
const ENTRANCE = { type: "spring", stiffness: 140, damping: 18 };

function scrollParentOf(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const s = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(s.overflowY) && p.scrollHeight > p.clientHeight) return p;
  }
  return document.scrollingElement;
}

/**
 * Keep `el` where it is on screen while content above it collapses: after every Motion render step, measure how far
 * it drifted and scroll the container by the same amount. Stops after `ms`, or as soon as the reader scrolls.
 */
function keepPut(el, ms = 900) {
  const sc = scrollParentOf(el);
  if (!sc) return;
  const t0 = el.getBoundingClientRect().top;
  const end = performance.now() + ms;
  const target = sc === document.scrollingElement ? window : sc;
  let done = false;
  const stop = () => {
    if (done) return;
    done = true;
    cancelFrame(tick);
    target.removeEventListener("wheel", stop);
    target.removeEventListener("touchstart", stop);
  };
  const tick = () => {
    if (performance.now() > end || !el.isConnected) return stop();
    const dy = el.getBoundingClientRect().top - t0;
    if (Math.abs(dy) > 0.5) sc.scrollTop += dy;
  };
  frame.postRender(tick, true);
  target.addEventListener("wheel", stop, { passive: true });
  target.addEventListener("touchstart", stop, { passive: true });
}

/** Plus whose vertical arm retracts into the bar as it opens: a path morph on a spring (the bar stretches a touch on overshoot). */
function PlusMinus({ open, reduce, size = 14 }) {
  const p = useSpring(open ? 1 : 0, { stiffness: 520, damping: 26 });
  useEffect(() => { if (reduce) p.jump(open ? 1 : 0); else p.set(open ? 1 : 0); }, [open, reduce]);
  const d = useTransform(p, (v) => {
    const arm = 7 * Math.max(0, 1 - v), bar = 7 + 0.9 * v;
    return `M${(12 - bar).toFixed(2)} 12H${(12 + bar).toFixed(2)}M12 ${(12 - arm).toFixed(2)}V${(12 + arm).toFixed(2)}`;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden focusable="false">
      <motion.path d={d} />
    </svg>
  );
}

/**
 * Collapse: measures its content and springs its own height (from wherever it is, so interruptions are smooth),
 * then lets go to `auto` so the answer can reflow. The content rises and fades in just after the height starts.
 */
function Collapse({ open, id, labelledBy, reduce, delay = 0, children }) {
  const outer = useRef(null), inner = useRef(null);
  const h = useMotionValue(open ? "auto" : 0);
  const [rest, setRest] = useState(!open); // closed and finished: hidden from focus and the accessibility tree
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const from = outer.current.offsetHeight;
    const to = open ? inner.current.offsetHeight : 0;
    if (open) setRest(false);
    if (reduce) { h.set(open ? "auto" : 0); if (!open) setRest(true); return; }
    h.set(from);
    let live = true;
    const ctl = animate(h, to, { ...(open ? OPEN_SPRING : CLOSE_SPRING), delay });
    ctl.then(() => { if (!live) return; if (open) h.set("auto"); else setRest(true); });
    return () => { live = false; ctl.stop(); };
  }, [open]);
  // out of the Tab order the moment it starts to close, not when the spring settles: a Tab pressed during the close
  // would otherwise land inside it and be lost when it hides
  useEffect(() => { if (outer.current) outer.current.inert = !open; }, [open]);
  const content = reduce
    ? { initial: false, animate: { opacity: open ? 1 : 0 }, transition: { duration: open ? 0.18 : 0.1 } }
    : {
        initial: false,
        animate: open ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
        transition: open
          ? { opacity: { duration: 0.3, delay: delay + 0.08, ease: "easeOut" }, y: { type: "spring", stiffness: 260, damping: 24, delay: delay + 0.05 } }
          : { duration: 0.14, ease: "easeIn" },
      };
  return (
    <motion.div ref={outer} id={id} role="region" aria-labelledby={labelledBy} className="ts-faq-panel" style={{ height: h, visibility: !open && rest ? "hidden" : undefined }}>
      <motion.div ref={inner} className="ts-faq-in" {...content}>{children}</motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ answer parts */

function Answer({ blocks, terms }) {
  return (
    <div className="ts-faq-ans">
      {blocks.map((b, i) => {
        if (b == null || b === false) return null;
        if (isValidElement(b) || typeof b !== "object") return <Fragment key={i}>{b}</Fragment>;   // a node of your own
        if (b.node !== undefined) return <div key={i} className="ts-faq-node">{b.node}</div>;
        if (b.p) return <p key={i} className="ts-faq-p"><Rich text={b.p} terms={terms} /></p>;
        if (b.ul || b.ol) {
          const L = b.ul ? "ul" : "ol";
          return <L key={i} className={b.ul ? "ts-faq-ul" : "ts-faq-ol"}>{(b.ul ?? b.ol).map((li, j) => <li key={j}><Rich text={li} terms={terms} /></li>)}</L>;
        }
        if (b.note) return <p key={i} className="ts-faq-note"><Icon name="alert" size={16} stroke={2} /><span>{b.label && <b>{b.label}: </b>}<Rich text={b.note} terms={terms} /></span></p>;
        const t = b.table;
        if (!t) return null;   // an unknown block renders nothing instead of taking the page down
        const num = t.num ?? [];   // optional: indexes of right-aligned (numeric) columns
        return (
          <table key={i} className="ts-faq-tbl">
            {t.head?.length > 0 && <thead><tr>{t.head.map((hd, j) => <th key={j} scope="col" className={num.includes(j) ? "num" : undefined}>{hd}</th>)}</tr></thead>}
            <tbody>
              {(t.rows ?? []).map((r, j) => (
                <tr key={j}>
                  {r.map((c, k) => (
                    <td key={k} className={[num.includes(k) && "num", k === 0 && "lead"].filter(Boolean).join(" ") || undefined}>
                      {c !== null && typeof c === "object" ? <><Hl text={String(c.v ?? "")} terms={terms} />{c.s != null && <span className="ts-faq-tsub"><Hl text={String(c.s)} terms={terms} /></span>}</> : <Hl text={String(c ?? "")} terms={terms} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}

function CheckDraw({ reduce, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.38, delay: 0.12, ease: [0.3, 0.7, 0.2, 1] }} />
    </svg>
  );
}

/** "Was this helpful?" The picked pill grows into the thank-you (a layout morph); the question and the other pill fade away. */
function Feedback({ value, onPick, onChat, canChat, reduce }) {
  const lay = reduce ? false : true;
  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.12 } } };
  const pill = (v) => {
    const picked = value === v;
    const done = !!value;
    return (
      <motion.button key={v} type="button" layout={lay} className="ts-faq-pill" data-v={v} aria-disabled={done ? "true" : undefined}
        onClick={() => !done && onPick(v)} style={{ borderRadius: 99 }} transition={FLIP} {...fade}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={picked ? "t" : "a"} layout={lay ? "position" : false} className="ts-faq-pilltx" initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.1 } }} transition={{ duration: 0.2, delay: picked ? 0.06 : 0 }}>
            {picked
              ? v === "yes" ? <><CheckDraw reduce={reduce} />Thanks, glad it helped</> : <><Icon name="check" size={15} stroke={2.2} />Thanks, we'll rework this answer</>
              : v === "yes" ? "Yes" : "No"}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    );
  };
  return (
    <div className="ts-faq-fb">
      <AnimatePresence mode="popLayout" initial={false}>
        {!value && <motion.span key="q" layout={lay ? "position" : false} className="ts-faq-fbq" {...fade}>Was this helpful?</motion.span>}
        {(!value || value === "yes") && pill("yes")}
        {(!value || value === "no") && pill("no")}
        {value === "no" && canChat && (
          <motion.span key="chat" layout={lay ? "position" : false} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.25 } }} exit={{ opacity: 0 }}>
            <button type="button" className="ts-faq-text" onClick={onChat}>Ask a person</button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyLink({ id, onCopied }) {
  const [ok, setOk] = useState(false);
  const t = useRef(0);
  useEffect(() => () => clearTimeout(t.current), []);
  const copy = async () => {
    const url = deepLink(id);
    let done = false;
    try { await navigator.clipboard.writeText(url); done = true; } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: url });
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta); ta.select();
      try { done = document.execCommand("copy"); } catch { done = false; }
      ta.remove();
    }
    setOk(true);
    onCopied(done ? "Link copied" : "Link ready: " + url);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOk(false), 1800);
  };
  return (
    <button type="button" className="ts-faq-link" onClick={copy} aria-label={ok ? "Link copied" : "Copy link to this answer"}>
      <span className="ts-faq-swap">
        <span data-on={!ok}><Icon name="link" size={15} stroke={2} />Copy link</span>
        <span data-on={ok}><Icon name="check" size={15} stroke={2.4} data-ok="" />Copied</span>
      </span>
    </button>
  );
}

/** Link to one answer. The gallery routes with the hash (#/slug?…), so there it rides along as ?faq=; elsewhere it's #faq-id. */
function deepLink(id) {
  const { origin, pathname, search, hash } = location;
  if (hash.startsWith("#/")) {
    const [route, qs = ""] = hash.split("?");
    const params = new URLSearchParams(qs);
    params.set("faq", id);
    return `${origin}${pathname}${search}${route}?${params}`;
  }
  return `${origin}${pathname}${search}#faq-${id}`;
}
function idFromHash(ids) {
  const h = location.hash;
  const m = h.match(/[?&]faq=([\w-]+)/) ?? h.match(/^#faq-([\w-]+)$/);
  return m && ids.has(m[1]) ? m[1] : null;
}

function ChatButton({ help, onChat, onContact }) {
  const [st, setSt] = useState("idle");
  const reduce = useReducedMotion();
  const t = useRef(0);
  useEffect(() => () => clearTimeout(t.current), []);
  // your own content: a link, or a button that calls onContact. Only the untouched sample plays the demo chat.
  if (help.href) return <a className="ts-faq-cta" href={help.href} onClick={onContact}><Icon name="message" size={16} stroke={2} />{help.cta}</a>;
  const go = () => {
    if (onContact || help !== DEFAULT_HELP) { onContact?.(); return; }
    if (st !== "idle") return;
    setSt("busy");
    onChat?.("Connecting you to Tern support");
    t.current = setTimeout(() => { setSt("open"); onChat?.("Chat open. Inès from Tern support usually replies in about 3 minutes."); }, 900);
  };
  return (
    <button type="button" className="ts-faq-cta" data-st={st} onClick={go} aria-disabled={st !== "idle" ? "true" : undefined}>
      {st === "idle" && <><Icon name="message" size={16} stroke={2} />{help.cta}</>}
      {st === "busy" && <><span className="ts-faq-spin" aria-hidden />Connecting…</>}
      {st === "open" && <><CheckDraw size={16} reduce={reduce} />Chat open · Inès is on it</>}
    </button>
  );
}

function HelpCard({ help, onChat, onContact }) {
  if (!help) return null;
  return (
    <div className="ts-faq-help">
      <span className="ts-faq-help-ic"><Icon name="message" size={19} stroke={2} /></span>
      <div className="ts-faq-help-tx">
        <b>{help.title}</b>
        {help.text && <span>{help.text}</span>}
      </div>
      {help.cta && <ChatButton help={help} onChat={onChat} onContact={onContact} />}
    </div>
  );
}

/* ------------------------------------------------------------------ category tabs */

const railMask = ({ l, r }) =>
  `linear-gradient(90deg, ${l ? "transparent" : "black"} 0, black ${l ? 28 : 0}px, black calc(100% - ${r ? 28 : 0}px), ${r ? "transparent" : "black"} 100%)`;

function CatTabs({ cats, value, counts, onChange, vertical, controls, reduce, baseId }) {
  const rail = useRef(null), track = useRef(null), refs = useRef({});
  const [ind, setInd] = useState(null);
  const [fade, setFade] = useState({ l: false, r: false });
  const tabs = [{ id: "all", name: "All" }, ...cats];

  const measure = useCallback(() => {
    const el = refs.current[value];
    if (el) setInd((o) => {
      const n = vertical ? { y: el.offsetTop, height: el.offsetHeight } : { x: el.offsetLeft, width: el.offsetWidth };
      return o && Object.keys(n).every((k) => Math.abs(o[k] - n[k]) < 0.5) ? o : n;
    });
    const r = rail.current;
    if (r && !vertical) {
      const max = r.scrollWidth - r.clientWidth, l = r.scrollLeft > 2, rr = r.scrollLeft < max - 2;
      setFade((f) => (f.l === l && f.r === rr ? f : { l, r: rr }));
    }
  }, [value, vertical]);
  useIsoLayoutEffect(measure, [measure]);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    if (rail.current) ro.observe(rail.current);
    Object.values(refs.current).forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const pick = (id, focus) => {
    onChange(id);
    const el = refs.current[id], r = rail.current;
    if (focus) el?.focus();
    if (!vertical && el && r && r.scrollWidth > r.clientWidth) r.scrollTo({ left: el.offsetLeft + el.offsetWidth / 2 - r.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  };
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    const next = { [vertical ? "ArrowDown" : "ArrowRight"]: i + 1, [vertical ? "ArrowUp" : "ArrowLeft"]: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next == null) return;
    e.preventDefault();
    pick(tabs[(next + tabs.length) % tabs.length].id, true);
  };

  const list = (
    <div ref={track} role="tablist" aria-label="Topics" aria-orientation={vertical ? "vertical" : "horizontal"} className="ts-faq-tabs" onKeyDown={onKey}>
      {ind && <motion.span className="ts-faq-ind" aria-hidden initial={false} animate={ind} transition={reduce ? { duration: 0 } : IND_SPRING} />}
      {tabs.map((t) => (
        <button key={t.id} ref={(el) => { if (el) refs.current[t.id] = el; }} id={`${baseId}-${t.id}`} type="button" role="tab" className="ts-faq-tab"
          aria-selected={t.id === value} aria-controls={controls} tabIndex={t.id === value ? 0 : -1} data-zero={counts[t.id] === 0}
          onClick={() => pick(t.id)}>
          <span>{t.name}</span>
          <span className="ts-faq-tabn"><RollingNumber value={counts[t.id]} stiffness={320} damping={28} /></span>
        </button>
      ))}
    </div>
  );
  if (vertical) return list;
  return (
    <div className="ts-faq-railbox">
      <div ref={rail} className="ts-faq-rail" onScroll={measure} style={{ maskImage: railMask(fade), WebkitMaskImage: railMask(fade) }}>{list}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ one question */

const Item = forwardRef(function Item({ item, open, off, terms, kwOnly, reduce, delay, flash, feedback, showFeedback, showCopyLink, canChat, onToggle, onKey, onFeedback, onSay, onChat, btnRef, level = 4 }, ref) {
  const H = "h" + level;
  const uid = useId().replace(/:/g, "");
  const btnId = `faq-q-${item.id}-${uid}`, panelId = `faq-a-${item.id}-${uid}`;
  return (
    <motion.div
      ref={ref}
      layout={reduce ? false : "position"}
      transition={FLIP}
      id={`faq-${item.id}`}
      className="ts-faq-item"
      data-open={open}
      data-flash={flash || undefined}
      initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduce ? 1 : 0.985, transition: { duration: 0.16 } }}
    >
      <H className="ts-faq-h">
        {/* disabled: aria-disabled and out of the Tab order (arrow keys skip it too); a click does not even move focus */}
        <button ref={btnRef} id={btnId} type="button" className="ts-faq-btn" aria-expanded={open} aria-controls={panelId} data-faq-btn={item.id}
          aria-disabled={off ? "true" : undefined} tabIndex={off ? -1 : undefined} onMouseDown={off ? (e) => e.preventDefault() : undefined}
          onClick={(e) => onToggle(item.id, e.currentTarget)} onKeyDown={(e) => onKey(e, item.id)}>
          <span className="ts-faq-qwrap">
            <span className="ts-faq-q">{item.qNode ?? <Hl text={item.q} terms={terms} />}</span>
            {typeof off === "string" && <span className="ts-faq-off">{off}</span>}
            {kwOnly.length > 0 && <span className="ts-faq-kw"><Icon name="search" size={12} stroke={2.2} />Matches <b>{kwOnly.map((k) => `“${k}”`).join(", ")}</b></span>}
          </span>
          <span className="ts-faq-pm"><PlusMinus open={open} reduce={reduce} /></span>
        </button>
      </H>
      <Collapse open={open} id={panelId} labelledBy={btnId} reduce={reduce} delay={delay}>
        <Answer blocks={item.a} terms={terms} />
        {(showFeedback || showCopyLink) && (
          <div className="ts-faq-foot">
            {showFeedback ? <Feedback value={feedback} reduce={reduce} canChat={canChat} onPick={(v) => { onFeedback(item.id, v); onSay(v === "yes" ? "Thanks for the feedback" : "Thanks, we'll improve this answer"); }} onChat={onChat} /> : <span />}
            {showCopyLink && <CopyLink id={item.id} onCopied={onSay} />}
          </div>
        )}
      </Collapse>
    </motion.div>
  );
});

/* ------------------------------------------------------------------ the help centre */

const add = (s, id) => new Set(s).add(id);
const del = (s, id) => { const n = new Set(s); n.delete(id); return n; };
/** An item is disabled by `disabled: true` (or a reason string) on its record, or by the "disabled" forced state. */
const offOf = (it, forceState) => it.disabled || (forceState === "disabled" && FORCED_OFF[it.id]) || false;
/** `defaultOpen`: "none", a 1-based position ("2"), or an item id. */
function initialOpen(defaultOpen, forceState, items) {
  if (forceState === "open") { const it = items.find((x) => x.id === FORCED_OPEN) ?? items[0]; return new Set(it ? [it.id] : []); }
  if (defaultOpen == null || defaultOpen === "none") return new Set();
  const it = items.find((x) => x.id === defaultOpen) ?? items[Number(defaultOpen) - 1];
  return it ? new Set([it.id]) : new Set();
}

/**
 * Accordion: a searchable FAQ (the sample content is the help centre of Tern, a travel eSIM app). Each answer measures itself and springs open (content rising in
 * just after the height starts) while the questions below glide down; the plus retracts its arm into a minus. In
 * single mode the clicked question stays under the pointer while the one above closes. Search filters live with
 * FLIP, highlights matches in questions and answers, and opens answers that matched only in their body. Topic chips
 * filter with a sliding indicator; every answer has a deep link, a copy-link button and "Was this helpful?".
 * Keyboard: ↑/↓/Home/End between questions, Enter/Space to toggle, ↓ from search to the first question, Esc clears.
 *
 * Content: `items` are your questions: { q, a, id?, cat?, kw?, disabled? }. `a` is plain text or blocks
 * ({ p }, { ul }, { ol }, { note }, { table: { head, rows } }); text takes **bold** and [label](href). `categories`
 * ([{ id, name }]) name the topics that items point at with `cat`; pass [] for one flat list. The header is
 * `eyebrow`, `title`, `subtitle` and `status` (each optional), `suggestions` seed the empty state, and `help` is the
 * "Still stuck?" card ({ title, text, cta, href }; null removes it) whose button calls `onContact`.
 */
export const Accordion = forwardRef(function Accordion({
  mode = "single",
  layout = "plain",
  showSearch = true,
  showCategories = true,
  defaultOpen = "none",
  value,
  defaultValue,
  onChange,
  items: itemsProp,
  categories: categoriesProp,
  eyebrow: eyebrowProp,
  title: titleProp,
  subtitle: subtitleProp,
  status: statusProp,
  suggestions: suggestionsProp,
  emptyHint: emptyHintProp,
  help: helpProp,
  showFeedback = true,
  showCopyLink = true,
  showCount = true,
  headingLevel = 4,
  titleLevel = 2,
  disabled = false,
  ariaLabel,
  onContact,
  onFeedback,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-accordion", CSS);
  // your content wins; with nothing passed the header, chips and help card are empty unless `demo` is on
  const pick = (v, sample, empty) => (v !== undefined ? v : demo ? sample : empty);
  const itemsIn = itemsProp !== undefined && !(demo && Array.isArray(itemsProp) && !itemsProp.length) ? itemsProp : demo ? ITEMS : NONE;
  const categories = pick(categoriesProp, CATS, NONE);
  const eyebrow = pick(eyebrowProp, "Tern help centre", "");
  const title = pick(titleProp, "Questions, answered", "");
  const subtitle = pick(subtitleProp, "Installing, topping up and troubleshooting your travel eSIM, written by the team that answers the chats.", "");
  const status = pick(statusProp, DEFAULT_STATUS, null);
  const suggestions = pick(suggestionsProp, SUGGEST, NONE);
  const emptyHint = pick(emptyHintProp, "Try fewer or simpler words, or one of the questions travellers ask most:", "Try fewer or simpler words, or one of these:");
  const help = pick(helpProp, DEFAULT_HELP, null);
  const lvl = (n, d) => Math.min(6, Math.max(1, Math.round(Number(n)) || d));
  const qLevel = lvl(headingLevel, 4), tLevel = lvl(titleLevel, 2), gLevel = Math.min(6, tLevel + 1);
  const TitleTag = "h" + tLevel;
  const GroupTag = motion["h" + gLevel];
  const EmptyTag = "h" + gLevel;   // the empty state's heading sits where a group heading would
  const reduce = !!useReducedMotion();
  const touch = useMedia(TOUCH);
  const root = useRef(null), searchRef = useRef(null), bar = useRef(null);
  const setRoot = useCallback((el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref]);
  const btns = useRef({});
  const listId = "faq-list-" + useId().replace(/:/g, "");

  const ITEMS_ = useMemo(() => normalise(itemsIn), [itemsIn]);
  const CATS_ = categories ?? [];
  const catName = Object.fromEntries(CATS_.map((c) => [c.id, c.name]));
  const index = useMemo(() => indexOf(ITEMS_), [ITEMS_]);
  const idsRef = useRef(null);
  idsRef.current = new Set(ITEMS_.map((it) => it.id));
  // the demo chat is only for the untouched sample; your own card needs onContact or an href to offer a person
  const canChat = !!help && (!!onContact || !!help.href || help === DEFAULT_HELP);
  const contact = () => { if (onContact) return onContact(); if (help?.href) location.assign(help.href); else setSaid("Opening a chat with Tern support"); };

  const [query, setQuery] = useState(forceState === "empty" ? EMPTY_QUERY : "");
  const [cat, setCat] = useState("all");
  // which answers are open: `value` (ids) when controlled, else the component's own set seeded by defaultValue / defaultOpen.
  // Answers that search opens on its own are kept apart (`auto`) and are not reported.
  const toSet = (v) => new Set(v == null ? [] : (Array.isArray(v) ? v : [v]).map(String));
  const controlled = value !== undefined;
  const ctrlRef = useRef(controlled);
  ctrlRef.current = controlled;
  const [innerOpen, setInnerOpen] = useState(() => (defaultValue !== undefined && forceState !== "open" ? toSet(defaultValue) : initialOpen(defaultOpen, forceState, ITEMS_)));
  const open = controlled ? toSet(value) : innerOpen;
  const openRef = useRef(open);
  openRef.current = open;
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const setOpen = useCallback((upd) => {
    const prev = openRef.current;
    const next = typeof upd === "function" ? upd(prev) : upd;
    if (next.size === prev.size && [...next].every((id) => prev.has(id))) return;
    openRef.current = next;
    if (!ctrlRef.current) setInnerOpen(next);
    changeRef.current?.([...next]);
  }, []);
  const [auto, setAuto] = useState(() => new Set());
  const [feedback, setFeedback] = useState({});
  const [cascade, setCascade] = useState(null);
  const [flash, setFlash] = useState(null);
  const [said, setSaid] = useState("");
  const [stuck, setStuck] = useState(false);
  const [width, setWidth] = useState(0);

  // forced states and the default-open control re-seed the view
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) { seeded.current = true; return; }
    setQuery(forceState === "empty" ? EMPTY_QUERY : "");
    setCat("all");
    setAuto(new Set());
    if (!ctrlRef.current) setOpen(initialOpen(defaultOpen, forceState, ITEMS_));
  }, [forceState, defaultOpen]);
  // switching to single keeps only the most recently opened answer
  useEffect(() => { if (mode === "single") setOpen((s) => (s.size > 1 ? new Set([[...s].pop()]) : s)); }, [mode]);

  // width decides the two-column layout (measured before paint, then kept current)
  useIsoLayoutEffect(() => {
    const el = root.current;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const wide = layout === "columns" && width >= 820;

  const searchOn = showSearch || forceState === "empty";
  const terms = useMemo(() => (searchOn ? toTerms(query) : []), [query, searchOn]);
  const info = useMemo(() => Object.fromEntries(ITEMS_.map((it) => [it.id, matchInfo(index[it.id], terms)])), [terms, index]);
  const matched = ITEMS_.filter((it) => info[it.id].match);
  const counts = { all: matched.length };
  for (const c of CATS_) counts[c.id] = matched.filter((it) => it.cat === c.id).length;
  const catsOn = showCategories && CATS_.length > 0;
  const activeCat = catsOn && (cat === "all" || catName[cat] !== undefined) ? cat : "all";
  const visible = matched.filter((it) => activeCat === "all" || it.cat === activeCat);
  const visibleKey = visible.map((it) => it.id).join(",");
  const offIds = new Set(ITEMS_.filter((it) => disabled || offOf(it, forceState)).map((it) => it.id));
  const offRef = useRef(offIds);
  offRef.current = offIds;
  // a disabled question never opens: not by click, keyboard, deep link, defaultOpen, search or Expand all
  const isOpen = (id) => !offIds.has(id) && (open.has(id) || auto.has(id));
  const navIds = visible.filter((it) => !offIds.has(it.id)).map((it) => it.id);

  // answers that matched only in their body open on their own once typing pauses
  useEffect(() => {
    if (!terms.length) { setAuto((a) => (a.size ? new Set() : a)); return; }
    const t = setTimeout(() => {
      const ids = visible.filter((it) => info[it.id].answer && !offRef.current.has(it.id)).map((it) => it.id);
      if (mode === "single") {
        setAuto(new Set(ids.slice(0, 1)));
        if (ids.length) setOpen(new Set());
      } else setAuto(new Set(ids.slice(0, 4)));
    }, 260);
    return () => clearTimeout(t);
  }, [terms.join(" "), visibleKey, mode]);

  // announce results once typing pauses
  useEffect(() => {
    if (!terms.length) return;
    const t = setTimeout(() => setSaid(visible.length ? `${visible.length} ${visible.length === 1 ? "answer" : "answers"} for ${query.trim()}` : `No answers for ${query.trim()}`), 500);
    return () => clearTimeout(t);
  }, [terms.join(" "), visibleKey]);

  // sticky search: hairline + shadow once it is pinned to the top of the scroll container
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const sc = scrollParentOf(el.parentElement);
    const doc = sc === document.scrollingElement;
    const target = doc ? window : sc;
    // sticky insets count from inside the scroller's padding: offset by it so the bar pins to the very top edge
    const pad = doc ? 0 : parseFloat(getComputedStyle(sc).paddingTop) || 0;
    if (!wide) el.style.top = `${-pad}px`;
    const on = () => {
      const top = doc ? 0 : sc.getBoundingClientRect().top;
      const r = el.getBoundingClientRect(), parent = root.current.getBoundingClientRect();
      setStuck(r.top <= top + 0.5 && parent.top < top - 1);
    };
    on();
    target.addEventListener("scroll", on, { passive: true });
    return () => target.removeEventListener("scroll", on);
  }, [searchOn, wide]);

  // deep links: #faq-id, or ?faq=id inside the gallery's hash route
  useEffect(() => {
    const go = () => {
      const id = idFromHash(idsRef.current);
      if (!id || offRef.current.has(id)) return;
      setQuery(""); setCat("all"); setAuto(new Set());
      setOpen((s) => (mode === "single" ? new Set([id]) : add(s, id)));
      setFlash(id);
      setTimeout(() => setFlash(null), 1700);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const b = btns.current[id];
        b?.closest(".ts-faq-item")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        b?.focus({ preventScroll: true });
      }));
    };
    go();
    addEventListener("hashchange", go);
    return () => removeEventListener("hashchange", go);
  }, []);

  const toggle = (id, el) => {
    if (offIds.has(id)) return;
    if (isOpen(id)) { setOpen((s) => del(s, id)); setAuto((s) => del(s, id)); return; }
    if (mode === "single") {
      const order = visible.map((it) => it.id), at = order.indexOf(id);
      if (order.slice(0, at).some(isOpen) && el) keepPut(el);
      setOpen(new Set([id]));
      setAuto(new Set());
    } else setOpen((s) => add(s, id));
  };
  const allOpen = navIds.length > 0 && navIds.every(isOpen);
  const toggleAll = () => {
    const order = navIds;
    setCascade({ order, at: Date.now() });
    if (allOpen) { setOpen(new Set()); setAuto(new Set()); } else setOpen((s) => new Set([...s, ...order]));
  };
  useEffect(() => { if (!cascade) return; const t = setTimeout(() => setCascade(null), 900); return () => clearTimeout(t); }, [cascade]);

  const focusQ = (id) => btns.current[id]?.focus();
  const onKey = (e, id) => {
    const order = navIds, i = order.indexOf(id);
    if (e.key === "ArrowDown") { e.preventDefault(); focusQ(order[Math.min(order.length - 1, i + 1)]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (i === 0 && searchRef.current) searchRef.current.focus(); else focusQ(order[Math.max(0, i - 1)]); }
    else if (e.key === "Home") { e.preventDefault(); focusQ(order[0]); }
    else if (e.key === "End") { e.preventDefault(); focusQ(order[order.length - 1]); }
  };
  const onRootKey = (e) => {
    if (e.key !== "/" || !searchRef.current || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    e.preventDefault();
    searchRef.current.focus();
  };

  // what to render: group headings in the "All" view, then items; or the empty state
  const grouped = activeCat === "all";
  const rows = [];
  for (const c of CATS_) {
    const its = visible.filter((it) => it.cat === c.id);
    if (!its.length) continue;
    if (grouped) rows.push({ kind: "h", key: "h-" + c.id, cat: c, n: its.length });
    for (const it of its) rows.push({ kind: "q", key: it.id, item: it });
  }
  // questions outside every topic (or all of them, when there are no topics) follow in their own order
  for (const it of visible) if (catName[it.cat] === undefined) rows.push({ kind: "q", key: it.id, item: it });
  const elsewhere = activeCat !== "all" ? counts.all : 0;
  const q = query.trim();

  const ent = (i) => ({ initial: { opacity: 0, y: reduce ? 0 : 12 }, animate: { opacity: 1, y: 0 }, transition: reduce ? { duration: 0.2 } : { ...ENTRANCE, delay: i * 0.06 } });

  const head = (eyebrow || title || subtitle || status) && (
    <motion.header className="ts-faq-head" {...ent(0)}>
      <div className="ts-faq-titles">
        {eyebrow && <p className="ts-faq-eyebrow"><i />{eyebrow}</p>}
        {title && <TitleTag className="ts-faq-title">{title}</TitleTag>}
        {subtitle && <p className="ts-faq-sub">{subtitle}</p>}
      </div>
      {status && <span className="ts-faq-status"><Icon name="check" size={14} stroke={2.6} />{status.label ?? status}{status.detail && <span>· {status.detail}</span>}</span>}
    </motion.header>
  );

  const search = searchOn && (
    <div ref={bar} className={wide ? undefined : "ts-faq-searchbar"} data-stuck={stuck}>
      <motion.div className="ts-faq-search" {...ent(1)}>
        <Icon name="search" size={19} stroke={2} />
        <input
          ref={searchRef}
          type="search"
          className="ts-faq-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) { e.preventDefault(); setQuery(""); }
            if (e.key === "ArrowDown" && navIds.length) { e.preventDefault(); focusQ(navIds[0]); }
          }}
          placeholder={touch || wide || !suggestions?.length ? "Search answers" : `Search ${ITEMS_.length} answers, e.g. “${suggestions[0]}”`}
          aria-label="Search help articles"
          aria-controls={listId}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button type="button" className="ts-faq-clear" aria-label="Clear search" onClick={() => { setQuery(""); searchRef.current?.focus(); }}><Icon name="x" size={14} stroke={2.4} /></button>
        ) : (
          !touch && <kbd className="ts-faq-kbd" aria-hidden>/</kbd>
        )}
      </motion.div>
    </div>
  );

  const tabs = catsOn && (
    <motion.div {...ent(2)}>
      <CatTabs cats={CATS_} value={activeCat} counts={counts} onChange={setCat} vertical={wide} controls={listId} reduce={reduce} baseId={listId} />
    </motion.div>
  );

  const countLine = (showCount || mode === "multiple") && (
    <div className="ts-faq-bar">
      {showCount ? (
        <p className="ts-faq-count">
          <b><RollingNumber value={visible.length} stiffness={320} damping={28} /></b> {visible.length === 1 ? "answer" : "answers"}
          {q ? <> for <q>{q}</q></> : activeCat !== "all" ? <> in {catName[activeCat]}</> : CATS_.length > 1 ? <> across {CATS_.length} topics</> : null}
        </p>
      ) : <span />}
      {mode === "multiple" && visible.length > 0 && (
        <button type="button" className="ts-faq-ghost" onClick={toggleAll} aria-controls={listId}>
          <PlusMinus open={allOpen} reduce={reduce} size={13} />{allOpen ? "Collapse all" : "Expand all"}
        </button>
      )}
    </div>
  );

  const list = (
    <motion.div {...ent(3)}>
      {countLine}
      <div id={listId} className="ts-faq-list" role={catsOn ? "tabpanel" : undefined} aria-labelledby={catsOn ? `${listId}-${activeCat}` : undefined} aria-label={catsOn ? undefined : "Questions"}>
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((r) => r.kind === "h" ? (
            <GroupTag key={r.key} layout={reduce ? false : "position"} transition={FLIP} className="ts-faq-gh"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.14 } }}>
              {r.cat.name}<span>{r.n}</span>
            </GroupTag>
          ) : (
            <Item
              key={r.key}
              item={r.item}
              open={isOpen(r.item.id)}
              off={disabled || offOf(r.item, forceState)}
              level={qLevel}
              terms={terms}
              kwOnly={info[r.item.id].kwOnly}
              reduce={reduce}
              delay={cascade && !reduce ? Math.max(0, cascade.order.indexOf(r.item.id)) * 0.04 : 0}
              flash={flash === r.item.id}
              feedback={feedback[r.item.id]}
              showFeedback={showFeedback}
              showCopyLink={showCopyLink}
              canChat={canChat}
              onToggle={toggle}
              onKey={onKey}
              onFeedback={(id, v) => { setFeedback((f) => ({ ...f, [id]: v })); onFeedback?.(id, v); }}
              onSay={setSaid}
              onChat={contact}
              btnRef={(el) => { if (el) btns.current[r.item.id] = el; }}
            />
          ))}
          {visible.length === 0 && (
            <motion.div key="empty" className="ts-faq-empty" initial={{ opacity: 0, y: reduce ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 26, delay: 0.08 }}>
              <span className="ts-faq-empty-ic"><Icon name="search" size={20} stroke={2} /></span>
              <EmptyTag className="ts-faq-empty-h">{q ? <>No answers for {"“"}{q}{"”"}{activeCat !== "all" && <> in {catName[activeCat]}</>}</> : activeCat !== "all" ? <>Nothing in {catName[activeCat]} yet</> : <>No questions yet</>}</EmptyTag>
              {elsewhere > 0 ? (
                <p>But {elsewhere} {elsewhere === 1 ? "answer matches" : "answers match"} in other topics. <button type="button" className="ts-faq-text" onClick={() => setCat("all")}>Search all topics</button></p>
              ) : q && suggestions?.length > 0 && (
                <>
                  <p>{emptyHint}</p>
                  <div className="ts-faq-sugg">
                    {suggestions.map((s) => <button key={s} type="button" className="ts-faq-chip" onClick={() => { setQuery(s); setCat("all"); searchRef.current?.focus(); }}><Icon name="search" size={13} stroke={2.2} />{s}</button>)}
                  </div>
                </>
              )}
              <HelpCard help={help} onChat={setSaid} onContact={onContact} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!wide && visible.length > 0 && <HelpCard help={help} onChat={setSaid} onContact={onContact} />}
    </motion.div>
  );

  return (
    <>{sheetTag}<section ref={setRoot} className={"ts-faq" + (className ? " " + className : "")} style={style} data-layout={layout} data-wide={wide} aria-label={ariaLabel ?? ((typeof eyebrow === "string" && eyebrow) || (typeof title === "string" && title) || "Questions and answers")} onKeyDown={onRootKey} {...rest}>
      {wide ? (
        <div className="ts-faq-cols">
          <aside className="ts-faq-side">
            {head}
            {search}
            {tabs}
            {help && <motion.div {...ent(3)}><HelpCard help={help} onChat={setSaid} onContact={onContact} /></motion.div>}
          </aside>
          <div className="ts-faq-main">{list}</div>
        </div>
      ) : (
        <>
          {head}
          {search}
          {tabs}
          {list}
        </>
      )}
      <span className="ts-sr" aria-live="polite">{said}</span>
    </section></>
  );
});
