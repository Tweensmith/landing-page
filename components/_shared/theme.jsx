"use client";
// <Theme> sets the --ts-* variables for everything inside it and carries the stylesheet of every component that
// has been imported, so a server-rendered page arrives styled. useStyles is how a component gets its CSS (for
// :hover, :focus-visible and other things inline styles can't express) when no <Theme> above it has it; a
// component renders what useStyles returns, which is how the CSS still reaches a server that loads components late.
import { Fragment, createContext, isValidElement, useContext, useEffect, useInsertionEffect, useLayoutEffect, useRef, useSyncExternalStore, version as reactVersion } from "react";
import { THEMES, themeVars } from "./themes.js";

export { THEMES, themeVars };

// The locale every number and date is formatted in. One fixed value, so the server and the browser write the same
// text whatever their own locales are. `<Theme locale="de-DE">` sets it for everything inside; a Theme with no
// `locale` keeps the one above it; outside any Theme it is "en-US". A component that has its own `locale` prop
// calls useLocale(locale), so the prop wins; one without calls useLocale(). Every Intl / toLocale… call gets it.
const LocaleContext = createContext("en-US");
export function useLocale(own) {
  const inherited = useContext(LocaleContext);
  return own ?? inherited;
}

// Every component's CSS, by id, in the order the components were imported. A component file registers its CSS
// once, at the top level, beside the constant: registerStyles("ts-button", CSS). Registering is what lets <Theme>
// write the CSS into the server's HTML; an effect cannot, because effects do not run on the server.
const REGISTRY = new Map();
const listeners = new Set();
let version = 0;
let built = null;

export function registerStyles(id, css) {
  if (REGISTRY.get(id) === css) return;
  REGISTRY.set(id, css);
  version++;
  for (const tell of listeners) tell();   // a component loaded later (a lazy route, a hot update): Themes write it too
}

const subscribe = (tell) => { listeners.add(tell); return () => listeners.delete(tell); };
const getVersion = () => version;
function sheetNow() {
  if (!built || built.version !== version) built = { version, byId: new Map(REGISTRY), css: [...REGISTRY.values()].join("\n") };
  return built;
}

// Whether the reader asks for reduced motion. Components read useReducedMotion() below, not the motion library's
// hook: a server cannot know the reader's setting and renders full motion, so while React hydrates that HTML the
// answer here is "no", and the reader's real answer arrives in the render right after. In a page rendered in the
// browser only, the real answer is there from the first render. It also follows the setting when it changes.
const RM_QUERY = "(prefers-reduced-motion: reduce)";
const canAsk = () => typeof matchMedia === "function";
const asksForLess = () => canAsk() && matchMedia(RM_QUERY).matches;
const no = () => false;
const yes = () => true;
const never = () => () => {};
function onAnswerChange(tell) {
  if (!canAsk()) return () => {};
  const mq = matchMedia(RM_QUERY);
  if (!mq.addEventListener) { mq.addListener(tell); return () => mq.removeListener(tell); }
  mq.addEventListener("change", tell);
  return () => mq.removeEventListener("change", tell);
}
// The answer of the Theme above; null outside any Theme.
const CalmContext = createContext(null);
// What the reader's setting is, and "no" while React hydrates server HTML.
const useAnswer = () => useSyncExternalStore(onAnswerChange, asksForLess, no);
// True only in the render that hydrates server HTML.
const useHydrating = () => useSyncExternalStore(never, no, yes);
export function useReducedMotion() {
  const themed = useContext(CalmContext);
  const alone = themed === null;
  // With no Theme above, the component finds out for itself. The stores below answer correctly only in the first
  // run of a render (a component that sets state while rendering is run again, and the second run would get the
  // reader's real answer in the middle of hydration), so the first run's "hydrating" is held until the commit.
  const hydrating = useSyncExternalStore(never, no, alone ? yes : no);
  const held = useRef(hydrating);
  useEffect(() => { held.current = false; }, []);
  const mine = useSyncExternalStore(alone ? onAnswerChange : never, alone ? asksForLess : no, no);
  return alone ? !held.current && mine : themed;
}

// Where focus is inside `root`, as something that can be found again after the content is rebuilt: its id, else
// its place among the elements of its kind (the third button stays the third button).
function focusIn(root) {
  const el = typeof document === "undefined" ? null : document.activeElement;
  if (!el || !root || el === root || !root.contains(el)) return null;
  return { id: el.id, tag: el.tagName, nth: [...root.getElementsByTagName(el.tagName)].indexOf(el) };
}
function refocus(root, was) {
  const el = (was.id && document.getElementById(was.id)) || root.getElementsByTagName(was.tag)[was.nth];
  if (el) el.focus({ preventScroll: true });
}

// What the nearest outermost <Theme> has written: { current: Map(id -> css) }. The object is the same for the
// Theme's whole life, so a component reads it when its effect runs and is not re-rendered when it changes.
const SheetContext = createContext(null);

