import { lazy, useEffect, useMemo } from "react";
import * as kitTheme from "../../components/_shared/theme.jsx";
import { MenuHeader, MenuFloat } from "./sections/nav/Menu.jsx";
import { freeByFamily } from "./menu.jsx";
import { SITE_PRESET, siteTokens, useSiteMode } from "./lib/theme.js";
import { Hero } from "./sections/Hero.jsx";
import { Specimens } from "./sections/Specimens.jsx";
import { Catalogue } from "./sections/Catalogue.jsx";
import { Closing } from "./sections/Closing.jsx";
import { Questions } from "./sections/Questions.jsx";
import { Lazy } from "./lib/Lazy.jsx";
import { GetIt } from "./sections/GetIt.jsx";
import { Pro } from "./sections/Pro.jsx";
import { Cursor } from "./lib/Cursor.jsx";

// Below the fold, so out of the first chunk.
const AgentData = lazy(() => import("./sections/AgentData.jsx").then((m) => ({ default: m.AgentData })));

// The page's navigation is the library's Mega Menu: the header at the top, and the same menu floating at the top
// once the header has scrolled away (owner, 2026-11-23). sections/nav/Menu.jsx; its content is src/menu.jsx.

// Parked, not mounted, kept in the repository for the paid launch (milestone 3) and for when the page may show
// more than the free set: sections/Pricing.jsx (the tiers), sections/Scene.jsx (a whole screen, built mostly from
// Pro components) and sections/Showpiece.jsx (Helix Carousel, a Pro component).

const { Theme } = kitTheme;
// Nothing on this page is raised (owner, 2026-11-22). The `porcelain` preset still switches the kit's raised
// material on for Button and Switch, so the page switches it back off for everything inside it. Written to keep
// working once the kit no longer has the material at all.
const Material = kitTheme.MaterialContext;
const FLAT = Object.freeze({ raised: false });
const Flat = ({ children }) => (Material ? <Material.Provider value={FLAT}>{children}</Material.Provider> : children);

export default function App() {
  const { mode, pref, choose } = useSiteMode();
  const tokens = useMemo(() => siteTokens(mode), [mode]);
  const showProv = useMemo(() => new URLSearchParams(location.search).has("prov"), []);
  useEffect(() => { document.documentElement.toggleAttribute("data-show-prov", showProv); }, [showProv]);

  return (
    <Theme preset={SITE_PRESET} mode={mode} buttonShape="pill" className="page" style={tokens}>
      <Flat>
      <a className="skip" href="#main">Skip to content</a>
      <MenuHeader />
      <main id="main" tabIndex={-1}>
        <Hero mode={mode} />
        <Specimens mode={mode} />
        <Lazy id="agent" minHeight={900} margin="900px 0px"><AgentData mode={mode} /></Lazy>
        <Catalogue mode={mode} order={freeByFamily} />
        <GetIt />
        <Pro />
        <Questions />
        <Closing mode={mode} pref={pref} onAppearance={choose} />
      </main>
      <MenuFloat />
      <Cursor />
      </Flat>
    </Theme>
  );
}
