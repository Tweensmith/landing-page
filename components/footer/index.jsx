"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useMotionValue, useSpring, useTransform } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { PageFrame, DemoLanding, useWidth } from "../_shared/page.jsx";
import { useInView } from "../_shared/chart.jsx";
import { Button } from "../button/index.jsx";

const CSS = `
.ts-ft{container:ft/inline-size;position:relative;width:100%;box-sizing:border-box;overflow:hidden;overflow:clip;isolation:isolate;
  --ft-bg:color-mix(in srgb,var(--ts-ink) 4%,var(--ts-bg));--ft-card:var(--ts-surface);--ft-edge:0px;--ft-pad:clamp(20px,4.4cqi,56px);
  background:var(--ft-bg);color:var(--ts-ink);font-family:var(--ts-font);text-align:left;-webkit-tap-highlight-color:transparent}
.ts-ft *{box-sizing:border-box}
.ts-ft[data-layout=curtain]{--ft-edge:26px}
.ts-ft[data-layout=static]{box-shadow:inset 0 1px 0 var(--ts-line)}

/* the curtain: the content sits on a track that reaches one footer-height above the box, so position: sticky can hold it
   against the bottom of the screen while the page above lifts away. The box clips (overflow: clip is not a scroller, so
   sticky still follows the page's scroller). */
.ts-ft-track{display:flow-root;margin-top:calc(-1 * var(--ft-ext,0px))}
.ts-ft-spacer{height:var(--ft-ext,0px)}
.ts-ft-in{position:relative;z-index:1;padding:calc(var(--ft-edge) + clamp(28px,3.8cqi,48px)) var(--ft-pad) clamp(12px,1.8cqi,20px);transform-origin:50% 100%}
.ts-ft[data-mode=pin] .ts-ft-in,.ts-ft[data-mode=tall] .ts-ft-in{position:sticky;bottom:var(--ft-stick,0px)}
.ts-ft[data-mode=tall] .ts-ft-in{transform-origin:50% 0}
/* the bottom edge of the page sheet, rounded, casting its shadow onto the footer below */
.ts-ft-edge{position:absolute;left:0;right:0;top:0;z-index:2;height:var(--ft-edge);pointer-events:none;background:var(--ft-page);
  border-radius:0 0 calc(var(--ts-radius-lg) + 12px) calc(var(--ts-radius-lg) + 12px);
  box-shadow:0 1px 0 var(--ts-line),0 18px 30px -16px color-mix(in srgb,var(--ts-black) 34%,transparent)}

.ts-ft-main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);grid-template-areas:"brand news" "cols cols";column-gap:clamp(28px,5cqi,64px);row-gap:clamp(28px,3.8cqi,42px);align-items:start}
.ts-ft-main:not([data-news]){grid-template-areas:"brand brand" "cols cols"}
.ts-ft-brand{grid-area:brand;min-width:0}
.ts-ft-news{grid-area:news;min-width:0}
.ts-ft-cols,.ts-ft-acc{grid-area:cols;min-width:0}

.ts-ft-logo{all:unset;display:inline-flex;align-items:center;gap:10px;font-size:17px;font-weight:680;letter-spacing:-0.02em;cursor:pointer;border-radius:8px}
.ts-ft-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-ft-statement{margin:14px 0 0;max-width:40ch;font-size:14.5px;line-height:1.55;color:var(--ts-ink2);text-wrap:pretty}

/* newsletter: a letter you address, with a stamp that gets postmarked */
.ts-ft-news-h{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin:0 0 6px;font-size:15px;font-weight:640;letter-spacing:-0.012em}
.ts-ft-news-h small{font-family:var(--ts-font-mono);font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-ft-news-p{margin:0 0 14px;max-width:48ch;font-size:13.5px;line-height:1.5;color:var(--ts-ink2)}
.ts-ft-letter{position:relative;display:flex;align-items:center;gap:12px;min-height:56px;margin:0;padding:6px 6px 6px 10px;border-radius:calc(var(--ts-radius-md) + 5px);background:var(--ft-card);
  box-shadow:inset 0 0 0 1px var(--ts-line),0 1px 2px color-mix(in srgb,var(--ts-black) 6%,transparent),0 16px 30px -24px color-mix(in srgb,var(--ts-black) 50%,transparent);transition:box-shadow .2s}
.ts-ft-letter:has(.ts-ft-input:focus){box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 16px 30px -24px color-mix(in srgb,var(--ts-black) 50%,transparent)}
.ts-ft-letter[data-invalid],.ts-ft-letter[data-invalid]:has(.ts-ft-input:focus){box-shadow:inset 0 0 0 1.5px var(--ts-danger),0 16px 30px -24px color-mix(in srgb,var(--ts-black) 50%,transparent)}
.ts-ft-letter .ts-btn{flex:none}
.ts-ft-addr{flex:1;min-width:0;display:flex;align-items:center;gap:10px}
.ts-ft-to{flex:none;font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2);cursor:text}
.ts-ft-input{all:unset;flex:1;min-width:0;height:40px;font-size:15px;letter-spacing:-0.005em;color:var(--ts-ink);
  background:linear-gradient(90deg,var(--ts-line) 55%,transparent 0) left calc(100% - 7px)/7px 1px repeat-x}
.ts-ft-input::placeholder{color:color-mix(in srgb,var(--ts-ink2) 72%,transparent)}
.ts-ft-input:focus-visible{outline:none}
.ts-ft-sent{flex:1;min-width:0;display:grid;gap:1px;line-height:1.3}
.ts-ft-sent-t{font-size:14px;color:var(--ts-ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ts-ft-sent-t b{font-weight:600;color:var(--ts-ink)}
.ts-ft-sent-s{font-size:12.5px;color:var(--ts-ink2)}
.ts-ft-change{all:unset;flex:none;position:relative;height:36px;padding:0 12px;border-radius:var(--ts-radius-md);font-size:13px;font-weight:560;color:var(--ts-ink);cursor:pointer}
.ts-ft-change:hover{background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}
.ts-ft-change:disabled{cursor:default;background:none}
.ts-ft-stamp{position:relative;flex:none;width:34px;height:40px}
.ts-ft-stamp-paper{position:absolute;inset:0;display:grid;place-items:center}
.ts-ft-perf{position:absolute;left:0;top:0}
.ts-ft-stamp-bg{fill:color-mix(in srgb,var(--ts-ink) 13%,var(--ft-card))}
.ts-ft-stamp-face{fill:color-mix(in srgb,var(--ts-accent) 16%,var(--ft-card));stroke:color-mix(in srgb,var(--ts-accent) 30%,transparent);stroke-width:.75}
.ts-ft-stamp-mark{position:relative;color:var(--ts-accent)}
.ts-ft-postmark{position:absolute;left:-2px;top:0;overflow:visible;pointer-events:none;fill:none;stroke:color-mix(in srgb,var(--ts-ink) 58%,transparent);stroke-width:1.4;stroke-linecap:round}
.ts-ft-note{min-height:18px;margin-top:9px;font-size:12.5px;line-height:1.45;color:var(--ts-ink2)}
.ts-ft-note p{display:flex;align-items:flex-start;gap:7px;margin:0}
.ts-ft-note svg{flex:none;margin-top:1.5px}
.ts-ft-note .is-err{color:var(--ts-danger)}
.ts-ft-note .is-ok{color:var(--ts-success)}
.ts-ft-note .is-tip{color:var(--ts-warning)}
.ts-ft-fix{all:unset;font-weight:600;color:var(--ts-ink);text-decoration:underline;text-decoration-color:var(--ts-ink3);text-underline-offset:3px;cursor:pointer;border-radius:4px;overflow-wrap:anywhere}

/* link columns, with one highlight that travels between them */
.ts-ft-cols{position:relative;display:grid;grid-template-columns:repeat(var(--ft-n),minmax(0,1fr));gap:4px;margin:0 -14px}
.ts-ft-hl{position:absolute;left:0;top:0;border-radius:calc(var(--ts-radius-lg) + 2px);pointer-events:none;
  background:color-mix(in srgb,var(--ts-ink) 4.5%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 7%,transparent)}
.ts-ft-col{position:relative;min-width:0;padding:14px 14px 12px}
.ts-ft-colh{margin:0 0 10px;font-family:var(--ts-font-mono);font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2);transition:color .2s}
.ts-ft-col[data-on] .ts-ft-colh{color:var(--ts-ink)}
.ts-ft-links{display:grid;gap:1px;margin:0;padding:0;list-style:none}
.ts-ft-link{all:unset;position:relative;display:inline-flex;flex-wrap:wrap;align-items:center;gap:2px 7px;min-height:28px;max-width:100%;font-size:13.5px;line-height:1.3;color:var(--ts-ink2);cursor:pointer;border-radius:6px;transition:color .18s}
.ts-ft-col[data-on] .ts-ft-link{color:color-mix(in srgb,var(--ts-ink) 80%,var(--ts-ink2))}
.ts-ft-link:hover,.ts-ft-col[data-on] .ts-ft-link:hover{color:var(--ts-ink)}
.ts-ft-link-t{min-width:0;overflow-wrap:anywhere}
.ts-ft-go{flex:none;opacity:0;transform:translateX(-5px);transition:opacity .18s,transform .3s cubic-bezier(.3,1.4,.5,1)}
.ts-ft-link:hover .ts-ft-go,.ts-ft-link:focus-visible .ts-ft-go{opacity:1;transform:none}
.ts-ft-ext{flex:none;transform:rotate(-45deg);opacity:.55}
.ts-ft-badge{flex:none;display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:0;color:var(--ts-ink);background:color-mix(in srgb,var(--ts-accent) 18%,transparent);font-variant-numeric:tabular-nums;white-space:nowrap}

/* phone: the columns become an accordion */
.ts-ft-acc{border-top:1px solid var(--ts-line)}
.ts-ft-acc-item{border-bottom:1px solid var(--ts-line)}
.ts-ft-acc-h{margin:0;font:inherit}
.ts-ft-acc-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:54px;padding:0 2px;font-size:16px;font-weight:600;letter-spacing:-0.012em;color:var(--ts-ink);cursor:pointer;border-radius:8px}
.ts-ft-acc-n{font-family:var(--ts-font-mono);font-size:11px;font-weight:500;color:var(--ts-ink2);font-variant-numeric:tabular-nums}
.ts-ft-acc-pm{margin-left:auto;display:grid;place-items:center;width:30px;height:30px;border-radius:99px;color:var(--ts-ink2);background:color-mix(in srgb,var(--ts-ink) 6%,transparent)}
.ts-ft-acc-panel{overflow:hidden}
.ts-ft-acc-links{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:14px;margin:0;padding:0 2px 12px;list-style:none}
.ts-ft-acc-links .ts-ft-link{display:flex;min-height:44px;font-size:15px}

/* status, elsewhere, preferences */
.ts-ft-util{display:flex;flex-wrap:wrap;align-items:center;gap:12px 18px;margin-top:clamp(18px,2.6cqi,30px);padding-top:clamp(16px,2.2cqi,22px);border-top:1px solid var(--ts-line)}
.ts-ft-status{all:unset;--ft-s:var(--ts-success);position:relative;display:inline-flex;align-items:center;gap:9px;height:36px;max-width:100%;padding:0 13px 0 8px;border-radius:99px;font-size:13px;font-weight:560;color:var(--ts-ink);cursor:pointer;
  background:var(--ft-card);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .2s}
.ts-ft-status:hover{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ft-s) 50%,var(--ts-line))}
.ts-ft-status[data-s=degraded]{--ft-s:var(--ts-warning)}
.ts-ft-status[data-s=outage]{--ft-s:var(--ts-danger)}
.ts-ft-status-dot{position:relative;flex:none;display:grid;place-items:center;width:20px;height:20px;border-radius:99px;color:var(--ft-s);background:color-mix(in srgb,var(--ft-s) 18%,transparent)}
.ts-ft-status-ring{position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 1.5px var(--ft-s);animation:ts-ft-pulse 1.5s cubic-bezier(.2,.7,.3,1) 3 both}
@keyframes ts-ft-pulse{0%{transform:scale(1);opacity:.75}100%{transform:scale(2.3);opacity:0}}
.ts-ft-status-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ts-ft-status-d{padding-left:9px;border-left:1px solid var(--ts-line);font-weight:450;color:var(--ts-ink2);white-space:nowrap}
.ts-ft-social{display:flex;gap:2px;margin:0;padding:0;list-style:none}
.ts-ft-soc{all:unset;position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:99px;color:var(--ts-ink2);cursor:pointer;transition:color .15s,background-color .15s}
.ts-ft-soc:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 7%,transparent)}
.ts-ft-prefs{display:flex;align-items:center;gap:8px;margin-left:auto}
.ts-ft-lang{position:relative;display:inline-flex;align-items:center;min-width:0}
.ts-ft-lang select{all:unset;box-sizing:border-box;width:100%;height:36px;line-height:36px;padding:0 32px 0 34px;border-radius:99px;font-size:13px;font-weight:530;color:var(--ts-ink);cursor:pointer;
  background:var(--ft-card);box-shadow:inset 0 0 0 1px var(--ts-line);text-overflow:ellipsis;white-space:nowrap}
.ts-ft-lang svg{position:absolute;pointer-events:none;color:var(--ts-ink2)}
.ts-ft-lang svg:first-of-type{left:12px}
.ts-ft-lang svg:last-of-type{right:11px}
.ts-ft-appear{--b:32px;position:relative;flex:none;display:inline-flex;padding:2px;border-radius:99px;background:var(--ft-card);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-ft-appear button{all:unset;position:relative;z-index:1;display:grid;place-items:center;width:var(--b);height:var(--b);border-radius:99px;color:var(--ts-ink2);cursor:pointer;transition:color .2s}
.ts-ft-appear button:hover,.ts-ft-appear button[aria-checked=true]{color:var(--ts-ink)}
.ts-ft-thumb{position:absolute;left:2px;top:2px;width:var(--b);height:var(--b);border-radius:99px;background:color-mix(in srgb,var(--ts-ink) 10%,var(--ft-card));box-shadow:inset 0 0 0 1px var(--ts-line)}

.ts-ft-legal{display:flex;flex-wrap:wrap;align-items:center;gap:6px 20px;margin-top:10px;font-size:12.5px;line-height:1.45;color:var(--ts-ink2)}
.ts-ft-copy{margin:0}
.ts-ft-copy span{color:var(--ts-ink2)}
.ts-ft-legal-links{display:flex;flex-wrap:wrap;gap:2px 16px;margin:0;padding:0;list-style:none}
.ts-ft-legal-links .ts-ft-link{font-size:12.5px;min-height:26px}
.ts-ft-top{all:unset;position:relative;margin-left:auto;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 6px;border-radius:8px;font-size:12.5px;font-weight:550;color:var(--ts-ink2);cursor:pointer}
.ts-ft-top:hover{color:var(--ts-ink)}
.ts-ft-top svg{transform:rotate(-90deg)}

/* the wordmark: one span per letter, a blurred and a sharp copy crossfading, so only transform and opacity move */
.ts-ft-wm{position:relative;margin-top:clamp(16px,2.2cqi,28px);pointer-events:none;user-select:none;-webkit-user-select:none}
.ts-ft-wm-meas{position:absolute;left:0;top:0;visibility:hidden;white-space:pre;font-size:100px;line-height:1;font-weight:720;letter-spacing:-0.055em}
.ts-ft-wm-row{position:relative;width:100%;font-weight:720;letter-spacing:-0.055em;line-height:1}
.ts-ft-wm-l{position:absolute;white-space:pre;will-change:transform}
.ts-ft-wm-s,.ts-ft-wm-b{display:block}
.ts-ft-wm-s{color:var(--ts-ink);background:linear-gradient(180deg,var(--ts-ink) 30%,color-mix(in srgb,var(--ts-ink) 52%,var(--ft-bg)) 82%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;will-change:opacity}
.ts-ft-wm-b{position:absolute;left:0;top:0;color:color-mix(in srgb,var(--ts-ink) 62%,transparent);filter:blur(.075em);will-change:opacity}

.ts-ft[data-disabled] :is(.ts-ft-link,.ts-ft-logo,.ts-ft-status,.ts-ft-soc,.ts-ft-top,.ts-ft-acc-btn,.ts-ft-lang,.ts-ft-appear,.ts-ft-letter){opacity:.5;cursor:not-allowed}
.ts-ft[data-disabled] :is(.ts-ft-link,.ts-ft-soc,.ts-ft-top,.ts-ft-status):hover{color:var(--ts-ink2);background:none}
.ts-ft[data-disabled] :is(button,select,input){cursor:not-allowed}
.ts-ft-logo:focus-visible,.ts-ft-link:focus-visible,.ts-ft-status:focus-visible,.ts-ft-soc:focus-visible,.ts-ft-lang select:focus-visible,.ts-ft-appear button:focus-visible,
.ts-ft-top:focus-visible,.ts-ft-acc-btn:focus-visible,.ts-ft-fix:focus-visible,.ts-ft-change:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}

@container ft (min-width:1100px){
  .ts-ft-main{grid-template-columns:minmax(300px,4fr) minmax(0,8fr);grid-template-areas:"brand cols" "news cols";align-items:start;row-gap:30px}
  .ts-ft-main:not([data-news]){grid-template-areas:"brand cols"}
  .ts-ft-news{align-self:end}
  .ts-ft-statement{font-size:15px}
}
@container ft (max-width:639.98px){
  .ts-ft[data-layout=curtain]{--ft-edge:20px}
  .ts-ft-in{padding-left:20px;padding-right:20px}
  .ts-ft-main{grid-template-columns:minmax(0,1fr);grid-template-areas:"brand" "news" "cols";row-gap:28px}
  .ts-ft-main:not([data-news]){grid-template-areas:"brand" "cols"}
  .ts-ft-logo{min-height:44px;padding-right:8px}
  .ts-ft-statement{font-size:14.5px;margin-top:6px}
  .ts-ft-letter{flex-wrap:wrap;gap:10px 12px;padding:10px 8px 8px 12px}
  .ts-ft-letter .ts-btn,.ts-ft-letter .ts-ft-change{flex:1 0 100%;justify-content:center;text-align:center}
  .ts-ft-change{height:44px;line-height:44px;box-shadow:inset 0 0 0 1px var(--ts-line)}
  .ts-ft-note{min-height:38px}
  .ts-ft-util{flex-direction:column;align-items:stretch;gap:12px;margin-top:22px;padding-top:0;border-top:0}
  .ts-ft-main:not(:has(.ts-ft-acc)) + .ts-ft-util{padding-top:18px;border-top:1px solid var(--ts-line)}
  .ts-ft-status{height:44px;order:1}
  .ts-ft-prefs{order:2;margin-left:0}
  .ts-ft-lang{flex:1}
  .ts-ft-lang select{height:44px;line-height:44px;font-size:16px}
  .ts-ft-appear{--b:44px}
  .ts-ft-input{height:44px;font-size:16px}
  .ts-ft-social{order:3;justify-content:space-between}
  .ts-ft-soc{width:44px;height:44px}
  .ts-ft-legal{flex-direction:column;align-items:flex-start;gap:4px}
  .ts-ft-legal-links .ts-ft-link{min-height:40px;font-size:13.5px}
  .ts-ft-top{margin-left:-6px;height:44px;font-size:13.5px}
}
/* touch at tablet widths: thumb-sized targets without changing the look */
@media (pointer:coarse){
  .ts-ft-link::after,.ts-ft-top::after,.ts-ft-change::after{content:"";position:absolute;inset:-8px -4px}
  .ts-ft-soc{width:44px;height:44px}
  .ts-ft-status{height:44px}
  .ts-ft-lang select{height:44px;line-height:44px;font-size:16px}
  .ts-ft-appear{--b:44px}
  .ts-ft-input{height:44px}
}
@media (prefers-reduced-motion:reduce){
  .ts-ft-status-ring{display:none}
  .ts-ft-go{transition:opacity .18s}
}
`;
registerStyles("ts-footer", CSS);