// `buttonShape` sets one shape for every Button inside: "pill" rounds them fully, "rounded" gives them the preset's
// corner size, and leaving it out keeps whatever a Theme further out chose (the preset's corner size when none did).
const BUTTON_RADIUS = { pill: "999px", rounded: "var(--ts-radius-md)" };
// A Theme sets the variables on its own element and paints nothing, so what is behind it shows through: a section
// keeps its page's background. `page` says this Theme is the whole page: it paints the theme's background and is at
// least as tall as the screen. Give `body` no margin, or render the Theme as the body (`as="body"`).
const PAGE = { background: "var(--ts-bg)", minHeight: "100dvh" };
export function Theme({ preset = "tweensmith", mode = "dark", as: Tag = "div", locale, buttonShape, page = false, style, children, ...rest }) {
  const loc = useLocale(locale);
  const above = useContext(SheetContext);
  const mine = useRef({ current: null }).current;
  const tag = useRef(null);
  useSyncExternalStore(subscribe, getVersion, getVersion);
  // A reader who asks for reduced motion and gets a server-rendered page: the server drew the full-motion page, so
  // the reduced one cannot be hydrated onto it. Hydrate what the server sent, then build the content once more,
  // as a page rendered in the browser would have been from the start. Nothing moves in between: the entrance
  // animations have not painted a frame yet. Only the outermost Theme does it, once, and it puts focus back.
  const hydrating = useHydrating();
  const reduce = useAnswer();
  const born = useRef({ hydrated: hydrating, calm: null, focus: null }).current;
  if (!above && born.hydrated && !hydrating && born.calm === null) {
    born.calm = reduce;
    if (reduce) born.focus = focusIn(tag.current?.parentElement);
  }
  const life = born.calm ? "calm" : "live";
  useIsoLayoutEffect(() => {
    if (born.focus && tag.current) refocus(tag.current.parentElement, born.focus);
    born.focus = null;
  }, [life]);
  // Only the outermost Theme writes the sheet; one inside it is already covered.
  const sheet = above ? null : sheetNow();
  if (sheet) mine.current = sheet.byId;
  // Hydration keeps the server's text even when the browser has registered more than the server had.
  useIsoLayoutEffect(() => {
    if (sheet && tag.current && tag.current.textContent !== sheet.css) tag.current.textContent = sheet.css;
  }, [sheet]);
  return (
    <LocaleContext.Provider value={loc}>
      <SheetContext.Provider value={above ?? mine}>
      <CalmContext.Provider value={reduce}>
        <Tag data-ts-mode={mode} style={{ ...themeVars(preset, mode), ...(BUTTON_RADIUS[buttonShape] ? { "--ts-radius-button": BUTTON_RADIUS[buttonShape] } : null), color: "var(--ts-ink)", fontFamily: "var(--ts-font)", ...(page ? PAGE : null), ...style }} {...rest}>
          {/* `hidden` keeps sibling selectors that skip hidden elements (spacing utilities) from counting it */}
          {sheet && <style ref={tag} hidden data-ts-sheet={sheet.byId.size} dangerouslySetInnerHTML={{ __html: sheet.css }} suppressHydrationWarning />}
          <Fragment key={life}>{children}</Fragment>
        </Tag>
      </CalmContext.Provider>
      </SheetContext.Provider>
    </LocaleContext.Provider>
  );
}

// Shared utilities every component may rely on (screen-reader-only text).
const BASE_CSS = ".ts-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}";
registerStyles("ts-base", BASE_CSS);

// A layout effect in the browser and a plain effect on the server, where a layout effect cannot run and React 18
// warns about it on every render. Components measure and position with this, never with useLayoutEffect directly.
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Two places where React 18 and React 19 want different things; the kit runs on both.
const REACT_19 = parseInt(reactVersion, 10) >= 19;
/** `inert` for a JSX element, spread as {...inertAttr(on)}. React 19 knows the attribute as a boolean and reads an
 *  empty string as false; React 18 does not know it and needs the string. */
export const inertAttr = (on) => (on ? { inert: REACT_19 ? true : "" } : null);
/** The ref a caller put on an element that a component clones (a trigger, a tooltip's child). React 19 keeps it in
 *  props and warns when element.ref is read; React 18 keeps it on the element and warns when props.ref is read. */
export const refOf = (el) => (isValidElement(el) ? (REACT_19 ? el.props.ref : el.ref) ?? null : null);

// Puts one stylesheet in <head>, unless the Theme above has written the same text already.
function inject(id, css, sheet) {
  let el = document.head.querySelector(`style[data-tweensmith="${id}"]`);
  if (!el) {
    if (sheet?.current?.get(id) === css) return;
    if (document.querySelector(`style[data-href~="${id}"]`)) return;   // the server sent it with the component (serverTag below)
    el = document.createElement("style");
    el.dataset.tweensmith = id;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

// The CSS as an element, for a server whose <Theme> wrote its sheet before this component was loaded. That is the
// Next.js App Router: it loads a client component when it first renders one, which is after the <Theme> above it
// has gone out. React 19 lifts the element into <head>, sends each id once, and holds content that streams in late
// until its styles are there. React 18 cannot do that, so there the Theme's sheet is all a server sends.
const ON_SERVER = typeof document === "undefined";
const serverTag = (id, css, sheet) => (sheet?.current?.get(id) === css ? null : <style key={id} href={id} precedence="ts">{css}</style>);

// A component calls this with the id and CSS it registered, and renders what comes back beside its own markup:
//   const sheetTag = useStyles("ts-button", CSS);   ...   return <>{sheetTag}<button className="ts-btn" /></>;
// In the browser that is nothing: inside a <Theme> that has the CSS the call does nothing more, and with no Theme
// above, or for a component that was loaded after the Theme rendered, it adds the CSS to <head>.
export function useStyles(id, css) {
  const sheet = useContext(SheetContext);
  useInsertionEffect(() => {
    if (typeof document === "undefined") return;
    inject("ts-base", BASE_CSS, sheet);
    inject(id, css, sheet);
  }, [id, css, sheet]);
  if (!ON_SERVER || !REACT_19) return null;
  const base = serverTag("ts-base", BASE_CSS, sheet), own = serverTag(id, css, sheet);
  return base || own ? [base, own] : null;
}
