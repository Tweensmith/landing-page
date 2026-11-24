import { lazy, Suspense } from "react";
import { freeWeb } from "../../lib/counts.js";
import { Theme } from "../../../../components/_shared/theme.jsx";
import { Fit } from "../../lib/Fit.jsx";

// One loader for each free web component, written out by name. It is a list and not a pattern on purpose: a pattern
// over ../components would also bundle the components that are not free into this public page. The check below
// stops the build if the list and the kit disagree (a free component missing here, or one here that is not free).
const LOAD = {
  "accordion": () => import("../../../../components/accordion/index.jsx"),
  "alert-banner": () => import("../../../../components/alert-banner/index.jsx"),
  "avatar-group": () => import("../../../../components/avatar-group/index.jsx"),
  "avatar": () => import("../../../../components/avatar/index.jsx"),
  "badge-counter": () => import("../../../../components/badge-counter/index.jsx"),
  "badge": () => import("../../../../components/badge/index.jsx"),
  "breadcrumbs": () => import("../../../../components/breadcrumbs/index.jsx"),
  "button": () => import("../../../../components/button/index.jsx"),
  "card": () => import("../../../../components/card/index.jsx"),
  "checkbox": () => import("../../../../components/checkbox/index.jsx"),
  "choice-cards": () => import("../../../../components/choice-cards/index.jsx"),
  "combobox": () => import("../../../../components/combobox/index.jsx"),
  "copy-button": () => import("../../../../components/copy-button/index.jsx"),
  "dropdown-menu": () => import("../../../../components/dropdown-menu/index.jsx"),
  "empty-state": () => import("../../../../components/empty-state/index.jsx"),
  "field": () => import("../../../../components/field/index.jsx"),
  "icon-toolbar": () => import("../../../../components/icon-toolbar/index.jsx"),
  "liquid-tabs": () => import("../../../../components/liquid-tabs/index.jsx"),
  "loader": () => import("../../../../components/loader/index.jsx"),
  "modal": () => import("../../../../components/modal/index.jsx"),
  "number-ticker": () => import("../../../../components/number-ticker/index.jsx"),
  "otp-input": () => import("../../../../components/otp-input/index.jsx"),
  "pagination": () => import("../../../../components/pagination/index.jsx"),
  "password-field": () => import("../../../../components/password-field/index.jsx"),
  "popover": () => import("../../../../components/popover/index.jsx"),
  "progress": () => import("../../../../components/progress/index.jsx"),
  "radio-group": () => import("../../../../components/radio-group/index.jsx"),
  "range-slider": () => import("../../../../components/range-slider/index.jsx"),
  "rating": () => import("../../../../components/rating/index.jsx"),
  "segmented-control": () => import("../../../../components/segmented-control/index.jsx"),
  "select": () => import("../../../../components/select/index.jsx"),
  "separator": () => import("../../../../components/separator/index.jsx"),
  "skeleton": () => import("../../../../components/skeleton/index.jsx"),
  "stepper": () => import("../../../../components/stepper/index.jsx"),
  "switch": () => import("../../../../components/switch/index.jsx"),
  "tabs": () => import("../../../../components/tabs/index.jsx"),
  "tag-input": () => import("../../../../components/tag-input/index.jsx"),
  "text-field": () => import("../../../../components/text-field/index.jsx"),
  "textarea": () => import("../../../../components/textarea/index.jsx"),
  "toast-stack": () => import("../../../../components/toast-stack/index.jsx"),
  "tooltip": () => import("../../../../components/tooltip/index.jsx"),
};
const free = new Set(freeWeb.map((m) => m.slug));
const missing = freeWeb.filter((m) => !LOAD[m.slug]).map((m) => m.slug), extra = Object.keys(LOAD).filter((s) => !free.has(s));
if (missing.length || extra.length) throw new Error(`The free set's loaders are out of step with the kit. Missing: ${missing.join(", ") || "none"}. Not free: ${extra.join(", ") || "none"}. Edit src/sections/free/shared.jsx.`);

/** Every free web component, A to Z, each with a lazy loader (its own chunk, fetched when first shown). */
export const FREE = [...freeWeb].sort((a, b) => a.name.localeCompare(b.name)).map((m) => ({
  ...m,
  C: lazy(() => LOAD[m.slug]().then((mod) => ({ default: mod[m.export] }))),
}));
export const BY = Object.fromEntries(FREE.map((m) => [m.slug, m]));

// The gallery's sample content, with one change: Breadcrumbs' sample is 640px wide, which a phone would shrink to half.
const TWEAK = { breadcrumbs: { width: 420 } };

/** One free component, live, in the kit's default theme, with the sample content its gallery card uses. */
export function Stage({ item, mode, className = "" }) {
  return (
    <Theme preset="tweensmith" mode={mode} buttonShape="pill" className={"fstage" + (className ? " " + className : "")}>
      <Fit key={item.slug}>
        <Suspense fallback={<span className="cell__wait mono" aria-hidden>loading…</span>}>
          <item.C {...item.demo} {...TWEAK[item.slug]} />
        </Suspense>
      </Fit>
    </Theme>
  );
}