/* ------------------------------------------------------------------ Northwind, the default content */

const DEFAULT_BRAND = {
  name: "Northwind",
  href: "/",
  statement: "Docs, boards and files in one calm place, for teams who would rather ship than chase status. Made by forty stubborn people in Lisbon and Lagos.",
};
const DEFAULT_COLUMNS = [
  { id: "product", title: "Product", priority: 1, links: [
    { label: "Docs", href: "/product/docs" },
    { label: "Boards", href: "/product/boards" },
    { label: "Files", href: "/product/files" },
    { label: "Northwind AI", href: "/product/ai", badge: "New" },
    { label: "Pricing", href: "/pricing" },
  ] },
  { id: "solutions", title: "Solutions", priority: 4, links: [
    { label: "Design teams", href: "/solutions/design" },
    { label: "Engineering", href: "/solutions/engineering" },
    { label: "Marketing", href: "/solutions/marketing" },
    { label: "Startups", href: "/solutions/startups" },
    { label: "Enterprise", href: "/enterprise" },
  ] },
  { id: "resources", title: "Resources", priority: 3, links: [
    { label: "Changelog", href: "/changelog", badge: "4.2" },
    { label: "Guides", href: "/guides" },
    { label: "API reference", href: "https://developers.northwind.app" },
    { label: "Community", href: "https://community.northwind.app" },
    { label: "Help centre", href: "/help" },
  ] },
  { id: "company", title: "Company", priority: 2, links: [
    { label: "About", href: "/about" },
    { label: "Customers", href: "/customers" },
    { label: "Careers", href: "/careers", badge: "6 open" },
    { label: "Press kit", href: "/press" },
    { label: "Contact", href: "/contact" },
  ] },
  { id: "legal", title: "Legal", priority: 5, legal: true, links: [
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Terms", href: "/legal/terms" },
    { label: "Security", href: "/security" },
    { label: "Cookies", href: "/legal/cookies" },
    { label: "DPA", href: "/legal/dpa" },
  ] },
];
const DEFAULT_NEWSLETTER = {
  name: "First Tuesday",
  tag: "Monthly",
  text: "What shipped, what’s next, and one thing we got wrong. One letter a month, never more.",
  label: "Your email address",
  placeholder: "you@company.com",
  cta: "Send it to me",
  note: "One click to leave. We never share your address.",
  success: "You’re on the list",
};
const DEFAULT_STATUS = {
  href: "https://status.northwind.app",
  operational: { label: "All systems normal", detail: "99.98% uptime this quarter" },
  degraded: { label: "Sync is running slow", detail: "EU region, investigating" },
  outage: { label: "File uploads are down", detail: "Fix in progress, updated 4 min ago" },
};
const DEFAULT_SOCIALS = [
  { id: "rss", label: "Changelog feed (RSS)", href: "/changelog.rss", icon: "rss" },
  { id: "forum", label: "Community forum", href: "https://community.northwind.app", icon: "forum" },
  { id: "video", label: "Video lessons", href: "/learn/videos", icon: "play" },
  { id: "mail", label: "Email the team", href: "mailto:hello@northwind.app", icon: "mail" },
  { id: "code", label: "Open-source SDKs", href: "https://code.northwind.app", icon: "code" },
];
const DEFAULT_LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Français" },
  { value: "es-MX", label: "Español (México)" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ja-JP", label: "日本語" },
];
const DEFAULT_LEGAL = { owner: "Northwind Labs, Inc.", line: "Made in Lisbon and Lagos.", top: "Back to top" };
const EMPTY_LEGAL = { owner: "", line: "", top: "Back to top" };
const SAMPLE_MARK = <Icon name="zap" size={15} stroke={2.2} />;
const FAILED = "We couldn’t add you just now. Try again in a minute.";
/** A link the caller owns; disabled, it keeps its place but is announced as disabled and leaves the tab order. */
const hrefOf = (href, dis) => (dis ? { role: "link", "aria-disabled": true } : { href });
const APPEAR = [
  { v: "light", label: "Light", icon: "sun" },
  { v: "dark", label: "Dark", icon: "moon" },
  { v: "system", label: "Match system", icon: "auto" },
];
const SAMPLE_EMAIL = "ana@lumen.studio";
const MIN_STAGE = 360;       // shorter scrollers get a plain footer: a curtain there would only hide content
const PEEK = 0.6;            // the demo opens with the footer this far revealed
const KNOWN = ["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com"];

