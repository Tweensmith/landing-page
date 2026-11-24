import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "virtual:catalogue";
import { Theme } from "../../../../components/_shared/theme.jsx";
import { Icon } from "../../../../components/_shared/icons.jsx";
import { CopyButton } from "../../../../components/copy-button/index.jsx";
import { Title } from "../../lib/Title.jsx";
import { useOnScreen } from "../../lib/Lazy.jsx";
import { freeWeb } from "../../lib/counts.js";
import { links } from "../../links.js";
import { sections } from "../../copy.jsx";
import { NotYet, commandFor, isLive } from "./dest.jsx";

/*
 * Get it. Getting a component is one command, so the section is that command, set large. The name at
 * the end of it changes: it rolls through the free components while the section is on screen, and pressing it
 * moves to the next one and stops the rolling. The key beside it (the kit's Copy Button) copies the command as it
 * reads at that moment. The other places (the repository, the docs, the two parts of Brief) are words under it.
 *
 * Until the install command is live (src/links.js) the line says so in its place and the key is off.
 * Under reduced motion the name does not roll by itself and changes at once when pressed.
 */
const OTHERS = ["repo", "docs", "mcp", "llms"];
// every free web component, A to Z; the name starts on Button, the first one most people add
const ITEMS = freeWeb.map((m) => ({ slug: m.slug, name: m.name })).sort((a, b) => a.name.localeCompare(b.name));
const FIRST = "button";
const SETTLE = motionTokens.springs.settle;

export function Line({ dest = links }) {
  const reduce = !!useReducedMotion();
  const [i, setI] = useState(() => Math.max(0, ITEMS.findIndex((m) => m.slug === FIRST)));
  const [auto, setAuto] = useState(true);
  const [over, setOver] = useState(false);
  const root = useRef(null);
  const seen = useOnScreen(root, "-10% 0px");
  const live = isLive(dest.install) && !!dest.install.command;
  const item = ITEMS[i];

  useEffect(() => {
    if (reduce || !auto || over || !seen || !live) return;
    const t = setInterval(() => setI((n) => (n + 1) % ITEMS.length), 2200);
    return () => clearInterval(t);
  }, [reduce, auto, over, seen, live]);

  const [pre, post] = live ? dest.install.command.split("{slug}") : [];
  const slot = live && post !== undefined;
  const next = () => { setAuto(false); setI((n) => (n + 1) % ITEMS.length); };

  return (
    <>
      <header className="gt__head">
        <Title id="get-h" parts={sections.get.title} />
      </header>
      <div ref={root} onPointerEnter={() => setOver(true)} onPointerLeave={() => setOver(false)} onFocus={() => setOver(true)} onBlur={() => setOver(false)}>
        <Theme preset="tweensmith" mode="dark" buttonShape="pill" className="gline">
          <p className="mono gline__cmd">
            {live ? (
              <>
                <span className="gline__pre">{pre}</span>
                {slot && (
                  <button type="button" className="gline__slot" onClick={next} aria-label={`${item.slug}. Press for the next component.`}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span key={item.slug} className="gline__name"
                        initial={reduce ? false : { y: "60%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "-60%", opacity: 0, transition: { duration: 0.16 } }}
                        transition={{ type: "spring", ...SETTLE }}>{item.slug}</motion.span>
                    </AnimatePresence>
                  </button>
                )}
                {post ? <span className="gline__pre">{post}</span> : null}
              </>
            ) : <NotYet />}
          </p>
          <CopyButton className="gline__copy" value={live ? commandFor(dest.install, item.slug) : ""} showValue={false} disabled={!live} onCopy={() => setAuto(false)} />
        </Theme>
      </div>
      <ul className="gline__others" role="list">
        {OTHERS.map((k) => {
          const d = dest[k];
          return (
            <li key={k}>
              {isLive(d)
                ? <a className="gline__other" href={d.href} title={d.what}>{d.short}<Icon name="arrowRight" size={22} /></a>
                : <span className="gline__other" data-off>{d.short}<NotYet /></span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
