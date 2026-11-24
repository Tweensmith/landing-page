import { categories } from "virtual:catalogue";
import { freeWeb } from "./lib/counts.js";
import { links, hrefFor } from "./links.js";
import { showFree } from "./lib/showFree.js";
import { Icon } from "../../components/_shared/icons.jsx";
import { Art } from "../../components/_shared/art.jsx";

/*
 * The site's menu, in one place: the header's mega menu, the floating navbar's and the footer's columns all read
 * this (owner, 2026-11-23: a mega menu with "Product" first and the components under their categories, and more
 * footer columns). The menu is settled (owner, 2026-11-23); its wording is mine and not approved.
 *
 * Nothing it links to outside the page is live yet (links.js). Until a destination is live its link goes to the
 * "Get it" section, as every other link on the page does; no address is guessed. The files in the repository are
 * addressed from the repository's own address once that exists (GitHub serves /blob/HEAD/<file> for any
 * repository, whatever its main branch is called).
 *
 * Shown: only what exists in the free release. Not shown, and where each goes when it exists: Expo (Product and
 * Docs), Evidence (the test results are not to be put on the page), Privacy and Terms (not written), and Pro's
 * own panel (Pricing, Looks, Bands, Panels, Instruments), which replaces the plain Pro link at the paid launch.
 * Recipes leads to the one recipe the docs record as free (docs/docs.config.json).
 */
// A page of the docs site. The site is built (tweensmith/docs) but has no address yet; these paths are its own
// (docs/generated/site.json), added to its address once links.js has one.
const inDocs = (path) => (links.docs.live && links.docs.href ? links.docs.href.replace(/\/$/, "") + path : "#get");
const inRepo = (file) => (links.repo.live && links.repo.href ? `${links.repo.href.replace(/\/$/, "")}/blob/HEAD/${file}` : "#get");

// Product: six categories and no component names (owner, 2026-11-23: "A lot of abstraction is needed for
// Product to reduce the numbers of contents in it", then "Our Product need better structuring into categories
// and subcategories"; the structure the owner took forward is research/product-structure/STRUCTURE.md, passed
// on by the planning session). One more entry, Screens, stands for what is built from components and is the
// panel's featured card; at the paid launch the other kinds (Bands, Panels, Looks, Instruments) join it, and a
// Web / Expo switch arrives with the native core. Subcategories belong to the free set and the docs, not here.
//
// The six are the kit's own categories (categories.json, and `category` in each meta.json); the names shown are
// the kit's. The other categories of the Components kind (AI, Showpieces) have nothing free in them, so they have
// no row yet. The icons and the one-line descriptions are the page's: the kit's own descriptions cover the whole
// library, Pro included, and this menu shows the free release. They are mine and the planning session's, and
// not approved.
const ROWS = [
  { id: "actions", icon: "zap", description: "Buttons, a copy button and an icon toolbar." },
  { id: "forms", icon: "edit", description: "Text entry, choices and pickers, with their error states." },
  { id: "feedback", icon: "bell", description: "Status, loading and messages." },
  { id: "overlays", icon: "window", description: "Dialogs, menus and popovers." },
  { id: "navigation", icon: "navigation", description: "Tabs, breadcrumbs and pagination." },
  { id: "display", icon: "layers", description: "Cards, avatars, accordion and number ticker." },
];
export const FAMILIES = ROWS.map((f) => ({
  ...f,
  label: categories.find((c) => c.id === f.id)?.name ?? f.id,
  items: freeWeb.filter((m) => m.category === f.id).sort((a, b) => a.name.localeCompare(b.name)),
}));
{
  // every free component is in one of the six, and each of the six is one of the kit's categories with something free in it
  const known = new Set(categories.map((c) => c.id));
  const stray = ROWS.filter((f) => !known.has(f.id)).map((f) => f.id);
  const placed = FAMILIES.reduce((n, f) => n + f.items.length, 0);
  const empty = FAMILIES.filter((f) => !f.items.length).map((f) => f.id);
  if (stray.length || empty.length || placed !== freeWeb.length) throw new Error(`The menu's categories are out of step with the kit. Not in the kit: ${stray.join(", ") || "none"}. Nothing free in: ${empty.join(", ") || "none"}. Free components placed: ${placed} of ${freeWeb.length}. Edit ROWS in src/menu.jsx.`);
}
/** The free components category by category, A to Z inside each: the order the free set's row uses with this menu. */
export const freeByFamily = FAMILIES.flatMap((f) => f.items.map((m) => m.slug));