/* ------------------------------------------------------------------ helpers */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const resolve = (s) => (s && typeof s === "object" && "current" in s ? s.current : s);
function scrollParent(el) {
  for (let a = el?.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
    if (/auto|scroll|overlay/.test(getComputedStyle(a).overflowY)) return a;
  }
  return window;
}
/** layout offset of el inside anc (ignores transforms and sticky shifts above anc) */
function offsetIn(el, anc) {
  let y = 0;
  for (let n = el; n && n !== anc; n = n.offsetParent) { y += n.offsetTop || 0; if (!n.offsetParent) break; }
  return y;
}
const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])";
function nextFirstTuesday(from = new Date()) {
  for (let m = 0; m < 3; m++) {
    const d = new Date(from.getFullYear(), from.getMonth() + m, 1);
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
    if (d > from) return d;
  }
  return from;
}
// optimal string alignment distance, so "gmial" is one slip from "gmail"
function dist(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}
/** Real validation: says what is wrong in words, and catches the common domain slips. */
function checkEmail(raw) {
  const v = raw.trim();
  if (!v) return { kind: "error", msg: "Add your email address first." };
  if (/\s/.test(v)) return { kind: "error", msg: "Email addresses can’t contain spaces." };
  const at = v.indexOf("@");
  if (at < 0) return { kind: "error", msg: "That’s missing an @, as in ana@studio.com." };
  if (v.indexOf("@", at + 1) >= 0) return { kind: "error", msg: "Use just one @." };
  const local = v.slice(0, at), domain = v.slice(at + 1).toLowerCase();
  if (!local) return { kind: "error", msg: "Add the name before the @." };
  if (!domain) return { kind: "error", msg: "Add the domain after the @, like studio.com." };
  if (!KNOWN.includes(domain)) {
    const near = KNOWN.find((k) => dist(k, domain) <= (k.length > 9 ? 2 : 1));
    if (near) return { kind: "suggest", fix: `${local}@${near}` };
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(domain)) return { kind: "error", msg: `“${domain}” doesn’t look like a domain yet.` };
  return { kind: "ok", value: v };
}

