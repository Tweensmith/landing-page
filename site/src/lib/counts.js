import { web, native } from "virtual:catalogue";

// The free components that make up the working screen in the live section (sections/live/Screen.jsx imports
// exactly these). Every one must be free: the page presents the free release. The page states this count.
export const SPECIMEN_SLUGS = [
  "breadcrumbs", "avatar-group", "badge", "segmented-control", "stepper", "select",
  "switch", "text-field", "number-ticker", "button", "toast-stack",
];

const freeWeb = web.filter((m) => m.free);
const bySlug = Object.fromEntries(web.map((m) => [m.slug, m]));
const notFree = SPECIMEN_SLUGS.filter((s) => !bySlug[s]?.free);
if (notFree.length) throw new Error(`Specimens must be free components; not free or missing: ${notFree.join(", ")}`);

/** Every number the page states, computed from the kit's meta.json files at build time. */
export const counts = {
  web: web.length,
  native: native.length,
  total: web.length + native.length,
  freeWeb: freeWeb.length,
  freeNative: native.filter((m) => m.free).length,
  freeWebPresets: freeWeb.filter((m) => m.presets > 0).length,
  freeWebStates: freeWeb.filter((m) => m.states > 0).length,
  freeWebRanged: freeWeb.filter((m) => m.ranges > 0).length,
  freeWebPresetTotal: freeWeb.reduce((n, m) => n + m.presets, 0),
  specimens: SPECIMEN_SLUGS.length,
};
export { freeWeb };