const AGENTS = [
  { icon: "sparkle", label: "Brief", description: "The agent kit: what is in it and how to prompt with it.", href: inDocs("/agents") },
  { icon: "server", label: "MCP server", description: "A local server your agent asks for components, ranges and recipes.", href: inDocs("/agents/mcp") },
  { icon: "doc", label: "llms.txt", description: "The whole kit as plain text, with no server.", href: hrefFor("llms") },
];
// Docs, on the docs site's own map (its groups, page titles and paths): Start, Foundations, and what is looked up.
const DOCS = [
  { heading: "Start", links: [
    { label: "Install", href: inDocs("/start/install") },
    { label: "Theme", href: inDocs("/start/theme") },
    { label: "First component", href: inDocs("/start/first-component") },
  ] },
  { heading: "Foundations", links: [
    { label: "Type, space and radius", href: inDocs("/foundations/tokens") },
    { label: "Colour and themes", href: inDocs("/foundations/colour") },
    { label: "Motion", href: inDocs("/foundations/motion") },
    { label: "Accessibility", href: inDocs("/foundations/accessibility") },
  ] },
  { heading: "Reference", links: [
    { label: "Components", href: inDocs("/") },
    { label: "Recipes", href: inDocs("/recipes/sign-in") },
    { label: "Changelog", href: inDocs("/changelog") },
  ] },
];
const REPO = [
  { label: "Contributing", href: inRepo("CONTRIBUTING.md") },
  { label: "Roadmap", href: inRepo("ROADMAP.md") },
  { label: "Licence (MIT)", href: inRepo("LICENSE") },
  { label: "Security", href: inRepo("SECURITY.md") },
  { label: "Code of conduct", href: inRepo("CODE_OF_CONDUCT.md") },
];

export const menuItems = [
  { id: "product", label: "Product" },
  { id: "agents", label: "Agents" },
  { id: "docs", label: "Docs" },
  { id: "open", label: "Open source" },
  { id: "pro", label: "Pro", href: "#pro" },
];

/**
 * The panels, filled the way the library's own Mega Menu is: rows with an icon and one line, at most one featured
 * card with art behind it, plain lists under a heading, and a line at the foot. The classes on the card and the
 * art are the kit's (components/mega-menu, components/_shared/art.jsx); nothing here restyles them.
 * `close` shuts the open panel: the card and the foot line are the page's own links and need it.
 */
export function menuPanels(close) {
  const card = (href, art, title, text) => (
    <a href={href} onClick={close} className="ts-mm__feat">
      <Art art={art} lite style={{ position: "absolute", inset: 0 }} />
      <div><b>{title}</b><small>{text}</small></div>
    </a>
  );
  const foot = (href, icon, text) => <a className="sitemenu__foot" href={href} onClick={close}><Icon name={icon} size={14} />{text}<Icon name="arrowRight" size={13} /></a>;
  return {
    product: {
      width: 600,
      // a category's row opens the free set on that category: its first component under the mark, the rest after it
      columns: [{ links: FAMILIES.map((f) => ({ icon: f.icon, label: f.label, description: f.description, href: "#catalogue", onClick: () => showFree(f.items[0].slug) })) }],
      featured: card("#specimens", "chrome", "Screens", "A whole screen, built from the free set."),
    },
    agents: {
      width: 600,
      columns: [{ links: AGENTS }],
      featured: card("#agent", "glacier", "What your agent receives", "Presets, states and tested ranges, as data."),
    },
    docs: { width: 560, columns: DOCS, footer: foot("#faq", "help", "Questions, answered on this page") },
    open: {
      width: 440,
      columns: [
        { heading: "The release", links: [{ label: links.repo.label, href: hrefFor("repo") }, { label: "Where to get it", href: "#get" }] },
        { heading: "In the repository", links: REPO },
      ],
    },
  };
}

/** The footer's columns, from the same lists. */
export const footerColumns = [
  { id: "product", title: "Product", priority: 1, links: [
    { label: "Live components", href: "#specimens" },
    { label: "The free set", href: "#catalogue" },
    { label: "Pro", href: "#pro" },
  ] },
  { id: "agents", title: "Agents", priority: 2, links: [
    ...AGENTS.map(({ label, href }) => ({ label, href })),
    { label: "What your agent receives", href: "#agent" },
  ] },
  { id: "docs", title: "Docs", priority: 3, links: [
    ...DOCS[0].links, { label: "Motion", href: inDocs("/foundations/motion") }, { label: "Accessibility", href: inDocs("/foundations/accessibility") },
    { label: "Changelog", href: inDocs("/changelog") },
  ] },
  { id: "open", title: "Open source", priority: 4, links: [{ label: links.repo.label, href: hrefFor("repo") }, ...REPO] },
];