/* ------------------------------------------------------------------ small parts */

const GLYPH = {
  rss: <><path d="M5 5a14 14 0 0 1 14 14" /><path d="M5 11a8 8 0 0 1 8 8" /><circle cx="6" cy="18" r="1.5" fill="currentColor" stroke="none" /></>,
  forum: <path d="M4 5h11v8H9.5L5.5 16v-3H4zM15 9h5v8h-1.5v3L15 17h-4.5v-2" />,
  auto: <><circle cx="12" cy="12" r="7.5" /><path d="M12 4.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" stroke="none" /></>,
};
function Glyph({ name, size = 18 }) {
  if (!GLYPH[name]) return <Icon name={name} size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" style={{ flexShrink: 0 }}>
      {GLYPH[name]}
    </svg>
  );
}

function PlusMinus({ open, reduce }) {
  const p = useSpring(open ? 1 : 0, { stiffness: 520, damping: 26 });
  useEffect(() => { if (reduce) p.jump(open ? 1 : 0); else p.set(open ? 1 : 0); }, [open, reduce]);
  const d = useTransform(p, (v) => {
    const arm = 6.5 * Math.max(0, 1 - v), bar = 6.5 + 0.8 * v;
    return `M${(12 - bar).toFixed(2)} 12H${(12 + bar).toFixed(2)}M12 ${(12 - arm).toFixed(2)}V${(12 + arm).toFixed(2)}`;
  });
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden focusable="false">
      <motion.path d={d} />
    </svg>
  );
}

/** Springs its own height from wherever it is, then lets go to auto; hidden from focus once closed. */
function Collapse({ open, id, labelledBy, reduce, children }) {
  const outer = useRef(null), inner = useRef(null);
  const h = useMotionValue(open ? "auto" : 0);
  const [rest, setRest] = useState(!open);
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    const from = outer.current.offsetHeight, to = open ? inner.current.offsetHeight : 0;
    if (open) setRest(false);
    if (reduce) { h.set(open ? "auto" : 0); if (!open) setRest(true); return; }
    h.set(from);
    let live = true;
    const ctl = animate(h, to, open ? { type: "spring", stiffness: 300, damping: 33 } : { type: "spring", stiffness: 420, damping: 44 });
    ctl.then(() => { if (!live) return; if (open) h.set("auto"); else setRest(true); });
    return () => { live = false; ctl.stop(); };
  }, [open]);
  return (
    <motion.div ref={outer} id={id} role="region" aria-labelledby={labelledBy} className="ts-ft-acc-panel" style={{ height: h, visibility: !open && rest ? "hidden" : undefined }}>
      <motion.div ref={inner} initial={false} animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 6 }}
        transition={open ? { opacity: { duration: 0.25, delay: 0.06 }, y: { type: "spring", stiffness: 260, damping: 24, delay: 0.04 } } : { duration: 0.12 }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function FLink({ l, onLink, dis }) {
  const ext = /^https?:/.test(l.href ?? "");
  return (
    <a className="ts-ft-link" {...hrefOf(l.href, dis)} onClick={(e) => onLink(l, e)}>
      <span className="ts-ft-link-t">{l.label}</span>
      {l.badge && <span className="ts-ft-badge">{l.badge}</span>}
      {ext ? <><Icon name="arrowRight" size={12} className="ts-ft-ext" /><span className="ts-sr"> (external site)</span></> : <Icon name="arrowRight" size={12} className="ts-ft-go" />}
    </a>
  );
}

/** Desktop: one nav landmark per column, and a single soft highlight that springs to the column under the pointer or focus. */
function Columns({ cols, H, uid, reduce, onLink, dis }) {
  const grid = useRef(null);
  const [hl, setHl] = useState(null);
  const pick = (el, id) => setHl({ id, x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  return (
    <div ref={grid} className="ts-ft-cols" style={{ "--ft-n": cols.length }}
      onPointerLeave={() => setHl(null)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHl(null); }}>
      <AnimatePresence>
        {hl && (
          <motion.span key="hl" className="ts-ft-hl" aria-hidden
            initial={{ opacity: 0, x: hl.x, y: hl.y, width: hl.w, height: hl.h }}
            animate={{ opacity: 1, x: hl.x, y: hl.y, width: hl.w, height: hl.h }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34, opacity: { duration: 0.16 } }} />
        )}
      </AnimatePresence>
      {cols.map((c) => (
        <nav key={c.id} className="ts-ft-col" data-on={hl?.id === c.id || undefined} aria-labelledby={`${uid}-h-${c.id}`}
          onPointerEnter={(e) => { if (e.pointerType === "mouse") pick(e.currentTarget, c.id); }}
          onFocus={(e) => pick(e.currentTarget, c.id)}>
          <H id={`${uid}-h-${c.id}`} className="ts-ft-colh">{c.title}</H>
          <ul className="ts-ft-links">
            {c.links.map((l) => <li key={l.label}><FLink l={l} onLink={onLink} dis={dis} /></li>)}
          </ul>
        </nav>
      ))}
    </div>
  );
}

/** Phone: the same columns as an accordion (heading > button[aria-expanded] + region), still one nav per group. */
function Accordion({ cols, H, uid, reduce, onLink, dis }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div className="ts-ft-acc">
      {cols.map((c) => {
        const on = open.has(c.id), b = `${uid}-b-${c.id}`, p = `${uid}-p-${c.id}`;
        return (
          <nav key={c.id} className="ts-ft-acc-item" aria-labelledby={b}>
            <H className="ts-ft-acc-h">
              <button id={b} type="button" className="ts-ft-acc-btn" aria-expanded={on} aria-controls={p} disabled={dis} onClick={() => toggle(c.id)}>
                {c.title}<span className="ts-ft-acc-n" aria-hidden>{c.links.length}</span>
                <span className="ts-ft-acc-pm"><PlusMinus open={on} reduce={reduce} /></span>
              </button>
            </H>
            <Collapse open={on} id={p} labelledBy={b} reduce={reduce}>
              <ul className="ts-ft-acc-links">
                {c.links.map((l) => <li key={l.label}><FLink l={l} onLink={onLink} dis={dis} /></li>)}
              </ul>
            </Collapse>
          </nav>
        );
      })}
    </div>
  );
}

