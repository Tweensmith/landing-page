import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { motionTokens } from "virtual:catalogue";
import { MegaMenu } from "../../../../components/mega-menu/index.jsx";
import { TweensmithLogo } from "../../../../brand/motion/react/TweensmithLogo.jsx";
import { GitHubKey } from "../../lib/GitHub.jsx";
import { menuItems, menuPanels } from "../../menu.jsx";
import "./nav.css";

/*
 * The site's menu is the library's Mega Menu, as the library designed it (owner, 2026-11-23: "You've got to use
 * the actual Mega Menu component in our library and the design is not fully replicated on the landing page"). So
 * the bar keeps the kit's ground, rule, height and type, the panels keep the kit's rows, featured card, lists and
 * foot line, and the page adds nothing to them. What the page still decides is in nav.css and is only where the
 * bar sits.
 *
 * It is in two places, as the owner asked ("the floating navbar should disappear and reappear as actual header,
 * then become floating navbar again when you scroll away from the hero section"):
 * - MenuHeader: at the top of the page, the kit's bar from edge to edge.
 * - MenuFloat: once the header has scrolled away, the same menu as a floating piece at the top of the screen
 *   (owner's choice, 2026-11-23), where the kit's menu is used exactly as made: its panels open downward.
 * The floating piece carries no light and dark switch (owner, 2026-11-23: "Remove the mode switch from the
 * floating bar"); the switch is in the footer only.
 * The content of both is src/menu.jsx. The Mega Menu is a Pro component, as the Footer and the closing band are.
 *
 * On a narrow screen the button, the full-screen menu under the header, the card under the floating bar, the
 * blur behind that card, how each opens and the page held still behind them are the kit's own (designed on this
 * page first, then taken into the kit on the owner's "Yes, send it" and "Yes, build it", 2026-11-23). The
 * floating bar itself is the kit's `layout="floating"`; this file only fixes it to the screen and shows or hides it.
 *
 * Not chosen, parked in sections/parked/: nav-foot.css (the same menu floating at the foot of the screen, with
 * its panels turned to open upward) and NavBefore.jsx (the top bar and the dock of section links that were here
 * before the menu).
 */
export function MenuHeader() {
  const [open, setOpen] = useState(null);
  const panels = useMemo(() => menuPanels(() => setOpen(null)), []);
  return (
    <div className="top top--menu" id="top">
      {/* below 860px of its own width the logo, five items and GitHub no longer fit on one line: the kit's menu button takes over */}
      <MegaMenu className="sitemenu" sticky={false} compactBelow={860} ariaLabel="Main" items={menuItems} panels={panels}
        open={open} onOpenChange={setOpen}
        brand={<a className="top__logo" href="#top" aria-label="Tweensmith, top of page"><TweensmithLogo animation="settle" size={26} name label="" /></a>}
        actions={<GitHubKey small />} />
    </div>
  );
}

export function MenuFloat() {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(null), [sheet, setSheet] = useState(false);
  const wrap = useRef(null);
  const panels = useMemo(() => menuPanels(() => setOpen(null)), []);

  useEffect(() => {
    const top = document.getElementById("top");
    if (!top || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting));
    io.observe(top);
    return () => io.disconnect();
  }, []);

  // Out of sight: off to the pointer and the keyboard, and nothing left open. Set on the node in an effect: Motion 14
  // calls a function passed as `ref` only when the element first appears, so a value that changes is never applied.
  useLayoutEffect(() => {
    wrap.current?.toggleAttribute("inert", !shown);
    if (!shown) { setOpen(null); setSheet(false); }
  }, [shown]);

  const { stiffness, damping } = motionTokens.springs.settle;
  return (
    <motion.div className="navfloat" ref={wrap} initial={false}
      animate={shown ? { y: 0, opacity: 1 } : { y: -96, opacity: 0 }} transition={{ type: "spring", stiffness, damping }}>
      <MegaMenu className="sitemenu" role="none" layout="floating" sticky={false} ariaLabel="Sections" items={menuItems} panels={panels}
        open={open} onOpenChange={setOpen} menuOpen={sheet} onMenuOpenChange={setSheet}
        brand={<a className="navfloat__home" href="#top" aria-label="Back to the top"><TweensmithLogo size={20} playOn="hover" animation="breathe" label="" /></a>} />
    </motion.div>
  );
}