const POSTMARK = [
  "M26 9.5a10.5 10.5 0 1 0 0.01 0",
  "M3 14c3.5-3 7 3 10.5 0s7 3 10.5 0 7 3 10.5 0 5 2 7.5 0",
  "M3 20c3.5-3 7 3 10.5 0s7 3 10.5 0 7 3 10.5 0 5 2 7.5 0",
  "M3 26c3.5-3 7 3 10.5 0s7 3 10.5 0 7 3 10.5 0 5 2 7.5 0",
];
function Stamp({ posted, reduce, uid }) {
  const W = 34, HT = 40, holes = [];
  for (let x = 3.6; x < W - 1; x += 5.4) holes.push([x, 0], [x, HT]);
  for (let y = 3.4; y < HT - 1; y += 5.5) holes.push([0, y], [W, y]);
  const mid = `${uid}-perf`;
  return (
    <span className="ts-ft-stamp" aria-hidden>
      <motion.span className="ts-ft-stamp-paper" initial={false} animate={{ rotate: posted ? -7 : 0, scale: posted ? 0.96 : 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 16 }}>
        <svg className="ts-ft-perf" width={W} height={HT} viewBox={`0 0 ${W} ${HT}`}>
          <mask id={mid}><rect width={W} height={HT} fill="white" />{holes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.75} fill="black" />)}</mask>
          <rect width={W} height={HT} className="ts-ft-stamp-bg" mask={`url(#${mid})`} />
          <rect x="4" y="4" width={W - 8} height={HT - 8} rx="1.5" className="ts-ft-stamp-face" />
        </svg>
        <Icon name="zap" size={15} stroke={2.2} className="ts-ft-stamp-mark" />
      </motion.span>
      <svg className="ts-ft-postmark" width="44" height="40" viewBox="0 0 44 40">
        {POSTMARK.map((d, i) => (
          <motion.path key={i} d={d} initial={false} animate={{ pathLength: posted ? 1 : 0, opacity: posted ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { pathLength: { duration: 0.45, delay: 0.12 + i * 0.08, ease: [0.3, 0.7, 0.2, 1] }, opacity: { duration: 0.1, delay: 0.12 + i * 0.08 } }} />
        ))}
      </svg>
    </span>
  );
}

/**
 * The newsletter as a letter you address: real validation, a typo catcher, sending, then a postmark. It only claims
 * success when your onSubscribe resolves (or when you set `subscribed`); without a handler it validates and stops.
 */
function Newsletter({ data, H, uid, reduce, forced, demo, disabled, email: emailProp, defaultEmail, onEmailChange, error: errorProp, busy: busyProp, subscribed, onSubscribe }) {
  const box = useRef(null), form = useRef(null), input = useRef(null), change = useRef(null);
  const [inner, setInner] = useState(defaultEmail ?? "");
  const value = emailProp !== undefined ? emailProp ?? "" : inner;
  const setValue = (v) => { if (emailProp === undefined) setInner(v); onEmailChange?.(v); };
  const [phase, setPhase] = useState("idle");       // idle | sending | sent | done
  const [msg, setMsg] = useState(null);             // { kind: error | suggest, msg?, fix? }
  const [sentTo, setSentTo] = useState("");
  const alive = useRef(true), hadFocus = useRef(false);
  useEffect(() => () => { alive.current = false; }, []);
  const next = useMemo(() => nextFirstTuesday().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }), []);
  const owned = subscribed !== undefined;            // you own success: `subscribed` decides the postmark
  const shown = forced ? "done" : owned ? (subscribed ? "done" : busyProp || phase === "sending" ? "sending" : "idle") : busyProp && phase === "idle" ? "sending" : phase;
  const email = forced ? SAMPLE_EMAIL : sentTo || value;
  const shownMsg = errorProp ? { kind: "error", msg: errorProp } : msg;
  const inId = `${uid}-nl-in`, msgId = `${uid}-nl-msg`, hId = `${uid}-nl`;
  const detail = data.successDetail ?? (demo ? `The first letter lands on ${next}.` : "");
  const sentDetail = data.sentDetail ?? (demo ? `Next letter: ${next}` : "");

  const shake = () => { if (!reduce && form.current) animate(form.current, { x: [0, -7, 6, -4, 2, 0] }, { duration: 0.42, ease: "easeOut" }); };
  const validateLive = (v) => {
    const r = checkEmail(v);
    if (r.kind === "ok") setMsg(null);
    else if (r.kind === "error" && v.trim()) setMsg((m) => (m?.msg === r.msg ? m : r));
    else if (r.kind === "suggest") setMsg((m) => (m?.fix === r.fix ? m : r));
  };
  const submit = async (e) => {
    e.preventDefault();
    if (shown !== "idle" || phase !== "idle" || forced || disabled) return;
    const r = checkEmail(value);
    // a typo suggestion stops the first send; sending again keeps what was typed
    if (r.kind === "error" || (r.kind === "suggest" && msg?.fix !== r.fix)) {
      setMsg(r); shake();
      if (r.kind === "error") input.current?.focus();
      return;
    }
    const addr = value.trim();
    setMsg(null);
    if (!onSubscribe && !demo) return;               // nowhere to send it: never claim success on our own
    hadFocus.current = !!form.current?.contains(document.activeElement);
    setPhase("sending");
    try {
      await (onSubscribe ? onSubscribe(addr) : wait(900));
      if (!alive.current) return;
      setSentTo(addr);
      if (owned) { setPhase("idle"); return; }
      setPhase("sent");
      await wait(reduce ? 200 : 650);
      if (alive.current) setPhase("done");
    } catch (x) {
      if (!alive.current) return;
      setPhase("idle");
      setMsg({ kind: "error", msg: (onSubscribe && x?.message) || data.failed || FAILED });
    }
  };
  // the field and its button leave the DOM on success: keep focus in the letter, on "Change"
  useEffect(() => { if (shown === "done" && hadFocus.current) change.current?.focus({ preventScroll: true }); }, [shown]);
  const reset = () => {
    setPhase("idle"); setMsg(null); setValue(email); setSentTo("");
    requestAnimationFrame(() => { input.current?.focus({ preventScroll: true }); input.current?.select(); });
  };
  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } };
  const note = shownMsg
    ? { key: (shownMsg.msg ?? shownMsg.fix), icon: shownMsg.kind === "suggest" ? "help" : "alert", cls: shownMsg.kind === "suggest" ? "is-tip" : "is-err",
        body: shownMsg.kind === "suggest" ? <>Did you mean <button type="button" className="ts-ft-fix" disabled={disabled} onClick={() => { setValue(shownMsg.fix); setMsg(null); input.current?.focus(); }}>{shownMsg.fix}</button>?</> : shownMsg.msg }
    : shown === "done"
      ? { key: "ok", icon: "check", cls: "is-ok", body: <>{data.success || "Subscribed"}{detail ? <>. {detail}</> : null}</> }
      : data.note ? { key: "note", icon: "lock", cls: "", body: data.note } : null;

  return (
    <div ref={box} className="ts-ft-news">
      {data.name || data.tag ? <H id={hId} className="ts-ft-news-h">{data.name}{data.tag && <small>{data.tag}</small>}</H> : null}
      {data.text ? <p className="ts-ft-news-p">{data.text}</p> : null}
      <form ref={form} className="ts-ft-letter" noValidate onSubmit={submit} aria-labelledby={data.name || data.tag ? hId : undefined} aria-label={data.name || data.tag ? undefined : data.label || "Newsletter"}
        data-invalid={shownMsg?.kind === "error" || undefined}>
        <Stamp posted={shown === "done"} reduce={reduce} uid={uid} />
        <AnimatePresence mode="popLayout" initial={false}>
          {shown !== "done" ? (
            <motion.div key="addr" className="ts-ft-addr" {...swap} transition={{ type: "spring", stiffness: 420, damping: 36 }}>
              <label htmlFor={inId} className="ts-ft-to" aria-hidden>To</label>
              <input id={inId} ref={input} className="ts-ft-input" type="email" inputMode="email" autoComplete="email" spellCheck={false} autoCapitalize="off"
                name={data.inputName || "email"} required aria-label={data.label || "Email address"} placeholder={data.placeholder} value={value}
                readOnly={shown !== "idle"} disabled={disabled} aria-invalid={shownMsg?.kind === "error" || undefined} aria-describedby={msgId}
                onChange={(e) => { setValue(e.target.value); if (msg) validateLive(e.target.value); }}
                onBlur={() => { if (value.trim() && shown === "idle") validateLive(value); }} />
            </motion.div>
          ) : (
            <motion.div key="sent" className="ts-ft-sent" {...swap} transition={{ type: "spring", stiffness: 420, damping: 36, delay: reduce ? 0 : 0.08 }}>
              <span className="ts-ft-sent-t">Posted to <b>{email}</b></span>
              {sentDetail ? <span className="ts-ft-sent-s">{sentDetail}</span> : null}
            </motion.div>
          )}
        </AnimatePresence>
        {shown !== "done"
          ? <Button type="submit" label={data.cta || "Subscribe"} size="md" simulate={false} disabled={disabled} loading={shown === "sending"} success={phase === "sent"} />
          : <button ref={change} type="button" className="ts-ft-change" onClick={reset} disabled={forced || owned || disabled}>Change</button>}
      </form>
      <div id={msgId} className="ts-ft-note" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {note ? (
            <motion.p key={note.key} initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.18 }}>
              <Icon name={note.icon} size={14} stroke={2} className={note.cls} />
              <span>{note.body}</span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusPill({ status, info, reduce, compact, onLink, dis }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: false, amount: 0.9 });
  const s = info[status] ?? info.operational;
  const icon = status === "operational" ? "check" : status === "degraded" ? "alert" : "x";
  // three slow pulses (under 5 s) when something is wrong, each time it comes into view; never a standing loop
  const pulse = status !== "operational" && seen && !reduce;
  return (
    <a ref={ref} className="ts-ft-status" data-s={status} {...hrefOf(info.href, dis)} aria-label={`${s.label}${s.detail ? `. ${s.detail}` : ""}. Open the status page`}
      onClick={(e) => onLink({ label: s.label || "Status", href: info.href, status }, e)}>
      <span className="ts-ft-status-dot" aria-hidden>
        {pulse && <span key={status} className="ts-ft-status-ring" />}
        <Icon name={icon} size={11} stroke={3} />
      </span>
      <span className="ts-ft-status-t">{s.label}</span>
      {s.detail && !compact && <span className="ts-ft-status-d">{s.detail}</span>}
      <Icon name="arrowRight" size={13} className="ts-ft-ext" />
    </a>
  );
}

function Appearance({ value, onChange, reduce, dis }) {
  const refs = useRef([]);
  const i = Math.max(0, APPEAR.findIndex((o) => o.v === value));
  const onKey = (e) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d || dis) return;
    e.preventDefault();
    const n = (i + d + APPEAR.length) % APPEAR.length;
    onChange(APPEAR[n].v);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label="Appearance" aria-disabled={dis || undefined} className="ts-ft-appear" onKeyDown={onKey}>
      <motion.span className="ts-ft-thumb" aria-hidden initial={false} animate={{ x: `${i * 100}%` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 36 }} />
      {APPEAR.map((o, k) => (
        <button key={o.v} ref={(el) => (refs.current[k] = el)} type="button" role="radio" aria-checked={k === i} aria-label={o.label} title={o.label}
          tabIndex={k === i ? 0 : -1} disabled={dis} onClick={() => onChange(o.v)}>
          <Glyph name={o.icon} size={15} />
        </button>
      ))}
    </div>
  );
}

/** One letter: transform on the outer span, a blurred and a sharp copy crossfading inside. */
function Letter({ ch, x, top, i, n, p }) {
  const s = Math.min(0.055, 0.45 / Math.max(1, n - 1));
  const e = useTransform(p, (v) => easeOut(clamp((v - i * s) / (1 - (n - 1) * s))));
  const y = useTransform(e, (v) => `${((1 - v) * 0.6).toFixed(4)}em`);
  const fog = useTransform(e, (v) => (1 - v) * 0.9);
  return (
    <motion.span className="ts-ft-wm-l" style={{ left: x + "em", top: top + "em", y }}>
      <motion.span className="ts-ft-wm-s" style={{ opacity: e }}>{ch}</motion.span>
      <motion.span className="ts-ft-wm-b" style={{ opacity: fog }}>{ch}</motion.span>
    </motion.span>
  );
}

/** The giant wordmark, measured once (kerning and ink bounds) and sized to the exact width it is given. */
function Wordmark({ text, p, boxRef }) {
  const box = useRef(null), meas = useRef(null);
  const w = useWidth(box);
  const [m, setM] = useState(null);
  useIsoLayoutEffect(() => {
    const el = meas.current;
    if (!el) return;
    const read = () => {
      const node = el.firstChild;
      if (!node || !text) return setM(null);
      const cs = getComputedStyle(el), F = parseFloat(cs.fontSize) || 100, base = el.getBoundingClientRect().left;
      const rg = document.createRange(), xs = [];
      for (let i = 0; i < text.length; i++) { rg.setStart(node, i); rg.setEnd(node, i + 1); xs.push((rg.getBoundingClientRect().left - base) / F); }
      rg.setStart(node, 0); rg.setEnd(node, text.length);
      const whole = rg.getBoundingClientRect();
      let abl = 0, abr = (whole.right - base) / F, A = 0.74, D = 0.02, fA = 0.95, fD = 0.24;
      try {
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.font = `${cs.fontWeight} ${F}px ${cs.fontFamily}`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = cs.letterSpacing;
        const mt = ctx.measureText(text);
        if (mt.actualBoundingBoxRight) {
          abl = (mt.actualBoundingBoxLeft || 0) / F;
          abr = Math.min(abr + 0.02, mt.actualBoundingBoxRight / F);
          A = mt.actualBoundingBoxAscent / F; D = Math.max(0, mt.actualBoundingBoxDescent / F);
          if (mt.fontBoundingBoxAscent) { fA = mt.fontBoundingBoxAscent / F; fD = mt.fontBoundingBoxDescent / F; }
        }
      } catch { /* canvas unavailable: the defaults are close enough */ }
      const baseline = (1 - (fA + fD)) / 2 + fA;                 // baseline inside a line-height: 1 box
      setM({ xs: xs.map((x) => x + abl), width: abl + abr, top: -(baseline - A), height: A + D + 0.01 });
    };
    read();
    document.fonts?.ready?.then(read);
  }, [text]);
  const fs = m && w ? w / m.width : 0;
  return (
    <div ref={(el) => { box.current = el; if (boxRef) boxRef.current = el; }} className="ts-ft-wm" aria-hidden>
      <span ref={meas} className="ts-ft-wm-meas">{text}</span>
      <div className="ts-ft-wm-row" style={{ fontSize: fs || 1, height: m ? `${m.height}em` : 0 }}>
        {m && fs > 0 && text.split("").map((ch, i) => <Letter key={i + ch} ch={ch} x={m.xs[i]} top={m.top} i={i} n={text.length} p={p} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the footer */

/**
 * Footer — a site footer that is a reveal, not an afterthought. Signature: in the curtain layout the footer waits
 * beneath the page and the page lifts away to reveal it (CSS position: sticky inside a clipping box, so it is
 * compositor-smooth with touch scrolling), the page's rounded bottom edge casting a shadow onto it, while the giant
 * wordmark below the columns rises letter by letter and comes into focus as you reach the bottom. A footer taller
 * than its scroller pins its first screenful instead and then scrolls on; a scroller under 360px, or reduced motion,
 * gets a plain footer. The static layout animates the wordmark in once on view. One soft highlight travels
 * between link columns; the newsletter is a letter you address, with real validation and a postmark on success;
 * status, language, appearance, social and legal rows complete it. Phones get an accordion.
 * Everything shown is yours (brand, columns, newsletter, status, socials, locales, legal, wordmark); with none of it
 * the footer renders nothing. `demo` fills every blank with a sample company (Northwind) and, unless you set
 * demoPage={false}, puts the footer at the end of a sample page with its own scroller.
 */
export const Footer = forwardRef(function Footer({
  layout = "curtain",
  status = "operational",
  showNewsletter = true,
  showWordmark = true,
  showAppearance,
  columnCount = 5,
  frameHeight = 900,
  demo = false,
  disabled = false,
  brand,
  columns,
  newsletter,
  statusInfo,
  socials,
  locales,
  legal,
  wordmark,
  locale: localeProp,
  defaultLocale = "en-US",
  appearance: appearanceProp,
  defaultAppearance = "system",
  email,
  defaultEmail,
  onEmailChange,
  subscribeError,
  subscribing = false,
  subscribed,
  headingLevel = 2,
  pageColor = "var(--ts-bg)",
  demoPage,
  scroller,
  onSubscribe,
  onLocaleChange,
  onAppearanceChange,
  onNavigate,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-footer", CSS);
  const reduce = !!useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const root = useRef(null), inner = useRef(null), frame = useRef(null), wrap = useRef(null), wmBox = useRef(null);
  const width = useWidth(root);
  const phone = width > 0 && width < 640;
  const shownLayout = reduce || layout === "static" ? "static" : "curtain";   // reduced motion always gets the static footer
  const [mode, setMode] = useState("static");          // pin (bottom-held) | tall (first screen held) | static
  const [scEl, setScEl] = useState(null);
  const [fh, setFh] = useState(frameHeight);
  // the caller's content wins; a blank (undefined) falls back to the sample only with `demo`, to nothing otherwise
  const onPage = demoPage ?? demo;                     // the sample page around the footer: a demo by default
  const B = brand ?? (demo ? DEFAULT_BRAND : {});
  const logo = B.logo !== undefined ? B.logo : demo ? SAMPLE_MARK : null;
  const allCols = columns ?? (demo ? DEFAULT_COLUMNS : []);
  const news = newsletter ?? (demo ? DEFAULT_NEWSLETTER : null);
  const info = statusInfo ?? (demo ? DEFAULT_STATUS : null);
  const links = socials ?? (demo ? DEFAULT_SOCIALS : []);
  const LG = { ...EMPTY_LEGAL, ...(legal ?? (demo ? DEFAULT_LEGAL : null)) };
  const word = wordmark ?? (demo ? "Northwind" : "");
  const [localeOwn, setLocale] = useState(defaultLocale);
  const locale = localeProp ?? localeOwn;
  // no list, no picker; only the demo page falls back to the sample languages
  const localeList = locales ?? (demo && onPage ? DEFAULT_LOCALES : []);
  const [appearanceOwn, setAppearance] = useState(defaultAppearance);
  const appearance = appearanceProp ?? appearanceOwn;
  // the switch does nothing unless you act on it: shown with demo, or when you pass `appearance` / onAppearanceChange
  const showAppear = showAppearance ?? (demo || appearanceProp !== undefined || !!onAppearanceChange);
  const S = useRef({ raf: 0, mode: "static", touched: false, force: "init", settle: 0 }).current;

  const depth = useMotionValue(1);                     // how far the curtain has lifted, 0..1
  const wmRaw = useMotionValue(reduce ? 1 : 0);        // wordmark progress
  const wm = useSpring(wmRaw, { stiffness: 240, damping: 32, restDelta: 0.0005 });
  const scale = useTransform(depth, (v) => (reduce ? 1 : 0.97 + 0.03 * v));
  const fade = useTransform(depth, (v) => (reduce ? 1 : 0.72 + 0.28 * v));

  // columns: keep the N most important, in their own order; a hidden legal column folds into the legal line
  const n = clamp(Math.round(columnCount) || allCols.length, 1, Math.max(1, allCols.length));
  const keep = new Set(allCols.map((c, i) => ({ id: c.id, p: c.priority ?? i + 1 })).sort((a, b) => a.p - b.p).slice(0, n).map((o) => o.id));
  const shownCols = allCols.filter((c) => keep.has(c.id));
  const folded = allCols.filter((c) => !keep.has(c.id) && c.legal).flatMap((c) => c.links);

  // every link: your link.onClick and onNavigate(link, event) are called; disabled links do nothing
  const onLink = (l, e) => {
    if (disabled) { e.preventDefault(); return; }
    if (onPage) e.preventDefault();
    l.onClick?.(e);
    onNavigate?.(l, e);
  };

  // the scroll container: the demo page, the one passed in, or the nearest scrollable ancestor (else the window)
  useIsoLayoutEffect(() => {
    setScEl(onPage ? frame.current : resolve(scroller) || scrollParent(root.current));
  }, [onPage, scroller]);

  // demo page height: as tall as asked, but never taller than the stage it sits in
  useIsoLayoutEffect(() => {
    if (!onPage || !wrap.current) return;
    const host = scrollParent(wrap.current);
    const read = () => {
      let avail = innerHeight;
      if (host !== window) { const cs = getComputedStyle(host); avail = host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom); }
      setFh(Math.round(clamp(avail - 2, 380, Math.max(380, frameHeight))));
    };
    read();
    if (host === window) { addEventListener("resize", read); return () => removeEventListener("resize", read); }
    const ro = new ResizeObserver(read);
    ro.observe(host);
    return () => ro.disconnect();
  }, [onPage, frameHeight]);

  const geo = () => {
    const el = scEl, win = el === window;
    return {
      V: win ? innerHeight : el.clientHeight,
      top: win ? 0 : el.getBoundingClientRect().top + el.clientTop,
      pos: win ? scrollY : el.scrollTop,
      max: win ? document.documentElement.scrollHeight - innerHeight : el.scrollHeight - el.clientHeight,
    };
  };
  const scrollTo = (y, smooth) => {
    if (!scEl) return;
    if (smooth) (scEl === window ? window : scEl).scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    else if (scEl === window) window.scrollTo(0, y); else scEl.scrollTop = y;
  };

  // where the demo should sit for the current state: peeking by default, at the very end for scrolled/success
  const place = useRef(null);
  place.current = () => {
    if (!scEl || !root.current) return;
    const { V, top, pos, max } = geo();
    if (forceState === "scrolled" || forceState === "success") return scrollTo(max);
    if (forceState || !onPage) return;
    const r = root.current.getBoundingClientRect();
    scrollTo(clamp(r.top - top + pos - V + Math.min(r.height, V) * PEEK, 0, max));
  };

  // per frame while scrolling: read once, write motion values only
  const refresh = useRef(null);
  refresh.current = () => {
    const box = root.current;
    if (!box || !scEl) return;
    const { V, top, pos, max } = geo();
    const r = box.getBoundingClientRect(), T = r.top - top, H = r.height;
    if (S.mode === "static") { depth.set(1); return; }
    depth.set(clamp((V - T) / Math.min(H, V)));
    const d = T + H - V, D = Math.min(H, V) * 0.7;           // scroll left before the footer's end meets the screen's end
    wmRaw.set(pos >= max - 1 ? 1 : clamp(1 - d / D));
  };
  // on resize: decide the mode and size the sticky track (no work per scroll frame)
  const relayout = useRef(null);
  relayout.current = () => {
    const box = root.current, inn = inner.current;
    if (!box || !inn || !scEl) return;
    const { V, max } = geo();
    const H = inn.offsetHeight;
    const pin = shownLayout === "curtain" && V >= MIN_STAGE && max > Math.min(H, V) * 0.5;
    box.style.setProperty("--ft-ext", pin ? H + "px" : "0px");
    box.style.setProperty("--ft-stick", Math.min(0, V - H) + "px");
    const m = pin ? (H > V ? "tall" : "pin") : "static";
    if (m !== S.mode) { S.mode = m; box.dataset.mode = m; setMode(m); }
    if (!S.touched && performance.now() < S.settle) place.current();
    refresh.current();
  };

  useEffect(() => {
    if (!scEl || !inner.current) return;
    const target = scEl === window ? window : scEl;
    const onScroll = () => { if (!S.raf) S.raf = requestAnimationFrame(() => { S.raf = 0; refresh.current(); }); };
    const onResize = () => relayout.current();
    const touch = () => { S.touched = true; };
    const ro = new ResizeObserver(onResize);
    ro.observe(inner.current);
    if (scEl === window) ro.observe(document.body);
    else { ro.observe(scEl); for (const c of scEl.children) ro.observe(c); }
    target.addEventListener("scroll", onScroll, { passive: true });
    target.addEventListener("wheel", touch, { passive: true });
    target.addEventListener("touchstart", touch, { passive: true });
    target.addEventListener("keydown", touch);
    addEventListener("resize", onResize);
    relayout.current();
    return () => {
      ro.disconnect(); cancelAnimationFrame(S.raf); S.raf = 0;
      target.removeEventListener("scroll", onScroll); target.removeEventListener("wheel", touch);
      target.removeEventListener("touchstart", touch); target.removeEventListener("keydown", touch);
      removeEventListener("resize", onResize);
    };
  }, [scEl, shownLayout]);

  // states: a new forceState always re-places the page; layout settling (fonts, measured wordmark) re-places it for a moment
  useEffect(() => {
    if (!scEl) return;
    if (S.force !== forceState) { S.force = forceState; S.touched = false; S.settle = performance.now() + 1200; }
    if (!S.touched) place.current();
    relayout.current();
  }, [scEl, forceState, fh, phone]);

  // static footer (or curtain fallback): the wordmark rises once when it comes into view
  const wmSeen = useInView(wmBox, { once: true, amount: 0.4 });
  useEffect(() => {
    if (reduce) { wmRaw.jump(1); wm.jump(1); return; }
    if (mode !== "static") { refresh.current(); return; }
    if (!wmSeen) { wmRaw.jump(0); wm.jump(0); return; }
    const c = animate(wmRaw, 1, { duration: 1.3, ease: "linear" });
    return () => c.stop();
  }, [mode, wmSeen, reduce]);

  // keyboard: a link that is still behind the page gets the page lifted off it, so focus is never hidden or trapped
  const onFocus = (e) => {
    if (S.mode === "static" || !scEl || !inner.current) return;
    const el = e.target;
    requestAnimationFrame(() => {
      if (!root.current || document.activeElement !== el || S.mode === "static") return;
      const { V, top } = geo();
      const r = root.current.getBoundingClientRect(), T = r.top - top, H = r.height, M = Math.max(0, V - H);
      const c = offsetIn(el, inner.current), h = el.offsetHeight || 24, pad = 16;
      let Tf = Math.min(T, M);
      if (Tf + c + h > V - pad) Tf = V - pad - c - h;
      if (Tf + c < pad) Tf = Math.min(M, pad - c);
      const delta = T - Tf;
      if (Math.abs(delta) > 1) (scEl === window ? window : scEl).scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" });
    });
  };

  const toTop = () => {
    if (!scEl) return;
    scrollTo(0, true);
    const host = scEl === window ? document.body : scEl;
    const f = host.tabIndex >= 0 && host !== document.body ? host : host.querySelector(FOCUSABLE);
    f?.focus({ preventScroll: true });
  };

  const H = `h${clamp(Math.round(headingLevel) || 2, 1, 6)}`;
  const st = info?.[status] ? status : "operational";
  const year = new Date().getFullYear();
  const newsOn = showNewsletter && !!news;
  const statusOn = !!info?.[st];
  const prefsOn = localeList.length > 0 || showAppear;
  const brandOn = !!(B.name || logo || B.statement);
  const content = brandOn || newsOn || shownCols.length > 0 || statusOn || links.length > 0 || prefsOn || !!(LG.owner || LG.line) || folded.length > 0 || (showWordmark && !!word);
  const setRefs = (el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

  const footer = (
    <footer ref={setRefs} {...rest} className={"ts-ft" + (className ? " " + className : "")} data-layout={shownLayout} data-mode={mode} data-disabled={disabled || undefined}
      hidden={!content || undefined} style={{ "--ft-page": pageColor, ...style }} onFocus={onFocus}>
      {content ? <><div className="ts-ft-track">
        <div className="ts-ft-spacer" aria-hidden />
        <motion.div ref={inner} className="ts-ft-in" style={{ scale, opacity: fade }}>
          <div className="ts-ft-main" data-news={newsOn || undefined}>
            {brandOn ? (
              <div className="ts-ft-brand">
                {B.name || logo ? (
                  <a className="ts-ft-logo" {...hrefOf(B.href, disabled)} onClick={(e) => onLink({ label: B.name, href: B.href }, e)}>
                    {logo ? <span className="ts-ft-mark">{logo}</span> : null}{B.name}
                  </a>
                ) : null}
                {B.statement && <p className="ts-ft-statement">{B.statement}</p>}
              </div>
            ) : null}
            {newsOn && <Newsletter data={news} H={H} uid={uid} reduce={reduce} forced={forceState === "success"} demo={demo} disabled={disabled}
              email={email} defaultEmail={defaultEmail} onEmailChange={onEmailChange} error={subscribeError} busy={subscribing} subscribed={subscribed} onSubscribe={onSubscribe} />}
            {shownCols.length > 0 && (phone
              ? <Accordion cols={shownCols} H={H} uid={uid} reduce={reduce} onLink={onLink} dis={disabled} />
              : <Columns cols={shownCols} H={H} uid={uid} reduce={reduce} onLink={onLink} dis={disabled} />)}
          </div>
          {statusOn || links.length > 0 || prefsOn ? (
            <div className="ts-ft-util">
              {statusOn && <StatusPill status={st} info={info} reduce={reduce} compact={phone || (width > 0 && width < 1060)} onLink={onLink} dis={disabled} />}
              {links.length > 0 && (
                <ul className="ts-ft-social" aria-label={B.name ? `${B.name} elsewhere` : "Elsewhere"}>
                  {links.map((s) => (
                    <li key={s.id ?? s.label}>
                      <a className="ts-ft-soc" {...hrefOf(s.href, disabled)} aria-label={s.label} title={s.label} onClick={(e) => onLink(s, e)}><Glyph name={s.icon} size={18} /></a>
                    </li>
                  ))}
                </ul>
              )}
              {prefsOn ? (
                <div className="ts-ft-prefs">
                  {localeList.length > 0 && (
                    <label className="ts-ft-lang">
                      <Icon name="globe" size={15} />
                      <select aria-label="Language and region" value={locale} disabled={disabled} onChange={(e) => { if (localeProp === undefined) setLocale(e.target.value); onLocaleChange?.(e.target.value); }}>
                        {localeList.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                      <Icon name="chevronDown" size={14} />
                    </label>
                  )}
                  {showAppear && <Appearance value={appearance} reduce={reduce} dis={disabled} onChange={(v) => { if (appearanceProp === undefined) setAppearance(v); onAppearanceChange?.(v); }} />}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="ts-ft-legal">
            {LG.owner || LG.line ? <p className="ts-ft-copy">© {year} {LG.owner} {LG.line && <span>{LG.line}</span>}</p> : null}
            <AnimatePresence initial={false}>
              {folded.length > 0 && (
                <motion.nav key="legal" aria-label="Legal" initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}>
                  <ul className="ts-ft-legal-links">
                    {folded.map((l) => <li key={l.label}><FLink l={l} onLink={onLink} dis={disabled} /></li>)}
                  </ul>
                </motion.nav>
              )}
            </AnimatePresence>
            {LG.top && <button type="button" className="ts-ft-top" disabled={disabled} onClick={toTop}><Icon name="arrowRight" size={13} stroke={2} />{LG.top}</button>}
          </div>
          {showWordmark && word && <Wordmark text={word} p={wm} boxRef={wmBox} />}
        </motion.div>
      </div>
      {shownLayout === "curtain" && <div className="ts-ft-edge" aria-hidden />}</> : null}
    </footer>
  );

  if (!onPage) return <>{sheetTag}{footer}</>;
  return (
    <>{sheetTag}<div ref={wrap} style={{ width: "100%", display: "grid", justifyItems: "center" }}>
      <PageFrame ref={frame} width={1440} height={fh} url="northwind.app" label="Demo page: scroll to the end to reveal the footer">
        <DemoLanding top={0} />
        {footer}
      </PageFrame>
    </div></>
  );
});
